import { api } from '../api.js';
import { formatVND, formatDateVN } from '../utils/formatters.js';

export class SavingsComponent {
  constructor(app) {
    this.app = app;
    this.goals = [];
    this.allWallets = [];
  }

  async render(container) {
    container.innerHTML = `
      <div id="view-savings" data-tab-id="savings" class="content-section user-tab-pane space-y-6 animate-in fade-in duration-300">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight">Mục Tiêu Tiết Kiệm</h1>
            <p class="text-slate-400 text-xs mt-0.5">Xây dựng quỹ khẩn cấp, tích lũy mua sắm và đạt được các cột mốc tự do tài chính</p>
          </div>
          <button id="btn-add-goal" class="px-4 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center gap-2">
            <i class="fa-solid fa-plus"></i>
            <span>Tạo Mục Tiêu Mới</span>
          </button>
        </div>

        <!-- Goals Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="goals-grid-container">
          <div class="glass-card p-6 rounded-2xl animate-pulse h-48"></div>
        </div>

      </div>
    `;

    document.getElementById('btn-add-goal')?.addEventListener('click', () => this.openGoalModal());

    await this.loadGoals();
  }

  async loadGoals() {
    const container = document.getElementById('goals-grid-container');
    if (!container) return;

    try {
      const [goals, wallets] = await Promise.all([
        api.getSavingGoals(),
        api.getWallets()
      ]);
      this.goals = goals;
      this.allWallets = wallets;

      if (goals.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl">
            <i class="fa-solid fa-trophy text-3xl mb-2 text-slate-300 block"></i>
            Bạn chưa đặt mục tiêu tiết kiệm nào. Hãy tạo mục tiêu đầu tiên ngay!
          </div>
        `;
        return;
      }

      container.innerHTML = goals.map(g => {
        const isCompleted = g.status === 'COMPLETED' || g.progress_percentage >= 100;
        const color = g.color || '#10B981';

        return `
          <div class="glass-card p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition relative group border ${isCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}">
            
            <div>
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl text-white flex items-center justify-center text-lg shadow-md" style="background-color: ${color}">
                    <i class="fa-solid fa-${g.icon || 'bullseye'}"></i>
                  </div>
                  <div>
                    <h3 class="font-extrabold text-slate-800 text-sm">${g.name}</h3>
                    <span class="text-[11px] text-slate-400">Hạn: ${g.target_date ? formatDateVN(g.target_date) : 'Không giới hạn'}</span>
                  </div>
                </div>
                ${isCompleted ? `
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    🎉 Hoàn thành
                  </span>
                ` : `
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    ${g.days_left ? `${g.days_left} ngày nữa` : 'Đang tích lũy'}
                  </span>
                `}
              </div>

              <!-- Note -->
              ${g.note ? `<p class="text-xs text-slate-500 mt-3 line-clamp-2">${g.note}</p>` : ''}

              <!-- Progress stats -->
              <div class="mt-5">
                <div class="flex justify-between items-baseline text-xs mb-1.5 font-bold">
                  <span class="text-slate-800 text-base font-black">${formatVND(g.current_amount)}</span>
                  <span class="text-slate-400">Mục tiêu: ${formatVND(g.target_amount)}</span>
                </div>
                <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div class="h-full rounded-full progress-animated transition-all duration-700 ${isCompleted ? 'gradient-emerald' : 'gradient-indigo'}" 
                    style="width: ${Math.min(100, g.progress_percentage)}%"></div>
                </div>
                <div class="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5">
                  <span>Tiến độ: <b class="text-indigo-400">${g.progress_percentage}%</b></span>
                  <span>Còn thiếu: ${formatVND(g.remaining_amount)}</span>
                </div>
              </div>
            </div>

            <!-- Deposit button & actions -->
            <div class="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
              <button onclick="window.depositGoal(${g.id})" class="btn-sparkle-burst flex-1 py-2 rounded-xl gradient-emerald text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-plus-circle"></i>
                <span>Nạp Thêm Tiền</span>
              </button>
              <button onclick="window.editGoal(${g.id})" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition" title="Sửa">
                <i class="fa-regular fa-pen-to-square text-xs"></i>
              </button>
              <button onclick="window.deleteGoal(${g.id})" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition" title="Xóa">
                <i class="fa-regular fa-trash-can text-xs"></i>
              </button>
            </div>

          </div>
        `;
      }).join('');

      window.depositGoal = (id) => this.openDepositModal(id);
      window.editGoal = (id) => this.openGoalModal(id);
      window.deleteGoal = (id) => this.handleDeleteGoal(id);

    } catch (err) {
      console.error('Load goals error:', err);
      this.app.showToast('Không thể tải danh sách mục tiêu tiết kiệm', 'error');
    }
  }

  openDepositModal(goalId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-piggy-bank text-emerald-600"></i>
              Nạp Tiền Vào Mục Tiêu
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="mt-3 p-3 bg-emerald-50 rounded-xl flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-base">
              <i class="fa-solid fa-${goal.icon || 'bullseye'}"></i>
            </div>
            <div>
              <h4 class="font-extrabold text-xs text-emerald-900">${goal.name}</h4>
              <span class="text-[11px] text-emerald-700">Đã tích lũy: <b>${formatVND(goal.current_amount)}</b> / ${formatVND(goal.target_amount)}</span>
            </div>
          </div>

          <form id="deposit-form" class="mt-4 space-y-4">
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Số Tiền Nạp (VND)</label>
              <input type="number" id="deposit-amount" required min="10000" step="10000" placeholder="Ví dụ: 1000000" 
                class="w-full px-3 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Trích Từ Ví Thanh Toán (Tùy chọn)</label>
              <select id="deposit-wallet" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="">-- Không trừ ví (chỉ ghi tăng mục tiêu) --</option>
                ${this.allWallets.map(w => `
                  <option value="${w.id}">Ví ${w.name} (Số dư: ${formatVND(w.balance)})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Ghi Chú</label>
              <input type="text" id="deposit-note" value="Nạp tiền vào ${goal.name}" 
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Hủy</button>
              <button type="submit" id="deposit-submit-btn" class="btn-sparkle-burst px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
                Xác Nhận Nạp Tiền
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const close = () => { modalEl.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('deposit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const wallet_id = parseInt(document.getElementById('deposit-wallet').value) || null;
        const note = document.getElementById('deposit-note').value.trim();

        await api.depositToGoal(goal.id, { amount, wallet_id, note });
        this.app.showToast(`Đã nạp thành công ${formatVND(amount)} vào ${goal.name}!`, 'success');
        close();
        await this.loadGoals();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi nạp tiền vào mục tiêu', 'error');
      }
    });
  }

  openGoalModal(editId = null) {
    const existing = editId ? this.goals.find(g => g.id === editId) : null;
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-bullseye text-emerald-600"></i>
              ${existing ? 'Chỉnh Sửa Mục Tiêu' : 'Tạo Mục Tiêu Tiết Kiệm'}
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form id="goal-form" class="mt-4 space-y-4">
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên Mục Tiêu</label>
              <input type="text" id="goal-name" required value="${existing ? existing.name : ''}" placeholder="VD: Quỹ khẩn cấp 6 tháng, Mua xe máy mới" 
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Số Tiền Cần Đạt</label>
                <input type="number" id="goal-target-amount" required min="100000" step="100000" 
                  value="${existing ? existing.target_amount : '50000000'}" 
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Số Tiền Đã Có</label>
                <input type="number" id="goal-current-amount" min="0" step="10000" 
                  value="${existing ? existing.current_amount : '0'}" 
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Hạn Định</label>
                <input type="date" id="goal-date" value="${existing && existing.target_date ? existing.target_date : ''}" 
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Màu Sắc</label>
                <input type="color" id="goal-color" value="${existing ? existing.color : '#10B981'}" class="w-full h-9 rounded-xl border border-slate-200 cursor-pointer p-1" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Icon FontAwesome</label>
              <select id="goal-icon" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="shield-halved">Bảo vệ / Khẩn cấp (shield-halved)</option>
                <option value="motorcycle">Xe máy (motorcycle)</option>
                <option value="car">Ô tô (car)</option>
                <option value="plane">Du lịch (plane)</option>
                <option value="house">Mua nhà (house)</option>
                <option value="graduation-cap">Học vấn (graduation-cap)</option>
                <option value="ring">Kết hôn (ring)</option>
                <option value="bullseye">Mục tiêu chung (bullseye)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Ghi Chú & Kế Hoạch</label>
              <textarea id="goal-note" rows="2" placeholder="Ghi chú kế hoạch thực hiện..." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">${existing ? existing.note || '' : ''}</textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Hủy</button>
              <button type="submit" id="goal-submit-btn" class="btn-sparkle-burst px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
                ${existing ? 'Lưu Mục Tiêu' : 'Tạo Mục Tiêu'}
              </button>
            </div>

          </form>
        </div>
      </div>
    `;

    const close = () => { modalEl.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('goal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('goal-name').value.trim();
        const target_amount = parseFloat(document.getElementById('goal-target-amount').value);
        const current_amount = parseFloat(document.getElementById('goal-current-amount').value) || 0;
        const target_date = document.getElementById('goal-date').value || null;
        const color = document.getElementById('goal-color').value;
        const icon = document.getElementById('goal-icon').value;
        const note = document.getElementById('goal-note').value.trim();

        const payload = { name, target_amount, current_amount, target_date, color, icon, note };
        if (existing) {
          await api.updateSavingGoal(existing.id, payload);
          this.app.showToast('Cập nhật mục tiêu thành công!', 'success');
        } else {
          await api.createSavingGoal(payload);
          this.app.showToast('Đã tạo mục tiêu tiết kiệm mới!', 'success');
        }

        close();
        await this.loadGoals();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu mục tiêu', 'error');
      }
    });
  }

  async handleDeleteGoal(id) {
    if (!confirm('Bạn có chắc muốn xóa mục tiêu tiết kiệm này?')) return;
    try {
      await api.deleteSavingGoal(id);
      this.app.showToast('Đã xóa mục tiêu tiết kiệm', 'success');
      await this.loadGoals();
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi xóa mục tiêu', 'error');
    }
  }
}
