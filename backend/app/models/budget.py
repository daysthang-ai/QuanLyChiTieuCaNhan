import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_limit = Column(Float, nullable=False)
    period = Column(String(20), default="MONTHLY", nullable=False)  # MONTHLY, WEEKLY
    month_year = Column(String(7), nullable=False, index=True)  # YYYY-MM
    alert_80_sent = Column(Boolean, default=False, nullable=False)
    alert_100_sent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
