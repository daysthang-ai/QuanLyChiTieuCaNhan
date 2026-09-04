import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_

from backend.app.database import get_db, get_utc_now
from backend.app.models import Notification, NotificationRead, NotificationDismiss, User
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Hộp thư & Thông báo Hệ thống"])

# ----------------- Pydantic Schemas -----------------
class NotificationItemOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    target_type: str  # ALL, FREE, PRO, PREMIUM, USER
    title: str
    message: str
    type: str  # INFO, SUCCESS, WARNING, MAINTENANCE, PROMOTION
    icon: str
    link_tab: Optional[str] = None
    is_read: bool
    is_personal: bool
    created_at: datetime.datetime
    created_at_formatted: str

class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    budget_count: int = 0
    ai_count: int = 0
    system_count: int = 0
    notifications: List[NotificationItemOut]

# ----------------- Helper Functions -----------------
def format_relative_time(dt: datetime.datetime) -> str:
    now = get_utc_now()
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 0 or seconds < 60:
        return "Vừa xong"
    elif seconds < 3600:
        mins = max(1, seconds // 60)
        return f"{mins} phút trước"
    elif seconds < 86400:
        hours = max(1, seconds // 3600)
        return f"{hours} giờ trước"
    elif seconds < 86400 * 2:
        return "1 ngày trước"
    elif seconds < 86400 * 7:
        days = seconds // 86400
        return f"{days} ngày trước"
    else:
        return dt.strftime("%d/%m/%Y")

def get_user_target_plans(plan: Optional[str]) -> List[str]:
    user_plan = (plan or "FREE").upper()
    if user_plan == "PREMIUM":
        return ["ALL", "FREE", "PRO", "PREMIUM"]
    elif user_plan == "PRO":
        return ["ALL", "FREE", "PRO"]
    else:
        return ["ALL", "FREE"]

# ----------------- Endpoints -----------------

@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse)
def get_user_notifications(
    filter_type: Optional[str] = Query("all", description="all, unread, budget_alert, ai_advice, system"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách thông báo dành riêng cho User hoặc thông báo phát sóng chung phù hợp với gói cước.
    """
    valid_plans = get_user_target_plans(current_user.plan)

    # 1. Dismissed IDs for this user
    dismissed_ids = [
        d[0] for d in db.query(NotificationDismiss.notification_id)
        .filter(NotificationDismiss.user_id == current_user.id)
        .all()
    ]

    # 2. Read IDs for this user
    read_ids_set = set(
        r[0] for r in db.query(NotificationRead.notification_id)
        .filter(NotificationRead.user_id == current_user.id)
        .all()
    )

    # 3. Base Query for all accessible notifications
    base_query = db.query(Notification).filter(
        or_(
            Notification.user_id == current_user.id,
            and_(
                Notification.user_id == None,
                Notification.target_type.in_(valid_plans)
            )
        )
    )

    if dismissed_ids:
        base_query = base_query.filter(~Notification.id.in_(dismissed_ids))

    all_items = base_query.order_by(desc(Notification.created_at)).all()

    # Process all items to determine read status and calculate global metrics
    all_processed = []
    global_unread_count = 0
    global_budget_count = 0
    global_ai_count = 0
    global_system_count = 0

    for item in all_items:
        is_personal = (item.user_id == current_user.id)
        is_read = item.is_read if is_personal else (item.id in read_ids_set)
        
        if not is_read:
            global_unread_count += 1

        if item.type in ["BUDGET_ALERT", "WARNING"]:
            global_budget_count += 1
        elif item.type in ["AI_ADVICE", "AI_INSIGHT", "AI"]:
            global_ai_count += 1
        else:
            global_system_count += 1

        all_processed.append(
            (item, is_read, is_personal)
        )

    # Filter items according to requested filter_type
    filtered_items = []
    for item, is_read, is_personal in all_processed:
        if filter_type == "unread" and is_read:
            continue
        elif filter_type in ["budget_alert", "warning", "budget"] and item.type not in ["BUDGET_ALERT", "WARNING"]:
            continue
        elif filter_type in ["ai_advice", "ai", "advice", "insight"] and item.type not in ["AI_ADVICE", "AI_INSIGHT", "AI"]:
            continue
        elif filter_type in ["system", "promo", "sys", "info", "maintenance"] and item.type in ["BUDGET_ALERT", "WARNING", "AI_ADVICE", "AI_INSIGHT", "AI"]:
            continue
        elif filter_type == "personal" and not is_personal:
            continue
        elif filter_type == "broadcast" and is_personal:
            continue

        filtered_items.append(
            NotificationItemOut(
                id=item.id,
                user_id=item.user_id,
                target_type=item.target_type,
                title=item.title,
                message=item.message,
                type=item.type,
                icon=item.icon or "bell",
                link_tab=item.link_tab,
                is_read=is_read,
                is_personal=is_personal,
                created_at=item.created_at,
                created_at_formatted=format_relative_time(item.created_at)
            )
        )

    total_global = len(all_items)
    paged_items = filtered_items[skip : skip + limit]

    return NotificationListResponse(
        total=total_global,
        unread_count=global_unread_count,
        budget_count=global_budget_count,
        ai_count=global_ai_count,
        system_count=global_system_count,
        notifications=paged_items
    )


@router.get("/unread-count")
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy nhanh số lượng thông báo chưa đọc (Dùng cho Badge chuông trên Top Header và Sidebar).
    """
    valid_plans = get_user_target_plans(current_user.plan)

    dismissed_ids = [
        d[0] for d in db.query(NotificationDismiss.notification_id)
        .filter(NotificationDismiss.user_id == current_user.id)
        .all()
    ]

    read_ids_set = set(
        r[0] for r in db.query(NotificationRead.notification_id)
        .filter(NotificationRead.user_id == current_user.id)
        .all()
    )

    query = db.query(Notification).filter(
        or_(
            Notification.user_id == current_user.id,
            and_(
                Notification.user_id == None,
                Notification.target_type.in_(valid_plans)
            )
        )
    )

    if dismissed_ids:
        query = query.filter(~Notification.id.in_(dismissed_ids))

    all_items = query.all()

    unread_count = 0
    for item in all_items:
        is_personal = (item.user_id == current_user.id)
        is_read = item.is_read if is_personal else (item.id in read_ids_set)
        if not is_read:
            unread_count += 1

    return {"unread_count": unread_count}


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu một thông báo là ĐÃ ĐỌC."""
    target = db.query(Notification).filter(Notification.id == notification_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")

    if target.user_id == current_user.id:
        target.is_read = True
        db.commit()
    else:
        # Check if already in NotificationRead
        existing = db.query(NotificationRead).filter(
            NotificationRead.notification_id == notification_id,
            NotificationRead.user_id == current_user.id
        ).first()
        if not existing:
            read_record = NotificationRead(
                notification_id=notification_id,
                user_id=current_user.id
            )
            db.add(read_record)
            db.commit()

    return {"message": "Đã đánh dấu thông báo là đã đọc", "id": notification_id}


@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu TẤT CẢ thông báo của người dùng là ĐÃ ĐỌC."""
    valid_plans = get_user_target_plans(current_user.plan)

    # 1. Update personal notifications
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})

    # 2. Get broadcast notifications that user hasn't read yet
    read_ids = [
        r[0] for r in db.query(NotificationRead.notification_id)
        .filter(NotificationRead.user_id == current_user.id)
        .all()
    ]

    broadcasts_query = db.query(Notification.id).filter(
        Notification.user_id == None,
        Notification.target_type.in_(valid_plans)
    )
    if read_ids:
        broadcasts_query = broadcasts_query.filter(~Notification.id.in_(read_ids))

    unread_broadcast_ids = [b[0] for b in broadcasts_query.all()]

    for b_id in unread_broadcast_ids:
        db.add(NotificationRead(notification_id=b_id, user_id=current_user.id))

    db.commit()
    return {"message": "Đã đánh dấu tất cả thông báo là đã đọc"}


@router.delete("/clear-all")
def clear_all_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa / Ẩn toàn bộ thông báo khỏi danh sách của người dùng."""
    valid_plans = get_user_target_plans(current_user.plan)

    # 1. Delete all personal notifications for this user
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()

    # 2. Dismiss all broadcast notifications for this user
    broadcast_ids = [
        b[0] for b in db.query(Notification.id)
        .filter(Notification.user_id == None, Notification.target_type.in_(valid_plans))
        .all()
    ]
    already_dismissed = set(
        d[0] for d in db.query(NotificationDismiss.notification_id)
        .filter(NotificationDismiss.user_id == current_user.id)
        .all()
    )
    for b_id in broadcast_ids:
        if b_id not in already_dismissed:
            db.add(NotificationDismiss(notification_id=b_id, user_id=current_user.id))

    db.commit()
    return {"message": "Đã xóa toàn bộ thông báo thành công"}


@router.delete("/{notification_id}")
def delete_user_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa / Ẩn thông báo khỏi danh sách của người dùng."""
    target = db.query(Notification).filter(Notification.id == notification_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")

    if target.user_id == current_user.id:
        # Personal notification: delete directly
        db.delete(target)
        db.commit()
    else:
        # Broadcast notification: add to dismissal list for this user
        existing_dismiss = db.query(NotificationDismiss).filter(
            NotificationDismiss.notification_id == notification_id,
            NotificationDismiss.user_id == current_user.id
        ).first()
        if not existing_dismiss:
            db.add(NotificationDismiss(notification_id=notification_id, user_id=current_user.id))
            db.commit()

    return {"message": "Đã xóa thông báo thành công", "id": notification_id}


@router.post("/reset-demo")
def reset_demo_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Khôi phục lại 5 thông báo mẫu sinh động cho người dùng hiện tại."""
    # 1. Clean up user's reads, dismissals, personal notifications, and previous broadcast duplicates
    db.query(NotificationDismiss).filter(NotificationDismiss.user_id == current_user.id).delete()
    db.query(NotificationRead).filter(NotificationRead.user_id == current_user.id).delete()
    db.query(Notification).filter(or_(Notification.user_id == current_user.id, Notification.user_id == None)).delete()

    sample_notifs = [
        Notification(
            user_id=current_user.id,
            target_type="USER",
            title="🚨 Cảnh báo ngân sách: Danh mục Mua sắm đã vượt quá hạn mức 10%",
            message="Tổng chi tiêu Mua sắm cá nhân tháng 08/2026 đã đạt 3.300.000₫ / hạn mức 3.000.000₫ (vượt 10% hạn mức đề ra). FinTrack AI đề xuất bạn nên cân nhắc tạm hoãn các khoản chi sắm đồ công nghệ hoặc thời trang chưa cấp thiết trong tuần này.",
            type="BUDGET_ALERT",
            icon="triangle-exclamation",
            link_tab="budgets",
            is_read=False,
            created_at=get_utc_now() - datetime.timedelta(minutes=25)
        ),
        Notification(
            user_id=current_user.id,
            target_type="USER",
            title="💡 Lời khuyên tài chính AI: Đã tích lũy đạt 73% theo chuẩn 50/30/20",
            message="Tỷ lệ tích lũy & đầu tư tháng này đạt 73% mục tiêu tháng theo mô hình 50/30/20. Với tốc độ tiết kiệm hiện tại, bạn sẽ hoàn thành mục tiêu Quỹ dự phòng khẩn cấp sớm hơn kế hoạch 2 tháng!",
            type="AI_ADVICE",
            icon="lightbulb",
            link_tab="analytics",
            is_read=False,
            created_at=get_utc_now() - datetime.timedelta(hours=2)
        ),
        Notification(
            user_id=None,
            target_type="ALL",
            title="📢 Chào mừng nâng cấp thành công gói VIP Premium 👑",
            message="Chúc mừng bạn đã nâng cấp thành công gói VIP! Mở khóa toàn bộ quyền năng Cố vấn AI 24/7, tự động bóc tách hóa đơn OCR, không giới hạn ví tài khoản và xuất báo cáo tài chính chuyên nghiệp.",
            type="SYSTEM",
            icon="bullhorn",
            link_tab="subscription",
            is_read=True,
            created_at=get_utc_now() - datetime.timedelta(days=1)
        ),
        Notification(
            user_id=current_user.id,
            target_type="USER",
            title="🚨 Cảnh báo ngân sách: Danh mục Ăn uống đạt 85% hạn mức",
            message="Chi tiêu cho Ăn uống & Thực phẩm đã chạm 4.250.000₫ / 5.000.000₫ (85% hạn mức). Còn 8 ngày trong chu kỳ tháng, hãy chú ý kiểm soát các bữa tiệc ngoài vào cuối tuần để giữ vững an toàn ngân sách.",
            type="BUDGET_ALERT",
            icon="triangle-exclamation",
            link_tab="budgets",
            is_read=True,
            created_at=get_utc_now() - datetime.timedelta(days=2)
        ),
        Notification(
            user_id=current_user.id,
            target_type="USER",
            title="💡 Phân tích dòng tiền AI: Ghi nhận thu nhập Freelance (+4.500.000₫)",
            message="Tài khoản Techcombank vừa nhận 4.500.000₫ thù lao dự án Freelance. AI khuyến nghị trích ngay 1.500.000₫ vào Sổ tiết kiệm VPBank để gia tăng lãi suất kép và bảo toàn dòng tiền dương.",
            type="AI_ADVICE",
            icon="receipt",
            link_tab="transactions",
            is_read=False,
            created_at=get_utc_now() - datetime.timedelta(days=3)
        )
    ]
    for notif in sample_notifs:
        db.add(notif)

    db.commit()
    return {"message": "Đã khôi phục thành công 5 thông báo mẫu", "count": len(sample_notifs)}

