import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const ServiceProviderFeeExampleScreen = ({ navigation }) => {
  const [feeData, setFeeData] = useState({
    name: 'Standard Service Fee',
    description: 'Basic hourly rate for general service provider tasks',
    amount: '2500',
    frequency: 'hourly'
  });

  // Example frequency options - can be customized as needed
  const frequencyOptions = [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Per Project', value: 'per project' },
    { label: 'Per Task', value: 'per task' },
    { label: 'Per Delivery', value: 'per delivery' },
    { label: 'Commission Based', value: 'commission' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annually', value: 'annually' },
  ];

  const handleTestAssignment = async () => {
    // Example payload with fee information
    const testPayload = {
      userAssignments: [
        {
          userId: "example_user_id_1",
          isServiceProvider: true,
          serviceProviderFee: {
            name: feeData.name,
            description: feeData.description,
            amount: parseFloat(feeData.amount),
            frequency: feeData.frequency
          }
        },
        {
          userId: "example_user_id_2",
          isServiceProvider: true,
          serviceProviderFee: {
            name: "Premium Service Fee",
            description: "Higher rate for specialized services",
            amount: 5000,
            frequency: "per project"
          }
        }
      ]
    };

    console.log('🚨 ENHANCED SERVICE PROVIDER ASSIGNMENT PAYLOAD 🚨');
    console.log(JSON.stringify(testPayload, null, 2));

    Alert.alert(
      'Enhanced Payload Ready',
      'Check the console for the complete payload structure with fee information.',
      [
        {
          text: 'View Console',
          onPress: () => console.log('Enhanced payload:', testPayload)
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Provider Fee Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#7B2CBF" />
          <Text style={styles.infoText}>
            This demonstrates the enhanced bulk service provider assignment with fee information.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Fee Structure Configuration</Text>

          {/* Fee Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fee Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Standard Service Fee"
              value={feeData.name}
              onChangeText={(text) => setFeeData(prev => ({ ...prev, name: text }))}
            />
          </View>

          {/* Fee Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe the fee structure and what it covers..."
              value={feeData.description}
              onChangeText={(text) => setFeeData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Fee Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fee Amount *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              value={feeData.amount}
              onChangeText={(text) => setFeeData(prev => ({ ...prev, amount: text }))}
              keyboardType="numeric"
            />
          </View>

          {/* Fee Frequency */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Frequency *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={feeData.frequency}
                onValueChange={(value) => setFeeData(prev => ({ ...prev, frequency: value }))}
                style={styles.picker}
              >
                {frequencyOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.payloadPreview}>
          <Text style={styles.previewTitle}>Payload Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewText}>
              {JSON.stringify({
                userAssignments: [{
                  userId: "example_user_id",
                  isServiceProvider: true,
                  serviceProviderFee: {
                    name: feeData.name,
                    description: feeData.description,
                    amount: parseFloat(feeData.amount) || 0,
                    frequency: feeData.frequency
                  }
                }]
              }, null, 2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestAssignment}
        >
          <Ionicons name="code" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Generate Test Payload</Text>
        </TouchableOpacity>

        <View style={styles.endpointInfo}>
          <Text style={styles.endpointTitle}>API Endpoint</Text>
          <Text style={styles.endpointText}>POST /service-provider-assignment/assign</Text>
          <Text style={styles.endpointMethod}>ApiService.bulkAssignServiceProviders(assignmentData)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#7B2CBF',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  payloadPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  endpointInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  endpointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  endpointText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  endpointMethod: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
});

export default ServiceProviderFeeExampleScreen;