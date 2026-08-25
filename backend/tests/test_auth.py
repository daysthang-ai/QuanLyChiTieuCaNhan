def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@fintrack.ai",
        "full_name": "Lê Văn Mới",
        "password": "SecretPassword123",
        "currency": "VND"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@fintrack.ai"
    assert data["user"]["full_name"] == "Lê Văn Mới"

def test_register_duplicate_email(client, test_user):
    res = client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "full_name": "Duplicate User",
        "password": "Password123"
    })
    assert res.status_code == 400
    assert "đã được đăng ký" in res.json()["detail"]

def test_login_success(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "tester@fintrack.ai",
        "password": "Password@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tester@fintrack.ai"

def test_login_wrong_password(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "tester@fintrack.ai",
        "password": "WrongPassword"
    })
    assert res.status_code == 401

def test_get_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "tester@fintrack.ai"

def test_change_password(client, auth_headers):
    res = client.post("/api/v1/auth/change-password", headers=auth_headers, json={
        "old_password": "Password@123",
        "new_password": "NewSecretPassword456"
    })
    assert res.status_code == 200

    # Verify new password login
    res_login = client.post("/api/v1/auth/login", json={
        "email": "tester@fintrack.ai",
        "password": "NewSecretPassword456"
    })
    assert res_login.status_code == 200

def test_get_available_plans_4_tiers(client):
    res = client.get("/api/v1/auth/plans")
    assert res.status_code == 200
    plans = res.json()
    assert len(plans) == 4
    plan_ids = [p["id"] for p in plans]
    assert plan_ids == ["FREE", "PRO", "PREMIUM", "PLATINUM"]
    
    plat = next(p for p in plans if p["id"] == "PLATINUM")
    assert plat["price"] == 199000
    assert plat["ai_limits"] == -1
    assert "Platinum" in plat["name"]

    prem = next(p for p in plans if p["id"] == "PREMIUM")
    assert prem["price"] == 99000
    assert prem["ai_limits"] == 300

def test_upgrade_plan_duration_and_expiration(client, auth_headers):
    # Ensure user has funded real payment wallet
    res_wallets = client.get("/api/v1/wallets/", headers=auth_headers)
    assert res_wallets.status_code == 200
    real_wallet = next(w for w in res_wallets.json() if w.get("wallet_scope") == "real")

    # Deposit 5,000,000 VND into real payment wallet
    res_dep = client.post(f"/api/v1/wallets/{real_wallet['id']}/deposit", headers=auth_headers, json={
        "amount": 5000000.0,
        "source": "QR_CODE",
        "note": "Nạp tiền thật qua VietQR MB Bank"
    })
    assert res_dep.status_code == 200

    # Test upgrading to PRO for 1 month (30 days)
    res_pro = client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PRO",
        "duration_months": 1
    })
    assert res_pro.status_code == 200
    data = res_pro.json()
    assert data["plan"] == "PRO"
    assert data["plan_tier"] == "FinTrack Pro"
    assert data["is_plan_active"] is True
    assert data["plan_activated_at"] is not None
    assert data["plan_expires_at"] is not None
    assert data["days_remaining"] in [29, 30]

    # Test upgrading to PREMIUM for 1 month (30 days)
    res_prem = client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PREMIUM",
        "duration_months": 1
    })
    assert res_prem.status_code == 200
    data_prem = res_prem.json()
    assert data_prem["plan"] == "PREMIUM"
    assert data_prem["plan_tier"] == "FinTrack Premium"
    assert data_prem["is_plan_active"] is True

    # Test upgrading to PLATINUM for 12 months (365 days)
    res_vip = client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PLATINUM",
        "duration_months": 12
    })
    assert res_vip.status_code == 200
    data_vip = res_vip.json()
    assert data_vip["plan"] == "PLATINUM"
    assert data_vip["plan_tier"] == "FinTrack Platinum VIP"
    assert data_vip["is_plan_active"] is True
    assert data_vip["days_remaining"] in [364, 365]

    # Test get_me returns subscription duration
    res_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["plan"] == "PLATINUM"
    assert me_data["days_remaining"] is not None
    assert me_data["plan_expires_at"] is not None

def test_upgrade_plan_via_direct_debit_and_notification(client, auth_headers):
    # Link a bank account first
    client.post("/api/v1/wallets/link-bank", headers=auth_headers, json={
        "bank_code": "TCB",
        "bank_name": "Techcombank",
        "account_number": "1903999999",
        "account_holder": "TRAN DIRECT DEBIT",
        "initial_balance": 10000000.0,
        "auto_debit_consent": True
    })

    # Upgrade to Platinum VIP using 1-Click Direct Debit
    res_upgrade = client.post("/api/v1/auth/upgrade-plan", headers=auth_headers, json={
        "plan": "PLATINUM",
        "duration_months": 3,
        "payment_method": "DIRECT_DEBIT"
    })
    assert res_upgrade.status_code == 200
    user = res_upgrade.json()
    assert user["plan"] == "PLATINUM"
    assert user["is_plan_active"] is True

    # Verify notification created in inbox
    res_notifs = client.get("/api/v1/notifications/", headers=auth_headers)
    assert res_notifs.status_code == 200
    notifs = res_notifs.json()["notifications"]
    assert any("👑 Kích Hoạt Gói FinTrack Platinum VIP" in n["title"] for n in notifs)

def test_account_lockout_blocks_login_and_requests(client, db_session, test_user, auth_headers):
    # Lock the user in database
    test_user.status = "LOCKED"
    db_session.commit()

    # 1. API request with active token should now return 403 Forbidden
    res_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res_me.status_code == 403
    assert "khóa" in res_me.json()["detail"].lower()

    # 2. Login attempt with correct password should also return 403 Forbidden
    res_login = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "Password@123"
    })
    assert res_login.status_code == 403
    assert "khóa" in res_login.json()["detail"].lower()

    # Restore status to ACTIVE
    test_user.status = "ACTIVE"
    db_session.commit()

