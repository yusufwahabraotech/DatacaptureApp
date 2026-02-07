import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    archivedUsers: 0,
    totalMeasurements: 0,
    oneTimeCodesGenerated: 0,
    oneTimeCodesUsed: 0,
    oneTimeCodesAvailable: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchUserProfile();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('=== ADMIN DASHBOARD DEBUG ===');
      const response = await ApiService.getOrganizationDashboardStats();
      console.log('Dashboard stats response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('Dashboard stats data:', response.data);
        console.log('One-time codes data:');
        console.log('  - Generated:', response.data.oneTimeCodesGenerated);
        console.log('  - Used:', response.data.oneTimeCodesUsed);
        console.log('  - Available:', response.data.oneTimeCodesAvailable);
        setStats(response.data);
      } else {
        console.log('Dashboard stats failed:', response.message);
        Alert.alert('Dashboard Access', response.message);
      }
    } catch (error) {
      console.log('Error fetching dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: 'people',
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: 'checkmark-circle',
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      title: 'Pending Users',
      value: stats.pendingUsers,
      icon: 'time',
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    {
      title: 'Archived Users',
      value: stats.archivedUsers,
      icon: 'archive',
      color: '#6B7280',
      bgColor: '#F9FAFB'
    },
    {
      title: 'Total Measurements',
      value: stats.totalMeasurements,
      icon: 'body',
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
    {
      title: 'One-Time Codes',
      value: stats.oneTimeCodesGenerated || 0,
      icon: 'key',
      color: '#8B5CF6',
      bgColor: '#F3E8FF'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      subtitle: 'Add, edit, and manage users',
      icon: 'people',
      onPress: () => navigation.navigate('UserManagement')
    },
    {
      title: 'Export Users',
      subtitle: 'Export users to CSV/PDF',
      icon: 'download',
      onPress: () => navigation.navigate('ExportUsers')
    },
    {
      title: 'Manage Roles',
      subtitle: 'Create and manage user roles',
      icon: 'shield',
      onPress: () => navigation.navigate('Roles')
    },
    {
      title: 'Manage Groups',
      subtitle: 'Create and manage user groups',
      icon: 'people-circle',
      onPress: () => navigation.navigate('Groups')
    },
    {
      title: 'View Measurements',
      subtitle: 'View all user measurements',
      icon: 'body',
      onPress: () => navigation.navigate('AdminMeasurements')
    },
    {
      title: 'Create User Measurement',
      subtitle: 'Create measurement for users',
      icon: 'add-circle',
      onPress: () => navigation.navigate('AdminCreateMeasurement')
    },
    {
      title: 'One-Time Codes',
      subtitle: 'Generate access codes',
      icon: 'key',
      onPress: () => navigation.navigate('OneTimeCodes')
    },
    {
      title: 'Permissions',
      subtitle: 'Manage user permissions',
      icon: 'shield-checkmark',
      onPress: () => navigation.navigate('PermissionsManagement')
    },
    {
      title: 'Subscription',
      subtitle: 'Manage your subscription',
      icon: 'card',
      onPress: () => navigation.navigate('OrganizationSubscription')
    },
    {
      title: 'Organization Profile',
      subtitle: 'Manage profile & verification',
      icon: 'business',
      onPress: () => navigation.navigate('OrganizationProfile')
    },
    {
      title: 'Gallery Management',
      subtitle: 'Manage product gallery',
      icon: 'images',
      onPress: () => navigation.navigate('GalleryManagement')
    }
  ];

  const measurementActions = [
    {
      title: 'Body Measurement',
      subtitle: 'Take body measurements',
      icon: 'body',
      onPress: () => navigation.navigate('BodyMeasurement')
    },
    {
      title: 'Object Measurement',
      subtitle: 'Measure objects',
      icon: 'cube',
      onPress: () => navigation.navigate('ObjectMeasurement')
    },
    {
      title: 'Questionnaire',
      subtitle: 'Fill questionnaire',
      icon: 'document-text',
      onPress: () => navigation.navigate('Questionnaire')
    },
    {
      title: 'New Measurement',
      subtitle: 'Create new measurement',
      icon: 'add-circle',
      onPress: () => navigation.navigate('TakeNewMeasurement')
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Back button for org-users */}
          {user?.role === 'CUSTOMER' && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.greeting}>Hello, {user?.fullName || 'Admin'}</Text>
            <Text style={styles.role}>{user?.role === 'ORGANIZATION' ? 'Organization Admin' : 'Organization Dashboard'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileImage}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {statsCards.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <View style={styles.statHeader}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* One-Time Codes Summary - Only show if data exists */}
        {(stats.oneTimeCodesGenerated !== undefined || stats.oneTimeCodesUsed !== undefined) && (
          <View style={styles.codesSection}>
            <Text style={styles.sectionTitle}>One-Time Codes</Text>
            <View style={styles.codesCard}>
              <View style={styles.codesStat}>
                <Text style={styles.codesValue}>{stats.oneTimeCodesGenerated || 0}</Text>
                <Text style={styles.codesLabel}>Generated</Text>
              </View>
              <View style={styles.codesStat}>
                <Text style={styles.codesValue}>{stats.oneTimeCodesUsed || 0}</Text>
                <Text style={styles.codesLabel}>Used</Text>
              </View>
              <View style={styles.codesStat}>
                <Text style={styles.codesValue}>{stats.oneTimeCodesAvailable || (stats.oneTimeCodesGenerated - stats.oneTimeCodesUsed) || 0}</Text>
                <Text style={styles.codesLabel}>Available</Text>
              </View>
            </View>
          </View>
        )}

        {/* Organization Management - Only for ORGANIZATION role */}
        {user?.role === 'ORGANIZATION' && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Organization Management</Text>
            <Text style={styles.sectionSubtitle}>Manage users and organization settings</Text>
            <View style={styles.professionalContainer}>
              {quickActions.map((action, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.professionalCard}
                  onPress={action.onPress}
                >
                  <View style={styles.professionalContent}>
                    <Text style={styles.professionalTitle}>{action.title}</Text>
                    <Text style={styles.professionalSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* My Measurements Section - Only for ORGANIZATION role */}
        {user?.role === 'ORGANIZATION' && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>My Measurements</Text>
            <Text style={styles.sectionSubtitle}>Create and manage your own measurements</Text>
            <View style={styles.measurementContainer}>
              {measurementActions.map((action, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.measurementCard}
                  onPress={action.onPress}
                >
                  <View style={styles.measurementContent}>
                    <Text style={styles.measurementTitle}>{action.title}</Text>
                    <Text style={styles.measurementSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation - Only for ORGANIZATION role */}
      {user?.role === 'ORGANIZATION' && (
        <BottomNavigation navigation={navigation} activeTab="Dashboard" />
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  role: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginRight: '2%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  codesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    marginTop: 2,
    lineHeight: 20,
  },
  codesCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  codesStat: {
    alignItems: 'center',
  },
  codesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  codesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 120,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  professionalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  professionalContent: {
    flex: 1,
  },
  professionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  professionalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  measurementContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  measurementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  measurementContent: {
    flex: 1,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  measurementSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AdminDashboardScreen;