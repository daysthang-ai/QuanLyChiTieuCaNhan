import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base, get_utc_now

class SupportTicket(Base):
    """
    Support & Feedback Tickets from Users to Admin/Moderator.
    """
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="TECHNICAL", nullable=False)  # BILLING, TECHNICAL, ACCOUNT, FEATURE_REQUEST, OTHER
    priority = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(20), default="OPEN", index=True, nullable=False)  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    message = Column(Text, nullable=False)
    admin_reply = Column(Text, nullable=True)
    replied_by = Column(String(100), nullable=True)
    replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="support_tickets")
