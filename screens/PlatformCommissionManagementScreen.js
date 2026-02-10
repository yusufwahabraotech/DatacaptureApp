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

const PlatformCommissionManagementScreen = ({ navigation }) => {
  const [commissions, setCommissions] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [formData, setFormData] = useState({
    commissionName: '',
    commissionRate: '',
    industryId: '',
    categoryId: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterIndustryId, setFilterIndustryId] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [filterIndustryId]);

  useEffect(() => {
    if (formData.industryId) {
      fetchCategoriesForIndustry(formData.industryId);
    } else {
      setCategories([]);
      setFormData(prev => ({ ...prev, categoryId: '' }));
    }
  }, [formData.industryId]);

  const loadData = async () => {
    await Promise.all([fetchIndustries(), fetchCommissions()]);
  };

  const fetchIndustries = async () => {
    try {
      const response = await ApiService.getAllIndustries();
      if (response.success) {
        setIndustries(response.data.industries);
      }
    } catch (error) {
      console.error('Failed to fetch industries:', error);
    }
  };

  const fetchCategoriesForIndustry = async (industryId) => {
    try {
      const response = await ApiService.getAllCategories(industryId);
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const response = await ApiService.getAllPlatformCommissions(filterIndustryId);
      if (response.success) {
        setCommissions(response.data.commissions);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch commissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.commissionName.trim() || !formData.commissionRate || 
        !formData.industryId || !formData.categoryId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const rate = parseFloat(formData.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert('Error', 'Commission rate must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        commissionRate: rate,
      };

      let response;
      if (editingCommission) {
        response = await ApiService.updatePlatformCommission(editingCommission.id, {
          commissionName: payload.commissionName,
          commissionRate: payload.commissionRate,
          description: payload.description,
        });
      } else {
        response = await ApiService.createPlatformCommission(payload);
      }

      if (response.success) {
        Alert.alert('Success', response.message);
        setModalVisible(false);
        resetForm();
        fetchCommissions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commission) => {
    Alert.alert(
      'Delete Commission',
      `Are you sure you want to delete "${commission.commissionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCommission(commission.id),
        },
      ]
    );
  };

  const deleteCommission = async (id) => {
    try {
      const response = await ApiService.deletePlatformCommission(id);
      if (response.success) {
        Alert.alert('Success', 'Commission deleted successfully');
        fetchCommissions();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete commission');
    }
  };

  const openModal = (commission = null) => {
    setEditingCommission(commission);
    setFormData({
      commissionName: commission?.commissionName || '',
      commissionRate: commission?.commissionRate?.toString() || '',
      industryId: commission?.industryId || '',
      categoryId: commission?.categoryId || '',
      description: commission?.description || '',
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      commissionName: '',
      commissionRate: '',
      industryId: '',
      categoryId: '',
      description: '',
    });
    setCategories([]);
    setEditingCommission(null);
  };

  const getIndustryName = (industryId) => {
    const industry = industries.find(ind => ind.id === industryId);
    return industry?.name || 'Unknown Industry';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const renderCommissionItem = ({ item }) => (
    <View style={styles.commissionCard}>
      <View style={styles.commissionInfo}>
        <Text style={styles.commissionName}>{item.commissionName}</Text>
        <Text style={styles.commissionRate}>{item.commissionRate}% Commission</Text>
        <Text style={styles.industryName}>{item.industryName}</Text>
        <Text style={styles.categoryName}>{item.categoryName}</Text>
        {item.description && (
          <Text style={styles.commissionDescription}>{item.description}</Text>
        )}
        <Text style={styles.commissionDate}>
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
        <Text style={styles.loadingText}>Loading commissions...</Text>
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
        <Text style={styles.headerTitle}>Platform Commissions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Industry:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={styles.dropdownText}>
            {filterIndustryId ? getIndustryName(filterIndustryId) : 'All Industries'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showFilterDropdown && (
          <View style={styles.dropdownList}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilterIndustryId('');
                setShowFilterDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>All Industries</Text>
            </TouchableOpacity>
            {industries.map((industry) => (
              <TouchableOpacity
                key={industry.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setFilterIndustryId(industry.id);
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{industry.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Total Commissions: {commissions.length}</Text>
      </View>

      <FlatList
        data={commissions}
        renderItem={renderCommissionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cash" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No commissions found</Text>
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
                {editingCommission ? 'Edit Commission' : 'Create Commission'}
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
                <Text style={styles.inputLabel}>Commission Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.commissionName}
                  onChangeText={(text) => setFormData({ ...formData, commissionName: text })}
                  placeholder="Enter commission name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Commission Rate (%) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.commissionRate}
                  onChangeText={(text) => setFormData({ ...formData, commissionRate: text })}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              {!editingCommission && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Industry *</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowIndustryDropdown(!showIndustryDropdown)}
                    >
                      <Text style={[styles.dropdownText, !formData.industryId && styles.placeholderText]}>
                        {formData.industryId ? getIndustryName(formData.industryId) : 'Select Industry'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    {showIndustryDropdown && (
                      <View style={styles.dropdownList}>
                        {industries.map((industry) => (
                          <TouchableOpacity
                            key={industry.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setFormData({ ...formData, industryId: industry.id, categoryId: '' });
                              setShowIndustryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{industry.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category *</Text>
                    <TouchableOpacity
                      style={[styles.dropdownButton, !formData.industryId && styles.disabledButton]}
                      onPress={() => formData.industryId && setShowCategoryDropdown(!showCategoryDropdown)}
                      disabled={!formData.industryId}
                    >
                      <Text style={[styles.dropdownText, !formData.categoryId && styles.placeholderText]}>
                        {formData.categoryId ? getCategoryName(formData.categoryId) : 'Select Category'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    {showCategoryDropdown && formData.industryId && (
                      <View style={styles.dropdownList}>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setFormData({ ...formData, categoryId: category.id });
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{category.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter commission description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
                      {editingCommission ? 'Update' : 'Create'}
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
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
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
  commissionCard: {
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
  commissionInfo: {
    flex: 1,
    marginRight: 10,
  },
  commissionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  commissionRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  industryName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 4,
  },
  commissionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  commissionDate: {
    fontSize: 12,
    color: '#999',
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
    height: 100,
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

export default PlatformCommissionManagementScreen;