import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, desc

from backend.app.database import get_db
from backend.app.models import User, Transaction, Wallet, Category
from backend.app.routers.auth import get_current_user
from backend.app.services.report_service import report_service

router = APIRouter(prefix="/exports", tags=["Xuất Báo cáo Tài chính"])

def get_export_data(current_user: User, db: Session, month_year: Optional[str] = None):
    """Gathers transaction and summary data for export."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if month_year:
        y, m = map(int, month_year.split("-"))
        query = query.filter(
            extract("year", Transaction.transaction_date) == y,
            extract("month", Transaction.transaction_date) == m
        )
    
    tx_list = query.order_by(desc(Transaction.transaction_date)).all()

    formatted_txs = []
    tot_inc = 0.0
    tot_exp = 0.0

    for t in tx_list:
        if t.type == "INCOME":
            tot_inc += t.amount
        elif t.type == "EXPENSE":
            tot_exp += t.amount

        cat_name = t.category.name if t.category else "Chuyển tiền"
        wallet_name = t.wallet.name if t.wallet else ""
        formatted_txs.append({
            "id": t.id,
            "date": t.transaction_date.strftime("%Y-%m-%d %H:%M"),
            "type": t.type,
            "amount": t.amount,
            "category_name": cat_name,
            "wallet_name": wallet_name,
            "note": t.note or "",
            "created_by_ai": t.created_by_ai
        })

    net = tot_inc - tot_exp
    rate = round((net / tot_inc * 100), 1) if tot_inc > 0 else 0.0

    summary_data = {
        "total_income": tot_inc,
        "total_expense": tot_exp,
        "net_savings": net,
        "savings_rate": rate
    }

    return formatted_txs, summary_data

@router.get("/excel")
def export_excel(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xuất file báo cáo tài chính Excel (.xlsx)."""
    txs, summary = get_export_data(current_user, db, month_year)
    excel_stream = report_service.generate_excel_report(current_user.full_name, txs, summary)

    filename = f"FinTrack_BaoCao_{month_year or 'TatCa'}_{datetime.date.today().strftime('%Y%m%d')}.xlsx"
    return Response(
        content=excel_stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def export_csv(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xuất file báo cáo CSV có UTF-8 BOM chuẩn tiếng Việt."""
    txs, _ = get_export_data(current_user, db, month_year)
    csv_str = report_service.generate_csv_report(txs)

    filename = f"FinTrack_GiaoDich_{month_year or 'TatCa'}_{datetime.date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_str.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pdf")
def export_pdf(
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xuất file báo cáo tài chính PDF (.pdf)."""
    txs, summary = get_export_data(current_user, db, month_year)
    pdf_stream = report_service.generate_pdf_report(current_user.full_name, txs, summary)

    filename = f"FinTrack_BaoCao_{month_year or 'TatCa'}_{datetime.date.today().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_stream.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
