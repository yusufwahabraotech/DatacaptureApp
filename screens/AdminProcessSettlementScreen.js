import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const AdminProcessSettlementScreen = ({ route, navigation }) => {
  const { serviceProviderId, orderId, taskId, serviceId } = route.params || {};
  
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(serviceProviderId || '');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [adminBankName, setAdminBankName] = useState('');
  const [adminAccountNumber, setAdminAccountNumber] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString());
  const [paymentEvidenceUrl, setPaymentEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadServiceProviders();
  }, []);

  const loadServiceProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await ApiService.getServiceProviders();
      console.log('🚨 SERVICE PROVIDERS RESPONSE 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const providersData = response.data.serviceProviders || response.data.providers || [];
        console.log('Providers count:', providersData.length);
        setProviders(providersData);
      } else {
        Alert.alert('Error', 'Failed to load service providers');
      }
    } catch (error) {
      console.log('Error loading service providers:', error);
      Alert.alert('Error', 'Failed to load service providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  const selectProvider = (provider) => {
    setSelectedProviderId(provider.userId);
    
    // Auto-populate amount and currency from provider's fee
    if (provider.serviceProviderFee) {
      setAmount(provider.serviceProviderFee.toString());
    }
    if (provider.serviceProviderFeeCurrency) {
      setCurrency(provider.serviceProviderFeeCurrency);
    }
    
    // Auto-populate description with provider details
    if (provider.serviceProviderFeeFrequency) {
      const frequencyText = provider.serviceProviderFeeFrequency === 'per_service' 
        ? 'per service' 
        : provider.serviceProviderFeeFrequency;
      setDescription(`Payment for completed service - ${provider.serviceProviderFee} ${provider.serviceProviderFeeCurrency} (${frequencyText})`);
    }
    
    setShowProviderModal(false);
  };

  const getSelectedProviderName = () => {
    const provider = providers.find(p => p.userId === selectedProviderId);
    if (!provider) return 'Select Service Provider';
    return `${provider.firstName} ${provider.lastName}` || provider.email || 'Unknown Provider';
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      console.log('🚨 UPLOADING PAYMENT EVIDENCE 🚨');
      console.log('Image URI:', uri);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await ApiService.uploadToCloudinary(uri);
      
      console.log('✅ Upload successful:', cloudinaryUrl);
      setPaymentEvidenceUrl(cloudinaryUrl);
      Alert.alert('Success', 'Payment evidence uploaded successfully');
    } catch (error) {
      console.log('❌ Upload failed:', error);
      Alert.alert('Error', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedProviderId || !description || !amount || !adminBankName || !adminAccountNumber || !paymentEvidenceUrl) {
      Alert.alert('Error', 'Please fill in all required fields and upload payment evidence');
      return;
    }

    setLoading(true);
    try {
      const settlementData = {
        serviceProviderId: selectedProviderId,
        description,
        amount: parseFloat(amount),
        currency,
        adminBankName,
        adminAccountNumber,
        settlementDate,
        paymentEvidenceUrl,
      };

      if (orderId) settlementData.orderId = orderId;
      if (taskId) settlementData.taskId = taskId;
      if (serviceId) settlementData.serviceId = serviceId;

      const response = await ApiService.processSettlement(settlementData);

      if (response.success) {
        Alert.alert('Success', 'Settlement processed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to process settlement');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Process Settlement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Process payment to service provider for completed services
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Service Provider *</Text>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowProviderModal(true)}
            disabled={loadingProviders}
          >
            {loadingProviders ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <>
                <Text style={[styles.pickerText, !selectedProviderId && { color: '#999' }]}>
                  {getSelectedProviderName()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Payment for completed haircut service - Order #BK123"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 2 }]}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="5000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Currency</Text>
            <TextInput
              style={styles.input}
              value={currency}
              onChangeText={setCurrency}
              placeholder="NGN"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Bank Name *</Text>
          <TextInput
            style={styles.input}
            value={adminBankName}
            onChangeText={setAdminBankName}
            placeholder="e.g., GTBank"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Account Number *</Text>
          <TextInput
            style={styles.input}
            value={adminAccountNumber}
            onChangeText={setAdminAccountNumber}
            placeholder="0987654321"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Payment Evidence *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#7C3AED" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#7C3AED" />
                <Text style={styles.uploadText}>
                  {paymentEvidenceUrl ? 'Evidence Uploaded ✓' : 'Upload Payment Receipt'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.processButton, loading && styles.processButtonDisabled]}
          onPress={handleProcess}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.processButtonText}>Process Settlement</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Service Provider Selection Modal */}
      <Modal
        visible={showProviderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProviderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Provider</Text>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {providers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No service providers found</Text>
              </View>
            ) : (
              <FlatList
                data={providers}
                keyExtractor={(item) => item.userId || item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.providerItem,
                      selectedProviderId === item.userId && styles.providerItemSelected
                    ]}
                    onPress={() => selectProvider(item)}
                  >
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>
                        {`${item.firstName} ${item.lastName}` || 'Unknown'}
                      </Text>
                      {item.email && (
                        <Text style={styles.providerEmail}>{item.email}</Text>
                      )}
                      {item.serviceProviderFee && (
                        <View style={styles.feeInfo}>
                          <Text style={styles.feeText}>
                            Fee: {item.serviceProviderFeeCurrency} {item.serviceProviderFee.toLocaleString()}
                            {item.serviceProviderFeeFrequency && ` (${item.serviceProviderFeeFrequency.replace('_', ' ')})`}
                          </Text>
                        </View>
                      )}
                      {item.bankDetails && (
                        <View style={styles.bankInfo}>
                          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          <Text style={styles.bankText}>Bank details added</Text>
                        </View>
                      )}
                    </View>
                    {selectedProviderId === item.userId && (
                      <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.providerList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  providerList: {
    padding: 16,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  providerItemSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  providerPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  feeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  bankText: {
    fontSize: 11,
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  uploadText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  processButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  processButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminProcessSettlementScreen;
