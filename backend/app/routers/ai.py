import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc

from backend.app.database import get_db
from backend.app.models import User, Wallet, Category, Transaction, Budget, AIChatLog
from backend.app.schemas import (
    AIParsedTransactionRequest, AIParsedTransactionResponse,
    AIFinancialHealthResponse, AIChatRequest, AIChatResponse
)
from backend.app.routers.auth import get_current_user
from backend.app.routers.budgets import enrich_budget_out
from backend.app.services.ai_service import ai_service
from backend.app.utils.sanitizer import format_currency_vnd

router = APIRouter(prefix="/ai", tags=["Trí Tuệ Nhân Tạo (FinTrack AI Engine)"])

def check_ai_rate_limit(user: User, db: Session):
    """Kiểm tra hạn mức gọi AI trong ngày của người dùng theo gói dịch vụ."""
    plan = (user.plan or "FREE").upper()
    if plan == "PLATINUM":
        return  # VIP Unlimited AI

    limits = {"FREE": 10, "PRO": 100, "PREMIUM": 300}
    limit = limits.get(plan, 10)
    today = datetime.date.today()

    today_calls = db.query(func.count(AIChatLog.id)).filter(
        AIChatLog.user_id == user.id,
        func.date(AIChatLog.created_at) == today
    ).scalar() or 0

    if today_calls >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"⚡ Bạn đã dùng hết hạn mức {limit} lượt gọi AI/ngày của gói {plan}. Hãy nâng cấp lên FinTrack Platinum VIP để mở khóa AI không giới hạn!"
        )

@router.get("/quota")
def get_user_ai_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin hạn mức sử dụng AI trong ngày của người dùng."""
    today = datetime.date.today()
    today_calls = db.query(func.count(AIChatLog.id)).filter(
        AIChatLog.user_id == current_user.id,
        func.date(AIChatLog.created_at) == today
    ).scalar() or 0

    plan = (current_user.plan or "FREE").upper()
    is_unlimited = (plan == "PLATINUM")
    limits = {"FREE": 10, "PRO": 100, "PREMIUM": 300, "PLATINUM": -1}
    limit = limits.get(plan, 10)
    remaining = "Không giới hạn" if is_unlimited else max(0, limit - today_calls)

    return {
        "plan": plan,
        "plan_name": current_user.plan_name,
        "used_today": today_calls,
        "daily_limit": "Unlimited" if is_unlimited else limit,
        "remaining_today": remaining,
        "is_unlimited": is_unlimited,
        "percentage": 100 if is_unlimited else min(100, round((today_calls / max(1, limit)) * 100))
    }

@router.post("/parse-transaction", response_model=AIParsedTransactionResponse)
async def parse_transaction(
    req: AIParsedTransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ⚡ Bóc tách giao dịch từ câu nói tự nhiên tiếng Việt bằng AI:
    Ví dụ: 'Ăn trưa bún bò 45k trả qua MoMo hôm qua' ->
    JSON (loại: EXPENSE, số tiền: 45000, danh mục: Ăn uống, ví: MoMo, ngày: 2026-08-19, ghi chú: 'Ăn trưa bún bò').
    """
    check_ai_rate_limit(current_user, db)

    # Fetch user's virtual sandbox ledger wallets & categories (excluding real payment wallet)
    wallets = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True,
        Wallet.wallet_scope == "virtual"
    ).all()
    categories = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).all()

    wallet_dicts = [{"id": w.id, "name": w.name} for w in wallets]
    category_dicts = [{"id": c.id, "name": c.name, "type": c.type, "group": c.group} for c in categories]

    result = await ai_service.parse_natural_language_transaction(
        raw_text=req.raw_text,
        available_wallets=wallet_dicts,
        available_categories=category_dicts,
        current_date=datetime.date.today().isoformat()
    )

    # Record usage log
    try:
        log = AIChatLog(
            user_id=current_user.id,
            query_text=req.raw_text,
            response_text=str(result),
            prompt_template_used="natural_parser",
            response_time_ms=120
        )
        db.add(log)
        db.commit()
    except Exception:
        pass

    return result

