from typing import Optional
import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.category import CategoryOut

class BudgetBase(BaseModel):
    category_id: int
    amount_limit: float = Field(..., gt=0)
    period: Optional[str] = "MONTHLY"
    month_year: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Format YYYY-MM")

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount_limit: Optional[float] = Field(None, gt=0)
    period: Optional[str] = None
    month_year: Optional[str] = None

class BudgetOut(BudgetBase):
    id: int
    user_id: int
    spent_amount: float = 0.0
    remaining_amount: float = 0.0
    percentage: float = 0.0
    status: str = "SAFE"  # SAFE (<80%), WARNING (80-99%), OVERSPENT (>=100%)
    category: Optional[CategoryOut] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
