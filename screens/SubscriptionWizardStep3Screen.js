import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, State, City } from 'country-state-city';

const SubscriptionWizardStep3Screen = ({ navigation, route }) => {
  const { selectedPackage, selectedDuration, promoCode, includeVerifiedBadge, profileData } = route.params;
  const [locationType, setLocationType] = useState('headquarters');
  const [brandName, setBrandName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityRegion, setSelectedCityRegion] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [buildingColor, setBuildingColor] = useState('');
  const [buildingType, setBuildingType] = useState('');

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const locationTypes = [
    { label: 'Headquarters', value: 'headquarters' },
    { label: 'Branch', value: 'branch' },
    { label: 'Warehouse', value: 'warehouse' },
  ];

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry);
      setStates(countryStates);
      setSelectedState('');
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry, selectedState);
      setCities(stateCities);
      setSelectedCity('');
    }
  }, [selectedState, selectedCountry]);

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

  const renderModal = (visible, setVisible, data, onSelect, title) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label || item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const handleNext = () => {
    if (!selectedCountry || !selectedState || !selectedCity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const locationData = {
      locationType,
      brandName,
      country: selectedCountry,
      state: selectedState,
      lga: selectedLGA,
      city: selectedCity,
      cityRegion: selectedCityRegion,
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
          <Text style={styles.packageName}>{selectedPackage.title} - monthly</Text>
          <Text style={styles.packageDescription}>This package will be included in your payment</Text>
          <View style={styles.packagePriceContainer}>
            <Text style={styles.packagePrice}>{formatPrice(3000)}</Text>
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
              countries.find(c => c.isoCode === selectedCountry)?.name,
              'Select a country...',
              () => setShowCountryModal(true)
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State/Province* (required):</Text>
            {renderDropdown(
              states.find(s => s.isoCode === selectedState)?.name,
              selectedCountry ? 'Select a state...' : 'Please select a country first',
              () => setShowStateModal(true),
              !selectedCountry
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>LGA (Local Government Area) - Optional:</Text>
            <TextInput
              style={[styles.textInput, !selectedState && styles.disabledInput]}
              value={selectedLGA}
              onChangeText={setSelectedLGA}
              placeholder={selectedState ? "Enter LGA" : "Please select a state first"}
              placeholderTextColor="#9CA3AF"
              editable={!!selectedState}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City* (required):</Text>
            {renderDropdown(
              cities.find(c => c.name === selectedCity)?.name,
              selectedState ? 'Select a city...' : 'Please select a state first',
              () => setShowCityModal(true),
              !selectedState
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City Region with Fee - Optional:</Text>
            <TextInput
              style={[styles.textInput, !selectedCity && styles.disabledInput]}
              value={selectedCityRegion}
              onChangeText={setSelectedCityRegion}
              placeholder={selectedCity ? "Enter city region" : "Please select a city first"}
              placeholderTextColor="#9CA3AF"
              editable={!!selectedCity}
            />
          </View>

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
      {renderModal(
        showLocationTypeModal,
        setShowLocationTypeModal,
        locationTypes,
        (item) => setLocationType(item.value),
        'Select Location Type'
      )}
      
      {renderModal(
        showCountryModal,
        setShowCountryModal,
        countries.map(c => ({ ...c, label: c.name })),
        (item) => {
          setSelectedCountry(item.isoCode);
          setSelectedState('');
          setSelectedCity('');
        },
        'Select Country'
      )}
      
      {renderModal(
        showStateModal,
        setShowStateModal,
        states.map(s => ({ ...s, label: s.name })),
        (item) => {
          setSelectedState(item.isoCode);
          setSelectedCity('');
        },
        'Select State'
      )}
      
      {renderModal(
        showCityModal,
        setShowCityModal,
        cities.map(c => ({ ...c, label: c.name })),
        (item) => setSelectedCity(item.name),
        'Select City'
      )}

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
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  packagePriceLabel: {
    fontSize: 12,
    color: '#7C3AED',
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
});

export default SubscriptionWizardStep3Screen;