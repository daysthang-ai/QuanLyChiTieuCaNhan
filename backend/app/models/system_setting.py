import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base

class SystemSetting(Base):
    """
    Bảng lưu trữ cấu hình hệ thống động (Key-Value Dynamic Settings).
    Ví dụ:
    - admin_bank_id: "MB"
    - admin_bank_name: "MB Bank (Ngân hàng Quân Đội)"
    - admin_account_number: "0374617569"
    - admin_account_name: "DANG QUYET THANG"
    - admin_qr_template: "compact2"
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
