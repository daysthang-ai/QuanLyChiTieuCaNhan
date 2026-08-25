import { api } from '../api.js?v=4.9';
import { formatVND, formatDateVN } from '../utils/formatters.js?v=4.9';

export class AIAssistantComponent {
  constructor(app) {
    this.app = app;
    this.chatHistory = [
      {
        role: 'assistant',
        text: `Xin chào ${this.app.currentUser ? this.app.currentUser.full_name : 'bạn'}! Tôi là **Trợ lý Tài chính FinTrack AI** 🤖.\n\nTôi có thể giúp bạn kiểm tra dòng tiền, rà soát hạn mức ngân sách hoặc lập kế hoạch tiết kiệm thông minh. Bạn có thể chọn câu hỏi mẫu bên dưới hoặc gõ trực tiếp câu hỏi của mình!`
      }
    ];
  }

  // =========================================================================
  // 1. QUICK AI TRANSACTION MODAL (NL Parser)
  // =========================================================================
  openQuickParserModal() {
    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in duration-200 text-slate-100">
          
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl gradient-indigo text-white flex items-center justify-center text-xs shadow-md shadow-indigo-500/30">
                <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
              </span>
              <div>
                <h3 class="text-base font-black text-slate-100">Nhập Giao Dịch Bằng AI</h3>
                <p class="text-[11px] text-slate-400">Tự động bóc tách số tiền, danh mục, ví từ câu nói tự nhiên</p>
              </div>
            </div>
            <button id="quick-modal-close" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nhập câu nói tự nhiên tiếng Việt:</label>
              <div class="relative">
                <textarea id="ai-input-text" rows="2" placeholder="Ví dụ: Ăn trưa bún bò 45k trả qua MoMo hôm qua" 
                  class="w-full p-3 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-medium"></textarea>
              </div>
            </div>

            <!-- Quick prompt chips -->
            <div>
              <span class="text-[11px] text-slate-400 font-semibold block mb-1.5">Gợi ý câu mẫu:</span>
              <div class="flex flex-wrap gap-1.5">
                <button type="button" class="quick-chip text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700 font-medium text-slate-300 transition" data-text="Ăn trưa bún bò 45k trả qua MoMo hôm qua">
                  🍲 Ăn trưa bún bò 45k MoMo
                </button>
                <button type="button" class="quick-chip text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700 font-medium text-slate-300 transition" data-text="Nhận lương công ty 28 triệu vào Techcombank">
                  💵 Lương 28tr vào Techcombank
                </button>
                <button type="button" class="quick-chip text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700 font-medium text-slate-300 transition" data-text="Đổ xăng xe máy 90k tiền mặt">
                  🛵 Đổ xăng 90k tiền mặt
                </button>
                <button type="button" class="quick-chip text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700 font-medium text-slate-300 transition" data-text="Mua cà phê Highland 45k MoMo sáng nay">
                  ☕ Cà phê Highland 45k
                </button>
              </div>
            </div>

            <button id="btn-parse-ai" class="w-full py-2.5 rounded-xl gradient-indigo text-white font-bold text-xs shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
              <span>Bóc Tách Thông Tin Bằng AI</span>
            </button>

            <!-- Live Result Preview Card -->
            <div id="ai-parse-preview" class="hidden p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 animate-in fade-in">
              <!-- Rendered upon AI parse success -->
            </div>

          </div>

        </div>
      </div>
    `;

    const close = () => { modalEl.innerHTML = ''; };
    document.getElementById('quick-modal-close')?.addEventListener('click', close);

    // Chip click
    document.querySelectorAll('.quick-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const input = document.getElementById('ai-input-text');
        if (input) input.value = text;
        document.getElementById('btn-parse-ai')?.click();
      });
    });

    // Parse button click
    document.getElementById('btn-parse-ai')?.addEventListener('click', async () => {
      const rawText = document.getElementById('ai-input-text')?.value?.trim();
      if (!rawText) {
        this.app.showToast('Vui lòng nhập câu mô tả thu chi', 'warning');
        return;
      }

      const parseBtn = document.getElementById('btn-parse-ai');
      const originalText = parseBtn.innerHTML;
      parseBtn.disabled = true;
      parseBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> AI đang phân tích dữ liệu...`;

      try {
        const result = await api.parseTransactionWithAI(rawText);
        this.renderParsedPreview(result, close);
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi bóc tách AI', 'error');
      } finally {
        parseBtn.disabled = false;
        parseBtn.innerHTML = originalText;
      }
    });
  }

  renderParsedPreview(parsed, closeCallback) {
    const previewEl = document.getElementById('ai-parse-preview');
    if (!previewEl) return;

    const isIncome = parsed.type === 'INCOME';
    const isTransfer = parsed.type === 'TRANSFER';
    const typeColor = isIncome ? 'text-emerald-400' : isTransfer ? 'text-indigo-400' : 'text-rose-400';
    const typeLabel = isIncome ? '📥 Thu nhập' : isTransfer ? '🔄 Chuyển tiền' : '💸 Chi tiêu';

    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          Kết Quả Phân Tích AI
        </span>
        <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
          Độ tin cậy: ${Math.round((parsed.confidence || 0.95) * 100)}%
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2.5 text-xs">
        <div>
          <span class="text-slate-400 block text-[10px]">Loại:</span>
          <span class="font-bold ${typeColor}">${typeLabel}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">Số tiền:</span>
          <span class="font-black text-slate-100 text-sm font-mono">${formatVND(parsed.amount)}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">Danh mục:</span>
          <span class="font-bold text-slate-200">${parsed.category_name || 'Chung'}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">Ví thanh toán:</span>
          <span class="font-bold text-slate-200">${parsed.wallet_name || 'Tiền mặt'}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">Ngày phát sinh:</span>
          <span class="font-medium text-slate-300 font-mono">${formatDateVN(parsed.transaction_date)}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[10px]">Ghi chú:</span>
          <span class="font-medium text-slate-300 truncate block">${parsed.note || 'Không có'}</span>
        </div>
      </div>

      <button id="btn-confirm-save-ai-tx" class="w-full py-2.5 rounded-xl gradient-emerald text-white font-bold text-xs shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center justify-center gap-2 mt-3">
        <i class="fa-solid fa-check"></i>
        <span>Xác Nhận & Lưu Vào Hệ Thống</span>
      </button>
    `;

    document.getElementById('btn-confirm-save-ai-tx')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('btn-confirm-save-ai-tx');
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang lưu...`;

      try {
        await api.createTransaction({
          wallet_id: parsed.wallet_id,
          category_id: parsed.category_id,
          type: parsed.type,
          amount: parsed.amount,
          transaction_date: parsed.transaction_date + 'T12:00:00',
          note: parsed.note,
          created_by_ai: 'AI_PARSED'
        });

        this.app.showToast(`Đã lưu giao dịch ${formatVND(parsed.amount)} thành công!`, 'success');
        closeCallback();
        // Refresh active view
        this.app.refreshCurrentView();
      } catch (err) {
        this.app.showToast(err.message || 'Lỗi lưu giao dịch', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> Xác Nhận & Lưu Vào Hệ Thống`;
      }
    });
  }

  // =========================================================================
  // 2. FULL AI ASSISTANT CHAT VIEW
  // =========================================================================
  async render(container) {
    container.innerHTML = `
      <div class="h-[calc(100vh-140px)] flex flex-col glass-card rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-300 border border-slate-800">
        
        <!-- Chat Header -->
        <div class="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl gradient-indigo text-white flex items-center justify-center text-lg shadow-md shadow-indigo-500/30">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h2 class="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <span>Cố Vấn Tài Chính FinTrack AI</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald animate-pulse"></span>
              </h2>
              <p class="text-[11px] text-slate-400">Trí tuệ nhân tạo hỗ trợ phân tích dòng tiền và tối ưu tiết kiệm 24/7</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-clear-chat" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 active:scale-95">
              <i class="fa-solid fa-trash-can text-[10px] text-rose-400"></i>
              <span>Xóa Lịch Sử</span>
            </button>
          </div>
        </div>

        <!-- Chat Message Thread -->
        <div id="ai-chat-thread" class="flex-1 p-5 overflow-y-auto space-y-4 bg-[#080d1a]">
          ${this.renderChatMessages()}
        </div>

        <!-- Prompt Suggestions Pills -->
        <div class="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span class="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-2">Gợi ý nhanh:</span>
          <button class="chat-prompt-pill text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 font-medium whitespace-nowrap transition active:scale-95"
            data-query="Đánh giá sức khỏe tài chính tháng này theo chuẩn 50/30/20?">
            🩺 Đánh giá sức khỏe 50/30/20
          </button>
          <button class="chat-prompt-pill text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 font-medium whitespace-nowrap transition active:scale-95"
            data-query="Tháng này tôi đã chi tiêu bao nhiêu tiền cho ăn uống và đi lại?">
            🍕 Chi tiêu ăn uống & đi lại
          </button>
          <button class="chat-prompt-pill text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 font-medium whitespace-nowrap transition active:scale-95"
            data-query="Tôi có đang vượt hạn mức ngân sách danh mục nào không?">
            🚨 Kiểm tra vượt ngân sách
          </button>
          <button class="chat-prompt-pill text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 font-medium whitespace-nowrap transition active:scale-95"
            data-query="Gợi ý cho tôi 3 hành động cụ thể để tiết kiệm thêm 2 triệu tháng tới?">
            💡 3 cách tiết kiệm 2 triệu
          </button>
        </div>

        <!-- Input Bar -->
        <div class="p-3.5 bg-slate-900 border-t border-slate-800">
          <form id="ai-chat-form" class="flex items-center gap-2">
            <input type="text" id="ai-chat-input" placeholder="Hỏi AI về chi tiêu, ngân sách, cách tiết kiệm..." 
              class="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium" />
            <button type="submit" id="btn-send-chat" class="px-5 py-2.5 rounded-xl gradient-indigo text-white font-bold text-xs shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition flex items-center gap-1.5">
              <span>Gửi</span>
              <i class="fa-solid fa-paper-plane text-[10px]"></i>
            </button>
          </form>
        </div>

      </div>
    `;

    this.scrollToBottom();

    // Event listeners
    document.getElementById('ai-chat-form')?.addEventListener('submit', (e) => this.handleSendMessage(e));
    document.getElementById('btn-clear-chat')?.addEventListener('click', () => {
      this.chatHistory = [{
        role: 'assistant',
        text: 'Lịch sử trò chuyện đã được làm mới. Bạn muốn hỏi tôi điều gì?'
      }];
      const thread = document.getElementById('ai-chat-thread');
      if (thread) thread.innerHTML = this.renderChatMessages();
    });

    document.querySelectorAll('.chat-prompt-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        const input = document.getElementById('ai-chat-input');
        if (input) input.value = query;
        document.getElementById('ai-chat-form')?.dispatchEvent(new Event('submit'));
      });
    });
  }

  renderChatMessages() {
    return this.chatHistory.map(m => {
      const isUser = m.role === 'user';
      if (isUser) {
        return `
          <div class="flex justify-end gap-3 chat-bubble-anim">
            <div class="gradient-indigo text-white p-3.5 rounded-2xl rounded-tr-none text-xs max-w-xl shadow-lg shadow-indigo-500/20 leading-relaxed font-medium">
              ${m.text}
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-700 shadow-sm">
              <i class="fa-regular fa-user"></i>
            </div>
          </div>
        `;
      } else {
        const html = this.renderMarkdownSimple(m.text);
        return `
          <div class="flex justify-start gap-3 chat-bubble-anim">
            <div class="w-8 h-8 rounded-2xl gradient-indigo text-white flex items-center justify-center text-xs flex-shrink-0 shadow-md shadow-indigo-500/30 float-ai">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-slate-900/90 p-4 rounded-2xl rounded-tl-none border border-slate-700/60 text-xs text-slate-200 max-w-2xl shadow-md leading-relaxed space-y-2">
              ${html}
            </div>
          </div>
        `;
      }
    }).join('');
  }

  async handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const query = input?.value?.trim();
    if (!query) return;

    // Add user message
    this.chatHistory.push({ role: 'user', text: query });
    if (input) input.value = '';

    const thread = document.getElementById('ai-chat-thread');
    if (thread) {
      thread.innerHTML = this.renderChatMessages() + `
        <div id="ai-typing-indicator" class="flex justify-start gap-3">
          <div class="w-8 h-8 rounded-2xl gradient-indigo text-white flex items-center justify-center text-xs">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="bg-slate-900/90 p-3 rounded-2xl border border-slate-700/60 text-xs text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.15s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.3s"></span>
            <span class="ml-1 text-[11px] text-slate-300 font-mono">FinTrack AI đang xử lý dữ liệu...</span>
          </div>
        </div>
      `;
    }
    this.scrollToBottom();

    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await api.chatWithAI(query);
      const reply = res.response_markdown || res.reply || res.message || 'Đã nhận được thông tin từ bạn!';
      this.chatHistory.push({ role: 'assistant', text: reply });
      if (thread) thread.innerHTML = this.renderChatMessages();
      this.scrollToBottom();
    } catch (err) {
      this.chatHistory.push({ role: 'assistant', text: `⚠️ Đã có lỗi xảy ra: ${err.message}` });
      if (thread) thread.innerHTML = this.renderChatMessages();
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  scrollToBottom() {
    const thread = document.getElementById('ai-chat-thread');
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }

  renderMarkdownSimple(md) {
    if (!md) return '';
    let text = md;

    // Horizontal rule
    text = text.replace(/^---$/gim, '<hr class="border-slate-800 my-2.5" />');

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-xs font-bold text-slate-100 mt-2.5 mb-1">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-sm font-bold text-indigo-200 mt-3 mb-1.5">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-base font-black text-white mt-3 mb-2">$1</h1>');

    // Bold & Italic
    text = text.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-white">$1</strong>');
    text = text.replace(/\*(.*?)\*/gim, '<em class="text-slate-300 italic">$1</em>');

    // Inline code
    text = text.replace(/`([^`]+)`/gim, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px] border border-slate-800">$1</code>');

    // Lists
    text = text.replace(/^[\•\-\*]\s+(.*$)/gim, '<li class="ml-3 list-disc text-slate-300 my-0.5">$1</li>');
    text = text.replace(/^(\d+)\.\s+(.*$)/gim, '<li class="ml-3 list-decimal text-slate-300 my-0.5"><span class="font-semibold text-slate-200">$2</span></li>');

    // Line breaks
    text = text.replace(/\n\n/gim, '<div class="h-2"></div>');
    text = text.replace(/\n/gim, '<br/>');

    return text;
  }
}
