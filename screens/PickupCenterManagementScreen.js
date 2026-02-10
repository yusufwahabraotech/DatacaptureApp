import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const PickupCenterManagementScreen = ({ navigation }) => {
  const [pickupCenters, setPickupCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formData, setFormData] = useState({
    centerName: '',
    amount: '',
    address: '',
    contactNumber: '',
    operatingDays: '',
    operatingHours: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchPickupCenters();
  }, []);

  useEffect(() => {
    fetchPickupCenters();
  }, [filterActive]);

  const fetchPickupCenters = async () => {
    try {
      const response = await ApiService.getAllPickupCenters(filterActive);
      if (response.success) {
        setPickupCenters(response.data.pickupCenters);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pickup centers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.centerName.trim() || !formData.amount || !formData.address.trim() || 
        !formData.contactNumber.trim() || !formData.operatingDays.trim() || !formData.operatingHours.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(formData.amount) || Number(formData.amount) < 0) {
      Alert.alert('Error', 'Amount must be a valid positive number');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      let response;
      if (editingCenter) {
        response = await ApiService.updatePickupCenter(editingCenter.id, payload);
      } else {
        response = await ApiService.createPickupCenter(payload);
      }

      if (response.success) {
        Alert.alert('Success', response.message);
        setModalVisible(false);
        resetForm();
        fetchPickupCenters();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (center) => {
    Alert.alert(
      'Delete Pickup Center',
      `Are you sure you want to delete "${center.centerName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePickupCenter(center.id),
        },
      ]
    );
  };

  const deletePickupCenter = async (id) => {
    try {
      const response = await ApiService.deletePickupCenter(id);
      if (response.success) {
        Alert.alert('Success', 'Pickup center deleted successfully');
        fetchPickupCenters();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete pickup center');
    }
  };

  const openModal = (center = null) => {
    setEditingCenter(center);
    setFormData({
      centerName: center?.centerName || '',
      amount: center?.amount?.toString() || '',
      address: center?.address || '',
      contactNumber: center?.contactNumber || '',
      operatingDays: center?.operatingDays || '',
      operatingHours: center?.operatingHours || '',
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      centerName: '',
      amount: '',
      address: '',
      contactNumber: '',
      operatingDays: '',
      operatingHours: '',
    });
    setEditingCenter(null);
  };

  const renderPickupCenterItem = ({ item }) => (
    <View style={styles.centerCard}>
      <View style={styles.centerInfo}>
        <View style={styles.centerHeader}>
          <Text style={styles.centerName}>{item.centerName}</Text>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text style={styles.centerAmount}>₦{item.amount.toLocaleString()}</Text>
        <Text style={styles.centerAddress}>{item.address}</Text>
        <Text style={styles.centerContact}>📞 {item.contactNumber}</Text>
        <Text style={styles.centerOperating}>🗓️ {item.operatingDays}</Text>
        <Text style={styles.centerOperating}>🕒 {item.operatingHours}</Text>
        <Text style={styles.centerDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openModal(item)}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading pickup centers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#7B2CBF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Centers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={styles.dropdownText}>
            {filterActive === 'all' ? 'All Centers' : filterActive === 'true' ? 'Active Only' : 'Inactive Only'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showFilterDropdown && (
          <View style={styles.dropdownList}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilterActive('all');
                setShowFilterDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>All Centers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilterActive('true');
                setShowFilterDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Active Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilterActive('false');
                setShowFilterDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Inactive Only</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Total Centers: {pickupCenters.length}</Text>
      </View>

      <FlatList
        data={pickupCenters}
        renderItem={renderPickupCenterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPickupCenters} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pickup centers found</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCenter ? 'Edit Pickup Center' : 'Create Pickup Center'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Center Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.centerName}
                  onChangeText={(text) => setFormData({ ...formData, centerName: text })}
                  placeholder="Enter center name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup Fee (₦) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="Enter pickup fee"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter full address"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contactNumber}
                  onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
                  placeholder="+234 801 234 5678"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Operating Days *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.operatingDays}
                  onChangeText={(text) => setFormData({ ...formData, operatingDays: text })}
                  placeholder="Monday - Saturday"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Operating Hours *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.operatingHours}
                  onChangeText={(text) => setFormData({ ...formData, operatingHours: text })}
                  placeholder="9:00 AM - 7:00 PM"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateOrUpdate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingCenter ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 40,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerInfo: {
    flex: 1,
    marginRight: 10,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#155724',
  },
  inactiveText: {
    color: '#721c24',
  },
  centerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  centerAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  centerContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  centerOperating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  centerDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#7B2CBF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PickupCenterManagementScreen;