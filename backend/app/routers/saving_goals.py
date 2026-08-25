import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, SavingGoal, Wallet, Category, Transaction
from backend.app.schemas import (
    SavingGoalCreate, SavingGoalUpdate, SavingGoalDeposit, SavingGoalOut
)
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/saving-goals", tags=["Quản lý Mục tiêu Tiết kiệm"])

def enrich_goal_out(goal: SavingGoal) -> SavingGoalOut:
    """Calculates progress %, remaining amount, and remaining days."""
    pct = round((goal.current_amount / goal.target_amount * 100), 1) if goal.target_amount > 0 else 0.0
    rem = max(0.0, goal.target_amount - goal.current_amount)

    days_left = None
    if goal.target_date:
        today = datetime.date.today()
        days_left = (goal.target_date - today).days

    g_out = SavingGoalOut.model_validate(goal)
    g_out.progress_percentage = min(100.0, pct)
    g_out.remaining_amount = rem
    g_out.days_left = days_left
    return g_out

@router.get("/", response_model=List[SavingGoalOut])
def list_saving_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các mục tiêu tiết kiệm và tiến độ hoàn thành."""
    goals = db.query(SavingGoal).filter(SavingGoal.user_id == current_user.id).order_by(SavingGoal.id.desc()).all()
    return [enrich_goal_out(g) for g in goals]

@router.post("/", response_model=SavingGoalOut, status_code=status.HTTP_201_CREATED)
def create_saving_goal(
    goal_in: SavingGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo mục tiêu tiết kiệm mới."""
    new_goal = SavingGoal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount or 0.0,
        target_date=goal_in.target_date,
        status="ACTIVE",
        icon=goal_in.icon or "bullseye",
        color=goal_in.color or "#10B981",
        note=goal_in.note
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return enrich_goal_out(new_goal)

@router.post("/{goal_id}/deposit", response_model=SavingGoalOut)
def deposit_to_goal(
    goal_id: int,
    deposit_in: SavingGoalDeposit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Nạp tiền vào quỹ tiết kiệm (tùy chọn trừ trực tiếp từ một ví thanh toán)."""
    goal = db.query(SavingGoal).filter(SavingGoal.id == goal_id, SavingGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu tiết kiệm")

    # If wallet is specified, deduct money and log transaction
    if deposit_in.wallet_id:
        wallet = db.query(Wallet).filter(Wallet.id == deposit_in.wallet_id, Wallet.user_id == current_user.id).first()
        if not wallet:
            raise HTTPException(status_code=404, detail="Không tìm thấy ví trích tiền")
        if wallet.balance < deposit_in.amount:
            raise HTTPException(status_code=400, detail=f"Số dư ví {wallet.name} không đủ để trích nạp quỹ")

        wallet.balance -= deposit_in.amount

        # Find savings category
        sav_cat = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.group == "SAVINGS"
        ).first()

        tx = Transaction(
            user_id=current_user.id,
            wallet_id=wallet.id,
            category_id=sav_cat.id if sav_cat else None,
            type="EXPENSE",
            amount=deposit_in.amount,
            transaction_date=datetime.datetime.utcnow(),
            note=deposit_in.note or f"Nạp tiền vào mục tiêu: {goal.name}",
            created_by_ai="MANUAL"
        )
        db.add(tx)

    goal.current_amount += deposit_in.amount
    if goal.current_amount >= goal.target_amount:
        goal.status = "COMPLETED"

    goal.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return enrich_goal_out(goal)

@router.put("/{goal_id}", response_model=SavingGoalOut)
def update_saving_goal(
    goal_id: int,
    goal_in: SavingGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật mục tiêu tiết kiệm."""
    goal = db.query(SavingGoal).filter(SavingGoal.id == goal_id, SavingGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu tiết kiệm")

    if goal_in.name is not None: goal.name = goal_in.name
    if goal_in.target_amount is not None: goal.target_amount = goal_in.target_amount
    if goal_in.current_amount is not None: goal.current_amount = goal_in.current_amount
    if goal_in.target_date is not None: goal.target_date = goal_in.target_date
    if goal_in.status is not None: goal.status = goal_in.status
    if goal_in.icon is not None: goal.icon = goal_in.icon
    if goal_in.color is not None: goal.color = goal_in.color
    if goal_in.note is not None: goal.note = goal_in.note

    goal.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return enrich_goal_out(goal)

@router.delete("/{goal_id}")
def delete_saving_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa mục tiêu tiết kiệm."""
    goal = db.query(SavingGoal).filter(SavingGoal.id == goal_id, SavingGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu tiết kiệm")

    db.delete(goal)
    db.commit()
    return {"message": "Đã xóa mục tiêu tiết kiệm thành công"}
