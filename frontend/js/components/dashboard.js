import { api } from '../api.js';
import { formatVND, formatDateVN, getCurrentMonthStr } from '../utils/formatters.js';

/**
 * Mock data chuyên sâu theo mốc thời gian phục vụ so sánh trực quan:
 * - this_month: Tháng 09/2026 (Hiện tại)
 * - last_month: Tháng 08/2026 (Đối chiếu tháng trước)
 * - this_quarter: Quý 3/2026 (Lũy kế T07 - T09/2026)
 */
export const DASHBOARD_PERIOD_DATA = {
  this_month: {
    periodKey: 'this_month',
    monthStr: '2026-09',
    label: 'Tháng 09/2026 (Hiện tại)',
    compareLabel: 'so với tháng trước',
    kpis: {
      total_net_worth: 185450000,
      total_income_month: 38500000,
      total_expense_month: 19250000,
      net_savings_month: 19250000,
      savings_rate_month: 50.0,
      income_change_vs_last_month_pct: 12.6,
      expense_change_vs_last_month_pct: -8.2,
      active_budget_alerts_count: 1,
      currency: 'VND'
    },
    cashflow: [
      { month: '2026-04', label: 'T04/26', income: 32000000, expense: 18000000, net_savings: 14000000 },
      { month: '2026-05', label: 'T05/26', income: 34000000, expense: 20000000, net_savings: 14000000 },
      { month: '2026-06', label: 'T06/26', income: 35000000, expense: 22000000, net_savings: 13000000 },
      { month: '2026-07', label: 'T07/26', income: 33000000, expense: 19000000, net_savings: 14000000 },
      { month: '2026-08', label: 'T08/26', income: 34200000, expense: 20980000, net_savings: 13220000 },
      { month: '2026-09', label: 'T09/26', income: 38500000, expense: 19250000, net_savings: 19250000 }
    ],
    breakdown: [
      { category_id: 1, category_name: 'Ăn uống & Tiêu dùng', total_amount: 6800000, percentage: 35.3 },
      { category_id: 2, category_name: 'Tiền nhà & Tiện ích', total_amount: 5500000, percentage: 28.6 },
      { category_id: 3, category_name: 'Mua sắm & Công nghệ', total_amount: 3200000, percentage: 16.6 },
      { category_id: 4, category_name: 'Di chuyển & Xăng xe', total_amount: 2150000, percentage: 11.2 },
      { category_id: 5, category_name: 'Giải trí & Cafe', total_amount: 1600000, percentage: 8.3 }
    ],
    budgets: [
      { category: { name: 'Ăn uống & Tiêu dùng' }, spent_amount: 6800000, amount_limit: 8000000, percentage: 85.0, status: 'SAFE' },
      { category: { name: 'Tiền nhà & Tiện ích' }, spent_amount: 5500000, amount_limit: 6000000, percentage: 91.7, status: 'WARNING' },
      { category: { name: 'Mua sắm & Công nghệ' }, spent_amount: 3200000, amount_limit: 3000000, percentage: 106.7, status: 'OVERSPENT' },
      { category: { name: 'Giải trí & Cafe' }, spent_amount: 1600000, amount_limit: 2000000, percentage: 80.0, status: 'SAFE' }
    ],
    txs: [
      { id: 101, transaction_date: '2026-09-05T09:30:00', type: 'INCOME', amount: 35000000, note: 'Lương Techcombank T09/2026', category: { name: 'Lương & Thưởng', icon: 'money-bill-wave' }, wallet: { name: 'Techcombank' } },
      { id: 102, transaction_date: '2026-09-04T18:15:00', type: 'EXPENSE', amount: 5500000, note: 'Thanh toán căn hộ dịch vụ T09', category: { name: 'Tiền nhà & Tiện ích', icon: 'house' }, wallet: { name: 'Ví MoMo' } },
      { id: 103, transaction_date: '2026-09-03T11:45:00', type: 'EXPENSE', amount: 1450000, note: 'Đi chợ siêu thị Mega Market cuối tuần', category: { name: 'Ăn uống & Tiêu dùng', icon: 'utensils' }, wallet: { name: 'Visa Platinum' } },
      { id: 104, transaction_date: '2026-09-02T16:20:00', type: 'EXPENSE', amount: 650000, note: 'Đổ xăng xe ô tô Petrolimex', category: { name: 'Di chuyển & Xăng xe', icon: 'gas-pump' }, wallet: { name: 'Techcombank' } },
      { id: 105, transaction_date: '2026-09-02T10:00:00', type: 'EXPENSE', amount: 320000, note: 'Cafe làm việc cùng đối tác Phúc Long', category: { name: 'Giải trí & Cafe', icon: 'mug-hot' }, wallet: { name: 'Ví MoMo' } },
      { id: 106, transaction_date: '2026-09-01T08:30:00', type: 'INCOME', amount: 3500000, note: 'Lợi nhuận cổ tức & đầu tư Finhay', category: { name: 'Thu nhập phụ', icon: 'arrow-trend-up' }, wallet: { name: 'Techcombank' } }
    ]
  },
  last_month: {
    periodKey: 'last_month',
    monthStr: '2026-08',
    label: 'Tháng 08/2026 (Đối chiếu tháng trước)',
    compareLabel: 'so với tháng trước',
    kpis: {
      total_net_worth: 166200000,
      total_income_month: 34200000,
      total_expense_month: 20980000,
      net_savings_month: 13220000,
      savings_rate_month: 38.7,
      income_change_vs_last_month_pct: -3.5,
      expense_change_vs_last_month_pct: 10.4,
      active_budget_alerts_count: 2,
      currency: 'VND'
    },
    cashflow: [
      { month: '2026-03', label: 'T03/26', income: 30000000, expense: 17000000, net_savings: 13000000 },
      { month: '2026-04', label: 'T04/26', income: 32000000, expense: 18000000, net_savings: 14000000 },
      { month: '2026-05', label: 'T05/26', income: 34000000, expense: 20000000, net_savings: 14000000 },
      { month: '2026-06', label: 'T06/26', income: 35000000, expense: 22000000, net_savings: 13000000 },
      { month: '2026-07', label: 'T07/26', income: 33000000, expense: 19000000, net_savings: 14000000 },
      { month: '2026-08', label: 'T08/26', income: 34200000, expense: 20980000, net_savings: 13220000 }
    ],
    breakdown: [
      { category_id: 1, category_name: 'Ăn uống & Tiêu dùng', total_amount: 7450000, percentage: 35.5 },
      { category_id: 2, category_name: 'Tiền nhà & Tiện ích', total_amount: 5500000, percentage: 26.2 },
      { category_id: 6, category_name: 'Du lịch hè Đà Nẵng', total_amount: 4200000, percentage: 20.0 },
      { category_id: 4, category_name: 'Di chuyển & Xăng xe', total_amount: 2100000, percentage: 10.0 },
      { category_id: 5, category_name: 'Giải trí & Mua sắm', total_amount: 1730000, percentage: 8.3 }
    ],
    budgets: [
      { category: { name: 'Du lịch hè Đà Nẵng' }, spent_amount: 4200000, amount_limit: 3500000, percentage: 120.0, status: 'OVERSPENT' },
      { category: { name: 'Ăn uống & Tiêu dùng' }, spent_amount: 7450000, amount_limit: 7500000, percentage: 99.3, status: 'WARNING' },
      { category: { name: 'Tiền nhà & Tiện ích' }, spent_amount: 5500000, amount_limit: 5500000, percentage: 100.0, status: 'WARNING' },
      { category: { name: 'Di chuyển & Xe cộ' }, spent_amount: 2100000, amount_limit: 2500000, percentage: 84.0, status: 'SAFE' }
    ],
    txs: [
      { id: 201, transaction_date: '2026-08-28T14:00:00', type: 'EXPENSE', amount: 4200000, note: 'Combo vé máy bay & resort nghỉ hè Đà Nẵng', category: { name: 'Du lịch & Nghỉ dưỡng', icon: 'plane' }, wallet: { name: 'Visa Platinum' } },
      { id: 202, transaction_date: '2026-08-20T09:00:00', type: 'INCOME', amount: 30700000, note: 'Lương Techcombank T08/2026', category: { name: 'Lương & Thưởng', icon: 'money-bill-wave' }, wallet: { name: 'Techcombank' } },
      { id: 203, transaction_date: '2026-08-15T19:30:00', type: 'EXPENSE', amount: 5500000, note: 'Tiền căn hộ dịch vụ tháng 8', category: { name: 'Tiền nhà & Tiện ích', icon: 'house' }, wallet: { name: 'Ví MoMo' } },
      { id: 204, transaction_date: '2026-08-10T12:30:00', type: 'EXPENSE', amount: 1850000, note: 'Tiệc sinh nhật đồng nghiệp King BBQ', category: { name: 'Ăn uống & Tiêu dùng', icon: 'utensils' }, wallet: { name: 'Visa Platinum' } },
      { id: 205, transaction_date: '2026-08-05T08:00:00', type: 'INCOME', amount: 3500000, note: 'Lợi tức đầu tư chứng khoán SSI', category: { name: 'Thu nhập phụ', icon: 'arrow-trend-up' }, wallet: { name: 'Techcombank' } },
      { id: 206, transaction_date: '2026-08-02T15:45:00', type: 'EXPENSE', amount: 850000, note: 'Bảo dưỡng định kỳ xe ô tô Toyota', category: { name: 'Di chuyển & Xe cộ', icon: 'wrench' }, wallet: { name: 'Ví MoMo' } }
    ]
  },
  this_quarter: {
    periodKey: 'this_quarter',
    monthStr: '2026-Q3',
    label: 'Quý 3/2026 (T07 - T09/2026)',
    compareLabel: 'so với quý trước',
    kpis: {
      total_net_worth: 185450000,
      total_income_month: 105700000,
      total_expense_month: 59230000,
      net_savings_month: 46470000,
      savings_rate_month: 44.0,
      income_change_vs_last_month_pct: 18.5,
      expense_change_vs_last_month_pct: 6.2,
      active_budget_alerts_count: 2,
      currency: 'VND'
    },
    cashflow: [
      { month: '2025-Q4', label: 'Quý 4/25', income: 88000000, expense: 52000000, net_savings: 36000000 },
      { month: '2026-Q1', label: 'Quý 1/26', income: 92000000, expense: 56000000, net_savings: 36000000 },
      { month: '2026-Q2', label: 'Quý 2/26', income: 89200000, expense: 55800000, net_savings: 33400000 },
      { month: '2026-07', label: 'T07/26', income: 33000000, expense: 19000000, net_savings: 14000000 },
      { month: '2026-08', label: 'T08/26', income: 34200000, expense: 20980000, net_savings: 13220000 },
      { month: '2026-09', label: 'T09/26', income: 38500000, expense: 19250000, net_savings: 19250000 }
    ],
    breakdown: [
      { category_id: 1, category_name: 'Ăn uống & Tiêu dùng', total_amount: 21050000, percentage: 35.5 },
      { category_id: 2, category_name: 'Tiền nhà & Tiện ích', total_amount: 16500000, percentage: 27.9 },
      { category_id: 6, category_name: 'Du lịch & Nghỉ hè', total_amount: 8600000, percentage: 14.5 },
      { category_id: 3, category_name: 'Mua sắm & Thiết bị', total_amount: 7280000, percentage: 12.3 },
      { category_id: 4, category_name: 'Di chuyển & Phương tiện', total_amount: 5800000, percentage: 9.8 }
    ],
    budgets: [
      { category: { name: 'Ăn uống & Tiêu dùng Quý 3' }, spent_amount: 21050000, amount_limit: 24000000, percentage: 87.7, status: 'SAFE' },
      { category: { name: 'Tiền nhà & Tiện ích Quý 3' }, spent_amount: 16500000, amount_limit: 18000000, percentage: 91.7, status: 'SAFE' },
      { category: { name: 'Du lịch Nghỉ hè' }, spent_amount: 8600000, amount_limit: 8000000, percentage: 107.5, status: 'OVERSPENT' },
      { category: { name: 'Mua sắm & Thiết bị Quý 3' }, spent_amount: 7280000, amount_limit: 8000000, percentage: 91.0, status: 'WARNING' }
    ],
    txs: [
      { id: 301, transaction_date: '2026-09-05T09:30:00', type: 'INCOME', amount: 35000000, note: 'Lương Techcombank T09/2026', category: { name: 'Lương & Thưởng', icon: 'money-bill-wave' }, wallet: { name: 'Techcombank' } },
      { id: 302, transaction_date: '2026-08-28T14:00:00', type: 'EXPENSE', amount: 4200000, note: 'Combo vé máy bay & resort nghỉ hè Đà Nẵng', category: { name: 'Du lịch & Nghỉ dưỡng', icon: 'plane' }, wallet: { name: 'Visa Platinum' } },
      { id: 303, transaction_date: '2026-08-20T09:00:00', type: 'INCOME', amount: 30700000, note: 'Lương Techcombank T08/2026', category: { name: 'Lương & Thưởng', icon: 'money-bill-wave' }, wallet: { name: 'Techcombank' } },
      { id: 304, transaction_date: '2026-07-25T17:15:00', type: 'EXPENSE', amount: 3800000, note: 'Mua iPad Gen 10 & Apple Pencil học tập', category: { name: 'Mua sắm & Thiết bị', icon: 'laptop' }, wallet: { name: 'Visa Platinum' } },
      { id: 305, transaction_date: '2026-07-20T09:00:00', type: 'INCOME', amount: 32000000, note: 'Lương Techcombank T07/2026', category: { name: 'Lương & Thưởng', icon: 'money-bill-wave' }, wallet: { name: 'Techcombank' } },
      { id: 306, transaction_date: '2026-07-05T19:00:00', type: 'EXPENSE', amount: 5500000, note: 'Tiền căn hộ dịch vụ tháng 7', category: { name: 'Tiền nhà & Tiện ích', icon: 'house' }, wallet: { name: 'Ví MoMo' } }
    ]
  }
};

export class DashboardComponent {
  constructor(app) {
    this.app = app;
    this.cashflowChart = null;
    this.categoryChart = null;
    this.selectedMonth = getCurrentMonthStr();
    this.selectedPeriod = 'this_month';
    this.isBalanceHidden = localStorage.getItem('fintrack_hide_balance') === 'true';
    this.viewMode = localStorage.getItem('fintrack_dash_view_mode') || 'compact'; // 'compact' | 'detailed'
    this.isQuickTipsOpen = localStorage.getItem('fintrack_hide_quicktips') !== 'true';
    this.collapsedCards = {
      cashflow: false,
      category: false,
      budget: false,
      recent_txs: false
    };
    this.currentKPIs = null;
    this.currentCashflowData = null;
    this.currentCategoryData = null;
    this.initialCashflowLoaded = false;
    this.initialCategoryLoaded = false;
  }

  async render(container) {
    container.innerHTML = `
      <div id="view-dashboard" data-tab-id="dashboard" class="content-section user-tab-pane space-y-6 pb-10 animate-in fade-in duration-300">
        
        <!-- Header & Quick Actions -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Tổng Quan Tài Chính</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">Live</span>
              <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="Bảng điều khiển trung tâm hiển thị toàn diện sức khỏe tài chính, dòng tiền và ngân sách của bạn."><i class="fa-solid fa-circle-question text-xs"></i></span>
            </h1>
            <p class="text-slate-300 text-xs mt-1 font-medium" id="dashboard-period-subtitle">
              Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-cyan-400">${this.getPeriodSubtitle()}</span>
            </p>
          </div>

          <!-- Time Filter & Action Bar -->
          <div class="flex flex-wrap items-center gap-2.5">
            
            <!-- Information Density / View Mode Switcher (Chống ngợp cho người mới) -->
            <div class="dash-view-mode-wrapper flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner" title="Chọn chế độ hiển thị: Gọn gàng (Tổng quan trực quan) hoặc Đầy đủ (Phân tích chuyên sâu)">
              <button type="button" id="btn-view-mode-compact" class="dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto ${this.viewMode === 'compact' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}">
                <i class="fa-solid fa-compress text-[11px]"></i>
                <span>Gọn Gàng</span>
              </button>
              <button type="button" id="btn-view-mode-detailed" class="dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto ${this.viewMode === 'detailed' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}">
                <i class="fa-solid fa-chart-line text-[11px]"></i>
                <span>Đầy Đủ</span>
              </button>
            </div>

            <!-- Quick Time Filter Pills -->
            <div class="dash-period-wrapper flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative z-20 pointer-events-auto ${this.selectedPeriod === 'this_month' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}" data-period="this_month">
                Tháng này
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative z-20 pointer-events-auto ${this.selectedPeriod === 'last_month' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}" data-period="last_month">
                Tháng trước
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative z-20 pointer-events-auto ${this.selectedPeriod === 'this_quarter' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}" data-period="this_quarter">
                Quý này
              </button>
            </div>

            <!-- Month Picker -->
            <div class="dash-month-picker-wrapper flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <i class="fa-regular fa-calendar text-slate-300 text-xs"></i>
              <input type="month" id="dashboard-month-picker" value="${this.selectedMonth}" 
                class="font-bold text-cyan-400 bg-transparent border-0 focus:outline-none cursor-pointer text-xs" title="Chọn tháng cụ thể" />
            </div>

            <!-- Primary Add Transaction Action -->
            <button id="btn-add-tx-top" type="button" onclick="window.openTransactionModal()" class="btn-sparkle-burst px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 active:scale-95 transition-all duration-200 flex items-center gap-1.5 transform-gpu cursor-pointer relative z-20 pointer-events-auto">
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Ghi Thu - Chi</span>
            </button>

          </div>
        </div>

        <!-- Quick Tips & Interactive 1-Click Guide (Khu vực Trợ giúp nhanh chống ngợp cho người mới) -->
        <div id="dashboard-quick-tips-container" class="glass-card dashboard-quick-tips-banner rounded-2xl p-4 sm:p-5 border border-cyan-500/35 transition-all duration-300">
          <div class="quick-tips-header-row flex items-center justify-between gap-3 ${this.isQuickTipsOpen ? 'mb-3 border-b border-slate-800/80 quick-tips-divider pb-2.5' : ''}">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-cyan-500/25 shrink-0">
                <i class="fa-solid fa-lightbulb"></i>
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-100 flex items-center gap-2">
                  <span>Hướng Dẫn 1-Click Cho Người Mới Bắt Đầu</span>
                  <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Mẹo Nhanh</span>
                </h4>
                <p class="text-xs text-slate-300 font-medium mt-0.5">Bắt đầu quản lý tài chính thông minh chỉ với 3 thao tác đơn giản:</p>
              </div>
            </div>
            <button id="btn-toggle-quick-tips" type="button" class="quick-tips-toggle-btn text-xs font-bold text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition cursor-pointer shrink-0">
              <span id="quick-tips-toggle-text">${this.isQuickTipsOpen ? 'Thu gọn mẹo' : 'Mở rộng mẹo'}</span>
              <i id="quick-tips-toggle-icon" class="fa-solid ${this.isQuickTipsOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[11px]"></i>
            </button>
          </div>

          <!-- 3 Action Steps Grid -->
          <div id="quick-tips-content" class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${this.isQuickTipsOpen ? '' : 'hidden'}">
            <!-- Step 1: Nhập giao dịch AI -->
            <div class="quick-tip-card quick-tip-step-1 p-3.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 flex flex-col justify-between transition-all group">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 inline-flex items-center justify-center text-[10px] font-black">1</span>
                    BƯỚC 1
                  </span>
                  <span class="text-[11px] text-amber-400 font-bold">⚡ Tiện lợi nhất</span>
                </div>
                <h5 class="text-xs font-bold text-slate-100 mb-1">Ghi Chép Bằng AI</h5>
                <p class="text-xs text-slate-300 font-medium leading-relaxed">Chỉ cần gõ câu tự nhiên: <em>"Ăn bún bò 45k bằng MoMo"</em>, AI tự động nhận diện và lưu ngay.</p>
              </div>
              <button type="button" onclick="window.openQuickAiModal()" class="quick-tip-action-btn quick-tip-btn-1 mt-3 w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                <i class="fa-solid fa-wand-magic-sparkles text-xs text-amber-300"></i>
                <span>⚡ Dùng Thử AI Ngay</span>
              </button>
            </div>

            <!-- Step 2: Hạn mức ngân sách -->
            <div class="quick-tip-card quick-tip-step-2 p-3.5 rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 flex flex-col justify-between transition-all group">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 inline-flex items-center justify-center text-[10px] font-black">2</span>
                    BƯỚC 2
                  </span>
                  <span class="text-[11px] text-emerald-400 font-bold">🎯 Chống bội chi</span>
                </div>
                <h5 class="text-xs font-bold text-slate-100 mb-1">Đặt Hạn Mức Ngân Sách</h5>
                <p class="text-xs text-slate-300 font-medium leading-relaxed">Giới hạn số tiền ăn uống, mua sắm theo tháng để nhận chuông cảnh báo sớm trước khi bội chi.</p>
              </div>
              <button type="button" id="btn-quick-tip-budget" class="quick-tip-action-btn quick-tip-btn-2 mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                <i class="fa-solid fa-bullseye text-xs text-emerald-300"></i>
                <span>🎯 Thiết Lập Ngân Sách</span>
              </button>
            </div>

            <!-- Step 3: Mục tiêu tiết kiệm -->
            <div class="quick-tip-card quick-tip-step-3 p-3.5 rounded-xl border border-purple-500/30 hover:border-purple-400/60 flex flex-col justify-between transition-all group">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 inline-flex items-center justify-center text-[10px] font-black">3</span>
                    BƯỚC 3
                  </span>
                  <span class="text-[11px] text-purple-400 font-bold">🐷 Tích lũy vững bền</span>
                </div>
                <h5 class="text-xs font-bold text-slate-100 mb-1">Đặt Mục Tiêu Tiết Kiệm</h5>
                <p class="text-xs text-slate-300 font-medium leading-relaxed">Lên kế hoạch mua sắm, laptop hoặc tích lũy quỹ dự phòng khẩn cấp 6 tháng thu nhập.</p>
              </div>
              <button type="button" id="btn-quick-tip-savings" class="quick-tip-action-btn quick-tip-btn-3 mt-3 w-full py-1.5 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                <i class="fa-solid fa-piggy-bank text-xs text-purple-300"></i>
                <span>🐷 Tạo Mục Tiêu Mới</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4 KPI Summary Cards (3-Tone Neon Palette) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-container">
          <div class="glass-card p-5 rounded-2xl animate-pulse flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-slate-800"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-slate-800 rounded w-1/2"></div>
              <div class="h-6 bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        <!-- Charts Row (Cashflow & Category Donut) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 6 Months Cashflow Trend (Cyan Border: border: 1px solid rgba(6, 182, 212, 0.35)) -->
          <div id="cashflow-chart-card" class="glass-card p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between border border-cyan-500/35 hover:border-cyan-500/60 shadow-md shadow-cyan-950/20 transform-gpu transition-all duration-300" style="border: 1px solid rgba(6, 182, 212, 0.35);">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-column text-cyan-400"></i>
                  <span id="cashflow-chart-title">Xu Hướng Dòng Tiền 6 Tháng</span>
                  <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="So sánh Thu nhập (xanh lá), Chi tiêu (đỏ) và Dư ròng tích lũy (đường cyan neon) qua 6 tháng."><i class="fa-solid fa-circle-question text-xs"></i></span>
                </h3>
                <p class="text-xs text-slate-300 font-medium" id="cashflow-chart-subtitle">So sánh Thu nhập, Chi tiêu và Dư tích lũy ròng</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="hidden sm:flex items-center gap-3 text-xs font-semibold">
                  <span class="inline-flex items-center gap-1.5 text-slate-200">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/30"></span> Thu (+)
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-slate-200">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30"></span> Chi (-)
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-slate-200">
                    <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/30"></span> Dư ròng
                  </span>
                </div>
                <!-- Card Collapse Toggle Button -->
                <button type="button" class="card-collapse-btn p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/70 transition cursor-pointer" data-target="cashflow-card-body" title="Thu gọn / Mở rộng biểu đồ">
                  <i class="fa-solid fa-chevron-up text-xs transition-transform duration-200"></i>
                </button>
              </div>
            </div>
            <div id="cashflow-card-body" class="card-collapsible-body h-64 w-full relative transition-all duration-300">
              <canvas id="cashflow-chart"></canvas>
            </div>
          </div>

          <!-- Category Breakdown Donut (Rose Border: border: 1px solid rgba(244, 63, 94, 0.4)) -->
          <div id="category-donut-card" class="glass-card p-5 rounded-2xl flex flex-col justify-between border border-rose-500/40 hover:border-rose-500/60 shadow-md shadow-rose-950/20 transform-gpu transition-all duration-300" style="border: 1px solid rgba(244, 63, 94, 0.4);">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-pie text-cyan-400"></i>
                  <span>Cơ Cấu Chi Tiêu</span>
                  <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="Tỷ trọng phần trăm chi tiêu của từng danh mục trong kỳ được chọn."><i class="fa-solid fa-circle-question text-xs"></i></span>
                </h3>
                <p class="text-xs text-slate-300 font-medium" id="category-chart-subtitle">Tỷ trọng chi theo danh mục kỳ này</p>
              </div>
              <div class="flex items-center gap-2">
                <span id="category-donut-total-badge" class="px-2.5 py-0.5 rounded-lg bg-slate-900/90 text-xs font-mono font-bold text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10">0 ₫</span>
                <!-- Card Collapse Toggle Button -->
                <button type="button" class="card-collapse-btn p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/70 transition cursor-pointer" data-target="category-card-body" title="Thu gọn / Mở rộng cơ cấu">
                  <i class="fa-solid fa-chevron-up text-xs transition-transform duration-200"></i>
                </button>
              </div>
            </div>
            <div id="category-card-body" class="card-collapsible-body transition-all duration-300">
              <div class="h-48 w-full relative flex items-center justify-center my-1">
                <canvas id="category-donut-chart"></canvas>
              </div>
              <div id="category-custom-legend" class="mt-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <!-- Rendered dynamically by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Budget Alerts & Recent Transactions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Budget Watchlist & Alerts (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.35)) -->
          <div id="budget-watchlist-card" class="glass-card p-5 rounded-2xl border border-emerald-500/35 hover:border-emerald-500/60 shadow-md shadow-emerald-950/20 transform-gpu transition-all duration-300" style="border: 1px solid rgba(16, 185, 129, 0.35);">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-bullseye text-cyan-400"></i>
                  <span>Giám Sát Ngân Sách</span>
                  <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="Theo dõi tiến độ chi tiêu theo từng hạn mức định trước, cảnh báo đỏ khi bội chi."><i class="fa-solid fa-circle-question text-xs"></i></span>
                </h3>
              </div>
              <div class="flex items-center gap-2.5">
                <button id="btn-view-all-budgets" class="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer relative z-20 pointer-events-auto">Chi tiết &rarr;</button>
                <!-- Card Collapse Toggle Button -->
                <button type="button" class="card-collapse-btn p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/70 transition cursor-pointer" data-target="budget-card-body" title="Thu gọn / Mở rộng ngân sách">
                  <i class="fa-solid fa-chevron-up text-xs transition-transform duration-200"></i>
                </button>
              </div>
            </div>
            <div id="budget-card-body" class="card-collapsible-body transition-all duration-300">
              <div id="budget-alerts-list" class="space-y-3">
                <div class="text-xs text-slate-300 text-center py-6 font-medium">Đang tải dữ liệu ngân sách...</div>
              </div>
            </div>
          </div>

          <!-- Recent Transactions (Cyan Border: border: 1px solid rgba(6, 182, 212, 0.3)) -->
          <div id="recent-txs-card" class="glass-card p-5 rounded-2xl lg:col-span-2 border border-cyan-500/30 hover:border-cyan-500/60 shadow-md shadow-cyan-950/20 transform-gpu transition-all duration-300" style="border: 1px solid rgba(6, 182, 212, 0.3);">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i>
                  <span>Giao Dịch Gần Đây</span>
                  <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="Danh sách các bản ghi thu - chi mới nhất của bạn."><i class="fa-solid fa-circle-question text-xs"></i></span>
                </h3>
              </div>
              <div class="flex items-center gap-2.5">
                <button id="btn-view-all-txs" class="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer relative z-20 pointer-events-auto">Xem tất cả &rarr;</button>
                <!-- Card Collapse Toggle Button -->
                <button type="button" class="card-collapse-btn p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/70 transition cursor-pointer" data-target="recent-txs-card-body" title="Thu gọn / Mở rộng giao dịch">
                  <i class="fa-solid fa-chevron-up text-xs transition-transform duration-200"></i>
                </button>
              </div>
            </div>
            <div id="recent-txs-card-body" class="card-collapsible-body transition-all duration-300">
              <div class="w-full overflow-x-auto overflow-y-hidden rounded-xl custom-scrollbar border border-slate-800/80">
                <table class="w-full text-left text-xs fintrack-table table-fixed border-collapse">
                  <thead>
                    <tr class="border-b border-slate-800 bg-slate-900/80 text-slate-300 font-bold uppercase text-[11px] font-mono tracking-wider">
                      <th class="w-[20%] py-2.5 px-3">Thời Gian</th>
                      <th class="w-[44%] py-2.5 px-3">Danh Mục & Ghi Chú</th>
                      <th class="w-[16%] py-2.5 px-3">Ví</th>
                      <th class="w-[20%] py-2.5 px-3 text-right font-black">Số Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody id="recent-transactions-tbody" class="divide-y divide-slate-800/60">
                    <tr><td colspan="4" class="py-6 text-center text-slate-300 font-medium">Đang tải giao dịch...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Bind action buttons
    document.getElementById('btn-add-tx-top')?.addEventListener('click', () => {
      this.app.openTransactionModal();
    });
    document.getElementById('btn-view-all-budgets')?.addEventListener('click', () => {
      this.app.navigate('budgets');
    });
    document.getElementById('btn-view-all-txs')?.addEventListener('click', () => {
      this.app.navigate('transactions');
    });

    // 1-Click Quick Tips Buttons
    document.getElementById('btn-quick-tip-budget')?.addEventListener('click', () => {
      this.app.navigate('budgets');
    });
    document.getElementById('btn-quick-tip-savings')?.addEventListener('click', () => {
      this.app.navigate('savings');
    });

    // Toggle Quick Tips Banner
    document.getElementById('btn-toggle-quick-tips')?.addEventListener('click', () => {
      this.isQuickTipsOpen = !this.isQuickTipsOpen;
      try {
        localStorage.setItem('fintrack_hide_quicktips', String(!this.isQuickTipsOpen));
      } catch (_) {}
      const content = document.getElementById('quick-tips-content');
      const icon = document.getElementById('quick-tips-icon');
      const text = document.getElementById('quick-tips-toggle-text');
      const headerDiv = document.querySelector('#dashboard-quick-tips-container > div:first-child');
      if (content) content.classList.toggle('hidden', !this.isQuickTipsOpen);
      if (icon) icon.className = `fa-solid ${this.isQuickTipsOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[11px]`;
      if (text) text.textContent = this.isQuickTipsOpen ? 'Thu gọn mẹo' : 'Mở rộng mẹo';
      if (headerDiv) {
        if (this.isQuickTipsOpen) {
          headerDiv.classList.add('mb-3', 'border-b', 'border-slate-800/80', 'pb-2.5');
        } else {
          headerDiv.classList.remove('mb-3', 'border-b', 'border-slate-800/80', 'pb-2.5');
        }
      }
    });

    // View Mode Switcher (Compact / Detailed)
    const setViewMode = (mode) => {
      this.viewMode = mode;
      try {
        localStorage.setItem('fintrack_dash_view_mode', mode);
      } catch (_) {}

      const btnCompact = document.getElementById('btn-view-mode-compact');
      const btnDetailed = document.getElementById('btn-view-mode-detailed');
      if (mode === 'compact') {
        if (btnCompact) btnCompact.className = 'dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm';
        if (btnDetailed) btnDetailed.className = 'dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto text-slate-300 hover:text-white';
        // Gọn Gàng: Thu gọn 2 biểu đồ phân tích chuyên sâu để tối ưu không gian, tập trung vào 4 KPI & Giao dịch mới nhất
        const cfBody = document.getElementById('cashflow-card-body');
        const catBody = document.getElementById('category-card-body');
        if (cfBody) cfBody.classList.add('hidden');
        if (catBody) catBody.classList.add('hidden');
        document.querySelectorAll('.card-collapse-btn[data-target="cashflow-card-body"] i, .card-collapse-btn[data-target="category-card-body"] i').forEach(icon => {
          icon.className = 'fa-solid fa-chevron-down text-xs transition-transform duration-200 text-cyan-400';
        });
      } else {
        if (btnCompact) btnCompact.className = 'dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto text-slate-300 hover:text-white';
        if (btnDetailed) btnDetailed.className = 'dash-view-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative z-20 pointer-events-auto bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm';
        // Đầy Đủ: Mở rộng tất cả các card để phân tích chuyên sâu
        document.querySelectorAll('.card-collapsible-body').forEach(el => {
          el.classList.remove('hidden');
        });
        document.querySelectorAll('.card-collapse-btn i').forEach(icon => {
          icon.className = 'fa-solid fa-chevron-up text-xs transition-transform duration-200';
        });
        if (this.cashflowChart) {
          try { this.cashflowChart.resize(); } catch (_) {}
        }
        if (this.categoryChart) {
          try { this.categoryChart.resize(); } catch (_) {}
        }
      }
    };

    document.getElementById('btn-view-mode-compact')?.addEventListener('click', () => setViewMode('compact'));
    document.getElementById('btn-view-mode-detailed')?.addEventListener('click', () => setViewMode('detailed'));
    setViewMode(this.viewMode);

    // Card collapse toggles
    document.querySelectorAll('.card-collapse-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const targetBody = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        if (targetBody) {
          const isHidden = targetBody.classList.contains('hidden');
          targetBody.classList.toggle('hidden', !isHidden);
          if (icon) {
            icon.className = isHidden 
              ? 'fa-solid fa-chevron-up text-xs transition-transform duration-200' 
              : 'fa-solid fa-chevron-down text-xs transition-transform duration-200 text-cyan-400';
          }
        }
      });
    });

    // Month picker change
    document.getElementById('dashboard-month-picker')?.addEventListener('change', (e) => {
      this.selectedMonth = e.target.value;
      this.selectedPeriod = 'custom';
      this.updatePeriodPillsUI();
      this.loadDashboardData();
    });

    // Period pills click
    document.querySelectorAll('.dash-period-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-period');
        this.applyPeriodFilter(p);
      });
    });

    // Load Data
    await this.loadDashboardData();
  }

  getPeriodSubtitle() {
    const monthStr = this.selectedMonth || getCurrentMonthStr();
    const parts = monthStr.split('-');
    const y = parts[0];
    const m = parts[1] || '01';
    if (this.selectedPeriod === 'this_month') {
      return `Tháng ${m}/${y} (Hiện tại)`;
    } else if (this.selectedPeriod === 'last_month') {
      return `Tháng ${m}/${y} (Đối chiếu tháng trước)`;
    } else if (this.selectedPeriod === 'this_quarter') {
      const q = Math.ceil(parseInt(m, 10) / 3);
      return `Quý ${q}/${y} (Lũy kế)`;
    }
    return this.formatMonthLabel(this.selectedMonth);
  }

  formatMonthLabel(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    return `Tháng ${m}/${y}`;
  }

  applyPeriodFilter(period) {
    this.selectedPeriod = period;

    const now = new Date();
    const currY = now.getFullYear();
    const currM = now.getMonth() + 1;

    if (period === 'this_month') {
      this.selectedMonth = getCurrentMonthStr();
    } else if (period === 'last_month') {
      const prevDate = new Date(currY, currM - 2, 1);
      const py = prevDate.getFullYear();
      const pm = String(prevDate.getMonth() + 1).padStart(2, '0');
      this.selectedMonth = `${py}-${pm}`;
    } else if (period === 'this_quarter') {
      this.selectedMonth = getCurrentMonthStr();
    }

    const picker = document.getElementById('dashboard-month-picker');
    if (picker) {
      picker.value = this.selectedMonth;
    }

    this.updatePeriodPillsUI();
    this.loadDashboardData();
  }

  updatePeriodPillsUI() {
    document.querySelectorAll('.dash-period-pill').forEach(btn => {
      if (btn.getAttribute('data-period') === this.selectedPeriod) {
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm relative z-20 pointer-events-auto';
      } else {
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 relative z-20 pointer-events-auto';
      }
    });

    const sub = document.getElementById('dashboard-period-subtitle');
    if (sub) {
      sub.innerHTML = `Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-cyan-400">${this.getPeriodSubtitle()}</span>`;
    }

    const chartTitle = document.getElementById('cashflow-chart-title');
    if (chartTitle) {
      const [y, m] = (this.selectedMonth || getCurrentMonthStr()).split('-');
      const q = Math.ceil(parseInt(m, 10) / 3);
      chartTitle.textContent = this.selectedPeriod === 'this_quarter' ? `Xu Hướng Dòng Tiền & Lũy Kế Quý ${q}/${y}` : 'Xu Hướng Dòng Tiền 6 Tháng';
    }

    const categorySub = document.getElementById('category-chart-subtitle');
    if (categorySub) {
      const [y, m] = (this.selectedMonth || getCurrentMonthStr()).split('-');
      if (this.selectedPeriod === 'this_month') {
        categorySub.textContent = `Tỷ trọng chi Tháng ${m}/${y}`;
      } else if (this.selectedPeriod === 'last_month') {
        categorySub.textContent = `Tỷ trọng chi Tháng ${m}/${y}`;
      } else if (this.selectedPeriod === 'this_quarter') {
        categorySub.textContent = `Tỷ trọng chi toàn bộ Quý ${Math.ceil(parseInt(m, 10)/3)}/${y}`;
      } else {
        categorySub.textContent = `Tỷ trọng chi Tháng ${m}/${y}`;
      }
    }
  }

  async loadDashboardData() {
    try {
      const monthStr = this.selectedMonth || getCurrentMonthStr();
      const [kpis, cashflow, breakdown, budgets, txs] = await Promise.all([
        api.getSummaryKPIs(monthStr).catch(() => null),
        api.getCashflowTrend(6).catch(() => null),
        api.getCategoryBreakdown(monthStr).catch(() => null),
        api.getBudgets(monthStr).catch(() => null),
        api.getTransactions({ limit: 6 }).catch(() => null)
      ]);

      // Nếu dữ liệu API thực tế tồn tại và hợp lệ, hiển thị trực tiếp dữ liệu thời gian thực
      if (kpis && cashflow && breakdown) {
        this.currentKPIs = kpis;
        this.currentCashflowData = cashflow;
        this.currentCategoryData = breakdown;
        this.currentBudgetData = budgets || [];
        this.currentTxsData = txs || [];
        this.renderKPIs(kpis);
        this.renderCashflowChart(cashflow);
        this.renderCategoryChart(breakdown);
        this.renderBudgetAlerts(budgets || []);
        this.renderRecentTransactions(txs || []);
        return;
      }

      // Nếu API trả về trống hoặc lỗi kết nối, fallback an toàn sang mốc dữ liệu mẫu phù hợp
      if (this.selectedPeriod in DASHBOARD_PERIOD_DATA) {
        const mockData = DASHBOARD_PERIOD_DATA[this.selectedPeriod];
        this.currentKPIs = mockData.kpis;
        this.currentCashflowData = mockData.cashflow;
        this.currentCategoryData = mockData.breakdown;
        this.currentBudgetData = mockData.budgets;
        this.currentTxsData = mockData.txs;
        this.renderKPIs(mockData.kpis);
        this.renderCashflowChart(mockData.cashflow);
        this.renderCategoryChart(mockData.breakdown);
        this.renderBudgetAlerts(mockData.budgets);
        this.renderRecentTransactions(mockData.txs);
        return;
      }
    } catch (err) {
      console.error('[Dashboard] Load data error:', err);
      const fallback = DASHBOARD_PERIOD_DATA.this_month;
      if (fallback) {
        this.currentKPIs = fallback.kpis;
        this.currentCashflowData = fallback.cashflow;
        this.currentCategoryData = fallback.breakdown;
        this.currentBudgetData = fallback.budgets;
        this.currentTxsData = fallback.txs;
        this.renderKPIs(fallback.kpis);
        this.renderCashflowChart(fallback.cashflow);
        this.renderCategoryChart(fallback.breakdown);
        this.renderBudgetAlerts(fallback.budgets);
        this.renderRecentTransactions(fallback.txs);
      }
    }
  }

