import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const BookingPaymentVerificationScreen = ({ route, navigation }) => {
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState('payment');
  const [showPaymentWebView, setShowPaymentWebView] = useState(true);
  
  const { 
    paymentLink, 
    orderId, 
    transactionId, 
    service, 
    bookingData, 
    pricingBreakdown,
    paymentAmount,
    paymentType 
  } = route.params || {};

  useEffect(() => {
    console.log('🚨 BOOKING PAYMENT VERIFICATION SCREEN LOADED 🚨');
    console.log('Payment link:', paymentLink);
    console.log('Order ID:', orderId);
    console.log('Transaction ID:', transactionId);
    console.log('Service:', service?.name);
    console.log('Payment amount:', paymentAmount);
    console.log('Payment type:', paymentType);
  }, []);

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('🚨 WEBVIEW NAVIGATION 🚨');
    console.log('Current URL:', url);
    
    if (url.includes('status=successful')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const txRef = urlParams.get('transaction_id') || urlParams.get('tx_ref');
      
      console.log('✅ PAYMENT SUCCESSFUL');
      console.log('Transaction reference:', txRef);
      
      setShowPaymentWebView(false);
      setStatus('verifying');
      setVerifying(true);
      
      // Verify the booking payment
      verifyBookingPayment(txRef || transactionId);
    } else if (url.includes('status=cancelled') || url.includes('status=failed')) {
      console.log('❌ PAYMENT CANCELLED/FAILED');
      setShowPaymentWebView(false);
      setStatus('failed');
      
      setTimeout(() => {
        Alert.alert(
          'Payment Cancelled', 
          'Your booking payment was cancelled or failed.',
          [
            {
              text: 'Try Again',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }, 1000);
    }
  };

  const verifyBookingPayment = async (txRef) => {
    try {
      console.log('🚨 VERIFYING BOOKING PAYMENT 🚨');
      console.log('Using transaction reference:', txRef);
      
      const response = await ApiService.verifyBookingPayment(txRef);
      console.log('Verification response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setStatus('success');
        setTimeout(() => {
          Alert.alert(
            'Booking Confirmed!',
            `Your ${service?.name || 'service'} booking has been confirmed successfully.`,
            [
              {
                text: 'View My Orders',
                onPress: () => navigation.navigate('MyOrders')
              },
              {
                text: 'Back to Services',
                onPress: () => navigation.navigate('PublicProductSearch')
              }
            ]
          );
        }, 2000);
      } else {
        setStatus('failed');
        setTimeout(() => {
          Alert.alert(
            'Verification Failed',
            response.message || 'Failed to verify booking payment',
            [
              {
                text: 'Contact Support',
                onPress: () => navigation.navigate('Help')
              },
              {
                text: 'Try Again',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }, 2000);
      }
    } catch (error) {
      console.error('Booking payment verification error:', error);
      setStatus('failed');
      setTimeout(() => {
        Alert.alert(
          'Verification Error',
          'Failed to verify booking payment. Please contact support.',
          [
            {
              text: 'Contact Support',
              onPress: () => navigation.navigate('Help')
            },
            {
              text: 'Try Again',
              onPress: () => navigation.goBack()
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
      case 'payment':
        return (
          <>
            <View style={styles.paymentIcon}>
              <Ionicons name="card" size={80} color="#7B2CBF" />
            </View>
            <Text style={styles.title}>Complete Your Payment</Text>
            <Text style={styles.subtitle}>
              You will be redirected to complete your booking payment securely
            </Text>
          </>
        );
      case 'verifying':
        return (
          <>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.subtitle}>Please wait while we confirm your booking payment...</Text>
          </>
        );
      case 'success':
        return (
          <>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.title}>Booking Confirmed!</Text>
            <Text style={styles.subtitle}>
              Your {service?.name || 'service'} booking has been confirmed successfully
            </Text>
            {pricingBreakdown && (
              <View style={styles.bookingDetails}>
                <Text style={styles.detailsTitle}>Booking Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{service?.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid:</Text>
                  <Text style={styles.detailValue}>₦{paymentAmount?.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Type:</Text>
                  <Text style={styles.detailValue}>
                    {paymentType === 'full' ? 'Full Payment' : `Upfront Payment (${pricingBreakdown.upfrontPercentage}%)`}
                  </Text>
                </View>
                {paymentType === 'upfront' && pricingBreakdown.remainingBalance > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Remaining Balance:</Text>
                    <Text style={styles.remainingBalance}>₦{pricingBreakdown.remainingBalance?.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        );
      case 'failed':
        return (
          <>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={80} color="#EF4444" />
            </View>
            <Text style={styles.title}>Payment Failed</Text>
            <Text style={styles.subtitle}>There was an issue processing your booking payment</Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Complete Booking Payment</Text>
            <TouchableOpacity onPress={() => {
              setShowPaymentWebView(false);
              navigation.goBack();
            }}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {paymentLink && (
            <WebView
              source={{ uri: paymentLink }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#7B2CBF" />
                  <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Verification Content */}
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
  paymentIcon: {
    marginBottom: 24,
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
    marginBottom: 24,
  },
  bookingDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  remainingBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#7B2CBF',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default BookingPaymentVerificationScreen;