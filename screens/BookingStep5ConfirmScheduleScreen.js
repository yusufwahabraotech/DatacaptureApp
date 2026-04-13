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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
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
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [bookingOrderData, setBookingOrderData] = useState(null);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

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

      // Ensure bookingLocation has the correct format
      if (!bookingLocation || !bookingLocation.locationType) {
        Alert.alert('Error', 'Booking location is missing. Please go back and select a location.');
        return;
      }

      // Prepare booking data with updated structure
      const bookingData = {
        serviceId: service.id || service._id,
        productId: service.id || service._id,
        productName: service.name,
        productPrice: calculateTotalAmount(),
        upfrontPercentage: getUpfrontPercentage(), // Backend expects this field name
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentType: paymentType,
        itemType: 'service',
        organizationId: service.organizationId,
        organizationName: service.producer || service.serviceProvider?.producer || 'Service Provider',

        // Booking specific fields
        bookingDate: selectedDate,
        bookingTime: selectedSlot.time,
        bookingDuration: service.bookingConfiguration?.slotDurationMinutes || 60,
        bookingNotes: customerInfo.notes || '',

        // Location data
        bookingLocation: {
          type: bookingLocation.locationType || bookingLocation.type,
          address: bookingLocation.address,
          whatsappLocationUrl: bookingLocation.whatsappLocationUrl
        },

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
      console.log('=== BOOKING LOCATION DEBUG ===');
      console.log('Raw bookingLocation:', JSON.stringify(bookingLocation, null, 2));
      console.log('Location type:', bookingLocation.locationType || bookingLocation.type);
      console.log('Location address:', bookingLocation.address);
      console.log('=== BOOKING INFO ===');
      console.log('Date:', selectedDate);
      console.log('Slot:', selectedSlot);
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

        // Store booking order data and show payment WebView
        setBookingOrderData({
          orderId: response.data.orderId,
          transactionId: response.data.tx_ref,
          service: service,
          bookingData: bookingData,
          pricingBreakdown: response.data.pricingBreakdown,
          paymentAmount: response.data.pricingBreakdown?.totalPaymentAmount || getPaymentAmount(),
          paymentType: response.data.pricingBreakdown?.paymentType || paymentType,
        });
        
        setPaymentLink(response.data.link);
        setShowPaymentWebView(true);
        
        // Set up automatic verification after 3 minutes (fallback)
        const timeout = setTimeout(() => {
          console.log('⏰ PAYMENT TIMEOUT - AUTO VERIFYING');
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
                onPress: () => {
                  setShowPaymentWebView(false);
                  verifyBookingPayment(response.data.tx_ref);
                }
              }
            ]
          );
        }, 180000); // 3 minutes
        
        setPaymentTimeout(timeout);
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

  const verifyBookingPayment = async (txRef) => {
    try {
      // Clear any existing timeout
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
      }
      
      console.log('🚨 VERIFYING BOOKING PAYMENT 🚨');
      console.log('Using transaction reference:', txRef);
      
      const response = await ApiService.verifyBookingPayment(txRef);
      console.log('Verification response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setShowPaymentWebView(false);
        setTimeout(() => {
          Alert.alert(
            'Booking Confirmed!',
            `Your ${service?.name || 'service'} booking has been confirmed successfully.`,
            [
              {
                text: 'View My Orders',
                onPress: () => navigation.navigate('MyOrders')
              },
              {
                text: 'Back to Services',
                onPress: () => navigation.navigate('PublicProductSearch')
              }
            ]
          );
        }, 1000);
      } else {
        setShowPaymentWebView(false);
        setTimeout(() => {
          Alert.alert(
            'Verification Failed',
            response.message || 'Failed to verify booking payment',
            [
              {
                text: 'Contact Support',
                onPress: () => navigation.navigate('Help')
              },
              {
                text: 'Try Again',
                onPress: () => setShowPaymentWebView(true)
              }
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Booking payment verification error:', error);
      setShowPaymentWebView(false);
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
              onPress: () => setShowPaymentWebView(true)
            }
          ]
        );
      }, 1000);
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

      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Complete Booking Payment</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.manualVerifyButton}
                onPress={() => {
                  console.log('🔄 MANUAL VERIFICATION TRIGGERED');
                  setShowPaymentWebView(false);
                  verifyBookingPayment(bookingOrderData?.transactionId);
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text style={styles.manualVerifyText}>Payment Done?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                // Clear timeout when closing
                if (paymentTimeout) {
                  clearTimeout(paymentTimeout);
                  setPaymentTimeout(null);
                }
                setShowPaymentWebView(false);
              }}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {paymentLink && (
            <WebView
              source={{ uri: paymentLink }}
              onNavigationStateChange={(navState) => {
                console.log('🚨 WEBVIEW NAVIGATION 🚨');
                console.log('Current URL:', navState.url);
                
                // Check for Flutterwave success indicators in URL
                if (navState.url.includes('flutterwave') && 
                    (navState.url.includes('successful') || navState.url.includes('completed') || navState.url.includes('success'))) {
                  console.log('✅ FLUTTERWAVE SUCCESS DETECTED IN URL');
                  setShowPaymentWebView(false);
                  
                  // Use the original transaction ID for verification
                  setTimeout(() => {
                    verifyBookingPayment(bookingOrderData?.transactionId);
                  }, 1000);
                }
                
                // Check for Flutterwave failure/cancellation
                if (navState.url.includes('flutterwave') && 
                    (navState.url.includes('cancelled') || navState.url.includes('failed'))) {
                  console.log('❌ FLUTTERWAVE FAILURE DETECTED IN URL');
                  setShowPaymentWebView(false);
                  setTimeout(() => {
                    Alert.alert(
                      'Payment Cancelled',
                      'Your payment was cancelled or failed.',
                      [
                        {
                          text: 'Try Again',
                          onPress: () => setShowPaymentWebView(true)
                        }
                      ]
                    );
                  }, 1000);
                }
                
                return true;
              }}
              onShouldStartLoadWithRequest={(request) => {
                console.log('🔗 Should start load with request:', request.url);
                
                if (request.url.startsWith('vestradat://')) {
                  console.log('🔗 Deep link detected, opening with Linking');
                  
                  Linking.openURL(request.url)
                    .then(() => {
                      console.log('✅ Deep link opened successfully');
                      setShowPaymentWebView(false);
                    })
                    .catch((error) => {
                      console.error('❌ Failed to open deep link:', error);
                      
                      try {
                        const url = new URL(request.url);
                        const status = url.searchParams.get('status');
                        const txRef = url.searchParams.get('tx_ref') || url.searchParams.get('transaction_id');
                        
                        console.log('💳 Fallback - Deep link payment data:', { status, txRef });
                        
                        setShowPaymentWebView(false);
                        
                        if (status === 'successful') {
                          console.log('✅ PAYMENT SUCCESSFUL - STARTING VERIFICATION');
                          verifyBookingPayment(txRef || bookingOrderData?.transactionId);
                        } else {
                          console.log('❌ PAYMENT FAILED/CANCELLED');
                          setTimeout(() => {
                            Alert.alert(
                              'Payment Failed', 
                              'Your booking payment was cancelled or failed.',
                              [
                                {
                                  text: 'Try Again',
                                  onPress: () => setShowPaymentWebView(true)
                                }
                              ]
                            );
                          }, 1000);
                        }
                      } catch (parseError) {
                        console.error('❌ Failed to parse deep link:', parseError);
                        setShowPaymentWebView(false);
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
                    setShowPaymentWebView(false);
                    verifyBookingPayment(bookingOrderData?.transactionId);
                  }
                } catch (error) {
                  console.log('Error parsing WebView message:', error);
                }
              }}
            />
          )}
        </View>
      </Modal>

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
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewHeader: {
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
  webViewTitle: {
    fontSize: 18,
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