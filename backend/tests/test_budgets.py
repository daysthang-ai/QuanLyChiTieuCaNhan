import datetime

def test_budget_threshold_calculations(client, auth_headers):
    # Fetch category & wallet
    w_res = client.get("/api/v1/wallets/", headers=auth_headers)
    tcb = w_res.json()[0]

    c_res = client.get("/api/v1/categories/", headers=auth_headers)
    food_cat = [c for c in c_res.json() if "Ăn uống" in c["name"]][0]

    curr_month = datetime.date.today().strftime("%Y-%m")

    # 1. Set budget of 1,000,000 VND for Food
    b_res = client.post("/api/v1/budgets/", headers=auth_headers, json={
        "category_id": food_cat["id"],
        "amount_limit": 1000000.0,
        "period": "MONTHLY",
        "month_year": curr_month
    })
    assert b_res.status_code == 201
    b_data = b_res.json()
    assert b_data["status"] == "SAFE"
    assert b_data["percentage"] == 0.0

    # 2. Spend 850,000 VND (85% -> WARNING status)
    client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": tcb["id"],
        "category_id": food_cat["id"],
        "type": "EXPENSE",
        "amount": 850000.0,
        "note": "Đi siêu thị tuần 1"
    })

    b_list = client.get(f"/api/v1/budgets/?month_year={curr_month}", headers=auth_headers).json()
    food_budget = [b for b in b_list if b["category_id"] == food_cat["id"]][0]
    assert food_budget["spent_amount"] == 850000.0
    assert food_budget["percentage"] == 85.0
    assert food_budget["status"] == "WARNING"

    # Check alert endpoint
    alerts = client.get(f"/api/v1/budgets/alerts?month_year={curr_month}", headers=auth_headers).json()
    assert len(alerts) >= 1
    assert alerts[0]["category_id"] == food_cat["id"]

    # 3. Spend additional 200,000 VND (Total 1,050,000 VND -> 105% OVERSPENT)
    client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": tcb["id"],
        "category_id": food_cat["id"],
        "type": "EXPENSE",
        "amount": 200000.0,
        "note": "Ăn tối buffet"
    })

    b_list_2 = client.get(f"/api/v1/budgets/?month_year={curr_month}", headers=auth_headers).json()
    food_budget_2 = [b for b in b_list_2 if b["category_id"] == food_cat["id"]][0]
    assert food_budget_2["spent_amount"] == 1050000.0
    assert food_budget_2["percentage"] == 105.0
    assert food_budget_2["status"] == "OVERSPENT"
