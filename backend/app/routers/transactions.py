import os
import shutil
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func

from backend.app.config import settings
from backend.app.database import get_db, get_utc_now
from backend.app.models import User, Transaction, Wallet, Category, Budget
from backend.app.schemas import TransactionCreate, TransactionUpdate, TransactionOut
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["Quản lý Giao dịch Thu - Chi"])

@router.get("/", response_model=List[TransactionOut])
def list_transactions(
    from_date: Optional[datetime.date] = None,
    to_date: Optional[datetime.date] = None,
    category_id: Optional[int] = None,
    wallet_id: Optional[int] = None,
    type: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách giao dịch với bộ lọc đa tiêu chí:
    - Khoảng thời gian (from_date, to_date)
    - Danh mục (category_id)
    - Ví thanh toán (wallet_id)
    - Loại (EXPENSE / INCOME / TRANSFER)
    - Khoảng số tiền (min_amount, max_amount)
    - Tìm kiếm từ khóa theo ghi chú (search)
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if from_date:
        query = query.filter(Transaction.transaction_date >= datetime.datetime.combine(from_date, datetime.time.min))
    if to_date:
        query = query.filter(Transaction.transaction_date <= datetime.datetime.combine(to_date, datetime.time.max))
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if wallet_id:
        query = query.filter(or_(Transaction.wallet_id == wallet_id, Transaction.to_wallet_id == wallet_id))
    if type:
        query = query.filter(Transaction.type == type.upper())
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Transaction.note.ilike(search_pattern))

    return query.order_by(desc(Transaction.transaction_date), desc(Transaction.id)).offset(offset).limit(limit).all()

