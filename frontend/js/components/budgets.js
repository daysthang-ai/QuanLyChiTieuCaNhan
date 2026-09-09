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
      <div id="view-budgets" data-tab-id="budgets" class="content-section user-tab-pane space-y-6 animate-in fade-in duration-300">
        
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

        <!-- Dynamic 50/30/20 Allocation Visualization Card -->
        <div id="fifty-thirty-twenty-container">
          <div class="glass-card p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-slate-950 border border-emerald-500/20 animate-pulse h-28"></div>
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
      const [budgets, categories, rule503020] = await Promise.all([
        api.getBudgets(this.selectedMonth),
        api.getCategories('EXPENSE'),
        api.getFiftyThirtyTwenty(this.selectedMonth).catch(err => {
          console.warn('[Budgets] Không thể tải phân tích 50/30/20:', err);
          return null;
        })
      ]);

      this.budgets = budgets;
      this.allCategories = categories;

      this.renderFiftyThirtyTwentyCard(rule503020);

      if (budgets.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-800">
            <i class="fa-solid fa-bullseye text-3xl mb-2 text-slate-500 block"></i>
            Chưa có hạn mức nào được thiết lập cho tháng ${this.selectedMonth}.<br/>
            <button id="btn-quick-create-budget" class="mt-3 px-4 py-2 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
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

        // 3 Trạng thái cảnh báo hạn mức ngân sách (Dark theme dịu mắt & tươi tắn)
        const statusBadge = isOver
          ? `<span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center gap-1 shadow-sm"><i class="fa-solid fa-triangle-exclamation text-rose-400"></i> Bội chi (${Math.round(b.percentage)}%)</span>`
          : isWarn
          ? `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px] flex items-center gap-1 shadow-sm"><i class="fa-solid fa-circle-exclamation text-amber-400"></i> Cảnh báo 80% (${Math.round(b.percentage)}%)</span>`
          : `<span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 shadow-sm"><i class="fa-solid fa-shield-check text-emerald-400"></i> An toàn (${Math.round(b.percentage)}%)</span>`;

        const progressBarClass = isOver 
          ? 'budget-progress-overspent bg-gradient-to-r from-rose-600 to-rose-500' 
          : isWarn 
          ? 'budget-progress-warning bg-gradient-to-r from-amber-500 to-amber-400' 
          : 'budget-progress-safe bg-gradient-to-r from-emerald-500 to-cyan-500';

        const progressBarStyle = isOver
          ? 'background: linear-gradient(90deg, #e11d48 0%, #f43f5e 100%); box-shadow: 0 0 10px rgba(244, 63, 94, 0.35);'
          : isWarn
          ? 'background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); box-shadow: 0 0 10px rgba(251, 191, 36, 0.35);'
          : 'background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);';

        const cardBorderClass = isOver 
          ? 'border-rose-500/35 bg-rose-950/15 hover:border-rose-500/60' 
          : isWarn 
          ? 'border-amber-500/35 bg-amber-950/15 hover:border-amber-500/60' 
          : 'border-slate-800/80 bg-slate-900/60 hover:border-emerald-500/40';

        const catName = b.category ? b.category.name : 'Danh mục';
        const catIcon = b.category ? b.category.icon : 'tag';
        const catColor = b.category ? b.category.color : '#10B981';

        return `
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group border ${cardBorderClass}">
            
            <div>
              <!-- Top Row -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-9 h-9 rounded-xl text-white flex items-center justify-center text-sm shadow-sm" style="background-color: ${catColor}">
                    <i class="fa-solid fa-${catIcon}"></i>
                  </span>
                  <div>
                    <h3 class="font-extrabold text-sm text-slate-100">${catName}</h3>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold">${b.period === 'MONTHLY' ? 'Hạn mức tháng' : 'Hạn mức tuần'}</span>
                  </div>
                </div>
                ${statusBadge}
              </div>

              <!-- Progress bar -->
              <div class="mt-4 mb-2">
                <div class="flex justify-between text-xs font-bold mb-1.5">
                  <span class="text-slate-300">Đã chi: <b class="${isOver ? 'text-rose-400 font-mono' : isWarn ? 'text-amber-300 font-mono' : 'text-slate-100 font-mono'}">${formatVND(b.spent_amount)}</b></span>
                  <span class="text-slate-400 font-mono">Hạn mức: ${formatVND(b.amount_limit)}</span>
                </div>
                <div class="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div class="${progressBarClass} progress-animated h-full rounded-full transition-all duration-700" style="width: ${Math.min(100, b.percentage)}%; ${progressBarStyle}"></div>
                </div>
              </div>
            </div>

            <!-- Footer: Remaining & Actions -->
            <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
              <span class="text-slate-400 font-medium">
                ${isOver ? `<span class="text-rose-400 font-bold font-mono">Vượt: -${formatVND(b.spent_amount - b.amount_limit)}</span>` : isWarn ? `Còn lại: <b class="text-amber-300 font-mono">${formatVND(b.remaining_amount)}</b>` : `Còn lại: <b class="text-emerald-400 font-mono">${formatVND(b.remaining_amount)}</b>`}
              </span>
              <div class="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                <button onclick="window.editBudget(${b.id})" class="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer" title="Sửa">
                  <i class="fa-regular fa-pen-to-square text-xs"></i>
                </button>
                <button onclick="window.deleteBudget(${b.id})" class="w-7 h-7 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer" title="Xóa">
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

  renderFiftyThirtyTwentyCard(rule) {
    const container = document.getElementById('fifty-thirty-twenty-container');
    if (!container) return;

    if (!rule) {
      container.innerHTML = `
        <div class="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl gradient-emerald text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
              <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-100">Quy Tắc Quản Trị Ngân Sách Vàng 50/30/20</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">
                • <b class="text-cyan-400">50% Nhu cầu thiết yếu</b> (Ăn uống, Nhà ở, Hóa đơn) | 
                • <b class="text-purple-400">30% Mong muốn</b> (Mua sắm, Cà phê, Giải trí) | 
                • <b class="text-emerald-400">20% Tiết kiệm & Tích lũy</b>
              </p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const needsPct = Number(rule.needs_actual_pct || 0);
    const wantsPct = Number(rule.wants_actual_pct || 0);
    const savingsPct = Number(rule.savings_actual_pct || 0);

    const needsOver = needsPct > 55;
    const wantsOver = wantsPct > 35;
    const savingsGood = savingsPct >= 20;

    container.innerHTML = `
      <div class="glass-card p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 shadow-xl relative overflow-hidden transition-all duration-300">
        <!-- Glow accent -->
        <div class="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl gradient-emerald text-white flex items-center justify-center text-base shadow-md shadow-emerald-500/30 flex-shrink-0">
              <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-slate-100 tracking-tight">Phân Bổ Ngân Sách Chuẩn 50 / 30 / 20</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">AI Phân Tích</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Cơ sở tính: <span class="font-mono text-slate-300 font-semibold">${rule.total_income > 0 ? `Thu nhập ${formatVND(rule.total_income)}` : 'Tổng chi tiêu thực tế'}</span>
              </p>
            </div>
          </div>

          <div class="text-right">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${needsOver || wantsOver ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}">
              <i class="fa-solid ${needsOver || wantsOver ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-check text-emerald-400'} mr-1"></i>
              ${rule.evaluation || 'Cơ cấu cân bằng'}
            </span>
          </div>
        </div>

        <!-- 3 Interactive Allocation Columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- Column 1: Needs (50%) -->
          <div class="p-3.5 rounded-xl bg-slate-900/90 border ${needsOver ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'} flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
                  <span class="text-xs font-bold text-slate-200">Nhu cầu thiết yếu</span>
                </div>
                <span class="text-[11px] font-mono font-bold ${needsOver ? 'text-rose-400' : 'text-cyan-400'}">${needsPct}% <span class="text-slate-500 font-normal">/ 50%</span></span>
              </div>
              <p class="text-[10px] text-slate-400 mb-2">Ăn uống, nhà ở, hóa đơn, đi lại</p>
              <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div class="h-full rounded-full transition-all duration-700 ${needsOver ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}" style="width: ${Math.min(100, needsPct)}%"></div>
              </div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
              <span class="text-slate-500 font-medium">Thực tế:</span>
              <span class="font-mono font-bold ${needsOver ? 'text-rose-300' : 'text-slate-200'}">${formatVND(rule.needs_actual_amount || 0)}</span>
            </div>
          </div>

          <!-- Column 2: Wants (30%) -->
          <div class="p-3.5 rounded-xl bg-slate-900/90 border ${wantsOver ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'} flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-sm shadow-purple-400/50"></span>
                  <span class="text-xs font-bold text-slate-200">Mong muốn cá nhân</span>
                </div>
                <span class="text-[11px] font-mono font-bold ${wantsOver ? 'text-amber-400' : 'text-purple-400'}">${wantsPct}% <span class="text-slate-500 font-normal">/ 30%</span></span>
              </div>
              <p class="text-[10px] text-slate-400 mb-2">Mua sắm, cà phê, giải trí, du lịch</p>
              <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div class="h-full rounded-full transition-all duration-700 ${wantsOver ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}" style="width: ${Math.min(100, wantsPct)}%"></div>
              </div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
              <span class="text-slate-500 font-medium">Thực tế:</span>
              <span class="font-mono font-bold ${wantsOver ? 'text-amber-300' : 'text-slate-200'}">${formatVND(rule.wants_actual_amount || 0)}</span>
            </div>
          </div>

          <!-- Column 3: Savings (20%) -->
          <div class="p-3.5 rounded-xl bg-slate-900/90 border ${savingsGood ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50"></span>
                  <span class="text-xs font-bold text-slate-200">Tiết kiệm & Đầu tư</span>
                </div>
                <span class="text-[11px] font-mono font-bold ${savingsGood ? 'text-emerald-400' : 'text-slate-400'}">${savingsPct}% <span class="text-slate-500 font-normal">/ 20%</span></span>
              </div>
              <p class="text-[10px] text-slate-400 mb-2">Quỹ khẩn cấp, tích lũy, đầu tư sinh lời</p>
              <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-teal-400" style="width: ${Math.min(100, savingsPct)}%"></div>
              </div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
              <span class="text-slate-500 font-medium">Thực tế:</span>
              <span class="font-mono font-bold ${savingsGood ? 'text-emerald-300' : 'text-slate-200'}">${formatVND(rule.savings_actual_amount || 0)}</span>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  openBudgetModal(editId = null) {
    const existing = editId ? this.budgets.find(b => b.id === editId) : null;
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="glass-card bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in duration-150 backdrop-blur-xl">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-lg font-black text-slate-100 flex items-center gap-2">
              <i class="fa-solid fa-bullseye text-emerald-400"></i>
              ${existing ? 'Sửa Hạn Mức Ngân Sách' : 'Đặt Hạn Mức Ngân Sách'}
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form id="budget-form" class="mt-4 space-y-4">
            
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Danh Mục Chi Tiêu</label>
              <select id="budget-category" ${existing ? 'disabled' : ''} class="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 text-slate-100 border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                ${this.allCategories.map(c => `
                  <option value="${c.id}" ${existing && existing.category_id === c.id ? 'selected' : ''} class="bg-slate-900 text-slate-100">${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Hạn Mức Tối Đa (VND)</label>
              <input type="number" id="budget-limit" required min="10000" step="10000" 
                value="${existing ? existing.amount_limit : '2000000'}" placeholder="Ví dụ: 3000000" 
                class="w-full px-3 py-2.5 text-sm font-bold text-emerald-400 bg-slate-950/80 rounded-xl border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Kỳ Hạn</label>
                <select id="budget-period" class="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 text-slate-100 border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="MONTHLY" ${!existing || existing.period === 'MONTHLY' ? 'selected' : ''} class="bg-slate-900 text-slate-100">Hàng tháng</option>
                  <option value="WEEKLY" ${existing && existing.period === 'WEEKLY' ? 'selected' : ''} class="bg-slate-900 text-slate-100">Hàng tuần</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Tháng Áp Dụng</label>
                <input type="month" id="budget-month" value="${existing ? existing.month_year : this.selectedMonth}" 
                  class="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 text-slate-100 border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold" />
              </div>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300 flex items-start gap-2">
              <i class="fa-solid fa-bell text-amber-400 mt-0.5"></i>
              <span>Hệ thống sẽ tự động gửi cảnh báo khi chi tiêu danh mục này vượt quá <b>80%</b> và <b>100%</b> hạn mức.</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer">Hủy</button>
              <button type="submit" id="budget-submit-btn" class="btn-sparkle-burst px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition cursor-pointer">
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
