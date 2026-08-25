from typing import Optional, List, Dict, Any
import datetime
from pydantic import BaseModel, Field

class AIParsedTransactionRequest(BaseModel):
    raw_text: str = Field(..., min_length=2, description="Câu nhập tự nhiên tiếng Việt, ví dụ: 'Ăn trưa bún bò 45k trả qua MoMo'")

class AIParsedTransactionResponse(BaseModel):
    type: str = Field("EXPENSE", description="EXPENSE, INCOME, TRANSFER")
    amount: float
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    wallet_id: Optional[int] = None
    wallet_name: Optional[str] = None
    to_wallet_id: Optional[int] = None
    to_wallet_name: Optional[str] = None
    transaction_date: str = Field(..., description="YYYY-MM-DD")
    note: str
    confidence: float = 0.95
    source_engine: str = "smart_fallback"

class AIFinancialHealthResponse(BaseModel):
    health_score: int = Field(..., ge=0, le=100)
    summary_markdown: str
    needs_pct: float
    wants_pct: float
    savings_pct: float
    overspent_categories: List[str]
    waste_detected: List[str]
    action_recommendations: List[str]
    generated_at: datetime.datetime

class AIChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    include_recent_transactions: Optional[bool] = True

class AIChatResponse(BaseModel):
    query: str
    response_markdown: str
    suggested_followups: List[str] = []
    generated_by: str = "smart_fallback"
    response_time_ms: int = 0
