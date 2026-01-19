import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

const SuperAdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    totalMeasurements: 0,
    activeOrganizations: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
    fetchSuperAdminStats();
    fetchUserProfile();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success && response.data.user.role !== 'SUPER_ADMIN') {
        Alert.alert('Access Denied', 'You do not have permission to access this screen.');
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.log('Error checking user role:', error);
      navigation.goBack();
    }
  };

  const fetchSuperAdminStats = async () => {
    try {
      const response = await ApiService.getSuperAdminDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.log('Error fetching super admin stats:', error);
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
      title: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: 'business',
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    },
    {
      title: 'Active Organizations',
      value: stats.activeOrganizations,
      icon: 'checkmark-circle',
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: 'people',
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    {
      title: 'Total Measurements',
      value: stats.totalMeasurements,
      icon: 'body',
      color: '#EF4444',
      bgColor: '#FEF2F2'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Organizations',
      subtitle: 'View and manage all organizations',
      icon: 'business',
      onPress: () => navigation.navigate('OrganizationManagement')
    },
    {
      title: 'System Users',
      subtitle: 'Manage all system users',
      icon: 'people',
      onPress: () => navigation.navigate('SystemUsers')
    },
    {
      title: 'Service Management',
      subtitle: 'Create and manage services',
      icon: 'construct',
      onPress: () => navigation.navigate('ServiceManagement')
    },
    {
      title: 'Subscription Packages',
      subtitle: 'Manage subscription packages',
      icon: 'cube',
      onPress: () => navigation.navigate('SubscriptionPackage')
    },
    {
      title: 'System Analytics',
      subtitle: 'View system-wide analytics',
      icon: 'analytics',
      onPress: () => navigation.navigate('SystemAnalytics')
    },
    {
      title: 'System Settings',
      subtitle: 'Configure system settings',
      icon: 'settings',
      onPress: () => navigation.navigate('SystemSettings')
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName || 'Super Admin'}</Text>
          <Text style={styles.role}>Super Administrator</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileImage}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileText}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
          </Text>
        </TouchableOpacity>
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

        {/* System Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>System Status</Text>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Operational</Text>
              </View>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Last Updated</Text>
              <Text style={styles.overviewValue}>Just now</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color="#7C3AED" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation navigation={navigation} activeTab="Dashboard" />
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
    padding: 16,
    marginBottom: 16,
    marginRight: '2%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 20,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
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
});

export default SuperAdminDashboardScreen;