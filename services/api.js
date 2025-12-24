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

  static async getAdminMeasurements() {
    return this.apiCall('/admin/measurements');
  }

  // User management endpoints
  static async getUsers() {
    return this.apiCall('/admin/users');
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
}

export default ApiService;