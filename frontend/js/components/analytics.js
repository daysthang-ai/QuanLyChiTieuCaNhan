import { api } from '../api.js';
import { formatVND, getCurrentMonthStr } from '../utils/formatters.js';

export class AnalyticsComponent {
  constructor(app) {
    this.app = app;
    this.selectedMonth = getCurrentMonthStr();
    this.categoryChart = null;
    this.cashflowChart = null;
  }

  async render(container) {
    // Clean up old charts before re-rendering
    this.destroyCharts();

    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Phân Tích & Báo Cáo Chi Tiêu</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">Cá Nhân</span>
            </h1>
            <p class="text-slate-400 text-xs mt-0.5">
              Theo dõi dòng tiền, cơ cấu chi phí thực tế và kiểm soát quy tắc 50/30/20
            </p>
          </div>
          
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Month Selector -->
            <div class="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs shadow-inner">
              <i class="fa-regular fa-calendar text-slate-400 text-xs"></i>
              <span class="text-slate-400 font-semibold">Kỳ:</span>
              <input type="month" id="analytics-month-picker" value="${this.selectedMonth}" 
                class="font-bold text-emerald-400 bg-transparent border-0 focus:outline-none cursor-pointer text-xs" />
            </div>

            <!-- Export Buttons -->
            <div class="flex items-center gap-1.5">
              <button id="btn-export-excel" class="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5" title="Xuất file Excel">
                <i class="fa-solid fa-file-excel"></i>
                <span class="hidden sm:inline">Xuất Excel</span>
              </button>
              <button id="btn-export-pdf" class="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition flex items-center gap-1.5" title="Xuất file PDF">
                <i class="fa-solid fa-file-pdf"></i>
                <span class="hidden sm:inline">Xuất PDF</span>
              </button>
              <button id="btn-export-csv" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 active:scale-95 transition" title="Xuất file CSV">
                <i class="fa-solid fa-file-csv"></i>
                <span class="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4 KPI Summary Cards (Personal Cashflow) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-kpi-cards">
          <div class="glass-card p-5 rounded-2xl animate-pulse h-28"></div>
          <div class="glass-card p-5 rounded-2xl animate-pulse h-28"></div>
          <div class="glass-card p-5 rounded-2xl animate-pulse h-28"></div>
          <div class="glass-card p-5 rounded-2xl animate-pulse h-28"></div>
        </div>

        <!-- Main Breakdown & 50/30/20 Row -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Category Spending Breakdown (Left Column - 6 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-6 flex flex-col justify-between" id="analytics-category-card">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-sm border border-rose-500/30">
                    <i class="fa-solid fa-chart-pie"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Tiền Của Bạn Đi Đâu?</h3>
                    <p class="text-[11px] text-slate-400">Cơ cấu các khoản chi tiêu nhiều nhất</p>
                  </div>
                </div>
                <span id="analytics-total-exp-badge" class="text-xs font-black text-rose-400 font-mono">0 ₫</span>
              </div>

              <!-- Donut Chart & Legend -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center" id="analytics-category-body">
                <div class="sm:col-span-5 flex justify-center py-2">
                  <div class="relative flex items-center justify-center" style="width: 160px; height: 160px; min-width: 160px; min-height: 160px;">
                    <canvas id="analytics-cat-donut"></canvas>
                  </div>
                </div>
                <div class="sm:col-span-7 space-y-2.5" id="analytics-top-categories-list">
                  <div class="py-8 text-center text-slate-500 text-xs">Đang tải cơ cấu chi tiêu...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 50/30/20 Personal Rule (Right Column - 6 Cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-6 flex flex-col justify-between" id="analytics-fifty-card">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm border border-amber-500/30">
                    <i class="fa-solid fa-scale-balanced"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Cân Đối Quy Tắc 50 / 30 / 20</h3>
                    <p class="text-[11px] text-slate-400">Chuẩn phân bổ cho sinh viên & người đi làm</p>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">Chuẩn Cá Nhân</span>
              </div>

              <div id="analytics-fifty-bars" class="space-y-3.5 pt-1">
                <div class="py-8 text-center text-slate-500 text-xs">Đang tải phân tích 50/30/20...</div>
              </div>
            </div>

            <!-- Evaluation Box -->
            <div id="analytics-fifty-eval" class="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 mt-4 text-xs text-slate-300 flex items-start gap-2.5">
              <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5 text-sm flex-shrink-0"></i>
              <div class="flex-1 text-[11px] leading-relaxed text-slate-300" id="analytics-fifty-eval-text">
                Đang phân tích...
              </div>
            </div>
          </div>

        </div>

        <!-- 6-Month Cashflow Trend & AI Health Advice Row -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- 6 Months Trend (7 cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-7 flex flex-col justify-between">
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                  <i class="fa-solid fa-chart-column"></i>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-slate-100">Dòng Tiền Thu - Chi 6 Tháng Gần Nhất</h3>
                  <p class="text-[11px] text-slate-400">So sánh thu nhập và chi tiêu theo từng tháng</p>
                </div>
              </div>
            </div>
            
            <div class="relative w-full" style="height: 220px; min-height: 220px; max-height: 220px;">
              <canvas id="analytics-cashflow-chart"></canvas>
            </div>
          </div>

          <!-- AI Financial Doctor Advice Card (5 cols) -->
          <div class="glass-card p-5 rounded-3xl lg:col-span-5 flex flex-col justify-between border border-indigo-500/20 bg-indigo-950/10">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl gradient-indigo text-white flex items-center justify-center text-sm shadow-md shadow-indigo-500/30">
                    <i class="fa-solid fa-wand-magic-sparkles text-amber-300 text-xs"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-100">Bác Sĩ Tài Chính AI</h3>
                    <p class="text-[11px] text-slate-400">Chẩn đoán và gợi ý bỏ túi</p>
                  </div>
                </div>
                <button id="btn-refresh-ai-health" class="p-1.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition active:scale-95" title="Làm mới phân tích AI">
                  <i class="fa-solid fa-arrows-rotate text-xs"></i>
                </button>
              </div>

              <!-- Score & Advice Content -->
              <div id="analytics-ai-health-content" class="space-y-3">
                <div class="py-10 text-center text-slate-400 text-xs">
                  <i class="fa-solid fa-spinner fa-spin text-indigo-400 text-lg mb-2 block"></i>
                  Đang quét và chẩn đoán...
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Bind event listeners
    document.getElementById('analytics-month-picker')?.addEventListener('change', (e) => {
      this.selectedMonth = e.target.value;
      this.loadAllData();
    });

    document.getElementById('btn-export-excel')?.addEventListener('click', () => this.handleExport('excel'));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.handleExport('csv'));
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.handleExport('pdf'));
    document.getElementById('btn-refresh-ai-health')?.addEventListener('click', () => this.loadAIHealthOnly());

    // Load all data in parallel
    await this.loadAllData();
  }

  destroyCharts() {
    if (this.categoryChart) {
      try { this.categoryChart.destroy(); } catch (e) {}
      this.categoryChart = null;
    }
    if (this.cashflowChart) {
      try { this.cashflowChart.destroy(); } catch (e) {}
      this.cashflowChart = null;
    }
  }

  async loadAllData() {
    try {
      const [kpis, categories, fifty, cashflow] = await Promise.all([
        api.getSummaryKPIs(this.selectedMonth).catch(() => null),
        api.getCategoryBreakdown(this.selectedMonth).catch(() => []),
        api.getFiftyThirtyTwenty(this.selectedMonth).catch(() => null),
        api.getCashflowTrend(6).catch(() => [])
      ]);

      if (kpis) this.renderKPIs(kpis);
      this.renderCategoryBreakdown(categories || []);
      if (fifty) this.renderFiftyThirty(fifty);
      if (cashflow) this.renderCashflowChart(cashflow);

      // Load AI report in background
      this.loadAIHealthOnly();
    } catch (e) {
      console.error('[Analytics] Load all error:', e);
    }
  }

  renderKPIs(kpis) {
    const container = document.getElementById('analytics-kpi-cards');
    if (!container) return;

    const netSavings = kpis.net_savings_month;
    const isNetPositive = netSavings >= 0;
    const savingsRate = kpis.savings_rate_month;

    // Rate appraisal badge
    let rateBadgeText = 'An toàn';
    let rateBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (savingsRate >= 25) {
      rateBadgeText = 'Xuất sắc ⭐';
      rateBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    } else if (savingsRate >= 15) {
      rateBadgeText = 'Rất tốt ✨';
      rateBadgeClass = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    } else if (savingsRate > 0) {
      rateBadgeText = 'Cân bằng';
      rateBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    } else {
      rateBadgeText = 'Bội chi ⚠️';
      rateBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }

    container.innerHTML = `
      <!-- Total Income -->
      <div class="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thu Nhập Kỳ Này</span>
          <div class="text-xl font-black text-emerald-400 font-mono tracking-tight">${formatVND(kpis.total_income_month)}</div>
          <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            ${kpis.income_change_vs_last_month_pct >= 0 
              ? `<span class="text-emerald-400 font-bold"><i class="fa-solid fa-arrow-trend-up"></i> +${kpis.income_change_vs_last_month_pct}%</span>` 
              : `<span class="text-rose-400 font-bold"><i class="fa-solid fa-arrow-trend-down"></i> ${kpis.income_change_vs_last_month_pct}%</span>`}
            <span>so với tháng trước</span>
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/25">
          <i class="fa-solid fa-wallet"></i>
        </div>
      </div>

      <!-- Total Expense -->
      <div class="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tổng Đã Chi Tiêu</span>
          <div class="text-xl font-black text-rose-400 font-mono tracking-tight">${formatVND(kpis.total_expense_month)}</div>
          <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            ${kpis.expense_change_vs_last_month_pct <= 0 
              ? `<span class="text-emerald-400 font-bold"><i class="fa-solid fa-arrow-trend-down"></i> ${kpis.expense_change_vs_last_month_pct}%</span>` 
              : `<span class="text-rose-400 font-bold"><i class="fa-solid fa-arrow-trend-up"></i> +${kpis.expense_change_vs_last_month_pct}%</span>`}
            <span>so với tháng trước</span>
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-lg border border-rose-500/25">
          <i class="fa-solid fa-receipt"></i>
        </div>
      </div>

      <!-- Net Savings (Leftover Money) -->
      <div class="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dư Tiền Tích Lũy</span>
          <div class="text-xl font-black ${isNetPositive ? 'text-teal-400' : 'text-rose-400'} font-mono tracking-tight">
            ${isNetPositive ? '+' : ''}${formatVND(netSavings)}
          </div>
          <div class="text-[10px] text-slate-400 mt-1">
            ${isNetPositive ? 'Dòng tiền dương lành mạnh' : 'Tháng này chi nhiều hơn thu'}
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl ${isNetPositive ? 'bg-teal-500/15 text-teal-400 border-teal-500/25' : 'bg-rose-500/15 text-rose-400 border-rose-500/25'} flex items-center justify-center text-lg border">
          <i class="fa-solid ${isNetPositive ? 'fa-piggy-bank' : 'fa-triangle-exclamation'}"></i>
        </div>
      </div>

      <!-- Savings Rate -->
      <div class="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tỷ Lệ Tích Lũy</span>
          <div class="text-xl font-black text-cyan-400 font-mono tracking-tight">${savingsRate}%</div>
          <div class="mt-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${rateBadgeClass}">
              ${rateBadgeText}
            </span>
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg border border-cyan-500/25">
          <i class="fa-solid fa-chart-pie"></i>
        </div>
      </div>
    `;
  }

  renderCategoryBreakdown(categories) {
    const totalBadge = document.getElementById('analytics-total-exp-badge');
    const listContainer = document.getElementById('analytics-top-categories-list');
    const canvas = document.getElementById('analytics-cat-donut');

    const totalExpense = categories.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    if (totalBadge) totalBadge.textContent = formatVND(totalExpense);

    if (!categories || categories.length === 0) {
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="py-8 text-center text-slate-400 text-xs">
            <i class="fa-solid fa-basket-shopping text-2xl text-slate-600 mb-1.5 block"></i>
            Chưa có chi tiêu nào trong kỳ này.
          </div>
        `;
      }
      return;
    }

    // Top 4 categories + Others
    const top4 = categories.slice(0, 4);
    const others = categories.slice(4);
    const otherTotal = others.reduce((sum, c) => sum + c.total_amount, 0);

    if (listContainer) {
      listContainer.innerHTML = top4.map(c => `
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
          <div class="flex items-center justify-between text-xs mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${c.color || '#10B981'}"></span>
              <span class="font-bold text-slate-200 truncate">${c.category_name}</span>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="font-bold text-slate-100 font-mono">${formatVND(c.total_amount)}</span>
              <span class="text-[10px] text-slate-400 font-mono ml-1">(${c.percentage}%)</span>
            </div>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" style="width: ${c.percentage}%; background-color: ${c.color || '#10B981'}"></div>
          </div>
        </div>
      `).join('') + (otherTotal > 0 ? `
        <div class="p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            Các danh mục khác (${others.length})
          </span>
          <span class="font-mono text-slate-300 font-bold">${formatVND(otherTotal)}</span>
        </div>
      ` : '');
    }

    // Render Donut Chart
    if (canvas) {
      if (window.Chart) {
        const existing = Chart.getChart(canvas);
        if (existing) existing.destroy();
      }
      if (this.categoryChart) {
        try { this.categoryChart.destroy(); } catch (e) {}
        this.categoryChart = null;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const labels = top4.map(c => c.category_name);
      const dataValues = top4.map(c => c.total_amount);
      const colors = top4.map(c => c.color || '#10B981');

      if (otherTotal > 0) {
        labels.push('Khác');
        dataValues.push(otherTotal);
        colors.push('#64748B');
      }

      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: dataValues,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 50,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.raw || 0;
                  const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
                  return ` ${formatVND(val)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  renderFiftyThirty(data) {
    const barsContainer = document.getElementById('analytics-fifty-bars');
    const evalText = document.getElementById('analytics-fifty-eval-text');

    if (!barsContainer) return;

    const needsPct = Math.round(data.needs_actual_pct);
    const wantsPct = Math.round(data.wants_actual_pct);
    const savingsPct = Math.round(data.savings_actual_pct);

    barsContainer.innerHTML = `
      <!-- Needs (50%) -->
      <div>
        <div class="flex items-center justify-between text-xs font-bold mb-1">
          <span class="text-slate-200 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Nhu Cầu Thiết Yếu (Ăn ở, sinh hoạt)
          </span>
          <span class="font-mono text-slate-100">
            ${formatVND(data.needs_actual_amount)} 
            <b class="${needsPct > 55 ? 'text-rose-400' : 'text-emerald-400'} ml-1">(${needsPct}% / 50%)</b>
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
          <div class="h-full ${needsPct > 55 ? 'bg-rose-500' : 'bg-blue-500'} rounded-full transition-all duration-500" style="width: ${Math.min(100, needsPct)}%"></div>
        </div>
      </div>

      <!-- Wants (30%) -->
      <div>
        <div class="flex items-center justify-between text-xs font-bold mb-1">
          <span class="text-slate-200 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Mong Muốn (Cafe, mua sắm, giải trí)
          </span>
          <span class="font-mono text-slate-100">
            ${formatVND(data.wants_actual_amount)} 
            <b class="${wantsPct > 35 ? 'text-amber-400' : 'text-emerald-400'} ml-1">(${wantsPct}% / 30%)</b>
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
          <div class="h-full ${wantsPct > 35 ? 'bg-amber-500' : 'bg-purple-500'} rounded-full transition-all duration-500" style="width: ${Math.min(100, wantsPct)}%"></div>
        </div>
      </div>

      <!-- Savings (20%) -->
      <div>
        <div class="flex items-center justify-between text-xs font-bold mb-1">
          <span class="text-slate-200 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tiết Kiệm & Tích Lũy (Bỏ heo, đầu tư)
          </span>
          <span class="font-mono text-slate-100">
            ${formatVND(data.savings_actual_amount)} 
            <b class="${savingsPct >= 20 ? 'text-emerald-400' : 'text-amber-400'} ml-1">(${savingsPct}% / 20%)</b>
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
          <div class="h-full ${savingsPct >= 20 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full transition-all duration-500" style="width: ${Math.min(100, savingsPct)}%"></div>
        </div>
      </div>
    `;

    if (evalText) {
      evalText.textContent = data.evaluation || 'Cơ cấu chi tiêu rất tốt! Tiếp tục duy trì phong độ kỷ luật tài chính nhé!';
    }
  }

  renderCashflowChart(cashflowData) {
    const canvas = document.getElementById('analytics-cashflow-chart');
    if (!canvas) return;

    if (window.Chart) {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
    }
    if (this.cashflowChart) {
      try { this.cashflowChart.destroy(); } catch (e) {}
      this.cashflowChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = cashflowData.map(d => d.label);
    const incomeData = cashflowData.map(d => d.income);
    const expenseData = cashflowData.map(d => d.expense);

    this.cashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Thu vào',
            data: incomeData,
            backgroundColor: '#10B981',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Chi tiêu',
            data: expenseData,
            backgroundColor: '#F43F5E',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 50,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatVND(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              callback: (val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Tr`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }
            }
          }
        }
      }
    });
  }

  async loadAIHealthOnly() {
    const container = document.getElementById('analytics-ai-health-content');
    if (!container) return;

    try {
      const res = await api.getFinancialHealthReport(this.selectedMonth);

      const score = res.health_score || 75;
      let scoreColor = 'text-emerald-400';
      let scoreBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      let scoreText = 'Tài chính khỏe mạnh';

      if (score < 60) {
        scoreColor = 'text-rose-400';
        scoreBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        scoreText = 'Cần thắt lưng buộc bụng';
      } else if (score < 75) {
        scoreColor = 'text-amber-400';
        scoreBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        scoreText = 'Tài chính khá tốt';
      }

      // Convert recommendations into practical bullets
      const recs = res.action_recommendations || [
        'Đặt hạn mức ngân sách cho khoản ăn ngoài và cafe.',
        'Trích ít nhất 15-20% thu nhập ngay khi nhận lương hoặc tiền phụ cấp.'
      ];

      container.innerHTML = `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="text-3xl font-black ${scoreColor} font-mono tracking-tight">${score}</div>
            <div>
              <span class="text-xs font-black text-slate-100 block">Điểm Sức Khỏe Tài Chính</span>
              <span class="text-[10px] text-slate-400">Thang điểm 100 theo tiêu chuẩn cá nhân</span>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black border ${scoreBadge}">
            ${scoreText}
          </span>
        </div>

        <div class="space-y-2 pt-1">
          <span class="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-emerald-400"></i> Lời Khuyên Hành Động:
          </span>
          <div class="space-y-1.5">
            ${recs.map(r => `
              <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                <i class="fa-solid fa-arrow-right text-indigo-400 mt-0.5 text-[10px] flex-shrink-0"></i>
                <span class="leading-relaxed">${r}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          <i class="fa-solid fa-circle-info text-indigo-400 mb-1 block"></i>
          Ghi chép thêm vài giao dịch thu - chi để AI đưa ra lời khuyên chính xác nhất cho bạn nhé!
        </div>
      `;
    }
  }

  async handleExport(format) {
    try {
      this.app.showToast(`Đang tạo file báo cáo ${format.toUpperCase()}...`, 'info');
      let blob;
      let filename = `FinTrack_BaoCao_${this.selectedMonth}`;

      if (format === 'excel') {
        blob = await api.downloadExcel(this.selectedMonth);
        filename += '.xlsx';
      } else if (format === 'csv') {
        blob = await api.downloadCSV(this.selectedMonth);
        filename += '.csv';
      } else if (format === 'pdf') {
        blob = await api.downloadPDF(this.selectedMonth);
        filename += '.pdf';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      this.app.showToast(`Tải file ${filename} thành công!`, 'success');
    } catch (e) {
      console.error('Export error:', e);
      this.app.showToast(`Xuất file thất bại: ${e.message}`, 'error');
    }
  }
}
