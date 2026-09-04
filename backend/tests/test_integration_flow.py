import datetime
import pytest
from fastapi.testclient import TestClient

from backend.app.utils.sanitizer import sanitize_text_for_ai, mask_account_number


def test_e2e_financial_lifecycle_flow(client: TestClient, auth_headers):
    """
    Luồng 1 (End-to-End Financial Flow):
    Tạo danh mục mới -> Đặt hạn mức ngân sách -> Thêm giao dịch chi tiêu ->
    Kiểm tra ngân sách tự động trừ lùi & phát sinh cảnh báo -> Kiểm tra số dư ví thay đổi chính xác.
    """
    curr_month = datetime.date.today().strftime("%Y-%m")

    # 1. Lấy danh sách ví ban đầu
    wallets_res = client.get("/api/v1/wallets/", headers=auth_headers)
    assert wallets_res.status_code == 200
    wallets = wallets_res.json()
    momo_wallet = next((w for w in wallets if "MoMo" in w["name"] or w["wallet_type"] == "EWALLET"), wallets[0])
    initial_wallet_balance = momo_wallet["balance"]

    # 2. Tạo danh mục chi tiêu mới (Category)
    new_cat_payload = {
        "name": "Trà Sữa & Cà Phê Cao Cấp",
        "type": "EXPENSE",
        "group": "WANTS",
        "icon": "mug-hot",
        "color": "#F43F5E"
    }
    cat_res = client.post("/api/v1/categories/", json=new_cat_payload, headers=auth_headers)
    assert cat_res.status_code == 201
    created_cat = cat_res.json()
    cat_id = created_cat["id"]
    assert created_cat["name"] == new_cat_payload["name"]

    # 3. Đặt hạn mức ngân sách (Budget) cho danh mục mới: 500,000 VND
    budget_limit = 500000.0
    budget_payload = {
        "category_id": cat_id,
        "amount_limit": budget_limit,
        "period": "MONTHLY",
        "month_year": curr_month
    }
    budget_res = client.post("/api/v1/budgets/", json=budget_payload, headers=auth_headers)
    assert budget_res.status_code == 201
    budget_data = budget_res.json()
    assert budget_data["status"] == "SAFE"
    assert budget_data["spent_amount"] == 0.0
    assert budget_data["percentage"] == 0.0

    # 4. Ghi giao dịch chi tiêu lần 1: 420,000 VND (84% ngân sách -> Trạng thái WARNING)
    tx1_payload = {
        "wallet_id": momo_wallet["id"],
        "category_id": cat_id,
        "type": "EXPENSE",
        "amount": 420000.0,
        "note": "Uống cà phê họp nhóm đối tác",
        "created_by_ai": "MANUAL"
    }
    tx1_res = client.post("/api/v1/transactions/", json=tx1_payload, headers=auth_headers)
    assert tx1_res.status_code == 201

    # Kiểm tra hạn mức ngân sách tự động cập nhật & cảnh báo chạm 80%
    budgets_list_1 = client.get(f"/api/v1/budgets/?month_year={curr_month}", headers=auth_headers).json()
    b_matched_1 = next(b for b in budgets_list_1 if b["category_id"] == cat_id)
    assert b_matched_1["spent_amount"] == 420000.0
    assert b_matched_1["percentage"] == 84.0
    assert b_matched_1["status"] == "WARNING"

    # Kiểm tra endpoint cảnh báo hạn mức (Alerts)
    alerts_res = client.get(f"/api/v1/budgets/alerts?month_year={curr_month}", headers=auth_headers)
    assert alerts_res.status_code == 200
    alerts_data = alerts_res.json()
    assert any(a["category_id"] == cat_id for a in alerts_data)

    # 5. Ghi tiếp giao dịch chi tiêu lần 2: 130,000 VND (Tổng chi 550,000 VND = 110% -> OVERSPENT)
    tx2_payload = {
        "wallet_id": momo_wallet["id"],
        "category_id": cat_id,
        "type": "EXPENSE",
        "amount": 130000.0,
        "note": "Trà sữa bánh ngọt cuối tuần",
        "created_by_ai": "MANUAL"
    }
    tx2_res = client.post("/api/v1/transactions/", json=tx2_payload, headers=auth_headers)
    assert tx2_res.status_code == 201

    # Kiểm tra hạn mức chuyển sang OVERSPENT (Bội chi)
    budgets_list_2 = client.get(f"/api/v1/budgets/?month_year={curr_month}", headers=auth_headers).json()
    b_matched_2 = next(b for b in budgets_list_2 if b["category_id"] == cat_id)
    assert b_matched_2["spent_amount"] == 550000.0
    assert b_matched_2["percentage"] == 110.0
    assert b_matched_2["status"] == "OVERSPENT"

    # 6. Kiểm tra số dư ví tương ứng bị trừ chính xác (420,000 + 130,000 = 550,000 VND)
    wallet_check = client.get(f"/api/v1/wallets/{momo_wallet['id']}", headers=auth_headers).json()
    assert wallet_check["balance"] == initial_wallet_balance - 550000.0


def test_dual_channel_payment_and_vip_activation_flow(client: TestClient, auth_headers):
    """
    Luồng 2 (Dual-Channel Payment & VIP Activation):
    Tạo đơn nạp VIP qua VietQR -> Giả lập Webhook thanh toán thành công ->
    Tài khoản tự động nâng cấp & gia hạn -> Số dư/hóa đơn hạch toán đồng bộ.
    """
    # 1. Người dùng tạo đơn hàng nâng cấp gói PREMIUM (30 ngày, 199,000 VND)
    order_payload = {
        "plan_code": "PREMIUM",
        "plan_duration_days": 30,
        "amount": 199000,
        "payment_method": "MB_VIETQR",
        "transfer_memo": "FTPREMIUM 1 654321"
    }
    order_res = client.post("/api/v1/subscriptions/create-order", json=order_payload, headers=auth_headers)
    assert order_res.status_code == 200
    res_data = order_res.json()
    assert "order" in res_data
    order_info = res_data["order"]
    order_code = order_info["order_code"]
    assert order_info["status"] == "PENDING"
    assert order_info["amount"] == 199000

    # 2. Giả lập Gateway Ngân hàng (MB Bank / VietQR) bắn Webhook thanh toán thành công
    raw_code = order_code.replace("ORD-", "")
    webhook_payload = {
        "amount": 199000,
        "description": f"MBBank.GD654321.FTPREMIUM 1 {raw_code}",
        "account_number": "0374617569",
        "reference_code": "MB_REF_998877"
    }
    webhook_res = client.post("/api/payments/webhook/bank-transfer", json=webhook_payload)
    assert webhook_res.status_code == 200
    webhook_data = webhook_res.json()
    assert webhook_data["success"] is True
    assert webhook_data["status"] == "APPROVED"
    assert webhook_data["approved_by"] == "AUTO_WEBHOOK_BANK"

    # 3. Kiểm tra trạng thái đơn hàng đã chuyển thành APPROVED
    status_res = client.get(f"/api/v1/subscription-orders/status/{order_code}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "APPROVED"
    assert status_data["is_approved"] is True

    # 4. Kiểm tra tài khoản người dùng đã được nâng cấp lên PREMIUM
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    user_me = me_res.json()
    assert user_me["plan"] == "PREMIUM"
    assert "Premium" in user_me["plan_tier"]

    # 5. Kiểm tra thông báo kích hoạt VIP được gửi tới hộp thư
    notif_res = client.get("/api/v1/notifications/", headers=auth_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json().get("notifications", [])
    assert any(order_code in n["message"] or "Kích Hoạt" in n["title"] or "PREMIUM" in n["message"] for n in notifs)


def test_ai_transaction_nlp_parsing_and_zero_pii_flow(client: TestClient, auth_headers):
    """
    Luồng 3 (AI Transaction Natural Language Parsing & Zero-PII Masking):
    Gửi câu nói tiếng Việt tự nhiên -> Bóc tách category/amount/wallet ->
    Kiểm tra thuật toán Zero-PII không để rò rỉ STK, SĐT, Email.
    """
    # 1. Kiểm tra trích xuất tự động qua AI Transaction Parser
    nlp_query = "Ăn tối nhà hàng 350k ví MoMo lúc 19h tối"
    parse_res = client.post("/api/v1/ai/parse-transaction", json={"raw_text": nlp_query}, headers=auth_headers)
    assert parse_res.status_code == 200
    parsed_data = parse_res.json()
    assert parsed_data["type"] == "EXPENSE"
    assert parsed_data["amount"] == 350000.0
    assert "Ăn uống" in parsed_data.get("category_name", "")
    assert "MoMo" in parsed_data.get("wallet_name", "")

    # 2. Kiểm tra Zero-PII Sanitizer: Bảo vệ dữ liệu riêng tư trước khi chuyển cho LLM
    sensitive_payload = (
        "Chuyển tiền 2500000 VND vào số tài khoản 19034567890123 ngân hàng Techcombank "
        "cho Nguyễn Văn An SĐT 0912345678 email an.nguyen@company.com"
    )
    sanitized_text = sanitize_text_for_ai(sensitive_payload)

    # Đảm bảo các thông tin nhạy cảm đã bị ẩn hoàn toàn
    assert "19034567890123" not in sanitized_text
    assert "0912345678" not in sanitized_text
    assert "an.nguyen@company.com" not in sanitized_text

    # Đảm bảo có nhãn che chắn Zero-PII chuẩn
    assert "[SỐ TÀI KHOẢN ĐÃ ẨN]" in sanitized_text or "[SỐ ĐIỆN THOẠI ĐÃ ẨN]" in sanitized_text
    assert "[EMAIL ĐÃ ẨN]" in sanitized_text
