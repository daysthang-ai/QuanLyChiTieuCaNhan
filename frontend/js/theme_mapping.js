/**
 * ============================================================================
 * FINTRACK PLAN THEME MAPPING & DYNAMIC SYNCHRONIZATION SYSTEM
 * ============================================================================
 * Defines standard colors, badges, icon containers, and borders for all 4 plans:
 * 1. Free: Neutral Slate / Gray professional tone.
 * 2. VIP Pro: Vivid Cyan / Blue characteristic tone.
 * 3. FinTrack VIP: Rich Purple / Indigo tone.
 * 4. Platinum VIP: Exclusive multi-color gradient (amber gold, teal, blue) of "VIP TỐI CAO".
 */

export const PLAN_THEMES = {
  FREE: {
    id: 'FREE',
    name: 'FinTrack Free',
    shortName: 'Free',
    icon: 'fa-seedling',
    iconClass: 'fa-solid fa-seedling',
    tone: 'slate',
    accentColor: '#94a3b8',
    // 1. Header user plan badge (top-right next to avatar)
    headerBadgeClass: 'badge-fintrack-free px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer relative z-20 pointer-events-auto hover:border-slate-500 hover:text-slate-200 transition inline-flex items-center gap-1.5',
    headerBadgeIcon: 'fa-solid fa-seedling text-[10px] text-slate-400',
    headerBadgeTitle: 'Gói FinTrack Free (Vĩnh viễn) - Nhấn để nâng cấp VIP',
    headerBadgeHtml: (days) => `<i class="fa-solid fa-seedling text-[10px] text-slate-400"></i> <span>FinTrack Free</span> <span class="text-[8px] text-slate-400 font-normal lowercase">(vĩnh viễn)</span>`,

    // 2. Current Plan Status Badge ("Đang hoạt động" / "Miễn phí vĩnh viễn")
    statusBadgeClass: 'badge-fintrack-free badge-active-free px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 shadow-sm',
    statusBadgeText: '🌱 MIỄN PHÍ VĨNH VIỄN',
    statusBadgeHtml: (days) => `<span id="current-plan-status-badge" class="badge-fintrack-free badge-active-free px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">🌱 MIỄN PHÍ VĨNH VIỄN</span>`,

    // 3. Icon / Logo Box (Khung vuông bo tròn bên trái thẻ hiện tại)
    iconBoxClass: 'w-14 h-14 rounded-2xl free-icon-box icon-box-fintrack-free bg-slate-800 text-slate-400 border border-slate-700 shadow-lg shadow-slate-950/40 flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300',
    iconBoxIcon: 'fa-solid fa-seedling text-slate-400',

    // 4. Banner Card border & cyber glow
    bannerBorderClass: 'border-slate-800 shadow-xl',
    bannerGlowClass: 'bg-slate-500/10',

    // 5. Current Plan Title Pill in Banner
    titlePillHtml: `<span id="current-plan-title-pill" class="badge-fintrack-free px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1.5"><i class="fa-solid fa-seedling text-[10px] text-slate-400"></i> <span>FinTrack Free</span></span>`,

    // 6. Header Banner Widget Badge (Trang Quản lý gói)
    widgetBadgeClass: 'badge-fintrack-free px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shadow-sm',
    widgetBadgeText: '🌱 FREE',

    // 7. Sidebar Badges
    sidebarBadgeClass: 'badge-fintrack-free shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap',
    sidebarBadgeHtml: '🌱 Free',
    sidebarFooterBorder: 'border-slate-800 shadow-slate-900/20',
    sidebarFooterTitleColor: 'text-slate-400',
    sidebarFooterStatusColor: 'text-slate-400',

    // 8. Progress Bar & Accent
    progressBarClass: 'bg-slate-600',
    accentTextColor: 'text-slate-400'
  },

  PRO: {
    id: 'PRO',
    name: 'VIP Pro',
    shortName: 'VIP Pro',
    icon: 'fa-bolt',
    iconClass: 'fa-solid fa-bolt',
    tone: 'cyan',
    accentColor: '#06b6d4',
    // 1. Header user plan badge (top-right next to avatar)
    headerBadgeClass: 'badge-vip-pro px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer relative z-20 pointer-events-auto hover:scale-105 transition inline-flex items-center gap-1.5',
    headerBadgeIcon: 'fa-solid fa-bolt text-[10px] text-cyan-300',
    headerBadgeTitle: 'Gói FinTrack VIP Pro - Nhấn để quản lý',
    headerBadgeHtml: (days) => {
      const daysText = days !== null && days !== undefined 
        ? (days === 0 ? '<span class="text-rose-400 font-bold">(Hết hạn)</span>' : `<span class="text-cyan-200">(${days > 0 ? `CÒN ${days} NGÀY` : 'HẾT HẠN'})</span>`)
        : '';
      return `<i class="fa-solid fa-bolt text-[10px] text-cyan-300"></i> <span>VIP Pro</span> ${daysText}`;
    },

    // 2. Current Plan Status Badge ("Đang hoạt động")
    statusBadgeClass: 'badge-vip-pro badge-active-pro px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20',
    statusBadgeText: 'ĐANG HOẠT ĐỘNG',
    statusBadgeHtml: (days) => {
      const remaining = days !== null && days !== undefined ? `CÒN ${days} NGÀY` : 'VÔ THỜI HẠN';
      return `<span id="current-plan-status-badge" class="badge-vip-pro badge-active-pro px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">ĐANG HOẠT ĐỘNG – ${remaining}</span>`;
    },

    // 3. Icon / Logo Box (Khung vuông bo tròn bên trái thẻ hiện tại)
    iconBoxClass: 'w-14 h-14 rounded-2xl pro-icon-box icon-box-vip-pro bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-600 text-white shadow-xl shadow-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300',
    iconBoxIcon: 'fa-solid fa-bolt text-cyan-200',

    // 4. Banner Card border & cyber glow
    bannerBorderClass: 'border-cyan-500/50 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-500/20',
    bannerGlowClass: 'bg-cyan-500/20',

    // 5. Current Plan Title Pill in Banner
    titlePillHtml: `<span id="current-plan-title-pill" class="badge-vip-pro px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 inline-flex items-center gap-1.5"><i class="fa-solid fa-bolt text-[10px] text-cyan-300"></i> <span>VIP Pro</span></span>`,

    // 6. Header Banner Widget Badge
    widgetBadgeClass: 'badge-vip-pro px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20',
    widgetBadgeText: '⚡ VIP PRO',

    // 7. Sidebar Badges
    sidebarBadgeClass: 'badge-vip-pro shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap',
    sidebarBadgeHtml: '⚡ VIP Pro',
    sidebarFooterBorder: 'border-cyan-500/40 shadow-cyan-500/10',
    sidebarFooterTitleColor: 'text-cyan-300',
    sidebarFooterStatusColor: 'text-emerald-400',

    // 8. Progress Bar & Accent
    progressBarClass: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500',
    accentTextColor: 'text-cyan-400'
  },

  VIP: {
    id: 'VIP',
    name: 'FinTrack VIP',
    shortName: 'FinTrack VIP',
    icon: 'fa-crown',
    iconClass: 'fa-solid fa-crown',
    tone: 'purple-indigo',
    accentColor: '#a855f7',
    // 1. Header user plan badge (top-right next to avatar)
    headerBadgeClass: 'badge-fintrack-vip px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer relative z-20 pointer-events-auto hover:scale-105 transition inline-flex items-center gap-1.5',
    headerBadgeIcon: 'fa-solid fa-crown text-[10px] text-purple-300',
    headerBadgeTitle: 'Gói FinTrack VIP - Nhấn để quản lý',
    headerBadgeHtml: (days) => {
      const daysText = days !== null && days !== undefined 
        ? (days === 0 ? '<span class="text-rose-400 font-bold">(Hết hạn)</span>' : `<span class="text-purple-200">(${days > 0 ? `CÒN ${days} NGÀY` : 'HẾT HẠN'})</span>`)
        : '';
      return `<i class="fa-solid fa-crown text-[10px] text-purple-300"></i> <span>FinTrack VIP</span> ${daysText}`;
    },

    // 2. Current Plan Status Badge ("Đang hoạt động")
    statusBadgeClass: 'badge-fintrack-vip badge-active-vip px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20',
    statusBadgeText: 'ĐANG HOẠT ĐỘNG',
    statusBadgeHtml: (days) => {
      const remaining = days !== null && days !== undefined ? `CÒN ${days} NGÀY` : 'VÔ THỜI HẠN';
      return `<span id="current-plan-status-badge" class="badge-fintrack-vip badge-active-vip px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">ĐANG HOẠT ĐỘNG – ${remaining}</span>`;
    },

    // 3. Icon / Logo Box (Khung vuông bo tròn bên trái thẻ hiện tại)
    iconBoxClass: 'w-14 h-14 rounded-2xl vip-icon-box icon-box-fintrack-vip bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 border border-purple-400/50 flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300',
    iconBoxIcon: 'fa-solid fa-crown text-purple-200',

    // 4. Banner Card border & cyber glow
    bannerBorderClass: 'border-purple-500/50 shadow-xl shadow-purple-500/15 ring-1 ring-purple-500/20',
    bannerGlowClass: 'bg-purple-500/20',

    // 5. Current Plan Title Pill in Banner
    titlePillHtml: `<span id="current-plan-title-pill" class="badge-fintrack-vip px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20 inline-flex items-center gap-1.5"><i class="fa-solid fa-crown text-[10px] text-purple-300"></i> <span>FinTrack VIP</span></span>`,

    // 6. Header Banner Widget Badge
    widgetBadgeClass: 'badge-fintrack-vip px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/20',
    widgetBadgeText: '👑 FINTRACK VIP',

    // 7. Sidebar Badges
    sidebarBadgeClass: 'badge-fintrack-vip shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap',
    sidebarBadgeHtml: '👑 FinTrack VIP',
    sidebarFooterBorder: 'border-purple-500/40 shadow-purple-500/10',
    sidebarFooterTitleColor: 'text-purple-300',
    sidebarFooterStatusColor: 'text-emerald-400',

    // 8. Progress Bar & Accent
    progressBarClass: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500',
    accentTextColor: 'text-purple-400'
  },

  PLATINUM: {
    id: 'PLATINUM',
    name: 'Platinum VIP',
    shortName: 'Platinum VIP',
    icon: 'fa-crown',
    iconClass: 'fa-solid fa-crown',
    tone: 'platinum-gradient',
    accentColor: '#f59e0b',
    // 1. Header user plan badge (top-right next to avatar)
    headerBadgeClass: 'badge-vip-toi-cao px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/70 shadow-[0_0_15px_rgba(251,191,36,0.5)] cursor-pointer relative z-20 pointer-events-auto hover:scale-105 transition inline-flex items-center gap-1.5',
    headerBadgeIcon: 'fa-solid fa-crown text-[10px] text-slate-950 font-black',
    headerBadgeTitle: 'Gói FinTrack Platinum VIP (VIP Tối Cao) - Nhấn để quản lý',
    headerBadgeHtml: (days) => {
      const daysText = days !== null && days !== undefined 
        ? (days === 0 ? '<span class="text-rose-600 font-bold">(Hết hạn)</span>' : `<span class="text-slate-950 text-[8.5px] font-black font-mono">(${days > 0 ? `CÒN ${days} NGÀY` : 'HẾT HẠN'})</span>`)
        : '<span class="text-slate-950 text-[8.5px] font-black font-mono">(CÒN 52 NGÀY)</span>';
      return `<i class="fa-solid fa-crown text-[10px] text-slate-950"></i> <span>PLATINUM VIP</span> ${daysText}`;
    },

    // 2. Current Plan Status Badge ("Đang hoạt động")
    statusBadgeClass: 'badge-vip-toi-cao badge-active-platinum px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/75 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    statusBadgeText: 'ĐANG HOẠT ĐỘNG',
    statusBadgeHtml: (days) => {
      const remaining = days !== null && days !== undefined ? `CÒN ${days} NGÀY` : 'VÔ THỜI HẠN';
      return `<span id="current-plan-status-badge" class="badge-vip-toi-cao badge-active-platinum px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/75 shadow-[0_0_12px_rgba(251,191,36,0.5)]">ĐANG HOẠT ĐỘNG – ${remaining}</span>`;
    },

    // 3. Icon / Logo Box (Khung vuông bo tròn bên trái thẻ hiện tại)
    iconBoxClass: 'w-14 h-14 rounded-2xl platinum-icon-box badge-vip-toi-cao bg-gradient-to-tr from-amber-400 via-teal-400 to-blue-500 text-slate-950 shadow-xl shadow-amber-500/30 border border-white/75 flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300',
    iconBoxIcon: 'fa-solid fa-crown text-slate-950 font-black',

    // 4. Banner Card border & cyber glow
    bannerBorderClass: 'border-amber-500/50 shadow-2xl shadow-amber-500/20 ring-1 ring-amber-500/30',
    bannerGlowClass: 'bg-amber-500/15',

    // 5. Current Plan Title Pill in Banner
    titlePillHtml: `<span id="current-plan-title-pill" class="badge-vip-toi-cao px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/70 shadow-md inline-flex items-center gap-1.5"><i class="fa-solid fa-crown text-[10px] text-slate-950"></i> <span>Platinum VIP</span></span>`,

    // 6. Header Banner Widget Badge
    widgetBadgeClass: 'badge-vip-toi-cao px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/70 shadow-[0_0_15px_rgba(251,191,36,0.5)]',
    widgetBadgeText: '👑💎 PLATINUM VIP',

    // 7. Sidebar Badges
    sidebarBadgeClass: 'badge-vip-toi-cao shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500 text-slate-950 border border-white/70 shadow-sm whitespace-nowrap',
    sidebarBadgeHtml: '💎 Platinum VIP',
    sidebarFooterBorder: 'border-amber-500/50 shadow-amber-500/20',
    sidebarFooterTitleColor: 'text-amber-300',
    sidebarFooterStatusColor: 'text-amber-300',

    // 8. Progress Bar & Accent
    progressBarClass: 'bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500',
    accentTextColor: 'text-amber-400'
  }
};

/**
 * Normalizes any plan tier string into standard key: 'FREE' | 'PRO' | 'VIP' | 'PLATINUM'
 */
export function normalizePlanTier(rawPlan) {
  if (!rawPlan) return 'FREE';
  const str = String(rawPlan).trim().toUpperCase();
  if (str.includes('PLATINUM')) return 'PLATINUM';
  if (str.includes('PREMIUM') || (str.includes('VIP') && !str.includes('PRO'))) return 'VIP';
  if (str.includes('PRO')) return 'PRO';
  return 'FREE';
}

/**
 * Returns the theme definition object for the given plan.
 */
export function getPlanTheme(rawPlan) {
  const key = normalizePlanTier(rawPlan);
  return PLAN_THEMES[key] || PLAN_THEMES.FREE;
}

/**
 * ============================================================================
 * DYNAMIC SUBSCRIPTION & WALLET TRANSACTION BADGE MAPPING SYSTEM
 * ============================================================================
 * Tách biệt rõ ràng 100% giữa "Nạp Ví Tiền Thật" (giao dịch nạp tiền thông thường)
 * và "Gói Cước VIP" (FinTrack Free, VIP Pro, FinTrack VIP, Platinum VIP).
 * 
 * - Input: Nhận chuỗi tên/mã gói (string) HOẶC toàn bộ đối tượng dòng dữ liệu (row data object).
 * - Output: Trả về object chứa đầy đủ:
 *    + isWalletDeposit: boolean (true nếu là giao dịch nạp tiền ví)
 *    + tier: 'WALLET' | 'PLATINUM' | 'VIP' | 'PRO' | 'FREE'
 *    + name: 'Nạp Ví Tiền Thật' | 'Platinum VIP' | 'FinTrack VIP' | 'VIP Pro' | 'FinTrack Free'
 *    + iconClass: class FontAwesome chính xác (fa-wallet cho nạp ví, fa-crown cho VIP, fa-bolt cho Pro, fa-seedling cho Free)
 *    + badgeClass: class CSS tương ứng
 *    + badgeStyle: inline-style fallback bảo đảm hiển thị sắc nét, chuẩn nhận diện
 *    + html: chuỗi HTML hoàn chỉnh
 *    + toString(): trả về .html để nội suy trực tiếp trong template literal
 */
export function getSubscriptionPlanBadgeHtml(planOrRowData) {
  let rawPlanCode = '';
  let serviceName = '';
  let transferMemo = '';
  let noteText = '';

  if (typeof planOrRowData === 'object' && planOrRowData !== null) {
    rawPlanCode = String(planOrRowData.plan_code || '').trim().toUpperCase();
    serviceName = String(planOrRowData.service_name || planOrRowData.plan_name || planOrRowData.service || planOrRowData.name || '').trim();
    transferMemo = String(planOrRowData.transfer_memo || planOrRowData.memo || '').trim();
    noteText = String(planOrRowData.note || planOrRowData.description || '').trim();
  } else {
    rawPlanCode = String(planOrRowData || '').trim().toUpperCase();
    serviceName = String(planOrRowData || '').trim();
  }

  const combinedSearchText = [rawPlanCode, serviceName, transferMemo, noteText].join(' ').toUpperCase();

  // ==========================================================================
  // 1. TÁCH BIỆT RÕ RÀNG: GIAO DỊCH NẠP VÍ ("Nạp Ví Tiền Thật" / Nạp tiền ví)
  // Ưu tiên kiểm tra trước tiên. Tuyệt đối không áp dụng vương miện hay màu VIP!
  // ==========================================================================
  const isExplicitWalletDeposit = 
    rawPlanCode === 'REAL_DEPOSIT' ||
    rawPlanCode === 'WALLET_DEPOSIT' ||
    rawPlanCode === 'DEPOSIT' ||
    rawPlanCode === 'WALLET_TOPUP' ||
    rawPlanCode === 'WALLET' ||
    combinedSearchText.includes('NẠP VÍ TIỀN THẬT') ||
    combinedSearchText.includes('NAP VI TIEN THAT') ||
    combinedSearchText.includes('NẠP VÍ') ||
    combinedSearchText.includes('NAP VI') ||
    combinedSearchText.includes('NẠP TIỀN VÍ') ||
    combinedSearchText.includes('NAP TIEN VI') ||
    combinedSearchText.includes('REAL_DEPOSIT') ||
    (combinedSearchText.includes('VÍ TIỀN THẬT') && !combinedSearchText.includes('TRỪ VÍ'));

  // Đảm bảo các gói cước thực sự (PRO, PREMIUM, VIP, PLATINUM) không bị nhầm là nạp ví nếu chỉ dùng ví thanh toán ("Trừ Ví Tiền Thật")
  const isActualSubscriptionPlan = 
    (rawPlanCode === 'PLATINUM' || rawPlanCode === 'PREMIUM' || rawPlanCode === 'VIP' || rawPlanCode === 'PRO') &&
    rawPlanCode !== 'REAL_DEPOSIT';

  if (isExplicitWalletDeposit && !isActualSubscriptionPlan) {
    const tier = 'WALLET';
    const name = 'Nạp Ví Tiền Thật';
    const iconClass = 'fa-solid fa-wallet text-emerald-400 text-[10px]';
    const badgeClass = 'badge-wallet-deposit';
    const badgeStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:700; background:rgba(16, 185, 129, 0.2); color:#6ee7b7; border:1px solid rgba(16, 185, 129, 0.45); box-shadow:0 0 10px rgba(16,185,129,0.25); white-space:nowrap;';
    const html = `<span class="${badgeClass}" style="${badgeStyle}"><i class="${iconClass}"></i> ${name}</span>`;
    return { isWalletDeposit: true, tier, name, iconClass, badgeClass, badgeStyle, html, toString() { return this.html; } };
  }

  // ==========================================================================
  // 2. GÓI CƯỚC PLATINUM VIP: Dải màu gradient Hoàng Gia đa sắc độc quyền "VIP TỐI CAO"
  // ==========================================================================
  if (rawPlanCode.includes('PLATINUM') || serviceName.toUpperCase().includes('PLATINUM')) {
    const tier = 'PLATINUM';
    const name = 'Platinum VIP';
    const iconClass = 'fa-solid fa-crown text-slate-950 text-[10px] font-black';
    const badgeClass = 'badge-vip-toi-cao badge-platinum-vip';
    const badgeStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:900; background:linear-gradient(135deg, #fbbf24 0%, #2dd4bf 50%, #3b82f6 100%); color:#020617; border:1px solid rgba(255, 255, 255, 0.85); box-shadow:0 0 14px rgba(251,191,36,0.45), 0 0 20px rgba(45,212,191,0.3); white-space:nowrap; letter-spacing:0.02em;';
    const html = `<span class="${badgeClass}" style="${badgeStyle}"><i class="${iconClass}"></i> ${name}</span>`;
    return { isWalletDeposit: false, tier, name, iconClass, badgeClass, badgeStyle, html, toString() { return this.html; } };
  }

  // ==========================================================================
  // 3. GÓI CƯỚC VIP PRO: Tông màu Xanh dương / Cyan đặc trưng, hiện đại
  // ==========================================================================
  if (rawPlanCode.includes('PRO') || serviceName.toUpperCase().includes('PRO')) {
    const tier = 'PRO';
    const name = 'VIP Pro';
    const iconClass = 'fa-solid fa-bolt text-cyan-300 text-[10px]';
    const badgeClass = 'badge-vip-pro';
    const badgeStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:800; background:rgba(6, 182, 212, 0.2); color:#67e8f9; border:1px solid rgba(6, 182, 212, 0.5); box-shadow:0 0 12px rgba(6,182,212,0.25); white-space:nowrap;';
    const html = `<span class="${badgeClass}" style="${badgeStyle}"><i class="${iconClass}"></i> ${name}</span>`;
    return { isWalletDeposit: false, tier, name, iconClass, badgeClass, badgeStyle, html, toString() { return this.html; } };
  }

  // ==========================================================================
  // 4. GÓI CƯỚC FINTRACK VIP: Tông màu Tím / Indigo / Hồng rực rỡ, sang trọng
  // ==========================================================================
  const isVip = 
    rawPlanCode.includes('PREMIUM') || 
    serviceName.toUpperCase().includes('PREMIUM') ||
    rawPlanCode.includes('VIP') || 
    serviceName.toUpperCase().includes('VIP');

  if (isVip) {
    const tier = 'VIP';
    const name = 'FinTrack VIP';
    const iconClass = 'fa-solid fa-crown text-purple-300 text-[10px]';
    const badgeClass = 'badge-fintrack-vip';
    const badgeStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:800; background:rgba(168, 85, 247, 0.2); color:#d8b4fe; border:1px solid rgba(168, 85, 247, 0.5); box-shadow:0 0 12px rgba(168,85,247,0.25); white-space:nowrap;';
    const html = `<span class="${badgeClass}" style="${badgeStyle}"><i class="${iconClass}"></i> ${name}</span>`;
    return { isWalletDeposit: false, tier, name, iconClass, badgeClass, badgeStyle, html, toString() { return this.html; } };
  }

  // ==========================================================================
  // 5. GÓI CƯỚC FINTRACK FREE: Tông màu xám trung tính (Slate/Gray), tinh tế
  // ==========================================================================
  const tier = 'FREE';
  const name = 'FinTrack Free';
  const iconClass = 'fa-solid fa-seedling text-slate-400 text-[10px]';
  const badgeClass = 'badge-fintrack-free';
  const badgeStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:700; background:rgba(30, 41, 59, 0.85); color:#94a3b8; border:1px solid rgba(71, 85, 105, 0.6); box-shadow:0 2px 8px rgba(0,0,0,0.3); white-space:nowrap;';
  const html = `<span class="${badgeClass}" style="${badgeStyle}"><i class="${iconClass}"></i> ${name}</span>`;
  return { isWalletDeposit: false, tier, name, iconClass, badgeClass, badgeStyle, html, toString() { return this.html; } };
}

/**
 * Returns formatted HTML string directly for table row badge rendering.
 */
export function renderSubscriptionPlanBadge(planOrRowData) {
  return getSubscriptionPlanBadgeHtml(planOrRowData).html;
}

/**
 * ============================================================================
 * DYNAMIC ORDER NOTE MAPPING SYSTEM
 * ============================================================================
 * Phân tích tự động dựa trên tên gói kết hợp với số tiền (VNĐ) của đơn hàng
 * để trả về câu mô tả chính xác nhất cho cột Ghi Chú:
 *
 * 1. Gói VIP Pro (~49k / ~140k / ~490k):
 *    - 1 Tháng: "Đăng ký gói VIP Pro - Hạn mức 1 Tháng"
 *    - 3 Tháng: "Đăng ký gói VIP Pro - Kỳ hạn 3 Tháng (Ưu đãi giảm giá)"
 *    - 1 Năm:   "Đăng ký gói VIP Pro - Kỳ hạn 1 Năm (12 Tháng)"
 *
 * 2. Gói FinTrack VIP (~99k / ~280k / ~990k):
 *    - 1 Tháng: "Đăng ký gói FinTrack VIP - Hạn mức 1 Tháng"
 *    - 3 Tháng: "Đăng ký gói FinTrack VIP - Kỳ hạn 3 Tháng (Ưu đãi giảm giá)"
 *    - 1 Năm:   "Đăng ký gói FinTrack VIP - Kỳ hạn 1 Năm (12 Tháng)"
 *
 * 3. Gói Platinum VIP (~199k / ~567k / ~1.990.000đ):
 *    - 1 Tháng: "Đăng ký gói Platinum VIP - Hạn mức 1 Tháng"
 *    - 3 Tháng: "Đăng ký gói Platinum VIP - Kỳ hạn 3 Tháng (Giảm -5%)"
 *    - 1 Năm:   "Đăng ký gói Platinum VIP - Kỳ hạn 1 Năm cộng 2 Tháng (Tặng kèm +2 Tháng)"
 *
 * 4. Các loại giao dịch khác:
 *    - Nạp ví / REAL_DEPOSIT: "Nạp tiền vào Ví Tiền Thật - FinTrack Pay"
 *    - FinTrack Free: "Kích hoạt gói FinTrack Free (Vĩnh viễn)"
 */
export function getOrderNoteDescription(planOrRowData, explicitAmount = null) {
  let rawPlanCode = '';
  let serviceName = '';
  let transferMemo = '';
  let noteText = '';
  let amount = explicitAmount;
  let durationMonths = null;

  if (typeof planOrRowData === 'object' && planOrRowData !== null) {
    rawPlanCode = String(planOrRowData.plan_code || '').trim().toUpperCase();
    serviceName = String(planOrRowData.service_name || planOrRowData.plan_name || planOrRowData.service || planOrRowData.name || '').trim();
    transferMemo = String(planOrRowData.transfer_memo || planOrRowData.memo || '').trim();
    noteText = String(planOrRowData.note || planOrRowData.description || '').trim();
    if (amount === null || amount === undefined) {
      amount = planOrRowData.amount !== undefined ? planOrRowData.amount : planOrRowData.price;
    }
    if (planOrRowData.duration_months !== undefined) durationMonths = Number(planOrRowData.duration_months);
    else if (planOrRowData.months !== undefined) durationMonths = Number(planOrRowData.months);
  } else {
    rawPlanCode = String(planOrRowData || '').trim().toUpperCase();
    serviceName = String(planOrRowData || '').trim();
  }

  let numAmount = 0;
  if (typeof amount === 'number') {
    numAmount = amount;
  } else if (typeof amount === 'string') {
    const trimmed = amount.trim().toLowerCase();
    if (trimmed.endsWith('k') || trimmed.includes('k')) {
      const numPart = parseFloat(trimmed.replace(/[^\d.]/g, ''));
      if (!isNaN(numPart)) numAmount = numPart * 1000;
    } else {
      const cleanStr = amount.replace(/[^\d]/g, '');
      numAmount = cleanStr ? parseInt(cleanStr, 10) : 0;
    }
  }

  const combinedSearchText = [rawPlanCode, serviceName, transferMemo, noteText].join(' ').toUpperCase();

  // 1. TÁCH BIỆT RÕ RÀNG: GIAO DỊCH NẠP VÍ ("Nạp Ví Tiền Thật" / Nạp tiền ví)
  const isExplicitWalletDeposit = 
    rawPlanCode === 'REAL_DEPOSIT' ||
    rawPlanCode === 'WALLET_DEPOSIT' ||
    rawPlanCode === 'DEPOSIT' ||
    rawPlanCode === 'WALLET_TOPUP' ||
    rawPlanCode === 'WALLET' ||
    combinedSearchText.includes('NẠP VÍ TIỀN THẬT') ||
    combinedSearchText.includes('NAP VI TIEN THAT') ||
    combinedSearchText.includes('NẠP VÍ') ||
    combinedSearchText.includes('NAP VI') ||
    combinedSearchText.includes('NẠP TIỀN VÍ') ||
    combinedSearchText.includes('NAP TIEN VI') ||
    combinedSearchText.includes('REAL_DEPOSIT') ||
    (combinedSearchText.includes('VÍ TIỀN THẬT') && !combinedSearchText.includes('TRỪ VÍ'));

  const isActualSubscriptionPlan = 
    (rawPlanCode === 'PLATINUM' || rawPlanCode === 'PREMIUM' || rawPlanCode === 'VIP' || rawPlanCode === 'PRO') &&
    rawPlanCode !== 'REAL_DEPOSIT';

  if (isExplicitWalletDeposit && !isActualSubscriptionPlan) {
    if (transferMemo && !transferMemo.toUpperCase().startsWith('FT NAP') && transferMemo.length > 5) {
      return transferMemo;
    }
    return 'Nạp tiền vào Ví Tiền Thật - FinTrack Pay';
  }

  // 2. GÓI CƯỚC PLATINUM VIP: ~199k / ~567k / ~1.990.000đ
  if (rawPlanCode.includes('PLATINUM') || serviceName.toUpperCase().includes('PLATINUM')) {
    if (durationMonths === 12 || numAmount > 1000000 || combinedSearchText.includes('1 NĂM') || combinedSearchText.includes('1 NAM') || combinedSearchText.includes('12 THÁNG') || combinedSearchText.includes('12 THANG')) {
      return 'Đăng ký gói Platinum VIP - Kỳ hạn 1 Năm cộng 2 Tháng (Tặng kèm +2 Tháng)';
    }
    if (durationMonths === 3 || (numAmount > 300000 && numAmount <= 1000000) || combinedSearchText.includes('3 THÁNG') || combinedSearchText.includes('3 THANG')) {
      return 'Đăng ký gói Platinum VIP - Kỳ hạn 3 Tháng (Giảm -5%)';
    }
    return 'Đăng ký gói Platinum VIP - Hạn mức 1 Tháng';
  }

  // 3. GÓI CƯỚC VIP PRO: ~49k / ~140k / ~490k
  if (rawPlanCode.includes('PRO') || serviceName.toUpperCase().includes('PRO')) {
    if (durationMonths === 12 || numAmount > 250000 || combinedSearchText.includes('1 NĂM') || combinedSearchText.includes('1 NAM') || combinedSearchText.includes('12 THÁNG') || combinedSearchText.includes('12 THANG')) {
      return 'Đăng ký gói VIP Pro - Kỳ hạn 1 Năm (12 Tháng)';
    }
    if (durationMonths === 3 || (numAmount > 80000 && numAmount <= 250000) || combinedSearchText.includes('3 THÁNG') || combinedSearchText.includes('3 THANG')) {
      return 'Đăng ký gói VIP Pro - Kỳ hạn 3 Tháng (Ưu đãi giảm giá)';
    }
    return 'Đăng ký gói VIP Pro - Hạn mức 1 Tháng';
  }

  // 4. GÓI CƯỚC FINTRACK VIP: ~99k / ~280k / ~990k
  const isVip = 
    rawPlanCode.includes('PREMIUM') || 
    serviceName.toUpperCase().includes('PREMIUM') ||
    rawPlanCode.includes('VIP') || 
    serviceName.toUpperCase().includes('VIP');

  if (isVip) {
    if (durationMonths === 12 || numAmount > 500000 || combinedSearchText.includes('1 NĂM') || combinedSearchText.includes('1 NAM') || combinedSearchText.includes('12 THÁNG') || combinedSearchText.includes('12 THANG')) {
      return 'Đăng ký gói FinTrack VIP - Kỳ hạn 1 Năm (12 Tháng)';
    }
    if (durationMonths === 3 || (numAmount > 150000 && numAmount <= 500000) || combinedSearchText.includes('3 THÁNG') || combinedSearchText.includes('3 THANG')) {
      return 'Đăng ký gói FinTrack VIP - Kỳ hạn 3 Tháng (Ưu đãi giảm giá)';
    }
    return 'Đăng ký gói FinTrack VIP - Hạn mức 1 Tháng';
  }

  // 5. GÓI FINTRACK FREE HOẶC MẶC ĐỊNH
  return 'Kích hoạt gói FinTrack Free (Vĩnh viễn)';
}

/**
 * Synchronizes all plan theme elements across the entire UI dynamically:
 * - Header plan badge (#user-display-plan)
 * - Sidebar menu subscription badge (#sidebar-subscription-badge)
 * - Sidebar user status footer (#sidebar-user-footer)
 * - Subscription Tab Current Plan Banner (#current-plan-banner)
 * - Subscription Header Widget Badge (#subscription-header-plan-badge)
 * - Real Wallet info badge in Wallets Tab (#real-wallet-current-plan)
 */
export function syncDynamicPlanTheme(userOrPlan = 'FREE', daysRemaining = null) {
  let planKey = 'FREE';
  let days = daysRemaining;
  let user = null;

  if (typeof userOrPlan === 'object' && userOrPlan !== null) {
    user = userOrPlan;
    planKey = normalizePlanTier(user.plan_tier || user.plan || 'FREE');
    if (days === null && user.days_remaining !== undefined) {
      days = user.days_remaining;
    }
  } else if (typeof userOrPlan === 'string') {
    planKey = normalizePlanTier(userOrPlan);
  }

  const theme = PLAN_THEMES[planKey] || PLAN_THEMES.FREE;
  const isExpiringSoon = days !== null && days !== undefined && days <= 5 && planKey !== 'FREE';

  // 1. Header user plan badge (#user-display-plan)
  const headerPlanEl = document.getElementById('user-display-plan');
  if (headerPlanEl) {
    if (isExpiringSoon) {
      headerPlanEl.className = 'px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse shadow-md shadow-rose-500/20 cursor-pointer relative z-20 pointer-events-auto hover:scale-105 transition inline-flex items-center gap-1.5';
      headerPlanEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-[10px] text-rose-300"></i> <span>${theme.name}</span> <span class="text-rose-200">(${days === 0 ? 'HẾT HẠN' : `CÒN ${days} NGÀY`})</span>`;
    } else {
      headerPlanEl.className = theme.headerBadgeClass;
      headerPlanEl.innerHTML = theme.headerBadgeHtml(days);
    }
    headerPlanEl.title = theme.headerBadgeTitle;
  }

  // 2. Sidebar subscription badge (#sidebar-subscription-badge)
  const sidebarBadge = document.getElementById('sidebar-subscription-badge');
  if (sidebarBadge) {
    sidebarBadge.className = theme.sidebarBadgeClass;
    sidebarBadge.innerHTML = theme.sidebarBadgeHtml;
  }

  // 3. Sidebar user footer card (#sidebar-user-footer)
  const sidebarUserFooter = document.getElementById('sidebar-user-footer');
  if (sidebarUserFooter) {
    const isPaid = planKey !== 'FREE';
    if (isPaid) {
      sidebarUserFooter.className = `p-2.5 rounded-xl bg-slate-900/90 border ${isExpiringSoon ? 'border-rose-500/40 shadow-rose-500/10' : theme.sidebarFooterBorder} shadow-md text-xs space-y-1 transition-all duration-300`;
      const footerStatusText = days !== null && days !== undefined ? (days > 0 ? `Còn ${days} ngày` : 'Đã hết hạn') : 'Đang hoạt động';
      sidebarUserFooter.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-[11px] flex items-center gap-1.5 ${theme.sidebarFooterTitleColor}">
            <i class="${theme.iconClass} text-[10px]"></i>
            <span>${theme.name}</span>
          </span>
          <span class="text-[9px] font-mono font-bold ${isExpiringSoon ? 'text-rose-400 animate-pulse' : theme.sidebarFooterStatusColor}">
            ${footerStatusText}
          </span>
        </div>
        <p class="text-[10px] text-slate-400">
          Cố vấn AI & Không giới hạn ví
        </p>
      `;
    } else {
      sidebarUserFooter.className = 'p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md text-xs space-y-1 transition-all duration-300';
      sidebarUserFooter.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-[11px] flex items-center gap-1.5 text-slate-400">
            <i class="fa-solid fa-seedling text-[10px]"></i>
            <span>FinTrack Free</span>
          </span>
          <span class="text-[9px] font-mono font-bold text-slate-500">Vĩnh viễn</span>
        </div>
        <p class="text-[10px] text-slate-400">Nâng cấp VIP để mở khóa AI</p>
      `;
    }
  }

  // 4. Current Plan Status Banner in Subscription Tab (#current-plan-banner)
  const bannerContainer = document.getElementById('current-plan-banner');
  if (bannerContainer) {
    // Update border and glow
    bannerContainer.className = `glass-card p-6 rounded-3xl border ${isExpiringSoon ? 'border-rose-500/60 shadow-xl shadow-rose-500/20' : theme.bannerBorderClass} relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 transition-all duration-300`;
    
    // Update glow orb
    const glowOrb = bannerContainer.querySelector('.pointer-events-none.rounded-full');
    if (glowOrb) {
      glowOrb.className = `absolute -top-24 -right-24 w-80 h-80 rounded-full ${isExpiringSoon ? 'bg-rose-500/15' : theme.bannerGlowClass} blur-3xl pointer-events-none transition-all duration-500`;
    }

    // Update icon box (#current-plan-icon-box or icon container)
    const iconBox = document.getElementById('current-plan-icon-box') || bannerContainer.querySelector('.w-14.h-14');
    if (iconBox) {
      iconBox.className = theme.iconBoxClass;
      iconBox.innerHTML = `<i class="${theme.iconBoxIcon}"></i>`;
    }

    // Update status badge
    const statusBadge = document.getElementById('current-plan-status-badge');
    if (statusBadge) {
      if (isExpiringSoon) {
        statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/20';
        statusBadge.textContent = `⚠️ CẢNH BÁO: CÒN ${days} NGÀY`;
      } else {
        statusBadge.className = theme.statusBadgeClass;
        const remaining = days !== null && days !== undefined ? `CÒN ${days} NGÀY` : (planKey === 'FREE' ? 'MIỄN PHÍ VĨNH VIỄN' : 'VÔ THỜI HẠN');
        statusBadge.textContent = planKey === 'FREE' ? theme.statusBadgeText : `ĐANG HOẠT ĐỘNG – ${remaining}`;
      }
    }

    // Update title pill
    const titlePill = document.getElementById('current-plan-title-pill');
    if (titlePill) {
      titlePill.outerHTML = theme.titlePillHtml;
    }

    // Update progress bar fill
    const progressBar = bannerContainer.querySelector('#current-plan-progress-fill') || bannerContainer.querySelector('.h-full.rounded-full');
    if (progressBar) {
      progressBar.className = `h-full rounded-full transition-all duration-700 ${isExpiringSoon ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse' : theme.progressBarClass}`;
    }
  }

  // 5. Subscription Header Widget Badge (#subscription-header-plan-badge)
  const widgetBadge = document.getElementById('subscription-header-plan-badge');
  if (widgetBadge) {
    widgetBadge.className = theme.widgetBadgeClass;
    widgetBadge.innerHTML = theme.widgetBadgeText;
  }

  // 6. Real Wallet plan badge in Wallets Tab (#real-wallet-current-plan)
  const realWalletBadge = document.getElementById('real-wallet-current-plan');
  if (realWalletBadge) {
    const daysStr = days !== null && days !== undefined ? `${days} ngày` : 'Vĩnh viễn';
    realWalletBadge.innerHTML = `<strong class="${theme.accentTextColor} font-sans font-bold">${theme.name} (${daysStr})</strong>`;
  }

  // Dispatch custom event for any other listeners
  try {
    window.dispatchEvent(new CustomEvent('fintrack:plan-theme-applied', {
      detail: { plan: planKey, theme, days }
    }));
  } catch (_) {}

  return theme;
}

// Attach to window object for global availability
if (typeof window !== 'undefined') {
  window.FinTrackPlanThemes = {
    PLAN_THEMES,
    normalizePlanTier,
    getPlanTheme,
    syncDynamicPlanTheme,
    getSubscriptionPlanBadgeHtml,
    renderSubscriptionPlanBadge,
    getOrderNoteDescription
  };
  window.normalizePlanTier = normalizePlanTier;
  window.getPlanTheme = getPlanTheme;
  window.syncDynamicPlanTheme = syncDynamicPlanTheme;
  window.getSubscriptionPlanBadgeHtml = getSubscriptionPlanBadgeHtml;
  window.renderSubscriptionPlanBadge = renderSubscriptionPlanBadge;
  window.getOrderNoteDescription = getOrderNoteDescription;

  // Developer helper for testing mock plans easily in console
  window.setMockPlan = function(mockPlan = 'PLATINUM', days = 52) {
    if (window.fintrackApp && window.fintrackApp.currentUser) {
      window.fintrackApp.currentUser.plan_tier = mockPlan;
      window.fintrackApp.currentUser.plan = mockPlan;
      window.fintrackApp.currentUser.days_remaining = days;
    }
    syncDynamicPlanTheme(mockPlan, days);
    if (window.fintrackApp?.subscription?.render && window.fintrackApp?.currentTab === 'subscription') {
      const container = window.fintrackApp.getMainContainer();
      if (container) window.fintrackApp.subscription.render(container);
    }
    console.log(`[FinTrack] Gói cước đã đồng bộ động sang: ${mockPlan} (${days} ngày)`);
  };
}
