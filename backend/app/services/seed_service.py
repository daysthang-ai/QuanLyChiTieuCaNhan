"""
seed_service.py
----------------
Khởi tạo cấu hình và dữ liệu nền tảng ban đầu cho FinTrack AI:
- 23 Danh mục thu - chi chuẩn 50/30/20.
- Cấu hình Cổng thanh toán VietQR mặc định (MB Bank - 0374617569).
- Khởi tạo tài khoản Quản trị viên (admin@fintrack.ai) và Demo (user@fintrack.ai).
- Đảm bảo 100% số dư = 0đ và không tự sinh giao dịch mẫu (mock transactions).
"""

import datetime
from sqlalchemy.orm import Session
from backend.app.models import (
    User, Wallet, Category, SystemBankAccount
)
from backend.app.utils.security import get_password_hash

DEFAULT_CATEGORIES = [
    # NEEDS (Nhu cầu thiết yếu - 50%)
    {"name": "Ăn uống & Thực phẩm", "type": "EXPENSE", "group": "NEEDS", "icon": "utensils", "color": "#EF4444"},
    {"name": "Nhà ở & Tiền thuê", "type": "EXPENSE", "group": "NEEDS", "icon": "house", "color": "#F97316"},
    {"name": "Hóa đơn & Tiện ích", "type": "EXPENSE", "group": "NEEDS", "icon": "bolt", "color": "#EAB308"},
    {"name": "Đi lại & Xăng xe", "type": "EXPENSE", "group": "NEEDS", "icon": "car", "color": "#3B82F6"},
    {"name": "Y tế & Sức khỏe", "type": "EXPENSE", "group": "NEEDS", "icon": "heart-pulse", "color": "#EC4899"},
    {"name": "Giáo dục & Học tập", "type": "EXPENSE", "group": "NEEDS", "icon": "graduation-cap", "color": "#8B5CF6"},

    # WANTS (Mong muốn & Phong cách sống - 30%)
    {"name": "Mua sắm cá nhân", "type": "EXPENSE", "group": "WANTS", "icon": "bag-shopping", "color": "#06B6D4"},
    {"name": "Du lịch & Nghỉ dưỡng", "type": "EXPENSE", "group": "WANTS", "icon": "plane", "color": "#0EA5E9"},
    {"name": "Giải trí & Thư giãn", "type": "EXPENSE", "group": "WANTS", "icon": "gamepad", "color": "#14B8A6"},
    {"name": "Cà phê & Gặp gỡ", "type": "EXPENSE", "group": "WANTS", "icon": "mug-saucer", "color": "#A855F7"},
    {"name": "Làm đẹp & Spa", "type": "EXPENSE", "group": "WANTS", "icon": "wand-magic-sparkles", "color": "#F43F5E"},
    {"name": "Quà tặng & Hiếu hỷ", "type": "EXPENSE", "group": "WANTS", "icon": "gift", "color": "#6366F1"},

    # SAVINGS (Tiết kiệm & Đầu tư - 20%)
    {"name": "Quỹ khẩn cấp", "type": "EXPENSE", "group": "SAVINGS", "icon": "shield-heart", "color": "#10B981"},
    {"name": "Đầu tư sinh lời", "type": "EXPENSE", "group": "SAVINGS", "icon": "chart-line", "color": "#059669"},
    {"name": "Tích lũy mục tiêu", "type": "EXPENSE", "group": "SAVINGS", "icon": "piggy-bank", "color": "#047857"},
    {"name": "Trả nợ gốc", "type": "EXPENSE", "group": "SAVINGS", "icon": "money-bill-transfer", "color": "#64748B"},

    # INCOME (Thu nhập)
    {"name": "Lương chính thức", "type": "INCOME", "group": "INCOME", "icon": "money-bill-wave", "color": "#10B981"},
    {"name": "Thưởng & Hoa hồng", "type": "INCOME", "group": "INCOME", "icon": "award", "color": "#3B82F6"},
    {"name": "Thu nhập phụ & Freelance", "type": "INCOME", "group": "INCOME", "icon": "laptop-code", "color": "#8B5CF6"},
    {"name": "Lãi suất & Đầu tư", "type": "INCOME", "group": "INCOME", "icon": "arrow-trend-up", "color": "#06B6D4"},
    {"name": "Thu nhập khác", "type": "INCOME", "group": "INCOME", "icon": "wallet", "color": "#6B7280"}
]

