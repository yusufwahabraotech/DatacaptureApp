import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SubscriptionWizardStep4Screen = ({ navigation, route }) => {
  const { selectedPackage, selectedDuration, promoCode, includeVerifiedBadge, profileData, locationData } = route.params;

  const [promoValidation, setPromoValidation] = useState({ isValid: false, discount: 0, message: '' });
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [locationVerificationPrice, setLocationVerificationPrice] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(true);

  const packagePrice = 3000;
  
  // Calculate package price with promo discount
  const getPackagePrice = (applyPromoDiscount = true) => {
    let basePrice = packagePrice;
    
    if (applyPromoDiscount && promoValidation.isValid && promoValidation.discount > 0) {
      const discountAmount = (basePrice * promoValidation.discount) / 100;
      return basePrice - discountAmount;
    }
    
    return basePrice;
  };
  
  const totalAmount = getPackagePrice(true) + locationVerificationPrice;

  useEffect(() => {
    // Fetch location pricing
    fetchLocationPricing();
    
    // Validate promo code if provided
    if (promoCode && selectedPackage) {
      validatePromoCode(promoCode, selectedPackage._id);
    }
  }, []);

  const fetchLocationPricing = async () => {
    if (!locationData.country || !locationData.state || !locationData.city || !locationData.cityRegion) {
      setLocationVerificationPrice(0);
      setLoadingPrice(false);
      return;
    }

    try {
      const response = await ApiService.getPaymentLocationPricing(
        locationData.country,
        locationData.state,
        locationData.lga,
        locationData.city,
        locationData.cityRegion
      );
      
      if (response.success) {
        setLocationVerificationPrice(response.data.fee);
      } else {
        setLocationVerificationPrice(0);
      }
    } catch (error) {
      console.log('Error fetching location pricing:', error);
      setLocationVerificationPrice(0);
    } finally {
      setLoadingPrice(false);
    }
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

  const handleNext = () => {
    navigation.navigate('SubscriptionWizardStep5', {
      selectedPackage,
      selectedDuration,
      promoCode,
      includeVerifiedBadge,
      profileData,
      locationData,
      paymentSummary: {
        packagePrice: getPackagePrice(true),
        locationVerificationPrice,
        totalAmount: getPackagePrice(true) + locationVerificationPrice,
      },
    });
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
        <View style={[styles.stepCircle, styles.activeStep]}>
          <Text style={styles.activeStepText}>4</Text>
        </View>
        <Text style={[styles.stepText, styles.activeText]}>Location Payment</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.upcomingStep]}>
          <Text style={styles.upcomingStepText}>5</Text>
        </View>
        <Text style={[styles.stepText, styles.upcomingText]}>Package Payment</Text>
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
        <Text style={styles.headerTitle}>Payment Summary</Text>
      </View>

      {renderProgressSteps()}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Payment Summary</Text>

        {/* Selected Package */}
        <View style={styles.packageBox}>
          <Text style={styles.sectionTitle}>Selected Package:</Text>
          <View style={styles.packageCard}>
            <View style={styles.packageInfo}>
              <Text style={styles.packageName}>{selectedPackage.title}</Text>
              <Text style={styles.packagePlan}>Monthly Plan</Text>
              {promoCode && (
                <View style={styles.promoSection}>
                  <Text style={styles.promoLabel}>Promo: {promoCode}</Text>
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
            </View>
            <View style={styles.packagePriceContainer}>
              {promoValidation.isValid && promoValidation.discount > 0 ? (
                <View style={styles.discountPricing}>
                  <Text style={styles.originalPrice}>{formatPrice(getPackagePrice(false))}</Text>
                  <Text style={styles.discountLabel}>-{promoValidation.discount}%</Text>
                  <Text style={styles.packagePrice}>{formatPrice(getPackagePrice(true))}</Text>
                </View>
              ) : (
                <Text style={styles.packagePrice}>{formatPrice(getPackagePrice(false))}</Text>
              )}
              <Text style={styles.packagePriceLabel}>Package amount</Text>
            </View>
          </View>
        </View>

        {/* Locations to Verify */}
        <View style={styles.locationsBox}>
          <Text style={styles.sectionTitle}>Locations to Verify:</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{locationData.brandName || 'OOSO'}</Text>
              <Text style={styles.locationAddress}>
                {locationData.city}, {locationData.state}, {locationData.country}
              </Text>
              {locationData.cityRegion && (
                <Text style={styles.locationRegion}>Region: {locationData.cityRegion}</Text>
              )}
            </View>
            <View style={styles.locationPriceContainer}>
              <Text style={styles.locationPrice}>{formatPrice(locationVerificationPrice)}</Text>
              <Text style={styles.locationPriceLabel}>
                City Region: {locationData.cityRegion || 'Elepe'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Verification Total */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location Verification Total:</Text>
            <Text style={styles.summaryAmount}>{formatPrice(locationVerificationPrice)}</Text>
          </View>
        </View>

        {/* Total Payment Summary */}
        <View style={styles.totalSummaryBox}>
          <Text style={styles.totalSummaryTitle}>Total Payment Summary</Text>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Package Subscription:</Text>
            <Text style={styles.totalValue}>{formatPrice(getPackagePrice(true))}</Text>
          </View>
          <Text style={styles.totalSubLabel}>{selectedPackage.title} - monthly</Text>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Location Verification:</Text>
            <Text style={styles.totalValue}>{formatPrice(locationVerificationPrice)}</Text>
          </View>
          <Text style={styles.totalSubLabel}>1 location(s)</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.finalTotalRow}>
            <View>
              <Text style={styles.finalTotalLabel}>Total Amount:</Text>
              <Text style={styles.combinedPaymentLabel}>Combined Payment</Text>
            </View>
            <Text style={styles.finalTotalAmount}>{formatPrice(getPackagePrice(true) + locationVerificationPrice)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
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
  upcomingStep: {
    backgroundColor: '#E5E7EB',
  },
  activeStepText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingStepText: {
    color: '#6B7280',
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
  upcomingText: {
    color: '#6B7280',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  packageBox: {
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  packagePlan: {
    fontSize: 14,
    color: '#6B7280',
  },
  packagePriceContainer: {
    alignItems: 'flex-end',
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
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  packagePriceLabel: {
    fontSize: 12,
    color: '#7C3AED',
  },
  promoSection: {
    marginTop: 4,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  promoValidating: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  promoMessage: {
    fontSize: 10,
    marginTop: 2,
  },
  promoValid: {
    color: '#10B981',
  },
  promoInvalid: {
    color: '#EF4444',
  },
  locationsBox: {
    marginBottom: 24,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: {
    flex: 1,
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
  locationPriceContainer: {
    alignItems: 'flex-end',
  },
  locationPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryBox: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalSummaryBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
  },
  totalSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 16,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  combinedPaymentLabel: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  finalTotalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default SubscriptionWizardStep4Screen;