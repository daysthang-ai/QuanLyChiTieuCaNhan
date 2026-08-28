import { api } from '../api.js?v=5.5';
import { formatVND, formatDateVN, formatDateTimeVN, getGroupBadge } from '../utils/formatters.js?v=5.5';

export class TransactionsComponent {
  constructor(app) {
    this.app = app;
    this.currentFilters = {
      search: '',
      category_id: '',
      wallet_id: '',
      type: '',
      from_date: '',
      to_date: '',
      limit: 20,
      offset: 0
    };
    this.allCategories = [];
    this.allWallets = [];
  }

  async render(container) {
    container.innerHTML = `
      <div id="tab-transactions" class="user-tab-pane space-y-6 animate-in fade-in duration-300">
        
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight">Sổ Giao Dịch Thu - Chi</h1>
            <p class="text-slate-400 text-xs mt-0.5">Theo dõi chi tiết dòng tiền vào, dòng tiền ra và lịch sử chuyển khoản</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- 1-Click Export Buttons -->
            <button id="btn-tx-export-excel" class="px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 active:scale-95 transition flex items-center gap-1.5 border border-emerald-500/30">
              <i class="fa-solid fa-file-excel"></i>
              <span>Xuất Excel</span>
            </button>
            <button id="btn-tx-export-pdf" class="px-3.5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:shadow-rose-600/35 active:scale-95 transition flex items-center gap-1.5 border border-rose-500/30">
              <i class="fa-solid fa-file-pdf"></i>
              <span>Xuất PDF</span>
            </button>

            <!-- Primary Add Transaction Button -->
            <button id="btn-add-tx" class="px-4 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center gap-2">
              <i class="fa-solid fa-plus"></i>
              <span>Thêm Giao Dịch</span>
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="glass-card p-4 rounded-2xl space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            
            <!-- Search -->
            <div class="lg:col-span-2 relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input type="text" id="filter-search" placeholder="Tìm theo ghi chú..." 
                class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>

            <!-- Category Filter -->
            <div>
              <select id="filter-category" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                <option value="">-- Tất cả danh mục --</option>
              </select>
            </div>

            <!-- Wallet Filter -->
            <div>
              <select id="filter-wallet" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                <option value="">-- Tất cả ví --</option>
              </select>
            </div>

            <!-- Type Filter -->
            <div>
              <select id="filter-type" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                <option value="">-- Loại giao dịch --</option>
                <option value="EXPENSE">Chi tiêu (-)</option>
                <option value="INCOME">Thu nhập (+)</option>
                <option value="TRANSFER">Chuyển tiền (&harr;)</option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button id="btn-apply-filters" class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700">
                Lọc
              </button>
              <button id="btn-reset-filters" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs transition border border-slate-700" title="Đặt lại bộ lọc">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
          </div>

          <!-- Date range secondary row -->
          <div class="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
            <span class="font-bold text-slate-300">Khoảng thời gian:</span>
            <input type="date" id="filter-from-date" class="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs" />
            <span>đến</span>
            <input type="date" id="filter-to-date" class="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs" />

            <div class="ml-auto flex items-center gap-2">
              <span id="filtered-totals-badge" class="font-semibold text-slate-300">Đang tải...</span>
            </div>
          </div>
        </div>

        <!-- Transactions Table Card -->
        <div class="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th class="py-3 px-4">Thời Gian</th>
                  <th class="py-3 px-4 w-28 min-w-[100px] text-center">Loại</th>
                  <th class="py-3 px-4">Danh Mục</th>
                  <th class="py-3 px-4">Ghi Chú</th>
                  <th class="py-3 px-4">Ví Thanh Toán</th>
                  <th class="py-3 px-4 text-right font-bold">Số Tiền (VNĐ)</th>
                  <th class="py-3 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody id="transactions-table-body" class="divide-y divide-slate-800/60">
                <tr><td colspan="7" class="py-12 text-center text-slate-400">Đang tải danh sách giao dịch...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination / Empty State Footer -->
          <div class="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400" id="tx-pagination-container">
            <!-- Rendered dynamically -->
          </div>
        </div>

      </div>
    `;

    // Load initial metadata and transactions
    await this.initFilterOptions();
    await this.loadTransactions();

    // Event listeners
    document.getElementById('btn-add-tx')?.addEventListener('click', () => this.openTransactionModal());
    document.getElementById('btn-tx-export-excel')?.addEventListener('click', () => this.handleExport('excel'));
    document.getElementById('btn-tx-export-pdf')?.addEventListener('click', () => this.handleExport('pdf'));
    
    document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
      this.currentFilters.search = document.getElementById('filter-search').value.trim();
      this.currentFilters.category_id = document.getElementById('filter-category').value;
      this.currentFilters.wallet_id = document.getElementById('filter-wallet').value;
      this.currentFilters.type = document.getElementById('filter-type').value;
      this.currentFilters.from_date = document.getElementById('filter-from-date').value;
      this.currentFilters.to_date = document.getElementById('filter-to-date').value;
      this.currentFilters.offset = 0;
      this.loadTransactions();
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-wallet').value = '';
      document.getElementById('filter-type').value = '';
      document.getElementById('filter-from-date').value = '';
      document.getElementById('filter-to-date').value = '';
      this.currentFilters = {
        search: '',
        category_id: '',
        wallet_id: '',
        type: '',
        from_date: '',
        to_date: '',
        limit: 20,
        offset: 0
      };
      this.loadTransactions();
    });
  }

  async initFilterOptions() {
    try {
      const [cats, wallets] = await Promise.all([
        api.getCategories(),
        api.getWallets()
      ]);
      this.allCategories = cats;
      this.allWallets = wallets;

      const catSelect = document.getElementById('filter-category');
      if (catSelect) {
        catSelect.innerHTML = '<option value="">-- Tất cả danh mục --</option>';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.name} (${c.type === 'EXPENSE' ? 'Chi' : 'Thu'})`;
          catSelect.appendChild(opt);
        });
      }

      const walletSelect = document.getElementById('filter-wallet');
      if (walletSelect) {
        walletSelect.innerHTML = '<option value="">-- Tất cả ví --</option>';
        wallets.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = `${w.name} (${formatVND(w.balance)})`;
          walletSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Filter options error:', e);
    }
  }

  async loadTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    try {
      const txs = await api.getTransactions(this.currentFilters);

      let totInc = 0;
      let totExp = 0;
      txs.forEach(t => {
        if (t.type === 'INCOME') totInc += t.amount;
        else if (t.type === 'EXPENSE') totExp += t.amount;
      });
      const badge = document.getElementById('filtered-totals-badge');
      if (badge) {
        badge.innerHTML = `Tổng thu: <span class="text-emerald-400 font-bold font-mono">+${formatVND(totInc)}</span> | Tổng chi: <span class="text-rose-400 font-bold font-mono">-${formatVND(totExp)}</span>`;
      }

      if (txs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
              <i class="fa-solid fa-receipt text-3xl mb-2 text-slate-600 block"></i>
              Không tìm thấy giao dịch nào phù hợp với bộ lọc.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = txs.map(t => {
        const isIncome = t.type === 'INCOME';
        const isTransfer = t.type === 'TRANSFER';
        const typeBadge = isIncome 
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shadow-sm shadow-emerald-950/40">
              <i class="fa-solid fa-arrow-down text-[10px]"></i> Thu nhập
            </span>`
          : isTransfer
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 whitespace-nowrap shadow-sm shadow-cyan-950/40">
              <i class="fa-solid fa-right-left text-[10px]"></i> Chuyển ví
            </span>`
          : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap shadow-sm shadow-rose-950/40">
              <i class="fa-solid fa-arrow-up text-[10px]"></i> Chi tiêu
            </span>`;

        const sign = isIncome ? '+' : isTransfer ? '⮂' : '-';
        const amountColor = isIncome ? 'text-emerald-400' : isTransfer ? 'text-cyan-400' : 'text-rose-400';

        const catName = t.category ? t.category.name : isTransfer ? 'Chuyển nội bộ' : 'Chung';
        const rawCatIcon = t.category ? (t.category.icon || 'receipt') : 'arrow-right-arrow-left';
        const catIcon = rawCatIcon.replace(/^fa-solid\s+|^fa-regular\s+|^fa-brands\s+|^fa-/, '');
        const catColor = t.category ? (t.category.color || '#6366F1') : '#06B6D4';
        const walletName = t.wallet ? t.wallet.name : '';

        return `
          <tr class="hover:bg-slate-800/60 transition group">
            <td class="py-3 px-4 text-slate-400 font-medium whitespace-nowrap text-[11px]">
              ${formatDateTimeVN(t.transaction_date)}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">${typeBadge}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-white shadow-sm flex-shrink-0" style="background-color: ${catColor}">
                  <i class="fa-solid fa-${catIcon}"></i>
                </span>
                <span class="font-bold text-slate-200">${catName}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-slate-300">
              <div class="flex items-center gap-1.5">
                <span>${t.note || '-'}</span>
                ${t.receipt_url ? `
                  <button onclick="window.openReceipt('${t.receipt_url}')" class="text-emerald-400 hover:text-emerald-300 text-xs" title="Xem hóa đơn đính kèm">
                    <i class="fa-solid fa-paperclip"></i>
                  </button>
                ` : ''}
                ${t.created_by_ai === 'AI_PARSED' ? `<span class="text-[9px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"><i class="fa-solid fa-wand-magic-sparkles text-[8px]"></i> AI</span>` : ''}
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] border border-slate-700/60 font-medium">
                ${walletName || '-'}
              </span>
            </td>
            <td class="py-3 px-4 text-right font-black font-mono text-sm ${amountColor} whitespace-nowrap">
              ${sign} ${formatVND(t.amount)}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <div class="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                <button onclick="window.editTransaction(${t.id})" class="w-7 h-7 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition" title="Sửa">
                  <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button onclick="window.deleteTransaction(${t.id})" class="w-7 h-7 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 flex items-center justify-center transition" title="Xóa">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Setup global click handles
      window.editTransaction = (id) => this.openTransactionModal(id);
      window.deleteTransaction = (id) => this.handleDeleteTransaction(id);
      window.openReceipt = (url) => window.open(url, '_blank');

    } catch (e) {
      console.error('Load transactions error:', e);
      this.app.showToast('Không thể tải danh sách giao dịch', 'error');
    }
  }

  async handleExport(format) {
    try {
      this.app.showToast(`Đang tạo file báo cáo ${format.toUpperCase()}...`, 'info');
      let blob;
      let filename = `FinTrack_GiaoDich_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'excel') {
        blob = await api.downloadExcel();
        filename += '.xlsx';
      } else if (format === 'pdf') {
        blob = await api.downloadPDF();
        filename += '.pdf';
      }

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.app.showToast(`Tải file ${filename} thành công!`, 'success');
      }
    } catch (e) {
      console.error('Export error:', e);
      this.app.showToast(`Xuất file thất bại: ${e.message}`, 'error');
    }
  }

  async openTransactionModal(editId = null, defaultType = 'EXPENSE', defaultWalletId = null) {
    // Ensure categories and wallets are loaded
    if (!this.allCategories.length || !this.allWallets.length) {
      await this.initFilterOptions();
    }

    let existingTx = null;
    if (editId) {
      try {
        existingTx = await api.request(`/transactions/${editId}`);
      } catch (e) {
        this.app.showToast('Không tìm thấy giao dịch', 'error');
        return;
      }
    }

    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const virtualWallets = this.allWallets.filter(w => w.wallet_scope !== 'real');
    const targetWallets = virtualWallets.length > 0 ? virtualWallets : this.allWallets;

    const initialType = existingTx ? existingTx.type : (defaultType || 'EXPENSE');
    let selectedCategoryId = existingTx ? existingTx.category_id : (this.allCategories.find(c => c.type === initialType)?.id || '');
    let selectedWalletId = existingTx ? existingTx.wallet_id : (defaultWalletId ? parseInt(defaultWalletId) : (targetWallets[0]?.id || ''));
    let selectedFromWalletId = targetWallets[0]?.id || '';
    let selectedToWalletId = targetWallets[1]?.id || targetWallets[0]?.id || '';

    // Category presets data
    const expensePresets = [
      { name: 'Ăn uống', icon: 'utensils', emoji: '🍲', kw: 'Ăn uống' },
      { name: 'Cà phê', icon: 'mug-saucer', emoji: '☕', kw: 'Cà phê' },
      { name: 'Du lịch', icon: 'plane', emoji: '✈️', kw: 'Du lịch' },
      { name: 'Đi lại & Xăng', icon: 'car', emoji: '🚗', kw: 'Đi lại' },
      { name: 'Mua sắm', icon: 'bag-shopping', emoji: '🛍️', kw: 'Mua sắm' },
      { name: 'Nhà ở & Điện', icon: 'house', emoji: '🏠', kw: 'Nhà ở' },
      { name: 'Y tế & Sức khỏe', icon: 'heart-pulse', emoji: '💊', kw: 'Y tế' },
      { name: 'Học tập', icon: 'graduation-cap', emoji: '📚', kw: 'Giáo dục' },
      { name: 'Giải trí', icon: 'gamepad', emoji: '🎬', kw: 'Giải trí' },
      { name: 'Quà tặng', icon: 'gift', emoji: '🎁', kw: 'Quà tặng' },
      { name: 'Làm đẹp', icon: 'wand-magic-sparkles', emoji: '💆', kw: 'Làm đẹp' },
      { name: 'Tiết kiệm', icon: 'piggy-bank', emoji: '🎯', kw: 'Tiết kiệm' },
      { name: 'Quỹ khẩn cấp', icon: 'shield-heart', emoji: '🛡️', kw: 'khẩn cấp' },
      { name: 'Trả nợ', icon: 'money-bill-transfer', emoji: '💳', kw: 'Trả nợ' }
    ];

    const incomePresets = [
      { name: 'Tiền lương', icon: 'money-bill-wave', emoji: '💵', kw: 'Lương' },
      { name: 'Thưởng & Bonus', icon: 'award', emoji: '🏆', kw: 'Thưởng' },
      { name: 'Freelance & Phụ', icon: 'laptop-code', emoji: '💻', kw: 'Freelance' },
      { name: 'Đầu tư sinh lời', icon: 'chart-line', emoji: '📈', kw: 'Đầu tư' },
      { name: 'Lãi suất', icon: 'arrow-trend-up', emoji: '📊', kw: 'Lãi' },
      { name: 'Thu nhập khác', icon: 'wallet', emoji: '➕', kw: 'khác' }
    ];

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl p-5 sm:p-6 relative overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl gradient-emerald text-white flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
                <i class="fa-solid fa-${existingTx ? 'pen-to-square' : 'receipt'}"></i>
              </span>
              <div>
                <h3 class="text-base font-extrabold text-slate-100">
                  ${existingTx ? 'Chỉnh Sửa Giao Dịch' : (initialType === 'INCOME' ? 'Ghi Nhận Thu Nhập / Nạp Tiền' : 'Ghi Giao Dịch Mới')}
                </h3>
                <p class="text-[11px] text-slate-400">Điền thông tin giao dịch hoặc chọn nhanh từ danh mục & ví có sẵn</p>
              </div>
            </div>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Form scrollable body -->
          <form id="tx-modal-form" class="space-y-4 mt-3 overflow-y-auto pr-1 flex-1">
            
            <!-- Type Tabs -->
            <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button type="button" class="tx-type-tab py-2 text-xs font-extrabold rounded-xl transition ${initialType === 'EXPENSE' ? 'gradient-emerald text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}" data-type="EXPENSE">
                💸 Chi Tiêu
              </button>
              <button type="button" class="tx-type-tab py-2 text-xs font-extrabold rounded-xl transition ${initialType === 'INCOME' ? 'gradient-emerald text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}" data-type="INCOME">
                💵 Thu Nhập
              </button>
              <button type="button" class="tx-type-tab py-2 text-xs font-extrabold rounded-xl transition ${initialType === 'TRANSFER' ? 'gradient-emerald text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}" data-type="TRANSFER">
                🔄 Chuyển Tiền
              </button>
            </div>
            <input type="hidden" id="tx-type-input" value="${initialType}" />

            <!-- Amount & Date -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Số Tiền (VNĐ) *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400 font-bold text-sm">₫</span>
                  <input type="number" step="1000" id="tx-amount" required placeholder="50.000" value="${existingTx ? existingTx.amount : ''}"
                    class="w-full pl-8 pr-3 py-2.5 text-base font-black text-slate-100 font-mono rounded-xl border border-slate-700 bg-slate-800/90 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Thời Gian Giao Dịch *</label>
                <input type="datetime-local" id="tx-date" required
                  class="w-full px-3 py-2.5 text-xs text-slate-100 font-semibold rounded-xl border border-slate-700 bg-slate-800/90 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </div>

            <!-- Standard Transaction: CATEGORY SELECTION -->
            <div id="standard-category-section" class="space-y-2 ${initialType === 'TRANSFER' ? 'hidden' : ''}">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <i class="fa-solid fa-tags text-emerald-400 mr-1"></i> Danh Mục Thu / Chi *
                </label>
                <span class="text-[11px] text-slate-400">Chọn mẫu nhanh hoặc chọn từ danh sách</span>
              </div>

              <!-- Quick Preset Category Chips -->
              <div id="quick-cat-chips-container" class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <!-- Dynamically populated chips -->
              </div>

              <!-- Dropdown Select Category & Custom Category Input -->
              <div class="pt-1 space-y-2">
                <select id="tx-category" class="w-full px-3 py-2 text-xs text-slate-200 rounded-xl border border-slate-700 bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium">
                  <!-- Populated dynamically -->
                </select>

                <!-- Custom Category Text Input -->
                <div>
                  <div class="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                    <i class="fa-solid fa-pen-nib text-amber-400"></i>
                    <span>Hoặc nhập danh mục mới (nếu chưa có trong list):</span>
                  </div>
                  <input type="text" id="tx-custom-category-input" placeholder="Ví dụ: Du lịch Phú Quốc, Nuôi thú cưng, Sửa xe, Tiêu vặt..." 
                    class="w-full px-3 py-2 text-xs text-slate-100 rounded-xl border border-slate-700 bg-slate-950/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none placeholder:text-slate-500" />
                </div>
              </div>
            </div>

            <!-- Standard Transaction: WALLET SELECTION -->
            <div id="standard-wallet-section" class="space-y-2 ${initialType === 'TRANSFER' ? 'hidden' : ''}">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <i class="fa-solid fa-wallet text-indigo-400 mr-1"></i> Ví Thanh Toán Hiện Có *
                </label>
                <span class="text-[11px] text-slate-400">Click chọn ví bạn dùng</span>
              </div>

              <!-- Visual Wallet Grid -->
              <div id="wallet-cards-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <!-- Dynamically populated wallet cards -->
              </div>
              <input type="hidden" id="tx-wallet-selected-id" value="${selectedWalletId}" />

              <!-- Fallback select -->
              <select id="tx-wallet" class="hidden">
                ${targetWallets.map(w => `<option value="${w.id}" ${w.id === selectedWalletId ? 'selected' : ''}>${w.name}</option>`).join('')}
              </select>
            </div>

            <!-- Transfer Specific Fields -->
            <div id="transfer-tx-fields" class="space-y-3 ${initialType === 'TRANSFER' ? '' : 'hidden'}">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  <i class="fa-solid fa-arrow-up-from-bracket text-rose-400 mr-1"></i> Ví Nguồn (Trừ Tiền) *
                </label>
                <div id="transfer-from-wallet-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <!-- Rendered dynamically -->
                </div>
                <input type="hidden" id="tx-from-wallet" value="${selectedFromWalletId}" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  <i class="fa-solid fa-arrow-down-to-bracket text-emerald-400 mr-1"></i> Ví Đích (Nhận Tiền) *
                </label>
                <div id="transfer-to-wallet-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <!-- Rendered dynamically -->
                </div>
                <input type="hidden" id="tx-to-wallet" value="${selectedToWalletId}" />
              </div>
            </div>

            <!-- Note -->
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ghi Chú Giao Dịch</label>
              <input type="text" id="tx-note" placeholder="Ví dụ: Ăn trưa bún bò, Mua cà phê Highland, Đi du lịch Đà Nẵng..." value="${existingTx?.note || ''}"
                class="w-full px-3.5 py-2.5 text-xs text-slate-100 rounded-xl border border-slate-700 bg-slate-800/90 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <!-- Receipt Bill Upload -->
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Đính Kèm Hóa Đơn / Ảnh Bill (Tùy chọn)</label>
              <input type="file" id="tx-receipt-file" accept="image/*,.pdf"
                class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" />
            </div>

            <!-- Modal Footer Buttons -->
            <div class="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800 flex-shrink-0">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
                Hủy
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl gradient-emerald text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5">
                <i class="fa-solid fa-check"></i>
                <span>${existingTx ? 'Cập Nhật Giao Dịch' : 'Lưu Giao Dịch Ngay'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    // Helper: populate category dropdown and chips based on active type
    const updateCategoriesUI = (activeType, preselectedId = null) => {
      const catSelect = document.getElementById('tx-category');
      const chipsContainer = document.getElementById('quick-cat-chips-container');
      if (!catSelect || !chipsContainer) return;

      const filteredCats = this.allCategories.filter(c => c.type === activeType);
      
      // Populate select
      catSelect.innerHTML = filteredCats.map(c => `
        <option value="${c.id}" ${c.id === (preselectedId || selectedCategoryId) ? 'selected' : ''}>
          ${c.name} (${c.group === 'NEEDS' ? 'Thiết yếu' : c.group === 'WANTS' ? 'Mong muốn' : c.group === 'SAVINGS' ? 'Tiết kiệm' : 'Thu nhập'})
        </option>
      `).join('');

      if (filteredCats.length > 0 && !preselectedId) {
        selectedCategoryId = filteredCats[0].id;
      }

      // Populate preset chips
      const presets = activeType === 'EXPENSE' ? expensePresets : incomePresets;
      chipsContainer.innerHTML = presets.map(p => {
        // Find matching category in DB
        const matchedCat = filteredCats.find(c => c.name.toLowerCase().includes(p.kw.toLowerCase()));
        const catId = matchedCat ? matchedCat.id : (filteredCats[0]?.id || '');
        const isCurrentSelected = catId === selectedCategoryId;

        return `
          <button type="button" class="quick-cat-chip px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${isCurrentSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'}"
            data-cat-id="${catId}" data-cat-name="${p.name}">
            <span>${p.emoji}</span>
            <span>${p.name}</span>
          </button>
        `;
      }).join('');

      // Chip click events
      document.querySelectorAll('.quick-cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const targetId = parseInt(chip.getAttribute('data-cat-id'));
          const catName = chip.getAttribute('data-cat-name');
          selectedCategoryId = targetId;
          catSelect.value = targetId;

          document.querySelectorAll('.quick-cat-chip').forEach(c => {
            if (c === chip) {
              c.className = 'quick-cat-chip px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm';
            } else {
              c.className = 'quick-cat-chip px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60';
            }
          });

          // Autofill note if currently blank
          const noteInput = document.getElementById('tx-note');
          if (noteInput && !noteInput.value.trim()) {
            noteInput.value = catName;
          }
        });
      });
    };

    // Helper: render visual wallet list cards
    const renderWalletCards = () => {
      const grid = document.getElementById('wallet-cards-grid');
      if (!grid) return;

      grid.innerHTML = targetWallets.map(w => {
        const isSelected = w.id === selectedWalletId;
        const icon = w.icon || 'wallet';
        const color = w.color || '#3B82F6';

        return `
          <div class="wallet-select-card p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isSelected ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' : 'border-slate-700/70 bg-slate-800/70 hover:border-slate-600 hover:bg-slate-800'}"
            data-wallet-id="${w.id}">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white flex-shrink-0 shadow-sm" style="background-color: ${color}">
                <i class="fa-solid fa-${icon}"></i>
              </div>
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-100 block truncate">${w.name}</span>
                <span class="text-[11px] font-mono text-emerald-400 font-semibold block truncate">${formatVND(w.balance)}</span>
              </div>
            </div>
            <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-transparent'}">
              <i class="fa-solid fa-check text-[9px]"></i>
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.wallet-select-card').forEach(card => {
        card.addEventListener('click', () => {
          selectedWalletId = parseInt(card.getAttribute('data-wallet-id'));
          document.getElementById('tx-wallet-selected-id').value = selectedWalletId;
          document.getElementById('tx-wallet').value = selectedWalletId;
          renderWalletCards();
        });
      });
    };

    // Helper: render transfer wallets
    const renderTransferWalletGrids = () => {
      const fromGrid = document.getElementById('transfer-from-wallet-grid');
      const toGrid = document.getElementById('transfer-to-wallet-grid');
      if (!fromGrid || !toGrid) return;

      const renderGridItems = (container, selectedId, callback) => {
        container.innerHTML = targetWallets.map(w => {
          const isSel = w.id === selectedId;
          return `
            <div class="p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${isSel ? 'border-indigo-500 bg-indigo-500/10 shadow-sm' : 'border-slate-700 bg-slate-800/70 hover:bg-slate-800'}"
              data-id="${w.id}">
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-100 block truncate">${w.name}</span>
                <span class="text-[10px] font-mono text-slate-400 font-medium block truncate">Số dư: ${formatVND(w.balance)}</span>
              </div>
              <div class="w-4 h-4 rounded-full flex items-center justify-center text-xs ${isSel ? 'bg-indigo-500 text-white' : 'border border-slate-600'}">
                <i class="fa-solid fa-check text-[8px]"></i>
              </div>
            </div>
          `;
        }).join('');

        container.querySelectorAll('[data-id]').forEach(el => {
          el.addEventListener('click', () => {
            const id = parseInt(el.getAttribute('data-id'));
            callback(id);
          });
        });
      };

      renderGridItems(fromGrid, selectedFromWalletId, (id) => {
        selectedFromWalletId = id;
        document.getElementById('tx-from-wallet').value = id;
        renderTransferWalletGrids();
      });

      renderGridItems(toGrid, selectedToWalletId, (id) => {
        selectedToWalletId = id;
        document.getElementById('tx-to-wallet').value = id;
        renderTransferWalletGrids();
      });
    };

    // Initialize UI components
    updateCategoriesUI(initialType, existingTx?.category_id);
    renderWalletCards();
    renderTransferWalletGrids();

    // Set default date time
    const dateInput = document.getElementById('tx-date');
    if (dateInput) {
      if (existingTx && existingTx.transaction_date) {
        const d = new Date(existingTx.transaction_date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dateInput.value = d.toISOString().slice(0, 16);
      } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.value = now.toISOString().slice(0, 16);
      }
    }

    // Modal close binds
    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    // Dropdown change sync
    document.getElementById('tx-category')?.addEventListener('change', (e) => {
      selectedCategoryId = parseInt(e.target.value);
      updateCategoriesUI(document.getElementById('tx-type-input').value, selectedCategoryId);
    });

    // Type tab switching
    document.querySelectorAll('.tx-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-type');
        document.getElementById('tx-type-input').value = t;

        document.querySelectorAll('.tx-type-tab').forEach(btn => {
          if (btn === tab) {
            btn.className = 'tx-type-tab py-2 text-xs font-extrabold rounded-xl transition gradient-emerald text-white shadow-md';
          } else {
            btn.className = 'tx-type-tab py-2 text-xs font-extrabold rounded-xl transition text-slate-400 hover:text-slate-200';
          }
        });

        const stdCatSection = document.getElementById('standard-category-section');
        const stdWalletSection = document.getElementById('standard-wallet-section');
        const transferFields = document.getElementById('transfer-tx-fields');

        if (t === 'TRANSFER') {
          stdCatSection.classList.add('hidden');
          stdWalletSection.classList.add('hidden');
          transferFields.classList.remove('hidden');
          renderTransferWalletGrids();
        } else {
          stdCatSection.classList.remove('hidden');
          stdWalletSection.classList.remove('hidden');
          transferFields.classList.add('hidden');
          updateCategoriesUI(t);
        }
      });
    });

    // Form submit
    document.getElementById('tx-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = document.getElementById('tx-type-input').value;
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const dateVal = document.getElementById('tx-date').value;
      const note = document.getElementById('tx-note').value.trim();

      if (!amount || amount <= 0) {
        this.app.showToast('Vui lòng nhập số tiền hợp lệ (> 0)', 'warning');
        return;
      }

      try {
        if (type === 'TRANSFER') {
          const fromId = parseInt(document.getElementById('tx-from-wallet').value);
          const toId = parseInt(document.getElementById('tx-to-wallet').value);
          if (fromId === toId) {
            this.app.showToast('Ví nguồn và ví đích không được trùng nhau', 'warning');
            return;
          }
          await api.transferFunds({
            from_wallet_id: fromId,
            to_wallet_id: toId,
            amount: amount,
            date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
            note: note || 'Chuyển tiền nội bộ'
          });
          this.app.showToast('Chuyển tiền giữa các ví thành công!', 'success');
        } else {
          let catId = parseInt(document.getElementById('tx-category').value) || selectedCategoryId;
          const customCategoryName = document.getElementById('tx-custom-category-input')?.value.trim();

          // If custom category name was entered, auto-create or match it
          if (customCategoryName) {
            const existingCat = this.allCategories.find(c => c.name.toLowerCase() === customCategoryName.toLowerCase() && c.type === type);
            if (existingCat) {
              catId = existingCat.id;
            } else {
              try {
                const newCat = await api.createCategory({
                  name: customCategoryName,
                  type: type,
                  group: type === 'INCOME' ? 'INCOME' : 'WANTS',
                  icon: 'tag',
                  color: type === 'INCOME' ? '#10B981' : '#F43F5E'
                });
                this.allCategories.push(newCat);
                catId = newCat.id;
              } catch (catErr) {
                console.warn('Auto create category failed:', catErr);
              }
            }
          }

          const walletId = parseInt(document.getElementById('tx-wallet-selected-id').value) || selectedWalletId;

          const payload = {
            type: type,
            amount: amount,
            category_id: catId,
            wallet_id: walletId,
            transaction_date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
            note: note
          };

          if (existingTx) {
            await api.updateTransaction(existingTx.id, payload);
            this.app.showToast('Cập nhật giao dịch thành công!', 'success');
          } else {
            await api.createTransaction(payload);
            this.app.showToast('Ghi nhận giao dịch thành công!', 'success');
          }
        }

        closeModal();
        await this.loadTransactions();
        if (this.app.activeTab === 'dashboard') {
          await this.app.dashboard.loadDashboardData();
        }
      } catch (err) {
        console.error('Save transaction error:', err);
        this.app.showToast(`Lỗi: ${err.message}`, 'error');
      }
    });
  }

  async handleDeleteTransaction(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này? Số dư ví sẽ được tự động hoàn tác.')) {
      return;
    }
    try {
      await api.deleteTransaction(id);
      this.app.showToast('Đã xóa giao dịch và hoàn tất cập nhật số dư ví!', 'success');
      await this.loadTransactions();
      if (this.app.activeTab === 'dashboard') {
        await this.app.dashboard.loadDashboardData();
      }
    } catch (err) {
      this.app.showToast(`Xóa thất bại: ${err.message}`, 'error');
    }
  }
}
