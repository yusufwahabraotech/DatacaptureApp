import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const DebugScreen = ({ navigation }) => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (name, apiCall) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const response = await apiCall();
      setResults(prev => ({
        ...prev,
        [name]: {
          success: response.success,
          data: response.data,
          message: response.message
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: 'User Profile',
      call: () => ApiService.getUserProfile()
    },
    {
      name: 'Available Permissions',
      call: () => ApiService.getAvailablePermissions()
    },
    {
      name: 'Org Permissions',
      call: () => ApiService.getOrgAvailablePermissions()
    },
    {
      name: 'Users List',
      call: () => ApiService.getUsers()
    },
    {
      name: 'Roles List',
      call: () => ApiService.getRoles()
    },
    {
      name: 'Org Roles List',
      call: () => ApiService.getOrgRoles()
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>API Debug</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {tests.map((test) => (
          <View key={test.name} style={styles.testCard}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{test.name}</Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testEndpoint(test.name, test.call)}
                disabled={loading[test.name]}
              >
                <Text style={styles.testButtonText}>
                  {loading[test.name] ? 'Testing...' : 'Test'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {results[test.name] && (
              <View style={styles.resultContainer}>
                <Text style={[
                  styles.resultStatus,
                  { color: results[test.name].success ? '#10B981' : '#EF4444' }
                ]}>
                  {results[test.name].success ? 'SUCCESS' : 'FAILED'}
                </Text>
                <Text style={styles.resultText}>
                  {JSON.stringify(results[test.name], null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  testCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  testButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
  },
});

export default DebugScreen;