import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';

const CreateLocationScreen = ({ navigation, route }) => {
  const { location } = route.params || {};
  const isEditing = !!location;

  const [formData, setFormData] = useState({
    country: '',
    state: '',
    lga: '',
    city: '',
  });
  const [cityRegions, setCityRegions] = useState([{ name: '', fee: '' }]);
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    countries: [],
    states: [],
    lgas: [],
    cities: [],
  });
  const [showDropdown, setShowDropdown] = useState(null);
  const [loadingDropdown, setLoadingDropdown] = useState(false);

  useEffect(() => {
    loadCountries();
    if (isEditing && location) {
      setFormData({
        country: location.country || '',
        state: location.state || '',
        lga: location.lga || '',
        city: location.city || '',
      });
      // Load existing city regions
      if (location.cityRegions && location.cityRegions.length > 0) {
        setCityRegions(location.cityRegions.map(region => ({
          name: region.name || '',
          fee: region.fee?.toString() || ''
        })));
      }
      // Load cascading data for editing
      if (location.country) loadStates(location.country);
      if (location.country && location.state) loadLGAs(location.country, location.state);
      if (location.country && location.state && location.lga) loadCities(location.country, location.state, location.lga);
    }
  }, [isEditing, location]);

  const loadCountries = async () => {
    try {
      const response = await ApiService.getExternalCountries();
      if (response.success) {
        setDropdownData(prev => ({ ...prev, countries: response.data.countries }));
      }
    } catch (error) {
      console.log('Error loading countries:', error);
    }
  };

  const loadStates = async (country) => {
    setLoadingDropdown(true);
    try {
      const response = await ApiService.getExternalStates(country);
      if (response.success) {
        setDropdownData(prev => ({ ...prev, states: response.data.states }));
      }
    } catch (error) {
      console.log('Error loading states:', error);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const loadLGAs = async (country, state) => {
    setLoadingDropdown(true);
    try {
      const response = await ApiService.getExternalLGAs(country, state);
      if (response.success) {
        setDropdownData(prev => ({ ...prev, lgas: response.data.lgas }));
      }
    } catch (error) {
      console.log('Error loading LGAs:', error);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const loadCities = async (country, state, lga) => {
    setLoadingDropdown(true);
    try {
      const response = await ApiService.getExternalCities(country, state, lga);
      if (response.success) {
        setDropdownData(prev => ({ ...prev, cities: response.data.cities }));
      }
    } catch (error) {
      console.log('Error loading cities:', error);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const handleDropdownSelect = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowDropdown(null);

    // Reset dependent fields and load next level data
    if (field === 'country') {
      setFormData(prev => ({ ...prev, state: '', lga: '', city: '' }));
      setDropdownData(prev => ({ ...prev, states: [], lgas: [], cities: [] }));
      await loadStates(value);
    } else if (field === 'state') {
      setFormData(prev => ({ ...prev, lga: '', city: '' }));
      setDropdownData(prev => ({ ...prev, lgas: [], cities: [] }));
      await loadLGAs(formData.country, value);
    } else if (field === 'lga') {
      setFormData(prev => ({ ...prev, city: '' }));
      setDropdownData(prev => ({ ...prev, cities: [] }));
      await loadCities(formData.country, formData.state, value);
    }
  };

  const addCityRegion = () => {
    setCityRegions(prev => [...prev, { name: '', fee: '' }]);
  };

  const removeCityRegion = (index) => {
    if (cityRegions.length > 1) {
      setCityRegions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateCityRegion = (index, field, value) => {
    setCityRegions(prev => prev.map((region, i) => 
      i === index ? { ...region, [field]: value } : region
    ));
  };

  const renderDropdown = (field, data, placeholder) => {
    const isDisabled = 
      (field === 'state' && !formData.country) ||
      (field === 'lga' && !formData.state) ||
      (field === 'city' && !formData.lga);

    // Use SearchableDropdown for countries
    if (field === 'country') {
      return (
        <SearchableDropdown
          placeholder={placeholder}
          value={formData[field]}
          options={data.map(item => ({ label: item.name || item, value: item.name || item }))}
          onSelect={(value) => handleDropdownSelect(field, value)}
          disabled={isDisabled}
          searchPlaceholder="Search countries..."
        />
      );
    }

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

    const currentData = dropdownData[showDropdown === 'country' ? 'countries' : 
                                   showDropdown === 'state' ? 'states' :
                                   showDropdown === 'lga' ? 'lgas' : 'cities'];

    return (
      <Modal visible={true} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowDropdown(null)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.modalTitle}>
              Select {showDropdown.charAt(0).toUpperCase() + showDropdown.slice(1)}
            </Text>
            {loadingDropdown ? (
              <ActivityIndicator size="small" color="#7C3AED" style={styles.modalLoader} />
            ) : (
              <FlatList
                data={currentData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleDropdownSelect(showDropdown, item.name || item)}
                  >
                    <Text style={styles.dropdownItemText}>
                      {item.name || item}
                    </Text>
                  </TouchableOpacity>
                )}
                maxHeight={300}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const validateForm = () => {
    const { country, state, lga, city } = formData;
    
    if (!country.trim()) {
      Alert.alert('Error', 'Country is required');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Error', 'State is required');
      return false;
    }
    if (!lga.trim()) {
      Alert.alert('Error', 'LGA is required');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    
    // Validate city regions
    for (let i = 0; i < cityRegions.length; i++) {
      const region = cityRegions[i];
      if (!region.name.trim()) {
        Alert.alert('Error', `City Region ${i + 1} name is required`);
        return false;
      }
      if (!region.fee.trim() || isNaN(Number(region.fee)) || Number(region.fee) <= 0) {
        Alert.alert('Error', `Valid fee amount is required for City Region ${i + 1}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const locationData = {
        country: formData.country.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
        city: formData.city.trim(),
        cityRegions: cityRegions.map(region => ({
          name: region.name.trim(),
          fee: Number(region.fee)
        }))
      };

      console.log('🚨 LOCATION SUBMIT DEBUG 🚨');
      console.log('Form data:', JSON.stringify(formData, null, 2));
      console.log('City regions:', JSON.stringify(cityRegions, null, 2));
      console.log('Location data being sent:', JSON.stringify(locationData, null, 2));

      let response;
      if (isEditing) {
        response = await ApiService.updateLocation(location._id, locationData);
      } else {
        response = await ApiService.createLocation(locationData);
      }

      if (response.success) {
        Alert.alert(
          'Success',
          `Location ${isEditing ? 'updated' : 'created'} successfully`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Submit error:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} location`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Location' : 'Create Location'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country *</Text>
            {renderDropdown('country', dropdownData.countries, 'Select Country')}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            {renderDropdown('state', dropdownData.states, 'Select State')}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LGA *</Text>
            {renderDropdown('lga', dropdownData.lgas, 'Select LGA')}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            {renderDropdown('city', dropdownData.cities, 'Select City')}
          </View>

          <View style={styles.cityRegionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>City Regions & Pricing</Text>
              <TouchableOpacity style={styles.addButton} onPress={addCityRegion}>
                <Ionicons name="add" size={20} color="#7C3AED" />
                <Text style={styles.addButtonText}>Add Region</Text>
              </TouchableOpacity>
            </View>

            {cityRegions.map((region, index) => (
              <View key={index} style={styles.cityRegionCard}>
                <View style={styles.cityRegionHeader}>
                  <Text style={styles.cityRegionTitle}>Region {index + 1}</Text>
                  {cityRegions.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeCityRegion(index)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.regionInputs}>
                  <View style={styles.regionInputGroup}>
                    <Text style={styles.regionLabel}>Region Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={region.name}
                      onChangeText={(value) => updateCityRegion(index, 'name', value)}
                      placeholder="e.g., Victoria Island, Ikoyi"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <View style={styles.regionInputGroup}>
                    <Text style={styles.regionLabel}>Fee (₦) *</Text>
                    <TextInput
                      style={styles.input}
                      value={region.fee}
                      onChangeText={(value) => updateCityRegion(index, 'fee', value)}
                      placeholder="e.g., 8000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Location Preview:</Text>
            <Text style={styles.previewText}>
              {formData.city || 'City'}, {formData.lga || 'LGA'}, {formData.state || 'State'}, {formData.country || 'Country'}
            </Text>
            <View style={styles.regionsPreview}>
              {cityRegions.map((region, index) => (
                <Text key={index} style={styles.regionPreview}>
                  ├── {region.name || `Region ${index + 1}`} {region.fee ? `(₦${Number(region.fee).toLocaleString()})` : ''}
                </Text>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Location' : 'Create Location'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderDropdownModal()}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
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
  placeholderText: {
    color: '#9CA3AF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLoader: {
    marginVertical: 20,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  cityRegionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  cityRegionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cityRegionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityRegionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  regionInputs: {
    gap: 12,
  },
  regionInputGroup: {
    flex: 1,
  },
  regionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  previewSection: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  regionsPreview: {
    marginTop: 4,
  },
  regionPreview: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CreateLocationScreen;