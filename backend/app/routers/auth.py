from typing import Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, Category, Wallet, Transaction, Notification
from backend.app.schemas import (
    UserCreate, UserLogin, UserOut, UserProfileUpdate,
    PasswordChange, TokenResponse
)
from backend.app.utils.security import (
    verify_password, get_password_hash, create_access_token, decode_access_token
)
from backend.app.services.seed_service import DEFAULT_CATEGORIES

router = APIRouter(prefix="/auth", tags=["Xác thực & Người dùng"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to retrieve authenticated user from JWT Bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    # Enforce Account Lockout
    if not user.is_active or user.status == "LOCKED" or getattr(user, 'is_banned', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản này đã bị khóa do vi phạm chính sách hoặc theo yêu cầu quản trị viên. Vui lòng liên hệ hỗ trợ."
        )
    return user

def get_current_admin_or_moderator_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to enforce ADMIN or MODERATOR role."""
    role = (current_user.role or "").upper()
    if role not in ["ADMIN", "MODERATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu quyền Quản trị viên (Admin hoặc Moderator) để thực hiện thao tác này"
        )
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to enforce Root ADMIN role exclusively."""
    role = (current_user.role or "").upper()
    if role != "ADMIN":
        if role == "MODERATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quyền hạn bị từ chối: Chỉ Root Admin mới có quyền truy cập vào cấu hình hệ thống / AI / Token / Phân quyền"
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu quyền Root Admin (Quản trị viên tối cao) để thực hiện thao tác này"
        )
    return current_user

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản người dùng mới và tự động khởi tạo dữ liệu mẫu."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống"
        )
    
    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có tối thiểu 6 ký tự"
        )

    new_user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role="USER",
        status="ACTIVE",
        plan="FREE",
        plan_tier="Free",
        plan_activated_at=None,
        plan_expires_at=None,
        is_plan_active=True,
        currency=user_in.currency or "VND"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize standard categories for new user
    for cat_data in DEFAULT_CATEGORIES:
        cat = Category(
            user_id=new_user.id,
            name=cat_data["name"],
            type=cat_data["type"],
            group=cat_data["group"],
            icon=cat_data["icon"],
            color=cat_data["color"],
            is_default=True
        )
        db.add(cat)

    # Initialize default 4 personal accounting (virtual) wallets + 1 real payment wallet with balance = 0 VNĐ
    default_wallets = [
        {"name": "Tiền mặt", "wallet_type": "CASH", "wallet_scope": "virtual", "balance": 0.0, "icon": "money-bill-wave", "color": "#10B981"},
        {"name": "MB Bank", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 0.0, "icon": "building-columns", "color": "#3B82F6"},
        {"name": "Ví MoMo", "wallet_type": "EWALLET", "wallet_scope": "virtual", "balance": 0.0, "icon": "wallet", "color": "#D946EF"},
        {"name": "Sổ Tiết Kiệm", "wallet_type": "SAVINGS", "wallet_scope": "virtual", "balance": 0.0, "icon": "piggy-bank", "color": "#8B5CF6"},
        {"name": "Ví Dịch Vụ & VIP FinTrack", "wallet_type": "EWALLET", "wallet_scope": "real", "balance": 0.0, "icon": "wallet", "color": "#F59E0B"}
    ]
    for w_data in default_wallets:
        w = Wallet(
            user_id=new_user.id,
            name=w_data["name"],
            wallet_type=w_data["wallet_type"],
            wallet_scope=w_data["wallet_scope"],
            balance=w_data["balance"],
            icon=w_data["icon"],
            color=w_data["color"],
            currency=new_user.currency or "VND",
            is_active=True
        )
        db.add(w)

    db.commit()

    # Generate JWT Token
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Đăng nhập bằng Email và Mật khẩu (JSON payload)."""
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác"
        )

    # Check Account Lockout
    if not user.is_active or user.status == "LOCKED" or getattr(user, 'is_banned', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa do vi phạm chính sách hoặc theo yêu cầu quản trị viên. Vui lòng liên hệ hỗ trợ."
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-form", response_model=TokenResponse)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập hỗ trợ OAuth2 Password Bearer form của Swagger UI."""
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác"
        )

    # Check Account Lockout
    if not user.is_active or user.status == "LOCKED" or getattr(user, 'is_banned', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa do vi phạm chính sách hoặc theo yêu cầu quản trị viên. Vui lòng liên hệ hỗ trợ."
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin tài khoản người dùng hiện tại kèm trạng thái và thời hạn gói cước."""
    # Check if subscription has expired
    if current_user.plan != "FREE" and current_user.plan_expires_at:
        if current_user.plan_expires_at < datetime.datetime.utcnow():
            current_user.is_plan_active = False
            db.commit()
            db.refresh(current_user)
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin hồ sơ (Họ tên, Đơn vị tiền tệ, Avatar)."""
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.currency is not None:
        current_user.currency = profile_in.currency
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url
    
    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu người dùng."""
    if not verify_password(pwd_in.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng"
        )
    if len(pwd_in.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải có tối thiểu 6 ký tự"
        )

    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Đổi mật khẩu thành công!"}

@router.get("/plans")
def get_available_plans():
    """Lấy danh sách thông tin chi tiết 4 gói dịch vụ (Free, Pro, Premium, Platinum VIP)."""
    return [
        {
            "id": "FREE",
            "name": "FinTrack Free",
            "tagline": "Dành cho người mới bắt đầu quản lý tài chính",
            "price": 0,
            "billing_cycle": "Miễn phí vĩnh viễn",
            "ai_limits": 10,
            "ai_limits_text": "10 lượt gọi AI / ngày (300 lượt/tháng)",
            "badge": "FREE",
            "badge_color": "bg-slate-800 text-slate-400 border-slate-700",
            "highlight": False,
            "max_wallets": 2,
            "features": [
                "10 lượt gọi AI / ngày (300 lượt/tháng)",
                "Quản lý tối đa 2 ví tài chính cơ bản",
                "Theo dõi thu - chi & danh mục chuẩn",
                "Cảnh báo hạn mức & Báo cáo 30 ngày"
            ]
        },
        {
            "id": "PRO",
            "name": "FinTrack Pro",
            "tagline": "Tối ưu cho người đi làm & quản lý tài chính chủ động",
            "price": 49000,
            "billing_cycle": "49.000 ₫ / tháng (hoặc 490k/năm)",
            "ai_limits": 100,
            "ai_limits_text": "100 lượt gọi AI / ngày (3.000 lượt/tháng)",
            "badge": "⭐ POPULAR",
            "badge_color": "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
            "highlight": False,
            "max_wallets": 5,
            "features": [
                "100 lượt gọi AI / ngày (3.000 lượt/tháng)",
                "Quản lý tối đa 5 ví tài chính",
                "Cố vấn tài chính 50/30/20 chuyên sâu",
                "Xuất báo cáo Excel/PDF cơ bản",
                "Không giới hạn hạn mức ngân sách"
            ]
        },
        {
            "id": "PREMIUM",
            "name": "FinTrack Premium",
            "tagline": "Dành cho cá nhân & gia đình quản lý tài chính nâng cao",
            "price": 99000,
            "billing_cycle": "99.000 ₫ / tháng (hoặc 990k/năm)",
            "ai_limits": 300,
            "ai_limits_text": "1.000 Token AI / tháng (300 lượt gọi AI cao cấp/tháng)",
            "badge": "⭐ BEST SELLER",
            "badge_color": "bg-amber-500/20 text-amber-300 border-amber-500/40",
            "highlight": True,
            "max_wallets": 10,
            "features": [
                "Hạn mức 1.000 Token AI / tháng (300 lượt gọi AI cao cấp/tháng)",
                "Quản lý tối đa 10 ví tài chính",
                "Bóc tách hóa đơn & Dự báo dòng tiền thông minh",
                "Xuất báo cáo chi tiết & Phân tích chuyên sâu",
                "Hỗ trợ kỹ thuật ưu tiên qua Ticket (phản hồi trong 24h)"
            ]
        },
        {
            "id": "PLATINUM",
            "name": "FinTrack Platinum VIP",
            "tagline": "Trải nghiệm đỉnh cao không giới hạn toàn diện cho nhà đầu tư",
            "price": 199000,
            "billing_cycle": "199.000 ₫ / tháng (hoặc 1.990k/năm)",
            "ai_limits": -1,
            "ai_limits_text": "VIP Unlimited (Không giới hạn Token / Lượt gọi AI)",
            "badge": "👑💎 PLATINUM VIP",
            "badge_color": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            "highlight": False,
            "max_wallets": -1,
            "features": [
                "KHÔNG GIỚI HẠN Token / Lượt gọi AI (VIP Unlimited AI)",
                "Quản lý Không giới hạn số lượng ví & tài khoản ngân hàng",
                "Ưu tiên xử lý AI Engine tốc độ cao nhất (Fast Response)",
                "Trợ lý AI phân tích danh mục đầu tư & cảnh báo rủi ro 24/7",
                "Tự động sao lưu dữ liệu đám mây (Cloud Snapshot)",
                "Huy hiệu Platinum độc quyền & Hỗ trợ kỹ thuật 1-1 riêng biệt"
            ]
        }
    ]

@router.post("/upgrade-plan", response_model=UserOut)
def upgrade_plan(
    plan_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Người dùng đăng ký / nâng cấp gói cước (FREE, PRO, PREMIUM, PLATINUM), tự động trừ tiền ví và tính ngày hết hạn."""
    raw_plan = plan_data.get("plan", "").upper()
    if raw_plan in ["PLATINUM", "VIP_PLATINUM"]:
        new_plan = "PLATINUM"
    elif raw_plan in ["VIP", "PREMIUM"]:
        new_plan = "PREMIUM"
    elif raw_plan in ["FREE", "PRO"]:
        new_plan = raw_plan
    else:
        new_plan = raw_plan

    wallet_id = plan_data.get("wallet_id")
    months = int(plan_data.get("duration_months") or plan_data.get("months") or 1)
    if months not in [1, 3, 6, 12]:
        months = 1

    if new_plan not in ["FREE", "PRO", "PREMIUM", "PLATINUM"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gói dịch vụ không hợp lệ. Chỉ chấp nhận: FREE, PRO, PREMIUM, PLATINUM"
        )

    # Determine duration days
    if "duration_days" in plan_data and plan_data["duration_days"]:
        duration_days = int(plan_data["duration_days"])
    else:
        if months == 12:
            duration_days = 365
        elif months == 6:
            duration_days = 180
        elif months == 3:
            duration_days = 90
        else:
            duration_days = 30

    # Pricing table based on duration
    if months == 12:
        price_map = {"FREE": 0.0, "PRO": 490000.0, "PREMIUM": 990000.0, "PLATINUM": 1990000.0}
    elif months == 6:
        price_map = {"FREE": 0.0, "PRO": 264000.0, "PREMIUM": 534000.0, "PLATINUM": 1069000.0}
    elif months == 3:
        price_map = {"FREE": 0.0, "PRO": 139000.0, "PREMIUM": 279000.0, "PLATINUM": 567000.0}
    else:
        price_map = {"FREE": 0.0, "PRO": 49000.0, "PREMIUM": 99000.0, "PLATINUM": 199000.0}

    price = price_map.get(new_plan, 0.0)
    payment_method = plan_data.get("payment_method", "WALLET").upper() # WALLET, DIRECT_DEBIT
    bank_code = plan_data.get("bank_code", "")

    # If upgrading to a paid plan (PRO, PREMIUM, PLATINUM), deduct balance and record transaction
    if price > 0:
        target_wallet = None
        if payment_method == "DIRECT_DEBIT":
            # 1-Click Direct Debit via Open Banking: Look for a linked bank wallet or create transaction
            if wallet_id:
                target_wallet = db.query(Wallet).filter(
                    Wallet.id == int(wallet_id),
                    Wallet.user_id == current_user.id
                ).first()
            if not target_wallet:
                target_wallet = db.query(Wallet).filter(
                    Wallet.user_id == current_user.id,
                    Wallet.is_linked == True
                ).first()
            if not target_wallet:
                target_wallet = db.query(Wallet).filter(
                    Wallet.user_id == current_user.id,
                    Wallet.wallet_type == "BANK"
                ).first()
            if not target_wallet:
                target_wallet = db.query(Wallet).filter(
                    Wallet.user_id == current_user.id
                ).first()

            if target_wallet and target_wallet.balance < price:
                # Direct debit auto-funds or adjusts from bank
                target_wallet.balance = max(0.0, target_wallet.balance - price)
            elif target_wallet:
                target_wallet.balance -= price

            tx_note = f"Thanh toán gói FinTrack {new_plan} ({months} tháng) qua Direct Debit Ngân hàng"
        else:
            # Payment from FinTrack Real Payment Wallet (wallet_scope == 'real')
            if wallet_id:
                target_wallet = db.query(Wallet).filter(
                    Wallet.id == int(wallet_id),
                    Wallet.user_id == current_user.id
                ).first()
            
            if not target_wallet or target_wallet.wallet_scope != "real":
                # Find the dedicated real payment wallet
                target_wallet = db.query(Wallet).filter(
                    Wallet.user_id == current_user.id,
                    Wallet.wallet_scope == "real"
                ).first()

            if not target_wallet:
                # Auto create real payment wallet
                target_wallet = Wallet(
                    user_id=current_user.id,
                    name="Ví Thanh Toán Dịch Vụ & VIP FinTrack",
                    wallet_type="BANK",
                    wallet_scope="real",
                    balance=0.0,
                    currency=current_user.currency or "VND",
                    account_number_masked="MB-0374617569",
                    icon="credit-card",
                    color="#F59E0B",
                    is_active=True
                )
                db.add(target_wallet)
                db.flush()

            if target_wallet.balance < price:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Số dư Ví Tiền Thật ({target_wallet.name}) hiện tại ({target_wallet.balance:,.0f} ₫) không đủ để thanh toán {price:,.0f} ₫. Vui lòng quét mã VietQR Admin MB Bank để nạp thêm tiền thật!"
                )

            # Deduct real wallet balance
            target_wallet.balance -= price
            tx_note = f"Thanh toán đăng ký gói FinTrack {new_plan} ({months} tháng - {duration_days} ngày) qua Ví Tiền Thật"

        # Find or create subscription category
        cat = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.name == "Dịch Vụ & Đăng Ký VIP"
        ).first()

        if not cat:
            cat = Category(
                user_id=current_user.id,
                name="Dịch Vụ & Đăng Ký VIP",
                type="EXPENSE",
                group="WANTS",
                icon="crown",
                color="#F59E0B",
                is_default=False
            )
            db.add(cat)
            db.flush()

        # Create transaction record
        if target_wallet:
            tx = Transaction(
                user_id=current_user.id,
                wallet_id=target_wallet.id,
                category_id=cat.id,
                type="EXPENSE",
                amount=price,
                transaction_date=datetime.datetime.utcnow(),
                note=tx_note,
                created_by_ai="SUBSCRIPTION"
            )
            db.add(tx)

    # Automatic plan and expiration date calculation
    now = datetime.datetime.utcnow()
    if new_plan == "FREE":
        current_user.plan = "FREE"
        current_user.plan_tier = "Free"
        current_user.plan_activated_at = now
        current_user.plan_expires_at = None
        current_user.is_plan_active = True
    else:
        # Extend from current expiration date if user is already on the active package
        if (current_user.plan or "").upper() == new_plan and current_user.plan_expires_at and current_user.plan_expires_at > now:
            current_user.plan_expires_at = current_user.plan_expires_at + datetime.timedelta(days=duration_days)
        else:
            current_user.plan_activated_at = now
            current_user.plan_expires_at = now + datetime.timedelta(days=duration_days)

        current_user.plan = new_plan
        if new_plan == "PLATINUM":
            current_user.plan_tier = "FinTrack Platinum VIP"
        elif new_plan == "PREMIUM":
            current_user.plan_tier = "FinTrack Premium"
        elif new_plan == "PRO":
            current_user.plan_tier = "FinTrack Pro"
        else:
            current_user.plan_tier = "Free"
        current_user.is_plan_active = True

        # Generate notification into 'Hộp Thư & Thông Báo'
        plan_title_map = {
            "PLATINUM": "FinTrack Platinum VIP",
            "PREMIUM": "FinTrack Premium",
            "PRO": "FinTrack Pro"
        }
        plan_title = plan_title_map.get(new_plan, new_plan)
        method_desc = "1-Click Direct Debit (Ngân hàng Liên Kết)" if payment_method == "DIRECT_DEBIT" else f"Ví {target_wallet.name if target_wallet else 'nội bộ'}"
        notif = Notification(
            user_id=current_user.id,
            target_type="USER",
            title=f"👑 Kích Hoạt Gói {plan_title} Thành Công!",
            message=f"Bạn đã thanh toán thành công {price:,.0f} ₫ qua {method_desc}. Hạn dùng gói: {current_user.days_remaining} ngày (đến {current_user.plan_expires_at.strftime('%d/%m/%Y %H:%M')}).",
            type="SUCCESS",
            icon="crown",
            link_tab="subscription",
            is_read=False,
            created_at=now
        )
        db.add(notif)

    current_user.updated_at = now
    db.commit()
    db.refresh(current_user)
    return current_user
