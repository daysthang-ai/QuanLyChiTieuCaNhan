import { api } from '../api.js';
import { formatVND } from '../utils/formatters.js';

export class BadgesComponent {
  constructor(app) {
    this.app = app;
    this.badgesData = null;
    this.activeFilter = 'ALL';
  }

  async render(container) {
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Gamification Banner Header -->
        <div class="glass-card p-6 rounded-3xl relative overflow-hidden border border-amber-500/20 shadow-xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
          
          <!-- Background Glow Elements -->
          <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <!-- Left Profile & Level -->
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="w-16 h-16 rounded-2xl gradient-amber flex items-center justify-center text-2xl text-slate-950 shadow-lg shadow-amber-500/25 ring-4 ring-amber-400/30">
                  <i class="fa-solid fa-crown"></i>
                </div>
                <span class="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm">
                  LV.<span id="gamification-level-num">1</span>
                </span>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight" id="gamification-level-title">
                    Tập Sự Tài Chính
                  </h1>
                  <span class="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-bold border border-amber-400/20">
                    Thành Tích FinTrack
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  Chinh phục các cột mốc tài chính, duy trì kỷ luật và nâng hạng danh hiệu của bạn!
                </p>
                
                <!-- Level XP Progress Bar -->
                <div class="mt-3 flex items-center gap-3">
                  <div class="w-48 sm:w-64 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80">
                    <div id="gamification-xp-bar" class="h-full gradient-amber rounded-full transition-all duration-700" style="width: 0%"></div>
                  </div>
                  <span class="text-[11px] font-bold text-amber-400 font-mono" id="gamification-xp-text">0 / 300 XP</span>
                </div>
              </div>
            </div>

            <!-- Right Stats: Streak & Badges Progress -->
            <div class="flex items-center gap-4 flex-shrink-0">
              
              <!-- Streak Pill -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-orange-500/30 text-center min-w-[130px] shadow-lg shadow-orange-500/5">
                <div class="flex items-center justify-center gap-1.5 text-orange-400 text-sm font-black mb-1">
                  <i class="fa-solid fa-fire text-orange-500 animate-pulse text-base"></i>
                  <span>CHUỖI KỶ LUẬT</span>
                </div>
                <div class="text-2xl font-black text-slate-100 font-mono tracking-tight" id="gamification-streak-days">
                  0 Ngày
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">Ghi chép liên tiếp</div>
              </div>

              <!-- Unlocked Count Pill -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center min-w-[130px] shadow-lg shadow-emerald-500/5">
                <div class="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-black mb-1">
                  <i class="fa-solid fa-award text-emerald-400 text-base"></i>
                  <span>HUY HIỆU ĐẠT</span>
                </div>
                <div class="text-2xl font-black text-emerald-400 font-mono tracking-tight" id="gamification-badges-unlocked">
                  0 / 0
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5" id="gamification-completion-pct">0% hoàn thành</div>
              </div>

            </div>

          </div>

        </div>

        <!-- Section: HUY HIỆU SẮP MỞ KHÓA (GẦN ĐẠT NHẤT) -->
        <div id="upcoming-badges-showcase-section" class="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-indigo-950/10">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                <i class="fa-solid fa-bullseye"></i>
              </span>
              <div>
                <h3 class="text-sm font-extrabold text-slate-100">Huy Hiệu Sắp Mở Khóa (Đang Thực Hiện)</h3>
                <p class="text-[11px] text-slate-400">Các mục tiêu bạn đang tiến gần nhất tới đích</p>
              </div>
            </div>
            <button id="btn-view-all-locked-tab" class="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
              Xem toàn bộ kho chưa mở khóa &rarr;
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5" id="upcoming-badges-grid">
            <!-- Dynamically populated top 3 closest badges -->
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition gradient-emerald text-white shadow-sm" data-filter="ALL">
            Tất Cả Huy Hiệu (<span id="count-filter-all">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="UNLOCKED">
            <i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> Đã Mở Khóa (<span id="count-filter-unlocked">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="LOCKED">
            <i class="fa-solid fa-lock text-slate-500 mr-1"></i> Chưa Mở Khóa (<span id="count-filter-locked">0</span>)
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="STREAK">
            🔥 Chuỗi Kỷ Luật
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="SAVINGS">
            💰 Tích Lũy & Tài Sản
          </button>
          <button type="button" class="badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800" data-filter="MASTERY">
            ⚡ Quản Trị & AI
          </button>
        </div>

        <!-- Badges Grid Container -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="badges-cards-grid">
          <div class="glass-card p-6 rounded-2xl animate-pulse h-48"></div>
        </div>

      </div>
    `;

    // Bind Filter Events
    document.querySelectorAll('.badge-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeFilter = tab.getAttribute('data-filter');
        this.updateFilterButtonsUI();
        this.renderBadgesGrid();
      });
    });

    document.getElementById('btn-view-all-locked-tab')?.addEventListener('click', () => {
      this.activeFilter = 'LOCKED';
      this.updateFilterButtonsUI();
      this.renderBadgesGrid();
    });

    await this.loadBadges();
  }

  updateFilterButtonsUI() {
    document.querySelectorAll('.badge-filter-tab').forEach(btn => {
      if (btn.getAttribute('data-filter') === this.activeFilter) {
        btn.className = 'badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition gradient-emerald text-white shadow-sm';
      } else {
        btn.className = 'badge-filter-tab px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800';
      }
    });
  }

  async loadBadges() {
    try {
      const data = await api.getBadges();
      this.badgesData = data;

      // Update Header Stats
      document.getElementById('gamification-level-num').textContent = data.level;
      document.getElementById('gamification-level-title').textContent = data.level_title;
      document.getElementById('gamification-streak-days').textContent = `${data.current_streak} Ngày`;
      document.getElementById('gamification-badges-unlocked').textContent = `${data.unlocked_count} / ${data.total_count}`;
      document.getElementById('gamification-completion-pct').textContent = `${data.completion_pct}% hoàn thành`;

      const xpBar = document.getElementById('gamification-xp-bar');
      const xpText = document.getElementById('gamification-xp-text');
      const currentLevelXP = data.xp % 300;
      if (xpBar) xpBar.style.width = `${Math.min(100, Math.round(currentLevelXP / 300 * 100))}%`;
      if (xpText) xpText.textContent = `${currentLevelXP} / 300 XP`;

      // Update Filter Counts
      document.getElementById('count-filter-all').textContent = data.total_count;
      document.getElementById('count-filter-unlocked').textContent = data.unlocked_count;
      document.getElementById('count-filter-locked').textContent = data.total_count - data.unlocked_count;

      this.renderUpcomingShowcase();
      this.renderBadgesGrid();
    } catch (e) {
      console.error('[Badges] Load error:', e);
      this.app.showToast('Không thể tải dữ liệu thành tích', 'error');
    }
  }

  renderUpcomingShowcase() {
    const container = document.getElementById('upcoming-badges-grid');
    if (!container || !this.badgesData) return;

    // Find locked badges sorted by progress percentage descending
    const lockedBadges = this.badgesData.badges
      .filter(b => !b.is_unlocked)
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3);

    if (lockedBadges.length === 0) {
      document.getElementById('upcoming-badges-showcase-section')?.classList.add('hidden');
      return;
    }

    container.innerHTML = lockedBadges.map(b => {
      const formatVal = (val, unit) => {
        if (unit === '₫') return formatVND(val);
        return `${val} ${unit}`;
      };

      return `
        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 flex flex-col justify-between hover:border-indigo-500/50 transition cursor-pointer group"
          onclick="window.openBadgeModal('${b.id}')">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                  <i class="${b.icon}"></i>
                </div>
                <span class="font-extrabold text-xs text-slate-100 group-hover:text-indigo-300 transition">${b.title}</span>
              </div>
              <span class="text-[10px] font-bold text-indigo-400 font-mono">${b.progress_pct}%</span>
            </div>
            <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${b.description}</p>
          </div>

          <div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${b.progress_pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span>Đạt: ${formatVal(b.current_val, b.unit)}</span>
              <span>Mục tiêu: ${formatVal(b.target_val, b.unit)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderBadgesGrid() {
    const grid = document.getElementById('badges-cards-grid');
    if (!grid || !this.badgesData) return;

    let badges = this.badgesData.badges;

    if (this.activeFilter === 'UNLOCKED') {
      badges = badges.filter(b => b.is_unlocked);
    } else if (this.activeFilter === 'LOCKED') {
      badges = badges.filter(b => !b.is_unlocked);
    } else if (this.activeFilter === 'STREAK') {
      badges = badges.filter(b => b.category === 'STREAK');
    } else if (this.activeFilter === 'SAVINGS') {
      badges = badges.filter(b => b.category === 'SAVINGS');
    } else if (this.activeFilter === 'MASTERY') {
      badges = badges.filter(b => b.category === 'MASTERY');
    }

    if (badges.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl">
          <i class="fa-solid fa-trophy text-3xl mb-2 text-slate-600 block"></i>
          Không có huy hiệu nào trong danh mục này.
        </div>
      `;
      return;
    }

    grid.innerHTML = badges.map(b => {
      const isUnlocked = b.is_unlocked;
      const tier = b.tier;

      // Tier styling configurations with rich gradients, 3D icons and distinct glowing frames
      const tierStyles = {
        'BRONZE': {
          border: isUnlocked ? 'border-amber-700/60 bg-gradient-to-br from-amber-950/40 via-stone-900 to-slate-900 shadow-lg shadow-amber-900/20' : 'border-slate-800 bg-slate-900/40',
          badgeColor: 'text-amber-500',
          bgIcon: 'gradient-bronze text-amber-100 border border-amber-500/70 shadow-md shadow-amber-900/40',
          pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          ring: 'ring-amber-600/40',
          glow: 'bg-amber-600/20'
        },
        'SILVER': {
          border: isUnlocked ? 'border-slate-400/60 bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-900 shadow-lg shadow-slate-400/15' : 'border-slate-800 bg-slate-900/40',
          badgeColor: 'text-slate-200',
          bgIcon: 'gradient-silver text-white border border-slate-300/80 shadow-md shadow-slate-400/30',
          pill: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
          ring: 'ring-slate-400/40',
          glow: 'bg-slate-400/20'
        },
        'GOLD': {
          border: isUnlocked ? 'border-amber-400/70 bg-gradient-to-br from-amber-950/40 via-yellow-950/25 to-slate-900 shadow-xl shadow-amber-500/20' : 'border-slate-800 bg-slate-900/40',
          badgeColor: 'text-amber-300',
          bgIcon: 'gradient-gold text-slate-950 border border-yellow-200 shadow-lg shadow-yellow-500/40 font-black',
          pill: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 font-bold',
          ring: 'ring-amber-400/40',
          glow: 'bg-amber-500/25'
        },
        'DIAMOND': {
          border: isUnlocked ? 'border-cyan-400/70 bg-gradient-to-br from-cyan-950/40 via-sky-950/25 to-slate-900 shadow-xl shadow-cyan-500/25' : 'border-slate-800 bg-slate-900/40',
          badgeColor: 'text-cyan-300',
          bgIcon: 'gradient-diamond text-white border border-cyan-200 shadow-lg shadow-cyan-500/40 font-black',
          pill: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 font-bold',
          ring: 'ring-cyan-400/40',
          glow: 'bg-cyan-500/25'
        },
        'MYTHIC': {
          border: isUnlocked ? 'border-purple-500/80 bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-slate-900 shadow-2xl shadow-purple-500/30' : 'border-slate-800 bg-slate-900/40',
          badgeColor: 'text-purple-300',
          bgIcon: 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 text-white border border-pink-300 shadow-xl shadow-purple-500/50 font-black animate-pulse',
          pill: 'bg-purple-400/20 text-purple-300 border-purple-400/40 font-bold',
          ring: 'ring-purple-400/40',
          glow: 'bg-purple-500/30'
        }
      };

      const style = tierStyles[tier] || tierStyles['BRONZE'];

      const formatVal = (val, unit) => {
        if (unit === '₫') return formatVND(val);
        return `${val} ${unit}`;
      };

      return `
        <div class="glass-card p-5 rounded-3xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden border ${style.border} ${isUnlocked ? 'hover:scale-[1.02] cursor-pointer' : 'grayscale opacity-60 hover:opacity-85 hover:scale-[1.01] cursor-pointer'}"
          onclick="window.openBadgeModal('${b.id}')">
          
          <!-- Top Row: Icon & Tier Badge & Status -->
          <div>
            <div class="flex items-start justify-between mb-3.5">
              
              <!-- 3D Style Badge Icon -->
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isUnlocked ? style.bgIcon : 'bg-slate-800 text-slate-500 border border-slate-700'}">
                <i class="${b.icon}"></i>
              </div>

              <!-- Status Badge (Checkmark for Unlocked, Dimmed X for Locked) -->
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.pill}">
                  ${b.tier_name}
                </span>

                ${isUnlocked 
                  ? `<span class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30" title="Đã mở khóa">
                      <i class="fa-solid fa-check text-xs"></i>
                    </span>`
                  : `<span class="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700" title="Chưa mở khóa - Click để xem cách đạt">
                      <i class="fa-solid fa-lock text-[10px]"></i>
                    </span>`
                }
              </div>

            </div>

            <!-- Title & Description -->
            <h3 class="text-sm font-black text-slate-100 mb-1 flex items-center gap-1.5">
              <span>${b.title}</span>
              ${isUnlocked && (tier === 'GOLD' || tier === 'MYTHIC' || tier === 'DIAMOND') ? '<span class="text-amber-400 text-xs">✨</span>' : ''}
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed min-h-[36px]">
              ${b.description}
            </p>
          </div>

          <!-- Bottom Row: Progress or Unlock Date -->
          <div class="pt-3 mt-3 border-t border-slate-800/80">
            ${isUnlocked 
              ? `
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-emerald-400 font-bold flex items-center gap-1">
                    <i class="fa-solid fa-circle-check"></i> Đã Mở Khóa
                  </span>
                  <span class="text-slate-400 font-mono text-[10px]">${b.unlocked_at ? `Đạt ngày: ${b.unlocked_at}` : 'Đã hoàn thành'}</span>
                </div>
              `
              : `
                <div>
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Tiến độ: ${formatVal(b.current_val, b.unit)}</span>
                    <span class="font-mono text-slate-300">Mục tiêu: ${formatVal(b.target_val, b.unit)} (${b.progress_pct}%)</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                    <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${b.progress_pct}%"></div>
                  </div>
                </div>
              `
            }
          </div>

        </div>
      `;
    }).join('');

    // Global modal handler
    window.openBadgeModal = (badgeId) => this.showBadgeDetailModal(badgeId);
  }

  showBadgeDetailModal(badgeId) {
    if (!this.badgesData) return;
    const badge = this.badgesData.badges.find(b => b.id === badgeId);
    if (!badge) return;

    const modalEl = document.getElementById('generic-modal');
    if (!modalEl) return;

    const isUnlocked = badge.is_unlocked;
    const tier = badge.tier;
    const formatVal = (val, unit) => {
      if (unit === '₫') return formatVND(val);
      return `${val} ${unit}`;
    };

    const tierModalStyles = {
      'BRONZE': {
        bgIcon: 'gradient-bronze text-amber-100 border border-amber-500/70 shadow-lg shadow-amber-900/40',
        ring: 'ring-amber-600/40',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        glow: 'bg-amber-600/20'
      },
      'SILVER': {
        bgIcon: 'gradient-silver text-white border border-slate-300/80 shadow-lg shadow-slate-400/40',
        ring: 'ring-slate-400/40',
        pill: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
        glow: 'bg-slate-400/20'
      },
      'GOLD': {
        bgIcon: 'gradient-gold text-slate-950 border border-yellow-200 shadow-xl shadow-yellow-500/40 font-black',
        ring: 'ring-amber-400/50',
        pill: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 font-bold',
        glow: 'bg-amber-500/25'
      },
      'DIAMOND': {
        bgIcon: 'gradient-diamond text-white border border-cyan-200 shadow-xl shadow-cyan-500/40 font-black',
        ring: 'ring-cyan-400/50',
        pill: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 font-bold',
        glow: 'bg-cyan-500/25'
      },
      'MYTHIC': {
        bgIcon: 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 text-white border border-pink-300 shadow-2xl shadow-purple-500/50 font-black animate-pulse',
        ring: 'ring-purple-400/50',
        pill: 'bg-purple-400/20 text-purple-300 border-purple-400/40 font-bold',
        glow: 'bg-purple-500/30'
      }
    };

    const style = tierModalStyles[tier] || tierModalStyles['BRONZE'];

    modalEl.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
          
          <!-- Background Ambient Glow -->
          <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full ${isUnlocked ? style.glow : 'bg-slate-700/15'} blur-2xl pointer-events-none"></div>

          <!-- Close Button -->
          <button id="badge-modal-close" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <!-- Badge Icon in Large Circle -->
          <div class="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-xl ring-4 ${isUnlocked ? `${style.bgIcon} ${style.ring}` : 'bg-slate-800 text-slate-400 ring-slate-700/50 border border-slate-700'}">
            <i class="${badge.icon}"></i>
          </div>

          <!-- Tier Pill -->
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${isUnlocked ? style.pill : 'bg-slate-800 text-slate-400 border border-slate-700'}">
            <span>Bậc ${badge.tier_name}</span> &bull; <span>${badge.category}</span>
          </div>

          <!-- Title & Description -->
          <h2 class="text-xl font-black text-slate-100 mb-1.5">${badge.title}</h2>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">${badge.description}</p>

          <!-- Progress / Unlock Box -->
          <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left mb-4">
            <div class="flex items-center justify-between text-xs font-bold mb-2">
              <span class="text-slate-300">
                <i class="fa-solid fa-crosshairs text-indigo-400 mr-1"></i> Điều kiện hoàn thành:
              </span>
              <span class="font-mono text-emerald-400">${badge.progress_pct}%</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2 border border-slate-700/60">
              <div class="h-full ${isUnlocked ? 'gradient-emerald' : 'gradient-indigo'} rounded-full transition-all duration-700" style="width: ${badge.progress_pct}%"></div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Hiện tại: <b class="text-slate-200">${formatVal(badge.current_val, badge.unit)}</b></span>
              <span>Cần đạt: <b class="text-indigo-300">${formatVal(badge.target_val, badge.unit)}</b></span>
            </div>

            ${badge.unlock_hint ? `
              <div class="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5 flex-shrink-0"></i>
                <span><b>Gợi ý mở khóa:</b> ${badge.unlock_hint}</span>
              </div>
            ` : ''}
          </div>

          <!-- Action Button -->
          <div class="flex items-center gap-2">
            <button type="button" id="badge-modal-dismiss" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
              Đóng
            </button>
            ${!isUnlocked && badge.target_tab ? `
              <button type="button" id="badge-modal-action" class="flex-1 py-2.5 rounded-xl gradient-emerald text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-1.5">
                <span>Thực hiện ngay</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    const closeModal = () => { modalEl.innerHTML = ''; };
    document.getElementById('badge-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('badge-modal-dismiss')?.addEventListener('click', closeModal);
    document.getElementById('badge-modal-action')?.addEventListener('click', () => {
      closeModal();
      if (badge.target_tab) {
        this.app.navigate(badge.target_tab);
      }
    });
  }
}
