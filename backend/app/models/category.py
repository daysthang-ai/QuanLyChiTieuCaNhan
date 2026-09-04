import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # NULL for global defaults
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # EXPENSE, INCOME
    group = Column(String(30), nullable=False, default="NEEDS")  # NEEDS, WANTS, SAVINGS, INCOME
    icon = Column(String(50), default="tag", nullable=False)
    color = Column(String(30), default="#10B981", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
