import { api } from '../api.js';
import { formatVND, formatDateVN, formatDateTimeVN } from '../utils/formatters.js';

// Fallback plans data in case of network latency
const FALLBACK_PLANS = [
  {
    id: "FREE",
    name: "FinTrack Free",
    tagline: "Dành cho người mới bắt đầu quản lý tài chính",
    price: 0,
    billing_cycle: "Miễn phí vĩnh viễn",
    ai_limits: 10,
    ai_limits_text: "10 lượt gọi AI / ngày (10 AI calls/day)",
    badge: "FREE",
    badge_color: "bg-slate-800 text-slate-400 border-slate-700",
    highlight: false,
    features: [
      "10 lượt gọi AI bóc tách & cố vấn / ngày",
      "Quản lý tối đa 2 ví tài chính",
      "Theo dõi thu - chi & danh mục chuẩn",
      "Cảnh báo hạn mức ngân sách cơ bản",
      "Xem biểu đồ tổng quan 30 ngày"
    ]
  },
  {
    id: "PRO",
    name: "FinTrack Pro",
    tagline: "Tối ưu cho người đi làm & quản lý tài chính chủ động",
    price: 49000,
    billing_cycle: "49.000 ₫ / tháng (hoặc 490k/năm)",
    ai_limits: 100,
    ai_limits_text: "100 lượt gọi AI / ngày (100 AI calls/day)",
    badge: "⭐ BEST SELLER",
    badge_color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    highlight: true,
    features: [
      "100 lượt gọi AI bóc tách & cố vấn / ngày",
      "Không giới hạn số lượng ví & tài khoản",
      "AI Cố vấn tài chính 50/30/20 chuyên sâu",
      "Không giới hạn hạn mức ngân sách",
      "Xuất báo cáo Excel (.xlsx) & PDF chi tiết",
      "Huy hiệu tài chính Pro độc quyền"
    ]
  },
  {
    id: "PREMIUM",
    name: "VIP Premium Unlimited",
    tagline: "Trải nghiệm đỉnh cao không giới hạn cho gia đình & nhà đầu tư",
    price: 99000,
    billing_cycle: "99.000 ₫ / tháng (hoặc 990k/năm)",
    ai_limits: 999999,
    ai_limits_text: "Không giới hạn (VIP Unlimited AI)",
    badge: "👑 VIP UNLIMITED",
    badge_color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    highlight: false,
    features: [
      "KHÔNG GIỚI HẠN lượt gọi AI (VIP Unlimited)",
      "Ưu tiên xử lý AI Engine tốc độ cao (Fast Response)",
      "Full tính năng bóc tách & Trợ lý 24/7",
      "Dự phóng dòng tiền & cảnh báo lạm phát",
      "Sao lưu dữ liệu tự động & xuất snapshot",
      "Huy hiệu VIP Hoàng Gia & Hỗ trợ kỹ thuật 24/7"
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
    api.upgradePlan = function(plan, walletId = null, durationMonths = 1) {
      const payload = { plan, duration_months: durationMonths };
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
    const planTier = user.plan_tier || (currentPlan === 'PREMIUM' ? 'VIP Premium' : currentPlan === 'PRO' ? 'Pro' : 'Free');
    const daysRemaining = user.days_remaining;
    const planActivatedAt = user.plan_activated_at;
    const planExpiresAt = user.plan_expires_at;
    const isPaid = currentPlan === 'PRO' || currentPlan === 'PREMIUM';
    const isExpiringSoon = isPaid && (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 5);

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
      daily_limit: 10,
      remaining_today: 10,
      is_unlimited: false,
      percentage: 0
    };

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-7 animate-in fade-in duration-300">
        
        <!-- Header Banner -->
        <div class="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1e1508]">
          <!-- Glow orbs -->
          <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>
          <div class="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 flex-shrink-0 animate-bounce">
                <i class="fa-solid fa-crown"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                    Gói Dịch Vụ & Thời Hạn <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-400">FinTrack VIP</span>
                  </h1>
                </div>
                <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Mở rộng lượt gọi AI bóc tách tự nhiên, kích hoạt Cố vấn tài chính 50/30/20 thông minh và theo dõi hạn dùng gói cước chi tiết theo thời gian thực.
                </p>
              </div>
            </div>

            <!-- Current Plan Badge Widget -->
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center flex-shrink-0 min-w-[200px]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gói Tài Khoản Hiện Tại</span>
              <span class="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentPlan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20' : currentPlan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                ${currentPlan === 'PREMIUM' ? '👑 VIP PREMIUM' : currentPlan === 'PRO' ? '⭐ FINTRACK PRO' : '🌱 FREE PLAN'}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. DARK CYBER CARD: TRẠNG THÁI GÓI ĐANG SỬ DỤNG (Thời hạn & Tiến độ) -->
        <div class="glass-card p-6 rounded-3xl border ${isExpiringSoon ? 'border-rose-500/60 shadow-xl shadow-rose-500/20' : currentPlan === 'PREMIUM' ? 'border-amber-500/50 shadow-xl shadow-amber-500/15' : currentPlan === 'PRO' ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/15' : 'border-slate-800'} relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950">
          
          <!-- Background Cyber Glow -->
          <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full ${isExpiringSoon ? 'bg-rose-500/10' : currentPlan === 'PREMIUM' ? 'bg-amber-500/10' : currentPlan === 'PRO' ? 'bg-indigo-500/10' : 'bg-emerald-500/5'} blur-3xl pointer-events-none"></div>

          <div class="relative z-10 space-y-5">
            
            <!-- Top Row: Icon, Tier Title, and Status Badges -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl ${currentPlan === 'PREMIUM' ? 'gradient-amber text-slate-950 shadow-lg shadow-amber-500/30' : currentPlan === 'PRO' ? 'gradient-indigo text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-emerald-400 border border-slate-700'} flex items-center justify-center text-2xl flex-shrink-0">
                  <i class="fa-solid ${currentPlan === 'PREMIUM' ? 'fa-crown' : currentPlan === 'PRO' ? 'fa-gem' : 'fa-seedling'}"></i>
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base sm:text-lg font-black text-slate-100">
                      ${currentPlan === 'PREMIUM' ? '👑 VIP Premium Unlimited' : currentPlan === 'PRO' ? '⭐ FinTrack Pro Edition' : '🌱 Gói Miễn Phí (FinTrack Free)'}
                    </h3>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isExpiringSoon ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : currentPlan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : currentPlan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                      ${isExpiringSoon ? '⚠️ Sắp hết hạn' : isPaid ? 'Đang kích hoạt' : 'Vĩnh viễn'}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">
                    ${currentPlan === 'PREMIUM' ? 'Toàn quyền sử dụng AI không giới hạn & Cố vấn tài chính chuyên sâu 24/7' : currentPlan === 'PRO' ? '100 lượt gọi AI/ngày, quản lý không giới hạn ví & xuất báo cáo chuyên sâu' : 'Gói khởi đầu cơ bản &bull; Giới hạn 10 lượt gọi AI/ngày'}
                  </p>
                </div>
              </div>

              <!-- Action Button -->
              <div class="flex items-center gap-2.5 self-start sm:self-auto">
                ${isPaid ? `
                  <button type="button" onclick="window.fintrackSubscription.openUpgradeModal('${currentPlan}')" class="px-4 py-2 rounded-xl ${isExpiringSoon ? 'gradient-rose text-white shadow-rose-500/30 animate-pulse' : currentPlan === 'PREMIUM' ? 'gradient-amber text-slate-950 shadow-amber-500/20' : 'gradient-indigo text-white shadow-indigo-500/20'} text-xs font-black shadow-md hover:scale-105 active:scale-95 transition flex items-center gap-1.5">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span>${isExpiringSoon ? 'Gia Hạn Ngay' : 'Gia Hạn Thêm'}</span>
                  </button>
                ` : `
                  <button type="button" onclick="window.fintrackSubscription.openUpgradeModal('PREMIUM')" class="px-4 py-2 rounded-xl gradient-amber text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 hover:scale-105 active:scale-95 transition flex items-center gap-1.5">
                    <i class="fa-solid fa-crown"></i>
                    <span>Nâng Cấp VIP Ngay</span>
                  </button>
                `}
              </div>
            </div>

            <!-- Date Details & Progress Bar -->
            ${isPaid ? `
              <!-- Time Dates Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30 flex-shrink-0">
                    <i class="fa-solid fa-calendar-plus"></i>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ngày Kích Hoạt</span>
                    <span class="text-xs font-mono font-bold text-slate-200">${planActivatedAt ? formatDateTimeVN(planActivatedAt) : '---'}</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${isExpiringSoon ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800'} flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl ${isExpiringSoon ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'} flex items-center justify-center text-sm flex-shrink-0">
                    <i class="fa-solid fa-calendar-check"></i>
                  </div>
                  <div>
                    <span class="text-[10px] ${isExpiringSoon ? 'text-rose-400 font-bold' : 'text-slate-400 font-bold'} uppercase tracking-wider block">Ngày Hết Hạn</span>
                    <span class="text-xs font-mono font-bold ${isExpiringSoon ? 'text-rose-300' : 'text-slate-200'}">${planExpiresAt ? formatDateTimeVN(planExpiresAt) : '---'}</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${isExpiringSoon ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800'} flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl ${isExpiringSoon ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'} flex items-center justify-center text-sm flex-shrink-0">
                    <i class="fa-solid fa-hourglass-half"></i>
                  </div>
                  <div>
                    <span class="text-[10px] ${isExpiringSoon ? 'text-rose-400 font-bold' : 'text-slate-400 font-bold'} uppercase tracking-wider block">Thời Gian Còn Lại</span>
                    <span class="text-xs font-mono font-black ${isExpiringSoon ? 'text-rose-400' : 'text-emerald-400'}">
                      ${daysRemaining !== null && daysRemaining !== undefined ? (daysRemaining > 0 ? `${daysRemaining} ngày` : 'Đã hết hạn') : 'Đang hoạt động'}
                    </span>
                  </div>
                </div>

              </div>

              <!-- Time Progress Bar -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-[11px] font-mono">
                  <span class="text-slate-400 flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-simple text-[10px]"></i> Tiến độ chu kỳ gói:
                  </span>
                  <span class="font-bold ${isExpiringSoon ? 'text-rose-400' : 'text-slate-200'}">
                    Đã dùng: <b>${elapsedPercent}%</b> &bull; Còn lại: <b>${daysRemaining || 0} ngày</b>
                  </span>
                </div>
                <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative p-0.5">
                  <div class="h-full rounded-full transition-all duration-700 ${isExpiringSoon ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse' : currentPlan === 'PREMIUM' ? 'gradient-amber' : 'gradient-indigo'}" 
                    style="width: ${Math.min(100, Math.max(4, elapsedPercent))}%;"></div>
                </div>
              </div>

              ${isExpiringSoon ? `
                <!-- Warning Alert Banner for Expiring Soon -->
                <div class="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div class="flex items-center gap-2.5 text-xs">
                    <i class="fa-solid fa-triangle-exclamation text-rose-400 text-base flex-shrink-0 animate-bounce"></i>
                    <div>
                      <span class="font-extrabold text-rose-300 block">Cảnh Báo: Gói Dịch Vụ Sắp Hết Hạn!</span>
                      <span class="text-[11px] text-rose-200/80">Tài khoản chỉ còn <b>${daysRemaining} ngày</b>. Hãy gia hạn ngay để không bị ngắt kết nối AI & Cố vấn 50/30/20.</span>
                    </div>
                  </div>
                  <button type="button" onclick="window.fintrackSubscription.openUpgradeModal('${currentPlan}')" class="px-3.5 py-1.5 rounded-xl gradient-rose text-white text-xs font-bold shadow-md shadow-rose-500/30 hover:scale-105 active:scale-95 transition flex-shrink-0">
                    Gia Hạn Ngay ➔
                  </button>
                </div>
              ` : ''}
            ` : `
              <!-- Free Plan Information Box -->
              <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/30 flex-shrink-0">
                    <i class="fa-solid fa-infinity"></i>
                  </div>
                  <div>
                    <h4 class="font-extrabold text-slate-200">Gói Miễn Phí (Vĩnh Viễn)</h4>
                    <p class="text-[11px] text-slate-400">Không giới hạn thời hạn sử dụng. Nâng cấp lên gói VIP bất cứ lúc nào để mở rộng hạn mức.</p>
                  </div>
                </div>
                <button type="button" onclick="window.fintrackSubscription.openUpgradeModal('PREMIUM')" class="px-4 py-2 rounded-xl gradient-amber text-slate-950 font-black shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition flex-shrink-0 flex items-center gap-1.5">
                  <i class="fa-solid fa-crown text-xs"></i>
                  <span>Nâng Cấp VIP Ngay</span>
                </button>
              </div>
            `}

          </div>
        </div>

        <!-- 2. Live AI Daily Usage Quota Card -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div>
                <h3 class="text-xs font-extrabold text-slate-100 uppercase tracking-wider">Hạn Mức Sử Dụng AI Hôm Nay (Realtime 24h)</h3>
                <p class="text-[11px] text-slate-400">Tự động làm mới vào 00:00 mỗi ngày</p>
              </div>
            </div>
            
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-200">
                Đã dùng: <b class="text-indigo-400">${q.used_today}</b> / ${q.is_unlimited ? '∞ Không giới hạn' : `<b class="text-slate-100">${q.daily_limit}</b> lượt`}
              </span>
              <span class="text-[10px] text-emerald-400 block font-mono">
                ${q.is_unlimited ? '⚡ VIP Unlimited' : `Còn lại: ${q.remaining_today} lượt`}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5">
            <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
              <div class="h-full rounded-full transition-all duration-500 ${q.is_unlimited ? 'w-full bg-gradient-to-r from-amber-500 to-yellow-400' : q.percentage > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}" 
                style="width: ${q.is_unlimited ? 100 : Math.min(100, Math.max(5, q.percentage))}%;"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 lượt</span>
              <span>${q.is_unlimited ? 'VIP Không giới hạn' : `${q.percentage}% đã sử dụng`}</span>
              <span>${q.is_unlimited ? 'VIP ∞' : `${q.daily_limit} lượt/ngày`}</span>
            </div>
          </div>
        </div>

        <!-- 3. Pricing Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          ${this.plans.map(plan => {
            const isCurrent = plan.id === currentPlan;
            const isPro = plan.id === 'PRO';
            const isPremium = plan.id === 'PREMIUM';

            let cardBorder = 'border-slate-800';
            let cardBg = 'bg-slate-900/60';
            let btnClass = 'bg-slate-800 hover:bg-slate-700 text-slate-200';
            let btnText = isCurrent ? '✓ Đang Sử Dụng' : 'Chọn Gói Này';

            if (isPro) {
              cardBorder = isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-indigo-500/40 hover:border-indigo-500/80';
              cardBg = 'bg-gradient-to-b from-indigo-950/30 via-slate-900/80 to-slate-900/60';
              btnClass = isCurrent ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 hover:bg-indigo-600/60' : 'gradient-indigo text-white font-black shadow-lg shadow-indigo-500/30 hover:scale-[1.02]';
              btnText = isCurrent ? '⚡ Gia Hạn Thêm' : '⚡ Nâng Cấp Lên PRO';
            } else if (isPremium) {
              cardBorder = isCurrent ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-amber-500/40 hover:border-amber-500/80';
              cardBg = 'bg-gradient-to-b from-amber-950/30 via-slate-900/80 to-slate-900/60';
              btnClass = isCurrent ? 'bg-amber-600/40 text-amber-200 border border-amber-500/50 hover:bg-amber-600/60' : 'gradient-amber text-slate-950 font-black shadow-lg shadow-amber-500/30 hover:scale-[1.02]';
              btnText = isCurrent ? '👑 Gia Hạn Thêm' : '👑 Kích Hoạt VIP Ngay';
            } else {
              // FREE
              if (isCurrent) {
                btnClass = 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-default';
                btnText = '✓ Đang Sử Dụng Gói Free';
              } else {
                btnClass = 'bg-slate-800 hover:bg-slate-700 text-slate-300';
                btnText = 'Chuyển Về Gói Free';
              }
            }

            return `
              <div class="glass-card p-6 rounded-3xl flex flex-col justify-between relative border ${cardBorder} ${cardBg} transition-all duration-300 hover:shadow-2xl">
                
                ${plan.highlight ? `
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    ⭐ PHỔ BIẾN NHẤT
                  </div>
                ` : isPremium ? `
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    👑 VIP UNLIMITED
                  </div>
                ` : ''}

                <div>
                  <!-- Plan Title & Badge -->
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-base font-black text-slate-100">${plan.name}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${plan.badge_color}">
                      ${plan.badge}
                    </span>
                  </div>

                  <p class="text-xs text-slate-400 min-h-[34px] mb-4">${plan.tagline}</p>

                  <!-- Price -->
                  <div class="py-3 mb-4 border-y border-slate-800/80">
                    <div class="flex items-baseline gap-1">
                      <span class="text-3xl font-black font-mono ${isPremium ? 'text-amber-400' : isPro ? 'text-indigo-400' : 'text-slate-100'}">
                        ${plan.price === 0 ? '0 ₫' : formatVND(plan.price)}
                      </span>
                      <span class="text-xs text-slate-400 font-medium">/ tháng</span>
                    </div>
                    <span class="text-[10px] text-slate-500 font-mono block mt-1">${plan.billing_cycle}</span>
                  </div>

                  <!-- AI Quota Highlight Box -->
                  <div class="p-3 rounded-2xl ${isPremium ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300' : isPro ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border border-slate-800 text-slate-300'} mb-5 text-xs font-bold flex items-center gap-2.5">
                    <i class="fa-solid fa-wand-magic-sparkles text-sm ${isPremium ? 'text-amber-400' : isPro ? 'text-indigo-400' : 'text-slate-400'}"></i>
                    <span>${plan.ai_limits_text}</span>
                  </div>

                  <!-- Features List -->
                  <div class="space-y-2.5 text-xs mb-6">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quyền Lợi Bao Gồm:</span>
                    ${plan.features.map(f => `
                      <div class="flex items-start gap-2 text-slate-300">
                        <i class="fa-solid fa-circle-check text-emerald-400 text-xs mt-0.5 flex-shrink-0"></i>
                        <span class="leading-tight">${f}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Action Button -->
                <button type="button" 
                  class="w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${btnClass}"
                  ${isCurrent && plan.id === 'FREE' ? 'disabled' : ''}
                  onclick="window.fintrackSubscription.openUpgradeModal('${plan.id}')">
                  <span>${btnText}</span>
                  ${!(isCurrent && plan.id === 'FREE') ? '<i class="fa-solid fa-arrow-right text-[10px]"></i>' : ''}
                </button>

              </div>
            `;
          }).join('')}

        </div>

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
              <span class="font-bold text-slate-200 block">Hỗ Trợ Ưu Tiên 24/7</span>
              <span class="text-[10px] text-slate-400">Đội ngũ kỹ thuật hỗ trợ xuyên suốt</span>
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

  // Open Upgrade / Payment Confirmation Modal with Duration Selection & Live Wallet Deduction
  async openUpgradeModal(planId) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const plan = this.plans.find(p => p.id === planId) || {
      id: planId,
      name: planId === 'PREMIUM' ? 'VIP Premium Unlimited' : planId === 'PRO' ? 'FinTrack Pro' : 'FinTrack Free',
      price: planId === 'PREMIUM' ? 99000 : planId === 'PRO' ? 49000 : 0,
      ai_limits_text: planId === 'PREMIUM' ? 'Không giới hạn (VIP Unlimited)' : planId === 'PRO' ? '100 lượt gọi AI / ngày' : '10 lượt gọi AI / ngày'
    };

    const isFree = plan.id === 'FREE';
    let selectedMonths = 1;

    // Pricing mapping based on duration
    const getDurationPricing = (months) => {
      if (isFree) return { price: 0, days: 0, note: 'Vĩnh viễn' };
      if (planId === 'PREMIUM') {
        if (months === 12) return { price: 990000, days: 365, note: 'Tiết kiệm 17% (Tặng 2 tháng)' };
        if (months === 3) return { price: 279000, days: 90, note: 'Tiết kiệm 5%' };
        return { price: 99000, days: 30, note: 'Chu kỳ 1 tháng' };
      } else {
        // PRO
        if (months === 12) return { price: 490000, days: 365, note: 'Tiết kiệm 17% (Tặng 2 tháng)' };
        if (months === 3) return { price: 139000, days: 90, note: 'Tiết kiệm 5%' };
        return { price: 49000, days: 30, note: 'Chu kỳ 1 tháng' };
      }
    };

    let wallets = [];
    try {
      wallets = await api.getWallets();
    } catch (e) {
      wallets = [];
    }

    const realWallets = wallets.filter(w => w.wallet_scope === 'real');
    const paymentWallets = realWallets.length > 0 ? realWallets : wallets;
    const userId = this.app.currentUser?.id || 1;
    const memoDigits = Math.floor(100000 + Math.random() * 900000);
    const transferMemo = `FT${planId} ${userId} ${memoDigits}`;

    let selectedPaymentMethod = 'VIETQR'; // 'VIETQR', 'WALLET', or 'DIRECT_DEBIT'

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border ${planId === 'PREMIUM' ? 'border-amber-500/40' : planId === 'PRO' ? 'border-indigo-500/40' : 'border-slate-800'} animate-in fade-in zoom-in duration-200">
          
          <button id="sub-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3.5 mb-5 pb-3 border-b border-slate-800">
            <div class="w-12 h-12 rounded-2xl ${planId === 'PREMIUM' ? 'gradient-amber text-slate-950' : planId === 'PRO' ? 'gradient-indigo text-white' : 'bg-slate-800 text-slate-300'} flex items-center justify-center text-xl shadow-lg flex-shrink-0">
              <i class="fa-solid ${planId === 'PREMIUM' ? 'fa-crown' : planId === 'PRO' ? 'fa-bolt' : 'fa-seedling'}"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100">${isFree ? 'Chuyển Sang Gói Free' : `Kích Hoạt / Gia Hạn ${plan.name}`}</h3>
              <p class="text-xs text-slate-400">Tự động tính ngày hết hạn & Phương thức thanh toán tức thời</p>
            </div>
          </div>

          ${!isFree ? `
            <!-- Duration Selection Pills -->
            <div class="mb-4">
              <label class="block font-bold text-slate-300 text-xs mb-2">Chọn Thời Hạn Đăng Ký / Gia Hạn:</label>
              <div class="grid grid-cols-3 gap-2" id="duration-selector-group">
                <button type="button" class="duration-pill px-3 py-2 rounded-xl text-xs font-bold transition border border-amber-500 bg-amber-500/20 text-amber-300" data-months="1">
                  <div>1 Tháng</div>
                  <span class="text-[9px] font-mono opacity-80">30 ngày</span>
                </button>
                <button type="button" class="duration-pill px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600" data-months="3">
                  <div>3 Tháng</div>
                  <span class="text-[9px] font-mono text-emerald-400">-5% off</span>
                </button>
                <button type="button" class="duration-pill px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600" data-months="12">
                  <div>1 Năm (12T)</div>
                  <span class="text-[9px] font-mono text-amber-300">Tặng 2 tháng</span>
                </button>
              </div>
            </div>

            <!-- Payment Method Tabs (3 Options) -->
            <div class="mb-4">
              <label class="block font-bold text-slate-300 text-xs mb-2">Chọn Phương Thức Thanh Toán:</label>
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-[11px]">
                <button type="button" id="paymethod-tab-vietqr" class="paymethod-btn py-2 px-2 rounded-xl font-black transition gradient-amber text-slate-950 shadow-md flex items-center justify-center gap-1" data-method="VIETQR">
                  <i class="fa-solid fa-qrcode"></i>
                  <span>VietQR CK</span>
                </button>
                <button type="button" id="paymethod-tab-wallet" class="paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1" data-method="WALLET">
                  <i class="fa-solid fa-wallet"></i>
                  <span>Ví Tiền Thật</span>
                </button>
                <button type="button" id="paymethod-tab-debit" class="paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1" data-method="DIRECT_DEBIT">
                  <i class="fa-solid fa-bolt text-cyan-400"></i>
                  <span>Auto-Debit</span>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Summary Box -->
          <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2.5 mb-4">
            <div class="flex justify-between">
              <span class="text-slate-400">Gói Dịch Vụ:</span>
              <span class="font-bold text-slate-100">${plan.name}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Hạn Mức AI Kích Hoạt:</span>
              <span class="font-mono font-bold ${planId === 'PREMIUM' ? 'text-amber-400' : 'text-indigo-400'}">${plan.ai_limits_text}</span>
            </div>
            ${!isFree ? `
              <div class="flex justify-between">
                <span class="text-slate-400">Thời hạn dự kiến sau kích hoạt:</span>
                <span class="font-mono font-bold text-emerald-400" id="sub-projected-expiry">...</span>
              </div>
            ` : ''}
            <div class="flex justify-between border-t border-slate-800 pt-2 text-sm">
              <span class="font-bold text-slate-200">Số Tiền Cần Thanh Toán:</span>
              <span class="font-mono font-black ${planId === 'PREMIUM' ? 'text-amber-400' : planId === 'PRO' ? 'text-indigo-400' : 'text-emerald-400'}" id="sub-total-price">
                ${isFree ? '0 ₫ (Miễn Phí)' : formatVND(plan.price)}
              </span>
            </div>
          </div>

          ${!isFree ? `
            <!-- Option 1: VietQR MB Bank Payment Container -->
            <div id="container-pay-vietqr" class="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-purple-950/30 border border-amber-500/30 text-xs mb-5 space-y-3">
              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="p-2 bg-white rounded-2xl shadow-xl flex-shrink-0">
                  <img id="sub-vietqr-img" src="https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${plan.price}&addInfo=${encodeURIComponent(transferMemo)}&accountName=DANG%20QUYET%20THANG" 
                       alt="VietQR Chuyển Khoản" 
                       class="w-32 h-32 object-contain rounded-lg"
                       onerror="this.src='/TKnganhangMB.jpg'" />
                </div>
                <div class="space-y-1.5 flex-1 font-mono text-[11px] w-full">
                  <div class="flex justify-between border-b border-slate-800/80 pb-1">
                    <span class="text-slate-400 font-sans">Ngân hàng:</span>
                    <span class="font-bold text-slate-100">MB Bank (Quân Đội)</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800/80 pb-1">
                    <span class="text-slate-400 font-sans">Số tài khoản:</span>
                    <span class="font-bold text-emerald-400 select-all">0987654321</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800/80 pb-1">
                    <span class="text-slate-400 font-sans">Chủ tài khoản:</span>
                    <span class="font-bold text-slate-100">DANG QUYET THANG</span>
                  </div>
                  <div class="flex justify-between pt-0.5">
                    <span class="text-slate-400 font-sans">Nội dung CK:</span>
                    <span class="font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 select-all" id="sub-vietqr-memo">${transferMemo}</span>
                  </div>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 text-center font-sans">
                💡 Sau khi chuyển khoản thành công, nhấn <b>"Tôi Đã Chuyển Khoản"</b> để hệ thống ghi nhận đơn và kích hoạt tự động.
              </p>
            </div>

            <!-- Option 2: FinTrack Real Payment Wallet Container -->
            <div id="container-pay-wallet" class="hidden p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs mb-5 space-y-3">
              <div>
                <label class="block font-bold text-slate-300 mb-1.5">Ví Tiền Thật Thanh Toán Gói:</label>
                ${paymentWallets.length > 0 ? `
                  <select id="sub-wallet-select" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 font-bold focus:ring-2 focus:ring-amber-500">
                    ${paymentWallets.map(w => `
                      <option value="${w.id}" data-balance="${w.balance}">
                        ${w.name} &bull; Số dư tiền thật: ${formatVND(w.balance)}
                      </option>
                    `).join('')}
                  </select>
                ` : `
                  <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                    ⚠️ Bạn chưa có ví tiền thật trong hệ thống. Vui lòng nạp tiền vào Ví Tiền Thật trước khi đăng ký gói!
                  </div>
                `}
              </div>

              <div id="sub-wallet-calc" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] flex items-center justify-between font-mono">
                <span class="text-slate-400">Số dư tiền thật còn lại sau thanh toán:</span>
                <span id="sub-wallet-rem-balance" class="font-bold text-emerald-400">...</span>
              </div>
            </div>

            <!-- Option 3: 1-Click Direct Debit via Open Banking Container -->
            <div id="container-pay-debit" class="hidden p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900/80 border border-cyan-500/40 text-xs mb-5 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg gradient-cyan text-slate-950 flex items-center justify-center text-xs font-bold">
                    <i class="fa-solid fa-bolt"></i>
                  </span>
                  <div>
                    <span class="font-bold text-slate-100 block">Thanh Toán 1-Click Direct Debit</span>
                    <span class="text-[10px] text-cyan-300">Không cần quét QR hay mở app ngân hàng</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase">Open Banking</span>
              </div>

              ${wallets.some(w => w.is_linked) ? `
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Tài Khoản Ngân Hàng Đã Cấp Quyền:</label>
                  <select id="sub-debit-bank-select" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-bold font-mono focus:ring-2 focus:ring-cyan-400">
                    ${wallets.filter(w => w.is_linked).map(w => `
                      <option value="${w.id}">
                        ${w.name} &bull; ${w.account_number_masked || 'Đã liên kết'} (Auto-Debit Ready)
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : `
                <div class="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2">
                  <p class="text-slate-300 text-[11px] leading-relaxed">
                    <i class="fa-solid fa-circle-info text-cyan-400 mr-1"></i>
                    Bạn có thể thanh toán trực tiếp qua cổng Open Banking tức thời hoặc liên kết tài khoản ngân hàng để kích hoạt 1-Click Auto Debit.
                  </p>
                  <div class="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                    <i class="fa-solid fa-shield-check"></i> Xác thực sinh trắc học an toàn & Bảo mật 256-bit
                  </div>
                </div>
              `}
            </div>
          ` : ''}

          <div class="flex items-center gap-3">
            <button type="button" id="sub-modal-cancel" class="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
              Hủy Bỏ
            </button>
            <button type="button" id="sub-modal-confirm" class="w-2/3 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${planId === 'PREMIUM' ? 'gradient-amber text-slate-950 shadow-amber-500/25' : planId === 'PRO' ? 'gradient-indigo text-white shadow-indigo-500/25' : 'gradient-emerald text-white shadow-emerald-500/25'}">
              <i class="fa-solid fa-check"></i>
              <span id="sub-confirm-btn-text">${isFree ? 'Xác Nhận Đổi Sang Free' : `🚀 Tôi Đã Chuyển Khoản`}</span>
            </button>
          </div>

        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('sub-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('sub-modal-cancel')?.addEventListener('click', closeModal);

    const walletSelect = document.getElementById('sub-wallet-select');
    const debitBankSelect = document.getElementById('sub-debit-bank-select');
    const remBalanceEl = document.getElementById('sub-wallet-rem-balance');
    const totalPriceEl = document.getElementById('sub-total-price');
    const projectedExpiryEl = document.getElementById('sub-projected-expiry');
    const confirmBtn = document.getElementById('sub-modal-confirm');
    const confirmBtnText = document.getElementById('sub-confirm-btn-text');

    const containerVietQR = document.getElementById('container-pay-vietqr');
    const containerWallet = document.getElementById('container-pay-wallet');
    const containerDebit = document.getElementById('container-pay-debit');
    const tabVietQR = document.getElementById('paymethod-tab-vietqr');
    const tabWallet = document.getElementById('paymethod-tab-wallet');
    const tabDebit = document.getElementById('paymethod-tab-debit');
    const qrImg = document.getElementById('sub-vietqr-img');

    // Switch payment methods
    tabVietQR?.addEventListener('click', () => {
      selectedPaymentMethod = 'VIETQR';
      tabVietQR.className = 'paymethod-btn py-2 px-2 rounded-xl font-black transition gradient-amber text-slate-950 shadow-md flex items-center justify-center gap-1';
      tabWallet.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      tabDebit.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      containerVietQR?.classList.remove('hidden');
      containerWallet?.classList.add('hidden');
      containerDebit?.classList.add('hidden');
      updateCalculations();
    });

    tabWallet?.addEventListener('click', () => {
      selectedPaymentMethod = 'WALLET';
      tabWallet.className = 'paymethod-btn py-2 px-2 rounded-xl font-black transition gradient-emerald text-white shadow-md flex items-center justify-center gap-1';
      tabVietQR.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      tabDebit.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      containerWallet?.classList.remove('hidden');
      containerVietQR?.classList.add('hidden');
      containerDebit?.classList.add('hidden');
      updateCalculations();
    });

    tabDebit?.addEventListener('click', () => {
      selectedPaymentMethod = 'DIRECT_DEBIT';
      tabDebit.className = 'paymethod-btn py-2 px-2 rounded-xl font-black transition gradient-cyan text-slate-950 shadow-md flex items-center justify-center gap-1';
      tabVietQR.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      tabWallet.className = 'paymethod-btn py-2 px-2 rounded-xl font-bold transition text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1';
      containerDebit?.classList.remove('hidden');
      containerVietQR?.classList.add('hidden');
      containerWallet?.classList.add('hidden');
      updateCalculations();
    });

    const updateCalculations = () => {
      const pricing = getDurationPricing(selectedMonths);
      if (totalPriceEl) totalPriceEl.textContent = formatVND(pricing.price);

      // Update VietQR dynamic image URL
      if (qrImg) {
        qrImg.src = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${pricing.price}&addInfo=${encodeURIComponent(transferMemo)}&accountName=DANG%20QUYET%20THANG`;
      }
      
      if (confirmBtnText) {
        if (isFree) {
          confirmBtnText.textContent = 'Xác Nhận Đổi Sang Free';
        } else if (selectedPaymentMethod === 'VIETQR') {
          confirmBtnText.textContent = `🚀 Tôi Đã Chuyển Khoản ${formatVND(pricing.price)}`;
        } else if (selectedPaymentMethod === 'DIRECT_DEBIT') {
          confirmBtnText.textContent = `Thanh Toán ${formatVND(pricing.price)} qua Direct Debit`;
        } else {
          confirmBtnText.textContent = `Thanh Toán ${formatVND(pricing.price)} qua Ví`;
        }
      }

      // Projected Expiry Date
      if (projectedExpiryEl && !isFree) {
        const user = this.app.currentUser || {};
        const now = new Date();
        let baseDate = now;
        if (user.plan_expires_at && (user.plan || '').toUpperCase() === planId) {
          const currentExp = new Date(user.plan_expires_at);
          if (currentExp > now) baseDate = currentExp;
        }
        const newExpiry = new Date(baseDate.getTime() + pricing.days * 24 * 60 * 60 * 1000);
        projectedExpiryEl.textContent = `+${pricing.days} ngày (đến ${formatDateVN(newExpiry)})`;
      }

      if (isFree) return;

      if (selectedPaymentMethod === 'VIETQR' || selectedPaymentMethod === 'DIRECT_DEBIT') {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        return;
      }

      // Wallet method calculation
      if (!walletSelect || !remBalanceEl) return;
      const selectedOption = walletSelect.options[walletSelect.selectedIndex];
      if (!selectedOption) return;

      const balance = parseFloat(selectedOption.getAttribute('data-balance') || '0');
      const rem = balance - pricing.price;

      if (rem >= 0) {
        remBalanceEl.innerHTML = `<span class="text-emerald-400 font-black">${formatVND(rem)}</span>`;
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      } else {
        remBalanceEl.innerHTML = `<span class="text-rose-400 font-black">⚠️ Thiếu ${formatVND(Math.abs(rem))} (Không đủ tiền ví)</span>`;
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      }
    };

    // Duration selector pills click
    modalEl.querySelectorAll('.duration-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMonths = parseInt(btn.getAttribute('data-months') || '1');
        modalEl.querySelectorAll('.duration-pill').forEach(b => {
          if (parseInt(b.getAttribute('data-months')) === selectedMonths) {
            b.className = 'duration-pill px-3 py-2 rounded-xl text-xs font-bold transition border border-amber-500 bg-amber-500/20 text-amber-300';
          } else {
            b.className = 'duration-pill px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600';
          }
        });
        updateCalculations();
      });
    });

    walletSelect?.addEventListener('change', updateCalculations);
    updateCalculations();

    confirmBtn?.addEventListener('click', async () => {
      try {
        const pricing = getDurationPricing(selectedMonths);

        if (selectedPaymentMethod === 'VIETQR') {
          confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo đơn thanh toán...`;
          confirmBtn.disabled = true;

          const res = await api.createSubscriptionOrder({
            plan_code: planId,
            amount: pricing.price,
            plan_duration_days: pricing.days,
            payment_method: 'MB_VIETQR',
            transfer_memo: transferMemo
          });

          closeModal();
          this.showOrderSubmittedModal(res.order || { 
            order_code: `ORD-${memoDigits}`, 
            amount: pricing.price, 
            plan_code: planId, 
            transfer_memo: transferMemo 
          });
          this.loadUserSubscriptionOrders();
          return;
        }

        let targetWalletId = null;
        if (selectedPaymentMethod === 'DIRECT_DEBIT') {
          targetWalletId = debitBankSelect ? debitBankSelect.value : (wallets.find(w => w.is_linked)?.id || null);
        } else {
          targetWalletId = walletSelect ? walletSelect.value : null;
        }

        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý thanh toán & kích hoạt...`;
        confirmBtn.disabled = true;

        const updatedUser = await api.upgradePlan(planId, targetWalletId, selectedMonths, selectedPaymentMethod);
        this.app.currentUser = updatedUser;
        this.app.renderUserProfileHeader();

        closeModal();

        // Celebration Confetti
        if (window.confetti && planId !== 'FREE') {
          window.confetti({
            particleCount: 150,
            spread: 85,
            origin: { y: 0.6 }
          });
        }

        const methodText = selectedPaymentMethod === 'DIRECT_DEBIT' ? 'qua 1-Click Direct Debit (Open Banking)' : 'qua Ví FinTrack';
        const successMsg = isFree
          ? 'Đã chuyển về gói Free thành công!'
          : `Thanh toán thành công ${formatVND(pricing.price)} ${methodText}! Đã kích hoạt gói ${plan.name} (${selectedMonths} tháng) thành công!`;

        this.app.showToast(successMsg, 'success');
        
        // Re-render subscription page & refresh wallet list
        const mainContainer = document.getElementById('main-content-view');
        if (mainContainer) {
          this.render(mainContainer);
        }
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khi thanh toán gói cước', 'error');
        if (confirmBtn) {
          confirmBtn.innerHTML = `<i class="fa-solid fa-check"></i> Xác Nhận Lại`;
          confirmBtn.disabled = false;
        }
      }
    });
  }

  // Display status popup notification when order is created
  showOrderSubmittedModal(order) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-amber-500/40 animate-in fade-in zoom-in duration-200 text-center space-y-4">
          
          <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/10">
            <i class="fa-solid fa-hourglass-half animate-pulse"></i>
          </div>

          <div>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
              ⏳ Đang Chờ Phê Duyệt
            </span>
            <h3 class="text-lg font-black text-slate-100 mt-2">Đơn Hàng #${order.order_code || '---'} Đã Được Tiếp Nhận!</h3>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">
              Đơn thanh toán đang được xử lý và chờ duyệt bởi Quản trị viên. Hệ thống sẽ tự động kích hoạt gói và gửi thông báo ngay khi đối soát thành công.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-left space-y-1.5">
            <div class="flex justify-between">
              <span class="text-slate-400 font-sans">Gói đăng ký:</span>
              <span class="font-bold text-slate-100">${order.plan_code} VIP</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-sans">Số tiền:</span>
              <span class="font-bold text-amber-300">${formatVND(order.amount || 0)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-sans">Nội dung CK:</span>
              <span class="font-bold text-slate-200 select-all">${order.transfer_memo || '---'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-sans">Trạng thái:</span>
              <span class="font-bold text-amber-400">⏳ PENDING (Chờ duyệt)</span>
            </div>
          </div>

          <button type="button" id="btn-close-submitted-modal" class="w-full py-2.5 rounded-xl gradient-amber text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition">
            Đã Hiểu & Theo Dõi Đơn Hàng
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-submitted-modal')?.addEventListener('click', () => {
      modalEl.innerHTML = '';
    });
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
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
                <th class="pb-2.5 font-bold">Mã Đơn</th>
                <th class="pb-2.5 font-bold">Thời Gian</th>
                <th class="pb-2.5 font-bold">Gói Dịch Vụ</th>
                <th class="pb-2.5 font-bold">Số Tiền</th>
                <th class="pb-2.5 font-bold">Phương Thức</th>
                <th class="pb-2.5 font-bold">Trạng Thái</th>
                <th class="pb-2.5 font-bold">Ghi Chú</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
              ${orders.map(o => {
                const isApproved = o.status === 'APPROVED';
                const isPending = o.status === 'PENDING';
                const isRejected = o.status === 'REJECTED';

                return `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 font-bold text-amber-300">#${o.order_code}</td>
                    <td class="py-3 text-slate-400 whitespace-nowrap">${o.created_at || '---'}</td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${o.plan_code === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}">
                        ${o.plan_code} VIP
                      </span>
                    </td>
                    <td class="py-3 font-bold text-slate-100">${formatVND(o.amount || 0)}</td>
                    <td class="py-3 text-slate-400 font-sans">${o.payment_method === 'MB_VIETQR' ? 'VietQR MB Bank' : o.payment_method}</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                        ${isPending ? '⏳ Chờ Quản Trị Duyệt' : isApproved ? '✅ Đã Kích Hoạt' : '❌ Bị Từ Chối'}
                      </span>
                    </td>
                    <td class="py-3 text-slate-400 font-sans text-[10px]">
                      ${isRejected && o.rejection_reason ? `<span class="text-rose-400 font-bold">${o.rejection_reason}</span>` : isApproved && o.approved_by ? `<span class="text-emerald-400 font-bold">Duyệt bởi ${o.approved_by}</span>` : `<span class="text-slate-500">${o.transfer_memo || 'Đang đối soát...'}</span>`}
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
