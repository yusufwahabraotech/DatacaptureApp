import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ApiService from '../services/api';

const ServiceBookingCalendarScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState('');

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: '#2196F3' },
    { value: 'completed', label: 'Completed', color: '#4CAF50' },
    { value: 'cancelled', label: 'Cancelled', color: '#F44336' },
    { value: 'rescheduled', label: 'Rescheduled', color: '#FF9800' },
  ];

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await ApiService.getServiceBookings(selectedDate);
      
      if (response.success) {
        setBookings(response.data.bookings || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedBooking) return;

    if (status === 'rescheduled') {
      setShowStatusModal(false);
      setShowRescheduleModal(true);
      return;
    }

    try {
      const response = await ApiService.updateBookingStatus(selectedBooking._id, status);
      
      if (response.success) {
        Alert.alert('Success', 'Booking status updated successfully');
        setShowStatusModal(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const handleReschedule = async () => {
    if (!newTime.trim()) {
      Alert.alert('Error', 'Please select a new time');
      return;
    }

    try {
      const response = await ApiService.updateBookingStatus(selectedBooking._id, 'rescheduled', {
        newDate: newDate.toISOString().split('T')[0],
        newTime: newTime.trim()
      });
      
      if (response.success) {
        Alert.alert('Success', 'Booking rescheduled successfully');
        setShowRescheduleModal(false);
        setSelectedBooking(null);
        setNewTime('');
        fetchBookings();
      } else {
        Alert.alert('Error', response.message || 'Failed to reschedule');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule booking');
    }
  };

  const formatTimeFromDate = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#666';
  };

  const formatTime = (timeString) => {
    return timeString || 'Time not specified';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = -7; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : 
               i === 1 ? 'Tomorrow' : 
               i === -1 ? 'Yesterday' :
               date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return dates;
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.bookingTime}>{formatTime(item.bookingTime)}</Text>
          <Text style={styles.bookingDuration}>
            Duration: {item.bookingDuration || 'Not specified'} minutes
          </Text>
        </View>
        
        <View style={styles.bookingStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.bookingStatus) }]}>
            <Text style={styles.statusText}>
              {item.bookingStatus?.toUpperCase() || 'SCHEDULED'}
            </Text>
          </View>
          <View style={[styles.paymentStatusBadge, { 
            backgroundColor: item.paymentStatus === 'completed' ? '#4CAF50' : '#FF9800',
            marginTop: 4 
          }]}>
            <Text style={styles.statusText}>
              {item.paymentStatus?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        {/* Customer Contact Information */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Text style={styles.customerEmail}>{item.customerEmail}</Text>
          {item.customerPhone && (
            <Text style={styles.customerPhone}>📞 {item.customerPhone}</Text>
          )}
        </View>

        {/* Booking Location */}
        {item.bookingLocation && (
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Booking Location</Text>
            <Text style={styles.locationType}>
              Type: {item.bookingLocation.type === 'new_address' ? 'Customer Address' : 
                     item.bookingLocation.type === 'organization_location' ? 'Organization Location' : 
                     'Other Location'}
            </Text>
            {item.bookingLocation.address && (
              <Text style={styles.locationAddress}>📍 {item.bookingLocation.address}</Text>
            )}
          </View>
        )}

        {/* Booked Persons */}
        {item.bookedForPersons && item.bookedForPersons.length > 0 && (
          <View style={styles.personsSection}>
            <Text style={styles.sectionTitle}>Booked For ({item.bookedForPersons.length} person{item.bookedForPersons.length > 1 ? 's' : ''})</Text>
            {item.bookedForPersons.map((person, index) => (
              <View key={index} style={styles.personItem}>
                <Text style={styles.personName}>
                  {person.name} {person.isMainBooker ? '(Main Booker)' : ''}
                </Text>
                {person.email && (
                  <Text style={styles.personEmail}>{person.email}</Text>
                )}
                {person.slotDateTime && (
                  <Text style={styles.personSlot}>
                    Slot: {new Date(person.slotDateTime).toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Booking Notes */}
        {item.bookingNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Booking Notes</Text>
            <Text style={styles.bookingNotes}>{item.bookingNotes}</Text>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount:</Text>
            <Text style={styles.priceValue}>₦{item.totalAmount?.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Amount Paid:</Text>
            <Text style={styles.pricePaid}>₦{item.paidAmount?.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Payment Status:</Text>
            <Text style={[styles.paymentStatusText, { 
              color: item.paymentStatus === 'completed' ? '#4CAF50' : '#FF9800' 
            }]}>
              {item.paymentStatus?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
          >
            <Ionicons name="eye" size={16} color="#7B2CBF" />
            <Text style={styles.viewButtonText}>View Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => {
              setSelectedBooking(item);
              setShowStatusModal(true);
            }}
          >
            <Ionicons name="create" size={16} color="white" />
            <Text style={styles.statusButtonText}>Update Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Bookings</Text>
      <Text style={styles.emptyMessage}>
        No service bookings found for {formatDate(selectedDate)}.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Bookings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Bookings</Text>
        <TouchableOpacity onPress={() => fetchBookings(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateContainer}>
        <FlatList
          horizontal
          data={generateDateOptions()}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.dateChip,
                selectedDate === item.value && styles.activeDateChip
              ]}
              onPress={() => setSelectedDate(item.value)}
            >
              <Text style={[
                styles.dateText,
                selectedDate === item.value && styles.activeDateText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
      </View>

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
        <Text style={styles.bookingCount}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id || `${item.orderId}-${item.serviceBooking?.bookingDate}`}
        contentContainerStyle={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Booking Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.bookingInfo}>
                <Text style={styles.modalBookingName}>{selectedBooking.productName}</Text>
                <Text style={styles.modalCustomerName}>{selectedBooking.customerName}</Text>
                <Text style={styles.modalBookingTime}>
                  {formatTime(selectedBooking.bookingTime)}
                </Text>
              </View>
            )}

            <View style={styles.statusOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.statusOption, { borderColor: option.color }]}
                  onPress={() => handleStatusUpdate(option.value)}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: option.color }]} />
                  <Text style={styles.statusOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Booking</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.bookingInfo}>
                <Text style={styles.modalBookingName}>{selectedBooking.productName}</Text>
                <Text style={styles.modalCustomerName}>{selectedBooking.customerName}</Text>
                <Text style={styles.modalBookingTime}>
                  Current: {formatTime(selectedBooking.bookingTime)}
                </Text>
              </View>
            )}

            <View style={styles.rescheduleForm}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#7B2CBF" />
                <Text style={styles.dateTimeText}>
                  {newDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#7B2CBF" />
                <Text style={styles.dateTimeText}>
                  {newTime || 'Select new time'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rescheduleButton}
                onPress={handleReschedule}
              >
                <Text style={styles.rescheduleButtonText}>Reschedule Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setNewDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={(time) => {
          setNewTime(formatTimeFromDate(time));
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateList: {
    paddingHorizontal: 16,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    marginRight: 8,
  },
  activeDateChip: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  activeDateText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingCount: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  bookingsList: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentStatusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bookingDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  customerSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  customerEmail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  locationSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  personsSection: {
    backgroundColor: '#F5F5DC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  personItem: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  personName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  personEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  personSlot: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  notesSection: {
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bookingNotes: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  priceSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pricePaid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  viewButtonText: {
    color: '#7B2CBF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
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
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBookingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalCustomerName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  modalBookingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  rescheduleForm: {
    gap: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  rescheduleButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  rescheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServiceBookingCalendarScreen;