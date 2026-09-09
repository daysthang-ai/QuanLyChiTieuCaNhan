import { api } from '../api.js?v=20260904_01';
import { formatVND } from '../utils/formatters.js?v=20260904_01';

export class BadgesComponent {
  constructor(app) {
    this.app = app;
    this.badgesData = null;
    this.activeFilter = 'ALL';
    this.currentlyViewingBadgeId = null;

    // Lắng nghe sự kiện biến động tài sản ròng realtime toàn hệ thống
    window.addEventListener('fintrack:networth-changed', (e) => {
      const netWorth = e.detail?.netWorth;
      if (typeof netWorth === 'number') {
        this.onNetWorthChanged(netWorth);
      }
    });

    // Cung cấp hàm toàn cục hỗ trợ kiểm tra hoặc cập nhật biến động số dư tức thời
    window.updateFintrackNetWorth = (amount) => {
      window.fintrackLiveNetWorth = amount;
      window.dispatchEvent(new CustomEvent('fintrack:networth-changed', { detail: { netWorth: amount } }));
    };
  }

  // Lấy trực tiếp tổng giá trị tài sản ròng (Net Worth) từ state chung hệ thống
  getLiveNetWorth() {
    if (typeof window.fintrackLiveNetWorth === 'number' && !isNaN(window.fintrackLiveNetWorth)) {
      return window.fintrackLiveNetWorth;
    }
    if (this.app?.wallets?.wallets && Array.isArray(this.app.wallets.wallets) && this.app.wallets.wallets.length > 0) {
      const nw = this.app.wallets.wallets.reduce((acc, w) => acc + (parseFloat(w.balance) || 0), 0);
      window.fintrackLiveNetWorth = nw;
      return nw;
    }
    if (this.app?.dashboard?.currentKPIs?.total_net_worth !== undefined) {
      const nw = parseFloat(this.app.dashboard.currentKPIs.total_net_worth) || 0;
      window.fintrackLiveNetWorth = nw;
      return nw;
    }
    return 0;
  }

  // Tải trực tiếp số dư ví mới nhất nếu chưa có trong state
  async fetchLiveNetWorth() {
    try {
      const wallets = await api.getWallets();
      if (Array.isArray(wallets)) {
        const nw = wallets.reduce((acc, w) => acc + (parseFloat(w.balance) || 0), 0);
        window.fintrackLiveNetWorth = nw;
        return nw;
      }
    } catch (e) {
      console.warn('[Badges] Could not fetch live wallets balance:', e);
    }
    return this.getLiveNetWorth();
  }

  // Đồng bộ động các huy hiệu dựa trên tài sản với giá trị Net Worth thực tế
  syncAssetBadgesWithLiveNetWorth(liveNetWorth) {
    if (!this.badgesData || !Array.isArray(this.badgesData.badges)) return;
    const current_amount = typeof liveNetWorth === 'number' ? liveNetWorth : this.getLiveNetWorth();
    const todayStr = new Date().toLocaleDateString('vi-VN');

    const assetBadgeIds = ['networth_100m', 'networth_500m', 'networth_1b'];

    this.badgesData.badges.forEach(b => {
      if (assetBadgeIds.includes(b.id) || b.id.startsWith('networth_')) {
        const target_amount = b.target_val || (
          b.id === 'networth_100m' ? 100000000 :
          b.id === 'networth_500m' ? 500000000 :
          1000000000
        );
        b.target_val = target_amount;
        b.current_val = current_amount;

        // Tự động tính lại phần trăm hoàn thành theo công thức:
        // Math.min(100, Math.round((current_amount / target_amount) * 100))
        const progress_pct = target_amount > 0 
          ? Math.min(100, Math.round((current_amount / target_amount) * 100))
          : 0;
        b.progress_pct = progress_pct;

        // Nếu current_amount >= target_amount (tiến độ đạt 100%), tự động chuyển trạng thái huy hiệu thành "Đã Mở Khóa" kèm icon huy hiệu xanh/hoàn thành.
        if (current_amount >= target_amount || progress_pct >= 100) {
          b.is_unlocked = true;
          b.progress_pct = 100;
          if (!b.unlocked_at) {
            b.unlocked_at = todayStr;
          }
        } else {
          b.is_unlocked = false;
        }
      }
    });

    // Cập nhật lại số lượng huy hiệu đã mở khóa và tỷ lệ hoàn thành
    this.badgesData.unlocked_count = this.badgesData.badges.filter(b => b.is_unlocked).length;
    this.badgesData.total_count = this.badgesData.badges.length;
    this.badgesData.completion_pct = Math.round((this.badgesData.unlocked_count / this.badgesData.total_count) * 1000) / 10;
  }

  // Handler phản hồi realtime ngay khi tài sản ròng thay đổi
  onNetWorthChanged(newNetWorth) {
    if (typeof newNetWorth !== 'number') return;
    window.fintrackLiveNetWorth = newNetWorth;

    if (this.badgesData && Array.isArray(this.badgesData.badges)) {
      this.syncAssetBadgesWithLiveNetWorth(newNetWorth);

      // Cập nhật Header Gamification Stats nếu đang hiển thị trên DOM
      const badgesUnlockedEl = document.getElementById('gamification-badges-unlocked');
      if (badgesUnlockedEl) {
        badgesUnlockedEl.textContent = `${this.badgesData.unlocked_count || 0} / ${this.badgesData.total_count || 0}`;
      }
      const completionPctEl = document.getElementById('gamification-completion-pct');
      if (completionPctEl) {
        completionPctEl.textContent = `${this.badgesData.completion_pct || 0}% hoàn thành`;
      }
      const filterUnlockedEl = document.getElementById('count-filter-unlocked');
      if (filterUnlockedEl) {
        filterUnlockedEl.textContent = this.badgesData.unlocked_count || 0;
      }
      const filterLockedEl = document.getElementById('count-filter-locked');
      if (filterLockedEl) {
        filterLockedEl.textContent = (this.badgesData.total_count || 0) - (this.badgesData.unlocked_count || 0);
      }

      // Re-render upcoming showcase & badges grid
      this.renderUpcomingShowcase();
      this.renderBadgesGrid();

      // Cập nhật realtime trên popup modal nếu người dùng đang mở xem chi tiết
      if (this.currentlyViewingBadgeId) {
        const modalEl = document.getElementById('generic-modal');
        if (modalEl && !modalEl.classList.contains('hidden') && modalEl.innerHTML.trim() !== '') {
          this.showBadgeDetailModal(this.currentlyViewingBadgeId);
        }
      }
    }
  }

  async render(container) {
    container.innerHTML = `
      <div id="view-badges" data-tab-id="badges" class="content-section user-tab-pane space-y-6 animate-in fade-in duration-300">
        
        <!-- Gamification Banner Header -->
        <div id="achievement-user-summary" class="glass-card p-6 rounded-3xl relative overflow-hidden border border-amber-500/20 shadow-xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 transition-all duration-300">
          
          <!-- Background Glow Elements -->
          <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <!-- Left Profile & Level -->
            <div class="flex items-center gap-4">
              <div class="relative">
                <div id="gamification-level-icon-box" class="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-2xl text-slate-400 ring-4 ring-slate-700/40 shadow-md transition-all duration-300">
                  <i id="gamification-level-icon" class="fa-solid fa-shield text-slate-400"></i>
                </div>
                <span id="gamification-level-badge-pill" class="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-black text-[10px] shadow-sm transition-all">
                  LV.<span id="gamification-level-num">1</span>
                </span>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight" id="gamification-level-title">
                    Tập Sự Tài Chính
                  </h1>
                  <span id="gamification-tier-label" class="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-bold border border-amber-400/20">
                    Thành Tích FinTrack
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  Chinh phục các cột mốc tài chính, duy trì kỷ luật và nâng hạng danh hiệu của bạn!
                </p>
                
                <!-- Level XP Progress Bar -->
                <div class="mt-3 flex items-center gap-3">
                  <div class="w-48 sm:w-64 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80">
                    <div id="gamification-xp-bar" class="h-full gradient-amber rounded-full transition-all duration-700" style="width: 0%"></div>
                  </div>
                  <span class="text-[11px] font-bold text-amber-400 font-mono" id="gamification-xp-text">0 / 300 XP</span>
                </div>
              </div>
            </div>

            <!-- Right Stats: Streak & Badges Progress -->
            <div class="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              
              <!-- Streak Pill -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-orange-500/30 text-center min-w-[135px] sm:min-w-[145px] shadow-lg shadow-orange-500/5">
                <div class="flex items-center justify-center gap-1.5 text-orange-400 text-xs sm:text-sm font-black mb-1">
                  <i class="fa-solid fa-fire text-orange-500 animate-pulse text-sm sm:text-base"></i>
                  <span>CHUỖI KỶ LUẬT</span>
                </div>
                <div class="text-xl sm:text-2xl font-black text-slate-100 font-mono tracking-tight stat-value" id="gamification-streak-days">
                  0 Ngày
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">Ghi chép liên tiếp</div>
              </div>

              <!-- Unlocked Count Pill -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center min-w-[135px] sm:min-w-[145px] shadow-lg shadow-emerald-500/5">
                <div class="flex items-center justify-center gap-1.5 text-emerald-400 text-xs sm:text-sm font-black mb-1">
                  <i class="fa-solid fa-award text-emerald-400 text-sm sm:text-base"></i>
                  <span>HUY HIỆU ĐẠT</span>
                </div>
                <div class="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight stat-value" id="gamification-badges-unlocked">
                  0 / 0
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5" id="gamification-completion-pct">0% hoàn thành</div>
              </div>

            </div>

          </div>

          <!-- Horizontal Level Milestones Road Map Bar -->
          <div id="gamification-roadmap" class="relative z-10 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mt-4 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
            <!-- Dynamically populated by renderLevelRoadmap() -->
          </div>

        </div>

        <!-- Section: HUY HIỆU SẮP MỞ KHÓA (GẦN ĐẠT NHẤT) -->
        <div id="upcoming-badges-showcase-section" class="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-indigo-950/10">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                <i class="fa-solid fa-bullseye"></i>
              </span>
              <div>
                <h3 class="text-sm font-extrabold text-slate-100">Huy Hiệu Sắp Mở Khóa (Đang Thực Hiện)</h3>
                <p class="text-[11px] text-slate-400">Các mục tiêu bạn đang tiến gần nhất tới đích</p>
              </div>
            </div>
            <button id="btn-view-all-locked-tab" class="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
              Xem toàn bộ kho chưa mở khóa &rarr;
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5" id="upcoming-badges-grid">
            <!-- Dynamically populated top 3 closest badges -->
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition gradient-emerald text-white shadow-sm" data-filter="ALL">
            Tất Cả Huy Hiệu (<span id="count-filter-all">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="UNLOCKED">
            <i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> Đã Mở Khóa (<span id="count-filter-unlocked">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="LOCKED">
            <i class="fa-solid fa-lock text-slate-500 mr-1"></i> Chưa Mở Khóa (<span id="count-filter-locked">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="STREAK">
            🔥 Chuỗi Kỷ Luật
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="SAVINGS">
            💰 Tích Lũy & Tài Sản
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="MASTERY">
            ⚡ Quản Trị & AI
          </button>
        </div>

        <!-- Badges Grid Container -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="badges-cards-grid">
          <div class="glass-card p-6 rounded-2xl animate-pulse h-48"></div>
        </div>

      </div>
    `;

    // Bind Filter Events
    document.querySelectorAll('.badge-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeFilter = tab.getAttribute('data-filter');
        this.updateFilterButtonsUI();
        this.renderBadgesGrid();
      });
    });

    document.getElementById('btn-view-all-locked-tab')?.addEventListener('click', () => {
      this.activeFilter = 'LOCKED';
      this.updateFilterButtonsUI();
      this.renderBadgesGrid();
    });

    await this.loadBadges();
  }

  updateFilterButtonsUI() {
    document.querySelectorAll('.badge-filter-tab').forEach(btn => {
      if (btn.getAttribute('data-filter') === this.activeFilter) {
        btn.className = 'badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition gradient-emerald text-white shadow-sm';
      } else {
        btn.className = 'badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800';
      }
    });
  }

  // Standardized 6-Tier Level & XP Calculation
  getTierInfo(xp = 0, level = 0) {
    if (xp >= 5000 || level >= 9) {
      return {
        tierKey: 'MYTHIC',
        tierName: '👑 HẠNG HUYỀN THOẠI',
        title: 'Huyền Thoại FinTrack',
        minXP: 5000,
        nextXP: 5000,
        isMax: true,
        levelNum: Math.max(9, level || 9)
      };
    } else if (xp >= 3000 || level >= 7) {
      return {
        tierKey: 'DIAMOND',
        tierName: 'Hạng Kim Cương',
        title: 'Đại Gia Tài Chính FinTrack',
        minXP: 3000,
        nextXP: 5000,
        isMax: false,
        levelNum: Math.max(7, level || 7)
      };
    } else if (xp >= 1500 || level >= 5) {
      return {
        tierKey: 'GOLD',
        tierName: 'Hạng Vàng',
        title: 'Bậc Thầy Tài Chính FinTrack',
        minXP: 1500,
        nextXP: 3000,
        isMax: false,
        levelNum: Math.max(5, level || 5)
      };
    } else if (xp >= 800 || level >= 3) {
      return {
        tierKey: 'SILVER',
        tierName: 'Hạng Bạc',
        title: 'Chuyên Viên Quản Lý FinTrack',
        minXP: 800,
        nextXP: 1500,
        isMax: false,
        levelNum: Math.max(3, level || 3)
      };
    } else if (xp >= 300 || level >= 1) {
      return {
        tierKey: 'BRONZE',
        tierName: 'Hạng Đồng',
        title: 'Chiến Binh Tài Chính FinTrack',
        minXP: 300,
        nextXP: 800,
        isMax: false,
        levelNum: Math.max(1, level || 1)
      };
    } else {
      return {
        tierKey: 'START',
        tierName: 'Cấp Tập Sự',
        title: 'Người Tập Sự FinTrack',
        minXP: 0,
        nextXP: 300,
        isMax: false,
        levelNum: 0
      };
    }
  }

  getAdminMockBadgesData() {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const liveNetWorth = this.getLiveNetWorth() || 775504000;

    const badgesCatalog = [
      { id: "first_wallet", title: "Khởi Đầu Tài Chính", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-wallet", is_unlocked: true, current_val: 1, target_val: 1, unit: "ví", progress_pct: 100, unlocked_at: todayStr, description: "Tạo ví tài chính đầu tiên để bắt đầu quản lý dòng tiền" },
      { id: "first_transaction", title: "Bút Toán Đầu Tiên", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-receipt", is_unlocked: true, current_val: 1, target_val: 1, unit: "giao dịch", progress_pct: 100, unlocked_at: todayStr, description: "Ghi chép giao dịch thu/chi đầu tiên vào hệ thống" },
      { id: "multi_wallets", title: "Nhà Quản Lý Đa Ví", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-vault", is_unlocked: true, current_val: 3, target_val: 3, unit: "ví", progress_pct: 100, unlocked_at: todayStr, description: "Phân bổ dòng tiền chuyên nghiệp qua 3 ví/tài khoản khác nhau" },
      { id: "first_goal", title: "Mầm Mống Tích Lũy", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-piggy-bank", is_unlocked: true, current_val: 1, target_val: 1, unit: "mục tiêu", progress_pct: 100, unlocked_at: todayStr, description: "Thiết lập mục tiêu tiết kiệm đầu tiên" },
      { id: "first_budget", title: "Kế Hoạch Ngân Sách", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-chart-pie", is_unlocked: true, current_val: 1, target_val: 1, unit: "hạn mức", progress_pct: 100, unlocked_at: todayStr, description: "Cài đặt hạn mức chi tiêu cho ít nhất một danh mục trong tháng" },
      { id: "category_explorer", title: "Nhà Khám Phá Chi Tiêu", category: "ONBOARDING", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-tags", is_unlocked: true, current_val: 5, target_val: 5, unit: "danh mục", progress_pct: 100, unlocked_at: todayStr, description: "Ghi chép giao dịch phân bổ trên ít nhất 5 danh mục khác nhau" },
      { id: "streak_3_days", title: "Kỷ Luật 3 Ngày", category: "STREAK", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-fire-burner", is_unlocked: true, current_val: 3, target_val: 3, unit: "ngày", progress_pct: 100, unlocked_at: todayStr, description: "Ghi chép chi tiêu liên tục trong 3 ngày" },
      { id: "savings_1m", title: "Heo Đất Nhỏ", category: "SAVINGS", tier: "BRONZE", tier_name: "Đồng", icon: "fa-solid fa-coins", is_unlocked: true, current_val: 1000000, target_val: 1000000, unit: "₫", progress_pct: 100, unlocked_at: todayStr, description: "Tích lũy được 1.000.000 ₫ trong các mục tiêu tiết kiệm" },
      
      { id: "streak_7_days", title: "Chiến Binh 7 Ngày", category: "STREAK", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-fire", is_unlocked: true, current_val: 7, target_val: 7, unit: "ngày", progress_pct: 100, unlocked_at: todayStr, description: "Duy trì chuỗi ghi chép liên tiếp 7 ngày" },
      { id: "streak_14_days", title: "Kỷ Luật 2 Tuần", category: "STREAK", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-calendar-check", is_unlocked: true, current_val: 14, target_val: 14, unit: "ngày", progress_pct: 100, unlocked_at: todayStr, description: "Chuỗi 14 ngày không bỏ lỡ một ngày ghi chép nào" },
      { id: "completed_goal", title: "Về Đích Ngoạn Mục", category: "SAVINGS", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-flag-checkered", is_unlocked: true, current_val: 1, target_val: 1, unit: "mục tiêu", progress_pct: 100, unlocked_at: todayStr, description: "Hoàn thành 100% ít nhất một mục tiêu tiết kiệm đã đề ra" },
      { id: "savings_10m", title: "Khoản Dự Phòng An Tâm", category: "SAVINGS", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-sack-dollar", is_unlocked: true, current_val: 10000000, target_val: 10000000, unit: "₫", progress_pct: 100, unlocked_at: todayStr, description: "Tích lũy được 10.000.000 ₫ vào quỹ tiết kiệm" },
      { id: "smart_ai_user", title: "Chuyên Gia AI", category: "MASTERY", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-wand-magic-sparkles", is_unlocked: true, current_val: 5, target_val: 5, unit: "lượt", progress_pct: 100, unlocked_at: todayStr, description: "Sử dụng tính năng Nhập Nhanh AI bằng văn bản tự nhiên 5 lần" },
      { id: "smart_investor", title: "Nhà Đầu Tư Bản Lĩnh", category: "MASTERY", tier: "SILVER", tier_name: "Bạc", icon: "fa-solid fa-arrow-trend-up", is_unlocked: true, current_val: 1, target_val: 1, unit: "khoản", progress_pct: 100, unlocked_at: todayStr, description: "Ghi nhận khoản thu nhập từ đầu tư hoặc tiền lãi sinh lời" },

      { id: "streak_30_days", title: "Thói Quen Vàng 30 Ngày", category: "STREAK", tier: "GOLD", tier_name: "Vàng", icon: "fa-solid fa-star", is_unlocked: true, current_val: 30, target_val: 30, unit: "ngày", progress_pct: 100, unlocked_at: todayStr, description: "Hình thành thói quen quản lý tài chính vững vàng trong 30 ngày" },
      { id: "savings_50m", title: "Cột Mốc Vàng 50 Triệu", category: "SAVINGS", tier: "GOLD", tier_name: "Vàng", icon: "fa-solid fa-trophy", is_unlocked: true, current_val: 50000000, target_val: 50000000, unit: "₫", progress_pct: 100, unlocked_at: todayStr, description: "Tích lũy được 50.000.000 ₫ trong các lọ tiết kiệm" },
      { id: "fifty_thirty_twenty_achieved", title: "Chuẩn Mực 50/30/20", category: "MASTERY", tier: "GOLD", tier_name: "Vàng", icon: "fa-solid fa-scale-balanced", is_unlocked: true, current_val: 20, target_val: 20, unit: "%", progress_pct: 100, unlocked_at: todayStr, description: "Đạt tỷ lệ tiết kiệm tối thiểu 20% tổng thu nhập trong tháng" },
      { id: "budget_guardian", title: "Thủ Lĩnh Ngân Sách", category: "MASTERY", tier: "GOLD", tier_name: "Vàng", icon: "fa-solid fa-shield-halved", is_unlocked: true, current_val: 1, target_val: 1, unit: "tháng", progress_pct: 100, unlocked_at: todayStr, description: "Giữ tất cả danh mục trong hạn mức ngân sách tháng" },

      { id: "streak_60_days", title: "Kỷ Luật Thép 60 Ngày", category: "STREAK", tier: "DIAMOND", tier_name: "Kim Cương", icon: "fa-solid fa-gem", is_unlocked: true, current_val: 60, target_val: 60, unit: "ngày", progress_pct: 100, unlocked_at: todayStr, description: "Duy trì kỷ luật thép liên tục trong 60 ngày" },
      { id: "networth_100m", title: "Đại Gia Bách Triệu", category: "SAVINGS", tier: "DIAMOND", tier_name: "Kim Cương", icon: "fa-solid fa-crown", is_unlocked: liveNetWorth >= 100000000, current_val: liveNetWorth, target_val: 100000000, unit: "₫", progress_pct: Math.min(100, Math.round((liveNetWorth / 100000000) * 100)), unlocked_at: liveNetWorth >= 100000000 ? todayStr : null, unlock_hint: "Gia tăng tổng số dư ví vượt 100 triệu", description: "Tổng tài sản ròng vượt mốc 100.000.000 ₫", target_tab: "wallets" },

      { id: "networth_500m", title: "Nửa Tỷ Tự Do", category: "SAVINGS", tier: "DIAMOND", tier_name: "Kim Cương", icon: "fa-solid fa-building-columns", is_unlocked: liveNetWorth >= 500000000, current_val: liveNetWorth, target_val: 500000000, unit: "₫", progress_pct: Math.min(100, Math.round((liveNetWorth / 500000000) * 100)), unlocked_at: liveNetWorth >= 500000000 ? todayStr : null, unlock_hint: "Tích lũy tổng tài sản ròng đạt 500 triệu đồng", description: "Đạt mốc tài sản ròng nửa tỷ đồng", target_tab: "wallets" },
      { id: "streak_100_days", title: "Bậc Thầy Kỷ Luật 100 Ngày", category: "STREAK", tier: "MYTHIC", tier_name: "Huyền Thoại", icon: "fa-solid fa-dragon", is_unlocked: false, current_val: 68, target_val: 100, unit: "ngày", progress_pct: 68, unlock_hint: "Ghi chép liên tục trong 100 ngày không gián đoạn", description: "Chuỗi 100 ngày ghi chép không ngừng nghỉ" },
      { id: "networth_1b", title: "Tỷ Phú FinTrack", category: "SAVINGS", tier: "MYTHIC", tier_name: "Huyền Thoại", icon: "fa-solid fa-landmark", is_unlocked: liveNetWorth >= 1000000000, current_val: liveNetWorth, target_val: 1000000000, unit: "₫", progress_pct: Math.min(100, Math.round((liveNetWorth / 1000000000) * 100)), unlocked_at: liveNetWorth >= 1000000000 ? todayStr : null, unlock_hint: "Gia tăng tài sản ròng đạt mốc 1.000.000.000 ₫", description: "Gia nhập câu lạc bộ tài sản ròng 1 tỷ đồng", target_tab: "wallets" },
      { id: "streak_365_days", title: "Kỷ Lục Gia 365 Ngày", category: "STREAK", tier: "MYTHIC", tier_name: "Huyền Thoại", icon: "fa-solid fa-award", is_unlocked: false, current_val: 68, target_val: 365, unit: "ngày", progress_pct: 19, unlock_hint: "Ghi chép 365 ngày trọn vẹn một năm", description: "Duy trì kỷ luật tròn 1 năm 365 ngày" }
    ];

    const unlocked = badgesCatalog.filter(b => b.is_unlocked).length;
    const total = badgesCatalog.length;
    return {
      unlocked_count: unlocked,
      total_count: total,
      completion_pct: Math.round((unlocked / total) * 1000) / 10,
      current_streak: 68,
      level: 8,
      level_title: "Quản Trị Viên Kim Cương FinTrack",
      xp: 4850,
      xp_next_level: 5000,
      badges: badgesCatalog
    };
  }

  async loadBadges() {
    const user = this.app?.currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN' || 
                    (user?.email || '').toLowerCase() === 'admin@fintrack.ai';

    try {
      // Đảm bảo số dư tài sản ròng realtime đã được tải vào state chung
      if (window.fintrackLiveNetWorth === undefined) {
        await this.fetchLiveNetWorth();
      }

      let data;
      try {
        data = await api.getBadges();
      } catch (err) {
        if (isAdmin) {
          data = this.getAdminMockBadgesData();
        } else {
          throw err;
        }
      }

      if (isAdmin && data) {
        // Enforce Root Admin Prestigious Gamification State: Lv.8 - Hạng Kim Cương
        data.level = 8;
        data.xp = 4850;
        data.xp_next_level = 5000;
        data.current_streak = Math.max(data.current_streak || 0, 68);

        const adminUnlockedBadgeIds = new Set([
          'first_wallet', 'first_transaction', 'multi_wallets', 'first_goal', 'first_budget', 'category_explorer',
          'streak_3_days', 'streak_7_days', 'streak_14_days', 'streak_30_days', 'streak_60_days',
          'savings_1m', 'completed_goal', 'savings_10m', 'savings_50m',
          'smart_ai_user', 'smart_investor', 'fifty_thirty_twenty_achieved', 'budget_guardian'
        ]);

        const todayStr = new Date().toLocaleDateString('vi-VN');

        if (data.badges && Array.isArray(data.badges)) {
          data.badges.forEach(b => {
            if (adminUnlockedBadgeIds.has(b.id)) {
              b.is_unlocked = true;
              b.progress_pct = 100;
              b.current_val = b.target_val;
              if (!b.unlocked_at) b.unlocked_at = todayStr;
            } else if (b.id === 'streak_100_days') {
              b.current_val = data.current_streak;
              b.progress_pct = Math.min(100, Math.round((data.current_streak / 100) * 100));
            } else if (b.id === 'streak_365_days') {
              b.current_val = data.current_streak;
              b.progress_pct = Math.min(100, Math.round((data.current_streak / 365) * 100));
            }
          });
        }
      }

      this.badgesData = data;

      // Luôn đồng bộ động các huy hiệu tài sản (100M, 500M, 1B,...) với tài sản ròng thực tế
      this.syncAssetBadgesWithLiveNetWorth(this.getLiveNetWorth());

      const totalXP = data.xp || 0;
      const rawLevel = data.level !== undefined ? data.level : 0;
      const tierInfo = this.getTierInfo(totalXP, rawLevel);
      if (isAdmin && tierInfo.tierKey === 'DIAMOND') {
        tierInfo.title = 'Quản Trị Viên Kim Cương FinTrack';
      }
      const level = tierInfo.levelNum;

      const summaryBanner = document.getElementById('achievement-user-summary');
      const iconBox = document.getElementById('gamification-level-icon-box');
      const badgePill = document.getElementById('gamification-level-badge-pill');
      const tierLabel = document.getElementById('gamification-tier-label');
      const levelTitle = document.getElementById('gamification-level-title');

      // Update Header Stats
      document.getElementById('gamification-level-num').textContent = level;
      if (levelTitle) levelTitle.textContent = tierInfo.title;
      document.getElementById('gamification-streak-days').textContent = `${data.current_streak || 0} Ngày`;
      document.getElementById('gamification-badges-unlocked').textContent = `${data.unlocked_count || 0} / ${data.total_count || 0}`;
      document.getElementById('gamification-completion-pct').textContent = `${data.completion_pct || 0}% hoàn thành`;

      // 2. Dynamic Banner Header Tier Styling based on User Level
      if (summaryBanner && iconBox && badgePill) {
        if (tierInfo.tierKey === 'START') {
          // Level 0: Tập sự (Khởi đầu)
          summaryBanner.className = 'glass-card p-6 rounded-3xl relative overflow-hidden border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shadow-lg transition-all duration-300';
          iconBox.className = 'w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-500 flex items-center justify-center text-2xl ring-4 ring-slate-700/40 shadow-md transition-all duration-300';
          iconBox.innerHTML = '<i class="fa-solid fa-shield text-slate-400"></i>';
          badgePill.className = 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-black text-[10px] shadow-sm transition-all';
          if (tierLabel) {
            tierLabel.className = 'px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold border border-slate-700';
            tierLabel.textContent = tierInfo.tierName;
          }
        } else if (tierInfo.tierKey === 'BRONZE' || tierInfo.tierKey === 'SILVER') {
          // Level 1-4: Hạng Đồng / Bạc
          summaryBanner.className = 'glass-card p-6 rounded-3xl relative overflow-hidden border border-amber-700/60 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 shadow-xl transition-all duration-300';
          iconBox.className = 'w-16 h-16 rounded-2xl bg-amber-900/40 border border-amber-600/40 text-amber-500 flex items-center justify-center text-2xl ring-4 ring-amber-600/40 shadow-md shadow-amber-950/40 transition-all duration-300';
          iconBox.innerHTML = tierInfo.tierKey === 'BRONZE' ? '<i class="fa-solid fa-shield text-amber-400"></i>' : '<i class="fa-solid fa-medal text-amber-400"></i>';
          badgePill.className = 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-400 border border-amber-600/40 font-black text-[10px] shadow-sm transition-all';
          if (tierLabel) {
            tierLabel.className = 'px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-400 text-[11px] font-bold border border-amber-600/40';
            tierLabel.textContent = tierInfo.tierName;
          }
        } else if (tierInfo.tierKey === 'GOLD') {
          // Level 5-6: Hạng Vàng
          summaryBanner.className = 'glass-card p-6 rounded-3xl relative overflow-hidden border border-yellow-500/70 bg-gradient-to-r from-slate-900 via-yellow-950/30 to-slate-900 shadow-xl transition-all duration-300';
          iconBox.className = 'w-16 h-16 rounded-2xl bg-yellow-900/40 border border-yellow-500/50 text-yellow-400 flex items-center justify-center text-2xl ring-4 ring-yellow-400/40 shadow-lg shadow-yellow-950/50 transition-all duration-300';
          iconBox.innerHTML = '<i class="fa-solid fa-trophy text-yellow-400"></i>';
          badgePill.className = 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 font-black text-[10px] shadow-sm transition-all';
          if (tierLabel) {
            tierLabel.className = 'px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[11px] font-bold border border-yellow-500/50';
            tierLabel.textContent = tierInfo.tierName;
          }
        } else if (tierInfo.tierKey === 'DIAMOND') {
          // Level 7-8: Hạng Kim Cương
          summaryBanner.className = 'glass-card p-6 rounded-3xl relative overflow-hidden border border-cyan-400/80 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-950 shadow-2xl transition-all duration-300';
          iconBox.className = 'w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 flex items-center justify-center text-2xl ring-4 ring-cyan-400/40 shadow-xl shadow-cyan-950/60 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-300';
          iconBox.innerHTML = '<i class="fa-solid fa-gem text-cyan-400"></i>';
          badgePill.className = 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-black text-[10px] shadow-sm transition-all';
          if (tierLabel) {
            tierLabel.className = 'px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-400/60';
            tierLabel.textContent = tierInfo.tierName;
          }
        } else {
          // Level 9-10: Hạng Huyền Thoại (Mythic)
          summaryBanner.className = 'glass-card p-6 rounded-3xl relative overflow-hidden border-2 border-fuchsia-500/90 bg-gradient-to-br from-purple-950/60 via-pink-950/40 to-slate-950 shadow-2xl shadow-fuchsia-950/80 ring-1 ring-pink-500/40 transition-all duration-300';
          iconBox.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 p-[1.5px] shadow-2xl shadow-fuchsia-950/80 ring-4 ring-pink-500/40 flex items-center justify-center transition-all duration-300';
          iconBox.innerHTML = `
            <div class="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
              <i class="fa-solid fa-crown text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300 text-2xl drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]"></i>
            </div>
          `;
          badgePill.className = 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black text-[10px] shadow-md shadow-pink-500/40 transition-all';
          if (tierLabel) {
            tierLabel.className = 'px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white text-[11px] font-black shadow-md shadow-pink-500/40';
            tierLabel.textContent = tierInfo.tierName;
          }
        }
      }

      // Format numbers with vietnamese dot separator (e.g. 3.200)
      const formatXPNum = (num) => (Math.round(num) || 0).toLocaleString('vi-VN');

      const xpBar = document.getElementById('gamification-xp-bar');
      const xpText = document.getElementById('gamification-xp-text');

      if (tierInfo.isMax) {
        if (xpBar) xpBar.style.width = '100%';
        if (xpText) xpText.textContent = `${formatXPNum(totalXP)} XP (Đạt Cấp Tối Đa)`;
      } else {
        const tierRange = tierInfo.nextXP - tierInfo.minXP;
        const progressInTier = totalXP - tierInfo.minXP;
        let progressPct = tierRange > 0 ? Math.max(0, Math.min(100, Math.round((progressInTier / tierRange) * 100))) : 0;
        if (isAdmin) progressPct = Math.max(progressPct, 95);
        if (xpBar) xpBar.style.width = `${progressPct}%`;
        if (xpText) xpText.textContent = `${formatXPNum(totalXP)} / ${formatXPNum(tierInfo.nextXP)} XP (${progressPct}%)`;
      }

      // Update Filter Counts
      document.getElementById('count-filter-all').textContent = data.total_count || 0;
      document.getElementById('count-filter-unlocked').textContent = data.unlocked_count || 0;
      document.getElementById('count-filter-locked').textContent = (data.total_count || 0) - (data.unlocked_count || 0);

      this.renderLevelRoadmap(level, totalXP);
      this.renderUpcomingShowcase();
      this.renderBadgesGrid();
    } catch (e) {
      console.error('[Badges] Load error:', e);
      if (isAdmin) {
        this.badgesData = this.getAdminMockBadgesData();
        this.renderBadgesGrid();
      } else {
        this.app.showToast('Không thể tải dữ liệu thành tích', 'error');
      }
    }
  }

  // Render Horizontal Level Milestones Road Map Bar
  renderLevelRoadmap(currentLevel, totalXP = 0) {
    const container = document.getElementById('gamification-roadmap');
    if (!container) return;

    // 6 Mốc Cấp Độ (Level Tiers) & Icon Tương Ứng
    const milestones = [
      {
        levelText: 'Lv.0',
        title: 'Khởi Đầu',
        xpText: '0 XP',
        minLevel: 0,
        requiredXP: 0,
        icon: 'fa-solid fa-seedling',
        activeIconStyle: 'bg-slate-800 border border-slate-600 text-emerald-400 shadow-sm shadow-emerald-500/20',
        activePill: 'bg-slate-800 text-emerald-300'
      },
      {
        levelText: 'Lv.1-2',
        title: 'Đồng',
        xpText: '300 XP',
        minLevel: 1,
        requiredXP: 300,
        icon: 'fa-solid fa-shield',
        activeIconStyle: 'bg-amber-900/50 border border-amber-600 text-amber-400 shadow-md shadow-amber-950/50',
        activePill: 'bg-amber-900/60 text-amber-300'
      },
      {
        levelText: 'Lv.3-4',
        title: 'Bạc',
        xpText: '800 XP',
        minLevel: 3,
        requiredXP: 800,
        icon: 'fa-solid fa-medal',
        activeIconStyle: 'bg-slate-700/60 border border-slate-400 text-slate-200 shadow-md shadow-slate-700/40',
        activePill: 'bg-slate-700/60 text-slate-200'
      },
      {
        levelText: 'Lv.5-6',
        title: 'Vàng',
        xpText: '1.500 XP',
        minLevel: 5,
        requiredXP: 1500,
        icon: 'fa-solid fa-trophy',
        activeIconStyle: 'bg-yellow-900/50 border border-yellow-400 text-yellow-300 shadow-md shadow-yellow-950/60',
        activePill: 'bg-yellow-500/20 text-yellow-300'
      },
      {
        levelText: 'Lv.7-8',
        title: 'Kim Cương',
        xpText: '3.000 XP',
        minLevel: 7,
        requiredXP: 3000,
        icon: 'fa-solid fa-gem',
        activeIconStyle: 'bg-cyan-950/70 border border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/70 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]',
        activePill: 'bg-cyan-500/20 text-cyan-300'
      },
      {
        levelText: 'Lv.9-10',
        title: 'Huyền Thoại',
        xpText: '5.000 XP',
        minLevel: 9,
        requiredXP: 5000,
        icon: 'fa-solid fa-crown',
        activeIconStyle: 'bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 text-white shadow-lg shadow-pink-500/40 border border-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]',
        activePill: 'bg-gradient-to-r from-pink-500 to-amber-500 text-white'
      }
    ];

    let html = '';
    milestones.forEach((m, idx) => {
      const isUnlocked = currentLevel >= m.minLevel || totalXP >= m.requiredXP;
      const isNextConnectUnlocked = idx < milestones.length - 1 && (currentLevel >= milestones[idx + 1].minLevel || totalXP >= milestones[idx + 1].requiredXP);

      html += `
        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          <!-- Milestone Card -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${isUnlocked ? 'bg-slate-900/80 border border-slate-800' : 'opacity-40 grayscale border-dashed border-slate-700 bg-slate-900/40'}">
            
            <!-- Icon with status badge -->
            <div class="relative flex-shrink-0">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${isUnlocked ? m.activeIconStyle : 'border border-slate-700 bg-slate-800 text-slate-500'}">
                <i class="${m.icon}"></i>
              </div>
              ${isUnlocked
                ? '<i class="fa-solid fa-circle-check text-[10px] text-emerald-400 absolute -top-1 -right-1 bg-slate-950 rounded-full"></i>'
                : '<i class="fa-solid fa-lock text-[10px] text-slate-500 absolute -top-1 -right-1 bg-slate-950 rounded-full"></i>'
              }
            </div>

            <!-- Texts -->
            <div class="flex flex-col leading-tight min-w-[65px]">
              <div class="flex items-center gap-1">
                <span class="text-[11px] font-black ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}">${m.title}</span>
                <span class="text-[9px] font-bold text-slate-400 font-mono">(${m.levelText})</span>
              </div>
              <span class="text-[9px] font-mono mt-0.5 ${isUnlocked ? 'text-amber-400 font-bold' : 'text-slate-500'}">${m.xpText}</span>
            </div>

          </div>

          <!-- Connecting Line between milestones -->
          ${idx < milestones.length - 1 ? `
            <div class="h-[2px] w-3 sm:w-5 flex-shrink-0 ${isNextConnectUnlocked ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-800'}"></div>
          ` : ''}

        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderUpcomingShowcase() {
    const container = document.getElementById('upcoming-badges-grid');
    if (!container || !this.badgesData) return;

    // Find locked badges sorted by progress percentage descending
    const lockedBadges = this.badgesData.badges
      .filter(b => !b.is_unlocked)
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3);

    if (lockedBadges.length === 0) {
      document.getElementById('upcoming-badges-showcase-section')?.classList.add('hidden');
      return;
    }

    container.innerHTML = lockedBadges.map(b => {
      const formatVal = (val, unit) => {
        if (unit === '₫') return formatVND(val);
        return `${val} ${unit}`;
      };

      return `
        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 flex flex-col justify-between hover:border-indigo-500/50 transition cursor-pointer group"
          onclick="window.openBadgeModal('${b.id}')">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                  <i class="${b.icon}"></i>
                </div>
                <span class="font-extrabold text-xs text-slate-100 group-hover:text-indigo-300 transition">${b.title}</span>
              </div>
              <span class="text-[10px] font-bold text-indigo-400 font-mono">${b.progress_pct}%</span>
            </div>
            <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${b.description}</p>
          </div>

          <div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${b.progress_pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span>Đạt: ${formatVal(b.current_val, b.unit)}</span>
              <span>Mục tiêu: ${formatVal(b.target_val, b.unit)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderBadgesGrid() {
    const grid = document.getElementById('badges-cards-grid');
    if (!grid || !this.badgesData) return;

    let badges = this.badgesData.badges;

    if (this.activeFilter === 'UNLOCKED') {
      badges = badges.filter(b => b.is_unlocked);
    } else if (this.activeFilter === 'LOCKED') {
      badges = badges.filter(b => !b.is_unlocked);
    } else if (this.activeFilter === 'STREAK') {
      badges = badges.filter(b => b.category === 'STREAK');
    } else if (this.activeFilter === 'SAVINGS') {
      badges = badges.filter(b => b.category === 'SAVINGS');
    } else if (this.activeFilter === 'MASTERY') {
      badges = badges.filter(b => b.category === 'MASTERY');
    }

    if (badges.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl">
          <i class="fa-solid fa-trophy text-3xl mb-2 text-slate-600 block"></i>
          Không có huy hiệu nào trong danh mục này.
        </div>
      `;
      return;
    }

    // 1. Phân Tầng Màu Sắc & Hiệu Ứng Theo 6 Cấp Độ (Tiers)
    const tierStyles = {
      'BRONZE': {
        cardBorder: 'border-amber-700/60 bg-gradient-to-br from-amber-950/40 to-slate-900 shadow-md shadow-amber-950/40',
        iconBox: 'bg-amber-900/40 border border-amber-600/40 text-amber-500',
        pill: 'bg-amber-900/60 text-amber-400 border border-amber-600/40',
        ring: 'ring-amber-600/40',
        glow: 'bg-amber-600/20'
      },
      'SILVER': {
        cardBorder: 'border-slate-400/60 bg-gradient-to-br from-slate-800/50 to-slate-900 shadow-md shadow-slate-700/30',
        iconBox: 'bg-slate-700/50 border border-slate-400/50 text-slate-200',
        pill: 'bg-slate-700/60 text-slate-200 border border-slate-400/50',
        ring: 'ring-slate-400/40',
        glow: 'bg-slate-400/20'
      },
      'GOLD': {
        cardBorder: 'border-yellow-500/70 bg-gradient-to-br from-yellow-950/40 to-slate-900 shadow-lg shadow-yellow-950/50',
        iconBox: 'bg-yellow-900/40 border border-yellow-500/50 text-yellow-400',
        pill: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
        ring: 'ring-amber-400/40',
        glow: 'bg-amber-500/25'
      },
      'DIAMOND': {
        cardBorder: 'border-cyan-400/80 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 shadow-xl shadow-cyan-950/60',
        iconBox: 'bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
        pill: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60',
        ring: 'ring-cyan-400/40',
        glow: 'bg-cyan-500/25'
      },
      'MYTHIC': {
        cardBorder: 'border-2 border-fuchsia-500/90 bg-gradient-to-br from-purple-950/60 via-pink-950/40 to-slate-950 shadow-2xl shadow-fuchsia-950/80 ring-1 ring-pink-500/40',
        iconBox: 'bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 text-white drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] border border-pink-300/60 shadow-lg shadow-pink-500/30',
        pill: 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black shadow-md shadow-pink-500/40',
        ring: 'ring-pink-500/40',
        glow: 'bg-purple-500/30'
      }
    };

    grid.innerHTML = badges.map(b => {
      const isUnlocked = b.is_unlocked;
      const tier = (b.tier || 'BRONZE').toUpperCase();
      const style = tierStyles[tier] || tierStyles['BRONZE'];

      // Cấp 0 / Chưa mở khóa (Locked / Level 0)
      const cardContainerClass = isUnlocked
        ? style.cardBorder
        : 'bg-slate-800/80 border border-slate-700/60 text-slate-500 shadow-md shadow-slate-950/40';

      const iconBoxClass = isUnlocked
        ? style.iconBox
        : 'bg-slate-800/90 border border-slate-700/60 text-slate-500';

      const pillClass = isUnlocked
        ? style.pill
        : 'bg-slate-800 text-slate-400 border border-slate-700';

      const formatVal = (val, unit) => {
        if (unit === '₫') return formatVND(val);
        return `${val} ${unit}`;
      };

      return `
        <div class="glass-card badge-card p-5 rounded-3xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${cardContainerClass} ${isUnlocked ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-75 hover:opacity-100 hover:scale-[1.01] cursor-pointer'}"
          onclick="window.openBadgeModal('${b.id}')">
          
          <!-- Top Row: Icon & Tier Badge & Status -->
          <div>
            <div class="flex items-start justify-between mb-3.5">
              
              <!-- Badge Icon Box -->
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${iconBoxClass}">
                <i class="${b.icon}"></i>
              </div>

              <!-- Status Badge & Tier Pill -->
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${pillClass}">
                  ${b.tier_name || tier}
                </span>

                ${isUnlocked 
                  ? `<span class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30" title="Đã mở khóa">
                      <i class="fa-solid fa-check text-xs"></i>
                    </span>`
                  : `<span class="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700" title="Chưa mở khóa - Click để xem cách đạt">
                      <i class="fa-solid fa-lock text-[11px]"></i>
                    </span>`
                }
              </div>

            </div>

            <!-- Title & Description -->
            <h4 class="badge-title text-sm font-black text-slate-100 mb-1 flex items-center gap-1.5">
              <span>${b.title}</span>
              ${isUnlocked && (tier === 'GOLD' || tier === 'MYTHIC' || tier === 'DIAMOND') ? '<span class="text-amber-400 text-xs">✨</span>' : ''}
            </h4>
            <p class="gamification-desc text-xs text-slate-400 leading-relaxed min-h-[36px]">
              ${b.description}
            </p>
          </div>

          <!-- Bottom Row: Progress or Unlock Date -->
          <div class="pt-3 mt-3 border-t border-slate-800/80">
            ${isUnlocked 
              ? `
                <div class="flex items-center justify-between text-[11px]">
                  <span class="badge-status-text text-emerald-400 font-bold flex items-center gap-1">
                    <i class="fa-solid fa-circle-check"></i> Đã Mở Khóa
                  </span>
                  <span class="badge-unlocked-date text-slate-300 font-mono text-[11px]">${b.unlocked_at ? `Đạt: ${b.unlocked_at}` : 'Hoàn thành'}</span>
                </div>
              `
              : `
                <div>
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Tiến độ: ${formatVal(b.current_val, b.unit)}</span>
                    <span class="font-mono text-slate-300">Mục tiêu: ${formatVal(b.target_val, b.unit)} (${b.progress_pct}%)</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                    <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${b.progress_pct}%"></div>
                  </div>
                </div>
              `
            }
          </div>

        </div>
      `;
    }).join('');

    // Global modal handler
    window.openBadgeModal = (badgeId) => this.showBadgeDetailModal(badgeId);
  }

  showBadgeDetailModal(badgeId) {
    if (!this.badgesData) return;

    // Luôn đồng bộ dữ liệu tài sản mới nhất trước khi hiển thị modal
    this.syncAssetBadgesWithLiveNetWorth(this.getLiveNetWorth());

    const badge = this.badgesData.badges.find(b => b.id === badgeId);
    if (!badge) return;

    this.currentlyViewingBadgeId = badgeId;

    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const isUnlocked = badge.is_unlocked;
    const tier = (badge.tier || 'BRONZE').toUpperCase();
    const formatVal = (val, unit) => {
      if (unit === '₫') return formatVND(val);
      return `${val} ${unit}`;
    };

    const tierModalStyles = {
      'BRONZE': {
        iconBox: 'bg-amber-900/40 border border-amber-600/40 text-amber-500',
        ring: 'ring-amber-600/40',
        pill: 'bg-amber-900/60 text-amber-400 border border-amber-600/40',
        glow: 'bg-amber-600/20'
      },
      'SILVER': {
        iconBox: 'bg-slate-700/50 border border-slate-400/50 text-slate-200',
        ring: 'ring-slate-400/40',
        pill: 'bg-slate-700/60 text-slate-200 border border-slate-400/50',
        glow: 'bg-slate-400/20'
      },
      'GOLD': {
        iconBox: 'bg-yellow-900/40 border border-yellow-500/50 text-yellow-400',
        ring: 'ring-yellow-400/50',
        pill: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
        glow: 'bg-yellow-500/25'
      },
      'DIAMOND': {
        iconBox: 'bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
        ring: 'ring-cyan-400/50',
        pill: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60',
        glow: 'bg-cyan-500/25'
      },
      'MYTHIC': {
        iconBox: 'bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 text-white drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] border border-pink-300/60 shadow-lg shadow-pink-500/30',
        ring: 'ring-pink-500/50',
        pill: 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black shadow-md shadow-pink-500/40',
        glow: 'bg-purple-500/30'
      }
    };

    const style = tierModalStyles[tier] || tierModalStyles['BRONZE'];

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
          
          <!-- Background Ambient Glow -->
          <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full ${isUnlocked ? style.glow : 'bg-slate-700/15'} blur-2xl pointer-events-none"></div>

          <!-- Close Button -->
          <button id="badge-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <!-- Badge Icon in Large Box with Status Corner -->
          <div class="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-xl ring-4 relative ${isUnlocked ? `${style.iconBox} ${style.ring}` : 'bg-slate-800 text-slate-500 ring-slate-700/50 border border-slate-700'}">
            <i class="${badge.icon}"></i>
            ${isUnlocked 
              ? `<span class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 absolute -bottom-1 -right-1 border-2 border-slate-900" title="Đã mở khóa">
                  <i class="fa-solid fa-check text-xs"></i>
                </span>`
              : `<span class="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center absolute -bottom-1 -right-1 border-2 border-slate-900" title="Chưa mở khóa">
                  <i class="fa-solid fa-lock text-[10px]"></i>
                </span>`
            }
          </div>

          <!-- Status & Tier Pill Row -->
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isUnlocked ? style.pill : 'bg-slate-800 text-slate-400 border border-slate-700'}">
              <span>Bậc ${badge.tier_name || tier}</span> &bull; <span>${badge.category}</span>
            </span>
            ${isUnlocked 
              ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <i class="fa-solid fa-circle-check text-emerald-400"></i> Đã Mở Khóa
                </span>`
              : `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <i class="fa-solid fa-lock text-[10px]"></i> Đang Tích Lũy
                </span>`
            }
          </div>

          <!-- Title & Description -->
          <h2 class="text-xl font-black text-slate-100 mb-1.5">${badge.title}</h2>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">${badge.description}</p>

          <!-- Progress / Unlock Box -->
          <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left mb-4">
            <div class="flex items-center justify-between text-xs font-bold mb-2">
              <span class="text-slate-300 flex items-center gap-1.5">
                <i class="fa-solid fa-crosshairs ${isUnlocked ? 'text-emerald-400' : 'text-indigo-400'}"></i>
                <span>Điều kiện hoàn thành:</span>
              </span>
              <span class="font-mono ${isUnlocked ? 'text-emerald-400 font-black' : 'text-indigo-400 font-black'}">
                ${isUnlocked ? '100% (Đạt)' : `${badge.progress_pct}%`}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2 border border-slate-700/60">
              <div class="h-full ${isUnlocked ? 'gradient-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'} rounded-full transition-all duration-700" style="width: ${badge.progress_pct}%"></div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Hiện tại: <b class="${isUnlocked ? 'text-emerald-300 font-bold' : 'text-slate-200 font-bold'}">${formatVal(badge.current_val, badge.unit)}</b></span>
              <span>Mục tiêu: <b class="text-indigo-300 font-bold">${formatVal(badge.target_val, badge.unit)}</b></span>
            </div>

            ${isUnlocked ? `
              <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>Huy hiệu đã mở khóa thành công!</span>
                </span>
                <span class="text-slate-400 font-mono text-[11px]">${badge.unlocked_at ? `Đạt ngày: ${badge.unlocked_at}` : 'Hoàn thành xuất sắc'}</span>
              </div>
            ` : (badge.unlock_hint ? `
              <div class="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5 flex-shrink-0"></i>
                <span><b>Gợi ý mở khóa:</b> ${badge.unlock_hint}</span>
              </div>
            ` : '')}
          </div>

          <!-- Action Button -->
          <div class="flex items-center gap-2">
            <button type="button" id="badge-modal-dismiss" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">
              Đóng
            </button>
            ${!isUnlocked && badge.target_tab ? `
              <button type="button" id="badge-modal-action" class="btn-sparkle-burst flex-1 py-2.5 rounded-xl gradient-emerald text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Thực hiện ngay</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    const closeModal = () => {
      this.currentlyViewingBadgeId = null;
      modalEl.innerHTML = '';
      modalEl.classList.add('hidden', 'pointer-events-none');
      modalEl.classList.remove('pointer-events-auto');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    };

    document.getElementById('badge-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('badge-modal-dismiss')?.addEventListener('click', closeModal);
    document.getElementById('badge-modal-action')?.addEventListener('click', () => {
      closeModal();
      if (badge.target_tab) {
        this.app.navigate(badge.target_tab);
      }
    });

    // Close when clicking background backdrop
    modalEl.querySelector('.fixed.inset-0')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });
  }
}
