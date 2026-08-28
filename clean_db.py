"""
clean_db.py
------------
Script dọn sạch toàn bộ cơ sở dữ liệu SQLite (fintrack.db):
1. Xóa toàn bộ bản ghi giao dịch rác / mock transactions.
2. Đưa số dư tất cả các ví (ví ảo & ví tiền thật) về đúng 0 VNĐ.
3. Xóa toàn bộ ngân sách, mục tiêu tích lũy, đơn hàng thanh toán rác, thông báo mẫu và AI chat log.
4. Giữ lại danh mục thu - chi chuẩn 50/30/20 cho người dùng.
5. Khởi tạo lại 4 Ví kế toán cá nhân ảo + 1 Ví tiền thật sạch (0 VNĐ) cho toàn bộ tài khoản.
6. Đưa Dashboard và toàn bộ hệ thống về trạng thái 0đ ban đầu.
"""

import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Thêm đường dẫn gốc để import module backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import (
    User, Wallet, Category, Transaction, Budget, SavingGoal,
    Notification, SubscriptionOrder, SupportTicket, AIChatLog, SystemBankAccount
)
from backend.app.services.seed_service import DEFAULT_CATEGORIES, DEFAULT_WALLETS, seed_database


def clean_database():
    db = SessionLocal()
    try:
        print("\n" + "="*65)
        print("🧹 BẮT ĐẦU DỌN SẠCH DỮ LIỆU CƠ SỞ DỮ LIỆU FINTRACK (fintrack.db)")
        print("="*65)

        # 1. Xóa toàn bộ giao dịch (Transactions)
        deleted_txs = db.query(Transaction).delete()
        print(f"✅ Đã xóa {deleted_txs} giao dịch (Transactions).")

        # 2. Xóa ngân sách và mục tiêu tích lũy
        deleted_budgets = db.query(Budget).delete()
        deleted_goals = db.query(SavingGoal).delete()
        print(f"✅ Đã xóa {deleted_budgets} ngân sách và {deleted_goals} mục tiêu tích lũy.")

        # 3. Xóa đơn hàng thanh toán & thông báo & AI chat logs
        deleted_orders = db.query(SubscriptionOrder).delete()
        deleted_notifs = db.query(Notification).delete()
        deleted_ai_logs = db.query(AIChatLog).delete()
        deleted_tickets = db.query(SupportTicket).delete()
        print(f"✅ Đã xóa {deleted_orders} đơn hàng, {deleted_notifs} thông báo, {deleted_ai_logs} log AI, {deleted_tickets} ticket hỗ trợ.")

        # 4. Reset số dư tất cả các ví về 0 VNĐ
        users = db.query(User).all()
        print(f"👥 Đang chuẩn hóa ví cho {len(users)} người dùng...")

        for u in users:
            # Nếu là user thường, reset gói về FREE
            if u.role != "ADMIN":
                u.plan = "FREE"
                u.plan_tier = "Free"
                u.plan_activated_at = None
                u.plan_expires_at = None
                u.is_plan_active = True

            # Xóa các ví cũ và khởi tạo lại 4 ví ảo + 1 ví thật sạch 0đ
            db.query(Wallet).filter(Wallet.user_id == u.id).delete()
            db.flush()

            for w_data in DEFAULT_WALLETS:
                w = Wallet(
                    user_id=u.id,
                    name=w_data["name"],
                    wallet_type=w_data["wallet_type"],
                    wallet_scope=w_data["wallet_scope"],
                    balance=0.0,
                    currency="VND",
                    icon=w_data["icon"],
                    color=w_data["color"],
                    is_active=True
                )
                db.add(w)

            # Đảm bảo danh mục mặc định đầy đủ
            for cat_data in DEFAULT_CATEGORIES:
                cat_exists = db.query(Category).filter(
                    Category.user_id == u.id,
                    Category.name == cat_data["name"]
                ).first()
                if not cat_exists:
                    cat = Category(
                        user_id=u.id,
                        name=cat_data["name"],
                        type=cat_data["type"],
                        group=cat_data["group"],
                        icon=cat_data["icon"],
                        color=cat_data["color"],
                        is_default=True
                    )
                    db.add(cat)

        db.commit()

        # 5. Đảm bảo cấu hình cổng MB Bank có sẵn
        seed_database(db)

        print("="*65)
        print("🎉 DỌN SẠCH CƠ SỞ DỮ LIỆU HOÀN TẤT:")
        print("   • Tổng tài sản / Số dư tất cả các ví: 0 VNĐ")
        print("   • Tổng thu: 0 VNĐ, Tổng chi: 0 VNĐ")
        print("   • Sổ Giao Dịch Thu - Chi: 0 bản ghi (Trạng thái rỗng chuẩn)")
        print("   • Danh mục chi tiêu: Đã thiết lập 23 danh mục chuẩn 50/30/20")
        print("="*65 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi dọn dẹp cơ sở dữ liệu: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clean_database()
