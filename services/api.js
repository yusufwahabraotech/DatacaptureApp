import AsyncStorage from '@react-native-async-storage/async-storage';
import { Country, State, City } from 'country-state-city';

const BASE_URL = 'http://192.168.1.183:3000/api';

// FORCE COMPLETE RELOAD - BREAKING CACHE v8 - MEASUREMENT DETAILS FIX
const FORCE_RELOAD_NOW = 'MEASUREMENT_DETAILS_FIX_' + Date.now();
console.log('🚨 MEASUREMENT DETAILS FIX API SERVICE RELOAD v8 🚨', FORCE_RELOAD_NOW);
console.log('🔥 IF YOU SEE THIS, THE NEW CODE IS LOADED 🔥');

// CACHE BUST v2.1 - CLOUDINARY_UPLOAD_FIX
class ApiService {
  // FORCE RELOAD MARKER - PERMISSION FIX v7
  static RELOAD_MARKER = 'PERMISSION_FIX_v7_' + Date.now();
  
  static async getToken() {
    console.log('🚨 PERMISSION FIX API SERVICE LOADED 🚨', this.RELOAD_MARKER);
    return await AsyncStorage.getItem('userToken');
  }

  static async apiCall(endpoint, options = {}) {
    const token = await this.getToken();
    let url = `${BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('=== API CALL DEBUG ===');
    console.log('URL:', url);
    console.log('Method:', config.method || 'GET');
    console.log('Has token:', !!token);

    try {
      const response = await fetch(url, config);
      
      console.log('=== RESPONSE DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log(`API Error - Status: ${response.status}, URL: ${url}`);
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('Error response:', JSON.stringify(error, null, 2));
        return {
          success: false,
          message: error.message || `HTTP ${response.status}: ${response.statusText}`,
          data: error
        };
      }
      
      const jsonResponse = await response.json();
      console.log('=== SUCCESS RESPONSE ===');
      console.log('Response data:', JSON.stringify(jsonResponse, null, 2));
      
      // Check for subscription requirement - but don't auto-redirect
      if (jsonResponse.requiresSubscription) {
        console.log('🚨 SUBSCRIPTION REQUIRED - but letting screens handle navigation');
        // Let individual screens handle their own subscription checks and navigation
      }
      
      return jsonResponse;
    } catch (error) {
      console.log('=== NETWORK ERROR DETAILS ===');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Full error:', error);
      
      return {
        success: false,
        message: `Network error: ${error.message}. Please check your connection.`,
        data: { error: error.message, type: error.name }
      };
    }
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
    const response = await this.apiCall('/auth/profile');
    console.log('=== USER PROFILE DEBUG ===');
    console.log('Profile response:', JSON.stringify(response, null, 2));
    if (response.success && response.data && response.data.user) {
      console.log('User role:', response.data.user.role);
      console.log('User organizationId:', response.data.user.organizationId);
      console.log('User roleId:', response.data.user.roleId);
    }
    return response;
  }

  static async register(userData) {
    console.log('🚨 REGISTER API CALL DEBUG 🚨');
    console.log('Request data:', JSON.stringify(userData, null, 2));
    
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

  static async updateProfile(profileData) {
    return this.apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  static async forgotPassword(email) {
    return this.apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase() }),
    });
  }

  static async resetPassword(email, otp, newPassword) {
    return this.apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), otp, newPassword }),
    });
  }

  // USERS
  static async getUsers(page = 1, limit = 10) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users?page=${page}&limit=${limit}&includeOrganization=true`);
    }
    return this.apiCall(`/user/users?page=${page}&limit=${limit}&includeOrganization=true`);
  }

  static async getUserById(userId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}`);
    }
    return this.apiCall(`/user/users/${userId}`);
  }

  static async getOrgUsers(page = 1, limit = 10) {
    return this.apiCall(`/org-user/users?page=${page}&limit=${limit}`);
  }

  static async getOrgUserById(userId) {
    if (!userId || userId === 'undefined') {
      return { success: false, message: 'User ID is required' };
    }
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}`);
    }
    return this.apiCall(`/user/users/${userId}`);
  }

  static async createOrgUser(userData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    }
    return this.apiCall('/user/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async updateOrgUser(userId, userData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    }
    return this.apiCall(`/user/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async updateOrgUserStatus(userId, status) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    }
    return this.apiCall(`/user/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async sendOrgUserEmail(userId, emailData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}/send-email`, {
        method: 'POST',
        body: JSON.stringify(emailData),
      });
    }
    return this.apiCall(`/user/users/${userId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // PERSONAL MEASUREMENTS (Body Measurement screen)
  static async scanMeasurement(scanData) {
    console.log('🚨 AI SCAN DEBUG 🚨');
    console.log('Using endpoint: POST /api/measurements/scan');
    console.log('Full URL:', `${BASE_URL}/measurements/scan`);
    console.log('Scan data:', JSON.stringify(scanData, null, 2));
    
    return this.apiCall('/measurements/scan', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  static async saveManualMeasurement(measurementData) {
    console.log('🚨 MANUAL MEASUREMENT SAVE DEBUG 🚨');
    console.log('Using endpoint: POST /api/manual-measurements/save');
    console.log('Full URL:', `${BASE_URL}/manual-measurements/save`);
    console.log('Measurement data:', JSON.stringify(measurementData, null, 2));
    
    return this.apiCall('/manual-measurements/save', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  static async resetOrgUserPassword(userId, passwordData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });
    }
    return this.apiCall(`/user/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // MEASUREMENTS
  static async deleteMeasurement(measurementId) {
    console.log('=== DELETE MEASUREMENT DEBUG ===');
    console.log('Measurement ID:', measurementId);
    
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin for ORGANIZATION role');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user for regular user');
      }
      
      const endpoint = `${baseUrl}/measurements/${measurementId}`;
      console.log('Delete endpoint:', endpoint);
      
      return this.apiCall(endpoint, {
        method: 'DELETE',
      });
    }
    
    console.log('Fallback to /measurements endpoint');
    return this.apiCall(`/measurements/${measurementId}`, {
      method: 'DELETE',
    });
  }

  static async createAdminMeasurement(measurementData) {
    console.log('=== createAdminMeasurement DEBUG START ===');
    console.log('measurementData:', JSON.stringify(measurementData, null, 2));
    
    try {
      const profileResponse = await this.getUserProfile();
      console.log('=== PROFILE RESPONSE ===');
      console.log('Success:', profileResponse.success);
      console.log('Full response:', JSON.stringify(profileResponse, null, 2));
      
      if (profileResponse.success) {
        const user = profileResponse.data.user;
        console.log('=== USER DETAILS ===');
        console.log('Role:', user.role);
        console.log('OrganizationId:', user.organizationId);
        console.log('RoleId:', user.roleId);
        console.log('Permissions:', user.permissions);
        
        let baseUrl;
        if (user.role === 'ORGANIZATION') {
          baseUrl = '/admin';
          console.log('✅ Using /admin endpoint for ORGANIZATION role');
        } else if (user.role === 'CUSTOMER' && user.organizationId) {
          baseUrl = '/org-user';
          console.log('✅ Using /org-user endpoint for CUSTOMER with organizationId:', user.organizationId);
        } else {
          baseUrl = '/user';
          console.log('✅ Using /user endpoint for regular user');
        }
        
        const endpoint = `${baseUrl}/measurements`;
        console.log('=== FINAL API CALL ===');
        console.log('Endpoint:', endpoint);
        console.log('Full URL will be:', `${BASE_URL}${endpoint}`);
        console.log('Request payload:', JSON.stringify(measurementData, null, 2));
        
        return this.apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify(measurementData),
        });
      } else {
        console.log('❌ Profile response failed:', profileResponse.message);
        console.log('Using fallback /user endpoint');
        return this.apiCall('/user/measurements', {
          method: 'POST',
          body: JSON.stringify(measurementData),
        });
      }
    } catch (error) {
      console.log('❌ Exception in createAdminMeasurement:', error);
      console.log('Using fallback /user endpoint');
      return this.apiCall('/user/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
      });
    }
  }

  static async updateAdminMeasurement(measurementId, measurementData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/measurements/${measurementId}`, {
        method: 'PUT',
        body: JSON.stringify(measurementData),
      });
    }
    return this.apiCall(`/user/measurements/${measurementId}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData),
    });
  }

  static async deleteAdminMeasurement(measurementId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/measurements/${measurementId}`, {
        method: 'DELETE',
      });
    }
    return this.apiCall(`/user/measurements/${measurementId}`, {
      method: 'DELETE',
    });
  }

  static async getMeasurementById(measurementId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/measurements/${measurementId}`);
    }
    return this.apiCall(`/user/measurements/${measurementId}`);
  }

  static async getAdminMeasurements(page = 1, limit = 10) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/measurements?page=${page}&limit=${limit}`);
    }
    return this.apiCall(`/user/measurements?page=${page}&limit=${limit}`);
  }

  static async getUserMeasurements(userId, page = 1, limit = 10) {
    console.log('=== getUserMeasurements CORRECT ENDPOINT ===');
    console.log('userId:', userId, 'page:', page, 'limit:', limit);
    
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin for ORGANIZATION role');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user for regular user');
      }
      const endpoint = `${baseUrl}/users/${userId}/measurements?page=${page}&limit=${limit}`;
      console.log('Final endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    console.log('Fallback to /user endpoint');
    return this.apiCall(`/user/users/${userId}/measurements?page=${page}&limit=${limit}`);
  }

  // ROLES
  static async getRoles(page = 1, limit = 10) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      console.log('=== getRoles DEBUG ===');
      console.log('User role:', user.role);
      console.log('User organizationId:', user.organizationId);
      
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin/roles for ORGANIZATION');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user/roles for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user/roles for regular user');
      }
      const endpoint = `${baseUrl}/roles?page=${page}&limit=${limit}&includeUsers=true`;
      console.log('Calling endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    return this.apiCall(`/user/roles?page=${page}&limit=${limit}&includeUsers=true`);
  }

  static async getOrgRoles(page = 1, limit = 10) {
    console.log('=== WARNING: getOrgRoles() called - this should use getRoles() instead ===');
    return this.getRoles(page, limit);
  }

  static async createRole(roleData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles`, {
        method: 'POST',
        body: JSON.stringify(roleData),
      });
    }
    return this.apiCall('/user/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  static async getRoleById(roleId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles/${roleId}?includeUsers=true`);
    }
    return this.apiCall(`/user/roles/${roleId}?includeUsers=true`);
  }

  static async getRoleUsers(roleId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles/${roleId}/users`);
    }
    return this.apiCall(`/user/roles/${roleId}/users`);
  }

  static async updateRole(roleId, roleData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      });
    }
    return this.apiCall(`/user/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  static async deleteRole(roleId, roleData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles/${roleId}`, {
        method: 'DELETE',
      });
    }
    return this.apiCall(`/user/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  static async getAvailableRoles() {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/roles`);
    }
    return this.apiCall('/user/roles');
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
    
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      
      const userEndpoint = `${baseUrl}/users/${userId}`;
      console.log('User endpoint:', `${BASE_URL}${userEndpoint}`);
      
      const response = await this.apiCall(userEndpoint);
      console.log('User data response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data.user) {
        const targetUser = response.data.user;
        console.log('User roleId field:', targetUser.roleId);
        
        if (targetUser.roleId) {
          const roleDetailsResponse = await this.apiCall(`${baseUrl}/roles/${targetUser.roleId}`);
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
    return { success: false, message: 'Failed to get user profile' };
  }

  // ORGANIZATION DASHBOARD - For settings section dashboard grid only
  static async getOrganizationDashboardStats() {
    try {
      const profileResponse = await this.getUserProfile();
      console.log('=== getOrganizationDashboardStats DEBUG ===');
      
      if (profileResponse.success) {
        const user = profileResponse.data.user;
        console.log('User role:', user.role);
        console.log('User organizationId:', user.organizationId);
        
        // For ORGANIZATION role - use admin endpoint
        if (user.role === 'ORGANIZATION') {
          console.log('Using /admin/dashboard/stats for ORGANIZATION');
          return this.apiCall('/admin/dashboard/stats');
        }
        
        // For CUSTOMER with organizationId - check permission and use org-user endpoint
        if (user.role === 'CUSTOMER' && user.organizationId) {
          console.log('CUSTOMER with organizationId - checking permissions...');
          
          // Get user permissions
          const permissionsResponse = await this.getMyPermissions();
          
          if (permissionsResponse.success) {
            const permissions = permissionsResponse.data.permissions || [];
            console.log('=== DETAILED PERMISSION DEBUG ===');
            console.log('Permissions array length:', permissions.length);
            permissions.forEach((p, index) => {
              console.log(`Permission ${index}:`, typeof p, JSON.stringify(p));
              if (typeof p === 'object' && p.key) {
                console.log(`  - Key: ${p.key}`);
                console.log(`  - Matches view_dashboard_stats: ${p.key === 'view_dashboard_stats'}`);
              }
            });
            
            const hasViewDashboardStats = permissions.some(p => {
              const match = p.key === 'view_dashboard_stats' || p === 'view_dashboard_stats';
              console.log(`Checking permission:`, p, 'Match:', match);
              return match;
            });
            
            console.log('Final result - Has view_dashboard_stats permission:', hasViewDashboardStats);
            
            if (hasViewDashboardStats) {
              console.log('Permission granted - calling /org-user/dashboard/stats');
              const response = await this.apiCall('/org-user/dashboard/stats');
              console.log('Org dashboard response:', JSON.stringify(response, null, 2));
              return response;
            } else {
              console.log('Permission denied - view_dashboard_stats not found');
              return { success: false, message: 'Permission denied: view_dashboard_stats required' };
            }
          } else {
            console.log('Failed to get permissions');
            return { success: false, message: 'Failed to check permissions' };
          }
        }
        
        console.log('No organization access');
        return { success: false, message: 'No organization access' };
      }
      
      return { success: false, message: 'Failed to get user profile' };
    } catch (error) {
      console.log('getOrganizationDashboardStats error:', error);
      return { success: false, message: 'Error fetching dashboard stats' };
    }
  }

  // DEBUG: Test org-user measurements endpoint directly
  static async testOrgUserMeasurements() {
    console.log('=== TESTING ORG-USER MEASUREMENTS DIRECT CALL ===');
    const response = await this.apiCall('/org-user/measurements?page=1&limit=10');
    console.log('Direct org-user measurements response:', JSON.stringify(response, null, 2));
    return response;
  }

  // DEBUG: Test specific user measurements endpoint
  static async testUserMeasurementsEndpoint(userId) {
    console.log('=== TESTING USER MEASUREMENTS ENDPOINT ===');
    console.log('Testing userId:', userId);
    
    // Test org-user endpoint directly
    const orgUserEndpoint = `/org-user/users/${userId}/measurements`;
    console.log('Testing endpoint:', orgUserEndpoint);
    const response = await this.apiCall(orgUserEndpoint);
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  }

  // MEASUREMENTS - FIXED ROUTING
  static async getManualMeasurements(page = 1, limit = 10) {
    console.log('=== getManualMeasurements FIXED - using /user/measurements ===');
    return this.apiCall(`/user/measurements?page=${page}&limit=${limit}`);
  }

  // MEASUREMENTS - BODY MEASUREMENT PAGE - Always use /user endpoint for personal measurements
  static async getMyMeasurements(page = 1, limit = 10, userId = null) {
    console.log('=== getMyMeasurements - PERSONAL BODY MEASUREMENTS ===');
    console.log('Always using /user/measurements for personal measurements regardless of user role');
    
    let endpoint = `/user/measurements?page=${page}&limit=${limit}`;
    if (userId) {
      endpoint += `&userId=${userId}`;
    }
    console.log('Body Measurement endpoint:', endpoint);
    return this.apiCall(endpoint);
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
      
      // Use user-permissions endpoint to get actual user permissions (not static list)
      const endpoint = `${baseUrl}/user-permissions`;
      console.log('calling:', endpoint);
      return this.apiCall(endpoint);
    }
    return this.apiCall('/user/user-permissions');
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
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
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
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        return { success: false, message: 'Groups management only available for organization users' };
      }
      return this.apiCall(`${baseUrl}/groups`);
    }
    return { success: false, message: 'Failed to get user profile' };
  }

  static async getGroupById(groupId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/groups/${groupId}`);
    }
    return this.apiCall(`/user/groups/${groupId}`);
  }

  static async createGroup(groupData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/groups`, {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
    }
    return this.apiCall('/user/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  static async updateGroup(groupId, groupData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(groupData),
      });
    }
    return this.apiCall(`/user/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  }

  static async manageGroupMembers(groupId, action, userIds) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      const response = await this.apiCall(`${baseUrl}/groups/${groupId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ action, userIds }),
      });
      
      // Log the response to see the updated group data
      console.log('=== manageGroupMembers RESPONSE ===');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      return response;
    }
    return this.apiCall(`/user/groups/${groupId}/members`, {
      method: 'PUT',
      body: JSON.stringify({ action, userIds }),
    });
  }

  static async deleteGroup(groupId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/groups/${groupId}`, {
        method: 'DELETE',
      });
    }
    return this.apiCall(`/user/groups/${groupId}`, {
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
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      console.log('=== getMeasurements DEBUG ===');
      console.log('User role:', user.role);
      console.log('User organizationId:', user.organizationId);
      
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin/measurements for ORGANIZATION');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user/measurements for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user/measurements for regular user');
      }
      let endpoint = `${baseUrl}/measurements?page=${page}&limit=${limit}`;
      if (userId) {
        endpoint += `&userId=${userId}`;
      }
      console.log('Calling endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    return this.apiCall(`/user/measurements?page=${page}&limit=${limit}`);
  }

  static async getAdminMeasurements(page = 1, limit = 10, userId = null) {
    console.log('=== getAdminMeasurements called - this should use role-based routing ===');
    console.log('page:', page, 'limit:', limit, 'userId:', userId);
    
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin for ORGANIZATION role');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user for regular user');
      }
      
      let endpoint = `${baseUrl}/measurements?page=${page}&limit=${limit}`;
      if (userId) {
        endpoint += `&userId=${userId}`;
      }
      console.log('Final endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    
    let endpoint = `/user/measurements?page=${page}&limit=${limit}`;
    if (userId) {
      endpoint += `&userId=${userId}`;
    }
    console.log('Fallback endpoint:', endpoint);
    return this.apiCall(endpoint);
  }

  static async getAllMeasurements(page = 1, limit = 10, userId = null) {
    return this.getAdminMeasurements(page, limit, userId);
  }

  static async getAdminMeasurement(measurementId) {
    return this.apiCall(`/admin/measurements/${measurementId}`);
  }

  static async getMeasurementById(measurementId) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/measurements/${measurementId}`);
    }
    return this.apiCall(`/user/measurements/${measurementId}`);
  }

  static async createMeasurement(measurementData) {
    const hasAdmin = await this.hasAdminAccess();
    const baseUrl = hasAdmin ? '/admin' : '/user';
    return this.apiCall(`${baseUrl}/measurements`, {
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

  // ONE-TIME CODES - FIXED ROUTING
  static async getOneTimeCodes(page = 1, limit = 10) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      console.log('=== getOneTimeCodes FIXED - role-based routing ===');
      console.log('User role:', user.role, 'organizationId:', user.organizationId);
      
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
        console.log('Using /admin/one-time-codes for ORGANIZATION');
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
        console.log('Using /org-user/one-time-codes for CUSTOMER with organizationId');
      } else {
        baseUrl = '/user';
        console.log('Using /user/one-time-codes for regular user');
      }
      const endpoint = `${baseUrl}/one-time-codes?page=${page}&limit=${limit}`;
      console.log('Calling FIXED endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    console.log('Fallback to /user/one-time-codes');
    return this.apiCall(`/user/one-time-codes?page=${page}&limit=${limit}`);
  }

  static async generateOneTimeCode(codeData) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/one-time-codes`, {
        method: 'POST',
        body: JSON.stringify(codeData),
      });
    }
    return this.apiCall('/user/one-time-codes', {
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
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      let baseUrl;
      if (user.role === 'ORGANIZATION') {
        baseUrl = '/admin';
      } else if (user.role === 'CUSTOMER' && user.organizationId) {
        baseUrl = '/org-user';
      } else {
        baseUrl = '/user';
      }
      return this.apiCall(`${baseUrl}/one-time-codes/send-email`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return this.apiCall('/user/one-time-codes/send-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // SHARING
  static async shareToOrganization(measurementId, code) {
    return this.apiCall('/measurements/share-to-organization', {
      method: 'POST',
      body: JSON.stringify({ measurementId, oneTimeCode: code }),
    });
  }

  // PERSONAL MEASUREMENTS (Body Measurement screen)
  static async saveManualMeasurement(measurementData) {
    console.log('🚨 MANUAL MEASUREMENT SAVE DEBUG 🚨');
    console.log('Using endpoint: POST /api/manual-measurements/save');
    console.log('Full URL:', `${BASE_URL}/manual-measurements/save`);
    console.log('Measurement data:', JSON.stringify(measurementData, null, 2));
    
    return this.apiCall('/manual-measurements/save', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  // CLOUDINARY DIRECT UPLOAD
  static async uploadToCloudinary(imageUri) {
    console.log('🚨 CLOUDINARY UPLOAD START 🚨');
    console.log('Image URI:', imageUri);
    
    try {
      // Create FormData with proper file handling for React Native
      const formData = new FormData();
      
      // For React Native, we need to handle the file differently
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `measurement-${Date.now()}.${fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      });
      
      formData.append('upload_preset', 'vestradat_preset');
      
      console.log('FormData created with file:', fileName);
      console.log('Uploading to Cloudinary...');
      
      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/disz21zwr/image/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('Cloudinary response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.log('❌ Cloudinary error response:', errorText);
        throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
      }
      
      const result = await uploadResponse.json();
      console.log('Cloudinary response:', JSON.stringify(result, null, 2));
      
      if (result.secure_url) {
        console.log('✅ Upload successful:', result.secure_url);
        return result.secure_url;
      } else {
        console.log('❌ No secure_url in response');
        throw new Error('No secure_url in Cloudinary response');
      }
    } catch (error) {
      console.log('❌ Cloudinary upload error:', error);
      console.log('Error details:', error.message);
      throw error;
    }
  }
  static async scanMeasurement(scanData) {
    console.log('=== AI MEASUREMENT SCAN ===');
    console.log('Scan data keys:', Object.keys(scanData));
    console.log('Height:', scanData.userHeight);
    console.log('First Name:', scanData.firstName);
    console.log('Last Name:', scanData.lastName);
    console.log('Full scan data:', JSON.stringify(scanData, null, 2));
    
    try {
      const response = await this.apiCall('/measurements/scan', {
        method: 'POST',
        body: JSON.stringify(scanData),
      });
      
      console.log('=== AI SCAN RESPONSE ===');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      // Handle specific server errors
      if (!response.success) {
        if (response.message && response.message.includes('429')) {
          return {
            success: false,
            message: 'AI service is temporarily busy. Please wait a moment and try again.',
            error: 'Rate limit exceeded'
          };
        }
        
        if (response.message && response.message.includes('Internal server error')) {
          return {
            success: false,
            message: 'AI processing failed. Please try again with different images or contact support.',
            error: 'Server processing error'
          };
        }
      }
      
      return response;
    } catch (error) {
      console.log('=== AI SCAN ERROR ===');
      console.log('Error:', error);
      return {
        success: false,
        message: 'Failed to connect to AI service. Please check your connection and try again.',
        error: error.message
      };
    }
  }

  // SERVICE MANAGEMENT (Super Admin)
  static async createService(serviceData) {
    return this.apiCall('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  static async getAllServices() {
    return this.apiCall('/services');
  }

  static async getServiceById(serviceId) {
    return this.apiCall(`/services/${serviceId}`);
  }

  static async updateService(serviceId, serviceData) {
    return this.apiCall(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  static async deleteService(serviceId) {
    return this.apiCall(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // SUBSCRIPTION PACKAGE MANAGEMENT (Super Admin)
  static async getAvailableServices() {
    return this.apiCall('/subscription-packages/available-services');
  }

  static async createSubscriptionPackage(packageData) {
    return this.apiCall('/subscription-packages', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  }

  static async getAllSubscriptionPackages() {
    return this.apiCall('/subscription-packages');
  }

  static async getSubscriptionPackageById(packageId) {
    return this.apiCall(`/subscription-packages/${packageId}`);
  }

  static async updateSubscriptionPackage(packageId, packageData) {
    return this.apiCall(`/subscription-packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(packageData),
    });
  }

  static async deleteSubscriptionPackage(packageId) {
    return this.apiCall(`/subscription-packages/${packageId}`, {
      method: 'DELETE',
    });
  }

  // SUPER ADMIN DASHBOARD STATS
  static async getSuperAdminDashboardStats() {
    return this.apiCall('/super-admin/dashboard-stats');
  }

  // SUPER ADMIN USER MANAGEMENT
  static async getSuperAdminUsers(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/users${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
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

  static async resetSuperAdminUserPassword(userId, passwordData) {
    return this.apiCall(`/super-admin/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  static async deleteSuperAdminUser(userId) {
    return this.apiCall(`/super-admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  static async exportSuperAdminUsers(format = 'csv') {
    return this.apiCall(`/super-admin/users/export/${format}`);
  }

  static async getOrganizationUsers(organizationId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/organizations/${organizationId}/users${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
  }

  static async getSuperAdminOrganizationAdmins(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/admins${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
  }

  // SUPER ADMIN ORGANIZATION MANAGEMENT
  static async getSuperAdminOrganizations(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/organizations${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
  }

  static async createSuperAdminOrganization(orgData) {
    return this.apiCall('/super-admin/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  static async updateSuperAdminOrganizationStatus(orgId, status) {
    return this.apiCall(`/super-admin/organizations/${orgId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // SUPER ADMIN PAID SUBSCRIPTIONS
  static async getPaidSubscriptions(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/paid-subscriptions${queryString ? '?' + queryString : ''}`;
    
    console.log('🚨 PAID SUBSCRIPTIONS API CALL 🚨');
    console.log('Endpoint:', endpoint);
    console.log('Query params:', params);
    
    return this.apiCall(endpoint);
  }

  // PAYMENT METHODS
  static async initializePayment(paymentData) {
    console.log('🚨 PAYMENT INITIALIZATION DEBUG 🚨');
    console.log('Payment data being sent:', JSON.stringify(paymentData, null, 2));
    
    return this.apiCall('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async verifyPayment(transactionId) {
    return this.apiCall('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }

  static async getPackagePricing(packageId, duration = null) {
    const endpoint = duration 
      ? `/payments/package/${packageId}/pricing?duration=${duration}`
      : `/payments/package/${packageId}/pricing`;
    return this.apiCall(endpoint);
  }

  // ORGANIZATION SUBSCRIPTIONS
  static async getOrganizationSubscription() {
    return this.apiCall('/organization/subscription');
  }

  static async getAvailablePackagesForOrganization() {
    return this.apiCall('/subscription-packages/available');
  }

  // SUPER ADMIN LOCATION MANAGEMENT
  static async createLocation(locationData) {
    console.log('🚨 CREATE LOCATION API DEBUG 🚨');
    console.log('Data being sent to API:', JSON.stringify(locationData, null, 2));
    
    // Backend expects cityRegions as array of objects with name and fee
    const fixedData = {
      country: locationData.country,
      state: locationData.state,
      lga: locationData.lga,
      city: locationData.city,
      cityRegions: locationData.cityRegions || [{
        name: locationData.cityRegion,
        fee: Number(locationData.fee) || 0
      }]
    };
    
    console.log('🚨 CORRECT BACKEND FORMAT 🚨');
    console.log('Fixed data being sent:', JSON.stringify(fixedData, null, 2));
    
    return this.apiCall('/super-admin/locations', {
      method: 'POST',
      body: JSON.stringify(fixedData),
    });
  }

  static async getAllLocations(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/locations${queryString ? '?' + queryString : ''}`;
    
    const response = await this.apiCall(endpoint);
    
    // Fix undefined fee values in response data
    if (response.success && response.data && response.data.locations) {
      response.data.locations = response.data.locations.map(location => ({
        ...location,
        cityRegions: location.cityRegions ? location.cityRegions.map(region => ({
          ...region,
          fee: Number(region.fee) || 0
        })) : []
      }));
    }
    
    return response;
  }

  static async updateLocation(locationId, locationData) {
    return this.apiCall(`/super-admin/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  static async deleteLocation(locationId) {
    return this.apiCall(`/super-admin/locations/${locationId}`, {
      method: 'DELETE',
    });
  }

  // EXTERNAL LOCATION DATA (Using country-state-city package)
  static async getExternalCountries() {
    try {
      const countries = Country.getAllCountries();
      return {
        success: true,
        data: {
          countries: countries.map(country => ({
            name: country.name,
            code: country.isoCode
          })).sort((a, b) => a.name.localeCompare(b.name))
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to load countries' };
    }
  }

  static async getExternalStates(countryName) {
    try {
      // Find country by name
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.name === countryName);
      
      if (!country) {
        return { success: false, message: 'Country not found' };
      }
      
      const states = State.getStatesOfCountry(country.isoCode);
      return {
        success: true,
        data: {
          states: states.map(state => ({
            name: state.name,
            code: state.isoCode
          })).sort((a, b) => a.name.localeCompare(b.name))
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to load states/regions' };
    }
  }

  static async getExternalCities(countryName, stateName, lga) {
    try {
      // Find country and state
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.name === countryName);
      
      if (!country) {
        return { success: false, message: 'Country not found' };
      }
      
      const states = State.getStatesOfCountry(country.isoCode);
      const state = states.find(s => s.name === stateName);
      
      if (!state) {
        return { success: false, message: 'State not found' };
      }
      
      // Get all cities for this state
      const allCities = City.getCitiesOfState(country.isoCode, state.isoCode);
      
      // Filter cities that might be related to the LGA or just return all cities
      let cities = allCities.map(city => city.name).sort();
      
      // If no cities found, provide some generic city names
      if (cities.length === 0) {
        cities = [`${lga}`, `${lga} Central`, `${lga} Town`];
      }
      
      return {
        success: true,
        data: { cities: cities.slice(0, 15) } // Limit to 15 for performance
      };
    } catch (error) {
      return { success: false, message: 'Failed to load cities' };
    }
  }

  static async getExternalLGAs(countryName, stateName) {
    try {
      // For Nigeria, provide comprehensive LGA data
      if (countryName === 'Nigeria') {
        const nigerianLGAs = {
          'Lagos': [
            'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
            'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
            'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
            'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'
          ],
          'Ogun': [
            'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ewekoro', 'Ifo',
            'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne',
            'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu',
            'Ogun Waterside', 'Remo North', 'Sagamu', 'Yewa North', 'Yewa South'
          ],
          'Kano': [
            'Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala',
            'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge',
            'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale',
            'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru',
            'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir',
            'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila',
            'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo',
            'Warawa', 'Wudil'
          ],
          'Rivers': [
            'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni',
            'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche',
            'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni',
            'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo',
            'Port Harcourt', 'Tai'
          ],
          'Abuja': [
            'Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'
          ]
        };

        const lgas = nigerianLGAs[stateName];
        if (lgas) {
          return {
            success: true,
            data: { lgas: lgas.sort() }
          };
        }
      }

      // Fallback to original logic for other countries
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.name === countryName);
      
      if (!country) {
        return { success: false, message: 'Country not found' };
      }
      
      const states = State.getStatesOfCountry(country.isoCode);
      const state = states.find(s => s.name === stateName);
      
      if (!state) {
        return { success: false, message: 'State not found' };
      }
      
      // Get cities for this state (we'll use cities as LGAs since the package doesn't have LGA level)
      const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
      
      // If no cities found, provide some generic LGA names based on the state
      const lgas = cities.length > 0 
        ? cities.map(city => city.name).sort()
        : [`${stateName} Central`, `${stateName} North`, `${stateName} South`, `${stateName} East`, `${stateName} West`];
      
      return {
        success: true,
        data: { lgas: lgas.slice(0, 20) } // Limit to 20 for performance
      };
    } catch (error) {
      return { success: false, message: 'Failed to load LGAs' };
    }
  }

  // SUPER ADMIN DATA VERIFICATION
  static async createDataVerificationRole(roleData) {
    return this.apiCall('/super-admin/data-verification/create-role', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  static async getDataVerificationAllUsers() {
    return this.apiCall('/super-admin/data-verification/users');
  }

  static async assignDataVerificationRole(userId, assign) {
    return this.apiCall(`/super-admin/data-verification/assign-role/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ assign }),
    });
  }

  static async getSuperAdminVerifications(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/data-verification/verifications${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
  }

  static async reviewVerification(verificationId, status, comments) {
    return this.apiCall(`/super-admin/data-verification/verifications/${verificationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, comments }),
    });
  }

  static async getDataVerificationUsers() {
    return this.apiCall('/super-admin/data-verification/verification-users');
  }

  static async getVerificationStats() {
    return this.apiCall('/super-admin/data-verification/verification-stats');
  }

  static async getSuperAdminVerificationDetails(verificationId) {
    return this.apiCall(`/super-admin/data-verification/verifications/${verificationId}`);
  }

  // ORGANIZATION PROFILE MANAGEMENT
  static async createOrganizationProfile(profileData) {
    return this.apiCall('/admin/organization-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  static async getOrganizationProfile() {
    console.log('🚨 GET ORGANIZATION PROFILE DEBUG 🚨');
    const response = await this.apiCall('/admin/organization-profile');
    console.log('Organization profile response:', JSON.stringify(response, null, 2));
    return response;
  }

  static async addOrganizationLocation(locationData) {
    console.log('🚨 ADD ORGANIZATION LOCATION DEBUG 🚨');
    console.log('Location data being sent:', JSON.stringify(locationData, null, 2));
    const response = await this.apiCall('/admin/organization-profile/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    console.log('Add location response:', JSON.stringify(response, null, 2));
    return response;
  }

  static async updateOrganizationLocation(locationIndex, locationData) {
    return this.apiCall(`/admin/organization-profile/locations/${locationIndex}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  static async deleteOrganizationLocation(locationIndex) {
    return this.apiCall(`/admin/organization-profile/locations/${locationIndex}`, {
      method: 'DELETE',
    });
  }

  static async checkVerificationEligibility() {
    return this.apiCall('/admin/organization-profile/verification/check');
  }

  static async submitForVerification() {
    return this.apiCall('/admin/organization-profile/verification/submit', {
      method: 'POST',
    });
  }

  // VERIFIED BADGE PAYMENT
  static async checkVerifiedBadgePaymentRequired() {
    return this.apiCall('/payment/verified-badge/check-payment-required');
  }

  static async getVerifiedBadgePricing() {
    return this.apiCall('/payment/verified-badge/pricing');
  }

  static async initializeVerifiedBadgePayment(paymentData) {
    return this.apiCall('/payment/verified-badge/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async verifyVerifiedBadgePayment(transactionId) {
    return this.apiCall('/payment/verified-badge/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }

  // PUBLIC ORGANIZATION PROFILES
  static async getAllPublicProfiles() {
    return this.apiCall('/organization-profiles/public/all');
  }

  // SUPER ADMIN LOCATION VERIFICATION MANAGEMENT
  static async getPendingLocationVerifications() {
    return this.apiCall('/super-admin/location-verifications/pending');
  }

  static async getRejectedLocationVerifications() {
    return this.apiCall('/super-admin/location-verifications/rejected');
  }

  static async getVerifiedLocationVerifications() {
    return this.apiCall('/super-admin/location-verifications/verified');
  }

  static async approveLocationVerification(profileId, locationIndex) {
    return this.apiCall(`/super-admin/location-verifications/${profileId}/${locationIndex}/approve`, {
      method: 'PUT',
    });
  }

  static async rejectLocationVerification(profileId, locationIndex, reason) {
    return this.apiCall(`/super-admin/location-verifications/${profileId}/${locationIndex}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  static async sendLocationRejectionEmail(profileId, locationIndex) {
    return this.apiCall(`/super-admin/location-verifications/${profileId}/${locationIndex}/send-rejection-email`, {
      method: 'POST',
    });
  }

  static async approveVerification(profileId) {
    return this.apiCall(`/super-admin/verifications/${profileId}/approve`, {
      method: 'PUT',
    });
  }

  static async rejectVerification(profileId, reason) {
    return this.apiCall(`/super-admin/verifications/${profileId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // USER SUBSCRIPTION STATUS CHECK
  static async checkUserSubscriptionStatus(userId) {
    return this.apiCall(`/user-subscriptions/user/${userId}/status`);
  }

  // Check current user's subscription status
  static async checkMySubscriptionStatus() {
    try {
      const profileResponse = await this.getUserProfile();
      console.log('🚨 FULL PROFILE RESPONSE DEBUG 🚨');
      console.log('Profile response:', JSON.stringify(profileResponse, null, 2));
      
      if (profileResponse.success && profileResponse.data.user) {
        const user = profileResponse.data.user;
        console.log('🚨 USER OBJECT DEBUG 🚨');
        console.log('User keys:', Object.keys(user));
        console.log('user._id:', user._id);
        console.log('user.id:', user.id);
        console.log('user.userId:', user.userId);
        
        // Try multiple possible userId fields
        const userId = user._id || user.id || user.userId || user.ID;
        console.log('Final userId:', userId);
        
        if (!userId) {
          console.log('❌ No userId found in any field');
          return { success: false, message: 'User ID not found in profile' };
        }
        
        console.log('✅ Using userId:', userId);
        return this.checkUserSubscriptionStatus(userId);
      }
      return { success: false, message: 'Failed to get user profile' };
    } catch (error) {
      console.log('Error in checkMySubscriptionStatus:', error);
      return { success: false, message: 'Error checking subscription status' };
    }
  }

  // LOGIN STATUS CHECK (New endpoint)
  static async checkLoginStatus() {
    return this.apiCall('/admin/login-status');
  }

  // COMBINED PAYMENT (Subscription + Verified Badge)
  static async initializeCombinedPayment(paymentData) {
    console.log('🚨 COMBINED PAYMENT INITIALIZATION DEBUG 🚨');
    console.log('Combined payment data being sent:', JSON.stringify(paymentData, null, 2));
    
    return this.apiCall('/payment/combined/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async verifyCombinedPayment(transactionId) {
    return this.apiCall('/payment/combined/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }

  // CITY REGIONS (for verified badge pricing)
  static async getCityRegions() {
    return this.apiCall('/super-admin/locations');
  }

  // LOCATION OPTIONS (New endpoints for city regions and hierarchy)
  static async getLocationHierarchy(level, params = {}) {
    const queryParams = new URLSearchParams({ level, ...params });
    return this.apiCall(`/admin/location-options/hierarchy?${queryParams}`);
  }

  static async getCityRegionOptions(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.apiCall(`/admin/location-options/city-regions?${queryParams}`);
  }

  // Get cities for a specific country, state, and LGA
  static async getCities(country, state, lga) {
    const params = new URLSearchParams({ country, state, lga });
    return this.apiCall(`/admin/location-options/cities?${params}`);
  }

  // Get city regions with pricing for a specific location
  static async getCityRegions(country, state, lga, city) {
    const params = new URLSearchParams({ country, state, lga, city });
    return this.apiCall(`/admin/location-options/city-regions?${params}`);
  }

  // Get cities for a specific country, state, and LGA
  static async getCities(country, state, lga) {
    const params = new URLSearchParams({ country, state, lga });
    return this.apiCall(`/admin/location-options/cities?${params}`);
  }

  // Get city regions with pricing for a specific location
  static async getCityRegions(country, state, lga, city) {
    const params = new URLSearchParams({ country, state, lga, city });
    return this.apiCall(`/admin/location-options/city-regions?${params}`);
  }

  // SUPER ADMIN DEFAULT PRICING MANAGEMENT
  static async createDefaultPricing(pricingData) {
    return this.apiCall('/super-admin/default-pricing', {
      method: 'POST',
      body: JSON.stringify(pricingData),
    });
  }

  static async getAllDefaultPricing(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.country) queryParams.append('country', params.country);
    if (params.state) queryParams.append('state', params.state);
    
    const queryString = queryParams.toString();
    const endpoint = `/super-admin/default-pricing${queryString ? '?' + queryString : ''}`;
    return this.apiCall(endpoint);
  }

  static async getDefaultPricingById(pricingId) {
    return this.apiCall(`/super-admin/default-pricing/${pricingId}`);
  }

  static async updateDefaultPricing(pricingId, pricingData) {
    return this.apiCall(`/super-admin/default-pricing/${pricingId}`, {
      method: 'PUT',
      body: JSON.stringify(pricingData),
    });
  }

  static async deleteDefaultPricing(pricingId) {
    return this.apiCall(`/super-admin/default-pricing/${pricingId}`, {
      method: 'DELETE',
    });
  }

  static async testLocationPricing(locationData) {
    const queryParams = new URLSearchParams();
    if (locationData.country) queryParams.append('country', locationData.country);
    if (locationData.state) queryParams.append('state', locationData.state);
    if (locationData.lga) queryParams.append('lga', locationData.lga);
    if (locationData.city) queryParams.append('city', locationData.city);
    if (locationData.cityRegion) queryParams.append('cityRegion', locationData.cityRegion);
    
    const queryString = queryParams.toString();
    return this.apiCall(`/super-admin/pricing/location?${queryString}`);
  }

  // GALLERY MANAGEMENT
  static async getGalleryItems(filters = {}) {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc'
    });

    return this.apiCall(`/admin/gallery?${params}`);
  }

  static async getGalleryItem(itemId) {
    return this.apiCall(`/admin/gallery/${itemId}`);
  }

  static async createGalleryItem(itemData) {
    return this.apiCall('/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  static async updateGalleryItem(itemId, itemData) {
    return this.apiCall(`/admin/gallery/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  static async deleteGalleryItem(itemId) {
    return this.apiCall(`/admin/gallery/${itemId}`, {
      method: 'DELETE',
    });
  }

  static async uploadGalleryImage(itemId, imageFile) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    return this.apiCall(`/admin/gallery/${itemId}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  static async uploadGalleryVideo(itemId, videoFile) {
    const formData = new FormData();
    formData.append('video', {
      uri: videoFile.uri,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    return this.apiCall(`/admin/gallery/${itemId}/upload-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  static async getGalleryCategories() {
    return this.apiCall('/admin/gallery/categories');
  }

  static async getGalleryMediaUsage() {
    return this.apiCall('/admin/gallery/media-usage');
  }

  static async getGalleryLocations() {
    return this.apiCall('/admin/gallery/locations');
  }

  // GALLERY INDUSTRY/CATEGORY INTEGRATION
  static async getGalleryIndustries() {
    return this.apiCall('/admin/gallery/industries');
  }

  static async getGalleryCategories(industryId = null) {
    const endpoint = industryId 
      ? `/admin/gallery/categories?industryId=${industryId}`
      : '/admin/gallery/categories';
    return this.apiCall(endpoint);
  }

  static async getPlatformCodePreview() {
    return this.apiCall('/admin/gallery/preview-code');
  }

  // SUPER ADMIN INDUSTRY MANAGEMENT
  static async createIndustry(industryData) {
    return this.apiCall('/super-admin/industries', {
      method: 'POST',
      body: JSON.stringify(industryData),
    });
  }

  static async getAllIndustries() {
    return this.apiCall('/super-admin/industries');
  }

  static async getIndustryById(industryId) {
    return this.apiCall(`/super-admin/industries/${industryId}`);
  }

  static async updateIndustry(industryId, industryData) {
    return this.apiCall(`/super-admin/industries/${industryId}`, {
      method: 'PUT',
      body: JSON.stringify(industryData),
    });
  }

  static async deleteIndustry(industryId) {
    return this.apiCall(`/super-admin/industries/${industryId}`, {
      method: 'DELETE',
    });
  }

  // SUPER ADMIN CATEGORY MANAGEMENT
  static async createCategory(categoryData) {
    return this.apiCall('/super-admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  static async getAllCategories(industryId = null) {
    const endpoint = industryId 
      ? `/super-admin/categories?industryId=${industryId}`
      : '/super-admin/categories';
    return this.apiCall(endpoint);
  }

  static async getCategoryById(categoryId) {
    return this.apiCall(`/super-admin/categories/${categoryId}`);
  }

  static async updateCategory(categoryId, categoryData) {
    return this.apiCall(`/super-admin/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  static async deleteCategory(categoryId) {
    return this.apiCall(`/super-admin/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // SUPER ADMIN PICKUP CENTER MANAGEMENT
  static async createPickupCenter(centerData) {
    return this.apiCall('/super-admin/pickup-centers', {
      method: 'POST',
      body: JSON.stringify(centerData),
    });
  }

  static async getAllPickupCenters(isActive = null) {
    const endpoint = isActive && isActive !== 'all'
      ? `/super-admin/pickup-centers?isActive=${isActive}`
      : '/super-admin/pickup-centers';
    return this.apiCall(endpoint);
  }

  static async getPickupCenterById(centerId) {
    return this.apiCall(`/super-admin/pickup-centers/${centerId}`);
  }

  static async updatePickupCenter(centerId, centerData) {
    return this.apiCall(`/super-admin/pickup-centers/${centerId}`, {
      method: 'PUT',
      body: JSON.stringify(centerData),
    });
  }

  static async deletePickupCenter(centerId) {
    return this.apiCall(`/super-admin/pickup-centers/${centerId}`, {
      method: 'DELETE',
    });
  }

  // SUPER ADMIN PLATFORM COMMISSION MANAGEMENT
  static async createPlatformCommission(commissionData) {
    return this.apiCall('/super-admin/platform-commissions', {
      method: 'POST',
      body: JSON.stringify(commissionData),
    });
  }

  static async getAllPlatformCommissions(industryId = null, categoryId = null) {
    let endpoint = '/super-admin/platform-commissions';
    const params = [];
    if (industryId) params.push(`industryId=${industryId}`);
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return this.apiCall(endpoint);
  }

  static async getPlatformCommissionByCategory(categoryId) {
    return this.apiCall(`/super-admin/platform-commissions/category/${categoryId}`);
  }

  static async updatePlatformCommission(commissionId, commissionData) {
    return this.apiCall(`/super-admin/platform-commissions/${commissionId}`, {
      method: 'PUT',
      body: JSON.stringify(commissionData),
    });
  }

  static async deletePlatformCommission(commissionId) {
    return this.apiCall(`/super-admin/platform-commissions/${commissionId}`, {
      method: 'DELETE',
    });
  }

}

export default ApiService;