@router.get("/financial-health", response_model=AIFinancialHealthResponse)
async def get_financial_health_audit(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🩺 Đánh giá Sức khỏe Tài chính cá nhân, phân tích quy tắc 50/30/20, cảnh báo bội chi và gợi ý tiết kiệm thông minh.
    """
    target_month_str = month_year or datetime.datetime.now().strftime("%Y-%m")
    curr_year, curr_month = map(int, target_month_str.split("-"))

    income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "INCOME",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    # Spending by category
    cat_spendings = db.query(
        Category.name,
        func.coalesce(func.sum(Transaction.amount), 0.0).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).group_by(Category.name).all()

    spending_summary_lines = [f"- {name}: {format_currency_vnd(tot)}" for name, tot in cat_spendings]
    spending_summary = "\n".join(spending_summary_lines) if spending_summary_lines else "Chưa có giao dịch chi tiêu trong tháng."

    # Group sums for 50/30/20
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

    base = income if income > 0 else (needs_amt + wants_amt + savings_amt)
    if base == 0: base = 1.0

    needs_pct = (needs_amt / base * 100)
    wants_pct = (wants_amt / base * 100)
    savings_pct = (savings_amt / base * 100)

    # Budgets & Overspent categories
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == target_month_str
    ).all()

    overspent_cats = []
    budget_table_lines = []
    for b in budgets:
        b_out = enrich_budget_out(b, db)
        budget_table_lines.append(f"- {b_out.category.name if b_out.category else 'DM'}: Hạn mức {format_currency_vnd(b_out.amount_limit)} | Đã chi {format_currency_vnd(b_out.spent_amount)} ({b_out.percentage}%) [{b_out.status}]")
        if b_out.status in ["WARNING", "OVERSPENT"]:
            overspent_cats.append(f"{b_out.category.name} ({b_out.percentage}%)")

    budget_table_str = "\n".join(budget_table_lines) if budget_table_lines else "Chưa thiết lập ngân sách."

    report = await ai_service.analyze_financial_health(
        income_total=income,
        expense_total=expense,
        spending_summary=spending_summary,
        budget_table=budget_table_str,
        needs_pct=needs_pct,
        wants_pct=wants_pct,
        savings_pct=savings_pct,
        overspent_categories=overspent_cats
    )
    return report

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🤖 Hỏi đáp Dữ liệu Tài chính cá nhân với Trợ lý AI FinTrack:
    Đặt câu hỏi tự nhiên như 'Tôi đã tiêu bao nhiêu tiền ăn uống?' hoặc 'Có vượt ngân sách không?'
    """
    check_ai_rate_limit(current_user, db)

    target_month_str = datetime.datetime.now().strftime("%Y-%m")
    curr_year, curr_month = map(int, target_month_str.split("-"))

    # Net worth
    net_worth = db.query(func.coalesce(func.sum(Wallet.balance), 0.0)).filter(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True
    ).scalar() or 0.0

    income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "INCOME",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).scalar() or 0.0

    net = income - expense
    rate = round((net / income * 100), 1) if income > 0 else 0.0

    # Spending by category
    cat_spendings = db.query(
        Category.name,
        func.coalesce(func.sum(Transaction.amount), 0.0).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "EXPENSE",
        extract("year", Transaction.transaction_date) == curr_year,
        extract("month", Transaction.transaction_date) == curr_month
    ).group_by(Category.name).all()

    spending_summary_lines = [f"• {name}: {format_currency_vnd(tot)}" for name, tot in cat_spendings]

    # Budgets
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == target_month_str
    ).all()
    budget_lines = []
    for b in budgets:
        b_out = enrich_budget_out(b, db)
        budget_lines.append(f"• {b_out.category.name if b_out.category else 'DM'}: Hạn mức {format_currency_vnd(b_out.amount_limit)} -> Đã chi {format_currency_vnd(b_out.spent_amount)} ({b_out.percentage}%)")

    # Recent transactions
    recent_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(desc(Transaction.transaction_date)).limit(10).all()

    recent_tx_list = []
    for t in recent_txs:
        recent_tx_list.append({
            "date": t.transaction_date.strftime("%d/%m/%Y"),
            "type": t.type,
            "amount": t.amount,
            "category_name": t.category.name if t.category else "Chuyển tiền",
            "wallet_name": t.wallet.name if t.wallet else "",
            "note": t.note or ""
        })

    # Wallets & Net worth breakdown
    user_wallets = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True
    ).all()
    wallet_lines = [f"• {w.name}: {format_currency_vnd(w.balance)}" for w in user_wallets]
    wallets_summary_str = "\n".join(wallet_lines) if wallet_lines else "Chưa có ví hoạt động"

    financial_context = {
        "total_net_worth": net_worth,
        "total_income": income,
        "total_expense": expense,
        "net_savings": net,
        "savings_rate": rate,
        "category_summary": "\n".join(spending_summary_lines) if spending_summary_lines else "Chưa có chi tiêu",
        "budget_summary": "\n".join(budget_lines) if budget_lines else "Chưa đặt hạn mức",
        "wallets_summary": wallets_summary_str
    }

    res = await ai_service.chat_financial_assistant(
        query=req.query,
        user_name=current_user.full_name,
        financial_context=financial_context,
        recent_transactions=recent_tx_list,
        current_date_str=datetime.date.today().isoformat()
    )

    # Save to ai_chat_logs
    try:
        log = AIChatLog(
            user_id=current_user.id,
            query_text=req.query,
            response_text=res["response_markdown"],
            prompt_template_used="financial_qa",
            response_time_ms=res["response_time_ms"]
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AI Router] Failed to save chat log: {e}")

    return res
