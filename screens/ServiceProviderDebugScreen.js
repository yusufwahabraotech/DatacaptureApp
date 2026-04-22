import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderDebugScreen = ({ navigation }) => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (endpointName, apiCall) => {
    setLoading(prev => ({ ...prev, [endpointName]: true }));
    
    try {
      console.log(`🚨 TESTING ${endpointName.toUpperCase()} 🚨`);
      const response = await apiCall();
      
      setResponses(prev => ({
        ...prev,
        [endpointName]: {
          success: true,
          data: response,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      console.log(`✅ ${endpointName} Response:`, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`❌ ${endpointName} Error:`, error);
      setResponses(prev => ({
        ...prev,
        [endpointName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpointName]: false }));
    }
  };

  const endpoints = [
    {
      name: 'Module',
      key: 'module',
      call: () => ApiService.getServiceProviderModule(),
      description: 'Get service provider module info'
    },
    {
      name: 'Summary',
      key: 'summary',
      call: () => ApiService.getServiceProviderSummary(),
      description: 'Get dashboard summary statistics'
    },
    {
      name: 'All Users',
      key: 'allUsers',
      call: () => ApiService.getServiceProviderUsers(),
      description: 'Get all organization users with SP status'
    },
    {
      name: 'Assigned Providers (Detailed)',
      key: 'assignedProviders',
      call: () => ApiService.getAssignedServiceProviders(),
      description: 'Get assigned service providers with detailed info'
    },
    {
      name: 'Available Users',
      key: 'availableUsers',
      call: () => ApiService.getAvailableUsersForAssignment(),
      description: 'Get users available for assignment'
    },
    {
      name: 'History',
      key: 'history',
      call: () => ApiService.getServiceProviderHistory(1, 10),
      description: 'Get assignment history (page 1, limit 10)'
    },
    {
      name: 'Provider Details',
      key: 'providerDetails',
      call: () => ApiService.getServiceProviderDetails('example_user_id'),
      description: 'Get detailed service provider info (requires valid userId)'
    }
  ];

  const renderResponse = (endpointKey) => {
    const response = responses[endpointKey];
    if (!response) return null;

    return (
      <View style={styles.responseContainer}>
        <View style={styles.responseHeader}>
          <Text style={styles.responseTime}>{response.timestamp}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: response.success ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {response.success ? 'SUCCESS' : 'ERROR'}
            </Text>
          </View>
        </View>
        
        <ScrollView style={styles.responseContent} nestedScrollEnabled>
          <Text style={styles.responseText}>
            {JSON.stringify(response.success ? response.data : response.error, null, 2)}
          </Text>
        </ScrollView>
      </View>
    );
  };

  const testAllEndpoints = async () => {
    Alert.alert(
      'Test All Endpoints',
      'This will test all service provider endpoints. Check the console for detailed logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test All',
          onPress: async () => {
            for (const endpoint of endpoints) {
              await testEndpoint(endpoint.key, endpoint.call);
              // Small delay between requests
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Provider Debug</Text>
        <TouchableOpacity onPress={testAllEndpoints}>
          <Ionicons name="play" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#7B2CBF" />
          <Text style={styles.infoText}>
            Test individual endpoints to see API responses and debug data flow. 
            Check the console for detailed logs.
          </Text>
        </View>

        {endpoints.map((endpoint) => (
          <View key={endpoint.key} style={styles.endpointCard}>
            <View style={styles.endpointHeader}>
              <View style={styles.endpointInfo}>
                <Text style={styles.endpointName}>{endpoint.name}</Text>
                <Text style={styles.endpointDescription}>{endpoint.description}</Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.testButton,
                  loading[endpoint.key] && styles.testButtonLoading
                ]}
                onPress={() => testEndpoint(endpoint.key, endpoint.call)}
                disabled={loading[endpoint.key]}
              >
                {loading[endpoint.key] ? (
                  <Ionicons name="hourglass" size={16} color="#FFFFFF" />
                ) : (
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.testButtonText}>
                  {loading[endpoint.key] ? 'Testing...' : 'Test'}
                </Text>
              </TouchableOpacity>
            </View>

            {renderResponse(endpoint.key)}
          </View>
        ))}

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ServiceProviderAssignment')}
          >
            <Ionicons name="person-add" size={20} color="#7B2CBF" />
            <Text style={styles.actionButtonText}>Go to Assignment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ServiceProviderList')}
          >
            <Ionicons name="list" size={20} color="#7B2CBF" />
            <Text style={styles.actionButtonText}>View Provider List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ServiceProviderDebug')}
          >
            <Ionicons name="bug" size={20} color="#7B2CBF" />
            <Text style={styles.actionButtonText}>Debug Endpoints</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#7B2CBF',
    lineHeight: 20,
  },
  endpointCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  endpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  endpointInfo: {
    flex: 1,
    marginRight: 12,
  },
  endpointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  endpointDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  testButtonLoading: {
    backgroundColor: '#9CA3AF',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  responseContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  responseContent: {
    maxHeight: 200,
  },
  responseText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 14,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
  },
});

export default ServiceProviderDebugScreen;