import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const VerifiedBadgePaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const VERIFIED_BADGE_PRICE = 50000; // ₦500 in kobo

  const initializePayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        amount: VERIFIED_BADGE_PRICE,
        currency: 'NGN',
        redirect_url: 'https://your-app.com/payment-success',
      };

      const response = await ApiService.initializeVerifiedBadgePayment(paymentData);
      
      if (response.success && response.data.authorization_url) {
        setPaymentUrl(response.data.authorization_url);
        setTransactionId(response.data.tx_ref);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState) => {
    const { url } = navState;
    
    // Check if payment was completed
    if (url.includes('payment-success') || url.includes('successful')) {
      setShowPaymentModal(false);
      await verifyPayment();
    } else if (url.includes('cancelled') || url.includes('failed')) {
      setShowPaymentModal(false);
      Alert.alert('Payment Cancelled', 'Your payment was cancelled or failed');
    }
  };

  const verifyPayment = async () => {
    if (!transactionId) return;

    setLoading(true);
    try {
      const response = await ApiService.verifyVerifiedBadgePayment(transactionId);
      
      if (response.success) {
        Alert.alert(
          'Payment Successful!',
          'Your verified badge payment has been processed. Your organization will be reviewed for verification.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Payment Verification Failed', response.message || 'Please contact support');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Verified Badge</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.badgeCard}>
          <View style={styles.badgeIcon}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          </View>
          <Text style={styles.badgeTitle}>Verified Organization Badge</Text>
          <Text style={styles.badgeDescription}>
            Get your organization verified and unlock premium features
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.cardTitle}>Benefits of Verification</Text>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Unlimited locations</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>10 images per location</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>2 videos per location</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Verified badge display</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Priority support</Text>
          </View>
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₦</Text>
            <Text style={styles.price}>500</Text>
            <Text style={styles.period}>one-time</Text>
          </View>
          <Text style={styles.priceNote}>
            One-time payment for lifetime verification
          </Text>
        </View>

        <View style={styles.processCard}>
          <Text style={styles.cardTitle}>Verification Process</Text>
          
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Make payment</Text>
          </View>
          
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Admin reviews your organization</Text>
          </View>
          
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Get verified badge and unlock features</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.payButton, loading && styles.payButtonDisabled]} 
          onPress={initializePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card" size={24} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pay ₦500 Now</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPaymentModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              style={styles.webview}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7C3AED',
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: '#7C3AED',
    marginHorizontal: 5,
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  processCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  payButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  webview: {
    flex: 1,
  },
});

export default VerifiedBadgePaymentScreen;