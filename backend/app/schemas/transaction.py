from typing import Optional
import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.category import CategoryOut
from backend.app.schemas.wallet import WalletOut

class TransactionBase(BaseModel):
    wallet_id: int
    category_id: Optional[int] = None
    to_wallet_id: Optional[int] = None
    type: str = Field("EXPENSE", description="EXPENSE, INCOME, TRANSFER")
    amount: float = Field(..., gt=0, description="Transaction amount")
    transaction_date: Optional[datetime.datetime] = None
    note: Optional[str] = None
    receipt_url: Optional[str] = None
    created_by_ai: Optional[str] = "MANUAL"

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    wallet_id: Optional[int] = None
    category_id: Optional[int] = None
    to_wallet_id: Optional[int] = None
    type: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    transaction_date: Optional[datetime.datetime] = None
    note: Optional[str] = None
    receipt_url: Optional[str] = None

class TransactionOut(TransactionBase):
    id: int
    user_id: int
    transaction_date: datetime.datetime
    created_at: datetime.datetime
    category: Optional[CategoryOut] = None
    wallet: Optional[WalletOut] = None
    to_wallet: Optional[WalletOut] = None

    model_config = ConfigDict(from_attributes=True)

class TransactionFilter(BaseModel):
    from_date: Optional[datetime.date] = None
    to_date: Optional[datetime.date] = None
    category_id: Optional[int] = None
    wallet_id: Optional[int] = None
    type: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search: Optional[str] = None
    limit: int = 50
    offset: int = 0
