import { api } from '../api.js?v=20260904_01';
import { formatVND, formatDateVN } from '../utils/formatters.js?v=20260904_01';
import { getPlanTheme } from '../theme_mapping.js?v=20260906_01';

export class WalletsComponent {
  constructor(app) {
    this.app = app;
    this.wallets = [];
  }

  async render(container) {
    container.innerHTML = `
      <div id="view-wallets" data-tab-id="wallets" class="content-section user-tab-pane space-y-8 animate-in fade-in duration-300">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Ví & Quản Lý Dòng Tiền FinTrack</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                2-Scope Architecture
              </span>
            </h1>
            <p class="text-slate-400 text-xs mt-1">
              Phân hệ độc lập: <strong>Sổ Kế Toán Cá Nhân & AI (Tiền Ảo)</strong> và <strong>Cổng Nạp Dịch Vụ / VIP (Tiền Thật)</strong>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-open-transfer" type="button" onclick="window.openTransferModal()" class="btn-sparkle-burst px-4 py-2.5 rounded-xl gradient-indigo text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2 cursor-pointer relative z-20 pointer-events-auto">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
              <span>Chuyển Tiền Giữa Các Ví Ảo</span>
            </button>
            <button id="btn-add-wallet" type="button" onclick="window.openWalletModal()" class="btn-sparkle-burst px-4 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2 cursor-pointer relative z-20 pointer-events-auto">
              <i class="fa-solid fa-plus"></i>
              <span>+ Thêm Ví Ảo Mới</span>
            </button>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- KHU VỰC 2: 💳 VÍ TIỀN THẬT / NẠP MUA GÓI & DỊCH VỤ        -->
        <!-- ========================================================= -->
        <div id="real-wallet-section" class="space-y-3">
          <!-- Real Wallet Card Container rendered dynamically -->
          <div class="glass-card p-6 rounded-3xl animate-pulse h-40"></div>
        </div>

        <!-- ========================================================= -->
        <!-- KHU VỰC 1: 🎮 VÍ KẾ TOÁN CÁ NHÂN / TIỀN ẢO (SANDBOX)      -->
        <!-- ========================================================= -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800/60">
            <div>
              <h2 class="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>🎮 Ví Kế Toán Cá Nhân / Tiền Ảo</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FinTrack Sandbox Ledger
                </span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                Gồm Tiền mặt, Thẻ ngân hàng ảo, Ví điện tử, Sổ tiết kiệm. Mọi ghi chép thu chi thủ công và <strong>Nhập Nhanh AI</strong> chỉ tác động lên nhóm ví này.
              </p>
            </div>
            <span class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <i class="fa-solid fa-robot text-indigo-400"></i>
              <span>Đồng bộ 24/7 với Trợ Lý AI</span>
            </span>
          </div>

          <!-- Virtual Wallets Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="virtual-wallets-grid">
            <div class="glass-card p-6 rounded-2xl animate-pulse h-48"></div>
          </div>
        </div>

      </div>
    `;

    document.getElementById('btn-add-wallet')?.addEventListener('click', () => this.openWalletModal());
    document.getElementById('btn-open-transfer')?.addEventListener('click', () => this.openTransferModal());

    await this.loadWallets();
  }

  async loadWallets() {
    const realSection = document.getElementById('real-wallet-section');
    const virtualGrid = document.getElementById('virtual-wallets-grid');
    if (!realSection || !virtualGrid) return;

    try {
      this.wallets = await api.getWallets();
      
      const realWallet = this.wallets.find(w => w.wallet_scope === 'real') || {
        id: null,
        name: 'Ví Thanh Toán Dịch Vụ & VIP FinTrack',
        wallet_scope: 'real',
        balance: 0,
        currency: 'VND',
        account_number_masked: 'MB-0374617569'
      };

      const virtualWallets = this.wallets.filter(w => w.wallet_scope !== 'real');

      // -----------------------------------------------------------
      // 1. RENDER KHU VỰC 2: VÍ TIỀN THẬT / NẠP MUA GÓI & DỊCH VỤ
      // -----------------------------------------------------------
      const user = this.app.currentUser || {};
      const planTier = user.plan_tier || user.plan || 'Free';
      const daysRemaining = user.days_remaining !== undefined ? user.days_remaining : 0;
      const planTheme = getPlanTheme(planTier);

      realSection.innerHTML = `
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 shadow-2xl group transition-all duration-300">
          
          <!-- Cyber Ambient Background Glow -->
          <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition duration-500"></div>
          <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <!-- Left Info -->
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-lg font-black shadow-lg shadow-amber-500/30">
                  <i class="fa-solid fa-crown"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-widest text-amber-300">
                      💳 KHU VỰC 2: VÍ TIỀN THẬT / NẠP MUA GÓI & DỊCH VỤ
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Real Payment Wallet
                    </span>
                  </div>
                  <h3 class="text-lg font-black text-slate-100 tracking-tight mt-0.5">
                    ${realWallet.name}
                  </h3>
                </div>
              </div>

              <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
                Ví định danh tiền thật dùng để <strong>mua gói VIP / Premium, tính năng AI nâng cao và gia hạn hệ thống</strong>. 
                Số dư tiền thật được nạp trực tiếp qua cổng <strong>VietQR MB Bank Admin</strong> và chỉ bị trừ khi kích hoạt gói dịch vụ.
              </p>

              <div class="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-400">
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-building-columns text-amber-400"></i>
                  <span>MBBank: <strong class="text-slate-200 font-mono">****7569</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-user-shield text-amber-400"></i>
                  <span>Chủ TK: <strong class="text-slate-200">DANG QUYET THANG</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-id-card text-amber-400"></i>
                  <span id="real-wallet-current-plan">Gói hiện tại: <strong class="${planTheme.accentTextColor} font-sans font-bold">${planTheme.name} (${daysRemaining} ngày)</strong></span>
                </div>
              </div>
            </div>

            <!-- Right Balance & Action -->
            <div class="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex-shrink-0">
              <div class="text-left lg:text-right">
                <span class="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block">
                  Số Dư Tiền Thật Khả Dụng
                </span>
                <span class="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight block mt-0.5 drop-shadow-sm">
                  ${formatVND(realWallet.balance)}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button id="btn-real-deposit" type="button" onclick="window.openRealDepositModal()" class="px-4 py-2.5 rounded-xl gradient-amber text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer relative z-20 pointer-events-auto">
                  <i class="fa-solid fa-qrcode text-sm"></i>
                  <span>⚡ Nạp Tiền Thật (Quét VietQR MB)</span>
                </button>
                <button id="btn-goto-subscription" type="button" onclick="window.openSubscriptionModal()" class="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto">
                  <i class="fa-solid fa-crown text-amber-400"></i>
                  <span>Gói VIP</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      document.getElementById('btn-real-deposit')?.addEventListener('click', () => {
        this.openRealDepositModal(realWallet.id);
      });

      document.getElementById('btn-goto-subscription')?.addEventListener('click', () => {
        this.app.navigate('subscription');
      });

      // -----------------------------------------------------------
      // 2. RENDER KHU VỰC 1: VÍ KẾ TOÁN CÁ NHÂN / TIỀN ẢO (SANDBOX)
      // -----------------------------------------------------------
      if (virtualWallets.length === 0) {
        virtualGrid.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl">
            <i class="fa-solid fa-wallet text-3xl mb-2 block text-slate-300"></i>
            Bạn chưa có ví kế toán cá nhân nào. Hãy bấm "+ Thêm Ví Ảo Mới" để bắt đầu ghi chép dòng tiền.
          </div>
        `;
        return;
      }

      const typeLabels = {
        'CASH': 'Tiền mặt',
        'BANK': 'Thẻ Ngân hàng ảo',
        'EWALLET': 'Ví Điện tử',
        'SAVINGS': 'Sổ Tiết kiệm'
      };

      virtualGrid.innerHTML = virtualWallets.map(w => {
        const typeName = typeLabels[w.wallet_type] || w.wallet_type;

        return `
          <div class="wallet-card text-white p-6 shadow-xl relative flex flex-col justify-between h-56 group rounded-3xl overflow-hidden border border-white/10" 
            style="background: linear-gradient(135deg, ${w.color || '#3B82F6'} 0%, ${this.darkenColor(w.color || '#3B82F6', 30)} 100%)">
            
            <!-- Glow Accent -->
            <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

            <!-- Top info -->
            <div class="flex items-start justify-between relative z-10">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-white/70 block">${typeName}</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/15 text-emerald-200 border border-white/20 backdrop-blur-md">
                    Sandbox Ledger
                  </span>
                </div>
                <h3 class="text-lg font-black tracking-tight text-white mt-0.5 truncate max-w-[200px]">${w.name}</h3>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg text-white shadow-inner flex-shrink-0">
                <i class="fa-solid fa-${w.icon || 'wallet'}"></i>
              </div>
            </div>

            <!-- Card Number / Masked -->
            <div class="font-mono text-xs tracking-widest text-white/80 my-auto relative z-10 flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-[10px] text-white/60"></i>
              <span>${w.account_number_masked ? `•••• •••• •••• ${w.account_number_masked.slice(-4)}` : 'SỔ KẾ TOÁN ẢO'}</span>
            </div>

            <!-- Balance & Action buttons -->
            <div class="flex items-end justify-between pt-2.5 border-t border-white/15 relative z-10">
              <div>
                <span class="text-[10px] uppercase font-semibold text-white/70 block">Số dư kế toán</span>
                <span class="text-xl font-black tracking-tight text-white font-mono">${formatVND(w.balance)}</span>
              </div>
              <div class="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-all duration-200">
                <button onclick="window.depositVirtualWallet(${w.id})" class="px-2.5 py-1.5 rounded-xl bg-white/25 hover:bg-emerald-500 text-white text-[11px] font-black transition flex items-center gap-1 shadow-md backdrop-blur-md hover:scale-105 active:scale-95" title="Nạp thêm tiền ảo vào ví">
                  <i class="fa-solid fa-circle-plus text-[10px]"></i>
                  <span>+ Nạp Tiền</span>
                </button>
                <button onclick="window.editWallet(${w.id})" class="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition" title="Chỉnh sửa thông tin ví">
                  <i class="fa-regular fa-pen-to-square text-xs"></i>
                </button>
                <button onclick="window.deleteWallet(${w.id})" class="w-8 h-8 rounded-xl bg-white/20 hover:bg-rose-500 text-white flex items-center justify-center transition" title="Xóa ví">
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

          </div>
        `;
      }).join('');

      window.editWallet = (id) => this.openWalletModal(id);
      window.deleteWallet = (id) => this.handleDeleteWallet(id);
      window.depositVirtualWallet = (id) => this.openVirtualDepositModal(id);

    } catch (err) {
      console.error('Load wallets error:', err);
      this.app.showToast('Không thể tải danh sách ví', 'error');
    }
  }

  darkenColor(col, amt) {
    return col;
  }

  // -------------------------------------------------------------
  // 1. MODAL NẠP TIỀN VÀO VÍ ẢO (SANDBOX LEDGER - ĐƠN GIẢN HÓA)
  // -------------------------------------------------------------
  openVirtualDepositModal(walletId) {
    const targetWallet = this.wallets.find(w => w.id === walletId) || this.wallets[0];
    if (!targetWallet) {
      this.app.showToast('Không tìm thấy ví cần nạp', 'error');
      return;
    }

    const modalEl = document.getElementById('modal-deposit-wallet') || document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('pointer-events-auto');
    modalEl.style.setProperty('display', 'block', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    let selectedAmount = 500000;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-emerald-500/40 animate-in fade-in zoom-in duration-200">
          
          <!-- Background Cyber Glow -->
          <div class="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-800 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl gradient-emerald text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
                <i class="fa-solid fa-circle-plus"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-100">Nạp Tiền Vào Ví Ảo: ${targetWallet.name}</h3>
                <p class="text-xs text-slate-400">Sổ Kế Toán Sandbox • <span class="font-mono text-emerald-400 font-bold">${formatVND(targetWallet.balance)}</span></p>
              </div>
            </div>
            <button id="deposit-modal-close" class="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Notice banner -->
          <div class="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 relative z-10">
            <i class="fa-solid fa-shield-halved text-sm flex-shrink-0 text-emerald-400"></i>
            <span class="text-[11px] leading-snug">
              Số tiền nạp sẽ được cộng trực tiếp vào ví để bạn tự do ghi chép thu chi & quản lý tài chính cá nhân.
            </span>
          </div>

          <!-- Form -->
          <form id="virtual-deposit-form" class="mt-4 space-y-4 relative z-10">
            
            <!-- Amount Input & Quick Buttons -->
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Số Tiền Nạp (VNĐ) *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-emerald-400 font-bold text-base">₫</span>
                <input type="number" id="virtual-deposit-amount" required min="1000" step="1000" value="${selectedAmount}"
                  class="w-full pl-9 pr-3.5 py-3 text-lg font-black text-slate-100 font-mono rounded-2xl border border-slate-700 bg-slate-900/90 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <!-- Quick Selection Pills -->
              <div class="grid grid-cols-5 gap-1.5 mt-2">
                <button type="button" class="deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition active:scale-95" data-amount="100000">+100k</button>
                <button type="button" class="deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:border-emerald-500 transition active:scale-95" data-amount="200000">+200k</button>
                <button type="button" class="deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition active:scale-95" data-amount="500000">+500k</button>
                <button type="button" class="deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition active:scale-95" data-amount="1000000">+1tr</button>
                <button type="button" class="deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition active:scale-95" data-amount="5000000">+5tr</button>
              </div>
            </div>

            <!-- Ghi Chú Giao Dịch -->
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ghi Chú Nạp Tiền</label>
              <input type="text" id="virtual-deposit-note" value="Nạp tiền vào ví ${targetWallet.name}" placeholder="Ghi chú nạp tiền..."
                class="w-full px-3.5 py-2.5 text-xs text-slate-100 bg-slate-900/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <!-- Live Calculation Preview -->
            <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div class="flex justify-between text-slate-400">
                <span>Số dư hiện tại:</span>
                <span>${formatVND(targetWallet.balance)}</span>
              </div>
              <div class="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1.5">
                <span>Số dư dự kiến sau nạp:</span>
                <span class="text-emerald-400 font-black" id="virtual-deposit-projected">${formatVND(targetWallet.balance + selectedAmount)}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-3 pt-2">
              <button type="button" id="virtual-deposit-cancel" class="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                Hủy Bỏ
              </button>
              <button type="submit" id="virtual-deposit-submit" class="btn-sparkle-burst w-2/3 py-2.5 rounded-xl gradient-emerald text-white text-xs font-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-circle-check"></i>
                <span>Xác Nhận Nạp Tiền Ảo</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const close = () => {
      modalEl.innerHTML = '';
      modalEl.classList.add('hidden', 'pointer-events-none');
      modalEl.classList.remove('pointer-events-auto');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    };
    document.getElementById('deposit-modal-close')?.addEventListener('click', close);
    document.getElementById('virtual-deposit-cancel')?.addEventListener('click', close);

    const amountInput = document.getElementById('virtual-deposit-amount');
    const projEl = document.getElementById('virtual-deposit-projected');
    const submitBtn = document.getElementById('virtual-deposit-submit');

    const updateProjection = () => {
      const amt = parseFloat(amountInput.value || '0');
      if (projEl) projEl.textContent = formatVND(targetWallet.balance + amt);
    };

    amountInput?.addEventListener('input', updateProjection);

    modalEl.querySelectorAll('.deposit-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-amount') || '0');
        amountInput.value = val;
        modalEl.querySelectorAll('.deposit-quick-btn').forEach(b => {
          b.className = (parseFloat(b.getAttribute('data-amount')) === val)
            ? 'deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:border-emerald-500 transition active:scale-95'
            : 'deposit-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition active:scale-95';
        });
        updateProjection();
      });
    });

    document.getElementById('virtual-deposit-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) {
          this.app.showToast('Vui lòng nhập số tiền nạp hợp lệ (> 0 đ)', 'error');
          return;
        }

        const note = document.getElementById('virtual-deposit-note').value.trim();

        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang ghi sổ kế toán...`;
          submitBtn.disabled = true;
        }

        const res = await api.depositToWallet(targetWallet.id, amount, 'CASH', note);
        close();

        if (window.confetti) {
          window.confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
        }

        this.app.showToast(`Nạp thành công ${formatVND(amount)} vào ví ảo '${targetWallet.name}'!`, 'success');
        await this.loadWallets();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi nạp tiền vào ví', 'error');
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Xác Nhận Nạp Tiền Ảo`;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 2. MODAL NẠP TIỀN THẬT (QUÉT VIETQR MB BANK ADMIN & TỰ ĐỘNG 100%)
  // -------------------------------------------------------------
  async openRealDepositModal(walletId = null) {
    const realWallet = this.wallets.find(w => w.wallet_scope === 'real') || this.wallets[0];
    const modalEl = document.getElementById('modal-deposit-wallet') || document.getElementById('generic-modal');
    if (!modalEl || !realWallet) return;

    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('pointer-events-auto');
    modalEl.style.setProperty('display', 'block', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    let selectedAmount = 200000;
    let currentOrder = null;
    let pollInterval = null;
    let debounceTimer = null;
    let isProcessed = false;

    const close = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      modalEl.innerHTML = '';
      modalEl.classList.add('hidden', 'pointer-events-none');
      modalEl.classList.remove('pointer-events-auto');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    };

    // Initial render modal shell
    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-amber-500/50 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
          
          <!-- Cyber Ambient Background Glow -->
          <div class="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>

          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-800 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-lg font-black shadow-md shadow-amber-500/30">
                <i class="fa-solid fa-qrcode"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-100">Nạp Tiền Thật (Cổng Dịch Vụ & VIP)</h3>
                <p class="text-xs text-slate-400">Số dư hiện tại: <span class="font-mono text-amber-400 font-bold" id="modal-real-current-balance">${formatVND(realWallet.balance)}</span></p>
              </div>
            </div>
            <button id="real-deposit-close" class="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Live Webhook Listening Status Badge -->
          <div class="mt-3 py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px]">
            <span class="text-amber-300 font-bold flex items-center gap-1.5" id="modal-webhook-status-text">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Lắng nghe Webhook Ngân Hàng (Polling 3s)...
            </span>
            <span class="font-mono font-black text-amber-400">Tự Động 100%</span>
          </div>

          <!-- Form Body Container -->
          <div id="real-deposit-modal-body">
            <form id="real-deposit-form" class="mt-3 space-y-4 relative z-10">
              
              <!-- Amount Input & Quick Buttons -->
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Số Tiền Nạp (VNĐ) *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-400 font-bold text-base">₫</span>
                  <input type="number" id="deposit-amount-input" name="deposit-amount" required min="2000" step="1000" value="${selectedAmount}"
                    class="w-full pl-9 pr-3.5 py-3 text-lg font-black text-slate-100 font-mono rounded-2xl border border-slate-700 bg-slate-900/90 focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>

                <!-- Quick Selection Pills -->
                <div class="grid grid-cols-5 gap-1.5 mt-2">
                  <button type="button" class="real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition active:scale-95" data-amount="100000">+100k</button>
                  <button type="button" class="real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-amber-500 bg-amber-500/20 text-amber-300 hover:border-amber-500 transition active:scale-95" data-amount="200000">+200k</button>
                  <button type="button" class="real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition active:scale-95" data-amount="500000">+500k</button>
                  <button type="button" class="real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition active:scale-95" data-amount="1000000">+1tr</button>
                  <button type="button" class="real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition active:scale-95" data-amount="5000000">+5tr</button>
                </div>
              </div>

              <!-- Dynamic VietQR Container -->
              <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex flex-col items-center justify-center text-center space-y-3 relative" id="real-qr-card-box">
                
                <!-- Loading Indicator Overlay for QR Creation -->
                <div id="real-qr-loading-overlay" class="hidden absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-20 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <i class="fa-solid fa-spinner fa-spin text-amber-400 text-2xl"></i>
                  <span class="text-xs text-slate-300 font-bold">Đang sinh mã VietQR mới...</span>
                </div>

                <!-- Dynamic VietQR Code Image -->
                <div class="relative group">
                  <img id="real-vietqr-img" src="" alt="Mã VietQR Nạp Tiền" 
                    class="max-w-[190px] sm:max-w-[210px] min-h-[190px] mx-auto rounded-2xl shadow-xl border-2 border-amber-500/50 p-1.5 bg-white object-contain transition hover:scale-105" />
                  <div class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full gradient-amber text-[10px] font-black text-slate-950 shadow-md flex items-center gap-1">
                    <i class="fa-solid fa-qrcode text-[9px]"></i>
                    <span id="real-qr-bank-tag">VietQR Napas</span>
                  </div>
                </div>

                <!-- Transfer Info Table -->
                <div class="w-full text-xs space-y-2 font-mono bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-left">
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400 font-sans">Mã đơn nạp:</span>
                    <span class="font-bold text-amber-400" id="real-qr-order-code-text">ORD-...</span>
                  </div>

                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400 font-sans">Ngân hàng thụ hưởng:</span>
                    <span class="font-bold text-slate-100" id="real-qr-bank-name-text">MB Bank</span>
                  </div>

                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400 font-sans">Số tài khoản Admin:</span>
                    <button type="button" id="btn-copy-real-acc" class="font-bold text-cyan-400 flex items-center gap-1.5 hover:text-cyan-300 transition" title="Click để sao chép số tài khoản">
                      <span id="real-qr-acc-text">...</span>
                      <i class="fa-regular fa-copy text-[11px]"></i>
                    </button>
                  </div>

                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400 font-sans">Chủ tài khoản:</span>
                    <span class="font-bold text-amber-300" id="real-qr-acc-name-text">...</span>
                  </div>

                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400 font-sans">Số tiền nạp:</span>
                    <span class="font-black text-amber-400 text-sm" id="real-qr-amount-display">${formatVND(selectedAmount)}</span>
                  </div>

                  <div class="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5">
                    <span class="text-slate-400 font-sans">Nội dung CK (Bắt buộc):</span>
                    <button type="button" id="btn-copy-real-memo" class="font-black text-amber-400 flex items-center gap-1.5 hover:text-amber-300 transition" title="Click để sao chép nội dung">
                      <span id="real-qr-memo-text">FT NAP ...</span>
                      <i class="fa-regular fa-copy text-[11px]"></i>
                    </button>
                  </div>
                </div>

              </div>

              <!-- Action buttons with unified Demo Transfer Mode -->
              <div class="space-y-2.5 pt-1">
                <button type="button" id="btn-demo-transfer" class="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-amber-500/25 active:scale-95 text-xs sm:text-sm">
                  <i class="fa-solid fa-bolt"></i>
                  <span>Demo Chuyển Tiền (Giả Lập Nhận Tiền Tức Thì)</span>
                </button>
                <div class="flex items-center justify-between text-xs text-slate-400 px-1 pt-0.5">
                  <span class="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <i class="fa-solid fa-shield-halved"></i> SePay / VietQR Auto Sync
                  </span>
                  <button type="button" id="real-deposit-cancel" class="text-slate-400 hover:text-slate-200 underline text-xs font-medium transition">
                    Hủy bỏ
                  </button>
                </div>
              </div>

            </form>
          </div>

        </div>
      </div>
    `;

    document.getElementById('real-deposit-close')?.addEventListener('click', close);
    document.getElementById('real-deposit-cancel')?.addEventListener('click', close);

    const amountInput = document.getElementById('deposit-amount-input') || document.getElementById('real-deposit-amount');
    const qrImgEl = document.getElementById('real-vietqr-img');
    const qrAmountDisplay = document.getElementById('real-qr-amount-display');
    const qrLoadingOverlay = document.getElementById('real-qr-loading-overlay');
    const orderCodeText = document.getElementById('real-qr-order-code-text');
    const bankNameText = document.getElementById('real-qr-bank-name-text');
    const accNumText = document.getElementById('real-qr-acc-text');
    const accNameText = document.getElementById('real-qr-acc-name-text');
    const memoText = document.getElementById('real-qr-memo-text');
    const bankTag = document.getElementById('real-qr-bank-tag');

    // Function to generate and update deposit order dynamically
    const generateDepositOrder = async (amt) => {
      const sanitizedAmt = Math.max(2000, Math.round(parseFloat(amt) || 2000));
      selectedAmount = sanitizedAmt;
      if (qrAmountDisplay) qrAmountDisplay.textContent = formatVND(sanitizedAmt);
      if (qrLoadingOverlay) qrLoadingOverlay.classList.remove('hidden');

      try {
        const orderRes = await api.createDepositOrder(sanitizedAmt);
        if (orderRes && orderRes.order_code) {
          currentOrder = orderRes;

          if (qrImgEl) qrImgEl.src = orderRes.vietqr_url;
          if (orderCodeText) orderCodeText.textContent = orderRes.order_code;
          if (memoText) memoText.textContent = orderRes.transfer_memo;

          if (orderRes.bank_info) {
            if (bankNameText) bankNameText.textContent = orderRes.bank_info.bank_name;
            if (accNumText) accNumText.textContent = orderRes.bank_info.account_number;
            if (accNameText) accNameText.textContent = orderRes.bank_info.account_name;
            if (bankTag) bankTag.textContent = `VietQR ${orderRes.bank_info.bank_code}`;
          }
        }
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khởi tạo đơn nạp VietQR', 'error');
      } finally {
        if (qrLoadingOverlay) qrLoadingOverlay.classList.add('hidden');
      }
    };

    // Initialize first order immediately
    await generateDepositOrder(selectedAmount);

    // Debounce amount change on typing
    amountInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value || '0');
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (val >= 2000) {
          generateDepositOrder(val);
        }
      }, 400);
    });

    // Quick selection buttons
    modalEl.querySelectorAll('.real-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-amount') || '200000');
        if (amountInput) amountInput.value = val;
        modalEl.querySelectorAll('.real-quick-btn').forEach(b => {
          b.className = (parseFloat(b.getAttribute('data-amount')) === val)
            ? 'real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-amber-500 bg-amber-500/20 text-amber-300 hover:border-amber-500 transition active:scale-95'
            : 'real-quick-btn py-1.5 rounded-xl text-[11px] font-bold font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition active:scale-95';
        });
        generateDepositOrder(val);
      });
    });

    // Copy Account Number
    document.getElementById('btn-copy-real-acc')?.addEventListener('click', () => {
      const acc = accNumText?.textContent?.trim() || '0374617569';
      navigator.clipboard?.writeText(acc);
      this.app.showToast(`Đã sao chép STK Admin (${acc})!`, 'success');
    });

    // Copy Transfer Memo
    document.getElementById('btn-copy-real-memo')?.addEventListener('click', () => {
      const memo = memoText?.textContent?.trim() || (currentOrder?.transfer_memo || 'FT NAP');
      navigator.clipboard?.writeText(memo);
      this.app.showToast(`Đã sao chép nội dung CK: ${memo}`, 'success');
    });

    // Demo Transfer Button Event Handler (Unified Instant Receive)
    document.getElementById('btn-demo-transfer')?.addEventListener('click', async (e) => {
      if (!currentOrder?.order_code) return;
      const btn = e.currentTarget;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang giả lập chuyển tiền...`;
      btn.disabled = true;

      try {
        await api.mockMBReceive(currentOrder.order_code, selectedAmount, currentOrder.transfer_memo);
        this.app.showToast('✅ Đã nhận tiền thành công!', 'success');
        handleSuccessApproved();
      } catch (mockErr) {
        this.app.showToast(mockErr.message || 'Lỗi gửi tín hiệu giả lập', 'error');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });

    // Success transition handler
    const handleSuccessApproved = async () => {
      if (isProcessed) return;
      isProcessed = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      if (window.confetti) {
        window.confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      }

      // Refresh user data & wallet balances
      let updatedRealWallet = null;
      try {
        this.app.currentUser = await api.getMe();
        this.app.renderUserProfileHeader();
        await this.loadWallets();
        updatedRealWallet = this.wallets.find(w => w.wallet_scope === 'real') || realWallet;
      } catch (_) {}

      const bodyEl = document.getElementById('real-deposit-modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="py-8 px-4 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 animate-bounce">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <h3 class="text-xl font-black text-slate-100">Nạp Tiền Thành Công 100%!</h3>
              <p class="text-xs text-slate-400 mt-1">Giao dịch đã được hệ thống ghi nhận và đối soát tự động</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs font-mono space-y-1.5 text-left max-w-xs mx-auto">
              <div class="flex justify-between text-slate-400">
                <span>Mã đơn:</span>
                <span class="font-bold text-amber-400">${currentOrder?.order_code || 'ORD'}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Số tiền nạp:</span>
                <span class="font-bold text-emerald-400">+${formatVND(selectedAmount)}</span>
              </div>
              <div class="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                <span>Số dư mới:</span>
                <span class="font-black text-amber-300 font-mono text-sm">${formatVND(updatedRealWallet ? updatedRealWallet.balance : (realWallet.balance + selectedAmount))}</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-500">Cửa sổ sẽ tự động đóng sau giây lát...</p>
          </div>
        `;
      }

      this.app.showToast(`🎉 MB Bank ghi nhận tiền về! Đã tự động cộng +${formatVND(selectedAmount)} vào Ví Tiền Thật!`, 'success');

      if (this.app.updateNotificationBadge) {
        this.app.updateNotificationBadge(false);
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        close();
        const mainContainer = document.getElementById('main-content-view');
        if (mainContainer && this.render) {
          this.render(mainContainer);
        }
      }, 2000);
    };

    // Start 3-second Polling mechanism
    pollInterval = setInterval(async () => {
      if (isProcessed || !currentOrder?.order_code) return;
      try {
        const statusRes = await api.getDepositOrderStatus(currentOrder.order_code);
        const orderData = statusRes.order || statusRes;
        if (statusRes.status === 'APPROVED' || statusRes.is_approved || orderData.status === 'APPROVED') {
          handleSuccessApproved();
        }
      } catch (_) {}
    }, 3000);
  }

  // -------------------------------------------------------------
  // 3. MODAL CHỈNH SỬA VÍ ẢO (Edit Modal with Locked Balance)
  // -------------------------------------------------------------
  openWalletModal(editId = null) {
    const existing = editId ? this.wallets.find(w => w.id === editId) : null;
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('pointer-events-auto');
    modalEl.style.setProperty('display', 'block', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    const isAdmin = this.app.currentUser?.role === 'ADMIN';

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-base font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-credit-card text-emerald-400"></i>
              ${existing ? 'Chỉnh Sửa Thông Tin Ví Ảo' : 'Thêm Ví Kế Toán Ảo Mới'}
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <form id="wallet-form" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Tên Ví / Ngân Hàng Ảo *</label>
              <input type="text" id="wallet-name" required value="${existing ? existing.name : ''}" placeholder="VD: Techcombank ảo, MoMo chi tiêu, Tiền mặt" 
                class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Loại Tài Khoản</label>
                <select id="wallet-type" class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="BANK" ${existing && existing.wallet_type === 'BANK' ? 'selected' : ''}>Thẻ Ngân hàng ảo</option>
                  <option value="EWALLET" ${existing && existing.wallet_type === 'EWALLET' ? 'selected' : ''}>Ví Điện tử</option>
                  <option value="CASH" ${existing && existing.wallet_type === 'CASH' ? 'selected' : ''}>Tiền mặt</option>
                  <option value="SAVINGS" ${existing && existing.wallet_type === 'SAVINGS' ? 'selected' : ''}>Sổ Tiết kiệm</option>
                </select>
              </div>

              <div>
                <label class="flex items-center justify-between text-xs font-bold text-slate-300 uppercase mb-1">
                  <span>${existing ? 'Số Dư Khả Dụng' : 'Số Dư Khởi Tạo (VNĐ)'}</span>
                  ${existing && !isAdmin ? `
                    <span class="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                      <i class="fa-solid fa-lock text-[8px]"></i> Khóa
                    </span>
                  ` : ''}
                </label>

                ${existing ? (
                  isAdmin ? `
                    <input type="number" id="wallet-balance" required min="0" step="1000" 
                      value="${existing.balance}" 
                      class="w-full px-3 py-2 text-xs text-amber-300 bg-slate-800/90 rounded-xl border border-amber-500/50 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold font-mono" />
                    <p class="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><i class="fa-solid fa-shield-halved"></i> Quyền Admin: Điều chỉnh số dư</p>
                  ` : `
                    <input type="text" id="wallet-balance" readonly disabled 
                      value="${formatVND(existing.balance)}" 
                      class="w-full px-3 py-2 text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 font-bold font-mono select-none cursor-not-allowed" />
                    <p class="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                      <i class="fa-solid fa-circle-info"></i> Số dư thay đổi qua ghi chép thu chi hoặc nạp tiền
                    </p>
                  `
                ) : `
                  <input type="number" id="wallet-balance" required min="0" step="1000" 
                    value="0" placeholder="0"
                    class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold font-mono" />
                `}
              </div>
            </div>

            ${existing && !isAdmin ? `
              <div class="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div class="text-[11px] text-emerald-300">
                  <span class="font-bold block">Bạn muốn tăng số dư ví này?</span>
                  <span class="text-slate-400 text-[10px]">Tạo giao dịch nạp tiền ảo để đồng bộ dòng tiền</span>
                </div>
                <button type="button" id="modal-deposit-btn" class="px-3 py-1.5 rounded-xl gradient-emerald text-white text-[11px] font-bold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1 flex-shrink-0">
                  <i class="fa-solid fa-circle-plus"></i> + Nạp Tiền
                </button>
              </div>
            ` : ''}

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Số Tài Khoản (Nếu có)</label>
              <input type="text" id="wallet-acc-num" value="${existing ? existing.account_number_masked || '' : ''}" placeholder="VD: 1903888888 (Tự động che)" 
                class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Màu Thẻ</label>
                <input type="color" id="wallet-color" value="${existing ? existing.color : '#3B82F6'}" class="w-full h-9 rounded-xl border border-slate-700 bg-slate-800 cursor-pointer p-1" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Icon Đại Diện</label>
                <select id="wallet-icon" class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="building-columns">Ngân hàng (building-columns)</option>
                  <option value="mobile-screen">Ví điện tử (mobile-screen)</option>
                  <option value="money-bill-wave">Tiền mặt (money-bill-wave)</option>
                  <option value="piggy-bank">Sổ tiết kiệm (piggy-bank)</option>
                  <option value="credit-card">Thẻ tín dụng (credit-card)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Hủy</button>
              <button type="submit" id="wallet-submit-btn" class="px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
                ${existing ? 'Lưu Thay Đổi' : 'Tạo Ví Mới'}
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const close = () => {
      modalEl.innerHTML = '';
      modalEl.classList.add('hidden', 'pointer-events-none');
      modalEl.classList.remove('pointer-events-auto');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    };
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', close);

    document.getElementById('modal-deposit-btn')?.addEventListener('click', () => {
      close();
      if (existing) {
        this.openVirtualDepositModal(existing.id);
      }
    });

    document.getElementById('wallet-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('wallet-name').value.trim();
        const wallet_type = document.getElementById('wallet-type').value;
        const account_number_masked = document.getElementById('wallet-acc-num').value.trim();
        const color = document.getElementById('wallet-color').value;
        const icon = document.getElementById('wallet-icon').value;

        if (existing) {
          const payload = { name, wallet_type, account_number_masked, color, icon, wallet_scope: 'virtual' };
          if (isAdmin) {
            const balanceInput = document.getElementById('wallet-balance');
            if (balanceInput && balanceInput.value) {
              payload.balance = parseFloat(balanceInput.value);
            }
          }
          await api.updateWallet(existing.id, payload);
          this.app.showToast('Đã cập nhật thông tin ví ảo thành công!', 'success');
        } else {
          const balance = parseFloat(document.getElementById('wallet-balance').value || '0');
          const payload = { name, wallet_type, balance, account_number_masked, color, icon, wallet_scope: 'virtual' };
          await api.createWallet(payload);
          this.app.showToast('Đã thêm ví ảo mới vào sổ kế toán thành công!', 'success');
        }

        close();
        await this.loadWallets();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu ví', 'error');
      }
    });
  }

  // -------------------------------------------------------------
  // 4. MODAL CHUYỂN TIỀN NỘI BỘ GIỮA CÁC VÍ ẢO (Transfer Modal)
  // -------------------------------------------------------------
  openTransferModal() {
    const virtualWallets = this.wallets.filter(w => w.wallet_scope !== 'real');
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl || virtualWallets.length < 2) {
      this.app.showToast('Bạn cần ít nhất 2 ví ảo trong sổ kế toán để thực hiện chuyển tiền', 'info');
      return;
    }

    modalEl.classList.remove('hidden', 'pointer-events-none');
    modalEl.classList.add('pointer-events-auto');
    modalEl.style.setProperty('display', 'block', 'important');
    modalEl.style.setProperty('z-index', '999999', 'important');
    modalEl.style.setProperty('pointer-events', 'auto', 'important');

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-base font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-arrow-right-arrow-left text-indigo-400"></i>
              Chuyển Tiền Giữa Các Ví Ảo
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <form id="transfer-form" class="mt-4 space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Ví Nguồn (Trừ Tiền) *</label>
              <select id="transfer-from-wallet" class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                ${virtualWallets.map((w, idx) => `
                  <option value="${w.id}" ${idx === 0 ? 'selected' : ''}>${w.name} (Số dư: ${formatVND(w.balance)})</option>
                `).join('')}
              </select>
            </div>

            <div class="flex justify-center -my-1">
              <div class="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-xs border border-slate-700">
                <i class="fa-solid fa-arrow-down"></i>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Ví Đích (Cộng Tiền) *</label>
              <select id="transfer-to-wallet" class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                ${virtualWallets.map((w, idx) => `
                  <option value="${w.id}" ${idx === 1 ? 'selected' : ''}>${w.name} (Số dư: ${formatVND(w.balance)})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Số Tiền Chuyển (VNĐ) *</label>
              <input type="number" id="transfer-amount" required min="1000" step="1000" placeholder="Ví dụ: 500000"
                class="w-full px-3 py-2.5 text-sm font-bold text-slate-100 font-mono bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Ghi Chú</label>
              <input type="text" id="transfer-note" placeholder="VD: Nạp tiền chi tiêu MoMo" value="Chuyển tiền giữa các ví kế toán ảo"
                class="w-full px-3 py-2 text-xs text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Hủy</button>
              <button type="submit" id="transfer-submit-btn" class="px-5 py-2.5 rounded-xl gradient-indigo text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition">
                Thực Hiện Chuyển Tiền
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const close = () => {
      modalEl.innerHTML = '';
      modalEl.classList.add('hidden', 'pointer-events-none');
      modalEl.classList.remove('pointer-events-auto');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.style.setProperty('pointer-events', 'none', 'important');
    };
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', close);

    document.getElementById('transfer-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const from_wallet_id = parseInt(document.getElementById('transfer-from-wallet').value);
        const to_wallet_id = parseInt(document.getElementById('transfer-to-wallet').value);
        const amount = parseFloat(document.getElementById('transfer-amount').value);
        const note = document.getElementById('transfer-note').value.trim();

        const res = await api.transferFunds({ from_wallet_id, to_wallet_id, amount, note });
        this.app.showToast(res.message, 'success');
        close();
        await this.loadWallets();
      } catch (err) {
        this.app.showToast(err.message || 'Chuyển tiền thất bại', 'error');
      }
    });
  }

  async handleDeleteWallet(id) {
    if (!confirm('Bạn có chắc muốn xóa ví này khỏi sổ kế toán?')) return;
    try {
      const res = await api.deleteWallet(id);
      this.app.showToast(res.message, 'info');
      await this.loadWallets();
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi xóa ví', 'error');
    }
  }
}
