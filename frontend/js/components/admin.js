import { api } from '../api.js';
import { formatVND } from '../utils/formatters.js';

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
        <div class="relative rounded-3xl p-6 overflow-hidden border ${isRootAdmin ? 'border-rose-500/30' : 'border-purple-500/30'} shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#120818]">
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
          { id: 'orders_pending', icon: 'fa-clock text-amber-400', label: '⏳ Chờ Duyệt' },
          { id: 'orders_approved', icon: 'fa-circle-check text-emerald-400', label: '✅ Đã Phê Duyệt' },
          { id: 'orders_rejected', icon: 'fa-circle-xmark text-rose-400', label: '❌ Đã Từ Chối' },
          { id: 'orders_export_csv', icon: 'fa-file-excel text-teal-300', label: '📥 Xuất CSV', isAction: true }
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
        currentActiveSubtab = this.activeSettingsFilter || 'settings_broadcast';
        subtabs = [
          { id: 'settings_broadcast', icon: 'fa-bullhorn text-rose-400', label: '📢 Phát Thông Báo' },
          { id: 'settings_smtp', icon: 'fa-envelope text-blue-400', label: '📧 Cấu hình Mail (SMTP)' },
          { id: 'settings_backup', icon: 'fa-database text-teal-400', label: '💾 Sao Lưu Database' },
          { id: 'settings_security', icon: 'fa-key text-amber-400', label: '🔐 Khóa API & Bảo Mật' }
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
        <div class="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
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
                      <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Gói VIP:
                    </span>
                    <span class="font-mono font-bold text-amber-200">${plans.counts[2] || 0} (${plans.percentages[2] || 0}%)</span>
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
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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

    this.growthChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: barLabel,
            data: dataBar,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 6,
            barPercentage: 0.5,
            order: 2
          },
          {
            type: 'line',
            label: lineLabel,
            data: dataLine,
            borderColor: '#F43F5E',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
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
        resizeDelay: 50,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              font: { size: 10, weight: 'bold' },
              color: '#94A3B8'
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { precision: 0 }
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

    this.planChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: plans.labels || ['Free', 'Pro', 'VIP'],
        datasets: [{
          data: plans.counts || [1, 1, 1],
          backgroundColor: plans.colors || ['#64748B', '#6366F1', '#F59E0B'],
          borderWidth: 2,
          borderColor: '#020617'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 50,
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
    else if (filterId === 'users_paid') plan = 'PRO,PREMIUM';
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
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${u.plan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : u.plan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'}">
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
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
                  <option value="FREE" ${userPlan === 'FREE' ? 'selected' : ''}>Gói FREE (10 AI calls/ngày)</option>
                  <option value="PRO" ${userPlan === 'PRO' ? 'selected' : ''}>Gói PRO (100 AI calls/ngày)</option>
                  <option value="PREMIUM" ${userPlan === 'PREMIUM' ? 'selected' : ''}>Gói PREMIUM (VIP Unlimited)</option>
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
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải AI config: ${e.message}</div>`;
    }
  }

  renderAIContent(container) {
    if (!this.aiConfigData) return;
    const data = this.aiConfigData;
    const c = data.config;
    const s = data.stats;

    container.innerHTML = `
      <div class="space-y-6 admin-subtab-content-anim">
        
        <!-- Module 1: Token Stats & Consumption -->
        <div id="ai-module-stats" class="space-y-3 ${this.activeAIFilter === 'ai_stats' || this.activeAIFilter === 'all' ? 'block' : 'opacity-60'} transition">
          <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <i class="fa-solid fa-bolt text-amber-300"></i> Module 1: Thống Kê & Chi Phí Token AI
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-indigo-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Token Sử Dụng Hôm Nay</span>
              <div class="text-2xl font-black text-indigo-400 font-mono">${s.today_tokens.toLocaleString()} tokens</div>
              <div class="text-[11px] text-slate-400 mt-1">${s.today_calls} lượt truy vấn trong ngày</div>
            </div>
            <div class="glass-card p-5 rounded-3xl border border-purple-500/20 bg-purple-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Token Sử Dụng Tháng Này</span>
              <div class="text-2xl font-black text-purple-400 font-mono">${s.month_tokens.toLocaleString()} tokens</div>
              <div class="text-[11px] text-slate-400 mt-1">${s.month_calls} lượt truy vấn trong tháng</div>
            </div>
            <div class="glass-card p-5 rounded-3xl border border-amber-500/20 bg-amber-950/15">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chi Phí API Ước Tính</span>
              <div class="text-2xl font-black text-amber-300 font-mono">$${s.est_monthly_cost_usd} (~${s.est_monthly_cost_vnd.toLocaleString()} ₫)</div>
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
                Module 4: Cấu Hình Model Engine AI & Endpoint
              </h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Model: ${c.provider}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Mô Hình AI Kích Hoạt (Provider)</label>
                <select id="ai-provider" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold">
                  ${data.providers_available.map(p => `
                    <option value="${p.name}" ${p.name === c.provider ? 'selected' : ''}>${p.name} (${p.status})</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Model Name / Endpoint Code</label>
                <input type="text" id="ai-model-name" value="${c.model_name}" 
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
                Module 2: System Prompt Natural Language Parser (Bóc tách giao dịch tự nhiên)
              </h3>
              <span class="text-[10px] font-bold text-indigo-300 font-mono">Zero-PII Active</span>
            </div>
            <p class="text-[11px] text-slate-400">Quy định logic trích xuất Số tiền, Danh mục, Ví và Loại giao dịch từ tiếng Việt tự nhiên</p>
            <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span class="text-slate-400 font-bold">Biến hỗ trợ:</span>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{raw_text}')">{raw_text}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{available_wallets}')">{available_wallets}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{available_categories}')">{available_categories}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-parser', '{current_date}')">{current_date}</button>
            </div>
            <textarea id="ai-prompt-parser" rows="4" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px] leading-relaxed">${c.system_prompt_parser}</textarea>
          </div>

          <!-- Module 3: System Prompt Advisor -->
          <div id="ai-module-advisor" class="glass-card p-6 rounded-3xl space-y-3 border ${this.activeAIFilter === 'ai_advisor' ? 'border-purple-500 shadow-xl shadow-purple-500/15 ring-2 ring-purple-500/20' : 'border-slate-800'} transition">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-brain text-purple-400"></i>
                Module 3: System Prompt Financial Health Advisor (Bác sĩ tài chính 50/30/20)
              </h3>
              <span class="text-[10px] font-bold text-purple-300 font-mono">50/30/20 Rule</span>
            </div>
            <p class="text-[11px] text-slate-400">Quy định tính cách và nguyên tắc tư vấn tái cơ cấu ngân sách cho người dùng</p>
            <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span class="text-slate-400 font-bold">Biến hỗ trợ:</span>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{total_income}')">{total_income}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{total_expense}')">{total_expense}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{needs_pct}')">{needs_pct}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{wants_pct}')">{wants_pct}</button>
              <button type="button" class="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 font-mono" onclick="window.fintrackAdmin.insertVariableToPrompt('ai-prompt-advisor', '{savings_pct}')">{savings_pct}</button>
            </div>
            <textarea id="ai-prompt-advisor" rows="4" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px] leading-relaxed">${c.system_prompt_advisor}</textarea>
          </div>

          <!-- Module 5: Rate Limits & Quotas -->
          <div id="ai-module-limits" class="glass-card p-6 rounded-3xl space-y-3 border ${this.activeAIFilter === 'ai_limits' ? 'border-rose-500 shadow-xl shadow-rose-500/15 ring-2 ring-rose-500/20' : 'border-slate-800'} transition">
            <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <i class="fa-solid fa-stopwatch text-rose-400"></i>
              Module 5: Hạn Mức Lượt Gọi AI Cho Từng Gói Tài Khoản (Rate Limits / Day)
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói FREE (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-free" value="${c.rate_limit_free}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói PRO (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-pro" value="${c.rate_limit_pro}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1 font-bold">Gói PREMIUM (Lượt/Ngày)</label>
                <input type="number" id="ai-limit-prem" value="${c.rate_limit_premium}" class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold" />
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

    const targetEl = document.getElementById(map[filterId]);
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
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
  // 6. SYSTEM LOGS TAB & SECURITY SUB-TAB FILTERING
  // =========================================================================
  async renderLogsTab(container) {
    container.innerHTML = `<div class="py-16 text-center text-slate-500 text-xs animate-pulse">Đang tải nhật ký kiểm toán & bảo mật...</div>`;

    try {
      const data = await api.getAdminLogs();
      this.logsData = data.logs;
      this.renderLogsContent(container);
    } catch (e) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Lỗi khi tải Logs: ${e.message}</div>`;
    }
  }

  renderLogsContent(container) {
    if (!this.logsData) return;
    const allLogs = this.logsData;

    // Filter logs according to active subtab
    let filteredLogs = allLogs;
    if (this.activeLogsFilter === 'logs_security') {
      filteredLogs = allLogs.filter(l => l.type === 'SECURITY');
    } else if (this.activeLogsFilter === 'logs_ai') {
      filteredLogs = allLogs.filter(l => l.type === 'AI_API' || l.type === 'AI_ENGINE');
    } else if (this.activeLogsFilter === 'logs_data') {
      filteredLogs = allLogs.filter(l => l.type === 'DATA_CHANGE');
    } else if (this.activeLogsFilter === 'logs_error') {
      filteredLogs = allLogs.filter(l => l.type === 'ERROR_LOG' || l.type === 'ERROR');
    }

    container.innerHTML = `
      <div class="space-y-4 admin-subtab-content-anim">
        
        <!-- Search bar -->
        <div class="glass-card p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-800">
          <div class="flex-1 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" id="admin-logs-search" placeholder="Tìm kiếm trong log (Hành động, IP, Email)..." 
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-rose-500 font-mono" />
          </div>
          <span class="text-xs text-slate-400 font-mono">Hiển thị: <b class="text-cyan-400 font-bold">${filteredLogs.length}</b> sự kiện</span>
        </div>

        <!-- Logs Feed Table -->
        <div class="glass-card p-5 rounded-3xl border border-slate-800" id="admin-logs-table-container">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
                  <th class="pb-2.5 font-bold">Thời Gian</th>
                  <th class="pb-2.5 font-bold">Loại Log</th>
                  <th class="pb-2.5 font-bold">Tài Khoản / Tác Nhân</th>
                  <th class="pb-2.5 font-bold">Địa Chỉ IP</th>
                  <th class="pb-2.5 font-bold">Hành Động</th>
                  <th class="pb-2.5 font-bold">Chi Tiết Sự Kiện</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]" id="admin-logs-tbody">
                ${filteredLogs.length > 0 ? filteredLogs.map(l => `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-2.5 text-slate-400 whitespace-nowrap">${l.timestamp}</td>
                    <td class="py-2.5">
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-black ${l.type === 'SECURITY' ? 'bg-rose-500/20 text-rose-300' : l.type === 'ERROR_LOG' ? 'bg-red-500/30 text-red-200' : l.type === 'AI_API' || l.type === 'AI_ENGINE' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'}">
                        ${l.type}
                      </span>
                    </td>
                    <td class="py-2.5 text-slate-200 font-sans font-bold">${l.user}</td>
                    <td class="py-2.5 text-slate-400">${l.ip}</td>
                    <td class="py-2.5 text-cyan-300 font-bold font-sans">${l.action}</td>
                    <td class="py-2.5 text-slate-300 font-sans">${l.details}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-500 text-xs font-sans">
                      Không có sự kiện nào thuộc nhóm này.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    const searchInput = document.getElementById('admin-logs-search');
    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      document.querySelectorAll('#admin-logs-tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  applyLogsFilter(filterId) {
    const container = document.getElementById('admin-view-body');
    if (!container) return;
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
                    <option value="PREMIUM">👑 Chỉ người dùng VIP Premium</option>
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

      container.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
              <th class="pb-2.5 font-bold">ID</th>
              <th class="pb-2.5 font-bold">Tiêu Đề & Nội Dung</th>
              <th class="pb-2.5 font-bold">Loại</th>
              <th class="pb-2.5 font-bold">Đối Tượng Nhận</th>
              <th class="pb-2.5 font-bold">Lượt Đọc</th>
              <th class="pb-2.5 font-bold">Thời Gian</th>
              <th class="pb-2.5 font-bold text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans text-xs">
            ${notifs.map(n => {
              const isProtected = isModerator && (n.created_by_role === 'ADMIN' || ['CRITICAL', 'SECURITY', 'SYSTEM_CRITICAL', 'MAINTENANCE', 'WARNING'].includes(n.type));

              return `
              <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3 font-mono text-slate-500">#${n.id}</td>
                <td class="py-3 max-w-xs">
                  <div class="font-extrabold text-slate-100">${n.title}</div>
                  <div class="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">${n.message}</div>
                  ${n.link_tab ? `<span class="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">➔ ${n.link_tab}</span>` : ''}
                </td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${n.type === 'PROMOTION' ? 'bg-amber-500/20 text-amber-300' : n.type === 'WARNING' ? 'bg-rose-500/20 text-rose-300' : n.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : n.type === 'MAINTENANCE' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">
                    ${n.type}
                  </span>
                </td>
                <td class="py-3">
                  <span class="font-bold text-slate-200 text-xs">${n.recipient_info}</span>
                </td>
                <td class="py-3 font-mono font-bold text-cyan-300">
                  ${n.reads_count}
                </td>
                <td class="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  ${n.created_at}
                </td>
                <td class="py-3 text-right">
                  ${isProtected ? `
                    <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700 font-mono inline-flex items-center gap-1" title="Thông báo do Root Admin phát hành - Không thể xóa">
                      <i class="fa-solid fa-lock text-[9px] text-amber-400"></i> Admin gốc
                    </span>
                  ` : `
                    <button type="button" class="btn-admin-del-notif px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-bold border border-red-800/40 active:scale-95 transition" data-id="${n.id}" title="Xóa thông báo này">
                      <i class="fa-solid fa-trash-can text-[10px]"></i> Xóa
                    </button>
                  `}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.btn-admin-del-notif').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.getAttribute('data-id'));
          if (!confirm(`Bạn có chắc chắn muốn xóa thông báo #${id} khỏi hệ thống không?`)) return;
          try {
            await api.deleteAdminNotification(id);
            this.app.showToast('Đã xóa thông báo khỏi hệ thống', 'success');
            await this.loadAdminNotificationsHistory();
          } catch (err) {
            this.app.showToast(err.message || 'Lỗi khi xóa', 'error');
          }
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
                    <option value="PREMIUM">👑 Chỉ người dùng VIP Premium</option>
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
        notifs = notifs.filter(n => ['PRO', 'PREMIUM', 'VIP'].includes(n.target_type));
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

      tableContainer.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
              <th class="pb-2.5 font-bold">ID</th>
              <th class="pb-2.5 font-bold">Tiêu Đề & Nội Dung</th>
              <th class="pb-2.5 font-bold">Loại</th>
              <th class="pb-2.5 font-bold">Người Nhận</th>
              <th class="pb-2.5 font-bold">Lượt Đọc</th>
              <th class="pb-2.5 font-bold">Thời Gian</th>
              <th class="pb-2.5 font-bold text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans text-xs">
            ${notifs.map(n => {
              const isProtected = isModerator && (n.created_by_role === 'ADMIN' || ['CRITICAL', 'SECURITY', 'SYSTEM_CRITICAL', 'MAINTENANCE', 'WARNING'].includes(n.type));

              return `
              <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3 font-mono text-slate-500">#${n.id}</td>
                <td class="py-3 max-w-[200px]">
                  <div class="font-extrabold text-slate-100 truncate">${n.title}</div>
                  <div class="text-[11px] text-slate-400 truncate mt-0.5">${n.message}</div>
                  ${n.link_tab ? `<span class="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">➔ ${n.link_tab}</span>` : ''}
                </td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${n.type === 'PROMOTION' ? 'bg-amber-500/20 text-amber-300' : n.type === 'WARNING' ? 'bg-rose-500/20 text-rose-300' : n.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : n.type === 'MAINTENANCE' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">
                    ${n.type}
                  </span>
                </td>
                <td class="py-3">
                  <span class="font-bold text-slate-200 text-xs block">${n.recipient_info}</span>
                </td>
                <td class="py-3 font-mono font-bold text-cyan-300">
                  ${n.reads_count}
                </td>
                <td class="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  ${n.created_at}
                </td>
                <td class="py-3 text-right">
                  ${isProtected ? `
                    <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700 font-mono inline-flex items-center gap-1" title="Thông báo do Root Admin phát hành - Không thể xóa">
                      <i class="fa-solid fa-lock text-[9px] text-amber-400"></i> Admin gốc
                    </span>
                  ` : `
                    <button type="button" class="btn-admin-tab-del-notif p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-bold border border-red-800/40 active:scale-95 transition" data-id="${n.id}" title="Xóa thông báo này">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  `}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      `;

      tableContainer.querySelectorAll('.btn-admin-tab-del-notif').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.getAttribute('data-id'));
          if (!confirm(`Bạn có chắc chắn muốn xóa thông báo #${id} khỏi hệ thống không?`)) return;
          try {
            await api.deleteAdminNotification(id);
            this.app.showToast('Đã xóa thông báo khỏi hệ thống', 'success');
            await this.loadAdminTabNotifications();
          } catch (err) {
            this.app.showToast(err.message || 'Lỗi khi xóa', 'error');
          }
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
        
        <!-- KPI Metrics Header -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-orders-kpi-container">
          <div class="glass-card p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Đơn Hàng</span>
              <span class="text-xl font-black text-slate-100 font-mono" id="kpi-orders-total">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-base border border-blue-500/30">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chờ Phê Duyệt</span>
              <span class="text-xl font-black text-amber-300 font-mono" id="kpi-orders-pending">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base border border-amber-500/30">
              <i class="fa-solid fa-clock"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã Phê Duyệt</span>
              <span class="text-xl font-black text-emerald-400 font-mono" id="kpi-orders-approved">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/30">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doanh Thu Gói VIP</span>
              <span class="text-xl font-black text-purple-300 font-mono" id="kpi-orders-revenue">...</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base border border-purple-500/30">
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
            <select id="admin-orders-status-select" class="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <option value="ALL">📋 Tất cả trạng thái</option>
              <option value="PENDING">⏳ Chờ duyệt (Pending)</option>
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
    if (statusSelect && statusFilter !== 'ALL') statusSelect.value = statusFilter;

    const search = document.getElementById('admin-orders-search')?.value.trim() || '';

    try {
      const data = await api.getAdminSubscriptionOrders(statusFilter, search);
      const orders = Array.isArray(data?.orders) ? data.orders : (Array.isArray(data?.items) ? data.items : []);
      const kpi = data?.kpi || {};

      // Update KPIs
      const kTotal = document.getElementById('kpi-orders-total');
      const kPending = document.getElementById('kpi-orders-pending');
      const kApproved = document.getElementById('kpi-orders-approved');
      const kRev = document.getElementById('kpi-orders-revenue');

      if (kTotal) kTotal.textContent = kpi.total_orders || orders.length;
      if (kPending) kPending.textContent = kpi.pending_count || 0;
      if (kApproved) kApproved.textContent = kpi.approved_count || 0;
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
              const isApproved = o.status === 'APPROVED';
              const isRejected = o.status === 'REJECTED';

              return `
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="py-3 font-mono font-bold text-emerald-400">${o.order_code}</td>
                  <td class="py-3">
                    <div class="font-bold text-slate-100">${o.user_name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${o.user_email}</div>
                  </td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${o.plan_code === 'PREMIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}">
                      ${o.plan_code === 'PREMIUM' ? '👑 VIP Premium' : '⭐ FinTrack Pro'} (${o.plan_duration_days} ngày)
                    </span>
                    <div class="font-mono font-bold text-slate-200 mt-1">${formatVND(o.amount)}</div>
                  </td>
                  <td class="py-3 font-mono text-[11px]">
                    <div class="text-slate-300 font-bold">${o.payment_method}</div>
                    <div class="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded text-[10px] inline-block mt-0.5">${o.transfer_memo || '---'}</div>
                  </td>
                  <td class="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    ${o.created_at}
                  </td>
                  <td class="py-3">
                    ${isPending ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        ⏳ Chờ duyệt
                      </span>
                    ` : isApproved ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ✅ Đã duyệt (${o.approved_by || 'Admin'})
                      </span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40" title="${o.rejection_reason || ''}">
                        ❌ Từ chối
                      </span>
                    `}
                  </td>
                  <td class="py-3 text-right whitespace-nowrap">
                    ${isPending ? `
                      <div class="inline-flex items-center gap-1.5">
                        <button type="button" class="btn-approve-order px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition flex items-center gap-1" data-id="${o.id}" data-code="${o.order_code}">
                          <i class="fa-solid fa-check"></i> Duyệt
                        </button>
                        <button type="button" class="btn-reject-order px-2 py-1 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-bold text-xs active:scale-95 transition" data-id="${o.id}" data-code="${o.order_code}">
                          <i class="fa-solid fa-xmark"></i> Từ chối
                        </button>
                      </div>
                    ` : `
                      <span class="text-[11px] text-slate-500 font-mono">Hoàn tất</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Bind approve / reject handlers
      tableContainer.querySelectorAll('.btn-approve-order').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          if (!confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT đơn hàng #${code} và kích hoạt gói VIP cho người dùng ngay không?`)) return;
          try {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            const res = await api.approveAdminSubscriptionOrder(id);
            this.app.showToast(res.message || 'Đã phê duyệt đơn hàng thành công!', 'success');
            await this.loadAdminSubscriptions();
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
          const reason = prompt(`Nhập lý do từ chối đơn hàng #${code}:`, 'Không nhận được chuyển khoản hoặc sai cú pháp');
          if (!reason || !reason.trim()) return;
          try {
            btn.disabled = true;
            const res = await api.rejectAdminSubscriptionOrder(id, reason.trim());
            this.app.showToast(res.message || 'Đã từ chối đơn hàng.', 'success');
            await this.loadAdminSubscriptions();
          } catch (err) {
            this.app.showToast(err.message || 'Lỗi khi từ chối', 'error');
            btn.disabled = false;
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
      api.downloadAdminExport('subscriptions');
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
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
}


