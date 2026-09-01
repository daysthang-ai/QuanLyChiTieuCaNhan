import { api } from './api.js?v=7.0';
import { formatDateTimeVN, formatDateVN } from './utils/formatters.js?v=7.0';
import { AuthComponent } from './components/auth.js?v=7.0';
import { DashboardComponent } from './components/dashboard.js?v=7.0';
import { TransactionsComponent } from './components/transactions.js?v=7.0';
import { WalletsComponent } from './components/wallets.js?v=7.0';
import { CategoriesComponent } from './components/categories.js?v=7.0';
import { BudgetsComponent } from './components/budgets.js?v=7.0';
import { SavingsComponent } from './components/savings.js?v=7.0';
import { AnalyticsComponent } from './components/analytics.js?v=7.0';
import { AIAssistantComponent } from './components/ai_assistant.js?v=7.0';
import { BadgesComponent } from './components/badges.js?v=7.0';
import { AdminComponent } from './components/admin.js?v=7.0';
import { SubscriptionComponent } from './components/subscription.js?v=7.5';
import { NotificationsComponent } from './components/notifications.js?v=7.0';
import { SupportComponent } from './components/support.js?v=7.0';

class App {
  constructor() {
    this.currentUser = null;
    this.activeTab = 'dashboard';

    // Components initialized safely with try-catch
    const initComponent = (factory, name) => {
      try {
        return factory();
      } catch (err) {
        console.error(`[FinTrack] Lỗi khởi tạo phân hệ ${name}:`, err);
        return null;
      }
    };

    this.auth = initComponent(() => new AuthComponent(this), 'AuthComponent');
    this.dashboard = initComponent(() => new DashboardComponent(this), 'DashboardComponent');
    this.transactions = initComponent(() => new TransactionsComponent(this), 'TransactionsComponent');
    this.wallets = initComponent(() => new WalletsComponent(this), 'WalletsComponent');
    this.categories = initComponent(() => new CategoriesComponent(this), 'CategoriesComponent');
    this.budgets = initComponent(() => new BudgetsComponent(this), 'BudgetsComponent');
    this.savings = initComponent(() => new SavingsComponent(this), 'SavingsComponent');
    this.analytics = initComponent(() => new AnalyticsComponent(this), 'AnalyticsComponent');
    this.aiAssistant = initComponent(() => new AIAssistantComponent(this), 'AIAssistantComponent');
    this.badges = initComponent(() => new BadgesComponent(this), 'BadgesComponent');
    this.admin = initComponent(() => new AdminComponent(this), 'AdminComponent');
    this.subscription = initComponent(() => new SubscriptionComponent(this), 'SubscriptionComponent');
    this.notifications = initComponent(() => new NotificationsComponent(this), 'NotificationsComponent');
    this.support = initComponent(() => new SupportComponent(this), 'SupportComponent');

    // Global hook for admin, subscription, and support subroutines
    window.fintrackAdmin = this.admin;
    window.fintrackSubscription = this.subscription;
    window.fintrackNotifications = this.notifications;
    window.fintrackSupport = this.support;
    window.switchPortal = (portal) => this.switchPortal(portal);
  }

  switchPortal(portal) {
    if (portal === 'admin') {
      this.navigate('admin_dashboard');
    } else {
      this.navigate('dashboard');
    }
  }

  async init() {
    // 1. Configure Chart.js for Dark Theme safely
    try {
      if (window.Chart) {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
      }
    } catch (chartErr) {
      console.warn('[FinTrack] Lỗi cấu hình Chart.js:', chartErr);
    }

    // 2. Listen for unauthorized 401 & account locked 403 events
    try {
      window.addEventListener('fintrack:unauthorized', () => {
        this.currentUser = null;
        if (this.auth?.renderAuthModal) {
          this.auth.renderAuthModal(false);
        }
      });

      window.addEventListener('fintrack:account_locked', (e) => {
        this.currentUser = null;
        const msg = e.detail?.message || 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.';
        this.showToast(msg, 'error');
        if (this.auth?.renderAuthModal) {
          this.auth.renderAuthModal(false);
        }
      });
    } catch (eventErr) {
      console.warn('[FinTrack] Lỗi gắn listener auth events:', eventErr);
    }

    // 3. Bind UI navigation
    try {
      this.bindNavigation();
    } catch (navErr) {
      console.error('[FinTrack] Lỗi bindNavigation:', navErr);
    }

    // 4. Check token & session authentication
    let token = null;
    try {
      token = api.getToken();
    } catch (tokenErr) {
      console.warn('[FinTrack] Lỗi đọc token:', tokenErr);
    }

    if (!token) {
      try {
        if (this.auth?.renderAuthModal) {
          this.auth.renderAuthModal(false);
        }
      } catch (authErr) {
        console.error('[FinTrack] Lỗi hiển thị Auth Modal:', authErr);
      }
      return;
    }

    // 5. Fetch current user & start application
    try {
      this.currentUser = await api.getMe();
      if (!this.currentUser || this.currentUser.status === 'LOCKED' || this.currentUser.is_active === false) {
        api.setToken('');
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.currentUser = null;
        this.showToast('Tài khoản của bạn đã bị khóa do vi phạm chính sách hoặc theo yêu cầu quản trị viên.', 'error');
        if (this.auth?.renderAuthModal) {
          this.auth.renderAuthModal(false);
        }
        return;
      }
      this.initApp();
    } catch (e) {
      console.warn('[FinTrack] Session expired hoặc không thể xác thực tài khoản:', e);
      try {
        if (this.auth?.renderAuthModal) {
          this.auth.renderAuthModal(false);
        }
      } catch (authErr) {
        console.error('[FinTrack] Lỗi mở Auth Modal khi phiên hết hạn:', authErr);
      }
    }
  }

  initApp() {
    this._seenNotifIds = new Set();
    this._hasInitNotifs = false;

    try {
      this.renderUserProfileHeader();
    } catch (e) {
      console.error('[FinTrack] Header profile error:', e);
    }

    // Ưu tiên hiển thị Dashboard chính an toàn
    try {
      this.navigate('dashboard');
    } catch (e) {
      console.error('[FinTrack] Dashboard nav error:', e);
      try {
        const container = this.getMainContainer();
        if (container && this.dashboard?.render) {
          this.dashboard.render(container);
        }
      } catch (dashFallbackErr) {
        console.error('[FinTrack] Không thể render Dashboard fallback:', dashFallbackErr);
      }
    }

    try {
      this.bindNotificationDropdown();
    } catch (e) {
      console.error('[FinTrack] Notif dropdown error:', e);
    }

    try {
      this.updateNotificationBadge(false);
    } catch (e) {
      console.error('[FinTrack] Notif badge error:', e);
    }

    if (!this._notifInterval) {
      this._notifInterval = setInterval(() => {
        if (this.currentUser) {
          try {
            this.updateNotificationBadge(true);
          } catch (notifErr) {
            console.warn('[FinTrack] Periodic notification error:', notifErr);
          }
        }
      }, 15000);
    }
  }

  async updateNotificationBadge(isPolling = false) {
    if (!this.currentUser) return;
    try {
      const data = await api.getNotifications('all', 10);
      const unreadCount = data.unread_count || 0;
      const notifs = data.notifications || [];
      
      const headerBadge = document.getElementById('header-notification-badge');
      const sidebarBadge = document.getElementById('sidebar-notification-badge');
      const dropdownBadge = document.getElementById('dropdown-unread-badge');

      if (headerBadge) {
        if (unreadCount > 0) {
          headerBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
          headerBadge.classList.remove('hidden');
          headerBadge.classList.add('flex');
        } else {
          headerBadge.classList.add('hidden');
          headerBadge.classList.remove('flex');
        }
      }

      if (sidebarBadge) {
        if (unreadCount > 0) {
          sidebarBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
          sidebarBadge.classList.remove('hidden');
        } else {
          sidebarBadge.classList.add('hidden');
        }
      }

      if (dropdownBadge) {
        dropdownBadge.textContent = `${unreadCount} mới`;
      }

      // Check for newly arrived unread notifications during polling
      if (isPolling && this._hasInitNotifs) {
        const newUnreadNotifs = notifs.filter(n => !n.is_read && !this._seenNotifIds.has(n.id));
        for (const n of newUnreadNotifs) {
          this.showLiveAdminNotificationToast(n);
        }
      }

      // Track seen IDs
      notifs.forEach(n => {
        if (n.is_read) {
          this._seenNotifIds.add(n.id);
        }
      });
      if (!this._hasInitNotifs) {
        notifs.filter(n => !n.is_read).forEach(n => this._seenNotifIds.add(n.id));
        this._hasInitNotifs = true;
      }

    } catch (e) {
      console.warn('Failed to update notification badge:', e);
    }
  }

  showLiveAdminNotificationToast(notif) {
    this._seenNotifIds.add(notif.id);
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'glass-card p-4 rounded-2xl border border-pink-500/40 shadow-2xl shadow-pink-500/20 bg-slate-950/95 backdrop-blur-2xl flex items-start gap-3.5 max-w-sm cursor-pointer hover:border-pink-400 transition transform animate-in slide-in-from-top-4 duration-300';
    toast.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-base border border-pink-500/30 flex-shrink-0">
        <i class="fa-solid fa-bullhorn animate-bounce"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1 mb-0.5">
          <span class="text-[10px] font-black uppercase tracking-wider text-pink-400">🛡️ Thông Báo Từ Admin</span>
          <span class="text-[9px] text-slate-500 font-mono">Vừa xong</span>
        </div>
        <h4 class="text-xs font-bold text-slate-100 truncate">${notif.title}</h4>
        <p class="text-[11px] text-slate-300 line-clamp-2 mt-0.5">${notif.message}</p>
        <div class="flex items-center gap-2 mt-2">
          <button class="px-2.5 py-1 rounded-lg gradient-rose text-white text-[10px] font-bold shadow-sm">
            Xem ngay ➔
          </button>
        </div>
      </div>
    `;

    toast.addEventListener('click', async () => {
      try {
        await api.markNotificationAsRead(notif.id);
        this.updateNotificationBadge(false);
      } catch (e) {}
      if (notif.link_tab) {
        this.navigate(notif.link_tab);
      } else {
        this.navigate('notifications');
      }
      toast.remove();
    });

    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 8000);
  }

  bindNotificationDropdown() {
    if (this._notifDropdownBound) return;
    this._notifDropdownBound = true;

    const notifBtn = document.getElementById('header-notification-btn');
    const dropdown = document.getElementById('header-notif-dropdown');
    const markAllBtn = document.getElementById('btn-dropdown-mark-read');
    const viewAllBtn = document.getElementById('btn-dropdown-view-all');

    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown?.classList.contains('hidden');
      if (isHidden) {
        dropdown?.classList.remove('hidden');
        this.renderNotificationDropdown();
      } else {
        dropdown?.classList.add('hidden');
      }
    });

    markAllBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await api.markAllNotificationsAsRead();
        this.showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'success');
        this.updateNotificationBadge(false);
        this.renderNotificationDropdown();
        if (this.activeTab === 'notifications') {
          this.notifications.loadNotifications();
        }
      } catch (err) {
        this.showToast(err.message || 'Lỗi khi cập nhật', 'error');
      }
    });

    viewAllBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.add('hidden');
      this.navigate('notifications');
    });

    // Close when clicked outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#header-notif-wrapper')) {
        dropdown?.classList.add('hidden');
      }
    });
  }

  async renderNotificationDropdown() {
    const listEl = document.getElementById('dropdown-notif-list');
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="py-6 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-pink-400 mb-1 block"></i>
        Đang tải thông báo...
      </div>
    `;

    try {
      const data = await api.getNotifications('all', 6);
      const notifs = data.notifications || [];

      if (notifs.length === 0) {
        listEl.innerHTML = `
          <div class="py-8 text-center text-slate-500 text-xs">
            <i class="fa-regular fa-bell-slash text-xl mb-1.5 block text-slate-600"></i>
            Bạn chưa có thông báo nào từ Ban Quản Trị.
          </div>
        `;
        return;
      }

      const getDropdownTypeTheme = (type) => {
        if (type === 'BUDGET_ALERT' || type === 'WARNING') {
          return {
            iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
            icon: 'fa-triangle-exclamation',
            label: '🚨 Cảnh báo chi tiêu',
            labelColor: 'text-rose-400'
          };
        } else if (type === 'AI_ADVICE' || type === 'AI_INSIGHT' || type === 'AI') {
          return {
            iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            icon: 'fa-lightbulb',
            label: '💡 Lời khuyên AI',
            labelColor: 'text-amber-300'
          };
        } else if (type === 'PROMOTION') {
          return {
            iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            icon: 'fa-crown',
            label: '👑 Ưu đãi VIP',
            labelColor: 'text-amber-300'
          };
        } else if (type === 'SUCCESS') {
          return {
            iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
            icon: 'fa-circle-check',
            label: '✨ Thành tích',
            labelColor: 'text-emerald-400'
          };
        } else {
          return {
            iconBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
            icon: 'fa-bullhorn',
            label: '📢 Hệ thống',
            labelColor: 'text-indigo-300'
          };
        }
      };

      listEl.innerHTML = notifs.map(n => {
        const t = getDropdownTypeTheme(n.type);
        return `
        <div class="dropdown-notif-item p-3 hover:bg-slate-900/90 transition cursor-pointer flex items-start gap-3 ${!n.is_read ? 'bg-pink-950/20' : ''}" data-id="${n.id}" data-tab="${n.link_tab || ''}">
          <div class="w-8 h-8 rounded-xl ${t.iconBg} flex items-center justify-center text-xs flex-shrink-0">
            <i class="fa-solid ${t.icon}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="text-[9px] font-bold uppercase tracking-wider ${t.labelColor} font-mono">
                ${t.label}
              </span>
              <span class="text-[9px] text-slate-500 font-mono">${n.created_at_formatted}</span>
            </div>
            <h5 class="text-xs font-bold text-slate-100 truncate ${!n.is_read ? 'font-black text-pink-100' : ''}">${n.title}</h5>
            <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">${n.message}</p>
          </div>
          ${!n.is_read ? '<span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald mt-2 flex-shrink-0 animate-pulse"></span>' : ''}
        </div>
      `;
      }).join('');

      listEl.querySelectorAll('.dropdown-notif-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = parseInt(item.getAttribute('data-id'));
          const targetTab = item.getAttribute('data-tab');
          try {
            await api.markNotificationAsRead(id);
            this.updateNotificationBadge(false);
          } catch (e) {}

          const dropdown = document.getElementById('header-notif-dropdown');
          dropdown?.classList.add('hidden');

          if (targetTab) {
            this.navigate(targetTab);
          } else {
            this.navigate('notifications');
          }
        });
      });

    } catch (e) {
      listEl.innerHTML = `<div class="p-4 text-center text-rose-400 text-xs">Lỗi tải: ${e.message}</div>`;
    }
  }

  renderUserProfileHeader() {
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const avatarEl = document.getElementById('user-display-avatar');
    const planEl = document.getElementById('user-display-plan');
    const headerAdminBtn = document.getElementById('header-admin-portal-btn');
    const sidebarAdminSec = document.getElementById('admin-nav-section');

    if (this.currentUser) {
      if (nameEl) nameEl.textContent = this.currentUser.full_name;
      if (emailEl) emailEl.textContent = this.currentUser.email;
      if (avatarEl && this.currentUser.avatar_url) {
        avatarEl.src = this.currentUser.avatar_url;
      }

      // Render User Plan Badge with remaining days / expiration
      if (planEl) {
        const plan = (this.currentUser.plan || 'FREE').toUpperCase();
        const days = this.currentUser.days_remaining;
        const isExpiringSoon = days !== null && days !== undefined && days <= 5;

        if (plan === 'PLATINUM') {
          const daysText = days !== null && days !== undefined 
            ? (days === 0 ? '<span class="text-rose-400 font-bold">(Hết hạn)</span>' : `<span class="text-emerald-200">(${days > 0 ? `Còn ${days} ngày` : 'Hết hạn'})</span>`)
            : '';
          planEl.innerHTML = `<i class="fa-solid fa-gem text-[10px] text-emerald-300"></i> <span>PLATINUM VIP</span> ${daysText}`;
          planEl.title = `Gói FinTrack Platinum VIP ${this.currentUser.plan_expires_at ? `- Hạn dùng đến ${formatDateTimeVN(this.currentUser.plan_expires_at)}` : ''} (Nhấn để quản lý)`;
          planEl.className = `px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isExpiringSoon ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20'} border cursor-pointer hover:scale-105 transition inline-flex items-center gap-1.5`;
        } else if (plan === 'PREMIUM') {
          const daysText = days !== null && days !== undefined 
            ? (days === 0 ? '<span class="text-rose-400 font-bold">(Hết hạn)</span>' : `<span class="text-amber-200">(${days > 0 ? `Còn ${days} ngày` : 'Hết hạn'})</span>`)
            : '';
          planEl.innerHTML = `<i class="fa-solid fa-crown text-[10px] text-amber-400"></i> <span>PREMIUM</span> ${daysText}`;
          planEl.title = `Gói FinTrack Premium ${this.currentUser.plan_expires_at ? `- Hạn dùng đến ${formatDateTimeVN(this.currentUser.plan_expires_at)}` : ''} (Nhấn để quản lý)`;
          planEl.className = `px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isExpiringSoon ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/20'} border cursor-pointer hover:scale-105 transition inline-flex items-center gap-1.5`;
        } else if (plan === 'PRO') {
          const daysText = days !== null && days !== undefined 
            ? (days === 0 ? '<span class="text-rose-400 font-bold">(Hết hạn)</span>' : `<span class="text-purple-200">(${days > 0 ? `Còn ${days} ngày` : 'Hết hạn'})</span>`)
            : '';
          planEl.innerHTML = `<i class="fa-solid fa-bolt text-[10px] text-purple-300"></i> <span>VIP PRO</span> ${daysText}`;
          planEl.title = `Gói FinTrack VIP Pro ${this.currentUser.plan_expires_at ? `- Hạn dùng đến ${formatDateTimeVN(this.currentUser.plan_expires_at)}` : ''} (Nhấn để quản lý)`;
          planEl.className = `px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isExpiringSoon ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-md shadow-purple-500/20'} border cursor-pointer hover:scale-105 transition inline-flex items-center gap-1.5`;
        } else {
          planEl.innerHTML = `<i class="fa-solid fa-seedling text-[10px] text-emerald-400"></i> <span>FREE</span> <span class="text-[8px] text-slate-400 font-normal lowercase">(vĩnh viễn)</span>`;
          planEl.title = 'Gói Miễn Phí (Vĩnh viễn) - Nhấn để nâng cấp VIP';
          planEl.className = 'px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer hover:border-amber-500/50 hover:text-amber-300 transition inline-flex items-center gap-1.5';
        }

        planEl.onclick = () => this.navigate('subscription');
      }

      // Update Sidebar Subscription Menu Badge
      const subSidebarBtn = document.querySelector('.nav-btn[data-tab="subscription"]');
      if (subSidebarBtn) {
        const plan = (this.currentUser.plan_tier || this.currentUser.plan || 'FREE').toUpperCase();
        const subBadge = subSidebarBtn.querySelector('#sidebar-subscription-badge') || subSidebarBtn.querySelector('span:last-child');
        if (subBadge) {
          if (plan === 'PLATINUM') {
            subBadge.innerHTML = '💎 PLATINUM';
            subBadge.className = 'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 whitespace-nowrap';
          } else if (plan === 'PREMIUM' || plan === 'VIP') {
            subBadge.innerHTML = '👑 PREMIUM';
            subBadge.className = 'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap';
          } else if (plan === 'PRO') {
            subBadge.innerHTML = '⚡ PRO';
            subBadge.className = 'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 whitespace-nowrap';
          } else {
            subBadge.innerHTML = '👑 Nâng Cấp';
            subBadge.className = 'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap';
          }
        }
      }

      // Update Sidebar Footer Card with Live Subscription Status
      const sidebarUserFooter = document.getElementById('sidebar-user-footer');
      if (sidebarUserFooter) {
        const plan = (this.currentUser.plan || 'FREE').toUpperCase();
        const days = this.currentUser.days_remaining;
        const isExpiringSoon = days !== null && days !== undefined && days <= 5;
        const isPaid = plan === 'PRO' || plan === 'PREMIUM' || plan === 'PLATINUM';

        if (isPaid) {
          const isPlatinum = plan === 'PLATINUM';
          const isPremium = plan === 'PREMIUM';
          sidebarUserFooter.className = `p-3 rounded-2xl bg-slate-900/90 border ${isExpiringSoon ? 'border-rose-500/40 shadow-rose-500/10' : isPlatinum ? 'border-emerald-500/50 shadow-emerald-500/20' : isPremium ? 'border-amber-500/40 shadow-amber-500/10' : 'border-purple-500/40 shadow-purple-500/10'} shadow-lg text-xs space-y-1.5`;
          sidebarUserFooter.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-black text-[11px] flex items-center gap-1.5 ${isPlatinum ? 'text-emerald-300' : isPremium ? 'text-amber-300' : 'text-purple-300'}">
                <i class="fa-solid ${isPlatinum ? 'fa-gem' : isPremium ? 'fa-crown' : 'fa-bolt'} text-[10px]"></i>
                <span>${isPlatinum ? 'Platinum VIP' : isPremium ? 'FinTrack Premium' : 'FinTrack VIP Pro'}</span>
              </span>
              <span class="text-[9px] font-mono font-bold ${isExpiringSoon ? 'text-rose-400 animate-pulse' : isPlatinum ? 'text-emerald-300' : 'text-emerald-400'}">
                ${days !== null && days !== undefined ? (days > 0 ? `Còn ${days} ngày` : 'Đã hết hạn') : 'Đang hoạt động'}
              </span>
            </div>
            <p class="text-[10px] text-slate-400">
              ${this.currentUser.plan_expires_at ? `Hạn dùng: <b class="text-slate-300 font-mono">${formatDateVN(this.currentUser.plan_expires_at)}</b>` : 'Gói thành viên VIP'}
            </p>
            <button type="button" onclick="window.fintrackApp.navigate('subscription')" class="w-full py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition flex items-center justify-center gap-1 border border-slate-700 shadow-sm active:scale-95">
              <i class="fa-solid fa-clock-rotate-left text-[9px] ${isPlatinum ? 'text-emerald-300' : isPremium ? 'text-amber-400' : 'text-purple-300'}"></i>
              <span>${isExpiringSoon ? 'Gia hạn gói ngay' : 'Quản lý thời hạn'}</span>
            </button>
          `;
        } else {
          sidebarUserFooter.className = 'p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-lg text-xs space-y-1.5';
          sidebarUserFooter.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-[11px] text-slate-200">
                <i class="fa-solid fa-seedling text-emerald-400"></i>
                <span>Gói Miễn Phí</span>
              </div>
              <span class="text-[9px] text-slate-400 font-mono">Vĩnh viễn</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">
              Mở khóa AI không giới hạn & Cố vấn 50/30/20.
            </p>
            <button type="button" onclick="window.fintrackApp.navigate('subscription')" class="w-full py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition flex items-center justify-center gap-1">
              <i class="fa-solid fa-crown text-[9px]"></i>
              <span>Nâng Cấp VIP Ngay</span>
            </button>
          `;
        }
      }

      if (avatarEl) {
        avatarEl.onclick = () => this.navigate('subscription');
      }

      const role = (this.currentUser.role || '').toUpperCase();
      const isRootAdmin = role === 'ADMIN';
      const isModerator = role === 'MODERATOR';
      const hasAdminAccess = isRootAdmin || isModerator;

      if (headerAdminBtn) {
        if (hasAdminAccess) {
          headerAdminBtn.classList.remove('hidden');
          headerAdminBtn.classList.add('flex');
          const span = headerAdminBtn.querySelector('span:last-child');
          if (span) {
            span.textContent = isRootAdmin ? '🛡️ Admin Portal' : '🛡️ Quản Trị Viên Portal';
          }
        } else {
          headerAdminBtn.classList.remove('flex');
          headerAdminBtn.classList.add('hidden');
        }
      }
      if (sidebarAdminSec) {
        if (hasAdminAccess) {
          sidebarAdminSec.classList.remove('hidden');
          const title = document.getElementById('admin-portal-nav-text') || sidebarAdminSec.querySelector('#admin-portal-nav-text');
          const badge = document.getElementById('admin-portal-role-badge') || sidebarAdminSec.querySelector('#admin-portal-role-badge');
          if (title) title.textContent = isRootAdmin ? 'Vào Admin Portal' : 'Vào Quản Trị Viên Portal';
          if (badge) {
            badge.textContent = isRootAdmin ? 'Root' : 'Mod';
            badge.className = `text-[10px] font-black px-2 py-0.5 rounded-full ${isRootAdmin ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'} uppercase`;
          }
        } else {
          sidebarAdminSec.classList.add('hidden');
        }
      }
    }
  }

  bindNavigation() {
    // Mobile Sidebar Elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');

    const updateMenuIcon = (isOpen) => {
      const icon = mobileMenuBtn?.querySelector('i');
      if (icon) {
        if (isOpen) {
          icon.className = 'fa-solid fa-xmark text-lg text-emerald-400';
        } else {
          icon.className = 'fa-solid fa-bars text-lg';
        }
      }
    };

    const openMobileSidebar = () => {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (sidebarBackdrop) {
        sidebarBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
          sidebarBackdrop.classList.add('active');
        });
      }
      document.body.classList.add('overflow-hidden');
      updateMenuIcon(true);
    };

    const closeMobileSidebar = () => {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (sidebarBackdrop) {
        sidebarBackdrop.classList.remove('active');
        setTimeout(() => {
          if (!sidebar?.classList.contains('mobile-open')) {
            sidebarBackdrop.classList.add('hidden');
          }
        }, 300);
      }
      document.body.classList.remove('overflow-hidden');
      updateMenuIcon(false);
    };

    const toggleMobileSidebar = () => {
      if (sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    };

    this.openMobileSidebar = openMobileSidebar;
    this.closeMobileSidebar = closeMobileSidebar;
    this.toggleMobileSidebar = toggleMobileSidebar;

    mobileMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileSidebar();
    });

    closeSidebarBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileSidebar();
    });

    sidebarBackdrop?.addEventListener('click', () => {
      closeMobileSidebar();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    });

    // Single event listener for all navigation buttons & delegated clicks
    const handleNavClick = (btn, e) => {
      e?.preventDefault();
      e?.stopPropagation();
      const tab = btn.getAttribute('data-tab');
      if (tab) {
        this.navigate(tab);
        closeMobileSidebar();
      }
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => handleNavClick(btn, e));
    });

    // Document-level fallback delegation for any dynamic data-tab element
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-btn, .btn-goto-tab, [data-tab]');
      if (navBtn && !navBtn.classList.contains('filter-tab-btn') && !navBtn.classList.contains('tx-type-tab') && !navBtn.classList.contains('dash-period-pill')) {
        const tab = navBtn.getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          e.preventDefault();
          this.navigate(tab);
          closeMobileSidebar();
        }
      }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.auth.logout();
    });

    // Quick AI Button in header
    document.getElementById('header-quick-ai-btn')?.addEventListener('click', () => {
      this.openQuickAIModal();
    });

    // Admin Portal button in header
    document.getElementById('header-admin-portal-btn')?.addEventListener('click', () => {
      this.navigate('admin_dashboard');
    });

    // Exit Admin Portal buttons
    document.getElementById('header-exit-admin-btn')?.addEventListener('click', () => {
      this.navigate('dashboard');
    });
    document.getElementById('btn-sidebar-exit-admin')?.addEventListener('click', () => {
      this.navigate('dashboard');
    });
  }

  setUIMode(isAdmin) {
    const userNav = document.getElementById('sidebar-user-nav');
    const adminNav = document.getElementById('sidebar-admin-nav');
    const userFooter = document.getElementById('sidebar-user-footer');
    const adminFooter = document.getElementById('sidebar-admin-footer');
    const mobileSubtitle = document.getElementById('sidebar-mobile-subtitle');
    const headerAdminBtn = document.getElementById('header-admin-portal-btn');
    const headerExitBtn = document.getElementById('header-exit-admin-btn');
    const headerQuickAIBtn = document.getElementById('header-quick-ai-btn');
    const headerNotifBtn = document.getElementById('header-notification-btn');

    const role = (this.currentUser?.role || '').toUpperCase();
    const isRootAdmin = role === 'ADMIN';
    const isModerator = role === 'MODERATOR';
    const hasAdminAccess = isRootAdmin || isModerator;

    if (isAdmin && hasAdminAccess) {
      userNav?.classList.add('hidden');
      adminNav?.classList.remove('hidden');
      userFooter?.classList.add('hidden');
      adminFooter?.classList.remove('hidden');
      if (mobileSubtitle) mobileSubtitle.textContent = isRootAdmin ? 'Root Admin Console' : 'Moderator Console';

      // Update sidebar admin nav title
      const adminNavHeader = adminNav?.querySelector('div:first-child');
      if (adminNavHeader) {
        adminNavHeader.innerHTML = `
          <span class="text-[10px] font-black ${isRootAdmin ? 'text-rose-400' : 'text-purple-400'} uppercase tracking-widest block flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isRootAdmin ? 'bg-rose-400' : 'bg-purple-400'} animate-ping"></span> ${isRootAdmin ? 'CONTROL CENTER' : 'MODERATOR CONSOLE'}
          </span>
          <span class="text-[10px] text-slate-400 font-mono">${isRootAdmin ? 'Quản Trị Tối Cao' : 'Bảng Quản Trị Phụ'}</span>
        `;
      }

      // Filter sidebar menu items based on Moderator vs Root Admin
      const aiNavBtn = adminNav?.querySelector('[data-tab="admin_ai"]');
      const settingsNavBtn = adminNav?.querySelector('[data-tab="admin_settings"]');
      if (isModerator) {
        if (aiNavBtn) aiNavBtn.style.display = 'none';
        if (settingsNavBtn) settingsNavBtn.style.display = 'none';
      } else {
        if (aiNavBtn) aiNavBtn.style.display = '';
        if (settingsNavBtn) settingsNavBtn.style.display = '';
      }

      // Update sidebar admin footer card
      if (adminFooter) {
        if (isModerator) {
          adminFooter.className = 'p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/80 to-slate-900 border border-purple-500/30 text-xs space-y-2';
          const titleDiv = adminFooter.querySelector('div:first-child');
          if (titleDiv) {
            titleDiv.className = 'flex items-center gap-2 font-bold text-purple-300';
            titleDiv.innerHTML = '<i class="fa-solid fa-user-shield text-purple-400"></i><span>🛡️ Moderator Console</span>';
          }
        } else {
          adminFooter.className = 'p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/80 to-slate-900 border border-rose-500/30 text-xs space-y-2';
          const titleDiv = adminFooter.querySelector('div:first-child');
          if (titleDiv) {
            titleDiv.className = 'flex items-center gap-2 font-bold text-rose-300';
            titleDiv.innerHTML = '<i class="fa-solid fa-shield-halved text-amber-300"></i><span>Admin Cyber Console</span>';
          }
        }
      }

      headerAdminBtn?.classList.add('hidden');
      headerAdminBtn?.classList.remove('flex');
      headerQuickAIBtn?.classList.add('hidden');
      headerNotifBtn?.classList.add('hidden');
      headerExitBtn?.classList.remove('hidden');
      headerExitBtn?.classList.add('flex');
    } else {
      userNav?.classList.remove('hidden');
      adminNav?.classList.add('hidden');
      userFooter?.classList.remove('hidden');
      adminFooter?.classList.add('hidden');
      if (mobileSubtitle) mobileSubtitle.textContent = 'Menu Quản Lý';

      headerExitBtn?.classList.add('hidden');
      headerExitBtn?.classList.remove('flex');
      headerQuickAIBtn?.classList.remove('hidden');
      headerNotifBtn?.classList.remove('hidden');

      if (hasAdminAccess) {
        headerAdminBtn?.classList.remove('hidden');
        headerAdminBtn?.classList.add('flex');
      } else {
        headerAdminBtn?.classList.add('hidden');
        headerAdminBtn?.classList.remove('flex');
      }
    }
  }

  getMainContainer() {
    return document.getElementById('main-content-view') || 
           document.getElementById('main-content') || 
           document.getElementById('app-content') || 
           document.querySelector('main');
  }

  switchTab(tabName) {
    const cleanTab = (tabName || 'dashboard').replace(/^tab-/, '').replace(/^#/, '');
    if (cleanTab.startsWith('admin_') || cleanTab === 'admin') {
      return this.switchAdminTab(cleanTab);
    }
    return this.switchUserTab(cleanTab);
  }

  switchUserTab(targetTabId) {
    const cleanTab = (targetTabId || 'dashboard').replace(/^tab-/, '').replace(/^#/, '');

    // 1. Chỉ ẩn các tab của User nếu tồn tại trong DOM
    document.querySelectorAll('.user-tab-pane').forEach(pane => {
      pane.classList.add('hidden');
    });

    // 2. Bỏ active menu User
    document.querySelectorAll('.user-nav-item').forEach(item => {
      item.classList.remove('active', 'text-emerald-400', 'bg-emerald-950/30');
    });

    // 3. Hiện đúng tab được chọn nếu có element tĩnh
    const activePane = document.getElementById(cleanTab.startsWith('tab-') ? cleanTab : `tab-${cleanTab}`);
    if (activePane) {
      activePane.classList.remove('hidden');
    }

    // 4. Highlight menu tương ứng
    const activeNav = document.querySelector(`.user-nav-item[data-tab="${cleanTab}"], [data-tab="${cleanTab}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    return this.navigate(cleanTab);
  }

  switchAdminTab(targetTabId) {
    const cleanTab = (targetTabId || 'admin_dashboard').replace(/^tab-/, '').replace(/^#/, '');
    const finalTab = cleanTab.startsWith('admin_') || cleanTab === 'admin' ? cleanTab : `admin_${cleanTab}`;

    // Ẩn các admin pane nếu có
    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
      pane.classList.add('hidden');
    });

    // Highlight admin menu
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeNav = document.querySelector(`.admin-nav-item[data-tab="${finalTab}"], [data-tab="${finalTab}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    return this.navigate(finalTab);
  }

  navigateView(tabName) {
    return this.switchTab(tabName);
  }

  showSection(tabName) {
    return this.switchTab(tabName);
  }

  navigate(tabName) {
    if (this.closeMobileSidebar) {
      this.closeMobileSidebar();
    }
    const cleanTab = (tabName || 'dashboard').replace(/^tab-/, '').replace(/^#/, '');
    
    const role = (this.currentUser?.role || '').toUpperCase();
    const isRootAdmin = role === 'ADMIN';
    const isModerator = role === 'MODERATOR';
    const hasAdminAccess = isRootAdmin || isModerator;
    const isAdminTab = cleanTab.startsWith('admin_') || cleanTab === 'admin';

    // Access control checks
    if (isAdminTab) {
      if (!hasAdminAccess) {
        this.showToast('Bạn không có quyền truy cập vào khu vực quản trị!', 'error');
        return this.navigate('dashboard');
      }
      if (isModerator && (cleanTab === 'admin_ai' || cleanTab === 'admin_settings')) {
        this.showToast('Quyền hạn bị từ chối: Moderator không có quyền truy cập vào tab này!', 'warning');
        return this.navigate('admin_dashboard');
      }
    }

    this.activeTab = cleanTab;
    this.setUIMode(isAdminTab);

    // Update sidebar UI state
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const bTab = (btn.getAttribute('data-tab') || '').replace(/^tab-/, '');
      if (bTab === cleanTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const mainContainer = this.getMainContainer();
    if (!mainContainer) return;

    // Ensure main container is visible
    mainContainer.classList.remove('hidden');
    mainContainer.style.display = '';

    // Trigger tab enter animation
    mainContainer.classList.remove('tab-anim-enter');
    void mainContainer.offsetWidth;
    mainContainer.classList.add('tab-anim-enter');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      if (isAdminTab) {
        const specificAdminTab = cleanTab === 'admin' ? 'admin_dashboard' : cleanTab;
        const adminBody = document.getElementById('admin-view-body');
        const dynamicSubtabs = document.getElementById('admin-dynamic-subtabs');
        if (adminBody && dynamicSubtabs) {
          this.admin.switchTab(specificAdminTab);
        } else {
          this.admin.render(mainContainer, specificAdminTab);
        }
        return;
      }

      switch (cleanTab) {
        case 'dashboard':
          this.dashboard.render(mainContainer);
          break;
        case 'transactions':
          this.transactions.render(mainContainer);
          break;
        case 'wallets':
          this.wallets.render(mainContainer);
          break;
        case 'categories':
          this.categories.render(mainContainer);
          break;
        case 'budgets':
          this.budgets.render(mainContainer);
          break;
        case 'savings':
          this.savings.render(mainContainer);
          break;
        case 'analytics':
          this.analytics.render(mainContainer);
          break;
        case 'badges':
          this.badges.render(mainContainer);
          break;
        case 'ai_assistant':
          this.aiAssistant.render(mainContainer);
          break;
        case 'subscription':
          this.subscription.render(mainContainer);
          break;
        case 'notifications':
          this.notifications.render(mainContainer);
          break;
        case 'support':
          this.support.render(mainContainer);
          break;
        case 'settings':
          this.renderSettings(mainContainer);
          break;
        default:
          this.dashboard.render(mainContainer);
      }
    } catch (renderErr) {
      console.error(`[Navigation Error] Render failed for tab "${cleanTab}":`, renderErr);
      mainContainer.innerHTML = `
        <div class="py-16 text-center text-slate-400 glass-card rounded-3xl p-8 max-w-lg mx-auto space-y-4">
          <i class="fa-solid fa-triangle-exclamation text-3xl text-rose-500 block"></i>
          <h3 class="text-base font-bold text-slate-100">Không thể tải giao diện này</h3>
          <p class="text-xs text-slate-400">${renderErr.message || 'Đã có lỗi xảy ra khi hiển thị dữ liệu.'}</p>
          <button onclick="window.fintrackApp.navigate('${cleanTab}')" class="px-4 py-2 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition">
            <i class="fa-solid fa-rotate-right mr-1"></i> Thử lại ngay
          </button>
        </div>
      `;
    }

    this.updateNotificationBadge();
  }

  refreshCurrentView() {
    this.navigate(this.activeTab);
  }

  openQuickAIModal() {
    this.aiAssistant.openQuickParserModal();
  }

  openTransactionModal(editId = null) {
    this.transactions.openTransactionModal(editId);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-600 text-white shadow-emerald-500/30',
      error: 'bg-rose-600 text-white shadow-rose-500/30',
      warning: 'bg-amber-500 text-white shadow-amber-500/30',
      info: 'bg-slate-800 text-white shadow-slate-800/30'
    };

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast-msg flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 280);
    }, 3200);
  }

  renderSettings(container) {
    container.innerHTML = `
      <div id="tab-settings" class="user-tab-pane max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 class="text-2xl font-black text-slate-100 tracking-tight">Cài Đặt Tài Khoản & Bảo Mật</h1>
          <p class="text-slate-400 text-xs mt-0.5">Quản lý thông tin cá nhân và mật khẩu bảo vệ dữ liệu tài chính</p>
        </div>

        <!-- Profile card -->
        <div class="glass-card p-6 rounded-2xl space-y-4 border border-slate-800">
          <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <i class="fa-regular fa-user text-emerald-400"></i>
            Thông Tin Cá Nhân
          </h3>
          <form id="profile-form" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Họ và Tên</label>
              <input type="text" id="setting-fullname" value="${this.currentUser ? this.currentUser.full_name : ''}" required 
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email</label>
              <input type="email" value="${this.currentUser ? this.currentUser.email : ''}" disabled 
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 cursor-not-allowed font-mono" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Đơn vị tiền tệ</label>
              <select id="setting-currency" class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="VND" ${this.currentUser && this.currentUser.currency === 'VND' ? 'selected' : ''}>VND (Việt Nam Đồng - ₫)</option>
                <option value="USD" ${this.currentUser && this.currentUser.currency === 'USD' ? 'selected' : ''}>USD (US Dollar - $)</option>
              </select>
            </div>
            <button type="submit" class="px-5 py-2.5 rounded-xl gradient-emerald text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition">
              Lưu Thông Tin
            </button>
          </form>
        </div>

        <!-- Password card -->
        <div class="glass-card p-6 rounded-2xl space-y-4 border border-slate-800">
          <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <i class="fa-solid fa-key text-indigo-400"></i>
            Đổi Mật Khẩu
          </h3>
          <form id="password-form" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Mật khẩu hiện tại</label>
              <input type="password" id="old-pass" required placeholder="••••••••" 
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
              <input type="password" id="new-pass" required minlength="6" placeholder="••••••••" 
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
            </div>
            <button type="submit" class="px-5 py-2.5 rounded-xl gradient-indigo text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition">
              Đổi Mật Khẩu
            </button>
          </form>
        </div>

        <!-- Support & Feedback Center -->
        <div class="glass-card p-6 rounded-2xl space-y-4 border border-slate-800">
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-headset text-teal-400"></i>
              Trung Tâm Hỗ Trợ & Khiếu Nại Kỹ Thuật
            </h3>
            <button type="button" id="btn-open-user-ticket-modal" class="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/25 active:scale-95 transition flex items-center gap-1.5">
              <i class="fa-solid fa-plus"></i>
              <span>Gửi Yêu Cầu Hỗ Trợ</span>
            </button>
          </div>
          
          <div id="user-tickets-list-container">
            <div class="py-6 text-center text-slate-500 text-xs animate-pulse">
              Đang tải danh sách yêu cầu hỗ trợ của bạn...
            </div>
          </div>
        </div>

        <!-- Backup & Restore -->
        <div class="glass-card p-6 rounded-2xl space-y-3 border border-slate-800">
          <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <i class="fa-solid fa-database text-blue-400"></i>
            Sao Lưu Dữ Liệu
          </h3>
          <p class="text-xs text-slate-400">Tải về toàn bộ dữ liệu tài chính (Ví, Giao dịch, Ngân sách) dạng file JSON:</p>
          <a href="/api/v1/backup/export" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-sm border border-slate-700 active:scale-95 transition">
            <i class="fa-solid fa-download text-emerald-400"></i>
            <span>Tải File Sao Lưu JSON</span>
          </a>
        </div>

      </div>
    `;

    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const full_name = document.getElementById('setting-fullname').value.trim();
        const currency = document.getElementById('setting-currency').value;
        const res = await api.updateProfile({ full_name, currency });
        this.currentUser = res;
        this.renderUserProfileHeader();
        this.showToast('Cập nhật hồ sơ thành công!', 'success');
      } catch (err) {
        this.showToast(err.message || 'Lỗi cập nhật', 'error');
      }
    });

    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const old_password = document.getElementById('old-pass').value;
        const new_password = document.getElementById('new-pass').value;
        const res = await api.changePassword(old_password, new_password);
        this.showToast(res.message, 'success');
        document.getElementById('old-pass').value = '';
        document.getElementById('new-pass').value = '';
      } catch (err) {
        this.showToast(err.message || 'Lỗi đổi mật khẩu', 'error');
      }
    });

    // Support ticket modal & list loader
    document.getElementById('btn-open-user-ticket-modal')?.addEventListener('click', () => {
      this.openCreateTicketModal();
    });

    this.loadUserSupportTickets();
  }

  async loadUserSupportTickets() {
    const container = document.getElementById('user-tickets-list-container');
    if (!container) return;

    try {
      const tickets = await api.getMySupportTickets();
      if (!tickets || tickets.length === 0) {
        container.innerHTML = `
          <div class="py-6 text-center text-slate-500 text-xs">
            <i class="fa-regular fa-comments text-2xl text-slate-600 mb-1.5 block"></i>
            Bạn chưa có khiếu nại hoặc yêu cầu hỗ trợ nào.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="space-y-3">
          ${tickets.map(t => {
            const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
            const isOpen = t.status === 'OPEN';

            return `
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-teal-400">#${t.ticket_code}</span>
                    <span class="font-bold text-slate-100">${t.title}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isOpen ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                    ${isOpen ? '🔴 Đang chờ xử lý' : isResolved ? '🟢 Đã phản hồi' : '🟡 Đang xử lý'}
                  </span>
                </div>
                <p class="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">${t.message}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  <span>Phân loại: <b class="text-slate-400">${t.category}</b></span>
                  <span>${t.created_at}</span>
                </div>
                ${t.admin_reply ? `
                  <div class="mt-2 p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 space-y-1">
                    <div class="flex items-center justify-between text-[10px] text-teal-300 font-bold">
                      <span><i class="fa-solid fa-reply mr-1"></i> Phản hồi từ Ban Quản Trị:</span>
                      <span class="text-slate-400 font-mono">${t.replied_at || ''}</span>
                    </div>
                    <p class="text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">${t.admin_reply}</p>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="py-4 text-center text-slate-400 text-xs">
          Không thể tải danh sách khiếu nại: ${err.message || 'Lỗi kết nối'}.
        </div>
      `;
    }
  }

  openCreateTicketModal() {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-teal-500/30 animate-in fade-in zoom-in duration-200">
          <button id="user-ticket-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg border border-teal-500/30">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-100">Gửi Khiếu Nại / Hỗ Trợ Kỹ Thuật</h3>
              <p class="text-xs text-slate-400">Đội ngũ Quản trị viên sẽ phản hồi trực tiếp vào hòm thư</p>
            </div>
          </div>

          <form id="create-user-ticket-form" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Tiêu Đề Yêu Cầu</label>
              <input type="text" id="ticket-title" required placeholder="Ví dụ: Lỗi đồng bộ ví Open Banking, thắc mắc kích hoạt VIP..." 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Phân Loại</label>
                <select id="ticket-category" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500">
                  <option value="TECHNICAL">⚙️ Kỹ Thuật / Lỗi Ứng Dụng</option>
                  <option value="BILLING">💳 Nạp Tiền & Gói VIP</option>
                  <option value="ACCOUNT">👤 Tài Khoản & Bảo Mật</option>
                  <option value="FEATURE_REQUEST">💡 Đề Xuất Tính Năng Mới</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Mức Độ Ưu Tiên</label>
                <select id="ticket-priority" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500">
                  <option value="MEDIUM">🟡 Bình Thường (Medium)</option>
                  <option value="HIGH">🟠 Cao (High)</option>
                  <option value="URGENT">🔴 Khẩn Cấp (Urgent)</option>
                  <option value="LOW">🟢 Thấp (Low)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Nội Dung Chi Tiết</label>
              <textarea id="ticket-message" rows="4" required placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="user-ticket-modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">
                Hủy Bỏ
              </button>
              <button type="submit" class="px-5 py-2.5 rounded-xl gradient-emerald text-white font-bold shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Gửi Yêu Cầu Ngay</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('user-ticket-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('user-ticket-modal-cancel')?.addEventListener('click', closeModal);

    document.getElementById('create-user-ticket-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('ticket-title')?.value.trim();
      const category = document.getElementById('ticket-category')?.value;
      const priority = document.getElementById('ticket-priority')?.value;
      const message = document.getElementById('ticket-message')?.value.trim();

      if (!title || !message) return;

      try {
        const res = await api.createSupportTicket({ title, category, priority, message });
        this.showToast(res.message || 'Đã gửi yêu cầu hỗ trợ thành công! Quản trị viên sẽ xử lý sớm.', 'success');
        closeModal();
        await this.loadUserSupportTickets();
      } catch (err) {
        this.showToast(err.message || 'Lỗi khi gửi yêu cầu', 'error');
      }
    });
  }
}

// =========================================================================
// YOUTUBE SUBSCRIBE SPARKLE BURST & ELASTIC PILL BOUNCE ANIMATION UTILITY
// =========================================================================

/**
 * Kích hoạt hiệu ứng Co Giãn Đàn Hồi (Elastic Pill Bounce) và
 * Bắn Hạt Lấp Lánh Neon 360 độ (YouTube Subscribe Sparkle Burst).
 * 
 * @param {HTMLElement|Event|string} target - Phần tử button, click event hoặc selector
 * @param {Object} [options] - Tùy chỉnh (count, minRadius, maxRadius, colors)
 */
export function triggerSparkleBurst(target, options = {}) {
  let element = null;
  let clickX = null;
  let clickY = null;

  if (!target) return;

  if (target instanceof Event) {
    element = target.currentTarget || target.target?.closest?.('button, a, .btn-sparkle-burst, [data-sparkle-burst]');
    if (typeof target.clientX === 'number' && typeof target.clientY === 'number' && (target.clientX !== 0 || target.clientY !== 0)) {
      clickX = target.clientX;
      clickY = target.clientY;
    }
  } else if (typeof target === 'string') {
    element = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    element = target;
  }

  if (!element) return;

  // 1. Hiệu ứng Co giãn đàn hồi (Elastic Pill Bounce: 0.92 -> 1.04 -> 1.0)
  element.classList.remove('is-bouncing');
  void element.offsetWidth; // Trigger synchronous reflow để restart keyframes mượt mà
  element.classList.add('is-bouncing');

  const onAnimEnd = () => {
    element.classList.remove('is-bouncing');
    element.removeEventListener('animationend', onAnimEnd);
  };
  element.addEventListener('animationend', onAnimEnd, { once: true });

  // 2. Tôn trọng tùy chọn giảm chuyển động của hệ điều hành
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // 3. Tính toán tâm bắn tia lấp lánh (vị trí click chuột/chạm hoặc tâm button)
  const rect = element.getBoundingClientRect();
  const originX = (clickX !== null && clickX >= rect.left && clickX <= rect.right)
    ? clickX
    : rect.left + rect.width / 2;
  const originY = (clickY !== null && clickY >= rect.top && clickY <= rect.bottom)
    ? clickY
    : rect.top + rect.height / 2;

  // 4. Tạo container hạt lấp lánh (Fixed GPU Composited Layer)
  const container = document.createElement('div');
  container.className = 'sparkle-burst-container';
  container.style.left = `${originX}px`;
  container.style.top = `${originY}px`;
  document.body.appendChild(container);

  // 5. Sinh 8 - 12 hạt particle neon bắn tỏa tròn 360 độ
  const count = options.count || (Math.floor(Math.random() * 5) + 8); // 8 - 12 hạt
  const minRadius = options.minRadius || 30; // Bán kính từ 30px
  const maxRadius = options.maxRadius || 42; // đến ~40px

  // Bảng màu Neon đồng bộ FinTrack: Cyan, Emerald, Amber, Magenta
  const neonPalette = [
    { bg: '#00f2fe', glow: 'rgba(0, 242, 254, 0.9)' },   // Cyan Neon (#00f2fe / #06b6d4)
    { bg: '#00ffaa', glow: 'rgba(0, 255, 170, 0.9)' },   // Emerald Neon (#10b981 / #00ffaa)
    { bg: '#fbbf24', glow: 'rgba(251, 191, 36, 0.9)' },   // Amber Neon (#fbbf24 / #f59e0b)
    { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.9)' },  // Magenta Neon (#ec4899 / #f43f5e)
    { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.9)' },   // Cyan Bright
    { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.9)' }   // Emerald Bright
  ];

  const shapes = ['shape-circle', 'shape-diamond', 'shape-star'];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');

    // Phân bố đều góc 360 độ kèm jitter ngẫu nhiên tự nhiên
    const baseAngle = i * angleStep;
    const jitter = (Math.random() - 0.5) * (angleStep * 0.45);
    const angle = baseAngle + jitter;

    // Bán kính di chuyển từ 30px - 40px
    const distance = minRadius + Math.random() * (maxRadius - minRadius);
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    // Kích thước hạt từ 3px - 5px
    const size = Math.floor(Math.random() * 3) + 3; // 3px, 4px hoặc 5px
    const color = neonPalette[i % neonPalette.length];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const rot = Math.floor((Math.random() - 0.5) * 360);

    particle.className = `sparkle-particle ${shape}`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color.bg;
    particle.style.boxShadow = `0 0 6px ${color.bg}, 0 0 10px ${color.glow}`;
    particle.style.setProperty('--tx', `${tx.toFixed(1)}px`);
    particle.style.setProperty('--ty', `${ty.toFixed(1)}px`);
    particle.style.setProperty('--rot', `${rot}deg`);

    // Thời gian bay nhanh trong vòng ~0.45s - 0.52s
    const duration = 0.45 + Math.random() * 0.08;
    particle.style.animationDuration = `${duration.toFixed(2)}s`;

    container.appendChild(particle);
  }

  // 6. Tự hủy (clean up) DOM container sau khi hiệu ứng kết thúc (~0.58s)
  setTimeout(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 580);
}

// Instantiate and start app
try {
  window.fintrackApp = new App();
  window.triggerSparkleBurst = triggerSparkleBurst;
  window.navigate = (tab) => window.fintrackApp?.navigate(tab);
  window.switchTab = (tab) => window.fintrackApp?.switchTab(tab);
  window.switchUserTab = (tab) => window.fintrackApp?.switchUserTab(tab);
  window.switchAdminTab = (tab) => window.fintrackApp?.switchAdminTab(tab);
  window.navigateView = (tab) => window.fintrackApp?.navigateView(tab);
  window.showSection = (tab) => window.fintrackApp?.showSection(tab);
} catch (appInitErr) {
  console.error('[FinTrack] Lỗi nghiêm trọng khi khởi tạo App instance:', appInitErr);
}

// Lắng nghe sự kiện click toàn cục để kích hoạt hiệu ứng cho mọi phần tử có class .btn-sparkle-burst
document.addEventListener('click', (e) => {
  const sparkleBtn = e.target.closest('.btn-sparkle-burst, [data-sparkle-burst]');
  if (sparkleBtn) {
    triggerSparkleBurst(e);
  }
}, true);

const startApp = () => {
  try {
    if (window.fintrackApp && typeof window.fintrackApp.init === 'function') {
      window.fintrackApp.init().catch(err => {
        console.error('[FinTrack] Lỗi bất đồng bộ khi khởi chạy init():', err);
      });
    }
  } catch (err) {
    console.error('[FinTrack] Lỗi ngoại lệ khi startApp:', err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  // DOM is already ready (standard for ES modules)
  startApp();
}

