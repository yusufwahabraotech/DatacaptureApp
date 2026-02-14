import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';

const AddLocationScreen = ({ navigation, route }) => {
  const { editingLocation, locationIndex } = route.params || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [locationData, setLocationData] = useState({
    locationType: 'headquarters',
    brandName: '',
    name: '',
    country: '',
    state: '',
    lga: '',
    city: '',
    cityRegion: '',
    houseNumber: '',
    street: '',
    landmark: '',
    address: '',
    description: '',
  });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityRegionOptions, setCityRegionOptions] = useState([]);
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showLGAModal, setShowLGAModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCityRegionModal, setShowCityRegionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCountries();
    if (editingLocation) {
      setLocationData({
        locationType: editingLocation.locationType || 'headquarters',
        brandName: editingLocation.brandName || '',
        name: editingLocation.name || '',
        country: editingLocation.country || '',
        state: editingLocation.state || '',
        lga: editingLocation.lga || '',
        city: editingLocation.city || '',
        cityRegion: editingLocation.cityRegion || '',
        houseNumber: editingLocation.houseNumber || '',
        street: editingLocation.street || '',
        landmark: editingLocation.landmark || '',
        address: editingLocation.address || '',
        description: editingLocation.description || '',
      });
      
      if (editingLocation.country) {
        loadStates(editingLocation.country);
        if (editingLocation.state) {
          loadLGAs(editingLocation.country, editingLocation.state);
          if (editingLocation.lga) {
            loadCities(editingLocation.country, editingLocation.state, editingLocation.lga);
            if (editingLocation.city) {
              loadCityRegions(editingLocation.country, editingLocation.state, editingLocation.lga, editingLocation.city);
            }
          }
        }
      }
    }
  }, [editingLocation]);

  const loadCountries = async () => {
    try {
      const response = await ApiService.getExternalCountries();
      if (response.success) {
        setCountries(response.data.countries.map(c => c.name) || []);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadStates = async (countryName) => {
    try {
      const response = await ApiService.getExternalStates(countryName);
      if (response.success) {
        setStates(response.data.states.map(s => s.name) || []);
        setLgas([]);
        setCities([]);
        setCityRegionOptions([]);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadLGAs = async (countryName, stateName) => {
    try {
      const response = await ApiService.getExternalLGAs(countryName, stateName);
      if (response.success) {
        setLgas(response.data.lgas || []);
        setCities([]);
        setCityRegionOptions([]);
      }
    } catch (error) {
      console.error('Error loading LGAs:', error);
    }
  };

  const loadCities = async (country, state, lga) => {
    try {
      const response = await ApiService.getCities(country, state, lga);
      if (response.success) {
        const cityOptions = [...(response.data.cities || []), 'Others'];
        setCities(cityOptions);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities(['Others']);
    }
  };

  const loadCityRegions = async (country, state, lga, city) => {
    try {
      const response = await ApiService.getCityRegions(country, state, lga, city);
      if (response.success) {
        const options = response.data.cityRegions.map(cr => ({
          label: `${cr.name} (₦${(cr.fee || 0).toLocaleString()})`,
          value: cr.name,
          fee: cr.fee || 0
        }));
        options.push({ label: 'Others (Enter custom)', value: 'Others', fee: 0 });
        setCityRegionOptions(options);
      }
    } catch (error) {
      console.error('Error loading city regions:', error);
      setCityRegionOptions([{ label: 'Others (Enter custom)', value: 'Others', fee: 0 }]);
    }
  };

  const onCountryChange = (country) => {
    setLocationData({...locationData, country, state: '', lga: '', city: '', cityRegion: ''});
    setStates([]);
    setLgas([]);
    setCities([]);
    setCityRegionOptions([]);
    if (country) {
      loadStates(country);
    }
  };

  const onStateChange = (state) => {
    setLocationData({...locationData, state, lga: '', city: '', cityRegion: ''});
    setLgas([]);
    setCities([]);
    setCityRegionOptions([]);
    if (state && locationData.country) {
      loadLGAs(locationData.country, state);
    }
  };

  const onLGAChange = (lga) => {
    setLocationData({...locationData, lga, city: '', cityRegion: ''});
    if (lga && locationData.country && locationData.state) {
      loadCities(locationData.country, locationData.state, lga);
    }
    setCityRegionOptions([{ label: 'Others (Enter custom)', value: 'Others', fee: 0 }]);
  };

  const onCityChange = (city) => {
    setLocationData({...locationData, city, cityRegion: ''});
    if (city && locationData.country && locationData.state && locationData.lga) {
      loadCityRegions(locationData.country, locationData.state, locationData.lga, city);
    }
  };

  const onCityRegionChange = (cityRegion) => {
    setLocationData({...locationData, cityRegion});
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

  const locationTypes = [
    { label: 'Headquarters', value: 'headquarters' },
    { label: 'Branch', value: 'branch' },
  ];

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep2 = () => {
    return locationData.locationType && locationData.brandName.trim() && locationData.name.trim();
  };

  const canProceedToStep3 = () => {
    return locationData.country && locationData.state && locationData.lga && locationData.city;
  };

  const canSubmit = () => {
    return locationData.cityRegion.trim() && locationData.houseNumber.trim() && locationData.street.trim();
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        locationType: locationData.locationType,
        brandName: locationData.brandName || locationData.name,
        country: locationData.country,
        state: locationData.state,
        lga: locationData.lga,
        city: locationData.city,
        cityRegion: locationData.cityRegion,
        houseNumber: locationData.houseNumber,
        street: locationData.street,
        landmark: locationData.landmark,
        gallery: {
          images: [],
          videos: []
        }
      };

      const response = editingLocation 
        ? await ApiService.updateOrganizationLocation(locationIndex, payload)
        : await ApiService.addOrganizationLocation(payload);

      if (response.success) {
        Alert.alert('Success', `Location ${editingLocation ? 'updated' : 'added'} successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || `Failed to ${editingLocation ? 'update' : 'add'} location`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingLocation ? 'update' : 'add'} location`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location Type:</Text>
              {renderDropdown(
                locationTypes.find(t => t.value === locationData.locationType)?.label,
                'Select location type',
                () => setShowLocationTypeModal(true)
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Brand Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Brand Name *"
                placeholderTextColor="#9CA3AF"
                value={locationData.brandName}
                onChangeText={(text) => setLocationData({...locationData, brandName: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Location Name *"
                placeholderTextColor="#9CA3AF"
                value={locationData.name}
                onChangeText={(text) => setLocationData({...locationData, name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#9CA3AF"
                value={locationData.description}
                onChangeText={(text) => setLocationData({...locationData, description: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        );
      
      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Location Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country* (required):</Text>
              {renderDropdown(
                locationData.country,
                'Select a country...',
                () => setShowCountryModal(true)
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State/Province* (required):</Text>
              {renderDropdown(
                locationData.state,
                locationData.country ? 'Select a state...' : 'Please select a country first',
                () => setShowStateModal(true),
                !locationData.country
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LGA (Local Government Area) - Optional:</Text>
              {renderDropdown(
                locationData.lga,
                locationData.state ? 'Select LGA...' : 'Please select a state first',
                () => setShowLGAModal(true),
                !locationData.state
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City* (required):</Text>
              {renderDropdown(
                locationData.city,
                locationData.state ? 'Select a city...' : 'Please select a state first',
                () => setShowCityModal(true),
                !locationData.state
              )}
            </View>
          </ScrollView>
        );
      
      case 3:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Address Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City Region with Fee - Optional:</Text>
              {renderDropdown(
                locationData.cityRegion,
                locationData.city ? 'Select city region...' : 'Please select a city first',
                () => setShowCityRegionModal(true),
                !locationData.city
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House Number:</Text>
              <TextInput
                style={styles.input}
                placeholder="House Number *"
                placeholderTextColor="#9CA3AF"
                value={locationData.houseNumber}
                onChangeText={(text) => setLocationData({...locationData, houseNumber: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street:</Text>
              <TextInput
                style={styles.input}
                placeholder="Street *"
                placeholderTextColor="#9CA3AF"
                value={locationData.street}
                onChangeText={(text) => setLocationData({...locationData, street: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Landmark (optional):</Text>
              <TextInput
                style={styles.input}
                placeholder="Landmark (optional)"
                placeholderTextColor="#9CA3AF"
                value={locationData.landmark}
                onChangeText={(text) => setLocationData({...locationData, landmark: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Address (optional):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full Address (optional)"
                placeholderTextColor="#9CA3AF"
                value={locationData.address}
                onChangeText={(text) => setLocationData({...locationData, address: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        );
      
      default:
        return null;
    }
  };

  const renderStepButtons = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.nextButton, !canProceedToStep2() && styles.disabledButton]} 
            onPress={nextStep}
            disabled={!canProceedToStep2()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, !canProceedToStep3() && styles.disabledButton]} 
            onPress={nextStep}
            disabled={!canProceedToStep3()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, (!canSubmit() || loading) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!canSubmit() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {editingLocation ? 'Update Location' : 'Add Location'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editingLocation ? 'Edit Location' : 'Add Location'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepIndicatorContainer}>
            <View style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>{step}</Text>
            </View>
            {step < 3 && (
              <View style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      {renderStepContent()}
      
      {renderStepButtons()}
      
      {/* Modals */}
      <SearchableDropdown
        visible={showLocationTypeModal}
        onClose={() => setShowLocationTypeModal(false)}
        data={locationTypes}
        onSelect={(item) => setLocationData({...locationData, locationType: item.value})}
        title="Select Location Type"
        searchPlaceholder="Search location types..."
      />
      
      <SearchableDropdown
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        data={countries.map(c => ({ label: c, name: c }))}
        onSelect={(item) => onCountryChange(item.label || item.name)}
        title="Select Country"
        searchPlaceholder="Search countries..."
        showOthersOption={true}
        onOthersSelect={(customValue) => onCountryChange(customValue)}
      />
      
      <SearchableDropdown
        visible={showStateModal}
        onClose={() => setShowStateModal(false)}
        data={states.map(s => ({ label: s, name: s }))}
        onSelect={(item) => onStateChange(item.label || item.name)}
        title="Select State"
        searchPlaceholder="Search states..."
        showOthersOption={true}
        onOthersSelect={(customValue) => onStateChange(customValue)}
      />
      
      <SearchableDropdown
        visible={showLGAModal}
        onClose={() => setShowLGAModal(false)}
        data={lgas.map(l => ({ label: l, name: l }))}
        onSelect={(item) => onLGAChange(item.label || item.name)}
        title="Select LGA"
        searchPlaceholder="Search LGAs..."
        showOthersOption={true}
        onOthersSelect={(customValue) => onLGAChange(customValue)}
      />
      
      <SearchableDropdown
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        data={cities.map(c => ({ label: c, name: c }))}
        onSelect={(item) => onCityChange(item.label || item.name)}
        title="Select City"
        searchPlaceholder="Search cities..."
        showOthersOption={true}
        onOthersSelect={(customValue) => onCityChange(customValue)}
      />
      
      <SearchableDropdown
        visible={showCityRegionModal}
        onClose={() => setShowCityRegionModal(false)}
        data={cityRegionOptions.map(cr => ({ label: cr.label, name: cr.value }))}
        onSelect={(item) => onCityRegionChange(item.name)}
        title="Select City Region"
        searchPlaceholder="Search city regions..."
        showOthersOption={true}
        onOthersSelect={(customValue) => onCityRegionChange(customValue)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#7C3AED',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  stepLineActive: {
    backgroundColor: '#7C3AED',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
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
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
});

export default AddLocationScreen;