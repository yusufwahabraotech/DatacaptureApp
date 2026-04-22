import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AdminPurchaseSuccessScreen = ({ navigation, route }) => {
  const { purchase } = route.params;

  const handleViewPurchases = () => {
    navigation.navigate('AdminPurchaseManagement');
  };

  const handleCreateAnother = () => {
    navigation.navigate('AdminGalleryItems');
  };

  const getDeliveryOptionLabel = (deliveryOption) => {
    switch (deliveryOption) {
      case 'pickup_center': return 'Pickup Center';
      case 'home_delivery': return 'Home Delivery';
      case 'merchant_pickup': return 'Merchant Pickup';
      default: return 'Unknown';
    }
  };

  const renderInfoRow = (label, value, icon) => (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={16} color="#7B2CBF" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Created</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="bag" size={48} color="white" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Purchase Created Successfully!</Text>
        <Text style={styles.successMessage}>
          The admin purchase has been created and {purchase.paymentLink ? 'payment is being processed' : 'is ready for fulfillment'}.
        </Text>

        {/* Purchase Details */}
        <View style={styles.purchaseDetails}>
          <Text style={styles.detailsTitle}>Purchase Details</Text>
          
          {purchase.orderId && renderInfoRow('Order ID', purchase.orderId, 'receipt')}
          {renderInfoRow('Status', purchase.status || 'Confirmed', 'checkmark-circle')}
          {renderInfoRow('Quantity', purchase.quantity?.toString() || '1', 'cube')}
          {purchase.totalAmount && renderInfoRow('Total Amount', `₦${purchase.totalAmount.toFixed(2)}`, 'cash')}
          {renderInfoRow('Delivery', getDeliveryOptionLabel(purchase.deliveryOption), 'location')}
          
          {purchase.pickupCenter && (
            <>
              {renderInfoRow('Pickup Center', purchase.pickupCenter.name, 'storefront')}
              {renderInfoRow('Center Address', purchase.pickupCenter.address, 'home')}
            </>
          )}
        </View>

        {/* Payment Information */}
        {purchase.paymentLink && (
          <View style={styles.paymentInfo}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card" size={20} color="#F59E0B" />
              <Text style={styles.paymentTitle}>Payment Processing</Text>
            </View>
            <Text style={styles.paymentMessage}>
              The customer will receive a payment link to complete the transaction.
            </Text>
            {purchase.amount && (
              <Text style={styles.paymentAmount}>
                Amount: ₦{purchase.amount.toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {/* No Payment Information */}
        {!purchase.paymentLink && (
          <View style={styles.noPaymentInfo}>
            <View style={styles.noPaymentHeader}>
              <Ionicons name="business" size={20} color="#10B981" />
              <Text style={styles.noPaymentTitle}>Internal Purchase</Text>
            </View>
            <Text style={styles.noPaymentMessage}>
              This purchase was created without payment processing. The product can be prepared for delivery.
            </Text>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                {purchase.paymentLink 
                  ? 'Customer will receive payment notification'
                  : 'Prepare product for delivery/pickup'}
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Track purchase status in the Admin Purchase Management section
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                {purchase.deliveryOption === 'pickup_center' 
                  ? 'Coordinate with pickup center for delivery'
                  : purchase.deliveryOption === 'home_delivery'
                  ? 'Arrange home delivery to customer'
                  : 'Notify customer for merchant pickup'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewPurchases}
        >
          <Ionicons name="list" size={20} color="#7B2CBF" />
          <Text style={styles.secondaryButtonText}>View All Purchases</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateAnother}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Create Another Purchase</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  purchaseDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  paymentInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  paymentMessage: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  noPaymentInfo: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  noPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
  noPaymentMessage: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  nextSteps: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminPurchaseSuccessScreen;