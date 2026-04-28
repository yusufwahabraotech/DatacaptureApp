import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl } = route.params;

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Check if URL contains payment success redirect
    if (url.includes('/mobile-payment-success')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const status = urlParams.get('status');
      const txRef = urlParams.get('tx_ref');
      const transactionId = urlParams.get('transaction_id');
      
      // Navigate to verification screen with payment data
      navigation.replace('PaymentVerification', {
        status,
        tx_ref: txRef,
        transaction_id: transactionId,
        fromWebView: true
      });
      
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