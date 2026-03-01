import { Alert } from 'react-native';
import ApiService from '../services/api';

class ModuleAccessChecker {
  // Available modules that require subscription
  static SUBSCRIPTION_MODULES = {
    BODY_MEASUREMENTS: 'body_measurements',
    USER_MANAGEMENT: 'user_management', 
    ROLE_MANAGEMENT: 'role_management',
    GROUP_MANAGEMENT: 'group_management',
    ONE_TIME_CODES: 'one_time_codes'
  };

  // Always available modules (no subscription required)
  static FREE_MODULES = {
    GALLERY: 'gallery',
    ORDERS: 'orders', 
    PAYMENTS: 'payments'
  };

  /**
   * Check if user has access to a specific module
   * @param {string} moduleKey - Module key to check
   * @param {boolean} showAlert - Whether to show alert on access denied
   * @returns {Promise<boolean>} - True if access granted, false otherwise
   */
  static async checkAccess(moduleKey, showAlert = true) {
    console.log('🚨 MODULE ACCESS CHECK 🚨');
    console.log('Checking access for module:', moduleKey);

    // Always allow access to free modules
    if (Object.values(this.FREE_MODULES).includes(moduleKey)) {
      console.log('✅ Free module - access granted');
      return true;
    }

    try {
      const response = await ApiService.checkModuleAccess(moduleKey);
      
      if (response.success) {
        console.log('✅ Module access granted');
        return true;
      } else {
        console.log('❌ Module access denied:', response.message);
        
        if (showAlert) {
          Alert.alert(
            'Access Denied',
            response.message || `Your subscription does not include access to ${moduleKey.replace('_', ' ')}`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Upgrade', 
                style: 'default',
                onPress: () => {
                  // Navigate to subscription screen
                  console.log('Navigate to subscription upgrade');
                }
              }
            ]
          );
        }
        
        return false;
      }
    } catch (error) {
      console.log('❌ Module access check error:', error);
      
      if (showAlert) {
        Alert.alert('Error', 'Unable to verify module access. Please try again.');
      }
      
      return false;
    }
  }

  /**
   * Check usage limit before performing action
   * @param {string} limitType - Type of limit (bodyMeasurements, orgUsers)
   * @param {boolean} showAlert - Whether to show alert on limit reached
   * @returns {Promise<boolean>} - True if within limit, false if exceeded
   */
  static async checkUsageLimit(limitType, showAlert = true) {
    console.log('🚨 USAGE LIMIT CHECK 🚨');
    console.log('Checking limit for:', limitType);

    try {
      const response = await ApiService.checkUsageLimit(limitType);
      
      if (response.success) {
        console.log('✅ Usage within limit');
        return true;
      } else {
        console.log('❌ Usage limit exceeded:', response.message);
        
        if (showAlert) {
          Alert.alert(
            'Usage Limit Reached',
            response.message,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Upgrade Plan', 
                style: 'default',
                onPress: () => {
                  console.log('Navigate to subscription upgrade');
                }
              }
            ]
          );
        }
        
        return false;
      }
    } catch (error) {
      console.log('❌ Usage limit check error:', error);
      return false;
    }
  }

  /**
   * Check both module access and usage limit
   * @param {string} moduleKey - Module key to check
   * @param {string} limitType - Usage limit type to check
   * @param {boolean} showAlert - Whether to show alerts
   * @returns {Promise<boolean>} - True if both checks pass
   */
  static async checkAccessAndLimit(moduleKey, limitType, showAlert = true) {
    const hasAccess = await this.checkAccess(moduleKey, showAlert);
    if (!hasAccess) return false;
    
    if (limitType) {
      const withinLimit = await this.checkUsageLimit(limitType, showAlert);
      return withinLimit;
    }
    
    return true;
  }

  /**
   * Check access and navigate if granted
   * @param {string} moduleKey - Module key to check
   * @param {function} navigationCallback - Function to call if access granted
   * @param {boolean} showAlert - Whether to show alert on access denied
   */
  static async checkAndNavigate(moduleKey, navigationCallback, showAlert = true) {
    const hasAccess = await this.checkAccess(moduleKey, showAlert);
    
    if (hasAccess && navigationCallback) {
      navigationCallback();
    }
    
    return hasAccess;
  }

  /**
   * Check access, limit and navigate if all pass
   * @param {string} moduleKey - Module key to check
   * @param {string} limitType - Usage limit type to check
   * @param {function} navigationCallback - Function to call if checks pass
   * @param {boolean} showAlert - Whether to show alerts
   */
  static async checkLimitAndNavigate(moduleKey, limitType, navigationCallback, showAlert = true) {
    const canProceed = await this.checkAccessAndLimit(moduleKey, limitType, showAlert);
    
    if (canProceed && navigationCallback) {
      navigationCallback();
    }
    
    return canProceed;
  }

  /**
   * Get user's subscription status and enabled modules
   * @returns {Promise<Object>} - Subscription status and modules
   */
  static async getSubscriptionStatus() {
    try {
      const response = await ApiService.checkMySubscriptionStatus();
      
      if (response.success) {
        return {
          isActive: response.data.subscription?.status === 'active',
          enabledModules: response.data.subscription?.enabledModules || [],
          limits: response.data.subscription?.limits || {},
          usage: response.data.subscription?.usage || {}
        };
      }
      
      return {
        isActive: false,
        enabledModules: [],
        limits: {},
        usage: {}
      };
    } catch (error) {
      console.log('Error getting subscription status:', error);
      return {
        isActive: false,
        enabledModules: [],
        limits: {},
        usage: {}
      };
    }
  }
}

export default ModuleAccessChecker;