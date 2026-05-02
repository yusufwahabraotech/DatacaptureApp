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
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

  // Helper function to determine booking source
  const getBookingSource = (booking) => {
    // Check multiple indicators to determine booking source
    if (booking.bookedByAdmin === true) {
      return 'admin';
    }
    if (booking.bookedByAdmin === false) {
      return 'customer';
    }
    // Fallback: check if there's a userId (customer booking) vs no userId (admin booking)
    if (booking.userId) {
      return 'customer';
    }
    // Another fallback: check booking method or source
    if (booking.bookingSource === 'admin' || booking.createdBy === 'admin') {
      return 'admin';
    }
    // Default to customer if uncertain
    return 'customer';
  };

  const statusOptions = [
    { label: 'All Bookings', value: 'all' },
    { label: 'Scheduled', value: 'scheduled' },
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

  const loadBookings = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await ApiService.getAdminBookings(page, 20, selectedStatus !== 'all' ? selectedStatus : null, selectedDate || null);
      
      if (response.success) {
        const newBookings = response.data.bookings || [];
        
        if (append && page > 1) {
          setBookings(prev => [...prev, ...newBookings]);
        } else {
          setBookings(newBookings);
        }
        
        setPagination({
          page: response.data.pagination?.page || page,
          limit: response.data.pagination?.limit || 20,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.total || newBookings.length
        });
      } else {
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings(1, false);
    setRefreshing(false);
  };

  const loadMoreBookings = () => {
    if (!loadingMore && pagination.page < pagination.totalPages) {
      loadBookings(pagination.page + 1, true);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.bookingStatus === selectedStatus);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate).toISOString().split('T')[0];
        return bookingDate === selectedDate;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer?.name?.toLowerCase().includes(query) ||
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
      case 'scheduled': return '#10B981';
      case 'confirmed': return '#059669';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6366F1';
      case 'cancelled': return '#EF4444';
      case 'rescheduled': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderBookingItem = ({ item }) => {
    // Debug: Log booking data to understand the structure
    console.log('🚨 BOOKING ITEM DEBUG 🚨');
    console.log('Booking ID:', item.bookingId);
    console.log('bookedByAdmin field:', item.bookedByAdmin);
    console.log('bookedByAdmin type:', typeof item.bookedByAdmin);
    console.log('Full item keys:', Object.keys(item));
    
    // Create combined date-time for display
    const combinedDateTime = new Date(`${item.bookingDate.split('T')[0]}T${item.bookingTime}:00`);
    
    return (
      <TouchableOpacity
        style={styles.bookingItem}
        onPress={() => handleBookingPress(item)}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingIdContainer}>
            <Text style={styles.bookingId}>#{item.bookingId}</Text>
            {/* Show badge based on booking source */}
            {getBookingSource(item) === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {getBookingSource(item) === 'customer' && (
              <View style={styles.customerBadge}>
                <Text style={styles.customerBadgeText}>Customer</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.bookingStatus) }]}>
            <Text style={styles.statusText}>{item.bookingStatus}</Text>
          </View>
        </View>
        
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.customerName}>{item.customer?.name}</Text>
        
        <View style={styles.bookingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(item.bookingDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.bookingTime}</Text>
          </View>
          {item.totalPersons > 1 && (
            <View style={styles.metaItem}>
              <Ionicons name="people" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.totalPersons} persons</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="cash" size={14} color="#6B7280" />
            <Text style={styles.metaText}>₦{item.totalAmount?.toLocaleString()}</Text>
          </View>
        </View>
        
        {item.assignedProviders && item.assignedProviders.length > 0 && (
          <View style={styles.providerInfo}>
            <Ionicons name="person-circle" size={14} color="#7B2CBF" />
            <Text style={styles.providerText}>{item.assignedProviders[0].name}</Text>
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
        
        {item.taskId && (
          <View style={styles.taskInfo}>
            <Ionicons name="clipboard" size={14} color="#6B7280" />
            <Text style={styles.taskText}>Task: {item.taskId}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Showing {filteredBookings.length} of {pagination.total} bookings
            {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
          </Text>
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
        onEndReached={loadMoreBookings}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#7B2CBF" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            );
          }
          return null;
        }}
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
                  <Text style={styles.detailValue}>{selectedBooking.customer?.name}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customer?.email}</Text>
                </View>
                
                {selectedBooking.customer?.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.customer.phone}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedBooking.bookingDate)} at {selectedBooking.bookingTime}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.duration} minutes</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Persons:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.totalPersons}</Text>
                </View>
                
                {selectedBooking.customer?.customUserId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer ID:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.customer.customUserId}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booked By:</Text>
                  <Text style={styles.detailValue}>
                    {getBookingSource(selectedBooking) === 'admin' ? 'Admin' : 'Customer'}
                  </Text>
                </View>
                
                {selectedBooking.taskId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Task ID:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.taskId}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Status:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.orderStatus}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.bookingStatus) }]}>
                    <Text style={styles.statusText}>{selectedBooking.bookingStatus}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Status:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.paymentStatus}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>₦{selectedBooking.totalAmount?.toLocaleString()}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid:</Text>
                  <Text style={styles.detailValue}>₦{selectedBooking.amountPaid?.toLocaleString()}</Text>
                </View>
                
                {selectedBooking.assignedProviders && selectedBooking.assignedProviders.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.assignedProviders[0].name}</Text>
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
                
                {selectedBooking.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.notes}</Text>
                  </View>
                )}
                
                {selectedBooking.bookedForPersons && selectedBooking.bookedForPersons.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Booked For Persons:</Text>
                    {selectedBooking.bookedForPersons.map((person, index) => (
                      <View key={index} style={styles.personCard}>
                        <Text style={styles.personName}>{person.name}</Text>
                        <Text style={styles.personEmail}>{person.email}</Text>
                        {person.slotDateTime && (
                          <Text style={styles.personSlot}>
                            Slot: {formatDate(person.slotDateTime)} at {formatTime(person.slotDateTime)}
                          </Text>
                        )}
                        {person.notes && (
                          <Text style={styles.personNotes}>Notes: {person.notes}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {selectedBooking.bookingStatus === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(selectedBooking.bookingId, 'completed')}
                  >
                    <Text style={styles.actionButtonText}>Mark Completed</Text>
                  </TouchableOpacity>
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
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  customerBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taskText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paginationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paginationText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  personCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  personEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  personSlot: {
    fontSize: 12,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  personNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default AdminBookingManagementScreen;