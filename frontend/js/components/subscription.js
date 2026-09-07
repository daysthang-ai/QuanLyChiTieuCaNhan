import { api } from '../api.js?v=20260904_01';
import { formatVND, formatDateVN, formatDateTimeVN } from '../utils/formatters.js?v=20260904_01';
import { getPlanTheme, syncDynamicPlanTheme, normalizePlanTier, PLAN_THEMES, getSubscriptionPlanBadgeHtml, renderSubscriptionPlanBadge, getOrderNoteDescription } from '../theme_mapping.js?v=20260906_02';

// Fallback plans data in case of network latency
const FALLBACK_PLANS = [
  {
    id: "FREE",
    name: "FinTrack Free",
    tagline: "Cơ bản cho người mới bắt đầu",
    price: 0,
    billing_cycle: "0 ₫ / vĩnh viễn",
    ai_limits: 10,
    ai_limits_text: "10 lượt gọi AI / ngày (300 lượt/tháng)",
    badge: "FREE",
    badge_color: "bg-slate-800 text-slate-400 border-slate-700",
    highlight: false,
    max_wallets: 2,
    features: [
      "Ghi chép thu chi cơ bản",
      "Quản lý tối đa 2 ví tài chính",
      "Biểu đồ thống kê trực quan",
      "Cố vấn AI 10 lượt / ngày",
      "Bảo mật Zero-PII đám mây"
    ]
  },
  {
    id: "PRO",
    name: "VIP Pro",
    tagline: "Dành cho cá nhân tối ưu nâng cao",
    price: 49000,
    billing_cycle: "49.000 ₫ / tháng (hoặc 490k/năm)",
    ai_limits: 50,
    ai_limits_text: "50 lượt gọi AI / ngày (1.500 lượt/tháng)",
    badge: "TIẾT KIỆM",
    badge_color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    highlight: false,
    max_wallets: 5,
    features: [
      "Quản lý tối đa 5 ví đa nguồn",
      "Bóc tách NLP không giới hạn",
      "Cố vấn AI 50 lượt / ngày",
      "Hạn mức ngân sách 50/30/20",
      "Nạp VietQR / SePay 24/7"
    ]
  },
  {
    id: "PREMIUM",
    name: "FinTrack VIP",
    tagline: "Gói phổ biến nhất, mở khóa phân tích AI & hạn mức nâng cao",
    price: 99000,
    billing_cycle: "99.000 ₫ / tháng (hoặc 990k/năm)",
    ai_limits: 300,
    ai_limits_text: "Trợ lý AI 24/7 không giới hạn",
    badge: "⭐ PHỔ BIẾN NHẤT",
    badge_color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    highlight: true,
    max_wallets: -1,
    features: [
      "Không giới hạn ví & thẻ",
      "Trợ lý AI 24/7 không giới hạn",
      "Phân bổ chuẩn 50/30/20",
      "Bóc tách hóa đơn OCR / SMS",
      "Xuất báo cáo Excel & PDF"
    ]
  },
  {
    id: "PLATINUM",
    name: "Platinum VIP",
    tagline: "Đặc quyền cao cấp nhất dành cho chuyên gia & doanh nhân",
    price: 199000,
    billing_cycle: "199.000 ₫ / tháng (hoặc 1.990k/năm)",
    ai_limits: -1,
    ai_limits_text: "VIP Unlimited AI (Băng thông ưu tiên tối cao)",
    badge: "👑 VIP TỐI CAO",
    badge_color: "badge-vip-toi-cao bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/70 shadow-sm",
    highlight: false,
    max_wallets: -1,
    features: [
      "Toàn bộ quyền lợi FinTrack VIP",
      "Băng thông AI ưu tiên cao cấp",
      "Dự báo tài chính tương lai",
      "Hỗ trợ CSKH 1-1 riêng biệt 24/7",
      "Huy hiệu Platinum độc quyền"
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
    this.userOrders = [];
    this.ordersCurrentPage = 1;
    this.ordersPageSize = 10;
    this.ordersSearchQuery = '';
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

    const currentTheme = getPlanTheme(currentPlan);

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
                  Nâng cấp 4 cấp độ gói cước (Free, VIP Pro, FinTrack VIP, Platinum VIP) để mở rộng hạn mức Token AI, số lượng ví tài chính và kích hoạt Cố vấn tài chính chuyên sâu 24/7.
                </p>
              </div>
            </div>

            <!-- Current Plan Badge Widget -->
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center flex-shrink-0 min-w-[220px]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gói Tài Khoản Hiện Tại</span>
              <span id="subscription-header-plan-badge" class="${currentTheme.widgetBadgeClass}">
                ${currentTheme.widgetBadgeText}
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
          <div class="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-500/30 shrink-0">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-100">Lịch Sử Đơn Nạp & Kích Hoạt Gói VIP</h3>
                <p class="text-[11px] text-slate-400 font-mono">Theo dõi trạng thái đối soát & phê duyệt của Ban Quản Trị</p>
              </div>
            </div>
            <!-- Search & Actions Bar -->
            <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <!-- Search Input -->
              <div class="relative w-full sm:w-64 md:w-72">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 text-xs">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </span>
                <input type="text" id="input-search-user-orders" 
                  placeholder="🔍 Tìm mã đơn, gói dịch vụ, phương thức..." 
                  class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition shadow-inner font-sans" />
              </div>
              <!-- Refresh Button -->
              <button type="button" id="btn-refresh-user-orders" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer" title="Tải lại danh sách đơn hàng">
                <i class="fa-solid fa-arrows-rotate text-[11px]"></i>
                <span>Làm Mới</span>
              </button>
            </div>
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

    const searchOrdersInput = document.getElementById('input-search-user-orders');
    if (searchOrdersInput) {
      searchOrdersInput.addEventListener('input', (e) => {
        this.filterUserSubscriptionOrders(e.target.value);
      });
    }

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
    const theme = getPlanTheme(currentPlan);

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
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 shadow-lg shadow-cyan-500/20 border border-cyan-400/50 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-arrows-rotate text-cyan-300"></i>
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
      // B2. Gói Trả Phí Trung Gian FINTRACK VIP:
      // - Hiển thị CẢ 2 Nút Button cạnh nhau:
      //   + BUTTON 1: [🔄 Gia Hạn Gói Hiện Tại] (Gradient Indigo/Purple #6366f1 -> #a855f7, chữ trắng đậm)
      //   + BUTTON 2: [⚡ Nâng Cấp Gói Cao Hơn] (Gradient Emerald/Cyan neon, chữ slate-950 đậm)
      // -----------------------------------------------------------------------
      actionButtonsHtml = `
        <button type="button" 
          id="btn-banner-renew-current"
          onclick="openUpgradeModal('PREMIUM')" 
          class="py-2.5 px-4 rounded-xl font-bold text-sm text-white gradient-indigo hover:brightness-110 shadow-lg shadow-indigo-500/30 border border-purple-400/50 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
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
          class="py-2.5 px-5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 hover:brightness-110 shadow-lg shadow-amber-500/30 border border-white/75 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          <i class="fa-solid fa-arrows-rotate text-slate-950"></i>
          <span>Gia Hạn Platinum VIP</span>
        </button>
      `;
    }

    // 2. BADGE CẤP ĐỘ VÀ THỜI HẠN CÒN LẠI (VÍ DỤ: "ĐANG HOẠT ĐỘNG – CÒN 57 NGÀY")
    let statusBadgeHtml = '';
    if (isExpiringSoon) {
      statusBadgeHtml = `<span id="current-plan-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/20">⚠️ CẢNH BÁO: CÒN ${daysRemaining} NGÀY</span>`;
    } else {
      statusBadgeHtml = theme.statusBadgeHtml(daysRemaining);
    }

    return `
      <!-- 1. DARK CYBER CARD: TRẠNG THÁI GÓI HIỆN TẠI DUY NHẤT (Current Plan Status Banner) -->
      <div id="current-plan-banner" class="glass-card p-6 rounded-3xl border ${isExpiringSoon ? 'border-rose-500/60 shadow-xl shadow-rose-500/20' : theme.bannerBorderClass} relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 transition-all duration-300">
        
        <!-- Background Cyber Glow -->
        <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full ${isExpiringSoon ? 'bg-rose-500/15' : theme.bannerGlowClass} blur-3xl pointer-events-none transition-all duration-500"></div>

        <div class="relative z-10 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div id="current-plan-icon-box" class="${theme.iconBoxClass}">
                <i class="${theme.iconBoxIcon}"></i>
              </div>
              <div>
                <div id="current-plan-title-wrapper" class="flex flex-wrap items-center gap-2.5">
                  <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Gói Tài Khoản Hiện Tại:</span>
                  ${theme.titlePillHtml}
                  ${statusBadgeHtml}
                </div>
                <p class="text-xs text-slate-300 mt-1">
                  ${isPaid 
                    ? `Hạn dùng đến: <b class="text-slate-100 font-mono">${planExpiresAt ? formatDateTimeVN(planExpiresAt) : '---'}</b> &bull; Đã sử dụng: <b class="${isExpiringSoon ? 'text-rose-400' : theme.accentTextColor} font-mono">${elapsedPercent}%</b> chu kỳ gói.`
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
                <div id="current-plan-progress-fill" class="h-full rounded-full transition-all duration-700 ${isExpiringSoon ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse' : theme.progressBarClass}" 
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
      <div id="pricing-cards-section" class="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch w-full max-w-7xl mx-auto scroll-mt-6 transition-all duration-300">
        ${this.plans.map(plan => {
          const planCode = (plan.code || plan.id || '').toUpperCase();
          const targetRank = tierRank[planCode] ?? 0;
          const isPlat = planCode === 'PLATINUM';
          const isPrem = planCode === 'PREMIUM' || planCode === 'VIP';
          const isP = planCode === 'PRO';

          let cardStyle = 'pricing-card-free p-5 sm:p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5';
          let aiBoxStyle = 'border border-slate-800 bg-slate-950/80 text-slate-300';
          let aiIconColor = 'text-slate-400';
          let checkIconColor = 'text-emerald-400';
          let btnClass = 'border border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-all';
          let btnText = 'Chọn Gói Này';
          let isDisabled = false;

          // Card Border, Glow & Cyber Gradient Theme
          if (isPlat) {
            // Platinum VIP: Viền Neon Gradient Amber-Cyan-Indigo & Badge Tối Cao
            cardStyle = 'pricing-card-platinum relative overflow-visible p-5 sm:p-6 pt-10 sm:pt-11 rounded-3xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2';
            aiBoxStyle = 'border border-amber-400/40 bg-amber-950/40 text-amber-200';
            aiIconColor = 'text-amber-300';
            checkIconColor = 'text-cyan-400';
          } else if (isPrem) {
            // FinTrack VIP: Màu Tím Cyber Neon (Popular Card)
            cardStyle = 'pricing-card-vip pricing-card-featured relative overflow-visible p-5 sm:p-6 pt-10 sm:pt-11 rounded-3xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5';
            aiBoxStyle = 'border border-purple-500/50 bg-purple-950/60 text-purple-300';
            aiIconColor = 'text-purple-300';
            checkIconColor = 'text-purple-400';
          } else if (isP) {
            // VIP Pro: Màu Xanh Cyan
            cardStyle = 'pricing-card-pro p-5 sm:p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5';
            aiBoxStyle = 'border border-cyan-500/40 bg-cyan-950/60 text-cyan-300';
            aiIconColor = 'text-cyan-300';
            checkIconColor = 'text-cyan-400';
          } else {
            // Free: Slate / Xám mờ
            cardStyle = 'pricing-card-free p-5 sm:p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5';
            aiBoxStyle = 'border border-slate-800 bg-slate-950/80 text-slate-300';
            aiIconColor = 'text-slate-400';
            checkIconColor = 'text-emerald-400';
          }

          // Button Logic Based on Tier Hierarchy
          if (targetRank === userRank) {
            if (planCode === 'FREE') {
              btnText = '✓ Đang Sử Dụng Gói Free';
              btnClass = 'border border-slate-700 text-slate-400 bg-slate-800/40 cursor-default font-bold';
              isDisabled = true;
            } else if (isPrem) {
              btnText = '👑 Gia Hạn FinTrack VIP';
              btnClass = 'gradient-indigo text-white font-black shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all cursor-pointer';
            } else if (isPlat) {
              btnText = '👑 Gia Hạn Platinum VIP';
              btnClass = 'bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-cyan-500/40 active:scale-95 transition-all cursor-pointer';
            } else {
              btnText = '🔄 Gia Hạn VIP Pro';
              btnClass = 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-md shadow-cyan-900/40 transition-all cursor-pointer';
            }
          } else if (targetRank > userRank) {
            if (isP) {
              btnText = '⚡ Nâng Cấp VIP Pro';
              btnClass = 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 active:scale-95 transition-all cursor-pointer';
            } else if (isPrem) {
              btnText = '👑 Trải Nghiệm FinTrack VIP';
              btnClass = 'gradient-indigo text-white font-black shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all cursor-pointer';
            } else if (isPlat) {
              btnText = '👑 Đăng Ký Platinum VIP';
              btnClass = 'bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-cyan-500/40 active:scale-95 transition-all cursor-pointer';
            } else {
              btnText = `Nâng Cấp Lên ${plan.name}`;
              btnClass = 'gradient-emerald text-white font-bold shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer';
            }
          } else {
            // targetRank < userRank
            btnText = `Chuyển Về Gói ${plan.name || planCode}`;
            btnClass = 'border border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-all font-bold cursor-pointer';
          }

          return `
            <div class="${cardStyle}">
              
              ${isPlat ? `
                <div class="pricing-badge-platinum">
                  👑 VIP TỐI CAO
                </div>
              ` : isPrem ? `
                <div class="pricing-badge-popular">
                  ⭐ PHỔ BIẾN NHẤT
                </div>
              ` : ''}

              <div>
                <!-- Category Kicker -->
                <span class="text-[10.5px] font-black uppercase tracking-wider ${isPlat ? 'text-amber-300' : isPrem ? 'text-purple-300' : isP ? 'text-cyan-400' : 'text-slate-400'} block mb-1">
                  ${isPlat ? 'CHUYÊN GIA & DOANH NHÂN' : isPrem ? 'NÂNG CẤP THÔNG MINH' : isP ? 'CÁ NHÂN NÂNG CAO' : 'GÓI CƠ BẢN'}
                </span>

                <!-- Plan Title & Icon -->
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xl font-black text-white flex items-center gap-2">
                    <span>${plan.name}</span>
                    ${isPlat ? '<i class="fa-solid fa-gem text-amber-300 text-sm"></i>' : isPrem ? '<i class="fa-solid fa-crown text-purple-400 text-sm"></i>' : isP ? '<i class="fa-solid fa-bolt text-cyan-400 text-sm"></i>' : ''}
                  </h3>
                </div>

                <p class="text-xs text-slate-400 min-h-[34px] mb-3 leading-relaxed">${plan.tagline}</p>

                <!-- Price -->
                <div class="py-3 mb-3 border-y border-slate-800/80">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl sm:text-3xl font-black font-mono ${isPlat ? 'text-amber-300' : isPrem ? 'text-purple-300' : isP ? 'text-cyan-300' : 'text-slate-100'}">
                      ${plan.price === 0 ? '0 ₫' : formatVND(plan.price)}
                    </span>
                    <span class="text-xs text-slate-400 font-medium">${plan.price === 0 ? '/ vĩnh viễn' : '/ tháng'}</span>
                  </div>
                  ${isPlat ? `
                    <span class="text-[10px] text-amber-300/80 block mt-1">Đặc quyền cao cấp nhất</span>
                  ` : isPrem ? `
                    <span class="text-[10px] text-slate-400 line-through block mt-1">Giá gốc: 129.000 ₫ / tháng</span>
                  ` : isP ? `
                    <span class="text-[10px] text-slate-400 line-through block mt-1">Giá gốc: 69.000 ₫ / tháng</span>
                  ` : `
                    <span class="text-[10px] text-slate-400 block mt-1">Cơ bản cho người mới bắt đầu</span>
                  `}
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
                      <i class="fa-solid fa-check ${checkIconColor} text-xs mt-0.5 flex-shrink-0"></i>
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
      name: planId === 'PLATINUM' ? 'Platinum VIP' : planId === 'PREMIUM' ? 'FinTrack VIP' : planId === 'PRO' ? 'VIP Pro' : 'FinTrack Free',
      price: planId === 'PLATINUM' ? 199000 : planId === 'PREMIUM' ? 99000 : planId === 'PRO' ? 49000 : 0,
      ai_limits_text: planId === 'PLATINUM' ? 'VIP Unlimited AI (Băng thông ưu tiên tối cao)' : planId === 'PREMIUM' ? 'Trợ lý AI 24/7 không giới hạn' : planId === 'PRO' ? '50 lượt gọi AI / ngày (1.500 lượt/tháng)' : '10 lượt gọi AI / ngày'
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

    // Hiển thị trạng thái đang tải
    container.innerHTML = `
      <div class="py-8 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-amber-400 text-lg mb-2 block"></i>
        Đang tải lịch sử đơn nạp tiền của bạn...
      </div>
    `;

    try {
      const res = await api.getMySubscriptionOrders();
      const orders = (res && res.orders) ? res.orders : (Array.isArray(res) ? res : []);
      this.userOrders = orders;

      // Giữ lại từ khóa tìm kiếm nếu người dùng đã nhập trước đó
      const searchInput = document.getElementById('input-search-user-orders');
      if (searchInput && searchInput.value.trim()) {
        this.ordersSearchQuery = searchInput.value.trim();
      }

      this.renderUserSubscriptionOrdersTable();
    } catch (err) {
      container.innerHTML = `
        <div class="py-6 text-center text-slate-400 text-xs">
          <i class="fa-solid fa-circle-exclamation text-rose-500 text-xl mb-1.5 block"></i>
          Không thể tải lịch sử đơn hàng: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  // Lọc dữ liệu đơn hàng dựa trên từ khóa tìm kiếm
  getFilteredUserSubscriptionOrders() {
    const q = (this.ordersSearchQuery || '').trim().toLowerCase();
    if (!q) return this.userOrders || [];

    return (this.userOrders || []).filter(o => {
      const orderCode = String(o.order_code || '').toLowerCase();
      const cleanOrderCode = orderCode.replace(/^#/, '');
      const paymentMethodName = (o.payment_method === 'MB_VIETQR' ? 'VietQR MB Bank' : o.payment_method === 'SEPAY_PG' ? 'Cổng SePay Auto' : (o.payment_method || '')).toLowerCase();
      const planBadge = this.renderPlanBadge(o);
      const planName = (planBadge.name || '').toLowerCase();
      const rawPlan = String(o.plan_code || '').toLowerCase();
      const noteDesc = this.getOrderNoteDescription(o, o.amount || 0).toLowerCase();
      const memo = String(o.transfer_memo || '').toLowerCase();
      const amountStr = String(o.amount || 0);
      const formattedAmount = (typeof formatVND === 'function' ? formatVND(o.amount || 0) : '').toLowerCase();
      const createdAt = String(o.created_at || '').toLowerCase();

      let statusStr = '';
      if (o.status === 'APPROVED') statusStr = 'đã kích hoạt approved da kich hoat thanh cong';
      else if (o.status === 'PENDING') statusStr = 'chờ quản trị duyệt pending cho quan tri duyet doi soat';
      else statusStr = 'bị từ chối rejected bi tu choi';

      return orderCode.includes(q) ||
        cleanOrderCode.includes(q) ||
        paymentMethodName.includes(q) ||
        planName.includes(q) ||
        rawPlan.includes(q) ||
        noteDesc.includes(q) ||
        memo.includes(q) ||
        amountStr.includes(q) ||
        formattedAmount.includes(q) ||
        createdAt.includes(q) ||
        statusStr.includes(q);
    });
  }

  // Chuyển trang hiển thị
  goToOrdersPage(page) {
    const filtered = this.getFilteredUserSubscriptionOrders();
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.ordersPageSize));
    const targetPage = Math.min(Math.max(1, page), totalPages);
    if (this.ordersCurrentPage !== targetPage) {
      this.ordersCurrentPage = targetPage;
      this.renderUserSubscriptionOrdersTable();
      const tableWrapper = document.getElementById('user-orders-table-wrapper');
      if (tableWrapper) {
        const rect = tableWrapper.getBoundingClientRect();
        if (rect.top < 80) {
          tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  // Tạo danh sách số trang hiển thị phân trang thông minh
  generatePaginationPages(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  // Render 1 dòng trong bảng đơn hàng cá nhân
  renderUserOrderRow(o) {
    const isApproved = o.status === 'APPROVED';
    const isPending = o.status === 'PENDING';
    const isRejected = o.status === 'REJECTED';
    const rawPlan = (o.plan_code || '').toUpperCase();

    // 1. Ánh xạ động: Tách biệt rõ ràng 100% giữa "Nạp Ví Tiền Thật" và các gói VIP
    const planBadge = this.renderPlanBadge(o);
    const planBadgeHtml = planBadge.html;
    const planDisplayName = planBadge.name;

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

    // 3. Ghi Chú: Phân tích tự động dựa trên tên gói kết hợp với số tiền (VNĐ)
    const orderNoteDesc = this.getOrderNoteDescription(o, o.amount || 0);
    const rawNote = orderNoteDesc;
    let tooltip = orderNoteDesc;
    if (isApproved) {
      const approvedBy = o.approved_by || (o.payment_method === 'SEPAY_PG' ? 'AUTO_WEBHOOK_SEPAY' : 'AUTO_VIETQR_MB');
      tooltip += ` (Duyệt bởi ${approvedBy})`;
    } else if (isRejected) {
      const reason = o.rejection_reason || 'Sai cú pháp chuyển khoản MB Bank';
      tooltip += ` (Từ chối: ${reason})`;
    } else if (o.transfer_memo) {
      tooltip += ` (Cú pháp: ${o.transfer_memo})`;
    }

    const noteHtml = `<span class="text-xs text-slate-300 font-sans whitespace-nowrap font-medium" title="${tooltip.replace(/"/g, '&quot;')}">${this.escapeHtml(orderNoteDesc)}</span>`;
    const paymentMethodName = o.payment_method === 'MB_VIETQR' ? 'VietQR MB Bank' : o.payment_method === 'SEPAY_PG' ? 'Cổng SePay Auto' : (o.payment_method || '');

    return `
      <tr class="hover:bg-slate-800/40 transition-colors duration-150 user-order-row"
          data-order-code="${(o.order_code || '').replace(/"/g, '&quot;')}"
          data-payment-method="${paymentMethodName.replace(/"/g, '&quot;')}"
          data-amount="${o.amount || 0}"
          data-note="${rawNote.replace(/"/g, '&quot;')}"
          data-plan="${planDisplayName} ${rawPlan}"
          style="transition: background-color 0.15s ease;">
        <td class="py-3.5 px-3 text-amber-400 font-mono font-bold text-xs whitespace-nowrap">#${o.order_code}</td>
        <td class="py-3.5 px-3 text-slate-400 text-xs font-mono whitespace-nowrap">${o.created_at || '---'}</td>
        <td class="py-3.5 px-3 whitespace-nowrap">
          ${planBadgeHtml}
        </td>
        <td class="py-3.5 px-3 text-slate-100 font-mono font-bold text-xs whitespace-nowrap">${typeof formatVND === 'function' ? formatVND(o.amount || 0) : (o.amount || 0) + 'đ'}</td>
        <td class="py-3.5 px-3 text-slate-400 text-xs whitespace-nowrap font-sans">${paymentMethodName}</td>
        <td class="py-3.5 px-3 whitespace-nowrap">
          ${statusBadgeHtml}
        </td>
        <td class="py-3.5 px-3 whitespace-nowrap text-left" style="white-space: nowrap; padding-right: 24px;">
          ${noteHtml}
        </td>
      </tr>
    `;
  }

  // Render toàn bộ bảng và thanh điều hướng phân trang
  renderUserSubscriptionOrdersTable() {
    const container = document.getElementById('user-orders-table-container');
    if (!container) return;

    if (!this.userOrders || this.userOrders.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-500 text-xs">
          <i class="fa-regular fa-receipt text-3xl text-slate-600 mb-2 block"></i>
          <span class="font-medium text-slate-400">Bạn chưa có đơn nạp tiền hoặc đăng ký gói VIP nào.</span>
        </div>
      `;
      return;
    }

    const filtered = this.getFilteredUserSubscriptionOrders();
    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / this.ordersPageSize));

    // Đảm bảo số trang hợp lệ
    if (this.ordersCurrentPage > totalPages) this.ordersCurrentPage = totalPages;
    if (this.ordersCurrentPage < 1) this.ordersCurrentPage = 1;
    const currentPage = this.ordersCurrentPage;

    const startIndex = (currentPage - 1) * this.ordersPageSize;
    const endIndex = Math.min(startIndex + this.ordersPageSize, totalRecords);
    const pagedOrders = filtered.slice(startIndex, endIndex);

    let rowsHtml = '';
    if (totalRecords === 0) {
      rowsHtml = `
        <tr id="user-orders-no-match-row">
          <td colspan="7" class="py-10 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <i class="fa-solid fa-magnifying-glass text-slate-600 text-2xl mb-1"></i>
              <span class="font-bold text-slate-300 text-xs">Không tìm thấy kết quả phù hợp</span>
              <span class="text-[11px] text-slate-500">Không có đơn nạp nào khớp với từ khóa "${this.escapeHtml(this.ordersSearchQuery)}". Vui lòng kiểm tra lại mã đơn, phương thức hoặc ghi chú.</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      rowsHtml = pagedOrders.map(o => this.renderUserOrderRow(o)).join('');
    }

    // Xây dựng danh sách các nút số trang
    const pageList = this.generatePaginationPages(currentPage, totalPages);
    const pageButtonsHtml = pageList.map(p => {
      if (p === '...') {
        return `<span class="w-6 h-7 flex items-center justify-center text-slate-600 text-xs font-bold select-none">…</span>`;
      }
      if (p === currentPage) {
        return `<button type="button" class="w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center text-white ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/50 border border-cyan-300/80 cursor-default pagination-active-btn" style="background: linear-gradient(135deg, #ec4899 0%, #06b6d4 50%, #10b981 100%); box-shadow: 0 0 16px rgba(6, 182, 212, 0.65), 0 0 8px rgba(236, 72, 153, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.6); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);" aria-current="page">${p}</button>`;
      }
      return `<button type="button" data-page="${p}" class="btn-user-orders-page w-7 h-7 rounded-lg font-semibold text-xs flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer active:scale-95" title="Chuyển đến trang ${p}">${p}</button>`;
    }).join('');

    const startDisplay = totalRecords === 0 ? 0 : startIndex + 1;

    container.innerHTML = `
      <!-- Table Wrapper -->
      <div id="user-orders-table-wrapper" class="w-full overflow-x-auto overflow-y-hidden rounded-xl custom-scrollbar border border-slate-800/80" style="scrollbar-width: thin;">
        <table class="w-full text-left text-xs history-table table-fixed border-collapse" style="min-width: 1190px; width: 100%; table-layout: fixed; border-collapse: collapse;">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800 bg-slate-900/90 uppercase tracking-wider text-[10px] font-mono">
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 110px;">MÃ ĐƠN</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 140px;">THỜI GIAN</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 150px;">GÓI DỊCH VỤ</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 120px;">SỐ TIỀN (VNĐ)</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 140px;">PHƯƠNG THỨC</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap" style="width: 180px;">TRẠNG THÁI</th>
              <th class="py-3 px-3 font-bold whitespace-nowrap text-left" style="width: 350px; text-align: left;">GHI CHÚ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Pagination Navigation Bar -->
      <div id="user-orders-pagination-bar" class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 select-none">
        <!-- Records Counter & Page Size Selector -->
        <div class="flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <div class="flex items-center gap-1.5 text-slate-400 font-sans">
            <span>Hiển thị</span>
            <span class="font-bold text-slate-200 font-mono">${startDisplay} - ${endIndex}</span>
            <span>trên</span>
            <span class="font-bold text-amber-400 font-mono">${totalRecords}</span>
            <span>bản ghi</span>
            <span class="text-slate-600 hidden sm:inline">•</span>
            <span class="text-slate-400 hidden sm:inline">Trang <strong class="text-slate-200 font-mono">${currentPage}</strong> / <strong class="text-slate-200 font-mono">${totalPages}</strong></span>
          </div>

          <!-- Page size selector (10, 12, 15 dòng) -->
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
            <span class="text-slate-400">Hiển thị:</span>
            <select id="select-user-orders-page-size" class="bg-transparent text-cyan-400 font-bold outline-none cursor-pointer text-xs">
              <option value="10" class="bg-slate-900 text-slate-200" ${this.ordersPageSize === 10 ? 'selected' : ''}>10 / trang</option>
              <option value="12" class="bg-slate-900 text-slate-200" ${this.ordersPageSize === 12 ? 'selected' : ''}>12 / trang</option>
              <option value="15" class="bg-slate-900 text-slate-200" ${this.ordersPageSize === 15 ? 'selected' : ''}>15 / trang</option>
            </select>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center gap-1.5 justify-center flex-wrap">
          <!-- Previous Page Button -->
          <button type="button" id="btn-user-orders-prev" 
            class="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition ${currentPage <= 1 ? 'border-slate-800/60 text-slate-600 cursor-not-allowed opacity-40' : 'border-slate-700/80 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer active:scale-95'}"
            ${currentPage <= 1 ? 'disabled' : ''} title="Trang trước">
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
            <span class="hidden sm:inline">Trang trước</span>
          </button>

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            ${pageButtonsHtml}
          </div>

          <!-- Next Page Button -->
          <button type="button" id="btn-user-orders-next" 
            class="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition ${currentPage >= totalPages ? 'border-slate-800/60 text-slate-600 cursor-not-allowed opacity-40' : 'border-slate-700/80 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer active:scale-95'}"
            ${currentPage >= totalPages ? 'disabled' : ''} title="Trang sau">
            <span class="hidden sm:inline">Trang sau</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    `;

    // Gắn sự kiện cho các điều khiển phân trang
    document.getElementById('btn-user-orders-prev')?.addEventListener('click', () => {
      this.goToOrdersPage(this.ordersCurrentPage - 1);
    });

    document.getElementById('btn-user-orders-next')?.addEventListener('click', () => {
      this.goToOrdersPage(this.ordersCurrentPage + 1);
    });

    container.querySelectorAll('.btn-user-orders-page').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageNum = parseInt(btn.getAttribute('data-page'), 10);
        if (pageNum) this.goToOrdersPage(pageNum);
      });
    });

    document.getElementById('select-user-orders-page-size')?.addEventListener('change', (e) => {
      const newSize = parseInt(e.target.value, 10);
      if (newSize && newSize > 0) {
        this.ordersPageSize = newSize;
        this.ordersCurrentPage = 1;
        this.renderUserSubscriptionOrdersTable();
      }
    });

    // Đồng bộ hóa tự động các thẻ gói cước và ghi chú trong bảng
    if (typeof window.autoSyncHistoryTable === 'function') {
      window.autoSyncHistoryTable();
    } else if (typeof window.autoSyncHistoryTableBadges === 'function') {
      window.autoSyncHistoryTableBadges();
    }
  }

  // Realtime search filtering for VIP subscription orders history table
  filterUserSubscriptionOrders(query = '') {
    this.ordersSearchQuery = (query || '').trim();
    this.ordersCurrentPage = 1;
    this.renderUserSubscriptionOrdersTable();
  }

  // Dynamic mapping helper for order note descriptions
  getOrderNoteDescription(planOrRowData, amount = null) {
    if (typeof getOrderNoteDescription === 'function') {
      return getOrderNoteDescription(planOrRowData, amount);
    }
    if (typeof window.getOrderNoteDescription === 'function') {
      return window.getOrderNoteDescription(planOrRowData, amount);
    }
    return 'Kích hoạt gói FinTrack Free (Vĩnh viễn)';
  }

  // Dynamic mapping helper for plan badges (automatically binds theme, badge classes, styles & icons)
  renderPlanBadge(planInput) {
    return getSubscriptionPlanBadgeHtml(planInput);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

