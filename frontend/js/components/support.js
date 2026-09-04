import { api } from '../api.js?v=20260904_01';
import { formatDateVN, formatDateTimeVN } from '../utils/formatters.js?v=20260904_01';

export class SupportComponent {
  constructor(app) {
    this.app = app;
    this.tickets = [];
    this.activeFilter = 'all';
    window.fintrackSupport = this;
  }

  async render(container) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-500 text-xs animate-pulse">
        <i class="fa-solid fa-spinner fa-spin text-xl text-teal-400 mb-2 block"></i>
        Đang tải Trung Tâm Hỗ Trợ & Khiếu Nại...
      </div>
    `;

    try {
      const ticketsRes = await api.getMySupportTickets();
      this.tickets = (ticketsRes && ticketsRes.tickets) ? ticketsRes.tickets : (Array.isArray(ticketsRes) ? ticketsRes : []);
      this.renderContent(container);
    } catch (e) {
      console.warn('Support load error:', e);
      this.tickets = [];
      this.renderContent(container);
    }
  }

  renderContent(container) {
    const totalTickets = this.tickets.length;
    const openTickets = this.tickets.filter(t => t.status === 'OPEN').length;
    const inProgressTickets = this.tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PROCESSING').length;
    const resolvedTickets = this.tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    container.innerHTML = `
      <div id="tab-support" class="user-tab-pane w-full max-w-[1700px] mx-auto px-2 sm:px-4 space-y-7 transition-all duration-300 ease-in-out animate-in fade-in">
        
        <!-- Header Banner -->
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-950/60 via-slate-900/90 to-cyan-950/50 border border-teal-500/30 shadow-2xl">
          <div class="absolute -right-8 -top-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold mb-2.5">
                <span class="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                <span>TRUNG TÂM HỖ TRỢ KHÁCH HÀNG 24/7</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">Hỗ Trợ Kỹ Thuật & Khiếu Nại</h1>
              <p class="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Đội ngũ Quản trị viên & Kỹ sư FinTrack AI luôn sẵn sàng tiếp nhận khiếu nại đối soát nạp VIP, hỗ trợ Open Banking và giải quyết yêu cầu kỹ thuật tức thời.
              </p>
            </div>

            <!-- KPI Counters -->
            <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div class="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-teal-500/30 text-center">
                <span class="text-[10px] text-slate-400 font-mono block uppercase">Tổng Ticket</span>
                <span class="text-base font-black text-teal-300 font-mono">${totalTickets}</span>
              </div>
              <div class="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                <span class="text-[10px] text-slate-400 font-mono block uppercase">Chờ Xử Lý</span>
                <span class="text-base font-black text-rose-400 font-mono">${openTickets}</span>
              </div>
              <div class="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center">
                <span class="text-[10px] text-slate-400 font-mono block uppercase">Đã Phản Hồi</span>
                <span class="text-base font-black text-emerald-400 font-mono">${resolvedTickets}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main 2-Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- KHU VỰC 1: FORM GỬI YÊU CẦU / KHIẾU NẠI MỚI (5 / 12) -->
          <div class="lg:col-span-5 glass-card p-6 rounded-3xl space-y-4 border border-teal-500/30 shadow-xl bg-slate-950/80 sticky top-4">
            <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg border border-teal-500/30 flex-shrink-0">
                <i class="fa-solid fa-paper-plane"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-100">Gửi Yêu Cầu / Khiếu Nại Mới</h3>
                <p class="text-[11px] text-slate-400">Ban Quản Trị sẽ phản hồi vào hòm thư tài khoản</p>
              </div>
            </div>

