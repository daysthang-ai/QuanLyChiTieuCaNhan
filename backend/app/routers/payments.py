import re
import random
import datetime
import traceback
import urllib.parse
from typing import Optional, Union, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.app.database import get_db
from backend.app.models import (
    User, SubscriptionOrder, Notification, Wallet, Transaction, Category,
    SystemSetting, SystemBankAccount, BankTransaction
)
from backend.app.routers.auth import get_current_user, get_current_admin_or_moderator_user, get_current_admin_user

router = APIRouter(tags=["Cổng Ngân Hàng & Thanh Toán VietQR (Bank Gateway & Payments)"])

# Danh sách các ngân hàng lớn phổ biến tại Việt Nam hỗ trợ chuẩn VietQR / Napas
VIETNAM_BANKS: List[Dict[str, str]] = [
    {"id": "MB", "code": "MB", "short_name": "MB Bank", "name": "MB Bank (Ngân Hàng Quân Đội)", "logo": "https://img.vietqr.io/image/MB-0374617569-compact2.png"},
    {"id": "VCB", "code": "VCB", "short_name": "Vietcombank", "name": "Vietcombank (Ngoại Thương Việt Nam)", "logo": ""},
    {"id": "TCB", "code": "TCB", "short_name": "Techcombank", "name": "Techcombank (Kỹ Thương Việt Nam)", "logo": ""},
    {"id": "ICB", "code": "ICB", "short_name": "VietinBank", "name": "VietinBank (Công Thương Việt Nam)", "logo": ""},
    {"id": "BIDV", "code": "BIDV", "short_name": "BIDV", "name": "BIDV (Đầu Tư và Phát Triển)", "logo": ""},
    {"id": "ACB", "code": "ACB", "short_name": "ACB", "name": "ACB (Á Châu)", "logo": ""},
    {"id": "VPB", "code": "VPB", "short_name": "VPBank", "name": "VPBank (Việt Nam Thịnh Vượng)", "logo": ""},
    {"id": "TPB", "code": "TPB", "short_name": "TPBank", "name": "TPBank (Tiên Phong)", "logo": ""},
    {"id": "STB", "code": "STB", "short_name": "Sacombank", "name": "Sacombank (Sài Gòn Thương Tín)", "logo": ""},
    {"id": "HDB", "code": "HDB", "short_name": "HDBank", "name": "HDBank (Phát Triển TP.HCM)", "logo": ""},
    {"id": "VIB", "code": "VIB", "short_name": "VIB", "name": "VIB (Quốc Tế)", "logo": ""},
    {"id": "SHB", "code": "SHB", "short_name": "SHB", "name": "SHB (Sài Gòn - Hà Nội)", "logo": ""},
    {"id": "MSB", "code": "MSB", "short_name": "MSB", "name": "MSB (Hàng Hải)", "logo": ""},
    {"id": "OCB", "code": "OCB", "short_name": "OCB", "name": "OCB (Phương Đông)", "logo": ""},
    {"id": "LPB", "code": "LPB", "short_name": "LPBank", "name": "LPBank (Lộc Phát Việt Nam)", "logo": ""},
    {"id": "SEAB", "code": "SEAB", "short_name": "SeABank", "name": "SeABank (Đông Nam Á)", "logo": ""},
    {"id": "MOMO", "code": "MOMO", "short_name": "MoMo", "name": "Ví Điện Tử MoMo (Napas VietQR)", "logo": ""}
]

DEFAULT_BANK_DATA = {
    "bank_code": "MB",
    "bank_name": "MB Bank (Ngân Hàng Quân Đội)",
    "account_number": "0374617569",
    "account_name": "DANG QUYET THANG",
    "branch": "Hội Sở Chính",
    "qr_template": "compact2",
    "memo_prefix": "NAP VIP",
    "is_active": True
}


def get_or_create_active_bank_account(db: Session) -> SystemBankAccount:
    """Lấy tài khoản ngân hàng thụ hưởng đang hoạt động hoặc khởi tạo mặc định nếu chưa có."""
    active_acc = db.query(SystemBankAccount).filter(SystemBankAccount.is_active == True).order_by(desc(SystemBankAccount.updated_at)).first()
    if not active_acc:
        active_acc = db.query(SystemBankAccount).order_by(desc(SystemBankAccount.id)).first()

    if not active_acc:
        now = datetime.datetime.now(datetime.timezone.utc)
        try:
            active_acc = SystemBankAccount(
                bank_code=DEFAULT_BANK_DATA["bank_code"],
                bank_name=DEFAULT_BANK_DATA["bank_name"],
                account_number=DEFAULT_BANK_DATA["account_number"],
                account_name=DEFAULT_BANK_DATA["account_name"],
                branch=DEFAULT_BANK_DATA["branch"],
                qr_template=DEFAULT_BANK_DATA["qr_template"],
                memo_prefix=DEFAULT_BANK_DATA["memo_prefix"],
                is_active=True,
                created_at=now,
                updated_at=now
            )
            db.add(active_acc)
            db.commit()
            db.refresh(active_acc)
        except Exception:
            db.rollback()
            active_acc = db.query(SystemBankAccount).order_by(desc(SystemBankAccount.id)).first()

    return active_acc


def format_bank_account_dict(acc: SystemBankAccount) -> dict:
    """Format đối tượng SystemBankAccount thành JSON chuẩn kèm URL Preview VietQR."""
    b_code = acc.bank_code or "MB"
    a_num = acc.account_number or "0374617569"
    tmpl = acc.qr_template or "compact2"
    a_name = acc.account_name or "DANG QUYET THANG"
    encoded_name = a_name.replace(" ", "%20")

    preview_url = f"https://img.vietqr.io/image/{b_code}-{a_num}-{tmpl}.png?amount=100000&addInfo=TEST%20GATEWAY&accountName={encoded_name}"

    return {
        "id": acc.id,
        "bank_code": b_code,
        "bank_name": acc.bank_name,
        "account_number": a_num,
        "account_name": a_name,
        "branch": acc.branch or "",
        "qr_template": tmpl,
        "memo_prefix": acc.memo_prefix or "NAP VIP",
        "is_active": acc.is_active,
        "preview_url": preview_url,
        # Aliases for backward compatibility
        "bank_id": b_code,
        "admin_bank_id": b_code,
        "admin_bank_name": acc.bank_name,
        "admin_account_number": a_num,
        "admin_account_name": a_name,
        "admin_qr_template": tmpl,
        "created_at": acc.created_at.strftime("%d/%m/%Y %H:%M") if acc.created_at else "---",
        "updated_at": acc.updated_at.strftime("%d/%m/%Y %H:%M") if acc.updated_at else "---"
    }


# =========================================================================
# SCHEMAS
# =========================================================================
class CreateDepositOrderRequest(BaseModel):
    amount: float = Field(..., ge=2000, description="Số tiền nạp (tối thiểu 2.000 VNĐ)")


class CreateVIPOrderRequest(BaseModel):
    plan_code: str = Field(..., description="PRO, PREMIUM, or PLATINUM")
    duration_months: Optional[int] = Field(1, description="1, 3, 6, 12")
    amount: Optional[float] = Field(None, description="Số tiền thanh toán")
    plan_duration_days: Optional[int] = Field(None, description="Số ngày cộng thêm")
    payment_method: Optional[str] = Field("MB_VIETQR", description="Phương thức thanh toán")


class PayVIPWithWalletRequest(BaseModel):
    plan_code: str = Field(..., description="PRO, PREMIUM, or PLATINUM")
    duration_months: Optional[int] = Field(1, description="1, 3, 6, 12")


