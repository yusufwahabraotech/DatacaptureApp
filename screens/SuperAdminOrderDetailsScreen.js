import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import RoleGuard from '../components/RoleGuard';

const SuperAdminOrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSuperAdminOrderById(orderId);
      
      if (response.success) {
        setOrder(response.data.order);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch order details');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'successful': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="SUPER_ADMIN" navigation={navigation}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </View>
      </RoleGuard>
    );
  }

  if (!order) {
    return (
      <RoleGuard requiredRole="SUPER_ADMIN" navigation={navigation}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Order not found</Text>
          </View>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="SUPER_ADMIN" navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Order Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(order.orderStatus) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                  {order.orderStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.orderIdText}>Order ID: {order._id}</Text>
            <Text style={styles.dateText}>Created: {formatDate(order.createdAt)}</Text>
          </View>

          {/* Product Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product Name:</Text>
              <Text style={styles.infoValue}>{order.productName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organization:</Text>
              <Text style={styles.infoValue}>{order.organizationName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product Price:</Text>
              <Text style={styles.infoValue}>{formatCurrency(order.productPrice)}</Text>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{order.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{order.customerEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{order.customerPhone || 'Not provided'}</Text>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Summary</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Amount:</Text>
              <Text style={styles.infoValue}>{formatCurrency(order.productPrice)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={[styles.infoValue, { color: '#10B981' }]}>
                {formatCurrency(order.totalAmountPaid)}
              </Text>
            </View>
            {order.upfrontPercentage > 0 && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Upfront Percentage:</Text>
                  <Text style={styles.infoValue}>{order.upfrontPercentage}%</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Upfront Amount:</Text>
                  <Text style={styles.infoValue}>{formatCurrency(order.upfrontAmountPaid)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Remaining Balance:</Text>
                  <Text style={[styles.infoValue, { color: '#F59E0B' }]}>
                    {formatCurrency(order.upfrontRemainingBalance)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount Saved:</Text>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>
                    {formatCurrency(order.amountSavedByUpfront)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Payment History */}
          {order.payments && order.payments.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment History</Text>
              {order.payments.map((payment, index) => (
                <View key={index} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentNumber}>Payment #{payment.paymentNumber}</Text>
                    <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(payment.status) }]}>
                      <Text style={styles.paymentStatusText}>
                        {payment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentDetails}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Amount:</Text>
                      <Text style={styles.infoValue}>{formatCurrency(payment.amount)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Gateway:</Text>
                      <Text style={styles.infoValue}>{payment.paymentGateway}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Reference:</Text>
                      <Text style={styles.infoValue}>{payment.transactionReference}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Date:</Text>
                      <Text style={styles.infoValue}>{formatDate(payment.dateTime)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Order Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Timeline</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Created</Text>
                <Text style={styles.timelineDate}>{formatDate(order.createdAt)}</Text>
              </View>
            </View>
            {order.updatedAt !== order.createdAt && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Last Updated</Text>
                  <Text style={styles.timelineDate}>{formatDate(order.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </RoleGuard>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  orderIdText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentDetails: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default SuperAdminOrderDetailsScreen;