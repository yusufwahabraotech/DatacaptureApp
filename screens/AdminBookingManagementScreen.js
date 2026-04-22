import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const statusOptions = [
    { label: 'All Bookings', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Rescheduled', value: 'rescheduled' },
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStatus, selectedDate, searchQuery]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAdminBookings(1, 50);
      
      if (response.success) {
        setBookings(response.data.bookings || []);
      } else {
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.slotDateTime).toISOString().split('T')[0];
        return bookingDate === selectedDate;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customerName?.toLowerCase().includes(query) ||
        booking.serviceName?.toLowerCase().includes(query) ||
        booking.bookingId?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleBookingPress = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleStatusUpdate = async (bookingId, newStatus, rescheduleData = null) => {
    try {
      const response = await ApiService.updateAdminBookingStatus(bookingId, newStatus, rescheduleData);
      
      if (response.success) {
        Alert.alert('Success', 'Booking status updated successfully');
        loadBookings();
        setShowBookingModal(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6366F1';
      case 'cancelled': return '#EF4444';
      case 'rescheduled': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingItem}
      onPress={() => handleBookingPress(item)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>#{item.bookingId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.serviceName}>{item.serviceName}</Text>
      <Text style={styles.customerName}>{item.customerName}</Text>
      
      <View style={styles.bookingMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatDate(item.slotDateTime)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatTime(item.slotDateTime)}</Text>
        </View>
        {item.totalPersons > 1 && (
          <View style={styles.metaItem}>
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.totalPersons} persons</Text>
          </View>
        )}
      </View>
      
      {item.assignedProvider && (
        <View style={styles.providerInfo}>
          <Ionicons name="person-circle" size={14} color="#7B2CBF" />
          <Text style={styles.providerText}>{item.assignedProvider}</Text>
        </View>
      )}
      
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={14} color="#6B7280" />
        <Text style={styles.locationText}>
          {item.location?.type === 'merchant_location' ? 'Merchant Location' :
           item.location?.type === 'customer_address' ? 'Customer Address' :
           item.location?.type === 'new_address' ? 'Custom Address' :
           item.location?.type === 'whatsapp_location' ? 'WhatsApp Location' : 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Bookings Found</Text>
      <Text style={styles.emptyMessage}>
        {selectedStatus !== 'all' || selectedDate || searchQuery
          ? 'No bookings match your current filters'
          : 'No admin bookings have been created yet'}
      </Text>
      <TouchableOpacity
        style={styles.createBookingButton}
        onPress={() => navigation.navigate('GalleryManagement')}
      >
        <Text style={styles.createBookingButtonText}>Create New Booking</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Bookings</Text>
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
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Bookings</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Active Filters */}
      {(selectedStatus !== 'all' || selectedDate) && (
        <View style={styles.activeFilters}>
          {selectedStatus !== 'all' && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {statusOptions.find(s => s.value === selectedStatus)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedStatus('all')}>
                <Ionicons name="close" size={16} color="#7B2CBF" />
              </TouchableOpacity>
            </View>
          )}
          {selectedDate && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => setSelectedDate('')}>
                <Ionicons name="close" size={16} color="#7B2CBF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.bookingId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Bookings</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    selectedStatus === option.value && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus(option.value)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedStatus === option.value && styles.filterOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {selectedStatus === option.value && (
                    <Ionicons name="checkmark" size={20} color="#7B2CBF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedStatus('all');
                setSelectedDate('');
                setShowFilters(false);
              }}
            >
              <Text style={styles.clearFiltersButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          {selectedBooking && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.bookingDetailsContainer}>
                <Text style={styles.bookingDetailsTitle}>#{selectedBooking.bookingId}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.serviceName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedBooking.slotDateTime)} at {formatTime(selectedBooking.slotDateTime)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                    <Text style={styles.statusText}>{selectedBooking.status}</Text>
                  </View>
                </View>
                
                {selectedBooking.assignedProvider && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.assignedProvider}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>
                    {selectedBooking.location?.type === 'merchant_location' ? 'Merchant Location' :
                     selectedBooking.location?.type === 'customer_address' ? 'Customer Address' :
                     selectedBooking.location?.type === 'new_address' ? 'Custom Address' :
                     selectedBooking.location?.type === 'whatsapp_location' ? 'WhatsApp Location' : 'Unknown'}
                  </Text>
                </View>
                
                {selectedBooking.location?.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.location.address}</Text>
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {selectedBooking.status === 'confirmed' && (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleStatusUpdate(selectedBooking.bookingId, 'completed')}
                    >
                      <Text style={styles.actionButtonText}>Mark Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleStatusUpdate(selectedBooking.bookingId, 'cancelled')}
                    >
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  bookingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  providerText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  createBookingButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createBookingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#F3E8FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  filterOptionTextSelected: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
  dateInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  bookingDetailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  bookingDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: 'white',
  },
});

export default AdminBookingManagementScreen;