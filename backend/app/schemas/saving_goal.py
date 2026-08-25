from typing import Optional
import datetime
from pydantic import BaseModel, Field, ConfigDict

class SavingGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = Field(0.0, ge=0)
    target_date: Optional[datetime.date] = None
    status: Optional[str] = "ACTIVE"
    icon: Optional[str] = "bullseye"
    color: Optional[str] = "#10B981"
    note: Optional[str] = None

class SavingGoalCreate(SavingGoalBase):
    pass

class SavingGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[datetime.date] = None
    status: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None

class SavingGoalDeposit(BaseModel):
    amount: float = Field(..., gt=0)
    wallet_id: Optional[int] = Field(None, description="Optional wallet to deduct funds from")
    note: Optional[str] = "Nạp tiền vào quỹ tiết kiệm"

class SavingGoalOut(SavingGoalBase):
    id: int
    user_id: int
    progress_percentage: float = 0.0
    remaining_amount: float = 0.0
    days_left: Optional[int] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
