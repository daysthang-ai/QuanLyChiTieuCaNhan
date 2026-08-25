from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class SummaryKPIs(BaseModel):
    total_net_worth: float
    total_income_month: float
    total_expense_month: float
    net_savings_month: float
    savings_rate_month: float
    income_change_vs_last_month_pct: float
    expense_change_vs_last_month_pct: float
    active_budget_alerts_count: int
    currency: str = "VND"

class CashflowMonthData(BaseModel):
    month: str  # YYYY-MM
    label: str  # T8/2026
    income: float
    expense: float
    net_savings: float

class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    group: str
    color: str
    icon: str
    total_amount: float
    percentage: float

class FiftyThirtyTwentyRule(BaseModel):
    needs_actual_amount: float
    needs_actual_pct: float
    needs_target_pct: float = 50.0

    wants_actual_amount: float
    wants_actual_pct: float
    wants_target_pct: float = 30.0

    savings_actual_amount: float
    savings_actual_pct: float
    savings_target_pct: float = 20.0

    total_income: float
    evaluation: str
    recommendations: List[str]
