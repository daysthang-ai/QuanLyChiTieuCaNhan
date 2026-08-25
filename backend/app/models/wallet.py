import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    wallet_type = Column(String(20), nullable=False, default="BANK")  # CASH, BANK, EWALLET, SAVINGS
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    account_number_masked = Column(String(50), nullable=True)  # e.g., ****8888
    icon = Column(String(50), default="wallet", nullable=False)
    color = Column(String(30), default="#3B82F6", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    wallet_scope = Column(String(20), default="virtual", nullable=False)  # "virtual" (Sandbox ledger) or "real" (Service & VIP Payment)
    is_linked = Column(Boolean, default=False, nullable=True)
    bank_code = Column(String(50), nullable=True)
    auto_debit_enabled = Column(Boolean, default=False, nullable=True)
    linked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wallets")
    transactions = relationship("Transaction", foreign_keys="[Transaction.wallet_id]", back_populates="wallet")
