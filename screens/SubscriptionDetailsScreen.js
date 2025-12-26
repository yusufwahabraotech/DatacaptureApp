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

const SubscriptionDetailsScreen = ({ navigation, route }) => {
  const { subscriptionId } = route.params;
  const [subscription, setSubscription] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
    fetchSubscriptionDetails();
    fetchSubscribers();
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
      navigation.goBack();
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await ApiService.getSuperAdminSubscriptionById(subscriptionId);
      if (response.success) {
        setSubscription(response.data.package);
      }
    } catch (error) {
      console.log('Error fetching subscription details:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await ApiService.getSuperAdminSubscriptionSubscribers(subscriptionId);
      if (response.success) {
        setSubscribers(response.data.subscribers);
      }
    } catch (error) {
      console.log('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSubscriptionData = async (format) => {
    try {
      const response = await ApiService.exportSuperAdminSubscriptions(format);
      Alert.alert('Export Started', `Subscription data export in ${format.toUpperCase()} format has been initiated.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  if (loading || !subscription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
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
        <Text style={styles.headerTitle}>Package Details</Text>
        <TouchableOpacity onPress={() => exportSubscriptionData('csv')}>
          <Ionicons name="download" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Package Info */}
        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>{subscription.packageName}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: subscription.status === 'active' ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>{subscription.status}</Text>
            </View>
          </View>
          
          <Text style={styles.packageDescription}>{subscription.description}</Text>
          
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services Included:</Text>
            <Text style={styles.servicesText}>{subscription.services}</Text>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Pricing:</Text>
            <View style={styles.pricingGrid}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Monthly</Text>
                <Text style={styles.priceValue}>₦{subscription.monthlyPrice?.toLocaleString()}</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Quarterly</Text>
                <Text style={styles.priceValue}>₦{subscription.quarterlyPrice?.toLocaleString()}</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Yearly</Text>
                <Text style={styles.priceValue}>₦{subscription.yearlyPrice?.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Promo Period */}
          {subscription.promoStartDate && (
            <View style={styles.promoSection}>
              <Text style={styles.sectionTitle}>Promotional Period:</Text>
              <Text style={styles.promoText}>
                {new Date(subscription.promoStartDate).toLocaleDateString()} - {new Date(subscription.promoEndDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Subscribers */}
        <View style={styles.subscribersSection}>
          <Text style={styles.sectionTitle}>Subscribers ({subscribers.length})</Text>
          
          {subscribers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No subscribers yet</Text>
            </View>
          ) : (
            subscribers.map((subscriber) => (
              <View key={subscriber.id} style={styles.subscriberCard}>
                <View style={styles.subscriberInfo}>
                  <View style={styles.subscriberAvatar}>
                    <Text style={styles.subscriberAvatarText}>
                      {(subscriber.organizationName || 'O').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.subscriberDetails}>
                    <Text style={styles.subscriberName}>{subscriber.organizationName}</Text>
                    <Text style={styles.subscriberEmail}>{subscriber.email}</Text>
                    <Text style={styles.subscriberDate}>
                      Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.subscriberStatus,
                  { backgroundColor: subscriber.status === 'active' ? '#10B981' : '#EF4444' }
                ]}>
                  <Text style={styles.subscriberStatusText}>{subscriber.status}</Text>
                </View>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
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
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  packageDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  servicesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  servicesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingSection: {
    marginBottom: 20,
  },
  pricingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 16,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  promoSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
  },
  promoText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  subscribersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  subscriberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subscriberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subscriberAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subscriberDetails: {
    flex: 1,
  },
  subscriberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subscriberEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  subscriberDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  subscriberStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriberStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});

export default SubscriptionDetailsScreen;