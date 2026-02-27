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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ProductPaymentScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserProfile();
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
    
    switch (paymentType) {
      case 'upfront':
        return Math.round(basePrice * (upfrontPercentage / 100));
      case 'remaining':
        return Math.round(basePrice * ((100 - upfrontPercentage) / 100));
      case 'full':
      default:
        return basePrice;
    }
  };

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      Alert.alert('Error', 'Please fill in your name and email address');
      return;
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
      };

      console.log('🚨 PAYMENT DATA 🚨');
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));

      const response = await ApiService.initiateProductPayment(paymentData);
      
      if (response.success) {
        // Navigate to payment verification screen with payment link
        navigation.navigate('ProductPaymentVerification', {
          paymentLink: response.data.link,
          orderId: response.data.orderId,
          txRef: response.data.tx_ref,
          product: product,
          paymentAmount: calculatePaymentAmount(),
          paymentType: paymentType,
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

        {/* Payment Type Selection */}
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
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Type:</Text>
            <Text style={styles.summaryValue}>
              {paymentType === 'full' ? 'Full Payment' : `Upfront (${upfrontPercentage}%)`}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Pay:</Text>
            <Text style={styles.summaryAmount}>₦{paymentAmount.toLocaleString()}</Text>
          </View>
          
          {paymentType === 'upfront' && (
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
              <Text style={styles.payButtonText}>Pay ₦{paymentAmount.toLocaleString()}</Text>
            </>
          )}
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
});

export default ProductPaymentScreen;