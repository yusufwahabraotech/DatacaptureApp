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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ConfirmedDeliveriesScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConfirmedDeliveries();
  }, []);

  const fetchConfirmedDeliveries = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await ApiService.getConfirmedDeliveries();
      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch confirmed deliveries');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch confirmed deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleProcessRemittance = (order) => {
    navigation.navigate('ProcessRemittance', { order });
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.organizationName}>{item.organizationName}</Text>
          <Text style={styles.orderDate}>
            Confirmed: {item.deliveryConfirmation ? formatDate(item.deliveryConfirmation.confirmedAt) : 'N/A'}
          </Text>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>₦{item.totalAmountPaid?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Bank Details */}
      {item.organizationBankDetails ? (
        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>Organization Bank Details</Text>
          <View style={styles.bankDetails}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Bank:</Text>
              <Text style={styles.bankValue}>{item.organizationBankDetails.bankName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account:</Text>
              <Text style={styles.bankValue}>{item.organizationBankDetails.accountNumber}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Name:</Text>
              <Text style={styles.bankValue}>{item.organizationBankDetails.accountName}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Bank Details Missing</Text>
          <Text style={styles.warningText}>Organization has not registered bank details yet.</Text>
        </View>
      )}

      {/* Delivery Confirmation - Always show if order exists */}
      <View style={styles.deliverySection}>
        <Text style={styles.deliveryTitle}>Delivery Confirmation Details</Text>
        {item.deliveryConfirmation ? (
          <View style={styles.deliveryDetails}>
            <Text style={styles.deliveryMode}>
              Mode: {item.deliveryConfirmation.deliveryMode === 'pickup_center' ? 'Pickup Center' :
                     item.deliveryConfirmation.deliveryMode === 'shipping' ? 'Shipping' : 'Organization Location'}
            </Text>
            
            {item.deliveryConfirmation.deliveryAddress && (
              <Text style={styles.deliveryDetail}>
                Address: {item.deliveryConfirmation.deliveryAddress}
              </Text>
            )}
            
            {item.deliveryConfirmation.pickupCenterName && (
              <Text style={styles.deliveryDetail}>
                Pickup Center: {item.deliveryConfirmation.pickupCenterName}
              </Text>
            )}
            
            {item.deliveryConfirmation.imageComment && (
              <Text style={styles.deliveryDetail}>
                Comment: {item.deliveryConfirmation.imageComment}
              </Text>
            )}
            
            <View style={styles.mediaSection}>
              {item.deliveryConfirmation.productImageUrl && (
                <Text style={styles.deliveryImages}>✓ Product photo uploaded</Text>
              )}
              {item.deliveryConfirmation.representativeImageUrl && (
                <Text style={styles.deliveryImages}>✓ Representative photo uploaded</Text>
              )}
              {item.deliveryConfirmation.userImageUrl && (
                <Text style={styles.deliveryImages}>✓ Customer photo uploaded</Text>
              )}
              {item.deliveryConfirmation.videoUrl && (
                <Text style={styles.deliveryImages}>✓ Confirmation video uploaded</Text>
              )}
            </View>
            
            {item.deliveryConfirmation.satisfactionDeclaration && (
              <View style={styles.declarationSection}>
                <Text style={styles.declarationTitle}>Satisfaction Declaration:</Text>
                <Text style={styles.declarationText}>
                  {item.deliveryConfirmation.satisfactionDeclaration}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('DeliveryDetails', { 
                deliveryConfirmation: item.deliveryConfirmation,
                customerName: item.customerName,
                productName: item.productName
              })}
            >
              <Ionicons name="eye" size={16} color="#10B981" />
              <Text style={styles.viewDetailsText}>View Full Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noDeliveryData}>No delivery confirmation data available</Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          !item.organizationBankDetails && styles.processButtonDisabled
        ]}
        onPress={() => handleProcessRemittance(item)}
        disabled={!item.organizationBankDetails}
      >
        <Ionicons name="card" size={20} color="white" />
        <Text style={styles.processButtonText}>
          {item.organizationBankDetails ? 'Process Remittance' : 'Bank Details Required'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Confirmed Deliveries</Text>
      <Text style={styles.emptyMessage}>
        Orders with confirmed deliveries will appear here for remittance processing.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmed Deliveries</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading confirmed deliveries...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmed Deliveries</Text>
        <TouchableOpacity onPress={() => fetchConfirmedDeliveries(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchConfirmedDeliveries(true)} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  ordersList: {
    padding: 16,
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
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  bankSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  bankDetails: {
    gap: 4,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bankValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  deliverySection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  deliveryDetails: {
    gap: 4,
  },
  deliveryMode: {
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryImages: {
    fontSize: 12,
    color: '#10B981',
  },
  deliveryDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  mediaSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  declarationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
  },
  declarationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 6,
  },
  declarationText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  processButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  warningSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
  noDeliveryData: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
  },
});

export default ConfirmedDeliveriesScreen;