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
