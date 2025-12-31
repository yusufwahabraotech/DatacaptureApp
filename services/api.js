import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.183:3000/api';

class ApiService {
  static async getToken() {
    return await AsyncStorage.getItem('userToken');
  }

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

  static async getUserRole() {
    try {
      const profileResponse = await this.getUserProfile();
      const role = profileResponse.success ? profileResponse.data.user.role : null;
      console.log('=== ROLE DEBUG ===');
      console.log('Profile response:', profileResponse.success);
      console.log('Detected role:', role);
      return role;
    } catch (error) {
      console.log('Error getting user role:', error);
      return null;
    }
  }

  static async getBaseUrl() {
    try {
      const userRole = await this.getUserRole();
      return userRole === 'ORGANIZATION' ? '/admin' : '/user';
    } catch (error) {
      return '/user';
    }
  }

  // AUTH
  static async login(email, password) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), password }),
    });
  }

  static async getUserProfile() {
    return this.apiCall('/auth/profile');
  }

  static async register(userData) {
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async verifyOTP(email, otp) {
    return this.apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  static async resendOTP(email) {
    return this.apiCall('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // USERS
  static async getUsers() {
    return this.apiCall('/admin/users');
  }

  static async getUserById(userId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
    return this.apiCall(`/admin/users/${userId}`);
  }

  static async getOrgUsers(page = 1, limit = 10) {
    return this.apiCall(`/org-user/users?page=${page}&limit=${limit}`);
  }

  static async getOrgUserById(userId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
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

  // ROLES
  static async getRoles(page = 1, limit = 10) {
    console.log('=== getRoles called ===');
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('getRoles - isOrgAdmin:', isOrgAdmin);
    console.log('getRoles - baseUrl:', baseUrl);
    console.log('getRoles - calling:', `${baseUrl}/roles?page=${page}&limit=${limit}&includeUsers=true`);
    return this.apiCall(`${baseUrl}/roles?page=${page}&limit=${limit}&includeUsers=true`);
  }

  static async getOrgRoles(page = 1, limit = 10) {
    console.log('=== getOrgRoles called ===');
    console.log('getOrgRoles - calling:', `/admin/roles?page=${page}&limit=${limit}&includeUsers=true`);
    return this.apiCall(`/admin/roles?page=${page}&limit=${limit}&includeUsers=true`);
  }

  static async createRole(roleData) {
    console.log('=== createRole called ===');
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('createRole - isOrgAdmin:', isOrgAdmin);
    console.log('createRole - baseUrl:', baseUrl);
    console.log('createRole - calling:', `${baseUrl}/roles`);
    return this.apiCall(`${baseUrl}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  static async getRoleById(roleId) {
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}?includeUsers=true`);
  }

  static async getRoleUsers(roleId) {
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}/users`);
  }

  static async updateRole(roleId, roleData) {
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  static async deleteRole(roleId) {
    console.log('=== DELETE ROLE DEBUG ===');
    const profileResponse = await this.getUserProfile();
    console.log('Profile response:', JSON.stringify(profileResponse, null, 2));
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    console.log('Is org admin:', isOrgAdmin);
    console.log('User role:', profileResponse.data?.user?.role);
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('Base URL:', baseUrl);
    console.log('Delete endpoint:', `${baseUrl}/roles/${roleId}`);
    return this.apiCall(`${baseUrl}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  static async getAvailableRoles() {
    console.log('=== getAvailableRoles called ===');
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('getAvailableRoles - isOrgAdmin:', isOrgAdmin);
    console.log('getAvailableRoles - baseUrl:', baseUrl);
    console.log('getAvailableRoles - calling:', `${baseUrl}/roles`);
    return this.apiCall(`${baseUrl}/roles`);
  }

  static async assignRoleToMultipleUsers(roleId, userIds) {
    return this.apiCall(`/admin/roles/${roleId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  static async assignUserRole(userId, roleId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
    console.log('=== ASSIGNING ROLE ===');
    console.log('User ID:', userId);
    console.log('Role ID:', roleId);
    
    // Use the admin assign endpoint for individual user
    const endpoint = `/admin/roles/${roleId}/assign`;
    console.log('Assignment endpoint:', endpoint);
    
    const response = await this.apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ userIds: [userId] }),
    });
    
    console.log('Assignment response:', JSON.stringify(response, null, 2));
    return response;
  }

  static async getUserRole(userId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
    
    console.log('=== API getUserRole DEBUG ===');
    console.log('Fetching role for user ID:', userId);
    
    // Always use admin endpoint to get user data with role info
    const userEndpoint = `/admin/users/${userId}`;
    console.log('User endpoint:', `${BASE_URL}${userEndpoint}`);
    
    const response = await this.apiCall(userEndpoint);
    console.log('User data response:', JSON.stringify(response, null, 2));
    
    if (response.success && response.data.user) {
      const user = response.data.user;
      console.log('User roleId field:', user.roleId);
      
      if (user.roleId) {
        // Fetch the full role details
        const roleDetailsResponse = await this.apiCall(`/admin/roles/${user.roleId}`);
        console.log('Role details response:', JSON.stringify(roleDetailsResponse, null, 2));
        
        if (roleDetailsResponse.success && roleDetailsResponse.data.role) {
          return {
            success: true,
            data: {
              role: roleDetailsResponse.data.role
            }
          };
        }
      }
      
      return {
        success: true,
        data: {
          role: null
        }
      };
    }
    
    return response;
  }

  // PERMISSIONS
  static async getAvailablePermissions() {
    console.log('=== getAvailablePermissions called ===');
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('getAvailablePermissions - isOrgAdmin:', isOrgAdmin);
    console.log('getAvailablePermissions - baseUrl:', baseUrl);
    console.log('getAvailablePermissions - calling:', `${baseUrl}/permissions`);
    return this.apiCall(`${baseUrl}/permissions`);
  }

  static async getOrgAvailablePermissions() {
    console.log('=== getOrgAvailablePermissions called ===');
    console.log('getOrgAvailablePermissions - calling:', '/admin/permissions');
    return this.apiCall('/admin/permissions');
  }

  static async getPermissions() {
    return this.apiCall('/admin/permissions');
  }

  static async getMyPermissions() {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/permissions`);
  }

  static async getPermissionsByCategory(categoryName) {
    return this.apiCall(`/admin/permissions/category/${categoryName}`);
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

  // GROUPS
  static async getGroups() {
    const userRole = await this.getUserRole();
    if (userRole !== 'ORGANIZATION') {
      return { success: false, message: 'Groups management only available for organization admins' };
    }
    return this.apiCall('/admin/groups');
  }

  // DASHBOARD
  static async getDashboardStats() {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/dashboard/stats`);
  }

  static async getUserDashboardStats() {
    return this.getDashboardStats();
  }

  // MEASUREMENTS
  static async getMeasurements(page = 1, limit = 10, userId = null) {
    const baseUrl = await this.getBaseUrl();
    let endpoint = `${baseUrl}/measurements?page=${page}&limit=${limit}`;
    
    if (userId) {
      endpoint += `&userId=${userId}`;
    }
    
    return this.apiCall(endpoint);
  }

  static async getUserMeasurements(userId, page = 1, limit = 10) {
    // Call the exact same endpoint that works in debug
    return this.apiCall(`/admin/measurements?userId=${userId}&page=${page}&limit=${limit}`);
  }

  static async getAdminMeasurements(page = 1, limit = 10, userId = null) {
    let endpoint = `/admin/measurements?page=${page}&limit=${limit}`;
    
    if (userId) {
      endpoint += `&userId=${userId}`;
    }
    
    return this.apiCall(endpoint);
  }

  static async getAllMeasurements(page = 1, limit = 10, userId = null) {
    return this.getAdminMeasurements(page, limit, userId);
  }

  static async getAdminMeasurement(measurementId) {
    return this.apiCall(`/admin/measurements/${measurementId}`);
  }

  static async getMeasurementById(measurementId) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/measurements/${measurementId}`);
  }

  static async createMeasurement(measurementData) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/measurements`, {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  static async createAdminMeasurement(measurementData) {
    return this.apiCall('/admin/measurements', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  // DEBUG METHODS
  static async debugMeasurementsStructure(userId) {
    return this.apiCall(`/admin/debug/measurements-structure/${userId}`);
  }

  static async debugMeasurementsFilter(userId, page = 1, limit = 20) {
    return this.apiCall(`/admin/measurements?userId=${userId}&page=${page}&limit=${limit}&debug=true`);
  }

  // ONE-TIME CODES
  static async getOneTimeCodes(page = 1, limit = 10) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/one-time-codes?page=${page}&limit=${limit}`);
  }

  static async getManualMeasurements(page = 1, limit = 10) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/measurements?page=${page}&limit=${limit}`);
  }

  static async updateMeasurement(id, measurementData) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData),
    });
  }

  static async updateAdminMeasurement(measurementId, measurementData) {
    return this.apiCall(`/admin/measurements/${measurementId}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData),
    });
  }

  static async deleteMeasurement(id) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/measurements/${id}`, {
      method: 'DELETE',
    });
  }

  static async deleteAdminMeasurement(measurementId) {
    return this.apiCall(`/admin/measurements/${measurementId}`, {
      method: 'DELETE',
    });
  }

  // MANUAL MEASUREMENTS
  static async getManualMeasurements() {
    return this.apiCall('/manual-measurements');
  }

  static async saveMeasurement(measurementData) {
    return this.apiCall('/manual-measurements/save', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  // ONE-TIME CODES
  static async getOneTimeCodes() {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/one-time-codes`);
  }

  static async generateOneTimeCode(codeData) {
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/one-time-codes`, {
      method: 'POST',
      body: JSON.stringify(codeData),
    });
  }

  static async sendOneTimeCodeEmail(emailData) {
    let payload;
    
    if (typeof emailData === 'string') {
      payload = { code: emailData };
    } else if (emailData && typeof emailData === 'object') {
      payload = emailData;
    } else {
      return { success: false, message: 'Valid email data is required' };
    }
    
    const baseUrl = await this.getBaseUrl();
    return this.apiCall(`${baseUrl}/one-time-codes/send-email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // SHARING
  static async shareToOrganization(measurementId, code) {
    return this.apiCall('/measurements/share-to-organization', {
      method: 'POST',
      body: JSON.stringify({ measurementId, code }),
    });
  }
}

export default ApiService;