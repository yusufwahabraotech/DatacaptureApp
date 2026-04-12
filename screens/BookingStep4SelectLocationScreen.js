import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingStep4SelectLocationScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot, customerInfo, guests } = route.params;
  const [loading, setLoading] = useState(true);
  const [locationOptions, setLocationOptions] = useState({});
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [whatsappLocationUrl, setWhatsappLocationUrl] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadLocationOptions();
  }, []);

  const loadLocationOptions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getLocationOptions(
        service.organizationId,
        service._id
      );

      if (response.success) {
        const options = response.data.locationOptions || {};
        setLocationOptions(options);
        
        // Set default selection
        const defaultOption = response.data.defaultOption || 'merchant_location';
        setSelectedLocationType(defaultOption);
      } else {
        Alert.alert('Error', 'Failed to load location options');
      }
    } catch (error) {
      console.error('Error loading location options:', error);
      Alert.alert('Error', 'Failed to load location options');
    } finally {
      setLoading(false);
    }
  };

  const validateLocationSelection = async () => {
    const locationData = {
      locationType: selectedLocationType,
      customerEmail: customerInfo.email,
    };

    // Add required fields based on location type
    if (selectedLocationType === 'new_address') {
      if (!customAddress.trim()) {
        Alert.alert('Required Field', 'Please enter the address');
        return false;
      }
      locationData.address = customAddress.trim();
    }

    if (selectedLocationType === 'whatsapp_location') {
      if (!whatsappLocationUrl.trim()) {
        Alert.alert('Required Field', 'Please enter the WhatsApp location URL');
        return false;
      }
      locationData.whatsappLocationUrl = whatsappLocationUrl.trim();
    }

    try {
      setValidating(true);
      const response = await ApiService.validateLocationSelection(locationData);
      
      if (response.success) {
        return locationData;
      } else {
        Alert.alert('Validation Error', response.message || 'Invalid location selection');
        return false;
      }
    } catch (error) {
      console.error('Error validating location:', error);
      Alert.alert('Error', 'Failed to validate location selection');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleNext = async () => {
    const validatedLocation = await validateLocationSelection();
    if (!validatedLocation) return;

    navigation.navigate('BookingStep5ConfirmSchedule', {
      service,
      selectedDate,
      selectedSlot,
      customerInfo,
      guests,
      bookingLocation: validatedLocation,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderLocationOption = (optionKey, option) => {
    const isSelected = selectedLocationType === optionKey;
    
    return (
      <TouchableOpacity
        key={optionKey}
        style={[
          styles.locationOption,
          isSelected && styles.selectedLocationOption,
        ]}
        onPress={() => setSelectedLocationType(optionKey)}
      >
        <View style={styles.locationOptionContent}>
          <View style={styles.locationOptionHeader}>
            <Text style={[
              styles.locationOptionTitle,
              isSelected && styles.selectedLocationOptionTitle,
            ]}>
              {option.label}
            </Text>
            <View style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
          
          {option.description && (
            <Text style={styles.locationOptionDescription}>
              {option.description}
            </Text>
          )}
          
          {option.address && (
            <Text style={styles.locationAddress}>
              {option.address}
            </Text>
          )}
          
          {option.organizationName && (
            <Text style={styles.organizationName}>
              {option.organizationName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderInputField = () => {
    const option = locationOptions[selectedLocationType];
    if (!option || !option.requiresInput) return null;

    if (selectedLocationType === 'new_address') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Address *</Text>
          <TextInput
            style={styles.input}
            value={customAddress}
            onChangeText={setCustomAddress}
            placeholder={option.placeholder || 'Enter full address'}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      );
    }

    if (selectedLocationType === 'whatsapp_location') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>WhatsApp Location URL *</Text>
          <TextInput
            style={styles.input}
            value={whatsappLocationUrl}
            onChangeText={setWhatsappLocationUrl}
            placeholder={option.placeholder || 'Paste WhatsApp location URL'}
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text style={styles.inputHint}>
            Share your location from WhatsApp and paste the Google Maps link here
          </Text>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading location options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
        </View>
        <Text style={styles.progressText}>Step 4 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.bookingSummary}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedSlot.displayTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>{customerInfo.name}</Text>
          </View>
          {guests.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests:</Text>
              <Text style={styles.summaryValue}>{guests.length} guest(s)</Text>
            </View>
          )}
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where should the service be provided?</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the location where you'd like to receive the service
          </Text>

          <View style={styles.locationOptions}>
            {Object.entries(locationOptions).map(([key, option]) =>
              renderLocationOption(key, option)
            )}
          </View>

          {renderInputField()}
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#7B2CBF" />
            <Text style={styles.infoTitle}>Location Information</Text>
          </View>
          <Text style={styles.infoText}>
            The service provider will travel to your selected location. Make sure the address is accurate and accessible.
          </Text>
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, validating && styles.disabledButton]}
          onPress={handleNext}
          disabled={validating}
        >
          {validating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Continue to Confirmation</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#7B2CBF',
  },
  completedStep: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  bookingSummary: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  section: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  locationOptions: {
    gap: 12,
    marginBottom: 20,
  },
  locationOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  selectedLocationOption: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  locationOptionContent: {
    flex: 1,
  },
  locationOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  selectedLocationOptionTitle: {
    color: '#7B2CBF',
  },
  locationOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#7B2CBF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
    minHeight: 48,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  locationInfo: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingStep4SelectLocationScreen;