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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingStep3EnterDetailsScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Customer Selection State
  const [customerType, setCustomerType] = useState('existing'); // 'existing' or 'external'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // External Customer State
  const [externalCustomer, setExternalCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Service Provider Selection State
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  // Booking Details State
  const [customerNotes, setCustomerNotes] = useState('');
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    loadOrganizationUsers();
    loadServiceProviders();
  }, []);

  const loadOrganizationUsers = async () => {
    try {
      const response = await ApiService.getAdminBookingOrganizationUsers(
        customerSearch,
        1,
        20
      );

      if (response.success) {
        setOrgUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading organization users:', error);
    }
  };

  const loadServiceProviders = async () => {
    try {
      console.log('🚨 LOADING SERVICE PROVIDERS DEBUG 🚨');
      console.log('Service ID:', service._id);
      console.log('Service object:', JSON.stringify(service, null, 2));
      
      // Call the correct admin booking service providers endpoint
      const response = await ApiService.getAdminBookingServiceProviders(
        service._id
      );

      console.log('🚨 BOOKING SERVICE PROVIDERS RESPONSE 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data && response.data.providers) {
        console.log('🚨 SETTING SERVICE PROVIDERS FROM BACKEND 🚨');
        console.log('Providers from backend:', response.data.providers);
        console.log('Providers count:', response.data.providers.length);
        console.log('Total from backend:', response.data.total);
        
        // The backend response structure matches exactly what we expect
        // Each provider has: id, providerId, name, email, phoneNumber, specialties, rating, completedTasks, etc.
        setServiceProviders(response.data.providers);
      } else {
        console.log('❌ SERVICE PROVIDERS LOAD FAILED ❌');
        console.log('Error message:', response.message);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        
        // If the main endpoint fails, try the fallback
        console.log('🚨 TRYING FALLBACK SERVICE PROVIDERS ENDPOINT 🚨');
        const fallbackResponse = await ApiService.getAssignedServiceProviders();
        console.log('Fallback response:', JSON.stringify(fallbackResponse, null, 2));
        
        if (fallbackResponse.success && fallbackResponse.data?.serviceProviders) {
          // Transform the fallback data structure to match what the booking screen expects
          const providers = fallbackResponse.data.serviceProviders.map(provider => ({
            id: provider.userId,
            providerId: provider.customUserId || provider.userId,
            name: `${provider.firstName} ${provider.lastName}`,
            email: provider.email,
            phoneNumber: provider.phoneNumber || '',
            specialties: provider.serviceProviderInfo?.specialties || [],
            rating: provider.serviceProviderInfo?.rating || 0,
            completedTasks: provider.serviceProviderInfo?.completedBookings || 0,
            totalBookings: provider.serviceProviderInfo?.totalBookings || 0,
            isAvailable: provider.serviceProviderInfo?.isAvailable || true,
            availabilityHours: provider.serviceProviderInfo?.availabilityHours || '',
            maxConcurrentBookings: provider.serviceProviderInfo?.maxConcurrentBookings || 1,
            serviceProviderFee: provider.serviceProviderInfo?.serviceProviderFee || 0,
            serviceProviderFeeCurrency: provider.serviceProviderInfo?.serviceProviderFeeCurrency || 'NGN',
            serviceProviderFeeFrequency: provider.serviceProviderInfo?.serviceProviderFeeFrequency || 'per-service'
          }));
          
          console.log('🚨 TRANSFORMED FALLBACK PROVIDERS 🚨');
          console.log('Providers:', JSON.stringify(providers, null, 2));
          setServiceProviders(providers);
        } else {
          setServiceProviders([]);
        }
      }
    } catch (error) {
      console.error('❌ SERVICE PROVIDERS LOAD ERROR:', error);
      setServiceProviders([]);
    }
  };

  const handleNext = () => {
    // Validate customer selection
    if (customerType === 'existing' && !selectedCustomer) {
      Alert.alert('Customer Required', 'Please select a customer from your organization');
      return;
    }
    
    if (customerType === 'external') {
      if (!externalCustomer.name.trim() || !externalCustomer.email.trim()) {
        Alert.alert('Customer Details Required', 'Please enter customer name and email');
        return;
      }
    }

    const bookingDetails = {
      customerType,
      customer: customerType === 'existing' ? selectedCustomer : externalCustomer,
      serviceProvider: selectedProvider,
      customerNotes,
      guests,
    };

    navigation.navigate('AdminBookingStep4SelectLocation', {
      service,
      selectedDate,
      selectedSlot,
      bookingDetails,
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

  const filteredOrgUsers = orgUsers.filter(user =>
    user.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedCustomer(item);
        setShowCustomerModal(false);
        setCustomerSearch('');
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemName}>{item.name}</Text>
        <Text style={styles.modalItemEmail}>{item.email}</Text>
        {item.customUserId && (
          <Text style={styles.modalItemId}>ID: {item.customUserId}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item }) => {
    console.log('🚨 RENDERING PROVIDER ITEM 🚨');
    console.log('Provider item:', JSON.stringify(item, null, 2));
    console.log('Provider name:', item.name);
    console.log('Provider email:', item.email);
    console.log('Provider ID:', item.id);
    console.log('Provider providerId:', item.providerId);
    
    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          console.log('🚨 PROVIDER SELECTED 🚨');
          console.log('Selected provider:', JSON.stringify(item, null, 2));
          setSelectedProvider(item);
          setShowProviderModal(false);
        }}
      >
        <View style={styles.modalItemContent}>
          <Text style={styles.modalItemName}>{item.name || 'No Name'}</Text>
          <Text style={styles.modalItemEmail}>{item.email || 'No Email'}</Text>
          {item.providerId && (
            <Text style={styles.modalItemId}>ID: {item.providerId}</Text>
          )}
          {item.phoneNumber && (
            <Text style={styles.modalItemEmail}>Phone: {item.phoneNumber}</Text>
          )}
          <View style={styles.providerMeta}>
            <Text style={styles.providerRating}>⭐ {item.rating || 'N/A'}</Text>
            <Text style={styles.providerTasks}>{item.completedTasks || 0} tasks</Text>
          </View>
          {item.specialties && item.specialties.length > 0 && (
            <Text style={styles.modalItemEmail}>Specialties: {item.specialties.join(', ')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Booking - Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
        <Text style={styles.progressText}>Step 3 of 5</Text>
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
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Customer</Text>
          <Text style={styles.sectionSubtitle}>Choose who this booking is for</Text>
          
          <View style={styles.customerTypeContainer}>
            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'existing' && styles.customerTypeButtonActive,
              ]}
              onPress={() => setCustomerType('existing')}
            >
              <Text style={[
                styles.customerTypeText,
                customerType === 'existing' && styles.customerTypeTextActive,
              ]}>
                Organization User
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'external' && styles.customerTypeButtonActive,
              ]}
              onPress={() => setCustomerType('external')}
            >
              <Text style={[
                styles.customerTypeText,
                customerType === 'external' && styles.customerTypeTextActive,
              ]}>
                External Customer
              </Text>
            </TouchableOpacity>
          </View>

          {customerType === 'existing' ? (
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={[
                styles.dropdownText,
                !selectedCustomer && styles.placeholderText,
              ]}>
                {selectedCustomer ? selectedCustomer.name : 'Select organization user'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <View style={styles.externalCustomerForm}>
              <TextInput
                style={styles.input}
                placeholder="Customer Name *"
                value={externalCustomer.name}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, name: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Customer Email *"
                value={externalCustomer.email}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Customer Phone (Optional)"
                value={externalCustomer.phone}
                onChangeText={(text) => setExternalCustomer({...externalCustomer, phone: text})}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </View>

        {/* Service Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign Service Provider</Text>
          <Text style={styles.sectionSubtitle}>Choose who will provide the service</Text>
          
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowProviderModal(true)}
          >
            <Text style={[
              styles.dropdownText,
              !selectedProvider && styles.placeholderText,
            ]}>
              {selectedProvider ? selectedProvider.name : 'Select service provider (Optional)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {selectedProvider && (
            <View style={styles.selectedProviderInfo}>
              <Text style={styles.selectedProviderName}>{selectedProvider.name}</Text>
              <Text style={styles.selectedProviderEmail}>{selectedProvider.email}</Text>
              {selectedProvider.providerId && (
                <Text style={styles.selectedProviderEmail}>ID: {selectedProvider.providerId}</Text>
              )}
              {selectedProvider.phoneNumber && (
                <Text style={styles.selectedProviderEmail}>Phone: {selectedProvider.phoneNumber}</Text>
              )}
              <View style={styles.providerMeta}>
                <Text style={styles.providerRating}>⭐ {selectedProvider.rating || 'N/A'}</Text>
                <Text style={styles.providerTasks}>{selectedProvider.completedTasks || 0} completed tasks</Text>
              </View>
              {selectedProvider.specialties && selectedProvider.specialties.length > 0 && (
                <Text style={styles.selectedProviderEmail}>Specialties: {selectedProvider.specialties.join(', ')}</Text>
              )}
              {selectedProvider.availabilityHours && (
                <Text style={styles.selectedProviderEmail}>Hours: {selectedProvider.availabilityHours}</Text>
              )}
            </View>
          )}
        </View>

        {/* Customer Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.sectionSubtitle}>Any special requests or notes</Text>
          
          <TextInput
            style={styles.textArea}
            placeholder="Enter any special instructions or notes..."
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue to Location</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>
          
          <FlatList
            data={filteredOrgUsers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </SafeAreaView>
      </Modal>

      {/* Service Provider Selection Modal */}
      <Modal
        visible={showProviderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Service Provider</Text>
            <TouchableOpacity onPress={() => setShowProviderModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          {/* Debug Info */}
          <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Debug: {serviceProviders.length} providers loaded</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>Service ID: {service._id}</Text>
          </View>
          
          <FlatList
            data={serviceProviders}
            renderItem={renderProviderItem}
            keyExtractor={(item) => item.id || item._id || Math.random().toString()}
            style={styles.modalList}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="people-outline" size={48} color="#CCCCCC" style={{ marginBottom: 16 }} />
                <Text style={{ color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>No service providers available</Text>
                <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>You need to assign service providers first before you can select them for bookings.</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#7B2CBF',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onPress={() => {
                    setShowProviderModal(false);
                    // Navigate to service provider management
                    navigation.navigate('ServiceProviderManagement');
                  }}
                >
                  <Ionicons name="person-add" size={16} color="white" />
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Setup Service Providers</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
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
    gap: 20,
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
    marginBottom: 16,
  },
  customerTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  customerTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  customerTypeButtonActive: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  customerTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  customerTypeTextActive: {
    color: '#7B2CBF',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  externalCustomerForm: {
    gap: 12,
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
  selectedProviderInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  selectedProviderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedProviderEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  providerMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  providerRating: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  providerTasks: {
    fontSize: 14,
    color: '#6B7280',
  },
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemContent: {
    gap: 4,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItemEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalItemId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default AdminBookingStep3EnterDetailsScreen;