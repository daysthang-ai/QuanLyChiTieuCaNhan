import os
import sys
import datetime

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

    # 4. Tạo Danh Mục Thu - Chi Chuẩn Neon
    print("-> Đang tạo các danh mục thu chi...")
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

    # 5. Tạo Dữ Liệu Thu - Chi Tháng Hiện Tại (Tháng 08/2026)
    print("-> Đang tạo các giao dịch tháng 08/2026 (Thu: 45M, Chi: 18.45M)...")
    tx_list = []

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
        note="Tiền thuê căn hộ Vinhomes & phí quản lý dịch vụ",
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
        note="Nạp thẻ VETC & phí đỗ xe tháng",
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

    # 6. Tạo Lịch Sử Dòng Tiền 5 Tháng Trước (T3, T4, T5, T6, T7/2026)
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
        # Chi tiêu phân bổ
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
    print(f"-> Đã nạp thành công {len(tx_list)} giao dịch thu chi cho 6 tháng!")

    # 7. Thiết Lập Hạn Mức Ngân Sách Tháng 08/2026
    print("-> Đang thiết lập các hạn mức ngân sách tháng 08/2026...")
    budgets_data = [
        # Ăn uống: Đã chi 4.2M / Hạn mức 6M (70% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_food.id,
            amount_limit=6000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # Mua sắm: Đã chi 3.8M / Hạn mức 4M (95% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_shopping.id,
            amount_limit=4000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # Tiền nhà: Đã chi 6.5M / Hạn mức 7M (92.8% - Cảnh báo)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_rent.id,
            amount_limit=7000000.0,
            period="MONTHLY",
            month_year="2026-08"
        ),
        # Cafe: Đã chi 1.45M / Hạn mức 2M (72.5% - An toàn)
        Budget(
            user_id=admin.id,
            category_id=cat_exp_coffee.id,
            amount_limit=2000000.0,
            period="MONTHLY",
            month_year="2026-08"
        )
    ]
    db.add_all(budgets_data)
    db.commit()
    print("-> Đã thiết lập 4 hạn mức ngân sách chuẩn.")

    # 8. Thiết lập Mục Tiêu Tiết Kiệm (Saving Goals)
    print("-> Đang thiết lập mục tiêu tích lũy...")
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
    print("-> Đã tạo 2 mục tiêu tiết kiệm.")

    print("\n==================================================================")
    print("HOÀN TẤT CHUẨN HÓA TOÀN BỘ SỐ LIỆU TÀI CHÍNH ADMIN THÀNH CÔNG 100%!")
    print("==================================================================")

except Exception as e:
    db.rollback()
    print(f"LỖI: {e}")
finally:
    db.close()
