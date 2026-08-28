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
  }

  async render(container) {
    container.innerHTML = `
      <div id="tab-dashboard" class="user-tab-pane space-y-6 animate-in fade-in duration-300">
        
        <!-- Header & Quick Actions -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>Tổng Quan Tài Chính</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Live</span>
            </h1>
            <p class="text-slate-400 text-xs mt-0.5" id="dashboard-period-subtitle">
              Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-emerald-400">${this.formatMonthLabel(this.selectedMonth)}</span>
            </p>
          </div>

          <!-- Time Filter & Action Bar -->
          <div class="flex flex-wrap items-center gap-2.5">
            
            <!-- Quick Time Filter Pills -->
            <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'this_month' ? 'gradient-emerald text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="this_month">
                Tháng này
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'last_month' ? 'gradient-emerald text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="last_month">
                Tháng trước
              </button>
              <button type="button" class="dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition ${this.selectedPeriod === 'this_quarter' ? 'gradient-emerald text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" data-period="this_quarter">
                Quý này
              </button>
            </div>

            <!-- Month Picker -->
            <div class="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <i class="fa-regular fa-calendar text-slate-400 text-[11px]"></i>
              <input type="month" id="dashboard-month-picker" value="${this.selectedMonth}" 
                class="font-bold text-emerald-400 bg-transparent border-0 focus:outline-none cursor-pointer text-xs" title="Chọn tháng cụ thể" />
            </div>

            <!-- Primary Add Transaction Action -->
            <button id="btn-add-tx-top" class="px-4 py-2 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition flex items-center gap-1.5">
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Ghi Thu - Chi</span>
            </button>

          </div>
        </div>

        <!-- 4 KPI Summary Cards -->
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
          <!-- 6 Months Cashflow Trend -->
          <div class="glass-card p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-column text-emerald-400"></i>
                  Xu Hướng Dòng Tiền 6 Tháng
                </h3>
                <p class="text-xs text-slate-400">So sánh Thu nhập, Chi tiêu và Dư tích lũy ròng</p>
              </div>
              <div class="flex items-center gap-3 text-xs font-semibold">
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Thu
                </span>
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Chi
                </span>
                <span class="inline-flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Dư
                </span>
              </div>
            </div>
            <div class="h-64 w-full relative">
              <canvas id="cashflow-chart"></canvas>
            </div>
          </div>

          <!-- Category Breakdown Donut with Center Stat & Cyberpunk Custom Legend -->
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between" id="category-donut-card">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <i class="fa-solid fa-chart-pie text-[#00FFAA]"></i>
                  Cơ Cấu Chi Tiêu
                </h3>
                <p class="text-xs text-slate-400">Tỷ trọng chi theo danh mục kỳ này</p>
              </div>
              <span id="category-donut-total-badge" class="px-2.5 py-0.5 rounded-lg bg-slate-900/90 text-[11px] font-mono font-bold text-[#00FFAA] border border-[#00FFAA]/30 shadow-sm shadow-[#00FFAA]/10">0 ₫</span>
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
          
          <!-- Budget Watchlist & Alerts -->
          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-amber-400"></i>
                Giám Sát Ngân Sách
              </h3>
              <button id="btn-view-all-budgets" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">Chi tiết &rarr;</button>
            </div>
            <div id="budget-alerts-list" class="space-y-3">
              <div class="text-xs text-slate-400 text-center py-6">Đang tải dữ liệu ngân sách...</div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="glass-card p-5 rounded-2xl lg:col-span-2">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-blue-400"></i>
                Giao Dịch Gần Đây
              </h3>
              <button id="btn-view-all-txs" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">Xem tất cả &rarr;</button>
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
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition gradient-emerald text-white shadow-sm';
      } else {
        btn.className = 'dash-period-pill px-3 py-1.5 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200';
      }
    });

    const sub = document.getElementById('dashboard-period-subtitle');
    if (sub) {
      sub.innerHTML = `Thống kê dòng tiền & sức khỏe tài chính kỳ: <span class="font-bold text-emerald-400">${this.formatMonthLabel(this.selectedMonth)}</span>`;
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
    const eyeIconClass = this.isBalanceHidden ? 'fa-eye-slash text-amber-400' : 'fa-eye text-emerald-400';

    container.innerHTML = `
      <!-- 1. Total Net Worth with Eye Toggle -->
      <div class="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-300 transition stagger-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Tài Sản Ròng</span>
            <button id="btn-toggle-balance" class="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition" title="${this.isBalanceHidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}">
              <i class="fa-solid ${eyeIconClass} text-[11px]"></i>
            </button>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base shadow-sm border border-emerald-500/20">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-slate-100 font-mono tracking-tight" id="dash-net-worth-val">${netWorthText}</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
          <i class="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
          <span>Tổng số dư tất cả các ví khả dụng</span>
        </div>
      </div>

      <!-- 2. Income this month -->
      <div class="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-blue-300 transition stagger-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Thu Kỳ Này</span>
          <div class="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-base shadow-sm border border-blue-500/20">
            <i class="fa-solid fa-circle-arrow-down"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-blue-400 font-mono tracking-tight">+${formatVND(kpis.total_income_month)}</span>
        </div>
        <div class="mt-1 text-[11px] ${kpis.income_change_vs_last_month_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium flex items-center gap-1">
          <i class="fa-solid ${kpis.income_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.income_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.income_change_vs_last_month_pct}% so với tháng trước</span>
        </div>
      </div>

      <!-- 3. Expense this month -->
      <div class="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-red-300 transition stagger-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Chi Kỳ Này</span>
          <div class="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-base shadow-sm border border-rose-500/20">
            <i class="fa-solid fa-circle-arrow-up"></i>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-xl font-black text-rose-400 font-mono tracking-tight">-${formatVND(kpis.total_expense_month)}</span>
        </div>
        <div class="mt-1 text-[11px] ${kpis.expense_change_vs_last_month_pct <= 0 ? 'text-emerald-400' : 'text-amber-400'} font-medium flex items-center gap-1">
          <i class="fa-solid ${kpis.expense_change_vs_last_month_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
          <span>${kpis.expense_change_vs_last_month_pct >= 0 ? '+' : ''}${kpis.expense_change_vs_last_month_pct}% so với tháng trước</span>
        </div>
      </div>

      <!-- 4. Savings Rate -->
      <div class="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-300 transition stagger-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Tiết Kiệm</span>
          <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-base shadow-sm border border-indigo-500/20">
            <i class="fa-solid fa-piggy-bank"></i>
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-xl font-black text-indigo-400 font-mono tracking-tight">${kpis.savings_rate_month}%</span>
          <span class="text-xs text-slate-400">(${formatVND(kpis.net_savings_month)})</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-400">
          ${kpis.savings_rate_month >= 20 ? '✨ Đạt chuẩn tài chính 50/30/20' : '⚠️ Mục tiêu tối thiểu 20%'}
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

    // Create high-DPI gradients
    const incomeGrad = ctx.createLinearGradient(0, 0, 0, 240);
    incomeGrad.addColorStop(0, 'rgba(0, 255, 170, 0.95)');
    incomeGrad.addColorStop(1, 'rgba(0, 255, 170, 0.2)');

    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 240);
    expenseGrad.addColorStop(0, 'rgba(176, 38, 255, 0.95)');
    expenseGrad.addColorStop(1, 'rgba(176, 38, 255, 0.2)');

    const lineFillGrad = ctx.createLinearGradient(0, 0, 0, 240);
    lineFillGrad.addColorStop(0, 'rgba(129, 140, 248, 0.25)');
    lineFillGrad.addColorStop(1, 'rgba(129, 140, 248, 0.0)');

    this.cashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Thu Nhập',
            data: incomeData,
            backgroundColor: incomeGrad,
            hoverBackgroundColor: '#00FFAA',
            borderRadius: 8,
            barPercentage: 0.65,
            categoryPercentage: 0.8
          },
          {
            label: 'Chi Tiêu',
            data: expenseData,
            backgroundColor: expenseGrad,
            hoverBackgroundColor: '#B026FF',
            borderRadius: 8,
            barPercentage: 0.65,
            categoryPercentage: 0.8
          },
          {
            label: 'Dư Tích Lũy',
            data: netData,
            type: 'line',
            borderColor: '#818cf8',
            backgroundColor: lineFillGrad,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#818cf8',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
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
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans', size: 10 },
              callback: (val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val <= -1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }
            }
          }
        }
      }
    });
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

    // Mapping Neon Color Palette theo yêu cầu:
    // Tiền nhà & Cố định: #B026FF (Quantum Violet)
    // Ăn uống & Thực phẩm: #00FFAA (Aura Green)
    // Mua sắm & Đồ công nghệ: #00E5FF (Nebula Cyan)
    // Cà phê & Tiếp khách: #FF007A (Neon Rose)
    // Đi lại & Xăng xe: #FFAA00 (Amber Glow)
    // Sức khỏe & Thể thao: #3B82F6 (Electric Blue)
    function getCategoryNeonColor(catName, index) {
      const defaultPalette = ['#B026FF', '#00FFAA', '#00E5FF', '#FF007A', '#FFAA00', '#3B82F6', '#EC4899', '#10B981'];
      if (!catName) return defaultPalette[index % defaultPalette.length];
      const lower = catName.toLowerCase();
      if (lower.includes('nhà') || lower.includes('thuê') || lower.includes('cố định')) return '#B026FF';
      if (lower.includes('ăn') || lower.includes('thực phẩm') || lower.includes('uống')) return '#00FFAA';
      if (lower.includes('mua sắm') || lower.includes('công nghệ') || lower.includes('sắm')) return '#00E5FF';
      if (lower.includes('cà phê') || lower.includes('cafe') || lower.includes('tiếp khách') || lower.includes('đối tác') || lower.includes('giải trí')) return '#FF007A';
      if (lower.includes('đi lại') || lower.includes('xăng') || lower.includes('di chuyển') || lower.includes('xe')) return '#FFAA00';
      if (lower.includes('sức khỏe') || lower.includes('thể thao') || lower.includes('gym') || lower.includes('y tế')) return '#3B82F6';
      return defaultPalette[index % defaultPalette.length];
    }

    const labels = items.map(i => i.category_name);
    const dataVals = items.map(i => i.total_amount);
    const colors = items.map((i, idx) => i.color || getCategoryNeonColor(i.category_name, idx));

    // Custom Cyberpunk HTML Legend
    if (legendContainer) {
      legendContainer.innerHTML = items.map((item, idx) => {
        const color = colors[idx];
        const pct = item.percentage !== undefined ? item.percentage : (totalExpense > 0 ? ((item.total_amount / totalExpense) * 100).toFixed(1) : 0);
        return `
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition group">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}80;"></span>
              <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition">${item.category_name}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">${pct}%</span>
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
        ctx.fillStyle = '#FFFFFF';
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
          hoverOffset: 6,
          hoverBorderColor: '#FFFFFF'
        }]
      },
      plugins: [centerTextPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(11, 15, 25, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#00FFAA',
            borderColor: 'rgba(0, 255, 170, 0.3)',
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
  }

  renderBudgetAlerts(budgets) {
    const container = document.getElementById('budget-alerts-list');
    if (!container) return;

    if (!budgets || budgets.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-slate-400 text-xs">
          Chưa thiết lập hạn mức kỳ này.<br/>
          <button id="btn-quick-set-budget" class="text-emerald-400 font-bold mt-1 hover:underline">+ Đặt hạn mức ngay</button>
        </div>
      `;
      document.getElementById('btn-quick-set-budget')?.addEventListener('click', () => this.app.navigate('budgets'));
      return;
    }

    container.innerHTML = budgets.slice(0, 4).map(b => {
      const isOver = b.status === 'OVERSPENT';
      const isWarn = b.status === 'WARNING';
      const colorClass = isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';
      const textClass = isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';
      const badgeText = isOver ? `Vượt ${Math.round(b.percentage - 100)}%` : isWarn ? `Đã dùng ${b.percentage}%` : 'An toàn';

      return `
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 transition">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-slate-200">${b.category ? b.category.name : 'Danh mục'}</span>
            <span class="font-bold ${textClass} text-[11px]">${badgeText}</span>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="${colorClass} progress-animated h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, b.percentage)}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 mt-1">
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
      const amountColor = isIncome ? 'text-emerald-400' : isTransfer ? 'text-indigo-400' : 'text-rose-400';

      const catName = t.category ? t.category.name : isTransfer ? 'Chuyển tiền' : 'Chung';
      const catColor = t.category ? (t.category.color || '#10B981') : '#6366F1';
      const catIcon = t.category ? (t.category.icon || 'receipt') : 'arrow-right-arrow-left';

      return `
        <tr class="hover:bg-slate-800/50 transition">
          <td class="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
            ${formatDateVN(t.transaction_date)}
          </td>
          <td class="py-2.5">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-white shadow-sm flex-shrink-0" style="background-color: ${catColor}">
                <i class="fa-solid fa-${catIcon}"></i>
              </span>
              <div class="min-w-0">
                <span class="font-bold text-slate-200 block truncate">${catName}</span>
                ${t.note ? `<span class="text-[10px] text-slate-400 block truncate">${t.note}</span>` : ''}
              </div>
            </div>
          </td>
          <td class="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">${t.wallet ? t.wallet.name : ''}</span>
          </td>
          <td class="py-2.5 text-right font-black font-mono text-xs ${amountColor} whitespace-nowrap">
            ${sign} ${formatVND(t.amount)}
          </td>
        </tr>
      `;
    }).join('');
  }
}
