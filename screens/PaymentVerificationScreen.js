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

  useEffect(() => {
    if (fromWebView && status === 'successful') {
      verifyPayment();
    } else {
      setVerifying(false);
      setVerificationResult({ success: false, message: 'Payment was not successful' });
    }
  }, []);

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
      navigation.navigate('Home'); // or wherever you want to navigate after successful payment
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