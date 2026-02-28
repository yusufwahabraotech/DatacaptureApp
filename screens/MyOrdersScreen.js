import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

const MyOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await ApiService.getMyOrders();
      
      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fully_paid':
        return '#4CAF50';
      case 'partially_paid':
        return '#FF9800';
      case 'pending':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'fully_paid':
        return 'Fully Paid';
      case 'partially_paid':
        return 'Partially Paid';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
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

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetails', { orderId: order._id });
  };

  const handlePayRemaining = (order) => {
    if (order.upfrontRemainingBalance > 0) {
      // Navigate to payment screen for remaining balance
      navigation.navigate('ProductPayment', {
        product: {
          id: order.productId,
          name: order.productName,
          pricing: {
            discountedPrice: order.upfrontRemainingBalance,
            upfrontPaymentPercentage: 0, // No upfront for remaining payment
          },
          location: {
            brandName: order.organizationName,
          },
          organizationId: order.organizationId,
        },
        paymentType: 'remaining',
      });
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.organizationName}>{item.organizationName}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
            <Text style={styles.statusText}>{getStatusText(item.orderStatus)}</Text>
          </View>
          {item.deliveryStatus === 'confirmed' && (
            <View style={[styles.statusBadge, { backgroundColor: '#10B981', marginTop: 4 }]}>
              <Text style={styles.statusText}>Delivery Confirmed</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Product Price:</Text>
            <Text style={styles.priceValue}>₦{item.productPrice?.toLocaleString()}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Amount Paid:</Text>
            <Text style={styles.pricePaid}>₦{(item.totalAmountPaid || 0).toLocaleString()}</Text>
          </View>
          
          {item.upfrontRemainingBalance > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Remaining Balance:</Text>
              <Text style={styles.priceRemaining}>₦{item.upfrontRemainingBalance?.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Payment History */}
        {item.payments && item.payments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentsTitle}>Payment History:</Text>
            {item.payments.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentNumber}>Payment #{payment.paymentNumber}</Text>
                  <Text style={styles.paymentDate}>{formatDate(payment.dateTime)}</Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentValue}>₦{payment.amount?.toLocaleString()}</Text>
                  <View style={[
                    styles.paymentStatusBadge,
                    { backgroundColor: payment.status === 'successful' ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.paymentStatusText}>{payment.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleOrderPress(item)}
          >
            <Ionicons name="eye" size={16} color="#7B2CBF" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          {item.orderStatus === 'partially_paid' && item.upfrontRemainingBalance > 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePayRemaining(item)}
            >
              <Ionicons name="card" size={16} color="white" />
              <Text style={styles.payButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          )}

          {item.orderStatus === 'fully_paid' && item.deliveryStatus !== 'confirmed' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => navigation.navigate('DeliveryConfirmation', { order: item })}
            >
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyMessage}>
        You haven't placed any orders yet. Start shopping to see your orders here.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('PublicProductSearch')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={() => fetchOrders(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <BottomNavigation navigation={navigation} activeTab="Orders" />
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
  ordersList: {
    padding: 16,
    paddingBottom: 100, // Add padding for bottom navigation
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderStatus: {
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
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  priceRemaining: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  paymentsSection: {
    marginBottom: 16,
  },
  paymentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentDate: {
    fontSize: 10,
    color: '#666',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: 10,
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
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  payButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  confirmButtonText: {
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  shopButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyOrdersScreen;