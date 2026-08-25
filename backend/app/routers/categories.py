from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models import User, Category, Transaction
from backend.app.schemas import CategoryCreate, CategoryUpdate, CategoryOut
from backend.app.routers.auth import get_current_user
from backend.app.services.seed_service import DEFAULT_CATEGORIES

router = APIRouter(prefix="/categories", tags=["Quản lý Danh mục"])

@router.get("/", response_model=List[CategoryOut])
def list_categories(
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách danh mục (cả danh mục chuẩn hệ thống và danh mục cá nhân)."""
    query = db.query(Category).filter(
        or_(
            Category.user_id == current_user.id,
            Category.user_id == None
        )
    )
    if type:
        query = query.filter(Category.type == type.upper())
    return query.order_by(Category.id.asc()).all()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo danh mục thu/chi mới cho người dùng."""
    new_cat = Category(
        user_id=current_user.id,
        name=cat_in.name,
        type=cat_in.type.upper(),
        group=cat_in.group.upper() if cat_in.group else "NEEDS",
        icon=cat_in.icon or "tag",
        color=cat_in.color or "#10B981",
        is_default=False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    cat_in: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật danh mục."""
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục hoặc không có quyền chỉnh sửa danh mục hệ thống")

    if cat_in.name is not None: cat.name = cat_in.name
    if cat_in.type is not None: cat.type = cat_in.type.upper()
    if cat_in.group is not None: cat.group = cat_in.group.upper()
    if cat_in.icon is not None: cat.icon = cat_in.icon
    if cat_in.color is not None: cat.color = cat_in.color

    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa danh mục tùy chỉnh."""
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục hoặc không được xóa danh mục mặc định")

    # Check transactions
    tx_count = db.query(Transaction).filter(Transaction.category_id == cat_id).count()
    if tx_count > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa danh mục đã phát sinh giao dịch chi tiêu")

    db.delete(cat)
    db.commit()
    return {"message": "Đã xóa danh mục thành công"}

@router.post("/reset-defaults")
def reset_default_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Khôi phục lại danh sách 18 danh mục chuẩn cho người dùng."""
    for cat_data in DEFAULT_CATEGORIES:
        exists = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.name == cat_data["name"]
        ).first()
        if not exists:
            cat = Category(
                user_id=current_user.id,
                name=cat_data["name"],
                type=cat_data["type"],
                group=cat_data["group"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_default=True
            )
            db.add(cat)
    db.commit()
    return {"message": "Đã khôi phục các danh mục mặc định thành công!"}
