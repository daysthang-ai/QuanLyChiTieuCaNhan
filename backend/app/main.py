import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from sqlalchemy import text
from backend.app.services.seed_service import seed_database
from backend.app.routers import (
    auth_router, wallets_router, categories_router,
    transactions_router, budgets_router, saving_goals_router,
    analytics_router, exports_router, ai_router, backup_router, badges_router,
    admin_router, notifications_router, subscriptions_router, support_router,
    payments_router
)

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

# Auto migrate new columns if missing in SQLite
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'FREE'"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN plan_tier VARCHAR(50) DEFAULT 'Free'"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN plan_activated_at DATETIME"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN plan_expires_at DATETIME"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_plan_active BOOLEAN DEFAULT 1"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE wallets ADD COLUMN is_linked BOOLEAN DEFAULT 0"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE wallets ADD COLUMN bank_code VARCHAR(50)"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE wallets ADD COLUMN auto_debit_enabled BOOLEAN DEFAULT 0"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE wallets ADD COLUMN linked_at DATETIME"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE wallets ADD COLUMN wallet_scope VARCHAR(20) DEFAULT 'virtual'"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE notifications ADD COLUMN created_by_role VARCHAR(20) DEFAULT 'ADMIN'"))
        conn.commit()
    except Exception:
        pass

# Auto seed database on startup
try:
    with SessionLocal() as db_session:
        seed_database(db_session)
except Exception as e:
    print(f"[Main] Seed database check: {e}")

# Create FastAPI App
app = FastAPI(
    title="FinTrack AI - Hệ Thống Quản Lý Chi Tiêu Cá Nhân Thông Minh",
    description="""
## 🌟 Chào mừng đến với API FinTrack AI

FinTrack AI là giải pháp quản lý tài chính cá nhân toàn diện kết hợp Trí tuệ Nhân tạo:
- 💳 **Quản lý đa ví & tài khoản thanh toán**: Tiền mặt, Thẻ ngân hàng, Ví điện tử MoMo/ZaloPay, Sổ tiết kiệm.
- 💸 **Quản lý thu - chi & Hạn mức ngân sách**: Cảnh báo sớm khi chi tiêu chạm ngưỡng 80% hoặc bội chi 100%.
- 🎯 **Mục tiêu tiết kiệm**: Tích lũy mua sắm, quỹ khẩn cấp 6 tháng.
- ⚡ **AI Natural Language Parser**: Tự động bóc tách câu nói tự nhiên tiếng Việt thành giao dịch chuẩn xác.
- 🩺 **AI Financial Health Advisor**: Phân tích quy tắc vàng 50/30/20 và đề xuất tối ưu chi phí.
- 🤖 **Financial Q&A Assistant**: Trợ lý giải đáp thắc mắc tài chính thông minh dựa trên dữ liệu thực tế.
- 📊 **Báo cáo chuyên nghiệp**: Xuất báo cáo Excel (.xlsx), CSV, và PDF.
- 🏆 **Huy hiệu & Thành tích (Gamification)**: Chuỗi ngày kỷ luật, thăng hạng tài chính.
- 🛡️ **Quản Trị Hệ Thống (Admin Portal)**: Quản lý người dùng, AI Models, Phân quyền, Doanh thu & Cài đặt hệ thống.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(wallets_router, prefix=api_v1_prefix)
app.include_router(categories_router, prefix=api_v1_prefix)
app.include_router(transactions_router, prefix=api_v1_prefix)
app.include_router(budgets_router, prefix=api_v1_prefix)
app.include_router(saving_goals_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(exports_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(backup_router, prefix=api_v1_prefix)
app.include_router(badges_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(subscriptions_router, prefix=api_v1_prefix)
app.include_router(support_router, prefix=api_v1_prefix)
app.include_router(payments_router, prefix=api_v1_prefix)
app.include_router(payments_router, prefix="/api")

# Mount Uploads directory
uploads_dir = Path(settings.UPLOAD_DIR)
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Mount Frontend directory
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="frontend_static")

@app.get("/", response_class=FileResponse)
async def root():
    """Serves the FinTrack AI Single Page Application."""
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html; charset=utf-8")
    return HTMLResponse(
        content="<html><head><meta charset='utf-8'></head><body><h3>FinTrack AI Backend API is running.</h3></body></html>",
        media_type="text/html; charset=utf-8"
    )

@app.get("/TKnganhangMB.jpg")
@app.get("/TknganhangMB.jpg")
@app.get("/TKnganhang.jpg")
async def get_tk_nganhang():
    for fname in ["TKnganhangMB.jpg", "TknganhangMB.jpg", "TKnganhang.jpg"]:
        file_path = frontend_dir / fname
        if not file_path.exists():
            file_path = Path(__file__).resolve().parent.parent.parent / fname
        if file_path.exists():
            return FileResponse(str(file_path))
    return JSONResponse(status_code=404, content={"detail": "Image not found"})

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": "FinTrack AI", "ai_provider": settings.AI_PROVIDER}
