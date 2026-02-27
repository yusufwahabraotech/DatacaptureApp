import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      // Check if this is being accessed from organization context
      const isAdminContext = route.name === 'OrganizationOrderDetails';
      
      let response;
      if (isAdminContext) {
        response = await ApiService.getAdminOrderById(orderId);
      } else {
        response = await ApiService.getOrderById(orderId);
      }
      
      if (response.success) {
        setOrder(response.data.order);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to fetch order details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePayRemaining = () => {
    if (order.upfrontRemainingBalance > 0) {
      navigation.navigate('ProductPayment', {
        product: {
          id: order.productId,
          name: order.productName,
          pricing: {
            discountedPrice: order.upfrontRemainingBalance,
            upfrontPaymentPercentage: 0,
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

  const handleContactSeller = () => {
    Alert.alert(
      'Contact Seller',
      'Contact information will be available soon.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>Order not found</Text>
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
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Order Status */}
        <View style={styles.section}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) }]}>
              <Text style={styles.statusText}>{getStatusText(order.orderStatus)}</Text>
            </View>
          </View>
          
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderIdValue}>{order._id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          
          {order.updatedAt !== order.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(order.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <View style={styles.productCard}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.organizationName}>{order.organizationName}</Text>
            
            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Product Price:</Text>
                <Text style={styles.priceValue}>₦{order.productPrice?.toLocaleString()}</Text>
              </View>
              
              {order.upfrontPercentage > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Upfront Percentage:</Text>
                  <Text style={styles.priceValue}>{order.upfrontPercentage}%</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.paymentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount Paid:</Text>
              <Text style={styles.summaryPaid}>₦{order.totalAmountPaid?.toLocaleString()}</Text>
            </View>
            
            {order.upfrontRemainingBalance > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                <Text style={styles.summaryRemaining}>₦{order.upfrontRemainingBalance?.toLocaleString()}</Text>
              </View>
            )}
            
            {order.amountSavedByUpfront > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Saved:</Text>
                <Text style={styles.summarySaved}>₦{order.amountSavedByUpfront?.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment History */}
        {order.payments && order.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            
            {order.payments.map((payment, index) => (
              <View key={index} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
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
                
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Gateway:</Text>
                    <Text style={styles.paymentDetailValue}>{payment.paymentGateway}</Text>
                  </View>
                  
                  {payment.transactionReference && (
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentDetailLabel}>Reference:</Text>
                      <Text style={styles.paymentDetailValue}>{payment.transactionReference}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{order.customerName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{order.customerEmail}</Text>
            </View>
            
            {order.customerPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{order.customerPhone}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
        {order.orderStatus === 'partially_paid' && order.upfrontRemainingBalance > 0 && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayRemaining}
          >
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.payButtonText}>
              Pay Remaining ₦{order.upfrontRemainingBalance?.toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactSeller}
        >
          <Ionicons name="chatbubble" size={20} color="#7B2CBF" />
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 16,
    color: '#7B2CBF',
    marginBottom: 16,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
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
  paymentSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryPaid: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  summarySaved: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B2CBF',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  paymentStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: '#666',
  },
  paymentDetailValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  customerInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  bottomSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  contactButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetailsScreen;