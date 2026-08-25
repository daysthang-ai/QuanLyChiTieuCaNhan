from typing import Optional
import datetime
from pydantic import BaseModel, Field, ConfigDict

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="EXPENSE or INCOME")
    group: str = Field("NEEDS", description="NEEDS, WANTS, SAVINGS, INCOME")
    icon: Optional[str] = "tag"
    color: Optional[str] = "#10B981"
    is_default: Optional[bool] = False

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    group: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryOut(CategoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
