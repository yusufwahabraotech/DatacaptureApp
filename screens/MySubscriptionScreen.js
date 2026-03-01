import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const MySubscriptionScreen = ({ navigation }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await ApiService.getMyActiveSubscription();
      if (response.success) {
        setSubscription(response.data.subscription);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used, max) => {
    return max > 0 ? Math.round((used / max) * 100) : 0;
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  const renderModuleItem = (module) => (
    <View key={module} style={styles.moduleItem}>
      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      <Text style={styles.moduleText}>{module.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );

  const renderUsageItem = (label, used, max) => {
    const percentage = getUsagePercentage(used, max);
    const color = getUsageColor(percentage);

    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={styles.usageText}>{used} / {max}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.percentageText, { color }]}>{percentage}% used</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscription</Text>
        </View>
        
        <View style={styles.noSubscriptionContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionText}>
            You don't have an active subscription. Subscribe to a package to access premium features.
          </Text>
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={() => navigation.navigate('SubscriptionSelection')}
          >
            <Text style={styles.subscribeButtonText}>Browse Packages</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Package Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Package</Text>
            <View style={[styles.statusBadge, { backgroundColor: subscription.status === 'active' ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{subscription.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.packageTitle}>{subscription.packageTitle}</Text>
          <Text style={styles.packageId}>Package ID: {subscription.packageId}</Text>
          <Text style={styles.subscriptionDuration}>Duration: {subscription.subscriptionDuration}</Text>
          {subscription.packageDetails?.description && (
            <Text style={styles.packageDescription}>{subscription.packageDetails.description}</Text>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Information</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount Paid</Text>
            <Text style={styles.paymentValue}>₦{subscription.amountPaid?.toLocaleString()}</Text>
          </View>
          {subscription.originalAmount && subscription.originalAmount !== subscription.amountPaid && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Original Amount</Text>
              <Text style={styles.originalAmount}>₦{subscription.originalAmount?.toLocaleString()}</Text>
            </View>
          )}
          {subscription.discountApplied > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Discount Applied</Text>
              <Text style={styles.discountAmount}>-₦{subscription.discountApplied?.toLocaleString()}</Text>
            </View>
          )}
          {subscription.promoCodeUsed && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Promo Code</Text>
              <Text style={styles.promoCode}>{subscription.promoCodeUsed}</Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <View style={[styles.paymentStatusBadge, { backgroundColor: subscription.paymentStatus === 'completed' ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.paymentStatusText}>{subscription.paymentStatus?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Auto Renew</Text>
            <Text style={[styles.autoRenew, { color: subscription.autoRenew ? '#10B981' : '#EF4444' }]}>
              {subscription.autoRenew ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Subscription Period */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription Period</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(subscription.startDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{formatDate(subscription.endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Enabled Modules */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enabled Modules</Text>
          <View style={styles.modulesList}>
            {subscription.enabledModules.map(renderModuleItem)}
          </View>
        </View>

        {/* Package Features */}
        {subscription.packageDetails?.features && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Package Features</Text>
            <View style={styles.featuresList}>
              {subscription.packageDetails.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            {subscription.packageDetails.note && (
              <Text style={styles.packageNote}>{subscription.packageDetails.note}</Text>
            )}
          </View>
        )}

        {/* Services */}
        {subscription.services && subscription.services.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Included Services</Text>
            {subscription.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.serviceDuration}>Duration: {service.duration}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Usage Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Usage Statistics</Text>
          {subscription.limits.maxBodyMeasurements && (
            renderUsageItem(
              'Body Measurements',
              subscription.usage.bodyMeasurementsCreated || 0,
              subscription.limits.maxBodyMeasurements
            )
          )}
          {subscription.limits.maxOrgUsers && (
            renderUsageItem(
              'Organization Users',
              subscription.usage.orgUsersCreated || 0,
              subscription.limits.maxOrgUsers
            )
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('SubscriptionSelection')}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Upgrade Package</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
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
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  packageId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  subscriptionDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#374151',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  originalAmount: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  discountAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  promoCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  autoRenew: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  packageNote: {
    fontSize: 12,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  serviceItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modulesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    marginRight: 8,
  },
  moduleText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 4,
    fontWeight: '500',
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 8,
  },
});

export default MySubscriptionScreen;