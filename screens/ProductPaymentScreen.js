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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ApiService from '../services/api';

const ProductPaymentScreen = ({ navigation, route }) => {
  const { product, paymentType: routePaymentType, existingOrderId, originalOrder } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState(routePaymentType || 'full');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [user, setUser] = useState(null);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    
    // COMPREHENSIVE DEBUG LOGGING
    console.log('🚨🚨🚨 PRODUCT PAYMENT SCREEN MOUNTED 🚨🚨🚨');
    console.log('Route params received:', JSON.stringify(route.params, null, 2));
    console.log('existingOrderId value:', existingOrderId);
    console.log('existingOrderId type:', typeof existingOrderId);
    console.log('existingOrderId is undefined?', existingOrderId === undefined);
    console.log('existingOrderId is null?', existingOrderId === null);
    console.log('originalOrder:', originalOrder);
    console.log('paymentType:', routePaymentType);
    
    // Log the existingOrderId for debugging
    if (existingOrderId) {
      console.log('✅ EXISTING ORDER ID RECEIVED ✅');
      console.log('Existing Order ID:', existingOrderId);
      console.log('Original Order:', JSON.stringify(originalOrder, null, 2));
    } else {
      console.log('❌ NO EXISTING ORDER ID - This is a NEW order');
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
        setCustomerInfo({
          name: response.data.user.fullName || '',
          email: response.data.user.email || '',
          phone: response.data.user.phone || '',
        });
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const calculatePaymentAmount = () => {
    const basePrice = product.pricing?.discountedPrice || product.pricing?.originalPrice || 0;
    const upfrontPercentage = product.pricing?.upfrontPaymentPercentage || 50;
    const subServicesTotal = selectedSubServices.reduce((sum, service) => sum + (service.price || 0), 0);
    
    console.log('🚨 PAYMENT CALCULATION DEBUG 🚨');
    console.log('paymentType:', paymentType);
    console.log('routePaymentType:', routePaymentType);
    console.log('basePrice:', basePrice);
    console.log('upfrontPercentage:', upfrontPercentage);
    console.log('subServicesTotal:', subServicesTotal);
    
    let mainAmount;
    
    // For remaining payments, use the exact price passed from MyOrdersScreen
    // which is already the remaining balance (order.upfrontRemainingBalance)
    if (paymentType === 'remaining') {
      mainAmount = basePrice; // basePrice IS the remaining balance for 'remaining' type
      console.log('✅ REMAINING PAYMENT - Using exact remaining balance:', mainAmount);
    } else if (paymentType === 'upfront') {
      mainAmount = Math.round(basePrice * (upfrontPercentage / 100));
      console.log('✅ UPFRONT PAYMENT - Calculated:', mainAmount);
    } else {
      // Full payment
      mainAmount = basePrice;
      console.log('✅ FULL PAYMENT - Using base price:', mainAmount);
    }
    
    const totalAmount = mainAmount + subServicesTotal;
    console.log('✅ TOTAL AMOUNT TO PAY:', totalAmount);
    
    return totalAmount;
  };

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      Alert.alert('Error', 'Please fill in your name and email address');
      return;
    }

    // Check if service requires booking details
    if (product.itemType === 'service') {
      if (!bookingDate) {
        Alert.alert('Error', 'Please select a booking date for this service');
        return;
      }
      if (!bookingTime) {
        Alert.alert('Error', 'Please select a booking time for this service');
        return;
      }
    }

    setLoading(true);
    try {
      // Debug product object
      console.log('🚨 PRODUCT OBJECT DEBUG 🚨');
      console.log('Full product object:', JSON.stringify(product, null, 2));
      
      const organizationId = product.organizationId || 
                            product.serviceProvider?.organizationId || 
                            product.location?.organizationId;
      
      console.log('🚨 ORGANIZATION ID DEBUG 🚨');
      console.log('Found organizationId:', organizationId);

      console.log('🚨 PAYMENT DATA CONSTRUCTION 🚨');
      console.log('existingOrderId from state:', existingOrderId);
      console.log('existingOrderId type:', typeof existingOrderId);
      console.log('Will include existingOrderId?', !!existingOrderId);

      const paymentData = {
        productId: product.id || product._id,
        productName: product.name || product.title,
        organizationId: product.organizationId,
        organizationName: product.location?.brandName || product.serviceProvider?.organizationName || 'Unknown Organization',
        productPrice: product.pricing?.discountedPrice || product.pricing?.originalPrice || 0,
        upfrontPercentage: product.pricing?.upfrontPaymentPercentage || 50,
        userId: user?._id || user?.id,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        paymentType: paymentType,
        itemType: product.itemType,
        platform: 'mobile', // Add platform parameter for mobile payments
        ...(existingOrderId && { existingOrderId: existingOrderId }), // ✅ Include existingOrderId for partial payments
        ...(selectedSubServices.length > 0 && { subServices: selectedSubServices }),
        ...(product.itemType === 'service' && {
          bookingDate: bookingDate,
          bookingTime: bookingTime
        }),
      };

      console.log('🚨 FINAL PAYMENT DATA 🚨');
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      console.log('Payment data keys:', Object.keys(paymentData));
      console.log('existingOrderId in paymentData?', 'existingOrderId' in paymentData);
      console.log('paymentData.existingOrderId value:', paymentData.existingOrderId);
      
      if (existingOrderId) {
        console.log('✅✅✅ COMPLETING PARTIAL PAYMENT - existingOrderId included:', existingOrderId);
      } else {
        console.log('❌❌❌ NO existingOrderId - This will be treated as NEW order');
      }

      const response = await ApiService.initiateProductPayment(paymentData);
      
      if (response.success) {
        // Don't use orderId until after verification - it will be 'pending_payment'
        console.log('Temporary Order ID:', response.data.orderId); // Will be 'pending_payment'
        console.log('Transaction Reference for verification:', response.data.tx_ref);
        
        // Navigate to payment verification screen with payment link
        navigation.navigate('ProductPaymentVerification', {
          paymentLink: response.data.link,
          orderId: response.data.orderId, // This will be 'pending_payment'
          txRef: response.data.tx_ref, // Use this for verification
          product: product,
          paymentAmount: calculatePaymentAmount(),
          paymentType: paymentType,
          bookingDate: bookingDate,
          bookingTime: bookingTime,
        });
      } else {
        Alert.alert('Payment Error', response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentAmount = calculatePaymentAmount();
  const upfrontPercentage = product.pricing?.upfrontPaymentPercentage || 50;

  const handleDateConfirm = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      Alert.alert('Error', 'Booking date cannot be in the past');
      setDatePickerVisible(false);
      return;
    }
    
    // Check if date is within service availability
    if (product.availability && product.availability.type !== 'unlimited' && product.availability.endDate) {
      const endDate = new Date(product.availability.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (selectedDate > endDate) {
        Alert.alert('Error', `Service is only available until ${endDate.toLocaleDateString()}`);
        setDatePickerVisible(false);
        return;
      }
    }
    
    const dateStr = date.toISOString().split('T')[0];
    setBookingDate(dateStr);
    setDatePickerVisible(false);
  };

  const handleDateCancel = () => {
    setDatePickerVisible(false);
  };

  const handleTimeSelect = (time) => {
    setBookingTime(time);
    setIsTimePickerVisible(false);
  };

  const handleTimeConfirm = (time) => {
    const timeString = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setBookingTime(timeString);
    setIsTimePickerVisible(false);
  };

  const handleTimeCancel = () => {
    setIsTimePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product Summary */}
        <View style={styles.productSummary}>
          <View style={styles.productHeader}>
            <View style={styles.productImageContainer}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="cube" size={32} color="#7B2CBF" />
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name || product.title}</Text>
              <Text style={styles.businessName}>{product.location?.brandName}</Text>
              <Text style={styles.productPrice}>₦{(product.pricing?.discountedPrice || product.pricing?.originalPrice || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Type Selection - Only show if NOT completing remaining payment */}
        {routePaymentType !== 'remaining' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            
            <TouchableOpacity
              style={[styles.paymentOption, paymentType === 'full' && styles.selectedOption]}
              onPress={() => setPaymentType('full')}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Full Payment</Text>
                  <Text style={styles.optionAmount}>₦{(product.pricing?.discountedPrice || product.pricing?.originalPrice || 0).toLocaleString()}</Text>
                </View>
                <Text style={styles.optionDescription}>Pay the full amount now</Text>
              </View>
              <View style={[styles.radioButton, paymentType === 'full' && styles.radioSelected]}>
                {paymentType === 'full' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {product.pricing?.upfrontPaymentPercentage > 0 && (
              <TouchableOpacity
                style={[styles.paymentOption, paymentType === 'upfront' && styles.selectedOption]}
                onPress={() => setPaymentType('upfront')}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>Upfront Payment ({upfrontPercentage}%)</Text>
                    <Text style={styles.optionAmount}>₦{Math.round((product.pricing?.discountedPrice || product.pricing?.originalPrice || 0) * (upfrontPercentage / 100)).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.optionDescription}>Pay {upfrontPercentage}% now, remaining later</Text>
                </View>
                <View style={[styles.radioButton, paymentType === 'upfront' && styles.radioSelected]}>
                  {paymentType === 'upfront' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Remaining Payment Notice - Show when completing partial payment */}
        {routePaymentType === 'remaining' && (
          <View style={styles.section}>
            <View style={styles.remainingPaymentNotice}>
              <Ionicons name="information-circle" size={24} color="#7B2CBF" />
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Completing Remaining Payment</Text>
                <Text style={styles.noticeText}>
                  You are paying the remaining balance for this order.
                </Text>
                <Text style={styles.noticeAmount}>
                  Amount: ₦{(product.pricing?.discountedPrice || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Service Booking Details */}
        {product.itemType === 'service' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Booking Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={[styles.dateButtonText, !bookingDate && styles.placeholderText]}>
                  {bookingDate ? new Date(bookingDate).toLocaleDateString() : 'Select booking date'}
                </Text>
                <Ionicons name="calendar" size={20} color="#7B2CBF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Booking Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setIsTimePickerVisible(true)}
              >
                <Text style={[styles.dateButtonText, !bookingTime && styles.placeholderText]}>
                  {bookingTime || 'Select booking time'}
                </Text>
                <Ionicons name="time" size={20} color="#7B2CBF" />
              </TouchableOpacity>
            </View>

            {product.availability && product.availability.type !== 'unlimited' && (
              <View style={styles.availabilityInfo}>
                <Ionicons name="information-circle" size={16} color="#FF9800" />
                <Text style={styles.availabilityText}>
                  Service available until {new Date(product.availability.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sub-Services Selection */}
        {product.itemType === 'service' && product.subServices && product.subServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Services</Text>
            {product.subServices.map((subService, index) => {
              const serviceId = subService.code || `${subService.name}-${index}`;
              const isSelected = selectedSubServices.some(s => (s.code || `${s.name}-${s.index}`) === serviceId);
              return (
                <TouchableOpacity
                  key={serviceId}
                  style={[styles.subServiceOption, isSelected && styles.selectedSubService]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedSubServices(prev => prev.filter(s => 
                        (s.code || `${s.name}-${s.index}`) !== serviceId
                      ));
                    } else {
                      const serviceToAdd = {
                        name: subService.name,
                        code: subService.code || `${subService.name}-${index}`,
                        price: subService.price || 0,
                        index
                      };
                      setSelectedSubServices(prev => [...prev, serviceToAdd]);
                    }
                  }}
                >
                  <View style={styles.subServiceContent}>
                    <Text style={styles.subServiceName}>{subService.name}</Text>
                    <Text style={styles.subServicePrice}>+₦{subService.price?.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.name}
              onChangeText={(text) => setCustomerInfo({...customerInfo, name: text})}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.email}
              onChangeText={(text) => setCustomerInfo({...customerInfo, email: text})}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.phone}
              onChangeText={(text) => setCustomerInfo({...customerInfo, phone: text})}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          {routePaymentType !== 'remaining' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Type:</Text>
              <Text style={styles.summaryValue}>
                {paymentType === 'full' ? 'Full Payment' : paymentType === 'upfront' ? `Upfront (${upfrontPercentage}%)` : 'Remaining Balance'}
              </Text>
            </View>
          )}
          
          {routePaymentType === 'remaining' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Type:</Text>
              <Text style={styles.summaryValue}>Remaining Balance Payment</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Pay:</Text>
            <Text style={styles.summaryAmount}>₦{paymentAmount.toLocaleString()}</Text>
          </View>
          
          {selectedSubServices.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sub-services:</Text>
              <Text style={styles.summaryValue}>₦{selectedSubServices.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString()}</Text>
            </View>
          )}
          
          {paymentType === 'upfront' && routePaymentType !== 'remaining' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining Balance:</Text>
              <Text style={styles.summaryValue}>₦{Math.round((product.pricing?.discountedPrice || product.pricing?.originalPrice || 0) * ((100 - upfrontPercentage) / 100)).toLocaleString()}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.payButtonText}>
                {routePaymentType === 'remaining' 
                  ? `Pay Remaining Balance: ₦${paymentAmount.toLocaleString()}`
                  : `Pay ₦${paymentAmount.toLocaleString()}`
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Native Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        textColor="#000000"
        accentColor="#7B2CBF"
        minimumDate={new Date()} // Only allow future dates
        maximumDate={product.availability && product.availability.endDate ? new Date(product.availability.endDate) : undefined}
      />

      {/* Native Time Picker */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
        textColor="#000000"
        accentColor="#7B2CBF"
        is24Hour={false}
      />
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
  productSummary: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E5F5',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: '#7B2CBF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  subServiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedSubService: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E5F5',
  },
  subServiceContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subServiceName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  subServicePrice: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: 'bold',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  bottomSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  payButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  remainingPaymentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noticeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
});

export default ProductPaymentScreen;