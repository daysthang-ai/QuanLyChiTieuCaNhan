/**
 * Centralized API Client for FinTrack AI
 */

const API_BASE = '/api/v1';

class APIClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem('fintrack_token') || '';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('fintrack_token', token);
    } else {
      localStorage.removeItem('fintrack_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('fintrack_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Unauthorized
        this.setToken('');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('fintrack:unauthorized'));
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      if (response.status === 403) {
        let errData = null;
        try {
          errData = await response.clone().json();
        } catch (_) {}
        const detail = (errData && (errData.detail || errData.message)) || '';
        this.setToken('');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('fintrack:account_locked', { 
          detail: { message: detail || 'Tài khoản của bạn đã bị khóa hoặc không có quyền truy cập.' } 
        }));
        throw new Error(detail || 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.');
      }

      // Handle download responses (blob)
      if (options.responseType === 'blob') {
        if (!response.ok) {
          throw new Error(`Tải file thất bại (${response.status})`);
        }
        return await response.blob();
      }

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = null;
        }
      } else {
        const textData = await response.text().catch(() => '');
        data = { message: textData };
      }

      if (!response.ok) {
        const errorMsg = (data && (data.detail || data.message)) || `Lỗi máy chủ (${response.status}): Vui lòng thử lại sau.`;
        throw new Error(errorMsg);
      }

      return data || {};
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Auth ---
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
  }

  getPlans() {
    return this.request('/auth/plans');
  }

  upgradePlan(plan, walletId = null, durationMonths = 1, paymentMethod = 'WALLET', bankCode = '') {
    const payload = { 
      plan, 
      duration_months: durationMonths,
      payment_method: paymentMethod
    };
    if (walletId) payload.wallet_id = parseInt(walletId);
    if (bankCode) payload.bank_code = bankCode;
    return this.request('/auth/upgrade-plan', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Wallets ---
  getWallets() {
    return this.request('/wallets/');
  }

  createWallet(data) {
    return this.request('/wallets/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateWallet(id, data) {
    return this.request(`/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteWallet(id) {
    return this.request(`/wallets/${id}`, { method: 'DELETE' });
  }

  depositToWallet(walletId, amount, source = 'BANK_LINK', note = '') {
    return this.request(`/wallets/${walletId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(amount), source, note })
    });
  }

  linkBankAccount(data) {
    return this.request('/wallets/link-bank', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  transferFunds(data) {
    return this.request('/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  adminAdjustWalletBalance(walletId, balance, reason = 'Admin điều chỉnh số dư trực tiếp') {
    return this.request(`/admin/wallets/${walletId}/adjust-balance`, {
      method: 'PUT',
      body: JSON.stringify({ balance: parseFloat(balance), reason })
    });
  }

  // --- Categories ---
  getCategories(type = '') {
    const q = type ? `?type=${type}` : '';
    return this.request(`/categories/${q}`);
  }

  createCategory(data) {
    return this.request('/categories/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateCategory(id, data) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteCategory(id) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  resetCategories() {
    return this.request('/categories/reset-defaults', { method: 'POST' });
  }

  // --- Transactions ---
  getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return this.request(`/transactions/?${query.toString()}`);
  }

  createTransaction(data) {
    return this.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }

  uploadReceipt(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/transactions/upload-receipt', {
      method: 'POST',
      body: formData
    });
  }

  // --- Budgets ---
  getBudgets(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/budgets/${q}`);
  }

  createBudget(data) {
    return this.request('/budgets/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateBudget(id, data) {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteBudget(id) {
    return this.request(`/budgets/${id}`, { method: 'DELETE' });
  }

  getBudgetAlerts(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/budgets/alerts${q}`);
  }

  // --- Saving Goals ---
  getSavingGoals() {
    return this.request('/saving-goals/');
  }

  createSavingGoal(data) {
    return this.request('/saving-goals/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateSavingGoal(id, data) {
    return this.request(`/saving-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteSavingGoal(id) {
    return this.request(`/saving-goals/${id}`, { method: 'DELETE' });
  }

  depositToGoal(id, data) {
    return this.request(`/saving-goals/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Analytics ---
  getSummaryKPIs(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/analytics/summary${q}`);
  }

  getCashflowTrend(months = 6) {
    return this.request(`/analytics/cashflow?months=${months}`);
  }

  getCategoryBreakdown(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/analytics/category-breakdown${q}`);
  }

  getFiftyThirtyTwenty(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/analytics/fifty-thirty-twenty${q}`);
  }

  // --- AI Engine ---
  parseTransactionWithAI(rawText) {
    return this.request('/ai/parse-transaction', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText })
    });
  }

  getFinancialHealthReport(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/ai/financial-health${q}`);
  }

  chatWithAI(query) {
    const queryText = typeof query === 'string' ? query.trim() : (query?.query ? String(query.query).trim() : String(query || '').trim());
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ query: queryText })
    });
  }

  getAIQuota() {
    return this.request('/ai/quota');
  }

  // --- Exports ---
  downloadExcel(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/exports/excel${q}`, { responseType: 'blob' });
  }

  downloadCSV(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/exports/csv${q}`, { responseType: 'blob' });
  }

  downloadPDF(monthYear = '') {
    const q = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/exports/pdf${q}`, { responseType: 'blob' });
  }

  // --- Gamification & Badges ---
  getBadges() {
    return this.request('/badges/');
  }

  // --- Admin Portal ---
  getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  getAdminUsers(search = '', role = '', plan = '', statusFilter = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'ALL') params.append('role', role);
    if (plan && plan !== 'ALL') params.append('plan', plan);
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/admin/users${qs}`);
  }

  updateAdminUserStatus(userId, status) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  updateAdminUserRole(userId, role) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  updateAdminUserPlan(userId, plan) {
    return this.request(`/admin/users/${userId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan })
    });
  }

  resetAdminUserPassword(userId, newPassword) {
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });
  }

  getUserDetailAdmin(userId) {
    return this.request(`/admin/users/${userId}/detail`);
  }

  updateAdminUserProfile(userId, profileData) {
    return this.request(`/admin/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  adjustAdminWalletBalance(walletId, balance, reason = 'Admin can thiệp điều chỉnh số dư') {
    return this.request(`/admin/wallets/${walletId}/adjust-balance`, {
      method: 'PUT',
      body: JSON.stringify({ balance, reason })
    });
  }

  deleteUserAdmin(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  getAdminAIConfig() {
    return this.request('/admin/ai-management');
  }

  updateAdminAIConfig(configData) {
    return this.request('/admin/ai-management/config', {
      method: 'POST',
      body: JSON.stringify(configData)
    });
  }

  getAdminMasterData() {
    return this.request('/admin/master-data');
  }

  createAdminMasterCategory(catData) {
    return this.request('/admin/master-data/category', {
      method: 'POST',
      body: JSON.stringify(catData)
    });
  }

  getAdminBilling() {
    return this.request('/admin/billing');
  }

  getAdminLogs(type = 'ALL', search = '') {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('log_type', type);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/admin/logs${qs}`);
  }

  getAdminSettings() {
    return this.request('/admin/settings');
  }

  sendAdminBroadcast(broadcastData) {
    return this.request('/admin/settings/broadcast', {
      method: 'POST',
      body: JSON.stringify(broadcastData)
    });
  }

  updateAdminSMTP(smtpData) {
    return this.request('/admin/settings/smtp', {
      method: 'POST',
      body: JSON.stringify(smtpData)
    });
  }

  // --- Notifications ---
  getNotifications(filterType = 'all', limit = 50, skip = 0) {
    const params = new URLSearchParams();
    if (filterType) params.append('filter_type', filterType);
    if (limit) params.append('limit', limit);
    if (skip) params.append('skip', skip);
    return this.request(`/notifications?${params.toString()}`);
  }

  getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }

  deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  clearAllNotifications() {
    return this.request('/notifications/clear-all', {
      method: 'DELETE'
    });
  }

  resetDemoNotifications() {
    return this.request('/notifications/reset-demo', {
      method: 'POST'
    });
  }

  getAdminNotifications() {
    return this.request('/admin/notifications');
  }

  createAdminNotification(notifData) {
    return this.request('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(notifData)
    });
  }

  deleteAdminNotification(notificationId) {
    return this.request(`/admin/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // --- Subscriptions & Orders ---
  createSubscriptionOrder(orderData) {
    return this.request('/subscriptions/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  createVIPOrder(planCode, durationMonths = 1, amount = null, durationDays = null) {
    return this.request('/payments/create-vip-order', {
      method: 'POST',
      body: JSON.stringify({
        plan_code: planCode,
        duration_months: parseInt(durationMonths) || 1,
        amount: amount ? parseFloat(amount) : null,
        plan_duration_days: durationDays ? parseInt(durationDays) : null
      })
    });
  }

  payVIPWithWallet(planCode, durationMonths = 1) {
    return this.request('/payments/pay-vip-wallet', {
      method: 'POST',
      body: JSON.stringify({
        plan_code: planCode,
        duration_months: parseInt(durationMonths) || 1
      })
    });
  }

  createDepositOrder(amount) {
    return this.request('/payments/create-deposit-order', {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
  }

  getMySubscriptionOrders() {
    return this.request('/subscriptions/my-orders');
  }

  getOrderStatus(orderCode) {
    return this.request(`/payments/check-status/${encodeURIComponent(orderCode)}`);
  }

  checkOrderStatus(orderCode) {
    return this.request(`/payments/check-status/${encodeURIComponent(orderCode)}`);
  }

  checkPaymentStatus(orderCode) {
    return this.request(`/payments/check-status/${encodeURIComponent(orderCode)}`);
  }

  getDepositOrderStatus(orderCode) {
    return this.request(`/payments/check-status/${encodeURIComponent(orderCode)}`);
  }

  mockReceiveMoney(orderCode = null, amount = null, description = null, userId = null) {
    const cleanCode = orderCode ? String(orderCode).replace(/^#/, '').trim() : null;
    return this.request('/payments/mock-receive-money', {
      method: 'POST',
      body: JSON.stringify({
        order_code: cleanCode,
        amount: amount !== null && amount !== undefined ? parseFloat(amount) : null,
        description: description,
        user_id: userId ? parseInt(userId) : null
      })
    });
  }

  demoSimulatePayment(orderCode = null, amount = null, description = null, userId = null) {
    return this.mockReceiveMoney(orderCode, amount, description, userId);
  }

  mockMBReceive(orderCode, amount = null, description = null) {
    const cleanCode = orderCode ? String(orderCode).replace(/^#/, '').trim() : null;
    return this.request('/payments/mock-mb-receive', {
      method: 'POST',
      body: JSON.stringify({
        order_code: cleanCode,
        amount: amount !== null && amount !== undefined ? parseFloat(amount) : null,
        description: description
      })
    });
  }

  // --- Payment Gateway Configuration & VietQR ---
  getActiveBankGateway() {
    return this.request('/public/active-bank-gateway');
  }

  getPublicPaymentGatewayInfo() {
    return this.request('/public/active-bank-gateway');
  }

  getAdminBankGateway() {
    return this.request('/admin/bank-gateway');
  }

  getAdminPaymentSettings() {
    return this.request('/admin/bank-gateway');
  }

  saveAdminBankGateway(data) {
    return this.request('/admin/bank-gateway', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateAdminPaymentSettings(data) {
    return this.request('/admin/bank-gateway', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getAdminBankTransactions(statusFilter = 'ALL', search = '', limit = 50) {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit);
    return this.request(`/admin/bank-gateway/transactions?${params.toString()}`);
  }

  manualMatchBankTransaction(txId, payload) {
    return this.request(`/admin/bank-gateway/transactions/${txId}/manual-match`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  getAdminSubscriptionOrders(statusFilter = 'ALL', search = '') {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
    if (search) params.append('search', search);
    return this.request(`/admin/subscriptions/orders?${params.toString()}`);
  }

  approveAdminSubscriptionOrder(orderId) {
    return this.request(`/admin/subscriptions/orders/${orderId}/approve`, {
      method: 'PUT'
    });
  }

  rejectAdminSubscriptionOrder(orderId, reason) {
    return this.request(`/admin/subscriptions/orders/${orderId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  // --- Support Tickets ---
  createSupportTicket(ticketData) {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  getMySupportTickets() {
    return this.request('/support/my-tickets');
  }

  getAdminSupportTickets(statusFilter = 'ALL', category = 'ALL', priority = 'ALL', search = '') {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
    if (category && category !== 'ALL') params.append('category', category);
    if (priority && priority !== 'ALL') params.append('priority', priority);
    if (search) params.append('search', search);
    return this.request(`/admin/support/tickets?${params.toString()}`);
  }

  replyAdminSupportTicket(ticketId, reply) {
    return this.request(`/admin/support/tickets/${ticketId}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply })
    });
  }

  // --- Analytics & Export ---
  getAdminRevenueAnalytics() {
    return this.request('/admin/analytics/revenue-chart');
  }

  async downloadAdminExport(type = 'users') {
    const endpoint = `/admin/export/${type}.csv`;
    const blob = await this.request(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  }
}

export const api = new APIClient();
