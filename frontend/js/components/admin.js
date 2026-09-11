import { api } from '../api.js?v=20260904_14';
import { formatVND } from '../utils/formatters.js?v=20260904_14';
import { getSubscriptionPlanBadgeHtml } from '../theme_mapping.js?v=20260906_01';

export class AdminComponent {
  constructor(app) {
    this.app = app;
    this.activeAdminTab = 'admin_dashboard';
    
    // Subtab filter states
    this.activeDashboardFilter = 'dash_month';
    this.activeUserFilter = 'users_all';
    this.activeOrdersFilter = 'orders_all';
    this.activeTicketsFilter = 'tickets_all';
    this.activeAIFilter = 'ai_stats';
    this.activeCatFilter = 'cat_all';
    this.activeLogsFilter = 'logs_all';
    this.activeSettingsFilter = 'settings_broadcast';

    // Data Cache
    this.dashboardData = null;
    this.usersData = [];
    this.ordersData = [];
    this.ticketsData = [];
    this.aiConfigData = null;
    this.masterData = null;
    this.billingData = null;
    this.logsData = [];
    this.settingsData = null;
    this.growthChart = null;
    this.planChart = null;
    this.revenueChart = null;
    window.fintrackAdmin = this;
  }

  async render(container, specificTab = 'admin_dashboard') {
    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isRootAdmin = role === 'ADMIN';
    const isModerator = role === 'MODERATOR';

    // Moderator guard for restricted tabs
    let targetTab = specificTab;
    if (isModerator && (targetTab === 'admin_ai' || targetTab === 'admin_settings')) {
      this.app?.showToast('Quyền hạn bị từ chối: Moderator không có quyền truy cập tab này!', 'warning');
      targetTab = 'admin_dashboard';
    }
    this.activeAdminTab = targetTab;

    container.innerHTML = `
      <div class="space-y-5 animate-in fade-in duration-300">
        
        <!-- Admin Cyber Command Header / Cockpit Bar -->
        <div id="admin-cockpit-banner" class="admin-cockpit-banner relative rounded-3xl p-6 overflow-hidden border ${isRootAdmin ? 'border-rose-500/30' : 'border-purple-500/30'} shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#120818]">
          <!-- High-tech backdrop grid & glow circles -->
          <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full ${isRootAdmin ? 'bg-rose-600/15' : 'bg-purple-600/15'} blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none"></div>
          <div class="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent ${isRootAdmin ? 'via-rose-500/50' : 'via-purple-500/50'} to-transparent"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Left Info -->
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr ${isRootAdmin ? 'from-rose-600 via-pink-600 to-amber-500 shadow-rose-500/30 ring-rose-500/20' : 'from-purple-600 via-indigo-600 to-pink-500 shadow-purple-500/30 ring-purple-500/20'} text-white flex items-center justify-center text-2xl shadow-xl ring-4 flex-shrink-0 animate-pulse">
                <i class="fa-solid ${isRootAdmin ? 'fa-shield-halved' : 'fa-user-shield'}"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <span>FINTRACK</span>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r ${isRootAdmin ? 'from-rose-400 to-amber-400' : 'from-purple-400 to-pink-400'}">
                      ${isRootAdmin ? 'CONTROL CENTER' : 'MODERATOR CONSOLE'}
                    </span>
                  </h1>
                  ${isRootAdmin ? `
                    <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span> Root Admin
                    </span>
                  ` : `
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span> Moderator (Quản Trị Viên Phụ)
                    </span>
                  `}
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  ${isRootAdmin 
                    ? 'Trung tâm điều hành tối cao &bull; Toàn quyền quản trị người dùng, mô hình AI, cấu hình dữ liệu & bảo mật hệ thống'
                    : 'Bảng điều khiển Quản trị viên phụ &bull; Quản lý người dùng, danh mục mẫu, gửi thông báo & xem nhật ký hoạt động (Read-only)'}
                </p>
              </div>
            </div>

            <!-- Right Status Cockpit Badges & Switch Button -->
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Live Server Status Badge -->
              <div class="hidden sm:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] shadow-inner font-mono">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-slate-400">Server:</span>
                <span class="text-emerald-400 font-bold">ONLINE (99.98%)</span>
              </div>

              <!-- AI Status Badge (Only Root Admin can see AI badge) -->
              ${isRootAdmin ? `
                <div class="hidden md:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] shadow-inner font-mono">
                  <i class="fa-solid fa-brain text-indigo-400 text-xs"></i>
                  <span class="text-slate-400">AI Engine:</span>
                  <span class="text-indigo-300 font-bold">Gemini 1.5 Pro</span>
                </div>
              ` : `
                <div class="hidden md:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-purple-800/40 text-[11px] shadow-inner font-mono">
                  <i class="fa-solid fa-shield text-purple-400 text-xs"></i>
                  <span class="text-slate-400">Vai Trò:</span>
                  <span class="text-purple-300 font-bold">Moderator Phụ</span>
                </div>
              `}

              <!-- Exit to User Mode Button (PRESERVED) -->
              <button id="btn-admin-exit-user-mode" class="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 active:scale-95 transition flex items-center gap-2 shadow-md hover:border-emerald-500/50">
                <i class="fa-solid fa-arrow-right-from-bracket text-emerald-400"></i>
                <span>Về Chế Độ Cá Nhân</span>
              </button>
            </div>
          </div>
        </div>

        <!-- DYNAMIC CONTEXTUAL HORIZONTAL SUB-TABS COMMAND TOOLBAR -->
        <div class="admin-subtab-bar p-1.5 rounded-2xl shadow-xl transition-all duration-300" id="admin-dynamic-subtabs">
          <!-- Dynamically populated by renderAdminSubTabs() -->
        </div>

        <!-- Dynamic Admin Content View Container -->
        <div id="admin-view-body" class="min-h-[500px]">
          <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
            <i class="fa-solid fa-spinner fa-spin text-xl text-rose-500 mb-2 block"></i>
            Đang đồng bộ dữ liệu quản trị hệ thống...
          </div>
        </div>

      </div>
    `;

    document.getElementById('btn-admin-exit-user-mode')?.addEventListener('click', () => {
      this.app.navigate('dashboard');
    });

    // Render Sub-tabs and initial tab content
    this.renderAdminSubTabs(this.activeAdminTab);
    await this.renderCurrentTabContent();
  }

  // =========================================================================
  // HORIZONTAL SUB-TABS GENERATOR & TITLE SYNCHRONIZATION
  // =========================================================================
  renderAdminSubTabs(activeSection) {
    const section = activeSection || this.activeAdminTab || 'admin_dashboard';
    this.activeAdminTab = section;

    const toolbar = document.getElementById('admin-dynamic-subtabs') || document.getElementById('admin-dynamic-subtabs-toolbar');
    if (!toolbar) return;

    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    let subtabs = [];
    let currentActiveSubtab = '';
    let sectionMeta = {
      title: '1. TỔNG QUAN HỆ THỐNG',
      icon: 'fa-chart-line text-rose-400',
      color: 'from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/30'
    };

    switch (section) {
      // 1. Tổng Quan Hệ Thống (Dashboard / Overview) - Root: 1, Mod: 1
      case 'admin_dashboard':
      case 'dashboard':
      case 'overview':
        sectionMeta = {
          title: '1. TỔNG QUAN HỆ THỐNG',
          icon: 'fa-chart-pie text-rose-400',
          color: 'from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/30'
        };
        currentActiveSubtab = this.activeDashboardFilter || 'dash_month';
        subtabs = [
          { id: 'dash_today', icon: 'fa-chart-pie text-blue-400', label: '📊 Hôm nay', desc: 'Xem realtime người dùng online, token AI trong ngày' },
          { id: 'dash_7days', icon: 'fa-calendar-week text-indigo-400', label: '📅 7 Ngày qua', desc: 'Xem xu hướng tuần' },
          { id: 'dash_month', icon: 'fa-chart-line text-rose-400', label: '📈 Tháng này', desc: 'Xem tổng doanh thu, biểu đồ DAU/MAU tháng' },
          { id: 'dash_quarter_year', icon: 'fa-calendar-days text-amber-400', label: '🗓️ Quý / Năm', desc: 'Tổng kết chu kỳ dài hạn' },
          { id: 'dash_export', icon: 'fa-file-arrow-down text-emerald-400', label: '📥 Xuất Báo Cáo', desc: 'Tải snapshot thống kê dạng Excel/PDF', isAction: true }
        ];
        break;

      // 2. Quản Lý Người Dùng (Users) - Root: 2, Mod: 2
      case 'admin_users':
      case 'users':
      case 'user':
        sectionMeta = {
          title: '2. QUẢN LÝ NGƯỜI DÙNG',
          icon: 'fa-users-gear text-blue-400',
          color: 'from-blue-500/20 to-indigo-500/10 text-blue-300 border-blue-500/30'
        };
        currentActiveSubtab = this.activeUserFilter || 'users_all';
        subtabs = [
          { id: 'users_all', icon: 'fa-users text-blue-400', label: '👥 Tất cả' },
          { id: 'users_active', icon: 'fa-circle-check text-emerald-400', label: '🟢 Hoạt động' },
          { id: 'users_locked', icon: 'fa-lock text-rose-400', label: '🔒 Bị khóa' },
          { id: 'users_paid', icon: 'fa-star text-amber-300', label: '⭐ Gói Pro/VIP' },
          { id: 'users_admins', icon: 'fa-shield-halved text-purple-400', label: '🛡️ Danh sách Admin' }
        ];
        break;

      // 3. Quản Lý Nạp & Gói Cước (Billing & Subscriptions) - Root: 3, Mod: 3
      case 'admin_subscriptions':
      case 'admin_billing':
      case 'subscriptions':
      case 'billing':
        sectionMeta = {
          title: '3. QUẢN LÝ NẠP & GÓI CƯỚC',
          icon: 'fa-credit-card text-emerald-400',
          color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30'
        };
        currentActiveSubtab = this.activeOrdersFilter || 'orders_all';
        subtabs = [
          { id: 'orders_all', icon: 'fa-layer-group text-slate-300', label: '📋 Tất Cả Đơn' },
          { id: 'orders_pending', icon: 'fa-triangle-exclamation text-amber-400', label: '⚠️ Cần Đối Soát (Chờ Duyệt)' },
          { id: 'orders_approved', icon: 'fa-circle-check text-emerald-400', label: '✅ Đã Phê Duyệt' },
          { id: 'orders_rejected', icon: 'fa-circle-xmark text-rose-400', label: '❌ Đã Từ Chối' },
          { id: 'orders_export_csv', icon: 'fa-file-excel text-teal-300', label: '📥 Xuất CSV', isAction: true }
        ];
        break;

      // 4. Cổng Ngân Hàng & VietQR (Bank Gateway & VietQR)
      case 'admin_bank_gateway':
      case 'bank_gateway':
      case 'admin_bank':
        sectionMeta = {
          title: 'CỔNG NGÂN HÀNG & VIETQR',
          icon: 'fa-building-columns text-amber-400',
          color: 'from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/30'
        };
        currentActiveSubtab = this.activeBankGatewayFilter || 'bank_config';
        subtabs = [
          { id: 'bank_config', icon: 'fa-qrcode text-amber-400', label: '💳 Cấu Hình Cổng Thụ Hưởng' },
          { id: 'bank_txs', icon: 'fa-clock-rotate-left text-cyan-400', label: '📊 Biến Động Số Dư & Lịch Sử' },
          { id: 'bank_automation', icon: 'fa-robot text-emerald-400', label: '🤖 Cú Pháp & Tự Động Duyệt' }
        ];
        break;

      // 4. Quản Trị AI & Token (AI & Engine) - Root: 4 (Moderator Hidden)
      case 'admin_ai':
      case 'ai':
      case 'ai_management':
        sectionMeta = {
          title: '4. QUẢN TRỊ AI & TOKEN',
          icon: 'fa-brain text-indigo-400',
          color: 'from-indigo-500/20 to-purple-500/10 text-indigo-300 border-indigo-500/30'
        };
        currentActiveSubtab = this.activeAIFilter || 'ai_stats';
        subtabs = [
          { id: 'ai_stats', icon: 'fa-bolt text-amber-300', label: '⚡ Thống kê Token' },
          { id: 'ai_parser', icon: 'fa-file-lines text-indigo-400', label: '📝 Prompt Parser' },
          { id: 'ai_advisor', icon: 'fa-brain text-purple-400', label: '🧠 Prompt Cố Vấn' },
          { id: 'ai_engine', icon: 'fa-gear text-cyan-400', label: '⚙️ Cấu hình Model' },
          { id: 'ai_limits', icon: 'fa-stopwatch text-rose-400', label: '⏱️ Hạn mức gọi' }
        ];
        break;

      // 5. Danh Mục Mặc Định & Mẫu Chuẩn (Master Data) - Root: 5, Mod: 4
      case 'admin_master_data':
      case 'master_data':
      case 'categories':
        sectionMeta = {
          title: isModerator ? '4. DANH MỤC & MẪU CHUẨN' : '5. DANH MỤC & MẪU CHUẨN',
          icon: 'fa-layer-group text-amber-400',
          color: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30'
        };
        currentActiveSubtab = this.activeCatFilter || 'cat_all';
        subtabs = [
          { id: 'cat_all', icon: 'fa-folder-open text-amber-400', label: '📂 Tất cả Danh mục' },
          { id: 'cat_needs', icon: 'fa-house text-rose-400', label: '🏠 Nhu cầu Thiết yếu (50%)' },
          { id: 'cat_wants', icon: 'fa-gamepad text-purple-400', label: '🎮 Mong muốn (30%)' },
          { id: 'cat_savings', icon: 'fa-piggy-bank text-emerald-400', label: '💰 Tiết kiệm & Đầu tư (20%)' },
          { id: 'cat_income', icon: 'fa-money-bill-wave text-teal-400', label: '💵 Nguồn Thu nhập' }
        ];
        break;

      // 6. Nhật Ký Hệ Thống (Audit Logs) - Root: 6, Mod: 5
      case 'admin_logs':
      case 'logs':
      case 'audit_logs':
        sectionMeta = {
          title: isModerator ? '5. NHẬT KÝ HỆ THỐNG' : '6. NHẬT KÝ HỆ THỐNG (AUDIT LOGS)',
          icon: 'fa-clock-rotate-left text-cyan-400',
          color: 'from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/30'
        };
        currentActiveSubtab = this.activeLogsFilter || 'logs_all';
        subtabs = [
          { id: 'logs_all', icon: 'fa-file-lines text-cyan-400', label: '📑 Tất cả' },
          { id: 'logs_security', icon: 'fa-shield-halved text-rose-400', label: '🚨 Bảo mật' },
          { id: 'logs_ai', icon: 'fa-robot text-indigo-400', label: '🤖 Gọi AI API' },
          { id: 'logs_data', icon: 'fa-arrows-rotate text-blue-400', label: '🔄 Đổi dữ liệu' },
          { id: 'logs_error', icon: 'fa-circle-xmark text-red-400', label: '❌ Lỗi hệ thống' }
        ];
        break;

      // 7. Phát & Quản Lý Thông Báo Hệ Thống (Notifications Center) - Root: 7, Mod: 6
      case 'admin_notifications':
      case 'notifications':
      case 'broadcast':
        sectionMeta = {
          title: isModerator ? '6. PHÁT & QUẢN LÝ THÔNG BÁO' : '7. PHÁT & QUẢN LÝ THÔNG BÁO',
          icon: 'fa-bullhorn text-pink-400',
          color: 'from-pink-500/20 to-rose-500/10 text-pink-300 border-pink-500/30'
        };
        currentActiveSubtab = this.activeNotifFilter || 'notif_all';
        subtabs = [
          { id: 'notif_all', icon: 'fa-layer-group text-pink-400', label: '📢 Tất Cả Thông Báo' },
          { id: 'notif_broadcast', icon: 'fa-globe text-teal-400', label: '🌐 Tin Toàn Sàn' },
          { id: 'notif_vip', icon: 'fa-crown text-amber-400', label: '👑 Gói VIP & Pro' },
          { id: 'notif_personal', icon: 'fa-lock text-purple-400', label: '📩 Tin Nhắn Riêng' },
          { id: 'notif_create_box', icon: 'fa-paper-plane text-emerald-400', label: '✍️ Soạn Tin Mới' }
        ];
        break;

      // 8. Trung Tâm Hỗ Trợ & Khiếu Nại (Support Tickets) - Root: 8, Mod: 7
      case 'admin_support':
      case 'support':
      case 'tickets':
        sectionMeta = {
          title: isModerator ? '7. HỖ TRỢ & KHIẾU NẠI' : '8. HỖ TRỢ & KHIẾU NẠI',
          icon: 'fa-headset text-teal-400',
          color: 'from-teal-500/20 to-cyan-500/10 text-teal-300 border-teal-500/30'
        };
        currentActiveSubtab = this.activeTicketsFilter || 'tickets_all';
        subtabs = [
          { id: 'tickets_all', icon: 'fa-inbox text-teal-400', label: '📩 Tất Cả Ticket' },
          { id: 'tickets_open', icon: 'fa-circle-exclamation text-rose-400', label: '🔴 Chờ Phản Hồi' },
          { id: 'tickets_progress', icon: 'fa-spinner text-amber-400', label: '🟡 Đang Xử Lý' },
          { id: 'tickets_resolved', icon: 'fa-circle-check text-emerald-400', label: '🟢 Đã Giải Quyết' }
        ];
        break;

      // 9. Cài Đặt Hệ Thống (Settings) - Root: 9 (Moderator Hidden)
      case 'admin_settings':
      case 'settings':
        sectionMeta = {
          title: '9. CÀI ĐẶT HỆ THỐNG',
          icon: 'fa-sliders text-purple-400',
          color: 'from-purple-500/20 to-indigo-500/10 text-purple-300 border-purple-500/30'
        };
        currentActiveSubtab = this.activeSettingsFilter || 'settings_gateway';
        subtabs = [
          { id: 'settings_gateway', icon: 'fa-qrcode text-amber-400', label: '💳 Cổng VietQR Admin', desc: 'Cấu hình STK ngân hàng thụ hưởng nhận tiền nạp tự động' },
          { id: 'settings_broadcast', icon: 'fa-bullhorn text-rose-400', label: '📢 Phát Thông Báo', desc: 'Gửi thông báo toàn sàn' },
          { id: 'settings_smtp', icon: 'fa-envelope text-blue-400', label: '📧 Cấu hình Mail (SMTP)', desc: 'Cổng gửi email hệ thống' },
          { id: 'settings_backup', icon: 'fa-database text-teal-400', label: '💾 Sao Lưu Database', desc: 'Sao lưu và phục hồi dữ liệu' },
          { id: 'settings_security', icon: 'fa-key text-amber-400', label: '🔐 Khóa API & Bảo Mật', desc: 'Cấu hình bảo mật hệ thống' }
        ];
        break;

      default:
        subtabs = [];
    }

    toolbar.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1.5">
        
        <!-- Active Section Indicator Badge -->
        <div class="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r ${sectionMeta.color} border text-xs font-black flex-shrink-0 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
          <i class="fa-solid ${sectionMeta.icon} text-sm"></i>
          <span class="tracking-wide uppercase font-mono">${sectionMeta.title}</span>
        </div>

        <!-- Dynamic Contextual Sub-tabs list -->
        <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-1 justify-start lg:justify-end">
          ${subtabs.map(tab => {
            const isActive = tab.id === currentActiveSubtab;
            return `
              <button type="button" 
                class="admin-subtab-pill flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${isActive ? 'active' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}" 
                data-subtab="${tab.id}" 
                title="${tab.desc || tab.label}">
                <i class="fa-solid ${tab.icon} text-xs"></i>
                <span>${tab.label}</span>
              </button>
            `;
          }).join('')}
        </div>

      </div>
    `;

    // Bind sub-tab click events
    toolbar.querySelectorAll('.admin-subtab-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const subtabId = btn.getAttribute('data-subtab');
        this.handleSubTabClick(subtabId);
      });
    });
  }

  // Alias for backward compatibility
  renderSubTabsBar(activeSection) {
    this.renderAdminSubTabs(activeSection || this.activeAdminTab);
  }

  handleSubTabClick(subtabId) {
    switch (this.activeAdminTab) {
      case 'admin_dashboard':
      case 'dashboard':
      case 'overview':
        if (subtabId === 'dash_export') {
          this.openComprehensiveReportModal();
          return;
        }
        this.activeDashboardFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyDashboardFilter(subtabId);
        break;

      case 'admin_users':
      case 'users':
      case 'user':
        this.activeUserFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyUserFilter(subtabId);
        break;

      case 'admin_ai':
      case 'ai':
      case 'ai_management':
        this.activeAIFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyAIFilter(subtabId);
        break;

      case 'admin_master_data':
      case 'master_data':
      case 'categories':
        this.activeCatFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyMasterDataFilter(subtabId);
        break;

      case 'admin_logs':
      case 'logs':
      case 'audit_logs':
        this.activeLogsFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyLogsFilter(subtabId);
        break;

      case 'admin_notifications':
      case 'notifications':
      case 'broadcast':
        this.activeNotifFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyNotificationsFilter(subtabId);
        break;

      case 'admin_settings':
      case 'settings':
        this.activeSettingsFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applySettingsFilter(subtabId);
        break;

      case 'admin_subscriptions':
      case 'subscriptions':
      case 'billing':
        this.activeOrdersFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyOrdersFilter(subtabId);
        break;

      case 'admin_support':
      case 'support':
      case 'tickets':
        this.activeTicketsFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyTicketsFilter(subtabId);
        break;

      case 'admin_bank_gateway':
      case 'bank_gateway':
      case 'admin_bank':
        this.activeBankGatewayFilter = subtabId;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.applyBankGatewayFilter(subtabId);
        break;
    }
  }

  async switchTab(tab) {
    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    let targetTab = tab;
    if (isModerator && (targetTab === 'admin_ai' || targetTab === 'admin_settings')) {
      this.app?.showToast('Quyền hạn bị từ chối: Moderator không có quyền truy cập tab này!', 'warning');
      targetTab = 'admin_dashboard';
    }

    this.activeAdminTab = targetTab;
    if (this.app) this.app.activeTab = targetTab;

    // Update left sidebar active state
    document.querySelectorAll('#sidebar-admin-nav .nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Re-generate horizontal contextual sub-tabs
    this.renderAdminSubTabs(targetTab);
    await this.renderCurrentTabContent();
  }

  async renderCurrentTabContent() {
    const container = document.getElementById('admin-view-body');
    if (!container) return;

    container.className = 'min-h-[500px] admin-subtab-content-anim';

    switch (this.activeAdminTab) {
      case 'admin_dashboard':
        await this.renderDashboardTab(container);
        break;
      case 'admin_users':
        await this.renderUsersTab(container);
        break;
      case 'admin_subscriptions':
      case 'subscriptions':
      case 'billing':
        await this.renderSubscriptionsTab(container);
        break;
      case 'admin_bank_gateway':
      case 'bank_gateway':
      case 'admin_bank':
        await this.renderBankGatewayTab(container);
        break;
      case 'admin_support':
      case 'support':
      case 'tickets':
        await this.renderSupportTicketsTab(container);
        break;
      case 'admin_ai':
        await this.renderAIManagementTab(container);
        break;
      case 'admin_master_data':
        await this.renderMasterDataTab(container);
        break;
      case 'admin_logs':
        await this.renderLogsTab(container);
        break;
      case 'admin_notifications':
        await this.renderAdminNotificationsTab(container);
        break;
      case 'admin_settings':
        await this.renderSettingsTab(container);
        break;
      default:
        await this.renderDashboardTab(container);
    }
  }

  destroyCharts() {
    if (this.growthChart) {
      try { this.growthChart.destroy(); } catch (e) {}
      this.growthChart = null;
    }
    if (this.planChart) {
      try { this.planChart.destroy(); } catch (e) {}
      this.planChart = null;
    }
  }

  onThemeChanged(isLight) {
    if (this.growthChart || this.planChart) {
      if (this.dashboardData) {
        this.renderGrowthChart(this.dashboardData.user_growth || []);
        this.renderPlanDonutChart(this.dashboardData.plan_distribution || null);
      }
    }
  }

  // =========================================================================
  // 1. DASHBOARD TAB & TIMEFRAME FILTERING
  // =========================================================================
  async renderDashboardTab(container) {
    this.destroyCharts();
    container.innerHTML = `<div class="py-16 text-center text-slate-500 text-xs animate-pulse">Đang tải tổng quan hệ thống...</div>`;

    try {
      const data = await api.getAdminDashboard();
      this.dashboardData = data;
      this.renderDashboardContent(container);
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs glass-card rounded-2xl">Lỗi khi tải Dashboard Admin: ${e.message}</div>`;
    }
  }

  renderDashboardContent(container) {
    if (!this.dashboardData) return;
    const data = this.dashboardData;
    const k = data.kpis;
    const growth = data.user_growth || [];
    const plans = data.plan_distribution || { labels: [], counts: [], colors: [] };

    // Dynamic label depending on active cycle filter
    let cycleBadge = '📈 Chu kỳ: Tháng Này (Mặc Định)';
    let mrrMultiplier = 1;
    let tokensDisplay = k.ai_tokens_count.toLocaleString();
    let callsDisplay = k.ai_calls_count.toLocaleString();

    if (this.activeDashboardFilter === 'dash_today') {
      cycleBadge = '📊 Chu kỳ: Hôm Nay (Realtime 24h)';
      tokensDisplay = Math.round(k.ai_tokens_count / 15).toLocaleString();
      callsDisplay = Math.max(1, Math.round(k.ai_calls_count / 15)).toLocaleString();
    } else if (this.activeDashboardFilter === 'dash_7days') {
      cycleBadge = '📅 Chu kỳ: 7 Ngày Gần Nhất';
      tokensDisplay = Math.round(k.ai_tokens_count / 4).toLocaleString();
      callsDisplay = Math.round(k.ai_calls_count / 4).toLocaleString();
    } else if (this.activeDashboardFilter === 'dash_quarter_year') {
      cycleBadge = '🗓️ Chu kỳ: Quý & Dự Phóng Năm (ARR)';
      mrrMultiplier = 12;
    }

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- Active Cycle Banner -->
        <div id="admin-cycle-banner" class="admin-cycle-banner flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <div class="flex items-center gap-2 text-rose-400 font-bold">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>${cycleBadge}</span>
          </div>
          <span class="text-slate-400 text-[11px]">Cập nhật tức thời: <b class="text-slate-200">Vừa xong</b></span>
        </div>

        <!-- 1. 4 KPI Header Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- 1. Total Users -->
          <div class="glass-card p-5 rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-slate-900/60 shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1. Tổng Người Dùng</span>
              <div class="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
                <i class="fa-solid fa-users"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-slate-100 font-mono tracking-tight">${k.total_users}</div>
            <div class="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span class="text-emerald-400 font-bold"><i class="fa-solid fa-arrow-trend-up"></i> +${k.new_users_pct}% mới</span>
              <span class="text-blue-400 font-bold"><i class="fa-solid fa-circle text-[7px] animate-pulse"></i> ${k.online_users} online</span>
            </div>
          </div>

          <!-- 2. Revenue -->
          <div class="glass-card p-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-slate-900/60 shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">2. Doanh Thu Nền Tảng</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">
                <i class="fa-solid fa-coins"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              ${this.activeDashboardFilter === 'dash_quarter_year' ? formatVND(k.arr_revenue) : formatVND(k.mrr_revenue)}
            </div>
            <div class="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span>${this.activeDashboardFilter === 'dash_quarter_year' ? 'Dự phóng ARR' : 'ARR: <b class="text-slate-200">' + formatVND(k.arr_revenue) + '</b>'}</span>
              <span class="text-emerald-400 font-bold">${this.activeDashboardFilter === 'dash_quarter_year' ? 'Năm 2026' : 'MRR Tháng'}</span>
            </div>
          </div>

          <!-- 3. AI Calls & Token Consumption -->
          <div class="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">3. Lượt Gọi AI / Token</span>
              <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-indigo-400 font-mono tracking-tight">${callsDisplay} lượt</div>
            <div class="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span>${tokensDisplay} tokens</span>
              <span class="text-amber-300 font-bold">$${k.ai_cost_usd}</span>
            </div>
          </div>

          <!-- 4. System Health Check -->
          <div class="glass-card p-5 rounded-3xl border border-teal-500/20 bg-gradient-to-b from-teal-950/20 to-slate-900/60 shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">4. Health Check</span>
              <div class="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center text-sm border border-teal-500/30">
                <i class="fa-solid fa-server"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-teal-400 font-mono tracking-tight">${k.system_health.uptime}</div>
            <div class="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span class="text-emerald-400 font-bold">FastAPI 0.115</span>
              <span class="text-teal-300 font-bold">SQLite 3NF</span>
            </div>
          </div>

        </div>

        <!-- 2. Central Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Central Chart 1: User Growth & DAU/MAU (7 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-7 flex flex-col justify-between border border-slate-800">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                    <i class="fa-solid fa-chart-area"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Tăng Trưởng Người Dùng & Hoạt Động (DAU / MAU)</h3>
                    <p class="text-[11px] text-slate-400">Xu hướng đăng ký mới và tương tác hệ thống theo chu kỳ</p>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  ${this.activeDashboardFilter === 'dash_today' ? '24 Hours' : this.activeDashboardFilter === 'dash_7days' ? '7 Days' : '6 Months'}
                </span>
              </div>

              <div class="relative w-full" style="height: 230px; min-height: 230px; max-height: 230px;">
                <canvas id="admin-user-growth-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Central Chart 2: Plan Distribution Donut (5 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-5 flex flex-col justify-between border border-slate-800">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm border border-amber-500/30">
                    <i class="fa-solid fa-pie-chart"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Tỷ Lệ Phân Bổ Gói Tài Khoản</h3>
                    <p class="text-[11px] text-slate-400">Cơ cấu người dùng Free vs Pro vs VIP</p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
                <div class="sm:col-span-6 flex justify-center">
                  <div class="relative flex items-center justify-center" style="width: 170px; height: 170px; min-width: 170px; min-height: 170px;">
                    <canvas id="admin-plan-donut-chart"></canvas>
                  </div>
                </div>
                <div class="sm:col-span-6 space-y-2">
                  <div class="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-slate-300 font-bold">
                      <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Gói Free:
                    </span>
                    <span class="font-mono font-bold text-slate-100">${plans.counts[0] || 0} (${plans.percentages[0] || 0}%)</span>
                  </div>
                  <div class="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-indigo-300 font-bold">
                      <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Gói Pro:
                    </span>
                    <span class="font-mono font-bold text-indigo-200">${plans.counts[1] || 0} (${plans.percentages[1] || 0}%)</span>
                  </div>
                  <div class="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-amber-300 font-bold">
                      <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Gói Premium:
                    </span>
                    <span class="font-mono font-bold text-amber-200">${plans.counts[2] || 0} (${plans.percentages[2] || 0}%)</span>
                  </div>
                  <div class="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-purple-300 font-bold">
                      <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Platinum VIP:
                    </span>
                    <span class="font-mono font-bold text-purple-200">${plans.counts[3] || 0} (${plans.percentages[3] || 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- 3. Bottom 2-Column Admin Tables Row -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Table: Recent Registered Users (7 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-7 flex flex-col justify-between border border-slate-800/80">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
                    <i class="fa-solid fa-user-clock"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Người Dùng Mới Đăng Ký Gần Nhất</h3>
                    <p class="text-[11px] text-slate-400">Danh sách tài khoản vừa tham gia FinTrack</p>
                  </div>
                </div>
                <button type="button" class="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline" onclick="window.fintrackAdmin.switchTab('admin_users')">
                  Xem tất cả &rarr;
                </button>
              </div>

              <!-- Table Content -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="text-slate-400 border-b border-slate-800/80 text-[10px] uppercase font-mono">
                      <th class="pb-2.5">Người Dùng</th>
                      <th class="pb-2.5">Gói</th>
                      <th class="pb-2.5">Trạng Thái</th>
                      <th class="pb-2.5">Ngày Tạo</th>
                      <th class="pb-2.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    ${data.recent_users.map(u => `
                      <tr class="hover:bg-slate-800/40 transition">
                        <td class="py-2.5">
                          <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-xl gradient-indigo text-white flex items-center justify-center font-bold text-[10px]">
                              ${u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div class="font-bold text-slate-100 cursor-pointer hover:text-rose-400 transition" onclick="window.fintrackAdmin.openUserDetailModal(${u.id})">${u.full_name}</div>
                              <div class="text-[10px] text-slate-400 font-mono">${u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-2.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${u.plan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : u.plan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                            ${u.plan}
                          </span>
                        </td>
                        <td class="py-2.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
                            ${u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </td>
                        <td class="py-2.5 text-[11px] text-slate-400 font-mono">${u.created_at}</td>
                        <td class="py-2.5 text-right">
                          <div class="inline-flex items-center gap-1.5">
                            <button type="button" class="px-2 py-1 rounded-lg text-[11px] font-bold ${u.status === 'ACTIVE' ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/40' : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40'}"
                              onclick="window.fintrackAdmin.toggleUserStatus(${u.id}, '${u.status}')">
                              ${u.status === 'ACTIVE' ? '<i class="fa-solid fa-lock text-[9px]"></i> Khóa' : '<i class="fa-solid fa-lock-open text-[9px]"></i> Mở'}
                            </button>
                            <button type="button" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition" title="Xem chi tiết" onclick="window.fintrackAdmin.openUserDetailModal(${u.id})">
                              <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Table: System Logs & Audit (5 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-5 flex flex-col justify-between border border-slate-800/80">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-sm border border-cyan-500/30">
                    <i class="fa-solid fa-list-check"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Nhật Ký & Cảnh Báo Mới</h3>
                    <p class="text-[11px] text-slate-400">Security audit & live events</p>
                  </div>
                </div>
                <button type="button" class="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline" onclick="window.fintrackAdmin.switchTab('admin_logs')">
                  Toàn bộ log &rarr;
                </button>
              </div>

              <!-- Logs Feed -->
              <div class="space-y-2.5">
                ${data.recent_logs.map(log => `
                  <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs">
                    <div class="flex items-center justify-between mb-1">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${log.type === 'SECURITY' ? 'bg-rose-500/20 text-rose-300' : log.type === 'AI_ENGINE' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'} font-mono">
                        ${log.type}
                      </span>
                      <span class="text-[10px] text-slate-500 font-mono">${log.timestamp}</span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">${log.message}</p>
                    <div class="text-[10px] text-slate-500 font-mono mt-1">Nguồn: ${log.ip}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    this.renderGrowthChart(growth);
    this.renderPlanDonutChart(plans);
  }

  applyDashboardFilter(filterId) {
    const container = document.getElementById('admin-view-body');
    if (!container) return;
    this.renderDashboardContent(container);
  }

  openComprehensiveReportModal() {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-backdrop-blur fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-rose-500/30 animate-in fade-in zoom-in duration-200">
          <button id="admin-export-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
          
          <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
              <i class="fa-solid fa-file-arrow-down"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100">Xuất Báo Cáo Tổng Hợp Hệ Thống</h3>
              <p class="text-xs text-slate-400">Trích xuất dữ liệu vận hành toàn sàn FinTrack AI</p>
            </div>
          </div>

          <div class="space-y-2.5 text-xs mb-5">
            <button type="button" onclick="window.fintrackAdmin.exportData('subscriptions')" class="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between group transition text-left">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <div>
                  <span class="font-bold text-slate-100 block group-hover:text-emerald-400 transition">Báo Cáo Đơn Hàng VIP & Doanh Thu (.csv)</span>
                  <span class="text-[10px] text-slate-500 font-mono">Bao gồm mã đơn, khách hàng, số tiền, cú pháp CK và thời gian</span>
                </div>
              </div>
              <i class="fa-solid fa-download text-slate-500 group-hover:text-emerald-400 transition"></i>
            </button>

            <button type="button" onclick="window.fintrackAdmin.exportData('users')" class="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between group transition text-left">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-users"></i>
                </div>
                <div>
                  <span class="font-bold text-slate-100 block group-hover:text-blue-400 transition">Danh Sách Người Dùng Hệ Thống (.csv)</span>
                  <span class="text-[10px] text-slate-500 font-mono">Tài khoản, gói cước, số dư thực tế, ngày hết hạn và vai trò</span>
                </div>
              </div>
              <i class="fa-solid fa-download text-slate-500 group-hover:text-blue-400 transition"></i>
            </button>

            <button type="button" onclick="window.fintrackAdmin.exportData('audit_logs')" class="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between group transition text-left">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-shield-virus"></i>
                </div>
                <div>
                  <span class="font-bold text-slate-100 block group-hover:text-cyan-400 transition">Nhật Ký Bảo Mật & Audit Logs (.csv)</span>
                  <span class="text-[10px] text-slate-500 font-mono">Các sự kiện bảo mật, đăng nhập, gọi AI và thay đổi phân quyền</span>
                </div>
              </div>
              <i class="fa-solid fa-download text-slate-500 group-hover:text-cyan-400 transition"></i>
            </button>

            <a href="/api/v1/backup/export" class="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between group transition">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-database"></i>
                </div>
                <div>
                  <span class="font-bold text-slate-100 block group-hover:text-indigo-400 transition">Bản Snapshot Database Toàn Sàn (.json)</span>
                  <span class="text-[10px] text-slate-500 font-mono">Sao lưu cấu trúc 3NF đầy đủ phục vụ lưu trữ</span>
                </div>
              </div>
              <i class="fa-solid fa-download text-slate-500 group-hover:text-indigo-400 transition"></i>
            </a>
          </div>

          <button type="button" id="admin-export-modal-done" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition">
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('admin-export-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('admin-export-modal-done')?.addEventListener('click', closeModal);
  }

  async exportData(type) {
    try {
      this.app?.showToast(`Đang kết xuất dữ liệu ${type}...`, 'info');
      await api.downloadAdminExport(type);
      this.app?.showToast(`Đã tải xuống file CSV ${type} thành công!`, 'success');
    } catch (err) {
      this.app?.showToast(err.message || 'Lỗi khi xuất dữ liệu', 'error');
    }
  }

  renderGrowthChart(growthData) {
    const canvas = document.getElementById('admin-user-growth-chart');
    if (!canvas) return;

    if (window.Chart) {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
    }
    if (this.growthChart) {
      try { this.growthChart.destroy(); } catch (e) {}
      this.growthChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let labels = [];
    let dataBar = [];
    let dataLine = [];
    let barLabel = 'Đăng ký mới';
    let lineLabel = 'User hoạt động (DAU)';

    if (this.activeDashboardFilter === 'dash_today') {
      labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Hiện tại'];
      dataBar = [1, 0, 3, 7, 12, 16, 9];
      dataLine = [2, 1, 4, 9, 14, 20, 15];
      barLabel = 'Truy cập mới (24h)';
      lineLabel = 'Online Realtime (24h)';
    } else if (this.activeDashboardFilter === 'dash_7days') {
      labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      dataBar = [4, 6, 5, 9, 12, 15, 10];
      dataLine = [8, 14, 11, 18, 24, 30, 22];
      barLabel = 'Đăng ký mới / ngày';
      lineLabel = 'Hoạt động (DAU tuần)';
    } else if (this.activeDashboardFilter === 'dash_quarter_year') {
      labels = ['Quý 1/2026', 'Quý 2/2026', 'Quý 3/2026', 'Quý 4/2026 (Dự phòng)'];
      dataBar = [25, 45, 80, 130];
      dataLine = [40, 75, 120, 200];
      barLabel = 'Tài khoản mới';
      lineLabel = 'MAU Tích Lũy / Dự Phóng';
    } else {
      // dash_month (Default)
      if (growthData && growthData.length > 0) {
        labels = growthData.map(d => d.month);
        dataBar = growthData.map(d => d.new_users);
        dataLine = growthData.map(d => d.dau);
      } else {
        labels = ['Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8'];
        dataBar = [2, 3, 5, 8, 12, 15];
        dataLine = [3, 5, 8, 14, 20, 25];
      }
      barLabel = 'Đăng ký mới';
      lineLabel = 'User hoạt động (DAU)';
    }

    const isLight = document.documentElement.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';

    this.growthChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: barLabel,
            data: dataBar,
            backgroundColor: isLight ? 'rgba(79, 70, 229, 0.85)' : 'rgba(99, 102, 241, 0.8)',
            borderRadius: 6,
            barPercentage: 0.5,
            order: 2
          },
          {
            type: 'line',
            label: lineLabel,
            data: dataLine,
            borderColor: '#F43F5E',
            backgroundColor: isLight ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.1)',
            borderWidth: 2.5,
            pointBackgroundColor: '#F43F5E',
            pointRadius: 4,
            tension: 0.35,
            fill: true,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              font: { size: 10, weight: 'bold' },
              color: isLight ? '#475569' : '#94A3B8'
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { color: isLight ? '#475569' : '#94a3b8' }
          },
          y: {
            grid: { color: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)' },
            ticks: { precision: 0, color: isLight ? '#475569' : '#94a3b8' }
          }
        }
      }
    });
  }

  renderPlanDonutChart(plans) {
    const canvas = document.getElementById('admin-plan-donut-chart');
    if (!canvas || !plans) return;

    if (window.Chart) {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
    }
    if (this.planChart) {
      try { this.planChart.destroy(); } catch (e) {}
      this.planChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isLight = document.documentElement.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';

    this.planChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: plans.labels || ['Free', 'Pro', 'VIP'],
        datasets: [{
          data: plans.counts || [1, 1, 1],
          backgroundColor: plans.colors || ['#64748B', '#6366F1', '#F59E0B'],
          borderWidth: 2,
          borderColor: isLight ? '#ffffff' : '#020617'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // =========================================================================
  // 2. USERS MANAGEMENT TAB & SUB-TAB FILTERING
  // =========================================================================
  async renderUsersTab(container) {
    container.innerHTML = `
      <div class="space-y-5 admin-subtab-content-anim">
        
        <!-- Search and Quick Actions Bar -->
        <div class="glass-card p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-800">
          <div class="flex-1 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" id="admin-users-search" placeholder="Tìm kiếm theo Tên, Email hoặc ID người dùng..." 
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-rose-500 font-mono" />
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-admin-refresh-users" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5" title="Làm mới danh sách">
              <i class="fa-solid fa-arrows-rotate text-xs"></i>
              <span>Làm Mới</span>
            </button>
          </div>
        </div>

        <!-- Users Data Table Card -->
        <div class="glass-card p-5 rounded-3xl overflow-hidden border border-slate-800" id="admin-users-table-container">
          <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
            <i class="fa-solid fa-spinner fa-spin text-xl text-blue-500 mb-2 block"></i>
            Đang tải dữ liệu người dùng...
          </div>
        </div>

      </div>
    `;

    const searchInput = document.getElementById('admin-users-search');
    let debounceTimer = null;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.applyUserFilter(this.activeUserFilter, searchInput.value.trim());
      }, 200);
    });

    document.getElementById('btn-admin-refresh-users')?.addEventListener('click', () => {
      this.applyUserFilter(this.activeUserFilter, searchInput?.value.trim());
    });

    await this.applyUserFilter(this.activeUserFilter);
  }

  async applyUserFilter(filterId, search = '') {
    let role = '';
    let plan = '';
    let statusFilter = '';

    if (filterId === 'users_active') statusFilter = 'ACTIVE';
    else if (filterId === 'users_locked') statusFilter = 'LOCKED';
    else if (filterId === 'users_paid') plan = 'PRO,PREMIUM,PLATINUM';
    else if (filterId === 'users_admins') role = 'ADMIN';

    await this.loadUsersList(search, role, plan, statusFilter);
  }

  async loadUsersList(search = '', role = '', plan = '', statusFilter = '') {
    const container = document.getElementById('admin-users-table-container');
    if (!container) return;

    try {
      const res = await api.getAdminUsers(search, role, plan, statusFilter);
      this.usersData = res.users;

      if (res.users.length === 0) {
        container.innerHTML = `
          <div class="py-16 text-center text-slate-400">
            <i class="fa-solid fa-user-slash text-3xl text-slate-600 mb-2 block"></i>
            Không tìm thấy người dùng nào khớp với bộ lọc đang chọn.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
          <span class="text-slate-400 font-bold">Tổng cộng: <b class="text-rose-400 font-mono font-black">${res.total}</b> tài khoản</span>
          <span class="text-[11px] text-slate-500">Nhấn vào tên người dùng để mở hồ sơ và điều chỉnh phân quyền</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
                <th class="pb-3 font-bold">Tài Khoản</th>
                <th class="pb-3 font-bold">Phân Quyền</th>
                <th class="pb-3 font-bold">Gói Dịch Vụ</th>
                <th class="pb-3 font-bold">Lượng GD</th>
                <th class="pb-3 font-bold">Trạng Thái</th>
                <th class="pb-3 font-bold">Ngày Tạo</th>
                <th class="pb-3 font-bold text-right">Quản Trị</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${res.users.map(u => {
                const currentAdminRole = (this.app?.currentUser?.role || '').toUpperCase();
                const isModerator = currentAdminRole === 'MODERATOR';
                const isTargetAdmin = u.role === 'ADMIN';

                return `
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-2xl gradient-indigo text-white flex items-center justify-center font-black text-xs shadow-md">
                        ${u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        ${isModerator && isTargetAdmin ? `
                          <span class="font-extrabold text-slate-100 flex items-center gap-1.5 cursor-not-allowed opacity-90" title="Tài khoản Root Admin được bảo vệ">
                            ${u.full_name}
                            <i class="fa-solid fa-shield text-[9px] text-rose-400"></i>
                          </span>
                        ` : `
                          <span class="font-extrabold text-slate-100 block cursor-pointer hover:text-rose-400 transition flex items-center gap-1.5" onclick="window.fintrackAdmin.openUserDetailModal(${u.id})">
                            ${u.full_name}
                            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-500"></i>
                          </span>
                        `}
                        <span class="text-[10px] text-slate-400 font-mono">${u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : u.role === 'MODERATOR' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'}">
                      ${u.role}
                    </span>
                  </td>
                  <td class="py-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${u.plan === 'PLATINUM' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : u.plan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : u.plan === 'PRO' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'}">
                      ${u.plan}
                    </span>
                  </td>
                  <td class="py-3 font-mono font-bold text-slate-200">${u.tx_count} GD</td>
                  <td class="py-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
                      ${u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td class="py-3 text-slate-400 font-mono text-[11px]">${u.created_at}</td>
                  <td class="py-3 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      ${isModerator && isTargetAdmin ? `
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700 font-mono flex items-center gap-1" title="Tài khoản Root Admin được bảo vệ">
                          <i class="fa-solid fa-shield text-[9px] text-rose-400"></i> 🔒 Bảo vệ
                        </span>
                        <button type="button" disabled class="p-1.5 rounded-lg bg-slate-900 text-slate-600 cursor-not-allowed opacity-40 transition" title="Không thể chỉnh sửa Root Admin">
                          <i class="fa-solid fa-pen-to-square text-xs px-1"></i>
                        </button>
                      ` : `
                        <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/50' : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50'}"
                          onclick="window.fintrackAdmin.toggleUserStatus(${u.id}, '${u.status}')">
                          ${u.status === 'ACTIVE' ? '<i class="fa-solid fa-lock text-[10px]"></i> Khóa' : '<i class="fa-solid fa-lock-open text-[10px]"></i> Mở'}
                        </button>
                        <button type="button" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition" title="Xem chi tiết & Quản lý"
                          onclick="window.fintrackAdmin.openUserDetailModal(${u.id})">
                          <i class="fa-solid fa-pen-to-square text-xs px-1"></i>
                        </button>
                      `}
                    </div>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải danh sách người dùng: ${e.message}</div>`;
    }
  }

  async toggleUserStatus(userId, currentStatus) {
    const currentAdminRole = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = currentAdminRole === 'MODERATOR';
    const targetUser = (this.usersData || []).find(u => u.id === userId);

    if (isModerator && targetUser?.role === 'ADMIN') {
      this.app?.showToast('Moderator không có quyền can thiệp hoặc khóa tài khoản Quản trị viên tối cao!', 'error');
      return;
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await api.updateAdminUserStatus(userId, newStatus);
      this.app.showToast(`Đã ${newStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản thành công!`, 'success');
      this.applyUserFilter(this.activeUserFilter);
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  }

  // User Detailed Modal
  async openUserDetailModal(userId) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const currentAdminRole = (this.app?.currentUser?.role || '').toUpperCase();
    const isRootAdmin = currentAdminRole === 'ADMIN';
    const isModerator = currentAdminRole === 'MODERATOR';

    const preUser = (this.usersData || []).find(u => u.id === userId) || (this.dashboardData?.recent_users || []).find(u => u.id === userId);
    const userName = preUser ? preUser.full_name : 'Người Dùng';
    const userEmail = preUser ? preUser.email : 'user@fintrack.ai';
    const userRole = preUser ? preUser.role : 'USER';
    const userPlan = preUser ? preUser.plan : 'FREE';
    const userStatus = preUser ? preUser.status : 'ACTIVE';
    const userCreatedAt = preUser ? preUser.created_at : 'Đang đồng bộ...';
    const initialChar = userName ? userName.charAt(0).toUpperCase() : 'U';
    const isTargetAdmin = userRole === 'ADMIN';

    if (isModerator && isTargetAdmin) {
      this.app?.showToast('Tài khoản Root Admin được bảo vệ toàn diện, Moderator không có quyền mở can thiệp!', 'warning');
      return;
    }

    modalEl.innerHTML = `
      <div class="modal-backdrop-blur fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
          
          <button id="admin-user-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-4 pb-4 mb-4 border-b border-slate-800">
            <div class="w-14 h-14 rounded-2xl gradient-indigo text-white flex items-center justify-center text-2xl font-black shadow-lg">
              ${initialChar}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-slate-100">${userName}</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${userRole === 'ADMIN' ? 'bg-rose-500/20 text-rose-300' : userRole === 'MODERATOR' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}">${userRole}</span>
              </div>
              <p class="text-xs text-slate-400 font-mono mt-0.5">${userEmail} &bull; ID #${userId}</p>
              <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                <span>Ngày tham gia: ${userCreatedAt}</span>
                <span>&bull;</span>
                <span>Trạng thái: <b class="${userStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}">${userStatus}</b></span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" id="modal-financial-summary">
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse">
              <span class="text-[10px] text-slate-400 block font-bold">Tổng Số Dư Ví</span>
              <span class="text-sm font-black text-emerald-400 font-mono block mt-0.5">...</span>
            </div>
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse">
              <span class="text-[10px] text-slate-400 block font-bold">Số Ví Sở Hữu</span>
              <span class="text-sm font-black text-blue-400 font-mono block mt-0.5">...</span>
            </div>
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse">
              <span class="text-[10px] text-slate-400 block font-bold">Tổng Giao Dịch</span>
              <span class="text-sm font-black text-purple-400 font-mono block mt-0.5">...</span>
            </div>
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse">
              <span class="text-[10px] text-slate-400 block font-bold">Lượt Dùng AI</span>
              <span class="text-sm font-black text-indigo-400 font-mono block mt-0.5">...</span>
            </div>
          </div>

          <form id="admin-user-detail-form" class="space-y-4 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 mb-4">
            <div class="flex items-center justify-between">
              <h4 class="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <i class="fa-solid fa-sliders text-rose-400"></i> ${isModerator ? 'Cập Nhật Thông Tin & Trạng Thái Người Dùng' : 'Điều Chỉnh Phân Quyền & Gói Cước'}
              </h4>
              ${isModerator ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Chế độ Moderator</span>' : ''}
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Họ và Tên</label>
                <input type="text" id="detail-user-fullname" value="${userName}" required
                  class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Trạng Thái Tài Khoản</label>
                <select id="detail-user-status" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                  <option value="ACTIVE" ${userStatus === 'ACTIVE' ? 'selected' : ''}>Hoạt động (ACTIVE)</option>
                  <option value="LOCKED" ${userStatus === 'LOCKED' ? 'selected' : ''}>Tạm khóa (LOCKED)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-400 mb-1">Phân Quyền / Vai Trò</label>
                <select id="detail-user-role" ${isModerator ? 'disabled' : ''} class="w-full px-3 py-2 rounded-xl bg-slate-950 border ${isModerator ? 'border-slate-800 text-slate-400 cursor-not-allowed font-mono' : 'border-slate-700 text-slate-100'}">
                  <option value="USER" ${userRole === 'USER' ? 'selected' : ''}>User (Người dùng thường)</option>
                  <option value="MODERATOR" ${userRole === 'MODERATOR' ? 'selected' : ''}>Moderator (Quản trị viên phụ)</option>
                  <option value="ADMIN" ${userRole === 'ADMIN' ? 'selected' : ''}>Admin (Quản trị viên tối cao)</option>
                </select>
                ${isModerator ? '<span class="text-[10px] text-amber-400 font-mono mt-1 block"><i class="fa-solid fa-lock text-[9px]"></i> Khóa: Chỉ Root Admin mới có quyền phân quyền vai trò (Role)</span>' : ''}
              </div>
              <div>
                <label class="block font-bold text-slate-400 mb-1">Gói Tài Khoản</label>
                <select id="detail-user-plan" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100">
                  <option value="FREE" ${userPlan === 'FREE' ? 'selected' : ''}>Gói FREE (10 AI calls/ngày, 2 ví)</option>
                  <option value="PRO" ${userPlan === 'PRO' ? 'selected' : ''}>Gói PRO (100 AI calls/ngày, 5 ví)</option>
                  <option value="PREMIUM" ${userPlan === 'PREMIUM' ? 'selected' : ''}>Gói PREMIUM (300 AI calls/ngày, 10 ví)</option>
                  <option value="PLATINUM" ${userPlan === 'PLATINUM' ? 'selected' : ''}>👑💎 Gói PLATINUM VIP (Unlimited AI & Ví)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-300 mb-1">Ghi Chú Nội Bộ (Hỗ trợ / Nghiệp vụ)</label>
              <textarea id="detail-user-note" rows="2" placeholder="Ghi chú nội bộ về tài khoản này (Ví dụ: đã đối soát, hỗ trợ nạp tiền, v.v.)..." 
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-purple-500"></textarea>
            </div>

            ${isRootAdmin ? `
              <div>
                <label class="block font-bold text-slate-400 mb-1">Đặt lại mật khẩu cho user (Để trống nếu không đổi)</label>
                <input type="password" id="detail-user-pass" placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)" 
                  class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100" />
              </div>
            ` : ''}

            <div class="flex items-center justify-between pt-2 gap-2 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                ${isRootAdmin ? `
                  <button type="button" id="btn-admin-delete-user" class="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 font-bold border border-red-800/40 transition flex items-center gap-1.5 text-xs">
                    <i class="fa-solid fa-trash text-xs"></i>
                    <span>Xóa Tài Khoản</span>
                  </button>
                ` : ''}
                <button type="button" id="btn-admin-send-personal-notif" class="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 font-bold border border-purple-800/40 transition flex items-center gap-1.5 text-xs">
                  <i class="fa-solid fa-paper-plane text-xs text-purple-400"></i>
                  <span>Gửi Thông Báo Riêng</span>
                </button>
              </div>
              <button type="submit" class="px-5 py-2 rounded-xl gradient-rose text-white font-bold shadow-md shadow-rose-500/25 active:scale-95 transition text-xs">
                <i class="fa-solid fa-check mr-1.5"></i> Cập Nhật Thay Đổi
              </button>
            </div>
          </form>

          <div class="space-y-2 mb-4" id="modal-wallets-container">
            <h4 class="font-bold text-slate-300 text-xs">Danh Sách Ví & Tài Khoản Của User:</h4>
            <div class="py-4 text-center text-slate-500 text-xs">Đang tải danh sách ví...</div>
          </div>

          <div class="space-y-2" id="modal-txs-container">
            <h4 class="font-bold text-slate-300 text-xs">10 Giao Dịch Gần Nhất:</h4>
            <div class="py-4 text-center text-slate-500 text-xs">Đang tải lịch sử giao dịch...</div>
          </div>

        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('admin-user-modal-close')?.addEventListener('click', closeModal);

    document.getElementById('btn-admin-send-personal-notif')?.addEventListener('click', () => {
      this.openSendPersonalNotificationModal(userId, userEmail, userName);
    });

    try {
      const data = await api.getUserDetailAdmin(userId);
      const u = data.user;
      const f = data.financial_summary;

      const summaryEl = document.getElementById('modal-financial-summary');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span class="text-[10px] text-slate-400 block font-bold">Tổng Số Dư Ví</span>
            <span class="text-sm font-black text-emerald-400 font-mono block mt-0.5">${formatVND(f.total_balance)}</span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span class="text-[10px] text-slate-400 block font-bold">Số Ví Sở Hữu</span>
            <span class="text-sm font-black text-blue-400 font-mono block mt-0.5">${f.wallets_count} Ví</span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span class="text-[10px] text-slate-400 block font-bold">Tổng Giao Dịch</span>
            <span class="text-sm font-black text-purple-400 font-mono block mt-0.5">${f.transactions_count} GD</span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span class="text-[10px] text-slate-400 block font-bold">Lượt Dùng AI</span>
            <span class="text-sm font-black text-indigo-400 font-mono block mt-0.5">${f.ai_calls_count} lượt</span>
          </div>
        `;
      }

      const walletsEl = document.getElementById('modal-wallets-container');
      if (walletsEl) {
        walletsEl.innerHTML = `
          <h4 class="font-bold text-slate-300 text-xs">Danh Sách Ví & Tài Khoản Của User:</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${data.wallets.length > 0 ? data.wallets.map(w => `
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-slate-200 block">${w.name} (${w.type})</span>
                  <span class="font-mono font-bold text-emerald-400">${formatVND(w.balance)}</span>
                </div>
                ${isRootAdmin ? `
                  <button type="button" class="btn-quick-adjust-wallet px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 text-[10px] transition" data-id="${w.id}" data-name="${w.name}" data-balance="${w.balance}" title="Điều chỉnh số dư ví (Root Admin)">
                    <i class="fa-solid fa-pen-to-square text-[9px] mr-1"></i>Sửa số dư
                  </button>
                ` : ''}
              </div>
            `).join('') : '<div class="text-slate-500 text-xs col-span-2">Chưa có ví nào</div>'}
          </div>
        `;

        if (isRootAdmin) {
          walletsEl.querySelectorAll('.btn-quick-adjust-wallet').forEach(btn => {
            btn.addEventListener('click', async () => {
              const wId = parseInt(btn.getAttribute('data-id'));
              const wName = btn.getAttribute('data-name');
              const currBal = parseFloat(btn.getAttribute('data-balance') || 0);
              const inputVal = prompt(`[ROOT ADMIN] Nhập số dư mới (VND) cho ví "${wName}":`, currBal);
              if (inputVal === null) return;
              const newBal = parseFloat(inputVal);
              if (isNaN(newBal) || newBal < 0) {
                this.app.showToast('Số dư nhập vào không hợp lệ!', 'error');
                return;
              }
              const reason = prompt('Lý do điều chỉnh số dư ví:', 'Root Admin hỗ trợ đối soát hệ thống') || 'Admin can thiệp';
              try {
                await api.adjustAdminWalletBalance(wId, newBal, reason);
                this.app.showToast(`Đã cập nhật số dư ví ${wName} thành công!`, 'success');
                this.openUserDetailModal(userId);
              } catch (err) {
                this.app.showToast(err.message || 'Lỗi điều chỉnh số dư', 'error');
              }
            });
          });
        }
      }

      const txsEl = document.getElementById('modal-txs-container');
      if (txsEl) {
        txsEl.innerHTML = `
          <h4 class="font-bold text-slate-300 text-xs">10 Giao Dịch Gần Nhất:</h4>
          <div class="space-y-1.5 max-h-36 overflow-y-auto">
            ${data.recent_transactions.length > 0 ? data.recent_transactions.map(t => `
              <div class="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-[11px]">
                <div>
                  <span class="font-bold text-slate-200">${t.note}</span>
                  <span class="text-[10px] text-slate-500 font-mono block">${t.date}</span>
                </div>
                <span class="font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}">
                  ${t.type === 'INCOME' ? '+' : '-'}${formatVND(t.amount)}
                </span>
              </div>
            `).join('') : '<div class="text-slate-500 text-xs">Chưa có giao dịch nào</div>'}
          </div>
        `;
      }

      document.getElementById('admin-user-detail-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const newFullName = document.getElementById('detail-user-fullname')?.value.trim();
          const roleSelect = document.getElementById('detail-user-role');
          const newRole = roleSelect ? roleSelect.value : u.role;
          const planSelect = document.getElementById('detail-user-plan');
          const newPlan = planSelect ? planSelect.value : u.plan;
          const statusSelect = document.getElementById('detail-user-status');
          const newStatus = statusSelect ? statusSelect.value : u.status;
          const passInput = document.getElementById('detail-user-pass');
          const newPass = passInput ? passInput.value.trim() : '';

          // 1. Update basic profile info (Full Name, Status, Plan)
          await api.updateAdminUserProfile(u.id, {
            full_name: newFullName,
            status: newStatus,
            plan: newPlan
          });

          // 2. If Root Admin, update Role & Password if changed
          if (isRootAdmin && newRole && newRole !== u.role) {
            await api.updateAdminUserRole(u.id, newRole);
          }
          if (isRootAdmin && newPass && newPass.length >= 6) {
            await api.resetAdminUserPassword(u.id, newPass);
          }

          this.app.showToast('Cập nhật hồ sơ người dùng thành công!', 'success');
          closeModal();
          this.applyUserFilter(this.activeUserFilter);
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi cập nhật', 'error');
        }
      });

      document.getElementById('btn-admin-delete-user')?.addEventListener('click', async () => {
        if (!isRootAdmin) {
          this.app.showToast('Chỉ Root Admin mới có quyền xóa người dùng!', 'error');
          return;
        }
        if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${u.email} không?`)) return;
        try {
          await api.deleteUserAdmin(u.id);
          this.app.showToast(`Đã xóa tài khoản ${u.email}`, 'success');
          closeModal();
          this.applyUserFilter(this.activeUserFilter);
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi xóa tài khoản', 'error');
        }
      });

    } catch (err) {
      this.app.showToast(err.message || 'Lỗi tải chi tiết user', 'error');
    }
  }

  // Modal to send a direct personal notification to a specific user
  openSendPersonalNotificationModal(userId, userEmail, userName) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    modalEl.innerHTML = `
      <div class="modal-backdrop-blur fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-purple-500/30 animate-in fade-in zoom-in duration-150">
          
          <button id="admin-send-notif-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg border border-purple-500/30 flex-shrink-0">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100">Gửi Thông Báo Riêng Cho Người Dùng</h3>
              <p class="text-xs text-slate-400 font-mono">Người nhận: <b class="text-purple-300 font-sans">${userName}</b> (${userEmail})</p>
            </div>
          </div>

          <form id="admin-personal-notif-form" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Tiêu đề thông báo</label>
              <input type="text" id="pnotif-title" required placeholder="Ví dụ: Tin tức cập nhật hoặc Lời nhắc quan trọng" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-300 mb-1">Nội dung thông báo</label>
              <textarea id="pnotif-message" rows="3" required placeholder="Nhập nội dung chi tiết thông báo gửi riêng cho người dùng này..." 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-purple-500"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Loại thông báo</label>
                <select id="pnotif-type" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100">
                  <option value="INFO">ℹ️ Tin tức / Cập nhật (Info)</option>
                  <option value="SUCCESS">🎉 Thành tích / Khen thưởng (Success)</option>
                  <option value="PROMOTION">👑 Ưu đãi / Thông báo chung (Promo)</option>
                  ${!isModerator ? `
                    <option value="WARNING">⚠️ Cảnh báo bảo mật hệ thống cấp cao</option>
                    <option value="MAINTENANCE">⚙️ Bảo trì hệ thống (Maintenance)</option>
                  ` : ''}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Điều hướng Tab (Tùy chọn)</label>
                <select id="pnotif-tab" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100">
                  <option value="">-- Không điều hướng --</option>
                  <option value="subscription">Gói Dịch Vụ & VIP</option>
                  <option value="budgets">Hạn Mức Ngân Sách</option>
                  <option value="wallets">Ví & Tài Khoản</option>
                  <option value="ai_assistant">Trợ Lý AI FinTrack</option>
                  <option value="badges">Huy Hiệu & Thành Tích</option>
                  <option value="analytics">Phân Tích Báo Cáo</option>
                  <option value="transactions">Sổ Giao Dịch</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="btn-cancel-pnotif" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">
                Hủy
              </button>
              <button type="submit" class="px-5 py-2.5 rounded-xl gradient-indigo text-white font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition flex items-center gap-1.5">
                <i class="fa-solid fa-paper-plane text-xs"></i>
                <span>Gửi Thông Báo Ngay</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const closeNotifModal = () => {
      this.openUserDetailModal(userId);
    };

    document.getElementById('admin-send-notif-modal-close')?.addEventListener('click', closeNotifModal);
    document.getElementById('btn-cancel-pnotif')?.addEventListener('click', closeNotifModal);

    document.getElementById('admin-personal-notif-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          target_type: 'USER',
          user_id: userId,
          user_email: userEmail,
          title: document.getElementById('pnotif-title').value.trim(),
          message: document.getElementById('pnotif-message').value.trim(),
          type: document.getElementById('pnotif-type').value,
          link_tab: document.getElementById('pnotif-tab').value || null
        };
        await api.createAdminNotification(payload);
        this.app.showToast(`Đã gửi thông báo riêng đến ${userName} (${userEmail})!`, 'success');
        modalEl.innerHTML = '';
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi gửi thông báo', 'error');
      }
    });
  }

  // =========================================================================
  // 4. AI & API CONFIGURATION TAB & SUB-TAB FILTERING
  // =========================================================================
  async renderAIManagementTab(container) {
    container.innerHTML = `<div class="py-16 text-center text-slate-500 text-xs animate-pulse">Đang tải cấu hình AI...</div>`;

    try {
      const data = await api.getAdminAIConfig();
      this.aiConfigData = data;
      this.renderAIContent(container);
      if (this.activeAIFilter && this.activeAIFilter !== 'ai_stats') {
        setTimeout(() => this.applyAIFilter(this.activeAIFilter), 120);
      }
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải AI config: ${e.message}</div>`;
    }
  }

  renderAIContent(container) {
    if (!this.aiConfigData) return;
    const data = this.aiConfigData;
    const c = data.config || {};
    const s = data.stats || { today_tokens: 0, today_calls: 0, month_tokens: 0, month_calls: 0, est_monthly_cost_usd: '0.00', est_monthly_cost_vnd: 0 };

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- Module 1: Token Stats & Consumption -->
        <div id="ai-module-stats" class="space-y-3 transition">
          <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <i class="fa-solid fa-bolt text-amber-300"></i> <span>Module 1: Thống Kê & Chi Phí Token AI</span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-indigo-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Token Sử Dụng Hôm Nay</span>
              <div class="text-2xl font-black text-indigo-400 font-mono">${(s.today_tokens || 0).toLocaleString()} tokens</div>
              <div class="text-[11px] text-slate-400 mt-1">${s.today_calls || 0} lượt truy vấn trong ngày</div>
            </div>
            <div class="glass-card p-5 rounded-3xl border border-purple-500/20 bg-purple-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Token Sử Dụng Tháng Này</span>
              <div class="text-2xl font-black text-purple-400 font-mono">${(s.month_tokens || 0).toLocaleString()} tokens</div>
              <div class="text-[11px] text-slate-400 mt-1">${s.month_calls || 0} lượt truy vấn trong tháng</div>
            </div>
            <div class="glass-card p-5 rounded-3xl border border-amber-500/20 bg-amber-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chi Phí API Ước Tính</span>
              <div class="text-2xl font-black text-amber-300 font-mono">$${s.est_monthly_cost_usd || '0.00'} (~${(s.est_monthly_cost_vnd || 0).toLocaleString()} ₫)</div>
              <div class="text-[11px] text-emerald-400 mt-1">Zero-PII Engine Tối Ưu Chi Phí</div>
            </div>
          </div>
        </div>

        <!-- AI Configuration Form -->
        <form id="ai-config-form" class="space-y-5 text-xs">
          
          <!-- Module 4: Model Engine Config -->
          <div id="ai-module-engine" class="glass-card p-6 rounded-3xl space-y-4 border ${this.activeAIFilter === 'ai_engine' ? 'border-cyan-500 shadow-xl shadow-cyan-500/15 ring-2 ring-cyan-500/20' : 'border-slate-800'} transition">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-gear text-cyan-400"></i>
                <span>Module 4: Cấu Hình Model Engine AI & Endpoint</span>
              </h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Model: ${escapeHtml(c.provider || 'Gemini 1.5 Pro')}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Mô Hình AI Kích Hoạt (Provider)</label>
                <select id="ai-provider" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold">
                  ${(data.providers_available || []).map(p => `
                    <option value="${p.name}" ${p.name === c.provider ? 'selected' : ''}>${p.name} (${p.status})</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Model Name / Endpoint Code</label>
                <input type="text" id="ai-model-name" value="${escapeHtml(c.model_name || 'gemini-1.5-pro')}" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-bold text-slate-300 text-xs">Mức Độ Sáng Tạo / Nhiệt Độ (Temperature): <span id="ai-temp-val" class="text-cyan-400 font-mono font-black">${c.temperature !== undefined ? c.temperature : 0.2}</span></label>
                <span class="text-[10px] text-slate-500 font-mono">(0.0: Chính xác tuyệt đối &bull; 1.0: Sáng tạo cao)</span>
              </div>
              <input type="range" id="ai-temperature" min="0" max="1" step="0.05" value="${c.temperature !== undefined ? c.temperature : 0.2}" 
                class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
            </div>
          </div>

          <!-- Module 2: System Prompt Parser -->
          <div id="ai-module-parser" class="glass-card p-6 rounded-3xl space-y-3 border ${this.activeAIFilter === 'ai_parser' ? 'border-indigo-500 shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/20' : 'border-slate-800'} transition">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-file-lines text-indigo-400"></i>
                <span>Module 2: System Prompt Natural Language Parser (Bóc tách giao dịch tự nhiên)</span>
              </h3>
              <span class="text-[10px] font-bold text-indigo-300 font-mono">Zero-PII Active</span>
            </div>
            <p class="text-[11px] text-slate-400">Quy định logic trích xuất Số tiền, Danh mục, Ví và Loại giao dịch từ tiếng Việt tự nhiên</p>
            <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span class="text-slate-400 font-bold">Biến hỗ trợ:</span>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{raw_text}')">{raw_text}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{available_wallets}')">{available_wallets}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{available_categories}')">{available_categories}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{current_date}')">{current_date}</button>
            </div>
            <textarea id="ai-prompt-parser" rows="4" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px] leading-relaxed">${escapeHtml(c.system_prompt_parser || '')}</textarea>
          </div>

          <!-- Module 3: System Prompt Advisor -->
          <div id="ai-module-advisor" class="glass-card p-6 rounded-3xl space-y-3 border ${this.activeAIFilter === 'ai_advisor' ? 'border-purple-500 shadow-xl shadow-purple-500/15 ring-2 ring-purple-500/20' : 'border-slate-800'} transition">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-brain text-purple-400"></i>
                <span>Module 3: System Prompt Financial Health Advisor (Bác sĩ tài chính 50/30/20)</span>
              </h3>
              <span class="text-[10px] font-bold text-purple-300 font-mono">50/30/20 Rule</span>
            </div>
            <p class="text-[11px] text-slate-400">Quy định tính cách và nguyên tắc tư vấn tái cơ cấu ngân sách cho người dùng</p>
            <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span class="text-slate-400 font-bold">Biến hỗ trợ:</span>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{total_income}')">{total_income}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{total_expense}')">{total_expense}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{needs_pct}')">{needs_pct}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{wants_pct}')">{wants_pct}</button>
              <button type="button" class="prompt-variable-tag px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono font-bold transition" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{savings_pct}')">{savings_pct}</button>
            </div>
            <textarea id="ai-prompt-advisor" rows="4" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px] leading-relaxed">${escapeHtml(c.system_prompt_advisor || '')}</textarea>
          </div>

          <!-- Module 5: Rate Limits & Quotas -->
          <div id="ai-module-limits" class="glass-card p-6 rounded-3xl space-y-3 border ${this.activeAIFilter === 'ai_limits' ? 'border-rose-500 shadow-xl shadow-rose-500/15 ring-2 ring-rose-500/20' : 'border-slate-800'} transition">
            <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <i class="fa-solid fa-stopwatch text-rose-400"></i>
              <span>Module 5: Hạn Mức Lượt Gọi AI Cho Từng Gói Tài Khoản (Rate Limits / Day)</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói FREE (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-free" value="${c.rate_limit_free !== undefined ? c.rate_limit_free : 10}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói PRO (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-pro" value="${c.rate_limit_pro !== undefined ? c.rate_limit_pro : 100}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói PREMIUM (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-prem" value="${c.rate_limit_premium !== undefined ? c.rate_limit_premium : 1000}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" class="px-7 py-3 rounded-xl gradient-indigo text-white font-bold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition flex items-center gap-2">
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Lưu Toàn Bộ Cấu Hình AI</span>
            </button>
          </div>
        </form>

      </div>
    `;

    const tempSlider = document.getElementById('ai-temperature');
    const tempVal = document.getElementById('ai-temp-val');
    tempSlider?.addEventListener('input', () => {
      if (tempVal) tempVal.textContent = tempSlider.value;
    });

    document.getElementById('ai-config-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          provider: document.getElementById('ai-provider').value,
          model_name: document.getElementById('ai-model-name').value,
          temperature: parseFloat(document.getElementById('ai-temperature')?.value || '0.2'),
          system_prompt_parser: document.getElementById('ai-prompt-parser').value,
          system_prompt_advisor: document.getElementById('ai-prompt-advisor').value,
          rate_limit_free: parseInt(document.getElementById('ai-limit-free').value),
          rate_limit_pro: parseInt(document.getElementById('ai-limit-pro').value),
          rate_limit_premium: parseInt(document.getElementById('ai-limit-prem').value)
        };
        await api.updateAdminAIConfig(payload);
        this.app.showToast('Cập nhật cấu hình AI thành công!', 'success');
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi cập nhật AI', 'error');
      }
    });
  }

  insertVariableToPrompt(textareaId, variableText) {
    const el = document.getElementById(textareaId);
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = el.value;
    el.value = text.substring(0, start) + variableText + text.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + variableText.length;
  }

  applyAIFilter(filterId) {
    const map = {
      'ai_stats': 'ai-module-stats',
      'ai_parser': 'ai-module-parser',
      'ai_advisor': 'ai-module-advisor',
      'ai_engine': 'ai-module-engine',
      'ai_limits': 'ai-module-limits'
    };

    const targetId = map[filterId] || 'ai-module-stats';
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('cyber-card-highlight');
      setTimeout(() => targetEl.classList.remove('cyber-card-highlight'), 1300);
    }
  }

  // =========================================================================
  // 5. MASTER DATA TAB & 50/30/20 SUB-TAB FILTERING
  // =========================================================================
  async renderMasterDataTab(container) {
    container.innerHTML = `<div class="py-16 text-center text-slate-500 text-xs animate-pulse">Đang tải danh mục mẫu & quy tắc chuẩn...</div>`;

    try {
      const data = await api.getAdminMasterData();
      this.masterData = data;
      this.renderMasterDataContent(container);
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải Master Data: ${e.message}</div>`;
    }
  }

  renderMasterDataContent(container) {
    if (!this.masterData) return;
    const data = this.masterData;

    // Filter categories by selected subtab
    let filteredCategories = data.categories || [];
    if (this.activeCatFilter === 'cat_needs') {
      filteredCategories = filteredCategories.filter(c => c.group === 'NEEDS' || c.group_50_30_20 === 'NEEDS');
    } else if (this.activeCatFilter === 'cat_wants') {
      filteredCategories = filteredCategories.filter(c => c.group === 'WANTS' || c.group_50_30_20 === 'WANTS');
    } else if (this.activeCatFilter === 'cat_savings') {
      filteredCategories = filteredCategories.filter(c => c.group === 'SAVINGS' || c.group_50_30_20 === 'SAVINGS');
    } else if (this.activeCatFilter === 'cat_income') {
      filteredCategories = filteredCategories.filter(c => c.type === 'INCOME');
    }

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- Master Categories Section -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-tags text-amber-400"></i>
                Danh Mục Thu / Chi Mặc Định Toàn Sàn (${filteredCategories.length} mục)
              </h3>
              <p class="text-[11px] text-slate-400">Bộ danh mục chuẩn được tự động nhân bản khi người dùng đăng ký mới</p>
            </div>
            <button id="btn-add-master-cat" class="px-4 py-2 rounded-xl gradient-amber text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 self-start sm:self-auto">
              <i class="fa-solid fa-plus"></i>
              <span>Thêm Danh Mục Chuẩn</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${filteredCategories.length > 0 ? filteredCategories.map(c => `
              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center gap-3 transition">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style="background-color: ${c.color}25; color: ${c.color}; border: 1px solid ${c.color}40;">
                  <i class="fa-solid fa-${(c.icon || 'tags').replace(/^fa-solid\s+|^fa-regular\s+|^fa-brands\s+|^fa-/, '')}"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="font-bold text-xs text-slate-100 block truncate">${c.name}</span>
                  <span class="text-[10px] text-slate-400 font-mono">${c.group} &bull; ${c.type}</span>
                </div>
              </div>
            `).join('') : `
              <div class="col-span-4 py-12 text-center text-slate-500 text-xs">
                Chưa có danh mục nào trong nhóm này.
              </div>
            `}
          </div>
        </div>

        <!-- Allocation Rules (50/30/20 & 6 Jars) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- 50/30/20 Rule Box -->
          <div class="glass-card p-6 rounded-3xl border border-slate-800">
            <h4 class="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-scale-balanced text-emerald-400"></i>
              ${data.rules.rule_50_30_20.name}
            </h4>
            <p class="text-xs text-slate-400 mb-4">${data.rules.rule_50_30_20.description}</p>
            <div class="space-y-2.5 text-xs font-bold font-mono">
              <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between text-rose-400">
                <span>Nhu cầu thiết yếu (Needs):</span>
                <span>50%</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between text-purple-400">
                <span>Mong muốn & Hưởng thụ (Wants):</span>
                <span>30%</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between text-emerald-400">
                <span>Tiết kiệm & Tích lũy (Savings):</span>
                <span>20%</span>
              </div>
            </div>
          </div>

          <!-- 6 Jars Rule Box -->
          <div class="glass-card p-6 rounded-3xl border border-slate-800">
            <h4 class="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-jar text-amber-400"></i>
              ${data.rules.rule_6_jars.name}
            </h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              ${data.rules.rule_6_jars.jars.map(j => `
                <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span class="text-slate-300 text-[11px] truncate">${j.name}</span>
                  <span class="font-bold font-mono" style="color: ${j.color};">${j.pct}%</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    document.getElementById('btn-add-master-cat')?.addEventListener('click', () => {
      this.openAddMasterCategoryModal();
    });
  }

  applyMasterDataFilter(filterId) {
    const container = document.getElementById('admin-view-body');
    if (!container) return;
    this.renderMasterDataContent(container);
  }

  openAddMasterCategoryModal() {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-backdrop-blur fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-200">
          <button id="master-cat-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
          <h3 class="text-sm font-black text-slate-100 mb-4 pb-2 border-b border-slate-800">Thêm Danh Mục Chuẩn Hệ Thống</h3>
          <form id="master-cat-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Tên danh mục</label>
              <input type="text" id="mcat-name" required placeholder="Ví dụ: Tiền Trọ / Nhà Ở" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Loại</label>
                <select id="mcat-type" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100">
                  <option value="EXPENSE">Chi Tiêu</option>
                  <option value="INCOME">Thu Nhập</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Nhóm 50/30/20</label>
                <select id="mcat-group" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100">
                  <option value="NEEDS">Thiết yếu (Needs)</option>
                  <option value="WANTS">Mong muốn (Wants)</option>
                  <option value="SAVINGS">Tiết kiệm (Savings)</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-300 mb-1">FontAwesome Icon</label>
                <input type="text" id="mcat-icon" value="house" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100" />
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Màu Sắc (HEX)</label>
                <input type="color" id="mcat-color" value="#10B981" class="w-full h-9 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer" />
              </div>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl gradient-amber text-slate-950 font-bold mt-3 shadow-md shadow-amber-500/25">
              Tạo Danh Mục Mẫu
            </button>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('master-cat-modal-close')?.addEventListener('click', closeModal);

    document.getElementById('master-cat-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          name: document.getElementById('mcat-name').value.trim(),
          type: document.getElementById('mcat-type').value,
          group: document.getElementById('mcat-group').value,
          icon: document.getElementById('mcat-icon').value.trim(),
          color: document.getElementById('mcat-color').value
        };
        await api.createAdminMasterCategory(payload);
        this.app.showToast('Đã thêm danh mục chuẩn hệ thống!', 'success');
        closeModal();
        this.renderMasterDataTab(document.getElementById('admin-view-body'));
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi tạo danh mục', 'error');
      }
    });
  }

  // =========================================================================
  // 6. SYSTEM LOGS TAB & SECURITY SUB-TAB FILTERING (Cyber Security Console)
  // =========================================================================
  async renderLogsTab(container) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-500 text-xs animate-pulse flex flex-col items-center justify-center gap-2">
        <i class="fa-solid fa-shield-halved text-cyan-400 text-2xl animate-spin"></i>
        <span>Đang kết nối trung tâm an ninh & tải nhật ký kiểm toán...</span>
      </div>
    `;

    try {
      const data = await api.getAdminLogs();
      this.logsData = Array.isArray(data?.logs) ? data.logs : [];
      this.renderLogsContent(container);
    } catch (e) {
      container.innerHTML = `
        <div class="p-6 text-center text-rose-400 text-xs">
          <i class="fa-solid fa-triangle-exclamation text-base mb-2 block"></i>
          Lỗi khi tải Logs: ${e.message}
        </div>
      `;
    }
  }

  renderLogsContent(container) {
    if (!this.logsData) return;
    const allLogs = this.logsData;

    // Fast counters calculation for KPIs
    const totalLogs = allLogs.length;
    const countSecurity = allLogs.filter(l => (l.type || '').toUpperCase() === 'SECURITY').length;
    const countAi = allLogs.filter(l => {
      const t = (l.type || '').toUpperCase();
      return t === 'AI_API' || t === 'AI_ENGINE' || t === 'AI';
    }).length;
    const countData = allLogs.filter(l => {
      const t = (l.type || '').toUpperCase();
      return t === 'DATA_CHANGE' || t === 'CONFIG' || t === 'BACKUP';
    }).length;
    const countError = allLogs.filter(l => {
      const t = (l.type || '').toUpperCase();
      return t.includes('ERROR') || (l.level || '').toUpperCase() === 'ERROR';
    }).length;

    // Filter logs according to active subtab
    let filteredLogs = allLogs;
    const activeFilter = this.activeLogsFilter || 'logs_all';
    if (activeFilter === 'logs_security') {
      filteredLogs = allLogs.filter(l => (l.type || '').toUpperCase() === 'SECURITY');
    } else if (activeFilter === 'logs_ai') {
      filteredLogs = allLogs.filter(l => {
        const t = (l.type || '').toUpperCase();
        return t === 'AI_API' || t === 'AI_ENGINE' || t === 'AI';
      });
    } else if (activeFilter === 'logs_data') {
      filteredLogs = allLogs.filter(l => {
        const t = (l.type || '').toUpperCase();
        return t === 'DATA_CHANGE' || t === 'CONFIG' || t === 'BACKUP';
      });
    } else if (activeFilter === 'logs_error') {
      filteredLogs = allLogs.filter(l => {
        const t = (l.type || '').toUpperCase();
        return t.includes('ERROR') || (l.level || '').toUpperCase() === 'ERROR' || (l.level || '').toUpperCase() === 'WARNING';
      });
    }

    container.innerHTML = `
      <div class="space-y-5 admin-subtab-content-anim">
        
        <!-- 1. Log Summary KPI Cards (3 Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="admin-logs-kpi-container">
          
          <!-- Card 1: Tổng Sự Kiện (Cyan) -->
          <div class="glass-card p-4 rounded-2xl border border-cyan-500/30 relative overflow-hidden flex items-center justify-between shadow-lg shadow-cyan-500/5 group hover:border-cyan-400/60 transition-all duration-300">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition"></div>
            <div class="relative z-10">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Tổng Sự Kiện Ghi Nhận</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-black text-cyan-300 font-mono tracking-tight" id="kpi-logs-total">${totalLogs}</span>
                <span class="text-[10px] text-cyan-500 font-mono font-bold">events</span>
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg border border-cyan-500/30 shadow-sm relative z-10">
              <i class="fa-solid fa-list-check"></i>
            </div>
          </div>

          <!-- Card 2: Bảo Mật & Truy Cập (Rose) -->
          <div class="glass-card p-4 rounded-2xl border border-rose-500/30 relative overflow-hidden flex items-center justify-between shadow-lg shadow-rose-500/5 group hover:border-rose-400/60 transition-all duration-300">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/20 transition"></div>
            <div class="relative z-10">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Cảnh Báo Bảo Mật / Security</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-black text-rose-400 font-mono tracking-tight" id="kpi-logs-security">${countSecurity}</span>
                <span class="text-[10px] text-rose-500 font-mono font-bold">secured</span>
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-lg border border-rose-500/30 shadow-sm relative z-10">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
          </div>

          <!-- Card 3: Gọi AI & Vận Hành (Indigo) -->
          <div class="glass-card p-4 rounded-2xl border border-indigo-500/30 relative overflow-hidden flex items-center justify-between shadow-lg shadow-indigo-500/5 group hover:border-indigo-400/60 transition-all duration-300">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition"></div>
            <div class="relative z-10">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Lượt Gọi AI / System Operations</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-black text-indigo-300 font-mono tracking-tight" id="kpi-logs-ai">${countAi}</span>
                <span class="text-[10px] text-indigo-500 font-mono font-bold">inferences</span>
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-lg border border-indigo-500/30 shadow-sm relative z-10">
              <i class="fa-solid fa-brain"></i>
            </div>
          </div>

        </div>

        <!-- 2. Interactive Neon Filter Pills -->
        <div class="flex flex-wrap items-center gap-2 pt-1" id="admin-logs-filter-pills">
          <button type="button" data-log-filter="logs_all" 
            class="log-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilter === 'logs_all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.35)]' : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'}">
            <i class="fa-solid fa-file-lines text-xs text-cyan-400"></i>
            <span>Tất cả</span>
            <span class="px-1.5 py-0.2 rounded-md bg-slate-800/90 text-[10px] font-mono text-slate-300 border border-slate-700/50">${totalLogs}</span>
          </button>

          <button type="button" data-log-filter="logs_security" 
            class="log-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilter === 'logs_security' ? 'bg-rose-500/20 text-rose-300 border border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.35)]' : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'}">
            <i class="fa-solid fa-shield-halved text-xs text-rose-400"></i>
            <span>Bảo mật</span>
            <span class="px-1.5 py-0.2 rounded-md bg-slate-800/90 text-[10px] font-mono text-slate-300 border border-slate-700/50">${countSecurity}</span>
          </button>

          <button type="button" data-log-filter="logs_ai" 
            class="log-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilter === 'logs_ai' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.35)]' : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'}">
            <i class="fa-solid fa-robot text-xs text-indigo-400"></i>
            <span>Gọi AI API</span>
            <span class="px-1.5 py-0.2 rounded-md bg-slate-800/90 text-[10px] font-mono text-slate-300 border border-slate-700/50">${countAi}</span>
          </button>

          <button type="button" data-log-filter="logs_data" 
            class="log-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilter === 'logs_data' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.35)]' : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'}">
            <i class="fa-solid fa-arrows-rotate text-xs text-emerald-400"></i>
            <span>Đổi dữ liệu & Config</span>
            <span class="px-1.5 py-0.2 rounded-md bg-slate-800/90 text-[10px] font-mono text-slate-300 border border-slate-700/50">${countData}</span>
          </button>

          <button type="button" data-log-filter="logs_error" 
            class="log-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilter === 'logs_error' ? 'bg-red-500/20 text-red-300 border border-red-400/60 shadow-[0_0_15px_rgba(239,68,68,0.35)]' : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'}">
            <i class="fa-solid fa-circle-xmark text-xs text-red-400"></i>
            <span>Lỗi hệ thống</span>
            <span class="px-1.5 py-0.2 rounded-md bg-slate-800/90 text-[10px] font-mono text-slate-300 border border-slate-700/50">${countError}</span>
          </button>
        </div>

        <!-- 3. Softly Rounded Cyber Search & Controls Bar -->
        <div class="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 bg-slate-950/60 shadow-md">
          <div class="flex-1 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400/80">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" id="admin-logs-search" placeholder="Tìm kiếm theo hành động, IP, Email, chi tiết sự kiện..." 
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition" />
          </div>

          <div class="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
            <div class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Hiển thị:</span>
              <b class="text-cyan-300 font-bold" id="admin-logs-count">${filteredLogs.length}</b>
              <span>/ ${allLogs.length} sự kiện</span>
            </div>

            <button id="btn-refresh-logs" type="button" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs transition active:scale-95" title="Làm mới nhật ký">
              <i class="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        <!-- 4. Cyber Security Logs Table -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800 overflow-x-auto shadow-xl" id="admin-logs-table-container">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
                <th class="pb-3 font-bold">Thời Gian</th>
                <th class="pb-3 font-bold">Loại Log</th>
                <th class="pb-3 font-bold">Tài Khoản / Tác Nhân</th>
                <th class="pb-3 font-bold">Địa Chỉ IP</th>
                <th class="pb-3 font-bold">Hành Động</th>
                <th class="pb-3 font-bold">Chi Tiết Sự Kiện</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]" id="admin-logs-tbody">
              ${filteredLogs.length > 0 ? filteredLogs.map(l => {
                const t = (l.type || '').toUpperCase();
                
                // Badge Logic for LOG TYPE
                let badgeHtml = '';
                if (t === 'SECURITY') {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid fa-shield-halved text-rose-400"></i> SECURITY
                    </span>
                  `;
                } else if (t === 'DATA_CHANGE') {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)] inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid fa-database text-emerald-400"></i> DATA CHANGE
                    </span>
                  `;
                } else if (t === 'CONFIG' || t === 'BACKUP') {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid ${t === 'BACKUP' ? 'fa-server' : 'fa-sliders'} text-amber-400"></i> ${t}
                    </span>
                  `;
                } else if (t === 'AI_API' || t === 'AI_ENGINE' || t === 'AI') {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.25)] inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid fa-brain text-indigo-400"></i> AI API
                    </span>
                  `;
                } else if (t.includes('ERROR')) {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)] inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid fa-triangle-exclamation text-red-400"></i> ERROR
                    </span>
                  `;
                } else {
                  badgeHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap">
                      <i class="fa-solid fa-circle-info text-slate-400"></i> ${t}
                    </span>
                  `;
                }

                return `
                  <tr class="hover:bg-slate-800/40 transition group">
                    <td class="py-3 text-slate-400 whitespace-nowrap font-mono">
                      <i class="fa-regular fa-clock text-[10px] text-slate-500 mr-1"></i>${l.timestamp}
                    </td>
                    <td class="py-3">
                      ${badgeHtml}
                    </td>
                    <td class="py-3">
                      <div class="font-sans font-bold text-slate-200 flex items-center gap-1.5">
                        <i class="fa-solid ${t === 'SECURITY' ? 'fa-user-shield text-rose-400' : t === 'AI_API' ? 'fa-robot text-indigo-400' : 'fa-user-astronaut text-cyan-400'} text-xs"></i>
                        <span>${l.user}</span>
                      </div>
                    </td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-mono text-[10px] inline-flex items-center gap-1 shadow-sm">
                        <i class="fa-solid fa-network-wired text-[9px] text-cyan-400"></i>
                        ${l.ip}
                      </span>
                    </td>
                    <td class="py-3 text-cyan-300 font-bold font-sans">
                      ${l.action}
                    </td>
                    <td class="py-3 max-w-md">
                      <div class="font-mono text-[11px] text-slate-300 break-words leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-text bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60" title="${l.details}">
                        ${l.details}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500 text-xs font-sans">
                    <i class="fa-solid fa-satellite-dish text-3xl text-slate-700 mb-2 block animate-pulse"></i>
                    Không có sự kiện nhật ký nào thuộc bộ lọc này.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

      </div>
    `;

    // Bind Filter Pills click
    container.querySelectorAll('.log-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterKey = btn.getAttribute('data-log-filter');
        this.activeLogsFilter = filterKey;
        this.renderAdminSubTabs(this.activeAdminTab);
        this.renderLogsContent(container);
      });
    });

    // Real-time Search Input Listener
    const searchInput = document.getElementById('admin-logs-search');
    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      let matchCount = 0;
      document.querySelectorAll('#admin-logs-tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = text.includes(q);
        row.style.display = matches ? '' : 'none';
        if (matches) matchCount++;
      });
      const countEl = document.getElementById('admin-logs-count');
      if (countEl) countEl.textContent = matchCount;
    });

    // Refresh Button Listener
    document.getElementById('btn-refresh-logs')?.addEventListener('click', async (e) => {
      const icon = e.currentTarget.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      await this.renderLogsTab(container);
      this.app.showToast('Đã làm mới nhật ký kiểm toán hệ thống!', 'info');
    });
  }

  applyLogsFilter(filterId) {
    const container = document.getElementById('admin-view-body');
    if (!container) return;
    this.activeLogsFilter = filterId;
    this.renderLogsContent(container);
  }

  // =========================================================================
  // 9. SYSTEM SETTINGS TAB & SUB-TAB FILTERING
  // =========================================================================
  async renderSettingsTab(container) {
    container.innerHTML = `<div class="py-16 text-center text-slate-500 text-xs animate-pulse">Đang tải cấu hình hệ thống...</div>`;

    try {
      const data = await api.getAdminSettings();
      this.settingsData = data;
      this.renderSettingsContent(container);
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải Settings: ${e.message}</div>`;
    }
  }

  renderSettingsContent(container) {
    if (!this.settingsData) return;
    const data = this.settingsData || {};
    const smtp = data.smtp || { host: '', port: 587, sender_email: '', sender_name: '' };
    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Tab 1: Broadcast & Direct Notification Creator Box -->
          <div id="settings-module-broadcast" class="glass-card p-6 rounded-3xl space-y-4 border ${this.activeSettingsFilter === 'settings_broadcast' ? 'border-rose-500 shadow-xl shadow-rose-500/10' : 'border-slate-800'} transition">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-bullhorn text-rose-400"></i>
                Tab 1: Trung Tâm Phát Thông Báo Hệ Thống
              </h3>
              <span class="text-[10px] text-slate-400 font-mono">Chung & Riêng</span>
            </div>

            <form id="broadcast-form" class="space-y-3 text-xs">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Đối tượng nhận thông báo</label>
                  <select id="bcast-target" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                    <option value="ALL">🌐 Toàn bộ người dùng (All Users)</option>
                    <option value="FREE">👤 Chỉ người dùng Gói Free</option>
                    <option value="PRO">⭐ Chỉ người dùng Gói Pro</option>
                    <option value="PREMIUM">👑 Chỉ người dùng FinTrack Premium</option>
                    <option value="PLATINUM">👑💎 Chỉ người dùng Platinum VIP</option>
                    <option value="USER">📩 Gửi riêng cho 1 người dùng cụ thể</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">Mức độ / Phân loại</label>
                  <select id="bcast-type" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                    <option value="INFO">ℹ️ Tin tức / Cập nhật (Info)</option>
                    <option value="SUCCESS">🎉 Thành tích & Khen thưởng (Success)</option>
                    <option value="PROMOTION">👑 Ưu đãi VIP & Khuyến mãi (Promo)</option>
                    ${!isModerator ? `
                      <option value="WARNING">⚠️ Cảnh báo bảo mật hệ thống cấp cao</option>
                      <option value="MAINTENANCE">⚙️ Bảo trì hệ thống (Maintenance)</option>
                    ` : ''}
                  </select>
                </div>
              </div>

              <!-- Conditional Email Input for Personal Target -->
              <div id="bcast-email-container" class="hidden">
                <label class="block font-bold text-purple-300 mb-1">Email người nhận cụ thể (hoặc User ID)</label>
                <input type="text" id="bcast-user-email" placeholder="Nhập email người dùng nhận thông báo (vd: user@fintrack.ai)..." 
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-purple-500/50 text-slate-100 focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Tiêu đề thông báo</label>
                <input type="text" id="bcast-title" required placeholder="Ví dụ: Ưu đãi nâng cấp VIP 50% hoặc Tin tức tính năng mới" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500" />
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Nội dung thông báo</label>
                <textarea id="bcast-msg" rows="3" required placeholder="Nội dung chi tiết thông báo gửi đến người dùng..." 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500"></textarea>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Điều hướng Tab khi User bấm vào (Tùy chọn)</label>
                <select id="bcast-link-tab" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                  <option value="">-- Không điều hướng --</option>
                  <option value="subscription">👑 Gói Dịch Vụ & VIP</option>
                  <option value="budgets">🎯 Hạn Mức Ngân Sách</option>
                  <option value="wallets">💳 Ví & Tài Khoản</option>
                  <option value="ai_assistant">🤖 Trợ Lý AI FinTrack</option>
                  <option value="badges">🏆 Huy Hiệu & Thành Tích</option>
                  <option value="analytics">📊 Phân Tích Báo Cáo</option>
                  <option value="transactions">🧾 Sổ Giao Dịch</option>
                  <option value="dashboard">🏠 Tổng Quan Dashboard</option>
                </select>
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl gradient-rose text-white font-bold shadow-md shadow-rose-500/25 active:scale-95 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-paper-plane text-xs"></i>
                <span>Phát / Gửi Thông Báo Ngay</span>
              </button>
            </form>
          </div>

          <!-- Tab 2: Mail Server SMTP Configuration Box -->
          <div id="settings-module-smtp" class="glass-card p-6 rounded-3xl space-y-4 border ${this.activeSettingsFilter === 'settings_smtp' ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-slate-800'} transition">
            <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <i class="fa-solid fa-envelope text-blue-400"></i>
              Tab 2: Cấu Hình Máy Chủ Mail (SMTP)
            </h3>
            <form id="smtp-form" class="space-y-3 text-xs">
              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <label class="block font-bold text-slate-300 mb-1">SMTP Host</label>
                  <input type="text" id="smtp-host" value="${smtp.host}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono" />
                </div>
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Port</label>
                  <input type="number" id="smtp-port" value="${smtp.port}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono" />
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Sender Email</label>
                <input type="email" id="smtp-sender" value="${smtp.sender_email}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono" />
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Sender Display Name</label>
                <input type="text" id="smtp-name" value="${smtp.sender_name}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100" />
              </div>
              <button type="submit" class="w-full py-2.5 rounded-xl gradient-indigo text-white font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition">
                <i class="fa-solid fa-floppy-disk mr-1.5"></i> Lưu Cấu Hình SMTP
              </button>
            </form>
          </div>

        </div>

        <!-- Sent Notifications History Table Card -->
        <div class="glass-card p-6 rounded-3xl space-y-4 border border-slate-800" id="admin-sent-notifs-card">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center text-sm border border-pink-500/30">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <h4 class="text-sm font-extrabold text-slate-100">Lịch Sử Thông Báo Đã Gửi (Database Realtime)</h4>
                <p class="text-[11px] text-slate-400">Danh sách toàn bộ thông báo chung & riêng đã phát hành</p>
              </div>
            </div>
            <button id="btn-refresh-admin-notifs" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5">
              <i class="fa-solid fa-rotate text-[11px]"></i>
              <span>Làm mới</span>
            </button>
          </div>

          <div id="admin-sent-notifs-table-container" class="overflow-x-auto">
            <div class="py-8 text-center text-slate-500 text-xs animate-pulse">
              Đang tải danh sách thông báo...
            </div>
          </div>
        </div>

        <!-- Tab 3 & 4: Backup Snapshot & Platform Security Keys -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Tab 3: Backup & Database Snapshot Status -->
          <div id="settings-module-backup" class="glass-card p-6 rounded-3xl flex flex-col justify-between border ${this.activeSettingsFilter === 'settings_backup' ? 'border-teal-500 shadow-xl shadow-teal-500/10' : 'border-slate-800'} transition">
            <div class="flex items-center gap-3.5 mb-4">
              <div class="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center text-xl border border-teal-500/30 flex-shrink-0">
                <i class="fa-solid fa-database"></i>
              </div>
              <div>
                <h4 class="text-sm font-extrabold text-slate-100">Tab 3: Sao Lưu Cơ Sở Dữ Liệu (Snapshot)</h4>
                <p class="text-xs text-slate-400">Dung lượng: <b>${data.backup_info.db_size}</b> &bull; Lần sao lưu gần nhất: <b>${data.backup_info.last_backup}</b></p>
              </div>
            </div>
            <a href="/api/v1/backup/export" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-download text-teal-400"></i>
              <span>Tải Bản Snapshot JSON Toàn Sàn</span>
            </a>
          </div>

          <!-- Tab 4: Platform Security Keys -->
          <div id="settings-module-security" class="glass-card p-6 rounded-3xl flex flex-col justify-between border ${this.activeSettingsFilter === 'settings_security' ? 'border-amber-500 shadow-xl shadow-amber-500/10' : 'border-slate-800'} transition">
            <div class="flex items-center gap-3.5 mb-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl border border-amber-500/30 flex-shrink-0">
                <i class="fa-solid fa-key"></i>
              </div>
              <div>
                <h4 class="text-sm font-extrabold text-slate-100">Tab 4: Khóa API & Bảo Mật Nền Tảng</h4>
                <p class="text-xs text-slate-400">JWT Secret Key & Khóa mã hóa Zero-PII Sanitizer</p>
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Status: <b class="text-emerald-400">ENCRYPTED (HS256)</b></span>
              <span class="text-slate-500 font-bold">256-bit AES</span>
            </div>
          </div>

        </div>

      </div>
    `;

    // Target dropdown change toggle
    const targetSelect = document.getElementById('bcast-target');
    const emailContainer = document.getElementById('bcast-email-container');
    targetSelect?.addEventListener('change', () => {
      if (targetSelect.value === 'USER') {
        emailContainer?.classList.remove('hidden');
      } else {
        emailContainer?.classList.add('hidden');
      }
    });

    document.getElementById('broadcast-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const target = document.getElementById('bcast-target').value;
        const payload = {
          title: document.getElementById('bcast-title').value.trim(),
          message: document.getElementById('bcast-msg').value.trim(),
          type: document.getElementById('bcast-type').value,
          target_type: target,
          user_email: target === 'USER' ? document.getElementById('bcast-user-email').value.trim() : null,
          link_tab: document.getElementById('bcast-link-tab').value || null
        };
        await api.createAdminNotification(payload);
        this.app.showToast('Đã gửi thông báo thành công!', 'success');
        document.getElementById('bcast-title').value = '';
        document.getElementById('bcast-msg').value = '';
        if (document.getElementById('bcast-user-email')) {
          document.getElementById('bcast-user-email').value = '';
        }
        await this.loadAdminNotificationsHistory();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi gửi thông báo', 'error');
      }
    });

    document.getElementById('btn-refresh-admin-notifs')?.addEventListener('click', () => {
      this.loadAdminNotificationsHistory();
    });

    document.getElementById('smtp-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          host: document.getElementById('smtp-host').value.trim(),
          port: parseInt(document.getElementById('smtp-port').value),
          sender_email: document.getElementById('smtp-sender').value.trim(),
          sender_name: document.getElementById('smtp-name').value.trim(),
          is_enabled: true
        };
        await api.updateAdminSMTP(payload);
        this.app.showToast('Đã lưu cấu hình Mail Server thành công!', 'success');
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu SMTP', 'error');
      }
    });

    // Load initial history table
    this.loadAdminNotificationsHistory();
  }

  async loadAdminNotificationsHistory() {
    const container = document.getElementById('admin-sent-notifs-table-container');
    if (!container) return;

    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    try {
      const data = await api.getAdminNotifications();
      const notifs = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data?.items) ? data.items : []);

      if (notifs.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center text-slate-500 text-xs">
            Chưa có thông báo nào được tạo trong hệ thống.
          </div>
        `;
        return;
      }

      container.innerHTML = this.renderNotificationsTableHtml(notifs, isModerator, 'btn-admin-del-notif');

      container.querySelectorAll('.btn-admin-del-notif').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          const title = btn.getAttribute('data-title') || `Thông báo #${id}`;
          this.showAdminConfirmDeleteNotifModal(id, title, async () => {
            try {
              await api.deleteAdminNotification(id);
              this.app.showToast(`Đã xóa thông báo #${id} thành công!`, 'success');
              await this.loadAdminNotificationsHistory();
            } catch (err) {
              this.app.showToast(err.message || 'Lỗi khi xóa thông báo', 'error');
            }
          });
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-center text-rose-400 text-xs">Lỗi tải lịch sử: ${err.message}</div>`;
    }
  }

  applySettingsFilter(filterId) {
    const map = {
      'settings_broadcast': 'settings-module-broadcast',
      'settings_smtp': 'settings-module-smtp',
      'settings_backup': 'settings-module-backup',
      'settings_security': 'settings-module-security'
    };

    const targetEl = document.getElementById(map[filterId]);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('cyber-card-highlight');
      setTimeout(() => targetEl.classList.remove('cyber-card-highlight'), 1300);
    }
  }

  // =========================================================================
  // 7. DEDICATED ADMIN NOTIFICATIONS MANAGEMENT TAB
  // =========================================================================
  async renderAdminNotificationsTab(container) {
    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- Header Banner & Quick Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-notifs-kpi-container">
          <div class="glass-card p-4 rounded-2xl border border-pink-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Thông Báo</span>
              <span class="text-xl font-black text-slate-100 font-mono" id="admin-kpi-notifs-total">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-base border border-pink-500/30">
              <i class="fa-solid fa-bullhorn"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lượt Người Đọc</span>
              <span class="text-xl font-black text-cyan-300 font-mono" id="admin-kpi-notifs-reads">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-base border border-cyan-500/30">
              <i class="fa-solid fa-eye"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toàn Sàn / Gói Cước</span>
              <span class="text-xl font-black text-amber-300 font-mono" id="admin-kpi-notifs-broadcast">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base border border-amber-500/30">
              <i class="fa-solid fa-globe"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tin Nhắn Riêng</span>
              <span class="text-xl font-black text-purple-300 font-mono" id="admin-kpi-notifs-personal">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base border border-purple-500/30">
              <i class="fa-solid fa-lock"></i>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Form Composer + Live History Table -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left: Notification Composer Form (5 Cols) -->
          <div class="glass-card p-6 rounded-3xl space-y-4 border border-rose-500/40 lg:col-span-5 flex flex-col justify-between shadow-xl shadow-rose-500/5" id="admin-notif-composer-card">
            <div>
              <div class="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
                <div class="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-base border border-rose-500/30">
                  <i class="fa-solid fa-paper-plane"></i>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-slate-100">Soạn & Phát Thông Báo</h3>
                  <p class="text-[11px] text-slate-400">Gửi đến Toàn sàn, Theo gói cước hoặc Riêng từng User</p>
                </div>
              </div>

              <form id="admin-tab-broadcast-form" class="space-y-3 text-xs">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Đối tượng nhận thông báo</label>
                  <select id="atab-bcast-target" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                    <option value="ALL">🌐 Toàn bộ người dùng (All Users)</option>
                    <option value="FREE">👤 Chỉ người dùng Gói Free</option>
                    <option value="PRO">⭐ Chỉ người dùng Gói Pro</option>
                    <option value="PREMIUM">👑 Chỉ người dùng FinTrack Premium</option>
                    <option value="PLATINUM">👑💎 Chỉ người dùng Platinum VIP</option>
                    <option value="USER">📩 Gửi riêng cho 1 người dùng cụ thể</option>
                  </select>
                </div>

                <div id="atab-bcast-email-box" class="hidden">
                  <label class="block font-bold text-purple-300 mb-1">Email hoặc User ID người nhận</label>
                  <input type="text" id="atab-bcast-email" placeholder="Nhập email người dùng nhận tin (vd: user@fintrack.ai)..." 
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-purple-500/50 text-slate-100 focus:ring-2 focus:ring-purple-500" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Loại thông báo</label>
                    <select id="atab-bcast-type" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                      <option value="INFO">ℹ️ Tin tức / Cập nhật (Info)</option>
                      <option value="SUCCESS">🎉 Khen thưởng (Success)</option>
                      <option value="PROMOTION">👑 Ưu đãi VIP & Tin chung</option>
                      ${!isModerator ? `
                        <option value="WARNING">⚠️ Cảnh báo bảo mật hệ thống cấp cao</option>
                        <option value="MAINTENANCE">⚙️ Bảo trì hệ thống</option>
                      ` : ''}
                    </select>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Điều hướng Tab</label>
                    <select id="atab-bcast-link" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500">
                      <option value="">-- Không điều hướng --</option>
                      <option value="subscription">👑 Gói VIP</option>
                      <option value="budgets">🎯 Ngân Sách</option>
                      <option value="wallets">💳 Ví Tiền</option>
                      <option value="ai_assistant">🤖 Chat AI</option>
                      <option value="badges">🏆 Huy Hiệu</option>
                      <option value="analytics">📊 Báo Cáo</option>
                      <option value="transactions">🧾 Sổ Giao Dịch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">Tiêu đề thông báo</label>
                  <input type="text" id="atab-bcast-title" required placeholder="Tiêu đề thông báo..." 
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500" />
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">Nội dung chi tiết</label>
                  <textarea id="atab-bcast-msg" rows="4" required placeholder="Nhập nội dung chi tiết thông báo..." 
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-rose-500"></textarea>
                </div>

                <button type="submit" class="w-full py-2.5 rounded-xl gradient-rose text-white font-bold shadow-md shadow-rose-500/25 active:scale-95 transition flex items-center justify-center gap-2">
                  <i class="fa-solid fa-paper-plane text-xs"></i>
                  <span>Phát Hành Thông Báo Ngay</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Right: Live Realtime Database History Table (7 Cols) -->
          <div class="glass-card p-6 rounded-3xl space-y-4 border border-slate-800 lg:col-span-7 flex flex-col justify-between" id="admin-notif-history-card">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center text-base border border-pink-500/30">
                    <i class="fa-solid fa-list-check"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Danh Sách Thông Báo Đã Phát</h3>
                    <p class="text-[11px] text-slate-400">Trực tiếp từ Database &bull; Theo dõi lượt đọc</p>
                  </div>
                </div>

                <button id="btn-admin-tab-refresh-notifs" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5">
                  <i class="fa-solid fa-rotate text-[11px]"></i>
                  <span>Làm mới</span>
                </button>
              </div>

              <div id="admin-tab-notifs-table-container" class="overflow-x-auto">
                <div class="py-12 text-center text-slate-500 text-xs animate-pulse">
                  Đang tải danh sách thông báo...
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Target select toggle email box
    const targetSelect = document.getElementById('atab-bcast-target');
    const emailBox = document.getElementById('atab-bcast-email-box');
    targetSelect?.addEventListener('change', () => {
      if (targetSelect.value === 'USER') {
        emailBox?.classList.remove('hidden');
      } else {
        emailBox?.classList.add('hidden');
      }
    });

    // Form submit handler
    document.getElementById('admin-tab-broadcast-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const target = document.getElementById('atab-bcast-target').value;
        const payload = {
          title: document.getElementById('atab-bcast-title').value.trim(),
          message: document.getElementById('atab-bcast-msg').value.trim(),
          type: document.getElementById('atab-bcast-type').value,
          target_type: target,
          user_email: target === 'USER' ? document.getElementById('atab-bcast-email').value.trim() : null,
          link_tab: document.getElementById('atab-bcast-link').value || null
        };
        await api.createAdminNotification(payload);
        this.app.showToast('Đã phát hành thông báo thành công!', 'success');
        document.getElementById('atab-bcast-title').value = '';
        document.getElementById('atab-bcast-msg').value = '';
        if (document.getElementById('atab-bcast-email')) {
          document.getElementById('atab-bcast-email').value = '';
        }
        await this.loadAdminTabNotifications();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi phát thông báo', 'error');
      }
    });

    document.getElementById('btn-admin-tab-refresh-notifs')?.addEventListener('click', () => {
      this.loadAdminTabNotifications();
    });

    await this.loadAdminTabNotifications();
  }

  async loadAdminTabNotifications() {
    const tableContainer = document.getElementById('admin-tab-notifs-table-container');
    if (!tableContainer) return;

    const role = (this.app?.currentUser?.role || '').toUpperCase();
    const isModerator = role === 'MODERATOR';

    try {
      const data = await api.getAdminNotifications();
      let notifs = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data?.items) ? data.items : []);

      // Calculate KPIs
      const totalCount = notifs.length;
      const totalReads = notifs.reduce((acc, curr) => acc + (curr.reads_count || 0), 0);
      const personalCount = notifs.filter(n => n.user_id != null).length;
      const broadcastCount = notifs.filter(n => n.user_id == null).length;

      const kpiTotal = document.getElementById('admin-kpi-notifs-total');
      const kpiReads = document.getElementById('admin-kpi-notifs-reads');
      const kpiBcast = document.getElementById('admin-kpi-notifs-broadcast');
      const kpiPersonal = document.getElementById('admin-kpi-notifs-personal');

      if (kpiTotal) kpiTotal.textContent = totalCount;
      if (kpiReads) kpiReads.textContent = totalReads;
      if (kpiBcast) kpiBcast.textContent = broadcastCount;
      if (kpiPersonal) kpiPersonal.textContent = personalCount;

      // Filter based on active subtab
      if (this.activeNotifFilter === 'notif_broadcast') {
        notifs = notifs.filter(n => n.target_type === 'ALL' && !n.user_id);
      } else if (this.activeNotifFilter === 'notif_vip') {
        notifs = notifs.filter(n => ['PRO', 'PREMIUM', 'PLATINUM', 'VIP'].includes(n.target_type));
      } else if (this.activeNotifFilter === 'notif_personal') {
        notifs = notifs.filter(n => n.user_id != null);
      }

      if (notifs.length === 0) {
        tableContainer.innerHTML = `
          <div class="py-12 text-center text-slate-500 text-xs">
            <i class="fa-regular fa-bell-slash text-2xl text-slate-600 mb-2 block"></i>
            Chưa có thông báo nào trong mục này.
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = this.renderNotificationsTableHtml(notifs, isModerator, 'btn-admin-tab-del-notif');

      tableContainer.querySelectorAll('.btn-admin-tab-del-notif').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          const title = btn.getAttribute('data-title') || `Thông báo #${id}`;
          this.showAdminConfirmDeleteNotifModal(id, title, async () => {
            try {
              await api.deleteAdminNotification(id);
              this.app.showToast(`Đã xóa thông báo #${id} thành công!`, 'success');
              await this.loadAdminTabNotifications();
            } catch (err) {
              this.app.showToast(err.message || 'Lỗi khi xóa thông báo', 'error');
            }
          });
        });
      });

    } catch (err) {
      tableContainer.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base mb-2 block"></i>
          Không thể tải danh sách thông báo: ${err.message || 'Lỗi kết nối máy chủ'}. Vui lòng thử lại sau.
        </div>
      `;
    }
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showAdminConfirmDeleteNotifModal(notifId, notifTitle, onConfirm) {
    document.getElementById('modal-admin-delete-notif-confirm')?.remove();

    const safeTitle = this.escapeHtml(notifTitle || `Thông báo #${notifId}`);
    const modalHtml = `
      <div id="modal-admin-delete-notif-confirm" class="modal-backdrop-blur fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
        <div class="relative w-full max-w-sm glass-card bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 shadow-2xl shadow-rose-500/10 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-xl border border-rose-500/30 shrink-0">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-slate-100">Xác Nhận Xóa Thông Báo</h4>
              <p class="text-[11px] text-slate-400">Hành động này không thể hoàn tác</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div class="font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> ID #${notifId}
            </div>
            <div class="font-semibold text-slate-200 text-xs truncate leading-relaxed" title="${safeTitle}">
              ${safeTitle}
            </div>
          </div>

          <p class="text-[11px] text-slate-400 leading-relaxed">
            Bạn có chắc chắn muốn gỡ bỏ thông báo này khỏi hệ thống không? Toàn bộ dữ liệu phân phối và lượt đọc liên quan cũng sẽ bị xóa.
          </p>

          <div class="flex items-center gap-2.5 pt-1">
            <button type="button" id="btn-cancel-del-notif" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition active:scale-95">
              Hủy bỏ
            </button>
            <button type="button" id="btn-confirm-del-notif" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 active:scale-95 transition flex items-center justify-center gap-1.5">
              <i class="fa-regular fa-trash-can text-xs"></i>
              <span>Xóa vĩnh viễn</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('modal-admin-delete-notif-confirm');
    const closeBtn = document.getElementById('btn-cancel-del-notif');
    const confirmBtn = document.getElementById('btn-confirm-del-notif');
    let escHandler = null;
    const closeModal = () => {
      if (escHandler) {
        document.removeEventListener('keydown', escHandler);
      }
      modalEl?.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    modalEl?.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', escHandler);

    confirmBtn?.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Đang xóa...</span>`;
      closeModal();
      document.removeEventListener('keydown', escHandler);
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    });
  }

  renderNotificationsTableHtml(notifs, isModerator, delBtnClass = 'btn-admin-tab-del-notif') {
    return `
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[10px] font-mono bg-slate-900/40">
            <th class="py-3 px-3.5 font-bold w-14 text-center">ID</th>
            <th class="py-3 px-3.5 font-bold min-w-[220px] max-w-[300px]">Tiêu Đề & Nội Dung</th>
            <th class="py-3 px-3.5 font-bold min-w-[150px] max-w-[190px]">Người Nhận</th>
            <th class="py-3 px-3.5 font-bold text-center w-28">Lượt Đọc</th>
            <th class="py-3 px-3.5 font-bold text-center w-36">Thời Gian</th>
            <th class="py-3 px-3.5 font-bold text-center w-20">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-sans text-xs">
          ${notifs.map(n => {
            const isProtected = isModerator && (n.created_by_role === 'ADMIN' || ['CRITICAL', 'SECURITY', 'SYSTEM_CRITICAL', 'MAINTENANCE', 'WARNING'].includes(n.type));

            // 1. Type badge
            let typeBadgeHtml = '';
            const t = (n.type || 'INFO').toUpperCase();
            if (t === 'SUCCESS') {
              typeBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/5"><i class="fa-solid fa-circle-check text-[9px]"></i> SUCCESS</span>`;
            } else if (t === 'WARNING') {
              typeBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/5"><i class="fa-solid fa-triangle-exclamation text-[9px]"></i> WARNING</span>`;
            } else if (t === 'PROMOTION') {
              typeBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5"><i class="fa-solid fa-crown text-[9px]"></i> PROMOTION</span>`;
            } else if (t === 'MAINTENANCE') {
              typeBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/5"><i class="fa-solid fa-screwdriver-wrench text-[9px]"></i> MAINTENANCE</span>`;
            } else {
              typeBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/5"><i class="fa-solid fa-circle-info text-[9px]"></i> INFO</span>`;
            }

            // 2. Link tab badge
            const linkBadgeHtml = n.link_tab ? `
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" title="Điều hướng đến tab: ${this.escapeHtml(n.link_tab)}">
                <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i> ${this.escapeHtml(n.link_tab)}
              </span>
            ` : '';

            // 3. Recipient HTML
            let recipientHtml = '';
            const targetType = (n.target_type || 'ALL').toUpperCase();

            if (targetType === 'ALL' && !n.user_id) {
              recipientHtml = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-bold whitespace-nowrap shadow-sm shadow-sky-500/5">
                  <i class="fa-solid fa-globe text-[10px] text-sky-400"></i> Toàn bộ người dùng
                </span>
              `;
            } else if (targetType === 'FREE' && !n.user_id) {
              recipientHtml = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-850 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold whitespace-nowrap">
                  <i class="fa-solid fa-user text-[10px] text-slate-400"></i> Gói Free
                </span>
              `;
            } else if (targetType === 'PRO' && !n.user_id) {
              recipientHtml = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[11px] font-bold whitespace-nowrap shadow-sm shadow-amber-500/5">
                  <i class="fa-solid fa-star text-[10px] text-amber-400"></i> Gói Pro
                </span>
              `;
            } else if (targetType === 'PREMIUM' && !n.user_id) {
              recipientHtml = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[11px] font-bold whitespace-nowrap shadow-sm shadow-emerald-500/5">
                  <i class="fa-solid fa-crown text-[10px] text-emerald-400"></i> VIP Premium
                </span>
              `;
            } else if (targetType === 'PLATINUM' && !n.user_id) {
              recipientHtml = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[11px] font-bold whitespace-nowrap shadow-sm shadow-purple-500/5">
                  <i class="fa-solid fa-gem text-[10px] text-purple-400"></i> Platinum VIP
                </span>
              `;
            } else {
              const rawInfo = n.recipient_info || (n.user_id ? `User ID #${n.user_id}` : 'Toàn sàn');
              let uName = n.user_full_name || rawInfo;
              let uEmail = n.user_email || '';

              if (!uEmail && rawInfo.includes('(') && rawInfo.includes(')')) {
                const match = rawInfo.match(/^(?:Riêng:\s*)?(.*?)\s*\((.*?)\)$/);
                if (match) {
                  uName = match[1].trim();
                  uEmail = match[2].trim();
                }
              } else if (!uEmail && rawInfo.startsWith('Riêng:')) {
                uName = rawInfo.replace('Riêng:', '').trim();
              }

              recipientHtml = `
                <div class="flex flex-col max-w-[160px] min-w-0">
                  <div class="flex items-center gap-1.5 text-slate-200 font-bold text-xs truncate" title="${this.escapeHtml(uName)}">
                    <i class="fa-solid fa-user-tag text-purple-400 text-[10px] shrink-0"></i>
                    <span class="truncate">${this.escapeHtml(uName)}</span>
                  </div>
                  ${uEmail ? `
                    <span class="text-[10px] text-slate-400 font-mono truncate pl-3.5 mt-0.5" title="${this.escapeHtml(uEmail)}">
                      ${this.escapeHtml(uEmail)}
                    </span>
                  ` : ''}
                </div>
              `;
            }

            return `
              <tr class="hover:bg-slate-800/40 transition-colors duration-150">
                <td class="py-3.5 px-3.5 text-center align-middle font-mono">
                  <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-bold">#${n.id}</span>
                </td>
                <td class="py-3.5 px-3.5 align-middle max-w-[300px]">
                  <div class="space-y-1">
                    <div class="font-bold text-slate-100 text-xs truncate leading-snug" title="${this.escapeHtml(n.title)}">
                      ${this.escapeHtml(n.title)}
                    </div>
                    <p class="text-[11px] text-slate-400 truncate leading-relaxed" title="${this.escapeHtml(n.message)}">
                      ${this.escapeHtml(n.message)}
                    </p>
                    <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                      ${typeBadgeHtml}
                      ${linkBadgeHtml}
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-3.5 align-middle">
                  ${recipientHtml}
                </td>
                <td class="py-3.5 px-3.5 text-center align-middle">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono text-xs font-bold shadow-sm shadow-cyan-500/10" title="${n.reads_count || 0} lượt người đọc">
                    <i class="fa-regular fa-eye text-[11px] text-cyan-400"></i>
                    <span>${n.reads_count || 0}</span>
                  </div>
                </td>
                <td class="py-3.5 px-3.5 text-center align-middle whitespace-nowrap">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 font-mono text-[11px]">
                    <i class="fa-regular fa-clock text-[10px] text-slate-500"></i>
                    <span>${this.escapeHtml(n.created_at || '---')}</span>
                  </div>
                </td>
                <td class="py-3.5 px-3.5 text-center align-middle">
                  ${isProtected ? `
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-500 border border-slate-700/60 font-mono" title="Thông báo do Root Admin phát hành - Không thể xóa">
                      <i class="fa-solid fa-lock text-[9px] text-amber-400"></i> Khóa
                    </span>
                  ` : `
                    <button type="button" class="${delBtnClass} inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 active:scale-90 transition-all duration-200 shadow-sm shadow-rose-500/5 hover:shadow-rose-500/20" 
                      data-id="${n.id}" 
                      data-title="${this.escapeHtml(n.title)}" 
                      title="Xóa thông báo #${n.id}">
                      <i class="fa-regular fa-trash-can text-xs"></i>
                    </button>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  applyNotificationsFilter(filterId) {
    if (filterId === 'notif_create_box') {
      const composer = document.getElementById('admin-notif-composer-card');
      if (composer) {
        composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        composer.classList.add('cyber-card-highlight');
        setTimeout(() => composer.classList.remove('cyber-card-highlight'), 1300);
      }
      return;
    }
    this.loadAdminTabNotifications();
  }

  // =========================================================================
  // 3. VIP SUBSCRIPTION ORDERS MANAGEMENT (Billing & Orders)
  // =========================================================================
  async renderSubscriptionsTab(container) {
    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- KPI Metrics Header (4 Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-orders-kpi-container">
          <div class="glass-card p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Đơn Hàng</span>
              <span class="text-xl font-black text-slate-100 font-mono" id="kpi-orders-total">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-base border border-blue-500/30 shadow-sm">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã Tự Động Duyệt</span>
              <span class="text-xl font-black text-emerald-400 font-mono" id="kpi-orders-auto-approved">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/30 shadow-sm">
              <i class="fa-solid fa-bolt"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cần Đối Soát (Chờ Duyệt)</span>
              <span class="text-xl font-black text-amber-300 font-mono" id="kpi-orders-pending">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base border border-amber-500/30 shadow-sm">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doanh Thu VIP Thực Tế</span>
              <span class="text-xl font-black text-purple-300 font-mono" id="kpi-orders-revenue">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base border border-purple-500/30 shadow-sm">
              <i class="fa-solid fa-coins"></i>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative flex-1 sm:w-72">
              <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input type="text" id="admin-orders-search" placeholder="Tìm mã đơn, tên, email, cú pháp CK..." 
                class="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <select id="admin-orders-status-select" class="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">📋 Tất cả trạng thái</option>
              <option value="PENDING">⚠️ Cần đối soát thủ công (Chờ duyệt)</option>
              <option value="APPROVED">✅ Đã duyệt (Approved)</option>
              <option value="REJECTED">❌ Đã từ chối (Rejected)</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-export-orders-csv" class="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition flex items-center gap-1.5 active:scale-95">
              <i class="fa-solid fa-file-excel"></i>
              <span>Xuất File CSV</span>
            </button>
            <button id="btn-refresh-orders" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition" title="Làm mới">
              <i class="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        <!-- Table Container -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800 overflow-x-auto" id="admin-orders-table-container">
          <div class="py-12 text-center text-slate-500 text-xs animate-pulse">Đang tải danh sách đơn hàng...</div>
        </div>

      </div>
    `;

    // Event listeners
    document.getElementById('admin-orders-search')?.addEventListener('input', () => {
      this.loadAdminSubscriptions();
    });

    document.getElementById('admin-orders-status-select')?.addEventListener('change', (e) => {
      this.activeOrdersFilter = `orders_${e.target.value.toLowerCase()}`;
      this.loadAdminSubscriptions();
    });

    document.getElementById('btn-export-orders-csv')?.addEventListener('click', async () => {
      try {
        await api.downloadAdminExport('subscriptions');
        this.app.showToast('Đã tải xuống file CSV Đơn hàng & Doanh thu!', 'success');
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi xuất file', 'error');
      }
    });

    document.getElementById('btn-refresh-orders')?.addEventListener('click', () => {
      this.loadAdminSubscriptions();
    });

    await this.loadAdminSubscriptions();
  }

  async loadAdminSubscriptions() {
    const tableContainer = document.getElementById('admin-orders-table-container');
    if (!tableContainer) return;

    let statusFilter = 'ALL';
    if (this.activeOrdersFilter === 'orders_pending') statusFilter = 'PENDING';
    else if (this.activeOrdersFilter === 'orders_approved') statusFilter = 'APPROVED';
    else if (this.activeOrdersFilter === 'orders_rejected') statusFilter = 'REJECTED';

    const statusSelect = document.getElementById('admin-orders-status-select');
    if (statusSelect) statusSelect.value = statusFilter;

    const search = document.getElementById('admin-orders-search')?.value.trim() || '';

    try {
      const data = await api.getAdminSubscriptionOrders(statusFilter, search);
      const orders = Array.isArray(data?.orders) ? data.orders : (Array.isArray(data?.items) ? data.items : []);
      const kpi = data?.kpi || {};

      // Update 4 Summary KPI Cards
      const kTotal = document.getElementById('kpi-orders-total');
      const kAuto = document.getElementById('kpi-orders-auto-approved');
      const kPending = document.getElementById('kpi-orders-pending');
      const kRev = document.getElementById('kpi-orders-revenue');

      const autoApprovedCount = (kpi.auto_approved_count !== undefined) 
        ? kpi.auto_approved_count 
        : orders.filter(o => (o.status === 'APPROVED' || o.status === 'PAID') && (
            o.payment_method === 'REAL_WALLET' || 
            o.payment_method === 'REAL_WALLET_DIRECT' || 
            o.payment_method === 'AUTO_MOCK_BANK' || 
            (o.approved_by && (
              o.approved_by.toUpperCase().includes('AUTO') || 
              o.approved_by.toUpperCase().includes('DIRECT') || 
              o.approved_by.toUpperCase().includes('WALLET') ||
              o.approved_by.toUpperCase().includes('SYSTEM')
            ))
          )).length;

      if (kTotal) kTotal.textContent = kpi.total_orders ?? orders.length;
      if (kAuto) kAuto.textContent = autoApprovedCount;
      if (kPending) kPending.textContent = kpi.pending_count ?? orders.filter(o => o.status === 'PENDING').length;
      if (kRev) kRev.textContent = formatVND(kpi.total_revenue || 0);

      if (orders.length === 0) {
        tableContainer.innerHTML = `
          <div class="py-12 text-center text-slate-500 text-xs">
            <i class="fa-solid fa-receipt text-3xl text-slate-700 mb-2 block"></i>
            Chưa có đơn hàng nào trong danh mục này.
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
              <th class="pb-2.5 font-bold">Mã Đơn</th>
              <th class="pb-2.5 font-bold">Khách Hàng</th>
              <th class="pb-2.5 font-bold">Gói Cước & Giá</th>
              <th class="pb-2.5 font-bold">Phương Thức & Cú Pháp</th>
              <th class="pb-2.5 font-bold">Thời Gian</th>
              <th class="pb-2.5 font-bold">Trạng Thái</th>
              <th class="pb-2.5 font-bold text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans text-xs">
            ${orders.map(o => {
              const isPending = o.status === 'PENDING';
              const isApproved = o.status === 'APPROVED' || o.status === 'PAID';
              const isRejected = o.status === 'REJECTED';
              const isAuto = o.payment_method === 'REAL_WALLET_DIRECT' 
                || o.payment_method === 'AUTO_MOCK_BANK' 
                || o.payment_method === 'REAL_WALLET'
                || (o.approved_by && (
                     o.approved_by.toUpperCase().includes('AUTO') || 
                     o.approved_by.toUpperCase().includes('DIRECT') || 
                     o.approved_by.toUpperCase().includes('WALLET') ||
                     o.approved_by.toUpperCase().includes('SYSTEM')
                   ));

              return `
                <tr id="order-row-${o.id}" class="hover:bg-slate-800/40 transition">
                  <td class="py-3 font-mono font-bold text-emerald-400">${o.order_code}</td>
                  <td class="py-3">
                    <div class="font-bold text-slate-100">${o.user_name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${o.user_email}</div>
                  </td>
                  <td class="py-3">
                    ${getSubscriptionPlanBadgeHtml(o).html}
                    ${o.plan_duration_days && !getSubscriptionPlanBadgeHtml(o).isWalletDeposit ? `<span class="text-[10px] text-slate-400 font-mono block mt-0.5">(${o.plan_duration_days} ngày)</span>` : ''}
                    <div class="font-mono font-bold text-slate-200 mt-1">${formatVND(o.amount)}</div>
                  </td>
                  <td class="py-3 font-mono text-[11px]">
                    <div class="text-slate-300 font-bold">${o.payment_method}</div>
                    <div class="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded text-[10px] inline-block mt-0.5">${o.transfer_memo || '---'}</div>
                  </td>
                  <td class="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    ${o.created_at}
                  </td>
                  <td class="py-3 order-status-cell">
                    ${isPending ? `
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse inline-flex items-center gap-1 shadow-sm">
                        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i> Cần đối soát (Chờ duyệt)
                      </span>
                    ` : isApproved ? (
                      isAuto ? `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm inline-flex items-center gap-1">
                          <i class="fa-solid fa-bolt text-emerald-400"></i> Tự động duyệt (Automatic)
                        </span>
                      ` : `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm inline-flex items-center gap-1">
                          <i class="fa-solid fa-circle-check text-teal-400"></i> Đã duyệt (${o.approved_by || 'Admin'})
                        </span>
                      `
                    ) : `
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1" title="${o.rejection_reason || ''}">
                        <i class="fa-solid fa-circle-xmark text-rose-400"></i> Đã từ chối
                      </span>
                    `}
                  </td>
                  <td class="py-3 text-right whitespace-nowrap order-action-cell">
                    ${isPending ? `
                      <div class="inline-flex items-center gap-1.5">
                        <button type="button" class="btn-approve-order px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition flex items-center gap-1" data-id="${o.id}" data-code="${o.order_code}" data-user="${o.user_name || o.user_id}" data-plan="${o.plan_code || 'VIP'}" data-amount="${o.amount || 0}">
                          <i class="fa-solid fa-check"></i> Duyệt
                        </button>
                        <button type="button" class="btn-reject-order px-2 py-1 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-bold text-xs active:scale-95 transition flex items-center gap-1" data-id="${o.id}" data-code="${o.order_code}">
                          <i class="fa-solid fa-xmark"></i> Từ chối
                        </button>
                      </div>
                    ` : isApproved ? (
                      isAuto ? `
                        <span class="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-bold"><i class="fa-solid fa-bolt text-xs"></i> Tự động hoàn tất</span>
                      ` : `
                        <span class="inline-flex items-center gap-1 text-[11px] text-teal-400 font-mono font-bold"><i class="fa-solid fa-check-double text-xs"></i> Đã kích hoạt VIP</span>
                      `
                    ) : `
                      <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono"><i class="fa-solid fa-ban text-xs"></i> Đã đóng</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Bind approve / reject handlers with safe confirmation and in-place row update
      tableContainer.querySelectorAll('.btn-approve-order').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const userName = btn.getAttribute('data-user') || '';
          const planCode = btn.getAttribute('data-plan') || 'VIP';
          const amount = parseFloat(btn.getAttribute('data-amount') || 0);

          if (!confirm(`Bạn có chắc chắn muốn DUYỆT THỦ CÔNG đơn hàng #${code} của ${userName}?\nThao tác này sẽ nâng cấp gói ${planCode} ngay cho người dùng.`)) return;

          try {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            const res = await api.approveAdminSubscriptionOrder(id);
            this.app.showToast(res.message || 'Đã phê duyệt đơn hàng thành công!', 'success');

            // In-place row update without reloading whole page
            const row = document.getElementById(`order-row-${id}`);
            if (row) {
              const statusCell = row.querySelector('.order-status-cell');
              const actionCell = row.querySelector('.order-action-cell');
              if (statusCell) {
                statusCell.innerHTML = `
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm inline-flex items-center gap-1">
                    <i class="fa-solid fa-circle-check text-teal-400"></i> Đã duyệt (${res.order?.approved_by || 'Admin'})
                  </span>
                `;
              }
              if (actionCell) {
                actionCell.innerHTML = `
                  <span class="inline-flex items-center gap-1 text-[11px] text-teal-400 font-mono font-bold">
                    <i class="fa-solid fa-check-double text-xs"></i> Đã kích hoạt VIP
                  </span>
                `;
              }
              row.classList.add('bg-emerald-950/20');
            }

            // In-place KPI counters update
            const kPending = document.getElementById('kpi-orders-pending');
            if (kPending) {
              const currentPending = parseInt(kPending.textContent, 10);
              if (!isNaN(currentPending) && currentPending > 0) {
                kPending.textContent = currentPending - 1;
              }
            }
            const kRev = document.getElementById('kpi-orders-revenue');
            if (kRev && amount > 0) {
              const rawRevText = kRev.textContent.replace(/[^\d]/g, '');
              const currentRev = parseFloat(rawRevText) || 0;
              kRev.textContent = formatVND(currentRev + amount);
            }

            // In-place user plan update if current user is the one being approved
            if (this.app.currentUser && res.order?.user_email && this.app.currentUser.email === res.order.user_email) {
              this.app.currentUser.plan = res.order.plan_tier || planCode;
              this.app.currentUser.is_plan_active = true;
              this.app.currentUser.plan_expires_at = res.order.expires_at;
              if (typeof this.app.updateUserUI === 'function') {
                this.app.updateUserUI();
              }
            }
          } catch (err) {
            this.app.showToast(err.message || 'Lỗi khi phê duyệt', 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Duyệt`;
          }
        });
      });

      tableContainer.querySelectorAll('.btn-reject-order').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const reason = prompt(`Nhập lý do từ chối đơn hàng #${code}:`, 'Không nhận được chuyển khoản hoặc sai cú pháp chuyển tiền');
          if (!reason || !reason.trim()) return;

          try {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            const res = await api.rejectAdminSubscriptionOrder(id, reason.trim());
            this.app.showToast(res.message || 'Đã từ chối đơn hàng.', 'success');

            // In-place row update without page reload
            const row = document.getElementById(`order-row-${id}`);
            if (row) {
              const statusCell = row.querySelector('.order-status-cell');
              const actionCell = row.querySelector('.order-action-cell');
              if (statusCell) {
                statusCell.innerHTML = `
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1" title="${reason.trim()}">
                    <i class="fa-solid fa-circle-xmark text-rose-400"></i> Đã từ chối
                  </span>
                `;
              }
              if (actionCell) {
                actionCell.innerHTML = `
                  <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <i class="fa-solid fa-ban text-xs"></i> Đã đóng
                  </span>
                `;
              }
              row.classList.add('bg-rose-950/10');
            }

            // In-place KPI pending update
            const kPending = document.getElementById('kpi-orders-pending');
            if (kPending) {
              const currentPending = parseInt(kPending.textContent, 10);
              if (!isNaN(currentPending) && currentPending > 0) {
                kPending.textContent = currentPending - 1;
              }
            }
          } catch (err) {
            this.app.showToast(err.message || 'Lỗi khi từ chối', 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Từ chối`;
          }
        });
      });

    } catch (err) {
      tableContainer.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base mb-2 block"></i>
          Không thể tải danh sách đơn hàng: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  applyOrdersFilter(subtabId) {
    if (subtabId === 'orders_export_csv') {
      try {
        api.downloadAdminExport('subscriptions');
      } catch (err) {
        this.app?.showToast?.(err.message || 'Lỗi xuất dữ liệu đơn hàng', 'error');
      }
      return;
    }
    this.activeOrdersFilter = subtabId;
    this.loadAdminSubscriptions();
  }

  // =========================================================================
  // 8. SUPPORT TICKETS MANAGEMENT (Customer Support & Feedback)
  // =========================================================================
  async renderSupportTicketsTab(container) {
    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- KPI Metrics Header -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-2xl border border-teal-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Số Ticket</span>
              <span class="text-xl font-black text-slate-100 font-mono" id="kpi-tickets-total">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-base border border-teal-500/30">
              <i class="fa-solid fa-inbox"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-rose-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cần Phản Hồi (Open)</span>
              <span class="text-xl font-black text-rose-400 font-mono" id="kpi-tickets-open">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-base border border-rose-500/30">
              <i class="fa-solid fa-circle-exclamation"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đang Xử Lý</span>
              <span class="text-xl font-black text-amber-300 font-mono" id="kpi-tickets-progress">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base border border-amber-500/30">
              <i class="fa-solid fa-spinner"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã Giải Quyết</span>
              <span class="text-xl font-black text-emerald-400 font-mono" id="kpi-tickets-resolved">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/30">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative flex-1 sm:w-72">
              <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input type="text" id="admin-tickets-search" placeholder="Tìm mã ticket, tiêu đề, email..." 
                class="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-teal-500" />
            </div>
            <select id="admin-tickets-category-select" class="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <option value="ALL">Tất cả phân loại</option>
              <option value="TECHNICAL">⚙️ Kỹ thuật & Lỗi</option>
              <option value="BILLING">💳 Nạp tiền & Gói VIP</option>
              <option value="ACCOUNT">👤 Tài khoản</option>
              <option value="FEATURE_REQUEST">💡 Góp ý tính năng</option>
            </select>
          </div>

          <button id="btn-refresh-tickets" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition" title="Làm mới">
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>

        <!-- Table Container -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800 overflow-x-auto" id="admin-tickets-table-container">
          <div class="py-12 text-center text-slate-500 text-xs animate-pulse">Đang tải danh sách yêu cầu hỗ trợ...</div>
        </div>

      </div>
    `;

    document.getElementById('admin-tickets-search')?.addEventListener('input', () => {
      this.loadAdminSupportTickets();
    });

    document.getElementById('admin-tickets-category-select')?.addEventListener('change', () => {
      this.loadAdminSupportTickets();
    });

    document.getElementById('btn-refresh-tickets')?.addEventListener('click', () => {
      this.loadAdminSupportTickets();
    });

    await this.loadAdminSupportTickets();
  }

  async loadAdminSupportTickets() {
    const tableContainer = document.getElementById('admin-tickets-table-container');
    if (!tableContainer) return;

    let statusFilter = 'ALL';
    if (this.activeTicketsFilter === 'tickets_open') statusFilter = 'OPEN';
    else if (this.activeTicketsFilter === 'tickets_progress') statusFilter = 'IN_PROGRESS';
    else if (this.activeTicketsFilter === 'tickets_resolved') statusFilter = 'RESOLVED';

    const category = document.getElementById('admin-tickets-category-select')?.value || 'ALL';
    const search = document.getElementById('admin-tickets-search')?.value.trim() || '';

    try {
      const data = await api.getAdminSupportTickets(statusFilter, category, 'ALL', search);
      const tickets = Array.isArray(data?.tickets) ? data.tickets : (Array.isArray(data?.items) ? data.items : []);
      const kpi = data?.kpi || {};

      const kTotal = document.getElementById('kpi-tickets-total');
      const kOpen = document.getElementById('kpi-tickets-open');
      const kProg = document.getElementById('kpi-tickets-progress');
      const kRes = document.getElementById('kpi-tickets-resolved');

      if (kTotal) kTotal.textContent = kpi.total_tickets || tickets.length;
      if (kOpen) kOpen.textContent = kpi.open_count || 0;
      if (kProg) kProg.textContent = kpi.in_progress_count || 0;
      if (kRes) kRes.textContent = kpi.resolved_count || 0;

      if (tickets.length === 0) {
        tableContainer.innerHTML = `
          <div class="py-12 text-center text-slate-500 text-xs">
            <i class="fa-solid fa-headset text-3xl text-slate-700 mb-2 block"></i>
            Chưa có yêu cầu hỗ trợ nào trong mục này.
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
              <th class="pb-2.5 font-bold">Mã Ticket</th>
              <th class="pb-2.5 font-bold">Khách Hàng</th>
              <th class="pb-2.5 font-bold">Tiêu Đề & Nội Dung</th>
              <th class="pb-2.5 font-bold">Phân Loại</th>
              <th class="pb-2.5 font-bold">Thời Gian</th>
              <th class="pb-2.5 font-bold">Trạng Thái</th>
              <th class="pb-2.5 font-bold text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans text-xs">
            ${tickets.map(t => {
              const isOpen = t.status === 'OPEN';
              const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';

              return `
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="py-3 font-mono font-bold text-teal-400">${t.ticket_code}</td>
                  <td class="py-3">
                    <div class="font-bold text-slate-100">${t.user_name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${t.user_email}</div>
                  </td>
                  <td class="py-3 max-w-[220px]">
                    <div class="font-bold text-slate-100 truncate">${t.title}</div>
                    <div class="text-[11px] text-slate-400 truncate mt-0.5">${t.message}</div>
                    ${t.admin_reply ? `<div class="mt-1 text-[10px] text-emerald-400 bg-emerald-950/40 p-1 rounded border border-emerald-800/30 truncate">➔ Admin: ${t.admin_reply}</div>` : ''}
                  </td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      ${t.category}
                    </span>
                  </td>
                  <td class="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    ${t.created_at}
                  </td>
                  <td class="py-3">
                    ${isOpen ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        🔴 Cần phản hồi
                      </span>
                    ` : isResolved ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        🟢 Đã phản hồi
                      </span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🟡 Đang xử lý
                      </span>
                    `}
                  </td>
                  <td class="py-3 text-right">
                    <button type="button" class="btn-reply-ticket px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/25 active:scale-95 transition flex items-center gap-1.5 ml-auto" data-id="${t.id}" data-code="${t.ticket_code}" data-title="${encodeURIComponent(t.title)}" data-msg="${encodeURIComponent(t.message)}" data-user="${encodeURIComponent(t.user_name)}" data-reply="${encodeURIComponent(t.admin_reply || '')}">
                      <i class="fa-solid fa-reply"></i>
                      <span>${t.admin_reply ? 'Xem / Sửa' : 'Phản Hồi'}</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      tableContainer.querySelectorAll('.btn-reply-ticket').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const title = decodeURIComponent(btn.getAttribute('data-title'));
          const msg = decodeURIComponent(btn.getAttribute('data-msg'));
          const user = decodeURIComponent(btn.getAttribute('data-user'));
          const reply = decodeURIComponent(btn.getAttribute('data-reply'));
          this.openReplyTicketModal(id, code, title, msg, user, reply);
        });
      });

    } catch (err) {
      tableContainer.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base mb-2 block"></i>
          Không thể tải danh sách ticket: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  openReplyTicketModal(ticketId, code, title, message, userName, existingReply = '') {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-backdrop-blur fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-teal-500/40 animate-in fade-in zoom-in duration-200 space-y-4">
          <button id="reply-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg border border-teal-500/30">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-100">Phản Hồi Yêu Cầu Hỗ Trợ #${code}</h3>
              <p class="text-[11px] text-slate-400">Khách hàng: <b class="text-slate-200">${userName}</b></p>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-1.5">
            <div class="font-bold text-slate-200">${title}</div>
            <p class="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">${message}</p>
          </div>

          <form id="reply-ticket-form" class="space-y-3">
            <div>
              <label class="block font-bold text-slate-300 text-xs mb-1">Nội dung câu trả lời của Ban Quản Trị:</label>
              <textarea id="reply-ticket-text" rows="5" required placeholder="Nhập hướng dẫn giải quyết hoặc câu trả lời chi tiết cho khách hàng..." 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-teal-500">${existingReply}</textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="reply-modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                Đóng
              </button>
              <button type="submit" class="px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Gửi Phản Hồi & Bắn Thông Báo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('reply-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('reply-modal-cancel')?.addEventListener('click', closeModal);

    document.getElementById('reply-ticket-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reply = document.getElementById('reply-ticket-text')?.value.trim();
      if (!reply) return;
      try {
        const res = await api.replyAdminSupportTicket(ticketId, reply);
        this.app.showToast(res.message || 'Đã gửi phản hồi thành công!', 'success');
        closeModal();
        await this.loadAdminSupportTickets();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi gửi phản hồi', 'error');
      }
    });
  }

  applyTicketsFilter(subtabId) {
    this.activeTicketsFilter = subtabId;
    this.loadAdminSupportTickets();
  }

  // =========================================================================
  // 9. SETTINGS & DYNAMIC PAYMENT GATEWAY TAB
  // =========================================================================
  async renderSettingsTab(container) {
    this.destroyCharts();
    container.innerHTML = `
      <div id="admin-settings-content-wrapper" class="space-y-6 admin-subtab-content-anim">
        <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
          <i class="fa-solid fa-spinner fa-spin text-rose-500 mb-2 block text-xl"></i>
          Đang tải cấu hình hệ thống & cổng thanh toán...
        </div>
      </div>
    `;

    await this.loadSettingsTabContent();
  }

  applySettingsFilter(subtabId) {
    this.activeSettingsFilter = subtabId;
    this.loadSettingsTabContent();
  }

  async loadSettingsTabContent() {
    const wrapper = document.getElementById('admin-settings-content-wrapper');
    if (!wrapper) return;

    const filter = this.activeSettingsFilter || 'settings_gateway';

    if (filter === 'settings_gateway') {
      await this.renderPaymentGatewaySettings(wrapper);
    } else if (filter === 'settings_broadcast') {
      await this.renderSettingsBroadcast(wrapper);
    } else if (filter === 'settings_smtp') {
      await this.renderSettingsSmtp(wrapper);
    } else if (filter === 'settings_backup') {
      await this.renderSettingsBackup(wrapper);
    } else if (filter === 'settings_security') {
      await this.renderSettingsSecurity(wrapper);
    }
  }

  // --- TAB: PHÁT THÔNG BÁO ---
  async renderSettingsBroadcast(wrapper) {
    wrapper.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 h-fit">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-paper-plane text-rose-400"></i>
              <span>Soạn Thông Báo Mới</span>
            </h4>
          </div>
          <form id="form-admin-broadcast" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Tiêu đề *</label>
              <input type="text" id="bc-title" required class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500" placeholder="Nhập tiêu đề thông báo...">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Loại thông báo *</label>
              <select id="bc-type" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500">
                <option value="INFO">Thông báo hệ thống</option>
                <option value="MAINTENANCE">Cảnh báo bảo trì</option>
                <option value="PROMOTION">Khuyến mãi VIP</option>
                <option value="SUCCESS">Cập nhật tính năng</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nội dung chi tiết *</label>
              <textarea id="bc-message" required rows="4" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500" placeholder="Nội dung..."></textarea>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="bc-pinned" class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-rose-500">
              <label for="bc-pinned" class="text-xs text-slate-300 font-bold">Ghim lên đầu trang</label>
            </div>
            <button type="submit" id="btn-submit-bc" class="w-full py-3 rounded-xl gradient-rose text-white font-black text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-bullhorn"></i> Phát Thông Báo Ngay
            </button>
          </form>
        </div>
        <div class="lg:col-span-7 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-teal-400"></i>
              <span>Lịch Sử Đã Phát</span>
            </h4>
            <button id="btn-refresh-bc" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition">
              <i class="fa-solid fa-rotate-right text-xs"></i>
            </button>
          </div>
          <div id="bc-list-container" class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            <div class="py-8 text-center text-slate-500 text-xs"><i class="fa-solid fa-spinner fa-spin mb-2"></i> Đang tải...</div>
          </div>
        </div>
      </div>
    `;

    const loadBroadcasts = async () => {
      const container = document.getElementById('bc-list-container');
      try {
        const res = await api.request('/admin/broadcasts');
        if (!res.data || res.data.length === 0) {
          container.innerHTML = '<div class="py-8 text-center text-slate-500 text-xs">Chưa có thông báo nào được phát.</div>';
          return;
        }
        container.innerHTML = res.data.map(b => {
          let typeColor = 'text-blue-400';
          let typeLabel = 'Hệ Thống';
          if(b.type === 'MAINTENANCE') { typeColor = 'text-rose-400'; typeLabel = 'Bảo Trì'; }
          if(b.type === 'PROMOTION') { typeColor = 'text-amber-400'; typeLabel = 'Khuyến Mãi'; }
          if(b.type === 'SUCCESS') { typeColor = 'text-emerald-400'; typeLabel = 'Cập Nhật'; }
          
          return `
            <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 relative group transition hover:border-slate-700">
              ${b.is_pinned ? '<div class="absolute top-0 right-4 -mt-2 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold"><i class="fa-solid fa-thumbtack"></i> Ghim</div>' : ''}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold ${typeColor} px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">${typeLabel}</span>
                  <span class="text-[10px] text-slate-500"><i class="fa-regular fa-clock"></i> ${new Date(b.created_at).toLocaleString()}</span>
                </div>
                <button class="btn-delete-bc text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition text-xs" data-id="${b.id}" title="Thu hồi/Xóa">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              <h5 class="text-sm font-bold text-slate-200">${b.title}</h5>
              <p class="text-[11px] text-slate-400 whitespace-pre-line">${b.message}</p>
            </div>
          `;
        }).join('');

        container.querySelectorAll('.btn-delete-bc').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            if(!confirm('Bạn có chắc chắn muốn thu hồi/xóa thông báo này?')) return;
            const id = e.currentTarget.getAttribute('data-id');
            try {
              await api.request('/admin/broadcast/' + id, { method: 'DELETE' });
              this.app.showToast('Đã xóa thông báo', 'success');
              loadBroadcasts();
            } catch (err) {
              this.app.showToast('Lỗi xóa: ' + err.message, 'error');
            }
          });
        });
      } catch (err) {
        container.innerHTML = '<div class="py-8 text-center text-rose-400 text-xs">Lỗi tải dữ liệu</div>';
      }
    };

    document.getElementById('btn-refresh-bc')?.addEventListener('click', loadBroadcasts);
    document.getElementById('form-admin-broadcast')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-bc');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang phát...';
      try {
        await api.request('/admin/broadcast', {
          method: 'POST',
          body: JSON.stringify({
            title: document.getElementById('bc-title').value.trim(),
            type: document.getElementById('bc-type').value,
            message: document.getElementById('bc-message').value.trim(),
            is_pinned: document.getElementById('bc-pinned').checked
          })
        });
        this.app.showToast('Đã phát thông báo toàn sàn!', 'success');
        e.target.reset();
        loadBroadcasts();
      } catch(err) {
        this.app.showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Phát Thông Báo Ngay';
      }
    });

    loadBroadcasts();
  }

  // --- TAB: CẤU HÌNH MAIL SMTP ---
  async renderSettingsSmtp(wrapper) {
    wrapper.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-envelope text-blue-400"></i>
              <span>Cấu Hình Máy Chủ Gửi Mail (SMTP)</span>
            </h4>
          </div>
          <form id="form-smtp" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">SMTP Server (Host) *</label>
                <input type="text" id="smtp-host" required class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500" placeholder="smtp.gmail.com">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Port *</label>
                <input type="number" id="smtp-port" required value="465" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500" placeholder="465 hoặc 587">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Email gửi (Sender Email) *</label>
              <input type="email" id="smtp-email" required class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500" placeholder="abc@gmail.com">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Mật khẩu ứng dụng (App Password) *</label>
              <input type="password" id="smtp-pass" required class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500">
              <p class="text-[10px] text-slate-500 mt-1">Dùng App Password (Mật khẩu ứng dụng 16 ký tự), không dùng mật khẩu email thật.</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Tên người gửi (Sender Name) *</label>
              <input type="text" id="smtp-name" required value="FinTrack AI" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button type="submit" id="btn-save-smtp" class="flex-1 py-3 rounded-xl gradient-blue text-white font-black text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i> Lưu Cấu Hình SMTP
              </button>
            </div>
          </form>
        </div>

        <div class="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-xl space-y-4">
          <h4 class="text-sm font-black text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
            <i class="fa-solid fa-flask-vial text-teal-400"></i>
            <span>Gửi mail thử nghiệm (Test Connection)</span>
          </h4>
          <form id="form-test-smtp" class="flex items-end gap-3">
            <div class="flex-1">
              <label class="block text-xs font-bold text-slate-300 mb-1">Email nhận test *</label>
              <input type="email" id="smtp-test-email" required class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-teal-500" placeholder="admin@domain.com">
            </div>
            <button type="submit" id="btn-test-smtp" class="px-6 py-2.5 rounded-xl bg-teal-500/20 text-teal-400 font-bold text-xs border border-teal-500/40 hover:bg-teal-500/30 active:scale-95 transition flex items-center gap-2 h-[38px] mt-auto">
              <i class="fa-solid fa-paper-plane"></i> Gửi Mail Test
            </button>
          </form>
        </div>
      </div>
    `;

    try {
      const res = await api.request('/admin/smtp-config');
      if (res.config) {
        document.getElementById('smtp-host').value = res.config.host || '';
        document.getElementById('smtp-port').value = res.config.port || 587;
        document.getElementById('smtp-email').value = res.config.sender_email || '';
        document.getElementById('smtp-pass').value = res.config.app_password || '';
        document.getElementById('smtp-name').value = res.config.sender_name || 'FinTrack AI';
      }
    } catch (e) {
      this.app.showToast('Lỗi tải cấu hình SMTP', 'error');
    }

    document.getElementById('form-smtp')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-smtp');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
      try {
        await api.request('/admin/smtp-config', {
          method: 'POST',
          body: JSON.stringify({
            host: document.getElementById('smtp-host').value.trim(),
            port: parseInt(document.getElementById('smtp-port').value),
            sender_email: document.getElementById('smtp-email').value.trim(),
            app_password: document.getElementById('smtp-pass').value.trim(),
            sender_name: document.getElementById('smtp-name').value.trim()
          })
        });
        this.app.showToast('Lưu cấu hình thành công', 'success');
      } catch (err) {
        this.app.showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Cấu Hình SMTP';
      }
    });

    document.getElementById('form-test-smtp')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-test-smtp');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
      try {
        await api.request('/admin/test-smtp', {
          method: 'POST',
          body: JSON.stringify({
            test_email: document.getElementById('smtp-test-email').value.trim()
          })
        });
        this.app.showToast('Đã gửi email test thành công!', 'success');
      } catch (err) {
        this.app.showToast('Lỗi gửi mail: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi Mail Test';
      }
    });
  }

  // --- TAB: SAO LƯU DATABASE ---
  async renderSettingsBackup(wrapper) {
    wrapper.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div class="flex items-center gap-4 pb-4 border-b border-slate-800">
            <div class="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl shadow-lg border border-teal-500/30">
              <i class="fa-solid fa-download"></i>
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-100">Sao Lưu Dữ Liệu</h4>
              <p class="text-[10px] text-slate-400">Tải bản sao database SQLite (fintrack.db)</p>
            </div>
          </div>
          
          <div class="space-y-2 py-2">
            <div class="flex justify-between text-xs text-slate-300">
              <span>Trạng thái:</span> <span class="font-bold text-emerald-400" id="db-status">Đang tải...</span>
            </div>
            <div class="flex justify-between text-xs text-slate-300">
              <span>Dung lượng DB:</span> <span class="font-mono font-bold text-amber-300" id="db-size">...</span>
            </div>
          </div>

          <button id="btn-download-db" class="w-full py-3 rounded-xl gradient-teal text-slate-950 font-black text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-cloud-arrow-down"></i> Tải Bản Sao Lưu (.db)
          </button>
        </div>

        <div class="p-6 rounded-3xl bg-slate-900/90 border border-rose-500/30 shadow-xl space-y-4">
          <div class="flex items-center gap-4 pb-4 border-b border-slate-800">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl shadow-lg border border-rose-500/30">
              <i class="fa-solid fa-upload"></i>
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-100">Khôi phục dữ liệu (Restore)</h4>
              <p class="text-[10px] text-rose-400 font-bold">Cảnh báo an toàn: Sẽ ghi đè toàn bộ dữ liệu!</p>
            </div>
          </div>
          
          <form id="form-restore-db" class="space-y-4">
            <div class="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-rose-500/50 transition bg-slate-950 relative">
              <input type="file" id="db-upload" accept=".db" required class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              <i class="fa-solid fa-file-arrow-up text-2xl text-slate-500 mb-2"></i>
              <p class="text-xs text-slate-400" id="db-upload-name">Kéo thả file .db vào đây hoặc Click</p>
            </div>
            
            <button type="submit" id="btn-restore-db" class="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-triangle-exclamation"></i> Tải Lên & Khôi Phục
            </button>
          </form>
        </div>
      </div>
    `;

    try {
      const info = await api.request('/admin/db/info');
      document.getElementById('db-status').textContent = info.status;
      document.getElementById('db-size').textContent = (info.size_bytes / 1024 / 1024).toFixed(2) + ' MB';
    } catch (e) {
      document.getElementById('db-status').textContent = 'Error';
    }

    document.getElementById('btn-download-db')?.addEventListener('click', () => {
      const token = api.getToken() || localStorage.getItem('token') || '';
      const base = api.baseUrl || '/api/v1';
      window.location.href = `${base}/admin/db/download?token=${encodeURIComponent(token)}`;
    });

    const fileInput = document.getElementById('db-upload');
    const fileNameDisp = document.getElementById('db-upload-name');
    fileInput?.addEventListener('change', (e) => {
      if(e.target.files.length > 0) {
        fileNameDisp.innerHTML = `<span class="text-emerald-400 font-bold">${e.target.files[0].name}</span>`;
      }
    });

    document.getElementById('form-restore-db')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(!fileInput.files.length) return;
      if(!confirm('CẢNH BÁO: Dữ liệu hiện tại sẽ bị xóa hoàn toàn. Bạn có chắc chắn muốn khôi phục?')) return;

      const btn = document.getElementById('btn-restore-db');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang khôi phục...';
      
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        const token = api.getToken() || localStorage.getItem('token') || '';
        const base = api.baseUrl || '/api/v1';
        const response = await fetch(`${base}/admin/db/restore`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const res = await response.json();
        if(res.success) {
          this.app.showToast('Khôi phục thành công! Hệ thống sẽ tải lại.', 'success');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          this.app.showToast(res.detail || 'Lỗi khôi phục', 'error');
        }
      } catch (err) {
        this.app.showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tải Lên & Khôi Phục';
      }
    });
  }

  // --- TAB: KHÓA API & BẢO MẬT ---
  async renderSettingsSecurity(wrapper) {
    wrapper.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-amber-400"></i>
              <span>Khóa API & Bảo Mật Hệ Thống</span>
            </h4>
          </div>
          <form id="form-security-keys" class="space-y-6">
            
            <div class="space-y-4">
              <h5 class="text-xs font-bold text-amber-300 border-l-2 border-amber-500 pl-2">AI Models & API Keys</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">OpenAI API Key</label>
                  <input type="password" id="sec-openai" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Gemini API Key</label>
                  <input type="password" id="sec-gemini" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500">
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Model Mặc Định</label>
                <select id="sec-model" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500">
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
            </div>

            <div class="space-y-4 pt-4 border-t border-slate-800">
              <h5 class="text-xs font-bold text-cyan-300 border-l-2 border-cyan-500 pl-2">SePay & Webhook Ngân Hàng</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">SePay API Token</label>
                  <input type="password" id="sec-sepay-token" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Webhook Secret Key</label>
                  <input type="password" id="sec-sepay-secret" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500">
                </div>
              </div>
            </div>

            <div class="space-y-4 pt-4 border-t border-slate-800">
              <h5 class="text-xs font-bold text-blue-300 border-l-2 border-blue-500 pl-2">Telegram & Cấu Hình Khác</h5>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Telegram Bot Token (Nhận thông báo)</label>
                <input type="password" id="sec-tele" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-700">
                <div>
                  <h6 class="text-xs font-bold text-slate-200">Maintenance Mode (Chế Độ Bảo Trì)</h6>
                  <p class="text-[10px] text-slate-500">Bật/Tắt chế độ bảo trì toàn site.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="sec-maintenance" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Giới hạn số lần thử đăng nhập (Rate Limit)</label>
                <input type="number" id="sec-rate-limit" value="100" class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800">
              <button type="submit" id="btn-save-sec" class="w-full py-3 rounded-xl gradient-amber text-slate-950 font-black text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-lock"></i> Lưu Cấu Hình API & Bảo Mật
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    try {
      const res = await api.request('/admin/security-keys');
      if (res.config) {
        document.getElementById('sec-openai').value = res.config.openai_api_key || '';
        document.getElementById('sec-gemini').value = res.config.gemini_api_key || '';
        document.getElementById('sec-model').value = res.config.default_ai_model || 'gemini-1.5-pro';
        document.getElementById('sec-sepay-token').value = res.config.sepay_api_token || '';
        document.getElementById('sec-sepay-secret').value = res.config.sepay_webhook_secret || '';
        document.getElementById('sec-tele').value = res.config.telegram_bot_token || '';
        document.getElementById('sec-maintenance').checked = res.config.maintenance_mode || false;
        document.getElementById('sec-rate-limit').value = res.config.rate_limit || 100;
      }
    } catch (err) {
      this.app.showToast('Lỗi tải cấu hình bảo mật', 'error');
    }

    document.getElementById('form-security-keys')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-sec');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
      try {
        await api.request('/admin/security-keys', {
          method: 'POST',
          body: JSON.stringify({
            openai_api_key: document.getElementById('sec-openai').value.trim(),
            gemini_api_key: document.getElementById('sec-gemini').value.trim(),
            default_ai_model: document.getElementById('sec-model').value,
            sepay_api_token: document.getElementById('sec-sepay-token').value.trim(),
            sepay_webhook_secret: document.getElementById('sec-sepay-secret').value.trim(),
            telegram_bot_token: document.getElementById('sec-tele').value.trim(),
            maintenance_mode: document.getElementById('sec-maintenance').checked,
            rate_limit: parseInt(document.getElementById('sec-rate-limit').value)
          })
        });
        this.app.showToast('Lưu cấu hình thành công', 'success');
      } catch (err) {
        this.app.showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Lưu Cấu Hình API & Bảo Mật';
      }
    });
  }

  async renderPaymentGatewaySettings(wrapper) {
    wrapper.innerHTML = `
      <div class="py-12 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-amber-400 mb-2 block text-xl"></i>
        Đang nạp thông tin cổng thanh toán VietQR...
      </div>
    `;

    try {
      const role = (this.app?.currentUser?.role || '').toUpperCase();
      const isRootAdmin = role === 'ADMIN';

      const res = await api.getAdminPaymentSettings();
      const settings = (res && res.settings) ? res.settings : {
        bank_id: 'MB',
        bank_name: 'MB Bank (Ngân Hàng Quân Đội)',
        account_number: '0374617569',
        account_name: 'DANG QUYET THANG',
        qr_template: 'compact2'
      };
      const availableBanks = (res && res.available_banks) ? res.available_banks : [
        { id: 'MB', name: 'MB Bank (Ngân Hàng Quân Đội)' },
        { id: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
        { id: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
        { id: 'ICB', name: 'VietinBank (Công Thương Việt Nam)' },
        { id: 'BIDV', name: 'BIDV (Đầu Tư và Phát Triển)' },
        { id: 'ACB', name: 'ACB (Á Châu)' },
        { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
        { id: 'TPB', name: 'TPBank (Tiên Phong)' },
        { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
        { id: 'HDB', name: 'HDBank (Phát Triển TP.HCM)' }
      ];

      const currentBankId = (settings.bank_id || 'MB').toUpperCase();
      const currentAccNum = settings.account_number || '0374617569';
      const currentAccName = settings.account_name || 'DANG QUYET THANG';
      const currentTemplate = settings.qr_template || 'compact2';

      const generatePreviewQR = (bankId, accNum, template, accName) => {
        const sanitizedAcc = (accNum || '0374617569').replace(/\s+/g, '');
        const encodedName = encodeURIComponent((accName || 'DANG QUYET THANG').toUpperCase());
        return `https://img.vietqr.io/image/${bankId}-${sanitizedAcc}-${template}.png?amount=50000&addInfo=TEST%20GATEWAY&accountName=${encodedName}`;
      };

      wrapper.innerHTML = `
        <div class="space-y-6">
          
          <!-- Banner Header -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10 shrink-0">
                <i class="fa-solid fa-qrcode"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Cổng Thanh Toán VietQR Thụ Hưởng Động</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                    🟢 Live Gateway
                  </span>
                  ${isRootAdmin ? `
                    <span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold uppercase">
                      Root Admin
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase">
                      Moderator Read-Only
                    </span>
                  `}
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Cấu hình tài khoản ngân hàng thụ hưởng nhận tiền nạp tự động 100% của toàn bộ sàn FinTrack AI.
                </p>
              </div>
            </div>

            <div class="px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-right shrink-0">
              <span class="text-slate-500 block text-[10px]">Cổng Hiện Tại:</span>
              <span class="font-bold text-amber-300 truncate max-w-[200px] block" title="${settings.bank_name || currentBankId} - ${currentAccNum}">
                ${settings.bank_name || currentBankId} - ${currentAccNum}
              </span>
            </div>
          </div>

          <!-- Main Two-Column Gateway Form & Live Preview Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left 7 cols: Gateway Configuration Form -->
            <div class="lg:col-span-7 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-building-columns text-amber-400"></i>
                  <span>Thông Tin Tài Khoản Ngân Hàng Nhận Tiền</span>
                </h4>
                <span class="text-[11px] text-slate-400 font-mono">Chuẩn VietQR Napas247</span>
              </div>

              ${!isRootAdmin ? `
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <i class="fa-solid fa-shield-halved text-amber-400"></i>
                  <span>Chế độ chỉ đọc: Chỉ tài khoản Root Admin mới có quyền thay đổi thông tin nhận tiền hệ thống.</span>
                </div>
              ` : ''}

              <form id="form-admin-payment-gateway" class="space-y-4">
                
                <!-- Bank Select Dropdown -->
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    1. Ngân Hàng Thụ Hưởng (VietQR ID) *
                  </label>
                  <select id="admin-gateway-bank-select" ${!isRootAdmin ? 'disabled' : 'required'}
                    class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${!isRootAdmin ? 'opacity-70 cursor-not-allowed' : ''}">
                    ${availableBanks.map(b => `
                      <option value="${b.id}" data-name="${b.name}" ${b.id.toUpperCase() === currentBankId ? 'selected' : ''}>
                        [${b.id}] ${b.name}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <!-- Account Number -->
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    2. Số Tài Khoản Nhận Tiền *
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <i class="fa-solid fa-credit-card text-xs"></i>
                    </span>
                    <input type="text" id="admin-gateway-acc-num" ${!isRootAdmin ? 'readonly disabled' : 'required'} value="${currentAccNum}" placeholder="Ví dụ: 0374617569"
                      class="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${!isRootAdmin ? 'opacity-70 cursor-not-allowed' : ''}" />
                  </div>
                  <span class="text-[10px] text-slate-500 mt-1 block">Nhập số tài khoản ngân hàng chính xác để tạo mã QR chuẩn.</span>
                </div>

                <!-- Account Holder Name -->
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    3. Tên Chủ Tài Khoản (Cardholder Name) *
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <i class="fa-solid fa-user-check text-xs"></i>
                    </span>
                    <input type="text" id="admin-gateway-acc-name" ${!isRootAdmin ? 'readonly disabled' : 'required'} value="${currentAccName}" placeholder="Ví dụ: DANG QUYET THANG"
                      class="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-amber-300 font-mono text-sm font-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase ${!isRootAdmin ? 'opacity-70 cursor-not-allowed' : ''}" />
                  </div>
                  <span class="text-[10px] text-slate-500 mt-1 block">Tên in trên thẻ/tài khoản (viết hoa không dấu hoặc có dấu).</span>
                </div>

                <!-- VietQR Template Style -->
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    4. Kiểu Mẫu Khung VietQR (Template)
                  </label>
                  <select id="admin-gateway-template-select" ${!isRootAdmin ? 'disabled' : ''}
                    class="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-amber-500 ${!isRootAdmin ? 'opacity-70 cursor-not-allowed' : ''}">
                    <option value="compact2" ${currentTemplate === 'compact2' ? 'selected' : ''}>compact2 (Đẹp & Chuẩn Napas 24/7 có logo ngân hàng)</option>
                    <option value="compact" ${currentTemplate === 'compact' ? 'selected' : ''}>compact (Mẫu gọn)</option>
                    <option value="qr_only" ${currentTemplate === 'qr_only' ? 'selected' : ''}>qr_only (Chỉ mã QR thuần không khung)</option>
                  </select>
                </div>

                ${isRootAdmin ? `
                  <div class="pt-2">
                    <button type="submit" id="btn-save-admin-gateway"
                      class="w-full py-3.5 rounded-2xl gradient-amber text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition flex items-center justify-center gap-2">
                      <i class="fa-solid fa-floppy-disk text-sm"></i>
                      <span>Lưu & Kích Hoạt Cổng Ngân Hàng Mới</span>
                    </button>
                  </div>
                ` : `
                  <div class="pt-2">
                    <div class="w-full py-3.5 rounded-2xl bg-slate-800/80 text-slate-400 font-bold text-xs border border-slate-700/60 flex items-center justify-center gap-2 cursor-not-allowed">
                      <i class="fa-solid fa-lock text-amber-400 text-sm"></i>
                      <span>Chỉ Root Admin Có Quyền Sửa Cấu Hình Cổng Ngân Hàng</span>
                    </div>
                  </div>
                `}

              </form>
            </div>

            <!-- Right 5 cols: Live Realtime QR Preview Box -->
            <div class="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-xl flex flex-col items-center justify-between text-center space-y-4 overflow-hidden">
              
              <div class="w-full text-left border-b border-slate-800 pb-3 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <i class="fa-solid fa-eye text-cyan-400"></i> Xem Trước Mã QR Trực Quan (Live Preview)
                </span>
                <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">VietQR API</span>
              </div>

              <!-- Dynamic QR Image -->
              <div class="relative group my-2 w-full flex justify-center">
                <div class="p-3 bg-white rounded-3xl shadow-2xl border-2 border-amber-500/50 w-[200px] h-[200px] flex items-center justify-center transition transform hover:scale-105">
                  <img id="admin-gateway-preview-img" src="${generatePreviewQR(currentBankId, currentAccNum, currentTemplate, currentAccName)}" 
                    alt="VietQR Preview" class="w-full h-full object-contain rounded-xl"
                    onerror="this.src='/TKnganhangMB.jpg'" />
                </div>
                <div class="absolute -bottom-2 px-3 py-1 rounded-full gradient-amber text-slate-950 font-black text-[10px] shadow-md flex items-center gap-1">
                  <i class="fa-solid fa-shield-check"></i>
                  <span id="admin-gateway-badge-bank">${currentBankId}</span>
                </div>
              </div>

              <!-- Live Meta Info Box -->
              <div class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-left text-xs font-mono space-y-2">
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Ngân hàng:</span>
                  <span class="font-bold text-slate-100 truncate text-right" id="preview-meta-bank" title="${settings.bank_name || currentBankId}">${settings.bank_name || currentBankId}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Số tài khoản:</span>
                  <span class="font-bold text-cyan-400 truncate text-right" id="preview-meta-acc">${currentAccNum}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Chủ tài khoản:</span>
                  <span class="font-bold text-amber-300 uppercase truncate text-right" id="preview-meta-name">${currentAccName}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-1.5">
                  <span class="text-slate-500 font-sans">Nội dung test:</span>
                  <span class="text-slate-400 text-[11px] font-mono">TEST GATEWAY</span>
                </div>
              </div>

              <p class="text-[11px] text-slate-400 font-sans leading-relaxed w-full text-left">
                💡 Khi Admin nhấn Lưu, toàn bộ người dùng khi mở modal nạp tiền / mua gói VIP sẽ quét mã QR chuyển khoản trực tiếp về tài khoản ngân hàng này.
              </p>

            </div>

          </div>

        </div>
      `;

      // Live Preview Events
      const bankSelect = document.getElementById('admin-gateway-bank-select');
      const accNumInput = document.getElementById('admin-gateway-acc-num');
      const accNameInput = document.getElementById('admin-gateway-acc-name');
      const templateSelect = document.getElementById('admin-gateway-template-select');
      const previewImg = document.getElementById('admin-gateway-preview-img');
      const metaBank = document.getElementById('preview-meta-bank');
      const metaAcc = document.getElementById('preview-meta-acc');
      const metaName = document.getElementById('preview-meta-name');
      const badgeBank = document.getElementById('admin-gateway-badge-bank');

      const updateLivePreview = () => {
        const bId = bankSelect?.value || 'MB';
        const selOption = bankSelect?.options[bankSelect.selectedIndex];
        const bName = selOption?.getAttribute('data-name') || bId;
        const aNum = accNumInput?.value?.trim() || '';
        const aName = accNameInput?.value?.trim()?.toUpperCase() || '';
        const tmpl = templateSelect?.value || 'compact2';

        if (previewImg) previewImg.src = generatePreviewQR(bId, aNum, tmpl, aName);
        if (metaBank) {
          metaBank.textContent = bName;
          metaBank.title = bName;
        }
        if (metaAcc) metaAcc.textContent = aNum || '---';
        if (metaName) metaName.textContent = aName || '---';
        if (badgeBank) badgeBank.textContent = bId;
      };

      bankSelect?.addEventListener('change', updateLivePreview);
      accNumInput?.addEventListener('input', updateLivePreview);
      accNameInput?.addEventListener('input', updateLivePreview);
      templateSelect?.addEventListener('change', updateLivePreview);

      // Submit Form
      document.getElementById('form-admin-payment-gateway')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isRootAdmin) {
          this.app.showToast('Từ chối quyền hạn: Chỉ Root Admin mới có quyền cập nhật cổng ngân hàng!', 'warning');
          return;
        }

        const submitBtn = document.getElementById('btn-save-admin-gateway');
        const bId = bankSelect?.value || 'MB';
        const selOption = bankSelect?.options[bankSelect.selectedIndex];
        const bName = selOption?.getAttribute('data-name') || `Ngân Hàng ${bId}`;
        const aNum = accNumInput?.value?.trim() || '';
        const aName = accNameInput?.value?.trim()?.toUpperCase() || '';
        const tmpl = templateSelect?.value || 'compact2';

        if (!aNum || !aName) {
          this.app.showToast('Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản', 'error');
          return;
        }

        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu cấu hình cổng ngân hàng...`;
          submitBtn.disabled = true;
        }

        try {
          const updateRes = await api.updateAdminPaymentSettings({
            bank_id: bId,
            bank_name: bName,
            account_number: aNum,
            account_name: aName,
            qr_template: tmpl
          });

          if (window.confetti) {
            window.confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
          }

          this.app.showToast(updateRes.message || 'Đã lưu và kích hoạt cổng ngân hàng mới thành công!', 'success');
          await this.renderPaymentGatewaySettings(wrapper);
        } catch (saveErr) {
          this.app.showToast(saveErr.message || 'Lỗi khi lưu cấu hình cổng ngân hàng', 'error');
          if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-sm"></i> Lưu & Kích Hoạt Lại`;
            submitBtn.disabled = false;
          }
        }
      });

    } catch (err) {
      wrapper.innerHTML = `
        <div class="p-8 text-center text-rose-400 text-xs rounded-3xl bg-slate-900 border border-rose-500/30">
          <i class="fa-solid fa-triangle-exclamation text-xl mb-2 block"></i>
          Không thể tải cấu hình cổng thanh toán: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  // =========================================================================
  // 10. TAB: CỔNG NGÂN HÀNG & VIETQR (BANK GATEWAY & TRANSACTIONS)
  // =========================================================================
  async renderBankGatewayTab(container) {
    this.destroyCharts();
    container.innerHTML = `
      <div id="admin-bank-gateway-content-wrapper" class="space-y-6 admin-subtab-content-anim">
        <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
          <i class="fa-solid fa-spinner fa-spin text-amber-400 mb-2 block text-xl"></i>
          Đang đồng bộ dữ liệu Cổng Ngân Hàng & VietQR...
        </div>
      </div>
    `;

    await this.loadBankGatewayContent();
  }

  applyBankGatewayFilter(subtabId) {
    this.activeBankGatewayFilter = subtabId;
    this.loadBankGatewayContent();
  }

  async loadBankGatewayContent() {
    const wrapper = document.getElementById('admin-bank-gateway-content-wrapper');
    if (!wrapper) return;

    const filter = this.activeBankGatewayFilter || 'bank_config';

    if (filter === 'bank_config') {
      await this.renderBankConfigModule(wrapper);
    } else if (filter === 'bank_txs') {
      await this.renderBankTransactionsModule(wrapper);
    } else if (filter === 'bank_automation') {
      await this.renderBankAutomationModule(wrapper);
    }
  }

  // --- MODULE 1: CẤU HÌNH TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG ---
  async renderBankConfigModule(wrapper) {
    wrapper.innerHTML = `
      <div class="py-12 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-amber-400 mb-2 block text-xl"></i>
        Đang nạp thông tin cổng ngân hàng...
      </div>
    `;

    try {
      const role = (this.app?.currentUser?.role || '').toUpperCase();
      const isRootAdmin = role === 'ADMIN';

      const res = await api.getAdminBankGateway();
      const activeGateway = res?.active_gateway || {
        bank_code: 'MB',
        bank_name: 'MB Bank (Ngân Hàng Quân Đội)',
        account_number: '0374617569',
        account_name: 'DANG QUYET THANG',
        branch: 'Hội Sở Chính',
        qr_template: 'compact2',
        memo_prefix: 'NAP VIP',
        is_active: true
      };
      const availableBanks = res?.available_banks || [
        { id: 'MB', code: 'MB', name: 'MB Bank (Ngân Hàng Quân Đội)' },
        { id: 'TCB', code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
        { id: 'VCB', code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
        { id: 'ICB', code: 'ICB', name: 'VietinBank (Công Thương Việt Nam)' },
        { id: 'BIDV', code: 'BIDV', name: 'BIDV (Đầu Tư và Phát Triển)' },
        { id: 'ACB', code: 'ACB', name: 'ACB (Á Châu)' },
        { id: 'VPB', code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
        { id: 'TPB', code: 'TPB', name: 'TPBank (Tiên Phong)' },
        { id: 'STB', code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
        { id: 'MOMO', code: 'MOMO', name: 'Ví MoMo (VietQR Napas)' }
      ];

      const currentBankCode = (activeGateway.bank_code || 'MB').toUpperCase();
      const currentAccNum = activeGateway.account_number || '0374617569';
      const currentAccName = (activeGateway.account_name || 'DANG QUYET THANG').toUpperCase();
      const currentBranch = activeGateway.branch || 'Hội Sở Chính';
      const currentTemplate = activeGateway.qr_template || 'compact2';
      const currentMemoPrefix = (activeGateway.memo_prefix || 'NAP VIP').toUpperCase();

      const generatePreviewQR = (bankCode, accNum, template, accName) => {
        const sanitizedAcc = (accNum || '0374617569').replace(/\s+/g, '');
        const encodedName = encodeURIComponent((accName || 'DANG QUYET THANG').toUpperCase());
        return `https://img.vietqr.io/image/${bankCode}-${sanitizedAcc}-${template}.png?amount=100000&addInfo=TEST%20GATEWAY&accountName=${encodedName}`;
      };

      wrapper.innerHTML = `
        <div class="space-y-6">
          
          <!-- Banner Header -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 shrink-0">
                <i class="fa-solid fa-building-columns"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Cấu Hình Tài Khoản Ngân Hàng Thụ Hưởng (Admin Bank Gateway)</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                    🟢 Live Napas 24/7
                  </span>
                  ${isRootAdmin ? `
                    <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
                      👑 Root Admin (Toàn Quyền)
                    </span>
                  ` : `
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider">
                      🔒 Moderator (Chỉ Đọc)
                    </span>
                  `}
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Tài khoản ngân hàng tiếp nhận các giao dịch nạp tiền & mua gói VIP tự động toàn hệ thống.
                </p>
              </div>
            </div>

            <div class="px-4 py-2 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-right shrink-0">
              <span class="text-slate-500 block text-[10px]">Cổng Đang Kích Hoạt:</span>
              <span class="font-bold text-amber-300 truncate max-w-[200px] block" title="${activeGateway.bank_name || currentBankCode} - ${currentAccNum}">
                ${currentBankCode} - ${currentAccNum}
              </span>
            </div>
          </div>

          <!-- Main Layout Grid (7 : 5) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left 7 cols: Gateway Form OR Moderator Read-Only Inspector -->
            <div class="lg:col-span-7 p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-5">
              
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-shield-halved text-amber-400"></i>
                  <span>${isRootAdmin ? 'Cấu Hình Cổng Ngân Hàng' : 'Chi Tiết Cổng Ngân Hàng Thụ Hưởng'}</span>
                </h4>
                <span class="text-[11px] text-slate-400 font-mono">Chuẩn VietQR Napas247</span>
              </div>

              ${!isRootAdmin ? `
                <!-- MODERATOR READ-ONLY INSPECTOR VIEW (Strict RBAC: No form, full security warnings) -->
                <div class="space-y-4">
                  <!-- Security Notice Banner -->
                  <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-base mt-0.5 border border-amber-500/30">
                      <i class="fa-solid fa-lock"></i>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-amber-300 text-xs">CHẾ ĐỘ XEM BẢO MẬT (MODERATOR READ-ONLY)</span>
                        <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">RBAC Enforced</span>
                      </div>
                      <p class="text-[11px] text-slate-300 leading-relaxed">
                        Thông tin tài khoản ngân hàng thụ hưởng cốt lõi do <strong>Root Admin</strong> thiết lập và bảo vệ. Tài khoản Moderator chỉ có thẩm quyền xem xét, đối soát và kiểm tra giao dịch nạp tiền. Form sửa đổi đã được khóa hoàn toàn nhằm đảm bảo an ninh dòng tiền.
                      </p>
                    </div>
                  </div>

                  <!-- Read-Only Parameter Cards Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    
                    <!-- Ngân Hàng -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-building-columns text-amber-400 mr-1"></i> Ngân Hàng Thụ Hưởng
                      </span>
                      <div class="text-xs font-black text-slate-100 truncate" title="${activeGateway.bank_name || currentBankCode}">
                        [${currentBankCode}] ${activeGateway.bank_name || currentBankCode}
                      </div>
                      <span class="text-[9px] font-bold text-emerald-400 font-mono block">Napas 24/7 Chuẩn Quốc Gia</span>
                    </div>

                    <!-- Số Tài Khoản + Copy -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-credit-card text-cyan-400 mr-1"></i> Số Tài Khoản Nhận Tiền
                      </span>
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-black text-cyan-400 font-mono tracking-wider">${currentAccNum}</span>
                        <button type="button" id="btn-copy-gw-acc" class="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 transition flex items-center gap-1 active:scale-95">
                          <i class="fa-regular fa-copy"></i> Sao chép
                        </button>
                      </div>
                    </div>

                    <!-- Chủ Tài Khoản -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-user-check text-purple-400 mr-1"></i> Chủ Tài Khoản (Cardholder)
                      </span>
                      <div class="text-xs font-black text-amber-300 font-mono uppercase truncate">${currentAccName}</div>
                      <span class="text-[9px] font-bold text-slate-400 font-mono block">Đã xác minh danh tính</span>
                    </div>

                    <!-- Mẫu VietQR -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-shapes text-teal-400 mr-1"></i> Mẫu Khung VietQR
                      </span>
                      <div class="text-xs font-bold text-slate-200 font-mono">${currentTemplate} (Napas 24/7)</div>
                    </div>

                    <!-- Chi Nhánh -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-location-dot text-rose-400 mr-1"></i> Chi Nhánh / Hội Sở
                      </span>
                      <div class="text-xs font-semibold text-slate-200 truncate">${currentBranch}</div>
                    </div>

                    <!-- Cú Pháp Nạp Tiền -->
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <i class="fa-solid fa-tag text-indigo-400 mr-1"></i> Cú Pháp Giao Dịch
                      </span>
                      <div class="text-xs font-mono font-bold text-indigo-300">${currentMemoPrefix} [USER_ID]</div>
                    </div>

                  </div>

                  <!-- Status Notification -->
                  <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="relative flex h-2.5 w-2.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span class="text-xs font-bold text-slate-200">Trạng Thái Kích Hoạt Toàn Sàn:</span>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      🟢 Đang Hoạt Động
                    </span>
                  </div>

                  <!-- Moderator Action: Switch to Transactions -->
                  <button type="button" id="btn-mod-switch-txs" class="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 active:scale-95 shadow-md">
                    <i class="fa-solid fa-list-check text-cyan-400"></i>
                    <span>Chuyển Sang Tab Kiểm Tra Biến Động Số Dư (Transactions)</span>
                  </button>

                </div>
              ` : `
                <!-- ROOT ADMIN EDIT FORM -->
                <form id="form-admin-bank-gateway-module" class="space-y-4">
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- 1. Bank Select -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-building-columns text-amber-400 mr-1"></i> 1. Ngân Hàng Thụ Hưởng *
                      </label>
                      <select id="gateway-bank-select" required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                        ${availableBanks.map(b => `
                          <option value="${b.code || b.id}" data-name="${b.name}" ${(b.code || b.id).toUpperCase() === currentBankCode ? 'selected' : ''}>
                            [${b.code || b.id}] ${b.name}
                          </option>
                        `).join('')}
                      </select>
                    </div>

                    <!-- 2. VietQR Template -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-shapes text-cyan-400 mr-1"></i> 2. Mẫu Khung VietQR *
                      </label>
                      <select id="gateway-template-select"
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-amber-500">
                        <option value="compact2" ${currentTemplate === 'compact2' ? 'selected' : ''}>compact2 (Chuẩn Napas 24/7 có logo)</option>
                        <option value="compact" ${currentTemplate === 'compact' ? 'selected' : ''}>compact (Mẫu tối giản)</option>
                        <option value="qr_only" ${currentTemplate === 'qr_only' ? 'selected' : ''}>qr_only (Chỉ mã QR)</option>
                      </select>
                    </div>

                    <!-- 3. Account Number -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-credit-card text-emerald-400 mr-1"></i> 3. Số Tài Khoản Ngân Hàng *
                      </label>
                      <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <i class="fa-solid fa-hashtag text-xs"></i>
                        </span>
                        <input type="text" id="gateway-acc-num" required value="${currentAccNum}" placeholder="Ví dụ: 0374617569"
                          class="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
                      </div>
                    </div>

                    <!-- 4. Account Name -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-user-check text-purple-400 mr-1"></i> 4. Tên Chủ Tài Khoản *
                      </label>
                      <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <i class="fa-solid fa-signature text-xs"></i>
                        </span>
                        <input type="text" id="gateway-acc-name" required value="${currentAccName}" placeholder="Ví dụ: DANG QUYET THANG"
                          class="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs font-black uppercase focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
                      </div>
                    </div>

                    <!-- 5. Branch / Note -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-location-dot text-rose-400 mr-1"></i> 5. Chi Nhánh / Hội Sở
                      </label>
                      <input type="text" id="gateway-branch" value="${currentBranch}" placeholder="Ví dụ: Hội Sở Chính"
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-amber-500" />
                    </div>

                    <!-- 6. Memo Prefix -->
                    <div>
                      <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        <i class="fa-solid fa-tag text-teal-400 mr-1"></i> 6. Cú Pháp Nạp Tiền
                      </label>
                      <input type="text" id="gateway-memo-prefix" value="${currentMemoPrefix}" placeholder="Ví dụ: NAP VIP"
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500 uppercase" />
                    </div>
                  </div>

                  <!-- Toggle Default Gateway Switch -->
                  <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div class="space-y-0.5">
                      <span class="text-xs font-bold text-slate-200 block">Kích hoạt làm cổng thanh toán mặc định toàn sàn</span>
                      <span class="text-[11px] text-slate-400 block">Toàn bộ Modal Nạp Tiền Thật & Mua Gói VIP sẽ đồng bộ ngay lập tức.</span>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="gateway-is-active" class="sr-only peer" ${activeGateway.is_active !== false ? 'checked' : ''}>
                      <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div class="pt-2">
                    <button type="submit" id="btn-save-bank-gateway-module"
                      class="w-full py-3.5 rounded-2xl gradient-amber text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition flex items-center justify-center gap-2">
                      <i class="fa-solid fa-arrows-rotate text-sm"></i>
                      <span>Lưu & Đồng Bộ Toàn Sàn</span>
                    </button>
                  </div>

                </form>
              `}
            </div>

            <!-- Right 5 cols: Live Realtime QR Preview Box -->
            <div class="lg:col-span-5 p-6 rounded-3xl bg-slate-900/95 border border-amber-500/40 shadow-2xl flex flex-col items-center justify-between text-center space-y-4 overflow-hidden">
              
              <div class="w-full text-left border-b border-slate-800 pb-3 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <i class="fa-solid fa-eye text-cyan-400"></i> Xem Trước Mã VietQR (Live Preview)
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">Napas 24/7</span>
              </div>

              <!-- Dynamic QR Image Card -->
              <div class="relative group my-2 w-full flex justify-center">
                <div class="p-3.5 bg-white rounded-2xl shadow-2xl border-2 border-amber-500/50 w-[200px] h-[200px] flex items-center justify-center transition transform hover:scale-105">
                  <img id="gateway-preview-qr-img" src="${generatePreviewQR(currentBankCode, currentAccNum, currentTemplate, currentAccName)}" 
                    alt="VietQR Live Preview" class="w-full h-full object-contain rounded-xl"
                    onerror="this.src='/TKnganhangMB.jpg'" />
                </div>
                <div class="absolute -bottom-2.5 px-3 py-0.5 rounded-full gradient-amber text-slate-950 font-black text-[10px] shadow-md flex items-center gap-1 whitespace-nowrap">
                  <i class="fa-solid fa-shield-check"></i>
                  <span id="gateway-badge-bank">${currentBankCode}</span>
                </div>
              </div>

              <!-- Live Meta Info Box (Carefully truncated to prevent layout breaking) -->
              <div class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-2 mt-2">
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Ngân hàng:</span>
                  <span class="font-bold text-slate-100 truncate text-right" id="gw-preview-bank" title="${activeGateway.bank_name || currentBankCode}">${activeGateway.bank_name || currentBankCode}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Số tài khoản:</span>
                  <span class="font-bold text-cyan-400 font-mono tracking-wider truncate text-right" id="gw-preview-acc">${currentAccNum}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Chủ tài khoản:</span>
                  <span class="font-bold text-amber-300 uppercase truncate text-right" id="gw-preview-name">${currentAccName}</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 gap-2">
                  <span class="text-slate-500 font-sans shrink-0">Cú pháp mẫu:</span>
                  <span class="font-bold text-indigo-400 truncate text-right" id="gw-preview-memo">${currentMemoPrefix} [USER_ID]</span>
                </div>
                <div class="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-1.5">
                  <span class="text-slate-500 font-sans">Số tiền test:</span>
                  <span class="text-emerald-400 font-bold">100.000 ₫</span>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-sans text-left flex items-start gap-2 w-full">
                <i class="fa-solid fa-circle-info mt-0.5 shrink-0 text-amber-400"></i>
                <span class="leading-relaxed">
                  ${isRootAdmin 
                    ? 'Khi nhấn Lưu, toàn bộ người dùng khi mở modal nạp tiền thật hoặc mua VIP sẽ quét mã QR về đúng tài khoản thụ hưởng này.' 
                    : 'Toàn bộ luồng thanh toán VietQR trên hệ thống đang được định tuyến an toàn về tài khoản thụ hưởng trên.'}
                </span>
              </div>

            </div>

          </div>

        </div>
      `;

      // Copy Account Number button for Moderator
      document.getElementById('btn-copy-gw-acc')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(currentAccNum).then(() => {
          this.app.showToast('Đã sao chép số tài khoản thụ hưởng!', 'success');
        }).catch(() => {
          this.app.showToast(`Số tài khoản: ${currentAccNum}`, 'info');
        });
      });

      // Moderator switch to Transactions
      document.getElementById('btn-mod-switch-txs')?.addEventListener('click', () => {
        this.applyBankGatewayFilter('bank_txs');
      });

      // Live Preview Events for Root Admin
      if (isRootAdmin) {
        const bankSelect = document.getElementById('gateway-bank-select');
        const accNumInput = document.getElementById('gateway-acc-num');
        const accNameInput = document.getElementById('gateway-acc-name');
        const templateSelect = document.getElementById('gateway-template-select');
        const memoPrefixInput = document.getElementById('gateway-memo-prefix');
        const previewImg = document.getElementById('gateway-preview-qr-img');
        const gwBank = document.getElementById('gw-preview-bank');
        const gwAcc = document.getElementById('gw-preview-acc');
        const gwName = document.getElementById('gw-preview-name');
        const gwMemo = document.getElementById('gw-preview-memo');
        const badgeBank = document.getElementById('gateway-badge-bank');

        const updateLivePreview = () => {
          const bCode = bankSelect?.value || 'MB';
          const selOption = bankSelect?.options[bankSelect.selectedIndex];
          const bName = selOption?.getAttribute('data-name') || bCode;
          const aNum = accNumInput?.value?.trim() || '';
          const aName = accNameInput?.value?.trim()?.toUpperCase() || '';
          const tmpl = templateSelect?.value || 'compact2';
          const mPrefix = memoPrefixInput?.value?.trim()?.toUpperCase() || 'NAP VIP';

          if (previewImg) previewImg.src = generatePreviewQR(bCode, aNum, tmpl, aName);
          if (gwBank) {
            gwBank.textContent = bName;
            gwBank.title = bName;
          }
          if (gwAcc) gwAcc.textContent = aNum || '---';
          if (gwName) gwName.textContent = aName || '---';
          if (gwMemo) gwMemo.textContent = `${mPrefix} [USER_ID]`;
          if (badgeBank) badgeBank.textContent = bCode;
        };

        bankSelect?.addEventListener('change', updateLivePreview);
        accNumInput?.addEventListener('input', updateLivePreview);
        accNameInput?.addEventListener('input', updateLivePreview);
        templateSelect?.addEventListener('change', updateLivePreview);
        memoPrefixInput?.addEventListener('input', updateLivePreview);

        // Submit Form
        document.getElementById('form-admin-bank-gateway-module')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!isRootAdmin) {
            this.app.showToast('Từ chối quyền hạn: Chỉ Root Admin mới có quyền cập nhật cấu hình cổng ngân hàng!', 'warning');
            return;
          }

          const submitBtn = document.getElementById('btn-save-bank-gateway-module');
          const bCode = bankSelect?.value || 'MB';
          const selOption = bankSelect?.options[bankSelect.selectedIndex];
          const bName = selOption?.getAttribute('data-name') || `Ngân Hàng ${bCode}`;
          const aNum = accNumInput?.value?.trim() || '';
          const aName = accNameInput?.value?.trim()?.toUpperCase() || '';
          const branchVal = document.getElementById('gateway-branch')?.value?.trim() || 'Hội Sở Chính';
          const tmpl = templateSelect?.value || 'compact2';
          const mPrefixVal = memoPrefixInput?.value?.trim()?.toUpperCase() || 'NAP VIP';
          const isActiveVal = document.getElementById('gateway-is-active')?.checked ?? true;

          if (!aNum || !aName) {
            this.app.showToast('Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản', 'error');
            return;
          }

          if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ cổng ngân hàng...`;
            submitBtn.disabled = true;
          }

          try {
            const updateRes = await api.saveAdminBankGateway({
              bank_code: bCode,
              bank_name: bName,
              account_number: aNum,
              account_name: aName,
              branch: branchVal,
              qr_template: tmpl,
              memo_prefix: mPrefixVal,
              is_active: isActiveVal
            });

            if (window.confetti) {
              window.confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
            }

            this.app.showToast(updateRes.message || 'Đã đồng bộ cổng ngân hàng toàn sàn thành công!', 'success');
            await this.renderBankConfigModule(wrapper);
          } catch (saveErr) {
            this.app.showToast(saveErr.message || 'Lỗi khi lưu cấu hình cổng ngân hàng', 'error');
            if (submitBtn) {
              submitBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate text-sm"></i> Lưu & Thử Lại`;
              submitBtn.disabled = false;
            }
          }
        });
      }

    } catch (err) {
      wrapper.innerHTML = `
        <div class="p-8 text-center text-rose-400 text-xs rounded-3xl bg-slate-900 border border-rose-500/30">
          <i class="fa-solid fa-triangle-exclamation text-xl mb-2 block"></i>
          Không thể tải cấu hình cổng ngân hàng: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  // --- MODULE 2: LỊCH SỬ GIAO DỊCH NGÂN HÀNG & BIẾN ĐỘNG SỐ DƯ ---
  async renderBankTransactionsModule(wrapper) {
    wrapper.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Controls & Statistics -->
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-black text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i>
                <span>Lịch Sử Biến Động Số Dư & Giao Dịch Ngân Hàng</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Theo dõi lịch sử tiền về tài khoản ngân hàng thụ hưởng và đối soát giao dịch.</p>
            </div>
            <button id="btn-refresh-bank-txs" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>Làm mới</span>
            </button>
          </div>

          <!-- 3 Stats Badges -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="bank-txs-stats-container">
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Tổng Tiền Nhận Được</span>
              <span class="text-lg font-black text-emerald-400 font-mono" id="stat-total-received">0 ₫</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Đã Khớp Tự Động</span>
              <span class="text-lg font-black text-cyan-400 font-mono" id="stat-matched-count">0 giao dịch</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Chưa Khớp (Cần xử lý)</span>
              <span class="text-lg font-black text-rose-400 font-mono" id="stat-unmatched-count">0 giao dịch</span>
            </div>
          </div>

          <!-- Search and Filter bar -->
          <div class="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div class="relative flex-1 w-full">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input type="text" id="input-search-bank-txs" placeholder="Tìm theo nội dung chuyển khoản, mã GD, tên người chuyển..." 
                class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500">
            </div>

            <div class="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button class="bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition active bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" data-filter="ALL">Tất Cả</button>
              <button class="bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:bg-slate-800" data-filter="MATCHED">🟢 Đã Khớp</button>
              <button class="bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:bg-slate-800" data-filter="UNMATCHED">🔴 Chưa Khớp</button>
              <button class="bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:bg-slate-800" data-filter="MANUALLY_MATCHED">🟡 Khớp Thủ Công</button>
            </div>
          </div>
        </div>

        <!-- Transactions Table Container -->
        <div id="bank-txs-table-container" class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
          <div class="py-12 text-center text-slate-500 text-xs animate-pulse">Đang tải lịch sử giao dịch ngân hàng...</div>
        </div>

      </div>
    `;

    let activeFilter = 'ALL';
    let currentSearch = '';

    const loadTableData = async () => {
      const tableContainer = document.getElementById('bank-txs-table-container');
      if (!tableContainer) return;

      try {
        const res = await api.getAdminBankTransactions(activeFilter, currentSearch, 50);
        const txs = res?.transactions || [];

        // Update stats
        const statTotal = document.getElementById('stat-total-received');
        const statMatched = document.getElementById('stat-matched-count');
        const statUnmatched = document.getElementById('stat-unmatched-count');
        if (statTotal) statTotal.textContent = (res?.total_received_amount || 0).toLocaleString() + ' ₫';
        if (statMatched) statMatched.textContent = `${res?.matched_count || 0} giao dịch`;
        if (statUnmatched) statUnmatched.textContent = `${res?.unmatched_count || 0} giao dịch`;

        if (txs.length === 0) {
          tableContainer.innerHTML = `
            <div class="py-12 text-center text-slate-500 text-xs space-y-2">
              <i class="fa-solid fa-inbox text-2xl block text-slate-600"></i>
              <p>Chưa có giao dịch biến động số dư nào phù hợp với bộ lọc.</p>
            </div>
          `;
          return;
        }

        tableContainer.innerHTML = `
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th class="py-3 px-2">Thời Gian</th>
                <th class="py-3 px-2">Mã Tham Chiếu</th>
                <th class="py-3 px-2">Người Chuyển</th>
                <th class="py-3 px-2">Số Tiền (VNĐ)</th>
                <th class="py-3 px-2">Nội Dung Chuyển Khoản (Memo)</th>
                <th class="py-3 px-2">Trạng Thái</th>
                <th class="py-3 px-2 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              ${txs.map(t => {
                const isMatched = t.status === 'MATCHED';
                const isManual = t.status === 'MANUALLY_MATCHED';
                const isUnmatched = t.status === 'UNMATCHED';

                return `
                  <tr class="hover:bg-slate-800/40 transition group">
                    <td class="py-3.5 px-2 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      ${t.transaction_date}
                    </td>
                    <td class="py-3.5 px-2 font-mono font-bold text-slate-200 text-xs whitespace-nowrap">
                      ${t.reference_code || '---'}
                    </td>
                    <td class="py-3.5 px-2">
                      <div class="font-bold text-slate-200">${t.sender_name}</div>
                      ${t.sender_account && t.sender_account !== '---' ? `<div class="text-[10px] text-slate-500 font-mono">${t.sender_account}</div>` : ''}
                    </td>
                    <td class="py-3.5 px-2 font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                      +${(t.amount || 0).toLocaleString()} ₫
                    </td>
                    <td class="py-3.5 px-2">
                      <div class="font-mono text-amber-300 font-bold bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 max-w-xs break-all text-[11px]">
                        ${t.description}
                      </div>
                      ${t.matched_user_name ? `
                        <div class="text-[10px] text-slate-400 mt-1">
                          Khớp: <b class="text-cyan-400">${t.matched_user_name}</b> ${t.matched_order_code ? `(#${t.matched_order_code})` : ''}
                        </div>
                      ` : ''}
                    </td>
                    <td class="py-3.5 px-2">
                      ${isMatched ? `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap flex items-center gap-1 w-max">
                          <i class="fa-solid fa-circle-check text-[9px]"></i> Đã khớp tự động
                        </span>
                      ` : isManual ? `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap flex items-center gap-1 w-max">
                          <i class="fa-solid fa-user-check text-[9px]"></i> Khớp thủ công
                        </span>
                      ` : `
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse whitespace-nowrap flex items-center gap-1 w-max">
                          <i class="fa-solid fa-triangle-exclamation text-[9px]"></i> Chưa khớp đơn
                        </span>
                      `}
                    </td>
                    <td class="py-3.5 px-2 text-right">
                      ${isUnmatched ? `
                        <button type="button" class="btn-manual-match px-3 py-1.5 rounded-xl gradient-amber text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition inline-flex items-center gap-1.5"
                          data-id="${t.id}" data-ref="${t.reference_code}" data-amount="${t.amount}" data-desc="${encodeURIComponent(t.description)}">
                          <i class="fa-solid fa-bolt"></i>
                          <span>Khớp Thủ Công</span>
                        </button>
                      ` : `
                        <span class="text-[11px] text-slate-500 font-mono italic">Hoàn tất</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;

        // Bind manual match button
        tableContainer.querySelectorAll('.btn-manual-match').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            const ref = btn.getAttribute('data-ref');
            const amt = parseFloat(btn.getAttribute('data-amount')) || 0;
            const descText = decodeURIComponent(btn.getAttribute('data-desc'));
            this.openManualMatchModal(id, ref, amt, descText, loadTableData);
          });
        });

      } catch (err) {
        tableContainer.innerHTML = `
          <div class="py-8 text-center text-rose-400 text-xs">
            Lỗi khi tải dữ liệu giao dịch: ${err.message || 'Lỗi kết nối'}
          </div>
        `;
      }
    };

    // Filter clicks
    wrapper.querySelectorAll('.bank-tx-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.bank-tx-filter-btn').forEach(b => {
          b.className = 'bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:bg-slate-800';
        });
        btn.className = 'bank-tx-filter-btn px-3 py-2 rounded-xl text-xs font-bold transition active bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
        activeFilter = btn.getAttribute('data-filter');
        loadTableData();
      });
    });

    // Search input
    let searchDebounce;
    document.getElementById('input-search-bank-txs')?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadTableData();
      }, 300);
    });

    document.getElementById('btn-refresh-bank-txs')?.addEventListener('click', loadTableData);

    await loadTableData();
  }

  // --- MODAL KHỚP THỦ CÔNG KHI USER NHẬP SAI CÚ PHÁP ---
  openManualMatchModal(txId, refCode, amount, descText, onSuccess) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-amber-500/50 animate-in fade-in zoom-in duration-200 space-y-4">
          <button id="manual-match-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-500/40 font-black shadow-md">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-100">Khớp Lệnh Thủ Công Giao Dịch #${refCode}</h3>
              <p class="text-[11px] text-slate-400">Số tiền: <b class="text-emerald-400 font-mono">+${amount.toLocaleString()} ₫</b></p>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1.5 font-mono">
            <span class="text-slate-500 font-sans block text-[11px]">Nội dung User đã chuyển khoản:</span>
            <div class="font-bold text-amber-300 break-all">${descText}</div>
          </div>

          <form id="form-manual-match" class="space-y-3.5">
            <div>
              <label class="block font-bold text-slate-300 text-xs mb-1">1. Nhập User ID nhận tiền (Hoặc tìm kiếm) *</label>
              <input type="number" id="manual-match-user-id" required placeholder="Ví dụ: 1 hoặc 2..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-300 text-xs mb-1">2. Mã đơn hàng Subscription PENDING (Nếu nạp gói VIP)</label>
              <input type="text" id="manual-match-order-code" placeholder="Ví dụ: ORD-123456 (để trống nếu nạp ví thật)"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-300 text-xs mb-1">3. Ghi chú đối soát</label>
              <textarea id="manual-match-note" rows="2" placeholder="Ghi chú lý do khớp thủ công..." 
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500">Khách chuyển thiếu cú pháp, Admin đối soát xác nhận.</textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="manual-match-cancel" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                Hủy
              </button>
              <button type="submit" id="btn-submit-manual-match" class="px-5 py-2.5 rounded-xl gradient-amber text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 active:scale-95 transition flex items-center gap-1.5">
                <i class="fa-solid fa-check"></i>
                <span>Xác Nhận Khớp & Cộng Tiền Ngay</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('manual-match-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('manual-match-cancel')?.addEventListener('click', closeModal);

    document.getElementById('form-manual-match')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uId = parseInt(document.getElementById('manual-match-user-id')?.value);
      const ordCode = document.getElementById('manual-match-order-code')?.value?.trim();
      const note = document.getElementById('manual-match-note')?.value?.trim();

      if (!uId) {
        this.app.showToast('Vui lòng nhập User ID hợp lệ', 'error');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-manual-match');
      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang khớp lệnh...`;
        submitBtn.disabled = true;
      }

      try {
        const res = await api.manualMatchBankTransaction(txId, {
          user_id: uId,
          order_code: ordCode || null,
          note: note
        });

        if (window.confetti) {
          window.confetti({ particleCount: 130, spread: 75, origin: { y: 0.6 } });
        }

        this.app.showToast(res.message || 'Đã khớp thủ công giao dịch thành công!', 'success');
        closeModal();
        if (onSuccess) onSuccess();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khi khớp thủ công', 'error');
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Xác Nhận Lại`;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // --- MODULE 3: CẤU HÌNH CÚ PHÁP & TỰ ĐỘNG DUYỆT (AUTOMATION SETTINGS & DEMO TESTER) ---
  async renderBankAutomationModule(wrapper) {
    wrapper.innerHTML = `
      <div class="space-y-6">
        
        <!-- Banner -->
        <div class="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/40 flex items-center justify-between shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100 flex items-center gap-2">
                <span>Cấu Hình Cú Pháp & Tự Động Duyệt (Automation Engine)</span>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">100% Tự Động</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Xử lý webhook đối soát thời gian thực, bóc tách Regex nhận diện User & Mã đơn hàng tức thời.</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left 6 cols: Cú Pháp Cấu Hình -->
          <div class="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h4 class="text-sm font-black text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <i class="fa-solid fa-code text-emerald-400"></i>
              <span>Quy Chuẩn Cú Pháp Chuyển Khoản Tự Động</span>
            </h4>

            <div class="space-y-3 text-xs">
              <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span class="text-emerald-400 font-bold font-mono">1. Nạp gói VIP trực tiếp:</span>
                <p class="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800">
                  Cú pháp: <b class="text-amber-300">FT{PLAN} {USER_ID} {MÃ_ĐƠN}</b> (vd: <span class="text-emerald-300">FTPLATINUM 1 888999</span>)
                </p>
                <p class="text-[10px] text-slate-500 font-sans">Tự động kích hoạt gói VIP và kéo dài hạn dùng cho tài khoản tương ứng.</p>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span class="text-emerald-400 font-bold font-mono">2. Nạp tiền vào Ví Tiền Thật:</span>
                <p class="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800">
                  Cú pháp: <b class="text-amber-300">NAP VIP {USER_ID} {MÃ_ĐƠN}</b> (vd: <span class="text-emerald-300">NAP VIP 1 654321</span>)
                </p>
                <p class="text-[10px] text-slate-500 font-sans">Tự động cộng số dư vào Ví Dịch Vụ & VIP để người dùng chi tiêu.</p>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span class="text-cyan-400 font-bold font-mono">3. Endpoint Webhook Nhận Tiền Ngân Hàng:</span>
                <p class="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800 select-all">
                  POST /api/payments/webhook/bank-transfer
                </p>
              </div>
            </div>
          </div>

          <!-- Right 6 cols: Live Mock Tester (Demo Trước Giảng Viên) -->
          <div class="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-flask-vial text-cyan-400"></i>
                <span>Trình Giả Lập Webhook Ngân Hàng (Demo Tester)</span>
              </h4>
              <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">Live Demo</span>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              Mô phỏng máy chủ MB Bank bắn biến động số dư về hệ thống tức thì để kiểm thử toàn bộ luồng tự động hóa 100%.
            </p>

            <form id="form-mock-bank-tester" class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">User ID nhận tiền *</label>
                <input type="number" id="mock-user-id" value="${this.app?.currentUser?.id || 1}" required
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Số tiền chuyển (VNĐ) *</label>
                <input type="number" id="mock-amount" value="200000" step="10000" required
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-black text-sm focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Nội dung chuyển khoản (Memo) *</label>
                <input type="text" id="mock-memo" value="NAP VIP ${this.app?.currentUser?.id || 1} DEMO_LIVE_HOOK" required
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div class="pt-1">
                <button type="submit" id="btn-trigger-mock-hook"
                  class="w-full py-3 rounded-xl gradient-cyan text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition flex items-center justify-center gap-2">
                  <i class="fa-solid fa-bolt"></i>
                  <span>⚡ Bắn Giả Lập Biến Động Số Dư Ngay</span>
                </button>
              </div>
            </form>

            <div id="mock-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"></div>
          </div>

        </div>

      </div>
    `;

    document.getElementById('form-mock-bank-tester')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uId = parseInt(document.getElementById('mock-user-id')?.value || '1');
      const amt = parseFloat(document.getElementById('mock-amount')?.value || '200000');
      const memo = document.getElementById('mock-memo')?.value?.trim();
      const resultBox = document.getElementById('mock-result-box');
      const submitBtn = document.getElementById('btn-trigger-mock-hook');

      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang bắn webhook...`;
        submitBtn.disabled = true;
      }

      try {
        const res = await api.mockReceiveMoney(null, amt, memo, uId);
        if (resultBox) {
          resultBox.classList.remove('hidden');
          resultBox.className = 'p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono space-y-1';
          resultBox.innerHTML = `
            <div class="text-emerald-300 font-bold">✅ Webhook xử lý thành công (Action: ${res.action})!</div>
            <div class="text-slate-300 text-[11px]">${res.message}</div>
          `;
        }

        if (window.confetti) {
          window.confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        }
        this.app.showToast(res.message || 'Đã mô phỏng tiền về thành công!', 'success');
      } catch (err) {
        if (resultBox) {
          resultBox.classList.remove('hidden');
          resultBox.className = 'p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono';
          resultBox.textContent = `❌ Lỗi: ${err.message}`;
        }
        this.app.showToast(err.message || 'Lỗi khi bắn webhook', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>⚡ Bắn Giả Lập Biến Động Số Dư Ngay</span>`;
          submitBtn.disabled = false;
        }
      }
    });
  }
}




