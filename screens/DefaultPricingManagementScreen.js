import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
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

const DefaultPricingManagementScreen = ({ navigation }) => {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [showCustomCountry, setShowCustomCountry] = useState(false);
  const [showCustomState, setShowCustomState] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    lga: '',
    city: '',
    defaultFee: '',
    description: ''
  });

  useEffect(() => {
    loadPricingList();
    loadCountries();
  }, []);

  const loadPricingList = async () => {
    try {
      const response = await ApiService.getAllDefaultPricing();
      if (response.success) {
        setPricingList(response.data.pricing || []);
      }
    } catch (error) {
      console.error('Error loading pricing list:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (country === 'Others') {
      setShowCustomCountry(true);
      setFormData({...formData, country: '', state: '', lga: '', city: ''});
      setStates([]);
      setLgas([]);
    } else {
      setShowCustomCountry(false);
      setFormData({...formData, country, state: '', lga: '', city: ''});
      setStates([]);
      setLgas([]);
      if (country) {
        loadStates(country);
      }
    }
  };

  const onStateChange = (state) => {
    if (state === 'Others') {
      setShowCustomState(true);
      setFormData({...formData, state: '', lga: '', city: ''});
      setLgas([]);
    } else {
      setShowCustomState(false);
      setFormData({...formData, state, lga: '', city: ''});
      setLgas([]);
      if (state && formData.country) {
        loadLGAs(formData.country, state);
      }
    }
  };

  const createDefaultPricing = async () => {
    console.log('Form data before validation:', formData);
    
    if (!formData.country || !formData.defaultFee || formData.defaultFee.trim() === '') {
      Alert.alert('Error', 'Country and default fee are required');
      return;
    }

    const feeValue = parseInt(formData.defaultFee.trim());
    if (isNaN(feeValue) || feeValue <= 0) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }

    try {
      const pricingData = {
        country: formData.country,
        ...(formData.state && { state: formData.state }),
        ...(formData.lga && { lga: formData.lga }),
        ...(formData.city && { city: formData.city }),
        defaultFee: feeValue,
        description: formData.description
      };

      console.log('Sending pricing data:', pricingData);
      const response = await ApiService.createDefaultPricing(pricingData);
      
      if (response.success) {
        Alert.alert('Success', 'Default pricing created successfully');
        setShowCreateModal(false);
        setFormData({
          country: '',
          state: '',
          lga: '',
          city: '',
          defaultFee: '',
          description: ''
        });
        loadPricingList();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Create pricing error:', error);
      Alert.alert('Error', 'Failed to create default pricing');
    }
  };

  const deletePricing = (pricingId) => {
    Alert.alert(
      'Delete Pricing',
      'Are you sure you want to delete this default pricing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteDefaultPricing(pricingId);
              if (response.success) {
                Alert.alert('Success', 'Default pricing deleted successfully');
                loadPricingList();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pricing');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price) => `₦${price.toLocaleString()}`;

  const getPricingLevel = (pricing) => {
    if (pricing.city) return 'City';
    if (pricing.lga) return 'LGA';
    if (pricing.state) return 'State';
    return 'Country';
  };

  const getPricingLocation = (pricing) => {
    const parts = [];
    if (pricing.city) parts.push(pricing.city);
    if (pricing.lga) parts.push(pricing.lga);
    if (pricing.state) parts.push(pricing.state);
    parts.push(pricing.country);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Default Pricing</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {pricingList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={80} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Default Pricing Set</Text>
            <Text style={styles.emptyText}>Create default pricing for different geographic levels</Text>
          </View>
        ) : (
          pricingList.map((pricing) => (
            <View key={pricing._id} style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <View>
                  <Text style={styles.pricingLevel}>{getPricingLevel(pricing)} Level</Text>
                  <Text style={styles.pricingLocation}>{getPricingLocation(pricing)}</Text>
                </View>
                <View style={styles.pricingActions}>
                  <Text style={styles.pricingFee}>{formatPrice(pricing.defaultFee)}</Text>
                  <TouchableOpacity onPress={() => deletePricing(pricing._id)}>
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              {pricing.description && (
                <Text style={styles.pricingDescription}>{pricing.description}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Pricing Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView 
                style={styles.modalContainer}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Create Default Pricing</Text>
                
                <CustomDropdown
                  placeholder="Select Country *"
                  value={formData.country}
                  options={[...countries.map(c => ({ label: c.name, value: c.name })), { label: 'Others', value: 'Others' }]}
                  onSelect={onCountryChange}
                />
                
                {showCustomCountry && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Custom Country *"
                    placeholderTextColor="#6B7280"
                    value={formData.country}
                    onChangeText={(country) => setFormData({...formData, country})}
                  />
                )}
                
                <CustomDropdown
                  placeholder="Select State (Optional)"
                  value={formData.state}
                  options={[...states.map(s => ({ label: s.name, value: s.name })), { label: 'Others', value: 'Others' }]}
                  onSelect={onStateChange}
                />
                
                {showCustomState && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Custom State"
                    placeholderTextColor="#6B7280"
                    value={formData.state}
                    onChangeText={(state) => setFormData({...formData, state})}
                  />
                )}
                
                <CustomDropdown
                  placeholder="Select LGA (Optional)"
                  value={formData.lga}
                  options={lgas.map(lga => ({ label: lga, value: lga }))}
                  onSelect={(lga) => setFormData({...formData, lga})}
                  disabled={lgas.length === 0}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Default Fee (₦) *"
                  placeholderTextColor="#6B7280"
                  value={formData.defaultFee}
                  onChangeText={(defaultFee) => setFormData({...formData, defaultFee})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="City (Optional)"
                  placeholderTextColor="#6B7280"
                  value={formData.city}
                  onChangeText={(city) => setFormData({...formData, city})}
                />
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  placeholderTextColor="#6B7280"
                  value={formData.description}
                  onChangeText={(description) => setFormData({...formData, description})}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={createDefaultPricing}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pricingLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  pricingLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 4,
  },
  pricingActions: {
    alignItems: 'flex-end',
  },
  pricingFee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default DefaultPricingManagementScreen;