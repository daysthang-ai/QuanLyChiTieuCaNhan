import { api } from '../api.js';

export class NotificationsComponent {
  constructor(app) {
    this.app = app;
    this.activeFilter = 'all';
    this.notifications = [];
    this.total = 0;
    this.unreadCount = 0;
    this.isLoading = false;
    this.searchQuery = '';
  }

  async render(container) {
    this.isLoading = true;
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- 1. Header Banner -->
        <div class="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-pink-500/25 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#190d20]">
          <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-pink-600/15 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none"></div>
          <div class="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-xl shadow-pink-500/25 ring-4 ring-pink-500/20 flex-shrink-0">
                <i class="fa-solid fa-bell"></i>
              </div>
              <div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">Hộp Thư & Thông Báo</h1>
                  <span id="notif-badge-counter" class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40 neon-badge-unread flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald animate-pulse"></span>
                    0 chưa đọc
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                  Nhận cảnh báo ngân sách chi tiêu, lời khuyên tài chính AI 50/30/20 & thông báo cập nhật hệ thống
                </p>
              </div>
            </div>

            <!-- Header Quick Action Buttons -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <button id="btn-mark-all-read" class="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 active:scale-95 transition flex items-center gap-2 shadow-md hover:border-emerald-500/50 hover:text-emerald-300 group">
                <i class="fa-solid fa-check-double text-emerald-400 group-hover:scale-110 transition-transform"></i>
                <span>Đánh Dấu Đã Đọc Tất Cả</span>
              </button>
              <button id="btn-clear-all-notifs" class="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/50 active:scale-95 transition flex items-center gap-2 shadow-md hover:border-rose-500/60 group">
                <i class="fa-solid fa-trash-can text-rose-400 group-hover:scale-110 transition-transform"></i>
                <span>Xóa Tất Cả</span>
              </button>
              <button id="btn-refresh-notifs" class="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/80 active:scale-95 transition shadow-md" title="Làm mới">
                <i class="fa-solid fa-rotate text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Stats KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="notif-kpi-cards">
          <div class="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-lg border border-blue-500/20 flex-shrink-0 shadow-sm">
              <i class="fa-solid fa-envelopes-bulk"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Thông Báo</span>
              <span id="kpi-total" class="text-lg font-black text-slate-100 font-mono">0</span>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/20 flex-shrink-0 shadow-sm">
              <i class="fa-solid fa-envelope-circle-check"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tin Mới Chưa Đọc</span>
              <span id="kpi-unread" class="text-lg font-black text-emerald-400 font-mono">0</span>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-lg border border-rose-500/20 flex-shrink-0 shadow-sm">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cảnh Báo Chi Tiêu</span>
              <span id="kpi-budget" class="text-lg font-black text-rose-400 font-mono">0</span>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg border border-amber-500/20 flex-shrink-0 shadow-sm">
              <i class="fa-solid fa-lightbulb"></i>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lời Khuyên AI</span>
              <span id="kpi-ai" class="text-lg font-black text-amber-300 font-mono">0</span>
            </div>
          </div>
        </div>

        <!-- 3. Quick Filter Tabs & Search Bar -->
        <div class="glass-card p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" id="notif-filter-tabs">
            <button class="notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${this.activeFilter === 'all' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}" data-filter="all">
              <i class="fa-solid fa-list-ul text-[11px]"></i>
              <span>Tất cả</span>
            </button>
            <button class="notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${this.activeFilter === 'unread' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}" data-filter="unread">
              <span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald animate-pulse"></span>
              <span>Chưa đọc</span>
            </button>
            <button class="notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${this.activeFilter === 'budget_alert' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}" data-filter="budget_alert">
              <i class="fa-solid fa-triangle-exclamation text-[11px] text-rose-400"></i>
              <span>🚨 Cảnh báo chi tiêu</span>
            </button>
            <button class="notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${this.activeFilter === 'ai_advice' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}" data-filter="ai_advice">
              <i class="fa-solid fa-lightbulb text-[11px] text-amber-400"></i>
              <span>💡 Lời khuyên AI</span>
            </button>
            <button class="notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${this.activeFilter === 'system' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}" data-filter="system">
              <i class="fa-solid fa-bullhorn text-[11px] text-indigo-400"></i>
              <span>📢 Hệ thống</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative min-w-[240px]">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" id="notif-search-input" placeholder="Tìm kiếm thông báo..." 
              value="${this.searchQuery}"
              class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" />
          </div>
        </div>

        <!-- 4. Notifications Feed Container -->
        <div id="notifications-list-container" class="space-y-3.5">
          <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
            <i class="fa-solid fa-spinner fa-spin text-xl text-pink-400 mb-2 block"></i>
            Đang tải thông báo...
          </div>
        </div>

      </div>
    `;

    this.bindEvents(container);
    await this.loadNotifications();
  }

  bindEvents(container) {
    // Filter subtab clicks
    container.querySelectorAll('.notif-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.notif-filter-btn').forEach(b => {
          b.className = 'notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800';
        });
        btn.className = 'notif-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm';
        this.activeFilter = btn.getAttribute('data-filter');
        this.loadNotifications();
      });
    });

    // Mark all as read button
    container.querySelector('#btn-mark-all-read')?.addEventListener('click', async () => {
      try {
        await api.markAllNotificationsAsRead();
        this.app.showToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
        this.app.updateNotificationBadge?.(false);
        await this.loadNotifications();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
      }
    });

    // Clear all notifications button
    container.querySelector('#btn-clear-all-notifs')?.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo trong hộp thư không?')) return;
      try {
        await api.clearAllNotifications();
        this.app.showToast('Đã xóa toàn bộ thông báo thành công!', 'success');
        this.app.updateNotificationBadge?.(false);
        await this.loadNotifications();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khi xóa thông báo', 'error');
      }
    });

    // Refresh button
    container.querySelector('#btn-refresh-notifs')?.addEventListener('click', () => {
      this.loadNotifications();
    });

    // Search input with debounce
    const searchInput = container.querySelector('#notif-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderList();
    });
  }

  async loadNotifications() {
    const listContainer = document.getElementById('notifications-list-container');
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="py-12 text-center text-slate-500 text-xs animate-pulse">
          <i class="fa-solid fa-spinner fa-spin text-xl text-pink-400 mb-2 block"></i>
          Đang cập nhật danh sách thông báo...
        </div>
      `;
    }

    try {
      const data = await api.getNotifications(this.activeFilter);
      this.notifications = data.notifications || [];
      this.total = data.total ?? (this.notifications.length);
      this.unreadCount = data.unread_count ?? 0;
      this.budgetCount = data.budget_count ?? 0;
      this.aiCount = data.ai_count ?? 0;
      this.systemCount = data.system_count ?? 0;

      // Update Header & KPI counters
      this.updateStatsUI();

      // Render the cards
      this.renderList();

      // Refresh global badges in topbar & sidebar
      this.app.updateNotificationBadge?.(false);
    } catch (err) {
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="p-8 text-center text-rose-400 text-xs glass-card rounded-2xl border border-rose-500/30 space-y-3">
            <i class="fa-solid fa-triangle-exclamation text-2xl mb-1 block"></i>
            <p class="font-bold">Lỗi khi tải thông báo: ${err.message}</p>
            <button id="btn-retry-notifs" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition border border-slate-700 active:scale-95">
              <i class="fa-solid fa-rotate mr-1.5"></i> Thử lại
            </button>
          </div>
        `;
        listContainer.querySelector('#btn-retry-notifs')?.addEventListener('click', () => {
          this.loadNotifications();
        });
      }
    }
  }

  updateStatsUI() {
    const badgeEl = document.getElementById('notif-badge-counter');
    if (badgeEl) {
      if (this.unreadCount > 0) {
        badgeEl.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald animate-pulse"></span>
          ${this.unreadCount} chưa đọc
        `;
        badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40 neon-badge-unread flex items-center gap-1.5 animate-pulse';
      } else {
        badgeEl.innerHTML = `
          <i class="fa-solid fa-check text-[10px] text-slate-400"></i>
          0 chưa đọc
        `;
        badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5';
      }
    }

    const totalEl = document.getElementById('kpi-total');
    const unreadEl = document.getElementById('kpi-unread');
    const budgetEl = document.getElementById('kpi-budget');
    const aiEl = document.getElementById('kpi-ai');

    if (totalEl) totalEl.textContent = this.total;
    if (unreadEl) unreadEl.textContent = this.unreadCount;
    if (budgetEl) budgetEl.textContent = this.budgetCount;
    if (aiEl) aiEl.textContent = this.aiCount;
  }

  renderList() {
    const listContainer = document.getElementById('notifications-list-container');
    if (!listContainer) return;

    let items = this.notifications;
    if (this.searchQuery) {
      items = items.filter(n => 
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.message && n.message.toLowerCase().includes(this.searchQuery))
      );
    }

    if (items.length === 0) {
      const emptyStateText = {
        all: 'Bạn đã xem hết các thông báo trong hộp thư.',
        unread: 'Tuyệt vời! Bạn không còn thông báo chưa đọc nào.',
        budget_alert: 'Không có cảnh báo ngân sách nào. Chi tiêu của bạn đang trong tầm kiểm soát an toàn!',
        ai_advice: 'Chưa có lời khuyên AI mới. Hãy tiếp tục ghi chép chi tiêu để AI phân tích chuẩn xác hơn.',
        system: 'Không có thông báo hệ thống nào vào lúc này.'
      }[this.activeFilter] || 'Không tìm thấy thông báo phù hợp.';

      listContainer.innerHTML = `
        <div class="glass-card p-12 rounded-3xl text-center space-y-3.5 border border-slate-800/80">
          <div class="w-16 h-16 rounded-3xl bg-slate-800/80 text-slate-500 flex items-center justify-center text-2xl mx-auto border border-slate-700/50 shadow-inner">
            <i class="fa-regular fa-bell-slash"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-200">Không có thông báo nào</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            ${this.searchQuery ? `Không tìm thấy kết quả nào khớp với từ khóa "${this.searchQuery}".` : emptyStateText}
          </p>
          <div class="pt-2">
            <button id="btn-empty-reset-demo" class="px-4 py-2 rounded-xl gradient-indigo text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition inline-flex items-center gap-2 hover:brightness-110">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
              <span>Khôi Phục 5 Thông Báo Mẫu Sinh Động</span>
            </button>
          </div>
        </div>
      `;

      listContainer.querySelector('#btn-empty-reset-demo')?.addEventListener('click', async () => {
        try {
          await api.resetDemoNotifications();
          this.app.showToast('Đã khôi phục 5 thông báo mẫu sinh động thành công!', 'success');
          this.app.updateNotificationBadge?.(false);
          await this.loadNotifications();
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi khi khôi phục thông báo', 'error');
        }
      });

      return;
    }

    const getTheme = (type) => {
      switch (type) {
        case 'BUDGET_ALERT':
        case 'WARNING':
          return {
            border: 'border-rose-500/35 hover:border-rose-500/60',
            bgGlow: 'bg-gradient-to-r from-rose-950/35 via-slate-900 to-slate-900',
            iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20',
            icon: 'fa-solid fa-triangle-exclamation',
            badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            badgeText: '🚨 Cảnh Báo Ngân Sách',
            tagColor: 'text-rose-400'
          };
        case 'AI_ADVICE':
        case 'AI_INSIGHT':
        case 'AI':
          return {
            border: 'border-amber-500/35 hover:border-amber-500/60',
            bgGlow: 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900',
            iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-amber-500/20',
            icon: 'fa-solid fa-lightbulb',
            badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            badgeText: '💡 Lời Khuyên Tài Chính AI',
            tagColor: 'text-amber-300'
          };
        case 'SYSTEM':
        case 'INFO':
        case 'PROMOTION':
        case 'MAINTENANCE':
        default:
          return {
            border: 'border-indigo-500/35 hover:border-indigo-500/60',
            bgGlow: 'bg-gradient-to-r from-indigo-950/35 via-slate-900 to-slate-900',
            iconBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-indigo-500/20',
            icon: 'fa-solid fa-bullhorn',
            badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
            badgeText: '📢 Thông Báo Hệ Thống',
            tagColor: 'text-indigo-300'
          };
      }
    };

    const getActionBtn = (linkTab) => {
      if (!linkTab) return '';
      const labels = {
        budgets: '🎯 Xem & Điều chỉnh Ngân Sách ➔',
        analytics: '📊 Xem Phân Tích 50/30/20 ➔',
        subscription: '👑 Nâng Cấp VIP Premium ➔',
        ai_assistant: '🤖 Trò Chuyện Cùng Cố Vấn AI ➔',
        wallets: '💳 Quản Lý Ví & Tài Khoản ➔',
        badges: '🏆 Xem Huy Hiệu & Thành Tích ➔',
        transactions: '🧾 Xem Sổ Giao Dịch ➔',
        dashboard: '🏠 Về Trang Chủ Dashboard ➔'
      };
      const label = labels[linkTab] || 'Xem chi tiết ➔';
      return `
        <button class="btn-goto-tab px-3.5 py-1.5 rounded-xl gradient-indigo text-white text-[11px] font-bold shadow-sm shadow-indigo-500/25 active:scale-95 transition flex items-center gap-1.5 mt-3 hover:brightness-110" data-tab="${linkTab}">
          <span>${label}</span>
        </button>
      `;
    };

    listContainer.innerHTML = items.map(n => {
      const theme = getTheme(n.type);
      return `
        <div class="notif-card glass-card p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${theme.border} ${theme.bgGlow} ${!n.is_read ? 'ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'opacity-85 hover:opacity-100'}" id="notif-card-${n.id}">
          
          <div class="flex items-start gap-3.5 sm:gap-4">
            
            <!-- Type Icon -->
            <div class="w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center text-xl flex-shrink-0 shadow-md">
              <i class="${theme.icon}"></i>
            </div>

            <!-- Content Body -->
            <div class="flex-1 min-w-0">
              
              <!-- Badges & Meta Top Row -->
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${theme.badgeBg}">
                    ${theme.badgeText}
                  </span>

                  <!-- Status Neon Indicator -->
                  ${!n.is_read ? `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 neon-badge-unread">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald animate-pulse"></span>
                      Chưa đọc
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-semibold bg-slate-800/80 border border-slate-700/60 font-mono">
                      <i class="fa-solid fa-check text-[9px] text-slate-500"></i> Đã đọc
                    </span>
                  `}
                </div>

                <!-- Timestamp -->
                <span class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <i class="fa-regular fa-clock text-[10px] text-slate-500"></i>
                  ${n.created_at_formatted || 'Vừa xong'}
                </span>
              </div>

              <!-- Title -->
              <h3 class="text-sm font-extrabold ${!n.is_read ? 'text-white font-black' : 'text-slate-200'} leading-tight tracking-tight mb-1.5">
                ${n.title}
              </h3>

              <!-- Message Text -->
              <p class="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                ${n.message}
              </p>

              <!-- Action Link Button -->
              ${getActionBtn(n.link_tab)}

            </div>

            <!-- Card Actions: Mark Read & Delete -->
            <div class="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
              ${!n.is_read ? `
                <button class="btn-mark-single-read w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-emerald-950/90 text-slate-400 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/50 flex items-center justify-center text-xs active:scale-95 transition shadow-sm" data-id="${n.id}" title="Đánh dấu đã đọc">
                  <i class="fa-solid fa-check"></i>
                </button>
              ` : ''}

              <button class="btn-delete-notif w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-rose-950/90 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/50 flex items-center justify-center text-xs active:scale-95 transition shadow-sm" data-id="${n.id}" title="Xóa thông báo này">
                <i class="fa-solid fa-trash-can text-[11px]"></i>
              </button>
            </div>

          </div>

        </div>
      `;
    }).join('');

    // Bind card action buttons
    listContainer.querySelectorAll('.btn-mark-single-read').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        try {
          await api.markNotificationAsRead(id);
          this.app.showToast('Đã đánh dấu thông báo là đã đọc', 'success');
          this.app.updateNotificationBadge?.(false);
          await this.loadNotifications();
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi khi cập nhật', 'error');
        }
      });
    });

    listContainer.querySelectorAll('.btn-delete-notif').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        try {
          await api.deleteNotification(id);
          this.app.showToast('Đã xóa thông báo khỏi danh sách', 'success');
          this.app.updateNotificationBadge?.(false);
          await this.loadNotifications();
        } catch (err) {
          this.app.showToast(err.message || 'Lỗi khi xóa', 'error');
        }
      });
    });

    listContainer.querySelectorAll('.btn-goto-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.app.navigate(tab);
        }
      });
    });
  }
}


