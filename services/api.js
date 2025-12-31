import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.183:3000/api';

// CACHE BUSTER: Force Metro to reload this file
const CACHE_BUSTER = Date.now();

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

  static async hasAdminAccess() {
    try {
      const profileResponse = await this.getUserProfile();
      if (profileResponse.success) {
        const user = profileResponse.data.user;
        console.log('=== hasAdminAccess DEBUG ===');
        console.log('User role:', user.role);
        console.log('User organizationId:', user.organizationId);
        console.log('User roleId:', user.roleId);
        
        // ORGANIZATION role gets full admin access
        if (user.role === 'ORGANIZATION') {
          console.log('Admin access: true (ORGANIZATION role)');
          return true;
        }
        // CUSTOMER with organizationId gets permission-based access
        if (user.role === 'CUSTOMER' && user.organizationId) {
          console.log('Admin access: true (CUSTOMER with organizationId)');
          return true;
        }
        console.log('Admin access: false');
        return false;
      }
      return false;
    } catch (error) {
      return false;
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
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles?page=${page}&limit=${limit}&includeUsers=true`);
  }

  static async getOrgRoles(page = 1, limit = 10) {
    return this.apiCall(`/admin/roles?page=${page}&limit=${limit}&includeUsers=true`);
  }

  static async createRole(roleData) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  static async getRoleById(roleId) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}?includeUsers=true`);
  }

  static async getRoleUsers(roleId) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}/users`);
  }

  static async updateRole(roleId, roleData) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  static async deleteRole(roleId) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  static async getAvailableRoles() {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
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

  // MEASUREMENTS - Personal measurements for ALL users
  static async getManualMeasurements(page = 1, limit = 10) {
    console.log('=== getManualMeasurements called with endpoint: /user/measurements ===');
    return this.apiCall(`/user/measurements?page=${page}&limit=${limit}`);
  }

  // PERMISSIONS
  static async getAvailablePermissions() {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      console.log('=== getAvailablePermissions DEBUG ===');
      console.log('User role:', user.role);
      console.log('User organizationId:', user.organizationId);
      
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using admin endpoint for ORGANIZATION role');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using org-user endpoint for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using user endpoint for regular user');
      }
      
      console.log('calling:', `${baseUrl}/permissions`);
      return this.apiCall(`${baseUrl}/permissions`);
    }
    return this.apiCall('/user/permissions');
  }

  static async getOrgAvailablePermissions() {
    console.log('=== WARNING: getOrgAvailablePermissions() called - this should use getAvailablePermissions() instead ===');
    return this.apiCall('/admin/permissions');
  }

  static async getPermissions() {
    console.log('=== WARNING: getPermissions() called - this should use getAvailablePermissions() instead ===');
    return this.apiCall('/admin/permissions');
  }

  static async getMyPermissions() {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      const userRole = user.role;
      const hasOrganizationId = user.organizationId;
      
      let baseUrl;
      if (userRole === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (userRole === 'CUSTOMER' && hasOrganizationId) {
        // Organization customers use admin endpoints for permissions
        baseUrl = '/admin';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/permissions`);
    }
    return this.apiCall('/user/permissions');
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

  static async getGroups() {
    const hasAdmin = await this.hasAdminAccess();
    if (!hasAdmin) {
      return { success: false, message: 'Groups management only available for organization admins' };
    }
    return this.apiCall('/admin/groups');
  }

  static async getGroupById(groupId) {
    return this.apiCall(`/admin/groups/${groupId}`);
  }

  static async deleteGroup(groupId) {
    return this.apiCall(`/admin/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  // DASHBOARD - Personal dashboard for ALL users
  static async getDashboardStats() {
    return this.apiCall('/user/dashboard/stats');
  }

  static async getUserDashboardStats() {
    return this.apiCall('/user/dashboard/stats');
  }

  // MEASUREMENTS
  static async getMeasurements(page = 1, limit = 10, userId = null) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
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
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/measurements/${measurementId}`);
  }

  static async createMeasurement(measurementData) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
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
    console.log('=== getOneTimeCodes called ===');
    const profileResponse = await this.getUserProfile();
    console.log('Profile response:', JSON.stringify(profileResponse, null, 2));
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    console.log('Is org admin:', isOrgAdmin);
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('Base URL:', baseUrl);
    const endpoint = `${baseUrl}/one-time-codes?page=${page}&limit=${limit}`;
    console.log('Calling endpoint:', endpoint);
    return this.apiCall(endpoint);
  }

  static async generateOneTimeCode(codeData) {
    console.log('=== generateOneTimeCode called ===');
    console.log('Code data:', JSON.stringify(codeData, null, 2));
    const profileResponse = await this.getUserProfile();
    console.log('Profile response:', JSON.stringify(profileResponse, null, 2));
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    console.log('Is org admin:', isOrgAdmin);
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
    console.log('Base URL:', baseUrl);
    const endpoint = `${baseUrl}/one-time-codes`;
    console.log('Calling endpoint:', endpoint);
    return this.apiCall(endpoint, {
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
    
    const profileResponse = await this.getUserProfile();
    const isOrgAdmin = profileResponse.success && profileResponse.data.user.role === 'ORGANIZATION';
    const baseUrl = isOrgAdmin ? '/admin' : '/user';
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