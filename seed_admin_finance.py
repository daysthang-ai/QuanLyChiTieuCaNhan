import os
import sys
import datetime

# Ensure utf-8 output encoding on Windows
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.database import SessionLocal
from backend.app.models import User, Wallet, Category, Transaction, Budget, SavingGoal

print("==================================================================")
print("CHUẨN HÓA TOÀN BỘ SỐ LIỆU TÀI CHÍNH CỦA ADMIN (admin@fintrack.ai)")
print("==================================================================")

db = SessionLocal()

try:
    # 1. Tìm hoặc kiểm tra Admin User
    admin = db.query(User).filter(User.email == "admin@fintrack.ai").first()
    if not admin:
        print("Không tìm thấy tài khoản admin@fintrack.ai, vui lòng kiểm tra database.")
        sys.exit(1)

    print(f"-> Đang chuẩn hóa dữ liệu tài chính cho: {admin.full_name} (ID: {admin.id})")

    # 2. Xóa các ví, giao dịch, ngân sách, danh mục cũ của admin để nạp mới chuẩn xác
    print("-> Đang làm sạch dữ liệu tài chính cũ của Admin...")
    db.query(Transaction).filter(Transaction.user_id == admin.id).delete()
    db.query(Budget).filter(Budget.user_id == admin.id).delete()
    db.query(SavingGoal).filter(SavingGoal.user_id == admin.id).delete()
    db.query(Wallet).filter(Wallet.user_id == admin.id).delete()
    db.query(Category).filter(Category.user_id == admin.id).delete()
    db.commit()

    # 3. Tạo 5 Ví Chuẩn (Tổng tài sản ròng: ~85.500.000 đ)
    print("-> Đang tạo 5 ví tài chính chuẩn...")
    w_mb = Wallet(
        user_id=admin.id,
        name="Ví MB Bank",
        wallet_type="BANK",
        balance=35000000.0,
        currency="VND",
        color="#3B82F6",
        icon="building-columns",
        account_number_masked="****7569",
        bank_code="MB",
        is_active=True,
        wallet_scope="virtual"
    )
    w_tcb = Wallet(
        user_id=admin.id,
        name="Sổ Tiết Kiệm (Techcombank)",
        wallet_type="SAVINGS",
        balance=40000000.0,
        currency="VND",
        color="#10B981",
        icon="piggy-bank",
        account_number_masked="****8899",
        bank_code="TCB",
        is_active=True,
        wallet_scope="virtual"
    )
    w_momo = Wallet(
        user_id=admin.id,
        name="Ví MoMo",
        wallet_type="EWALLET",
        balance=5000000.0,
        currency="VND",
        color="#EC4899",
        icon="mobile-screen",
        is_active=True,
        wallet_scope="virtual"
    )
    w_cash = Wallet(
        user_id=admin.id,
        name="Tiền mặt",
        wallet_type="CASH",
        balance=5000000.0,
        currency="VND",
        color="#00FFAA",
        icon="money-bill-1-wave",
        is_active=True,
        wallet_scope="virtual"
    )
    w_vip = Wallet(
        user_id=admin.id,
        name="Ví Dịch Vụ & VIP FinTrack",
        wallet_type="BANK",
        balance=500000.0,
        currency="VND",
        color="#B026FF",
        icon="crown",
        is_active=True,
        wallet_scope="real"
    )
    db.add_all([w_mb, w_tcb, w_momo, w_cash, w_vip])
    db.commit()
    for w in [w_mb, w_tcb, w_momo, w_cash, w_vip]:
        db.refresh(w)
    print(f"-> Đã tạo 5 ví với tổng tài sản ròng: 85.500.000 đ")

    # 4. Tạo Danh Mục Thu - Chi Chuẩn Neon (6 danh mục chi tiêu + 2 danh mục thu nhập)
    print("-> Đang tạo các danh mục thu chi chuẩn Neon...")
    cat_inc_salary = Category(user_id=admin.id, name="Lương công ty", type="INCOME", group="INCOME", color="#00FFAA", icon="building")
    cat_inc_freelance = Category(user_id=admin.id, name="Thu nhập Freelance & Dự án AI", type="INCOME", group="INCOME", color="#00E5FF", icon="laptop-code")

    cat_exp_rent = Category(user_id=admin.id, name="Tiền thuê nhà & Dịch vụ", type="EXPENSE", group="NEEDS", color="#B026FF", icon="house-chimney")
    cat_exp_food = Category(user_id=admin.id, name="Ăn uống & Thực phẩm", type="EXPENSE", group="NEEDS", color="#00FFAA", icon="utensils")
    cat_exp_shopping = Category(user_id=admin.id, name="Mua sắm cá nhân & Đồ công nghệ", type="EXPENSE", group="WANTS", color="#00E5FF", icon="bag-shopping")
    cat_exp_coffee = Category(user_id=admin.id, name="Cà phê & Gặp gỡ đối tác", type="EXPENSE", group="WANTS", color="#FF007A", icon="mug-hot")
    cat_exp_transport = Category(user_id=admin.id, name="Đi lại & Xăng xe", type="EXPENSE", group="NEEDS", color="#FFAA00", icon="gas-pump")
    cat_exp_health = Category(user_id=admin.id, name="Gói tập Gym & Sức khỏe", type="EXPENSE", group="WANTS", color="#3B82F6", icon="dumbbell")

    db.add_all([
        cat_inc_salary, cat_inc_freelance,
        cat_exp_rent, cat_exp_food, cat_exp_shopping,
        cat_exp_coffee, cat_exp_transport, cat_exp_health
    ])
    db.commit()
    for c in [cat_inc_salary, cat_inc_freelance, cat_exp_rent, cat_exp_food, cat_exp_shopping, cat_exp_coffee, cat_exp_transport, cat_exp_health]:
        db.refresh(c)

    tx_list = []

    # =========================================================================
    # 5. DỮ LIỆU THU - CHI THÁNG HIỆN TẠI (Tháng 09/2026): Thu 45M, Chi 18.45M
    # =========================================================================
    print("-> Đang tạo các giao dịch Tháng 09/2026 (Tháng hiện tại - Thu 45M, Chi 18.45M, Tiết kiệm 26.55M / 59%)...")
    
    # Thu nhập tháng 9 (+45.000.000 đ)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_inc_salary.id,
        type="INCOME",
        amount=35000000.0,
        note="Lương tháng 09/2026 Công ty Công nghệ",
        transaction_date=datetime.datetime(2026, 9, 1, 9, 0, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_inc_freelance.id,
        type="INCOME",
        amount=10000000.0,
        note="Thanh toán tạm ứng hợp đồng dự án AI FinTrack",
        transaction_date=datetime.datetime(2026, 9, 1, 14, 30, 0)
    ))

    # Chi tiêu tháng 9 (-18.450.000 đ, đủ 6 danh mục neon)
    # 1. Tiền thuê nhà: 6.500.000 đ (NEEDS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_rent.id,
        type="EXPENSE",
        amount=6500000.0,
        note="Tiền thuê căn hộ Vinhomes & phí quản lý dịch vụ tháng 9",
        transaction_date=datetime.datetime(2026, 9, 1, 8, 30, 0)
    ))
    # 2. Ăn uống & thực phẩm: 4.200.000 đ (1.8M + 1.4M + 1M) (NEEDS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1800000.0,
        note="Siêu thị WinMart mua thực phẩm tươi sống tuần 1",
        transaction_date=datetime.datetime(2026, 9, 1, 10, 0, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1400000.0,
        note="Ăn uống liên hoan đối tác & gia đình đầu tháng",
        transaction_date=datetime.datetime(2026, 9, 1, 12, 30, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1000000.0,
        note="Mua đồ ăn sáng & thực phẩm tươi sống tuần 2",
        transaction_date=datetime.datetime(2026, 9, 1, 18, 0, 0)
    ))
    # 3. Mua sắm công nghệ: 3.800.000 đ (WANTS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_shopping.id,
        type="EXPENSE",
        amount=3800000.0,
        note="Nâng cấp bàn phím cơ Keychron & màn hình Dell 4K",
        transaction_date=datetime.datetime(2026, 9, 1, 9, 15, 0)
    ))
    # 4. Cà phê đối tác: 1.450.000 đ (650k + 450k + 350k) (WANTS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=650000.0,
        note="Highlands Coffee tiếp đối tác AI FinTrack",
        transaction_date=datetime.datetime(2026, 9, 1, 10, 30, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=450000.0,
        note="Starbucks gặp khách hàng tư vấn tài chính",
        transaction_date=datetime.datetime(2026, 9, 1, 14, 0, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=350000.0,
        note="The Coffee House thảo luận kiến trúc phần mềm",
        transaction_date=datetime.datetime(2026, 9, 1, 16, 30, 0)
    ))
    # 5. Đi lại xăng xe: 900.000 đ (500k + 400k) (NEEDS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_transport.id,
        type="EXPENSE",
        amount=500000.0,
        note="Đổ xăng xe ô tô đầy bình đầu tháng",
        transaction_date=datetime.datetime(2026, 9, 1, 7, 45, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_transport.id,
        type="EXPENSE",
        amount=400000.0,
        note="Nạp thẻ VETC & phí đỗ xe tháng 9",
        transaction_date=datetime.datetime(2026, 9, 1, 11, 20, 0)
    ))
    # 6. Sức khỏe & Gym: 1.600.000 đ (WANTS)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_health.id,
        type="EXPENSE",
        amount=1600000.0,
        note="Gia hạn hội viên California Fitness & Yoga tháng 9",
        transaction_date=datetime.datetime(2026, 9, 1, 6, 30, 0)
    ))

    # =========================================================================
    # 6. DỮ LIỆU THU - CHI THÁNG 08/2026: Thu 45M, Chi 18.45M, Tiết kiệm 26.55M
    # =========================================================================
    print("-> Đang tạo các giao dịch Tháng 08/2026 (Thu 45M, Chi 18.45M, Tiết kiệm 26.55M / 59%)...")
    
    # Thu nhập tháng 8 (+45.000.000 đ)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_inc_salary.id,
        type="INCOME",
        amount=35000000.0,
        note="Lương tháng 08/2026 Công ty Công nghệ",
        transaction_date=datetime.datetime(2026, 8, 5, 9, 0, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_inc_freelance.id,
        type="INCOME",
        amount=10000000.0,
        note="Thanh toán hợp đồng dự án AI FinTech",
        transaction_date=datetime.datetime(2026, 8, 15, 14, 30, 0)
    ))

    # Chi tiêu tháng 8 (-18.450.000 đ)
    # 1. Tiền nhà: 6.500.000 đ
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_rent.id,
        type="EXPENSE",
        amount=6500000.0,
        note="Tiền thuê căn hộ Vinhomes & phí quản lý dịch vụ tháng 8",
        transaction_date=datetime.datetime(2026, 8, 2, 10, 0, 0)
    ))
    # 2. Ăn uống: 4.200.000 đ (1.8M + 1.4M + 1M)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1800000.0,
        note="Siêu thị WinMart mua thực phẩm tuần 1",
        transaction_date=datetime.datetime(2026, 8, 6, 18, 30, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1400000.0,
        note="Ăn tối liên hoan gia đình cuối tuần",
        transaction_date=datetime.datetime(2026, 8, 12, 19, 45, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_food.id,
        type="EXPENSE",
        amount=1000000.0,
        note="Mua đồ ăn sáng & thực phẩm tươi sống tuần 3",
        transaction_date=datetime.datetime(2026, 8, 20, 8, 30, 0)
    ))
    # 3. Mua sắm công nghệ: 3.800.000 đ
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_shopping.id,
        type="EXPENSE",
        amount=3800000.0,
        note="Nâng cấp bàn phím cơ Keychron & màn hình Dell 4K",
        transaction_date=datetime.datetime(2026, 8, 10, 16, 0, 0)
    ))
    # 4. Cà phê tiếp khách: 1.450.000 đ (650k + 450k + 350k)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=650000.0,
        note="Highlands Coffee tiếp đối tác AI FinTrack",
        transaction_date=datetime.datetime(2026, 8, 8, 15, 0, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=450000.0,
        note="Starbucks gặp khách hàng tư vấn tài chính",
        transaction_date=datetime.datetime(2026, 8, 18, 10, 30, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_momo.id,
        category_id=cat_exp_coffee.id,
        type="EXPENSE",
        amount=350000.0,
        note="The Coffee House thảo luận kiến trúc phần mềm",
        transaction_date=datetime.datetime(2026, 8, 25, 14, 0, 0)
    ))
    # 5. Đi lại xăng xe: 900.000 đ (500k + 400k)
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_transport.id,
        type="EXPENSE",
        amount=500000.0,
        note="Đổ xăng xe ô tô đầy bình",
        transaction_date=datetime.datetime(2026, 8, 4, 7, 30, 0)
    ))
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_cash.id,
        category_id=cat_exp_transport.id,
        type="EXPENSE",
        amount=400000.0,
        note="Nạp thẻ VETC & phí đỗ xe tháng 8",
        transaction_date=datetime.datetime(2026, 8, 16, 11, 15, 0)
    ))
    # 6. Sức khỏe gym: 1.600.000 đ
    tx_list.append(Transaction(
        user_id=admin.id,
        wallet_id=w_mb.id,
        category_id=cat_exp_health.id,
        type="EXPENSE",
        amount=1600000.0,
        note="Gói hội viên California Fitness & Yoga 3 tháng",
        transaction_date=datetime.datetime(2026, 8, 3, 11, 0, 0)
    ))

    # =========================================================================
    # 7. LỊCH SỬ DÒNG TIỀN 5 THÁNG TRƯỚC (T3, T4, T5, T6, T7/2026)
    # =========================================================================
    print("-> Đang tạo lịch sử dòng tiền lũy tiến từ T3/2026 đến T7/2026...")
    historical_months = [
        # (year, month, income, expense)
        (2026, 3, 38000000.0, 16000000.0),
        (2026, 4, 40000000.0, 17000000.0),
        (2026, 5, 42000000.0, 18000000.0),
        (2026, 6, 40000000.0, 15000000.0),
        (2026, 7, 43000000.0, 17500000.0)
    ]

    for y, m, inc_total, exp_total in historical_months:
        # 1 Thu nhập
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_mb.id,
            category_id=cat_inc_salary.id,
            type="INCOME",
            amount=35000000.0,
            note=f"Lương tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 5, 9, 0, 0)
        ))
        if inc_total > 35000000.0:
            tx_list.append(Transaction(
                user_id=admin.id,
                wallet_id=w_momo.id,
                category_id=cat_inc_freelance.id,
                type="INCOME",
                amount=inc_total - 35000000.0,
                note=f"Thù lao dự án AI tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 18, 15, 0, 0)
            ))
        # Chi tiêu phân bổ đủ 6 danh mục
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_mb.id,
            category_id=cat_exp_rent.id,
            type="EXPENSE",
            amount=6500000.0,
            note=f"Tiền nhà tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 2, 10, 0, 0)
        ))
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_cash.id,
            category_id=cat_exp_food.id,
            type="EXPENSE",
            amount=exp_total * 0.25,
            note=f"Ăn uống sinh hoạt tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 10, 19, 0, 0)
        ))
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_mb.id,
            category_id=cat_exp_shopping.id,
            type="EXPENSE",
            amount=exp_total * 0.2,
            note=f"Mua sắm cá nhân tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 14, 16, 0, 0)
        ))
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_momo.id,
            category_id=cat_exp_coffee.id,
            type="EXPENSE",
            amount=exp_total * 0.08,
            note=f"Cafe giao lưu tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 20, 14, 0, 0)
        ))
        tx_list.append(Transaction(
            user_id=admin.id,
            wallet_id=w_cash.id,
            category_id=cat_exp_transport.id,
            type="EXPENSE",
            amount=exp_total * 0.05,
            note=f"Xăng xe đi lại tháng {m:02d}/{y}",
            transaction_date=datetime.datetime(y, m, 8, 8, 0, 0)
        ))
        rem_exp = exp_total - 6500000.0 - (exp_total * (0.25 + 0.2 + 0.08 + 0.05))
        if rem_exp > 0:
            tx_list.append(Transaction(
                user_id=admin.id,
                wallet_id=w_mb.id,
                category_id=cat_exp_health.id,
                type="EXPENSE",
                amount=rem_exp,
                note=f"Chăm sóc sức khỏe & thể thao tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 24, 17, 0, 0)
            ))

    db.add_all(tx_list)
    db.commit()
    print(f"-> Đã nạp thành công {len(tx_list)} giao dịch thu chi cho chuỗi 7 tháng liên tục (T3 - T9/2026)!")

    # =========================================================================
    # 8. THIẾT LẬP HẠN MỨC NGÂN SÁCH (Budgets) CHO CẢ THÁNG 08/2026 VÀ 09/2026
    # =========================================================================
    print("-> Đang thiết lập các hạn mức ngân sách tháng 08/2026 và tháng 09/2026...")
    budgets_data = [
        # THÁNG 09/2026 (Tháng hiện tại)
        # 1. Ăn uống: Đã chi 4.2M / Hạn mức 6M (70.0% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_food.id,
            amount_limit=6000000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),
        # 2. Mua sắm: Đã chi 3.8M / Hạn mức 4M (95.0% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_shopping.id,
            amount_limit=4000000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),
        # 3. Tiền nhà: Đã chi 6.5M / Hạn mức 7M (92.8% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_rent.id,
            amount_limit=7000000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),
        # 4. Cafe: Đã chi 1.45M / Hạn mức 2M (72.5% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_coffee.id,
            amount_limit=2000000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),
        # 5. Đi lại: Đã chi 0.9M / Hạn mức 1.5M (60.0% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_transport.id,
            amount_limit=1500000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),
        # 6. Sức khỏe: Đã chi 1.6M / Hạn mức 2M (80.0% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_health.id,
            amount_limit=2000000.0,
            period="MONTHLY",
            month_year="2026-09"
        ),

        # THÁNG 08/2026 (Tháng trước)
        # 1. Ăn uống: Đã chi 4.2M / Hạn mức 6M (70.0% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_food.id,
            amount_limit=6000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # 2. Mua sắm: Đã chi 3.8M / Hạn mức 4M (95.0% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_shopping.id,
            amount_limit=4000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # 3. Tiền nhà: Đã chi 6.5M / Hạn mức 7M (92.8% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_rent.id,
            amount_limit=7000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # 4. Cafe: Đã chi 1.45M / Hạn mức 2M (72.5% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_coffee.id,
            amount_limit=2000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # 5. Đi lại: Đã chi 0.9M / Hạn mức 1.5M (60.0% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_transport.id,
            amount_limit=1500000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # 6. Sức khỏe: Đã chi 1.6M / Hạn mức 2M (80.0% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_health.id,
            amount_limit=2000000.0,
            period="MONTHLY",
            month_year="2026-08"
        )
    ]
    db.add_all(budgets_data)
    db.commit()
    print("-> Đã thiết lập toàn bộ 12 hạn mức ngân sách chuẩn cho cả Tháng 8 và Tháng 9/2026.")

    # =========================================================================
    # 9. THIẾT LẬP MỤC TIÊU TIẾT KIỆM (Saving Goals) CHO ADMIN
    # =========================================================================
    print("-> Đang thiết lập mục tiêu tích lũy cho Admin...")
    g1 = SavingGoal(
        user_id=admin.id,
        name="Quỹ Khẩn Cấp 6 Tháng",
        target_amount=60000000.0,
        current_amount=40000000.0,
        target_date=datetime.date(2026, 12, 31),
        color="#10B981",
        icon="shield-halved",
        status="ACTIVE"
    )
    g2 = SavingGoal(
        user_id=admin.id,
        name="Đổi Macbook M3 Max & AI Workstation",
        target_amount=50000000.0,
        current_amount=25000000.0,
        target_date=datetime.date(2026, 10, 30),
        color="#3B82F6",
        icon="laptop",
        status="ACTIVE"
    )
    db.add_all([g1, g2])
    db.commit()
    print("-> Đã tạo 2 mục tiêu tiết kiệm cho Admin.")

    # =========================================================================
    # PHẦN B: CHUẨN HÓA SỐ LIỆU TÀI CHÍNH USER DEMO (user@fintrack.ai)
    # =========================================================================
    print("\n------------------------------------------------------------------")
    print("CHUẨN HÓA DỮ LIỆU TÀI CHÍNH CHO USER DEMO (user@fintrack.ai)")
    print("------------------------------------------------------------------")
    
    user_demo = db.query(User).filter(User.email == "user@fintrack.ai").first()
    if user_demo:
        print(f"-> Đang chuẩn hóa dữ liệu tài chính cho: {user_demo.full_name} (ID: {user_demo.id})")

        # 1. Làm sạch dữ liệu cũ của user_demo
        db.query(Transaction).filter(Transaction.user_id == user_demo.id).delete()
        db.query(Budget).filter(Budget.user_id == user_demo.id).delete()
        db.query(SavingGoal).filter(SavingGoal.user_id == user_demo.id).delete()
        db.query(Wallet).filter(Wallet.user_id == user_demo.id).delete()
        db.query(Category).filter(Category.user_id == user_demo.id).delete()
        db.commit()

        # 2. Tạo ví tài chính chuẩn cho User Demo (Tổng tài sản ròng: 16.000.000 đ)
        w_mb_u = Wallet(
            user_id=user_demo.id,
            name="Ví MB Bank",
            wallet_type="BANK",
            balance=12000000.0,
            currency="VND",
            color="#3B82F6",
            icon="building-columns",
            account_number_masked="****1234",
            bank_code="MB",
            is_active=True,
            wallet_scope="virtual"
        )
        w_momo_u = Wallet(
            user_id=user_demo.id,
            name="Ví MoMo",
            wallet_type="EWALLET",
            balance=2500000.0,
            currency="VND",
            color="#EC4899",
            icon="mobile-screen",
            is_active=True,
            wallet_scope="virtual"
        )
        w_cash_u = Wallet(
            user_id=user_demo.id,
            name="Tiền mặt",
            wallet_type="CASH",
            balance=1500000.0,
            currency="VND",
            color="#00FFAA",
            icon="money-bill-1-wave",
            is_active=True,
            wallet_scope="virtual"
        )
        w_vip_u = Wallet(
            user_id=user_demo.id,
            name="Ví Dịch Vụ & VIP FinTrack",
            wallet_type="BANK",
            balance=0.0,
            currency="VND",
            color="#B026FF",
            icon="crown",
            is_active=True,
            wallet_scope="real"
        )
        db.add_all([w_mb_u, w_momo_u, w_cash_u, w_vip_u])
        db.commit()
        for w in [w_mb_u, w_momo_u, w_cash_u, w_vip_u]:
            db.refresh(w)
        print("-> Đã tạo 4 ví tài chính cho User Demo với tổng tài sản ròng: 16.000.000 đ")

        # 3. Tạo danh mục thu - chi cho User Demo
        cat_u_salary = Category(user_id=user_demo.id, name="Lương cơ bản", type="INCOME", group="INCOME", color="#00FFAA", icon="building")
        cat_u_bonus = Category(user_id=user_demo.id, name="Thưởng & Làm thêm", type="INCOME", group="INCOME", color="#00E5FF", icon="briefcase")
        
        cat_u_rent = Category(user_id=user_demo.id, name="Tiền phòng trọ & Dịch vụ", type="EXPENSE", group="NEEDS", color="#B026FF", icon="house")
        cat_u_food = Category(user_id=user_demo.id, name="Ăn uống hàng ngày", type="EXPENSE", group="NEEDS", color="#00FFAA", icon="utensils")
        cat_u_transport = Category(user_id=user_demo.id, name="Xăng xe & Đi lại", type="EXPENSE", group="NEEDS", color="#FFAA00", icon="gas-pump")
        cat_u_shopping = Category(user_id=user_demo.id, name="Mua sắm & Tiêu vặt", type="EXPENSE", group="WANTS", color="#00E5FF", icon="bag-shopping")
        cat_u_coffee = Category(user_id=user_demo.id, name="Cà phê & Gặp gỡ", type="EXPENSE", group="WANTS", color="#FF007A", icon="mug-hot")

        db.add_all([cat_u_salary, cat_u_bonus, cat_u_rent, cat_u_food, cat_u_transport, cat_u_shopping, cat_u_coffee])
        db.commit()
        for c in [cat_u_salary, cat_u_bonus, cat_u_rent, cat_u_food, cat_u_transport, cat_u_shopping, cat_u_coffee]:
            db.refresh(c)

        # 4. Giao dịch mẫu cho User Demo
        tx_user_list = []

        # Tháng 09/2026 (Hiện tại - Thu 15M, Chi 7.8M, Tiết kiệm 7.2M / 48%)
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_mb_u.id,
            category_id=cat_u_salary.id,
            type="INCOME",
            amount=15000000.0,
            note="Lương cơ bản tháng 09/2026",
            transaction_date=datetime.datetime(2026, 9, 1, 9, 0, 0)
        ))
        # Chi tiêu T9
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_mb_u.id,
            category_id=cat_u_rent.id,
            type="EXPENSE",
            amount=2500000.0,
            note="Tiền thuê phòng trọ & điện nước tháng 9",
            transaction_date=datetime.datetime(2026, 9, 1, 8, 30, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_cash_u.id,
            category_id=cat_u_food.id,
            type="EXPENSE",
            amount=1800000.0,
            note="Đi chợ mua thực phẩm nấu ăn tuần 1",
            transaction_date=datetime.datetime(2026, 9, 1, 10, 0, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_momo_u.id,
            category_id=cat_u_food.id,
            type="EXPENSE",
            amount=1400000.0,
            note="Ăn trưa công ty & liên hoan bạn bè",
            transaction_date=datetime.datetime(2026, 9, 1, 12, 30, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_cash_u.id,
            category_id=cat_u_transport.id,
            type="EXPENSE",
            amount=600000.0,
            note="Đổ xăng xe máy & thay dầu nhớt xe",
            transaction_date=datetime.datetime(2026, 9, 1, 7, 45, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_momo_u.id,
            category_id=cat_u_shopping.id,
            type="EXPENSE",
            amount=1500000.0,
            note="Mua sắm quần áo & đồ gia dụng cá nhân",
            transaction_date=datetime.datetime(2026, 9, 1, 15, 30, 0)
        ))

        # Tháng 08/2026 (Thu 15M, Chi 7.5M, Tiết kiệm 7.5M)
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_mb_u.id,
            category_id=cat_u_salary.id,
            type="INCOME",
            amount=15000000.0,
            note="Lương cơ bản tháng 08/2026",
            transaction_date=datetime.datetime(2026, 8, 5, 9, 0, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_mb_u.id,
            category_id=cat_u_rent.id,
            type="EXPENSE",
            amount=2500000.0,
            note="Tiền phòng trọ tháng 8",
            transaction_date=datetime.datetime(2026, 8, 2, 10, 0, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_cash_u.id,
            category_id=cat_u_food.id,
            type="EXPENSE",
            amount=3000000.0,
            note="Ăn uống & sinh hoạt tháng 8",
            transaction_date=datetime.datetime(2026, 8, 10, 19, 0, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_cash_u.id,
            category_id=cat_u_transport.id,
            type="EXPENSE",
            amount=500000.0,
            note="Xăng xe đi lại tháng 8",
            transaction_date=datetime.datetime(2026, 8, 4, 8, 0, 0)
        ))
        tx_user_list.append(Transaction(
            user_id=user_demo.id,
            wallet_id=w_momo_u.id,
            category_id=cat_u_shopping.id,
            type="EXPENSE",
            amount=1500000.0,
            note="Mua sắm tiêu vặt tháng 8",
            transaction_date=datetime.datetime(2026, 8, 15, 16, 0, 0)
        ))

        # Lịch sử 5 tháng trước (T3, T4, T5, T6, T7/2026)
        user_history = [
            (2026, 3, 14000000.0, 7000000.0),
            (2026, 4, 14000000.0, 7200000.0),
            (2026, 5, 15000000.0, 7500000.0),
            (2026, 6, 14500000.0, 7000000.0),
            (2026, 7, 15000000.0, 7600000.0)
        ]
        for y, m, inc_val, exp_val in user_history:
            tx_user_list.append(Transaction(
                user_id=user_demo.id,
                wallet_id=w_mb_u.id,
                category_id=cat_u_salary.id,
                type="INCOME",
                amount=inc_val,
                note=f"Lương tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 5, 9, 0, 0)
            ))
            tx_user_list.append(Transaction(
                user_id=user_demo.id,
                wallet_id=w_mb_u.id,
                category_id=cat_u_rent.id,
                type="EXPENSE",
                amount=2500000.0,
                note=f"Tiền nhà trọ tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 2, 10, 0, 0)
            ))
            tx_user_list.append(Transaction(
                user_id=user_demo.id,
                wallet_id=w_cash_u.id,
                category_id=cat_u_food.id,
                type="EXPENSE",
                amount=exp_val * 0.45,
                note=f"Ăn uống tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 10, 19, 0, 0)
            ))
            tx_user_list.append(Transaction(
                user_id=user_demo.id,
                wallet_id=w_cash_u.id,
                category_id=cat_u_transport.id,
                type="EXPENSE",
                amount=exp_val * 0.08,
                note=f"Xăng xe tháng {m:02d}/{y}",
                transaction_date=datetime.datetime(y, m, 8, 8, 0, 0)
            ))
            rem_exp_u = exp_val - 2500000.0 - (exp_val * 0.45) - (exp_val * 0.08)
            if rem_exp_u > 0:
                tx_user_list.append(Transaction(
                    user_id=user_demo.id,
                    wallet_id=w_momo_u.id,
                    category_id=cat_u_shopping.id,
                    type="EXPENSE",
                    amount=rem_exp_u,
                    note=f"Mua sắm tiêu dùng tháng {m:02d}/{y}",
                    transaction_date=datetime.datetime(y, m, 16, 15, 0, 0)
                ))

        db.add_all(tx_user_list)
        db.commit()
        print(f"-> Đã nạp thành công {len(tx_user_list)} giao dịch cho User Demo cho chuỗi 7 tháng!")

        # 5. Hạn mức ngân sách cho User Demo (Tháng 09/2026 & Tháng 08/2026)
        user_budgets = [
            # Tháng 09/2026
            Budget(user_id=user_demo.id, category_id=cat_u_food.id, amount_limit=4000000.0, period="MONTHLY", month_year="2026-09"),
            Budget(user_id=user_demo.id, category_id=cat_u_rent.id, amount_limit=3000000.0, period="MONTHLY", month_year="2026-09"),
            Budget(user_id=user_demo.id, category_id=cat_u_shopping.id, amount_limit=2000000.0, period="MONTHLY", month_year="2026-09"),
            Budget(user_id=user_demo.id, category_id=cat_u_transport.id, amount_limit=1000000.0, period="MONTHLY", month_year="2026-09"),
            # Tháng 08/2026
            Budget(user_id=user_demo.id, category_id=cat_u_food.id, amount_limit=4000000.0, period="MONTHLY", month_year="2026-08"),
            Budget(user_id=user_demo.id, category_id=cat_u_rent.id, amount_limit=3000000.0, period="MONTHLY", month_year="2026-08"),
            Budget(user_id=user_demo.id, category_id=cat_u_shopping.id, amount_limit=2000000.0, period="MONTHLY", month_year="2026-08"),
            Budget(user_id=user_demo.id, category_id=cat_u_transport.id, amount_limit=1000000.0, period="MONTHLY", month_year="2026-08"),
        ]
        db.add_all(user_budgets)
        db.commit()
        print("-> Đã tạo 8 hạn mức ngân sách chuẩn cho User Demo.")

        # 6. Mục tiêu tiết kiệm cho User Demo
        ug1 = SavingGoal(
            user_id=user_demo.id,
            name="Quỹ Tiết Kiệm Dự Phòng",
            target_amount=30000000.0,
            current_amount=12000000.0,
            target_date=datetime.date(2026, 12, 31),
            color="#10B981",
            icon="shield-halved",
            status="ACTIVE"
        )
        ug2 = SavingGoal(
            user_id=user_demo.id,
            name="Mua Xe Máy Mới (Honda AirBlade)",
            target_amount=25000000.0,
            current_amount=8000000.0,
            target_date=datetime.date(2026, 11, 30),
            color="#3B82F6",
            icon="motorcycle",
            status="ACTIVE"
        )
        db.add_all([ug1, ug2])
        db.commit()
        print("-> Đã tạo 2 mục tiêu tiết kiệm cho User Demo.")

    print("\n==================================================================")
    print("HOÀN TẤT CHUẨN HÓA TOÀN BỘ SỐ LIỆU TÀI CHÍNH ADMIN & USER DEMO 100%!")
    print("==================================================================")

except Exception as e:
    db.rollback()
    print(f"LỖI: {e}")
finally:
    db.close()

