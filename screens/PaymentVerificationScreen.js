import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const PaymentVerificationScreen = ({ route, navigation }) => {
  const { status, tx_ref, transaction_id, fromWebView } = route.params;
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    if (fromWebView && status === 'successful') {
      verifyPayment();
    } else {
      setVerifying(false);
      setVerificationResult({ success: false, message: 'Payment was not successful' });
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const verifyPayment = async () => {
    try {
      const response = await ApiService.verifyPayment(tx_ref);
      setVerificationResult(response);
    } catch (error) {
      setVerificationResult({ 
        success: false, 
        message: 'Failed to verify payment' 
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    if (verificationResult?.success) {
      // Navigate to appropriate dashboard based on user role
      let dashboardScreen = 'Dashboard'; // Default fallback
      
      console.log('🚨 USER PROFILE DEBUG 🚨');
      console.log('Full user profile:', JSON.stringify(userProfile, null, 2));
      console.log('User role:', userProfile?.role);
      console.log('User type:', userProfile?.userType);
      
      if (userProfile?.role) {
        const role = userProfile.role.toLowerCase();
        console.log('Role (lowercase):', role);
        
        switch (role) {
          case 'super_admin':
          case 'superadmin':
          case 'super admin':
            dashboardScreen = 'SuperAdminDashboard';
            break;
          case 'admin':
          case 'organization_admin':
          case 'organization admin':
          case 'org_admin':
            dashboardScreen = 'AdminDashboard';
            break;
          case 'user':
          case 'individual':
          case 'organization_user':
          case 'organization user':
          case 'org_user':
            dashboardScreen = 'UserDashboard';
            break;
          default:
            console.log('⚠️ Unknown role, checking userType...');
            // Fallback to userType if role doesn't match
            if (userProfile?.userType) {
              const userType = userProfile.userType.toLowerCase();
              console.log('UserType (lowercase):', userType);
              
              if (userType === 'organization') {
                dashboardScreen = 'AdminDashboard';
              } else if (userType === 'individual') {
                dashboardScreen = 'UserDashboard';
              } else {
                dashboardScreen = 'Dashboard';
              }
            }
        }
      } else if (userProfile?.userType) {
        // If no role, use userType
        const userType = userProfile.userType.toLowerCase();
        console.log('No role found, using userType:', userType);
        
        if (userType === 'organization') {
          dashboardScreen = 'AdminDashboard';
        } else if (userType === 'individual') {
          dashboardScreen = 'UserDashboard';
        }
      }
      
      console.log('🏠 Final dashboard decision:', dashboardScreen);
      
      navigation.reset({
        index: 0,
        routes: [{ name: dashboardScreen }],
      });
    } else {
      navigation.goBack();
    }
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.verifyingText}>Verifying payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.resultContainer}>
        <Ionicons
          name={verificationResult?.success ? 'checkmark-circle' : 'close-circle'}
          size={80}
          color={verificationResult?.success ? '#10B981' : '#EF4444'}
        />
        <Text style={styles.resultTitle}>
          {verificationResult?.success ? 'Payment Successful!' : 'Payment Failed'}
        </Text>
        <Text style={styles.resultMessage}>
          {verificationResult?.message || 'Unknown error occurred'}
        </Text>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            {verificationResult?.success ? 'Continue' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  verifyingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentVerificationScreen;