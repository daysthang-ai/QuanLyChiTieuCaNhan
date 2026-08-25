import { api } from '../api.js';
import { formatVND, getCurrentMonthStr } from '../utils/formatters.js';

export class BudgetsComponent {
  constructor(app) {
    this.app = app;
    this.selectedMonth = getCurrentMonthStr();
    this.budgets = [];
    this.allCategories = [];
  }

  async render(container) {
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight">Hạn Mức Ngân Sách</h1>
            <p class="text-slate-400 text-xs mt-0.5">Kiểm soát dòng chi tiêu theo từng danh mục, tự động cảnh báo chạm 80% & bội chi 100%</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm text-xs">
              <span class="text-slate-400 font-bold">Tháng:</span>
              <input type="month" id="budget-month-picker" value="${this.selectedMonth}" 
                class="font-bold text-emerald-400 bg-transparent border-0 focus:outline-none cursor-pointer" />
            </div>
            <button id="btn-add-budget" class="px-4 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center gap-2">
              <i class="fa-solid fa-plus"></i>
              <span>Đặt Hạn Mức Mới</span>
            </button>
          </div>
        </div>

        <!-- 50/30/20 Budgeting Tips Bar -->
        <div class="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl gradient-emerald text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
              <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-100">Quy Tắc Quản Trị Ngân Sách Vàng 50/30/20</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">
                • <b class="text-rose-400">50% Nhu cầu thiết yếu</b> (Ăn uống, Nhà ở, Hóa đơn, Đi lại) | 
                • <b class="text-purple-400">30% Mong muốn</b> (Mua sắm, Cà phê, Giải trí) | 
                • <b class="text-emerald-400">20% Tiết kiệm</b>
              </p>
            </div>
          </div>
        </div>

        <!-- Budget Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="budgets-grid-container">
          <div class="glass-card p-6 rounded-2xl animate-pulse h-40"></div>
        </div>

      </div>
    `;

    document.getElementById('budget-month-picker')?.addEventListener('change', (e) => {
      this.selectedMonth = e.target.value;
      this.loadBudgets();
    });

    document.getElementById('btn-add-budget')?.addEventListener('click', () => this.openBudgetModal());

    await this.loadBudgets();
  }

  async loadBudgets() {
    const container = document.getElementById('budgets-grid-container');
    if (!container) return;

    try {
      const [budgets, categories] = await Promise.all([
        api.getBudgets(this.selectedMonth),
        api.getCategories('EXPENSE')
      ]);

      this.budgets = budgets;
      this.allCategories = categories;

      if (budgets.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl">
            <i class="fa-solid fa-bullseye text-3xl mb-2 text-slate-300 block"></i>
            Chưa có hạn mức nào được thiết lập cho tháng ${this.selectedMonth}.<br/>
            <button id="btn-quick-create-budget" class="mt-3 px-4 py-2 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25">
              + Thiết lập hạn mức ngay
            </button>
          </div>
        `;
        document.getElementById('btn-quick-create-budget')?.addEventListener('click', () => this.openBudgetModal());
        return;
      }

      container.innerHTML = budgets.map(b => {
        const isOver = b.status === 'OVERSPENT';
        const isWarn = b.status === 'WARNING';
        const statusBadge = isOver
          ? `<span class="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation"></i> Bội chi (${Math.round(b.percentage)}%)</span>`
          : isWarn
          ? `<span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1"><i class="fa-solid fa-circle-exclamation"></i> Cảnh báo 80% (${b.percentage}%)</span>`
          : `<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1"><i class="fa-solid fa-shield-check"></i> An toàn (${b.percentage}%)</span>`;

        const progressBarColor = isOver ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';
        const catName = b.category ? b.category.name : 'Danh mục';
        const catIcon = b.category ? b.category.icon : 'tag';
        const catColor = b.category ? b.category.color : '#10B981';

        return `
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition relative group border ${isOver ? 'border-red-200 bg-red-50/20' : isWarn ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}">
            
            <div>
              <!-- Top Row -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-9 h-9 rounded-xl text-white flex items-center justify-center text-sm shadow-sm" style="background-color: ${catColor}">
                    <i class="fa-solid fa-${catIcon}"></i>
                  </span>
                  <div>
                    <h3 class="font-extrabold text-sm text-slate-800">${catName}</h3>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold">${b.period === 'MONTHLY' ? 'Hạn mức tháng' : 'Hạn mức tuần'}</span>
                  </div>
                </div>
                ${statusBadge}
              </div>

              <!-- Progress bar -->
              <div class="mt-4 mb-2">
                <div class="flex justify-between text-xs font-bold mb-1.5">
                  <span class="text-slate-300">Đã chi: <b class="${isOver ? 'text-rose-400' : 'text-slate-100'}">${formatVND(b.spent_amount)}</b></span>
                  <span class="text-slate-400">Hạn mức: ${formatVND(b.amount_limit)}</span>
                </div>
                <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                  <div class="${progressBarColor} progress-animated h-full rounded-full transition-all duration-700" style="width: ${Math.min(100, b.percentage)}%"></div>
                </div>
              </div>
            </div>

            <!-- Footer: Remaining & Actions -->
            <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <span class="text-slate-500 font-medium">
                ${isOver ? `<b class="text-red-600">Vượt: -${formatVND(b.spent_amount - b.amount_limit)}</b>` : `Còn lại: <b class="text-emerald-600">${formatVND(b.remaining_amount)}</b>`}
              </span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onclick="window.editBudget(${b.id})" class="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center" title="Sửa">
                  <i class="fa-regular fa-pen-to-square text-xs"></i>
                </button>
                <button onclick="window.deleteBudget(${b.id})" class="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center" title="Xóa">
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

          </div>
        `;
      }).join('');

      window.editBudget = (id) => this.openBudgetModal(id);
      window.deleteBudget = (id) => this.handleDeleteBudget(id);

    } catch (e) {
      console.error('Load budgets error:', e);
      this.app.showToast('Không thể tải dữ liệu hạn mức ngân sách', 'error');
    }
  }

  openBudgetModal(editId = null) {
    const existing = editId ? this.budgets.find(b => b.id === editId) : null;
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-bullseye text-emerald-600"></i>
              ${existing ? 'Sửa Hạn Mức Ngân Sách' : 'Đặt Hạn Mức Ngân Sách'}
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form id="budget-form" class="mt-4 space-y-4">
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Danh Mục Chi Tiêu</label>
              <select id="budget-category" ${existing ? 'disabled' : ''} class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                ${this.allCategories.map(c => `
                  <option value="${c.id}" ${existing && existing.category_id === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Hạn Mức Tối Đa (VND)</label>
              <input type="number" id="budget-limit" required min="10000" step="10000" 
                value="${existing ? existing.amount_limit : '2000000'}" placeholder="Ví dụ: 3000000" 
                class="w-full px-3 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Kỳ Hạn</label>
                <select id="budget-period" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="MONTHLY" ${!existing || existing.period === 'MONTHLY' ? 'selected' : ''}>Hàng tháng</option>
                  <option value="WEEKLY" ${existing && existing.period === 'WEEKLY' ? 'selected' : ''}>Hàng tuần</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Tháng Áp Dụng</label>
                <input type="month" id="budget-month" value="${existing ? existing.month_year : this.selectedMonth}" 
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700" />
              </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <i class="fa-solid fa-bell text-amber-600 mt-0.5"></i>
              <span>Hệ thống sẽ tự động gửi cảnh báo khi chi tiêu danh mục này vượt quá <b>80%</b> và <b>100%</b> hạn mức.</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Hủy</button>
              <button type="submit" id="budget-submit-btn" class="px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
                ${existing ? 'Lưu Hạn Mức' : 'Xác Nhận Đặt'}
              </button>
            </div>

          </form>
        </div>
      </div>
    `;

    const close = () => { modalEl.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('budget-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const category_id = parseInt(document.getElementById('budget-category').value);
        const amount_limit = parseFloat(document.getElementById('budget-limit').value);
        const period = document.getElementById('budget-period').value;
        const month_year = document.getElementById('budget-month').value;

        const payload = { category_id, amount_limit, period, month_year };
        if (existing) {
          await api.updateBudget(existing.id, { amount_limit, period, month_year });
          this.app.showToast('Cập nhật hạn mức thành công!', 'success');
        } else {
          await api.createBudget(payload);
          this.app.showToast('Thiết lập hạn mức ngân sách thành công!', 'success');
        }

        close();
        await this.loadBudgets();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu hạn mức', 'error');
      }
    });
  }

  async handleDeleteBudget(id) {
    if (!confirm('Bạn có chắc muốn xóa hạn mức ngân sách này?')) return;
    try {
      await api.deleteBudget(id);
      this.app.showToast('Đã xóa hạn mức ngân sách!', 'success');
      await this.loadBudgets();
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi xóa hạn mức', 'error');
    }
  }
}
