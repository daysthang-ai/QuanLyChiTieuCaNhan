from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.database import get_db
from backend.app.models import User
from backend.app.routers.auth import get_current_user
from backend.app.services.badge_service import badge_service

router = APIRouter(prefix="/badges", tags=["Huy Hiệu & Thành Tích (Gamification)"])

@router.get("/", response_model=Dict[str, Any])
def get_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả huy hiệu, cấp độ tài chính, chuỗi ngày và tiến trình thành tích."""
    return badge_service.get_user_badges(current_user, db)
