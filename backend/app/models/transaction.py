import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=True, index=True)
    to_wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=True)  # for TRANSFER
    type = Column(String(20), nullable=False)  # EXPENSE, INCOME, TRANSFER
    amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, index=True)
    note = Column(Text, nullable=True)
    receipt_url = Column(String(255), nullable=True)
    created_by_ai = Column(String(20), default="MANUAL", nullable=False)  # AI_PARSED, MANUAL
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    wallet = relationship("Wallet", foreign_keys=[wallet_id], back_populates="transactions")
    to_wallet = relationship("Wallet", foreign_keys=[to_wallet_id])
    category = relationship("Category", back_populates="transactions")
