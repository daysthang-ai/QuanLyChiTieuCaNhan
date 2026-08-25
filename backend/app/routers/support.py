import datetime
import random
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import User, SupportTicket
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/support", tags=["Hỗ Trợ & Khiếu Nại (Support Tickets)"])

class SupportTicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Tiêu đề yêu cầu / khiếu nại")
    category: Optional[str] = Field("TECHNICAL", description="BILLING, TECHNICAL, ACCOUNT, FEATURE_REQUEST, OTHER")
    priority: Optional[str] = Field("MEDIUM", description="LOW, MEDIUM, HIGH, URGENT")
    message: str = Field(..., min_length=5, description="Nội dung chi tiết yêu cầu hỗ trợ")

@router.post("/tickets")
def create_support_ticket(
    data: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Người dùng gửi ticket khiếu nại / yêu cầu hỗ trợ kỹ thuật đến Quản trị viên.
    """
    random_digits = f"{random.randint(10000, 99999)}"
    ticket_code = f"TCK-{random_digits}"
    while db.query(SupportTicket).filter(SupportTicket.ticket_code == ticket_code).first():
        random_digits = f"{random.randint(10000, 99999)}"
        ticket_code = f"TCK-{random_digits}"

    new_ticket = SupportTicket(
        ticket_code=ticket_code,
        user_id=current_user.id,
        title=data.title.strip(),
        category=data.category or "TECHNICAL",
        priority=data.priority or "MEDIUM",
        status="OPEN",
        message=data.message.strip(),
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return {
        "message": f"Yêu cầu hỗ trợ #{ticket_code} đã được gửi thành công! Đội ngũ FinTrack AI sẽ phản hồi sớm nhất.",
        "ticket": {
            "id": new_ticket.id,
            "ticket_code": new_ticket.ticket_code,
            "title": new_ticket.title,
            "category": new_ticket.category,
            "priority": new_ticket.priority,
            "status": new_ticket.status,
            "created_at": new_ticket.created_at.strftime("%d/%m/%Y %H:%M")
        }
    }

@router.get("/my-tickets")
def get_my_support_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các yêu cầu hỗ trợ của người dùng hiện tại."""
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id
    ).order_by(desc(SupportTicket.created_at)).all()

    return {
        "total": len(tickets),
        "tickets": [
            {
                "id": t.id,
                "ticket_code": t.ticket_code,
                "title": t.title,
                "category": t.category,
                "priority": t.priority,
                "status": t.status,
                "message": t.message,
                "admin_reply": t.admin_reply,
                "replied_by": t.replied_by,
                "replied_at": t.replied_at.strftime("%d/%m/%Y %H:%M") if t.replied_at else None,
                "created_at": t.created_at.strftime("%d/%m/%Y %H:%M") if t.created_at else "---"
            }
            for t in tickets
        ]
    }

@router.get("/tickets/{ticket_id}")
def get_ticket_detail(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xem chi tiết yêu cầu hỗ trợ."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu hỗ trợ")

    if ticket.user_id != current_user.id and current_user.role not in ["ADMIN", "MODERATOR"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập yêu cầu này")

    return {
        "ticket": {
            "id": ticket.id,
            "ticket_code": ticket.ticket_code,
            "title": ticket.title,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "message": ticket.message,
            "admin_reply": ticket.admin_reply,
            "replied_by": ticket.replied_by,
            "replied_at": ticket.replied_at.strftime("%d/%m/%Y %H:%M") if ticket.replied_at else None,
            "created_at": ticket.created_at.strftime("%d/%m/%Y %H:%M") if ticket.created_at else "---"
        }
    }