  renderKPIs(kpis) {
    const container = document.getElementById('kpi-cards-container');
    if (!container) return;

    if (kpis && typeof kpis.total_net_worth === 'number') {
      window.fintrackLiveNetWorth = kpis.total_net_worth;
      window.dispatchEvent(new CustomEvent('fintrack:networth-changed', { detail: { netWorth: kpis.total_net_worth } }));
    }

    const netWorthText = this.isBalanceHidden ? '•••••••• ₫' : formatVND(kpis.total_net_worth);
    const eyeIconClass = this.isBalanceHidden ? 'fa-eye-slash text-slate-300' : 'fa-eye text-cyan-400';
    const compareLabel = this.selectedPeriod === 'this_quarter' ? 'so với quý trước' : 'so với tháng trước';

    container.innerHTML = `
      <!-- 1. Total Net Worth (Cyan Border: border: 1px solid rgba(6, 182, 212, 0.35)) -->
      <div id="kpi-card-networth" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-cyan-500/35 hover:border-cyan-500/65 shadow-md shadow-cyan-950/20 transition-all duration-200 stagger-1 transform-gpu" style="border: 1px solid rgba(6, 182, 212, 0.35);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Tổng Tài Sản Ròng</span>
            <span class="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-help transition" title="Tổng số dư tất cả các ví tiền mặt, ngân hàng, ví điện tử khả dụng của bạn."><i class="fa-solid fa-circle-question text-[11px]"></i></span>
            <button id="btn-toggle-balance" class="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer ml-0.5" title="${this.isBalanceHidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}">
              <i class="fa-solid ${eyeIconClass} text-[11px]"></i>
            </button>
          </div>
          <div class="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-base shadow-sm border border-cyan-500/20">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-black text-slate-100 font-mono tracking-tight group-hover:text-cyan-300 transition-colors" id="dash-net-worth-val">${netWorthText}</span>
        </div>
        <div class="mt-1.5 text-xs text-slate-300 font-medium flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check text-cyan-400 text-xs"></i>
          <span>Tổng số dư tất cả các ví khả dụng</span>
        </div>
      </div>

      <!-- 2. Total Income this month (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.4)) -->
      <div id="kpi-card-income" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/40 hover:border-emerald-500/70 shadow-md shadow-emerald-950/20 transition-all duration-200 stagger-2 transform-gpu" style="border: 1px solid rgba(16, 185, 129, 0.4);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Tổng Thu Kỳ Này</span>
            <span class="inline-flex items-center text-slate-400 hover:text-emerald-400 cursor-help transition" title="Tổng các khoản thu nhập, tiền lương, tiền thưởng và lãi đầu tư trong kỳ."><i class="fa-solid fa-circle-question text-[11px]"></i></span>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base shadow-sm border border-emerald-500/20">
            <i class="fa-solid fa-circle-arrow-down"></i>
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-black text-emerald-400 font-mono tracking-tight">+${formatVND(kpis.total_income_month)}</span>
        </div>
        <div class="mt-1.5 text-xs ${kpis.income_change_vs_last_month_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold flex items-center gap-1.5">
          <i class="fa-solid ${kpis.income_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.income_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.income_change_vs_last_month_pct}% ${compareLabel}</span>
        </div>
      </div>

      <!-- 3. Total Expense this month (Rose Border: border: 1px solid rgba(244, 63, 94, 0.4)) -->
      <div id="kpi-card-expense" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-rose-500/40 hover:border-rose-500/70 shadow-md shadow-rose-950/20 transition-all duration-200 stagger-3 transform-gpu" style="border: 1px solid rgba(244, 63, 94, 0.4);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Tổng Chi Kỳ Này</span>
            <span class="inline-flex items-center text-slate-400 hover:text-rose-400 cursor-help transition" title="Tổng các khoản chi phí sinh hoạt, ăn uống, hóa đơn mua sắm trong kỳ."><i class="fa-solid fa-circle-question text-[11px]"></i></span>
          </div>
          <div class="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-base shadow-sm border border-rose-500/20">
            <i class="fa-solid fa-circle-arrow-up"></i>
          </div>
        </div>
        <div class="mt-2.5">
          <span class="text-2xl font-black text-rose-400 font-mono tracking-tight">-${formatVND(kpis.total_expense_month)}</span>
        </div>
        <div class="mt-1.5 text-xs ${kpis.expense_change_vs_last_month_pct <= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold flex items-center gap-1.5">
          <i class="fa-solid ${kpis.expense_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.expense_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.expense_change_vs_last_month_pct}% ${compareLabel}</span>
        </div>
      </div>

      <!-- 4. Savings Rate (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.4)) -->
      <div id="kpi-card-savings" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/40 hover:border-emerald-500/65 shadow-md shadow-emerald-950/20 transition-all duration-200 stagger-4 transform-gpu" style="border: 1px solid rgba(16, 185, 129, 0.4);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Tỷ Lệ Tiết Kiệm</span>
            <span class="inline-flex items-center text-slate-400 hover:text-emerald-400 cursor-help transition" title="Tỷ lệ % thu nhập còn lại sau khi trừ chi tiêu. Chuẩn tài chính 50/30/20 khuyến nghị từ 20% trở lên."><i class="fa-solid fa-circle-question text-[11px]"></i></span>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base shadow-sm border border-emerald-500/20">
            <i class="fa-solid fa-piggy-bank"></i>
          </div>
        </div>
        <div class="mt-2.5 flex items-baseline gap-2">
          <span class="text-2xl font-black text-emerald-400 font-mono tracking-tight">${Number(kpis.savings_rate_month || 0).toFixed(1)}%</span>
          <span class="text-xs text-slate-300 font-mono font-semibold">(${kpis.net_savings_month >= 0 ? '+' : ''}${formatVND(kpis.net_savings_month)})</span>
        </div>
        <div class="mt-1.5 text-xs ${kpis.savings_rate_month >= 20 ? 'text-emerald-400' : 'text-rose-400'} font-semibold flex items-center gap-1.5">
          <i class="fa-solid ${kpis.savings_rate_month >= 20 ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400'} text-xs"></i>
          <span>${kpis.savings_rate_month >= 20 ? 'Chuẩn tài chính 50/30/20' : 'Mục tiêu tối thiểu 20%'}</span>
        </div>
      </div>
    `;

    // Eye toggle event
    document.getElementById('btn-toggle-balance')?.addEventListener('click', () => {
      this.isBalanceHidden = !this.isBalanceHidden;
      localStorage.setItem('fintrack_hide_balance', String(this.isBalanceHidden));
      this.renderKPIs(this.currentKPIs || kpis);
      this.app.showToast(this.isBalanceHidden ? 'Đã ẩn số dư tài sản ròng' : 'Đã hiển thị số dư tài sản ròng', 'info');
    });
  }

