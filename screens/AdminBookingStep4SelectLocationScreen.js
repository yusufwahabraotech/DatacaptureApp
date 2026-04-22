import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingStep4SelectLocationScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot, bookingDetails } = route.params;
  const [loading, setLoading] = useState(true);
  const [locationOptions, setLocationOptions] = useState({});
  const [selectedLocationType, setSelectedLocationType] = useState('merchant_location');
  const [customAddress, setCustomAddress] = useState('');
  const [whatsappLocationUrl, setWhatsappLocationUrl] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  useEffect(() => {
    loadLocationOptions();
  }, []);

  const loadLocationOptions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAdminBookingLocationOptions(
        service._id
      );

      if (response.success) {
        setLocationOptions(response.data.locationOptions || {});
        setOrganizationName(response.data.organizationName || '');
        setSelectedLocationType(response.data.defaultOption || 'merchant_location');
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

  const validateLocation = async () => {
    try {
      const locationData = {
        locationType: selectedLocationType,
        address: customAddress,
        whatsappLocationUrl: whatsappLocationUrl,
        customerEmail: bookingDetails.customerType === 'existing' 
          ? bookingDetails.customer.email 
          : bookingDetails.customer.email,
      };

      const response = await ApiService.validateAdminBookingLocation(locationData);
      return response;
    } catch (error) {
      console.error('Error validating location:', error);
      return { success: false, message: 'Failed to validate location' };
    }
  };

  const handleNext = async () => {
    // Validate required fields based on location type
    if (selectedLocationType === 'new_address' && !customAddress.trim()) {
      Alert.alert('Address Required', 'Please enter a complete address');
      return;
    }

    if (selectedLocationType === 'whatsapp_location' && !whatsappLocationUrl.trim()) {
      Alert.alert('WhatsApp Location Required', 'Please paste the WhatsApp location URL');
      return;
    }

    // Validate location
    const validationResult = await validateLocation();
    if (!validationResult.success) {
      Alert.alert('Location Error', validationResult.message);
      return;
    }

    const locationData = {
      type: selectedLocationType,
      address: selectedLocationType === 'new_address' ? customAddress : 
               selectedLocationType === 'merchant_location' ? locationOptions.merchantLocation?.address : '',
      whatsappLocationUrl: selectedLocationType === 'whatsapp_location' ? whatsappLocationUrl : '',
    };

    navigation.navigate('AdminBookingStep5ConfirmSchedule', {
      service,
      selectedDate,
      selectedSlot,
      bookingDetails,
      locationData,
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
        <View style={styles.locationOptionHeader}>
          <View style={[
            styles.radioButton,
            isSelected && styles.radioButtonSelected,
          ]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={[
            styles.locationOptionTitle,
            isSelected && styles.selectedLocationOptionTitle,
          ]}>
            {option.label}
          </Text>
        </View>
        
        {option.description && (
          <Text style={styles.locationOptionDescription}>
            {option.description}
          </Text>
        )}
        
        {option.address && (
          <Text style={styles.locationOptionAddress}>
            {option.address}
          </Text>
        )}
        
        {option.organizationName && (
          <Text style={styles.organizationName}>
            {option.organizationName}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Booking - Location</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Booking - Location</Text>
        <View style={{ width: 24 }} />
      </View>

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
        {/* Service Summary */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.bookingSummary}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar" size={16} color="#7B2CBF" />
              <Text style={styles.summaryText}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={16} color="#7B2CBF" />
              <Text style={styles.summaryText}>{selectedSlot.displayTime}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="person" size={16} color="#7B2CBF" />
              <Text style={styles.summaryText}>
                {bookingDetails.customerType === 'existing' 
                  ? bookingDetails.customer.name 
                  : bookingDetails.customer.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          <Text style={styles.sectionSubtitle}>Where will the service be provided?</Text>
          
          <View style={styles.locationOptionsContainer}>
            {Object.entries(locationOptions).map(([key, option]) => 
              renderLocationOption(key, option)
            )}
          </View>

          {/* Custom Address Input */}
          {selectedLocationType === 'new_address' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Complete Address</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter the full address where the service will be provided..."
                value={customAddress}
                onChangeText={setCustomAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* WhatsApp Location Input */}
          {selectedLocationType === 'whatsapp_location' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>WhatsApp Location URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste WhatsApp location link here..."
                value={whatsappLocationUrl}
                onChangeText={setWhatsappLocationUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.inputHint}>
                Open WhatsApp, share location, and paste the link here
              </Text>
            </View>
          )}
        </View>

        {/* Location Summary */}
        <View style={styles.locationSummary}>
          <View style={styles.locationSummaryHeader}>
            <Ionicons name="location" size={20} color="#10B981" />
            <Text style={styles.locationSummaryTitle}>Selected Location</Text>
          </View>
          
          <Text style={styles.locationSummaryType}>
            {locationOptions[selectedLocationType]?.label}
          </Text>
          
          {selectedLocationType === 'merchant_location' && (
            <Text style={styles.locationSummaryAddress}>
              {locationOptions.merchantLocation?.address}
            </Text>
          )}
          
          {selectedLocationType === 'new_address' && customAddress && (
            <Text style={styles.locationSummaryAddress}>
              {customAddress}
            </Text>
          )}
          
          {selectedLocationType === 'customer_address' && (
            <Text style={styles.locationSummaryAddress}>
              Customer's registered address will be used
            </Text>
          )}
          
          {selectedLocationType === 'whatsapp_location' && whatsappLocationUrl && (
            <Text style={styles.locationSummaryAddress}>
              WhatsApp location link provided
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue to Confirmation</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
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
  serviceInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  bookingSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
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
  locationOptionsContainer: {
    gap: 12,
  },
  locationOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  selectedLocationOption: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  locationOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
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
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedLocationOptionTitle: {
    color: '#7B2CBF',
  },
  locationOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationOptionAddress: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  organizationName: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  locationSummary: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  locationSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationSummaryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  locationSummaryAddress: {
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
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminBookingStep4SelectLocationScreen;