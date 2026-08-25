import datetime
from sqlalchemy.orm import Session
from backend.app.models import User, Wallet, Category, Transaction, Budget, SavingGoal, Notification, SubscriptionOrder, SupportTicket
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

def seed_database(db: Session):
    """Populates database with realistic Vietnamese seed data if empty."""
    # 1. Create Users
    admin_user = db.query(User).filter(User.email == "admin@fintrack.ai").first()
    if not admin_user:
        admin_user = User(
            email="admin@fintrack.ai",
            full_name="Quản Trị Viên FinTrack",
            hashed_password=get_password_hash("Admin@123456"),
            role="ADMIN",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        db.add(admin_user)
        db.flush()

    demo_user = db.query(User).filter(User.email == "user@fintrack.ai").first()
    if not demo_user:
        demo_user = User(
            email="user@fintrack.ai",
            full_name="Nguyễn Văn An",
            hashed_password=get_password_hash("User@123456"),
            role="USER",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        )
        db.add(demo_user)
        db.flush()

def seed_user_financials(db: Session, target_user: User, is_admin: bool = False, force_refresh: bool = False):
    """Populates categories, wallets, budgets, saving goals, and transactions for a user."""
    # A. Seed Default Categories
    cat_map = {}
    existing_cats = db.query(Category).filter(Category.user_id == target_user.id).all()
    if not existing_cats or force_refresh:
        for cat_data in DEFAULT_CATEGORIES:
            existing = db.query(Category).filter(Category.user_id == target_user.id, Category.name == cat_data["name"]).first()
            if not existing:
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
                cat_map[cat.name] = cat
            else:
                existing.icon = cat_data["icon"]
                existing.color = cat_data["color"]
                cat_map[existing.name] = existing
    else:
        for c in existing_cats:
            cat_map[c.name] = c

    # B. Seed Wallets
    wallet_map = {}
    existing_wallets = db.query(Wallet).filter(Wallet.user_id == target_user.id).all()
    if not existing_wallets or len(existing_wallets) <= 1 or force_refresh:
        if is_admin:
            wallets_data = [
                {"name": "MB Bank Private Banking", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 85500000.0, "account_number_masked": "MB-99999999", "icon": "building-columns", "color": "#1E40AF"},
                {"name": "Techcombank Priority", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 120000000.0, "account_number_masked": "****6868", "icon": "building-columns", "color": "#DC2626"},
                {"name": "Ví MoMo VIP", "wallet_type": "EWALLET", "wallet_scope": "virtual", "balance": 5650000.0, "account_number_masked": "****0909", "icon": "mobile-screen", "color": "#A21CAF"},
                {"name": "Tiền mặt", "wallet_type": "CASH", "wallet_scope": "virtual", "balance": 3500000.0, "account_number_masked": None, "icon": "money-bill-wave", "color": "#16A34A"},
                {"name": "Sổ Tiết Kiệm Vietcombank", "wallet_type": "SAVINGS", "wallet_scope": "virtual", "balance": 250000000.0, "account_number_masked": "****8888", "icon": "piggy-bank", "color": "#059669"},
                {"name": "Ví Thanh Toán Dịch Vụ & VIP FinTrack", "wallet_type": "BANK", "wallet_scope": "real", "balance": 2000000.0, "account_number_masked": "MB-0987654321", "icon": "credit-card", "color": "#F59E0B"}
            ]
        else:
            wallets_data = [
                {"name": "Techcombank", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 45200000.0, "account_number_masked": "****8888", "icon": "building-columns", "color": "#DC2626"},
                {"name": "Ví MoMo", "wallet_type": "EWALLET", "wallet_scope": "virtual", "balance": 2850000.0, "account_number_masked": "****0909", "icon": "mobile-screen", "color": "#A21CAF"},
                {"name": "Tiền mặt", "wallet_type": "CASH", "wallet_scope": "virtual", "balance": 1500000.0, "account_number_masked": None, "icon": "money-bill-wave", "color": "#16A34A"},
                {"name": "Sổ tiết kiệm VPBank", "wallet_type": "SAVINGS", "wallet_scope": "virtual", "balance": 50000000.0, "account_number_masked": "****9999", "icon": "piggy-bank", "color": "#059669"},
                {"name": "Ví Thanh Toán Dịch Vụ & VIP FinTrack", "wallet_type": "BANK", "wallet_scope": "real", "balance": 500000.0, "account_number_masked": "MB-0987654321", "icon": "credit-card", "color": "#F59E0B"}
            ]
        for w_data in wallets_data:
            existing_w = db.query(Wallet).filter(Wallet.user_id == target_user.id, Wallet.name == w_data["name"]).first()
            if not existing_w:
                w = Wallet(
                    user_id=target_user.id,
                    name=w_data["name"],
                    wallet_type=w_data["wallet_type"],
                    wallet_scope=w_data["wallet_scope"],
                    balance=w_data["balance"],
                    currency="VND",
                    account_number_masked=w_data["account_number_masked"],
                    icon=w_data["icon"],
                    color=w_data["color"],
                    is_active=True
                )
                db.add(w)
                db.flush()
                wallet_map[w.name] = w
            else:
                wallet_map[existing_w.name] = existing_w
    else:
        for w in existing_wallets:
            wallet_map[w.name] = w

    # C. Seed Budgets (Current Month: 2026-08)
    current_month_str = "2026-08"
    existing_budgets = db.query(Budget).filter(Budget.user_id == target_user.id, Budget.month_year == current_month_str).all()
    if not existing_budgets and cat_map:
        if is_admin:
            budgets_to_create = [
                {"cat_name": "Ăn uống & Thực phẩm", "limit": 10000000.0},
                {"cat_name": "Nhà ở & Tiền thuê", "limit": 15000000.0},
                {"cat_name": "Mua sắm cá nhân", "limit": 30000000.0},
                {"cat_name": "Đi lại & Xăng xe", "limit": 3000000.0},
                {"cat_name": "Cà phê & Gặp gỡ", "limit": 2000000.0},
                {"cat_name": "Giáo dục & Học tập", "limit": 8000000.0},
                {"cat_name": "Làm đẹp & Spa", "limit": 4000000.0}
            ]
        else:
            budgets_to_create = [
                {"cat_name": "Ăn uống & Thực phẩm", "limit": 5000000.0},
                {"cat_name": "Mua sắm cá nhân", "limit": 2000000.0},
                {"cat_name": "Đi lại & Xăng xe", "limit": 1500000.0},
                {"cat_name": "Cà phê & Gặp gỡ", "limit": 1000000.0},
                {"cat_name": "Giải trí & Thư giãn", "limit": 1000000.0}
            ]
        for b_data in budgets_to_create:
            c = cat_map.get(b_data["cat_name"])
            if c:
                b = Budget(
                    user_id=target_user.id,
                    category_id=c.id,
                    amount_limit=b_data["limit"],
                    period="MONTHLY",
                    month_year=current_month_str,
                    alert_80_sent=False,
                    alert_100_sent=False
                )
                db.add(b)

    # D. Seed Saving Goals
    existing_goals = db.query(SavingGoal).filter(SavingGoal.user_id == target_user.id).all()
    if not existing_goals:
        if is_admin:
            goals_data = [
                {"name": "Quỹ khẩn cấp gia đình 12 tháng", "target_amount": 200000000.0, "current_amount": 180000000.0, "target_date": datetime.date(2026, 12, 31), "status": "ACTIVE", "icon": "shield-heart", "color": "#10B981", "note": "Dự phòng an toàn tài chính 12 tháng sinh hoạt phí"},
                {"name": "Mua xe ô tô điện VinFast VF8", "target_amount": 1100000000.0, "current_amount": 650000000.0, "target_date": datetime.date(2027, 6, 30), "status": "ACTIVE", "icon": "car", "color": "#3B82F6", "note": "Nâng cấp phương tiện di chuyển gia đình"},
                {"name": "Quỹ đầu tư Bất Động Sản nghỉ dưỡng", "target_amount": 500000000.0, "current_amount": 320000000.0, "target_date": datetime.date(2026, 10, 31), "status": "ACTIVE", "icon": "house", "color": "#F59E0B", "note": "Đầu tư căn hộ condotel biển"},
                {"name": "Du lịch Châu Âu 2 tuần", "target_amount": 120000000.0, "current_amount": 95000000.0, "target_date": datetime.date(2026, 11, 15), "status": "ACTIVE", "icon": "plane", "color": "#8B5CF6", "note": "Hành trình Pháp - Ý - Thụy Sĩ mùa thu"}
            ]
        else:
            goals_data = [
                {"name": "Quỹ khẩn cấp 6 tháng", "target_amount": 60000000.0, "current_amount": 50000000.0, "target_date": datetime.date(2026, 12, 31), "status": "ACTIVE", "icon": "shield-heart", "color": "#10B981", "note": "Dự phòng 6 tháng sinh hoạt phí cho gia đình"},
                {"name": "Mua xe máy Honda SH 160i", "target_amount": 95000000.0, "current_amount": 42000000.0, "target_date": datetime.date(2027, 3, 30), "status": "ACTIVE", "icon": "motorcycle", "color": "#3B82F6", "note": "Tích lũy mua xe mới đi làm"},
                {"name": "Du lịch Nhật Bản mùa thu", "target_amount": 35000000.0, "current_amount": 28000000.0, "target_date": datetime.date(2026, 10, 25), "status": "ACTIVE", "icon": "plane", "color": "#F59E0B", "note": "Ngắm lá đỏ Tokyo & Kyoto 6 ngày"}
            ]
        for g_data in goals_data:
            g = SavingGoal(
                user_id=target_user.id,
                name=g_data["name"],
                target_amount=g_data["target_amount"],
                current_amount=g_data["current_amount"],
                target_date=g_data["target_date"],
                status=g_data["status"],
                icon=g_data["icon"],
                color=g_data["color"],
                note=g_data["note"]
            )
            db.add(g)

    # E. Seed Realistic Transactions across June, July, August 2026
    existing_tx = db.query(Transaction).filter(Transaction.user_id == target_user.id).first()
    if not existing_tx and cat_map and wallet_map:
        if is_admin:
            main_bank = wallet_map.get("MB Bank Private Banking") or list(wallet_map.values())[0]
            sec_bank = wallet_map.get("Techcombank Priority") or list(wallet_map.values())[0]
            momo_w = wallet_map.get("Ví MoMo VIP") or list(wallet_map.values())[0]
            cash_w = wallet_map.get("Tiền mặt") or list(wallet_map.values())[0]

            tx_samples = [
                # August 2026
                (datetime.datetime(2026, 8, 1, 9, 0), "INCOME", 45000000.0, "Lương chính thức", main_bank, "Lương Quản trị / Giám đốc tháng 07", "MANUAL"),
                (datetime.datetime(2026, 8, 2, 10, 30), "EXPENSE", 12000000.0, "Nhà ở & Tiền thuê", sec_bank, "Tiền thuê căn hộ cao cấp tháng 8", "MANUAL"),
                (datetime.datetime(2026, 8, 3, 14, 15), "EXPENSE", 1450000.0, "Hóa đơn & Tiện ích", momo_w, "Hóa đơn điện sinh hoạt & cáp quang", "AI_PARSED"),
                (datetime.datetime(2026, 8, 4, 8, 30), "EXPENSE", 1200000.0, "Đi lại & Xăng xe", main_bank, "Bảo dưỡng định kỳ & đổ xăng xe", "MANUAL"),
                (datetime.datetime(2026, 8, 5, 12, 30), "EXPENSE", 850000.0, "Ăn uống & Thực phẩm", main_bank, "Ăn trưa tiếp đối tác tại Sheraton", "AI_PARSED"),
                (datetime.datetime(2026, 8, 7, 18, 45), "EXPENSE", 2400000.0, "Ăn uống & Thực phẩm", sec_bank, "Siêu thị thực phẩm hữu cơ Annam Gourmet", "MANUAL"),
                (datetime.datetime(2026, 8, 8, 15, 0), "EXPENSE", 1200000.0, "Cà phê & Gặp gỡ", momo_w, "Cà phê Starbucks & làm việc", "AI_PARSED"),
                (datetime.datetime(2026, 8, 10, 11, 30), "INCOME", 15500000.0, "Lãi suất & Đầu tư", sec_bank, "Lợi nhuận đầu tư chứng khoán & cổ tức", "MANUAL"),
                (datetime.datetime(2026, 8, 12, 16, 0), "EXPENSE", 5000000.0, "Giáo dục & Học tập", main_bank, "Học phí khóa đào tạo Quản trị Tài chính", "MANUAL"),
                (datetime.datetime(2026, 8, 14, 17, 30), "EXPENSE", 24500000.0, "Mua sắm cá nhân", main_bank, "Mua iPad Pro M4 phục vụ công việc", "MANUAL"),
                (datetime.datetime(2026, 8, 15, 10, 0), "EXPENSE", 2200000.0, "Làm đẹp & Spa", momo_w, "Chăm sóc sức khỏe & massage trị liệu", "AI_PARSED"),
                (datetime.datetime(2026, 8, 16, 19, 30), "EXPENSE", 1650000.0, "Ăn uống & Thực phẩm", main_bank, "Ăn tối nhà hàng Nhật cùng gia đình", "MANUAL"),
                (datetime.datetime(2026, 8, 18, 20, 30), "EXPENSE", 380000.0, "Giải trí & Thư giãn", momo_w, "Xem phim rạp IMAX & bắp nước", "MANUAL"),
                (datetime.datetime(2026, 8, 19, 12, 0), "EXPENSE", 95000.0, "Ăn uống & Thực phẩm", cash_w, "Cơm trưa văn phòng", "MANUAL"),
                (datetime.datetime(2026, 8, 20, 10, 0), "INCOME", 18000000.0, "Thu nhập phụ & Freelance", sec_bank, "Phí tư vấn chiến lược doanh nghiệp", "MANUAL"),
                (datetime.datetime(2026, 8, 21, 14, 0), "EXPENSE", 1800000.0, "Quà tặng & Hiếu hỷ", momo_w, "Quà tặng sinh nhật đối tác", "MANUAL"),
                (datetime.datetime(2026, 8, 22, 15, 30), "EXPENSE", 10000000.0, "Đầu tư sinh lời", main_bank, "Trích nạp tài khoản chứng khoán", "MANUAL"),
                (datetime.datetime(2026, 8, 23, 11, 0), "EXPENSE", 8000000.0, "Trả nợ gốc", sec_bank, "Thanh toán sao kê thẻ tín dụng", "MANUAL"),
                (datetime.datetime(2026, 8, 24, 8, 30), "EXPENSE", 85000.0, "Cà phê & Gặp gỡ", momo_w, "Cà phê sáng cùng đồng nghiệp", "AI_PARSED"),

                # July 2026
                (datetime.datetime(2026, 7, 1, 9, 0), "INCOME", 45000000.0, "Lương chính thức", main_bank, "Lương tháng 06", "MANUAL"),
                (datetime.datetime(2026, 7, 2, 10, 0), "EXPENSE", 12000000.0, "Nhà ở & Tiền thuê", sec_bank, "Tiền thuê nhà tháng 7", "MANUAL"),
                (datetime.datetime(2026, 7, 5, 15, 0), "EXPENSE", 1550000.0, "Hóa đơn & Tiện ích", momo_w, "Điện nước & Internet", "MANUAL"),
                (datetime.datetime(2026, 7, 10, 17, 0), "INCOME", 25000000.0, "Thưởng & Hoa hồng", main_bank, "Thưởng hiệu quả kinh doanh Q2", "MANUAL"),
                (datetime.datetime(2026, 7, 12, 11, 0), "EXPENSE", 16500000.0, "Du lịch & Nghỉ dưỡng", main_bank, "Nghỉ dưỡng resort InterContinental Đà Nẵng", "MANUAL"),
                (datetime.datetime(2026, 7, 15, 19, 0), "EXPENSE", 8200000.0, "Ăn uống & Thực phẩm", sec_bank, "Tổng chi ăn uống ẩm thực tháng 7", "MANUAL"),
                (datetime.datetime(2026, 7, 20, 16, 0), "EXPENSE", 4500000.0, "Mua sắm cá nhân", sec_bank, "Mua sắm trang phục công sở", "MANUAL"),
                (datetime.datetime(2026, 7, 25, 14, 0), "INCOME", 12000000.0, "Thu nhập phụ & Freelance", sec_bank, "Thù lao cố vấn dự án", "MANUAL"),

                # June 2026
                (datetime.datetime(2026, 6, 1, 9, 0), "INCOME", 45000000.0, "Lương chính thức", main_bank, "Lương tháng 05", "MANUAL"),
                (datetime.datetime(2026, 6, 2, 10, 0), "EXPENSE", 12000000.0, "Nhà ở & Tiền thuê", sec_bank, "Tiền thuê nhà tháng 6", "MANUAL"),
                (datetime.datetime(2026, 6, 8, 18, 30), "EXPENSE", 7800000.0, "Ăn uống & Thực phẩm", sec_bank, "Ăn uống sinh hoạt tháng 6", "MANUAL"),
                (datetime.datetime(2026, 6, 15, 11, 0), "INCOME", 8500000.0, "Lãi suất & Đầu tư", sec_bank, "Lãi trái phiếu & tiền gửi", "MANUAL"),
                (datetime.datetime(2026, 6, 18, 15, 0), "EXPENSE", 6000000.0, "Giáo dục & Học tập", main_bank, "Khóa học Chuyển đổi số & AI", "MANUAL"),
                (datetime.datetime(2026, 6, 25, 17, 0), "EXPENSE", 3800000.0, "Mua sắm cá nhân", momo_w, "Mua sắm thiết bị smarthome", "MANUAL")
            ]
        else:
            tcb = wallet_map.get("Techcombank") or list(wallet_map.values())[0]
            momo = wallet_map.get("Ví MoMo") or list(wallet_map.values())[0]
            cash = wallet_map.get("Tiền mặt") or list(wallet_map.values())[0]

            tx_samples = [
                # August 2026 Transactions
                (datetime.datetime(2026, 8, 1, 9, 0), "INCOME", 28000000.0, "Lương chính thức", tcb, "Lương tháng 07 công ty chuyển", "MANUAL"),
                (datetime.datetime(2026, 8, 2, 10, 30), "EXPENSE", 4500000.0, "Nhà ở & Tiền thuê", tcb, "Tiền thuê căn hộ tháng 8", "MANUAL"),
                (datetime.datetime(2026, 8, 3, 14, 15), "EXPENSE", 650000.0, "Hóa đơn & Tiện ích", momo, "Tiền điện sinh hoạt EVN", "MANUAL"),
                (datetime.datetime(2026, 8, 3, 19, 0), "EXPENSE", 320000.0, "Hóa đơn & Tiện ích", momo, "Tiền internet Viettel", "MANUAL"),
                (datetime.datetime(2026, 8, 5, 12, 0), "EXPENSE", 55000.0, "Ăn uống & Thực phẩm", momo, "Ăn trưa bún chả Hà Nội", "AI_PARSED"),
                (datetime.datetime(2026, 8, 6, 8, 30), "EXPENSE", 90000.0, "Đi lại & Xăng xe", cash, "Đổ xăng đầy bình Honda", "AI_PARSED"),
                (datetime.datetime(2026, 8, 7, 18, 45), "EXPENSE", 450000.0, "Ăn uống & Thực phẩm", tcb, "Đi siêu thị WinMart cuối tuần", "MANUAL"),
                (datetime.datetime(2026, 8, 8, 15, 0), "EXPENSE", 45000.0, "Cà phê & Gặp gỡ", momo, "Cà phê Highland với bạn", "AI_PARSED"),
                (datetime.datetime(2026, 8, 10, 11, 30), "INCOME", 4500000.0, "Thu nhập phụ & Freelance", tcb, "Thanh toán dự án thiết kế web", "MANUAL"),
                (datetime.datetime(2026, 8, 12, 20, 0), "EXPENSE", 1250000.0, "Ăn uống & Thực phẩm", tcb, "Ăn buffet lẩu Haidilao cuối tuần", "MANUAL"),
                (datetime.datetime(2026, 8, 14, 16, 0), "EXPENSE", 1850000.0, "Mua sắm cá nhân", tcb, "Mua giày chạy bộ Nike trên Shopee", "MANUAL"),
                (datetime.datetime(2026, 8, 15, 9, 30), "EXPENSE", 1200000.0, "Y tế & Sức khỏe", tcb, "Mua gói tập Gym 3 tháng", "MANUAL"),
                (datetime.datetime(2026, 8, 16, 12, 15), "EXPENSE", 45000.0, "Ăn uống & Thực phẩm", momo, "Ăn trưa bún bò Huế", "AI_PARSED"),
                (datetime.datetime(2026, 8, 17, 19, 30), "EXPENSE", 350000.0, "Mua sắm cá nhân", momo, "Mua áo thun Uniqlo", "AI_PARSED"),
                (datetime.datetime(2026, 8, 18, 20, 0), "EXPENSE", 260000.0, "Giải trí & Thư giãn", momo, "Xem phim CGV & bắp nước", "MANUAL"),
                (datetime.datetime(2026, 8, 19, 12, 0), "EXPENSE", 50000.0, "Ăn uống & Thực phẩm", cash, "Cơm trưa văn phòng", "MANUAL"),
                (datetime.datetime(2026, 8, 20, 8, 0), "EXPENSE", 35000.0, "Cà phê & Gặp gỡ", momo, "Bạc xỉu đá buổi sáng", "AI_PARSED"),

                # July 2026 Transactions
                (datetime.datetime(2026, 7, 1, 9, 0), "INCOME", 28000000.0, "Lương chính thức", tcb, "Lương tháng 06", "MANUAL"),
                (datetime.datetime(2026, 7, 2, 10, 0), "EXPENSE", 4500000.0, "Nhà ở & Tiền thuê", tcb, "Tiền thuê nhà tháng 7", "MANUAL"),
                (datetime.datetime(2026, 7, 5, 15, 0), "EXPENSE", 850000.0, "Hóa đơn & Tiện ích", momo, "Tiền điện & Nước", "MANUAL"),
                (datetime.datetime(2026, 7, 10, 18, 0), "EXPENSE", 4200000.0, "Ăn uống & Thực phẩm", tcb, "Ăn uống tháng 7", "MANUAL"),
                (datetime.datetime(2026, 7, 15, 14, 0), "EXPENSE", 1500000.0, "Mua sắm cá nhân", tcb, "Mua đồ gia dụng", "MANUAL"),
                (datetime.datetime(2026, 7, 20, 19, 0), "INCOME", 3000000.0, "Thưởng & Hoa hồng", tcb, "Thưởng dự án Q2", "MANUAL"),
                (datetime.datetime(2026, 7, 25, 9, 0), "EXPENSE", 800000.0, "Giải trí & Thư giãn", momo, "Đi chơi dã ngoại cuối tuần", "MANUAL"),

                # June 2026 Transactions
                (datetime.datetime(2026, 6, 1, 9, 0), "INCOME", 28000000.0, "Lương chính thức", tcb, "Lương tháng 05", "MANUAL"),
                (datetime.datetime(2026, 6, 2, 10, 0), "EXPENSE", 4500000.0, "Nhà ở & Tiền thuê", tcb, "Tiền thuê nhà tháng 6", "MANUAL"),
                (datetime.datetime(2026, 6, 10, 12, 0), "EXPENSE", 3900000.0, "Ăn uống & Thực phẩm", tcb, "Ăn uống tháng 6", "MANUAL"),
                (datetime.datetime(2026, 6, 15, 16, 0), "EXPENSE", 1200000.0, "Mua sắm cá nhân", momo, "Mua sách & quần áo", "MANUAL"),
                (datetime.datetime(2026, 6, 28, 14, 0), "INCOME", 2500000.0, "Thu nhập phụ & Freelance", tcb, "Freelance content", "MANUAL")
            ]

        for tx_date, tx_type, amount, cat_name, wallet_obj, note, created_by in tx_samples:
            cat_obj = cat_map.get(cat_name)
            if wallet_obj and cat_obj:
                tx = Transaction(
                    user_id=target_user.id,
                    wallet_id=wallet_obj.id,
                    category_id=cat_obj.id,
                    type=tx_type,
                    amount=amount,
                    transaction_date=tx_date,
                    note=note,
                    created_by_ai=created_by
                )
                db.add(tx)

def seed_database(db: Session):
    """Populates database with realistic Vietnamese seed data if empty."""
    # 1. Create Users
    admin_user = db.query(User).filter(User.email == "admin@fintrack.ai").first()
    if not admin_user:
        admin_user = User(
            email="admin@fintrack.ai",
            full_name="Quản Trị Viên FinTrack",
            hashed_password=get_password_hash("Admin@123456"),
            role="ADMIN",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        db.add(admin_user)
        db.flush()

    demo_user = db.query(User).filter(User.email == "user@fintrack.ai").first()
    if not demo_user:
        demo_user = User(
            email="user@fintrack.ai",
            full_name="Nguyễn Văn An",
            hashed_password=get_password_hash("User@123456"),
            role="USER",
            currency="VND",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        )
        db.add(demo_user)
        db.flush()

    # Populate financial data for admin_user and demo_user
    seed_user_financials(db, admin_user, is_admin=True)
    seed_user_financials(db, demo_user, is_admin=False)

    # 7. Seed Initial System Broadcasts & Personal Notifications
    existing_notifs = db.query(Notification).first()
    if not existing_notifs:
        sample_notifs = [
            Notification(
                user_id=demo_user.id,
                target_type="USER",
                title="🚨 Cảnh báo ngân sách: Danh mục Mua sắm đã vượt quá hạn mức 10%",
                message="Tổng chi tiêu Mua sắm cá nhân tháng 08/2026 đã đạt 3.300.000₫ / hạn mức 3.000.000₫ (vượt 10% hạn mức đề ra). FinTrack AI đề xuất bạn nên cân nhắc tạm hoãn các khoản chi sắm đồ công nghệ hoặc thời trang chưa cấp thiết trong tuần này.",
                type="BUDGET_ALERT",
                icon="triangle-exclamation",
                link_tab="budgets",
                is_read=False,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=25)
            ),
            Notification(
                user_id=demo_user.id,
                target_type="USER",
                title="💡 Lời khuyên tài chính AI: Đã tích lũy đạt 73% theo chuẩn 50/30/20",
                message="Tỷ lệ tích lũy & đầu tư tháng này đạt 73% mục tiêu tháng theo mô hình 50/30/20. Với tốc độ tiết kiệm hiện tại, bạn sẽ hoàn thành mục tiêu Quỹ dự phòng khẩn cấp sớm hơn kế hoạch 2 tháng!",
                type="AI_ADVICE",
                icon="lightbulb",
                link_tab="analytics",
                is_read=False,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            ),
            Notification(
                user_id=None,
                target_type="ALL",
                title="📢 Chào mừng nâng cấp thành công gói VIP Premium 👑",
                message="Chúc mừng bạn đã nâng cấp thành công gói VIP! Mở khóa toàn bộ quyền năng Cố vấn AI 24/7, tự động bóc tách hóa đơn OCR, không giới hạn ví tài khoản và xuất báo cáo tài chính chuyên nghiệp.",
                type="SYSTEM",
                icon="bullhorn",
                link_tab="subscription",
                is_read=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
            ),
            Notification(
                user_id=demo_user.id,
                target_type="USER",
                title="🚨 Cảnh báo ngân sách: Danh mục Ăn uống đạt 85% hạn mức",
                message="Chi tiêu cho Ăn uống & Thực phẩm đã chạm 4.250.000₫ / 5.000.000₫ (85% hạn mức). Còn 8 ngày trong chu kỳ tháng, hãy chú ý kiểm soát các bữa tiệc ngoài vào cuối tuần để giữ vững an toàn ngân sách.",
                type="BUDGET_ALERT",
                icon="triangle-exclamation",
                link_tab="budgets",
                is_read=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
            ),
            Notification(
                user_id=demo_user.id,
                target_type="USER",
                title="💡 Phân tích dòng tiền AI: Ghi nhận thu nhập Freelance (+4.500.000₫)",
                message="Tài khoản Techcombank vừa nhận 4.500.000₫ thù lao dự án Freelance. AI khuyến nghị trích ngay 1.500.000₫ vào Sổ tiết kiệm VPBank để gia tăng lãi suất kép và bảo toàn dòng tiền dương.",
                type="AI_ADVICE",
                icon="receipt",
                link_tab="transactions",
                is_read=False,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
            )
        ]
        for notif in sample_notifs:
            db.add(notif)

    # 8. Seed Sample Subscription Orders (VIP Billing Orders)
    existing_orders = db.query(SubscriptionOrder).first()
    if not existing_orders and demo_user:
        now = datetime.datetime.utcnow()
        sample_orders = [
            SubscriptionOrder(
                order_code="ORD-849201",
                user_id=demo_user.id,
                plan_code="PREMIUM",
                plan_duration_days=30,
                amount=99000.0,
                payment_method="MB_VIETQR",
                transfer_memo="NAP VIP 2 NGUYENVANAN 849201",
                status="PENDING",
                proof_image=None,
                created_at=now - datetime.timedelta(minutes=15),
                updated_at=now - datetime.timedelta(minutes=15)
            ),
            SubscriptionOrder(
                order_code="ORD-391204",
                user_id=demo_user.id,
                plan_code="PRO",
                plan_duration_days=30,
                amount=49000.0,
                payment_method="MB_VIETQR",
                transfer_memo="NAP VIP 2 NGUYENVANAN 391204",
                status="APPROVED",
                approved_by="admin@fintrack.ai",
                created_at=now - datetime.timedelta(days=1, hours=2),
                updated_at=now - datetime.timedelta(days=1)
            ),
            SubscriptionOrder(
                order_code="ORD-110294",
                user_id=demo_user.id,
                plan_code="PREMIUM",
                plan_duration_days=90,
                amount=279000.0,
                payment_method="MB_VIETQR",
                transfer_memo="NAP VIP 2 NGUYENVANAN 110294",
                status="REJECTED",
                rejection_reason="Mã đối soát chuyển khoản không trùng khớp hoặc giao dịch chưa ghi nhận biến động số dư tài khoản MB Bank.",
                approved_by="admin@fintrack.ai",
                created_at=now - datetime.timedelta(days=3),
                updated_at=now - datetime.timedelta(days=3, minutes=-30)
            ),
            SubscriptionOrder(
                order_code="ORD-559203",
                user_id=demo_user.id,
                plan_code="PREMIUM",
                plan_duration_days=365,
                amount=990000.0,
                payment_method="MB_VIETQR",
                transfer_memo="NAP VIP 2 NGUYENVANAN 559203",
                status="APPROVED",
                approved_by="admin@fintrack.ai",
                created_at=now - datetime.timedelta(days=10),
                updated_at=now - datetime.timedelta(days=10)
            )
        ]
        for ord_item in sample_orders:
            db.add(ord_item)

    # 9. Seed Sample Support Tickets
    existing_tickets = db.query(SupportTicket).first()
    if not existing_tickets and demo_user:
        now = datetime.datetime.utcnow()
        sample_tickets = [
            SupportTicket(
                ticket_code="TCK-92810",
                user_id=demo_user.id,
                title="Cần hỗ trợ tích hợp kết nối Open Banking MB Bank",
                category="TECHNICAL",
                priority="HIGH",
                status="OPEN",
                message="Tôi muốn hỏi cách bật tính năng Auto-Debit tự động đồng bộ số dư từ tài khoản MB Bank thực tế vào hệ thống FinTrack AI.",
                created_at=now - datetime.timedelta(minutes=45),
                updated_at=now - datetime.timedelta(minutes=45)
            ),
            SupportTicket(
                ticket_code="TCK-84192",
                user_id=demo_user.id,
                title="Thắc mắc về quyền lợi gói VIP Premium & Không giới hạn ví",
                category="BILLING",
                priority="MEDIUM",
                status="RESOLVED",
                message="Khi nâng cấp gói VIP Premium, tôi có thể tạo bao nhiêu ví tài khoản và có được hỗ trợ bóc tách hóa đơn tự động không?",
                admin_reply="Chào bạn, gói VIP Premium hỗ trợ không giới hạn số lượng ví tài khoản, cung cấp Trợ lý AI Financial Doctor 24/7 và bóc tách thông minh tiếng Việt không giới hạn tốc độ cao.",
                replied_by="admin@fintrack.ai",
                replied_at=now - datetime.timedelta(days=1),
                created_at=now - datetime.timedelta(days=1, hours=4),
                updated_at=now - datetime.timedelta(days=1)
            ),
            SupportTicket(
                ticket_code="TCK-71934",
                user_id=demo_user.id,
                title="Góp ý nâng cấp thuật toán phân loại 50/30/20 của AI",
                category="FEATURE_REQUEST",
                priority="LOW",
                status="IN_PROGRESS",
                message="Tôi thấy phân loại chi tiêu 50/30/20 rất hữu ích, hy vọng FinTrack AI bổ sung thêm biểu đồ 6 Hũ tài chính T. Harv Eker trong tương lai.",
                created_at=now - datetime.timedelta(days=2),
                updated_at=now - datetime.timedelta(days=2)
            ),
            SupportTicket(
                ticket_code="TCK-62915",
                user_id=demo_user.id,
                title="Lỗi hiển thị font chữ tiếng Việt trên file CSV xuất ra",
                category="TECHNICAL",
                priority="MEDIUM",
                status="RESOLVED",
                message="Khi tôi xuất file báo cáo người dùng CSV mở trên Excel bị lỗi font ký tự có dấu tiếng Việt.",
                admin_reply="Đội ngũ kỹ thuật đã nâng cấp bộ mã hóa UTF-8 BOM chuẩn (utf-8-sig). Hiện tại toàn bộ file CSV xuất ra mở trên Microsoft Excel hiển thị hoàn toàn chuẩn xác tiếng Việt có dấu.",
                replied_by="admin@fintrack.ai",
                replied_at=now - datetime.timedelta(hours=5),
                created_at=now - datetime.timedelta(days=4),
                updated_at=now - datetime.timedelta(hours=5)
            )
        ]
        for tck in sample_tickets:
            db.add(tck)

    db.commit()
    print("[SeedService] Database seed data populated successfully!")
