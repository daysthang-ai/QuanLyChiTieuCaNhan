import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_

from backend.app.database import get_db
from backend.app.models import User, Wallet, Category, Transaction, Budget
from backend.app.schemas import (
    SummaryKPIs, CashflowMonthData, CategoryBreakdownItem, FiftyThirtyTwentyRule
)
from backend.app.routers.auth import get_current_user
from backend.app.routers.budgets import enrich_budget_out

router = APIRouter(prefix="/analytics", tags=["Phân tích & Thống kê Tài chính"])

@router.get("/summary", response_model=SummaryKPIs)
def get_summary_kpis(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy các chỉ số KPI tài chính tổng quan của tháng."""
    target_month_str = month_year or datetime.datetime.now().strftime("%Y-%m")
    curr_year, curr_month = map(int, target_month_str.split("-"))

    # 1. Total Net Worth
    total_net_worth = db.query(func.coalesce(func.sum(Wallet.balance), 0.0)).filter(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True
    ).scalar() or 0.0

    # 2. Current Month Income & Expense
    inc_curr = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "INCOME",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    exp_curr = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    net_curr = inc_curr - exp_curr
    savings_rate = round((net_curr / inc_curr * 100), 1) if inc_curr > 0 else 0.0

    # 3. Previous Month for Comparison
    prev_month_date = datetime.date(curr_year, curr_month, 1) - datetime.timedelta(days=1)
    prev_year, prev_month = prev_month_date.year, prev_month_date.month

    inc_prev = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "INCOME",
        extract("year", Transaction.transaction_date) == prev_year,
        extract("month", Transaction.transaction_date) == prev_month
    ).scalar() or 0.0

    exp_prev = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == prev_year,
        extract("month", Transaction.transaction_date) == prev_month
    ).scalar() or 0.0

    inc_change_pct = round(((inc_curr - inc_prev) / inc_prev * 100), 1) if inc_prev > 0 else 0.0
    exp_change_pct = round(((exp_curr - exp_prev) / exp_prev * 100), 1) if exp_prev > 0 else 0.0

    # 4. Budget Alerts count
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == target_month_str
    ).all()
    active_alerts = 0
    for b in budgets:
        b_out = enrich_budget_out(b, db)
        if b_out.percentage >= 80.0:
            active_alerts += 1

    return {
        "total_net_worth": total_net_worth,
        "total_income_month": inc_curr,
        "total_expense_month": exp_curr,
        "net_savings_month": net_curr,
        "savings_rate_month": savings_rate,
        "income_change_vs_last_month_pct": inc_change_pct,
        "expense_change_vs_last_month_pct": exp_change_pct,
        "active_budget_alerts_count": active_alerts,
        "currency": current_user.currency
    }

@router.get("/cashflow", response_model=List[CashflowMonthData])
def get_cashflow_trend(
    months: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy dữ liệu dòng tiền thu vs chi 6 tháng gần nhất."""
    result = []
    now = datetime.date.today()
    
    for i in range(months - 1, -1, -1):
        # Calculate year and month
        y = now.year
        m = now.month - i
        while m <= 0:
            m += 12
            y -= 1
        
        m_str = f"{y}-{m:02d}"
        label = f"T{m}/{y}"

        inc = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "INCOME",
            extract("year", Transaction.transaction_date) == y,
            extract("month", Transaction.transaction_date) == m
        ).scalar() or 0.0

        exp = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "EXPENSE",
            extract("year", Transaction.transaction_date) == y,
            extract("month", Transaction.transaction_date) == m
        ).scalar() or 0.0

        result.append({
            "month": m_str,
            "label": label,
            "income": inc,
            "expense": exp,
            "net_savings": inc - exp
        })

    return result

@router.get("/category-breakdown", response_model=List[CategoryBreakdownItem])
def get_category_breakdown(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy dữ liệu phân bổ chi tiêu theo từng danh mục (biểu đồ tròn/donut)."""
    target_month_str = month_year or datetime.datetime.now().strftime("%Y-%m")
    curr_year, curr_month = map(int, target_month_str.split("-"))

    total_expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    rows = db.query(
        Category.id,
        Category.name,
        Category.group,
        Category.color,
        Category.icon,
        func.coalesce(func.sum(Transaction.amount), 0.0).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()

    items = []
    for cat_id, cat_name, cat_group, color, icon, cat_total in rows:
        pct = round((cat_total / total_expense * 100), 1) if total_expense > 0 else 0.0
        items.append({
            "category_id": cat_id,
            "category_name": cat_name,
            "group": cat_group,
            "color": color,
            "icon": icon,
            "total_amount": cat_total,
            "percentage": pct
        })

    return items

@router.get("/fifty-thirty-twenty", response_model=FiftyThirtyTwentyRule)
def get_fifty_thirty_twenty_analysis(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Phân tích cơ cấu tài chính theo quy tắc chuẩn 50/30/20."""
    target_month_str = month_year or datetime.datetime.now().strftime("%Y-%m")
    curr_year, curr_month = map(int, target_month_str.split("-"))

    income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "INCOME",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    # Group sums
    groups = db.query(
        Category.group,
        func.coalesce(func.sum(Transaction.amount), 0.0).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).group_by(Category.group).all()

    group_map = {g: amt for g, amt in groups}
    needs_amt = group_map.get("NEEDS", 0.0)
    wants_amt = group_map.get("WANTS", 0.0)
    savings_amt = group_map.get("SAVINGS", 0.0)

    # If income > 0, compute against income; else against total expense
    base_denominator = income if income > 0 else (needs_amt + wants_amt + savings_amt)
    if base_denominator == 0:
        base_denominator = 1.0

    needs_pct = round((needs_amt / base_denominator * 100), 1)
    wants_pct = round((wants_amt / base_denominator * 100), 1)
    savings_pct = round((savings_amt / base_denominator * 100), 1)

    eval_text = "Cơ cấu tài chính rất cân bằng và kỷ luật!"
    if needs_pct > 55:
        eval_text = "Nhu cầu thiết yếu đang chiếm tỷ trọng khá cao (>55%). Cần tối ưu chi phí sinh hoạt cố định."
    elif wants_pct > 35:
        eval_text = "Chi tiêu cho mong muốn & hưởng thụ cá nhân đang vượt chuẩn (>35%). Hãy chú ý cắt giảm các đơn mua sắm không thiết yếu."
    elif savings_pct < 15:
        eval_text = "Tỷ lệ tiết kiệm và đầu tư còn thấp (<15%). Hãy trích lập tiết kiệm ngay đầu tháng."

    recs = [
        "Duy trì tỷ lệ Nhu cầu thiết yếu (Needs) <= 50% thu nhập.",
        "Kiểm soát chi tiêu Mong muốn (Wants) <= 30% thu nhập.",
        "Dành ít nhất 20% thu nhập cho Quỹ khẩn cấp và Tích lũy sinh lời."
    ]

    return {
        "needs_actual_amount": needs_amt,
        "needs_actual_pct": needs_pct,
        "needs_target_pct": 50.0,
        "wants_actual_amount": wants_amt,
        "wants_actual_pct": wants_pct,
        "wants_target_pct": 30.0,
        "savings_actual_amount": savings_amt,
        "savings_actual_pct": savings_pct,
        "savings_target_pct": 20.0,
        "total_income": income,
        "evaluation": eval_text,
        "recommendations": recs
    }