class BankWebhookPayload(BaseModel):
    # Standard FinTrack / Generic format
    amount: Optional[float] = Field(None, description="Số tiền chuyển khoản (VNĐ)")
    description: Optional[str] = Field(None, description="Nội dung chuyển khoản (Memo/AddInfo)")
    transaction_date: Optional[Union[datetime.datetime, str]] = None
    account_number: Optional[str] = Field(None, description="Số tài khoản nhận")
    reference_code: Optional[str] = Field(None, description="Mã tham chiếu ngân hàng")
    bank_brand_name: Optional[str] = Field(None, description="Tên ngân hàng")
    sender_name: Optional[str] = Field(None, description="Tên người chuyển")
    sender_account: Optional[str] = Field(None, description="Số tài khoản người chuyển")
    code: Optional[str] = None

    # SePay Webhook format compatibility
    id: Optional[Union[int, str]] = None
    gateway: Optional[str] = None
    transactionDate: Optional[Union[datetime.datetime, str]] = None
    accountNumber: Optional[str] = None
    content: Optional[str] = None
    transferType: Optional[str] = None
    transferAmount: Optional[float] = None
    accumulated: Optional[float] = None
    subAccount: Optional[str] = None
    referenceCode: Optional[str] = None

    # Casso Webhook format compatibility
    error: Optional[int] = None
    data: Optional[List[Dict[str, Any]]] = None


class MockReceiveMoneyRequest(BaseModel):
    order_code: Optional[str] = Field(None, description="Mã đơn hàng cần giả lập tiền về (vd: ORD-9285)")
    amount: Optional[float] = Field(None, description="Số tiền chuyển khoản")
    description: Optional[str] = Field(None, description="Nội dung CK tùy chọn")
    user_id: Optional[int] = Field(None, description="User ID nhận tiền")


class BankGatewaySaveRequest(BaseModel):
    id: Optional[int] = None
    bank_code: Optional[str] = Field(None, description="Mã ngân hàng (MB, TCB, VCB, ICB, ACB, ...)")
    bank_id: Optional[str] = Field(None, description="Alias cho bank_code")
    bank_name: Optional[str] = Field(None, description="Tên hiển thị ngân hàng")
    account_number: str = Field(..., description="Số tài khoản ngân hàng")
    account_name: str = Field(..., description="Tên chủ tài khoản")
    branch: Optional[str] = Field("Hội Sở Chính", description="Chi nhánh hoặc ghi chú")
    qr_template: Optional[str] = Field("compact2", description="Template VietQR (compact2, compact, qr_only)")
    memo_prefix: Optional[str] = Field("NAP VIP", description="Tiền tố cú pháp nạp tiền")
    is_active: Optional[bool] = Field(True, description="Kích hoạt làm cổng thanh toán mặc định toàn sàn")


class ManualMatchRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="User ID cần cộng tiền / kích hoạt")
    order_code: Optional[str] = Field(None, description="Mã đơn hàng PENDING cần duyệt (nếu có)")
    note: Optional[str] = Field(None, description="Ghi chú đối soát của Admin")


# =========================================================================
# 1. CORE PAYMENT PROCESSING & TRANSACTION AUDIT LOGIC (100% AUTOMATED)
# =========================================================================
def process_bank_transfer_payment(
    db: Session,
    amount: float,
    description: str,
    transaction_date: Optional[Union[datetime.datetime, str]] = None,
    reference_code: Optional[str] = None,
    sender_name: Optional[str] = None,
    sender_account: Optional[str] = None,
    approved_by: str = "AUTO_WEBHOOK_BANK"
) -> dict:
    """
    Xử lý tự động 100% khi nhận webhook chuyển khoản từ Ngân Hàng hoặc Demo:
    1. Ghi nhận giao dịch vào bảng bank_transactions (biến động số dư).
    2. Trích xuất mã đơn hàng, User ID, mã gói từ description.
    3. Tìm đơn hàng PENDING khớp mã hoặc khớp User ID + số tiền.
    4. Cập nhật trạng thái đơn thành APPROVED, approved_by = 'AUTO_WEBHOOK_BANK'.
    5. Tự động kích hoạt/nâng cấp gói VIP cho User hoặc cộng tiền vào Ví Real Payment.
    6. Tạo thông báo tự động gửi vào Notification của User.
    7. Cập nhật trạng thái bank_transactions thành MATCHED hoặc UNMATCHED.
    """
    try:
        now = datetime.datetime.utcnow()
        desc_clean = (description or "").strip()
        desc_upper = desc_clean.upper()

        active_bank = get_or_create_active_bank_account(db)
        bank_disp = active_bank.bank_name or active_bank.bank_code or "Ngân Hàng"

        # Step 1: Regex Extraction (Khớp linh hoạt ORD-9285, FTP 1 928574, FTP 1 ORD-928574, FT NAP 9285, FTPLATINUM 1 928574, NAP VIP 9285,...)
        match_ord = re.search(r"ORD-?(\d+)", desc_upper)
        match_ftp = re.search(r"FTP\s*(\d+)\s*(?:ORD-?)?(\d+)", desc_upper)
        match_ft_memo = re.search(r"FT\s*(PLATINUM|PREMIUM|PRO|VIP)\s*(\d+)\s*(?:ORD-?)?(\d+)", desc_upper)
        match_ft_memo_no_space = re.search(r"FT(PLATINUM|PREMIUM|PRO|VIP)\s*(\d+)\s*(?:ORD-?)?(\d+)", desc_upper)
        match_ft_nap = re.search(r"FT\s*NAP\s*(\d+)", desc_upper)
        match_nap = re.search(r"NAP\s*(?:VIP|TIEN)?\s*(\d+)", desc_upper)
        number_tokens = re.findall(r"\b(\d{4,6})\b", desc_upper)
        match_user = re.search(r"\b(?:USER|ID|UID|U)\s*[:#-]?\s*(\d+)\b", desc_upper)

        candidate_order_codes = []
        if match_ord:
            raw_num = match_ord.group(1)
            candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        if match_ftp:
            raw_num = match_ftp.group(2)
            candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        if match_ft_nap:
            raw_num = match_ft_nap.group(1)
            candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        if match_ft_memo:
            raw_num = match_ft_memo.group(3)
            candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        if match_ft_memo_no_space:
            raw_num = match_ft_memo_no_space.group(3)
            candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        if match_nap:
            raw_num = match_nap.group(1)
            if len(raw_num) >= 4:
                candidate_order_codes.extend([f"ORD-{raw_num}", f"ORD{raw_num}", raw_num])
        for num in number_tokens:
            candidate_order_codes.extend([f"ORD-{num}", f"ORD{num}", num])

        extracted_user_id = None
        if match_ftp:
            extracted_user_id = int(match_ftp.group(1))
        elif match_ft_memo:
            extracted_user_id = int(match_ft_memo.group(2))
        elif match_ft_memo_no_space:
            extracted_user_id = int(match_ft_memo_no_space.group(2))
        elif match_nap:
            extracted_user_id = int(match_nap.group(1))
        elif match_user:
            extracted_user_id = int(match_user.group(1))

        # Step 2: Look for pending order
        order: Optional[SubscriptionOrder] = None

        # 2.1 By Candidate Order Codes
        if candidate_order_codes:
            order = db.query(SubscriptionOrder).filter(
                SubscriptionOrder.order_code.in_(candidate_order_codes),
                SubscriptionOrder.status == "PENDING"
            ).first()

        # 2.2 By Transfer Memo partial match
        if not order:
            pending_orders = db.query(SubscriptionOrder).filter(SubscriptionOrder.status == "PENDING").all()
            for po in pending_orders:
                if po.transfer_memo and (po.transfer_memo.upper() in desc_upper or desc_upper in po.transfer_memo.upper()):
                    order = po
                    break

        # 2.3 By User ID + Matching Amount
        if not order and extracted_user_id:
            order = db.query(SubscriptionOrder).filter(
                SubscriptionOrder.user_id == extracted_user_id,
                SubscriptionOrder.status == "PENDING"
            ).order_by(desc(SubscriptionOrder.created_at)).first()

        # 2.4 By Matching Amount recent pending order (fallback)
        if not order and amount > 0:
            order = db.query(SubscriptionOrder).filter(
                SubscriptionOrder.status == "PENDING",
                SubscriptionOrder.amount == amount
            ).order_by(desc(SubscriptionOrder.created_at)).first()

        # Record Bank Transaction
        generated_ref = reference_code or (f"TX-{number_tokens[0]}" if number_tokens else f"TX-{int(now.timestamp())}")
        bank_tx = BankTransaction(
            bank_account_id=active_bank.id,
            bank_code=active_bank.bank_code,
            account_number=active_bank.account_number,
            reference_code=generated_ref,
            sender_name=sender_name or "Khách Hàng Chuyển Khoản",
            sender_account=sender_account or "---",
            amount=float(amount),
            description=desc_clean,
            transaction_date=now,
            status="MATCHED" if (order or extracted_user_id) else "UNMATCHED",
            matched_order_code=order.order_code if order else None,
            matched_user_id=order.user_id if order else extracted_user_id,
            created_at=now
        )
        db.add(bank_tx)

        # Step 3: Handle Execution
        if order:
            target_user = db.query(User).filter(User.id == order.user_id).first()
            if not target_user:
                raise HTTPException(status_code=404, detail=f"Không tìm thấy người dùng #{order.user_id} của đơn hàng")

            bank_tx.matched_user_id = target_user.id
            bank_tx.matched_user_name = target_user.full_name
            bank_tx.matched_order_code = order.order_code
            bank_tx.status = "MATCHED"

            # 3.1 Update Order Status
            order.status = "APPROVED"
            order.approved_by = approved_by
            order.updated_at = now

            plan_code = (order.plan_code or "PRO").upper()
            if plan_code == "VIP":
                plan_code = "PREMIUM"

            if plan_code in ["PRO", "PREMIUM", "PLATINUM"]:
                try:
                    duration_days = int(order.plan_duration_days) if order.plan_duration_days else 30
                except (ValueError, TypeError):
                    duration_days = 30
                if duration_days <= 0:
                    duration_days = 30

                # Xử lý cộng ngày hết hạn plan_expires_at (chuẩn hóa naive datetime cho SQLite)
                user_exp = target_user.plan_expires_at
                if user_exp and hasattr(user_exp, "tzinfo") and user_exp.tzinfo is not None:
                    user_exp = user_exp.replace(tzinfo=None)

                if user_exp and user_exp > now and (target_user.plan or "").upper() == plan_code:
                    target_user.plan_expires_at = user_exp + datetime.timedelta(days=duration_days)
                else:
                    target_user.plan_activated_at = now
                    target_user.plan_expires_at = now + datetime.timedelta(days=duration_days)

                target_user.plan = plan_code
                if plan_code == "PLATINUM":
                    target_user.plan_tier = "FinTrack Platinum VIP"
                elif plan_code in ["PREMIUM", "VIP"]:
                    target_user.plan_tier = "FinTrack Premium"
                elif plan_code == "PRO":
                    target_user.plan_tier = "FinTrack Pro"
                else:
                    target_user.plan_tier = "Free"

                target_user.is_plan_active = True
                target_user.status = "ACTIVE"
                target_user.updated_at = now

                notif = Notification(
                    user_id=target_user.id,
                    target_type="USER",
                    title="🎉 Kích Hoạt Tự Động Gói VIP Thành Công!",
                    message=f"Đơn nạp #{order.order_code} đã được hệ thống kích hoạt tự động thành công qua {bank_disp}! Gói {target_user.plan_tier} có hạn dùng đến {target_user.plan_expires_at.strftime('%d/%m/%Y')}.",
                    type="SUCCESS",
                    icon="crown",
                    link_tab="subscription",
                    is_read=False,
                    created_by_role=approved_by,
                    created_at=now
                )
                db.add(notif)
                db.commit()
                db.refresh(order)
                db.refresh(target_user)

                return {
                    "success": True,
                    "action": "PLAN_ACTIVATED_AUTO",
                    "message": f"Đơn hàng #{order.order_code} đã được hệ thống kích hoạt tự động thành công!",
                    "order_code": order.order_code,
                    "status": "APPROVED",
                    "approved_by": approved_by,
                    "transaction_id": bank_tx.id,
                    "user": {
                        "id": target_user.id,
                        "full_name": target_user.full_name,
                        "plan": target_user.plan,
                        "plan_tier": target_user.plan_tier,
                        "plan_expires_at": target_user.plan_expires_at.strftime("%d/%m/%Y %H:%M") if target_user.plan_expires_at else None
                    }
                }

            else:
                # REAL_WALLET / WALLET_TOPUP / REAL_DEPOSIT
                real_wallet = db.query(Wallet).filter(
                    Wallet.user_id == target_user.id,
                    Wallet.wallet_scope == "real"
                ).first()

                if not real_wallet:
                    real_wallet = Wallet(
                        user_id=target_user.id,
                        name="Ví Dịch Vụ & VIP FinTrack",
                        wallet_type="EWALLET",
                        balance=0.0,
                        currency="VND",
                        icon="wallet",
                        color="#F59E0B",
                        wallet_scope="real",
                        is_active=True,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(real_wallet)
                    db.flush()

                real_wallet.balance += float(amount)
                real_wallet.updated_at = now

                cat = db.query(Category).filter(
                    Category.user_id == target_user.id,
                    Category.name == "Nạp Tiền Thật"
                ).first()
                if not cat:
                    cat = Category(
                        user_id=target_user.id,
                        name="Nạp Tiền Thật",
                        type="INCOME",
                        group="INCOME",
                        icon="circle-plus",
                        color="#F59E0B",
                        is_default=False
                    )
                    db.add(cat)
                    db.flush()

                tx = Transaction(
                    user_id=target_user.id,
                    wallet_id=real_wallet.id,
                    category_id=cat.id,
                    type="INCOME",
                    amount=float(amount),
                    transaction_date=now,
                    note=f"Nạp tiền thật tự động qua {bank_disp}: {order.order_code}",
                    created_by_ai="AUTO_WEBHOOK_BANK"
                )
                db.add(tx)

                notif = Notification(
                    user_id=target_user.id,
                    target_type="USER",
                    title="💰 Nạp Tiền Thật Thành Công (Tự Động)!",
                    message=f"Đơn nạp #{order.order_code} đã được hệ thống kích hoạt tự động thành công! Đã cộng +{amount:,.0f} ₫ vào Ví Dịch Vụ & VIP.",
                    type="SUCCESS",
                    icon="wallet",
                    link_tab="wallets",
                    is_read=False,
                    created_by_role=approved_by,
                    created_at=now
                )
                db.add(notif)
                db.commit()
                db.refresh(order)
                db.refresh(real_wallet)

                return {
                    "success": True,
                    "action": "WALLET_TOPUP_AUTO",
                    "message": f"Đã tự động cộng +{amount:,.0f} ₫ vào ví tiền thật của người dùng #{target_user.id}!",
                    "order_code": order.order_code,
                    "status": "APPROVED",
                    "approved_by": approved_by,
                    "transaction_id": bank_tx.id,
                    "wallet": {
                        "id": real_wallet.id,
                        "name": real_wallet.name,
                        "new_balance": real_wallet.balance
                    }
                }

        # Step 4: No pre-existing order, but User ID was detected
        if extracted_user_id:
            target_user = db.query(User).filter(User.id == extracted_user_id).first()
            if target_user:
                bank_tx.matched_user_id = target_user.id
                bank_tx.matched_user_name = target_user.full_name
                bank_tx.status = "MATCHED"

                if match_ft_memo or match_ft_memo_no_space or "PLATINUM" in desc_upper or "PREMIUM" in desc_upper or "PRO" in desc_upper:
                    if match_ft_memo:
                        plan_code = match_ft_memo.group(1).upper()
                    elif match_ft_memo_no_space:
                        plan_code = match_ft_memo_no_space.group(1).upper()
                    elif "PLATINUM" in desc_upper:
                        plan_code = "PLATINUM"
                    elif "PREMIUM" in desc_upper or "VIP" in desc_upper:
                        plan_code = "PREMIUM"
                    else:
                        plan_code = "PRO"

                    if plan_code == "VIP":
                        plan_code = "PREMIUM"

                    duration_days = 30
                    random_digits = number_tokens[0] if number_tokens else f"{int(now.timestamp()) % 1000000:06d}"
                    order_code = f"ORD-{random_digits}"
                    bank_tx.matched_order_code = order_code

                    new_order = SubscriptionOrder(
                        order_code=order_code,
                        user_id=target_user.id,
                        plan_code=plan_code,
                        plan_duration_days=duration_days,
                        amount=float(amount),
                        payment_method=f"{active_bank.bank_code}_VIETQR",
                        transfer_memo=desc_clean,
                        status="APPROVED",
                        approved_by=approved_by,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(new_order)

                    user_exp = target_user.plan_expires_at
                    if user_exp and hasattr(user_exp, "tzinfo") and user_exp.tzinfo is not None:
                        user_exp = user_exp.replace(tzinfo=None)

                    if user_exp and user_exp > now and (target_user.plan or "").upper() == plan_code:
                        target_user.plan_expires_at = user_exp + datetime.timedelta(days=duration_days)
                    else:
                        target_user.plan_activated_at = now
                        target_user.plan_expires_at = now + datetime.timedelta(days=duration_days)

                    target_user.plan = plan_code
                    if plan_code == "PLATINUM":
                        target_user.plan_tier = "FinTrack Platinum VIP"
                    elif plan_code in ["PREMIUM", "VIP"]:
                        target_user.plan_tier = "FinTrack Premium"
                    elif plan_code == "PRO":
                        target_user.plan_tier = "FinTrack Pro"

                    target_user.is_plan_active = True
                    target_user.status = "ACTIVE"
                    target_user.updated_at = now

                    notif = Notification(
                        user_id=target_user.id,
                        target_type="USER",
                        title="🎉 Kích Hoạt Tự Động Gói VIP Thành Công!",
                        message=f"Hệ thống đã tự động kích hoạt gói {target_user.plan_tier} cho bạn từ giao dịch {bank_disp}! Hạn sử dụng đến {target_user.plan_expires_at.strftime('%d/%m/%Y')}.",
                        type="SUCCESS",
                        icon="crown",
                        link_tab="subscription",
                        is_read=False,
                        created_by_role=approved_by,
                        created_at=now
                    )
                    db.add(notif)
                    db.commit()
                    db.refresh(new_order)
                    db.refresh(target_user)

                    return {
                        "success": True,
                        "action": "PLAN_ACTIVATED_AUTO_ON_THE_FLY",
                        "message": f"Đã tự động tạo và kích hoạt gói {plan_code} VIP cho người dùng #{target_user.id}!",
                        "order_code": order_code,
                        "status": "APPROVED",
                        "approved_by": approved_by,
                        "transaction_id": bank_tx.id,
                        "user": {
                            "id": target_user.id,
                            "plan": target_user.plan,
                            "plan_tier": target_user.plan_tier,
                            "plan_expires_at": target_user.plan_expires_at.strftime("%d/%m/%Y %H:%M") if target_user.plan_expires_at else None
                        }
                    }

                # Direct deposit to user real wallet
                real_wallet = db.query(Wallet).filter(
                    Wallet.user_id == target_user.id,
                    Wallet.wallet_scope == "real"
                ).first()

                if not real_wallet:
                    real_wallet = Wallet(
                        user_id=target_user.id,
                        name="Ví Dịch Vụ & VIP FinTrack",
                        wallet_type="EWALLET",
                        balance=0.0,
                        currency="VND",
                        icon="wallet",
                        color="#F59E0B",
                        wallet_scope="real",
                        is_active=True,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(real_wallet)
                    db.flush()

                real_wallet.balance += float(amount)
                real_wallet.updated_at = now

                cat = db.query(Category).filter(
                    Category.user_id == target_user.id,
                    Category.name == "Nạp Tiền Thật"
                ).first()
                if not cat:
                    cat = Category(
                        user_id=target_user.id,
                        name="Nạp Tiền Thật",
                        type="INCOME",
                        group="INCOME",
                        icon="circle-plus",
                        color="#F59E0B",
                        is_default=False
                    )
                    db.add(cat)
                    db.flush()

                tx = Transaction(
                    user_id=target_user.id,
                    wallet_id=real_wallet.id,
                    category_id=cat.id,
                    type="INCOME",
                    amount=float(amount),
                    transaction_date=now,
                    note=f"Nạp tiền thật tự động qua {bank_disp}: {desc_clean}",
                    created_by_ai="AUTO_WEBHOOK_BANK"
                )
                db.add(tx)

                notif = Notification(
                    user_id=target_user.id,
                    target_type="USER",
                    title="💰 Nạp Tiền Thật Thành Công (Tự Động)!",
                    message=f"Hệ thống FinTrack AI đã tự động ghi nhận giao dịch +{amount:,.0f} ₫ từ {bank_disp} và cộng vào Ví Tiền Thật của bạn!",
                    type="SUCCESS",
                    icon="wallet",
                    link_tab="wallets",
                    is_read=False,
                    created_by_role=approved_by,
                    created_at=now
                )
                db.add(notif)
                db.commit()
                db.refresh(real_wallet)

                return {
                    "success": True,
                    "action": "WALLET_DEPOSIT_DIRECT_AUTO",
                    "message": f"Hệ thống đã tự động cộng +{amount:,.0f} ₫ vào ví tiền thật của User #{target_user.id}!",
                    "status": "APPROVED",
                    "approved_by": approved_by,
                    "transaction_id": bank_tx.id,
                    "wallet": {
                        "id": real_wallet.id,
                        "name": real_wallet.name,
                        "new_balance": real_wallet.balance
                    }
                }

        # Step 5: Unmatched transfer
        db.commit()
        return {
            "success": False,
            "action": "UNMATCHED_LOGGED",
            "message": "Không tìm thấy đơn hàng hoặc User ID phù hợp trong nội dung chuyển khoản. Đã ghi nhận vào lịch sử giao dịch để đối soát thủ công.",
            "description": desc_clean,
            "amount": amount,
            "transaction_id": bank_tx.id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("LỖI THANH TOÁN VIP DEMO / BANK PROCESS:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý giao dịch thanh toán: {str(e)}")


# =========================================================================
# 2. PUBLIC API CHO CLIENT (USER) LẤY THÔNG TIN CỔNG NGÂN HÀNG THỤ HƯỞNG
# =========================================================================
@router.get("/public/active-bank-gateway")
@router.get("/public/payment-gateway-info")
@router.get("/payments/gateway-info")
def get_public_active_bank_gateway(db: Session = Depends(get_db)):
    """
    Trả về thông tin ngân hàng thụ hưởng đang kích hoạt (is_active=True) của sàn FinTrack AI.
    API công khai cho Client render mã VietQR động.
    """
    active_acc = get_or_create_active_bank_account(db)
    data = format_bank_account_dict(active_acc)
    data["available_banks"] = VIETNAM_BANKS
    return data


# =========================================================================
# 3. ADMIN API CẤU HÌNH CỔNG NGÂN HÀNG THỤ HƯỞNG & BIẾN ĐỘNG SỐ DƯ
# =========================================================================
@router.get("/admin/bank-gateway")
@router.get("/admin/payment-settings")
def get_admin_bank_gateway_details(
    current_admin: User = Depends(get_current_admin_or_moderator_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin cấu hình cổng ngân hàng đang kích hoạt + danh sách tài khoản đã lưu.
    """
    active_acc = get_or_create_active_bank_account(db)
    all_accounts = db.query(SystemBankAccount).order_by(desc(SystemBankAccount.is_active), desc(SystemBankAccount.updated_at)).all()

    return {
        "active_gateway": format_bank_account_dict(active_acc),
        "settings": format_bank_account_dict(active_acc),  # Alias
        "all_accounts": [format_bank_account_dict(a) for a in all_accounts],
        "available_banks": VIETNAM_BANKS,
        "automation_settings": {
            "default_memo_prefix": active_acc.memo_prefix or "NAP VIP",
            "auto_approve_enabled": True,
            "polling_interval_seconds": 3
        }
    }


@router.post("/admin/bank-gateway")
@router.put("/admin/bank-gateway")
@router.put("/admin/payment-settings")
def save_admin_bank_gateway(
    payload: BankGatewaySaveRequest,
    current_admin: User = Depends(get_current_admin_or_moderator_user),
    db: Session = Depends(get_db)
):
    """
    Lưu và đồng bộ cổng ngân hàng thụ hưởng mới của sàn:
    - Chọn ngân hàng từ danh sách VietQR / Napas
    - Nhập STK, Tên chủ TK, Chi nhánh / Ghi chú
    - Toggle Kích hoạt làm cổng mặc định toàn sàn
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    raw_bank_code = payload.bank_code or payload.bank_id or "MB"
    bank_code = raw_bank_code.strip().upper()

    bank_name = payload.bank_name
    if not bank_name:
        found_b = next((b for b in VIETNAM_BANKS if b["id"].upper() == bank_code or b["code"].upper() == bank_code), None)
        bank_name = found_b["name"] if found_b else f"Ngân Hàng {bank_code}"

    account_number = payload.account_number.strip().replace(" ", "")
    if not account_number:
        raise HTTPException(status_code=400, detail="Số tài khoản ngân hàng không được để trống")

    account_name = payload.account_name.strip().upper()
    if not account_name:
        raise HTTPException(status_code=400, detail="Tên chủ tài khoản không được để trống")

    is_active = payload.is_active if payload.is_active is not None else True

    # If setting as active, deactivate existing active accounts
    if is_active:
        db.query(SystemBankAccount).update({SystemBankAccount.is_active: False})

    # Check if this account already exists
    existing_acc = None
    if payload.id:
        existing_acc = db.query(SystemBankAccount).filter(SystemBankAccount.id == payload.id).first()
    if not existing_acc:
        existing_acc = db.query(SystemBankAccount).filter(
            SystemBankAccount.bank_code == bank_code,
            SystemBankAccount.account_number == account_number
        ).first()

    if existing_acc:
        existing_acc.bank_code = bank_code
        existing_acc.bank_name = bank_name
        existing_acc.account_number = account_number
        existing_acc.account_name = account_name
        existing_acc.branch = payload.branch or "Hội Sở Chính"
        existing_acc.qr_template = payload.qr_template or "compact2"
        existing_acc.memo_prefix = payload.memo_prefix or "NAP VIP"
        existing_acc.is_active = is_active
        existing_acc.updated_at = now
        target_acc = existing_acc
    else:
        target_acc = SystemBankAccount(
            bank_code=bank_code,
            bank_name=bank_name,
            account_number=account_number,
            account_name=account_name,
            branch=payload.branch or "Hội Sở Chính",
            qr_template=payload.qr_template or "compact2",
            memo_prefix=payload.memo_prefix or "NAP VIP",
            is_active=is_active,
            created_at=now,
            updated_at=now
        )
        db.add(target_acc)

    # Sync into system_settings key-values for legacy support
    settings_map = {
        "admin_bank_id": bank_code,
        "admin_bank_name": bank_name,
        "admin_account_number": account_number,
        "admin_account_name": account_name,
        "admin_qr_template": payload.qr_template or "compact2"
    }
    for k, v in settings_map.items():
        st = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if st:
            st.value = v
            st.updated_at = now
        else:
            db.add(SystemSetting(key=k, value=v, description="Payment Gateway Config", updated_at=now))

    db.commit()
    db.refresh(target_acc)

    formatted = format_bank_account_dict(target_acc)
    return {
        "success": True,
        "message": f"Đã lưu và đồng bộ cổng thanh toán VietQR cho {bank_name} (STK: {account_number}) thành công!",
        "active_gateway": formatted,
        "settings": formatted,
        "updated_by": current_admin.email
    }


# =========================================================================
# 4. ADMIN API LỊCH SỬ GIAO DỊCH & BIẾN ĐỘNG SỐ DƯ (MODULE 2)
# =========================================================================
@router.get("/admin/bank-gateway/transactions")
def get_admin_bank_transactions(
    search: Optional[str] = Query(None, description="Tìm kiếm theo memo, mã GD hoặc tên"),
    status_filter: Optional[str] = Query("ALL", description="Lọc theo trạng thái: ALL, MATCHED, UNMATCHED, MANUALLY_MATCHED"),
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(get_current_admin_or_moderator_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các giao dịch chuyển khoản vào tài khoản Admin qua Webhook / Bank Sync.
    """
    query = db.query(BankTransaction)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(BankTransaction.status == status_filter.upper())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                BankTransaction.description.ilike(s),
                BankTransaction.reference_code.ilike(s),
                BankTransaction.sender_name.ilike(s),
                BankTransaction.matched_order_code.ilike(s),
                BankTransaction.matched_user_name.ilike(s)
            )
        )

    txs = query.order_by(desc(BankTransaction.transaction_date)).limit(limit).all()

    # Calculate statistics
    total_received = sum(t.amount for t in txs if t.amount > 0)
    matched_count = sum(1 for t in txs if t.status in ["MATCHED", "MANUALLY_MATCHED"])
    unmatched_count = sum(1 for t in txs if t.status == "UNMATCHED")

    formatted_txs = []
    for t in txs:
        formatted_txs.append({
            "id": t.id,
            "bank_account_id": t.bank_account_id,
            "bank_code": t.bank_code or "MB",
            "account_number": t.account_number or "",
            "reference_code": t.reference_code or f"TX-{t.id}",
            "sender_name": t.sender_name or "Khách Hàng",
            "sender_account": t.sender_account or "---",
            "amount": t.amount,
            "description": t.description,
            "transaction_date": t.transaction_date.strftime("%d/%m/%Y %H:%M:%S") if t.transaction_date else "---",
            "status": t.status,
            "matched_order_code": t.matched_order_code,
            "matched_user_id": t.matched_user_id,
            "matched_user_name": t.matched_user_name or (f"User #{t.matched_user_id}" if t.matched_user_id else None),
            "notes": t.notes or ""
        })

    return {
        "transactions": formatted_txs,
        "total_count": len(formatted_txs),
        "total_received_amount": total_received,
        "matched_count": matched_count,
        "unmatched_count": unmatched_count
    }


@router.post("/admin/bank-gateway/transactions/{tx_id}/manual-match")
def manual_match_bank_transaction(
    tx_id: int,
    payload: ManualMatchRequest,
    current_admin: User = Depends(get_current_admin_or_moderator_user),
    db: Session = Depends(get_db)
):
    """
    Khớp thủ công giao dịch chuyển khoản cho người dùng khi User chuyển khoản gõ sai cú pháp:
    - Chỉ định User ID hoặc Mã đơn hàng
    - Hệ thống tự động cộng tiền vào ví thật hoặc kích hoạt gói VIP và gửi thông báo
    """
    bank_tx = db.query(BankTransaction).filter(BankTransaction.id == tx_id).first()
    if not bank_tx:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch ngân hàng")

    now = datetime.datetime.now(datetime.timezone.utc)
    target_user: Optional[User] = None
    target_order: Optional[SubscriptionOrder] = None

    if payload.order_code:
        code = payload.order_code.strip()
        target_order = db.query(SubscriptionOrder).filter(
            or_(SubscriptionOrder.order_code == code, SubscriptionOrder.order_code == f"ORD-{code}")
        ).first()
        if target_order:
            target_user = db.query(User).filter(User.id == target_order.user_id).first()

    if not target_user and payload.user_id:
        target_user = db.query(User).filter(User.id == payload.user_id).first()

    if not target_user:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp User ID hoặc Mã đơn hàng hợp lệ để khớp")

    # Perform activation or topup
    if target_order and target_order.status == "PENDING":
        target_order.status = "APPROVED"
        target_order.approved_by = f"ADMIN_MANUAL ({current_admin.email})"
        target_order.updated_at = now

        plan_code = (target_order.plan_code or "PRO").upper()
        if plan_code in ["PRO", "PREMIUM", "PLATINUM"]:
            duration_days = target_order.plan_duration_days or 30
            if target_user.plan_expires_at and target_user.plan_expires_at > now and (target_user.plan or "").upper() == plan_code:
                target_user.plan_expires_at = target_user.plan_expires_at + datetime.timedelta(days=duration_days)
            else:
                target_user.plan_activated_at = now
                target_user.plan_expires_at = now + datetime.timedelta(days=duration_days)

            target_user.plan = plan_code
            if plan_code == "PLATINUM":
                target_user.plan_tier = "FinTrack Platinum VIP"
            elif plan_code == "PREMIUM":
                target_user.plan_tier = "FinTrack Premium"
            elif plan_code == "PRO":
                target_user.plan_tier = "FinTrack Pro"

            target_user.is_plan_active = True
            target_user.updated_at = now
    else:
        # Credit user real wallet
        real_wallet = db.query(Wallet).filter(
            Wallet.user_id == target_user.id,
            Wallet.wallet_scope == "real"
        ).first()

        if not real_wallet:
            real_wallet = Wallet(
                user_id=target_user.id,
                name="Ví Dịch Vụ & VIP FinTrack",
                wallet_type="EWALLET",
                balance=0.0,
                currency="VND",
                icon="wallet",
                color="#F59E0B",
                wallet_scope="real",
                is_active=True,
                created_at=now,
                updated_at=now
            )
            db.add(real_wallet)
            db.flush()

        real_wallet.balance += float(bank_tx.amount)
        real_wallet.updated_at = now

        cat = db.query(Category).filter(
            Category.user_id == target_user.id,
            Category.name == "Nạp Tiền Thật"
        ).first()
        if not cat:
            cat = Category(
                user_id=target_user.id,
                name="Nạp Tiền Thật",
                type="INCOME",
                group="INCOME",
                icon="circle-plus",
                color="#F59E0B",
                is_default=False
            )
            db.add(cat)
            db.flush()

        tx = Transaction(
            user_id=target_user.id,
            wallet_id=real_wallet.id,
            category_id=cat.id,
            type="INCOME",
            amount=float(bank_tx.amount),
            transaction_date=now,
            note=f"Khớp thủ công tiền nạp: {bank_tx.description}",
            created_by_ai=f"ADMIN_MANUAL ({current_admin.email})"
        )
        db.add(tx)

    # Update Bank Transaction Status
    bank_tx.status = "MANUALLY_MATCHED"
    bank_tx.matched_user_id = target_user.id
    bank_tx.matched_user_name = target_user.full_name
    if target_order:
        bank_tx.matched_order_code = target_order.order_code
    bank_tx.notes = payload.note or f"Admin {current_admin.email} khớp thủ công vào lúc {now.strftime('%d/%m/%Y %H:%M')}"

    # Notification
    notif = Notification(
        user_id=target_user.id,
        target_type="USER",
        title="💰 Giao Dịch Chuyển Khoản Đã Được Khớp Thủ Công!",
        message=f"Giao dịch +{bank_tx.amount:,.0f} ₫ (Ref: {bank_tx.reference_code}) đã được Quản Trị Viên kiểm tra và khớp thành công vào tài khoản của bạn.",
        type="SUCCESS",
        icon="wallet",
        link_tab="wallets",
        is_read=False,
        created_by_role="ADMIN_MANUAL",
        created_at=now
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": f"Đã khớp thủ công giao dịch {bank_tx.reference_code} cho người dùng {target_user.full_name} (#{target_user.id}) thành công!",
        "transaction_id": bank_tx.id,
        "status": "MANUALLY_MATCHED"
    }


# =========================================================================
# 5. DYNAMIC DEPOSIT ORDER & WEBHOOK & MOCK ENDPOINTS
# =========================================================================
@router.post("/payments/create-deposit-order")
@router.post("/create-deposit-order")
def create_deposit_order(
    payload: CreateDepositOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Khởi tạo đơn nạp tiền thật qua mã VietQR tự động:
    - Nhận vào amount (tối thiểu 2.000 VNĐ)
    - Sinh mã đơn ngắn gọn: ORD-xxxx (4 chữ số ngẫu nhiên)
    - Lấy thông tin tài khoản Admin đang active
    - Cú pháp chuyển khoản chuẩn: FT NAP xxxx
    - Lưu vào bảng subscription_orders với trạng thái PENDING
    - Sinh URL VietQR động chuẩn img.vietqr.io
    """
    if payload.amount < 2000:
        raise HTTPException(status_code=400, detail="Số tiền nạp tối thiểu là 2.000 VNĐ")

    now = datetime.datetime.now(datetime.timezone.utc)
    active_acc = get_or_create_active_bank_account(db)

    # Sinh mã 4 số ngẫu nhiên không trùng lặp
    order_num = f"{random.randint(1000, 9999)}"
    order_code = f"ORD-{order_num}"

    # Kiểm tra trùng lặp
    existing = db.query(SubscriptionOrder).filter(SubscriptionOrder.order_code == order_code).first()
    if existing:
        order_num = f"{random.randint(10000, 99999)}"
        order_code = f"ORD-{order_num}"

    transfer_memo = f"FT NAP {order_num}"

    new_order = SubscriptionOrder(
        order_code=order_code,
        user_id=current_user.id,
        plan_code="REAL_DEPOSIT",
        plan_duration_days=30,
        amount=float(payload.amount),
        payment_method=f"{active_acc.bank_code}_VIETQR",
        transfer_memo=transfer_memo,
        status="PENDING",
        created_at=now,
        updated_at=now
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    b_code = active_acc.bank_code or "MB"
    a_num = (active_acc.account_number or "0374617569").strip().replace(" ", "")
    tmpl = active_acc.qr_template or "compact2"
    a_name = active_acc.account_name or "DANG QUYET THANG"
    encoded_memo = urllib.parse.quote(transfer_memo)
    encoded_name = urllib.parse.quote(a_name.upper())

    vietqr_url = f"https://img.vietqr.io/image/{b_code}-{a_num}-{tmpl}.png?amount={int(payload.amount)}&addInfo={encoded_memo}&accountName={encoded_name}"

    return {
        "success": True,
        "order_code": order_code,
        "order_num": order_num,
        "amount": float(payload.amount),
        "transfer_memo": transfer_memo,
        "vietqr_url": vietqr_url,
        "status": "PENDING",
        "bank_info": {
            "bank_code": b_code,
            "bank_name": active_acc.bank_name,
            "account_number": a_num,
            "account_name": a_name,
            "qr_template": tmpl
        }
    }


@router.post("/payments/create-vip-order")
@router.post("/create-vip-order")
@router.post("/subscriptions/create-vip-order")
def create_vip_order(
    payload: CreateVIPOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Khởi tạo đơn gia hạn / đăng ký gói VIP qua mã VietQR tự động:
    - Nhận vào plan_code (PRO, PREMIUM, PLATINUM) và duration_months (1, 3, 6, 12)
    - Tự động tính số tiền và số ngày tương ứng chu kỳ
    - Sinh mã đơn 6 số ngẫu nhiên: ORD-xxxxxx
    - Cú pháp chuyển khoản định danh chuẩn: FTP <USER_ID> <MÃ_ĐƠN>
    - Trạng thái PENDING, sẵn sàng cho Webhook SePay/Ngân hàng tự động khớp
    """
    try:
        plan_code = payload.plan_code.upper()
        if plan_code not in ["PRO", "PREMIUM", "PLATINUM", "VIP"]:
            raise HTTPException(status_code=400, detail="Mã gói không hợp lệ. Chỉ chấp nhận: PRO, PREMIUM, PLATINUM.")

        if plan_code == "VIP":
            plan_code = "PREMIUM"

        try:
            months = int(payload.duration_months) if payload.duration_months else 1
        except (ValueError, TypeError):
            months = 1
        if months not in [1, 3, 6, 12]:
            months = 1

        # Bảng giá chuẩn theo chu kỳ
        if months == 12:
            price_map = {"PRO": 490000.0, "PREMIUM": 990000.0, "PLATINUM": 1990000.0}
            days_map = {"PRO": 365, "PREMIUM": 365, "PLATINUM": 365}
        elif months == 6:
            price_map = {"PRO": 264000.0, "PREMIUM": 534000.0, "PLATINUM": 1069000.0}
            days_map = {"PRO": 180, "PREMIUM": 180, "PLATINUM": 180}
        elif months == 3:
            price_map = {"PRO": 139000.0, "PREMIUM": 279000.0, "PLATINUM": 567000.0}
            days_map = {"PRO": 90, "PREMIUM": 90, "PLATINUM": 90}
        else:
            price_map = {"PRO": 49000.0, "PREMIUM": 99000.0, "PLATINUM": 199000.0}
            days_map = {"PRO": 30, "PREMIUM": 30, "PLATINUM": 30}

        final_amount = float(payload.amount) if payload.amount is not None else price_map.get(plan_code, 199000.0)
        try:
            duration_days = int(payload.plan_duration_days) if payload.plan_duration_days else days_map.get(plan_code, 30)
        except (ValueError, TypeError):
            duration_days = days_map.get(plan_code, 30)

        now = datetime.datetime.utcnow()
        active_acc = get_or_create_active_bank_account(db)

        # Sinh mã 6 chữ số ngẫu nhiên không trùng lặp
        order_num = f"{random.randint(100000, 999999)}"
        order_code = f"ORD-{order_num}"
        while db.query(SubscriptionOrder).filter(SubscriptionOrder.order_code == order_code).first():
            order_num = f"{random.randint(100000, 999999)}"
            order_code = f"ORD-{order_num}"

        transfer_memo = f"FTP {current_user.id} {order_num}"

        new_order = SubscriptionOrder(
            order_code=order_code,
            user_id=current_user.id,
            plan_code=plan_code,
            plan_duration_days=duration_days,
            amount=float(final_amount),
            payment_method=f"{active_acc.bank_code}_VIETQR",
            transfer_memo=transfer_memo,
            status="PENDING",
            created_at=now,
            updated_at=now
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        b_code = active_acc.bank_code or "MB"
        a_num = (active_acc.account_number or "0374617569").strip().replace(" ", "")
        tmpl = active_acc.qr_template or "compact2"
        a_name = active_acc.account_name or "DANG QUYET THANG"
        encoded_memo = urllib.parse.quote(transfer_memo)
        encoded_name = urllib.parse.quote(a_name.upper())

        vietqr_url = f"https://img.vietqr.io/image/{b_code}-{a_num}-{tmpl}.png?amount={int(final_amount)}&addInfo={encoded_memo}&accountName={encoded_name}"

        return {
            "success": True,
            "order_code": order_code,
            "order_num": order_num,
            "plan_code": plan_code,
            "duration_months": months,
            "plan_duration_days": duration_days,
            "amount": float(final_amount),
            "transfer_memo": transfer_memo,
            "vietqr_url": vietqr_url,
            "status": "PENDING",
            "bank_info": {
                "bank_code": b_code,
                "bank_name": active_acc.bank_name,
                "account_number": a_num,
                "account_name": a_name,
                "qr_template": tmpl
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print("LỖI TẠO ĐƠN VIP:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo đơn VIP: {str(e)}")


@router.post("/payments/pay-vip-wallet")
@router.post("/pay-vip-wallet")
@router.post("/payments/renew-vip-wallet")
def pay_vip_with_wallet(
    payload: PayVIPWithWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Thanh toán gia hạn / nâng cấp gói VIP trực tiếp từ Ví Tiền Thật (Real Payment Wallet):
    - Trừ trực tiếp số dư ví thật trong DB
    - Kích hoạt và cộng dồn hạn dùng VIP tức thì mà không cần quét QR
    - Ghi nhận giao dịch tài chính & tạo thông báo
    """
    try:
        plan_code = payload.plan_code.upper()
        if plan_code not in ["PRO", "PREMIUM", "PLATINUM", "VIP"]:
            raise HTTPException(status_code=400, detail="Mã gói không hợp lệ. Chỉ chấp nhận: PRO, PREMIUM, PLATINUM.")
        if plan_code == "VIP":
            plan_code = "PREMIUM"

        try:
            months = int(payload.duration_months) if payload.duration_months else 1
        except (ValueError, TypeError):
            months = 1
        if months not in [1, 3, 6, 12]:
            months = 1

        if months == 12:
            price_map = {"PRO": 490000.0, "PREMIUM": 990000.0, "PLATINUM": 1990000.0}
            days_map = {"PRO": 365, "PREMIUM": 365, "PLATINUM": 365}
        elif months == 6:
            price_map = {"PRO": 264000.0, "PREMIUM": 534000.0, "PLATINUM": 1069000.0}
            days_map = {"PRO": 180, "PREMIUM": 180, "PLATINUM": 180}
        elif months == 3:
            price_map = {"PRO": 139000.0, "PREMIUM": 279000.0, "PLATINUM": 567000.0}
            days_map = {"PRO": 90, "PREMIUM": 90, "PLATINUM": 90}
        else:
            price_map = {"PRO": 49000.0, "PREMIUM": 99000.0, "PLATINUM": 199000.0}
            days_map = {"PRO": 30, "PREMIUM": 30, "PLATINUM": 30}

        price = price_map.get(plan_code, 199000.0)
        duration_days = days_map.get(plan_code, 30)

        now = datetime.datetime.utcnow()

        # Tìm hoặc tạo ví tiền thật (Real Payment Wallet)
        real_wallet = db.query(Wallet).filter(
            Wallet.user_id == current_user.id,
            Wallet.wallet_scope == "real"
        ).first()

        if not real_wallet:
            real_wallet = Wallet(
                user_id=current_user.id,
                name="Ví Thanh Toán Dịch Vụ & VIP FinTrack",
                wallet_type="BANK",
                wallet_scope="real",
                balance=500000.0 if current_user.email == "user@fintrack.ai" else 0.0,
                currency=current_user.currency or "VND",
                account_number_masked="MB-0374617569",
                icon="credit-card",
                color="#F59E0B",
                is_active=True,
                created_at=now,
                updated_at=now
            )
            db.add(real_wallet)
            db.flush()

        if real_wallet.balance < price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số dư Ví Tiền Thật ({real_wallet.balance:,.0f} ₫) không đủ để thanh toán {price:,.0f} ₫. Vui lòng nạp thêm tiền thật!"
            )

        # Trừ trực tiếp số dư ví thật
        real_wallet.balance -= price
        real_wallet.updated_at = now

        # Danh mục giao dịch
        cat = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.name == "Dịch Vụ & Đăng Ký VIP"
        ).first()
        if not cat:
            cat = Category(
                user_id=current_user.id,
                name="Dịch Vụ & Đăng Ký VIP",
                type="EXPENSE",
                group="WANTS",
                icon="crown",
                color="#F59E0B",
                is_default=False
            )
            db.add(cat)
            db.flush()

        tx = Transaction(
            user_id=current_user.id,
            wallet_id=real_wallet.id,
            category_id=cat.id,
            type="EXPENSE",
            amount=price,
            transaction_date=now,
            note=f"Trừ ví thanh toán gói {plan_code} VIP ({months} tháng - {duration_days} ngày)",
            created_by_ai="WALLET_PAYMENT"
        )
        db.add(tx)

        # Tạo đơn hàng đã APPROVED
        order_num = f"{random.randint(100000, 999999)}"
        order_code = f"ORD-{order_num}"
        new_order = SubscriptionOrder(
            order_code=order_code,
            user_id=current_user.id,
            plan_code=plan_code,
            plan_duration_days=duration_days,
            amount=price,
            payment_method="REAL_WALLET",
            transfer_memo=f"Trừ Ví Tiền Thật: {price:,.0f} ₫",
            status="APPROVED",
            approved_by="REAL_WALLET_DIRECT",
            created_at=now,
            updated_at=now
        )
        db.add(new_order)

        # Cập nhật thời hạn gói VIP (cộng dồn nếu còn hạn)
        user_exp = current_user.plan_expires_at
        if user_exp and hasattr(user_exp, "tzinfo") and user_exp.tzinfo is not None:
            user_exp = user_exp.replace(tzinfo=None)

        if (current_user.plan or "").upper() == plan_code and user_exp and user_exp > now:
            current_user.plan_expires_at = user_exp + datetime.timedelta(days=duration_days)
        else:
            current_user.plan_activated_at = now
            current_user.plan_expires_at = now + datetime.timedelta(days=duration_days)

        current_user.plan = plan_code
        if plan_code == "PLATINUM":
            current_user.plan_tier = "FinTrack Platinum VIP"
        elif plan_code in ["PREMIUM", "VIP"]:
            current_user.plan_tier = "FinTrack Premium"
        elif plan_code == "PRO":
            current_user.plan_tier = "FinTrack Pro"
        else:
            current_user.plan_tier = "Free"

        current_user.is_plan_active = True
        current_user.status = "ACTIVE"
        current_user.updated_at = now

        # Thông báo hệ thống
        notif = Notification(
            user_id=current_user.id,
            target_type="USER",
            title="👑 Kích Hoạt Gói VIP Thành Công (Trừ Ví)!",
            message=f"Đã thanh toán {price:,.0f} ₫ từ Ví Tiền Thật và kích hoạt gói {current_user.plan_tier} ({duration_days} ngày) thành công! Hạn dùng đến {current_user.plan_expires_at.strftime('%d/%m/%Y %H:%M')}.",
            type="SUCCESS",
            icon="crown",
            link_tab="subscription",
            is_read=False,
            created_by_role="REAL_WALLET_DIRECT",
            created_at=now
        )
        db.add(notif)
        db.commit()
        db.refresh(current_user)
        db.refresh(real_wallet)

        return {
            "success": True,
            "message": f"Thanh toán thành công {price:,.0f} ₫ từ Ví Tiền Thật! Đã kích hoạt gói {current_user.plan_tier}.",
            "order_code": order_code,
            "wallet": {
                "id": real_wallet.id,
                "name": real_wallet.name,
                "balance": real_wallet.balance
            },
            "user": {
                "id": current_user.id,
                "full_name": current_user.full_name,
                "plan": current_user.plan,
                "plan_tier": current_user.plan_tier,
                "plan_expires_at": current_user.plan_expires_at.strftime("%d/%m/%Y %H:%M") if current_user.plan_expires_at else None,
                "days_remaining": current_user.days_remaining
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("LỖI THANH TOÁN VÍ THẬT:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi thanh toán ví thật: {str(e)}")


@router.post("/payments/demo-simulate")
@router.post("/payments/simulate")
@router.post("/payments/webhook-mock")
@router.post("/payments/mock-mb-receive")
@router.post("/payments/mock-receive-money")
@router.post("/mock-mb-receive")
@router.post("/mock-receive-money")
@router.post("/demo-simulate")
@router.post("/webhook-mock")
def mock_receive_money(
    payload: MockReceiveMoneyRequest,
    db: Session = Depends(get_db)
):
    """
    Mô phỏng ngân hàng báo biến động số dư tiền về thành công (Dành cho Demo trước Hội Đồng).
    Hỗ trợ kích hoạt tự động tức thì cho đơn hàng hiển thị trên giao diện hoặc User ID.
    """
    try:
        raw_code = str(payload.order_code or "").strip().lstrip("#")
        clean_num = re.sub(r"[^\d]", "", raw_code)

        order = None
        if raw_code:
            order = db.query(SubscriptionOrder).filter(
                or_(
                    SubscriptionOrder.order_code == raw_code,
                    SubscriptionOrder.order_code == f"ORD-{raw_code}",
                    SubscriptionOrder.order_code == f"ORD-{clean_num}" if clean_num else False,
                    SubscriptionOrder.order_code.like(f"%{raw_code}%"),
                    SubscriptionOrder.order_code.like(f"%{clean_num}%") if clean_num else False
                )
            ).order_by(desc(SubscriptionOrder.created_at)).first()

        amount = payload.amount
        if not amount or float(amount) <= 0:
            if order and order.amount:
                amount = float(order.amount)
            else:
                amount = 199000.0

        description = payload.description
        if not description:
            if order and order.transfer_memo:
                description = order.transfer_memo
            elif order:
                description = f"FTP {order.user_id} {order.order_code.replace('ORD-', '')}"
            elif payload.user_id:
                description = f"FTP {payload.user_id} {clean_num or '999999'}"
            else:
                description = f"FTP 1 {clean_num or '999999'}"

        result = process_bank_transfer_payment(
            db=db,
            amount=float(amount),
            description=description,
            reference_code=f"MOCK-{int(datetime.datetime.utcnow().timestamp())}",
            sender_name="MÔ PHỎNG MB BANK (DEMO)",
            approved_by="AUTO_MOCK_BANK"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print("LỖI THANH TOÁN VIP DEMO:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi thanh toán VIP demo: {str(e)}")


@router.post("/payments/bank-webhook")
@router.post("/payments/webhook/bank-transfer")
@router.post("/webhook/bank-transfer")
def bank_transfer_webhook(
    payload: BankWebhookPayload,
    db: Session = Depends(get_db)
):
    """
    Webhook tiếp nhận biến động số dư chuyển khoản từ Cổng Ngân Hàng của sàn (hỗ trợ SePay, Casso, MB Bank, VietQR).
    Tự động đối soát nội dung chuyển khoản và kích hoạt gói VIP / cộng số dư ví 100% tự động.
    """
    # Hỗ trợ cấu trúc batch transactions của Casso
    if payload.data and isinstance(payload.data, list) and len(payload.data) > 0:
        results = []
        for item in payload.data:
            item_amount = float(item.get("amount") or item.get("transferAmount") or 0)
            item_desc = str(item.get("description") or item.get("content") or "")
            item_ref = str(item.get("tid") or item.get("reference_code") or item.get("referenceCode") or "")
            item_date = item.get("when") or item.get("transactionDate") or item.get("transaction_date")
            if item_amount > 0 and item_desc:
                res = process_bank_transfer_payment(
                    db=db,
                    amount=item_amount,
                    description=item_desc,
                    transaction_date=item_date,
                    reference_code=item_ref,
                    approved_by="AUTO_WEBHOOK_CASSO"
                )
                results.append(res)
        return {"success": True, "processed": len(results), "results": results}

    # Trích xuất số tiền từ các format (Standard amount, SePay transferAmount)
    final_amount = payload.transferAmount if payload.transferAmount is not None else payload.amount
    if final_amount is None:
        final_amount = 0.0
    final_amount = float(final_amount)

    if final_amount <= 0:
        raise HTTPException(status_code=400, detail="Số tiền chuyển khoản phải lớn hơn 0")

    final_desc = payload.content or payload.description or payload.code or ""
    final_ref = payload.referenceCode or payload.reference_code or (f"SEPAY-{payload.id}" if payload.id else None)
    final_date = payload.transactionDate or payload.transaction_date
    final_acc = payload.accountNumber or payload.account_number
    sender_acc = payload.sender_account or payload.subAccount

    approved_by = "AUTO_WEBHOOK_SEPAY" if (payload.gateway or payload.transferAmount is not None) else "AUTO_WEBHOOK_BANK"

    result = process_bank_transfer_payment(
        db=db,
        amount=final_amount,
        description=final_desc,
        transaction_date=final_date,
        reference_code=final_ref,
        sender_name=payload.sender_name or "Khách Hàng (Webhook)",
        sender_account=sender_acc,
        approved_by=approved_by
    )
    return result




@router.get("/payments/check-status/{order_code}")
@router.get("/payment/check-status/{order_code}")
@router.get("/check-status/{order_code}")
@router.get("/payments/order-status/{order_code}")
@router.get("/order-status/{order_code}")
@router.get("/subscription-orders/status/{order_code}")
@router.get("/subscriptions/status/{order_code}")
@router.get("/payments/status/{order_code}")
def get_public_order_status(
    order_code: str,
    db: Session = Depends(get_db)
):
    """
    Kiểm tra trạng thái đơn hàng thời gian thực (hỗ trợ Polling 3s/lần từ Client).
    """
    code = order_code.strip()
    order = db.query(SubscriptionOrder).filter(
        or_(
            SubscriptionOrder.order_code == code,
            SubscriptionOrder.order_code == f"ORD-{code}",
            SubscriptionOrder.order_code == code.replace("ORD-", ""),
            SubscriptionOrder.order_code.like(f"%{code}%")
        )
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin đơn hàng")

    is_paid = order.status in ["APPROVED", "PAID"]
    return {
        "success": True,
        "order_code": order.order_code,
        "status": order.status,
        "is_approved": is_paid,
        "is_paid": is_paid,
        "amount": order.amount,
        "plan_code": order.plan_code,
        "plan_duration_days": order.plan_duration_days,
        "order": {
            "id": order.id,
            "order_code": order.order_code,
            "plan_code": order.plan_code,
            "amount": order.amount,
            "status": order.status,
            "approved_by": order.approved_by,
            "transfer_memo": order.transfer_memo,
            "rejection_reason": order.rejection_reason,
            "created_at": order.created_at.strftime("%d/%m/%Y %H:%M") if order.created_at else "---",
            "updated_at": order.updated_at.strftime("%d/%m/%Y %H:%M") if order.updated_at else "---"
        }
    }
