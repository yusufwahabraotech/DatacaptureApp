import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProviders, setFilteredProviders] = useState([]);

  useEffect(() => {
    loadServiceProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, serviceProviders]);

  const loadServiceProviders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🚨 LOADING SERVICE PROVIDERS LIST WITH DETAILED INFO 🚨');
      
      const response = await ApiService.getAssignedServiceProviders();
      
      if (response.success) {
        console.log('✅ Service providers loaded:', response.data.serviceProviders?.length || 0);
        console.log('📊 Sample provider data:', response.data.serviceProviders?.[0] ? JSON.stringify(response.data.serviceProviders[0], null, 2) : 'No providers');
        setServiceProviders(response.data.serviceProviders || []);
      } else {
        console.log('❌ Failed to load service providers:', response.message);
        setServiceProviders([]);
      }
    } catch (error) {
      console.error('Error loading service providers:', error);
      setServiceProviders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProviders = () => {
    if (!searchQuery.trim()) {
      setFilteredProviders(serviceProviders);
    } else {
      const filtered = serviceProviders.filter(provider => {
        const fullName = `${provider.firstName} ${provider.lastName}`.toLowerCase();
        const email = provider.email.toLowerCase();
        const specialties = provider.serviceProviderInfo?.specialties?.join(' ').toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               specialties.includes(query);
      });
      setFilteredProviders(filtered);
    }
  };

  const onRefresh = async () => {
    await loadServiceProviders(true);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'NGN': '₦',
      'GBP': '£',
      'EUR': '€',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹'
    };
    return symbols[currency] || currency;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'busy': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderServiceProvider = ({ item }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const info = item.serviceProviderInfo || {};
    const rating = info.rating || 0;
    const totalBookings = info.totalBookings || 0;
    const completedBookings = info.completedBookings || 0;
    const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0;

    return (
      <TouchableOpacity 
        style={styles.providerCard}
        onPress={() => navigation.navigate('ServiceProviderProfile', { 
          providerId: item.userId,
          providerData: item 
        })}
      >
        {/* Header with name and status */}
        <View style={styles.providerHeader}>
          <View style={styles.providerNameSection}>
            <Text style={styles.providerName}>{fullName}</Text>
            <Text style={styles.providerEmail}>{item.email}</Text>
            <Text style={styles.providerId}>ID: {info.providerId || item.customUserId}</Text>
          </View>
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(info.status) }]}>
              <Text style={styles.statusText}>{info.status || 'active'}</Text>
            </View>
            {info.isAvailable && (
              <View style={styles.availableBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specialties */}
        {info.specialties && info.specialties.length > 0 && (
          <View style={styles.specialtiesSection}>
            <Text style={styles.sectionLabel}>Specialties:</Text>
            <View style={styles.specialtiesList}>
              {info.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalBookings}</Text>
            <Text style={styles.metricLabel}>Total Bookings</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
        </View>

        {/* Fee Information */}
        {info.serviceProviderFee && (
          <View style={styles.feeSection}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeName}>{info.serviceProviderFeeName}</Text>
              <Text style={styles.feeAmount}>
                {getCurrencySymbol(info.serviceProviderFeeCurrency)}{info.serviceProviderFee} 
                <Text style={styles.feeFrequency}>/{info.serviceProviderFeeFrequency}</Text>
              </Text>
            </View>
            {info.availabilityHours && (
              <Text style={styles.availabilityHours}>
                <Ionicons name="time" size={14} color="#6B7280" /> {info.availabilityHours}
              </Text>
            )}
          </View>
        )}

        {/* Action Arrow */}
        <View style={styles.actionArrow}>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Service Providers Found</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery 
          ? 'No providers match your search criteria. Try adjusting your search terms.' 
          : 'No service providers have been assigned yet. Get started by assigning your first service provider.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate('ServiceProviderAssignment')}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.assignButtonText}>Assign Service Providers</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Providers</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading service providers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Providers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ServiceProviderAssignment')}>
          <Ionicons name="person-add" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Stats */}
      {serviceProviders.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{serviceProviders.length}</Text>
            <Text style={styles.summaryLabel}>Total Providers</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {serviceProviders.filter(p => p.isServiceProvider).length}
            </Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {serviceProviders.filter(p => p.systemRole === 'SERVICE_PROVIDER').length}
            </Text>
            <Text style={styles.summaryLabel}>Assigned</Text>
          </View>
        </View>
      )}

      {/* Service Providers List */}
      <FlatList
        data={filteredProviders}
        renderItem={renderServiceProvider}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerNameSection: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  providerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  providerId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  specialtiesSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  feeSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  feeFrequency: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  availabilityHours: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServiceProviderListScreen;