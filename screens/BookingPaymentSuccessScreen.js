import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingPaymentSuccessScreen = ({ navigation, route }) => {
  const { 
    orderId, 
    transactionId, 
    service, 
    bookingData, 
    paymentAmount,
    paymentType 
  } = route.params;
  
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      console.log('🚨 BOOKING PAYMENT VERIFICATION 🚨');
      console.log('Transaction ID:', transactionId);
      console.log('Order ID:', orderId);
      
      const response = await ApiService.verifyBookingPayment(transactionId);
      
      console.log('Verification response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setVerificationResult({
          success: true,
          message: response.message || 'Payment verified successfully!',
          orderDetails: response.data
        });
      } else {
        setVerificationResult({
          success: false,
          message: response.message || 'Payment verification failed',
          error: response.data
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Failed to verify payment. Please try again.',
        error: error.message
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRetryVerification = () => {
    if (retryCount < maxRetries) {
      setRetryCount(retryCount + 1);
      verifyPayment();
    } else {
      Alert.alert(
        'Verification Failed',
        'Unable to verify payment after multiple attempts. Please contact support.',
        [
          { text: 'Contact Support', onPress: () => {} },
          { text: 'Go Home', onPress: () => navigation.navigate('Home') }
        ]
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderVerificationContent = () => {
    if (verifying) {
      return (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.verifyingText}>Verifying your payment...</Text>
          <Text style={styles.verifyingSubtext}>Please wait while we confirm your booking</Text>
        </View>
      );
    }

    if (verificationResult?.success) {
      return (
        <ScrollView style={styles.successContent}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color="white" />
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successMessage}>
            Your payment has been processed successfully and your booking is confirmed.
          </Text>

          {/* Booking Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Booking Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{service?.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{service?.producer}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(bookingData?.bookingDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{bookingData?.bookingTime}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>{orderId}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid:</Text>
              <Text style={styles.detailValue}>₦{paymentAmount?.toLocaleString()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Type:</Text>
              <Text style={styles.detailValue}>
                {paymentType === 'full' ? 'Full Payment' : 'Upfront Payment'}
              </Text>
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <View style={styles.nextStepItem}>
              <Ionicons name="mail" size={16} color="#7B2CBF" />
              <Text style={styles.nextStepText}>
                You'll receive a confirmation email shortly
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <Ionicons name="call" size={16} color="#7B2CBF" />
              <Text style={styles.nextStepText}>
                The service provider will contact you to confirm details
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <Ionicons name="calendar" size={16} color="#7B2CBF" />
              <Text style={styles.nextStepText}>
                Be ready at the scheduled time and location
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    // Verification failed
    return (
      <View style={styles.errorContent}>
        <View style={styles.errorIconContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="close" size={48} color="white" />
          </View>
        </View>

        <Text style={styles.errorTitle}>Verification Failed</Text>
        <Text style={styles.errorMessage}>
          {verificationResult?.message || 'Unable to verify your payment'}
        </Text>

        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetryVerification}
          disabled={retryCount >= maxRetries}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>
            {retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry Verification'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Status</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderVerificationContent()}
      </View>

      {/* Footer Actions */}
      {verificationResult?.success && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('BookingHistory')}
          >
            <Text style={styles.secondaryButtonText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  verifyingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  successContent: {
    flex: 1,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
    flex: 1,
    textAlign: 'right',
  },
  nextStepsCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextStepText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
});

export default BookingPaymentSuccessScreen;