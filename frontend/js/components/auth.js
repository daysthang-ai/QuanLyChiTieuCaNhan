import { api } from '../api.js';

export class AuthComponent {
  constructor(app) {
    this.app = app;
  }

  renderAuthModal(isRegister = false) {
    const modalEl = document.getElementById('auth-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
          
          <!-- Decorative top glowing gradient bar -->
          <div class="absolute top-0 left-0 right-0 h-1.5 gradient-emerald"></div>

          <!-- Header / Brand -->
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-emerald text-white text-2xl font-bold shadow-lg shadow-emerald-500/30 mb-3">
              <i class="fa-solid fa-gem text-amber-300 text-xl"></i>
            </div>
            <h2 class="text-2xl font-black text-slate-100 tracking-tight">FinTrack <span class="text-emerald-400">AI</span></h2>
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
              class="w-full py-3 px-4 rounded-xl gradient-emerald text-white font-bold text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-5">
              <span>${isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </form>

          <!-- 2 Demo Account Buttons (Admin & User) -->
          ${!isRegister ? `
            <div class="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
              <div class="text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoặc trải nghiệm nhanh:</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" id="btn-demo-user"
                  class="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/50 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm group">
                  <i class="fa-solid fa-user text-emerald-400 group-hover:scale-110 transition"></i>
                  <span>Demo User</span>
                </button>
                <button type="button" id="btn-demo-admin"
                  class="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm group">
                  <i class="fa-solid fa-shield-halved text-rose-400 group-hover:scale-110 transition"></i>
                  <span>Demo Admin</span>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Switch to Register / Login -->
          <div class="mt-6 text-center text-xs text-slate-400">
            ${isRegister ? `
              Đã có tài khoản? <button id="switch-to-login" class="text-emerald-400 font-bold hover:underline ml-1">Đăng nhập ngay</button>
            ` : `
              Chưa có tài khoản? <button id="switch-to-register" class="text-emerald-400 font-bold hover:underline ml-1">Đăng ký mới</button>
            `}
          </div>

        </div>
      </div>
    `;

    // Bind events
    document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuthSubmit(e, isRegister));
    
    const switchBtn = document.getElementById(isRegister ? 'switch-to-login' : 'switch-to-register');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.renderAuthModal(!isRegister));
    }

    // Bind Demo Account Buttons
    if (!isRegister) {
      document.getElementById('btn-demo-user')?.addEventListener('click', () => {
        this.loginDirect('user@fintrack.ai', 'User@123456');
      });

      document.getElementById('btn-demo-admin')?.addEventListener('click', () => {
        this.loginDirect('admin@fintrack.ai', 'Admin@123456');
      });
    }
  }

  async loginDirect(email, password) {
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
      document.getElementById('auth-modal').innerHTML = '';
      this.app.showToast(`Chào mừng ${res.user.full_name}!`, 'success');
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

      let res;
      if (isRegister) {
        const fullName = document.getElementById('auth-fullname').value.trim();
        res = await api.register({ email, password, full_name: fullName, currency: 'VND' });
      } else {
        res = await api.login(email, password);
      }

      api.setToken(res.access_token);
      this.app.currentUser = res.user;

      // Close modal
      document.getElementById('auth-modal').innerHTML = '';
      this.app.showToast(`Chào mừng ${res.user.full_name}!`, 'success');
      this.app.initApp();
    } catch (err) {
      this.app.showToast(err.message || 'Đăng nhập thất bại', 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  logout() {
    api.setToken('');
    this.app.currentUser = null;
    this.app.showToast('Đã đăng xuất tài khoản', 'info');
    this.renderAuthModal(false);
  }
}
