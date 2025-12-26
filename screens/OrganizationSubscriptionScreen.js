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

const OrganizationSubscriptionScreen = ({ navigation }) => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchAvailablePackages();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      // This would be an organization-specific endpoint
      const response = await ApiService.apiCall('/organization/subscription');
      if (response.success) {
        setCurrentSubscription(response.data.subscription);
      }
    } catch (error) {
      console.log('Error fetching current subscription:', error);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      const response = await ApiService.getSuperAdminSubscriptions(1, 50, 'active');
      if (response.success) {
        setAvailablePackages(response.data.packages);
      }
    } catch (error) {
      console.log('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPackage = async (packageId, billingCycle) => {
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to this package with ${billingCycle} billing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            try {
              const response = await ApiService.apiCall('/organization/subscribe', {
                method: 'POST',
                body: JSON.stringify({ packageId, billingCycle }),
              });
              if (response.success) {
                Alert.alert('Success', 'Subscription activated successfully!');
                fetchCurrentSubscription();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to subscribe to package');
            }
          }
        }
      ]
    );
  };

  const cancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.apiCall('/organization/subscription/cancel', {
                method: 'PUT',
              });
              if (response.success) {
                Alert.alert('Success', 'Subscription cancelled successfully');
                fetchCurrentSubscription();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
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
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Subscription */}
        {currentSubscription ? (
          <View style={styles.currentSubscriptionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Current Subscription</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: currentSubscription.status === 'active' ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusText}>{currentSubscription.status}</Text>
              </View>
            </View>
            
            <Text style={styles.packageName}>{currentSubscription.packageName}</Text>
            <Text style={styles.packageServices}>{currentSubscription.services}</Text>
            
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Billing Cycle:</Text>
                <Text style={styles.detailValue}>{currentSubscription.billingCycle}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Next Payment:</Text>
                <Text style={styles.detailValue}>
                  {new Date(currentSubscription.nextPaymentDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>₦{currentSubscription.amount?.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={cancelSubscription}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noSubscriptionCard}>
            <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
            <Text style={styles.noSubscriptionText}>
              Choose a package below to get started with our services
            </Text>
          </View>
        )}

        {/* Available Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Available Packages</Text>
          
          {availablePackages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle}>{pkg.packageName}</Text>
                {pkg.promoStartDate && (
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoText}>PROMO</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.packageDescription}>{pkg.description}</Text>
              <Text style={styles.packageServicesText}>{pkg.services}</Text>
              
              <View style={styles.pricingOptions}>
                <TouchableOpacity 
                  style={styles.priceOption}
                  onPress={() => subscribeToPackage(pkg.id, 'monthly')}
                >
                  <Text style={styles.priceLabel}>Monthly</Text>
                  <Text style={styles.priceValue}>₦{pkg.monthlyPrice?.toLocaleString()}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.priceOption}
                  onPress={() => subscribeToPackage(pkg.id, 'quarterly')}
                >
                  <Text style={styles.priceLabel}>Quarterly</Text>
                  <Text style={styles.priceValue}>₦{pkg.quarterlyPrice?.toLocaleString()}</Text>
                  <Text style={styles.savingsText}>Save 10%</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.priceOption}
                  onPress={() => subscribeToPackage(pkg.id, 'yearly')}
                >
                  <Text style={styles.priceLabel}>Yearly</Text>
                  <Text style={styles.priceValue}>₦{pkg.yearlyPrice?.toLocaleString()}</Text>
                  <Text style={styles.savingsText}>Save 20%</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
  },
  packageServices: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  subscriptionDetails: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  noSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  noSubscriptionTitle: {
    fontSize: 18,
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
  },
  packagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  promoBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  packageServicesText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  pricingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceOption: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  savingsText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default OrganizationSubscriptionScreen;