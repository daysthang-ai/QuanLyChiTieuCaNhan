import { api } from '../api.js?v=20260904_01';
import { formatVND, formatDateVN, formatDateTimeVN } from '../utils/formatters.js?v=20260904_01';

// Fallback plans data in case of network latency
const FALLBACK_PLANS = [
  {
    id: "FREE",
    name: "FinTrack Free",
    tagline: "Dành cho người mới bắt đầu quản lý tài chính",
    price: 0,
    billing_cycle: "Miễn phí vĩnh viễn",
    ai_limits: 10,
    ai_limits_text: "10 lượt gọi AI / ngày (300 lượt/tháng)",
    badge: "FREE",
    badge_color: "bg-slate-800 text-slate-400 border-slate-700",
    highlight: false,
    max_wallets: 2,
    features: [
      "10 lượt gọi AI / ngày (300 lượt/tháng)",
      "Quản lý tối đa 2 ví tài chính cơ bản",
      "Theo dõi thu - chi & danh mục chuẩn",
      "Cảnh báo hạn mức & Báo cáo 30 ngày"
    ]
  },
  {
    id: "PRO",
    name: "FinTrack Pro",
    tagline: "Tối ưu cho người đi làm & quản lý tài chính chủ động",
    price: 49000,
    billing_cycle: "49.000 ₫ / tháng (hoặc 490k/năm)",
    ai_limits: 100,
    ai_limits_text: "100 lượt gọi AI / ngày (3.000 lượt/tháng)",
    badge: "⭐ POPULAR",
    badge_color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    highlight: false,
    max_wallets: 5,
    features: [
      "100 lượt gọi AI / ngày (3.000 lượt/tháng)",
      "Quản lý tối đa 5 ví tài chính",
      "Cố vấn tài chính 50/30/20 chuyên sâu",
      "Xuất báo cáo Excel/PDF cơ bản",
      "Không giới hạn hạn mức ngân sách"
    ]
  },
  {
    id: "PREMIUM",
    name: "FinTrack Premium",
    tagline: "Dành cho cá nhân & gia đình quản lý tài chính nâng cao",
    price: 99000,
    billing_cycle: "99.000 ₫ / tháng (hoặc 990k/năm)",
    ai_limits: 300,
    ai_limits_text: "1.000 Token AI / tháng (300 lượt gọi AI cao cấp/tháng)",
    badge: "⭐ BEST SELLER",
    badge_color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    highlight: false,
    max_wallets: 10,
    features: [
      "Hạn mức 1.000 Token AI / tháng (300 lượt gọi AI cao cấp/tháng)",
      "Quản lý tối đa 10 ví tài chính",
      "Bóc tách hóa đơn & Dự báo dòng tiền thông minh",
      "Xuất báo cáo chi tiết & Phân tích chuyên sâu",
      "Hỗ trợ kỹ thuật ưu tiên qua Ticket (phản hồi trong 24h)"
    ]
  },
  {
    id: "PLATINUM",
    name: "FinTrack Platinum VIP",
    tagline: "Trải nghiệm đỉnh cao không giới hạn toàn diện cho nhà đầu tư",
    price: 199000,
    billing_cycle: "199.000 ₫ / tháng (hoặc 1.990k/năm)",
    ai_limits: -1,
    ai_limits_text: "VIP Unlimited (Không giới hạn Token / Lượt gọi AI)",
    badge: "👑💎 PLATINUM VIP",
    badge_color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    highlight: true,
    max_wallets: -1,
    features: [
      "KHÔNG GIỚI HẠN Token / Lượt gọi AI (VIP Unlimited AI)",
      "Quản lý Không giới hạn số lượng ví & tài khoản ngân hàng",
      "Ưu tiên xử lý AI Engine tốc độ cao nhất (Fast Response)",
      "Trợ lý AI phân tích danh mục đầu tư & cảnh báo rủi ro 24/7",
      "Tự động sao lưu dữ liệu đám mây (Cloud Snapshot)",
      "Huy hiệu Platinum độc quyền & Hỗ trợ kỹ thuật 1-1 riêng biệt"
    ]
  }
];

// Ensure helper methods exist on API Client instance (cache-safe self-healing)
if (api) {
  if (typeof api.getPlans !== 'function') {
    api.getPlans = function() {
      return this.request ? this.request('/auth/plans') : Promise.resolve(FALLBACK_PLANS);
    };
  }
  if (typeof api.upgradePlan !== 'function') {
    api.upgradePlan = function(plan, walletId = null, durationMonths = 1, paymentMethod = 'WALLET', bankCode = '') {
      const payload = { plan, duration_months: durationMonths, payment_method: paymentMethod, bank_code: bankCode };
      if (walletId) payload.wallet_id = parseInt(walletId);
      return this.request ? this.request('/auth/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify(payload)
      }) : Promise.reject(new Error('API request function not ready'));
    };
  }
  if (typeof api.getAIQuota !== 'function') {
    api.getAIQuota = function() {
      return this.request ? this.request('/ai/quota') : Promise.resolve({
        plan: 'FREE',
        used_today: 0,
        daily_limit: 10,
        remaining_today: 10,
        is_unlimited: false,
        percentage: 0
      });
    };
  }
}

export class SubscriptionComponent {
  constructor(app) {
    this.app = app;
    this.plans = FALLBACK_PLANS;
    this.quota = null;
    window.fintrackSubscription = this;
    window.renderCurrentPlanBanner = (user) => this.renderCurrentPlanBanner(user);
    window.scrollToPricingCards = () => this.scrollToPricingCards();
    window.openUpgradeModal = (planId) => this.openUpgradeModal(planId);
  }

  async render(container) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-xl text-amber-400 mb-2 block"></i>
        Đang tải thông tin gói dịch vụ & hạn mức AI...
      </div>
    `;

    try {
      const getPlansCall = typeof api.getPlans === 'function' ? api.getPlans() : Promise.resolve(FALLBACK_PLANS);
      const getQuotaCall = typeof api.getAIQuota === 'function' ? api.getAIQuota() : Promise.resolve({
        plan: this.app.currentUser?.plan || 'FREE',
        used_today: 0,
        daily_limit: 10,
        remaining_today: 10,
        is_unlimited: false,
        percentage: 0
      });

      const [plans, quota] = await Promise.all([
        getPlansCall.catch(() => FALLBACK_PLANS),
        getQuotaCall.catch(() => ({
          plan: this.app.currentUser?.plan || 'FREE',
          used_today: 0,
          daily_limit: 10,
          remaining_today: 10,
          is_unlimited: false,
          percentage: 0
        }))
      ]);

      this.plans = (plans && plans.length > 0) ? plans : FALLBACK_PLANS;
      this.quota = quota;
      this.renderContent(container);
    } catch (e) {
      console.warn('Subscription render fallback:', e);
      this.plans = FALLBACK_PLANS;
      this.renderContent(container);
    }
  }

  renderContent(container) {
    const user = this.app.currentUser || {};
    const currentPlan = (user.plan || 'FREE').toUpperCase();
    const daysRemaining = user.days_remaining;
    const planActivatedAt = user.plan_activated_at;
    const planExpiresAt = user.plan_expires_at;
    const isPaid = currentPlan === 'PRO' || currentPlan === 'PREMIUM' || currentPlan === 'PLATINUM';
    const isExpiringSoon = isPaid && (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 5);

    const isPlatinum = currentPlan === 'PLATINUM';
    const isPremium = currentPlan === 'PREMIUM';
    const isPro = currentPlan === 'PRO';

    // Elapsed percentage calculation for progress bar
    let elapsedPercent = 0;
    if (isPaid && planActivatedAt && planExpiresAt) {
      const startMs = new Date(planActivatedAt).getTime();
      const endMs = new Date(planExpiresAt).getTime();
      const nowMs = Date.now();
      const totalMs = Math.max(1, endMs - startMs);
      const elapsedMs = Math.max(0, nowMs - startMs);
      elapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    }

    const q = this.quota || {
      plan: currentPlan,
      used_today: 0,
      daily_limit: isPlatinum ? 'Unlimited' : isPremium ? 300 : isPro ? 100 : 10,
      remaining_today: isPlatinum ? 'Không giới hạn' : 10,
      is_unlimited: isPlatinum,
      percentage: isPlatinum ? 100 : 0
    };

    container.innerHTML = `
      <div id="view-subscription" data-tab-id="subscription" class="content-section user-tab-pane w-full max-w-[1700px] mx-auto px-2 sm:px-4 space-y-7 transition-all duration-300 ease-in-out animate-in fade-in">
        
