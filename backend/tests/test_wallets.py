def test_list_wallets(client, auth_headers):
    res = client.get("/api/v1/wallets/", headers=auth_headers)
    assert res.status_code == 200
    wallets = res.json()
    assert len(wallets) >= 3
    names = [w["name"] for w in wallets]
    assert "Techcombank" in names
    assert "Ví MoMo" in names

def test_create_wallet(client, auth_headers):
    # Upgrade user to PRO to test creating up to 5 virtual wallets
    client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PRO",
        "duration_months": 1
    })

    res = client.post("/api/v1/wallets/", headers=auth_headers, json={
        "name": "ZaloPay",
        "wallet_type": "EWALLET",
        "balance": 1500000.0,
        "account_number_masked": "0987654321",
        "icon": "mobile",
        "color": "#0284C7"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "ZaloPay"
    assert data["balance"] == 1500000.0
    assert data["account_number_masked"] == "******4321"

def test_transfer_between_wallets(client, auth_headers):
    # Fetch wallets
    res = client.get("/api/v1/wallets/", headers=auth_headers)
    wallets = {w["name"]: w for w in res.json()}
    momo = wallets["Ví MoMo"]
    cash = wallets["Tiền mặt"]

    # Transfer 1,000,000 from MoMo (2M) to Cash (500k)
    res_transfer = client.post("/api/v1/wallets/transfer", headers=auth_headers, json={
        "from_wallet_id": momo["id"],
        "to_wallet_id": cash["id"],
        "amount": 1000000.0,
        "note": "Rút tiền mặt từ MoMo"
    })
    assert res_transfer.status_code == 200
    data = res_transfer.json()
    assert data["from_wallet_balance"] == 1000000.0
    assert data["to_wallet_balance"] == 1500000.0

def test_transfer_insufficient_funds(client, auth_headers):
    res = client.get("/api/v1/wallets/", headers=auth_headers)
    wallets = {w["name"]: w for w in res.json()}
    cash = wallets["Tiền mặt"]  # 500k
    momo = wallets["Ví MoMo"]

    res_transfer = client.post("/api/v1/wallets/transfer", headers=auth_headers, json={
        "from_wallet_id": cash["id"],
        "to_wallet_id": momo["id"],
        "amount": 1000000.0  # More than 500k
    })
    assert res_transfer.status_code == 400
    assert "không đủ" in res_transfer.json()["detail"]

def test_user_cannot_directly_change_balance_in_update_wallet(client, auth_headers):
    # Fetch wallets
    res = client.get("/api/v1/wallets/", headers=auth_headers)
    wallets = res.json()
    w = wallets[0]
    initial_balance = w["balance"]

    # User attempts to arbitrarily modify balance via PUT /wallets/{id}
    res_update = client.put(f"/api/v1/wallets/{w['id']}", headers=auth_headers, json={
        "name": f"{w['name']} Renamed",
        "balance": initial_balance + 99999999.0, # Attempted cheat
        "color": "#10B981"
    })
    assert res_update.status_code == 200
    updated_wallet = res_update.json()
    assert updated_wallet["name"] == f"{w['name']} Renamed"
    assert updated_wallet["color"] == "#10B981"
    # Balance must remain unchanged!
    assert updated_wallet["balance"] == initial_balance

def test_deposit_to_wallet_success(client, auth_headers):
    # Fetch a wallet
    res = client.get("/api/v1/wallets/", headers=auth_headers)
    w = res.json()[0]
    initial_balance = w["balance"]

    # Deposit 500k into wallet
    res_deposit = client.post(f"/api/v1/wallets/{w['id']}/deposit", headers=auth_headers, json={
        "amount": 500000.0,
        "source": "BANK_LINK",
        "note": "Nạp tiền chi tiêu tuần mới"
    })
    assert res_deposit.status_code == 200
    data = res_deposit.json()
    assert data["wallet"]["new_balance"] == initial_balance + 500000.0
    assert data["transaction"]["type"] == "INCOME"
    assert data["transaction"]["amount"] == 500000.0

    # Verify wallet reflects new balance
    res_w = client.get(f"/api/v1/wallets/{w['id']}", headers=auth_headers)
    assert res_w.json()["balance"] == initial_balance + 500000.0

def test_open_banking_link_bank(client, auth_headers):
    res_link = client.post("/api/v1/wallets/link-bank", headers=auth_headers, json={
        "bank_code": "MB",
        "bank_name": "MB Bank",
        "account_number": "0987654321",
        "account_holder": "NGUYEN VAN TEST",
        "initial_balance": 8000000.0,
        "auto_debit_consent": True
    })
    assert res_link.status_code == 200
    wallet = res_link.json()
    assert "MB Bank" in wallet["name"]
    assert wallet["is_linked"] is True
    assert wallet["auto_debit_enabled"] is True
    assert wallet["balance"] == 8000000.0

    # Verify notification created
    res_notifs = client.get("/api/v1/notifications/", headers=auth_headers)
    assert res_notifs.status_code == 200
    notif_titles = [n["title"] for n in res_notifs.json()["notifications"]]
    assert any("Liên Kết Ngân Hàng" in t for t in notif_titles)

def test_wallet_limits_by_tier(client, auth_headers):
    # 1. Free user has max 2 virtual wallets (seeded with MoMo & Tiền mặt)
    # Trying to create a 3rd virtual wallet must fail with 400
    res_fail = client.post("/api/v1/wallets/", headers=auth_headers, json={
        "name": "Ví Vượt Hạn Mức Free",
        "wallet_type": "CASH",
        "balance": 100000.0,
        "color": "#10B981"
    })
    assert res_fail.status_code == 400
    assert "quản lý tối đa 2 ví" in res_fail.json()["detail"]

    # 2. Upgrade to Platinum VIP (unlimited virtual wallets)
    res_up = client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PLATINUM",
        "duration_months": 1
    })
    assert res_up.status_code == 200

    # 3. Create wallet again -> must succeed with 201 Created
    res_ok = client.post("/api/v1/wallets/", headers=auth_headers, json={
        "name": "Ví Platinum Không Giới Hạn",
        "wallet_type": "CASH",
        "balance": 100000.0,
        "color": "#10B981"
    })
    assert res_ok.status_code == 201
    assert res_ok.json()["name"] == "Ví Platinum Không Giới Hạn"


