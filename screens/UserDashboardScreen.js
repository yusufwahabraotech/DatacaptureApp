import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const UserDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMeasurements: 0,
    myMeasurements: 0,
    oneTimeCodesGenerated: 0,
    oneTimeCodesUsed: 0,
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasDataVerificationRole, setHasDataVerificationRole] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchUserProfile();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await ApiService.getUserDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.log('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
        // Check if user has data verification permission
        const hasVerificationRole = response.data.user.permissions?.includes('data_verification');
        setHasDataVerificationRole(hasVerificationRole);
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
      title: 'All Measurements',
      value: stats.totalMeasurements,
      icon: 'body',
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
    {
      title: 'My Measurements',
      value: stats.myMeasurements,
      icon: 'person',
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    {
      title: 'Generated Codes',
      value: stats.oneTimeCodesGenerated,
      icon: 'key',
      color: '#8B5CF6',
      bgColor: '#F3E8FF'
    },
    {
      title: 'Used Codes',
      value: stats.oneTimeCodesUsed,
      icon: 'checkmark-done',
      color: '#06B6D4',
      bgColor: '#ECFEFF'
    }
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
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
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.profileImage}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileText}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {user?.fullName || 'User'}</Text>
          <Text style={styles.role}>Organization Member</Text>
          <Text style={styles.subtitle}>Here's your organization overview</Text>
        </View>

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

        {/* One-Time Codes Summary */}
        <View style={styles.codesSection}>
          <Text style={styles.sectionTitle}>One-Time Codes Overview</Text>
          <View style={styles.codesCard}>
            <View style={styles.codesStat}>
              <Text style={styles.codesValue}>{stats.oneTimeCodesGenerated}</Text>
              <Text style={styles.codesLabel}>Generated</Text>
            </View>
            <View style={styles.codesStat}>
              <Text style={styles.codesValue}>{stats.oneTimeCodesUsed}</Text>
              <Text style={styles.codesLabel}>Used</Text>
            </View>
            <View style={styles.codesStat}>
              <Text style={styles.codesValue}>{stats.oneTimeCodesGenerated - stats.oneTimeCodesUsed}</Text>
              <Text style={styles.codesLabel}>Available</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {hasDataVerificationRole && (
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('FieldAgentVerification')}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                </View>
                <Text style={styles.actionTitle}>Data Verification</Text>
                <Text style={styles.actionSubtitle}>Field verification tasks</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('PublicProductSearch')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="storefront" size={24} color="#06B6D4" />
              </View>
              <Text style={styles.actionTitle}>Browse Products</Text>
              <Text style={styles.actionSubtitle}>Explore available products & services</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserMeasurements')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="body" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.actionTitle}>View Measurements</Text>
              <Text style={styles.actionSubtitle}>Browse all measurements</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserOneTimeCodes')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="key" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Access Codes</Text>
              <Text style={styles.actionSubtitle}>Manage one-time codes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('BodyMeasurement')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="add-circle" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>New Measurement</Text>
              <Text style={styles.actionSubtitle}>Take measurements</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminCreateMeasurement')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="person-add" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Create User Measurement</Text>
              <Text style={styles.actionSubtitle}>Create for other users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="person" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionTitle}>My Profile</Text>
              <Text style={styles.actionSubtitle}>View profile settings</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 24,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
    marginBottom: 12,
    marginRight: '2%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  codesCard: {
    backgroundColor: '#FFFFFF',
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
    fontSize: 14,
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

export default UserDashboardScreen;