        <!-- Header Banner -->
        <div class="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1e1508]">
          <!-- Glow orbs -->
          <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
          <div class="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white flex items-center justify-center text-3xl shadow-xl shadow-purple-500/30 flex-shrink-0 animate-bounce">
                <i class="fa-solid fa-crown"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                    Bảng Giá Dịch Vụ & Thời Hạn <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">FinTrack VIP</span>
                  </h1>
                </div>
                <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Nâng cấp 4 cấp độ gói cước (Free, Pro, Premium, Platinum VIP) để mở rộng hạn mức Token AI, số lượng ví tài chính và kích hoạt Cố vấn tài chính chuyên sâu 24/7.
                </p>
              </div>
            </div>

            <!-- Current Plan Badge Widget -->
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center flex-shrink-0 min-w-[220px]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gói Tài Khoản Hiện Tại</span>
              <span class="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isPlatinum ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20' : isPremium ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20' : isPro ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                ${isPlatinum ? '👑💎 PLATINUM VIP' : isPremium ? '👑 FINTRACK PREMIUM' : isPro ? '⭐ FINTRACK PRO' : '🌱 FREE PLAN'}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. DARK CYBER CARD: TRẠNG THÁI GÓI HIỆN TẠI DUY NHẤT (Current Plan Status Banner) -->
        ${this.renderCurrentPlanBanner(user)}

        <!-- 2. Live AI Daily Usage Quota Card -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl ${isPlatinum ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : isPremium ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'} flex items-center justify-center text-sm">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div>
                <h3 class="text-xs font-extrabold text-slate-100 uppercase tracking-wider">Hạn Mức Sử Dụng Token / Lượt Gọi AI Trong Ngày (Realtime 24h)</h3>
                <p class="text-[11px] text-slate-400">Tự động làm mới vào 00:00 mỗi ngày &bull; Gói: <b class="${isPlatinum ? 'text-emerald-300' : isPremium ? 'text-amber-300' : isPro ? 'text-purple-300' : 'text-slate-300'}">${user.plan_name || 'FinTrack Free'}</b></p>
              </div>
            </div>
            
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-200">
                Đã dùng: <b class="${isPlatinum ? 'text-emerald-400' : isPremium ? 'text-amber-400' : isPro ? 'text-purple-400' : 'text-indigo-400'}">${q.used_today}</b> / ${q.is_unlimited ? '∞ Không giới hạn' : `<b class="text-slate-100">${q.daily_limit}</b> lượt`}
              </span>
              <span class="text-[10px] ${q.is_unlimited ? 'text-emerald-400' : 'text-emerald-400'} block font-mono">
                ${q.is_unlimited ? '⚡ VIP Unlimited AI (Không giới hạn)' : `Còn lại: ${q.remaining_today} lượt`}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5">
            <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
              <div class="h-full rounded-full transition-all duration-500 ${q.is_unlimited ? 'w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400' : q.percentage > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}" 
                style="width: ${q.is_unlimited ? 100 : Math.min(100, Math.max(5, q.percentage))}%;"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 lượt</span>
              <span>${q.is_unlimited ? '👑 Platinum Unlimited AI' : `${q.percentage}% đã sử dụng`}</span>
              <span>${q.is_unlimited ? 'VIP ∞' : `${q.daily_limit} lượt/ngày`}</span>
            </div>
          </div>
        </div>

        <!-- 3. Pricing Cards Grid (4 Tiers) -->
        ${this.renderSubscriptionPlans(currentPlan)}

        <!-- Guarantee & FAQ Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <span class="font-bold text-slate-200 block">Bảo Mật Zero-PII</span>
              <span class="text-[10px] text-slate-400">Tuyệt đối không lưu dữ liệu nhạy cảm</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-rotate-left"></i>
            </div>
            <div>
              <span class="font-bold text-slate-200 block">Hủy & Đổi Gói Bất Cứ Lúc Nào</span>
              <span class="text-[10px] text-slate-400">Linh hoạt, tự động tính ngày cộng dồn</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <span class="font-bold text-slate-200 block">Hỗ Trợ Kỹ Thuật VIP 24/7</span>
              <span class="text-[10px] text-slate-400">Ưu tiên xử lý & Hỗ trợ kỹ thuật 1-1 Platinum</span>
            </div>
          </div>
        </div>

        <!-- Personal Orders History & Approval Status -->
        <div class="glass-card p-6 rounded-3xl space-y-4 border border-slate-800">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-500/30">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-100">Lịch Sử Đơn Nạp & Kích Hoạt Gói VIP</h3>
                <p class="text-[11px] text-slate-400 font-mono">Theo dõi trạng thái đối soát & phê duyệt của Ban Quản Trị</p>
              </div>
            </div>
            <button type="button" id="btn-refresh-user-orders" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate text-[11px]"></i>
              <span>Làm Mới</span>
            </button>
          </div>

          <div id="user-orders-table-container">
            <div class="py-6 text-center text-slate-500 text-xs animate-pulse">
              Đang tải lịch sử đơn nạp tiền của bạn...
            </div>
          </div>
        </div>

      </div>
    `;

    document.getElementById('btn-refresh-user-orders')?.addEventListener('click', () => {
      this.loadUserSubscriptionOrders();
    });

    this.loadUserSubscriptionOrders();
  }

  // Cuộn mượt xuống khu vực bảng giá dịch vụ
  scrollToPricingCards() {
    const el = document.getElementById('pricing-cards-section') || document.getElementById('subscription-tiers-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =========================================================================
  // RENDER BANNER GÓI TÀI KHOẢN HIỆN TẠI (CURRENT PLAN STATUS BANNER)
  // Phân cấp 3 nhóm: Gói Free, Gói Trả Phí Trung Gian (Pro/Premium), Gói Platinum VIP
  // =========================================================================
  renderCurrentPlanBanner(user = null) {
    const u = user || this.app?.currentUser || (typeof window !== 'undefined' && window.fintrackApp?.currentUser) || {};
    const currentPlan = (u.plan || 'FREE').toUpperCase();
    const daysRemaining = u.days_remaining;
    const planActivatedAt = u.plan_activated_at;
    const planExpiresAt = u.plan_expires_at;
    const isPaid = currentPlan === 'PRO' || currentPlan === 'PREMIUM' || currentPlan === 'PLATINUM';
    const isExpiringSoon = isPaid && (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 5);

    const isPlatinum = currentPlan === 'PLATINUM';
    const isPremium = currentPlan === 'PREMIUM' || currentPlan === 'VIP';
    const isPro = currentPlan === 'PRO';
    const isFree = !isPaid;

    // Tính % thời gian đã sử dụng trong chu kỳ gói
    let elapsedPercent = 0;
    if (isPaid && planActivatedAt && planExpiresAt) {
      const startMs = new Date(planActivatedAt).getTime();
      const endMs = new Date(planExpiresAt).getTime();
      const nowMs = Date.now();
      const totalMs = Math.max(1, endMs - startMs);
      const elapsedMs = Math.max(0, nowMs - startMs);
      elapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    }

    // 1. QUY TẮC HIỂN THỊ NÚT HÀNH ĐỘNG THEO CẤP ĐỘ GÓI (PLAN TIER LOGIC)
    let actionButtonsHtml = '';

    if (isFree) {
      // -----------------------------------------------------------------------
      // A. Gói Miễn Phí (FREE):
      // - DUY NHẤT 1 Button: [⚡ Khám Phá & Nâng Cấp Gói VIP]
      // - Gradient Emerald/Cyan phát sáng, cuộn mượt xuống #pricing-cards-section
      // -----------------------------------------------------------------------
      actionButtonsHtml = `
        <button type="button" 
          id="btn-banner-upgrade-free"
          onclick="scrollToPricingCards()" 
          class="py-2.5 px-5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/30 border border-emerald-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-bolt text-slate-950"></i>
          <span>Khám Phá & Nâng Cấp Gói VIP</span>
          <i class="fa-solid fa-arrow-down text-xs text-slate-950 ml-0.5"></i>
        </button>
      `;
    } else if (isPro) {
      // -----------------------------------------------------------------------
      // B1. Gói Trả Phí Trung Gian PRO:
      // - Hiển thị CẢ 2 Nút Button cạnh nhau:
      //   + BUTTON 1: [🔄 Gia Hạn Gói Hiện Tại] (Gradient Indigo/Blue #6366f1 -> #3b82f6, chữ trắng đậm)
      //   + BUTTON 2: [⚡ Nâng Cấp Gói Cao Hơn] (Gradient Emerald/Cyan neon, chữ slate-950 đậm)
      // -----------------------------------------------------------------------
      actionButtonsHtml = `
        <button type="button" 
          id="btn-banner-renew-current"
          onclick="openUpgradeModal('PRO')" 
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:brightness-110 shadow-lg shadow-indigo-500/30 border border-indigo-400/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-arrows-rotate text-white"></i>
          <span>Gia Hạn Gói Hiện Tại</span>
        </button>

        <button type="button" 
          id="btn-banner-upgrade-higher"
          onclick="scrollToPricingCards()" 
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/30 border border-emerald-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-bolt text-slate-950"></i>
          <span>Nâng Cấp Gói Cao Hơn</span>
          <i class="fa-solid fa-arrow-down text-xs text-slate-950 ml-0.5"></i>
        </button>
      `;
    } else if (isPremium) {
      // -----------------------------------------------------------------------
      // B2. Gói Trả Phí Trung Gian PREMIUM:
      // - Hiển thị CẢ 2 Nút Button cạnh nhau:
      //   + BUTTON 1: [🔄 Gia Hạn Gói Hiện Tại] (Gradient Amber/Orange #f59e0b -> #ea580c, chữ slate-950 đậm)
      //   + BUTTON 2: [⚡ Nâng Cấp Gói Cao Hơn] (Gradient Emerald/Cyan neon, chữ slate-950 đậm)
      // -----------------------------------------------------------------------
      actionButtonsHtml = `
        <button type="button" 
          id="btn-banner-renew-current"
          onclick="openUpgradeModal('PREMIUM')" 
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-110 shadow-lg shadow-amber-500/30 border border-amber-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-arrows-rotate text-slate-950"></i>
          <span>Gia Hạn Gói Hiện Tại</span>
        </button>

        <button type="button" 
          id="btn-banner-upgrade-higher"
          onclick="scrollToPricingCards()" 
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/30 border border-emerald-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-bolt text-slate-950"></i>
          <span>Nâng Cấp Gói Cao Hơn</span>
          <i class="fa-solid fa-arrow-down text-xs text-slate-950 ml-0.5"></i>
        </button>
      `;
    } else if (isPlatinum) {
      // -----------------------------------------------------------------------
      // C. Gói Cao Nhất (PLATINUM VIP):
      // - ẨN HOÀN TOÀN nút "Nâng Cấp Gói" (vì đã ở cấp tối đa)
      // - DUY NHẤT 1 Button: [🔄 Gia Hạn Platinum VIP]
      // - Style Neon Emerald Gradient phát sáng nổi bật (#34d399 -> #5eead4 -> #22d3ee), chữ slate-950 đậm
      // - Click: Mở trực tiếp Modal Gia Hạn Platinum VIP
      // -----------------------------------------------------------------------
      actionButtonsHtml = `
        <button type="button" 
          id="btn-banner-renew-platinum"
          onclick="openUpgradeModal('PLATINUM')" 
          class="py-2.5 px-5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/30 border border-emerald-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-arrows-rotate text-slate-950"></i>
          <span>Gia Hạn Platinum VIP</span>
        </button>
      `;
    }

    // 2. BADGE CẤP ĐỘ VÀ THỜI HẠN CÒN LẠI (VÍ DỤ: "ĐANG HOẠT ĐỘNG – CÒN 57 NGÀY")
    let statusBadgeHtml = '';
    if (isExpiringSoon) {
      statusBadgeHtml = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/20">⚠️ CẢNH BÁO: CÒN ${daysRemaining} NGÀY</span>`;
    } else if (isPaid) {
      const badgeColor = isPlatinum 
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
        : isPremium 
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20' 
          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20';
      const remainingText = (daysRemaining !== null && daysRemaining !== undefined) ? `CÒN ${daysRemaining} NGÀY` : 'VÔ THỜI HẠN';
      statusBadgeHtml = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}">ĐANG HOẠT ĐỘNG – ${remainingText}</span>`;
    } else {
      statusBadgeHtml = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">🌱 MIỄN PHÍ VĨNH VIỄN</span>`;
    }

    return `
      <!-- 1. DARK CYBER CARD: TRẠNG THÁI GÓI HIỆN TẠI DUY NHẤT (Current Plan Status Banner) -->
      <div id="current-plan-banner" class="glass-card p-6 rounded-3xl border ${isExpiringSoon ? 'border-rose-500/60 shadow-xl shadow-rose-500/20' : isPlatinum ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/20 ring-1 ring-emerald-500/30' : isPremium ? 'border-amber-400/50 shadow-xl shadow-amber-500/15' : isPro ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/15' : 'border-slate-800 shadow-xl'} relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950">
        
        <!-- Background Cyber Glow -->
        <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full ${isExpiringSoon ? 'bg-rose-500/15' : isPlatinum ? 'bg-emerald-500/15' : isPremium ? 'bg-amber-500/15' : isPro ? 'bg-indigo-500/15' : 'bg-emerald-500/10'} blur-3xl pointer-events-none"></div>

        <div class="relative z-10 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl ${isPlatinum ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-xl shadow-emerald-500/30 ring-1 ring-emerald-400/40' : isPremium ? 'gradient-amber text-slate-950 shadow-lg shadow-amber-500/30' : isPro ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-emerald-400 border border-slate-700'} flex items-center justify-center text-2xl flex-shrink-0">
                <i class="fa-solid ${isPlatinum ? 'fa-gem' : isPremium ? 'fa-crown' : isPro ? 'fa-bolt' : 'fa-seedling'}"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2.5">
                  <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Gói Tài Khoản Hiện Tại:</span>
                  <h3 class="text-base sm:text-lg font-black text-slate-100">
                    ${isPlatinum ? '👑💎 Platinum VIP' : isPremium ? '👑 FinTrack Premium' : isPro ? '⚡ FinTrack Pro' : '🌱 FinTrack Free'}
                  </h3>
                  ${statusBadgeHtml}
                </div>
                <p class="text-xs text-slate-300 mt-1">
                  ${isPaid 
                    ? `Hạn dùng đến: <b class="text-slate-100 font-mono">${planExpiresAt ? formatDateTimeVN(planExpiresAt) : '---'}</b> &bull; Đã sử dụng: <b class="${isExpiringSoon ? 'text-rose-400' : isPlatinum ? 'text-emerald-400' : isPremium ? 'text-amber-400' : 'text-indigo-400'} font-mono">${elapsedPercent}%</b> chu kỳ gói.`
                    : 'Hạn mức 10 lượt gọi AI / ngày, quản lý tối đa 2 ví tài chính cơ bản. Nâng cấp VIP để mở khóa toàn bộ tính năng cao cấp.'}
                </p>
              </div>
            </div>

            <!-- Action Buttons Container (Bên phải banner, layout flex gap-2.5 items-center) -->
            <div id="banner-action-buttons" class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-start md:self-auto">
              ${actionButtonsHtml}
            </div>
          </div>

          ${isPaid ? `
            <!-- Mini Progress Bar for Active Subscription Cycle -->
            <div class="pt-3 border-t border-slate-800/80 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-mono">
                <span class="text-slate-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-chart-simple text-[10px]"></i> Tiến độ thời hạn gói:
                </span>
                <span class="font-bold ${isExpiringSoon ? 'text-rose-400' : 'text-slate-300'}">
                  Đã dùng: <b>${elapsedPercent}%</b> &bull; Còn lại: <b>${daysRemaining || 0} ngày</b>
                </span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                <div class="h-full rounded-full transition-all duration-700 ${isExpiringSoon ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse' : isPlatinum ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400' : isPremium ? 'gradient-amber' : 'gradient-purple'}" 
                  style="width: ${Math.min(100, Math.max(4, elapsedPercent))}%;"></div>
              </div>
            </div>

            ${isExpiringSoon ? `
              <!-- Warning Alert Banner for Expiring Soon -->
              <div class="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center gap-2.5 text-xs animate-in fade-in">
                <i class="fa-solid fa-triangle-exclamation text-rose-400 text-base flex-shrink-0 animate-bounce"></i>
                <div>
                  <span class="font-extrabold text-rose-300 block">Cảnh Báo: Gói Dịch Vụ Sắp Hết Hạn!</span>
                  <span class="text-[11px] text-rose-200/80">Tài khoản chỉ còn <b>${daysRemaining} ngày</b>. Hãy chọn gia hạn gói bên dưới để tiếp tục trải nghiệm không gián đoạn.</span>
                </div>
              </div>
            ` : ''}
          ` : ''}

        </div>
      </div>
    `;
  }

  // Render the 4 Pricing Cards Grid in a balanced 4-column layout
  renderSubscriptionPlans(currentPlanParam = null) {
    const currentUser = this.app?.currentUser || {};
    const tierRank = { 'FREE': 0, 'PRO': 1, 'PREMIUM': 2, 'VIP': 2, 'PLATINUM': 3 };
    const userPlanKey = (currentPlanParam || currentUser.plan_tier || currentUser.plan || 'FREE').toUpperCase();
    const userRank = tierRank[userPlanKey] ?? 0;

    return `
      <div id="pricing-cards-section" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full mx-auto scroll-mt-6 transition-all duration-300">
        ${this.plans.map(plan => {
          const planCode = (plan.code || plan.id || '').toUpperCase();
          const targetRank = tierRank[planCode] ?? 0;
          const isPlat = planCode === 'PLATINUM';
          const isPrem = planCode === 'PREMIUM' || planCode === 'VIP';
          const isP = planCode === 'PRO';

          let cardStyle = 'border border-slate-700/80 bg-slate-900/60 shadow-lg shadow-slate-950/60 rounded-2xl p-6 flex flex-col justify-between';
          let aiBoxStyle = 'border border-slate-800 bg-slate-950/80 text-slate-300';
          let aiIconColor = 'text-slate-400';
          let checkIconColor = 'text-slate-400';
          let btnClass = 'border border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-all';
          let btnText = 'Chọn Gói Này';
          let isDisabled = false;

          // Card Border, Glow & Cyber Gradient Theme
          if (isPlat) {
            // Platinum VIP: Màu Xanh Ngọc Lục Bảo - Emerald
            cardStyle = 'border-2 border-emerald-400 bg-gradient-to-b from-emerald-950/50 via-slate-900/90 to-slate-950 shadow-2xl shadow-emerald-950/90 hover:shadow-emerald-400/40 rounded-2xl p-6 flex flex-col justify-between transition-all ring-1 ring-emerald-500/40 relative';
            aiBoxStyle = 'border border-emerald-400/50 bg-emerald-950/70 text-emerald-300';
            aiIconColor = 'text-emerald-300';
            checkIconColor = 'text-emerald-400';
          } else if (isPrem) {
            // Premium: Màu Vàng Kim - Amber/Gold
            cardStyle = 'border-2 border-amber-500/90 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 shadow-xl shadow-amber-950/80 hover:shadow-amber-500/35 rounded-2xl p-6 flex flex-col justify-between transition-all relative';
            aiBoxStyle = 'border border-amber-500/50 bg-amber-950/60 text-amber-300';
            aiIconColor = 'text-amber-300';
            checkIconColor = 'text-amber-400';
          } else if (isP) {
            // Pro: Màu Xanh Tím - Indigo
            cardStyle = 'border-2 border-indigo-500/80 bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950 shadow-xl shadow-indigo-950/80 hover:shadow-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between transition-all relative';
            aiBoxStyle = 'border border-indigo-500/40 bg-indigo-950/60 text-indigo-300';
            aiIconColor = 'text-indigo-300';
            checkIconColor = 'text-indigo-400';
          } else {
            // Free: Slate / Xám mờ
            cardStyle = 'border border-slate-700/80 bg-slate-900/60 shadow-lg shadow-slate-950/60 rounded-2xl p-6 flex flex-col justify-between relative';
            aiBoxStyle = 'border border-slate-800 bg-slate-950/80 text-slate-300';
            aiIconColor = 'text-slate-400';
            checkIconColor = 'text-slate-400';
          }

          // Button Logic Based on Tier Hierarchy
          if (targetRank === userRank) {
            if (planCode === 'FREE') {
              btnText = '✓ Đang Sử Dụng Gói Free';
              btnClass = 'border border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-all cursor-default font-bold';
              isDisabled = true;
            } else if (isPrem) {
              btnText = '👑 Gia Hạn Thêm';
              btnClass = 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950/60 transition-all';
            } else if (isPlat) {
              btnText = '👑 Gia Hạn Thêm';
              btnClass = 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-600/60 font-bold shadow-lg shadow-emerald-900/60 transition-all';
            } else {
              btnText = '👑 Gia Hạn Thêm';
              btnClass = 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 hover:bg-indigo-600/60 font-semibold shadow-md shadow-indigo-900/50 transition-all';
            }
          } else if (targetRank > userRank) {
            if (isP) {
              btnText = '⚡ Nâng Cấp Lên PRO';
              btnClass = 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-900/50 hover:scale-[1.02] transition-all';
            } else if (isPrem) {
              btnText = '👑 Nâng Cấp Lên Premium';
              btnClass = 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950/60 hover:scale-[1.02] transition-all';
            } else if (isPlat) {
              btnText = '💎 Nâng Cấp Lên Platinum';
              btnClass = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/60 hover:scale-[1.02] transition-all';
            } else {
              btnText = `Nâng Cấp Lên ${plan.name}`;
              btnClass = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/60 hover:scale-[1.02] transition-all';
            }
          } else {
            // targetRank < userRank
            btnText = `Chuyển Về Gói ${plan.name || planCode}`;
            btnClass = 'border border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-all font-bold';
          }

          return `
            <div class="${cardStyle}">
              
              ${isPlat ? `
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-xs px-2.5 py-1 rounded-full font-bold shadow-lg shadow-emerald-950/50">💎 PLATINUM VIP</span>
                </div>
              ` : isPrem ? `
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span class="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-md">⭐ BEST SELLER</span>
                </div>
              ` : isP ? `
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span class="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-md">⭐ PHỔ BIẾN</span>
                </div>
              ` : ''}

              <div>
                <!-- Plan Title & Badge -->
                <div class="flex items-center justify-between mb-2.5 ${isPlat || isPrem || isP ? 'mt-1' : ''}">
                  <h3 class="text-base font-black text-slate-100">${plan.name}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${plan.badge_color}">
                    ${plan.badge}
                  </span>
                </div>

                <p class="text-xs text-slate-400 min-h-[34px] mb-3 leading-relaxed">${plan.tagline}</p>

                <!-- Price -->
                <div class="py-3 mb-3 border-y border-slate-800/80">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl sm:text-3xl font-black font-mono ${isPlat ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300' : isPrem ? 'text-amber-400' : isP ? 'text-indigo-400' : 'text-slate-100'}">
                      ${plan.price === 0 ? '0 ₫' : formatVND(plan.price)}
                    </span>
                    <span class="text-xs text-slate-400 font-medium">/ tháng</span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono block mt-1">${plan.billing_cycle}</span>
                </div>

                <!-- AI Quota Highlight Box -->
                <div class="p-2.5 rounded-xl ${aiBoxStyle} mb-4 text-xs font-bold flex items-center gap-2">
                  <i class="fa-solid fa-wand-magic-sparkles text-sm ${aiIconColor}"></i>
                  <span class="leading-tight">${plan.ai_limits_text}</span>
                </div>

                <!-- Features List -->
                <div class="space-y-2 text-xs mb-5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quyền Lợi Gói:</span>
                  ${plan.features.map(f => `
                    <div class="flex items-start gap-2 text-slate-300">
                      <i class="fa-solid fa-circle-check ${checkIconColor} text-xs mt-0.5 flex-shrink-0"></i>
                      <span class="leading-tight text-[11px]">${f}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Action Button -->
              <button type="button" 
                class="btn-sparkle-burst w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${btnClass}"
                ${isDisabled ? 'disabled' : ''}
                onclick="window.fintrackSubscription.openUpgradeModal('${plan.id}')">
                <span>${btnText}</span>
                ${!isDisabled ? '<i class="fa-solid fa-arrow-right text-[10px]"></i>' : ''}
              </button>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // =========================================================================
  // MODAL GIA HẠN GÓI CƯỚC VIP (2 TAB TOGGLE: VIETQR CK TỰ ĐỘNG & VÍ TIỀN THẬT)
  // =========================================================================
  async openUpgradeModal(planId) {
    const modalEl = document.getElementById('upgradeModal') || document.getElementById('vipModal') || document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('flex', 'pointer-events-auto');
    modalEl.style.setProperty('display', 'flex', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    const plan = this.plans.find(p => p.id === planId) || {
      id: planId,
      name: planId === 'PLATINUM' ? 'FinTrack Platinum VIP' : planId === 'PREMIUM' ? 'FinTrack Premium' : planId === 'PRO' ? 'FinTrack Pro' : 'FinTrack Free',
      price: planId === 'PLATINUM' ? 199000 : planId === 'PREMIUM' ? 99000 : planId === 'PRO' ? 49000 : 0,
      ai_limits_text: planId === 'PLATINUM' ? 'VIP Unlimited (Không giới hạn Token / Lượt gọi AI)' : planId === 'PREMIUM' ? '1.000 Token AI / tháng (300 lượt gọi AI cao cấp)' : planId === 'PRO' ? '100 lượt gọi AI / ngày (3.000 lượt/tháng)' : '10 lượt gọi AI / ngày'
    };

    const isFree = plan.id === 'FREE';
    const isPlatinum = plan.id === 'PLATINUM';
    const isPremium = plan.id === 'PREMIUM';
    const isPro = plan.id === 'PRO';

    let selectedMonths = 1;
    let activeTab = 'vietqr'; // 'vietqr' or 'wallet'
    let currentOrder = null;
    let isProcessed = false;

    // Helper tạo link VietQR QuickLink chuẩn
    const buildVietQRUrl = (amt, memo) => {
      const cleanMemo = memo || `FTP ${this.app.currentUser?.id || 1} ORD123`;
      return `https://api.vietqr.io/image/970422-0374617569-compact2.jpg?amount=${amt}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=${encodeURIComponent("DANG QUYET THANG")}`;
    };

    // Bảng tính giá theo thời hạn
    const getDurationPricing = (months) => {
      if (isFree) return { price: 0, days: 0, note: 'Vĩnh viễn' };
      if (planId === 'PLATINUM') {
        if (months === 12) return { price: 1990000, days: 365, note: 'Tặng 2 tháng (Tiết kiệm 17%)' };
        if (months === 6) return { price: 1069000, days: 180, note: 'Tiết kiệm 10%' };
        if (months === 3) return { price: 567000, days: 90, note: 'Tiết kiệm 5%' };
        return { price: 199000, days: 30, note: 'Chu kỳ 1 tháng' };
      } else if (planId === 'PREMIUM') {
        if (months === 12) return { price: 990000, days: 365, note: 'Tặng 2 tháng (Tiết kiệm 17%)' };
        if (months === 6) return { price: 534000, days: 180, note: 'Tiết kiệm 10%' };
        if (months === 3) return { price: 279000, days: 90, note: 'Tiết kiệm 5%' };
        return { price: 99000, days: 30, note: 'Chu kỳ 1 tháng' };
      } else {
        // PRO
        if (months === 12) return { price: 490000, days: 365, note: 'Tặng 2 tháng (Tiết kiệm 17%)' };
        if (months === 6) return { price: 264000, days: 180, note: 'Tiết kiệm 10%' };
        if (months === 3) return { price: 139000, days: 90, note: 'Tiết kiệm 5%' };
        return { price: 49000, days: 30, note: 'Chu kỳ 1 tháng' };
      }
    };

    // Lấy thông tin ví tiền thật (Real Wallet)
    let wallets = [];
    try {
      wallets = await api.getWallets();
    } catch (_) {
      wallets = [];
    }

    let realWallet = wallets.find(w => w.wallet_scope === 'real') || {
      id: null,
      name: 'Ví Thanh Toán Dịch Vụ & VIP FinTrack',
      wallet_scope: 'real',
      balance: 0,
      currency: 'VND'
    };

    // Lấy thông tin cổng ngân hàng thụ hưởng
    let gateway = {
      bank_code: 'MB',
      bank_id: 'MB',
      bank_name: 'MB Bank',
      account_number: '0374617569',
      account_name: 'DANG QUYET THANG',
      qr_template: 'compact2'
    };
    try {
      const gwRes = await api.getActiveBankGateway();
      if (gwRes && gwRes.account_number) gateway = gwRes;
    } catch (_) {}

    const isCurrentPlanSelected = (this.app.currentUser?.plan || '').toUpperCase() === planId;
    const modalTitle = isFree 
      ? 'Chuyển Về Gói Miễn Phí (Free)' 
      : isCurrentPlanSelected 
      ? `Gia Hạn Gói Cước FinTrack VIP` 
      : `Nâng Cấp Gói Cước FinTrack VIP`;

    // Khởi tạo mã đơn hàng sơ khởi để render ngay lập tức không bị delay/trống
    const initialOrderNum = Math.floor(100000 + Math.random() * 900000);
    const initialOrderCode = `ORD-${initialOrderNum}`;
    const initialAmount = getDurationPricing(1).price;
    const initialMemo = `FTP ${this.app.currentUser?.id || 1} ${initialOrderCode}`;
    const initialQrUrl = buildVietQRUrl(initialAmount, initialMemo);

    // Xử lý sự kiện bàn phím ESC để đóng Modal
    const handleEscKey = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (window.closeUpgradeModal) window.closeUpgradeModal();
      }
    };
    document.addEventListener('keydown', handleEscKey);

    // Hàm đóng Modal sạch sẽ
    window.closeUpgradeModal = function() {
      const modal = document.getElementById('upgradeModal') || document.getElementById('vipModal') || document.getElementById('generic-modal');
      if (modal) {
        modal.classList.add('hidden', 'pointer-events-none');
        modal.classList.remove('flex', 'pointer-events-auto');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
        modal.innerHTML = '';
      }
      const altModal = document.getElementById('generic-modal');
      if (altModal && altModal !== modal) {
        altModal.classList.add('hidden', 'pointer-events-none');
        altModal.classList.remove('flex', 'pointer-events-auto');
        altModal.style.setProperty('display', 'none', 'important');
        altModal.style.setProperty('pointer-events', 'none', 'important');
        altModal.innerHTML = '';
      }
      // Dừng tiến trình polling ngầm nếu đang chạy
      if (window.vipPollingInterval) {
        clearInterval(window.vipPollingInterval);
        window.vipPollingInterval = null;
      }
      document.removeEventListener('keydown', handleEscKey);
    };
    window.closeVIPModal = window.closeUpgradeModal;

    // Render HTML Modal
    modalEl.innerHTML = `
      <div id="vip-modal-backdrop" onclick="if(event.target === this) closeUpgradeModal()" class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border ${isPlatinum ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/20' : isPremium ? 'border-amber-400/50 shadow-2xl shadow-amber-500/20' : isPro ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/20' : 'border-slate-800'} animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
          
          <!-- Background Cyber Glow -->
          <div class="absolute -top-24 -right-24 w-64 h-64 rounded-full ${isPlatinum ? 'bg-emerald-500/15' : isPremium ? 'bg-amber-500/15' : isPro ? 'bg-indigo-500/15' : 'bg-slate-500/10'} blur-3xl pointer-events-none"></div>

          <!-- Nút Đóng 'X' (Tối Ưu Touch Target, Z-Index 50) -->
          <button id="vip-modal-close-btn" onclick="closeUpgradeModal()" class="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center w-10 h-10" title="Đóng">
            <i class="fa-solid fa-xmark text-base pointer-events-none"></i>
          </button>

          <!-- 1. PHẦN ĐẦU MODAL (Giữ Nguyên) -->
          <div class="flex items-center gap-3.5 mb-5 pb-3.5 border-b border-slate-800 relative z-10 pr-10">
            <div class="w-12 h-12 rounded-2xl ${isPlatinum ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25' : isPremium ? 'gradient-amber text-slate-950 shadow-lg shadow-amber-500/25' : isPro ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 text-slate-300'} flex items-center justify-center text-xl shadow-lg flex-shrink-0">
              <i class="fa-solid ${isPlatinum ? 'fa-gem' : isPremium ? 'fa-crown' : isPro ? 'fa-bolt' : 'fa-seedling'}"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100">${modalTitle}</h3>
              <p class="text-xs text-slate-400">Gói ${plan.name} &bull; Tự động kích hoạt hạn mức AI</p>
            </div>
          </div>

          ${!isFree ? `
            <!-- Khung Chọn Thời Hạn Đăng Ký / Gia Hạn (3 Nút: 1 Tháng, 3 Tháng -5%, 1 Năm +2T) -->
            <div class="mb-4 relative z-10">
              <label class="block font-bold text-slate-300 text-xs mb-2">Chọn Thời Hạn Đăng Ký / Gia Hạn:</label>
              <div class="grid grid-cols-3 gap-2" id="vip-duration-group">
                <button type="button" class="vip-duration-pill px-3 py-2.5 rounded-2xl text-xs font-bold transition border border-amber-500 bg-amber-500/20 text-amber-300 shadow-md" data-months="1">
                  <div class="font-extrabold text-sm">1 Tháng</div>
                  <span class="text-[10px] font-mono opacity-90">${formatVND(getDurationPricing(1).price)}</span>
                </button>
                <button type="button" class="vip-duration-pill px-3 py-2.5 rounded-2xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600" data-months="3">
                  <div class="font-extrabold text-sm">3 Tháng</div>
                  <span class="text-[10px] font-mono text-emerald-400 font-bold">${formatVND(getDurationPricing(3).price)} (-5%)</span>
                </button>
                <button type="button" class="vip-duration-pill px-3 py-2.5 rounded-2xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600" data-months="12">
                  <div class="font-extrabold text-sm">1 Năm (12T)</div>
                  <span class="text-[10px] font-mono text-amber-300 font-bold">${formatVND(getDurationPricing(12).price)} (+2T)</span>
                </button>
              </div>
            </div>

            <!-- Khung Tóm Tắt Gói Cước -->
            <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 mb-4 font-sans relative z-10">
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Gói Dịch Vụ:</span>
                <span class="font-bold text-slate-100">${plan.name}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Hạn Mức AI Kích Hoạt:</span>
                <span class="font-mono font-bold ${isPlatinum ? 'text-emerald-300' : isPremium ? 'text-amber-400' : 'text-indigo-300'}">${plan.ai_limits_text}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Số Ngày Cộng Thêm:</span>
                <span class="font-mono font-bold text-cyan-400" id="vip-summary-days">...</span>
              </div>
              <div class="flex justify-between items-baseline border-t border-slate-800/80 pt-2 text-sm">
                <span class="font-bold text-slate-200">Số Tiền Cần Thanh Toán:</span>
                <span class="font-mono font-black text-lg ${isPlatinum ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400' : isPremium ? 'text-amber-400' : 'text-indigo-400'}" id="vip-summary-total-price">
                  ${formatVND(getDurationPricing(1).price)}
                </span>
              </div>
            </div>

            <!-- 2. CẤU TRÚC LẠI PHẦN CHỌN PHƯƠNG THỨC THANH TOÁN (Chỉ Giữ 2 Nút Toggle Rõ Ràng) -->
            <!-- Toggle 2 nút -->
            <div class="grid grid-cols-2 gap-3 mb-5 relative z-10">
              <button id="btnTabVietQR" onclick="switchVIPPaymentTab('vietqr')" class="py-2.5 px-4 rounded-xl font-medium border border-amber-500/40 bg-amber-500/20 text-amber-300 flex items-center justify-center gap-2 transition-all">
                ⚡ VietQR CK Tự Động
              </button>
              <button id="btnTabRealWallet" onclick="switchVIPPaymentTab('wallet')" class="py-2.5 px-4 rounded-xl font-medium border border-white/10 bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all">
                💳 Ví Tiền Thật
              </button>
            </div>

            <!-- 3A. Container 1: VietQR Form (Giống Modal Nạp Tiền Thật) -->
            <div id="vipTabVietQRContainer" class="block relative z-10 animate-in fade-in duration-150">
              <div class="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg mb-3">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span> 🟢 Lắng nghe Webhook Ngân Hàng (Polling 3s)...</span>
                <span class="font-mono">Tự động 100%</span>
              </div>
              <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center mb-3 relative">
                
                <!-- Khung Nền Trắng Bo Góc Nổi Bật Cho Ảnh QR -->
                <div class="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center w-36 h-36 shadow-lg">
                  <img id="vipQRImage" src="${initialQrUrl}" alt="VietQR MB Bank" class="w-32 h-32 object-contain" 
                    onerror="this.onerror=null; this.src='https://img.vietqr.io/image/970422-0374617569-compact2.png?amount=' + encodeURIComponent(this.getAttribute('data-amount') || '199000') + '&addInfo=' + encodeURIComponent(this.getAttribute('data-memo') || 'FTP') + '&accountName=DANG%20QUYET%20THANG';" 
                    data-amount="${initialAmount}" data-memo="${initialMemo}" />
                </div>

                <!-- Bảng Chi Tiết Thông Tin Chuyển Khoản -->
                <div class="w-full space-y-1.5 text-xs">
                  <div class="flex justify-between"><span class="text-slate-400">Mã đơn:</span><span id="vipOrderCode" class="font-mono text-emerald-400 font-bold">#${initialOrderCode}</span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Ngân hàng:</span><span class="text-white font-medium" id="vipBankName">MB Bank</span></div>
                  <div class="flex justify-between items-center"><span class="text-slate-400">Số tài khoản:</span><span id="vipSTK" class="text-emerald-400 font-mono font-bold flex items-center gap-1 cursor-pointer hover:underline" title="Click để sao chép STK">0374617569 <i class="fa-regular fa-copy text-[10px]"></i></span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Chủ tài khoản:</span><span class="text-white font-medium" id="vipAccountName">DANG QUYET THANG</span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Số tiền:</span><span id="vipAmountText" class="text-amber-400 font-bold">${formatVND(initialAmount)}</span></div>
                  <div class="flex justify-between items-center"><span class="text-slate-400">Nội dung CK:</span><span id="vipTransferContent" class="font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer hover:underline" title="Click để sao chép nội dung">${initialMemo} <i class="fa-regular fa-copy text-[10px]"></i></span></div>
                </div>
              </div>
              <button id="btnVIPDemoPay" onclick="triggerVIPDemoPay()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mb-2 cursor-pointer">
                ⚡ Demo Chuyển Tiền (Giả Lập Nhận Tiền Tức Thì)
              </button>
            </div>

            <!-- 3B. Container 2: Ví Tiền Thật Form -->
            <div id="vipTabWalletContainer" class="hidden space-y-4 relative z-10 animate-in fade-in duration-150">
              <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2.5 text-sm">
                <div class="flex justify-between"><span class="text-slate-400">Số dư Ví Tiền Thật:</span><span id="vipWalletBalanceText" class="text-emerald-400 font-bold font-mono">${formatVND(realWallet.balance)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Số tiền cần thanh toán:</span><span id="vipWalletPayAmountText" class="text-white font-bold font-mono">${formatVND(getDurationPricing(1).price)}</span></div>
                <div class="h-px bg-white/10 my-1"></div>
                <div class="flex justify-between"><span class="text-slate-400">Số dư còn lại:</span><span id="vipWalletRemainText" class="text-cyan-400 font-bold font-mono">...</span></div>
              </div>
              <div id="vipWalletActionArea">
                <button id="btnConfirmPayWallet" onclick="handlePayVIPWithWallet()" class="btn-sparkle-burst w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  ✅ Xác Nhận Trừ Ví & Gia Hạn Ngay
                </button>
              </div>
            </div>
          ` : `
            <!-- Free Plan Confirmation Shell -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-4 relative z-10">
              <p class="text-slate-300 leading-relaxed">
                Bạn đang chọn chuyển sang <b>Gói Miễn Phí (FinTrack Free)</b>. Hạn mức sẽ quay về 10 lượt gọi AI/ngày và tối đa 2 ví tài chính cơ bản.
              </p>
              <button type="button" id="btn-confirm-free-plan" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition">
                Xác Nhận Chuyển Sang Gói Free
              </button>
            </div>
          `}

        </div>
      </div>
    `;

    // Free plan handler
    if (isFree) {
      document.getElementById('btn-confirm-free-plan')?.addEventListener('click', async () => {
        try {
          const updatedUser = await api.upgradePlan('FREE', null, 1, 'WALLET');
          this.app.currentUser = updatedUser;
          this.app.renderUserProfileHeader();
          window.closeUpgradeModal();
          this.app.showToast('Đã chuyển về gói Free thành công!', 'success');
          const mainContainer = document.getElementById('main-content-view');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi chuyển gói Free', 'error');
        }
      });
      return;
    }

    // Elements
    const btnTabVietQR = document.getElementById('btnTabVietQR');
    const btnTabRealWallet = document.getElementById('btnTabRealWallet');
    const vipTabVietQRContainer = document.getElementById('vipTabVietQRContainer');
    const vipTabWalletContainer = document.getElementById('vipTabWalletContainer');

    const summaryDaysEl = document.getElementById('vip-summary-days');
    const summaryTotalEl = document.getElementById('vip-summary-total-price');

    const vipQRImage = document.getElementById('vipQRImage');
    const vipOrderCode = document.getElementById('vipOrderCode');
    const vipBankName = document.getElementById('vipBankName');
    const vipSTK = document.getElementById('vipSTK');
    const vipAccountName = document.getElementById('vipAccountName');
    const vipAmountText = document.getElementById('vipAmountText');
    const vipTransferContent = document.getElementById('vipTransferContent');
    const btnVIPDemoPay = document.getElementById('btnVIPDemoPay');

    const vipWalletBalanceText = document.getElementById('vipWalletBalanceText');
    const vipWalletPayAmountText = document.getElementById('vipWalletPayAmountText');
    const vipWalletRemainText = document.getElementById('vipWalletRemainText');
    const vipWalletActionArea = document.getElementById('vipWalletActionArea');

    // Success Handler (Called by Polling, Direct Wallet Pay, or Demo Button)
    const handlePaymentSuccess = async (methodLabel = 'MB Bank') => {
      if (isProcessed) return;
      isProcessed = true;
      if (window.vipPollingInterval) {
        clearInterval(window.vipPollingInterval);
        window.vipPollingInterval = null;
      }

      window.closeUpgradeModal();

      // Confetti Fireworks Celebration
      if (typeof window.confetti === 'function') {
        try {
          window.confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.6 }
          });
        } catch (_) {}
      }

      // Success Toast
      this.app.showToast(`🎉 Thanh toán thành công! Gói ${plan.name} đã được kích hoạt tự động qua ${methodLabel}!`, 'success');

      // Refresh User and Header UI
      try {
        this.app.currentUser = await api.getMe();
        if (typeof this.app.renderUserProfileHeader === 'function') {
          this.app.renderUserProfileHeader();
        }
      } catch (_) {}

      // Re-render subscription page & notifications
      const mainContainer = document.getElementById('main-content-view');
      if (mainContainer) {
        this.render(mainContainer);
      }
      if (typeof this.app.updateNotificationBadge === 'function') {
        this.app.updateNotificationBadge(false);
      }
    };

    // Generate VIP Order for Tab VietQR
    const generateVIPOrder = async () => {
      const pricing = getDurationPricing(selectedMonths);
      const generatedCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const localMemo = `FTP ${this.app.currentUser?.id || 1} ${generatedCode}`;
      const localQrUrl = buildVietQRUrl(pricing.price, localMemo);

      // Cập nhật UI ngay lập tức với Direct QuickLink
      if (vipQRImage) {
        vipQRImage.src = localQrUrl;
        vipQRImage.setAttribute('data-amount', pricing.price);
        vipQRImage.setAttribute('data-memo', localMemo);
      }
      if (vipOrderCode) vipOrderCode.textContent = `#${generatedCode}`;
      if (vipAmountText) vipAmountText.textContent = formatVND(pricing.price);
      if (vipTransferContent) vipTransferContent.innerHTML = `${localMemo} <i class="fa-regular fa-copy text-[10px]"></i>`;

      currentOrder = {
        order_code: generatedCode,
        amount: pricing.price,
        transfer_memo: localMemo,
        user_id: this.app.currentUser?.id || 1
      };

      try {
        const orderRes = await api.createVIPOrder(planId, selectedMonths, pricing.price, pricing.days);
        if (orderRes && orderRes.order_code) {
          currentOrder = orderRes;
          const qrUrl = orderRes.vietqr_url || buildVietQRUrl(orderRes.amount, orderRes.transfer_memo);

          if (vipQRImage) {
            vipQRImage.src = qrUrl;
            vipQRImage.setAttribute('data-amount', orderRes.amount);
            vipQRImage.setAttribute('data-memo', orderRes.transfer_memo);
          }
          if (vipOrderCode) vipOrderCode.textContent = `#${orderRes.order_code}`;
          if (vipAmountText) vipAmountText.textContent = formatVND(orderRes.amount);
          if (vipTransferContent) vipTransferContent.innerHTML = `${orderRes.transfer_memo} <i class="fa-regular fa-copy text-[10px]"></i>`;

          if (orderRes.bank_info) {
            if (vipBankName) vipBankName.textContent = orderRes.bank_info.bank_name || 'MB Bank';
            if (vipSTK) vipSTK.innerHTML = `${orderRes.bank_info.account_number} <i class="fa-regular fa-copy text-[10px]"></i>`;
            if (vipAccountName) vipAccountName.textContent = orderRes.bank_info.account_name || 'DANG QUYET THANG';
          }

          // Bắt đầu Polling 3s
          startPolling(orderRes.order_code);
        }
      } catch (err) {
        console.warn('Create VIP Order error, fallback to client generated:', err);
        startPolling(generatedCode);
      }
    };

    // Start 3-second Polling mechanism
    const startPolling = (orderCode) => {
      if (window.vipPollingInterval) clearInterval(window.vipPollingInterval);
      if (!orderCode) return;

      window.vipPollingInterval = setInterval(async () => {
        if (isProcessed) return;
        try {
          const res = await api.checkOrderStatus(orderCode);
          if (res && (res.is_approved || res.is_paid || res.status === 'APPROVED' || res.status === 'PAID')) {
            handlePaymentSuccess('MB Bank Webhook');
          }
        } catch (_) {}
      }, 3000);
    };

    // Update Calculations & Wallet Area
    const updateCalculations = () => {
      const pricing = getDurationPricing(selectedMonths);
      
      // Update Summary box
      if (summaryTotalEl) summaryTotalEl.textContent = formatVND(pricing.price);
      if (summaryDaysEl) {
        const user = this.app.currentUser || {};
        const now = new Date();
        let baseDate = now;
        if (user.plan_expires_at && (user.plan || '').toUpperCase() === planId) {
          const curExp = new Date(user.plan_expires_at);
          if (curExp > now) baseDate = curExp;
        }
        const newExp = new Date(baseDate.getTime() + pricing.days * 24 * 60 * 60 * 1000);
        summaryDaysEl.textContent = `+${pricing.days} ngày (đến ${formatDateVN(newExp)})`;
      }

      // Update Wallet Form
      const curBal = realWallet.balance || 0;
      if (vipWalletBalanceText) vipWalletBalanceText.textContent = formatVND(curBal);
      if (vipWalletPayAmountText) vipWalletPayAmountText.textContent = formatVND(pricing.price);

      const rem = curBal - pricing.price;
      if (rem >= 0) {
        if (vipWalletRemainText) vipWalletRemainText.innerHTML = `<span class="text-cyan-400 font-bold font-mono">${formatVND(rem)}</span>`;
        if (vipWalletActionArea) {
          vipWalletActionArea.innerHTML = `
            <button id="btnConfirmPayWallet" onclick="handlePayVIPWithWallet()" class="btn-sparkle-burst w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
              ✅ Xác Nhận Trừ Ví & Gia Hạn Ngay (${formatVND(pricing.price)})
            </button>
          `;
        }
      } else {
        const shortage = Math.abs(rem);
        if (vipWalletRemainText) vipWalletRemainText.innerHTML = `<span class="text-rose-400 font-bold font-mono">${formatVND(rem)} (Thiếu ${formatVND(shortage)})</span>`;
        if (vipWalletActionArea) {
          vipWalletActionArea.innerHTML = `
            <div class="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-2.5">
              <div class="text-rose-300 font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
                Số dư Ví Tiền Thật không đủ!
              </div>
              <p class="text-[11px] text-rose-200/80">Bạn đang thiếu <b>${formatVND(shortage)}</b> để thực hiện gia hạn gói VIP.</p>
              <button type="button" onclick="switchVIPPaymentTab('vietqr')" class="w-full py-2.5 rounded-xl gradient-amber text-slate-950 font-black text-xs shadow-md hover:shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer">
                <i class="fa-solid fa-qrcode text-sm"></i>
                <span>Nạp Tiền Thật / Chuyển Khoản VietQR Ngay</span>
              </button>
            </div>
          `;
        }
      }

      // If on Tab VietQR: Regenerate QR for new duration
      if (activeTab === 'vietqr') {
        generateVIPOrder();
      }
    };

    // Global Tab Switching function: switchVIPPaymentTab(tabName)
    window.switchVIPPaymentTab = (tabName) => {
      activeTab = tabName;
      if (tabName === 'vietqr') {
        btnTabVietQR.className = 'py-2.5 px-4 rounded-xl font-medium border border-amber-500/40 bg-amber-500/20 text-amber-300 flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 font-bold';
        btnTabRealWallet.className = 'py-2.5 px-4 rounded-xl font-medium border border-white/10 bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all';
        vipTabVietQRContainer.classList.remove('hidden');
        vipTabVietQRContainer.classList.add('block');
        vipTabWalletContainer.classList.add('hidden');
        generateVIPOrder();
      } else {
        if (window.vipPollingInterval) {
          clearInterval(window.vipPollingInterval);
          window.vipPollingInterval = null;
        }
        btnTabRealWallet.className = 'py-2.5 px-4 rounded-xl font-medium border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 font-bold';
        btnTabVietQR.className = 'py-2.5 px-4 rounded-xl font-medium border border-white/10 bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all';
        vipTabWalletContainer.classList.remove('hidden');
        vipTabVietQRContainer.classList.add('hidden');
        vipTabVietQRContainer.classList.remove('block');
      }
    };

    // Global Demo Trigger: triggerVIPDemoPay() / demoSimulatePayment()
    window.triggerVIPDemoPay = async () => {
      const orderCodeEl = document.getElementById('vipOrderCode');
      const displayedOrderCode = (orderCodeEl ? orderCodeEl.textContent.trim().replace(/^#/, '') : null) || currentOrder?.order_code;
      if (!displayedOrderCode) return;

      const btn = document.getElementById('btnVIPDemoPay');
      const originalHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang giả lập MB Bank chuyển tiền...`;
        btn.disabled = true;
      }

      try {
        const pricing = getDurationPricing(selectedMonths);
        const amt = currentOrder?.amount || pricing.price;
        const memo = currentOrder?.transfer_memo || `FTP ${this.app.currentUser?.id || 1} ${displayedOrderCode}`;
        const uId = this.app.currentUser?.id || currentOrder?.user_id || 1;

        await api.mockReceiveMoney(displayedOrderCode, amt, memo, uId);
        this.app.showToast('✅ MB Bank đã báo tiền về thành công!', 'success');
        handlePaymentSuccess('Demo MB Bank Webhook');
      } catch (mockErr) {
        console.error('Lỗi Demo VIP Pay:', mockErr);
        this.app.showToast(mockErr.message || 'Lỗi gửi tín hiệu giả lập', 'error');
        if (btn) {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      }
    };
    window.demoSimulatePayment = window.triggerVIPDemoPay;

    // Global Pay with Wallet: handlePayVIPWithWallet()
    window.handlePayVIPWithWallet = async () => {
      const pricing = getDurationPricing(selectedMonths);
      const btn = document.getElementById('btnConfirmPayWallet');
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang trừ ví & gia hạn VIP...`;
        btn.disabled = true;
      }

      try {
        const res = await api.payVIPWithWallet(planId, selectedMonths);
        if (res && res.user) {
          this.app.currentUser = res.user;
        }
        handlePaymentSuccess('Ví Tiền Thật FinTrack');
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi thanh toán qua Ví Tiền Thật', 'error');
        if (btn) {
          btn.innerHTML = `✅ Xác Nhận Trừ Ví & Gia Hạn Ngay (${formatVND(pricing.price)})`;
          btn.disabled = false;
        }
      }
    };

    // Duration pills click event
    modalEl.querySelectorAll('.vip-duration-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMonths = parseInt(btn.getAttribute('data-months') || '1');
        modalEl.querySelectorAll('.vip-duration-pill').forEach(b => {
          if (parseInt(b.getAttribute('data-months')) === selectedMonths) {
            b.className = 'vip-duration-pill px-3 py-2.5 rounded-2xl text-xs font-bold transition border border-amber-500 bg-amber-500/20 text-amber-300 shadow-md';
          } else {
            b.className = 'vip-duration-pill px-3 py-2.5 rounded-2xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600';
          }
        });
        updateCalculations();
      });
    });

    // Copy STK
    vipSTK?.addEventListener('click', () => {
      const acc = gateway.account_number || '0374617569';
      navigator.clipboard?.writeText(acc);
      this.app.showToast(`Đã sao chép STK MB Bank (${acc})!`, 'success');
    });

    // Copy Memo
    vipTransferContent?.addEventListener('click', () => {
      const memo = currentOrder?.transfer_memo || initialMemo;
      navigator.clipboard?.writeText(memo);
      this.app.showToast(`Đã sao chép cú pháp CK: ${memo}`, 'success');
    });

    // Initial calculations and QR loading for default Tab 1 (VietQR)
    updateCalculations();
  }

  // Alias for showUpgradeModal
  showUpgradeModal(planId) {
    return this.openUpgradeModal(planId);
  }

  // Load personal VIP orders history list
  async loadUserSubscriptionOrders() {
    const container = document.getElementById('user-orders-table-container');
    if (!container) return;

    try {
      const res = await api.getMySubscriptionOrders();
      const orders = (res && res.orders) ? res.orders : (Array.isArray(res) ? res : []);

      if (orders.length === 0) {
        container.innerHTML = `
          <div class="py-6 text-center text-slate-500 text-xs">
            <i class="fa-regular fa-receipt text-2xl text-slate-600 mb-1.5 block"></i>
            Bạn chưa có đơn nạp tiền hoặc đăng ký gói VIP nào.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="w-full overflow-x-auto overflow-y-hidden rounded-xl custom-scrollbar border border-slate-800/80" style="scrollbar-width: thin;">
          <table class="w-full text-left text-xs history-table table-fixed border-collapse" style="min-width: 1180px; width: 100%; table-layout: fixed; border-collapse: collapse;">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800 bg-slate-900/90 uppercase tracking-wider text-[10px] font-mono">
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 110px;">MÃ ĐƠN</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 140px;">THỜI GIAN</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 140px;">GÓI DỊCH VỤ</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 120px;">SỐ TIỀN (VNĐ)</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 140px;">PHƯƠNG THỨC</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 180px;">TRẠNG THÁI</th>
                <th class="py-3 px-3 font-bold whitespace-nowrap text-left" style="width: 350px; text-align: left;">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
              ${orders.map(o => {
                const isApproved = o.status === 'APPROVED';
                const isPending = o.status === 'PENDING';
                const isRejected = o.status === 'REJECTED';
                const planCode = (o.plan_code || '').toUpperCase();
                const isPlat = planCode === 'PLATINUM';
                const isPrem = planCode === 'PREMIUM';

                // 1. Badge Gói Dịch Vụ (Cưỡng chế inline style nền & viền chuẩn xác)
                let planBadgeHtml = '';
                if (isPlat) {
                  planBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(6, 78, 59, 0.5); color:#6ee7b7; border:1px solid rgba(16, 185, 129, 0.35); white-space:nowrap;">
                      <i class="fa-solid fa-crown text-emerald-400 text-[10px]"></i> PLATINUM VIP
                    </span>
                  `;
                } else if (isPrem) {
                  planBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(120, 53, 15, 0.35); color:#fde047; border:1px solid rgba(245, 158, 11, 0.35); white-space:nowrap;">
                      <i class="fa-solid fa-gem text-amber-400 text-[10px]"></i> PREMIUM VIP
                    </span>
                  `;
                } else {
                  planBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(88, 28, 135, 0.45); color:#d8b4fe; border:1px solid rgba(168, 85, 247, 0.35); white-space:nowrap;">
                      <i class="fa-solid fa-star text-amber-400 text-[10px]"></i> FINTRACK VIP
                    </span>
                  `;
                }

                // 2. Badge Trạng Thái (Cưỡng chế inline style nền & viền chuẩn xác)
                let statusBadgeHtml = '';
                if (isPending) {
                  statusBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(120, 53, 15, 0.35); color:#fcd34d; border:1px solid rgba(245, 158, 11, 0.35); white-space:nowrap;">
                      ⏳ Chờ Quản Trị Duyệt
                    </span>
                  `;
                } else if (isApproved) {
                  statusBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(6, 78, 59, 0.5); color:#6ee7b7; border:1px solid rgba(16, 185, 129, 0.35); white-space:nowrap;">
                      📗 Đã Kích Hoạt
                    </span>
                  `;
                } else {
                  statusBadgeHtml = `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; background-color:rgba(136, 19, 55, 0.4); color:#fda4af; border:1px solid rgba(244, 63, 94, 0.35); white-space:nowrap;">
                      ❌ Bị Từ Chối
                    </span>
                  `;
                }

                // 3. Ghi Chú (Hiển thị trọn vẹn 100% text, không bị cắt cụt)
                let noteHtml = '';
                if (isApproved) {
                  const approvedBy = o.approved_by || (o.payment_method === 'SEPAY_PG' ? 'AUTO_WEBHOOK_SEPAY' : 'AUTO_VIETQR_MB');
                  noteHtml = `<span class="text-xs font-mono text-emerald-400 whitespace-nowrap">Duyệt bởi ${approvedBy}</span>`;
                } else if (isRejected) {
                  const reason = o.rejection_reason || 'Sai cú pháp chuyển khoản MB Bank (không ghi rõ mã đơn)';
                  noteHtml = `<span class="text-xs text-rose-400 whitespace-nowrap">${reason}</span>`;
                } else {
                  const memo = o.transfer_memo || `FT NAP ${o.order_code}`;
                  noteHtml = `<span class="text-xs font-mono text-slate-400 whitespace-nowrap">${memo}</span>`;
                }

                return `
                  <tr class="hover:bg-slate-800/40 transition-colors duration-150" style="transition: background-color 0.15s ease;">
                    <td class="py-3.5 px-3 text-amber-400 font-mono font-bold text-xs whitespace-nowrap">#${o.order_code}</td>
                    <td class="py-3.5 px-3 text-slate-400 text-xs font-mono whitespace-nowrap">${o.created_at || '---'}</td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      ${planBadgeHtml}
                    </td>
                    <td class="py-3.5 px-3 text-slate-100 font-mono font-bold text-xs whitespace-nowrap">${formatVND(o.amount || 0)}</td>
                    <td class="py-3.5 px-3 text-slate-400 text-xs whitespace-nowrap font-sans">${o.payment_method === 'MB_VIETQR' ? 'VietQR MB Bank' : o.payment_method === 'SEPAY_PG' ? 'Cổng SePay Auto' : o.payment_method}</td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      ${statusBadgeHtml}
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap text-left" style="white-space: nowrap; padding-right: 24px;">
                      ${noteHtml}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="py-4 text-center text-slate-400 text-xs">
          Không thể tải lịch sử đơn hàng: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }
}

// Standalone helper function for direct banner rendering
export const renderCurrentPlanBanner = (user = null) => {
  if (window.fintrackSubscription) {
    return window.fintrackSubscription.renderCurrentPlanBanner(user);
  }
  const tempComp = new SubscriptionComponent(window.fintrackApp || {});
  return tempComp.renderCurrentPlanBanner(user);
};

export const scrollToPricingCards = () => {
  const el = document.getElementById('pricing-cards-section') || document.getElementById('subscription-tiers-grid');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export const openUpgradeModal = (planId) => {
  if (window.fintrackSubscription?.openUpgradeModal) {
    return window.fintrackSubscription.openUpgradeModal(planId);
  }
};

// Global bindings for inline onclick attributes
if (typeof window !== 'undefined') {
  window.renderCurrentPlanBanner = renderCurrentPlanBanner;
  window.scrollToPricingCards = scrollToPricingCards;
  window.openUpgradeModal = openUpgradeModal;
}

