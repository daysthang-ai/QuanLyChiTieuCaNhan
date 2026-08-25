import json
import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Response, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, Wallet, Category, Transaction, Budget, SavingGoal
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/backup", tags=["Sao lưu & Khôi phục Dữ liệu"])

@router.get("/export")
def export_database_json(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xuất toàn bộ dữ liệu tài chính của người dùng thành file sao lưu JSON."""
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    goals = db.query(SavingGoal).filter(SavingGoal.user_id == current_user.id).all()

    backup_payload = {
        "version": "1.0.0",
        "app": "FinTrack AI",
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "currency": current_user.currency
        },
        "wallets": [
            {
                "id": w.id, "name": w.name, "wallet_type": w.wallet_type,
                "balance": w.balance, "account_number_masked": w.account_number_masked,
                "icon": w.icon, "color": w.color
            } for w in wallets
        ],
        "categories": [
            {
                "id": c.id, "name": c.name, "type": c.type,
                "group": c.group, "icon": c.icon, "color": c.color
            } for c in categories
        ],
        "transactions": [
            {
                "wallet_id": t.wallet_id, "category_id": t.category_id,
                "to_wallet_id": t.to_wallet_id, "type": t.type,
                "amount": t.amount, "transaction_date": t.transaction_date.isoformat(),
                "note": t.note, "created_by_ai": t.created_by_ai
            } for t in transactions
        ],
        "budgets": [
            {
                "category_id": b.category_id, "amount_limit": b.amount_limit,
                "period": b.period, "month_year": b.month_year
            } for b in budgets
        ],
        "saving_goals": [
            {
                "name": g.name, "target_amount": g.target_amount,
                "current_amount": g.current_amount, "target_date": g.target_date.isoformat() if g.target_date else None,
                "status": g.status, "icon": g.icon, "color": g.color, "note": g.note
            } for g in goals
        ]
    }

    json_str = json.dumps(backup_payload, ensure_ascii=False, indent=2)
    filename = f"fintrack_backup_{datetime.date.today().strftime('%Y%m%d')}.json"

    return Response(
        content=json_str.encode("utf-8"),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/import")
async def import_database_json(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Khôi phục dữ liệu từ file sao lưu JSON."""
    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File sao lưu JSON không hợp lệ: {e}")

    if data.get("app") != "FinTrack AI":
        raise HTTPException(status_code=400, detail="File sao lưu không đúng định dạng FinTrack AI")

    imported_count = 0
    # Process categories
    cat_id_map = {}
    for c_data in data.get("categories", []):
        cat = Category(
            user_id=current_user.id,
            name=c_data["name"],
            type=c_data["type"],
            group=c_data.get("group", "NEEDS"),
            icon=c_data.get("icon", "tag"),
            color=c_data.get("color", "#10B981"),
            is_default=False
        )
        db.add(cat)
        db.flush()
        if "id" in c_data:
            cat_id_map[c_data["id"]] = cat.id

    # Process wallets
    wallet_id_map = {}
    for w_data in data.get("wallets", []):
        w = Wallet(
            user_id=current_user.id,
            name=w_data["name"],
            wallet_type=w_data.get("wallet_type", "BANK"),
            balance=w_data.get("balance", 0.0),
            account_number_masked=w_data.get("account_number_masked"),
            icon=w_data.get("icon", "wallet"),
            color=w_data.get("color", "#3B82F6")
        )
        db.add(w)
        db.flush()
        if "id" in w_data:
            wallet_id_map[w_data["id"]] = w.id

    # Process transactions
    for t_data in data.get("transactions", []):
        w_id = wallet_id_map.get(t_data.get("wallet_id")) or t_data.get("wallet_id")
        c_id = cat_id_map.get(t_data.get("category_id")) or t_data.get("category_id")
        to_w_id = wallet_id_map.get(t_data.get("to_wallet_id")) if t_data.get("to_wallet_id") else None

        if w_id:
            tx = Transaction(
                user_id=current_user.id,
                wallet_id=w_id,
                category_id=c_id,
                to_wallet_id=to_w_id,
                type=t_data.get("type", "EXPENSE"),
                amount=t_data.get("amount", 0.0),
                transaction_date=datetime.datetime.fromisoformat(t_data.get("transaction_date")),
                note=t_data.get("note"),
                created_by_ai=t_data.get("created_by_ai", "MANUAL")
            )
            db.add(tx)
            imported_count += 1

    db.commit()
    return {"message": f"Khôi phục thành công! Đã nạp {imported_count} giao dịch vào hệ thống."}
