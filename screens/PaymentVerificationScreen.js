import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const PaymentVerificationScreen = ({ route, navigation }) => {
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState('verifying');
  
  const { transactionId, status: paymentStatus } = route.params || {};

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      if (paymentStatus === 'successful' && transactionId) {
        const response = await ApiService.verifyPayment(transactionId);
        
        if (response.success) {
          setStatus('success');
          setTimeout(() => {
            Alert.alert(
              'Success!',
              'Your subscription has been activated successfully.',
              [
                {
                  text: 'Continue to Dashboard',
                  onPress: () => navigation.replace('AdminDashboard')
                }
              ]
            );
          }, 2000);
        } else {
          setStatus('failed');
          setTimeout(() => {
            Alert.alert(
              'Payment Failed',
              response.message || 'Payment verification failed',
              [
                {
                  text: 'Try Again',
                  onPress: () => navigation.replace('SubscriptionSelection')
                }
              ]
            );
          }, 2000);
        }
      } else {
        setStatus('failed');
        setTimeout(() => {
          Alert.alert(
            'Payment Failed',
            'Payment was not successful',
            [
              {
                text: 'Try Again',
                onPress: () => navigation.replace('SubscriptionSelection')
              }
            ]
          );
        }, 2000);
      }
    } catch (error) {
      setStatus('failed');
      setTimeout(() => {
        Alert.alert(
          'Error',
          'Failed to verify payment',
          [
            {
              text: 'Try Again',
              onPress: () => navigation.replace('SubscriptionSelection')
            }
          ]
        );
      }, 2000);
    } finally {
      setVerifying(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.subtitle}>Please wait while we confirm your payment...</Text>
          </>
        );
      case 'success':
        return (
          <>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>Your subscription has been activated</Text>
          </>
        );
      case 'failed':
        return (
          <>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={80} color="#EF4444" />
            </View>
            <Text style={styles.title}>Payment Failed</Text>
            <Text style={styles.subtitle}>There was an issue processing your payment</Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PaymentVerificationScreen;