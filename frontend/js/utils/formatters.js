/**
 * Formatters and helper utilities for FinTrack AI
 */

export function formatVND(amount) {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !isFinite(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export function formatCompactNumber(amount) {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + ' tỷ';
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1) + ' tr';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k';
  }
  return amount.toString();
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTimeVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getCurrentMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getGroupBadge(group) {
  switch (group) {
    case 'NEEDS':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Thiết yếu (50%)</span>`;
    case 'WANTS':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Mong muốn (30%)</span>`;
    case 'SAVINGS':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Tiết kiệm (20%)</span>`;
    case 'INCOME':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Thu nhập</span>`;
    default:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">${group}</span>`;
  }
}
