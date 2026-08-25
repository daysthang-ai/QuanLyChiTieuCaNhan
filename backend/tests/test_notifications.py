import pytest
from backend.app.models import User, Notification, NotificationRead

def test_get_notifications_list_and_unread(client, auth_headers, db_session, test_user):
    # Add a broadcast and personal notification
    notif1 = Notification(
        user_id=None,
        target_type="ALL",
        title="Thông báo toàn sàn",
        message="Nội dung thông báo toàn sàn",
        type="INFO",
        icon="bell"
    )
    notif2 = Notification(
        user_id=test_user.id,
        target_type="USER",
        title="Thông báo riêng",
        message="Nội dung thông báo riêng cho bạn",
        type="WARNING",
        icon="triangle-exclamation"
    )
    db_session.add_all([notif1, notif2])
    db_session.commit()

    # 1. Get notifications
    res = client.get("/api/v1/notifications", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert data["unread_count"] == 2
    assert len(data["notifications"]) == 2

    # 2. Get unread count endpoint
    res_count = client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert res_count.status_code == 200
    assert res_count.json()["unread_count"] == 2

def test_mark_notification_read(client, auth_headers, db_session, test_user):
    notif = Notification(
        user_id=test_user.id,
        target_type="USER",
        title="Test Read",
        message="Test message",
        type="INFO",
        icon="bell",
        is_read=False
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    res = client.put(f"/api/v1/notifications/{notif.id}/read", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == notif.id

    # Check unread count
    res_count = client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert res_count.json()["unread_count"] == 0

def test_mark_all_notifications_read(client, auth_headers, db_session, test_user):
    notif1 = Notification(user_id=None, target_type="ALL", title="N1", message="M1", type="INFO")
    notif2 = Notification(user_id=test_user.id, target_type="USER", title="N2", message="M2", type="INFO")
    db_session.add_all([notif1, notif2])
    db_session.commit()

    res = client.put("/api/v1/notifications/read-all", headers=auth_headers)
    assert res.status_code == 200
    
    # Verify unread count is 0
    res_count = client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert res_count.status_code == 200
    assert res_count.json()["unread_count"] == 0

def test_delete_notification(client, auth_headers, db_session, test_user):
    notif = Notification(user_id=test_user.id, target_type="USER", title="To Delete", message="Msg", type="INFO")
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    res_del = client.delete(f"/api/v1/notifications/{notif.id}", headers=auth_headers)
    assert res_del.status_code == 200

    res_list = client.get("/api/v1/notifications", headers=auth_headers)
    assert res_list.json()["total"] == 0

def test_admin_create_and_manage_notifications(client, admin_headers, auth_headers, test_user):
    # 1. Admin creates broadcast to ALL
    res = client.post("/api/v1/admin/notifications", headers=admin_headers, json={
        "title": "Thông báo kiểm thử toàn sàn",
        "message": "Nội dung kiểm thử phát sóng tự động",
        "type": "INFO",
        "target_type": "ALL",
        "link_tab": "dashboard"
    })
    assert res.status_code == 200
    created_id = res.json()["notification"]["id"]

    # 2. Admin creates personal notification to user
    res_personal = client.post("/api/v1/admin/notifications", headers=admin_headers, json={
        "title": "Thông báo riêng cho bạn",
        "message": "Nội dung chỉ gửi riêng cho tester@fintrack.ai",
        "type": "WARNING",
        "target_type": "USER",
        "user_email": "tester@fintrack.ai",
        "link_tab": "budgets"
    })
    assert res_personal.status_code == 200

    # 3. Admin views all notifications
    res_admin_list = client.get("/api/v1/admin/notifications", headers=admin_headers)
    assert res_admin_list.status_code == 200
    assert res_admin_list.json()["total"] >= 2

    # 4. User receives the personal notification
    res_user = client.get("/api/v1/notifications?filter_type=personal", headers=auth_headers)
    assert res_user.status_code == 200
    personal_titles = [n["title"] for n in res_user.json()["notifications"]]
    assert "Thông báo riêng cho bạn" in personal_titles

    # 5. Admin deletes the created broadcast
    res_delete = client.delete(f"/api/v1/admin/notifications/{created_id}", headers=admin_headers)
    assert res_delete.status_code == 200
