import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [moduleExists, setModuleExists] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🚨 LOADING SERVICE PROVIDER DASHBOARD 🚨');
      
      // First check if module exists by trying to get summary
      const summaryResponse = await ApiService.getServiceProviderSummary();
      
      if (summaryResponse.success) {
        setSummary(summaryResponse.data.summary);
        setModuleExists(true);
        console.log('✅ Service Provider module exists');
      } else {
        console.log('❌ Service Provider module not found');
        setModuleExists(false);
        setSummary(null);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setModuleExists(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateModule = async () => {
    try {
      console.log('🚨 CREATING SERVICE PROVIDER MODULE 🚨');
      
      const moduleData = {
        name: 'Service Provider Management',
        description: 'Module for managing service provider assignments in our organization'
      };

      const response = await ApiService.createServiceProviderModule(moduleData);
      
      if (response.success) {
        Alert.alert(
          'Module Created',
          'Service Provider Management module has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => loadDashboard()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      Alert.alert('Error', 'Failed to create Service Provider module');
    }
  };

  const renderModuleSetup = () => (
    <View style={styles.setupContainer}>
      <View style={styles.setupIcon}>
        <Ionicons name="construct" size={64} color="#7B2CBF" />
      </View>
      <Text style={styles.setupTitle}>Setup Service Provider Management</Text>
      <Text style={styles.setupMessage}>
        Initialize the Service Provider Management module to start assigning service providers in your organization.
      </Text>
      <TouchableOpacity
        style={styles.setupButton}
        onPress={handleCreateModule}
      >
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.setupButtonText}>Create Module</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />
      }
    >
      {/* Module Info */}
      <View style={styles.moduleCard}>
        <View style={styles.moduleHeader}>
          <Ionicons name="business" size={24} color="#7B2CBF" />
          <Text style={styles.moduleTitle}>{summary?.module?.name}</Text>
        </View>
        <Text style={styles.moduleDescription}>{summary?.module?.description}</Text>
        <Text style={styles.moduleDate}>
          Created: {new Date(summary?.module?.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="people" size={20} color="#2196F3" />
            <Text style={styles.statValue}>{summary?.statistics?.totalOrgUsers || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="person-add" size={20} color="#4CAF50" />
            <Text style={styles.statValue}>{summary?.statistics?.totalServiceProviders || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Service Providers</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statValue}>{summary?.statistics?.activeServiceProviders || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Active Providers</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.statValue}>{summary?.statistics?.recentAssignments || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Recent Assignments</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ServiceProviderAssignment')}
        >
          <View style={styles.actionContent}>
            <View style={styles.actionIcon}>
              <Ionicons name="person-add" size={24} color="#7B2CBF" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Assign Service Providers</Text>
              <Text style={styles.actionSubtitle}>Bulk assign or unassign service provider roles</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ServiceProviderHistory')}
        >
          <View style={styles.actionContent}>
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={24} color="#7B2CBF" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Assignment History</Text>
              <Text style={styles.actionSubtitle}>View all assignment and unassignment activities</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ServiceProviderList')}
        >
          <View style={styles.actionContent}>
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={24} color="#7B2CBF" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>View All Providers</Text>
              <Text style={styles.actionSubtitle}>Manage existing service providers</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      {summary?.recentActivity && summary.recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {summary.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.action === 'assigned' ? '#10B981' : '#EF4444' }
              ]}>
                <Ionicons 
                  name={activity.action === 'assigned' ? 'person-add' : 'person-remove'} 
                  size={16} 
                  color="white" 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.userName}</Text>
                  {' '}was {activity.action} as service provider
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleString()} by {activity.adminName}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Provider Management</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Provider Management</Text>
        <TouchableOpacity onPress={() => loadDashboard(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {moduleExists ? renderDashboard() : renderModuleSetup()}
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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupIcon: {
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  setupMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  moduleCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  moduleDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  activitySection: {
    margin: 16,
    marginTop: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ServiceProviderManagementScreen;