import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminPurchaseFlowScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Customer Selection State
  const [customerType, setCustomerType] = useState('existing');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // External Customer State
  const [externalCustomer, setExternalCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Purchase Details State
  const [quantity, setQuantity] = useState(1);
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Delivery Options State
  const [deliveryOption, setDeliveryOption] = useState('pickup_center');
  const [selectedPickupCenter, setSelectedPickupCenter] = useState(null);
  const [pickupCenters, setPickupCenters] = useState([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Payment Options State
  const [processPayment, setProcessPayment] = useState(true);

  useEffect(() => {
    loadOrganizationUsers();
    loadPickupCenters();
  }, []);

  const loadOrganizationUsers = async () => {
    try {
      const response = await ApiService.getAdminPurchaseOrganizationUsers(
        customerSearch,
        1,
        20
      );

      if (response.success) {
        setOrgUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading organization users:', error);
    }
  };

  const loadPickupCenters = async () => {
    try {
      const response = await ApiService.getAdminPurchasePickupCenters();

      if (response.success) {
        setPickupCenters(response.data.pickupCenters || []);
        if (response.data.pickupCenters.length > 0) {
          setSelectedPickupCenter(response.data.pickupCenters[0]);
        }
      }
    } catch (error) {
      console.error('Error loading pickup centers:', error);
    }
  };

  const handleCreatePurchase = async () => {
    try {
      setLoading(true);

      // Validate inputs
      if (customerType === 'existing' && !selectedCustomer) {
        Alert.alert('Customer Required', 'Please select a customer from your organization');
        return;
      }
      
      if (customerType === 'external') {
        if (!externalCustomer.name.trim() || !externalCustomer.email.trim()) {
          Alert.alert('Customer Details Required', 'Please enter customer name and email');
          return;
        }
      }

      if (quantity < 1) {
        Alert.alert('Invalid Quantity', 'Quantity must be at least 1');
        return;
      }

      if (deliveryOption === 'pickup_center' && !selectedPickupCenter) {
        Alert.alert('Pickup Center Required', 'Please select a pickup center');
        return;
      }

      if (deliveryOption === 'home_delivery' && !deliveryAddress.trim()) {
        Alert.alert('Delivery Address Required', 'Please enter a delivery address');
        return;
      }

      const purchasePayload = {
        productId: product.id,
        productName: product.name,
        productPrice: product.actualAmount || product.priceInDollars || 0,
        quantity,
        
        customerType,
        ...(customerType === 'existing' ? {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          customerPhone: selectedCustomer.phoneNumber,
        } : {
          customerName: externalCustomer.name,
          customerEmail: externalCustomer.email,
          customerPhone: externalCustomer.phone,
        }),
        
        deliveryOption,
        ...(deliveryOption === 'pickup_center' && {
          pickupCenterId: selectedPickupCenter.id,
        }),
        ...(deliveryOption === 'home_delivery' && {
          deliveryAddress,
        }),
        
        processPayment,
        paymentType: 'full',
        customerNotes,
      };

      const response = await ApiService.createAdminPurchase(purchasePayload);

      if (response.success) {
        if (processPayment && response.data.purchase.paymentLink) {
          // Navigate to payment screen
          navigation.navigate('AdminPurchasePaymentScreen', {
            purchase: response.data.purchase,
            paymentLink: response.data.purchase.paymentLink,
          });
        } else {
          // Navigate to success screen
          navigation.navigate('AdminPurchaseSuccess', {
            purchase: response.data.purchase,
          });
        }
      } else {
        Alert.alert('Purchase Failed', response.message || 'Failed to create purchase');
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      Alert.alert('Error', 'Failed to create purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const unitPrice = product.actualAmount || product.priceInDollars || 0;
    const subtotal = unitPrice * quantity;
    const deliveryFee = deliveryOption === 'pickup_center' && selectedPickupCenter 
      ? selectedPickupCenter.pricing || 0 
      : 0;
    return subtotal + deliveryFee;
  };

  const filteredOrgUsers = orgUsers.filter(user =>
    user.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedCustomer(item);
        setShowCustomerModal(false);
        setCustomerSearch('');
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemName}>{item.name}</Text>
        <Text style={styles.modalItemEmail}>{item.email}</Text>
        {item.customUserId && (
          <Text style={styles.modalItemId}>ID: {item.customUserId}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPickupCenterItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedPickupCenter(item);
        setShowPickupModal(false);
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemName}>{item.centerName}</Text>
        <Text style={styles.modalItemEmail}>{item.address}</Text>
        <Text style={styles.modalItemId}>Fee: ₦{item.pricing?.toLocaleString() || '0'}</Text>
        <Text style={styles.modalItemId}>{item.operatingHours}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.productSummary}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>₦{(product.actualAmount || product.priceInDollars || 0).toFixed(2)}</Text>
            <Text style={styles.productStock}>Available: {product.totalAvailableQuantity || 0}</Text>
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Customer</Text>
          <Text style={styles.sectionSubtitle}>Choose who this purchase is for</Text>
          
          <View style={styles.customerTypeContainer}>
            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'existing' && styles.customerTypeButtonActive,
              ]}
              onPress={() => setCustomerType('existing')}
            >
              <Text style={[
                styles.customerTypeText,
                customerType === 'existing' && styles.customerTypeTextActive,
              ]}>
                Organization User
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'external' && styles.customerTypeButtonActive,
              ]}
              onPress={() => setCustomerType('external')}
            >
              <Text style={[
                styles.customerTypeText,
                customerType === 'external' && styles.customerTypeTextActive,
              ]}>
                External Customer
              </Text>
            </TouchableOpacity>
          </View>

          {customerType === 'existing' ? (
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={[
                styles.dropdownText,
                !selectedCustomer && styles.placeholderText,
              ]}>
                {selectedCustomer ? selectedCustomer.name : 'Select organization user'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <View style={styles.externalCustomerForm}>
              <TextInput
                style={styles.input}
                placeholder="Customer Name *"
                value={externalCustomer.name}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, name: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Customer Email *"
                value={externalCustomer.email}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Customer Phone (Optional)"
                value={externalCustomer.phone}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, phone: text})}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </View>

        {/* Quantity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#7B2CBF" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color="#7B2CBF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          
          <View style={styles.deliveryOptions}>
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'pickup_center' && styles.deliveryOptionSelected,
              ]}
              onPress={() => setDeliveryOption('pickup_center')}
            >
              <View style={styles.deliveryOptionHeader}>
                <View style={[
                  styles.radioButton,
                  deliveryOption === 'pickup_center' && styles.radioButtonSelected,
                ]}>
                  {deliveryOption === 'pickup_center' && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.deliveryOptionTitle}>Pickup Center</Text>
              </View>
              <Text style={styles.deliveryOptionDescription}>
                Customer picks up from selected center
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'home_delivery' && styles.deliveryOptionSelected,
              ]}
              onPress={() => setDeliveryOption('home_delivery')}
            >
              <View style={styles.deliveryOptionHeader}>
                <View style={[
                  styles.radioButton,
                  deliveryOption === 'home_delivery' && styles.radioButtonSelected,
                ]}>
                  {deliveryOption === 'home_delivery' && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.deliveryOptionTitle}>Home Delivery</Text>
              </View>
              <Text style={styles.deliveryOptionDescription}>
                Deliver to customer's address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'merchant_pickup' && styles.deliveryOptionSelected,
              ]}
              onPress={() => setDeliveryOption('merchant_pickup')}
            >
              <View style={styles.deliveryOptionHeader}>
                <View style={[
                  styles.radioButton,
                  deliveryOption === 'merchant_pickup' && styles.radioButtonSelected,
                ]}>
                  {deliveryOption === 'merchant_pickup' && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.deliveryOptionTitle}>Merchant Pickup</Text>
              </View>
              <Text style={styles.deliveryOptionDescription}>
                Customer picks up from merchant location
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryOption === 'pickup_center' && (
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowPickupModal(true)}
            >
              <Text style={[
                styles.dropdownText,
                !selectedPickupCenter && styles.placeholderText,
              ]}>
                {selectedPickupCenter ? selectedPickupCenter.centerName : 'Select pickup center'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}

          {deliveryOption === 'home_delivery' && (
            <TextInput
              style={styles.textArea}
              placeholder="Enter delivery address..."
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Customer Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any special instructions or notes..."
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Unit Price:</Text>
            <Text style={styles.summaryValue}>
              ₦{(product.actualAmount || product.priceInDollars || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity:</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              ₦{((product.actualAmount || product.priceInDollars || 0) * quantity).toFixed(2)}
            </Text>
          </View>
          {deliveryOption === 'pickup_center' && selectedPickupCenter && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Fee:</Text>
              <Text style={styles.summaryValue}>
                ₦{(selectedPickupCenter.pricing || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₦{calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreatePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.createButtonText}>
                {processPayment ? 'Create Purchase & Process Payment' : 'Create Purchase'}
              </Text>
              <Ionicons name="bag" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>
          
          <FlatList
            data={filteredOrgUsers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </SafeAreaView>
      </Modal>

      {/* Pickup Center Selection Modal */}
      <Modal
        visible={showPickupModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Pickup Center</Text>
            <TouchableOpacity onPress={() => setShowPickupModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={pickupCenters}
            renderItem={renderPickupCenterItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  productSummary: {
    gap: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  customerTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  customerTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  customerTypeButtonActive: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  customerTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  customerTypeTextActive: {
    color: '#7B2CBF',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  externalCustomerForm: {
    gap: 12,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  deliveryOptions: {
    gap: 12,
    marginBottom: 16,
  },
  deliveryOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  deliveryOptionSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  deliveryOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#7B2CBF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  deliveryOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  deliveryOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemContent: {
    gap: 4,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItemEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalItemId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default AdminPurchaseFlowScreen;