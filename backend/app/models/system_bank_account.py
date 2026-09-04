import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now


class SystemBankAccount(Base):
    """
    Bảng lưu trữ thông tin tài khoản ngân hàng thụ hưởng của sàn FinTrack AI (Admin Bank Gateway).
    Cho phép Admin cấu hình, chuyển đổi tài khoản nhận tiền và kích hoạt cổng mặc định.
    """
    __tablename__ = "system_bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    bank_code = Column(String(20), index=True, nullable=False, default="MB")  # MB, VCB, TCB, ICB, ACB, BIDV, etc.
    bank_name = Column(String(100), nullable=False, default="MB Bank (Ngân Hàng Quân Đội)")
    account_number = Column(String(50), nullable=False, default="0374617569")
    account_name = Column(String(150), nullable=False, default="DANG QUYET THANG")
    branch = Column(String(150), nullable=True, default="Hội Sở Chính")
    qr_template = Column(String(30), nullable=False, default="compact2")
    memo_prefix = Column(String(50), nullable=False, default="NAP VIP")
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    transactions = relationship("BankTransaction", back_populates="bank_account", cascade="all, delete-orphan")


class BankTransaction(Base):
    """
    Bảng ghi nhận lịch sử biến động số dư và giao dịch ngân hàng chuyển vào tài khoản Admin qua Webhook.
    Hỗ trợ theo dõi, đối soát tự động và khớp lệnh thủ công khi User nhập sai cú pháp.
    """
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("system_bank_accounts.id", ondelete="SET NULL"), nullable=True)
    bank_code = Column(String(20), nullable=True)
    account_number = Column(String(50), nullable=True)
    reference_code = Column(String(100), index=True, nullable=True)
    sender_name = Column(String(150), nullable=True)
    sender_account = Column(String(50), nullable=True)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    transaction_date = Column(DateTime, default=get_utc_now)
    
    # Status: MATCHED (Đã khớp đơn tự động), UNMATCHED (Chưa khớp đơn), MANUALLY_MATCHED (Khớp thủ công)
    status = Column(String(30), default="MATCHED", index=True)
    
    matched_order_code = Column(String(50), nullable=True, index=True)
    matched_user_id = Column(Integer, nullable=True, index=True)
    matched_user_name = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    bank_account = relationship("SystemBankAccount", back_populates="transactions")
