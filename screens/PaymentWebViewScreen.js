import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl } = route.params;

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    console.log('🚨 PAYMENT WEBVIEW NAVIGATION 🚨');
    console.log('Current URL:', url);
    
    // Check for backend's actual redirect URL patterns
    if (url.includes('frontend-datacap.vercel.app/payment/verify-combined') ||
        url.includes('frontend-datacap.vercel.app/payment/verify-verified-badge') ||
        url.includes('frontend-datacap.vercel.app/payment/verify')) {
      console.log('🚨 PAYMENT SUCCESS REDIRECT DEBUG 🚨');
      console.log('Full URL:', url);
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const status = urlParams.get('status');
        const txRef = urlParams.get('tx_ref');
        const transactionId = urlParams.get('transaction_id');
        
        console.log('Extracted tx_ref:', txRef);
        console.log('Extracted transaction_id:', transactionId);
        console.log('Extracted status:', status);
        
        // Navigate to payment verification with the extracted data
        navigation.replace('PaymentVerification', {
          status: status || 'successful',
          tx_ref: txRef,
          transaction_id: transactionId,
          fromWebView: true
        });
      } catch (parseError) {
        console.error('❌ Failed to parse payment URL:', parseError);
        navigation.replace('PaymentVerification', {
          status: 'failed',
          fromWebView: true
        });
      }
      
      return false; // Prevent WebView from navigating
    }
    
    // Legacy mobile payment URLs (keep for backward compatibility)
    if (url.includes('frontend-datacap.vercel.app/mobile-payment-success')) {
      console.log('✅ LEGACY MOBILE PAYMENT SUCCESS URL DETECTED');
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const status = urlParams.get('status') || 'successful';
        const txRef = urlParams.get('tx_ref');
        const transactionId = urlParams.get('transaction_id');
        const paymentType = urlParams.get('type') || 'general';
        
        console.log('💳 Payment success data:', { status, txRef, transactionId, paymentType });
        
        // Navigate to appropriate verification screen based on payment type
        if (paymentType === 'booking') {
          navigation.replace('BookingPaymentVerification', {
            status,
            tx_ref: txRef,
            transaction_id: transactionId,
            fromWebView: true
          });
        } else {
          navigation.replace('PaymentVerification', {
            status,
            tx_ref: txRef,
            transaction_id: transactionId,
            paymentType,
            fromWebView: true
          });
        }
      } catch (parseError) {
        console.error('❌ Failed to parse payment success URL:', parseError);
        navigation.replace('PaymentVerification', {
          status: 'successful',
          fromWebView: true
        });
      }
      
      return false; // Prevent WebView from navigating
    }
    
    // Check for mobile payment cancel/failure URLs
    if (url.includes('frontend-datacap.vercel.app/mobile-payment-cancel')) {
      console.log('❌ MOBILE PAYMENT CANCEL URL DETECTED');
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const paymentType = urlParams.get('type') || 'general';
        
        // Navigate to appropriate verification screen with failed status
        if (paymentType === 'booking') {
          navigation.replace('BookingPaymentVerification', {
            status: 'failed',
            fromWebView: true
          });
        } else {
          navigation.replace('PaymentVerification', {
            status: 'failed',
            paymentType,
            fromWebView: true
          });
        }
      } catch (parseError) {
        console.error('❌ Failed to parse payment cancel URL:', parseError);
        navigation.replace('PaymentVerification', {
          status: 'failed',
          fromWebView: true
        });
      }
      
      return false; // Prevent WebView from navigating
    }
    
    // Legacy deep link handling (keep for backward compatibility)
    if (url.startsWith('vestradat://')) {
      console.log('🔗 Legacy deep link detected:', url);
      
      try {
        const urlObj = new URL(url);
        const status = urlObj.searchParams.get('status');
        const txRef = urlObj.searchParams.get('tx_ref') || urlObj.searchParams.get('transaction_id');
        
        navigation.replace('PaymentVerification', {
          status,
          tx_ref: txRef,
          fromWebView: true
        });
      } catch (parseError) {
        console.error('❌ Failed to parse legacy deep link:', parseError);
        navigation.replace('PaymentVerification', {
          status: 'failed',
          fromWebView: true
        });
      }
      
      return false; // Prevent WebView from navigating
    }
    
    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          console.log('🔗 Should start load with request:', request.url);
          
          // Handle backend's actual redirect URL patterns
          if (request.url.includes('frontend-datacap.vercel.app/payment/verify-combined') ||
              request.url.includes('frontend-datacap.vercel.app/payment/verify-verified-badge') ||
              request.url.includes('frontend-datacap.vercel.app/payment/verify')) {
            console.log('🔗 Backend payment URL detected, handling manually');
            handleNavigationStateChange({ url: request.url });
            return false; // Prevent WebView from loading the URL
          }
          
          // Handle mobile payment URLs (legacy)
          if (request.url.includes('frontend-datacap.vercel.app/mobile-payment-success') ||
              request.url.includes('frontend-datacap.vercel.app/mobile-payment-cancel')) {
            console.log('🔗 Legacy mobile payment URL detected, handling manually');
            handleNavigationStateChange({ url: request.url });
            return false; // Prevent WebView from loading the URL
          }
          
          // Handle legacy deep links
          if (request.url.startsWith('vestradat://')) {
            console.log('🔗 Legacy deep link detected, handling manually');
            handleNavigationStateChange({ url: request.url });
            return false; // Prevent WebView from loading the URL
          }
          
          // Allow all other URLs to load normally
          return true;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PaymentWebViewScreen;