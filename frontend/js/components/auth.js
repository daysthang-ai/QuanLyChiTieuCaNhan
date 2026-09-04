import { api } from '../api.js';

// Định nghĩa toàn cục hàm đóng/mở Auth Modal
window.openAuthModal = function(mode) {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('hidden', 'pointer-events-none');
    modal.classList.add('flex', 'pointer-events-auto');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.style.setProperty('z-index', '999999', 'important');
    if (mode && typeof window.switchAuthMode === 'function') {
      window.switchAuthMode(mode);
    }
  } else {
    console.error("Lỗi: Không tìm thấy #auth-modal trong HTML!");
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('hidden', 'pointer-events-none');
    modal.classList.remove('flex', 'pointer-events-auto');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.setProperty('pointer-events', 'none', 'important');
  }
};

export class AuthComponent {
  constructor(app) {
    this.app = app;
    window.switchAuthMode = (mode = 'login') => this.renderAuthModal(mode);
    this.bindStaticModalEvents();
  }

  bindStaticModalEvents() {
    const form = document.getElementById('auth-form');
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener('submit', (e) => this.handleAuthSubmit(e, false));
    }
    const btnUser = document.getElementById('btn-demo-user');
    if (btnUser) {
      btnUser.onclick = () => {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        if (emailInput) emailInput.value = 'user@fintrack.ai';
        if (passwordInput) passwordInput.value = 'User@123456';
        this.app?.showToast?.('Đã điền thông tin Demo User. Hãy bấm Đăng Nhập để tiếp tục.', 'info');
      };
    }
    const btnAdmin = document.getElementById('btn-demo-admin');
    if (btnAdmin) {
      btnAdmin.onclick = () => {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        if (emailInput) emailInput.value = 'admin@fintrack.ai';
        if (passwordInput) passwordInput.value = 'Admin@123456';
        this.app?.showToast?.('Đã điền thông tin Demo Admin. Hãy bấm Đăng Nhập để tiếp tục.', 'info');
      };
    }
    const switchBtn = document.getElementById('switch-to-register');
    if (switchBtn) {
      switchBtn.onclick = () => this.renderAuthModal('register');
    }
  }

  closeAuthModal() {
    window.closeAuthModal();
  }

  renderAuthModal(mode = 'login') {
    const isRegister = (mode === true || mode === 'register');
    const modalEl = document.getElementById('auth-modal');
    if (!modalEl) return;

    // Gỡ bỏ mọi class ẩn và chặn tương tác
    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('flex', 'pointer-events-auto');

    // Ép hiển thị trực tiếp bằng inline style đè mọi CSS khác
    modalEl.style.setProperty('display', 'flex', 'important');
    modalEl.style.setProperty('opacity', '1', 'important');
    modalEl.style.setProperty('visibility', 'visible', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    modalEl.innerHTML = `
      <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100 mx-4" onclick="event.stopPropagation()">
        
        <!-- Close Button -->
        <button type="button" id="btn-close-auth-modal" onclick="window.closeAuthModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/50 cursor-pointer" title="Đóng">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>

        <!-- Decorative top glowing gradient bar -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400"></div>

        <!-- Header / Brand -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-pink-500 to-amber-400 p-[2px] shadow-xl shadow-pink-500/25 mb-3">
            <div class="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
              <i class="fa-solid fa-gem text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-yellow-200 text-2xl drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]"></i>
            </div>
          </div>
          <div class="flex items-center justify-center gap-1.5 leading-none mb-1">
            <span class="text-2xl font-black tracking-tight text-white font-sans">FinTrack</span>
            <span class="text-xs font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-sm shadow-pink-500/40 tracking-wider">AI</span>
          </div>
          <p class="text-slate-400 text-xs mt-1">
            ${isRegister ? 'Tạo tài khoản quản lý chi tiêu thông minh' : 'Hệ thống Quản lý Chi tiêu Cá nhân & Cố vấn AI'}
          </p>
        </div>

        <!-- Auth Form -->
        <form id="auth-form" class="space-y-4">
          ${isRegister ? `
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Họ và Tên</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <i class="fa-regular fa-user text-xs"></i>
                </span>
                <input type="text" id="auth-fullname" required placeholder="Nguyễn Văn A" 
                  class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" />
              </div>
            </div>
          ` : ''}

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <i class="fa-regular fa-envelope text-xs"></i>
              </span>
              <input type="email" id="auth-email" required placeholder="email@domain.com"
                class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-mono" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Mật khẩu</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <i class="fa-solid fa-lock text-xs"></i>
              </span>
              <input type="password" id="auth-password" required placeholder="••••••••"
                class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-mono" />
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="auth-submit-btn" 
            class="w-full py-3 px-4 rounded-xl gradient-emerald text-white font-bold text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-5 cursor-pointer">
            <span>${isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}</span>
            <i class="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </form>

        <!-- 2 Demo Account Helper Buttons (Fill Input Only) -->
        ${!isRegister ? `
          <div class="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
            <div class="text-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điền nhanh tài khoản mẫu:</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" id="btn-demo-user"
                class="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/50 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm group cursor-pointer">
                <i class="fa-solid fa-user text-emerald-400 group-hover:scale-110 transition"></i>
                <span>Demo User</span>
              </button>
              <button type="button" id="btn-demo-admin"
                class="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm group cursor-pointer">
                <i class="fa-solid fa-shield-halved text-rose-400 group-hover:scale-110 transition"></i>
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Switch to Register / Login -->
        <div class="mt-6 text-center text-xs text-slate-400">
          ${isRegister ? `
            Đã có tài khoản? <button type="button" id="switch-to-login" class="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer">Đăng nhập ngay</button>
          ` : `
            Chưa có tài khoản? <button type="button" id="switch-to-register" class="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer">Đăng ký mới</button>
          `}
        </div>

      </div>
    `;

    // Bind events
    document.getElementById('auth-form')?.addEventListener('submit', (e) => this.handleAuthSubmit(e, isRegister));
    
    // Bind Close Button & Backdrop Click
    document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
      this.closeAuthModal();
    });
    modalEl.onclick = (e) => {
      if (e.target === modalEl) {
        this.closeAuthModal();
      }
    };

    const switchBtn = document.getElementById(isRegister ? 'switch-to-login' : 'switch-to-register');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.renderAuthModal(isRegister ? 'login' : 'register'));
    }

    // Bind Demo Account Buttons: Điền thông tin vào ô input, người dùng tự ấn Đăng Nhập
    if (!isRegister) {
      document.getElementById('btn-demo-user')?.addEventListener('click', () => {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        if (emailInput) emailInput.value = 'user@fintrack.ai';
        if (passwordInput) passwordInput.value = 'User@123456';
        this.app?.showToast?.('Đã điền thông tin Demo User. Hãy bấm Đăng Nhập để tiếp tục.', 'info');
      });

      document.getElementById('btn-demo-admin')?.addEventListener('click', () => {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        if (emailInput) emailInput.value = 'admin@fintrack.ai';
        if (passwordInput) passwordInput.value = 'Admin@123456';
        this.app?.showToast?.('Đã điền thông tin Demo Admin. Hãy bấm Đăng Nhập để tiếp tục.', 'info');
      });
    }
  }

  async loginDirect(email, password) {
    // Purge old state and cache to prevent cross-account leakage
    api.setToken('');
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    sessionStorage.clear();
    this.app.currentUser = null;
    this.app._seenNotifIds = new Set();
    this.app._hasInitNotifs = false;

    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;

    const btn = document.getElementById('auth-submit-btn');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang đăng nhập demo...`;
    }

    try {
      const res = await api.login(email, password);
      api.setToken(res.access_token);
      this.app.currentUser = res.user;

      // Close modal
      this.closeAuthModal();
      this.app.showToast(`Chào mừng ${res.user.full_name}!`, 'success');
      this.app.enterDashboard();
      this.app.initApp();
    } catch (err) {
      this.app.showToast(err.message || 'Đăng nhập demo thất bại', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  async handleAuthSubmit(e, isRegister) {
    e.preventDefault();
    const btn = document.getElementById('auth-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...`;

    try {
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;

      // Purge old state
      api.setToken('');
      localStorage.removeItem('fintrack_token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      sessionStorage.clear();
      this.app.currentUser = null;
      this.app._seenNotifIds = new Set();
      this.app._hasInitNotifs = false;

      let res;
      if (isRegister) {
        const fullName = document.getElementById('auth-fullname').value.trim();
        res = await api.register({ email, password, full_name: fullName, currency: 'VND' });
      } else {
        res = await api.login(email, password);
      }

      if (!res.user || res.user.status === 'LOCKED' || res.user.is_active === false) {
        api.setToken('');
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        throw new Error('Tài khoản của bạn đã bị khóa do vi phạm chính sách hoặc theo yêu cầu quản trị viên. Vui lòng liên hệ hỗ trợ.');
      }

      api.setToken(res.access_token);
      this.app.currentUser = res.user;

      // Close modal
      this.closeAuthModal();
      this.app.showToast(`Chào mừng ${res.user.full_name}!`, 'success');
      this.app.enterDashboard();
      this.app.initApp();
    } catch (err) {
      this.app.showToast(err.message || 'Đăng nhập thất bại', 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  logout() {
    api.setToken('');
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    sessionStorage.clear();
    this.app.currentUser = null;
    this.app._seenNotifIds = new Set();
    this.app._hasInitNotifs = false;
    this.app.showToast('Đã đăng xuất tài khoản', 'info');
    this.app.showLandingPage();
  }
}
