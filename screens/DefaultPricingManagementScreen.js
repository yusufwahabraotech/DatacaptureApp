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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';

const DefaultPricingManagementScreen = ({ navigation }) => {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [cities, setCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
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

  const loadCities = async (countryName, stateName, lga) => {
    try {
      const response = await ApiService.getExternalCities(countryName, stateName, lga);
      if (response.success) {
        setCities(response.data.cities.map(city => ({ name: city, value: city })));
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleDropdownSelect = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowDropdown(null);

    // Reset dependent fields and load next level data
    if (field === 'country') {
      setFormData(prev => ({ ...prev, state: '', lga: '', city: '' }));
      setStates([]);
      setLgas([]);
      setCities([]);
      if (value) {
        await loadStates(value);
      }
    } else if (field === 'state') {
      setFormData(prev => ({ ...prev, lga: '', city: '' }));
      setLgas([]);
      setCities([]);
      if (value && formData.country) {
        await loadLGAs(formData.country, value);
      }
    } else if (field === 'lga') {
      setFormData(prev => ({ ...prev, city: '' }));
      setCities([]);
      if (value && formData.country && formData.state) {
        await loadCities(formData.country, formData.state, value);
      }
    }
  };

  const openEditModal = (pricing) => {
    setEditingPricing(pricing);
    setFormData({
      country: pricing.country || '',
      state: pricing.state || '',
      lga: pricing.lga || '',
      city: pricing.city || '',
      defaultFee: pricing.defaultFee?.toString() || '',
      description: pricing.description || ''
    });
    setShowCreateModal(true);
  };

  const renderDropdown = (field, data, placeholder) => {
    const isDisabled = 
      (field === 'state' && !formData.country) ||
      (field === 'lga' && !formData.state) ||
      (field === 'city' && !formData.lga);

    return (
      <TouchableOpacity
        style={[styles.dropdown, isDisabled && styles.disabledDropdown]}
        onPress={() => !isDisabled && setShowDropdown(field)}
        disabled={isDisabled}
      >
        <Text style={[styles.dropdownText, !formData[field] && styles.placeholderText]}>
          {formData[field] || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={isDisabled ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>
    );
  };

  const renderDropdownModal = () => {
    if (!showDropdown) return null;

    const currentData = showDropdown === 'country' ? countries :
                       showDropdown === 'state' ? states :
                       showDropdown === 'lga' ? lgas : cities;

    return (
      <SearchableDropdown
        visible={true}
        onClose={() => setShowDropdown(null)}
        data={currentData.map(item => ({ label: item.name || item, value: item.name || item }))}
        onSelect={(item) => handleDropdownSelect(showDropdown, item.value || item.label)}
        title={`Select ${showDropdown.charAt(0).toUpperCase() + showDropdown.slice(1)}`}
        searchPlaceholder={`Search ${showDropdown}...`}
        showOthersOption={true}
        onOthersSelect={(customValue) => handleDropdownSelect(showDropdown, customValue)}
      />
    );
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
      let response;
      if (editingPricing) {
        response = await ApiService.updateDefaultPricing(editingPricing._id, pricingData);
      } else {
        response = await ApiService.createDefaultPricing(pricingData);
      }
      
      if (response.success) {
        Alert.alert('Success', `Default pricing ${editingPricing ? 'updated' : 'created'} successfully`);
        setShowCreateModal(false);
        setEditingPricing(null);
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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
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
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => openEditModal(pricing)}
                    >
                      <Ionicons name="pencil" size={16} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePricing(pricing._id)}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
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
      <Modal 
        visible={showCreateModal} 
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContainer}>
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
                <Text style={styles.modalTitle}>{editingPricing ? 'Edit' : 'Create'} Default Pricing</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Country *</Text>
                  {renderDropdown('country', countries, 'Select Country')}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>State (Optional)</Text>
                  {renderDropdown('state', states, 'Select State')}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LGA (Optional)</Text>
                  {renderDropdown('lga', lgas, 'Select LGA')}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City (Optional)</Text>
                  {renderDropdown('city', cities, 'Select City')}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Default Fee (₦) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Default Fee (₦) *"
                    placeholderTextColor="#6B7280"
                    value={formData.defaultFee}
                    onChangeText={(defaultFee) => setFormData({...formData, defaultFee})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={formData.description}
                    onChangeText={(description) => setFormData({...formData, description})}
                    multiline
                    numberOfLines={3}
                  />
                </View>

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
                    <Text style={styles.createButtonText}>{editingPricing ? 'Update' : 'Create'}</Text>
                  </TouchableOpacity>
                </View>

              {/* Dropdown Modal */}
              {renderDropdownModal()}
            </ScrollView>
          </View>
          </KeyboardAvoidingView>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F5F3FF',
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
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  disabledDropdown: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
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
});

export default DefaultPricingManagementScreen;