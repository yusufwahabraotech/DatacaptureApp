import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingStep5ConfirmScheduleScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot, bookingDetails, locationData } = route.params;
  const [loading, setLoading] = useState(false);
  const [processPayment, setProcessPayment] = useState(true);
  const [paymentType, setPaymentType] = useState('upfront'); // 'upfront' or 'full'
  const [upfrontPercentage, setUpfrontPercentage] = useState(50);

  const handleCreateBooking = async () => {
    try {
      setLoading(true);

      console.log('🚨 ADMIN BOOKING CREATION DEBUG 🚨');
      console.log('Service:', JSON.stringify(service, null, 2));
      console.log('Booking Details:', JSON.stringify(bookingDetails, null, 2));
      console.log('Customer Type:', bookingDetails.customerType);
      console.log('Customer Object:', JSON.stringify(bookingDetails.customer, null, 2));
      
      // Determine the correct customer ID field
      let customerId = null;
      if (bookingDetails.customerType === 'existing' && bookingDetails.customer) {
        // Try different possible ID fields
        customerId = bookingDetails.customer.id || 
                    bookingDetails.customer._id || 
                    bookingDetails.customer.userId || 
                    bookingDetails.customer.customUserId;
        
        console.log('🚨 CUSTOMER ID RESOLUTION 🚨');
        console.log('Customer ID fields check:');
        console.log('- id:', bookingDetails.customer.id);
        console.log('- _id:', bookingDetails.customer._id);
        console.log('- userId:', bookingDetails.customer.userId);
        console.log('- customUserId:', bookingDetails.customer.customUserId);
        console.log('Final customerId:', customerId);
        
        // Validate that we have a customerId for existing customers
        if (!customerId) {
          console.log('❌ MISSING CUSTOMER ID FOR EXISTING CUSTOMER ❌');
          Alert.alert('Error', 'Customer ID is missing. Please select the customer again.');
          setLoading(false);
          return;
        }
      }

      const bookingPayload = {
        serviceId: service._id,
        serviceName: service.name,
        servicePrice: service.actualAmount || service.priceInDollars || 0,
        
        customerType: bookingDetails.customerType,
        
        // Handle customer data based on type - EXACTLY as backend expects
        ...(bookingDetails.customerType === 'existing' ? {
          // For existing customers: ONLY send customerId, backend will fetch name/email
          customerId: customerId,
        } : {
          // For external customers: send name, email, phone (no customerId)
          customerName: bookingDetails.customer.name,
          customerEmail: bookingDetails.customer.email,
          customerPhone: bookingDetails.customer.phone || '',
        }),
        
        primarySlot: selectedSlot.datetime,
        guests: [], // Admin can add guests later if needed
        
        location: locationData,
        customerNotes: bookingDetails.customerNotes,
        
        // Admin Extensions
        ...(bookingDetails.serviceProvider && {
          serviceProviderId: bookingDetails.serviceProvider.id || bookingDetails.serviceProvider._id,
        }),
        paymentType,
        upfrontPercentage,
        processPayment,
      };

      console.log('🚨 FINAL BOOKING PAYLOAD 🚨');
      console.log('Payload:', JSON.stringify(bookingPayload, null, 2));
      
      // Validate payload structure matches backend expectations
      if (bookingDetails.customerType === 'existing') {
        console.log('✅ EXISTING CUSTOMER PAYLOAD VALIDATION:');
        console.log('- customerType:', bookingPayload.customerType);
        console.log('- customerId:', bookingPayload.customerId);
        console.log('- Has customerName (should be undefined):', bookingPayload.customerName);
        console.log('- Has customerEmail (should be undefined):', bookingPayload.customerEmail);
        
        if (bookingPayload.customerName || bookingPayload.customerEmail) {
          console.log('⚠️ WARNING: Existing customer payload contains name/email fields!');
        }
      } else {
        console.log('✅ EXTERNAL CUSTOMER PAYLOAD VALIDATION:');
        console.log('- customerType:', bookingPayload.customerType);
        console.log('- customerName:', bookingPayload.customerName);
        console.log('- customerEmail:', bookingPayload.customerEmail);
        console.log('- customerPhone:', bookingPayload.customerPhone);
        console.log('- Has customerId (should be undefined):', bookingPayload.customerId);
        
        if (bookingPayload.customerId) {
          console.log('⚠️ WARNING: External customer payload contains customerId field!');
        }
      }

      const response = await ApiService.createAdminBooking(bookingPayload);

      console.log('🚨 BOOKING CREATION RESPONSE 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        if (processPayment && response.data.booking.paymentLink) {
          // Navigate to payment screen
          navigation.navigate('AdminBookingPaymentScreen', {
            booking: response.data.booking,
            paymentLink: response.data.booking.paymentLink,
          });
        } else {
          // Navigate to success screen
          navigation.navigate('AdminBookingSuccess', {
            booking: response.data.booking,
          });
        }
      } else {
        console.log('❌ BOOKING CREATION FAILED ❌');
        console.log('Error message:', response.message);
        Alert.alert('Booking Failed', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('❌ BOOKING CREATION ERROR:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
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

  const calculateAmount = () => {
    const totalAmount = service.actualAmount || service.priceInDollars || 0;
    if (paymentType === 'upfront') {
      return (totalAmount * upfrontPercentage) / 100;
    }
    return totalAmount;
  };

  const renderSummarySection = (title, children) => (
    <View style={styles.summarySection}>
      <Text style={styles.summarySectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSummaryRow = (label, value, icon = null) => (
    <View style={styles.summaryRow}>
      <View style={styles.summaryRowLeft}>
        {icon && <Ionicons name={icon} size={16} color="#6B7280" />}
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Booking - Confirm</Text>
        <View style={{ width: 24 }} />
      </View>

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
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          {renderSummarySection('Service Details', (
            <>
              {renderSummaryRow('Service', service.name, 'briefcase')}
              {renderSummaryRow('Provider', service.producer, 'business')}
              {renderSummaryRow('Duration', `${service.bookingAvailability?.slotDurationMinutes || 60} minutes`, 'time')}
              {renderSummaryRow('Price', `₦${(service.actualAmount || service.priceInDollars || 0).toLocaleString()}`, 'card')}
            </>
          ))}

          {renderSummarySection('Schedule', (
            <>
              {renderSummaryRow('Date', formatDate(selectedDate), 'calendar')}
              {renderSummaryRow('Time', selectedSlot.displayTime, 'time')}
            </>
          ))}

          {renderSummarySection('Customer', (
            <>
              {renderSummaryRow('Name', 
                bookingDetails.customerType === 'existing' 
                  ? bookingDetails.customer.name 
                  : bookingDetails.customer.name, 
                'person'
              )}
              {renderSummaryRow('Email', 
                bookingDetails.customerType === 'existing' 
                  ? bookingDetails.customer.email 
                  : bookingDetails.customer.email, 
                'mail'
              )}
              {renderSummaryRow('Type', 
                bookingDetails.customerType === 'existing' 
                  ? 'Organization User' 
                  : 'External Customer', 
                'people'
              )}
            </>
          ))}

          {bookingDetails.serviceProvider && renderSummarySection('Assigned Provider', (
            <>
              {renderSummaryRow('Name', bookingDetails.serviceProvider.name, 'person-circle')}
              {renderSummaryRow('Email', bookingDetails.serviceProvider.email, 'mail')}
              {renderSummaryRow('Rating', `⭐ ${bookingDetails.serviceProvider.rating || 'N/A'}`, 'star')}
            </>
          ))}

          {renderSummarySection('Location', (
            <>
              {renderSummaryRow('Type', 
                locationData.type === 'merchant_location' ? 'Merchant Location' :
                locationData.type === 'customer_address' ? 'Customer Address' :
                locationData.type === 'new_address' ? 'Custom Address' :
                locationData.type === 'whatsapp_location' ? 'WhatsApp Location' : 'Unknown',
                'location'
              )}
              {locationData.address && renderSummaryRow('Address', locationData.address, 'home')}
            </>
          ))}

          {bookingDetails.customerNotes && renderSummarySection('Special Instructions', (
            <Text style={styles.notesText}>{bookingDetails.customerNotes}</Text>
          ))}
        </View>

        {/* Payment Options */}
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentTitle}>Payment Options</Text>
          
          <View style={styles.paymentOption}>
            <View style={styles.paymentOptionHeader}>
              <Text style={styles.paymentOptionLabel}>Process Payment</Text>
              <Switch
                value={processPayment}
                onValueChange={setProcessPayment}
                trackColor={{ false: '#E5E7EB', true: '#7B2CBF' }}
                thumbColor={processPayment ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.paymentOptionDescription}>
              {processPayment 
                ? 'Customer will be charged via Flutterwave' 
                : 'Create booking without payment (internal booking)'}
            </Text>
          </View>

          {processPayment && (
            <>
              <View style={styles.paymentTypeContainer}>
                <Text style={styles.paymentTypeLabel}>Payment Type</Text>
                <View style={styles.paymentTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      paymentType === 'upfront' && styles.paymentTypeButtonActive,
                    ]}
                    onPress={() => setPaymentType('upfront')}
                  >
                    <Text style={[
                      styles.paymentTypeText,
                      paymentType === 'upfront' && styles.paymentTypeTextActive,
                    ]}>
                      Upfront ({upfrontPercentage}%)
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      paymentType === 'full' && styles.paymentTypeButtonActive,
                    ]}
                    onPress={() => setPaymentType('full')}
                  >
                    <Text style={[
                      styles.paymentTypeText,
                      paymentType === 'full' && styles.paymentTypeTextActive,
                    ]}>
                      Full Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.amountSummary}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Service Price:</Text>
                  <Text style={styles.amountValue}>
                    ₦{(service.actualAmount || service.priceInDollars || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabelBold}>Amount to Charge:</Text>
                  <Text style={styles.amountValueBold}>
                    ₦{calculateAmount().toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.createButtonText}>
                {processPayment ? 'Create Booking & Process Payment' : 'Create Booking'}
              </Text>
              <Ionicons name="checkmark" size={20} color="white" />
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
  summaryContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  paymentContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentOption: {
    marginBottom: 16,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentTypeContainer: {
    marginBottom: 16,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentTypeTextActive: {
    color: '#7B2CBF',
  },
  amountSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  amountLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
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
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminBookingStep5ConfirmScheduleScreen;