            <form id="user-support-form" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Tiêu Đề Yêu Cầu <span class="text-rose-400">*</span>
                </label>
                <input type="text" id="user-ticket-title" required 
                  placeholder="Ví dụ: Đã chuyển khoản nhưng chưa duyệt VIP, Lỗi bóc tách AI..." 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500 placeholder:text-slate-500" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phân Loại Vấn Đề
                  </label>
                  <select id="user-ticket-category" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500 font-medium">
                    <option value="BILLING">💳 Giao dịch & Nạp VIP</option>
                    <option value="AI_PARSER">🤖 Lỗi AI bóc tách chi tiêu</option>
                    <option value="TECHNICAL">⚙️ Lỗi kỹ thuật / Open Banking</option>
                    <option value="ACCOUNT">🔒 Bảo mật & Tài khoản</option>
                    <option value="FEATURE_REQUEST">💡 Góp ý tính năng mới</option>
                    <option value="OTHER">❓ Vấn đề khác</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Mức Độ Ưu Tiên
                  </label>
                  <select id="user-ticket-priority" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500 font-medium">
                    <option value="MEDIUM">🟡 Bình thường (Medium)</option>
                    <option value="HIGH">🟠 Cao (High)</option>
                    <option value="URGENT">🔴 Khẩn cấp (Urgent)</option>
                    <option value="LOW">🟢 Thấp (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nội Dung Chi Tiết <span class="text-rose-400">*</span>
                </label>
                <textarea id="user-ticket-message" rows="5" required 
                  placeholder="Mô tả cụ thể vấn đề bạn đang gặp phải (Ví dụ: Mã đơn hàng #ORD-849201, số tiền 99.000đ, ảnh chụp giao dịch...)" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-500 placeholder:text-slate-500"></textarea>
              </div>

              <div class="p-3 rounded-2xl bg-teal-950/30 border border-teal-500/20 text-[11px] text-teal-300 leading-relaxed">
                <i class="fa-solid fa-circle-check text-teal-400 mr-1"></i>
                Yêu cầu của bạn sẽ được gửi thẳng tới hàng chờ duyệt của <b>Root Admin</b> và <b>Moderator</b> để xử lý ngay.
              </div>

              <button type="submit" id="btn-submit-user-ticket" 
                class="w-full py-3 rounded-xl gradient-emerald text-white font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Gửi Yêu Cầu Tới Ban Quản Trị</span>
              </button>
            </form>
          </div>

          <!-- KHU VỰC 2: LỊCH SỬ YÊU CẦU CỦA TÔI (7 / 12) -->
          <div class="lg:col-span-7 space-y-4">
            
            <div class="glass-card p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-slate-100">Lịch Sử Yêu Cầu Của Tôi</h3>
                <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">${totalTickets} ticket</span>
              </div>

              <!-- Filter Pills -->
              <div class="flex items-center gap-1.5 flex-wrap text-[11px]">
                <button type="button" class="ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition ${this.activeFilter === 'all' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}" data-filter="all">Tất cả</button>
                <button type="button" class="ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition ${this.activeFilter === 'open' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}" data-filter="open">🔴 Chờ duyệt</button>
                <button type="button" class="ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition ${this.activeFilter === 'progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}" data-filter="progress">🟡 Đang xử lý</button>
                <button type="button" class="ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition ${this.activeFilter === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}" data-filter="resolved">🟢 Đã giải quyết</button>
              </div>
            </div>

            <!-- Tickets List Feed -->
            <div id="user-tickets-feed" class="space-y-3.5">
              ${this.renderTicketsListHtml()}
            </div>

          </div>

        </div>

      </div>
    `;

    // Handle Form Submit
    const form = document.getElementById('user-support-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('user-ticket-title')?.value.trim();
      const category = document.getElementById('user-ticket-category')?.value;
      const priority = document.getElementById('user-ticket-priority')?.value;
      const message = document.getElementById('user-ticket-message')?.value.trim();
      const submitBtn = document.getElementById('btn-submit-user-ticket');

      if (!title || !message) return;

      try {
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...`;
          submitBtn.disabled = true;
        }

        const res = await api.createSupportTicket({ title, category, priority, message });
        this.app.showToast(res.message || 'Yêu cầu hỗ trợ đã được gửi thành công!', 'success');

        // Reset form
        form.reset();

        // Refresh tickets
        const ticketsRes = await api.getMySupportTickets();
        this.tickets = (ticketsRes && ticketsRes.tickets) ? ticketsRes.tickets : (Array.isArray(ticketsRes) ? ticketsRes : []);

