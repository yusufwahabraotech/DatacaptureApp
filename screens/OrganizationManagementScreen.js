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

const OrganizationManagementScreen = ({ navigation }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [newOrg, setNewOrg] = useState({
    organizationName: '',
    email: '',
    phoneNumber: '',
    address: '',
    contactPerson: ''
  });

  const statusOptions = [
    { key: 'all', label: 'All', color: '#6B7280' },
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'suspended', label: 'Suspended', color: '#EF4444' },
    { key: 'inactive', label: 'Inactive', color: '#F59E0B' }
  ];

  useEffect(() => {
    checkUserRole();
    fetchOrganizations();
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

  const fetchOrganizations = async () => {
    try {
      const response = await ApiService.getSuperAdminOrganizationAdmins({ 
        page: 1, 
        limit: 50
      });
      if (response.success) {
        setOrganizations(response.data.admins);
      }
    } catch (error) {
      console.log('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!newOrg.organizationName || !newOrg.email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const response = await ApiService.createSuperAdminOrganization(newOrg);
      if (response.success) {
        Alert.alert('Success', `Organization created successfully!\nAccount Number: ${response.data.organization.accountNumber}`);
        setShowCreateModal(false);
        setNewOrg({ organizationName: '', email: '', phoneNumber: '', address: '', contactPerson: '' });
        fetchOrganizations();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create organization');
    }
  };

  const updateOrganizationStatus = async (orgId, newStatus) => {
    try {
      const response = await ApiService.updateSuperAdminOrganizationStatus(orgId, newStatus);
      if (response.success) {
        fetchOrganizations();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update organization status');
    }
  };

  const filteredOrganizations = organizations.filter(org => 
    org.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Text style={styles.headerTitle}>Organizations</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterContainer}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusChip,
              selectedStatus === status.key && { backgroundColor: status.color }
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === status.key && { color: 'white' }
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Organizations List */}
      <ScrollView style={styles.orgsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          filteredOrganizations.map((org) => (
            <View key={org.id} style={styles.orgCard}>
              <View style={styles.orgHeader}>
                <View style={styles.orgInfo}>
                  <View style={styles.orgAvatar}>
                    <Text style={styles.orgAvatarText}>
                      {org.organizationName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.orgDetails}>
                    <Text style={styles.orgName}>{org.organizationName}</Text>
                    <Text style={styles.orgEmail}>{org.email}</Text>
                    <Text style={styles.orgAccount}>Account: {org.accountNumber}</Text>
                  </View>
                </View>
                <View style={styles.orgActions}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: org.status === 'active' 
                        ? '#10B981' 
                        : org.status === 'suspended' 
                          ? '#EF4444' 
                          : '#F59E0B'
                    }
                  ]}>
                    <Text style={styles.statusBadgeText}>{org.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.orgMeta}>
                <Text style={styles.orgMetaText}>Contact: {org.contactPerson}</Text>
                <Text style={styles.orgMetaText}>Created: {formatDate(org.createdAt)}</Text>
              </View>

              <View style={styles.orgActionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedOrganization(org);
                    setShowDetailsModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.adminsButton]}
                  onPress={() => navigation.navigate('SuperAdminOrganizationAdmins')}
                >
                  <Text style={styles.adminsButtonText}>View All Admins</Text>
                </TouchableOpacity>
                
                {org.status === 'active' ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => updateOrganizationStatus(org.id, 'suspended')}
                  >
                    <Text style={styles.suspendButtonText}>Suspend</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => updateOrganizationStatus(org.id, 'active')}
                  >
                    <Text style={styles.activateButtonText}>Activate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Organization Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Organization Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            {selectedOrganization && (
              <ScrollView style={styles.detailsContent}>
                <View style={styles.detailsTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Company Name</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationName}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Admin Name</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.fullName}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Email</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.email}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Phone</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.phoneNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Role</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.role}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Country</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.country}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Status</Text>
                    <Text style={[styles.tableValue, { color: selectedOrganization.status === 'active' ? '#10B981' : '#EF4444' }]}>
                      {selectedOrganization.status}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Verified</Text>
                    <Text style={[styles.tableValue, { color: selectedOrganization.isVerified ? '#10B981' : '#EF4444' }]}>
                      {selectedOrganization.isVerified ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Organization ID</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationId}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Custom ID Prefix</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationDetails?.customIdPrefix || 'N/A'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>User Counter</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationDetails?.userCounter || 'N/A'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Total Users</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationStats?.totalUsers || '0'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Active Users</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationStats?.activeUsers || '0'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Pending Users</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationStats?.pendingUsers || '0'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Archived Users</Text>
                    <Text style={styles.tableValue}>{selectedOrganization.organizationStats?.archivedUsers || '0'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Created Date</Text>
                    <Text style={styles.tableValue}>{formatDate(selectedOrganization.createdAt)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Organization Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Organization</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Organization Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newOrg.organizationName}
                  onChangeText={(text) => setNewOrg({...newOrg, organizationName: text})}
                  placeholder="Enter organization name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newOrg.email}
                  onChangeText={(text) => setNewOrg({...newOrg, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newOrg.phoneNumber}
                  onChangeText={(text) => setNewOrg({...newOrg, phoneNumber: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  value={newOrg.contactPerson}
                  onChangeText={(text) => setNewOrg({...newOrg, contactPerson: text})}
                  placeholder="Enter contact person name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newOrg.address}
                  onChangeText={(text) => setNewOrg({...newOrg, address: text})}
                  placeholder="Enter organization address"
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
                onPress={createOrganization}
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
  statusFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  orgsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  orgCard: {
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
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  orgDetails: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orgEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  orgAccount: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  orgActions: {
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
  orgMeta: {
    marginBottom: 12,
  },
  orgMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  orgActionButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 8,
    paddingHorizontal: 8,
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
  adminsButton: {
    borderColor: '#10B981',
  },
  adminsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
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
  detailsModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '95%',
    maxHeight: '85%',
  },
  detailsContent: {
    padding: 20,
  },
  detailsTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  tableValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
});

export default OrganizationManagementScreen;