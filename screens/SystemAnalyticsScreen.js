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

const SystemAnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
    fetchAnalytics();
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

  const fetchAnalytics = async () => {
    try {
      const response = await ApiService.getSuperAdminAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.log('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyticsCards = [
    {
      title: 'User Growth',
      value: analytics.userGrowth || '0%',
      icon: 'trending-up',
      color: '#10B981',
    },
    {
      title: 'Organization Growth',
      value: analytics.orgGrowth || '0%',
      icon: 'business',
      color: '#7C3AED',
    },
    {
      title: 'Revenue Growth',
      value: analytics.revenueGrowth || '0%',
      icon: 'cash',
      color: '#F59E0B',
    },
    {
      title: 'Active Sessions',
      value: analytics.activeSessions || '0',
      icon: 'pulse',
      color: '#EF4444',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Analytics</Text>
        <TouchableOpacity onPress={fetchAnalytics}>
          <Ionicons name="refresh" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          <>
            {/* Analytics Cards */}
            <View style={styles.analyticsGrid}>
              {analyticsCards.map((card, index) => (
                <View key={index} style={[styles.analyticsCard, { borderLeftColor: card.color }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name={card.icon} size={24} color={card.color} />
                    <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </View>
              ))}
            </View>

            {/* System Health */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Health</Text>
              <View style={styles.healthCard}>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Server Status</Text>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.statusText}>Operational</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Database</Text>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.statusText}>Connected</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>API Response</Text>
                  <Text style={styles.healthValue}>{analytics.apiResponseTime || '< 100ms'}</Text>
                </View>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityCard}>
                <Text style={styles.activityText}>
                  • {analytics.recentSignups || 0} new user registrations today
                </Text>
                <Text style={styles.activityText}>
                  • {analytics.recentMeasurements || 0} measurements taken today
                </Text>
                <Text style={styles.activityText}>
                  • {analytics.recentOrganizations || 0} organizations created this week
                </Text>
              </View>
            </View>
          </>
        )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 50,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginRight: '2%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SystemAnalyticsScreen;