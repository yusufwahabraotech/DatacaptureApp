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
  const [refreshing, setRefreshing] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchDashboardStats();
    fetchUserProfile();
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    Vibration.vibrate(50); // Light haptic feedback
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    await fetchDashboardStats();
    await fetchUserProfile();
    
    // Stop animation and reset
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
    setRefreshing(false);
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('=== ADMIN DASHBOARD DEBUG ===');
      const response = await ApiService.getOrganizationDashboardStats();
      console.log('Dashboard stats response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('Dashboard stats data:', response.data);
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
      title: 'Generated Codes',
      value: stats.oneTimeCodesGenerated,
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
      title: 'Debug API',
      subtitle: 'Test API connections',
      icon: 'bug',
      onPress: () => navigation.navigate('Debug')
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
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName || 'Admin'}</Text>
          <Text style={styles.role}>Organization Admin</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshButtonActive]}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? '#7C3AED' : '#7C3AED'} 
              />
            </Animated.View>
          </TouchableOpacity>
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

        {/* One-Time Codes Summary */}
        <View style={styles.codesSection}>
          <Text style={styles.sectionTitle}>One-Time Codes</Text>
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
              <Text style={styles.codesValue}>{stats.oneTimeCodesAvailable || (stats.oneTimeCodesGenerated - stats.oneTimeCodesUsed) || 0}</Text>
              <Text style={styles.codesLabel}>Available</Text>
            </View>
          </View>
        </View>

        {/* Organization Management */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Organization Management</Text>
          <Text style={styles.sectionSubtitle}>Manage users and organization settings</Text>
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

        {/* My Measurements Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>My Measurements</Text>
          <Text style={styles.sectionSubtitle}>Create and manage your own measurements</Text>
          <View style={styles.actionsGrid}>
            {measurementActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color="#10B981" />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  refreshButtonActive: {
    backgroundColor: '#EDE9FE',
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

export default AdminDashboardScreen;