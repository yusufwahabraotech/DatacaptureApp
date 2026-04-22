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

const AdminPurchaseManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const statusOptions = [
    { label: 'All Purchases', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [purchases, selectedStatus, selectedDate, searchQuery]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAdminPurchases(1, 50);
      
      if (response.success) {
        setPurchases(response.data.purchases || []);
      } else {
        Alert.alert('Error', 'Failed to load purchases');
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      Alert.alert('Error', 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  };

  const filterPurchases = () => {
    let filtered = [...purchases];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === selectedStatus);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(purchase => {
        const purchaseDate = new Date(purchase.createdAt).toISOString().split('T')[0];
        return purchaseDate === selectedDate;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.customerName?.toLowerCase().includes(query) ||
        purchase.productName?.toLowerCase().includes(query) ||
        purchase.orderId?.toLowerCase().includes(query)
      );
    }

    setFilteredPurchases(filtered);
  };

  const handlePurchasePress = (purchase) => {
    setSelectedPurchase(purchase);
    setShowPurchaseModal(true);
  };

  const handleStatusUpdate = async (orderId, newStatus, trackingNumber = '', adminNotes = '') => {
    try {
      const response = await ApiService.updateAdminPurchaseStatus(orderId, {
        status: newStatus,
        trackingNumber,
        adminNotes,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Purchase status updated successfully');
        loadPurchases();
        setShowPurchaseModal(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update purchase status');
      }
    } catch (error) {
      console.error('Error updating purchase status:', error);
      Alert.alert('Error', 'Failed to update purchase status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDeliveryOptionLabel = (deliveryOption) => {
    switch (deliveryOption) {
      case 'pickup_center': return 'Pickup Center';
      case 'home_delivery': return 'Home Delivery';
      case 'merchant_pickup': return 'Merchant Pickup';
      default: return 'Unknown';
    }
  };

  const renderPurchaseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.purchaseItem}
      onPress={() => handlePurchasePress(item)}
    >
      <View style={styles.purchaseHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.productName}</Text>
      <Text style={styles.customerName}>{item.customerName}</Text>
      
      <View style={styles.purchaseMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="cube" size={14} color="#6B7280" />
          <Text style={styles.metaText}>Qty: {item.quantity}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash" size={14} color="#6B7280" />
          <Text style={styles.metaText}>₦{item.totalAmount?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      
      <View style={styles.deliveryInfo}>
        <Ionicons name="location" size={14} color="#7B2CBF" />
        <Text style={styles.deliveryText}>
          {getDeliveryOptionLabel(item.deliveryOption)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Purchases Found</Text>
      <Text style={styles.emptyMessage}>
        {selectedStatus !== 'all' || selectedDate || searchQuery
          ? 'No purchases match your current filters'
          : 'No admin purchases have been created yet'}
      </Text>
      <TouchableOpacity
        style={styles.createPurchaseButton}
        onPress={() => navigation.navigate('AdminGalleryItems')}
      >
        <Text style={styles.createPurchaseButtonText}>Browse Products</Text>
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
          <Text style={styles.headerTitle}>Admin Purchases</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading purchases...</Text>
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
        <Text style={styles.headerTitle}>Admin Purchases</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search purchases..."
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

      {/* Purchases List */}
      <FlatList
        data={filteredPurchases}
        renderItem={renderPurchaseItem}
        keyExtractor={(item) => item.orderId}
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
            <Text style={styles.modalTitle}>Filter Purchases</Text>
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

      {/* Purchase Details Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Purchase Details</Text>
            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          {selectedPurchase && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.purchaseDetailsContainer}>
                <Text style={styles.purchaseDetailsTitle}>#{selectedPurchase.orderId}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product:</Text>
                  <Text style={styles.detailValue}>{selectedPurchase.productName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedPurchase.customerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{selectedPurchase.quantity}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>₦{selectedPurchase.totalAmount?.toFixed(2) || '0.00'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPurchase.status) }]}>
                    <Text style={styles.statusText}>{selectedPurchase.status}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery:</Text>
                  <Text style={styles.detailValue}>
                    {getDeliveryOptionLabel(selectedPurchase.deliveryOption)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPurchase.createdAt)}</Text>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {selectedPurchase.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(selectedPurchase.orderId, 'processing')}
                  >
                    <Text style={styles.actionButtonText}>Mark Processing</Text>
                  </TouchableOpacity>
                )}
                {selectedPurchase.status === 'processing' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(selectedPurchase.orderId, 'shipped')}
                  >
                    <Text style={styles.actionButtonText}>Mark Shipped</Text>
                  </TouchableOpacity>
                )}
                {selectedPurchase.status === 'shipped' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(selectedPurchase.orderId, 'delivered')}
                  >
                    <Text style={styles.actionButtonText}>Mark Delivered</Text>
                  </TouchableOpacity>
                )}
                {['confirmed', 'processing'].includes(selectedPurchase.status) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleStatusUpdate(selectedPurchase.orderId, 'cancelled')}
                  >
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Purchase</Text>
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
  purchaseItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
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
  productName: {
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
  purchaseMeta: {
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
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
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
  createPurchaseButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createPurchaseButtonText: {
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
  purchaseDetailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  purchaseDetailsTitle: {
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

export default AdminPurchaseManagementScreen;