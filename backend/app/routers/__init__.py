from backend.app.routers.auth import router as auth_router
from backend.app.routers.wallets import router as wallets_router
from backend.app.routers.categories import router as categories_router
from backend.app.routers.transactions import router as transactions_router
from backend.app.routers.budgets import router as budgets_router
from backend.app.routers.saving_goals import router as saving_goals_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.exports import router as exports_router
from backend.app.routers.ai import router as ai_router
from backend.app.routers.backup import router as backup_router
from backend.app.routers.badges import router as badges_router
from backend.app.routers.admin import router as admin_router
from backend.app.routers.notifications import router as notifications_router
from backend.app.routers.subscriptions import router as subscriptions_router
from backend.app.routers.support import router as support_router
from backend.app.routers.payments import router as payments_router

__all__ = [
    "auth_router",
    "wallets_router",
    "categories_router",
    "transactions_router",
    "budgets_router",
    "saving_goals_router",
    "analytics_router",
    "exports_router",
    "ai_router",
    "backup_router",
    "badges_router",
    "admin_router",
    "notifications_router",
    "subscriptions_router",
    "support_router",
    "payments_router"
]
