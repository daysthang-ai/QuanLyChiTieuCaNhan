import pytest
from fastapi.testclient import TestClient


def test_subscription_order_flow(client: TestClient, auth_headers, admin_headers):
    # 1. User creates a pending subscription order for PLATINUM
    order_payload = {
        "plan_code": "PLATINUM",
        "plan_duration_days": 30,
        "amount": 199000,
        "payment_method": "MB_VIETQR",
        "transfer_memo": "FTPLATINUM 1 123456"
    }
    create_res = client.post("/api/v1/subscriptions/create-order", json=order_payload, headers=auth_headers)
    assert create_res.status_code == 200
    order_data = create_res.json()["order"]
    order_id = order_data["id"]
    assert order_data["status"] == "PENDING"
    assert order_data["plan_code"] == "PLATINUM"

    # 2. User views their orders
    my_orders_res = client.get("/api/v1/subscriptions/my-orders", headers=auth_headers)
    assert my_orders_res.status_code == 200
    assert len(my_orders_res.json()["orders"]) >= 1

    # 3. Admin lists orders
    admin_orders_res = client.get("/api/v1/admin/subscriptions/orders?status=PENDING", headers=admin_headers)
    assert admin_orders_res.status_code == 200
    orders_list = admin_orders_res.json()["orders"]
    assert any(o["id"] == order_id for o in orders_list)

    # 4. Admin approves the order
    approve_res = client.put(f"/api/v1/admin/subscriptions/orders/{order_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["order"]["status"] == "APPROVED"

    # Verify user plan upgraded to PLATINUM
    user_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert user_me.status_code == 200
    assert user_me.json()["plan"] == "PLATINUM"
    assert user_me.json()["plan_tier"] == "FinTrack Platinum VIP"


def test_support_ticket_flow(client: TestClient, auth_headers, moderator_headers):
    # 1. User creates a support ticket
    ticket_payload = {
        "title": "Lỗi kết nối ngân hàng",
        "category": "TECHNICAL",
        "priority": "HIGH",
        "message": "Tôi không thể liên kết tài khoản Vietcombank qua Open Banking."
    }
    create_ticket_res = client.post("/api/v1/support/tickets", json=ticket_payload, headers=auth_headers)
    assert create_ticket_res.status_code == 200
    ticket_data = create_ticket_res.json()["ticket"]
    ticket_id = ticket_data["id"]
    assert ticket_data["status"] == "OPEN"

    # 2. Moderator views tickets list
    mod_tickets_res = client.get("/api/v1/admin/support/tickets", headers=moderator_headers)
    assert mod_tickets_res.status_code == 200
    tickets_list = mod_tickets_res.json()["tickets"]
    assert any(t["id"] == ticket_id for t in tickets_list)

    # 3. Moderator replies to ticket
    reply_payload = {"reply": "Chúng tôi đã kiểm tra và cập nhật cấu hình API Open Banking. Bạn vui lòng thử lại nhé."}
    reply_res = client.put(f"/api/v1/admin/support/tickets/{ticket_id}/reply", json=reply_payload, headers=moderator_headers)
    assert reply_res.status_code == 200
    assert reply_res.json()["ticket"]["status"] == "RESOLVED"

    # 4. User views replied ticket
    my_tickets = client.get("/api/v1/support/my-tickets", headers=auth_headers)
    assert my_tickets.status_code == 200
    tickets_arr = my_tickets.json()["tickets"]
    user_ticket = next(t for t in tickets_arr if t["id"] == ticket_id)
    assert user_ticket["status"] == "RESOLVED"
    assert "cấu hình API" in user_ticket["admin_reply"]


def test_admin_csv_exports_and_analytics(client: TestClient, admin_headers, moderator_headers):
    # 1. Export Users CSV (Admin & Moderator allowed)
    users_csv = client.get("/api/v1/admin/export/users.csv", headers=moderator_headers)
    assert users_csv.status_code == 200
    assert "text/csv" in users_csv.headers["content-type"]
    assert "ID,Họ và Tên,Email" in users_csv.text

    # 2. Export Subscriptions CSV
    subs_csv = client.get("/api/v1/admin/export/subscriptions.csv", headers=admin_headers)
    assert subs_csv.status_code == 200
    assert "Mã Đơn,Khách Hàng" in subs_csv.text

    # 3. Export Audit Logs CSV
    logs_csv = client.get("/api/v1/admin/export/audit-logs.csv", headers=admin_headers)
    assert logs_csv.status_code == 200
    assert "ID,Thời Gian" in logs_csv.text

    # 4. Revenue analytics chart
    rev_chart = client.get("/api/v1/admin/analytics/revenue-chart", headers=moderator_headers)
    assert rev_chart.status_code == 200
    chart_data = rev_chart.json()
    assert "chart_data" in chart_data
    assert len(chart_data["chart_data"]["labels"]) == 12
