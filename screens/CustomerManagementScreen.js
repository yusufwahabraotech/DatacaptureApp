import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomerManagementScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    email: '',
    phoneNumber: '',
    state: '',
    lga: '',
    address: '',
    customerId: ''
  });

  const statusOptions = [
    { key: 'all', label: 'All', color: '#6B7280' },
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'suspended', label: 'Suspended', color: '#EF4444' },
    { key: 'inactive', label: 'Inactive', color: '#F59E0B' }
  ];

  useEffect(() => {
    fetchCustomers();
  }, [selectedStatus]);

  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      let url = 'https://datacapture-backend.onrender.com/api/super-admin/customers?page=1&limit=50';
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCustomers(data.data.customers);
      }
    } catch (error) {
      console.log('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomer.customerName || !newCustomer.email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://datacapture-backend.onrender.com/api/super-admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Customer created successfully!\nAccount Number: ${data.data.customer.accountNumber}`);
        setShowCreateModal(false);
        setNewCustomer({ customerName: '', email: '', phoneNumber: '', state: '', lga: '', address: '', customerId: '' });
        fetchCustomers();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create customer');
    }
  };

  const updateCustomerStatus = async (customerId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/super-admin/customers/${customerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCustomers();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer status');
    }
  };

  const resetCustomerPassword = async (customerId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/super-admin/customers/${customerId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Password reset successfully!\nNew Password: ${data.data.newPassword}`);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusButton,
              selectedStatus === status.key && { backgroundColor: status.color }
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text style={[
              styles.statusButtonText,
              selectedStatus === status.key && { color: 'white' }
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Customers List */}
      <ScrollView style={styles.customersList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {customer.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{customer.customerName}</Text>
                    <Text style={styles.customerEmail}>{customer.email}</Text>
                    <Text style={styles.customerCustomId}>{customer.customerId}</Text>
                  </View>
                </View>
                <View style={styles.customerActions}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: customer.status === 'active' 
                        ? '#10B981' 
                        : customer.status === 'suspended' 
                          ? '#EF4444' 
                          : '#F59E0B'
                    }
                  ]}>
                    <Text style={styles.statusBadgeText}>{customer.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.customerMeta}>
                <Text style={styles.customerMetaText}>Location: {customer.state}, {customer.lga}</Text>
                <Text style={styles.customerMetaText}>Account: {customer.accountNumber}</Text>
                <Text style={styles.customerMetaText}>Created: {formatDate(customer.createdAt)}</Text>
              </View>

              <View style={styles.customerActionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CustomerDetails', { customerId: customer.id })}
                >
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => resetCustomerPassword(customer.id)}
                >
                  <Text style={styles.actionButtonText}>Reset Password</Text>
                </TouchableOpacity>
                
                {customer.status === 'active' ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => updateCustomerStatus(customer.id, 'suspended')}
                  >
                    <Text style={styles.suspendButtonText}>Suspend</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => updateCustomerStatus(customer.id, 'active')}
                  >
                    <Text style={styles.activateButtonText}>Activate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Customer Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Customer</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.customerName}
                  onChangeText={(text) => setNewCustomer({...newCustomer, customerName: text})}
                  placeholder="Enter customer name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.phoneNumber}
                  onChangeText={(text) => setNewCustomer({...newCustomer, phoneNumber: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.state}
                  onChangeText={(text) => setNewCustomer({...newCustomer, state: text})}
                  placeholder="Enter state"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LGA</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.lga}
                  onChangeText={(text) => setNewCustomer({...newCustomer, lga: text})}
                  placeholder="Enter LGA"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer ID</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.customerId}
                  onChangeText={(text) => setNewCustomer({...newCustomer, customerId: text})}
                  placeholder="Enter custom ID (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  placeholder="Enter customer address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={createCustomer}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statusFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  customerCustomId: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  customerActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  customerMeta: {
    marginBottom: 12,
  },
  customerMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7C3AED',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
  },
  suspendButton: {
    borderColor: '#EF4444',
  },
  suspendButtonText: {
    color: '#EF4444',
  },
  activateButton: {
    borderColor: '#10B981',
  },
  activateButtonText: {
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    fontWeight: '500',
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
    fontWeight: '500',
    color: 'white',
  },
});

export default CustomerManagementScreen;