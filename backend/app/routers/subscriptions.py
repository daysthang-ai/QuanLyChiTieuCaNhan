import datetime
import random
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db, get_utc_now
from backend.app.models import User, SubscriptionOrder, Notification
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Gói Dịch Vụ & Đơn Nạp Tiền (Subscriptions)"])

class SubscriptionOrderCreate(BaseModel):
    plan_code: str = Field(..., description="PRO, PREMIUM, or PLATINUM")
    amount: float = Field(..., description="Số tiền thanh toán")
    plan_duration_days: Optional[int] = 30
    payment_method: Optional[str] = "MB_VIETQR"
    transfer_memo: Optional[str] = None
    proof_image: Optional[str] = None

@router.post("/create-order")
def create_subscription_order(
    data: SubscriptionOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Người dùng tạo đơn thanh toán gói VIP / Nạp tiền (Trạng thái PENDING - Chờ duyệt).
    """
    plan_code = data.plan_code.upper()
    valid_plans = ["PRO", "PREMIUM", "PLATINUM", "REAL_WALLET", "WALLET_TOPUP", "VIP"]
    if plan_code not in valid_plans:
        raise HTTPException(status_code=400, detail="Mã gói không hợp lệ. Chấp nhận: PRO, PREMIUM, PLATINUM, hoặc REAL_WALLET.")

    # Generate unique order code: ORD-XXXXXX
    random_digits = f"{random.randint(100000, 999999)}"
    order_code = f"ORD-{random_digits}"
    
    # Ensure unique code
    while db.query(SubscriptionOrder).filter(SubscriptionOrder.order_code == order_code).first():
        random_digits = f"{random.randint(100000, 999999)}"
        order_code = f"ORD-{random_digits}"

    memo = data.transfer_memo or f"FT{plan_code} {current_user.id} {random_digits}"
    now = get_utc_now()

    new_order = SubscriptionOrder(
        order_code=order_code,
        user_id=current_user.id,
        plan_code=plan_code,
        plan_duration_days=data.plan_duration_days or 30,
        amount=data.amount,
        payment_method=data.payment_method or "MB_VIETQR",
        transfer_memo=memo,
        status="PENDING",
        proof_image=data.proof_image,
        created_at=now,
        updated_at=now
    )
    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo đơn hàng: {str(e)}")

    return {
        "message": f"Đơn hàng #{order_code} đã được tạo thành công và đang chờ Quản trị viên đối soát & kích hoạt!",
        "order": {
            "id": new_order.id,
            "order_code": new_order.order_code,
            "plan_code": new_order.plan_code,
            "amount": new_order.amount,
            "payment_method": new_order.payment_method,
            "transfer_memo": new_order.transfer_memo,
            "status": new_order.status,
            "created_at": new_order.created_at.strftime("%d/%m/%Y %H:%M")
        }
    }

@router.get("/my-orders")
def get_my_subscription_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các đơn nạp tiền/nâng cấp gói của người dùng hiện tại."""
    orders = db.query(SubscriptionOrder).filter(
        SubscriptionOrder.user_id == current_user.id
    ).order_by(desc(SubscriptionOrder.created_at)).all()

    return {
        "total": len(orders),
        "orders": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "plan_code": o.plan_code,
                "amount": o.amount,
                "payment_method": o.payment_method,
                "transfer_memo": o.transfer_memo,
                "status": o.status,
                "rejection_reason": o.rejection_reason,
                "approved_by": o.approved_by,
                "created_at": o.created_at.strftime("%d/%m/%Y %H:%M") if o.created_at else "---"
            }
            for o in orders
        ]
    }

@router.get("/order/{order_code}")
def get_order_status(
    order_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kiểm tra trạng thái đơn hàng theo mã đơn."""
    order = db.query(SubscriptionOrder).filter(SubscriptionOrder.order_code == order_code).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    if order.user_id != current_user.id and current_user.role not in ["ADMIN", "MODERATOR"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem thông tin đơn hàng này")

    return {
        "order": {
            "id": order.id,
            "order_code": order.order_code,
            "plan_code": order.plan_code,
            "amount": order.amount,
            "status": order.status,
            "transfer_memo": order.transfer_memo,
            "rejection_reason": order.rejection_reason,
            "created_at": order.created_at.strftime("%d/%m/%Y %H:%M") if order.created_at else "---"
        }
    }
