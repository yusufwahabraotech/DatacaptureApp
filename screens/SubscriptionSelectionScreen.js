import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const SubscriptionSelectionScreen = ({ navigation }) => {
  const [packages, setPackages] = useState([]);
  const [packagePricing, setPackagePricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('yearly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchPackages();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await ApiService.getAllSubscriptionPackages();
      console.log('🚨 PACKAGES FETCH DEBUG 🚨');
      console.log('Packages response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const activePackages = response.data.packages.filter(pkg => pkg.isActive);
        console.log('Active packages:', JSON.stringify(activePackages, null, 2));
        setPackages(activePackages);
        
        // Fetch pricing for each package
        const pricingData = {};
        for (const pkg of activePackages) {
          const pricingResponse = await ApiService.getPackagePricing(pkg._id);
          if (pricingResponse.success) {
            pricingData[pkg._id] = pricingResponse.data;
          }
        }
        setPackagePricing(pricingData);
      }
    } catch (error) {
      console.log('Error fetching packages:', error);
      Alert.alert('Error', 'Failed to fetch subscription packages');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (pkg, duration) => {
    // Use the pricing data from the backend API
    const pricing = packagePricing[pkg._id];
    if (pricing && pricing[duration]) {
      return pricing[duration].finalPrice;
    }
    
    // Calculate based on services filtered by duration
    let total = 0;
    pkg.services?.forEach(service => {
      if (service.duration === duration) {
        total += service.price || 0;
      }
    });
    
    // Apply package discount
    const discountAmount = (total * (pkg.discountPercentage || 0)) / 100;
    const finalPrice = total - discountAmount;
    
    console.log(`Price calculation for ${duration}:`, {
      servicesForDuration: pkg.services?.filter(s => s.duration === duration),
      total,
      discountPercentage: pkg.discountPercentage,
      discountAmount,
      finalPrice
    });
    
    return finalPrice;
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage || !userProfile) return;

    console.log('🚨 PAYMENT HANDLER DEBUG 🚨');
    console.log('Selected package:', JSON.stringify(selectedPackage, null, 2));
    console.log('User profile:', JSON.stringify(userProfile, null, 2));
    console.log('Selected duration:', selectedDuration);
    console.log('Promo code:', promoCode);

    try {
      const paymentData = {
        userId: userProfile._id,
        userType: 'organization',
        packageId: selectedPackage._id,
        subscriptionDuration: selectedDuration,
        email: userProfile.email,
        name: userProfile.fullName || userProfile.firstName + ' ' + userProfile.lastName,
        phone: userProfile.phone || userProfile.phoneNumber,
        promoCode: promoCode || undefined,
      };

      console.log('Final payment data:', JSON.stringify(paymentData, null, 2));

      const response = await ApiService.initializePayment(paymentData);
      
      if (response.success) {
        setPaymentUrl(response.data.paymentLink);
        setTransactionRef(response.data.transactionRef);
        setShowPaymentModal(false);
        setShowPaymentWebView(true);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    }
  };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Check if the URL contains success or failure parameters
    if (url.includes('status=successful')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const transactionId = urlParams.get('transaction_id');
      
      setShowPaymentWebView(false);
      navigation.navigate('PaymentVerification', {
        transactionId,
        status: 'successful'
      });
    } else if (url.includes('status=cancelled') || url.includes('status=failed')) {
      setShowPaymentWebView(false);
      Alert.alert(
        'Payment Cancelled',
        'Your payment was cancelled or failed. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setShowPaymentModal(true)
          }
        ]
      );
    }
  };

  const formatPrice = (price) => `₦${price.toLocaleString()}`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading subscription packages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Choose Your Subscription</Text>
        <Text style={styles.headerSubtitle}>Select a package to get started</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {packages.map((pkg) => (
          <View key={pkg._id} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageTitle}>{pkg.title}</Text>
              <Text style={styles.packageDescription}>{pkg.description}</Text>
              
              {/* Max Users Display */}
              {pkg.maxUsers && (
                <View style={styles.userLimitContainer}>
                  <Ionicons name="people" size={16} color="#7C3AED" />
                  <Text style={styles.userLimitText}>Up to {pkg.maxUsers} users</Text>
                </View>
              )}
            </View>

            {/* Services Section */}
            {pkg.services && pkg.services.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.servicesTitle}>Included Services:</Text>
                {pkg.services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Ionicons name="construct" size={14} color="#7C3AED" />
                    <Text style={styles.serviceText}>
                      {service.serviceName} ({service.duration})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.pricingSection}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Monthly</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(calculatePrice(pkg, 'monthly'))}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Quarterly</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(calculatePrice(pkg, 'quarterly'))}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Yearly</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(calculatePrice(pkg, 'yearly'))}
                </Text>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Features:</Text>
              {pkg.features?.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectPackage(pkg)}
            >
              <Text style={styles.selectButtonText}>Select Package</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Subscription</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {selectedPackage && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.selectedPackageTitle}>{selectedPackage.title}</Text>
                
                <View style={styles.durationSelector}>
                  <Text style={styles.sectionTitle}>Select Duration:</Text>
                  {['monthly', 'quarterly', 'yearly'].map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationOption,
                        selectedDuration === duration && styles.selectedDuration
                      ]}
                      onPress={() => setSelectedDuration(duration)}
                    >
                      <Text style={[
                        styles.durationText,
                        selectedDuration === duration && styles.selectedDurationText
                      ]}>
                        {duration.charAt(0).toUpperCase() + duration.slice(1)} - {formatPrice(calculatePrice(selectedPackage, duration))}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.promoSection}>
                  <Text style={styles.sectionTitle}>Promo Code (Optional):</Text>
                  <TextInput
                    style={styles.promoInput}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholder="Enter promo code"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>
                    {formatPrice(calculatePrice(selectedPackage, selectedDuration))}
                  </Text>
                </View>

                <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                  <Text style={styles.payButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowPaymentWebView(false);
                Alert.alert(
                  'Payment Cancelled',
                  'Are you sure you want to cancel the payment?',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Yes', 
                      onPress: () => setShowPaymentModal(true)
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingSection: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 4,
  },
  userLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  userLimitText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginLeft: 4,
  },
  servicesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  selectedPackageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  durationSelector: {
    marginBottom: 20,
  },
  durationOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  selectedDuration: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  durationText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDurationText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  promoSection: {
    marginBottom: 20,
  },
  promoInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  payButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default SubscriptionSelectionScreen;