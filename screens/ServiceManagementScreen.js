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
  });

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
    });
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!formData.serviceName || !formData.monthlyPrice || !formData.quarterlyPrice || !formData.yearlyPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const serviceData = {
      serviceName: formData.serviceName,
      description: formData.description,
      monthlyPrice: parseFloat(formData.monthlyPrice),
      quarterlyPrice: parseFloat(formData.quarterlyPrice),
      yearlyPrice: parseFloat(formData.yearlyPrice),
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
});

export default ServiceManagementScreen;