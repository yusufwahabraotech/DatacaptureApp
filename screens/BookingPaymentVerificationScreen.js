import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingPaymentVerificationScreen = ({ navigation, route }) => {
  const { 
    paymentLink, 
    orderId, 
    transactionId, 
    service, 
    bookingData, 
    paymentAmount, 
    paymentType 
  } = route.params;
  
  const [verifying, setVerifying] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    // Handle back button press
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment? Your booking will not be confirmed.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => navigation.navigate('PublicProductSearch')
        },
      ]
    );
  };

  const openPaymentLink = async () => {
    try {
      const supported = await Linking.canOpenURL(paymentLink);
      if (supported) {
        await Linking.openURL(paymentLink);
        setPaymentCompleted(true);
      } else {
        Alert.alert('Error', 'Unable to open payment link');
      }
    } catch (error) {
      console.error('Error opening payment link:', error);
      Alert.alert('Error', 'Failed to open payment link');
    }
  };

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      const response = await ApiService.verifyBookingPayment(transactionId);
      
      if (response.success) {
        setVerificationResult(response.data);
        Alert.alert(
          'Payment Successful!',
          'Your booking has been confirmed. You will receive a confirmation email shortly.',
          [
            {
              text: 'View Booking Details',
              onPress: () => navigation.navigate('BookingConfirmationScreen', {
                order: response.data.order,
                service: service,
                paymentAmount: paymentAmount,
                paymentType: paymentType,
              }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Payment Verification Failed',
          response.message || 'Unable to verify payment. Please try again or contact support.',
          [
            { text: 'Try Again', onPress: verifyPayment },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert(
        'Verification Error',
        'Failed to verify payment. Please check your connection and try again.',
        [
          { text: 'Try Again', onPress: verifyPayment },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setVerifying(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Payment Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusIcon}>
            <Ionicons 
              name={paymentCompleted ? "checkmark-circle" : "card"} 
              size={64} 
              color={paymentCompleted ? "#10B981" : "#7B2CBF"} 
            />
          </View>
          
          <Text style={styles.statusTitle}>
            {paymentCompleted ? 'Payment Completed' : 'Complete Your Payment'}
          </Text>
          
          <Text style={styles.statusMessage}>
            {paymentCompleted 
              ? 'Click "Verify Payment" below to confirm your booking'
              : 'Click "Pay Now" to complete your booking payment'
            }
          </Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>{service.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>{service.producer}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(bookingData.bookingDate)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{bookingData.bookingTime}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{bookingData.bookingDuration} minutes</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>
                {paymentType === 'full' ? 'Total Amount' : 'Upfront Payment'}:
              </Text>
              <Text style={styles.totalValue}>₦{paymentAmount.toLocaleString()}</Text>
            </View>
            
            {paymentType === 'upfront' && (
              <View style={styles.summaryRow}>
                <Text style={styles.remainingLabel}>Remaining Balance:</Text>
                <Text style={styles.remainingValue}>
                  ₦{(bookingData.productPrice - paymentAmount).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={20} color="#7B2CBF" />
            <Text style={styles.instructionsTitle}>Payment Instructions</Text>
          </View>
          
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text style={styles.instructionText}>
                Click "Pay Now" to open the secure payment page
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text style={styles.instructionText}>
                Complete your payment using your preferred method
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text style={styles.instructionText}>
                Return to this screen and click "Verify Payment"
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text style={styles.instructionText}>
                Receive booking confirmation and service provider contact
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {!paymentCompleted ? (
          <TouchableOpacity
            style={styles.payButton}
            onPress={openPaymentLink}
          >
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.payButtonText}>
              Pay ₦{paymentAmount.toLocaleString()} Now
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={openPaymentLink}
            >
              <Text style={styles.secondaryButtonText}>Pay Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.verifyButton, verifying && styles.disabledButton]}
              onPress={verifyPayment}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.verifyButtonText}>Verify Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  statusContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    marginBottom: 20,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2CBF',
    width: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  verifyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingPaymentVerificationScreen;