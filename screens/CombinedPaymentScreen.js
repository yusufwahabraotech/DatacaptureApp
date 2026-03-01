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
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';

const CustomDropdown = ({ placeholder, value, options, onSelect, disabled }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={[styles.dropdownButton, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setShowOptions(true)}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    onSelect(item.value || item);
                    setShowOptions(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{item.label || item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const CombinedPaymentScreen = ({ route, navigation }) => {
  const { selectedPackage, selectedDuration } = route.params;
  
  const [locations, setLocations] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState({});
  const [lgas, setLgas] = useState({});
  const [locationPricing, setLocationPricing] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    loadCountries();
    loadExistingLocations();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await ApiService.getExternalCountries();
      if (response.success) {
        setCountries(response.data.countries);
      }
    } catch (error) {
      console.log('Error loading countries:', error);
    }
  };

  const fetchLocationPricing = async (location, index) => {
    if (!location.country) return;
    
    try {
      const response = await ApiService.getPaymentLocationPricing(
        location.country,
        location.state,
        location.lga,
        location.city,
        location.cityRegion
      );
      
      if (response.success) {
        setLocationPricing(prev => ({
          ...prev,
          [index]: {
            fee: response.data.fee,
            source: response.data.source
          }
        }));
      } else {
        setLocationPricing(prev => ({
          ...prev,
          [index]: { fee: 0, source: 'No pricing available' }
        }));
      }
    } catch (error) {
      console.log('Error fetching location pricing:', error);
      setLocationPricing(prev => ({
        ...prev,
        [index]: { fee: 0, source: 'Error loading pricing' }
      }));
    }
  };

  const loadExistingLocations = async () => {
    try {
      const response = await ApiService.getOrganizationProfile();
      if (response.success && response.data.profile && response.data.profile.locations) {
        // Filter unpaid locations and fetch their pricing
        const unpaidLocations = response.data.profile.locations
          .filter(location => !location.isPaidFor);
        
        // Fetch pricing for each location
        const locationsWithPricing = await Promise.all(
          unpaidLocations.map(async (location) => {
            try {
              const pricingResponse = await ApiService.getPaymentLocationPricing(
                location.country,
                location.state,
                location.lga,
                location.city,
                location.cityRegion
              );
              
              return {
                ...location,
                fee: pricingResponse.success ? pricingResponse.data.fee : 0
              };
            } catch (error) {
              console.log('Error fetching pricing for location:', error);
              return {
                ...location,
                fee: 0
              };
            }
          })
        );
        
        setSavedLocations(locationsWithPricing);
      }
    } catch (error) {
      console.log('Error loading existing locations:', error);
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

  const fetchCityRegions = async () => {
    try {
      const response = await ApiService.getCityRegions();
      if (response.success) {
        setCityRegions(response.data);
      }
    } catch (error) {
      console.log('Error fetching city regions:', error);
    }
  };

  const addLocation = () => {
    setLocations([...locations, {
      locationType: 'headquarters',
      brandName: '',
      country: 'Nigeria',
      state: '',
      lga: '',
      city: '',
      cityRegion: '',
      houseNumber: '',
      street: '',
      gallery: { images: [], videos: [] }
    }]);
  };

  const onCountryChange = (index, country) => {
    const updatedLocations = [...locations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      country,
      state: '',
      lga: '',
      city: '',
      cityRegion: ''
    };
    setLocations(updatedLocations);
    if (country) {
      loadStates(country, index);
    }
  };

  const onStateChange = (index, state) => {
    const updatedLocations = [...locations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      state,
      lga: '',
      city: '',
      cityRegion: ''
    };
    setLocations(updatedLocations);
    if (state && updatedLocations[index].country) {
      loadLGAs(updatedLocations[index].country, state, index);
    }
  };

  const loadStates = async (countryName, locationIndex) => {
    try {
      const response = await ApiService.getExternalStates(countryName);
      if (response.success) {
        setStates(prev => ({ ...prev, [locationIndex]: response.data.states }));
      }
    } catch (error) {
      console.log('Error loading states:', error);
    }
  };

  const loadLGAs = async (countryName, stateName, locationIndex) => {
    try {
      const response = await ApiService.getExternalLGAs(countryName, stateName);
      if (response.success) {
        setLgas(prev => ({ ...prev, [locationIndex]: response.data.lgas }));
      }
    } catch (error) {
      console.log('Error loading LGAs:', error);
    }
  };

  const updateLocation = (index, field, value) => {
    const updatedLocations = [...locations];
    updatedLocations[index][field] = value;
    setLocations(updatedLocations);
    
    // Fetch pricing when location details change
    if (['country', 'state', 'lga', 'city', 'cityRegion'].includes(field)) {
      fetchLocationPricing(updatedLocations[index], index);
    }
  };

  const removeLocation = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const calculateLocationFee = (location, index) => {
    return locationPricing[index]?.fee || 0;
  };

  const isLocationComplete = (location) => {
    return location.brandName && location.state && location.cityRegion && location.city;
  };

  const addLocationToSaved = async (index) => {
    const location = locations[index];
    if (!isLocationComplete(location)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      // First add the location to organization profile
      const payload = {
        locationType: location.locationType,
        brandName: location.brandName,
        country: location.country,
        state: location.state,
        lga: location.lga,
        city: location.city,
        cityRegion: location.cityRegion,
        houseNumber: location.houseNumber,
        street: location.street,
        gallery: {
          images: [],
          videos: []
        }
      };

      const response = await ApiService.addOrganizationLocation(payload);
      
      if (response.success) {
        // Get the actual pricing from the payment location pricing endpoint
        const pricingResponse = await ApiService.getPaymentLocationPricing(
          location.country,
          location.state,
          location.lga,
          location.city,
          location.cityRegion
        );
        
        const fee = pricingResponse.success ? pricingResponse.data.fee : 0;
        
        const locationWithFee = {
          ...location,
          fee: fee
        };

        setSavedLocations([...savedLocations, locationWithFee]);
        Alert.alert('Success', 'Location added successfully!');
        
        // Remove from editing locations
        removeLocation(index);
      } else {
        Alert.alert('Error', response.message || 'Failed to add location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add location');
    }
  };

  const removeSavedLocation = (index) => {
    setSavedLocations(savedLocations.filter((_, i) => i !== index));
  };

  const calculateTotalFees = () => {
    const subscriptionAmount = calculatePackagePrice();
    // Only include locations that are not paid for and not rejected+paid
    const eligibleLocations = savedLocations.filter(location => 
      !location.isPaidFor || location.verificationStatus !== 'rejected'
    );
    const verifiedBadgeAmount = eligibleLocations.reduce((sum, location) => 
      sum + (location.fee || 0), 0
    );
    return {
      subscriptionAmount,
      verifiedBadgeAmount,
      totalAmount: subscriptionAmount + verifiedBadgeAmount,
      eligibleLocations: eligibleLocations.length
    };
  };

  const calculatePackagePrice = async () => {
    console.log('🚨 CALCULATE PACKAGE PRICE DEBUG 🚨');
    console.log('Selected package:', selectedPackage.title);
    console.log('Selected duration:', selectedDuration);
    
    let total = 0;
    
    // Get unique service IDs from package
    const serviceIds = [...new Set(selectedPackage.services?.map(s => s.serviceId) || [])];
    console.log('Service IDs:', serviceIds);
    
    // Fetch each service's full pricing
    for (const serviceId of serviceIds) {
      try {
        const response = await ApiService.getServiceById(serviceId);
        if (response.success) {
          const service = response.data.service;
          
          // Use service's price for requested duration
          if (selectedDuration === 'monthly') {
            total += service.monthlyPrice || 0;
          } else if (selectedDuration === 'quarterly') {
            total += service.quarterlyPrice || 0;
          } else if (selectedDuration === 'yearly') {
            total += service.yearlyPrice || 0;
          }
          console.log(`Service ${service.serviceName} ${selectedDuration} price:`, service[selectedDuration + 'Price'] || 0);
        }
      } catch (error) {
        console.log('Error fetching service:', serviceId, error);
      }
    }
    
    console.log('Calculated total before discount:', total);
    
    // Apply package discount
    if (selectedPackage.discountPercentage) {
      const discountAmount = (total * selectedPackage.discountPercentage) / 100;
      total = total - discountAmount;
      console.log('Applied package discount:', selectedPackage.discountPercentage + '%', 'Final total:', total);
    }
    
    console.log('Final calculated price:', total);
    return total;
  };

  const handleCombinedPayment = async () => {
    if (!userProfile || savedLocations.length === 0) {
      Alert.alert('Error', 'Please add at least one location');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        packageId: selectedPackage._id,
        subscriptionDuration: selectedDuration,
        email: userProfile.email,
        name: userProfile.fullName || `${userProfile.firstName} ${userProfile.lastName}`,
        phone: userProfile.phone || userProfile.phoneNumber,
        includeVerifiedBadge: true,
        locations: savedLocations
      };

      const response = await ApiService.initializeCombinedPayment(paymentData);
      
      if (response.success) {
        setBreakdown(response.data.breakdown);
        setPaymentUrl(response.data.paymentLink);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Combined payment error:', error);
      Alert.alert('Error', 'Failed to initialize combined payment');
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = () => {
    setShowPaymentModal(false);
    setShowPaymentWebView(true);
  };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    
    if (url.includes('status=successful')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const transactionId = urlParams.get('transaction_id');
      
      setShowPaymentWebView(false);
      navigation.navigate('PaymentVerification', {
        transactionId,
        status: 'successful',
        paymentType: 'combined'
      });
    } else if (url.includes('status=cancelled') || url.includes('status=failed')) {
      setShowPaymentWebView(false);
      Alert.alert('Payment Cancelled', 'Your payment was cancelled or failed.');
    }
  };

  const formatPrice = (price) => `₦${price.toLocaleString()}`;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Combined Payment</Text>
        <Text style={styles.headerSubtitle}>Subscription + Verified Badge</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Package Summary */}
        <View style={styles.packageSummary}>
          <Text style={styles.sectionTitle}>Selected Package</Text>
          <Text style={styles.packageTitle}>{selectedPackage.title}</Text>
          <Text style={styles.packageDuration}>{selectedDuration} - {formatPrice(calculatePackagePrice())}</Text>
        </View>

        {/* Locations Section */}
        <View style={styles.locationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Locations</Text>
          </View>
          
          {/* Existing Unpaid Locations */}
          {savedLocations.length > 0 && (
            <View style={styles.existingLocationsSection}>
              <Text style={styles.existingLocationsTitle}>Existing Unpaid Locations ({savedLocations.length})</Text>
              {savedLocations.map((location, index) => (
                <View key={index} style={styles.existingLocationCard}>
                  <View style={styles.existingLocationHeader}>
                    <View>
                      <Text style={styles.existingLocationName}>{location.brandName}</Text>
                      <Text style={styles.existingLocationAddress}>
                        {location.cityRegion}, {location.city}, {location.state}
                      </Text>
                      <Text style={styles.existingLocationStatus}>{location.status || 'Pending Payment'}</Text>
                    </View>
                    <View style={styles.existingLocationRight}>
                      <Text style={styles.existingLocationFee}>₦{(location.fee || 0).toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => removeSavedLocation(index)}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addLocationButton} onPress={addLocation}>
            <Ionicons name="add-circle" size={24} color="#7C3AED" />
            <Text style={styles.addLocationText}>Add New Location</Text>
          </TouchableOpacity>

          {locations.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>Location {index + 1}</Text>
                <TouchableOpacity onPress={() => removeLocation(index)}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <CustomDropdown
                placeholder="Location Type *"
                value={location.locationType}
                options={[
                  { label: 'Headquarters', value: 'headquarters' },
                  { label: 'Branch', value: 'branch' }
                ]}
                onSelect={(value) => updateLocation(index, 'locationType', value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Brand Name *"
                value={location.brandName}
                onChangeText={(value) => updateLocation(index, 'brandName', value)}
              />

              <SearchableDropdown
                placeholder="Select Country *"
                value={location.country}
                options={countries.map(c => ({ label: c.name, value: c.name }))}
                onSelect={(value) => onCountryChange(index, value)}
                searchPlaceholder="Search countries..."
              />

              <CustomDropdown
                placeholder="Select State *"
                value={location.state}
                options={(states[index] || []).map(s => ({ label: s.name, value: s.name }))}
                onSelect={(value) => onStateChange(index, value)}
                disabled={!location.country || !states[index] || states[index].length === 0}
              />

              <CustomDropdown
                placeholder="Select LGA *"
                value={location.lga}
                options={(lgas[index] || []).map(lga => ({ label: lga, value: lga }))}
                onSelect={(value) => updateLocation(index, 'lga', value)}
                disabled={!location.state || !lgas[index] || lgas[index].length === 0}
              />

              <TextInput
                style={styles.input}
                placeholder="City *"
                value={location.city}
                onChangeText={(value) => updateLocation(index, 'city', value)}
              />

              <TextInput
                style={styles.input}
                placeholder="City Region *"
                value={location.cityRegion}
                onChangeText={(value) => updateLocation(index, 'cityRegion', value)}
              />

              <TextInput
                style={styles.input}
                placeholder="House Number"
                value={location.houseNumber}
                onChangeText={(value) => updateLocation(index, 'houseNumber', value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Street Address"
                value={location.street}
                onChangeText={(value) => updateLocation(index, 'street', value)}
              />

              <View style={styles.feeDisplay}>
                <Text style={styles.feeLabel}>Location Fee:</Text>
                <Text style={styles.feeAmount}>{formatPrice(calculateLocationFee(location, index))}</Text>
                {locationPricing[index]?.source && (
                  <Text style={styles.feeSource}>({locationPricing[index].source})</Text>
                )}
              </View>

              {isLocationComplete(location) && (
                <TouchableOpacity 
                  style={styles.addLocationToListButton}
                  onPress={() => addLocationToSaved(index)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.addLocationToListText}>Add Location</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <View style={styles.savedLocationsSection}>
              <Text style={styles.savedLocationsTitle}>Added Locations ({savedLocations.length})</Text>
              {savedLocations.map((location, index) => (
                <View key={index} style={styles.savedLocationCard}>
                  <View style={styles.savedLocationHeader}>
                    <View>
                      <Text style={styles.savedLocationName}>{location.brandName}</Text>
                      <Text style={styles.savedLocationAddress}>
                        {location.city}, {location.state}
                      </Text>
                    </View>
                    <View style={styles.savedLocationRight}>
                      <Text style={styles.savedLocationFee}>{formatPrice(location.fee)}</Text>
                      <TouchableOpacity onPress={() => removeSavedLocation(index)}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {locations.length === 0 && savedLocations.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No locations found</Text>
              <Text style={styles.emptySubtext}>Add locations to get verified badge pricing</Text>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        {savedLocations.length > 0 && calculateTotalFees().eligibleLocations > 0 && (
          <View style={styles.paymentSummary}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subscription Package:</Text>
              <Text style={styles.summaryAmount}>{formatPrice(calculateTotalFees().subscriptionAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Verified Badge ({calculateTotalFees().eligibleLocations} locations):</Text>
              <Text style={styles.summaryAmount}>{formatPrice(calculateTotalFees().verifiedBadgeAmount)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>{formatPrice(calculateTotalFees().totalAmount)}</Text>
            </View>
          </View>
        )}

        {savedLocations.length > 0 && calculateTotalFees().eligibleLocations > 0 && (
          <TouchableOpacity 
            style={styles.payButton} 
            onPress={handleCombinedPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payButtonText}>Proceed to Payment</Text>
            )}
          </TouchableOpacity>
        )}

        {savedLocations.length > 0 && calculateTotalFees().eligibleLocations === 0 && (
          <View style={styles.noPaymentNeeded}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noPaymentTitle}>All Locations Paid</Text>
            <Text style={styles.noPaymentText}>No additional payment required for your locations</Text>
          </View>
        )}
      </ScrollView>

      {/* Payment Confirmation Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            
            {breakdown && (
              <View style={styles.modalContent}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Subscription:</Text>
                  <Text style={styles.breakdownAmount}>{formatPrice(breakdown.subscriptionAmount)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Verified Badge:</Text>
                  <Text style={styles.breakdownAmount}>{formatPrice(breakdown.verifiedBadgeAmount)}</Text>
                </View>
                <View style={[styles.breakdownRow, styles.totalBreakdown]}>
                  <Text style={styles.totalBreakdownLabel}>Total:</Text>
                  <Text style={styles.totalBreakdownAmount}>{formatPrice(breakdown.totalAmount)}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={proceedToPayment}
              >
                <Text style={styles.confirmButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentWebView(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  packageSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  packageDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  locationsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addLocationText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  feeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  paymentSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  payButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalBreakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalBreakdownAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  confirmButtonText: {
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
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '80%',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  addLocationToListButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  addLocationToListText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  savedLocationsSection: {
    marginTop: 20,
  },
  savedLocationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  savedLocationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  savedLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  savedLocationAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  savedLocationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  existingLocationsSection: {
    marginBottom: 20,
  },
  existingLocationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  existingLocationCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  existingLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  existingLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  existingLocationAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  existingLocationStatus: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },
  existingLocationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  existingLocationFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  savedLocationFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  noPaymentNeeded: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 20,
  },
  noPaymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
  },
  noPaymentText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CombinedPaymentScreen;