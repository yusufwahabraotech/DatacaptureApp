import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

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
        }
      }
    }
  }, [editingLocation]);

  const loadCountries = async () => {
    try {
      const response = await ApiService.getExternalCountries();
      if (response.success) {
        setCountries(response.data.countries);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadStates = async (countryName) => {
    try {
      const response = await ApiService.getExternalStates(countryName);
      if (response.success) {
        setStates(response.data.states);
        setLgas([]);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadLGAs = async (countryName, stateName) => {
    try {
      const response = await ApiService.getExternalLGAs(countryName, stateName);
      if (response.success) {
        setLgas(response.data.lgas);
      }
    } catch (error) {
      console.error('Error loading LGAs:', error);
    }
  };

  const onCountryChange = (country) => {
    setLocationData({...locationData, country, state: '', lga: ''});
    setStates([]);
    setLgas([]);
    if (country) {
      loadStates(country);
    }
  };

  const onStateChange = (state) => {
    setLocationData({...locationData, state, lga: ''});
    setLgas([]);
    if (state && locationData.country) {
      loadLGAs(locationData.country, state);
    }
  };

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
    return locationData.country && locationData.state && locationData.lga;
  };

  const canSubmit = () => {
    return locationData.city.trim() && locationData.cityRegion.trim() && 
           locationData.houseNumber.trim() && locationData.street.trim();
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            
            <CustomDropdown
              placeholder="Location Type *"
              value={locationData.locationType}
              options={[
                { label: 'Headquarters', value: 'headquarters' },
                { label: 'Branch', value: 'branch' }
              ]}
              onSelect={(type) => setLocationData({...locationData, locationType: type})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Brand Name *"
              placeholderTextColor="#9CA3AF"
              value={locationData.brandName}
              onChangeText={(text) => setLocationData({...locationData, brandName: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Location Name *"
              placeholderTextColor="#9CA3AF"
              value={locationData.name}
              onChangeText={(text) => setLocationData({...locationData, name: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#9CA3AF"
              value={locationData.description}
              onChangeText={(text) => setLocationData({...locationData, description: text})}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        );
      
      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Location Details</Text>
            
            <CustomDropdown
              placeholder="Select Country *"
              value={locationData.country}
              options={countries.map(c => ({ label: c.name, value: c.name }))}
              onSelect={onCountryChange}
            />
            
            <CustomDropdown
              placeholder="Select State *"
              value={locationData.state}
              options={states.map(s => ({ label: s.name, value: s.name }))}
              onSelect={onStateChange}
              disabled={states.length === 0}
            />
            
            <CustomDropdown
              placeholder="Select LGA *"
              value={locationData.lga}
              options={lgas.map(lga => ({ label: lga, value: lga }))}
              onSelect={(lga) => setLocationData({...locationData, lga})}
              disabled={lgas.length === 0}
            />
          </ScrollView>
        );
      
      case 3:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Address Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder="City *"
              placeholderTextColor="#9CA3AF"
              value={locationData.city}
              onChangeText={(text) => setLocationData({...locationData, city: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="City Region *"
              placeholderTextColor="#9CA3AF"
              value={locationData.cityRegion}
              onChangeText={(text) => setLocationData({...locationData, cityRegion: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="House Number *"
              placeholderTextColor="#9CA3AF"
              value={locationData.houseNumber}
              onChangeText={(text) => setLocationData({...locationData, houseNumber: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Street *"
              placeholderTextColor="#9CA3AF"
              value={locationData.street}
              onChangeText={(text) => setLocationData({...locationData, street: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Landmark (optional)"
              placeholderTextColor="#9CA3AF"
              value={locationData.landmark}
              onChangeText={(text) => setLocationData({...locationData, landmark: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full Address (optional)"
              placeholderTextColor="#9CA3AF"
              value={locationData.address}
              onChangeText={(text) => setLocationData({...locationData, address: text})}
              multiline
              numberOfLines={3}
            />
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
            style={[styles.submitButton, !canSubmit() && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!canSubmit()}
          >
            <Text style={styles.submitButtonText}>
              {editingLocation ? 'Update Location' : 'Add Location'}
            </Text>
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