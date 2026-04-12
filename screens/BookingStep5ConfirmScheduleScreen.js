import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingStep5ConfirmScheduleScreen = ({ navigation, route }) => {
  const { 
    service, 
    selectedDate, 
    selectedSlot, 
    customerInfo, 
    guests, 
    bookingLocation 
  } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const calculateTotalAmount = () => {
    const baseAmount = service.actualAmount || service.priceInDollars || 0;
    const guestCount = guests.length;
    return baseAmount * (1 + guestCount); // Base amount + same amount for each guest
  };

  const calculateUpfrontAmount = () => {
    const totalAmount = calculateTotalAmount();
    const upfrontPercentage = service.upfrontPaymentPercentage || 50;
    return Math.round(totalAmount * (upfrontPercentage / 100));
  };

  const getPaymentAmount = () => {
    return paymentType === 'full' ? calculateTotalAmount() : calculateUpfrontAmount();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLocationDisplayText = () => {
    switch (bookingLocation.type) {
      case 'merchant_location':
        return 'Service provider\'s location';
      case 'customer_address':
        return 'Your registered address';
      case 'new_address':
        return bookingLocation.address;
      case 'whatsapp_location':
        return 'WhatsApp shared location';
      default:
        return 'Location to be confirmed';
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);

      // Prepare booking data
      const bookingData = {
        serviceId: service._id,
        productId: service._id,
        productName: service.name,
        productPrice: calculateTotalAmount(),
        upfrontAmount: getPaymentAmount(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentType: paymentType,
        itemType: 'service',
        organizationId: service.organizationId,
        organizationName: service.producer,

        bookingDate: selectedDate,
        bookingTime: selectedSlot.time,
        bookingDuration: service.bookingAvailability?.slotDurationMinutes || 60,
        bookingNotes: customerInfo.notes,

        bookingLocation: bookingLocation,

        bookedForPersons: [
          {
            name: customerInfo.name,
            email: customerInfo.email,
            slotDateTime: selectedSlot.datetime,
            isMainBooker: true,
          },
          ...guests.map(guest => ({
            name: guest.name,
            email: guest.email || '',
            slotDateTime: guest.selectedSlot.datetime,
            isMainBooker: false,
          })),
        ],

        selectedSubServices: service.subServices || [],
      };

      console.log('🚨 BOOKING DATA DEBUG 🚨');
      console.log('Booking data:', JSON.stringify(bookingData, null, 2));

      const response = await ApiService.createBookingOrder(bookingData);

      if (response.success) {
        // Navigate to payment verification screen
        navigation.navigate('BookingPaymentVerification', {
          paymentLink: response.data.paymentLink,
          orderId: response.data.orderId,
          transactionId: response.data.transactionId,
          service: service,
          bookingData: bookingData,
          paymentAmount: getPaymentAmount(),
          paymentType: paymentType,
        });
      } else {
        Alert.alert('Booking Error', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentOption = (type, title, amount, description) => {
    const isSelected = paymentType === type;
    
    return (
      <TouchableOpacity
        style={[
          styles.paymentOption,
          isSelected && styles.selectedPaymentOption,
        ]}
        onPress={() => setPaymentType(type)}
      >
        <View style={styles.paymentOptionContent}>
          <View style={styles.paymentOptionHeader}>
            <Text style={[
              styles.paymentOptionTitle,
              isSelected && styles.selectedPaymentOptionTitle,
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.paymentOptionAmount,
              isSelected && styles.selectedPaymentOptionAmount,
            ]}>
              ₦{amount.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.paymentOptionDescription}>
            {description}
          </Text>
        </View>
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm & Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
        </View>
        <Text style={styles.progressText}>Step 5 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceProvider}>{service.producer}</Text>
            </View>

            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar" size={16} color="#7B2CBF" />
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="time" size={16} color="#7B2CBF" />
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSlot.displayTime} ({service.bookingAvailability?.slotDurationMinutes || 60} min)
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="location" size={16} color="#7B2CBF" />
                <Text style={styles.summaryLabel}>Location:</Text>
                <Text style={styles.summaryValue}>{getLocationDisplayText()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="person" size={16} color="#7B2CBF" />
                <Text style={styles.summaryLabel}>Customer:</Text>
                <Text style={styles.summaryValue}>{customerInfo.name}</Text>
              </View>

              {guests.length > 0 && (
                <View style={styles.summaryRow}>
                  <Ionicons name="people" size={16} color="#7B2CBF" />
                  <Text style={styles.summaryLabel}>Guests:</Text>
                  <Text style={styles.summaryValue}>{guests.length} guest(s)</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Guest Details */}
        {guests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Details</Text>
            {guests.map((guest, index) => (
              <View key={index} style={styles.guestCard}>
                <Text style={styles.guestName}>Guest {index + 1}: {guest.name}</Text>
                {guest.email && (
                  <Text style={styles.guestEmail}>{guest.email}</Text>
                )}
                <Text style={styles.guestTime}>
                  Time: {guest.selectedSlot?.displayTime}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Options</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you'd like to pay for this booking
          </Text>

          <View style={styles.paymentOptions}>
            {renderPaymentOption(
              'full',
              'Full Payment',
              calculateTotalAmount(),
              'Pay the complete amount now'
            )}

            {service.upfrontPaymentPercentage && service.upfrontPaymentPercentage < 100 && (
              renderPaymentOption(
                'upfront',
                `Upfront Payment (${service.upfrontPaymentPercentage}%)`,
                calculateUpfrontAmount(),
                `Pay ${service.upfrontPaymentPercentage}% now, remaining at service time`
              )
            )}
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
          
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Service</Text>
              <Text style={styles.pricingValue}>
                ₦{(service.actualAmount || service.priceInDollars || 0).toLocaleString()}
              </Text>
            </View>

            {guests.length > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  Additional Guests ({guests.length})
                </Text>
                <Text style={styles.pricingValue}>
                  ₦{((service.actualAmount || service.priceInDollars || 0) * guests.length).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.pricingDivider} />

            <View style={styles.pricingRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₦{calculateTotalAmount().toLocaleString()}
              </Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.paymentLabel}>
                {paymentType === 'full' ? 'Amount to Pay Now' : 'Upfront Payment'}
              </Text>
              <Text style={styles.paymentValue}>
                ₦{getPaymentAmount().toLocaleString()}
              </Text>
            </View>

            {paymentType === 'upfront' && (
              <View style={styles.pricingRow}>
                <Text style={styles.remainingLabel}>Remaining Balance</Text>
                <Text style={styles.remainingValue}>
                  ₦{(calculateTotalAmount() - calculateUpfrontAmount()).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <View style={styles.termsHeader}>
            <Ionicons name="document-text" size={16} color="#7B2CBF" />
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
          </View>
          <Text style={styles.termsText}>
            By confirming this booking, you agree to our terms of service and cancellation policy. 
            The service provider will contact you to confirm the appointment details.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.confirmButtonText}>
                Pay ₦{getPaymentAmount().toLocaleString()} & Confirm Booking
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#7B2CBF',
  },
  completedStep: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 16,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 60,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  guestCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  guestEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  guestTime: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  selectedPaymentOption: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedPaymentOptionTitle: {
    color: '#7B2CBF',
  },
  paymentOptionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectedPaymentOptionAmount: {
    color: '#7B2CBF',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#7B2CBF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  pricingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  pricingDivider: {
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
    color: '#1F2937',
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  paymentValue: {
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
  termsSection: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingStep5ConfirmScheduleScreen;