@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo giao dịch thu - chi hoặc chuyển tiền, tự động cập nhật số dư ví tương ứng."""
    # Check wallet
    wallet = db.query(Wallet).filter(Wallet.id == tx_in.wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Không tìm thấy ví thanh toán")

    tx_type = tx_in.type.upper()
    if tx_type == "TRANSFER":
        if not tx_in.to_wallet_id:
            raise HTTPException(status_code=400, detail="Chuyển tiền cần chỉ định ví đích (to_wallet_id)")
        to_wallet = db.query(Wallet).filter(Wallet.id == tx_in.to_wallet_id, Wallet.user_id == current_user.id).first()
        if not to_wallet:
            raise HTTPException(status_code=404, detail="Không tìm thấy ví đích")
        if wallet.balance < tx_in.amount:
            raise HTTPException(status_code=400, detail=f"Số dư ví {wallet.name} không đủ để chuyển")
        # Adjust balances
        wallet.balance -= tx_in.amount
        to_wallet.balance += tx_in.amount
    elif tx_type == "EXPENSE":
        wallet.balance -= tx_in.amount
    elif tx_type == "INCOME":
        wallet.balance += tx_in.amount
    else:
        raise HTTPException(status_code=400, detail="Loại giao dịch không hợp lệ (EXPENSE, INCOME, TRANSFER)")

    tx_date = tx_in.transaction_date or get_utc_now()

    # Kiểm tra hạn mức giao dịch theo gói cước (Free: tối đa 50 giao dịch/tháng, VIP: không giới hạn)
    user_plan = (current_user.plan or "FREE").upper()
    if user_plan == "FREE" and current_user.role != "ADMIN":
        tx_dt = tx_date if isinstance(tx_date, datetime.datetime) else get_utc_now()
        start_of_month = datetime.datetime(tx_dt.year, tx_dt.month, 1)
        next_month = (tx_dt.month % 12) + 1
        next_year = tx_dt.year + (1 if next_month == 1 else 0)
        end_of_month = datetime.datetime(next_year, next_month, 1)
        month_count = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_date >= start_of_month,
            Transaction.transaction_date < end_of_month
        ).scalar() or 0
        if month_count >= 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tài khoản FinTrack Free đã đạt hạn mức tối đa 50 giao dịch trong tháng. Hãy nâng cấp lên gói VIP để ghi chép thu chi không giới hạn!"
            )

    new_tx = Transaction(
        user_id=current_user.id,
        wallet_id=tx_in.wallet_id,
        category_id=tx_in.category_id,
        to_wallet_id=tx_in.to_wallet_id if tx_type == "TRANSFER" else None,
        type=tx_type,
        amount=tx_in.amount,
        transaction_date=tx_date,
        note=tx_in.note,
        receipt_url=tx_in.receipt_url,
        created_by_ai=tx_in.created_by_ai or "MANUAL"
    )
    try:
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        return new_tx
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi lưu giao dịch: {str(e)}")

@router.get("/{tx_id}", response_model=TransactionOut)
def get_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết 1 giao dịch."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
    return tx

@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    tx_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin giao dịch và hoàn nguyên/cập nhật lại số dư ví."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")

    # Revert old balance effect
    old_wallet = db.query(Wallet).filter(Wallet.id == tx.wallet_id).first()
    if old_wallet:
        if tx.type == "EXPENSE":
            old_wallet.balance += tx.amount
        elif tx.type == "INCOME":
            old_wallet.balance -= tx.amount
        elif tx.type == "TRANSFER" and tx.to_wallet_id:
            old_wallet.balance += tx.amount
            old_to_wallet = db.query(Wallet).filter(Wallet.id == tx.to_wallet_id).first()
            if old_to_wallet:
                old_to_wallet.balance -= tx.amount

    # Apply new values
    if tx_in.wallet_id is not None: tx.wallet_id = tx_in.wallet_id
    if tx_in.category_id is not None: tx.category_id = tx_in.category_id
    if tx_in.to_wallet_id is not None: tx.to_wallet_id = tx_in.to_wallet_id
    if tx_in.type is not None: tx.type = tx_in.type.upper()
    if tx_in.amount is not None: tx.amount = tx_in.amount
    if tx_in.transaction_date is not None: tx.transaction_date = tx_in.transaction_date
    if tx_in.note is not None: tx.note = tx_in.note
    if tx_in.receipt_url is not None: tx.receipt_url = tx_in.receipt_url

    # Apply new balance effect
    new_wallet = db.query(Wallet).filter(Wallet.id == tx.wallet_id).first()
    if new_wallet:
        if tx.type == "EXPENSE":
            new_wallet.balance -= tx.amount
        elif tx.type == "INCOME":
            new_wallet.balance += tx.amount
        elif tx.type == "TRANSFER" and tx.to_wallet_id:
            new_wallet.balance -= tx.amount
            new_to_wallet = db.query(Wallet).filter(Wallet.id == tx.to_wallet_id).first()
            if new_to_wallet:
                new_to_wallet.balance += tx.amount

    try:
        db.commit()
        db.refresh(tx)
        return tx
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật giao dịch: {str(e)}")

@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa giao dịch và hoàn lại số dư ví."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")

    wallet = db.query(Wallet).filter(Wallet.id == tx.wallet_id).first()
    if wallet:
        if tx.type == "EXPENSE":
            wallet.balance += tx.amount
        elif tx.type == "INCOME":
            wallet.balance -= tx.amount
        elif tx.type == "TRANSFER" and tx.to_wallet_id:
            wallet.balance += tx.amount
            to_wallet = db.query(Wallet).filter(Wallet.id == tx.to_wallet_id).first()
            if to_wallet:
                to_wallet.balance -= tx.amount

    try:
        db.delete(tx)
        db.commit()
        return {"message": "Đã xóa giao dịch thành công và cập nhật lại số dư ví."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xóa giao dịch: {str(e)}")

@router.post("/upload-receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload ảnh hóa đơn/chứng từ đính kèm."""
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    allowed = settings.ALLOWED_EXTENSIONS.split(",")
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Định dạng file không hỗ trợ. Cho phép: {settings.ALLOWED_EXTENSIONS}")

    filename = f"receipt_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"receipt_url": f"/uploads/{filename}", "filename": filename}
