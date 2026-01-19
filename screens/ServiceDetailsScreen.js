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

const ServiceDetailsScreen = ({ route, navigation }) => {
  const { serviceId } = route.params;
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceDetails();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      const response = await ApiService.getServiceById(serviceId);
      if (response.success) {
        setServiceData(response.data.service);
      } else {
        Alert.alert('Error', 'Failed to fetch service details');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch service details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₦${price.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateSavings = (monthly, quarterly, yearly) => {
    const monthlyTotal = monthly * 12;
    const quarterlyTotal = quarterly * 4;
    const quarterlySavings = monthlyTotal - quarterlyTotal;
    const yearlySavings = monthlyTotal - yearly;
    
    return {
      quarterlySavings,
      yearlySavings,
      quarterlyPercent: Math.round((quarterlySavings / monthlyTotal) * 100),
      yearlyPercent: Math.round((yearlySavings / monthlyTotal) * 100),
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (!serviceData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Service not found</Text>
      </View>
    );
  }

  const savings = calculateSavings(
    serviceData.monthlyPrice,
    serviceData.quarterlyPrice,
    serviceData.yearlyPrice
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Service Info */}
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIcon}>
            <Ionicons name="construct" size={32} color="#7C3AED" />
          </View>
          <Text style={styles.serviceName}>{serviceData.serviceName}</Text>
          {serviceData.description && (
            <Text style={styles.serviceDescription}>{serviceData.description}</Text>
          )}
        </View>

        {/* Pricing Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Tiers</Text>
          
          {/* Monthly */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingIcon}>
                <Ionicons name="calendar" size={20} color="#7C3AED" />
              </View>
              <View style={styles.pricingInfo}>
                <Text style={styles.pricingTitle}>Monthly</Text>
                <Text style={styles.pricingSubtitle}>Billed monthly</Text>
              </View>
              <Text style={styles.pricingAmount}>{formatPrice(serviceData.monthlyPrice)}</Text>
            </View>
          </View>

          {/* Quarterly */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingIcon}>
                <Ionicons name="calendar" size={20} color="#10B981" />
              </View>
              <View style={styles.pricingInfo}>
                <Text style={styles.pricingTitle}>Quarterly</Text>
                <Text style={styles.pricingSubtitle}>Billed every 3 months</Text>
                {savings.quarterlySavings > 0 && (
                  <Text style={styles.savingsText}>
                    Save {formatPrice(savings.quarterlySavings)} ({savings.quarterlyPercent}%) vs monthly
                  </Text>
                )}
              </View>
              <Text style={styles.pricingAmount}>{formatPrice(serviceData.quarterlyPrice)}</Text>
            </View>
          </View>

          {/* Yearly */}
          <View style={[styles.pricingCard, styles.popularCard]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Best Value</Text>
            </View>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingIcon}>
                <Ionicons name="calendar" size={20} color="#F59E0B" />
              </View>
              <View style={styles.pricingInfo}>
                <Text style={styles.pricingTitle}>Yearly</Text>
                <Text style={styles.pricingSubtitle}>Billed annually</Text>
                {savings.yearlySavings > 0 && (
                  <Text style={styles.savingsText}>
                    Save {formatPrice(savings.yearlySavings)} ({savings.yearlyPercent}%) vs monthly
                  </Text>
                )}
              </View>
              <Text style={styles.pricingAmount}>{formatPrice(serviceData.yearlyPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Service Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: serviceData.isActive ? '#10B981' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: serviceData.isActive ? '#10B981' : '#EF4444' }]}>
                  {serviceData.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(serviceData.createdAt)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(serviceData.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Pricing Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annual Cost Comparison</Text>
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Monthly Plan (×12)</Text>
              <Text style={styles.comparisonValue}>
                {formatPrice(serviceData.monthlyPrice * 12)}
              </Text>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Quarterly Plan (×4)</Text>
              <Text style={styles.comparisonValue}>
                {formatPrice(serviceData.quarterlyPrice * 4)}
              </Text>
            </View>
            
            <View style={[styles.comparisonItem, styles.bestValue]}>
              <Text style={[styles.comparisonLabel, styles.bestValueText]}>Yearly Plan</Text>
              <Text style={[styles.comparisonValue, styles.bestValueText]}>
                {formatPrice(serviceData.yearlyPrice)}
              </Text>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  serviceHeader: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  pricingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  pricingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  infoContainer: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  statusBadge: {
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
  },
  comparisonContainer: {
    gap: 12,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  bestValue: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bestValueText: {
    color: '#7C3AED',
  },
});

export default ServiceDetailsScreen;