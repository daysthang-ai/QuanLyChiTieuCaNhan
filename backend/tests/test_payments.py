import pytest
from fastapi.testclient import TestClient


def test_bank_transfer_webhook_auto_approves_order(client: TestClient, auth_headers):
    # 1. User creates a pending VIP subscription order
    order_payload = {
        "plan_code": "PLATINUM",
        "plan_duration_days": 30,
        "amount": 299000,
        "payment_method": "MB_VIETQR",
        "transfer_memo": "FTPLATINUM 1 888999"
    }
    create_res = client.post("/api/v1/subscriptions/create-order", json=order_payload, headers=auth_headers)
    assert create_res.status_code == 200
    order_data = create_res.json()["order"]
    order_code = order_data["order_code"]
    assert order_data["status"] == "PENDING"

    # 2. Simulate MB Bank Webhook arriving
    webhook_payload = {
        "amount": 299000,
        "description": f"MBVCB.888999.FTPLATINUM 1 {order_code.replace('ORD-', '')}",
        "account_number": "0374617569",
        "reference_code": "MB888999111"
    }
    webhook_res = client.post("/api/payments/webhook/bank-transfer", json=webhook_payload)
    assert webhook_res.status_code == 200
    result = webhook_res.json()
    assert result["success"] is True
    assert result["status"] == "APPROVED"
    assert result["approved_by"] == "AUTO_WEBHOOK_BANK"

    # 3. Check order status endpoint
    status_res = client.get(f"/api/subscription-orders/status/{order_code}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "APPROVED"
    assert status_res.json()["is_approved"] is True

    # 4. Verify user plan tier upgraded to Platinum VIP
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["plan"] == "PLATINUM"
    assert me_data["plan_tier"] == "FinTrack Platinum VIP"

    # 5. Verify notification created
    notif_res = client.get("/api/v1/notifications/", headers=auth_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json().get("notifications", [])
    assert any("Kích Hoạt" in n["title"] or order_code in n["message"] for n in notifs)


def test_mock_receive_money_endpoint(client: TestClient, auth_headers):
    # 1. User creates a pending PRO order
    order_payload = {
        "plan_code": "PRO",
        "plan_duration_days": 30,
        "amount": 99000,
        "payment_method": "MB_VIETQR",
        "transfer_memo": "FTPRO 1 777333"
    }
    create_res = client.post("/api/v1/subscriptions/create-order", json=order_payload, headers=auth_headers)
    assert create_res.status_code == 200
    order_code = create_res.json()["order"]["order_code"]

    # 2. Trigger Mock Receive Money
    mock_payload = {
        "order_code": order_code,
        "amount": 99000
    }
    mock_res = client.post("/api/payments/mock-receive-money", json=mock_payload)
    assert mock_res.status_code == 200
    assert mock_res.json()["success"] is True
    assert mock_res.json()["status"] == "APPROVED"

    # 3. Verify order is approved
    status_res = client.get(f"/api/v1/subscription-orders/status/{order_code}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "APPROVED"


def test_bank_transfer_direct_wallet_deposit(client: TestClient, auth_headers):
    # Get user id
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    user_id = me_res.json()["id"]

    # Direct bank transfer with memo NAP VIP <user_id>
    webhook_payload = {
        "amount": 500000,
        "description": f"NAP VIP {user_id} NGUYENVANA TOPUP",
        "account_number": "0374617569"
    }
    res = client.post("/api/payments/webhook/bank-transfer", json=webhook_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "wallet" in data
    assert data["wallet"]["new_balance"] >= 500000


def test_public_payment_gateway_info(client: TestClient):
    # Public endpoint without authorization
    res = client.get("/api/public/payment-gateway-info")
    assert res.status_code == 200
    data = res.json()
    assert "bank_id" in data
    assert "account_number" in data
    assert "account_name" in data
    assert "available_banks" in data
    assert len(data["available_banks"]) > 0


def test_admin_update_payment_settings(client: TestClient, admin_headers):
    # 1. Get current settings
    get_res = client.get("/api/admin/payment-settings", headers=admin_headers)
    assert get_res.status_code == 200
    assert "settings" in get_res.json()

    # 2. Update to Techcombank
    update_payload = {
        "bank_id": "TCB",
        "bank_name": "Techcombank (Kỹ Thương Việt Nam)",
        "account_number": "19033888999",
        "account_name": "NGUYEN VAN ADMIN",
        "qr_template": "compact2"
    }
    put_res = client.put("/api/admin/payment-settings", json=update_payload, headers=admin_headers)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["success"] is True
    assert data["settings"]["bank_id"] == "TCB"
    assert data["settings"]["account_number"] == "19033888999"

    # 3. Verify public endpoint reflects new settings
    public_res = client.get("/api/public/payment-gateway-info")
    assert public_res.status_code == 200
    pub_data = public_res.json()
    assert pub_data["bank_id"] == "TCB"
    assert pub_data["account_number"] == "19033888999"
    assert pub_data["account_name"] == "NGUYEN VAN ADMIN"


def test_active_bank_gateway_and_crud(client: TestClient, admin_headers):
    # 1. Test public active bank gateway
    res = client.get("/api/public/active-bank-gateway")
    assert res.status_code == 200
    data = res.json()
    assert "bank_code" in data
    assert "account_number" in data
    assert "account_name" in data

    # 2. Test Admin Save & Switch Bank Gateway
    save_payload = {
        "bank_code": "VCB",
        "bank_name": "Vietcombank (Ngoại Thương Việt Nam)",
        "account_number": "9988776655",
        "account_name": "FINTRACK ADMIN VCB",
        "branch": "Chi Nhánh Hoàn Kiếm",
        "qr_template": "compact2",
        "memo_prefix": "NAP VIP",
        "is_active": True
    }
    save_res = client.post("/api/admin/bank-gateway", json=save_payload, headers=admin_headers)
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["success"] is True
    assert save_data["active_gateway"]["bank_code"] == "VCB"
    assert save_data["active_gateway"]["account_number"] == "9988776655"

    # 3. Verify public endpoint updated
    pub_res = client.get("/api/public/active-bank-gateway")
    assert pub_res.status_code == 200
    assert pub_res.json()["bank_code"] == "VCB"
    assert pub_res.json()["account_number"] == "9988776655"


def test_bank_transactions_and_manual_match(client: TestClient, admin_headers, auth_headers):
    # 1. Get user id
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]

    # 2. Simulate an UNMATCHED webhook transaction (User typed typo memo like "TIEN NHA")
    webhook_payload = {
        "amount": 350000,
        "description": "TIEN NHA THANG 8 KHONG GHI CU PHAP",
        "reference_code": "MB_TYPO_999",
        "sender_name": "TRAN VAN B"
    }
    hook_res = client.post("/api/payments/webhook/bank-transfer", json=webhook_payload)
    assert hook_res.status_code == 200
    hook_data = hook_res.json()
    assert hook_data["success"] is False
    assert "transaction_id" in hook_data
    tx_id = hook_data["transaction_id"]

    # 3. Admin views bank transactions list
    txs_res = client.get("/api/admin/bank-gateway/transactions?status_filter=UNMATCHED", headers=admin_headers)
    assert txs_res.status_code == 200
    txs_data = txs_res.json()
    assert any(t["id"] == tx_id for t in txs_data["transactions"])

    # 4. Admin performs manual match for user
    match_payload = {
        "user_id": user_id,
        "note": "Admin đối soát và duyệt tiền chuyển sai cú pháp"
    }
    match_res = client.post(f"/api/admin/bank-gateway/transactions/{tx_id}/manual-match", json=match_payload, headers=admin_headers)
    assert match_res.status_code == 200
    assert match_res.json()["success"] is True
    assert match_res.json()["status"] == "MANUALLY_MATCHED"

    # 5. Check user wallet balance updated
    wallets_res = client.get("/api/v1/wallets/", headers=auth_headers)
    assert wallets_res.status_code == 200


def test_dynamic_deposit_order_and_mock_mb_receive(client: TestClient, auth_headers):
    # 1. User calls POST /api/payments/create-deposit-order
    deposit_payload = {"amount": 250000}
    create_res = client.post("/api/payments/create-deposit-order", json=deposit_payload, headers=auth_headers)
    assert create_res.status_code == 200
    res_data = create_res.json()
    assert res_data["success"] is True
    order_code = res_data["order_code"]
    assert order_code.startswith("ORD-")
    assert "FT NAP" in res_data["transfer_memo"]
    assert "vietqr.io" in res_data["vietqr_url"]
    assert res_data["amount"] == 250000
    assert res_data["bank_info"]["account_number"] != ""

    # 2. Check initial order status
    status_res = client.get(f"/api/payments/order-status/{order_code}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PENDING"
    assert status_res.json()["is_approved"] is False

    # 3. Simulate MB Bank Mock Receive
    mock_payload = {
        "order_code": order_code,
        "amount": 250000
    }
    mock_res = client.post("/api/payments/mock-mb-receive", json=mock_payload)
    assert mock_res.status_code == 200
    mock_data = mock_res.json()
    assert mock_data["success"] is True
    assert mock_data["status"] == "APPROVED"

    # 4. Check order status after webhook
    status_after = client.get(f"/api/payments/order-status/{order_code}")
    assert status_after.status_code == 200
    assert status_after.json()["status"] == "APPROVED"
    assert status_after.json()["is_approved"] is True

    # 5. Verify money was added to user's real wallet
    wallets_res = client.get("/api/v1/wallets/", headers=auth_headers)
    assert wallets_res.status_code == 200
    wallets = wallets_res.json()
    real_wallets = [w for w in wallets if w.get("wallet_scope") == "real"]
    assert len(real_wallets) > 0
    assert real_wallets[0]["balance"] >= 250000


def test_sepay_webhook_integration_and_small_amount(client: TestClient, auth_headers):
    # 1. Test 2000 VND deposit order creation (new minimum threshold)
    deposit_payload = {"amount": 2000}
    create_res = client.post("/api/payments/create-deposit-order", json=deposit_payload, headers=auth_headers)
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_code = order_data["order_code"]
    transfer_memo = order_data["transfer_memo"]
    assert order_data["amount"] == 2000

    # 2. SePay Webhook Payload format
    sepay_payload = {
        "id": 9991234,
        "gateway": "MBBank",
        "transactionDate": "2026-08-28 10:00:00",
        "accountNumber": "0374617569",
        "content": f"SEPAY {transfer_memo} CHUYEN KHOAN",
        "transferType": "in",
        "transferAmount": 2000,
        "accumulated": 5000000,
        "subAccount": None,
        "referenceCode": "MB_SEPAY_REF_123"
    }

    webhook_res = client.post("/api/payments/bank-webhook", json=sepay_payload)
    assert webhook_res.status_code == 200
    hook_result = webhook_res.json()
    assert hook_result["success"] is True
    assert hook_result["status"] == "APPROVED"
    assert hook_result["approved_by"] == "AUTO_WEBHOOK_SEPAY"

    # 3. Verify order status is APPROVED
    status_res = client.get(f"/api/payments/order-status/{order_code}")
    assert status_res.status_code == 200
    assert status_res.json()["is_approved"] is True




