import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ApiService from '../services/api';

const ServiceBookingDetailsScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await ApiService.getAvailableTimeSlots(service._id, dateString);
      
      if (response.success) {
        setAvailableSlots(response.data.slots || []);
      } else {
        Alert.alert('Error', 'Failed to fetch available time slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setShowDatePicker(false);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
  };

  const toggleSubService = (subService) => {
    setSelectedSubServices(prev => {
      const exists = prev.find(s => s._id === subService._id);
      if (exists) {
        return prev.filter(s => s._id !== subService._id);
      } else {
        return [...prev, subService];
      }
    });
  };

  const calculateTotalPrice = () => {
    let total = service.actualAmount || service.priceInDollars || 0;
    selectedSubServices.forEach(subService => {
      total += subService.price || 0;
    });
    return total;
  };

  const calculateUpfrontPayment = () => {
    const total = calculateTotalPrice();
    const upfrontPercentage = service.upfrontPaymentPercentage || 100;
    return (total * upfrontPercentage) / 100;
  };

  const handleBookService = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select a date and time slot');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      Alert.alert('Error', 'Please fill in all required customer information');
      return;
    }

    try {
      setBookingLoading(true);

      const bookingData = {
        serviceId: service._id,
        productId: service._id,
        productName: service.name,
        productPrice: calculateTotalPrice(),
        upfrontAmount: calculateUpfrontPayment(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        serviceBooking: {
          bookingDate: selectedDate.toISOString().split('T')[0],
          bookingTime: selectedTimeSlot.time,
          slotId: selectedTimeSlot.id,
          duration: service.bookingAvailability?.slotDurationMinutes || 60,
          notes: customerInfo.notes,
        },
        selectedSubServices: selectedSubServices,
        organizationId: service.organizationId,
        itemType: 'service',
      };

      const response = await ApiService.bookServiceSlot(bookingData);

      if (response.success) {
        setShowBookingModal(false);
        Alert.alert(
          'Booking Initiated',
          'Your service booking has been initiated. Please complete the payment to confirm your booking.',
          [
            {
              text: 'Complete Payment',
              onPress: () => navigation.navigate('ProductPaymentScreen', {
                bookingData: response.data,
                service: service,
                totalAmount: calculateUpfrontPayment(),
              }),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to book service');
      }
    } catch (error) {
      console.error('Error booking service:', error);
      Alert.alert('Error', 'Failed to book service. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return `₦${price?.toLocaleString() || '0'}`;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    const weeksAhead = service.bookingAvailability?.availabilityPeriod?.weeksAhead || 8;
    maxDate.setDate(maxDate.getDate() + (weeksAhead * 7));
    return maxDate;
  };

  const renderTimeSlot = (slot) => (
    <TouchableOpacity
      key={slot.id}
      style={[
        styles.timeSlot,
        selectedTimeSlot?.id === slot.id && styles.selectedTimeSlot,
        !slot.available && styles.unavailableTimeSlot,
      ]}
      onPress={() => slot.available && handleTimeSlotSelect(slot)}
      disabled={!slot.available}
    >
      <Text style={[
        styles.timeSlotText,
        selectedTimeSlot?.id === slot.id && styles.selectedTimeSlotText,
        !slot.available && styles.unavailableTimeSlotText,
      ]}>
        {slot.time}
      </Text>
      {!slot.available && (
        <Text style={styles.unavailableText}>Booked</Text>
      )}
    </TouchableOpacity>
  );

  const renderSubService = (subService) => (
    <TouchableOpacity
      key={subService._id}
      style={[
        styles.subServiceCard,
        selectedSubServices.find(s => s._id === subService._id) && styles.selectedSubServiceCard,
      ]}
      onPress={() => toggleSubService(subService)}
    >
      <View style={styles.subServiceHeader}>
        <View style={styles.subServiceInfo}>
          <Text style={styles.subServiceName}>{subService.name}</Text>
          <Text style={styles.subServiceDescription}>{subService.description}</Text>
        </View>
        <View style={styles.subServicePrice}>
          <Text style={styles.subServicePriceText}>{formatPrice(subService.price)}</Text>
          <View style={[
            styles.checkbox,
            selectedSubServices.find(s => s._id === subService._id) && styles.checkedBox,
          ]}>
            {selectedSubServices.find(s => s._id === subService._id) && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Service Info */}
        <View style={styles.serviceSection}>
          {service.imageUrl && (
            <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
          )}
          
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceProvider}>{service.producer}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            
            <View style={styles.serviceMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#7B2CBF" />
                <Text style={styles.metaText}>
                  {service.bookingAvailability?.slotDurationMinutes || 60} minutes
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#7B2CBF" />
                <Text style={styles.metaText}>
                  {service.totalAvailableServiceProviders || 1} provider{(service.totalAvailableServiceProviders || 1) > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sub-Services */}
        {service.subServices && service.subServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Services</Text>
            <Text style={styles.sectionSubtitle}>Select any additional services you'd like to include</Text>
            {service.subServices.map(renderSubService)}
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#7B2CBF" />
            <Text style={styles.dateSelectorText}>
              {selectedDate ? formatDate(selectedDate) : 'Choose a date'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            {loading ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color="#7B2CBF" />
                <Text style={styles.loadingText}>Loading available slots...</Text>
              </View>
            ) : availableSlots.length > 0 ? (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map(renderTimeSlot)}
              </View>
            ) : (
              <View style={styles.noSlotsContainer}>
                <Ionicons name="calendar-outline" size={32} color="#E5E7EB" />
                <Text style={styles.noSlotsText}>No available slots for this date</Text>
                <Text style={styles.noSlotsSubtext}>Please try selecting a different date</Text>
              </View>
            )}
          </View>
        )}

        {/* Pricing Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Service</Text>
              <Text style={styles.pricingValue}>{formatPrice(service.actualAmount || service.priceInDollars)}</Text>
            </View>
            
            {selectedSubServices.map(subService => (
              <View key={subService._id} style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{subService.name}</Text>
                <Text style={styles.pricingValue}>{formatPrice(subService.price)}</Text>
              </View>
            ))}
            
            <View style={styles.pricingDivider} />
            
            <View style={styles.pricingRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatPrice(calculateTotalPrice())}</Text>
            </View>
            
            {service.upfrontPaymentPercentage && service.upfrontPaymentPercentage < 100 && (
              <View style={styles.pricingRow}>
                <Text style={styles.upfrontLabel}>
                  Upfront Payment ({service.upfrontPaymentPercentage}%)
                </Text>
                <Text style={styles.upfrontValue}>{formatPrice(calculateUpfrontPayment())}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedDate || !selectedTimeSlot) && styles.disabledButton,
          ]}
          onPress={() => setShowBookingModal(true)}
          disabled={!selectedDate || !selectedTimeSlot}
        >
          <Text style={styles.bookButtonText}>
            Book for {formatPrice(calculateUpfrontPayment())}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateSelect}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={getMinDate()}
        maximumDate={getMaxDate()}
      />

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Information</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, name: text }))}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={customerInfo.email}
                  onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={customerInfo.phone}
                  onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any special requests or notes..."
                  value={customerInfo.notes}
                  onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Booking Summary */}
              <View style={styles.bookingSummary}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service:</Text>
                  <Text style={styles.summaryValue}>{service.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>{selectedDate ? formatDate(selectedDate) : ''}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>{selectedTimeSlot?.time || ''}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total:</Text>
                  <Text style={styles.summaryValue}>{formatPrice(calculateUpfrontPayment())}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleBookService}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  serviceSection: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  serviceInfo: {
    padding: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 16,
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
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
  subServiceCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedSubServiceCard: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F5F3FF',
  },
  subServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subServiceInfo: {
    flex: 1,
    marginRight: 16,
  },
  subServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subServiceDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  subServicePrice: {
    alignItems: 'flex-end',
    gap: 8,
  },
  subServicePriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  unavailableTimeSlot: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  unavailableTimeSlotText: {
    color: '#9CA3AF',
  },
  unavailableText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  pricingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    color: '#7B2CBF',
  },
  upfrontLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  upfrontValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalBody: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookingSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServiceBookingDetailsScreen;