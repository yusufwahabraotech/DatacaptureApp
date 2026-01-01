import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.183:3000/api';

// FORCE COMPLETE RELOAD - BREAKING CACHE v4
const FORCE_RELOAD_NOW = 'MEASUREMENTS_FIXED_' + Date.now();
console.log('=== API SERVICE RELOADED ===', FORCE_RELOAD_NOW);

class ApiService {
  // FORCE RELOAD MARKER
  static RELOAD_MARKER = 'API_SERVICE_FIXED_v4_' + Date.now();
  
  static async getToken() {
    console.log('=== API SERVICE LOADED ===', this.RELOAD_MARKER);
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
      return this.apiCall(`${baseUrl}/users?page=${page}&limit=${limit}`);
    }
    return this.apiCall(`/user/users?page=${page}&limit=${limit}`);
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

  static async sendOrgUserEmail(userId, emailData) {
    return this.apiCall(`/org-user/users/${userId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  static async resetOrgUserPassword(userId, passwordData) {
    return this.apiCall(`/org-user/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
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

  // TEST METHOD - Direct org-user dashboard call
  static async testOrgUserDashboard() {
    console.log('=== TESTING ORG-USER DASHBOARD DIRECT CALL ===');
    return this.apiCall('/org-user/dashboard/stats');
  }

  // MEASUREMENTS - FIXED ROUTING
  static async getManualMeasurements(page = 1, limit = 10) {
    console.log('=== getManualMeasurements FIXED - using /user/measurements ===');
    return this.apiCall(`/user/measurements?page=${page}&limit=${limit}`);
  }

  static async getMyMeasurements(page = 1, limit = 10) {
    const profileResponse = await this.getUserProfile();
    if (profileResponse.success) {
      const user = profileResponse.data.user;
      console.log('=== getMyMeasurements FIXED - role-based routing ===');
      console.log('User role:', user.role, 'organizationId:', user.organizationId);
      
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
      const endpoint = `${baseUrl}/measurements?page=${page}&limit=${limit}`;
      console.log('Calling endpoint:', endpoint);
      return this.apiCall(endpoint);
    }
    console.log('Fallback to /user/measurements');
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
      return this.apiCall(`${baseUrl}/groups/${groupId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ action, userIds }),
      });
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
      body: JSON.stringify({ measurementId, code }),
    });
  }
}

export default ApiService;