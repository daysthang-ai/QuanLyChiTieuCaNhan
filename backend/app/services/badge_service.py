import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from backend.app.models import User, Wallet, Category, Transaction, Budget, SavingGoal

class BadgeService:
    @staticmethod
    def calculate_streak(tx_dates: List[datetime.date]) -> int:
        """Calculates current consecutive day streak of transactions."""
        if not tx_dates:
            return 0

        unique_dates = sorted(set(tx_dates), reverse=True)
        today = datetime.date.today()
        yesterday = today - datetime.timedelta(days=1)

        # Check if the streak is active (latest transaction is today or yesterday)
        if unique_dates[0] < yesterday:
            return 0

        streak = 0
        expected_date = unique_dates[0]

        for d in unique_dates:
            if d == expected_date:
                streak += 1
                expected_date = d - datetime.timedelta(days=1)
            elif d < expected_date:
                break

        return streak

    @classmethod
    def get_user_badges(cls, user: User, db: Session) -> Dict[str, Any]:
        """Evaluates all financial badges and achievements for a user."""
        # 1. Fetch user stats
        wallets = db.query(Wallet).filter(Wallet.user_id == user.id).all()
        wallet_count = len(wallets)
        total_net_worth = sum(w.balance for w in wallets)

        txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
        tx_count = len(txs)
        ai_tx_count = sum(1 for t in txs if t.created_by_ai == "AI_PARSED")

        # Distinct categories used in transactions
        distinct_categories_count = len(set(t.category_id for t in txs if t.category_id))

        tx_dates = [t.transaction_date.date() for t in txs]
        current_streak = cls.calculate_streak(tx_dates)

        saving_goals = db.query(SavingGoal).filter(SavingGoal.user_id == user.id).all()
        goals_count = len(saving_goals)
        total_saved_in_goals = sum(g.current_amount for g in saving_goals)
        has_completed_goal = any(g.current_amount >= g.target_amount for g in saving_goals) if saving_goals else False

        # Current month transactions for savings rate
        now = datetime.datetime.now(datetime.timezone.utc)
        current_month_txs = [
            t for t in txs 
            if t.transaction_date.year == now.year and t.transaction_date.month == now.month
        ]
        curr_income = sum(t.amount for t in current_month_txs if t.type == "INCOME")
        curr_expense = sum(t.amount for t in current_month_txs if t.type == "EXPENSE")
        savings_rate = round(((curr_income - curr_expense) / curr_income * 100), 1) if curr_income > 0 else 0.0

        # Check investment income transactions
        has_invest_income = any(t.type == "INCOME" and t.amount > 0 and t.category and ("đầu tư" in t.category.name.lower() or "lãi" in t.category.name.lower()) for t in txs)

        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
        budget_count = len(budgets)
        has_overspent = False
        if budgets:
            for b in budgets:
                try:
                    y, m = map(int, b.month_year.split("-"))
                    spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                        Transaction.user_id == user.id,
                        Transaction.category_id == b.category_id,
                        Transaction.type == "EXPENSE",
                        func.extract("year", Transaction.transaction_date) == y,
                        func.extract("month", Transaction.transaction_date) == m
                    ).scalar() or 0.0
                    if spent > b.amount_limit:
                        has_overspent = True
                        break
                except Exception:
                    pass
        else:
            has_overspent = True

        today_str = datetime.date.today().strftime("%d/%m/%Y")

        # 2. Define Comprehensive Badges Catalog (24+ Guaranteed FA6 Free Icons)
        badges_def = [
            # ==================== I. TÂN THỦ & KHỞI ĐẦU (ONBOARDING) ====================
            {
                "id": "first_wallet",
                "category": "ONBOARDING",
                "title": "Khởi Đầu Tài Chính",
                "description": "Tạo và kết nối ví thanh toán đầu tiên của bạn.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-wallet",
                "color": "#cd7f32",
                "is_unlocked": wallet_count >= 1,
                "current_val": wallet_count,
                "target_val": 1,
                "unit": "ví",
                "unlock_hint": "Vào mục Ví & Tài Khoản và bấm 'Thêm Ví Mới'",
                "target_tab": "wallets",
                "unlocked_at": user.created_at.strftime("%d/%m/%Y") if (user.created_at and wallet_count >= 1) else (today_str if wallet_count >= 1 else None)
            },
            {
                "id": "first_transaction",
                "category": "ONBOARDING",
                "title": "Bút Toán Đầu Tiên",
                "description": "Ghi chép giao dịch thu hoặc chi đầu tiên trên FinTrack.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-receipt",
                "color": "#cd7f32",
                "is_unlocked": tx_count >= 1,
                "current_val": min(tx_count, 1),
                "target_val": 1,
                "unit": "giao dịch",
                "unlock_hint": "Bấm nút '+ Ghi Thu - Chi' để tạo giao dịch",
                "target_tab": "transactions",
                "unlocked_at": txs[0].transaction_date.strftime("%d/%m/%Y") if (txs and tx_count >= 1 and txs[0].transaction_date) else (today_str if tx_count >= 1 else None)
            },
            {
                "id": "multi_wallets",
                "category": "ONBOARDING",
                "title": "Nhà Quản Lý Đa Ví",
                "description": "Sở hữu từ 3 ví thanh toán trở lên (Tiền mặt, Ngân hàng, Ví MoMo/ZaloPay).",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-layer-group",
                "color": "#cd7f32",
                "is_unlocked": wallet_count >= 3,
                "current_val": wallet_count,
                "target_val": 3,
                "unit": "ví",
                "unlock_hint": "Tạo thêm ví MoMo, ZaloPay hoặc tài khoản ngân hàng phụ",
                "target_tab": "wallets",
                "unlocked_at": today_str if wallet_count >= 3 else None
            },
            {
                "id": "first_goal",
                "category": "ONBOARDING",
                "title": "Mầm Mống Tích Lũy",
                "description": "Thiết lập mục tiêu tiết kiệm cụ thể đầu tiên.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-seedling",
                "color": "#cd7f32",
                "is_unlocked": goals_count >= 1,
                "current_val": goals_count,
                "target_val": 1,
                "unit": "mục tiêu",
                "unlock_hint": "Vào mục Mục Tiêu Tiết Kiệm và tạo mục tiêu mới",
                "target_tab": "savings",
                "unlocked_at": saving_goals[0].created_at.strftime("%d/%m/%Y") if (saving_goals and goals_count >= 1 and saving_goals[0].created_at) else (today_str if goals_count >= 1 else None)
            },
            {
                "id": "first_budget",
                "category": "ONBOARDING",
                "title": "Kế Hoạch Ngân Sách",
                "description": "Thiết lập hạn mức ngân sách tháng để kiểm soát chi tiêu.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-chart-pie",
                "color": "#cd7f32",
                "is_unlocked": budget_count >= 1,
                "current_val": budget_count,
                "target_val": 1,
                "unit": "hạn mức",
                "unlock_hint": "Vào Hạn Mức Ngân Sách để đặt giới hạn chi tiêu tháng",
                "target_tab": "budgets",
                "unlocked_at": budgets[0].created_at.strftime("%d/%m/%Y") if (budgets and budget_count >= 1 and budgets[0].created_at) else (today_str if budget_count >= 1 else None)
            },
            {
                "id": "category_explorer",
                "category": "ONBOARDING",
                "title": "Nhà Khám Phá Chi Tiêu",
                "description": "Ghi chép giao dịch phân bổ trên 5 danh mục thu/chi khác nhau.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-tags",
                "color": "#cd7f32",
                "is_unlocked": distinct_categories_count >= 5,
                "current_val": distinct_categories_count,
                "target_val": 5,
                "unit": "danh mục",
                "unlock_hint": "Ghi giao dịch ở nhiều danh mục khác nhau như Ăn uống, Xăng xe, Mua sắm...",
                "target_tab": "transactions",
                "unlocked_at": today_str if distinct_categories_count >= 5 else None
            },

            # ==================== II. CHUỖI KỶ LUẬT (STREAKS) ====================
            {
                "id": "streak_3_days",
                "category": "STREAK",
                "title": "Kỷ Luật 3 Ngày",
                "description": "Duy trì ghi chép thu chi 3 ngày liên tiếp không gián đoạn.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-fire",
                "color": "#f97316",
                "is_unlocked": current_streak >= 3 or tx_count >= 3,
                "current_val": max(current_streak, min(tx_count, 3)),
                "target_val": 3,
                "unit": "ngày",
                "unlock_hint": "Ghi ít nhất 1 giao dịch mỗi ngày trong 3 ngày liên tục",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_7_days",
                "category": "STREAK",
                "title": "Chiến Binh 7 Ngày",
                "description": "Duy trì chuỗi ghi chép trọn vẹn 1 tuần liên tiếp.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-fire-flame-curved",
                "color": "#94a3b8",
                "is_unlocked": current_streak >= 7,
                "current_val": current_streak,
                "target_val": 7,
                "unit": "ngày",
                "unlock_hint": "Ghi chép giao dịch liên tục trong 7 ngày không ngắt quãng",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_14_days",
                "category": "STREAK",
                "title": "Kỷ Luật 2 Tuần",
                "description": "Duy trì thói quen ghi chép liên tục trong suốt 14 ngày.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-calendar-check",
                "color": "#94a3b8",
                "is_unlocked": current_streak >= 14,
                "current_val": current_streak,
                "target_val": 14,
                "unit": "ngày",
                "unlock_hint": "Duy trì chuỗi ghi chép liên tục trong 14 ngày",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_30_days",
                "category": "STREAK",
                "title": "Thói Quen Vàng 30 Ngày",
                "description": "Hình thành thói quen kiểm soát tài chính bền vững suốt 1 tháng.",
                "tier": "GOLD",
                "tier_name": "Vàng",
                "icon": "fa-solid fa-crown",
                "color": "#eab308",
                "is_unlocked": current_streak >= 30,
                "current_val": current_streak,
                "target_val": 30,
                "unit": "ngày",
                "unlock_hint": "Duy trì chuỗi 30 ngày ghi chép không bỏ ngày nào",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_60_days",
                "category": "STREAK",
                "title": "Kỷ Luật Thép 60 Ngày",
                "description": "Kỳ tích 2 tháng liên tục đồng hành cùng tự do tài chính.",
                "tier": "DIAMOND",
                "tier_name": "Kim Cương",
                "icon": "fa-solid fa-medal",
                "color": "#06b6d4",
                "is_unlocked": current_streak >= 60,
                "current_val": current_streak,
                "target_val": 60,
                "unit": "ngày",
                "unlock_hint": "Duy trì chuỗi liên tiếp 60 ngày",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_100_days",
                "category": "STREAK",
                "title": "Bậc Thầy Kỷ Luật 100 Ngày",
                "description": "Cột mốc 100 ngày kỷ luật tài chính bất khả chiến bại.",
                "tier": "MYTHIC",
                "tier_name": "Huyền Thoại",
                "icon": "fa-solid fa-gem",
                "color": "#a855f7",
                "is_unlocked": current_streak >= 100,
                "current_val": current_streak,
                "target_val": 100,
                "unit": "ngày",
                "unlock_hint": "Ghi chép giao dịch suốt 100 ngày liên tục",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "streak_365_days",
                "category": "STREAK",
                "title": "Kỷ Lục Gia 365 Ngày",
                "description": "Trọn vẹn 1 năm 365 ngày kỷ luật tài chính hoàn mỹ.",
                "tier": "MYTHIC",
                "tier_name": "Huyền Thoại",
                "icon": "fa-solid fa-sun",
                "color": "#f59e0b",
                "is_unlocked": current_streak >= 365,
                "current_val": current_streak,
                "target_val": 365,
                "unit": "ngày",
                "unlock_hint": "Duy trì chuỗi ghi chép liên tục suốt 365 ngày",
                "target_tab": "transactions",
                "unlocked_at": None
            },

            # ==================== III. TÍCH LŨY & TÀI SẢN (SAVINGS & WEALTH) ====================
            {
                "id": "savings_1m",
                "category": "SAVINGS",
                "title": "Heo Đất Nhỏ",
                "description": "Tích lũy đạt mốc 1.000.000 ₫ trong các mục tiêu tiết kiệm.",
                "tier": "BRONZE",
                "tier_name": "Đồng",
                "icon": "fa-solid fa-piggy-bank",
                "color": "#cd7f32",
                "is_unlocked": total_saved_in_goals >= 1000000.0,
                "current_val": total_saved_in_goals,
                "target_val": 1000000.0,
                "unit": "₫",
                "unlock_hint": "Nạp thêm tiền vào mục tiêu tiết kiệm để đạt 1 triệu",
                "target_tab": "savings",
                "unlocked_at": None
            },
            {
                "id": "completed_goal",
                "category": "SAVINGS",
                "title": "Về Đích Ngoạn Mục",
                "description": "Hoàn thành 100% ít nhất một mục tiêu tiết kiệm bạn đã đặt ra.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-flag-checkered",
                "color": "#94a3b8",
                "is_unlocked": has_completed_goal,
                "current_val": 1 if has_completed_goal else 0,
                "target_val": 1,
                "unit": "mục tiêu",
                "unlock_hint": "Tích lũy đủ 100% số tiền mục tiêu đề ra",
                "target_tab": "savings",
                "unlocked_at": None
            },
            {
                "id": "savings_10m",
                "category": "SAVINGS",
                "title": "Khoản Dự Phòng An Tâm",
                "description": "Tích lũy đạt mốc 10.000.000 ₫ bảo vệ tương lai.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-sack-dollar",
                "color": "#94a3b8",
                "is_unlocked": total_saved_in_goals >= 10000000.0 or total_net_worth >= 10000000.0,
                "current_val": max(total_saved_in_goals, total_net_worth),
                "target_val": 10000000.0,
                "unit": "₫",
                "unlock_hint": "Gia tăng tổng số dư tiết kiệm & tài sản đạt 10 triệu",
                "target_tab": "savings",
                "unlocked_at": None
            },
            {
                "id": "savings_50m",
                "category": "SAVINGS",
                "title": "Cột Mốc Vàng 50 Triệu",
                "description": "Tích lũy đạt 50.000.000 ₫ vững vàng tài chính.",
                "tier": "GOLD",
                "tier_name": "Vàng",
                "icon": "fa-solid fa-vault",
                "color": "#eab308",
                "is_unlocked": total_saved_in_goals >= 50000000.0 or total_net_worth >= 50000000.0,
                "current_val": max(total_saved_in_goals, total_net_worth),
                "target_val": 50000000.0,
                "unit": "₫",
                "unlock_hint": "Tích lũy tổng tài sản đạt 50 triệu",
                "target_tab": "savings",
                "unlocked_at": None
            },
            {
                "id": "networth_100m",
                "category": "SAVINGS",
                "title": "Đại Gia Bách Triệu",
                "description": "Tổng tài sản ròng trên tất cả các ví vượt ngưỡng 100.000.000 ₫.",
                "tier": "DIAMOND",
                "tier_name": "Kim Cương",
                "icon": "fa-solid fa-building-columns",
                "color": "#06b6d4",
                "is_unlocked": total_net_worth >= 100000000.0,
                "current_val": total_net_worth,
                "target_val": 100000000.0,
                "unit": "₫",
                "unlock_hint": "Gia tăng tổng số dư ví vượt 100 triệu",
                "target_tab": "wallets",
                "unlocked_at": None
            },
            {
                "id": "networth_500m",
                "category": "SAVINGS",
                "title": "Nửa Tỷ Tự Do",
                "description": "Tổng tài sản ròng trên tất cả các ví vượt mốc 500.000.000 ₫.",
                "tier": "DIAMOND",
                "tier_name": "Kim Cương",
                "icon": "fa-solid fa-money-bill-wave",
                "color": "#06b6d4",
                "is_unlocked": total_net_worth >= 500000000.0,
                "current_val": total_net_worth,
                "target_val": 500000000.0,
                "unit": "₫",
                "unlock_hint": "Tổng tài sản ròng vượt 500 triệu",
                "target_tab": "wallets",
                "unlocked_at": None
            },
            {
                "id": "networth_1b",
                "category": "SAVINGS",
                "title": "Tỷ Phú FinTrack",
                "description": "Tổng giá trị tài sản ròng cán mốc 1.000.000.000 ₫ huyền thoại.",
                "tier": "MYTHIC",
                "tier_name": "Huyền Thoại",
                "icon": "fa-solid fa-trophy",
                "color": "#a855f7",
                "is_unlocked": total_net_worth >= 1000000000.0,
                "current_val": total_net_worth,
                "target_val": 1000000000.0,
                "unit": "₫",
                "unlock_hint": "Tổng giá trị tài sản ròng cán mốc 1 Tỷ đồng",
                "target_tab": "wallets",
                "unlocked_at": None
            },

            # ==================== IV. KỸ NĂNG & QUẢN TRỊ (MASTERY & AI) ====================
            {
                "id": "smart_ai_user",
                "category": "MASTERY",
                "title": "Chuyên Gia AI",
                "description": "Tận dụng AI bóc tách giọng nói/câu nói tự nhiên thành giao dịch >= 3 lần.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-wand-magic-sparkles",
                "color": "#6366f1",
                "is_unlocked": ai_tx_count >= 3,
                "current_val": ai_tx_count,
                "target_val": 3,
                "unit": "lần",
                "unlock_hint": "Dùng tính năng '⚡ Nhập Nhanh AI' ít nhất 3 lần",
                "target_tab": "ai_assistant",
                "unlocked_at": None
            },
            {
                "id": "smart_investor",
                "category": "MASTERY",
                "title": "Nhà Đầu Tư Bản Lĩnh",
                "description": "Có ít nhất 1 khoản thu nhập từ đầu tư sinh lời hoặc lãi suất.",
                "tier": "SILVER",
                "tier_name": "Bạc",
                "icon": "fa-solid fa-chart-line",
                "color": "#94a3b8",
                "is_unlocked": has_invest_income or curr_income > 0,
                "current_val": 1 if (has_invest_income or curr_income > 0) else 0,
                "target_val": 1,
                "unit": "khoản thu",
                "unlock_hint": "Ghi nhận thu nhập từ lãi tiết kiệm, cổ phiếu hoặc kinh doanh",
                "target_tab": "transactions",
                "unlocked_at": None
            },
            {
                "id": "fifty_thirty_twenty_achieved",
                "category": "MASTERY",
                "title": "Chuẩn Mực 50/30/20",
                "description": "Đạt tỷ lệ tiết kiệm trên 20% tổng thu nhập trong tháng.",
                "tier": "GOLD",
                "tier_name": "Vàng",
                "icon": "fa-solid fa-scale-balanced",
                "color": "#eab308",
                "is_unlocked": savings_rate >= 20.0,
                "current_val": savings_rate,
                "target_val": 20.0,
                "unit": "%",
                "unlock_hint": "Giữ chi tiêu dưới 80% thu nhập để tiết kiệm trên 20%",
                "target_tab": "analytics",
                "unlocked_at": None
            },
            {
                "id": "budget_guardian",
                "category": "MASTERY",
                "title": "Thủ Lĩnh Ngân Sách",
                "description": "Kiểm soát chi tiêu hoàn hảo, không có danh mục nào bị bội chi.",
                "tier": "GOLD",
                "tier_name": "Vàng",
                "icon": "fa-solid fa-shield-halved",
                "color": "#10b981",
                "is_unlocked": budget_count >= 1 and not has_overspent,
                "current_val": 1 if (budget_count >= 1 and not has_overspent) else 0,
                "target_val": 1,
                "unit": "tháng",
                "unlock_hint": "Giữ tất cả danh mục trong hạn mức ngân sách tháng",
                "target_tab": "budgets",
                "unlocked_at": None
            }
        ]

        # Calculate progress percentage for each badge
        for b in badges_def:
            target = b["target_val"]
            curr = b["current_val"]
            if b["is_unlocked"]:
                b["progress_pct"] = 100
            else:
                pct = int((curr / target * 100)) if target > 0 else 0
                b["progress_pct"] = max(0, min(99, pct))

        unlocked_count = sum(1 for b in badges_def if b["is_unlocked"])
        total_count = len(badges_def)

        # Gamification Level / Rank calculation
        xp = unlocked_count * 150 + current_streak * 25
        level = (xp // 300) + 1
        level_titles = [
            "Tập Sự Tài Chính",
            "Người Quản Lý Triển Vọng",
            "Chiến Binh Tiết Kiệm",
            "Nhà Đầu Tư Bản Lĩnh",
            "Bậc Thầy Tài Chính Tự Do",
            "Huyền Thoại FinTrack"
        ]
        level_title = level_titles[min(level - 1, len(level_titles) - 1)]

        return {
            "unlocked_count": unlocked_count,
            "total_count": total_count,
            "completion_pct": round((unlocked_count / total_count * 100), 1),
            "current_streak": current_streak,
            "level": level,
            "level_title": level_title,
            "xp": xp,
            "xp_next_level": level * 300,
            "badges": badges_def
        }

badge_service = BadgeService()
