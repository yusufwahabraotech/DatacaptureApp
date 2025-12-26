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
import ApiService from '../services/api';

const SubscriptionManagementScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [newPackage, setNewPackage] = useState({
    packageName: '',
    services: '',
    monthlyPrice: '',
    quarterlyPrice: '',
    yearlyPrice: '',
    description: '',
    promoStartDate: '',
    promoEndDate: ''
  });

  const statusOptions = [
    { key: 'all', label: 'All', color: '#6B7280' },
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'inactive', label: 'Inactive', color: '#EF4444' }
  ];

  useEffect(() => {
    checkUserRole();
    fetchSubscriptions();
  }, [selectedStatus]);

  const checkUserRole = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success && response.data.user.role !== 'SUPER_ADMIN') {
        Alert.alert('Access Denied', 'You do not have permission to access this screen.');
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.log('Error checking user role:', error);
      navigation.goBack();
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await ApiService.getSuperAdminSubscriptions(1, 50, selectedStatus === 'all' ? null : selectedStatus);
      if (response.success) {
        setSubscriptions(response.data.packages);
      }
    } catch (error) {
      console.log('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!newPackage.packageName || !newPackage.monthlyPrice) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const packageData = {
        ...newPackage,
        monthlyPrice: parseFloat(newPackage.monthlyPrice),
        quarterlyPrice: parseFloat(newPackage.quarterlyPrice) || 0,
        yearlyPrice: parseFloat(newPackage.yearlyPrice) || 0,
      };

      const response = await ApiService.createSuperAdminSubscription(packageData);
      if (response.success) {
        Alert.alert('Success', 'Subscription package created successfully!');
        setShowCreateModal(false);
        setNewPackage({
          packageName: '',
          services: '',
          monthlyPrice: '',
          quarterlyPrice: '',
          yearlyPrice: '',
          description: '',
          promoStartDate: '',
          promoEndDate: ''
        });
        fetchSubscriptions();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create subscription package');
    }
  };

  const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
    try {
      const response = await ApiService.updateSuperAdminSubscriptionStatus(subscriptionId, newStatus);
      if (response.success) {
        fetchSubscriptions();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update subscription status');
    }
  };

  const duplicatePackage = async (subscriptionId) => {
    try {
      const response = await ApiService.duplicateSuperAdminSubscription(subscriptionId);
      if (response.success) {
        Alert.alert('Success', 'Package duplicated successfully!');
        fetchSubscriptions();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate package');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.services?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search packages..."
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

      {/* Subscriptions List */}
      <ScrollView style={styles.subscriptionsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          filteredSubscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.packageName}>{subscription.packageName}</Text>
                  <Text style={styles.packageServices}>{subscription.services}</Text>
                </View>
                <View style={styles.subscriptionActions}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: subscription.status === 'active' 
                        ? '#10B981' 
                        : '#EF4444'
                    }
                  ]}>
                    <Text style={styles.statusBadgeText}>{subscription.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pricingSection}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Monthly</Text>
                  <Text style={styles.priceValue}>₦{subscription.monthlyPrice?.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Quarterly</Text>
                  <Text style={styles.priceValue}>₦{subscription.quarterlyPrice?.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Yearly</Text>
                  <Text style={styles.priceValue}>₦{subscription.yearlyPrice?.toLocaleString()}</Text>
                </View>
              </View>

              {subscription.promoStartDate && (
                <View style={styles.promoSection}>
                  <Text style={styles.promoText}>
                    Promo: {formatDate(subscription.promoStartDate)} - {formatDate(subscription.promoEndDate)}
                  </Text>
                </View>
              )}

              <View style={styles.subscriptionActionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('SubscriptionDetails', { subscriptionId: subscription.id })}
                >
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => duplicatePackage(subscription.id)}
                >
                  <Text style={styles.actionButtonText}>Duplicate</Text>
                </TouchableOpacity>
                
                {subscription.status === 'active' ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deactivateButton]}
                    onPress={() => updateSubscriptionStatus(subscription.id, 'inactive')}
                  >
                    <Text style={styles.deactivateButtonText}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => updateSubscriptionStatus(subscription.id, 'active')}
                  >
                    <Text style={styles.activateButtonText}>Activate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Subscription Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Subscription Package</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Package Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newPackage.packageName}
                  onChangeText={(text) => setNewPackage({...newPackage, packageName: text})}
                  placeholder="Enter package name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Services</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newPackage.services}
                  onChangeText={(text) => setNewPackage({...newPackage, services: text})}
                  placeholder="Enter services included"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Price *</Text>
                <TextInput
                  style={styles.input}
                  value={newPackage.monthlyPrice}
                  onChangeText={(text) => setNewPackage({...newPackage, monthlyPrice: text})}
                  placeholder="Enter monthly price"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quarterly Price</Text>
                <TextInput
                  style={styles.input}
                  value={newPackage.quarterlyPrice}
                  onChangeText={(text) => setNewPackage({...newPackage, quarterlyPrice: text})}
                  placeholder="Enter quarterly price"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yearly Price</Text>
                <TextInput
                  style={styles.input}
                  value={newPackage.yearlyPrice}
                  onChangeText={(text) => setNewPackage({...newPackage, yearlyPrice: text})}
                  placeholder="Enter yearly price"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newPackage.description}
                  onChangeText={(text) => setNewPackage({...newPackage, description: text})}
                  placeholder="Enter package description"
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
                onPress={createSubscription}
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
    paddingVertical: 0,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  subscriptionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  subscriptionCard: {
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
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageServices: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  subscriptionActions: {
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
  pricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  promoSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  promoText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
  },
  subscriptionActionButtons: {
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
  deactivateButton: {
    borderColor: '#EF4444',
  },
  deactivateButtonText: {
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

export default SubscriptionManagementScreen;