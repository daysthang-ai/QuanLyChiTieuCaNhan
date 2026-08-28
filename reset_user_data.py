"""
reset_user_data.py
------------------
Script độc lập giúp Reset toàn bộ số dư và dữ liệu tài khoản test (mặc định: user@fintrack.ai)
về trạng thái tài khoản mới khởi tạo:
- Số dư ví tiền thật (Real Payment): 0 VNĐ
- Gói dịch vụ (VIP Tier): FREE (0 ngày)
- 4 Ví kế toán cá nhân ảo: Tiền mặt, MB Bank, Ví MoMo, Sổ Tiết Kiệm (Đều có số dư = 0 VNĐ)
- Xóa sạch toàn bộ giao dịch, ngân sách, mục tiêu tích lũy, đơn đặt gói, thông báo rác.
"""

import sys
import os

# Đảm bảo UTF-8 trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Đảm bảo import được module backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal
from backend.app.models import (
    User, Wallet, Category, Transaction, Budget, SavingGoal,
    Notification, SubscriptionOrder, SupportTicket, AIChatLog
)
from backend.app.services.seed_service import DEFAULT_CATEGORIES
from backend.app.utils.security import get_password_hash


def reset_user(email: str = "user@fintrack.ai"):
    db = SessionLocal()
    try:
        print(f"\n" + "="*60)
        print(f"🔄 ĐANG TIẾN HÀNH RESET DỮ LIỆU TÀI KHOẢN: {email}")
        print("="*60)

        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            print(f"⚠️ Không tìm thấy người dùng '{email}', đang tạo mới tài khoản...")
            user = User(
                email=email.lower(),
                full_name="Nguyễn Văn An",
                hashed_password=get_password_hash("User@123456"),
                role="USER",
                status="ACTIVE",
                plan="FREE",
                plan_tier="Free",
                plan_activated_at=None,
                plan_expires_at=None,
                is_plan_active=True,
                currency="VND",
                avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Đã tạo tài khoản mới: {user.email} (ID: {user.id})")
        else:
            # 1. Reset VIP tier to FREE
            user.plan = "FREE"
            user.plan_tier = "Free"
            user.plan_activated_at = None
            user.plan_expires_at = None
            user.is_plan_active = True
            user.status = "ACTIVE"
            print(f"✅ Đã đặt lại gói VIP: Gói FREE (Hạn dùng: 0 ngày)")

        user_id = user.id

        # 2. Xóa sạch các dữ liệu phát sinh (Transactions, Budgets, Goals, Orders, Notifications, AI Logs)
        deleted_txs = db.query(Transaction).filter(Transaction.user_id == user_id).delete()
        deleted_budgets = db.query(Budget).filter(Budget.user_id == user_id).delete()
        deleted_goals = db.query(SavingGoal).filter(SavingGoal.user_id == user_id).delete()
        deleted_orders = db.query(SubscriptionOrder).filter(SubscriptionOrder.user_id == user_id).delete()
        deleted_notifs = db.query(Notification).filter(Notification.user_id == user_id).delete()
        deleted_ai_logs = db.query(AIChatLog).filter(AIChatLog.user_id == user_id).delete()
        db.flush()

        print(f"🗑️  Đã xóa: {deleted_txs} giao dịch, {deleted_budgets} ngân sách, {deleted_goals} mục tiêu, {deleted_orders} đơn hàng, {deleted_notifs} thông báo")

        # 3. Xóa các ví cũ và tạo lại đúng 4 ví ảo + 1 ví thật chuẩn
        db.query(Wallet).filter(Wallet.user_id == user_id).delete()
        db.flush()

        standard_wallets = [
            {"name": "Tiền mặt", "wallet_type": "CASH", "wallet_scope": "virtual", "balance": 0.0, "icon": "money-bill-wave", "color": "#10B981"},
            {"name": "MB Bank", "wallet_type": "BANK", "wallet_scope": "virtual", "balance": 0.0, "icon": "building-columns", "color": "#3B82F6"},
            {"name": "Ví MoMo", "wallet_type": "EWALLET", "wallet_scope": "virtual", "balance": 0.0, "icon": "wallet", "color": "#D946EF"},
            {"name": "Sổ Tiết Kiệm", "wallet_type": "SAVINGS", "wallet_scope": "virtual", "balance": 0.0, "icon": "piggy-bank", "color": "#8B5CF6"},
            {"name": "Ví Dịch Vụ & VIP FinTrack", "wallet_type": "EWALLET", "wallet_scope": "real", "balance": 0.0, "icon": "wallet", "color": "#F59E0B"}
        ]

        for w_data in standard_wallets:
            w = Wallet(
                user_id=user_id,
                name=w_data["name"],
                wallet_type=w_data["wallet_type"],
                wallet_scope=w_data["wallet_scope"],
                balance=w_data["balance"],
                currency="VND",
                icon=w_data["icon"],
                color=w_data["color"],
                is_active=True
            )
            db.add(w)
        db.flush()
        print(f"💳 Đã khởi tạo lại 4 Ví ảo + 1 Ví tiền thật với số dư = 0 VNĐ:")
        for w in standard_wallets:
            print(f"   • [{w['wallet_scope'].upper()}] {w['name']} ({w['wallet_type']}): 0 ₫")

        # 4. Đảm bảo danh mục mặc định đầy đủ
        for cat_data in DEFAULT_CATEGORIES:
            existing_cat = db.query(Category).filter(Category.user_id == user_id, Category.name == cat_data["name"]).first()
            if not existing_cat:
                cat = Category(
                    user_id=user_id,
                    name=cat_data["name"],
                    type=cat_data["type"],
                    group=cat_data["group"],
                    icon=cat_data["icon"],
                    color=cat_data["color"],
                    is_default=True
                )
                db.add(cat)

        db.commit()
        print("="*60)
        print("🎉 RESET DỮ LIỆU TÀI KHOẢN TEST THÀNH CÔNG VỀ TRẠNG THÁI MỚI (0 VNĐ)!")
        print("="*60 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi reset dữ liệu: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "user@fintrack.ai"
    reset_user(target)
