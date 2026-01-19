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

const PackageDetailsScreen = ({ route, navigation }) => {
  const { packageId } = route.params;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackageDetails();
  }, []);

  const fetchPackageDetails = async () => {
    try {
      const response = await ApiService.getSubscriptionPackageById(packageId);
      if (response.success) {
        setPackageData(response.data.package);
      } else {
        Alert.alert('Error', 'Failed to fetch package details');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch package details');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Package not found</Text>
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Package Info */}
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>{packageData.title}</Text>
          <Text style={styles.packageDescription}>{packageData.description}</Text>
          
          {packageData.promoCode && (
            <View style={styles.promoContainer}>
              <View style={styles.promoHeader}>
                <Ionicons name="pricetag" size={16} color="#7C3AED" />
                <Text style={styles.promoTitle}>Promotional Offer</Text>
              </View>
              <Text style={styles.promoCode}>Code: {packageData.promoCode}</Text>
              <Text style={styles.promoDate}>
                Valid: {formatDate(packageData.promoStartDate)} - {formatDate(packageData.promoEndDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Service Cost</Text>
              <Text style={styles.pricingValue}>{formatPrice(packageData.totalServiceCost || 0)}</Text>
            </View>
            
            {packageData.discountPercentage > 0 && (
              <>
                <View style={styles.pricingRow}>
                  <Text style={styles.discountLabel}>
                    Discount ({packageData.discountPercentage}%)
                  </Text>
                  <Text style={styles.discountValue}>
                    -{formatPrice(packageData.discountAmount || 0)}
                  </Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            
            <View style={styles.pricingRow}>
              <Text style={styles.finalLabel}>Final Price</Text>
              <Text style={styles.finalValue}>
                {formatPrice(packageData.finalPriceAfterDiscount || packageData.totalServiceCost || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Included Services</Text>
          {packageData.services && packageData.services.length > 0 ? (
            packageData.services.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="construct" size={20} color="#7C3AED" />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                    <Text style={styles.serviceDuration}>
                      Duration: {service.duration} • Price: {formatPrice(service.price || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No services configured</Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Features</Text>
          <View style={styles.featuresContainer}>
            {packageData.features && packageData.features.length > 0 ? (
              packageData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No features listed</Text>
            )}
          </View>
        </View>

        {/* Package Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: packageData.isActive ? '#10B981' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: packageData.isActive ? '#10B981' : '#EF4444' }]}>
                  {packageData.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Created</Text>
              <Text style={styles.statusValue}>{formatDate(packageData.createdAt)}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Last Updated</Text>
              <Text style={styles.statusValue}>{formatDate(packageData.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        {packageData.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>{packageData.note}</Text>
            </View>
          </View>
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
  packageHeader: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  promoContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 8,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  promoDate: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  discountLabel: {
    fontSize: 14,
    color: '#10B981',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  finalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  statusContainer: {
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
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
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  noteContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default PackageDetailsScreen;