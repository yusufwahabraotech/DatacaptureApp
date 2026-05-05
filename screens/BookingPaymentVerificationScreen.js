import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Linking,
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
    paymentType,
    deepLinkData // New parameter for deep link handling
  } = route.params || {};

  useEffect(() => {
    console.log('🚨 BOOKING PAYMENT VERIFICATION SCREEN LOADED 🚨');
    console.log('Payment link:', paymentLink);
    console.log('Order ID:', orderId);
    console.log('Transaction ID:', transactionId);
    console.log('Service:', service?.name);
    console.log('Payment amount:', paymentAmount);
    console.log('Payment type:', paymentType);
    console.log('Deep link data:', deepLinkData);
    
    // If we received deep link data, handle it immediately
    if (deepLinkData && deepLinkData.fromDeepLink) {
      console.log('🔗 HANDLING DEEP LINK DATA IMMEDIATELY');
      setShowPaymentWebView(false);
      
      if (deepLinkData.status === 'successful') {
        setStatus('verifying');
        setVerifying(true);
        verifyBookingPayment(deepLinkData.txRef);
      } else {
        setStatus('failed');
      }
    }
  }, [deepLinkData]);

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('🚨 BOOKING WEBVIEW NAVIGATION 🚨');
    console.log('Current URL:', url);
    
    // Check for mobile payment success/failure URLs (WebView compatible)
    if (url.includes('frontend-datacap.vercel.app/mobile-payment-success')) {
      console.log('✅ MOBILE BOOKING PAYMENT SUCCESS URL DETECTED');
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const status = urlParams.get('status') || 'successful';
        const txRef = urlParams.get('tx_ref');
        const transactionId = urlParams.get('transaction_id');
        
        console.log('💳 Mobile booking payment data:', { status, txRef, transactionId });
        
        setShowPaymentWebView(false);
        
        if (status === 'successful') {
          console.log('✅ MOBILE BOOKING PAYMENT SUCCESSFUL - STARTING VERIFICATION');
          setStatus('verifying');
          setVerifying(true);
          verifyBookingPayment(txRef || transactionId);
        } else {
          console.log('❌ MOBILE BOOKING PAYMENT FAILED/CANCELLED');
          setStatus('failed');
          setTimeout(() => {
            Alert.alert(
              'Payment Failed', 
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
      } catch (parseError) {
        console.error('❌ Failed to parse mobile booking payment URL:', parseError);
        setShowPaymentWebView(false);
        setStatus('failed');
      }
      
      return false; // Prevent WebView from navigating
    }
    
    // Check for mobile payment cancel URLs
    if (url.includes('frontend-datacap.vercel.app/mobile-payment-cancel')) {
      console.log('❌ MOBILE BOOKING PAYMENT CANCEL URL DETECTED');
      
      setShowPaymentWebView(false);
      setStatus('failed');
      setTimeout(() => {
        Alert.alert(
          'Payment Cancelled', 
          'Your booking payment was cancelled.',
          [
            {
              text: 'Try Again',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }, 1000);
      
      return false; // Prevent WebView from navigating
    }
    
    // Legacy: Check for service booking verification URL from backend
    if (url.includes('frontend-datacap.vercel.app/order/verify')) {
      console.log('✅ LEGACY SERVICE BOOKING VERIFICATION URL DETECTED');
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const status = urlParams.get('status');
        const txRef = urlParams.get('tx_ref');
        const transactionId = urlParams.get('transaction_id');
        
        console.log('💳 Legacy service booking payment data:', { status, txRef, transactionId });
        
        setShowPaymentWebView(false);
        
        if (status === 'successful') {
          console.log('✅ LEGACY SERVICE BOOKING PAYMENT SUCCESSFUL - STARTING VERIFICATION');
          setStatus('verifying');
          setVerifying(true);
          verifyBookingPayment(txRef || transactionId);
        } else {
          console.log('❌ LEGACY SERVICE BOOKING PAYMENT FAILED/CANCELLED');
          setStatus('failed');
          setTimeout(() => {
            Alert.alert(
              'Payment Failed', 
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
      } catch (parseError) {
        console.error('❌ Failed to parse legacy service booking verification URL:', parseError);
        setShowPaymentWebView(false);
        setStatus('failed');
      }
      
      return false; // Prevent WebView from navigating
    }
    
    // Legacy deep link handling (keep for backward compatibility)
    if (url.startsWith('vestradat://payment/verify-order')) {
      console.log('✅ LEGACY DEEP LINK DETECTED - PAYMENT SUCCESSFUL');
      
      // Extract parameters from deep link
      const urlParts = url.split('?');
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const status = params.get('status');
        const txRef = params.get('tx_ref') || params.get('transaction_id');
        
        console.log('Legacy deep link status:', status);
        console.log('Legacy deep link tx_ref:', txRef);
        
        if (status === 'successful') {
          setShowPaymentWebView(false);
          setStatus('verifying');
          setVerifying(true);
          
          // Verify the booking payment
          verifyBookingPayment(txRef || transactionId);
        } else {
          console.log('❌ LEGACY PAYMENT FAILED/CANCELLED FROM DEEP LINK');
          setShowPaymentWebView(false);
          setStatus('failed');
          
          setTimeout(() => {
            Alert.alert(
              'Payment Failed', 
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
      }
      return false; // Prevent WebView from navigating to deep link
    }
    
    // Fallback: Check for Flutterwave success indicators in URL
    if (url.includes('flutterwave') && 
        (url.includes('successful') || url.includes('completed') || url.includes('success'))) {
      console.log('✅ FLUTTERWAVE SUCCESS DETECTED IN URL (FALLBACK)');
      setShowPaymentWebView(false);
      setStatus('verifying');
      setVerifying(true);
      
      // Use the original transaction ID since we can't extract from URL
      verifyBookingPayment(transactionId);
      return false; // Prevent WebView from navigating
    }
    
    // Check for Flutterwave failure/cancellation
    if (url.includes('flutterwave') && 
        (url.includes('cancelled') || url.includes('failed'))) {
      console.log('❌ FLUTTERWAVE FAILURE DETECTED IN URL');
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
      return false; // Prevent WebView from navigating
    }
    
    // Allow other URLs to load
    return true;
  };

  const verifyBookingPayment = async (txRef) => {
    try {
      console.log('🚨 VERIFYING BOOKING PAYMENT 🚨');
      console.log('Using transaction reference:', txRef);
      console.log('Order ID (temporary):', orderId); // This will be 'pending_payment'
      
      const response = await ApiService.verifyBookingPayment(txRef);
      console.log('Verification response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ BOOKING PAYMENT VERIFIED SUCCESSFULLY');
        
        // Get the real order ID from verification response
        const realOrderId = response.data?.order?._id || response.data?.orderId;
        console.log('Real Order ID after verification:', realOrderId);
        
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
        console.log('❌ BOOKING VERIFICATION FAILED:', response.message);
        
        // Handle different types of failures
        if (response.message && response.message.includes('Payment was not successful')) {
          // Payment failed - no booking was created
          console.log('❌ BOOKING PAYMENT WAS NOT SUCCESSFUL - NO BOOKING CREATED');
          setStatus('failed');
          setTimeout(() => {
            Alert.alert(
              'Payment Failed',
              'Your payment was not successful. No booking has been created. Please try again.',
              [
                {
                  text: 'Try Again',
                  onPress: () => navigation.goBack()
                },
                {
                  text: 'Contact Support',
                  onPress: () => navigation.navigate('Help')
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
      }
    } catch (error) {
      console.error('Booking payment verification error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('Payment was not successful')) {
        console.log('❌ BOOKING PAYMENT FAILED - NO BOOKING CREATED');
        setStatus('failed');
        setTimeout(() => {
          Alert.alert(
            'Payment Failed',
            'Payment failed. No booking was created. Please try booking again.',
            [
              {
                text: 'Try Again',
                onPress: () => navigation.goBack()
              },
              {
                text: 'Contact Support',
                onPress: () => navigation.navigate('Help')
              }
            ]
          );
        }, 2000);
      } else {
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
      }
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
            
            {/* Manual verification button - shown after some time */}
            <TouchableOpacity 
              style={styles.manualVerifyButton}
              onPress={() => {
                console.log('🔄 MANUAL VERIFICATION TRIGGERED');
                setShowPaymentWebView(false);
                setStatus('verifying');
                setVerifying(true);
                verifyBookingPayment(transactionId);
              }}
            >
              <Ionicons name="refresh" size={20} color="#7B2CBF" />
              <Text style={styles.manualVerifyText}>Payment Complete? Verify Now</Text>
            </TouchableOpacity>
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
              onShouldStartLoadWithRequest={(request) => {
                console.log('🔗 Should start load with request:', request.url);
                
                // Check for mobile payment success/failure URLs
                if (request.url.includes('frontend-datacap.vercel.app/mobile-payment-success') ||
                    request.url.includes('frontend-datacap.vercel.app/mobile-payment-cancel')) {
                  console.log('🔗 Mobile booking payment URL detected, handling manually');
                  
                  try {
                    const urlParams = new URLSearchParams(request.url.split('?')[1]);
                    const status = request.url.includes('mobile-payment-success') ? 'successful' : 'failed';
                    const txRef = urlParams.get('tx_ref');
                    const transactionId = urlParams.get('transaction_id');
                    
                    console.log('💳 Mobile booking payment data:', { status, txRef, transactionId });
                    
                    setShowPaymentWebView(false);
                    
                    if (status === 'successful') {
                      console.log('✅ MOBILE BOOKING PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                      setStatus('verifying');
                      setVerifying(true);
                      verifyBookingPayment(txRef || transactionId);
                    } else {
                      console.log('❌ MOBILE BOOKING PAYMENT FAILED/CANCELLED');
                      setStatus('failed');
                      setTimeout(() => {
                        Alert.alert(
                          'Payment Failed', 
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
                  } catch (parseError) {
                    console.error('❌ Failed to parse mobile booking payment URL:', parseError);
                    setShowPaymentWebView(false);
                    setStatus('failed');
                  }
                  
                  // Prevent WebView from trying to load the URL
                  return false;
                }
                
                // Legacy: Check for service booking verification URL from backend
                if (request.url.includes('frontend-datacap.vercel.app/order/verify')) {
                  console.log('🔗 Legacy service booking verification URL detected, handling manually');
                  
                  try {
                    const urlParams = new URLSearchParams(request.url.split('?')[1]);
                    const status = urlParams.get('status');
                    const txRef = urlParams.get('tx_ref');
                    const transactionId = urlParams.get('transaction_id');
                    
                    console.log('💳 Legacy service booking payment data:', { status, txRef, transactionId });
                    
                    setShowPaymentWebView(false);
                    
                    if (status === 'successful') {
                      console.log('✅ LEGACY SERVICE BOOKING PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                      setStatus('verifying');
                      setVerifying(true);
                      verifyBookingPayment(txRef || transactionId);
                    } else {
                      console.log('❌ LEGACY SERVICE BOOKING PAYMENT FAILED/CANCELLED');
                      setStatus('failed');
                      setTimeout(() => {
                        Alert.alert(
                          'Payment Failed', 
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
                  } catch (parseError) {
                    console.error('❌ Failed to parse legacy service booking verification URL:', parseError);
                    setShowPaymentWebView(false);
                    setStatus('failed');
                  }
                  
                  // Prevent WebView from trying to load the URL
                  return false;
                }
                
                // Legacy deep link handling (keep for backward compatibility)
                if (request.url.startsWith('vestradat://')) {
                  console.log('🔗 Legacy deep link detected, opening with Linking');
                  
                  // Use React Native Linking to handle the deep link
                  Linking.openURL(request.url)
                    .then(() => {
                      console.log('✅ Legacy deep link opened successfully');
                      // Close the WebView
                      setShowPaymentWebView(false);
                    })
                    .catch((error) => {
                      console.error('❌ Failed to open legacy deep link:', error);
                      
                      // Fallback: manually parse and navigate
                      try {
                        const url = new URL(request.url);
                        const status = url.searchParams.get('status');
                        const txRef = url.searchParams.get('tx_ref') || url.searchParams.get('transaction_id');
                        
                        console.log('💳 Fallback - Legacy deep link payment data:', { status, txRef });
                        
                        setShowPaymentWebView(false);
                        
                        if (status === 'successful') {
                          console.log('✅ LEGACY PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                          setStatus('verifying');
                          setVerifying(true);
                          verifyBookingPayment(txRef || transactionId);
                        } else {
                          console.log('❌ LEGACY PAYMENT FAILED/CANCELLED');
                          setStatus('failed');
                          setTimeout(() => {
                            Alert.alert(
                              'Payment Failed', 
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
                      } catch (parseError) {
                        console.error('❌ Failed to parse legacy deep link:', parseError);
                        setShowPaymentWebView(false);
                        setStatus('failed');
                      }
                    });
                  
                  // Prevent WebView from trying to load the deep link
                  return false;
                }
                
                // Allow all other URLs to load normally
                return true;
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#7B2CBF" />
                  <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
                </View>
              )}
              // Add these props for better deep link handling
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error: ', nativeEvent);
              }}
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
  manualVerifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  manualVerifyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
});

export default BookingPaymentVerificationScreen;