import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const ServiceProviderAssignmentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedProviders, setAssignedProviders] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showServiceProviderModal, setShowServiceProviderModal] = useState(false);
  const [serviceProviderData, setServiceProviderData] = useState({
    specialties: [],
    availabilityHours: '',
    serviceProviderFeeName: '',
    serviceProviderFeeDescription: '',
    serviceProviderFee: '',
    serviceProviderFeeCurrency: 'USD',
    serviceProviderFeeFrequency: 'hourly'
  });
  const [currentSpecialty, setCurrentSpecialty] = useState('');

  // Frequency options for the dropdown
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

  // Currency options
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [summaryResponse, assignedResponse, availableResponse] = await Promise.all([
        ApiService.getServiceProviderSummary(),
        ApiService.getAssignedServiceProviders(),
        ApiService.getAvailableUsersForAssignment(),
      ]);

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }

      if (assignedResponse.success) {
        console.log('🚨 ASSIGNED PROVIDERS RESPONSE 🚨');
        console.log('Assigned response:', JSON.stringify(assignedResponse, null, 2));
        // API returns serviceProviders, not users
        setAssignedProviders(assignedResponse.data.serviceProviders || []);
      }

      if (availableResponse.success) {
        console.log('🚨 AVAILABLE USERS RESPONSE 🚨');
        console.log('Available response:', JSON.stringify(availableResponse, null, 2));
        const users = availableResponse.data.users || [];
        console.log('Available users count:', users.length);
        if (users.length > 0) {
          console.log('First user sample:', JSON.stringify(users[0], null, 2));
        }
        setAvailableUsers(users);
      }

    } catch (error) {
      console.log('Error loading service provider data:', error);
      Alert.alert('Error', 'Failed to load service provider data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProceedToServiceProviderSetup = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user to assign');
      return;
    }
    setShowAssignModal(false);
    setShowServiceProviderModal(true);
  };

  const addSpecialty = () => {
    if (currentSpecialty.trim() && !serviceProviderData.specialties.includes(currentSpecialty.trim())) {
      setServiceProviderData(prev => ({
        ...prev,
        specialties: [...prev.specialties, currentSpecialty.trim()]
      }));
      setCurrentSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    setServiceProviderData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleBulkAssignment = async () => {
    // Validate required fields
    if (serviceProviderData.specialties.length === 0) {
      Alert.alert('Error', 'Please add at least one specialty');
      return;
    }
    if (!serviceProviderData.availabilityHours.trim()) {
      Alert.alert('Error', 'Please enter availability hours');
      return;
    }
    if (!serviceProviderData.serviceProviderFeeName.trim()) {
      Alert.alert('Error', 'Please enter a fee name');
      return;
    }
    if (!serviceProviderData.serviceProviderFeeDescription.trim()) {
      Alert.alert('Error', 'Please enter a fee description');
      return;
    }
    if (!serviceProviderData.serviceProviderFee.trim() || isNaN(parseFloat(serviceProviderData.serviceProviderFee))) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }

    try {
      console.log('🚨 BULK SERVICE PROVIDER ASSIGNMENT DEBUG 🚨');
      console.log('Selected users:', selectedUsers);
      console.log('Service provider data:', serviceProviderData);
      
      // Complete payload structure as per specification
      const assignmentData = {
        userAssignments: selectedUsers.map(userId => ({
          userId: userId,
          isServiceProvider: true,
          specialties: serviceProviderData.specialties,
          availabilityHours: serviceProviderData.availabilityHours.trim(),
          serviceProviderFeeName: serviceProviderData.serviceProviderFeeName.trim(),
          serviceProviderFeeDescription: serviceProviderData.serviceProviderFeeDescription.trim(),
          serviceProviderFee: parseFloat(serviceProviderData.serviceProviderFee),
          serviceProviderFeeCurrency: serviceProviderData.serviceProviderFeeCurrency,
          serviceProviderFeeFrequency: serviceProviderData.serviceProviderFeeFrequency
        }))
      };
      
      console.log('Complete assignment payload:', JSON.stringify(assignmentData, null, 2));

      const response = await ApiService.bulkAssignServiceProviders(assignmentData);

      if (response.success) {
        Alert.alert('Success', `Successfully assigned ${selectedUsers.length} service provider(s) with complete details`);
        setShowServiceProviderModal(false);
        setSelectedUsers([]);
        setServiceProviderData({
          specialties: [],
          availabilityHours: '',
          serviceProviderFeeName: '',
          serviceProviderFeeDescription: '',
          serviceProviderFee: '',
          serviceProviderFeeCurrency: 'USD',
          serviceProviderFeeFrequency: 'hourly'
        });
        await loadData(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to assign service providers');
      }
    } catch (error) {
      console.log('Error assigning service providers:', error);
      Alert.alert('Error', 'Failed to assign service providers');
    }
  };

  const handleRemoveProvider = async (userId, userName) => {
    Alert.alert(
      'Remove Service Provider',
      `Are you sure you want to remove ${userName} as a service provider?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚨 REMOVE PROVIDER DEBUG 🚨');
              console.log('Removing user ID:', userId);
              
              // Backend expects userAssignments with isServiceProvider: false
              const assignmentData = {
                userAssignments: [{
                  userId: userId,
                  isServiceProvider: false
                }]
              };
              
              console.log('Remove assignment data:', JSON.stringify(assignmentData, null, 2));

              const response = await ApiService.bulkAssignServiceProviders(assignmentData);

              if (response.success) {
                Alert.alert('Success', 'Service provider removed successfully');
                await loadData();
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

  const toggleUserSelection = (userId) => {
    console.log('🚨 TOGGLE USER SELECTION DEBUG 🚨');
    console.log('User ID being toggled:', userId);
    console.log('Current selected users:', selectedUsers);
    
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      console.log('New selected users:', newSelection);
      return newSelection;
    });
  };

  const filteredAvailableUsers = availableUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    return fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Service Provider Summary</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{assignedProviders.length}</Text>
          <Text style={styles.summaryLabel}>Active Providers</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{availableUsers.length}</Text>
          <Text style={styles.summaryLabel}>Available Users</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{summary?.totalAssignments || 0}</Text>
          <Text style={styles.summaryLabel}>Total Assignments</Text>
        </View>
      </View>
    </View>
  );

  const renderProviderItem = ({ item }) => {
    // Create fullName from firstName and lastName
    const fullName = `${item.firstName} ${item.lastName}`;
    
    return (
      <View style={styles.providerCard}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{fullName}</Text>
          <Text style={styles.providerEmail}>{item.email}</Text>
          <Text style={styles.providerRole}>{item.systemRole}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveProvider(item.userId, fullName)}
        >
          <Ionicons name="remove-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAvailableUserItem = ({ item }) => {
    // Use the correct userId field
    const userId = item.userId;
    const isSelected = selectedUsers.includes(userId);
    
    // Create fullName from firstName and lastName
    const fullName = `${item.firstName} ${item.lastName}`;
    
    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.selectedUserCard]}
        onPress={() => toggleUserSelection(userId)}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userRole}>{item.systemRole}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading service providers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderSummaryCard()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowAssignModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Assign New Providers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ServiceProviderHistory')}
          >
            <Ionicons name="time" size={20} color="#7B2CBF" />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Current Service Providers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Service Providers</Text>
          {assignedProviders.length > 0 ? (
            <FlatList
              data={assignedProviders}
              renderItem={renderProviderItem}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No service providers assigned yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Service Providers</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#CCCCCC" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.modalSubtitle}>
            Select users to assign as service providers ({selectedUsers.length} selected)
          </Text>

          <FlatList
            data={filteredAvailableUsers}
            renderItem={renderAvailableUserItem}
            keyExtractor={(item) => item.userId}
            style={styles.usersList}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAssignModal(false);
                setSelectedUsers([]);
                setSearchQuery('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.assignButton, selectedUsers.length === 0 && styles.disabledButton]}
              onPress={handleProceedToServiceProviderSetup}
              disabled={selectedUsers.length === 0}
            >
              <Text style={styles.assignButtonText}>
                Next: Setup Details {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Service Provider Setup Modal */}
      <Modal
        visible={showServiceProviderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowServiceProviderModal(false);
              setShowAssignModal(true);
            }}>
              <Ionicons name="arrow-back" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Service Provider Details</Text>
            <TouchableOpacity onPress={() => {
              setShowServiceProviderModal(false);
              setShowAssignModal(false);
              setSelectedUsers([]);
              setServiceProviderData({
                specialties: [],
                availabilityHours: '',
                serviceProviderFeeName: '',
                serviceProviderFeeDescription: '',
                serviceProviderFee: '',
                serviceProviderFeeCurrency: 'USD',
                serviceProviderFeeFrequency: 'hourly'
              });
            }}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.serviceProviderFormContainer}>
            <Text style={styles.serviceProviderFormTitle}>
              Setting up service provider details for {selectedUsers.length} selected user(s)
            </Text>

            {/* Specialties */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialties *</Text>
              <View style={styles.specialtyInputContainer}>
                <TextInput
                  style={styles.specialtyInput}
                  placeholder="Add a specialty (e.g., Hair Cutting)"
                  value={currentSpecialty}
                  onChangeText={setCurrentSpecialty}
                />
                <TouchableOpacity style={styles.addSpecialtyButton} onPress={addSpecialty}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.specialtiesList}>
                {serviceProviderData.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                    <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                      <Ionicons name="close" size={16} color="#7B2CBF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Availability Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Availability Hours *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 9 AM - 6 PM"
                value={serviceProviderData.availabilityHours}
                onChangeText={(text) => setServiceProviderData(prev => ({ ...prev, availabilityHours: text }))}
              />
            </View>

            {/* Fee Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fee Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Premium Styling Package"
                value={serviceProviderData.serviceProviderFeeName}
                onChangeText={(text) => setServiceProviderData(prev => ({ ...prev, serviceProviderFeeName: text }))}
              />
            </View>

            {/* Fee Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fee Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe the services and what the fee covers..."
                value={serviceProviderData.serviceProviderFeeDescription}
                onChangeText={(text) => setServiceProviderData(prev => ({ ...prev, serviceProviderFeeDescription: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Fee Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fee Amount *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                value={serviceProviderData.serviceProviderFee}
                onChangeText={(text) => setServiceProviderData(prev => ({ ...prev, serviceProviderFee: text }))}
                keyboardType="numeric"
              />
            </View>

            {/* Currency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Currency *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={serviceProviderData.serviceProviderFeeCurrency}
                  onValueChange={(value) => setServiceProviderData(prev => ({ ...prev, serviceProviderFeeCurrency: value }))}
                  style={styles.picker}
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
            </View>

            {/* Fee Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Frequency *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={serviceProviderData.serviceProviderFeeFrequency}
                  onValueChange={(value) => setServiceProviderData(prev => ({ ...prev, serviceProviderFeeFrequency: value }))}
                  style={styles.picker}
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

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowServiceProviderModal(false);
                setShowAssignModal(true);
              }}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.assignButton}
              onPress={handleBulkAssignment}
            >
              <Text style={styles.assignButtonText}>
                Assign ({selectedUsers.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#7B2CBF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  providerEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  providerRole: {
    fontSize: 12,
    color: '#7B2CBF',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedUserCard: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F8F4FF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#7B2CBF',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7B2CBF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  serviceProviderFormContainer: {
    flex: 1,
    padding: 16,
  },
  serviceProviderFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  specialtyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addSpecialtyButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  specialtyText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
});

export default ServiceProviderAssignmentScreen;