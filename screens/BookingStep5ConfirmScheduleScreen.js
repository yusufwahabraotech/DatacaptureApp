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
  const [pricingBreakdown, setPricingBreakdown] = useState(null);

  useEffect(() => {
    console.log('🚨 SERVICE DATA DEBUG 🚨');
    console.log('Service object:', JSON.stringify(service, null, 2));
    console.log('Service price fields:');
    console.log('- actualAmount:', service.actualAmount);
    console.log('- priceInDollars:', service.priceInDollars);
    console.log('- price:', service.price);
    console.log('- upfrontPaymentPercentage:', service.upfrontPaymentPercentage);
    console.log('- bookingAvailability:', service.bookingAvailability);
  }, [service]);

  const calculateTotalAmount = () => {
    // Updated price field detection based on actual service structure
    const baseAmount = service.pricing?.discountedPrice || 
                      service.pricing?.originalPrice || 
                      service.actualAmount || 
                      service.priceInDollars || 
                      service.price || 0;
    const numberOfPersons = 1 + guests.length; // Customer + guests
    const totalServicePrice = baseAmount * numberOfPersons;
    
    console.log('💰 PRICING CALCULATION:');
    console.log('- service.pricing:', service.pricing);
    console.log('- discountedPrice:', service.pricing?.discountedPrice);
    console.log('- originalPrice:', service.pricing?.originalPrice);
    console.log('- baseProductPrice:', baseAmount);
    console.log('- numberOfPersons:', numberOfPersons);
    console.log('- totalServicePrice:', totalServicePrice);
    
    return totalServicePrice;
  };

  const calculateSubServicesTotal = () => {
    if (!service.subServices || service.subServices.length === 0) return 0;
    return service.subServices.reduce((total, sub) => total + (sub.price || 0), 0);
  };

  const getUpfrontPercentage = () => {
    // Updated upfront percentage detection
    return service.pricing?.upfrontPaymentPercentage || 
           service.upfrontPaymentPercentage || 50; // Default to 50% if not set
  };

  const calculateUpfrontAmount = () => {
    const totalAmount = calculateTotalAmount();
    const upfrontPercentage = getUpfrontPercentage();
    return Math.round(totalAmount * (upfrontPercentage / 100));
  };

  const calculateRemainingBalance = () => {
    return calculateTotalAmount() - calculateUpfrontAmount();
  };

  const getPaymentAmount = () => {
    const mainServiceAmount = paymentType === 'full' ? calculateTotalAmount() : calculateUpfrontAmount();
    const subServicesTotal = calculateSubServicesTotal();
    const totalPaymentAmount = mainServiceAmount + subServicesTotal;
    
    console.log('💰 FINAL PRICING:');
    console.log('- paymentType:', paymentType);
    console.log('- mainServiceAmount:', mainServiceAmount);
    console.log('- subServicesTotal:', subServicesTotal);
    console.log('- totalPaymentAmount:', totalPaymentAmount);
    console.log('- upfrontPercentage:', getUpfrontPercentage());
    
    return totalPaymentAmount;
  };

  const getPaymentOptions = () => {
    const totalServicePrice = calculateTotalAmount();
    const subServicesTotal = calculateSubServicesTotal();
    const upfrontPercentage = getUpfrontPercentage();
    const upfrontAmount = calculateUpfrontAmount();
    
    return {
      upfront: {
        available: upfrontPercentage > 0 && upfrontPercentage < 100,
        amount: upfrontAmount + subServicesTotal,
        percentage: upfrontPercentage,
        remainingBalance: calculateRemainingBalance()
      },
      full: {
        available: true,
        amount: totalServicePrice + subServicesTotal,
        percentage: 100,
        remainingBalance: 0
      }
    };
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

      // Prepare booking data with updated structure
      const bookingData = {
        serviceId: service.id || service._id,
        productId: service.id || service._id,
        productName: service.name,
        productPrice: calculateTotalAmount(),
        upfrontAmount: getPaymentAmount(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentType: paymentType,
        itemType: 'service',
        organizationId: service.organizationId,
        organizationName: service.producer || service.serviceProvider?.producer,

        // Booking specific fields
        bookingDate: selectedDate,
        bookingTime: selectedSlot.time,
        bookingDuration: service.bookingConfiguration?.slotDurationMinutes || 60,
        bookingNotes: customerInfo.notes || '',

        // Location data
        bookingLocation: bookingLocation,

        // Persons data
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

        // Sub-services
        selectedSubServices: service.subServices || [],
        
        // Pricing breakdown
        pricingBreakdown: {
          baseProductPrice: service.pricing?.discountedPrice || service.pricing?.originalPrice || 0,
          numberOfPersons: 1 + guests.length,
          totalServicePrice: calculateTotalAmount(),
          upfrontPercentage: getUpfrontPercentage(),
          upfrontAmount: calculateUpfrontAmount(),
          remainingBalance: calculateRemainingBalance(),
          subServices: service.subServices || [],
          subServicesTotal: calculateSubServicesTotal(),
          paymentType: paymentType,
          totalPaymentAmount: getPaymentAmount()
        }
      };

      console.log('🚨 COMPREHENSIVE BOOKING DATA DEBUG 🚨');
      console.log('=== CUSTOMER INFO ===');
      console.log('Name:', customerInfo.name);
      console.log('Email:', customerInfo.email);
      console.log('Phone:', customerInfo.phone);
      console.log('=== SERVICE INFO ===');
      console.log('Service ID:', service.id || service._id);
      console.log('Service Name:', service.name);
      console.log('Organization ID:', service.organizationId);
      console.log('=== BOOKING INFO ===');
      console.log('Date:', selectedDate);
      console.log('Slot:', selectedSlot);
      console.log('Location:', bookingLocation);
      console.log('=== PRICING INFO ===');
      console.log('Payment Type:', paymentType);
      console.log('Total Amount:', calculateTotalAmount());
      console.log('Payment Amount:', getPaymentAmount());
      console.log('=== FULL BOOKING DATA ===');
      console.log(JSON.stringify(bookingData, null, 2));

      const response = await ApiService.createBookingOrder(bookingData);

      console.log('🚨 BOOKING RESPONSE DEBUG 🚨');
      console.log('Response status:', response.success);
      console.log('Response message:', response.message);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      console.log('Full response:', JSON.stringify(response, null, 2));

      if (response.success) {
        // Store pricing breakdown for display
        if (response.data.pricingBreakdown) {
          setPricingBreakdown(response.data.pricingBreakdown);
        }

        // Navigate to payment verification screen with comprehensive data
        navigation.navigate('BookingPaymentVerification', {
          paymentLink: response.data.link,
          orderId: response.data.orderId,
          transactionId: response.data.tx_ref,
          service: service,
          bookingData: bookingData,
          pricingBreakdown: response.data.pricingBreakdown,
          paymentAmount: response.data.pricingBreakdown?.totalPaymentAmount || getPaymentAmount(),
          paymentType: response.data.pricingBreakdown?.paymentType || paymentType,
        });
      } else {
        console.log('❌ BOOKING ERROR DETAILS:');
        console.log('Error message:', response.message);
        console.log('Error data:', response.data);
        
        // Show detailed error message
        Alert.alert(
          'Booking Error', 
          response.message || 'Failed to create booking',
          [
            {
              text: 'OK',
              onPress: () => {
                // Log the error for debugging
                console.log('User acknowledged booking error');
              }
            }
          ]
        );
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
            {/* Full Payment Option - Always Available */}
            {renderPaymentOption(
              'full',
              'Pay Full Amount',
              getPaymentOptions().full.amount,
              'Pay the complete amount now - No remaining balance'
            )}

            {/* Upfront Payment Option - Show if available */}
            {getPaymentOptions().upfront.available && (
              renderPaymentOption(
                'upfront',
                `Pay ${getUpfrontPercentage()}% Upfront`,
                getPaymentOptions().upfront.amount,
                `Pay ${getUpfrontPercentage()}% now, remaining ₦${getPaymentOptions().upfront.remainingBalance.toLocaleString()} due later`
              )
            )}
          </View>
        </View>

        {/* Enhanced Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
          
          <View style={styles.pricingCard}>
            {/* Base Service Price */}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Service Price</Text>
              <Text style={styles.pricingValue}>
                ₦{(service.pricing?.discountedPrice || service.pricing?.originalPrice || 0).toLocaleString()}
              </Text>
            </View>

            {/* Show discount if applicable */}
            {service.pricing?.discount && service.pricing?.discount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.discountLabel}>
                  Discount ({service.pricing.discount}%)
                </Text>
                <Text style={styles.discountValue}>
                  -₦{(service.pricing?.youSave || 0).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Number of Persons */}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Number of Persons (You + {guests.length} guest{guests.length !== 1 ? 's' : ''})
              </Text>
              <Text style={styles.pricingValue}>
                {1 + guests.length} person{(1 + guests.length) !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Total Service Price */}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Service Price</Text>
              <Text style={styles.pricingValue}>
                ₦{calculateTotalAmount().toLocaleString()}
              </Text>
            </View>

            {/* Sub-Services - Show if they exist */}
            {service.subServices && service.subServices.length > 0 && (
              <>
                <View style={styles.pricingDivider} />
                <View style={styles.subServicesHeader}>
                  <Text style={styles.subServicesTitle}>Sub-Services</Text>
                </View>
                {service.subServices.map((subService, index) => (
                  <View key={index} style={styles.pricingRow}>
                    <Text style={styles.subServiceLabel}>
                      {subService.name} ({subService.code || `SUB${index + 1}`})
                    </Text>
                    <Text style={styles.pricingValue}>
                      ₦{(subService.price || 0).toLocaleString()}
                    </Text>
                  </View>
                ))}
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Sub-Services Total</Text>
                  <Text style={styles.pricingValue}>
                    ₦{calculateSubServicesTotal().toLocaleString()}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.pricingDivider} />

            {/* Payment Type Breakdown */}
            {paymentType === 'upfront' ? (
              <>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>
                    Upfront Payment ({getUpfrontPercentage()}% of service)
                  </Text>
                  <Text style={styles.pricingValue}>
                    ₦{calculateUpfrontAmount().toLocaleString()}
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Sub-Services (pay now)</Text>
                  <Text style={styles.pricingValue}>
                    ₦{calculateSubServicesTotal().toLocaleString()}
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.remainingLabel}>Remaining Balance (due later)</Text>
                  <Text style={styles.remainingValue}>
                    ₦{calculateRemainingBalance().toLocaleString()}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Full Service Payment</Text>
                  <Text style={styles.pricingValue}>
                    ₦{calculateTotalAmount().toLocaleString()}
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Sub-Services</Text>
                  <Text style={styles.pricingValue}>
                    ₦{calculateSubServicesTotal().toLocaleString()}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.pricingDivider} />

            {/* Total Payment Amount */}
            <View style={styles.pricingRow}>
              <Text style={styles.paymentLabel}>
                Total Payment Now
              </Text>
              <Text style={styles.paymentValue}>
                ₦{getPaymentAmount().toLocaleString()}
              </Text>
            </View>

            {/* Payment Type Badge */}
            <View style={styles.paymentTypeBadge}>
              <Text style={styles.paymentTypeBadgeText}>
                {paymentType === 'full' ? 'Full Payment' : `Upfront Payment (${getUpfrontPercentage()}%)`}
              </Text>
              <Text style={styles.paymentNumberText}>
                Payment #{paymentType === 'upfront' ? '1 of 2' : '1 of 1'}
              </Text>
              {paymentType === 'upfront' && (
                <Text style={styles.paymentNumberText}>
                  Remaining: ₦{calculateRemainingBalance().toLocaleString()} due later
                </Text>
              )}
            </View>
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
  subServicesHeader: {
    marginBottom: 8,
  },
  subServicesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  subServiceLabel: {
    fontSize: 13,
    color: '#6B7280',
    paddingLeft: 12,
  },
  paymentTypeBadge: {
    backgroundColor: '#7B2CBF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  paymentTypeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  paymentNumberText: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 2,
  },
  discountLabel: {
    fontSize: 14,
    color: '#10B981',
    fontStyle: 'italic',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
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