import datetime
import pytest
from fastapi.testclient import TestClient
from backend.app.models import User
from backend.app.utils.security import get_password_hash, create_access_token


def test_regression_role_and_plan_access_control(
    client: TestClient, db_session, auth_headers, moderator_headers, admin_headers
):
    """
    Regression 1: Kiểm tra tính toàn vẹn phân quyền đa cấp bậc (User, Moderator, Root Admin).
    Đảm bảo 403 Forbidden được kích hoạt chính xác theo ma trận bảo mật.
    """
    # 1. Regular User (FREE / PRO / PREMIUM) không được truy cập Admin Portal
    user_dash_res = client.get("/api/v1/admin/dashboard", headers=auth_headers)
    assert user_dash_res.status_code == 403

    user_settings_res = client.get("/api/v1/admin/settings", headers=auth_headers)
    assert user_settings_res.status_code == 403

    user_ai_res = client.get("/api/v1/admin/ai-management", headers=auth_headers)
    assert user_ai_res.status_code == 403

    # 2. Moderator được truy cập Dashboard & Danh sách Người dùng
    mod_dash_res = client.get("/api/v1/admin/dashboard", headers=moderator_headers)
    assert mod_dash_res.status_code == 200
    assert "kpis" in mod_dash_res.json()

    mod_users_res = client.get("/api/v1/admin/users", headers=moderator_headers)
    assert mod_users_res.status_code == 200

    # Nhưng Moderator KHÔNG ĐƯỢC can thiệp vào Cài đặt Hệ thống hoặc Cấu hình AI nhạy cảm
    mod_set_res = client.get("/api/v1/admin/settings", headers=moderator_headers)
    assert mod_set_res.status_code == 403

    mod_ai_res = client.get("/api/v1/admin/ai-management", headers=moderator_headers)
    assert mod_ai_res.status_code == 403

    # 3. Root Admin có toàn quyền truy cập tất cả phân hệ quản trị
    admin_dash_res = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert admin_dash_res.status_code == 200

    admin_set_res = client.get("/api/v1/admin/settings", headers=admin_headers)
    assert admin_set_res.status_code == 200

    admin_ai_res = client.get("/api/v1/admin/ai-management", headers=admin_headers)
    assert admin_ai_res.status_code == 200


def test_regression_zero_division_and_negative_edge_cases(client: TestClient, db_session):
    """
    Regression 2: Kiểm tra các giá trị biên (0 giao dịch, 0 thu nhập, kỳ trống).
    Đảm bảo tuyệt đối không phát sinh ZeroDivisionError hoặc Crash 500 trên Dashboard/Analytics.
    """
    # 1. Tạo user mới hoàn toàn sạch dữ liệu (0 giao dịch, 0 ví, 0 ngân sách)
    fresh_user = User(
        email="fresh_user@fintrack.ai",
        full_name="Fresh User Zero",
        hashed_password=get_password_hash("Password@123"),
        role="USER",
        currency="VND"
    )
    db_session.add(fresh_user)
    db_session.commit()
    db_session.refresh(fresh_user)

    token = create_access_token(data={"sub": str(fresh_user.id), "email": fresh_user.email, "role": fresh_user.role})
    fresh_headers = {"Authorization": f"Bearer {token}"}

    # 2. Gọi API Thống kê tổng quan (Analytics Summary)
    summary_res = client.get("/api/v1/analytics/summary", headers=fresh_headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["total_income_month"] == 0.0
    assert summary_data["total_expense_month"] == 0.0
    assert summary_data["net_savings_month"] == 0.0
    assert summary_data["savings_rate_month"] == 0.0
    assert summary_data["income_change_vs_last_month_pct"] == 0.0
    assert summary_data["expense_change_vs_last_month_pct"] == 0.0

    # 3. Gọi API Dòng tiền (Cashflow) khi chưa có phát sinh
    cashflow_res = client.get("/api/v1/analytics/cashflow", headers=fresh_headers)
    assert cashflow_res.status_code == 200
    assert isinstance(cashflow_res.json(), list)

    # 4. Gọi API Quy tắc 50/30/20 khi chưa có giao dịch
    rule_res = client.get("/api/v1/analytics/50-30-20", headers=fresh_headers)
    assert rule_res.status_code == 200
    rule_data = rule_res.json()
    assert rule_data["needs_actual_pct"] == 0.0
    assert rule_data["wants_actual_pct"] == 0.0
    assert rule_data["savings_actual_pct"] == 0.0

    # 5. Gọi API Hạn mức ngân sách cho một tháng trong tương lai (kỳ trống)
    future_month = "2099-12"
    budget_empty_res = client.get(f"/api/v1/budgets/?month_year={future_month}", headers=fresh_headers)
    assert budget_empty_res.status_code == 200
    assert budget_empty_res.json() == []


def test_regression_admin_revenue_stats_stability(
    client: TestClient, admin_headers, auth_headers
):
    """
    Regression 3: Kiểm tra tính ổn định của chỉ số doanh thu Admin.
    Việc thêm/xóa giao dịch thu chi cá nhân của người dùng không làm xáo trộn doanh thu gói VIP của Admin.
    """
    # 1. Lấy chỉ số doanh thu ban đầu của hệ thống
    initial_admin_dash = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    initial_mrr = initial_admin_dash["kpis"]["mrr_revenue"]

    # 2. Người dùng tạo ví và danh mục
    w_res = client.get("/api/v1/wallets/", headers=auth_headers).json()
    wallet_id = w_res[0]["id"]
    c_res = client.get("/api/v1/categories/", headers=auth_headers).json()
    cat_id = c_res[0]["id"]

    # 3. Người dùng tạo nhiều giao dịch thu/chi cá nhân
    tx_ids = []
    for amount in [1000000.0, 500000.0, 250000.0]:
        t_res = client.post("/api/v1/transactions/", json={
            "wallet_id": wallet_id,
            "category_id": cat_id,
            "type": "EXPENSE",
            "amount": amount,
            "note": "Chi tiêu thử nghiệm"
        }, headers=auth_headers)
        assert t_res.status_code == 201
        tx_ids.append(t_res.json()["id"])

    # 4. Người dùng xóa tất cả các giao dịch vừa tạo
    for tx_id in tx_ids:
        del_res = client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
        assert del_res.status_code in [200, 204]

    # 5. Kiểm tra chỉ số doanh thu Admin không bị ảnh hưởng bởi việc xóa giao dịch cá nhân
    admin_dash_after_del = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert admin_dash_after_del["kpis"]["mrr_revenue"] == initial_mrr

    # 6. Tạo một đơn mua VIP chính thức và duyệt tự động
    order_res = client.post("/api/v1/subscriptions/create-order", json={
        "plan_code": "PRO",
        "plan_duration_days": 30,
        "amount": 99000,
        "payment_method": "MB_VIETQR",
        "transfer_memo": "FTPRO REGRESSION"
    }, headers=auth_headers)
    assert order_res.status_code == 200
    order_code = order_res.json()["order"]["order_code"]

    # Kích hoạt đơn qua mock receive money
    mock_res = client.post("/api/payments/mock-receive-money", json={
        "order_code": order_code,
        "amount": 99000
    })
    assert mock_res.status_code == 200

    # 7. Kiểm tra doanh thu Admin cập nhật tăng chính xác theo đơn hàng VIP
    admin_dash_vip = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert admin_dash_vip["kpis"]["mrr_revenue"] >= initial_mrr + 99000.0
