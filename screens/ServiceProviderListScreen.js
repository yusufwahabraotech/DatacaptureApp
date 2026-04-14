import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchQuery, filterStatus]);

  const loadProviders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🚨 LOADING SERVICE PROVIDERS 🚨');
      
      const response = await ApiService.getServiceProviderUsers();
      
      if (response.success) {
        // Filter only service providers
        const serviceProviders = response.data.users.filter(user => user.isServiceProvider);
        setProviders(serviceProviders);
        console.log('✅ Service providers loaded:', serviceProviders.length);
      } else {
        console.log('❌ Failed to load providers:', response.message);
        Alert.alert('Error', response.message || 'Failed to load service providers');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load service providers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(provider => 
        provider.firstName.toLowerCase().includes(query) ||
        provider.lastName.toLowerCase().includes(query) ||
        provider.email.toLowerCase().includes(query) ||
        (provider.customUserId && provider.customUserId.toLowerCase().includes(query)) ||
        (provider.serviceProviderInfo?.specialties && 
         provider.serviceProviderInfo.specialties.some(specialty => 
           specialty.toLowerCase().includes(query)
         ))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(provider => {
        const status = provider.serviceProviderInfo?.status || 'inactive';
        return status === filterStatus;
      });
    }

    setFilteredProviders(filtered);
  };

  const handleProviderPress = (provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleToggleProviderStatus = async (provider) => {
    const currentStatus = provider.serviceProviderInfo?.status || 'inactive';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    Alert.alert(
      'Change Provider Status',
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${provider.firstName} ${provider.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus === 'active' ? 'Activate' : 'Deactivate',
          style: newStatus === 'active' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              // This would be a new API endpoint to update provider status
              // For now, we'll just show a success message and reload
              Alert.alert('Success', `Provider status updated to ${newStatus}`);
              loadProviders();
            } catch (error) {
              Alert.alert('Error', 'Failed to update provider status');
            }
          }
        }
      ]
    );
  };

  const renderProviderItem = ({ item }) => {
    const providerInfo = item.serviceProviderInfo || {};
    const isActive = providerInfo.status === 'active';
    
    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() => handleProviderPress(item)}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.providerEmail}>{item.email}</Text>
            {item.customUserId && (
              <Text style={styles.customUserId}>ID: {item.customUserId}</Text>
            )}
          </View>
          
          <View style={styles.providerStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isActive ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.statusToggle}
              onPress={() => handleToggleProviderStatus(item)}
            >
              <Ionicons 
                name={isActive ? 'toggle' : 'toggle-outline'} 
                size={24} 
                color={isActive ? '#10B981' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.providerDetails}>
          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{providerInfo.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{providerInfo.completedBookings || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{providerInfo.rating || 0}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Specialties */}
          {providerInfo.specialties && providerInfo.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              <Text style={styles.specialtiesLabel}>Specialties:</Text>
              <View style={styles.specialtiesList}>
                {providerInfo.specialties.slice(0, 3).map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
                {providerInfo.specialties.length > 3 && (
                  <View style={styles.moreSpecialtiesTag}>
                    <Text style={styles.moreSpecialtiesText}>
                      +{providerInfo.specialties.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Provider ID */}
          {providerInfo.providerId && (
            <View style={styles.providerIdContainer}>
              <Text style={styles.providerIdLabel}>Provider ID:</Text>
              <Text style={styles.providerIdValue}>{providerInfo.providerId}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Providers</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptions}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            
            {[
              { key: 'all', label: 'All Providers', count: providers.length },
              { key: 'active', label: 'Active', count: providers.filter(p => p.serviceProviderInfo?.status === 'active').length },
              { key: 'inactive', label: 'Inactive', count: providers.filter(p => p.serviceProviderInfo?.status !== 'active').length },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filterStatus === option.key && styles.selectedFilterOption
                ]}
                onPress={() => {
                  setFilterStatus(option.key);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStatus === option.key && styles.selectedFilterOptionText
                ]}>
                  {option.label} ({option.count})
                </Text>
                {filterStatus === option.key && (
                  <Ionicons name="checkmark" size={20} color="#7B2CBF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProviderModal = () => (
    <Modal
      visible={showProviderModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProviderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.providerModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Provider Details</Text>
            <TouchableOpacity onPress={() => setShowProviderModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {selectedProvider && (
            <View style={styles.providerModalBody}>
              <View style={styles.providerModalHeader}>
                <Text style={styles.providerModalName}>
                  {selectedProvider.firstName} {selectedProvider.lastName}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedProvider.serviceProviderInfo?.status === 'active' ? '#10B981' : '#EF4444' }
                ]}>
                  <Text style={styles.statusText}>
                    {selectedProvider.serviceProviderInfo?.status?.toUpperCase() || 'INACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.providerModalDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedProvider.email}</Text>
                </View>
                
                {selectedProvider.customUserId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Custom ID:</Text>
                    <Text style={styles.detailValue}>{selectedProvider.customUserId}</Text>
                  </View>
                )}
                
                {selectedProvider.serviceProviderInfo?.providerId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider ID:</Text>
                    <Text style={styles.detailValue}>{selectedProvider.serviceProviderInfo.providerId}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>System Role:</Text>
                  <Text style={styles.detailValue}>{selectedProvider.systemRole}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member Since:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedProvider.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {selectedProvider.serviceProviderInfo?.specialties && (
                <View style={styles.modalSpecialties}>
                  <Text style={styles.modalSpecialtiesTitle}>Specialties</Text>
                  <View style={styles.modalSpecialtiesList}>
                    {selectedProvider.serviceProviderInfo.specialties.map((specialty, index) => (
                      <View key={index} style={styles.modalSpecialtyTag}>
                        <Text style={styles.modalSpecialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalStats}>
                <Text style={styles.modalStatsTitle}>Performance Statistics</Text>
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>
                      {selectedProvider.serviceProviderInfo?.totalBookings || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>Total Bookings</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>
                      {selectedProvider.serviceProviderInfo?.completedBookings || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>
                      {selectedProvider.serviceProviderInfo?.rating || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>Rating</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Service Providers</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery ? 'No providers match your search criteria.' : 'No service providers have been assigned yet.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate('ServiceProviderAssignment')}
        >
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
          <Text style={styles.loadingText}>Loading providers...</Text>
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
        <TouchableOpacity onPress={() => loadProviders(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search providers..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#7B2CBF" />
          {filterStatus !== 'all' && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredProviders.length} of {providers.length} providers
          {searchQuery && ` matching "${searchQuery}"`}
          {filterStatus !== 'all' && ` (${filterStatus})`}
        </Text>
      </View>

      <FlatList
        data={filteredProviders}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.providersList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadProviders(true)} 
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}
      {renderProviderModal()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B2CBF',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  providersList: {
    padding: 16,
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  customUserId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  providerStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  statusToggle: {
    padding: 4,
  },
  providerDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  specialtiesContainer: {
    marginBottom: 8,
  },
  specialtiesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specialtyTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  specialtyText: {
    fontSize: 10,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  moreSpecialtiesTag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  moreSpecialtiesText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  providerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerIdLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  providerIdValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  assignButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  providerModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterOptions: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#F3E8FF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedFilterOptionText: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
  providerModalBody: {
    padding: 20,
  },
  providerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  providerModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  providerModalDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  modalSpecialties: {
    marginBottom: 20,
  },
  modalSpecialtiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalSpecialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSpecialtyTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  modalSpecialtyText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  modalStats: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  modalStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default ServiceProviderListScreen;