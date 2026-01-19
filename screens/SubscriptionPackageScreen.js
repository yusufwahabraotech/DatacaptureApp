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

const SubscriptionPackageScreen = ({ navigation }) => {
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedServices: [],
    features: [''],
    discountPercentage: '',
    promoCode: '',
    promoStartDate: '',
    promoEndDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesResponse, servicesResponse] = await Promise.all([
        ApiService.getAllSubscriptionPackages(),
        ApiService.getAvailableServices(),
      ]);

      if (packagesResponse.success) {
        setPackages(packagesResponse.data.packages);
      }
      if (servicesResponse.success) {
        setServices(servicesResponse.data.services);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = () => {
    setEditingPackage(null);
    setFormData({
      title: '',
      description: '',
      selectedServices: [],
      features: [''],
      discountPercentage: '',
      promoCode: '',
      promoStartDate: '',
      promoEndDate: '',
    });
    setModalVisible(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      title: pkg.title,
      description: pkg.description,
      selectedServices: pkg.services?.map(s => ({ serviceId: s.serviceId, duration: s.duration || 'yearly' })) || [],
      features: pkg.features.length > 0 ? pkg.features : [''],
      discountPercentage: pkg.discountPercentage?.toString() || '',
      promoCode: pkg.promoCode || '',
      promoStartDate: pkg.promoStartDate ? new Date(pkg.promoStartDate).toISOString().split('T')[0] : '',
      promoEndDate: pkg.promoEndDate ? new Date(pkg.promoEndDate).toISOString().split('T')[0] : '',
    });
    setModalVisible(true);
  };

  const toggleServiceSelection = (serviceId) => {
    const existingIndex = formData.selectedServices.findIndex(s => s.serviceId === serviceId);
    if (existingIndex >= 0) {
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.filter(s => s.serviceId !== serviceId)
      });
    } else {
      setFormData({
        ...formData,
        selectedServices: [...formData.selectedServices, { serviceId, duration: 'yearly' }]
      });
    }
  };

  const updateServiceDuration = (serviceId, duration) => {
    setFormData({
      ...formData,
      selectedServices: formData.selectedServices.map(s => 
        s.serviceId === serviceId ? { ...s, duration } : s
      )
    });
  };

  const calculatePricingForAllDurations = (packageServices, discountPercentage = 0) => {
    const durations = ['monthly', 'quarterly', 'yearly'];
    const pricing = {};
    
    durations.forEach(duration => {
      let total = 0;
      packageServices.forEach(pkgService => {
        const serviceInfo = services.find(s => s._id === pkgService.serviceId);
        if (serviceInfo) {
          const priceKey = `${duration}Price`;
          total += serviceInfo[priceKey] || 0;
        }
      });
      
      const discountAmount = (total * discountPercentage) / 100;
      pricing[duration] = {
        total,
        discountAmount,
        final: total - discountAmount
      };
    });
    
    return pricing;
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      const updatedFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: updatedFeatures });
    }
  };

  const calculateFinalPrice = () => {
    const pricing = calculatePricingForAllDurations(
      formData.selectedServices,
      parseFloat(formData.discountPercentage) || 0
    );
    return pricing;
  };

  const handleSavePackage = async () => {
    if (!formData.title || !formData.description || formData.selectedServices.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and select at least one service');
      return;
    }

    const validFeatures = formData.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      Alert.alert('Error', 'Please add at least one feature');
      return;
    }

    const packageData = {
      title: formData.title,
      description: formData.description,
      services: formData.selectedServices.map(selectedService => {
        const service = services.find(s => s._id === selectedService.serviceId);
        const priceKey = `${selectedService.duration}Price`;
        return {
          serviceId: selectedService.serviceId,
          serviceName: service?.serviceName || '',
          duration: selectedService.duration,
          price: service?.[priceKey] || 0,
        };
      }),
      features: validFeatures,
      discountPercentage: parseFloat(formData.discountPercentage) || 0,
      promoCode: formData.promoCode || undefined,
      promoStartDate: formData.promoStartDate || undefined,
      promoEndDate: formData.promoEndDate || undefined,
    };

    try {
      let response;
      if (editingPackage) {
        response = await ApiService.updateSubscriptionPackage(editingPackage._id, packageData);
      } else {
        response = await ApiService.createSubscriptionPackage(packageData);
      }

      if (response.success) {
        Alert.alert('Success', `Package ${editingPackage ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Error', response.message || 'Failed to save package');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save package');
    }
  };

  const handleDeletePackage = (pkg) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${pkg.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteSubscriptionPackage(pkg._id);
              if (response.success) {
                Alert.alert('Success', 'Package deleted successfully');
                fetchData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete package');
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
        <Text style={styles.loadingText}>Loading packages...</Text>
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
        <Text style={styles.headerTitle}>Subscription Packages</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreatePackage}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {packages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Packages Found</Text>
            <Text style={styles.emptySubtitle}>Create your first subscription package</Text>
          </View>
        ) : (
          packages.map((pkg) => (
            <View key={pkg._id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <TouchableOpacity 
                  style={styles.packageInfo}
                  onPress={() => navigation.navigate('PackageDetails', { packageId: pkg._id })}
                >
                  <Text style={styles.packageTitle}>{pkg.title}</Text>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                  {pkg.promoCode && (
                    <View style={styles.promoContainer}>
                      <Text style={styles.promoCode}>Promo: {pkg.promoCode}</Text>
                      {(pkg.promoStartDate || pkg.promoEndDate) && (
                        <Text style={styles.promoDates}>
                          {pkg.promoStartDate && new Date(pkg.promoStartDate).toLocaleDateString()}
                          {pkg.promoStartDate && pkg.promoEndDate && ' - '}
                          {pkg.promoEndDate && new Date(pkg.promoEndDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.packageActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditPackage(pkg)}
                  >
                    <Ionicons name="pencil" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePackage(pkg)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.pricingInfo}>
                <Text style={styles.originalPrice}>
                  Original: {formatPrice(pkg.totalServiceCost || 0)}
                </Text>
                {pkg.discountPercentage > 0 && (
                  <Text style={styles.discount}>
                    Discount: {pkg.discountPercentage}% (-{formatPrice(pkg.discountAmount || 0)})
                  </Text>
                )}
                <Text style={styles.finalPrice}>
                  Final: {formatPrice(pkg.finalPriceAfterDiscount || pkg.totalServiceCost || 0)}
                </Text>
                
                {/* All Duration Pricing */}
                <View style={styles.allPricingContainer}>
                  <Text style={styles.pricingLabel}>Pricing Options:</Text>
                  {['monthly', 'quarterly', 'yearly'].map(duration => {
                    let total = 0;
                    pkg.services?.forEach(service => {
                      const serviceInfo = services.find(s => s._id === service.serviceId);
                      if (serviceInfo) {
                        total += serviceInfo[`${duration}Price`] || 0;
                      }
                    });
                    const discountAmount = (total * (pkg.discountPercentage || 0)) / 100;
                    const finalPrice = total - discountAmount;
                    
                    return (
                      <View key={duration} style={styles.durationPricing}>
                        <Text style={styles.durationLabel}>{duration.charAt(0).toUpperCase() + duration.slice(1)}:</Text>
                        <Text style={styles.durationPrice}>{formatPrice(finalPrice)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.servicesContainer}>
                <Text style={styles.servicesTitle}>Services:</Text>
                {pkg.services?.map((service, index) => (
                  <Text key={index} style={styles.serviceItem}>
                    • {service.serviceName} ({service.duration})
                  </Text>
                ))}
              </View>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features:</Text>
                {pkg.features?.map((feature, index) => (
                  <Text key={index} style={styles.featureItem}>• {feature}</Text>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Package Form Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPackage ? 'Edit Package' : 'Create Package'}
            </Text>
            <TouchableOpacity onPress={handleSavePackage}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Package Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter package title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter package description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Services Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services *</Text>
              <Text style={styles.selectedCount}>({formData.selectedServices.length} selected)</Text>
            </View>

            <ScrollView style={styles.servicesContainer} nestedScrollEnabled>
              {services.map((service) => {
                const selectedService = formData.selectedServices.find(s => s.serviceId === service._id);
                const isSelected = !!selectedService;
                const duration = selectedService?.duration || 'yearly';
                const priceKey = `${duration}Price`;
                const price = service[priceKey] || 0;
                
                return (
                  <View key={service._id}>
                    <TouchableOpacity
                      style={[styles.serviceCard, isSelected && styles.selectedServiceCard]}
                      onPress={() => toggleServiceSelection(service._id)}
                    >
                      <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceName, isSelected && styles.selectedServiceName]}>
                          {service.serviceName}
                        </Text>
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                        <View style={styles.priceContainer}>
                          <Text style={styles.servicePrice}>₦{(service.monthlyPrice || 0).toLocaleString()}/month</Text>
                          <Text style={styles.servicePrice}>₦{(service.quarterlyPrice || 0).toLocaleString()}/quarter</Text>
                          <Text style={styles.servicePrice}>₦{(service.yearlyPrice || 0).toLocaleString()}/year</Text>
                        </View>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                    </TouchableOpacity>
                    
                    {isSelected && (
                      <View style={styles.selectedServicePricing}>
                        <Text style={styles.selectedPricingLabel}>Pricing Options:</Text>
                        <View style={styles.allDurationPricing}>
                          {['monthly', 'quarterly', 'yearly'].map((dur) => (
                            <View key={dur} style={styles.durationPriceItem}>
                              <Text style={styles.durationName}>{dur.charAt(0).toUpperCase() + dur.slice(1)}</Text>
                              <Text style={styles.durationAmount}>₦{(service[`${dur}Price`] || 0).toLocaleString()}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Features Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Features *</Text>
              <TouchableOpacity style={styles.addFeatureButton} onPress={addFeature}>
                <Ionicons name="add" size={16} color="#7C3AED" />
                <Text style={styles.addFeatureText}>Add Feature</Text>
              </TouchableOpacity>
            </View>

            {formData.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <TextInput
                  style={[styles.input, styles.featureInput]}
                  value={feature}
                  onChangeText={(text) => updateFeature(index, text)}
                  placeholder="Enter feature"
                  placeholderTextColor="#9CA3AF"
                />
                {formData.features.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeFeatureButton}
                    onPress={() => removeFeature(index)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Pricing & Discount */}
            <View style={styles.pricingDiscountSection}>
              <Text style={styles.sectionTitle}>Pricing & Discount</Text>
            </View>
            
            <View style={styles.pricingPreview}>
              <Text style={styles.previewLabel}>Pricing for All Durations:</Text>
              {['monthly', 'quarterly', 'yearly'].map(duration => {
                const pricing = calculateFinalPrice();
                return (
                  <View key={duration} style={styles.previewRow}>
                    <Text style={styles.previewDuration}>{duration.charAt(0).toUpperCase() + duration.slice(1)}:</Text>
                    <View style={styles.previewPricing}>
                      <Text style={styles.previewTotal}>Total: {formatPrice(pricing[duration]?.total || 0)}</Text>
                      {formData.discountPercentage && (
                        <Text style={styles.previewDiscount}>
                          Discount ({formData.discountPercentage}%): -{formatPrice(pricing[duration]?.discountAmount || 0)}
                        </Text>
                      )}
                      <Text style={styles.previewFinal}>Final: {formatPrice(pricing[duration]?.final || 0)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Percentage (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.discountPercentage}
                onChangeText={(text) => setFormData({ ...formData, discountPercentage: text })}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Promo Code</Text>
              <TextInput
                style={styles.input}
                value={formData.promoCode}
                onChangeText={(text) => setFormData({ ...formData, promoCode: text })}
                placeholder="Enter promo code"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateInput}>
                <Text style={styles.label}>Promo Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.promoStartDate}
                  onChangeText={(text) => setFormData({ ...formData, promoStartDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.dateInput}>
                <Text style={styles.label}>Promo End Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.promoEndDate}
                  onChangeText={(text) => setFormData({ ...formData, promoEndDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
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
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  promoContainer: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  promoCode: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  promoDates: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
  },
  packageActions: {
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
  pricingInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeft: 4,
    borderLeftColor: '#7C3AED',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  discount: {
    fontSize: 14,
    color: '#10B981',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  servicesContainer: {
    marginBottom: 16,
    backgroundColor: '#FAFBFC',
    padding: 12,
    borderRadius: 8,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  serviceItem: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 12,
    backgroundColor: '#FAFBFC',
    padding: 12,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    marginBottom: 4,
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  addServiceText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  serviceInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  servicePickerContainer: {
    flex: 2,
  },
  durationPickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    height: 50,
  },
  removeServiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  addFeatureText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureInput: {
    flex: 1,
  },
  removeFeatureButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pricingPreview: {
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewFinal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedCount: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  servicesContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  serviceCard: {
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
  selectedServiceCard: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedServiceName: {
    color: '#7C3AED',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 1,
  },
  priceContainer: {
    marginTop: 4,
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
  durationSelector: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeDurationButton: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  durationButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeDurationButtonText: {
    color: '#7C3AED',
  },
  durationPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activeDurationPrice: {
    color: '#10B981',
  },
  allPricingContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pricingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  durationPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  durationPrice: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  previewRow: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  previewPricing: {
    paddingLeft: 12,
  },
  previewTotal: {
    fontSize: 12,
    color: '#6B7280',
  },
  previewDiscount: {
    fontSize: 12,
    color: '#10B981',
  },
  selectedServicePricing: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  selectedPricingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  allDurationPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationPriceItem: {
    alignItems: 'center',
    flex: 1,
  },
  durationName: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  durationAmount: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 2,
  },
  pricingDiscountSection: {
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
});

export default SubscriptionPackageScreen;