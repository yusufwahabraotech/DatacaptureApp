import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const SubscriptionWizardStep5Screen = ({ navigation, route }) => {
  const { selectedPackage, selectedDuration, promoCode, includeVerifiedBadge, profileData, locationData, paymentSummary } = route.params;
  const [loading, setLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [promoValidation, setPromoValidation] = useState({ isValid: false, discount: 0, message: '' });
  const [validatingPromo, setValidatingPromo] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    // Validate promo code if provided
    if (promoCode && selectedPackage) {
      validatePromoCode(promoCode, selectedPackage._id);
    }
  }, []);

  // Calculate package price based on selected duration and services (same as Step 3 & 4)
  const getPackagePrice = (applyPromoDiscount = true) => {
    if (!selectedPackage?.services) return 0;
    
    // Calculate base price for the selected duration
    let basePrice = selectedPackage.services
      .filter(service => service.duration === selectedDuration)
      .reduce((total, service) => total + service.price, 0);
    
    // Apply promo discount if valid and requested
    if (applyPromoDiscount && promoValidation.isValid && promoValidation.discount > 0) {
      const discountAmount = (basePrice * promoValidation.discount) / 100;
      return basePrice - discountAmount;
    }
    
    return basePrice;
  };

  const validatePromoCode = async (code, packageId) => {
    if (!code.trim()) {
      setPromoValidation({ isValid: false, discount: 0, message: '' });
      return;
    }

    setValidatingPromo(true);
    try {
      const response = await ApiService.validatePromoCode(packageId, code.trim());
      if (response.success) {
        setPromoValidation({
          isValid: true,
          discount: response.data.discountPercentage,
          message: `${response.data.discountPercentage}% discount applied!`
        });
      } else {
        setPromoValidation({
          isValid: false,
          discount: 0,
          message: response.message || 'Invalid promo code'
        });
      }
    } catch (error) {
      setPromoValidation({
        isValid: false,
        discount: 0,
        message: 'Error validating promo code'
      });
    } finally {
      setValidatingPromo(false);
    }
  };

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

  const handlePayment = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'User profile not loaded');
      return;
    }

    setLoading(true);
    try {
      // Check if we need location setup and combined payment
      const needsLocationSetup = locationData && profileData?.verificationStatus === 'verified';
      
      if (needsLocationSetup) {
        // Add organization location
        const locationPayload = {
          locationType: locationData.locationType,
          brandName: locationData.brandName,
          country: locationData.country,
          state: locationData.state,
          city: locationData.city,
          lga: locationData.lga,
          cityRegion: locationData.cityRegion,
          houseNumber: locationData.houseNumber,
          street: locationData.street,
          ...(locationData.landmark && { landmark: locationData.landmark }),
          ...(locationData.buildingColor && { buildingColor: locationData.buildingColor }),
          ...(locationData.buildingType && { buildingType: locationData.buildingType }),
          gallery: {
            images: [],
            videos: []
          }
        };

        console.log('Adding organization location:', locationPayload);
        const locationResponse = await ApiService.addOrganizationLocation(locationPayload);
        
        if (!locationResponse.success) {
          Alert.alert('Error', locationResponse.message || 'Failed to add location');
          return;
        }
      }

      // Prepare payment data
      const paymentData = {
        userId: userProfile._id,
        userType: 'organization',
        packageId: selectedPackage._id,
        subscriptionDuration: selectedDuration,
        email: userProfile.email,
        name: userProfile.fullName || userProfile.firstName + ' ' + userProfile.lastName,
        phone: userProfile.phone || userProfile.phoneNumber,
        totalAmount: locationData ? paymentSummary.totalAmount : getPackagePrice(true),
        promoCode: promoValidation.isValid ? promoCode : undefined,
      };

      // Add location verification data if needed
      if (needsLocationSetup) {
        paymentData.includeVerifiedBadge = true;
        paymentData.locations = [{
          locationType: locationData.locationType,
          brandName: locationData.brandName,
          country: locationData.country,
          state: locationData.state,
          city: locationData.city,
          lga: locationData.lga,
          cityRegion: locationData.cityRegion,
          houseNumber: locationData.houseNumber,
          street: locationData.street,
          ...(locationData.landmark && { landmark: locationData.landmark }),
          ...(locationData.buildingColor && { buildingColor: locationData.buildingColor }),
          ...(locationData.buildingType && { buildingType: locationData.buildingType }),
          gallery: {
            images: [],
            videos: []
          }
        }];
      }

      console.log('Final payment data:', JSON.stringify(paymentData, null, 2));

      // Use appropriate payment endpoint
      const response = needsLocationSetup 
        ? await ApiService.initializeCombinedPayment(paymentData)
        : await ApiService.initializePayment(paymentData);
      
      if (response.success) {
        setPaymentUrl(response.data.paymentLink);
        setShowPaymentWebView(true);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    
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
        'Payment Failed',
        'Your payment was cancelled or failed. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {}
          }
        ]
      );
    }
  };

  const renderProgressSteps = () => (
    <View style={styles.progressContainer}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.completedStep]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={[styles.stepText, styles.completedText]}>Packages</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.completedStep]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={[styles.stepText, styles.completedText]}>Profile</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.completedStep]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={[styles.stepText, styles.completedText]}>Locations</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.completedStep]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={[styles.stepText, styles.completedText]}>Location Payment</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.activeStep]}>
          <Text style={styles.activeStepText}>5</Text>
        </View>
        <Text style={[styles.stepText, styles.activeText]}>Package Payment</Text>
      </View>
    </View>
  );

  const formatPrice = (price) => `₦${price?.toLocaleString() || '0'}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Payment</Text>
      </View>

      {renderProgressSteps()}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Complete Your Subscription</Text>

        {/* Final Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          
          {promoCode && (
            <View style={styles.promoSection}>
              <Text style={styles.promoLabel}>Promo Code: {promoCode}</Text>
              {validatingPromo && (
                <Text style={styles.promoValidating}>Validating...</Text>
              )}
              {!validatingPromo && promoValidation.message && (
                <Text style={[
                  styles.promoMessage,
                  promoValidation.isValid ? styles.promoValid : styles.promoInvalid
                ]}>
                  {promoValidation.message}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Package Subscription</Text>
            {promoValidation.isValid && promoValidation.discount > 0 ? (
              <View style={styles.discountPricing}>
                <Text style={styles.originalPrice}>{formatPrice(getPackagePrice(false))}</Text>
                <Text style={styles.discountLabel}>-{promoValidation.discount}%</Text>
                <Text style={styles.summaryValue}>{formatPrice(getPackagePrice(true))}</Text>
              </View>
            ) : (
              <Text style={styles.summaryValue}>{formatPrice(locationData ? paymentSummary.packagePrice : getPackagePrice(false))}</Text>
            )}
          </View>
          <Text style={styles.summarySubtext}>{selectedPackage.title} - {selectedDuration}</Text>
          
          {locationData && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location Verification</Text>
                <Text style={styles.summaryValue}>{formatPrice(paymentSummary.locationVerificationPrice)}</Text>
              </View>
              <Text style={styles.summarySubtext}>1 location(s)</Text>
            </>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatPrice(locationData ? paymentSummary.totalAmount : getPackagePrice(true))}</Text>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.packageDetailsCard}>
          <Text style={styles.packageDetailsTitle}>Package Details</Text>
          <Text style={styles.packageName}>{selectedPackage.title}</Text>
          <Text style={styles.packageDescription}>{selectedPackage.description}</Text>
          
          {selectedPackage.features && (
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Features:</Text>
              {selectedPackage.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Location Details */}
        {locationData && (
          <View style={styles.locationDetailsCard}>
            <Text style={styles.locationDetailsTitle}>Location to be Verified</Text>
            <Text style={styles.locationName}>{locationData.brandName || 'Your Business'}</Text>
            <Text style={styles.locationAddress}>
              {locationData.houseNumber && `${locationData.houseNumber} `}
              {locationData.street && `${locationData.street}, `}
              {locationData.city}, {locationData.state}, {locationData.country}
            </Text>
            {locationData.cityRegion && (
              <Text style={styles.locationRegion}>Region: {locationData.cityRegion}</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.payButtonDisabled]} 
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.payButtonText}>Pay with Flutterwave</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
                      onPress: () => {}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completedStep: {
    backgroundColor: '#6B7280',
  },
  activeStep: {
    backgroundColor: '#7C3AED',
  },
  activeStepText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 10,
    textAlign: 'center',
  },
  completedText: {
    color: '#6B7280',
  },
  activeText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#E5E7EB',
    flex: 0.5,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summarySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  promoSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  promoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  promoValidating: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  promoMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  promoValid: {
    color: '#10B981',
  },
  promoInvalid: {
    color: '#EF4444',
  },
  discountPricing: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  packageDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  packageDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  featuresSection: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  locationDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationRegion: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

export default SubscriptionWizardStep5Screen;