import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceManagementScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    monthlyPrice: '',
    quarterlyPrice: '',
    yearlyPrice: '',
    modules: [],
    limits: {
      maxBodyMeasurements: '',
      maxOrgUsers: ''
    }
  });

  const availableModules = [
    { key: 'body_measurements', name: 'Body Measurements Management', description: 'AI-powered body measurement analysis' },
    { key: 'user_management', name: 'User Management', description: 'Organization user management system' },
    { key: 'role_management', name: 'Role Management', description: 'Role and permission management' },
    { key: 'group_management', name: 'Group Management', description: 'User group organization' },
    { key: 'one_time_codes', name: 'One-Time Code Management', description: 'Generate and manage one-time access codes' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await ApiService.getAllServices();
      if (response.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    setFormData({
      serviceName: '',
      description: '',
      monthlyPrice: '',
      quarterlyPrice: '',
      yearlyPrice: '',
      modules: [],
      limits: {
        maxBodyMeasurements: '',
        maxOrgUsers: ''
      }
    });
    setModalVisible(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      description: service.description || '',
      monthlyPrice: service.monthlyPrice.toString(),
      quarterlyPrice: service.quarterlyPrice.toString(),
      yearlyPrice: service.yearlyPrice.toString(),
      modules: service.modules || [],
      limits: {
        maxBodyMeasurements: service.limits?.maxBodyMeasurements?.toString() || '',
        maxOrgUsers: service.limits?.maxOrgUsers?.toString() || ''
      }
    });
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!formData.serviceName || !formData.monthlyPrice || !formData.quarterlyPrice || !formData.yearlyPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.modules.length === 0) {
      Alert.alert('Error', 'Please select at least one module');
      return;
    }

    const serviceData = {
      serviceName: formData.serviceName,
      description: formData.description,
      monthlyPrice: parseFloat(formData.monthlyPrice),
      quarterlyPrice: parseFloat(formData.quarterlyPrice),
      yearlyPrice: parseFloat(formData.yearlyPrice),
      modules: formData.modules,
      limits: {
        ...(formData.limits.maxBodyMeasurements && { maxBodyMeasurements: parseInt(formData.limits.maxBodyMeasurements) }),
        ...(formData.limits.maxOrgUsers && { maxOrgUsers: parseInt(formData.limits.maxOrgUsers) })
      }
    };

    try {
      let response;
      if (editingService) {
        response = await ApiService.updateService(editingService._id, serviceData);
      } else {
        response = await ApiService.createService(serviceData);
      }

      if (response.success) {
        Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchServices();
      } else {
        Alert.alert('Error', response.message || 'Failed to save service');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save service');
    }
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.serviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteService(service._id);
              if (response.success) {
                Alert.alert('Success', 'Service deleted successfully');
                fetchServices();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    return `₦${price.toLocaleString()}`;
  };

  const toggleModule = (moduleKey) => {
    const existingModule = formData.modules.find(m => m.moduleKey === moduleKey);
    if (existingModule) {
      setFormData({
        ...formData,
        modules: formData.modules.filter(m => m.moduleKey !== moduleKey)
      });
    } else {
      const moduleInfo = availableModules.find(m => m.key === moduleKey);
      setFormData({
        ...formData,
        modules: [...formData.modules, {
          moduleKey,
          moduleName: moduleInfo.name,
          isEnabled: true
        }]
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateService}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptySubtitle}>Create your first service to get started</Text>
          </View>
        ) : (
          services.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <TouchableOpacity 
                style={styles.serviceHeader}
                onPress={() => navigation.navigate('ServiceDetails', { serviceId: service._id })}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditService(service);
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteService(service);
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              
              <View style={styles.pricingContainer}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Monthly</Text>
                  <Text style={styles.priceValue}>{formatPrice(service.monthlyPrice)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Quarterly</Text>
                  <Text style={styles.priceValue}>{formatPrice(service.quarterlyPrice)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Yearly</Text>
                  <Text style={styles.priceValue}>{formatPrice(service.yearlyPrice)}</Text>
                </View>
              </View>
              
              {service.modules && service.modules.length > 0 && (
                <View style={styles.modulesContainer}>
                  <Text style={styles.modulesTitle}>Enabled Modules:</Text>
                  {service.modules.map((module, index) => (
                    <Text key={index} style={styles.moduleItem}>• {module.moduleName}</Text>
                  ))}
                </View>
              )}
              
              {service.limits && Object.keys(service.limits).length > 0 && (
                <View style={styles.limitsContainer}>
                  <Text style={styles.limitsTitle}>Usage Limits:</Text>
                  {service.limits.maxBodyMeasurements && (
                    <Text style={styles.limitItem}>• Max Body Measurements: {service.limits.maxBodyMeasurements}</Text>
                  )}
                  {service.limits.maxOrgUsers && (
                    <Text style={styles.limitItem}>• Max Organization Users: {service.limits.maxOrgUsers}</Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Service Form Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Create Service'}
            </Text>
            <TouchableOpacity onPress={handleSaveService}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceName}
                onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
                placeholder="Enter service name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
              />
            </View>

            <Text style={styles.sectionTitle}>Pricing Tiers</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Monthly Price (₦) *</Text>
              <TextInput
                style={styles.input}
                value={formData.monthlyPrice}
                onChangeText={(text) => setFormData({ ...formData, monthlyPrice: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quarterly Price (₦) *</Text>
              <TextInput
                style={styles.input}
                value={formData.quarterlyPrice}
                onChangeText={(text) => setFormData({ ...formData, quarterlyPrice: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Yearly Price (₦) *</Text>
              <TextInput
                style={styles.input}
                value={formData.yearlyPrice}
                onChangeText={(text) => setFormData({ ...formData, yearlyPrice: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionTitle}>Modules & Features *</Text>
            <Text style={styles.sectionSubtitle}>Select modules to include in this service</Text>

            {availableModules.map((module) => {
              const isSelected = formData.modules.some(m => m.moduleKey === module.key);
              return (
                <TouchableOpacity
                  key={module.key}
                  style={[styles.moduleCard, isSelected && styles.selectedModuleCard]}
                  onPress={() => toggleModule(module.key)}
                >
                  <View style={styles.moduleInfo}>
                    <Text style={[styles.moduleName, isSelected && styles.selectedModuleName]}>
                      {module.name}
                    </Text>
                    <Text style={styles.moduleDescription}>{module.description}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.sectionTitle}>Usage Limits</Text>
            <Text style={styles.sectionSubtitle}>Set limits for resource usage (optional)</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Body Measurements</Text>
              <TextInput
                style={styles.input}
                value={formData.limits.maxBodyMeasurements}
                onChangeText={(text) => setFormData({ 
                  ...formData, 
                  limits: { ...formData.limits, maxBodyMeasurements: text }
                })}
                placeholder="e.g., 100, 500, 1000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Organization Users</Text>
              <TextInput
                style={styles.input}
                value={formData.limits.maxOrgUsers}
                onChangeText={(text) => setFormData({ 
                  ...formData, 
                  limits: { ...formData.limits, maxOrgUsers: text }
                })}
                placeholder="e.g., 10, 50, 100"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: -8,
  },
  moduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  selectedModuleCard: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedModuleName: {
    color: '#7C3AED',
  },
  moduleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modulesContainer: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
  },
  modulesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  moduleItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  limitsContainer: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  limitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  limitItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
});

export default ServiceManagementScreen;