  renderCashflowChart(data) {
    const canvas = document.getElementById('cashflow-chart');
    if (!canvas) return;

    const isLight = document.documentElement.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';

    if (window.Chart) {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();
    }
    if (this.cashflowChart) {
      try { this.cashflowChart.destroy(); } catch (e) {}
      this.cashflowChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = data.map(d => d.label);
    const incomeData = data.map(d => d.income);
    const expenseData = data.map(d => d.expense);
    const netData = data.map(d => d.net_savings);

    // 1. Mixed Positive Emerald -> Cyan Gradient (Income)
    const incomeGrad = ctx.createLinearGradient(0, 0, 0, 240);
    incomeGrad.addColorStop(0, '#10B981');
    incomeGrad.addColorStop(1, isLight ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.35)');

    // 2. Mixed Accent Rose -> Magenta Gradient (Expense)
    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 240);
    expenseGrad.addColorStop(0, '#F43F5E');
    expenseGrad.addColorStop(1, isLight ? 'rgba(236, 72, 153, 0.45)' : 'rgba(236, 72, 153, 0.35)');

    // 3. Mixed Primary Cyan -> Emerald Gradient Fill (Net Savings)
    const lineFillGrad = ctx.createLinearGradient(0, 0, 0, 240);
    lineFillGrad.addColorStop(0, isLight ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.35)');
    lineFillGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    this.cashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Thu Nhập',
            data: incomeData,
            backgroundColor: incomeGrad,
            hoverBackgroundColor: '#00F2FE',
            borderRadius: 8,
            barPercentage: 0.65,
            categoryPercentage: 0.8
          },
          {
            label: 'Chi Tiêu',
            data: expenseData,
            backgroundColor: expenseGrad,
            hoverBackgroundColor: '#FB7185',
            borderRadius: 8,
            barPercentage: 0.65,
            categoryPercentage: 0.8
          },
          {
            label: 'Dư Tích Lũy',
            data: netData,
            type: 'line',
            borderColor: '#06B6D4',
            backgroundColor: lineFillGrad,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#00F2FE',
            pointBorderColor: isLight ? '#0F172A' : '#FFFFFF',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        animation: {
          duration: 900,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : '#0F172A',
            titleColor: isLight ? '#0F172A' : '#F8FAFC',
            bodyColor: isLight ? '#334155' : '#CBD5E1',
            borderColor: isLight ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1.5,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${formatVND(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: isLight ? '#334155' : '#94A3B8',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
            }
          },
          y: {
            grid: {
              color: isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: isLight ? '#475569' : '#94A3B8',
              font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
              callback: (val) => {
                if (val >= 1000000 || val <= -1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val >= 1000 || val <= -1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }
            }
          }
        }
      }
    });
    this.initialCashflowLoaded = true;
  }

  renderCategoryChart(breakdown) {
    const canvas = document.getElementById('category-donut-chart');
    if (!canvas) return;

    const isLight = document.documentElement.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';

    if (window.Chart) {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();
    }
    if (this.categoryChart) {
      try { this.categoryChart.destroy(); } catch (e) {}
      this.categoryChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const items = Array.isArray(breakdown) ? breakdown : (breakdown.items || []);
    const totalExpense = items.reduce((sum, i) => sum + (i.total_amount || 0), 0);

    const legendContainer = document.getElementById('category-custom-legend');
    const totalBadge = document.getElementById('category-donut-total-badge');

    if (!items || items.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isLight ? '#475569' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Chưa có chi tiêu trong kỳ', canvas.width / 2 || 130, canvas.height / 2 || 90);
      if (legendContainer) legendContainer.innerHTML = '<div class="text-center py-4 text-slate-300 font-medium text-xs">Chưa có giao dịch chi tiêu</div>';
      if (totalBadge) totalBadge.textContent = '0 ₫';
      return;
    }

    if (totalBadge) {
      totalBadge.textContent = formatVND(totalExpense);
    }

    // 3-Tone Neon Palette (Cyan, Emerald, Rose in varying shades/opacities)
    const unifiedPalette = [
      '#06B6D4', // Primary Cyan
      '#F43F5E', // Accent Rose
      '#10B981', // Positive Emerald
      '#00F2FE', // Electric Cyan
      '#EC4899', // Magenta Rose
      '#059669', // Dark Emerald
      '#0891B2', // Deep Cyan
      '#E11D48'  // Crimson Rose
    ];

    function getCategoryUnifiedColor(catName, index) {
      if (!catName) return unifiedPalette[index % unifiedPalette.length];
      const lower = catName.toLowerCase();
      if (lower.includes('nhà') || lower.includes('thuê') || lower.includes('cố định') || lower.includes('điện') || lower.includes('nước') || lower.includes('xăng') || lower.includes('đi lại') || lower.includes('xe')) {
        return '#06B6D4';
      }
      if (lower.includes('ăn') || lower.includes('thực phẩm') || lower.includes('uống') || lower.includes('sức khỏe') || lower.includes('y tế') || lower.includes('thể thao')) {
        return '#10B981';
      }
      if (lower.includes('mua sắm') || lower.includes('công nghệ') || lower.includes('sắm') || lower.includes('cà phê') || lower.includes('cafe') || lower.includes('giải trí') || lower.includes('tiếp khách')) {
        return '#F43F5E';
      }
      return unifiedPalette[index % unifiedPalette.length];
    }

    const labels = items.map(i => i.category_name);
    const dataVals = items.map(i => i.total_amount);
    const colors = items.map((i, idx) => getCategoryUnifiedColor(i.category_name, idx));

    // Custom 3-Tone HTML Legend
    if (legendContainer) {
      legendContainer.innerHTML = items.map((item, idx) => {
        const color = colors[idx];
        const pct = item.percentage !== undefined ? item.percentage : (totalExpense > 0 ? ((item.total_amount / totalExpense) * 100).toFixed(1) : 0);
        return `
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition group transform-gpu">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${color}; box-shadow: 0 0 6px ${color}50;"></span>
              <span class="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-400 transition">${item.category_name}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-[11px] font-black px-1.5 py-0.5 rounded font-mono" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${pct}%</span>
              <span class="text-xs font-mono font-black text-slate-100">${formatVND(item.total_amount)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Center text plugin to display Total Expense in donut center
    const centerTextPlugin = {
      id: 'cyberpunkCenterText',
      beforeDraw(chart) {
        const { width, height, ctx } = chart;
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Subtitle "Tổng chi"
        ctx.font = '700 11px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = isLight ? '#475569' : '#94A3B8';
        ctx.fillText('Tổng chi', centerX, centerY - 10);

        // Formatted Amount: 18.45M or 18.450.000 ₫
        let displayAmount = formatVND(totalExpense);
        if (totalExpense >= 1000000) {
          const inM = (totalExpense / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
          displayAmount = `${inM}M ₫`;
        }
        ctx.font = '900 15px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = isLight ? '#0891B2' : '#06B6D4';
        ctx.fillText(displayAmount, centerX, centerY + 10);

        ctx.restore();
      }
    };

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataVals,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: isLight ? '#FFFFFF' : '#0B0F19',
          hoverOffset: 5,
          hoverBorderColor: '#00F2FE'
        }]
      },
      plugins: [centerTextPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        cutout: '74%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 900,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : '#0F172A',
            titleColor: isLight ? '#0F172A' : '#FFFFFF',
            bodyColor: isLight ? '#0891B2' : '#06B6D4',
            borderColor: isLight ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1.5,
            padding: 10,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (item) => {
                const val = item.raw || 0;
                const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                return ` ${item.label}: ${formatVND(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
    this.initialCategoryLoaded = true;
  }

  renderBudgetAlerts(budgets) {
    const container = document.getElementById('budget-alerts-list');
    if (!container) return;

    if (!budgets || budgets.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-slate-300 font-medium text-xs">
          Chưa thiết lập hạn mức kỳ này.<br/>
          <button id="btn-quick-set-budget" class="text-cyan-400 font-bold mt-1.5 hover:underline cursor-pointer">+ Đặt hạn mức ngay</button>
        </div>
      `;
      document.getElementById('btn-quick-set-budget')?.addEventListener('click', () => this.app.navigate('budgets'));
      return;
    }

    container.innerHTML = budgets.slice(0, 4).map(b => {
      const isOver = b.status === 'OVERSPENT';
      const isWarn = b.status === 'WARNING';
      const badgeClass = isOver 
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
        : isWarn 
        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';

      const progressBarClass = isOver 
        ? 'budget-progress-overspent bg-gradient-to-r from-rose-600 to-rose-500' 
        : isWarn 
        ? 'budget-progress-warning bg-gradient-to-r from-amber-500 to-amber-400' 
        : 'budget-progress-safe bg-gradient-to-r from-emerald-500 to-cyan-500';

      const progressBarStyle = isOver
        ? 'background: linear-gradient(90deg, #e11d48 0%, #f43f5e 100%); box-shadow: 0 0 8px rgba(244, 63, 94, 0.35);'
        : isWarn
        ? 'background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); box-shadow: 0 0 8px rgba(251, 191, 36, 0.35);'
        : 'background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); box-shadow: 0 0 8px rgba(16, 185, 129, 0.35);';

      const badgeText = isOver ? `Bội chi (${Math.round(b.percentage)}%)` : isWarn ? `Cảnh báo (${Math.round(b.percentage)}%)` : `An toàn (${Math.round(b.percentage)}%)`;

      return `
        <div class="p-3 rounded-xl bg-slate-900/60 border ${isOver ? 'border-rose-500/35 bg-rose-950/15' : isWarn ? 'border-amber-500/35 bg-amber-950/15' : 'border-slate-700/60'} hover:border-slate-600 transition transform-gpu">
          <div class="flex items-center justify-between text-xs mb-2">
            <span class="font-bold text-slate-200">${b.category ? b.category.name : 'Danh mục'}</span>
            <span class="px-2 py-0.5 rounded-full font-bold ${badgeClass} text-[11px] shadow-sm">${badgeText}</span>
          </div>
          <div class="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div class="${progressBarClass} progress-animated h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, b.percentage)}%; ${progressBarStyle}"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-300 mt-1.5 font-mono font-semibold">
            <span>Đã chi: ${formatVND(b.spent_amount)}</span>
            <span>Hạn mức: ${formatVND(b.amount_limit)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderRecentTransactions(txs) {
    const tbody = document.getElementById('recent-transactions-tbody');
    if (!tbody) return;

    if (!txs || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-300 font-medium text-xs">Chưa có giao dịch nào</td></tr>`;
      return;
    }

    tbody.innerHTML = txs.map(t => {
      const isIncome = t.type === 'INCOME' || t.type === 'TOPUP' || t.type === 'DEPOSIT';
      const isTransfer = t.type === 'TRANSFER';
      const sign = isIncome ? '+' : isTransfer ? '⮂ ' : '-';
      const amountColor = isIncome ? 'text-emerald-400 font-bold' : isTransfer ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold';

      const catName = t.category ? t.category.name : isTransfer ? 'Chuyển tiền' : (isIncome ? 'Nạp tiền / Thu nhập' : 'Chi tiêu');
      const catColor = isIncome ? '#10B981' : isTransfer ? '#06B6D4' : '#F43F5E';
      const catIcon = t.category ? (t.category.icon || 'receipt') : (isTransfer ? 'arrow-right-arrow-left' : (isIncome ? 'circle-arrow-down' : 'receipt'));

      return `
        <tr class="hover:bg-slate-800/60 transition duration-150 border-b border-slate-800/60">
          <td class="py-3 px-3 text-slate-300 text-xs whitespace-nowrap font-mono font-medium truncate">
            ${formatDateVN(t.transaction_date)}
          </td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm flex-shrink-0" style="background-color: ${catColor}25; color: ${catColor}; border: 1px solid ${catColor}50;">
                <i class="fa-solid fa-${catIcon}"></i>
              </span>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-100 block truncate text-xs">${catName}</span>
                ${t.note ? `<span class="text-xs text-slate-300 block truncate font-medium mt-0.5" title="${t.note}">${t.note}</span>` : ''}
              </div>
            </div>
          </td>
          <td class="py-3 px-3 text-slate-300 text-xs whitespace-nowrap truncate">
            <span class="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-200 font-semibold truncate inline-block max-w-full">${t.wallet ? t.wallet.name : 'Ví'}</span>
          </td>
          <td class="py-3 px-3 text-right font-black font-mono text-xs ${amountColor} whitespace-nowrap truncate">
            ${sign}${formatVND(t.amount)}
          </td>
        </tr>
      `;
    }).join('');
  }

  onThemeChanged(isLight) {
    if (this.currentCashflowData) {
      this.renderCashflowChart(this.currentCashflowData);
    }
    if (this.currentCategoryData) {
      this.renderCategoryChart(this.currentCategoryData);
    }
  }
}
