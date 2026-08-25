import pytest
from fastapi.testclient import TestClient

def test_admin_dashboard_unauthorized(client: TestClient, auth_headers):
    # Regular user should get 403 Forbidden
    response = client.get("/api/v1/admin/dashboard", headers=auth_headers)
    assert response.status_code == 403

def test_admin_dashboard_success(client: TestClient, admin_headers):
    response = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "total_users" in data["kpis"]
    assert "mrr_revenue" in data["kpis"]
    assert "ai_calls_count" in data["kpis"]
    assert "system_health" in data["kpis"]
    assert "recent_users" in data
    assert "recent_logs" in data

def test_admin_users_list_and_manage(client: TestClient, admin_headers, test_user):
    # Get users list
    res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()["users"]
    assert len(users) > 0
    target_user = next(u for u in users if u["id"] == test_user.id)

    # Update plan
    res_plan = client.put(f"/api/v1/admin/users/{target_user['id']}/plan", json={"plan": "PRO"}, headers=admin_headers)
    assert res_plan.status_code == 200

    # Update role
    res_role = client.put(f"/api/v1/admin/users/{target_user['id']}/role", json={"role": "MODERATOR"}, headers=admin_headers)
    assert res_role.status_code == 200

def test_admin_ai_config(client: TestClient, admin_headers):
    res = client.get("/api/v1/admin/ai-management", headers=admin_headers)
    assert res.status_code == 200
    assert "config" in res.json()

def test_admin_master_data(client: TestClient, admin_headers):
    res = client.get("/api/v1/admin/master-data", headers=admin_headers)
    assert res.status_code == 200
    assert "categories" in res.json()
    assert "rules" in res.json()

def test_admin_billing_and_settings(client: TestClient, admin_headers):
    res_bill = client.get("/api/v1/admin/billing", headers=admin_headers)
    assert res_bill.status_code == 200
    assert "plans" in res_bill.json()

    res_set = client.get("/api/v1/admin/settings", headers=admin_headers)
    assert res_set.status_code == 200
    assert "smtp" in res_set.json()

def test_admin_adjust_wallet_balance(client: TestClient, admin_headers, auth_headers):
    # Fetch a wallet first
    res_w = client.get("/api/v1/wallets/", headers=auth_headers)
    assert res_w.status_code == 200
    wallet = res_w.json()[0]
    wallet_id = wallet["id"]

    # Regular user attempting admin adjust endpoint must fail (403 Forbidden)
    res_unauth = client.put(f"/api/v1/admin/wallets/{wallet_id}/adjust-balance", headers=auth_headers, json={
        "balance": 99999999.0,
        "reason": "Hack"
    })
    assert res_unauth.status_code == 403

    # Admin adjusting balance succeeds
    res_adjust = client.put(f"/api/v1/admin/wallets/{wallet_id}/adjust-balance", headers=admin_headers, json={
        "balance": 55000000.0,
        "reason": "Điều chỉnh số dư ví do hỗ trợ đối soát"
    })
    assert res_adjust.status_code == 200
    data = res_adjust.json()
    assert data["new_balance"] == 55000000.0
    assert data["wallet_id"] == wallet_id

    # Verify wallet now has new balance
    res_verify = client.get(f"/api/v1/wallets/{wallet_id}", headers=auth_headers)
    assert res_verify.status_code == 200
    assert res_verify.json()["balance"] == 55000000.0

def test_moderator_access_and_restrictions(client: TestClient, moderator_headers, admin_user, test_user):
    # 1. Moderator CAN access general management endpoints
    res_dash = client.get("/api/v1/admin/dashboard", headers=moderator_headers)
    assert res_dash.status_code == 200

    res_users = client.get("/api/v1/admin/users", headers=moderator_headers)
    assert res_users.status_code == 200

    res_master = client.get("/api/v1/admin/master-data", headers=moderator_headers)
    assert res_master.status_code == 200

    res_logs = client.get("/api/v1/admin/logs", headers=moderator_headers)
    assert res_logs.status_code == 200

    res_notifs = client.get("/api/v1/admin/notifications", headers=moderator_headers)
    assert res_notifs.status_code == 200

    res_billing = client.get("/api/v1/admin/billing", headers=moderator_headers)
    assert res_billing.status_code == 200

    # 2. Moderator CAN toggle regular user status
    res_status = client.put(f"/api/v1/admin/users/{test_user.id}/status", json={"status": "LOCKED"}, headers=moderator_headers)
    assert res_status.status_code == 200

    # 3. Moderator CANNOT lock Root Admin (403 Forbidden)
    res_lock_admin = client.put(f"/api/v1/admin/users/{admin_user.id}/status", json={"status": "LOCKED"}, headers=moderator_headers)
    assert res_lock_admin.status_code == 403

    # 4. Moderator CANNOT change user roles (403 Forbidden)
    res_role = client.put(f"/api/v1/admin/users/{test_user.id}/role", json={"role": "ADMIN"}, headers=moderator_headers)
    assert res_role.status_code == 403

    # 5. Moderator CANNOT delete users (403 Forbidden)
    res_del = client.delete(f"/api/v1/admin/users/{test_user.id}", headers=moderator_headers)
    assert res_del.status_code == 403

    # 6. Moderator CANNOT access AI configuration & tokens (403 Forbidden)
    res_ai = client.get("/api/v1/admin/ai-management", headers=moderator_headers)
    assert res_ai.status_code == 403

    res_ai_tokens = client.get("/api/v1/admin/ai-tokens", headers=moderator_headers)
    assert res_ai_tokens.status_code == 403

    # 7. Moderator CANNOT access system settings & SMTP (403 Forbidden)
    res_settings = client.get("/api/v1/admin/settings", headers=moderator_headers)
    assert res_settings.status_code == 403

    res_sys_settings = client.get("/api/v1/admin/system-settings", headers=moderator_headers)
    assert res_sys_settings.status_code == 403

    # 8. Moderator CANNOT directly adjust wallet balance (403 Forbidden - Root Admin only)
    res_wallet_adjust = client.put(
        "/api/v1/admin/wallets/1/adjust-balance",
        json={"balance": 99999999, "reason": "Moderator try"},
        headers=moderator_headers
    )
    assert res_wallet_adjust.status_code == 403

    # 9. Moderator CAN update regular user profile (full_name, status, plan)
    res_prof = client.put(
        f"/api/v1/admin/users/{test_user.id}/profile",
        json={"full_name": "Test User Updated By Mod", "status": "ACTIVE", "plan": "PRO"},
        headers=moderator_headers
    )
    assert res_prof.status_code == 200
    assert res_prof.json()["full_name"] == "Test User Updated By Mod"

    # 10. Moderator CANNOT modify Root Admin profile (403 Forbidden)
    res_prof_admin = client.put(
        f"/api/v1/admin/users/{admin_user.id}/profile",
        json={"full_name": "Hacked Admin"},
        headers=moderator_headers
    )
    assert res_prof_admin.status_code == 403

    # 11. Moderator CAN send normal INFO / PROMOTION notification
    res_mod_notif = client.post(
        "/api/v1/admin/notifications",
        json={"title": "Mod Broadcast", "message": "Notice from mod", "type": "INFO", "target_type": "ALL"},
        headers=moderator_headers
    )
    assert res_mod_notif.status_code == 200
    mod_notif_id = res_mod_notif.json()["notification"]["id"]

    # 12. Moderator CANNOT send CRITICAL or MAINTENANCE notification (403 Forbidden)
    res_crit_notif = client.post(
        "/api/v1/admin/notifications",
        json={"title": "Emergency", "message": "System down", "type": "CRITICAL", "target_type": "ALL"},
        headers=moderator_headers
    )
    assert res_crit_notif.status_code == 403

    # 13. Moderator CAN delete own created normal notification
    res_del_own = client.delete(f"/api/v1/admin/notifications/{mod_notif_id}", headers=moderator_headers)
    assert res_del_own.status_code == 200

