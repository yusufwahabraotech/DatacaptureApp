import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const ProcessRemittanceScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [amountRemitted, setAmountRemitted] = useState(order.totalAmountPaid?.toString() || '');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [superAdminBankName, setSuperAdminBankName] = useState('');
  const [superAdminAccountNumber, setSuperAdminAccountNumber] = useState('');
  const [paymentEvidenceUrl, setPaymentEvidenceUrl] = useState('');

  const uploadPaymentEvidence = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permissions are required to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        // Upload to Cloudinary (you can implement this based on your existing upload logic)
        const uploadedUrl = await ApiService.uploadToCloudinary(result.assets[0].uri);
        setPaymentEvidenceUrl(uploadedUrl);
        Alert.alert('Success', 'Payment evidence uploaded successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload payment evidence');
      }
    }
  };

  const validateForm = () => {
    if (!amountRemitted || parseFloat(amountRemitted) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid amount');
      return false;
    }
    if (!settlementDate) {
      Alert.alert('Required Field', 'Settlement date is required');
      return false;
    }
    if (!superAdminBankName.trim()) {
      Alert.alert('Required Field', 'Your bank name is required');
      return false;
    }
    if (!superAdminAccountNumber.trim()) {
      Alert.alert('Required Field', 'Your account number is required');
      return false;
    }
    if (!paymentEvidenceUrl) {
      Alert.alert('Required Field', 'Payment evidence is required');
      return false;
    }
    return true;
  };

  const handleProcessRemittance = async () => {
    if (!validateForm()) return;

    // Check if bank details exist
    if (!order.organizationBankDetails) {
      Alert.alert('Error', 'Organization bank details are not available');
      return;
    }

    setLoading(true);
    try {
      const remittanceData = {
        organizationBankName: order.organizationBankDetails.bankName,
        organizationAccountNumber: order.organizationBankDetails.accountNumber,
        organizationAccountName: order.organizationBankDetails.accountName,
        amountRemitted: parseFloat(amountRemitted),
        settlementDate,
        superAdminBankName: superAdminBankName.trim(),
        superAdminAccountNumber: superAdminAccountNumber.trim(),
        paymentEvidenceUrl,
      };

      const response = await ApiService.processRemittance(order._id, remittanceData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Remittance processed successfully! The organization will be notified.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to process remittance');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process remittance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Process Remittance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderCard}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.organizationName}>{order.organizationName}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Amount Paid:</Text>
              <Text style={styles.amountValue}>₦{order.totalAmountPaid?.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Organization Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Bank Details</Text>
          {order.organizationBankDetails ? (
            <View style={styles.bankCard}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank Name:</Text>
                <Text style={styles.bankValue}>{order.organizationBankDetails.bankName}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Number:</Text>
                <Text style={styles.bankValue}>{order.organizationBankDetails.accountNumber}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Name:</Text>
                <Text style={styles.bankValue}>{order.organizationBankDetails.accountName}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>⚠️ Organization bank details are not available</Text>
            </View>
          )}
        </View>

        {/* Remittance Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remittance Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount to Remit *</Text>
            <TextInput
              style={styles.textInput}
              value={amountRemitted}
              onChangeText={setAmountRemitted}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Settlement Date *</Text>
            <TextInput
              style={styles.textInput}
              value={settlementDate}
              onChangeText={setSettlementDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              value={superAdminBankName}
              onChangeText={setSuperAdminBankName}
              placeholder="Enter your bank name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Account Number *</Text>
            <TextInput
              style={styles.textInput}
              value={superAdminAccountNumber}
              onChangeText={setSuperAdminAccountNumber}
              placeholder="Enter your account number"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Evidence *</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={uploadPaymentEvidence}>
              <Ionicons name="cloud-upload" size={20} color="#7B2CBF" />
              <Text style={styles.uploadButtonText}>
                {paymentEvidenceUrl ? 'Evidence Uploaded ✓' : 'Upload Payment Evidence'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Process Button */}
        <TouchableOpacity
          style={[styles.processButton, loading && styles.processButtonDisabled]}
          onPress={handleProcessRemittance}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.processButtonText}>Process Remittance</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  bankCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 16,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#D97706',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    padding: 16,
    margin: 20,
    gap: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessRemittanceScreen;