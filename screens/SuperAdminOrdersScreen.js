import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import RoleGuard from '../components/RoleGuard';

const SuperAdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllPlatformOrders(currentPage, 20);
      
      if (response.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalOrders(response.data.totalOrders || 0);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId) => {
    navigation.navigate('SuperAdminOrderDetails', { orderId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'partially_paid': return '#3B82F6';
      case 'fully_paid': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'pending': return '#FEF3C7';
      case 'partially_paid': return '#DBEAFE';
      case 'fully_paid': return '#D1FAE5';
      case 'cancelled': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order =>
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard requiredRole="SUPER_ADMIN" navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Platform Orders</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {filteredOrders.filter(o => o.orderStatus === 'fully_paid').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {filteredOrders.filter(o => o.orderStatus === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Orders List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery ? 'No orders match your search criteria.' : 'No orders have been placed yet.'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order._id)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.productName}>{order.productName}</Text>
                    <Text style={styles.organizationName}>{order.organizationName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(order.orderStatus) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                      {order.orderStatus.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.customerInfo}>
                    <Ionicons name="person" size={16} color="#6B7280" />
                    <Text style={styles.customerText}>{order.customerName}</Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Ionicons name="mail" size={16} color="#6B7280" />
                    <Text style={styles.customerText}>{order.customerEmail}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>Total: {formatCurrency(order.productPrice)}</Text>
                    <Text style={styles.paidLabel}>Paid: {formatCurrency(order.totalAmountPaid)}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                </View>

                {order.upfrontPercentage > 0 && (
                  <View style={styles.upfrontInfo}>
                    <Text style={styles.upfrontText}>
                      Upfront: {order.upfrontPercentage}% ({formatCurrency(order.upfrontAmountPaid)})
                    </Text>
                    <Text style={styles.remainingText}>
                      Remaining: {formatCurrency(order.upfrontRemainingBalance)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#9CA3AF" : "#7C3AED"} />
              </TouchableOpacity>
              
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#9CA3AF" : "#7C3AED"} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paidLabel: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  upfrontInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  upfrontText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  remainingText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
  },
});

export default SuperAdminOrdersScreen;