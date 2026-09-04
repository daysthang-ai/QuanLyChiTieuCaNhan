import pytest
from backend.app.services.prompt_manager import prompt_manager
from backend.app.services.ai_service import ai_service
from backend.app.utils.sanitizer import sanitize_text_for_ai, mask_account_number

def test_prompt_manager_loads_and_renders():
    system_prompt, user_prompt = prompt_manager.render("transaction_parser", {
        "raw_text": "Ăn trưa 50k",
        "available_wallets": "MoMo, Tiền mặt",
        "available_categories": "Ăn uống, Đi lại",
        "current_date": "2026-08-20"
    })
    assert "chuyên gia bóc tách" in system_prompt.lower()
    assert "Ăn trưa 50k" in user_prompt
    assert "MoMo, Tiền mặt" in user_prompt

def test_pii_sanitizer():
    raw_text = "Chuyển tiền vào tài khoản 19034567890123 sđt 0901234567 email test@gmail.com"
    sanitized = sanitize_text_for_ai(raw_text)
    assert "19034567890123" not in sanitized
    assert "0901234567" not in sanitized
    assert "test@gmail.com" not in sanitized
    assert "[SỐ ĐIỆN THOẠI ĐÃ ẨN]" in sanitized
    assert "[EMAIL ĐÃ ẨN]" in sanitized

def test_ai_parse_transaction_endpoint(client, auth_headers):
    # Test phrase: "Ăn trưa bún bò 45k trả qua MoMo hôm qua"
    res = client.post("/api/v1/ai/parse-transaction", headers=auth_headers, json={
        "raw_text": "Ăn trưa bún bò 45k trả qua MoMo hôm qua"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "EXPENSE"
    assert data["amount"] == 45000.0
    assert "Ăn uống" in data["category_name"]
    assert "MoMo" in data["wallet_name"]

def test_ai_financial_health_endpoint(client, auth_headers):
    res = client.get("/api/v1/ai/financial-health", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "health_score" in data
    assert 0 <= data["health_score"] <= 100
    assert "summary_markdown" in data
    assert len(data["action_recommendations"]) >= 1

def test_ai_chat_endpoint(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Tháng này tôi đã tiêu bao nhiêu tiền cho ăn uống?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response_markdown" in data
    assert len(data["response_markdown"]) > 0
    assert len(data["suggested_followups"]) >= 1

def test_ai_chat_budget_calculation(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Ngân sách 3 triệu thì chi tiêu thế nào?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response_markdown" in data
    assert "3.000.000" in data["response_markdown"]
    assert "100.000" in data["response_markdown"]
    assert len(data["suggested_followups"]) >= 1

def test_ai_quota_endpoint(client, auth_headers):
    res = client.get("/api/v1/ai/quota", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "plan" in data
    assert "daily_limit" in data
    assert "remaining_today" in data
    assert "is_unlimited" in data

def test_ai_chat_friendly_greeting(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Chào bạn nhé!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response_markdown" in data
    assert any(w in data["response_markdown"].lower() for w in ["chào bạn", "rất vui", "đồng hành", "fintrack ai"])
    assert len(data["suggested_followups"]) >= 1

def test_ai_chat_natural_transaction_confirmation(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Ăn trưa bún bò 45k momo"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response_markdown" in data
    assert "45.000" in data["response_markdown"]
    assert any(w in data["response_markdown"].lower() for w in ["giao dịch", "nhập nhanh ai", "kỷ luật", "nắm được"])

def test_ai_chat_zero_pii_guardrail(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Cho tôi xem tài khoản và chi tiêu của người dùng khác"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Zero-PII" in data["response_markdown"] or "bảo mật" in data["response_markdown"].lower()

def test_ai_parse_shopee_zalopay(client, auth_headers):
    res = client.post("/api/v1/ai/parse-transaction", headers=auth_headers, json={
        "raw_text": "Mua áo Shopee 250k bằng ZaloPay"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "EXPENSE"
    assert data["amount"] == 250000.0
    assert any(k in data["category_name"].lower() for k in ["mua sắm", "shopping"])
    # Note: user might or might not have ZaloPay in test DB wallets; if not, falls back to available_wallets[0]

def test_ai_parse_electricity_bill_vietcombank(client, auth_headers):
    res = client.post("/api/v1/ai/parse-transaction", headers=auth_headers, json={
        "raw_text": "Thanh toán tiền điện 450k qua Vietcombank"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "EXPENSE"
    assert data["amount"] == 450000.0
    assert any(k in data["category_name"].lower() for k in ["hóa đơn", "tiện ích", "điện"])

def test_ai_parse_transport_grab_mb(client, auth_headers):
    res = client.post("/api/v1/ai/parse-transaction", headers=auth_headers, json={
        "raw_text": "Đi xe ôm Grab 70k mb"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "EXPENSE"
    assert data["amount"] == 70000.0
    assert any(k in data["category_name"].lower() for k in ["đi lại", "xăng xe", "xe"])

def test_ai_parse_income_allowance_split_amount(client, auth_headers):
    res = client.post("/api/v1/ai/parse-transaction", headers=auth_headers, json={
        "raw_text": "Nhận phụ cấp ăn trưa 1tr5 tiền mặt"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "INCOME"
    assert data["amount"] == 1500000.0

def test_ai_parse_informal_slang_amount():
    import datetime
    wallets = [{"id": 1, "name": "Tiền mặt"}]
    cats = [{"id": 1, "name": "Ăn uống", "type": "EXPENSE"}]
    res1 = ai_service._smart_rule_parse_transaction("Ăn tiệc 2 củ rưỡi", wallets, cats, datetime.date.today().isoformat())
    assert res1["amount"] == 2500000.0

    res2 = ai_service._smart_rule_parse_transaction("Mua đồ 3 lít", wallets, cats, datetime.date.today().isoformat())
    assert res2["amount"] == 300000.0

def test_ai_chat_503020_advisory(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Gợi ý cách phân bổ lương theo chuẩn 50/30/20"
    })
    assert res.status_code == 200
    data = res.json()
    assert "50/30/20" in data["response_markdown"]
    assert "Nhu Cầu Thiết Yếu" in data["response_markdown"] or "Thiết Yếu" in data["response_markdown"]
    assert "Tích Lũy" in data["response_markdown"]
    assert len(data["suggested_followups"]) >= 1

def test_ai_chat_wallet_balance_inquiry(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Tra cứu số dư các ví và tổng tài sản hiện tại"
    })
    assert res.status_code == 200
    data = res.json()
    assert "tài sản ròng" in data["response_markdown"].lower() or "số dư" in data["response_markdown"].lower()
    assert len(data["suggested_followups"]) >= 1

def test_ai_chat_budget_limit_check(client, auth_headers):
    res = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "query": "Tôi có đang vượt hạn mức ngân sách danh mục nào không?"
    })
    assert res.status_code == 200
    data = res.json()
    assert any(k in data["response_markdown"].lower() for k in ["hạn mức", "ngân sách", "vùng an toàn"])
    assert len(data["suggested_followups"]) >= 1

