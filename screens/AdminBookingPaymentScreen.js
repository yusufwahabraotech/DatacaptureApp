import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const AdminBookingPaymentScreen = ({ navigation, route }) => {
  const { booking, paymentLink } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  useEffect(() => {
    console.log('🚨 ADMIN BOOKING PAYMENT SCREEN LOADED 🚨');
    console.log('Booking:', JSON.stringify(booking, null, 2));
    console.log('Payment Link:', paymentLink);

    // Set up automatic verification after 3 minutes (fallback)
    const timeout = setTimeout(() => {
      console.log('⏰ ADMIN PAYMENT TIMEOUT - AUTO VERIFYING');
      Alert.alert(
        'Payment Taking Too Long?',
        'If you\'ve completed the payment, we can verify it now.',
        [
          {
            text: 'Still Paying',
            style: 'cancel'
          },
          {
            text: 'Verify Payment',
            onPress: () => verifyAdminBookingPayment(booking.transactionId || booking.tx_ref)
          }
        ]
      );
    }, 180000); // 3 minutes
    
    setPaymentTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const verifyAdminBookingPayment = async (txRef) => {
    try {
      setLoading(true);
      
      // Clear any existing timeout
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
      }
      
      console.log('🚨 VERIFYING ADMIN BOOKING PAYMENT 🚨');
      console.log('Using transaction reference:', txRef);
      
      // Use the same verification endpoint as regular bookings
      const response = await ApiService.verifyBookingPayment(txRef);
      console.log('Admin booking payment verification response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setTimeout(() => {
          Alert.alert(
            'Booking Payment Confirmed!',
            `The booking payment for ${booking.serviceName || 'service'} has been confirmed successfully.`,
            [
              {
                text: 'View Booking',
                onPress: () => navigation.navigate('AdminBookingManagement')
              },
              {
                text: 'Create Another',
                onPress: () => navigation.navigate('GalleryManagement')
              }
            ]
          );
        }, 1000);
      } else {
        setTimeout(() => {
          Alert.alert(
            'Payment Verification Failed',
            response.message || 'Failed to verify booking payment',
            [
              {
                text: 'Contact Support',
                onPress: () => navigation.navigate('Help')
              },
              {
                text: 'Try Again',
                onPress: () => {
                  // Stay on payment screen to retry
                }
              }
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Admin booking payment verification error:', error);
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
              onPress: () => {
                // Stay on payment screen to retry
              }
            }
          ]
        );
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = () => {
    console.log('🔄 ADMIN MANUAL VERIFICATION TRIGGERED');
    verifyAdminBookingPayment(booking.transactionId || booking.tx_ref);
  };

  const handleClosePayment = () => {
    // Clear timeout when closing
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
    
    Alert.alert(
      'Close Payment?',
      'Are you sure you want to close the payment screen? The booking will remain unpaid.',
      [
        {
          text: 'Continue Payment',
          style: 'cancel'
        },
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Admin Booking Payment</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.manualVerifyButton}
            onPress={handleManualVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text style={styles.manualVerifyText}>Payment Done?</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClosePayment}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      {paymentLink && (
        <WebView
          source={{ uri: paymentLink }}
          onNavigationStateChange={(navState) => {
            console.log('🚨 ADMIN WEBVIEW NAVIGATION 🚨');
            console.log('Current URL:', navState.url);
            
            // Check for mobile payment success URL from backend
            if (navState.url.includes('frontend-datacap.vercel.app/mobile-payment-success')) {
              console.log('✅ ADMIN MOBILE PAYMENT SUCCESS URL DETECTED');
              
              try {
                const urlParams = new URLSearchParams(navState.url.split('?')[1]);
                const platform = urlParams.get('platform');
                const type = urlParams.get('type');
                const status = urlParams.get('status');
                const txRef = urlParams.get('tx_ref');
                
                console.log('💳 Admin booking payment success data:', { platform, type, status, txRef });
                
                if (platform === 'mobile' && status === 'successful') {
                  console.log('✅ ADMIN BOOKING PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                  setTimeout(() => {
                    verifyAdminBookingPayment(txRef || booking.transactionId || booking.tx_ref);
                  }, 1000);
                } else {
                  console.log('❌ ADMIN BOOKING PAYMENT FAILED/CANCELLED');
                  setTimeout(() => {
                    Alert.alert(
                      'Payment Failed',
                      'The booking payment was cancelled or failed.',
                      [
                        {
                          text: 'Try Again',
                          onPress: () => {
                            // Stay on payment screen
                          }
                        },
                        {
                          text: 'Go Back',
                          onPress: () => navigation.goBack()
                        }
                      ]
                    );
                  }, 1000);
                }
              } catch (parseError) {
                console.error('❌ Failed to parse admin booking payment success URL:', parseError);
                Alert.alert('Error', 'Failed to process payment response');
              }
              
              return false; // Prevent WebView from navigating
            }
            
            // Fallback: Check for Flutterwave success indicators in URL
            if (navState.url.includes('flutterwave') && 
                (navState.url.includes('successful') || navState.url.includes('completed') || navState.url.includes('success'))) {
              console.log('✅ ADMIN FLUTTERWAVE SUCCESS DETECTED IN URL (FALLBACK)');
              
              // Use the original transaction ID for verification
              setTimeout(() => {
                verifyAdminBookingPayment(booking.transactionId || booking.tx_ref);
              }, 1000);
            }
            
            // Check for Flutterwave failure/cancellation
            if (navState.url.includes('flutterwave') && 
                (navState.url.includes('cancelled') || navState.url.includes('failed'))) {
              console.log('❌ ADMIN FLUTTERWAVE FAILURE DETECTED IN URL');
              setTimeout(() => {
                Alert.alert(
                  'Payment Cancelled',
                  'The booking payment was cancelled or failed.',
                  [
                    {
                      text: 'Try Again',
                      onPress: () => {
                        // Stay on payment screen
                      }
                    },
                    {
                      text: 'Go Back',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              }, 1000);
            }
            
            return true;
          }}
          onShouldStartLoadWithRequest={(request) => {
            console.log('🔗 Admin should start load with request:', request.url);
            
            if (request.url.startsWith('vestradat://')) {
              console.log('🔗 Admin deep link detected, opening with Linking');
              
              Linking.openURL(request.url)
                .then(() => {
                  console.log('✅ Admin deep link opened successfully');
                })
                .catch((error) => {
                  console.error('❌ Failed to open admin deep link:', error);
                  
                  try {
                    const url = new URL(request.url);
                    const status = url.searchParams.get('status');
                    const txRef = url.searchParams.get('tx_ref') || url.searchParams.get('transaction_id');
                    
                    console.log('💳 Admin fallback - Deep link payment data:', { status, txRef });
                    
                    if (status === 'successful') {
                      console.log('✅ ADMIN PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                      verifyAdminBookingPayment(txRef || booking.transactionId || booking.tx_ref);
                    } else {
                      console.log('❌ ADMIN PAYMENT FAILED/CANCELLED');
                      setTimeout(() => {
                        Alert.alert(
                          'Payment Failed', 
                          'The booking payment was cancelled or failed.',
                          [
                            {
                              text: 'Try Again',
                              onPress: () => {
                                // Stay on payment screen
                              }
                            },
                            {
                              text: 'Go Back',
                              onPress: () => navigation.goBack()
                            }
                          ]
                        );
                      }, 1000);
                    }
                  } catch (parseError) {
                    console.error('❌ Failed to parse admin deep link:', parseError);
                    Alert.alert('Error', 'Failed to process payment response');
                  }
                });
              
              return false;
            }
            
            return true;
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('Admin WebView error: ', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('Admin WebView HTTP error: ', nativeEvent);
          }}
          injectedJavaScript={`
            // Inject JavaScript to detect thank you page and add return button
            (function() {
              function addReturnButton() {
                // Check if we're on a thank you/success page
                const bodyText = document.body.innerText.toLowerCase();
                const isThankYouPage = bodyText.includes('thank') || 
                                     bodyText.includes('success') || 
                                     bodyText.includes('completed') ||
                                     bodyText.includes('transaction was completed');
                
                if (isThankYouPage && !document.getElementById('admin-return-to-app-btn')) {
                  console.log('Admin thank you page detected, adding return button');
                  
                  // Create return button
                  const returnBtn = document.createElement('button');
                  returnBtn.id = 'admin-return-to-app-btn';
                  returnBtn.innerHTML = '🔙 Return to Admin Panel';
                  returnBtn.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: #7B2CBF;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    animation: pulse 2s infinite;
                  \`;
                  
                  // Add pulse animation
                  const style = document.createElement('style');
                  style.textContent = \`
                    @keyframes pulse {
                      0% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                      100% { transform: scale(1); }
                    }
                  \`;
                  document.head.appendChild(style);
                  
                  // Add click handler
                  returnBtn.onclick = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'ADMIN_MANUAL_RETURN',
                      action: 'verify_payment'
                    }));
                  };
                  
                  // Add button to page
                  document.body.appendChild(returnBtn);
                  
                  // Also try to trigger automatic return after 3 seconds
                  setTimeout(() => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'ADMIN_AUTO_RETURN',
                      action: 'verify_payment'
                    }));
                  }, 3000);
                }
              }
              
              // Run immediately and also after page changes
              addReturnButton();
              
              // Watch for page changes
              const observer = new MutationObserver(addReturnButton);
              observer.observe(document.body, { childList: true, subtree: true });
              
              // Also run after a delay to catch late-loading content
              setTimeout(addReturnButton, 2000);
            })();
            true;
          `}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('💬 ADMIN MESSAGE FROM WEBVIEW:', data);
              
              if (data.type === 'ADMIN_MANUAL_RETURN' || data.type === 'ADMIN_AUTO_RETURN') {
                console.log('✅ ADMIN RETURN TO APP TRIGGERED:', data.type);
                verifyAdminBookingPayment(booking.transactionId || booking.tx_ref);
              }
            } catch (error) {
              console.log('Error parsing admin WebView message:', error);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualVerifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  manualVerifyText: {
    fontSize: 12,
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

export default AdminBookingPaymentScreen;