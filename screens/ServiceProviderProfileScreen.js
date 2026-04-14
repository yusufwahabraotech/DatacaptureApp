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

const ServiceProviderProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [isServiceProvider, setIsServiceProvider] = useState(false);
  const [taskStats, setTaskStats] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadTaskStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);

        // Check if user is a service provider
        const serviceProviderResponse = await ApiService.getServiceProviderUsers();
        if (serviceProviderResponse.success) {
          const serviceProviders = serviceProviderResponse.data.users || [];
          const providerData = serviceProviders.find(sp => 
            sp.userId === userData._id || sp.userId === userData.id
          );
          
          if (providerData) {
            setIsServiceProvider(true);
            setProviderInfo(providerData);
          } else {
            setIsServiceProvider(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadTaskStatistics = async () => {
    try {
      const response = await ApiService.getTaskStatistics();
      if (response.success) {
        setTaskStats(response.data.statistics);
      }
    } catch (error) {
      console.error('Error loading task statistics:', error);
      // Don't show error if user is not a service provider
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderServiceProviderInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Service Provider Status</Text>
      
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.statusBadgeText}>ACTIVE</Text>
          </View>
          <Text style={styles.statusDate}>
            Assigned: {new Date(providerInfo?.assignedAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        
        <Text style={styles.statusDescription}>
          You are currently assigned as a service provider in this organization. 
          You can receive and manage service task assignments.
        </Text>

        {providerInfo?.providerId && (
          <View style={styles.providerIdContainer}>
            <Text style={styles.providerIdLabel}>Provider ID:</Text>
            <Text style={styles.providerIdValue}>{providerInfo.providerId}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTaskStatistics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Task Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="notifications" size={20} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{taskStats?.assigned || 0}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{taskStats?.accepted || 0}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="close-circle" size={20} color="#F44336" />
          </View>
          <Text style={styles.statValue}>{taskStats?.rejected || 0}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy" size={20} color="#9C27B0" />
          </View>
          <Text style={styles.statValue}>{taskStats?.completed || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('ServiceProviderTaskDashboard')}
      >
        <View style={styles.actionContent}>
          <View style={styles.actionIcon}>
            <Ionicons name="briefcase" size={24} color="#7B2CBF" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Manage My Tasks</Text>
            <Text style={styles.actionSubtitle}>View and manage assigned service tasks</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.actionContent}>
          <View style={styles.actionIcon}>
            <Ionicons name="person" size={24} color="#7B2CBF" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>My Profile</Text>
            <Text style={styles.actionSubtitle}>View and edit profile information</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  const renderNotServiceProvider = () => (
    <View style={styles.notProviderContainer}>
      <View style={styles.notProviderIcon}>
        <Ionicons name="person-outline" size={64} color="#E5E7EB" />
      </View>
      <Text style={styles.notProviderTitle}>Not a Service Provider</Text>
      <Text style={styles.notProviderMessage}>
        You are not currently assigned as a service provider in this organization. 
        Contact your administrator if you believe this is an error.
      </Text>
      
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => navigation.navigate('Help')}
      >
        <Ionicons name="help-circle" size={16} color="white" />
        <Text style={styles.contactButtonText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Provider</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
        <Text style={styles.headerTitle}>Service Provider</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>{user?.role === 'ORGANIZATION' ? 'Admin' : 'Organization User'}</Text>
        </View>

        {isServiceProvider ? (
          <>
            {renderServiceProviderInfo()}
            {taskStats && renderTaskStatistics()}
            {renderQuickActions()}
          </>
        ) : (
          renderNotServiceProvider()
        )}
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
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  providerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerIdLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  providerIdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  notProviderContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  notProviderIcon: {
    marginBottom: 24,
  },
  notProviderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  notProviderMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServiceProviderProfileScreen;