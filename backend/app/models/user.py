import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # USER, MODERATOR, ADMIN
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, LOCKED
    plan = Column(String(20), default="FREE", nullable=False)  # FREE, PRO, PREMIUM, PLATINUM
    plan_tier = Column(String(50), default="Free", nullable=False)  # Free, Pro, Premium, Platinum VIP
    plan_activated_at = Column(DateTime, nullable=True)
    plan_expires_at = Column(DateTime, nullable=True)
    is_plan_active = Column(Boolean, default=True, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    wallets = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    saving_goals = relationship("SavingGoal", back_populates="user", cascade="all, delete-orphan")
    ai_logs = relationship("AIChatLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", foreign_keys="Notification.user_id")
    subscription_orders = relationship("SubscriptionOrder", back_populates="user", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")

    @property
    def days_remaining(self) -> Optional[int]:
        if not self.plan_expires_at or (self.plan or "").upper() == "FREE":
            return None
        now = datetime.datetime.utcnow()
        if self.plan_expires_at <= now:
            return 0
        diff = self.plan_expires_at - now
        return diff.days + (1 if diff.seconds > 0 else 0)

    @property
    def is_active(self) -> bool:
        return (self.status or "ACTIVE").upper() == "ACTIVE"

    @property
    def is_banned(self) -> bool:
        return (self.status or "ACTIVE").upper() == "LOCKED"

    @property
    def plan_name(self) -> str:
        p = (self.plan or "FREE").upper()
        if p == "PLATINUM":
            return "FinTrack Platinum VIP"
        elif p == "PREMIUM":
            return "FinTrack Premium"
        elif p == "PRO":
            return "FinTrack Pro"
        return "FinTrack Free (Miễn phí)"
