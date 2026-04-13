import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const ProductPaymentVerificationScreen = ({ navigation, route }) => {
  const { paymentLink, orderId, txRef, product, paymentAmount, paymentType } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, failed
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [showWebView, setShowWebView] = useState(true);

  useEffect(() => {
    // Don't auto-verify - only verify when user indicates payment is complete
    // This prevents false verification attempts before payment is made
    console.log('🚨 PAYMENT VERIFICATION SCREEN LOADED 🚨');
    console.log('Auto-verification disabled - waiting for user action');
  }, []);

  const handleVerifyPayment = async (txRefParam) => {
    if (loading || verificationAttempts >= 5) return;

    setLoading(true);
    setVerificationAttempts(prev => prev + 1);

    try {
      // Extract transaction ID from txRef or use orderId
      const transactionId = txRefParam || txRef || orderId;
      
      console.log('🚨 VERIFYING PAYMENT 🚨');
      console.log('Transaction ID:', transactionId);
      console.log('Order ID:', orderId);
      console.log('TxRef:', txRef);
      console.log('Verification attempt:', verificationAttempts + 1);

      const response = await ApiService.verifyProductPayment(transactionId);
      
      console.log('🚨 VERIFICATION RESPONSE 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ PAYMENT VERIFIED SUCCESSFULLY');
        setPaymentStatus('success');
        
        // Show success message and navigate
        Alert.alert(
          'Payment Successful!',
          `Your ${paymentType} payment of ₦${paymentAmount.toLocaleString()} has been processed successfully.`,
          [
            {
              text: 'View Order',
              onPress: () => navigation.replace('MyOrders')
            },
            {
              text: 'Continue Shopping',
              onPress: () => navigation.navigate('PublicProductSearch')
            }
          ]
        );
      } else {
        console.log('❌ VERIFICATION FAILED:', response.message);
        
        // Don't show success UI if verification actually failed
        if (verificationAttempts < 4) {
          console.log('Retrying verification in 5 seconds...');
          // Retry verification with longer delay for backend processing
          setTimeout(() => handleVerifyPayment(), 5000);
        } else {
          console.log('❌ MAX ATTEMPTS REACHED - MARKING AS FAILED');
          setPaymentStatus('failed');
          Alert.alert(
            'Payment Verification Failed',
            `Verification failed: ${response.message || 'Unknown error'}. Please contact support if money was deducted.`,
            [
              { text: 'Try Again', onPress: () => {
                setVerificationAttempts(0);
                handleVerifyPayment();
              }},
              { text: 'Contact Support', onPress: () => {} }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      if (verificationAttempts < 4) {
        console.log('Retrying verification due to error in 5 seconds...');
        setTimeout(() => handleVerifyPayment(), 5000);
      } else {
        console.log('❌ MAX ATTEMPTS REACHED DUE TO ERROR - MARKING AS FAILED');
        setPaymentStatus('failed');
        Alert.alert(
          'Payment Verification Error',
          'Unable to verify payment due to network error. Please contact support if money was deducted.',
          [
            { text: 'Try Again', onPress: () => {
              setVerificationAttempts(0);
              handleVerifyPayment();
            }},
            { text: 'Contact Support', onPress: () => {} }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(paymentLink);
  };

  if (paymentStatus === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.statusTitle}>Payment Successful!</Text>
          <Text style={styles.statusMessage}>
            Your {paymentType} payment of ₦{paymentAmount.toLocaleString()} has been processed successfully.
          </Text>
          
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Order ID:</Text>
            <Text style={styles.orderValue}>{orderId}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.replace('MyOrders')}
            >
              <Text style={styles.primaryButtonText}>View My Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('PublicProductSearch')}
            >
              <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="close-circle" size={80} color="#F44336" />
          </View>
          <Text style={styles.statusTitle}>Payment Failed</Text>
          <Text style={styles.statusMessage}>
            Your payment could not be processed. Please try again.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('PublicProductSearch')}
            >
              <Text style={styles.secondaryButtonText}>Back to Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <TouchableOpacity onPress={handleOpenInBrowser}>
          <Ionicons name="open-outline" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {showWebView ? (
        <WebView
          source={{ uri: paymentLink }}
          style={styles.webView}
          onNavigationStateChange={(navState) => {
            console.log('🚨 PRODUCT WEBVIEW NAVIGATION 🚨');
            console.log('Current URL:', navState.url);
            
            // Check for Flutterwave success indicators in URL (fallback)
            if (navState.url.includes('flutterwave') && 
                (navState.url.includes('successful') || navState.url.includes('completed') || navState.url.includes('success'))) {
              console.log('✅ FLUTTERWAVE SUCCESS DETECTED IN URL');
              setShowWebView(false);
              setTimeout(() => {
                handleVerifyPayment(txRef);
              }, 1000);
            }
            
            // Check for Flutterwave failure/cancellation
            if (navState.url.includes('flutterwave') && 
                (navState.url.includes('cancelled') || navState.url.includes('failed'))) {
              console.log('❌ FLUTTERWAVE FAILURE DETECTED IN URL');
              setShowWebView(false);
              setPaymentStatus('failed');
            }
            
            return true;
          }}
          onShouldStartLoadWithRequest={(request) => {
            console.log('🔗 Should start load with request:', request.url);
            
            // Check if it's a deep link to your app
            if (request.url.startsWith('vestradat://')) {
              console.log('🔗 Deep link detected, handling manually');
              
              // Don't use Linking.openURL(), handle directly
              try {
                const url = new URL(request.url);
                const status = url.searchParams.get('status');
                const txRef = url.searchParams.get('tx_ref') || url.searchParams.get('transaction_id');
                
                console.log('💳 Deep link payment data:', { status, txRef });
                
                setShowWebView(false);
                
                if (status === 'successful') {
                  console.log('✅ PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                  handleVerifyPayment(txRef);
                } else {
                  console.log('❌ PAYMENT FAILED/CANCELLED');
                  setPaymentStatus('failed');
                }
              } catch (parseError) {
                console.error('❌ Failed to parse deep link:', parseError);
                setShowWebView(false);
                setPaymentStatus('failed');
              }
              
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
              <Text style={styles.loadingText}>Loading payment page...</Text>
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
                
                if (isThankYouPage && !document.getElementById('return-to-app-btn')) {
                  console.log('Thank you page detected, adding return button');
                  
                  // Create return button
                  const returnBtn = document.createElement('button');
                  returnBtn.id = 'return-to-app-btn';
                  returnBtn.innerHTML = '🔙 Return to App';
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
                      type: 'MANUAL_RETURN',
                      action: 'verify_payment'
                    }));
                  };
                  
                  // Add button to page
                  document.body.appendChild(returnBtn);
                  
                  // Also try to trigger automatic return after 3 seconds
                  setTimeout(() => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'AUTO_RETURN',
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
              console.log('💬 MESSAGE FROM WEBVIEW:', data);
              
              if (data.type === 'MANUAL_RETURN' || data.type === 'AUTO_RETURN') {
                console.log('✅ RETURN TO APP TRIGGERED:', data.type);
                setShowWebView(false);
                handleVerifyPayment(txRef);
              }
            } catch (error) {
              console.log('Error parsing WebView message:', error);
            }
          }}
        />
      ) : (
        <View style={styles.verificationContainer}>
          <Ionicons name="card" size={80} color="#7B2CBF" />
          <Text style={styles.verificationText}>Payment Ready for Verification</Text>
          <Text style={styles.verificationSubtext}>
            Click the button below after completing your payment on Flutterwave
          </Text>
          
          {verificationAttempts > 0 && (
            <Text style={styles.attemptText}>
              Verification attempt {verificationAttempts} of 5
            </Text>
          )}
          
          {/* Debug info */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Order ID: {orderId}</Text>
            <Text style={styles.debugText}>Transaction Ref: {txRef}</Text>
          </View>

          <TouchableOpacity
            style={styles.manualVerifyButton}
            onPress={handleVerifyPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.manualVerifyText}>Verify Payment</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backToPaymentButton}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.backToPaymentText}>Back to Payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  verificationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  verificationSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  attemptText: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
  debugInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  manualVerifyButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  manualVerifyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToPaymentButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  backToPaymentText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  orderValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductPaymentVerificationScreen;