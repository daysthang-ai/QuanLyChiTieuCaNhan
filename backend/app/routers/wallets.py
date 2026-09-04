from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db, get_utc_now
from backend.app.models import User, Wallet, Transaction, Category, Notification
from backend.app.schemas import WalletCreate, WalletUpdate, WalletOut, WalletTransfer, WalletDeposit, BankLinkRequest
from backend.app.routers.auth import get_current_user
from backend.app.utils.sanitizer import mask_account_number

router = APIRouter(prefix="/wallets", tags=["Quản lý Ví & Tài khoản"])

@router.get("/", response_model=List[WalletOut])
def list_wallets(
    scope: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các ví/tài khoản thanh toán của người dùng (hỗ trợ lọc scope: 'virtual' hoặc 'real')."""
    # Ensure user has a real payment wallet
    real_w = db.query(Wallet).filter(Wallet.user_id == current_user.id, Wallet.wallet_scope == "real").first()
    if not real_w:
        real_w = Wallet(
            user_id=current_user.id,
            name="Ví Thanh Toán Dịch Vụ & VIP FinTrack",
            wallet_type="BANK",
            wallet_scope="real",
            balance=500000.0 if current_user.email == "user@fintrack.ai" else 0.0,
            currency=current_user.currency or "VND",
            account_number_masked="MB-0374617569",
            icon="credit-card",
            color="#F59E0B",
            is_active=True
        )
        db.add(real_w)
        db.commit()

    query = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True
    )
    if scope:
        query = query.filter(Wallet.wallet_scope == scope.lower())

    return query.order_by(Wallet.id.asc()).all()

@router.post("/", response_model=WalletOut, status_code=status.HTTP_201_CREATED)
def create_wallet(
    wallet_in: WalletCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scope = (wallet_in.wallet_scope or "virtual").lower()
    if scope != "real" and current_user.role != "ADMIN":
        plan = (current_user.plan or "FREE").upper()
        wallet_limits = {"FREE": 2, "PRO": 5, "PREMIUM": 10, "PLATINUM": -1}
        limit = wallet_limits.get(plan, 2)
        if limit != -1:
            current_wallet_count = db.query(Wallet).filter(
                Wallet.user_id == current_user.id,
                Wallet.wallet_scope == "virtual",
                Wallet.is_active == True
            ).count()
            if current_wallet_count >= limit:
                tier_name = current_user.plan_name
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Gói {tier_name} chỉ cho phép quản lý tối đa {limit} ví tài chính. Hãy nâng cấp lên gói cao hơn hoặc FinTrack Platinum VIP để không giới hạn số lượng ví!"
                )

    account_num_masked = mask_account_number(wallet_in.account_number_masked) if wallet_in.account_number_masked else None
    new_wallet = Wallet(
        user_id=current_user.id,
        name=wallet_in.name,
        wallet_type=wallet_in.wallet_type,
        wallet_scope=scope,
        balance=wallet_in.balance,
        currency=wallet_in.currency or current_user.currency,
        account_number_masked=account_num_masked,
        icon=wallet_in.icon or "wallet",
        color=wallet_in.color or "#3B82F6",
        is_active=True,
        is_linked=wallet_in.is_linked or False,
        bank_code=wallet_in.bank_code,
        auto_debit_enabled=wallet_in.auto_debit_enabled or False
    )
    db.add(new_wallet)
    db.commit()
    db.refresh(new_wallet)
    return new_wallet

@router.get("/{wallet_id}", response_model=WalletOut)
def get_wallet(
    wallet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết một ví."""
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Không tìm thấy ví")
    return wallet

@router.put("/{wallet_id}", response_model=WalletOut)
def update_wallet(
    wallet_id: int,
    wallet_in: WalletUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin ví. Người dùng thông thường không được phép sửa trực tiếp trường balance."""
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Không tìm thấy ví")

    if wallet_in.name is not None: wallet.name = wallet_in.name
    if wallet_in.wallet_type is not None: wallet.wallet_type = wallet_in.wallet_type
    if wallet_in.wallet_scope is not None: wallet.wallet_scope = wallet_in.wallet_scope
    
    # Ràng buộc nghiệp vụ: Người dùng thường KHÔNG ĐƯỢC PHÉP chỉnh sửa số dư trực tiếp qua API này.
    # Chỉ Admin mới có quyền cập nhật trực tiếp balance nếu gửi lên.
    if current_user.role == "ADMIN" and wallet_in.balance is not None:
        wallet.balance = wallet_in.balance

    if wallet_in.account_number_masked is not None:
        wallet.account_number_masked = mask_account_number(wallet_in.account_number_masked)
    if wallet_in.icon is not None: wallet.icon = wallet_in.icon
    if wallet_in.color is not None: wallet.color = wallet_in.color
    if wallet_in.is_active is not None: wallet.is_active = wallet_in.is_active
    if wallet_in.is_linked is not None: wallet.is_linked = wallet_in.is_linked
    if wallet_in.bank_code is not None: wallet.bank_code = wallet_in.bank_code
    if wallet_in.auto_debit_enabled is not None: wallet.auto_debit_enabled = wallet_in.auto_debit_enabled

    wallet.updated_at = get_utc_now()
    try:
        db.commit()
        db.refresh(wallet)
        return wallet
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật ví: {str(e)}")

@router.delete("/{wallet_id}")
def delete_wallet(
    wallet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa hoặc ngừng kích hoạt ví."""
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Không tìm thấy ví")

    # Không cho xóa ví tiền thật mặc định
    if wallet.wallet_scope == "real":
        raise HTTPException(status_code=400, detail="Không thể xóa Ví Tiền Thật / Cổng Dịch Vụ mặc định của tài khoản.")

    # Check if has transactions
    tx_count = db.query(Transaction).filter(
        (Transaction.wallet_id == wallet_id) | (Transaction.to_wallet_id == wallet_id)
    ).count()
    try:
        if tx_count > 0:
            # Soft delete
            wallet.is_active = False
            db.commit()
            return {"message": "Ví đã có giao dịch nên đã được ẩn khỏi danh sách."}
        else:
            db.delete(wallet)
            db.commit()
            return {"message": "Đã xóa ví thành công."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xóa ví: {str(e)}")

@router.post("/transfer")
def transfer_between_wallets(
    transfer_in: WalletTransfer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chuyển tiền giữa hai ví của cùng một người dùng trong cùng phân hệ."""
    if transfer_in.from_wallet_id == transfer_in.to_wallet_id:
        raise HTTPException(status_code=400, detail="Ví nguồn và ví đích không được trùng nhau")

    from_w = db.query(Wallet).filter(Wallet.id == transfer_in.from_wallet_id, Wallet.user_id == current_user.id).first()
    to_w = db.query(Wallet).filter(Wallet.id == transfer_in.to_wallet_id, Wallet.user_id == current_user.id).first()

    if not from_w or not to_w:
        raise HTTPException(status_code=404, detail="Không tìm thấy một trong hai ví")

    if from_w.wallet_scope != to_w.wallet_scope:
        raise HTTPException(
            status_code=400,
            detail="Chỉ cho phép chuyển tiền giữa các ví trong cùng phân hệ (ví dụ: giữa các Ví Kế Toán Ảo với nhau)."
        )

    if from_w.balance < transfer_in.amount:
        raise HTTPException(status_code=400, detail=f"Số dư ví nguồn ({from_w.name}) không đủ để chuyển")

    # Deduct from source and add to destination
    from_w.balance -= transfer_in.amount
    to_w.balance += transfer_in.amount

    # Create transaction log
    tx_date = transfer_in.date or get_utc_now()
    tx = Transaction(
        user_id=current_user.id,
        wallet_id=from_w.id,
        to_wallet_id=to_w.id,
        type="TRANSFER",
        amount=transfer_in.amount,
        transaction_date=tx_date,
        note=transfer_in.note or f"Chuyển từ {from_w.name} sang {to_w.name}",
        created_by_ai="MANUAL"
    )
    try:
        db.add(tx)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi thực hiện chuyển tiền: {str(e)}")

    return {
        "message": f"Chuyển thành công {transfer_in.amount:,.0f} đ từ {from_w.name} sang {to_w.name}",
        "from_wallet_balance": from_w.balance,
        "to_wallet_balance": to_w.balance
    }

@router.post("/{wallet_id}/deposit")
def deposit_to_wallet(
    wallet_id: int,
    deposit_in: WalletDeposit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Nạp tiền vào ví (phân biệt Ví Kế Toán Ảo vs Ví Tiền Thật/Dịch Vụ)."""
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Không tìm thấy ví cần nạp tiền")

    if deposit_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Số tiền nạp phải lớn hơn 0")

    old_balance = wallet.balance
    wallet.balance += deposit_in.amount
    wallet.updated_at = get_utc_now()

    # Find or create income category for wallet deposits
    cat_name = "Nạp Tiền Thật (Cổng Dịch Vụ)" if wallet.wallet_scope == "real" else "Thu Nhập & Nạp Tiền"
    cat = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name == cat_name
    ).first()
    if not cat:
        cat = Category(
            user_id=current_user.id,
            name=cat_name,
            type="INCOME",
            group="INCOME",
            icon="circle-plus",
            color="#10B981" if wallet.wallet_scope != "real" else "#F59E0B",
            is_default=False
        )
        db.add(cat)
        db.flush()

    source_labels = {
        "BANK_LINK": "Tài khoản liên kết",
        "CASH": "Tiền mặt",
        "QR_CODE": "VietQR MB Bank Admin",
        "DIRECT_DEBIT": "Trích nợ trực tiếp Open Banking"
    }
    source_name = source_labels.get(deposit_in.source, deposit_in.source or "Nguồn liên kết")
    
    if wallet.wallet_scope == "real":
        tx_note = deposit_in.note or f"Nạp tiền thật vào Ví Dịch Vụ & VIP FinTrack qua {source_name}"
    else:
        tx_note = deposit_in.note or f"Nạp tiền vào ví kế toán {wallet.name}"

    # Create transaction record
    tx = Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        category_id=cat.id,
        type="INCOME",
        amount=deposit_in.amount,
        transaction_date=get_utc_now(),
        note=tx_note,
        created_by_ai="WALLET_DEPOSIT" if wallet.wallet_scope != "real" else "REAL_PAYMENT_DEPOSIT"
    )
    try:
        db.add(tx)
        db.commit()
        db.refresh(wallet)
        db.refresh(tx)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi nạp tiền vào ví: {str(e)}")

    scope_name = "Ví Tiền Thật / VIP" if wallet.wallet_scope == "real" else f"Ví '{wallet.name}'"
    return {
        "message": f"Nạp thành công {deposit_in.amount:,.0f} ₫ vào {scope_name}!",
        "wallet": {
            "id": wallet.id,
            "name": wallet.name,
            "wallet_scope": wallet.wallet_scope,
            "old_balance": old_balance,
            "new_balance": wallet.balance,
            "currency": wallet.currency
        },
        "transaction": {
            "id": tx.id,
            "amount": tx.amount,
            "type": tx.type,
            "note": tx.note,
            "transaction_date": tx.transaction_date.strftime("%d/%m/%Y %H:%M")
        }
    }

@router.post("/link-bank", response_model=WalletOut)
def link_bank_account(
    data: BankLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liên kết tài khoản ngân hàng trực tiếp qua Open Banking Flow."""
    masked_acc = mask_account_number(data.account_number)
    
    # Check if this bank account is already linked
    existing = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.bank_code == data.bank_code,
        Wallet.account_number_masked == masked_acc
    ).first()

    now = get_utc_now()
    bank_colors = {
        "TCB": "#E11B22",
        "VCB": "#005F37",
        "MB": "#1F3BB3",
        "VPB": "#009949",
        "MOMO": "#A50064",
        "ACB": "#005BAA",
        "BIDV": "#005C8A"
    }
    color = bank_colors.get(data.bank_code.upper(), "#3B82F6")

    try:
        if existing:
            existing.is_linked = True
            existing.auto_debit_enabled = data.auto_debit_consent
            existing.linked_at = now
            existing.updated_at = now
            db.commit()
            db.refresh(existing)
            target_wallet = existing
        else:
            new_wallet = Wallet(
                user_id=current_user.id,
                name=f"{data.bank_name} ({data.account_holder})",
                wallet_type="BANK",
                balance=data.initial_balance if data.initial_balance else 5000000.0,
                currency=current_user.currency or "VND",
                account_number_masked=masked_acc,
                icon="building-columns" if data.bank_code.upper() != "MOMO" else "mobile-screen",
                color=color,
                is_active=True,
                is_linked=True,
                bank_code=data.bank_code.upper(),
                auto_debit_enabled=data.auto_debit_consent,
                linked_at=now
            )
            db.add(new_wallet)
            db.commit()
            db.refresh(new_wallet)
            target_wallet = new_wallet
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi liên kết tài khoản ngân hàng: {str(e)}")

    # Create a notification in Hộp Thư & Thông Báo
    notif = Notification(
        user_id=current_user.id,
        target_type="USER",
        title="🔗 Liên Kết Ngân Hàng Thành Công",
        message=f"Tài khoản {data.bank_name} ({masked_acc}) đã được liên kết thành công với FinTrack AI. Trạng thái: Auto-Debit Ready.",
        type="SUCCESS",
        icon="circle-check",
        link_tab="wallets",
        is_read=False,
        created_at=now
    )
    db.add(notif)
    db.commit()

    return target_wallet
