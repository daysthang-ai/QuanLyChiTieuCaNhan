import { api } from '../api.js';
import { formatVND, formatDateVN, getCurrentMonthStr } from '../utils/formatters.js';

export class DashboardComponent {
  constructor(app) {
    this.app = app;
    this.cashflowChart = null;
    this.categoryChart = null;
    this.selectedMonth = getCurrentMonthStr();
    this.selectedPeriod = 'this_month';
    this.isBalanceHidden = localStorage.getItem('fintrack_hide_balance') === 'true';
    this.initialCashflowLoaded = false;
    this.initialCategoryLoaded = false;
  }

  async render(container) {
    container.innerHTML = `
      <div id="tab-dashboard" class="user-tab-pane space-y-6 animate-in fade-in duration-300">
        
        <!-- Header & Quick Actions -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>Tổng Quan Tài Chính</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">Live</span>
            </h1>
            <p class="text-slate-400 text-xs mt-0.5" id="dashboard-period-subtitle">
              Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-cyan-400">${this.formatMonthLabel(this.selectedMonth)}</span>
            </p>
          </div>

          <!-- Time Filter & Action Bar -->
          <div class="flex flex-wrap items-center gap-2.5">
            
            <!-- Quick Time Filter Pills -->
            <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'this_month' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="this_month">
                Tháng này
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'last_month' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="last_month">
                Tháng trước
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'this_quarter' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="this_quarter">
                Quý này
              </button>
            </div>

            <!-- Month Picker -->
            <div class="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <i class="fa-regular fa-calendar text-slate-400 text-[11px]"></i>
              <input type="month" id="dashboard-month-picker" value="${this.selectedMonth}" 
                class="font-bold text-cyan-400 bg-transparent border-0 focus:outline-none cursor-pointer text-xs" title="Chọn tháng cụ thể" />
            </div>

            <!-- Primary Add Transaction Action -->
            <button id="btn-add-tx-top" class="btn-sparkle-burst px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 active:scale-95 transition-all duration-200 flex items-center gap-1.5 transform-gpu">
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Ghi Thu - Chi</span>
            </button>

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
          <div id="cashflow-chart-card" class="glass-card p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between border border-cyan-500/35 hover:border-cyan-500/60 shadow-md shadow-cyan-950/20 transform-gpu" style="border: 1px solid rgba(6, 182, 212, 0.35);">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-column text-cyan-400"></i>
                  Xu Hướng Dòng Tiền 6 Tháng
                </h3>
                <p class="text-xs text-slate-400">So sánh Thu nhập, Chi tiêu và Dư tích lũy ròng</p>
              </div>
              <div class="flex items-center gap-3 text-xs font-semibold">
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/30"></span> Thu (+)
                </span>
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30"></span> Chi (-)
                </span>
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/30"></span> Dư ròng
                </span>
              </div>
            </div>
            <div class="h-64 w-full relative">
              <canvas id="cashflow-chart"></canvas>
            </div>
          </div>

          <!-- Category Breakdown Donut (Rose Border: border: 1px solid rgba(244, 63, 94, 0.4)) -->
          <div id="category-donut-card" class="glass-card p-5 rounded-2xl flex flex-col justify-between border border-rose-500/40 hover:border-rose-500/60 shadow-md shadow-rose-950/20 transform-gpu" style="border: 1px solid rgba(244, 63, 94, 0.4);">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-pie text-cyan-400"></i>
                  Cơ Cấu Chi Tiêu
                </h3>
                <p class="text-xs text-slate-400">Tỷ trọng chi theo danh mục kỳ này</p>
              </div>
              <span id="category-donut-total-badge" class="px-2.5 py-0.5 rounded-lg bg-slate-900/90 text-[11px] font-mono font-bold text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10">0 ₫</span>
            </div>
            <div class="h-48 w-full relative flex items-center justify-center my-1">
              <canvas id="category-donut-chart"></canvas>
            </div>
            <div id="category-custom-legend" class="mt-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <!-- Rendered dynamically by JS -->
            </div>
          </div>
        </div>

        <!-- Row 3: Budget Alerts & Recent Transactions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Budget Watchlist & Alerts (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.35)) -->
          <div id="budget-watchlist-card" class="glass-card p-5 rounded-2xl border border-emerald-500/35 hover:border-emerald-500/60 shadow-md shadow-emerald-950/20 transform-gpu" style="border: 1px solid rgba(16, 185, 129, 0.35);">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-cyan-400"></i>
                Giám Sát Ngân Sách
              </h3>
              <button id="btn-view-all-budgets" class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">Chi tiết &rarr;</button>
            </div>
            <div id="budget-alerts-list" class="space-y-3">
              <div class="text-xs text-slate-400 text-center py-6">Đang tải dữ liệu ngân sách...</div>
            </div>
          </div>

          <!-- Recent Transactions (Cyan Border: border: 1px solid rgba(6, 182, 212, 0.3)) -->
          <div id="recent-txs-card" class="glass-card p-5 rounded-2xl lg:col-span-2 border border-cyan-500/30 hover:border-cyan-500/60 shadow-md shadow-cyan-950/20 transform-gpu" style="border: 1px solid rgba(6, 182, 212, 0.3);">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i>
                Giao Dịch Gần Đây
              </h3>
              <button id="btn-view-all-txs" class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">Xem tất cả &rarr;</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th class="pb-2.5">Thời Gian</th>
                    <th class="pb-2.5">Danh Mục & Ghi Chú</th>
                    <th class="pb-2.5">Ví</th>
                    <th class="pb-2.5 text-right font-bold">Số Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody id="recent-transactions-tbody" class="divide-y divide-slate-800/60">
                  <tr><td colspan="4" class="py-6 text-center text-slate-400">Đang tải giao dịch...</td></tr>
                </tbody>
              </table>
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

  formatMonthLabel(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    return `Tháng ${m}/${y}`;
  }

  applyPeriodFilter(period) {
    this.selectedPeriod = period;
    const now = new Date();

    if (period === 'this_month') {
      this.selectedMonth = getCurrentMonthStr();
    } else if (period === 'last_month') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = lastM.getFullYear();
      const m = String(lastM.getMonth() + 1).padStart(2, '0');
      this.selectedMonth = `${y}-${m}`;
    } else if (period === 'this_quarter') {
      this.selectedMonth = getCurrentMonthStr();
    }

    const picker = document.getElementById('dashboard-month-picker');
    if (picker) picker.value = this.selectedMonth;

    this.updatePeriodPillsUI();
    this.loadDashboardData();
  }

  updatePeriodPillsUI() {
    document.querySelectorAll('.dash-period-pill').forEach(btn => {
      if (btn.getAttribute('data-period') === this.selectedPeriod) {
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-sm';
      } else {
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200';
      }
    });

    const sub = document.getElementById('dashboard-period-subtitle');
    if (sub) {
      sub.innerHTML = `Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-cyan-400">${this.formatMonthLabel(this.selectedMonth)}</span>`;
    }
  }

  async loadDashboardData() {
    try {
      const monthStr = this.selectedMonth;
      const [kpis, cashflow, breakdown, budgets, txs] = await Promise.all([
        api.getSummaryKPIs(monthStr),
        api.getCashflowTrend(6),
        api.getCategoryBreakdown(monthStr),
        api.getBudgets(monthStr),
        api.getTransactions({ limit: 6 })
      ]);

      this.currentKPIs = kpis;
      this.renderKPIs(kpis);
      this.renderCashflowChart(cashflow);
      this.renderCategoryChart(breakdown);
      this.renderBudgetAlerts(budgets);
      this.renderRecentTransactions(txs);
    } catch (err) {
      console.error('[Dashboard] Load data error:', err);
      this.app.showToast('Không thể tải một số dữ liệu tổng quan', 'error');
    }
  }

  renderKPIs(kpis) {
    const container = document.getElementById('kpi-cards-container');
    if (!container) return;

    const netWorthText = this.isBalanceHidden ? '•••••••• ₫' : formatVND(kpis.total_net_worth);
    const eyeIconClass = this.isBalanceHidden ? 'fa-eye-slash text-slate-400' : 'fa-eye text-cyan-400';

    container.innerHTML = `
      <!-- 1. Total Net Worth (Cyan Border: border: 1px solid rgba(6, 182, 212, 0.35)) -->
      <div id="kpi-card-networth" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-cyan-500/35 hover:border-cyan-500/65 shadow-md shadow-cyan-950/20 transition-all duration-200 stagger-1 transform-gpu" style="border: 1px solid rgba(6, 182, 212, 0.35);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Tài Sản Ròng</span>
            <button id="btn-toggle-balance" class="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition" title="${this.isBalanceHidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}">
              <i class="fa-solid ${eyeIconClass} text-[11px]"></i>
            </button>
          </div>
          <div class="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-base shadow-sm border border-cyan-500/20">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-slate-100 font-mono tracking-tight group-hover:text-cyan-300 transition-colors" id="dash-net-worth-val">${netWorthText}</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
          <i class="fa-solid fa-circle-check text-cyan-400 text-[10px]"></i>
          <span>Tổng số dư tất cả các ví khả dụng</span>
        </div>
      </div>

      <!-- 2. Total Income this month (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.4)) -->
      <div id="kpi-card-income" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/40 hover:border-emerald-500/70 shadow-md shadow-emerald-950/20 transition-all duration-200 stagger-2 transform-gpu" style="border: 1px solid rgba(16, 185, 129, 0.4);">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Thu Kỳ Này</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base shadow-sm border border-emerald-500/20">
            <i class="fa-solid fa-circle-arrow-down"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-emerald-400 font-mono tracking-tight">+${formatVND(kpis.total_income_month)}</span>
        </div>
        <div class="mt-1 text-[11px] ${kpis.income_change_vs_last_month_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium flex items-center gap-1">
          <i class="fa-solid ${kpis.income_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.income_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.income_change_vs_last_month_pct}% so với tháng trước</span>
        </div>
      </div>

      <!-- 3. Total Expense this month (Rose Border: border: 1px solid rgba(244, 63, 94, 0.4)) -->
      <div id="kpi-card-expense" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-rose-500/40 hover:border-rose-500/70 shadow-md shadow-rose-950/20 transition-all duration-200 stagger-3 transform-gpu" style="border: 1px solid rgba(244, 63, 94, 0.4);">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Chi Kỳ Này</span>
          <div class="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-base shadow-sm border border-rose-500/20">
            <i class="fa-solid fa-circle-arrow-up"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-rose-400 font-mono tracking-tight">-${formatVND(kpis.total_expense_month)}</span>
        </div>
        <div class="mt-1 text-[11px] ${kpis.expense_change_vs_last_month_pct <= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium flex items-center gap-1">
          <i class="fa-solid ${kpis.expense_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.expense_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.expense_change_vs_last_month_pct}% so với tháng trước</span>
        </div>
      </div>

      <!-- 4. Savings Rate (Emerald Border: border: 1px solid rgba(16, 185, 129, 0.4)) -->
      <div id="kpi-card-savings" class="glass-card p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/40 hover:border-emerald-500/65 shadow-md shadow-emerald-950/20 transition-all duration-200 stagger-4 transform-gpu" style="border: 1px solid rgba(16, 185, 129, 0.4);">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Tiết Kiệm</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base shadow-sm border border-emerald-500/20">
            <i class="fa-solid fa-piggy-bank"></i>
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-xl font-black text-emerald-400 font-mono tracking-tight">${kpis.savings_rate_month}%</span>
          <span class="text-xs text-slate-400">(${formatVND(kpis.net_savings_month)})</span>
        </div>
        <div class="mt-1 text-[11px] ${kpis.savings_rate_month >= 20 ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1">
          <i class="fa-solid ${kpis.savings_rate_month >= 20 ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400'} text-[10px]"></i>
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
    incomeGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');

    // 2. Mixed Accent Rose -> Magenta Gradient (Expense)
    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 240);
    expenseGrad.addColorStop(0, '#F43F5E');
    expenseGrad.addColorStop(1, 'rgba(236, 72, 153, 0.35)');

    // 3. Mixed Primary Cyan -> Emerald Gradient Fill (Net Savings)
    const lineFillGrad = ctx.createLinearGradient(0, 0, 0, 240);
    lineFillGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
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
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 200,
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
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#CBD5E1',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1,
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
              color: '#94A3B8',
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#64748B',
              font: { family: 'Plus Jakarta Sans', size: 10 },
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
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Chưa có chi tiêu trong kỳ', canvas.width / 2 || 130, canvas.height / 2 || 90);
      if (legendContainer) legendContainer.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs">Chưa có giao dịch chi tiêu</div>';
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
      // Essential & Fixed -> Primary Cyan
      if (lower.includes('nhà') || lower.includes('thuê') || lower.includes('cố định') || lower.includes('điện') || lower.includes('nước') || lower.includes('xăng') || lower.includes('đi lại') || lower.includes('xe')) {
        return '#06B6D4';
      }
      // Food & Health -> Positive Emerald
      if (lower.includes('ăn') || lower.includes('thực phẩm') || lower.includes('uống') || lower.includes('sức khỏe') || lower.includes('y tế') || lower.includes('thể thao')) {
        return '#10B981';
      }
      // Shopping & Entertainment -> Accent Rose
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
              <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition">${item.category_name}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${pct}%</span>
              <span class="text-xs font-mono font-bold text-slate-100">${formatVND(item.total_amount)}</span>
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
        ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Tổng chi', centerX, centerY - 10);

        // Formatted Amount: 18.45M or 18.450.000 ₫
        let displayAmount = formatVND(totalExpense);
        if (totalExpense >= 1000000) {
          const inM = (totalExpense / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
          displayAmount = `${inM}M ₫`;
        }
        ctx.font = '800 15px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#06B6D4';
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
          borderColor: '#0B0F19',
          hoverOffset: 5,
          hoverBorderColor: '#FFFFFF'
        }]
      },
      plugins: [centerTextPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 200,
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
            backgroundColor: '#0F172A',
            titleColor: '#FFFFFF',
            bodyColor: '#06B6D4',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1,
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
        <div class="text-center py-4 text-slate-400 text-xs">
          Chưa thiết lập hạn mức kỳ này.<br/>
          <button id="btn-quick-set-budget" class="text-cyan-400 font-bold mt-1 hover:underline">+ Đặt hạn mức ngay</button>
        </div>
      `;
      document.getElementById('btn-quick-set-budget')?.addEventListener('click', () => this.app.navigate('budgets'));
      return;
    }

    container.innerHTML = budgets.slice(0, 4).map(b => {
      const isOver = b.status === 'OVERSPENT';
      const isWarn = b.status === 'WARNING';
      const colorClass = isOver ? 'bg-rose-500' : isWarn ? 'bg-rose-400' : 'bg-emerald-500';
      const textClass = isOver ? 'text-rose-400' : isWarn ? 'text-rose-400' : 'text-emerald-400';
      const badgeText = isOver ? `Vượt ${Math.round(b.percentage - 100)}%` : isWarn ? `Đã dùng ${b.percentage}%` : 'An toàn';

      return `
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 transition transform-gpu">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-slate-200">${b.category ? b.category.name : 'Danh mục'}</span>
            <span class="font-bold ${textClass} text-[11px]">${badgeText}</span>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="${colorClass} progress-animated h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, b.percentage)}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
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
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">Chưa có giao dịch nào</td></tr>`;
      return;
    }

    tbody.innerHTML = txs.map(t => {
      const isIncome = t.type === 'INCOME';
      const isTransfer = t.type === 'TRANSFER';
      const sign = isIncome ? '+' : isTransfer ? '⮂' : '-';
      const amountColor = isIncome ? 'text-emerald-400' : isTransfer ? 'text-cyan-400' : 'text-rose-400';

      const catName = t.category ? t.category.name : isTransfer ? 'Chuyển tiền' : 'Chung';
      const catColor = isIncome ? '#10B981' : isTransfer ? '#06B6D4' : '#F43F5E';
      const catIcon = t.category ? (t.category.icon || 'receipt') : 'arrow-right-arrow-left';

      return `
        <tr class="hover:bg-slate-800/50 transition">
          <td class="py-2.5 text-slate-400 text-[11px] whitespace-nowrap font-mono">
            ${formatDateVN(t.transaction_date)}
          </td>
          <td class="py-2.5">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-white shadow-sm flex-shrink-0" style="background-color: ${catColor}30; color: ${catColor}; border: 1px solid ${catColor}50;">
                <i class="fa-solid fa-${catIcon}"></i>
              </span>
              <div class="min-w-0">
                <span class="font-bold text-slate-200 block truncate">${catName}</span>
                ${t.note ? `<span class="text-[10px] text-slate-400 block truncate">${t.note}</span>` : ''}
              </div>
            </div>
          </td>
          <td class="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300">${t.wallet ? t.wallet.name : ''}</span>
          </td>
          <td class="py-2.5 text-right font-black font-mono text-xs ${amountColor} whitespace-nowrap">
            ${sign} ${formatVND(t.amount)}
          </td>
        </tr>
      `;
    }).join('');
  }
}
