def test_create_expense_transaction_updates_wallet(client, auth_headers):
    # Fetch wallets & categories
    w_res = client.get("/api/v1/wallets/", headers=auth_headers)
    momo = [w for w in w_res.json() if w["name"] == "Ví MoMo"][0]
    initial_balance = momo["balance"]

    c_res = client.get("/api/v1/categories/", headers=auth_headers)
    food_cat = [c for c in c_res.json() if "Ăn uống" in c["name"]][0]

    # Create 45,000 VND expense
    tx_res = client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": momo["id"],
        "category_id": food_cat["id"],
        "type": "EXPENSE",
        "amount": 45000.0,
        "note": "Ăn trưa bún bò",
        "created_by_ai": "AI_PARSED"
    })
    assert tx_res.status_code == 201
    tx_data = tx_res.json()
    assert tx_data["amount"] == 45000.0
    assert tx_data["created_by_ai"] == "AI_PARSED"

    # Check updated wallet balance
    w_check = client.get(f"/api/v1/wallets/{momo['id']}", headers=auth_headers).json()
    assert w_check["balance"] == initial_balance - 45000.0

def test_create_income_transaction_updates_wallet(client, auth_headers):
    w_res = client.get("/api/v1/wallets/", headers=auth_headers)
    tcb = [w for w in w_res.json() if w["name"] == "Techcombank"][0]
    initial_balance = tcb["balance"]

    c_res = client.get("/api/v1/categories/", headers=auth_headers)
    salary_cat = [c for c in c_res.json() if "Lương" in c["name"]][0]

    tx_res = client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": tcb["id"],
        "category_id": salary_cat["id"],
        "type": "INCOME",
        "amount": 25000000.0,
        "note": "Lương công ty chuyển"
    })
    assert tx_res.status_code == 201
    w_check = client.get(f"/api/v1/wallets/{tcb['id']}", headers=auth_headers).json()
    assert w_check["balance"] == initial_balance + 25000000.0

def test_filter_transactions(client, auth_headers):
    w_res = client.get("/api/v1/wallets/", headers=auth_headers)
    tcb = w_res.json()[0]
    c_res = client.get("/api/v1/categories/", headers=auth_headers)
    cat = c_res.json()[0]

    # Create 2 transactions
    client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": tcb["id"], "category_id": cat["id"], "type": "EXPENSE", "amount": 100000.0, "note": "Đổ xăng A95"
    })
    client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": tcb["id"], "category_id": cat["id"], "type": "EXPENSE", "amount": 500000.0, "note": "Mua sách lập trình"
    })

    # Filter by search
    res_search = client.get("/api/v1/transactions/?search=xăng", headers=auth_headers)
    assert res_search.status_code == 200
    txs = res_search.json()
    assert len(txs) == 1
    assert "xăng" in txs[0]["note"].lower()

def test_delete_transaction_reverts_wallet(client, auth_headers):
    w_res = client.get("/api/v1/wallets/", headers=auth_headers)
    cash = [w for w in w_res.json() if w["name"] == "Tiền mặt"][0]
    initial_balance = cash["balance"]

    c_res = client.get("/api/v1/categories/", headers=auth_headers)
    cat = c_res.json()[0]

    # Create 50,000 VND expense
    tx = client.post("/api/v1/transactions/", headers=auth_headers, json={
        "wallet_id": cash["id"], "category_id": cat["id"], "type": "EXPENSE", "amount": 50000.0, "note": "Cà phê sáng"
    }).json()

    # Delete transaction
    del_res = client.delete(f"/api/v1/transactions/{tx['id']}", headers=auth_headers)
    assert del_res.status_code == 200

    # Wallet balance should be restored to initial
    w_check = client.get(f"/api/v1/wallets/{cash['id']}", headers=auth_headers).json()
    assert w_check["balance"] == initial_balance
