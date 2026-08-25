import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from backend.app.database import get_db
from backend.app.models import User, Budget, Category, Transaction
from backend.app.schemas import BudgetCreate, BudgetUpdate, BudgetOut
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Quản lý Hạn mức Ngân sách"])

def enrich_budget_out(budget: Budget, db: Session) -> BudgetOut:
    """Calculates real-time spending progress against budget limit."""
    year, month = map(int, budget.month_year.split("-"))

    spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == budget.user_id,
        Transaction.category_id == budget.category_id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == year,
        extract("month", Transaction.transaction_date) == month
    ).scalar() or 0.0

    pct = round((spent / budget.amount_limit * 100), 1) if budget.amount_limit > 0 else 0.0
    status_str = "OVERSPENT" if pct >= 100.0 else "WARNING" if pct >= 80.0 else "SAFE"
    remaining = max(0.0, budget.amount_limit - spent)

    b_out = BudgetOut.model_validate(budget)
    b_out.spent_amount = spent
    b_out.remaining_amount = remaining
    b_out.percentage = pct
    b_out.status = status_str
    return b_out

@router.get("/", response_model=List[BudgetOut])
def list_budgets(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách hạn mức ngân sách kèm % đã chi và trạng thái cảnh báo (An toàn / Cảnh báo 80% / Vượt 100%)."""
    target_month = month_year or datetime.datetime.now().strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == target_month
    ).all()

    return [enrich_budget_out(b, db) for b in budgets]

@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thiết lập hạn mức ngân sách mới cho một danh mục."""
    # Check category
    cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")

    # Check if budget already exists for this month
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month_year == budget_in.month_year
    ).first()

    if existing:
        existing.amount_limit = budget_in.amount_limit
        existing.period = budget_in.period or "MONTHLY"
        db.commit()
        db.refresh(existing)
        return enrich_budget_out(existing, db)

    new_budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        amount_limit=budget_in.amount_limit,
        period=budget_in.period or "MONTHLY",
        month_year=budget_in.month_year
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return enrich_budget_out(new_budget, db)

@router.get("/alerts", response_model=List[BudgetOut])
def get_budget_alerts(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các hạn mức đang ở trạng thái Cảnh báo (>= 80%) hoặc Bội chi (>= 100%)."""
    target_month = month_year or datetime.datetime.now().strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == target_month
    ).all()

    alerts = []
    for b in budgets:
        b_out = enrich_budget_out(b, db)
        if b_out.percentage >= 80.0:
            alerts.append(b_out)
    return alerts

@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật hạn mức ngân sách."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Không tìm thấy hạn mức ngân sách")

    if budget_in.amount_limit is not None: budget.amount_limit = budget_in.amount_limit
    if budget_in.period is not None: budget.period = budget_in.period
    if budget_in.month_year is not None: budget.month_year = budget_in.month_year

    db.commit()
    db.refresh(budget)
    return enrich_budget_out(budget, db)

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa hạn mức ngân sách."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Không tìm thấy hạn mức ngân sách")

    db.delete(budget)
    db.commit()
    return {"message": "Đã xóa hạn mức ngân sách thành công"}
