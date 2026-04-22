import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const ServiceProviderProfileScreen = ({ navigation, route }) => {
  const { providerId, providerData } = route.params;
  const [loading, setLoading] = useState(!providerData);
  const [refreshing, setRefreshing] = useState(false);
  const [provider, setProvider] = useState(providerData || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [currentSpecialty, setCurrentSpecialty] = useState('');
  const [saving, setSaving] = useState(false);

  // Currency and frequency options
  const currencyOptions = [
    { label: 'US Dollar ($)', value: 'USD' },
    { label: 'Nigerian Naira (₦)', value: 'NGN' },
    { label: 'British Pound (£)', value: 'GBP' },
    { label: 'Euro (€)', value: 'EUR' },
    { label: 'Canadian Dollar (C$)', value: 'CAD' },
    { label: 'Australian Dollar (A$)', value: 'AUD' },
    { label: 'Japanese Yen (¥)', value: 'JPY' },
    { label: 'Swiss Franc (CHF)', value: 'CHF' },
    { label: 'Chinese Yuan (¥)', value: 'CNY' },
    { label: 'Indian Rupee (₹)', value: 'INR' },
  ];

  const frequencyOptions = [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Per Project', value: 'per project' },
    { label: 'Per Task', value: 'per task' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annually', value: 'annually' },
  ];

  useEffect(() => {
    if (!providerData) {
      loadProviderDetails();
    }
  }, []);

  const loadProviderDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🚨 LOADING DETAILED PROVIDER INFO 🚨');
      console.log('Provider ID:', providerId);
      
      // Use the new detailed endpoint
      const response = await ApiService.getServiceProviderDetails(providerId);
      
      if (response.success && response.data.serviceProvider) {
        setProvider(response.data.serviceProvider);
        console.log('✅ Provider details loaded successfully');
      } else {
        console.log('❌ Failed to load provider details:', response.message);
        // Fallback to list endpoint if detailed endpoint fails
        const listResponse = await ApiService.getAssignedServiceProviders();
        if (listResponse.success) {
          const foundProvider = listResponse.data.serviceProviders?.find(p => p.userId === providerId);
          if (foundProvider) {
            setProvider(foundProvider);
          }
        }
      }
    } catch (error) {
      console.error('Error loading provider details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadProviderDetails(true);
  };

  const handleEditProvider = () => {
    // Initialize edit data with current provider information (with fallbacks for missing data)
    setEditData({
      specialties: provider.specialties || [],
      availabilityHours: provider.availabilityHours || '',
      isAvailable: provider.isAvailable !== false,
      maxConcurrentBookings: provider.maxConcurrentBookings?.toString() || '5',
      serviceProviderFeeName: provider.serviceProviderFeeName || 'Standard Service Fee',
      serviceProviderFeeDescription: provider.serviceProviderFeeDescription || 'Professional service provider fee',
      serviceProviderFee: provider.serviceProviderFee?.toString() || '50',
      serviceProviderFeeCurrency: provider.serviceProviderFeeCurrency || 'USD',
      serviceProviderFeeFrequency: provider.serviceProviderFeeFrequency || 'hourly'
    });
    setShowEditModal(true);
  };

  const addSpecialtyToEdit = () => {
    if (currentSpecialty.trim() && !editData.specialties.includes(currentSpecialty.trim())) {
      setEditData(prev => ({
        ...prev,
        specialties: [...prev.specialties, currentSpecialty.trim()]
      }));
      setCurrentSpecialty('');
    }
  };

  const removeSpecialtyFromEdit = (specialty) => {
    setEditData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleSaveChanges = async () => {
    // Validate required fields
    if (editData.specialties.length === 0) {
      Alert.alert('Error', 'Please add at least one specialty');
      return;
    }
    if (!editData.availabilityHours.trim()) {
      Alert.alert('Error', 'Please enter availability hours');
      return;
    }
    if (!editData.serviceProviderFeeName.trim()) {
      Alert.alert('Error', 'Please enter a fee name');
      return;
    }
    if (!editData.serviceProviderFee.trim() || isNaN(parseFloat(editData.serviceProviderFee))) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }
    if (!editData.maxConcurrentBookings.trim() || isNaN(parseInt(editData.maxConcurrentBookings))) {
      Alert.alert('Error', 'Please enter a valid number for max concurrent bookings');
      return;
    }

    setSaving(true);
    try {
      const updatePayload = {
        specialties: editData.specialties,
        availabilityHours: editData.availabilityHours.trim(),
        isAvailable: editData.isAvailable,
        maxConcurrentBookings: parseInt(editData.maxConcurrentBookings),
        serviceProviderFeeName: editData.serviceProviderFeeName.trim(),
        serviceProviderFeeDescription: editData.serviceProviderFeeDescription.trim(),
        serviceProviderFee: parseFloat(editData.serviceProviderFee),
        serviceProviderFeeCurrency: editData.serviceProviderFeeCurrency,
        serviceProviderFeeFrequency: editData.serviceProviderFeeFrequency
      };

      const response = await ApiService.updateServiceProviderDetails(provider.userId, updatePayload);

      if (response.success) {
        Alert.alert('Success', 'Service provider details updated successfully');
        setShowEditModal(false);
        // Refresh provider data
        await loadProviderDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to update service provider details');
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      Alert.alert('Error', 'Failed to update service provider details');
    } finally {
      setSaving(false);
    }
  };
  const handleRemoveProvider = () => {
    const fullName = provider.fullName || `${provider.firstName} ${provider.lastName}`;
    
    Alert.alert(
      'Remove Service Provider',
      `Are you sure you want to remove ${fullName} as a service provider? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const assignmentData = {
                userAssignments: [{
                  userId: provider.userId,
                  isServiceProvider: false
                }]
              };

              const response = await ApiService.bulkAssignServiceProviders(assignmentData);

              if (response.success) {
                Alert.alert('Success', 'Service provider removed successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', response.message || 'Failed to remove service provider');
              }
            } catch (error) {
              console.log('Error removing service provider:', error);
              Alert.alert('Error', 'Failed to remove service provider');
            }
          }
        }
      ]
    );
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'NGN': '₦',
      'GBP': '£',
      'EUR': '€',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹'
    };
    return symbols[currency] || currency;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'busy': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Provider Not Found</Text>
          <Text style={styles.errorMessage}>Unable to load provider details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = provider.fullName || `${provider.firstName} ${provider.lastName}`;
  const totalBookings = provider.totalBookings || 0;
  const completedBookings = provider.completedBookings || 0;
  const completionRate = provider.completionRate || (totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0);

  // Check if we have detailed service provider data
  const hasDetailedData = provider.specialties || provider.serviceProviderFee;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Profile</Text>
        <TouchableOpacity onPress={handleRemoveProvider}>
          <Ionicons name="trash" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Provider Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {provider.firstName?.charAt(0)}{provider.lastName?.charAt(0)}
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(provider.providerStatus || provider.status) }]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileEmail}>{provider.email}</Text>
            {provider.phoneNumber && (
              <Text style={styles.profilePhone}>{provider.phoneNumber}</Text>
            )}
            <Text style={styles.profileId}>Provider ID: {provider.providerId || provider.customUserId}</Text>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(provider.providerStatus || provider.status) }]}>
                <Text style={styles.statusText}>{provider.providerStatus || provider.status || 'active'}</Text>
              </View>
              {provider.isAvailable && (
                <View style={styles.availableBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.availableText}>Available Now</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rating and Performance */}
        <View style={styles.performanceCard}>
          <Text style={styles.cardTitle}>Performance Overview</Text>
          
          {hasDetailedData ? (
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{totalBookings}</Text>
                <Text style={styles.metricLabel}>Total Bookings</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{completedBookings}</Text>
                <Text style={styles.metricLabel}>Completed</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{completionRate}%</Text>
                <Text style={styles.metricLabel}>Success Rate</Text>
              </View>
              {provider.maxConcurrentBookings && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{provider.maxConcurrentBookings}</Text>
                  <Text style={styles.metricLabel}>Max Bookings</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="information-circle" size={48} color="#9CA3AF" />
              <Text style={styles.noDataTitle}>Performance Data Not Available</Text>
              <Text style={styles.noDataMessage}>
                Performance metrics will be available once the service provider starts receiving bookings.
              </Text>
            </View>
          )}
        </View>

        {/* Specialties */}
        <View style={styles.specialtiesCard}>
          <Text style={styles.cardTitle}>Specialties</Text>
          {provider.specialties && provider.specialties.length > 0 ? (
            <View style={styles.specialtiesList}>
              {provider.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Ionicons name="checkmark-circle" size={16} color="#7B2CBF" />
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
              <Text style={styles.noDataMessage}>
                No specialties assigned yet. Click "Edit Details" to add specialties.
              </Text>
            </View>
          )}
        </View>

        {/* Fee Information */}
        <View style={styles.feeCard}>
          <Text style={styles.cardTitle}>Fee Structure</Text>
          {provider.serviceProviderFee ? (
            <>
              <View style={styles.feeHeader}>
                <Text style={styles.feeName}>{provider.serviceProviderFeeName}</Text>
                <View style={styles.feeAmountContainer}>
                  <Text style={styles.feeAmount}>
                    {getCurrencySymbol(provider.serviceProviderFeeCurrency)}{provider.serviceProviderFee}
                  </Text>
                  <Text style={styles.feeFrequency}>per {provider.serviceProviderFeeFrequency}</Text>
                </View>
              </View>
              
              {provider.serviceProviderFeeDescription && (
                <Text style={styles.feeDescription}>{provider.serviceProviderFeeDescription}</Text>
              )}
              
              <View style={styles.feeDetails}>
                <View style={styles.feeDetailItem}>
                  <Ionicons name="card" size={16} color="#6B7280" />
                  <Text style={styles.feeDetailText}>
                    Currency: {provider.serviceProviderFeeCurrency}
                  </Text>
                </View>
                <View style={styles.feeDetailItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.feeDetailText}>
                    Frequency: {provider.serviceProviderFeeFrequency}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="card-outline" size={32} color="#9CA3AF" />
              <Text style={styles.noDataMessage}>
                No fee structure configured yet. Click "Edit Details" to set up pricing.
              </Text>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.availabilityCard}>
          <Text style={styles.cardTitle}>Availability</Text>
          {provider.availabilityHours ? (
            <>
              <View style={styles.availabilityInfo}>
                <Ionicons name="time" size={20} color="#7B2CBF" />
                <Text style={styles.availabilityText}>{provider.availabilityHours}</Text>
              </View>
              {provider.maxConcurrentBookings && (
                <View style={styles.availabilityInfo}>
                  <Ionicons name="people" size={20} color="#7B2CBF" />
                  <Text style={styles.availabilityText}>Max {provider.maxConcurrentBookings} concurrent bookings</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="time-outline" size={32} color="#9CA3AF" />
              <Text style={styles.noDataMessage}>
                No availability hours set. Click "Edit Details" to configure working hours.
              </Text>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.accountCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          
          <View style={styles.accountInfo}>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>System Role:</Text>
              <Text style={styles.accountValue}>{provider.systemRole}</Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Custom User ID:</Text>
              <Text style={styles.accountValue}>{provider.customUserId}</Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Member Since:</Text>
              <Text style={styles.accountValue}>
                {new Date(provider.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProvider}>
            <Ionicons name="create" size={20} color="#7B2CBF" />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveProvider}>
            <Ionicons name="person-remove" size={20} color="#FFFFFF" />
            <Text style={styles.removeButtonText}>Remove Provider</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Service Provider</Text>
            <TouchableOpacity 
              onPress={handleSaveChanges}
              disabled={saving}
            >
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Specialties */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Specialties</Text>
              <View style={styles.specialtyInputContainer}>
                <TextInput
                  style={styles.specialtyInput}
                  placeholder="Add a specialty"
                  value={currentSpecialty}
                  onChangeText={setCurrentSpecialty}
                />
                <TouchableOpacity style={styles.addSpecialtyButton} onPress={addSpecialtyToEdit}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.editSpecialtiesList}>
                {editData.specialties?.map((specialty, index) => (
                  <View key={index} style={styles.editSpecialtyTag}>
                    <Text style={styles.editSpecialtyText}>{specialty}</Text>
                    <TouchableOpacity onPress={() => removeSpecialtyFromEdit(specialty)}>
                      <Ionicons name="close" size={16} color="#7B2CBF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Availability Hours</Text>
              <TextInput
                style={styles.editInput}
                placeholder="e.g., 9 AM - 6 PM"
                value={editData.availabilityHours}
                onChangeText={(text) => setEditData(prev => ({ ...prev, availabilityHours: text }))}
              />
            </View>

            {/* Max Concurrent Bookings */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Max Concurrent Bookings</Text>
              <TextInput
                style={styles.editInput}
                placeholder="5"
                value={editData.maxConcurrentBookings}
                onChangeText={(text) => setEditData(prev => ({ ...prev, maxConcurrentBookings: text }))}
                keyboardType="numeric"
              />
            </View>

            {/* Availability Status */}
            <View style={styles.editSection}>
              <View style={styles.availabilityToggle}>
                <Text style={styles.editSectionTitle}>Currently Available</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, editData.isAvailable && styles.toggleButtonActive]}
                  onPress={() => setEditData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                >
                  <Text style={[styles.toggleText, editData.isAvailable && styles.toggleTextActive]}>
                    {editData.isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fee Information */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Fee Structure</Text>
              
              <Text style={styles.editLabel}>Fee Name</Text>
              <TextInput
                style={styles.editInput}
                placeholder="e.g., Premium Styling Package"
                value={editData.serviceProviderFeeName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, serviceProviderFeeName: text }))}
              />
              
              <Text style={styles.editLabel}>Fee Description</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                placeholder="Describe the services included..."
                value={editData.serviceProviderFeeDescription}
                onChangeText={(text) => setEditData(prev => ({ ...prev, serviceProviderFeeDescription: text }))}
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.editLabel}>Fee Amount</Text>
              <TextInput
                style={styles.editInput}
                placeholder="0.00"
                value={editData.serviceProviderFee}
                onChangeText={(text) => setEditData(prev => ({ ...prev, serviceProviderFee: text }))}
                keyboardType="numeric"
              />
              
              <Text style={styles.editLabel}>Currency</Text>
              <View style={styles.editPickerContainer}>
                <Picker
                  selectedValue={editData.serviceProviderFeeCurrency}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, serviceProviderFeeCurrency: value }))}
                  style={styles.editPicker}
                >
                  {currencyOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
              
              <Text style={styles.editLabel}>Frequency</Text>
              <View style={styles.editPickerContainer}>
                <Picker
                  selectedValue={editData.serviceProviderFeeFrequency}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, serviceProviderFeeFrequency: value }))}
                  style={styles.editPicker}
                >
                  {frequencyOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileId: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  performanceCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  specialtiesCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialtiesList: {
    gap: 8,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  specialtyText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  feeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  feeAmountContainer: {
    alignItems: 'flex-end',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  feeFrequency: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  feeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  feeDetails: {
    gap: 8,
  },
  feeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feeDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  availabilityCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  accountCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountInfo: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  editSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editPickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  editPicker: {
    height: 50,
  },
  specialtyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  specialtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  addSpecialtyButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSpecialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editSpecialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  editSpecialtyText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  availabilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  toggleButtonActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: 'white',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  noDataMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ServiceProviderProfileScreen;