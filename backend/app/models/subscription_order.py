import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now

class SubscriptionOrder(Base):
    """
    Subscription / VIP Package Payment Orders.
    Supports MB_VIETQR, DIRECT_DEBIT, BANK_TRANSFER.
    """
    __tablename__ = "subscription_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_code = Column(String(20), nullable=False)  # PRO, PREMIUM, PLATINUM
    plan_duration_days = Column(Integer, default=30, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="MB_VIETQR", nullable=False)  # MB_VIETQR, DIRECT_DEBIT, BANK_TRANSFER
    transfer_memo = Column(String(100), nullable=True)  # E.g. FTPRO 123456
    status = Column(String(20), default="PENDING", index=True, nullable=False)  # PENDING, APPROVED, REJECTED
    proof_image = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="subscription_orders")
