import { api } from '../api.js';
import { getGroupBadge } from '../utils/formatters.js';

export class CategoriesComponent {
  constructor(app) {
    this.app = app;
    this.categories = [];
  }

  async render(container) {
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight">Danh Mục Thu - Chi</h1>
            <p class="text-slate-400 text-xs mt-0.5">Phân loại chi tiêu chuẩn hóa theo nguyên tắc 50/30/20 & Danh mục cá nhân tùy chỉnh</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-reset-categories" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-2" title="Khôi phục danh mục mẫu chuẩn">
              <i class="fa-solid fa-arrows-rotate text-emerald-400"></i>
              <span>Khôi Phục Chuẩn</span>
            </button>
            <button id="btn-add-category" class="px-4 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center gap-2">
              <i class="fa-solid fa-plus"></i>
              <span>Thêm Danh Mục Mới</span>
            </button>
          </div>
        </div>

        <!-- Category Groups Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="categories-groups-container">
          <div class="glass-card p-6 rounded-2xl animate-pulse h-64"></div>
        </div>

      </div>
    `;

    document.getElementById('btn-add-category')?.addEventListener('click', () => this.openCategoryModal());
    document.getElementById('btn-reset-categories')?.addEventListener('click', () => this.handleResetCategories());

    await this.loadCategories();
  }

  async loadCategories() {
    const container = document.getElementById('categories-groups-container');
    if (!container) return;

    try {
      this.categories = await api.getCategories();

      const groups = [
        { id: 'NEEDS', title: 'Nhu Cầu Thiết Yếu (50%)', subtitle: 'Chi phí bắt buộc hàng ngày', color: 'text-red-600', icon: 'utensils' },
        { id: 'WANTS', title: 'Mong Muốn & Hưởng Thụ (30%)', subtitle: 'Chi phí nâng cao đời sống', color: 'text-purple-600', icon: 'bag-shopping' },
        { id: 'SAVINGS', title: 'Tiết Kiệm & Đầu Tư (20%)', subtitle: 'Tích lũy tương lai', color: 'text-emerald-600', icon: 'piggy-bank' },
        { id: 'INCOME', title: 'Nguồn Thu Nhập', subtitle: 'Dòng tiền vào', color: 'text-green-600', icon: 'money-bill-wave' }
      ];

      container.innerHTML = groups.map(g => {
        const groupCats = this.categories.filter(c => c.group === g.id);

        return `
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <i class="fa-solid fa-${g.icon} ${g.color} text-sm"></i>
                <div>
                  <h3 class="font-extrabold text-xs text-slate-800">${g.title}</h3>
                  <span class="text-[10px] text-slate-400 block">${g.subtitle}</span>
                </div>
              </div>

              <div class="space-y-2">
                ${groupCats.map(c => {
                  const iconClass = (c.icon || 'tags').replace(/^fa-solid\s+|^fa-regular\s+|^fa-brands\s+|^fa-/, '');
                  return `
                  <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition group">
                    <div class="flex items-center gap-2.5">
                      <span class="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs shadow-sm" style="background-color: ${c.color}">
                        <i class="fa-solid fa-${iconClass}"></i>
                      </span>
                      <span class="font-bold text-xs text-slate-700">${c.name}</span>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onclick="window.editCategory(${c.id})" class="w-6 h-6 rounded-md hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                        <i class="fa-regular fa-pen-to-square text-[10px]"></i>
                      </button>
                      ${!c.is_default ? `
                        <button onclick="window.deleteCategory(${c.id})" class="w-6 h-6 rounded-md hover:bg-red-100 hover:text-red-600 text-slate-400 flex items-center justify-center">
                          <i class="fa-regular fa-trash-can text-[10px]"></i>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');

      window.editCategory = (id) => this.openCategoryModal(id);
      window.deleteCategory = (id) => this.handleDeleteCategory(id);

    } catch (e) {
      console.error('Load categories error:', e);
      this.app.showToast('Không thể tải danh sách danh mục', 'error');
    }
  }

  openCategoryModal(editId = null) {
    const existing = editId ? this.categories.find(c => c.id === editId) : null;
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-tag text-emerald-600"></i>
              ${existing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
            </h3>
            <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form id="cat-form" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên Danh Mục</label>
              <input type="text" id="cat-name" required value="${existing ? existing.name : ''}" placeholder="VD: Thú cưng, Học thêm tiếng Anh" 
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Loại</label>
                <select id="cat-type" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="EXPENSE" ${!existing || existing.type === 'EXPENSE' ? 'selected' : ''}>Chi tiêu</option>
                  <option value="INCOME" ${existing && existing.type === 'INCOME' ? 'selected' : ''}>Thu nhập</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nhóm 50/30/20</label>
                <select id="cat-group" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="NEEDS" ${!existing || existing.group === 'NEEDS' ? 'selected' : ''}>Thiết yếu (50%)</option>
                  <option value="WANTS" ${existing && existing.group === 'WANTS' ? 'selected' : ''}>Mong muốn (30%)</option>
                  <option value="SAVINGS" ${existing && existing.group === 'SAVINGS' ? 'selected' : ''}>Tiết kiệm (20%)</option>
                  <option value="INCOME" ${existing && existing.group === 'INCOME' ? 'selected' : ''}>Thu nhập</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Màu Đại Diện</label>
                <input type="color" id="cat-color" value="${existing ? existing.color : '#10B981'}" class="w-full h-9 rounded-xl border border-slate-200 cursor-pointer p-1" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Icon FontAwesome</label>
                <select id="cat-icon" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="utensils" ${existing && (existing.icon === 'utensils' || existing.icon === 'fa-utensils') ? 'selected' : ''}>Ăn uống (utensils)</option>
                  <option value="house" ${existing && (existing.icon === 'house' || existing.icon === 'home' || existing.icon === 'fa-house') ? 'selected' : ''}>Nhà ở & Tiền thuê (house)</option>
                  <option value="bolt" ${existing && (existing.icon === 'bolt' || existing.icon === 'fa-bolt') ? 'selected' : ''}>Hóa đơn & Tiện ích (bolt)</option>
                  <option value="car" ${existing && (existing.icon === 'car' || existing.icon === 'fa-car') ? 'selected' : ''}>Đi lại & Xăng xe (car)</option>
                  <option value="heart-pulse" ${existing && (existing.icon === 'heart-pulse' || existing.icon === 'fa-heart-pulse') ? 'selected' : ''}>Y tế & Sức khỏe (heart-pulse)</option>
                  <option value="graduation-cap" ${existing && (existing.icon === 'graduation-cap' || existing.icon === 'book' || existing.icon === 'fa-graduation-cap') ? 'selected' : ''}>Học tập & Giáo dục (graduation-cap)</option>
                  <option value="bag-shopping" ${existing && (existing.icon === 'bag-shopping' || existing.icon === 'bag' || existing.icon === 'fa-bag-shopping') ? 'selected' : ''}>Mua sắm cá nhân (bag-shopping)</option>
                  <option value="plane" ${existing && (existing.icon === 'plane' || existing.icon === 'fa-plane') ? 'selected' : ''}>Du lịch & Nghỉ dưỡng (plane)</option>
                  <option value="gamepad" ${existing && (existing.icon === 'gamepad' || existing.icon === 'film' || existing.icon === 'fa-gamepad') ? 'selected' : ''}>Giải trí & Thư giãn (gamepad)</option>
                  <option value="mug-saucer" ${existing && (existing.icon === 'mug-saucer' || existing.icon === 'mug-hot' || existing.icon === 'coffee' || existing.icon === 'fa-mug-saucer') ? 'selected' : ''}>Cà phê & Gặp gỡ (mug-saucer)</option>
                  <option value="wand-magic-sparkles" ${existing && (existing.icon === 'wand-magic-sparkles' || existing.icon === 'scissors' || existing.icon === 'fa-wand-magic-sparkles') ? 'selected' : ''}>Làm đẹp & Spa (wand-magic-sparkles)</option>
                  <option value="gift" ${existing && (existing.icon === 'gift' || existing.icon === 'fa-gift') ? 'selected' : ''}>Quà tặng & Hiếu hỷ (gift)</option>
                  <option value="shield-heart" ${existing && (existing.icon === 'shield-heart' || existing.icon === 'shield' || existing.icon === 'fa-shield-heart') ? 'selected' : ''}>Quỹ khẩn cấp (shield-heart)</option>
                  <option value="chart-line" ${existing && (existing.icon === 'chart-line' || existing.icon === 'trending-up' || existing.icon === 'line-chart' || existing.icon === 'fa-chart-line') ? 'selected' : ''}>Đầu tư sinh lời (chart-line)</option>
                  <option value="piggy-bank" ${existing && (existing.icon === 'piggy-bank' || existing.icon === 'bullseye' || existing.icon === 'fa-piggy-bank') ? 'selected' : ''}>Tiết kiệm & Tích lũy (piggy-bank)</option>
                  <option value="money-bill-transfer" ${existing && (existing.icon === 'money-bill-transfer' || existing.icon === 'credit-card' || existing.icon === 'fa-money-bill-transfer') ? 'selected' : ''}>Trả nợ gốc (money-bill-transfer)</option>
                  <option value="money-bill-wave" ${existing && (existing.icon === 'money-bill-wave' || existing.icon === 'wallet' || existing.icon === 'fa-money-bill-wave') ? 'selected' : ''}>Lương chính thức (money-bill-wave)</option>
                  <option value="award" ${existing && (existing.icon === 'award' || existing.icon === 'fa-award') ? 'selected' : ''}>Thưởng & Hoa hồng (award)</option>
                  <option value="laptop-code" ${existing && (existing.icon === 'laptop-code' || existing.icon === 'laptop' || existing.icon === 'fa-laptop-code') ? 'selected' : ''}>Freelance & Phụ (laptop-code)</option>
                  <option value="arrow-trend-up" ${existing && (existing.icon === 'arrow-trend-up' || existing.icon === 'fa-arrow-trend-up') ? 'selected' : ''}>Lãi suất & Đầu tư (arrow-trend-up)</option>
                  <option value="wallet" ${existing && (existing.icon === 'wallet' || existing.icon === 'plus-circle' || existing.icon === 'fa-wallet') ? 'selected' : ''}>Thu nhập khác / Ví (wallet)</option>
                  <option value="tags" ${existing && (existing.icon === 'tags' || existing.icon === 'tag' || existing.icon === 'fa-tags') ? 'selected' : ''}>Nhãn danh mục (tags)</option>
                  <option value="paw" ${existing && existing.icon === 'paw' ? 'selected' : ''}>Thú cưng (paw)</option>
                  <option value="dumbbell" ${existing && existing.icon === 'dumbbell' ? 'selected' : ''}>Thể thao & Gym (dumbbell)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" id="modal-cancel-btn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Hủy</button>
              <button type="submit" id="cat-submit-btn" class="px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition">
                ${existing ? 'Lưu Danh Mục' : 'Thêm Danh Mục'}
              </button>
            </div>

          </form>
        </div>
      </div>
    `;

    const close = () => { modalEl.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('cat-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('cat-name').value.trim();
        const type = document.getElementById('cat-type').value;
        const group = document.getElementById('cat-group').value;
        const color = document.getElementById('cat-color').value;
        const rawIcon = document.getElementById('cat-icon').value.trim();
        const icon = rawIcon.replace(/^fa-solid\s+|^fa-regular\s+|^fa-brands\s+|^fa-/, '');

        const payload = { name, type, group, color, icon };
        if (existing) {
          await api.updateCategory(existing.id, payload);
          this.app.showToast('Cập nhật danh mục thành công!', 'success');
        } else {
          await api.createCategory(payload);
          this.app.showToast('Thêm danh mục mới thành công!', 'success');
        }

        close();
        await this.loadCategories();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu danh mục', 'error');
      }
    });
  }

  async handleDeleteCategory(id) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await api.deleteCategory(id);
      this.app.showToast('Đã xóa danh mục!', 'success');
      await this.loadCategories();
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi xóa danh mục', 'error');
    }
  }

  async handleResetCategories() {
    if (!confirm('Khôi phục danh sách 21 danh mục chuẩn của hệ thống?')) return;
    try {
      const res = await api.resetCategories();
      this.app.showToast(res.message, 'success');
      await this.loadCategories();
    } catch (e) {
      this.app.showToast(e.message || 'Lỗi khôi phục danh mục', 'error');
    }
  }
}