DEFAULT_WALLETS = [
    {"name": "Tiền mặt", "wallet_type": "CASH", "wallet_scope": "virtual", "balance": 0.0, "icon": "money-bill-wave", "color": "#10B981"},
    {"name": "MB Bank", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 0.0, "icon": "building-columns", "color": "#3B82F6"},
    {"name": "Ví MoMo", "wallet_type": "EWALLET", "wallet_scope": "virtual", "balance": 0.0, "icon": "wallet", "color": "#D946EF"},
    {"name": "Sổ Tiết Kiệm", "wallet_type": "SAVINGS", "wallet_scope": "virtual", "balance": 0.0, "icon": "piggy-bank", "color": "#8B5CF6"},
    {"name": "Ví Dịch Vụ & VIP FinTrack", "wallet_type": "EWALLET", "wallet_scope": "real", "balance": 0.0, "icon": "wallet", "color": "#F59E0B"}
]


def init_user_defaults(db: Session, target_user: User):
    """
    Khởi tạo danh mục và danh sách ví mặc định cho người dùng (hoàn toàn sạch 0đ, 0 giao dịch).
    """
    # 1. Categories
    existing_cats = db.query(Category).filter(Category.user_id == target_user.id).all()
    if not existing_cats:
        for cat_data in DEFAULT_CATEGORIES:
            cat = Category(
                user_id=target_user.id,
                name=cat_data["name"],
                type=cat_data["type"],
                group=cat_data["group"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_default=True
            )
            db.add(cat)
        db.flush()

    # 2. Wallets (Số dư mặc định hoàn toàn 0đ)
    existing_wallets = db.query(Wallet).filter(Wallet.user_id == target_user.id).all()
    if not existing_wallets:
        for w_data in DEFAULT_WALLETS:
            w = Wallet(
                user_id=target_user.id,
                name=w_data["name"],
                wallet_type=w_data["wallet_type"],
                wallet_scope=w_data["wallet_scope"],
                balance=0.0,
                currency="VND",
                icon=w_data["icon"],
                color=w_data["color"],
                is_active=True
            )
            db.add(w)
        db.flush()


def seed_user_financials(db: Session, target_user: User, is_admin: bool = False, force_refresh: bool = False):
    """Backward compatible alias to init_user_defaults (không chèn giao dịch mẫu)."""
    init_user_defaults(db, target_user)


def seed_database(db: Session):
    """
    Khởi tạo dữ liệu cấu hình hệ thống ban đầu (Super Admin, Demo User, Cổng VietQR MB Bank).
    Đảm bảo 100% không chèn bất kỳ giao dịch mẫu, số dư ảo hay dữ liệu rác nào.
    """
    # 1. Create Super Admin User
    admin_user = db.query(User).filter(User.email == "admin@fintrack.ai").first()
    if not admin_user:
        admin_user = User(
            email="admin@fintrack.ai",
            full_name="Quản Trị Viên FinTrack",
            hashed_password=get_password_hash("Admin@123456"),
            role="ADMIN",
            status="ACTIVE",
            plan="PLATINUM",
            plan_tier="FinTrack Platinum VIP",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        db.add(admin_user)
        db.flush()

    # 2. Create Demo User
    demo_user = db.query(User).filter(User.email == "user@fintrack.ai").first()
    if not demo_user:
        demo_user = User(
            email="user@fintrack.ai",
            full_name="Nguyễn Văn An",
            hashed_password=get_password_hash("User@123456"),
            role="USER",
            status="ACTIVE",
            plan="FREE",
            plan_tier="Free",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        )
        db.add(demo_user)
        db.flush()

    # 3. Seed Default System Bank Gateway (MB Bank)
    default_bank = db.query(SystemBankAccount).first()
    if not default_bank:
        now = datetime.datetime.now(datetime.timezone.utc)
        default_bank = SystemBankAccount(
            bank_code="MB",
            bank_name="MB Bank (Ngân Hàng Quân Đội)",
            account_number="0374617569",
            account_name="DANG QUYET THANG",
            branch="Hội Sở Chính",
            qr_template="compact2",
            memo_prefix="NAP VIP",
            is_active=True,
            created_at=now,
            updated_at=now
        )
        db.add(default_bank)
        db.flush()

    # 4. Initialize clean categories and wallets for admin and demo user (0đ, 0 transactions)
    init_user_defaults(db, admin_user)
    init_user_defaults(db, demo_user)

    db.commit()
    print("[SeedService] Database initialization check completed with 100% clean state (0 VNĐ).")

