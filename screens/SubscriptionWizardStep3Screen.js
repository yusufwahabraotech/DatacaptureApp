import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, State, City } from 'country-state-city';
import SearchableDropdown from '../components/SearchableDropdown';
import ApiService from '../services/api';

const SubscriptionWizardStep3Screen = ({ navigation, route }) => {
  const { selectedPackage, selectedDuration, promoCode, includeVerifiedBadge, profileData } = route.params;
  
  const [promoValidation, setPromoValidation] = useState({ isValid: false, discount: 0, message: '' });
  const [validatingPromo, setValidatingPromo] = useState(false);
  
  // Calculate package price based on selected duration and promo code
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
  const [locationType, setLocationType] = useState('headquarters');
  const [brandName, setBrandName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityRegion, setSelectedCityRegion] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [customState, setCustomState] = useState('');
  const [customLGA, setCustomLGA] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customCityRegion, setCustomCityRegion] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [buildingColor, setBuildingColor] = useState('');
  const [buildingType, setBuildingType] = useState('');

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityRegions, setCityRegions] = useState([]);
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showLGAModal, setShowLGAModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCityRegionModal, setShowCityRegionModal] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const locationTypes = [
    { label: 'Headquarters', value: 'headquarters' },
    { label: 'Branch', value: 'branch' },
    { label: 'Warehouse', value: 'warehouse' },
  ];

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
    
    // Validate promo code if provided
    if (promoCode && selectedPackage) {
      validatePromoCode(promoCode, selectedPackage._id);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry);
      setStates(countryStates);
      setSelectedState('');
      setSelectedLGA('');
      setSelectedCity('');
      setSelectedCityRegion('');
      setLgas([]);
      setCities([]);
      setCityRegions([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState || customState) {
      const countryName = customCountry || countries.find(c => c.isoCode === selectedCountry)?.name;
      const stateName = customState || states.find(s => s.isoCode === selectedState)?.name;
      
      if (countryName && stateName) {
        // Get LGAs from country-state-city library
        const countryObj = countries.find(c => c.name === countryName);
        const stateObj = states.find(s => s.name === stateName);
        if (countryObj && stateObj) {
          const stateCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
          // Use cities as LGAs since country-state-city doesn't have LGA level
          setLgas(stateCities.map(city => ({ name: city.name, id: city.name })));
        }
        
        // Fetch cities from backend
        fetchCities(countryName, stateName, '');
      }
      
      setSelectedLGA('');
      setSelectedCity('');
      setSelectedCityRegion('');
      setCityRegions([]);
      setPricing(null);
    }
  }, [selectedState, customState, selectedCountry, customCountry]);

  useEffect(() => {
    if ((selectedCity || customCity) && (selectedLGA || customLGA)) {
      const countryName = customCountry || countries.find(c => c.isoCode === selectedCountry)?.name;
      const stateName = customState || states.find(s => s.isoCode === selectedState)?.name;
      const lgaName = customLGA || selectedLGA;
      const cityName = customCity || selectedCity;
      
      if (countryName && stateName && lgaName && cityName) {
        // Fetch city regions with pricing from backend
        fetchCityRegions(countryName, stateName, lgaName, cityName);
      }
      
      setSelectedCityRegion('');
      setPricing(null);
    }
  }, [selectedCity, customCity, selectedLGA, customLGA]);

  useEffect(() => {
    if (selectedCityRegion || customCityRegion) {
      const countryName = customCountry || countries.find(c => c.isoCode === selectedCountry)?.name;
      const stateName = customState || states.find(s => s.isoCode === selectedState)?.name;
      const lgaName = customLGA || selectedLGA;
      const cityName = customCity || selectedCity;
      const cityRegionName = customCityRegion || selectedCityRegion;
      
      if (countryName && stateName && lgaName && cityName && cityRegionName) {
        fetchPricing(countryName, stateName, lgaName, cityName, cityRegionName);
      }
    }
  }, [selectedCityRegion, customCityRegion]);

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

  const fetchCities = async (country, state, lga) => {
    try {
      const response = await ApiService.getCities(country, state, lga);
      if (response.success) {
        setCities(response.data.cities || []);
      } else {
        // Fallback to country-state-city library
        const countryObj = countries.find(c => c.name === country);
        const stateObj = states.find(s => s.name === state);
        if (countryObj && stateObj) {
          const stateCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
          setCities(stateCities.map(city => ({ name: city.name, id: city.name })));
        }
      }
    } catch (error) {
      console.log('Error fetching cities:', error);
      // Fallback to country-state-city library
      const countryObj = countries.find(c => c.name === country);
      const stateObj = states.find(s => s.name === state);
      if (countryObj && stateObj) {
        const stateCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
        setCities(stateCities.map(city => ({ name: city.name, id: city.name })));
      }
    }
  };

  const fetchCityRegions = async (country, state, lga, city) => {
    try {
      const response = await ApiService.getCityRegions(country, state, lga, city);
      if (response.success) {
        setCityRegions(response.data.cityRegions || []);
      }
    } catch (error) {
      console.log('Error fetching city regions:', error);
    }
  };

  const fetchPricing = async (country, state, lga, city, cityRegion) => {
    setLoadingPricing(true);
    try {
      // Use the payment pricing endpoint that includes fallback to defaults
      const response = await ApiService.getPaymentLocationPricing(country, state, lga, city, cityRegion);
      if (response.success) {
        setPricing({
          fee: response.data.fee,
          source: response.data.source
        });
      } else {
        setPricing(null);
      }
    } catch (error) {
      console.log('Error fetching pricing:', error);
      setPricing(null);
    } finally {
      setLoadingPricing(false);
    }
  };

  const renderDropdown = (value, placeholder, onPress, disabled = false) => (
    <TouchableOpacity 
      style={[styles.dropdown, disabled && styles.disabledDropdown]} 
      onPress={disabled ? null : onPress}
    >
      <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color={disabled ? "#9CA3AF" : "#6B7280"} />
    </TouchableOpacity>
  );

  const getDisplayValue = (value, customValue, data, key = 'name') => {
    if (customValue) return customValue;
    if (!value) return '';
    const item = data.find(d => d.isoCode === value || d.id === value || d[key] === value);
    return item ? (item.label || item[key]) : value;
  };

  const handleNext = () => {
    const finalCountry = customCountry || getDisplayValue(selectedCountry, '', countries, 'name');
    const finalState = customState || getDisplayValue(selectedState, '', states, 'name');
    const finalCity = customCity || getDisplayValue(selectedCity, '', cities, 'name');
    
    if (!finalCountry || !finalState || !finalCity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const locationData = {
      locationType,
      brandName,
      country: finalCountry,
      state: finalState,
      lga: customLGA || getDisplayValue(selectedLGA, '', lgas, 'name'),
      city: finalCity,
      cityRegion: customCityRegion || getDisplayValue(selectedCityRegion, '', cityRegions, 'name'),
      houseNumber,
      street,
      landmark,
      buildingColor,
      buildingType,
    };

    navigation.navigate('SubscriptionWizardStep4', {
      selectedPackage,
      selectedDuration,
      promoCode,
      includeVerifiedBadge,
      profileData,
      locationData,
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
        <View style={[styles.stepCircle, styles.activeStep]}>
          <Text style={styles.activeStepText}>3</Text>
        </View>
        <Text style={[styles.stepText, styles.activeText]}>Locations</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.upcomingStep]}>
          <Text style={styles.upcomingStepText}>4</Text>
        </View>
        <Text style={[styles.stepText, styles.upcomingText]}>Location Payment</Text>
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
        <Text style={styles.headerTitle}>Add Locations</Text>
      </View>

      {renderProgressSteps()}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Add Locations</Text>

        <View style={styles.packageInfoBox}>
          <Text style={styles.packageInfoTitle}>Selected Package</Text>
          <Text style={styles.packageName}>{selectedPackage.title} - {selectedDuration}</Text>
          <Text style={styles.packageDescription}>This package will be included in your payment</Text>
          
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

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Location 1 Form:</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location Type:</Text>
            {renderDropdown(
              locationTypes.find(t => t.value === locationType)?.label,
              'Select location type',
              () => setShowLocationTypeModal(true)
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brand Name:</Text>
            <TextInput
              style={styles.textInput}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Enter brand name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Country* (required):</Text>
            {renderDropdown(
              getDisplayValue(selectedCountry, customCountry, countries, 'name'),
              'Select a country...',
              () => setShowCountryModal(true)
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State/Province* (required):</Text>
            {renderDropdown(
              getDisplayValue(selectedState, customState, states, 'name'),
              selectedCountry || customCountry ? 'Select a state...' : 'Please select a country first',
              () => setShowStateModal(true),
              !selectedCountry && !customCountry
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>LGA (Local Government Area) - Optional:</Text>
            {renderDropdown(
              getDisplayValue(selectedLGA, customLGA, lgas, 'name'),
              (selectedState || customState) ? 'Select LGA...' : 'Please select a state first',
              () => setShowLGAModal(true),
              !selectedState && !customState
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City* (required):</Text>
            {renderDropdown(
              getDisplayValue(selectedCity, customCity, cities, 'name'),
              (selectedState || customState) ? 'Select a city...' : 'Please select a state first',
              () => setShowCityModal(true),
              !selectedState && !customState
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City Region with Fee - Optional:</Text>
            {renderDropdown(
              getDisplayValue(selectedCityRegion, customCityRegion, cityRegions, 'name'),
              (selectedCity || customCity) ? 'Select city region...' : 'Please select a city first',
              () => setShowCityRegionModal(true),
              !selectedCity && !customCity
            )}
          </View>

          {(selectedCityRegion || customCityRegion) && (
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>Location Pricing</Text>
              {loadingPricing ? (
                <View style={styles.pricingLoading}>
                  <Text>Loading pricing...</Text>
                </View>
              ) : pricing ? (
                <View style={styles.pricingContent}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Fee:</Text>
                    <Text style={styles.priceAmount}>₦{pricing.fee?.toLocaleString() || '0'}</Text>
                  </View>
                  <Text style={styles.priceSource}>{pricing.source || 'City Region Fee'}</Text>
                </View>
              ) : (
                <View style={styles.pricingContent}>
                  <Text style={styles.priceError}>Pricing will be determined when location is added</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>House Number:</Text>
            <TextInput
              style={styles.textInput}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="House Number"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street:</Text>
            <TextInput
              style={styles.textInput}
              value={street}
              onChangeText={setStreet}
              placeholder="Street name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Landmark (Optional):</Text>
            <TextInput
              style={styles.textInput}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Nearby landmark"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Building Color (Optional):</Text>
            <TextInput
              style={styles.textInput}
              value={buildingColor}
              onChangeText={setBuildingColor}
              placeholder="Building color"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Building Type (Optional):</Text>
            <TextInput
              style={styles.textInput}
              value={buildingType}
              onChangeText={setBuildingType}
              placeholder="e.g., Office Complex, Warehouse"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <SearchableDropdown
        visible={showLocationTypeModal}
        onClose={() => setShowLocationTypeModal(false)}
        data={locationTypes}
        onSelect={(item) => setLocationType(item.value)}
        title="Select Location Type"
        searchPlaceholder="Search location types..."
      />
      
      <SearchableDropdown
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        data={countries.map(c => ({ ...c, label: c.name }))}
        onSelect={(item) => {
          setSelectedCountry(item.isoCode);
          setCustomCountry('');
          setSelectedState('');
          setSelectedCity('');
          setSelectedLGA('');
          setSelectedCityRegion('');
        }}
        title="Select Country"
        searchPlaceholder="Search countries..."
        showOthersOption={true}
        onOthersSelect={(customValue) => {
          setCustomCountry(customValue);
          setSelectedCountry('');
          setSelectedState('');
          setSelectedCity('');
          setSelectedLGA('');
          setSelectedCityRegion('');
        }}
      />
      
      <SearchableDropdown
        visible={showStateModal}
        onClose={() => setShowStateModal(false)}
        data={states.map(s => ({ ...s, label: s.name }))}
        onSelect={(item) => {
          setSelectedState(item.isoCode);
          setCustomState('');
          setSelectedCity('');
          setSelectedLGA('');
          setSelectedCityRegion('');
        }}
        title="Select State"
        searchPlaceholder="Search states..."
        showOthersOption={true}
        onOthersSelect={(customValue) => {
          setCustomState(customValue);
          setSelectedState('');
          setSelectedCity('');
          setSelectedLGA('');
          setSelectedCityRegion('');
        }}
      />
      
      <SearchableDropdown
        visible={showLGAModal}
        onClose={() => setShowLGAModal(false)}
        data={lgas.map(l => ({ ...l, label: l.name }))}
        onSelect={(item) => {
          setSelectedLGA(item.id || item.name);
          setCustomLGA('');
        }}
        title="Select LGA"
        searchPlaceholder="Search LGAs..."
        showOthersOption={true}
        onOthersSelect={(customValue) => {
          setCustomLGA(customValue);
          setSelectedLGA('');
        }}
      />
      
      <SearchableDropdown
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        data={cities.map(c => ({ ...c, label: c.name }))}
        onSelect={(item) => {
          setSelectedCity(item.id || item.name);
          setCustomCity('');
          setSelectedCityRegion('');
        }}
        title="Select City"
        searchPlaceholder="Search cities..."
        showOthersOption={true}
        onOthersSelect={(customValue) => {
          setCustomCity(customValue);
          setSelectedCity('');
          setSelectedCityRegion('');
        }}
      />
      
      <SearchableDropdown
        visible={showCityRegionModal}
        onClose={() => setShowCityRegionModal(false)}
        data={cityRegions.map(cr => ({ ...cr, label: cr.name }))}
        onSelect={(item) => {
          setSelectedCityRegion(item.id || item.name);
          setCustomCityRegion('');
        }}
        title="Select City Region"
        searchPlaceholder="Search city regions..."
        showOthersOption={true}
        onOthersSelect={(customValue) => {
          setCustomCityRegion(customValue);
          setSelectedCityRegion('');
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
    marginBottom: 20,
  },
  packageInfoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  packageInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  packagePriceLabel: {
    fontSize: 12,
    color: '#7C3AED',
  },
  promoSection: {
    marginVertical: 8,
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
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#9CA3AF',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledDropdown: {
    backgroundColor: '#F9FAFB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1F2937',
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
  pricingCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  pricingLoading: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingContent: {
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  priceSource: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  priceError: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default SubscriptionWizardStep3Screen;