        const feedEl = document.getElementById('user-tickets-feed');
        if (feedEl) feedEl.innerHTML = this.renderTicketsListHtml();
        this.bindTicketEvents();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi khi gửi yêu cầu hỗ trợ', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Gửi Yêu Cầu Tới Ban Quản Trị</span>`;
          submitBtn.disabled = false;
        }
      }
    });

    // Filter Buttons
    container.querySelectorAll('.ticket-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.getAttribute('data-filter') || 'all';
        container.querySelectorAll('.ticket-filter-btn').forEach(b => {
          if (b === btn) {
            b.className = 'ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition bg-teal-500/20 text-teal-300 border border-teal-500/40';
          } else {
            b.className = 'ticket-filter-btn px-2.5 py-1 rounded-xl font-bold transition bg-slate-900 text-slate-400 border border-slate-800';
          }
        });
        const feedEl = document.getElementById('user-tickets-feed');
        if (feedEl) feedEl.innerHTML = this.renderTicketsListHtml();
        this.bindTicketEvents();
      });
    });

    this.bindTicketEvents();
  }

  renderTicketsListHtml() {
    let filtered = this.tickets;
    if (this.activeFilter === 'open') {
      filtered = this.tickets.filter(t => t.status === 'OPEN');
    } else if (this.activeFilter === 'progress') {
      filtered = this.tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PROCESSING');
    } else if (this.activeFilter === 'resolved') {
      filtered = this.tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }

    if (filtered.length === 0) {
      return `
        <div class="glass-card p-10 rounded-3xl text-center text-slate-500 text-xs border border-slate-800">
          <i class="fa-regular fa-comments text-3xl text-slate-600 mb-2 block"></i>
          Không tìm thấy yêu cầu hỗ trợ nào trong mục này.
        </div>
      `;
    }

    const catLabels = {
      'BILLING': '💳 Giao dịch & VIP',
      'AI_PARSER': '🤖 Lỗi AI bóc tách',
      'TECHNICAL': '⚙️ Kỹ thuật',
      'ACCOUNT': '🔒 Bảo mật & Tài khoản',
      'FEATURE_REQUEST': '💡 Góp ý tính năng',
      'OTHER': '❓ Khác'
    };

    return filtered.map(t => {
      const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
      const isOpen = t.status === 'OPEN';
      const isProgress = t.status === 'IN_PROGRESS' || t.status === 'PROCESSING';

      const catText = catLabels[t.category] || t.category || 'Hỗ trợ';

      return `
        <div class="glass-card p-5 rounded-3xl border border-slate-800/90 hover:border-teal-500/40 transition-all duration-200 space-y-3 relative group">
          
          <!-- Top Row -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono font-bold text-teal-400 text-xs">#${t.ticket_code}</span>
                <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                  ${catText}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">${t.created_at || '---'}</span>
              </div>
              <h4 class="text-sm font-black text-slate-100 mt-1 leading-snug">${t.title}</h4>
            </div>

            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${isOpen ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
              ${isOpen ? '🔴 Chờ duyệt' : isResolved ? '🟢 Đã giải quyết' : '🟡 Đang xử lý'}
            </span>
          </div>

          <!-- Message Body -->
          <p class="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/60">
            ${t.message}
          </p>

          <!-- Admin Reply Highlight Box if Available -->
          ${t.admin_reply ? `
            <div class="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900/90 to-cyan-950/30 border border-teal-500/40 space-y-2">
              <div class="flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-2 text-teal-300 font-black">
                  <i class="fa-solid fa-reply"></i>
                  <span>Phản hồi chính thức từ Ban Quản Trị</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">${t.replied_at || 'Vừa xong'}</span>
              </div>
              <p class="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-teal-400 font-medium">
                ${t.admin_reply}
              </p>
              ${t.replied_by ? `
                <div class="text-[10px] text-slate-400 font-mono text-right">
                  Xử lý bởi: <b class="text-teal-300 font-sans">${t.replied_by}</b>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="text-[11px] text-slate-400 italic flex items-center gap-1.5">
              <i class="fa-solid fa-clock text-amber-400"></i>
              <span>Yêu cầu đang nằm trong hàng chờ phản hồi của Ban Quản Trị...</span>
            </div>
          `}

          <!-- Footer Actions -->
          <div class="flex items-center justify-end pt-1">
            <button type="button" class="btn-view-ticket-detail text-xs font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1" data-id="${t.id}">
              <span>Xem chi tiết đối thoại</span>
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  bindTicketEvents() {
    document.querySelectorAll('.btn-view-ticket-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const tId = parseInt(btn.getAttribute('data-id'));
        const ticket = this.tickets.find(t => t.id === tId);
        if (ticket) {
          this.openTicketDetailModal(ticket);
        }
      });
    });
  }

  openTicketDetailModal(t) {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
    const isOpen = t.status === 'OPEN';

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-teal-500/30 animate-in fade-in zoom-in duration-200 space-y-4">
          
          <button id="user-ticket-detail-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg border border-teal-500/30 flex-shrink-0">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-teal-400 text-xs">#${t.ticket_code}</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isOpen ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                  ${isOpen ? 'Chờ duyệt' : isResolved ? 'Đã giải quyết' : 'Đang xử lý'}
                </span>
              </div>
              <h3 class="text-sm font-black text-slate-100 mt-0.5">${t.title}</h3>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nội dung bạn đã gửi:</span>
              <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                ${t.message}
              </div>
              <span class="text-[10px] text-slate-500 font-mono mt-1 block">Gửi lúc: ${t.created_at || '---'}</span>
            </div>

            ${t.admin_reply ? `
              <div class="pt-2">
                <span class="text-[10px] font-bold text-teal-300 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <i class="fa-solid fa-shield-halved"></i>
                  <span>Giải đáp từ Ban Quản Trị / Kỹ Thuật:</span>
                </span>
                <div class="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/40 text-slate-100 whitespace-pre-wrap leading-relaxed">
                  ${t.admin_reply}
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                  <span>Phản hồi bởi: <b class="text-teal-300 font-sans">${t.replied_by || 'Admin'}</b></span>
                  <span>Thời gian: ${t.replied_at || '---'}</span>
                </div>
              </div>
            ` : `
              <div class="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs">
                ⏳ Yêu cầu của bạn đang được Quản trị viên tiếp nhận và xử lý. Bạn sẽ nhận được thông báo chuông ngay khi có phản hồi.
              </div>
            `}
          </div>

          <button type="button" id="btn-close-ticket-detail" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition">
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    `;

    document.getElementById('user-ticket-detail-close')?.addEventListener('click', () => { modalEl.innerHTML = ''; });
    document.getElementById('btn-close-ticket-detail')?.addEventListener('click', () => { modalEl.innerHTML = ''; });
  }
}
