import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModuleAccessChecker from '../utils/ModuleAccessChecker';

const UsageTracker = ({ navigation, style }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const data = await ModuleAccessChecker.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.log('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#EF4444'; // Red
    if (percentage >= 75) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  if (!subscriptionData?.isActive) {
    return (
      <View style={[styles.container, styles.inactiveContainer, style]}>
        <Text style={styles.inactiveText}>No Active Subscription</Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => navigation?.navigate('OrganizationSubscription')}
        >
          <Text style={styles.upgradeButtonText}>Subscribe Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { limits, usage } = subscriptionData;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Usage Overview</Text>
      
      {/* Body Measurements Usage */}
      {limits.maxBodyMeasurements && (
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Ionicons name="body" size={16} color="#7C3AED" />
            <Text style={styles.usageLabel}>Body Measurements</Text>
          </View>
          <View style={styles.usageDetails}>
            {limits.maxBodyMeasurements === -1 ? (
              <Text style={styles.unlimitedText}>Unlimited</Text>
            ) : (
              <>
                <Text style={styles.usageText}>
                  {usage.bodyMeasurementsCreated || 0} / {limits.maxBodyMeasurements}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${getUsagePercentage(usage.bodyMeasurementsCreated || 0, limits.maxBodyMeasurements)}%`,
                        backgroundColor: getUsageColor(getUsagePercentage(usage.bodyMeasurementsCreated || 0, limits.maxBodyMeasurements))
                      }
                    ]} 
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Organization Users Usage */}
      {limits.maxOrgUsers && (
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Ionicons name="people" size={16} color="#7C3AED" />
            <Text style={styles.usageLabel}>Organization Users</Text>
          </View>
          <View style={styles.usageDetails}>
            {limits.maxOrgUsers === -1 ? (
              <Text style={styles.unlimitedText}>Unlimited</Text>
            ) : (
              <>
                <Text style={styles.usageText}>
                  {usage.orgUsersCreated || 0} / {limits.maxOrgUsers}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${getUsagePercentage(usage.orgUsersCreated || 0, limits.maxOrgUsers)}%`,
                        backgroundColor: getUsageColor(getUsagePercentage(usage.orgUsersCreated || 0, limits.maxOrgUsers))
                      }
                    ]} 
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Upgrade Button for near-limit usage */}
      {((limits.maxBodyMeasurements > 0 && getUsagePercentage(usage.bodyMeasurementsCreated || 0, limits.maxBodyMeasurements) >= 80) ||
        (limits.maxOrgUsers > 0 && getUsagePercentage(usage.orgUsersCreated || 0, limits.maxOrgUsers) >= 80)) && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => navigation?.navigate('OrganizationSubscription')}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveContainer: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inactiveText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 8,
  },
  usageItem: {
    marginBottom: 12,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  usageDetails: {
    paddingLeft: 24,
  },
  usageText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  unlimitedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  upgradeButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default UsageTracker;