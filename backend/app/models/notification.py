import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now

class Notification(Base):
    """
    Notification entity for both Broadcasts (ALL, FREE, PRO, PREMIUM)
    and Personal Direct Notifications (USER).
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    target_type = Column(String(20), default="ALL", nullable=False)  # ALL, FREE, PRO, PREMIUM, USER
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="INFO", nullable=False)  # INFO, SUCCESS, WARNING, MAINTENANCE, PROMOTION
    icon = Column(String(50), default="bell", nullable=False)
    link_tab = Column(String(50), nullable=True)  # dashboard, subscription, budgets, wallets, etc.
    is_read = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_by_role = Column(String(20), default="ADMIN", nullable=True)  # ADMIN, MODERATOR
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    reads = relationship("NotificationRead", back_populates="notification", cascade="all, delete-orphan")
    dismissals = relationship("NotificationDismiss", back_populates="notification", cascade="all, delete-orphan")


class NotificationRead(Base):
    """
    Tracks which users have read which notifications (especially for broadcasts).
    """
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    read_at = Column(DateTime, default=get_utc_now, nullable=False)

    notification = relationship("Notification", back_populates="reads")
    user = relationship("User", foreign_keys=[user_id])


class NotificationDismiss(Base):
    """
    Tracks which users have dismissed/deleted which broadcast notifications.
    """
    __tablename__ = "notification_dismissals"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    dismissed_at = Column(DateTime, default=get_utc_now, nullable=False)

    notification = relationship("Notification", back_populates="dismissals")
    user = relationship("User", foreign_keys=[user_id])
