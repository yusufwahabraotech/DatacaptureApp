import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://datacapture-backend.onrender.com/api';

class ApiService {
  // Get auth token
  static async getToken() {
    return await AsyncStorage.getItem('userToken');
  }

  // Generic API call method
  static async apiCall(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    // Implemented by VScode copilot - Better error handling
    if (!response.ok) {
      console.log(`API Error - Status: ${response.status}, URL: ${url}`);
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        message: error.message || `HTTP ${response.status}: ${response.statusText}`,
        data: error
      };
    }
    
    return await response.json();
  }

  // Auth endpoints
  static async login(email, password) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), password }),
    });
  }

  static async register(userData) {
    const requestBody = {
      email: userData.email.toLowerCase(),
      password: userData.password,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      role: userData.role,
    };

    // Add organization-specific fields for ORGANIZATION role
    if (userData.role === 'ORGANIZATION') {
      requestBody.organizationName = userData.organizationName;
      requestBody.country = userData.country;
    }

    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  static async verifyOTP(email, otp) {
    return this.apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  static async getUserProfile() {
    return this.apiCall('/auth/profile');
  }

  // Measurement endpoints
  static async getMeasurements() {
    return this.apiCall('/manual-measurements');
  }

  static async createMeasurement(measurementData) {
    return this.apiCall('/manual-measurements', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  static async getAdminMeasurements(page = 1, limit = 50) {
    return this.apiCall(`/admin/measurements?page=${page}&limit=${limit}`);
  }

  // Get individual measurement details
  static async getMeasurementById(measurementId) {
    return this.apiCall(`/admin/measurements/${measurementId}`);
  }

  // Dashboard stats endpoint
  static async getDashboardStats() {
    return this.apiCall('/admin/dashboard/stats');
  }

  // Update user status
  static async updateUserStatus(userId, status) {
    return this.apiCall(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Permissions management
  static async getAvailablePermissions() {
    return this.apiCall('/admin/permissions');
  }

  static async getUserPermissions(userId) {
    return this.apiCall(`/admin/users/${userId}/permissions`);
  }

  static async updateUserPermissions(userId, permissions) {
    return this.apiCall(`/admin/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // One-time codes management
  static async generateOneTimeCode(userEmail, expirationHours = 24) {
    return this.apiCall('/admin/one-time-codes', {
      method: 'POST',
      body: JSON.stringify({ userEmail, expirationHours }),
    });
  }

  static async sendOneTimeCodeEmail(code) {
    return this.apiCall('/admin/one-time-codes/send-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  static async shareToOrganization(measurementId, oneTimeCode) {
    return this.apiCall('/measurements/share-to-organization', {
      method: 'POST',
      body: JSON.stringify({ measurementId, oneTimeCode }),
    });
  }

  // Implemented by VScode copilot
  // Fetch measurements for a specific user with pagination
  // GET /api/admin/measurements?userId=<userId>&page=<page>&limit=<limit>
  static async getUserMeasurements(userId, page = 1, limit = 20) {
    const endpoint = `/admin/measurements?userId=${userId}&page=${page}&limit=${limit}`;
    console.log(`Calling endpoint: ${endpoint}`);
    return this.apiCall(endpoint);
  }

  // User management endpoints
  static async getUsers() {
    return this.apiCall('/admin/users');
  }

  // Implemented by VScode copilot
  // Fetch user details by userId - GET /api/admin/users/:userId
  // Requires: admin auth and view_users permission
  static async getUserById(userId) {
    return this.apiCall(`/admin/users/${userId}`);
  }

  static async updateUser(userId, userData) {
    return this.apiCall(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async deleteUser(userId) {
    return this.apiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Organization endpoints
  static async getOrganizations() {
    return this.apiCall('/admin/organizations');
  }

  static async createOrganization(orgData) {
    return this.apiCall('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  // User permissions endpoints
  static async getMyPermissions() {
    return this.apiCall('/org-user/my-permissions');
  }

  // User measurements endpoint
  static async getMyMeasurements() {
    return this.apiCall('/org-user/measurements');
  }

  // User dashboard stats
  static async getUserDashboardStats() {
    return this.apiCall('/org-user/dashboard/stats');
  }

  // User one-time codes
  static async getMyOneTimeCodes() {
    return this.apiCall('/org-user/one-time-codes');
  }

  // Organization user management (permission-based)
  static async getOrgUsers(page = 1, limit = 10) {
    return this.apiCall(`/org-user/users?page=${page}&limit=${limit}`);
  }

  static async getOrgUserById(userId) {
    return this.apiCall(`/org-user/users/${userId}`);
  }

  static async createOrgUser(userData) {
    return this.apiCall('/org-user/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async updateOrgUser(userId, userData) {
    return this.apiCall(`/org-user/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async updateOrgUserStatus(userId, status) {
    return this.apiCall(`/org-user/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async updateOrgUserPermissions(userId, permissions) {
    return this.apiCall(`/org-user/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  static async resetOrgUserPassword(userId, passwordData) {
    return this.apiCall(`/org-user/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  static async sendOrgUserEmail(userId, emailData) {
    return this.apiCall(`/org-user/users/${userId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  static async deleteOrgUser(userId) {
    return this.apiCall(`/org-user/users/${userId}`, {
      method: 'DELETE',
    });
  }

  static async generateOrgOneTimeCode(userEmail, expirationHours = 24) {
    return this.apiCall('/org-user/one-time-codes', {
      method: 'POST',
      body: JSON.stringify({ userEmail, expirationHours }),
    });
  }

  static async sendOrgOneTimeCodeEmail(code) {
    return this.apiCall('/org-user/one-time-codes/send-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Organization measurement management
  static async createOrgMeasurement(measurementData) {
    return this.apiCall('/org-user/measurements', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  static async updateOrgMeasurement(measurementId, measurementData) {
    return this.apiCall(`/org-user/measurements/${measurementId}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData),
    });
  }

  static async deleteOrgMeasurement(measurementId) {
    return this.apiCall(`/org-user/measurements/${measurementId}`, {
      method: 'DELETE',
    });
  }

  // Get original measurement for external measurements
  static async getOriginalMeasurementForExternal(measurementId) {
    return this.apiCall(`/admin/measurements/${measurementId}/original`);
  }

  // ========== SUPER ADMIN ENDPOINTS ==========
  
  // 👥 Super Admin User Management (System-Wide)
  static async getSuperAdminUsers(page = 1, limit = 50) {
    return this.apiCall(`/super-admin/users?page=${page}&limit=${limit}`);
  }

  static async getSuperAdminUserById(userId) {
    return this.apiCall(`/super-admin/users/${userId}`);
  }

  static async updateSuperAdminUser(userId, userData) {
    return this.apiCall(`/super-admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async updateSuperAdminUserStatus(userId, status) {
    return this.apiCall(`/super-admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async resetSuperAdminUserPassword(userId) {
    return this.apiCall(`/super-admin/users/${userId}/reset-password`, {
      method: 'PUT',
    });
  }

  static async getSuperAdminOrganizationUsers(orgId) {
    return this.apiCall(`/super-admin/organizations/${orgId}/users`);
  }

  static async exportSuperAdminUsers(format = 'csv') {
    return this.apiCall(`/super-admin/users/export/${format}`);
  }

  static async deleteSuperAdminUser(userId) {
    return this.apiCall(`/super-admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // 🏢 Super Admin Organization Management
  static async getSuperAdminOrganizations(page = 1, limit = 50, status = null) {
    let url = `/super-admin/organizations?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.apiCall(url);
  }

  static async createSuperAdminOrganization(orgData) {
    return this.apiCall('/super-admin/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  static async getSuperAdminOrganizationById(orgId) {
    return this.apiCall(`/super-admin/organizations/${orgId}`);
  }

  static async updateSuperAdminOrganization(orgId, orgData) {
    return this.apiCall(`/super-admin/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  static async deleteSuperAdminOrganization(orgId) {
    return this.apiCall(`/super-admin/organizations/${orgId}`, {
      method: 'DELETE',
    });
  }

  static async updateSuperAdminOrganizationStatus(orgId, status) {
    return this.apiCall(`/super-admin/organizations/${orgId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async exportSuperAdminOrganizations(format = 'csv') {
    return this.apiCall(`/super-admin/organizations/export/${format}`);
  }

  // 👤 Super Admin Customer Management
  static async getSuperAdminCustomers(page = 1, limit = 50, status = null) {
    let url = `/super-admin/customers?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.apiCall(url);
  }

  static async createSuperAdminCustomer(customerData) {
    return this.apiCall('/super-admin/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  static async getSuperAdminCustomerById(customerId) {
    return this.apiCall(`/super-admin/customers/${customerId}`);
  }

  static async updateSuperAdminCustomer(customerId, customerData) {
    return this.apiCall(`/super-admin/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  static async deleteSuperAdminCustomer(customerId) {
    return this.apiCall(`/super-admin/customers/${customerId}`, {
      method: 'DELETE',
    });
  }

  static async updateSuperAdminCustomerStatus(customerId, status) {
    return this.apiCall(`/super-admin/customers/${customerId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async resetSuperAdminCustomerPassword(customerId) {
    return this.apiCall(`/super-admin/customers/${customerId}/reset-password`, {
      method: 'PUT',
    });
  }

  static async exportSuperAdminCustomers(format = 'csv') {
    return this.apiCall(`/super-admin/customers/export/${format}`);
  }

  // 📦 Super Admin Subscription Management
  static async getSuperAdminSubscriptions(page = 1, limit = 50, status = null) {
    let url = `/super-admin/subscriptions?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.apiCall(url);
  }

  static async createSuperAdminSubscription(subscriptionData) {
    return this.apiCall('/super-admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  static async getSuperAdminSubscriptionById(subscriptionId) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}`);
  }

  static async updateSuperAdminSubscription(subscriptionId, subscriptionData) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }

  static async deleteSuperAdminSubscription(subscriptionId) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  static async updateSuperAdminSubscriptionStatus(subscriptionId, status) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async duplicateSuperAdminSubscription(subscriptionId) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}/duplicate`, {
      method: 'POST',
    });
  }

  static async getSuperAdminSubscriptionSubscribers(subscriptionId) {
    return this.apiCall(`/super-admin/subscriptions/${subscriptionId}/subscribers`);
  }

  static async exportSuperAdminSubscriptions(format = 'csv') {
    return this.apiCall(`/super-admin/subscriptions/export/${format}`);
  }

  // 📊 Super Admin Dashboard & Analytics
  static async getSuperAdminDashboardStats() {
    return this.apiCall('/super-admin/dashboard/stats');
  }

  static async getSuperAdminAnalytics() {
    return this.apiCall('/super-admin/dashboard/analytics');
  }

  // 🔧 Super Admin Utility Endpoints
  static async getSuperAdminCountries() {
    return this.apiCall('/super-admin/countries');
  }

  // ========== ORGANIZATION SUBSCRIPTION ENDPOINTS ==========
  
  // Organization subscription management
  static async getOrganizationSubscription() {
    return this.apiCall('/organization/subscription');
  }

  static async subscribeToPackage(packageId, billingCycle) {
    return this.apiCall('/organization/subscribe', {
      method: 'POST',
      body: JSON.stringify({ packageId, billingCycle }),
    });
  }

  static async cancelOrganizationSubscription() {
    return this.apiCall('/organization/subscription/cancel', {
      method: 'PUT',
    });
  }

  static async getOrganizationBillingHistory() {
    return this.apiCall('/organization/billing/history');
  }

  static async updatePaymentMethod(paymentData) {
    return this.apiCall('/organization/payment-method', {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }
}

export default ApiService;