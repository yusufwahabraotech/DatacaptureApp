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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, history]);

  const loadHistory = async (page = 1, isRefresh = false, isLoadMore = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🚨 LOADING SERVICE PROVIDER HISTORY 🚨');
      console.log('Page:', page);
      
      const response = await ApiService.getServiceProviderHistory(page, 20);
      
      if (response.success) {
        console.log('✅ History loaded:', response.data.history?.length || 0);
        
        if (page === 1 || isRefresh) {
          setHistory(response.data.history || []);
        } else {
          setHistory(prev => [...prev, ...(response.data.history || [])]);
        }
        
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        console.log('❌ Failed to load history:', response.message);
        if (page === 1 || isRefresh) {
          setHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
      if (page === 1 || isRefresh) {
        setHistory([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const filterHistory = () => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item => {
        const userName = item.userName?.toLowerCase() || '';
        const userEmail = item.userEmail?.toLowerCase() || '';
        const adminName = item.adminName?.toLowerCase() || '';
        const action = item.action?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return userName.includes(query) || 
               userEmail.includes(query) || 
               adminName.includes(query) ||
               action.includes(query);
      });
      setFilteredHistory(filtered);
    }
  };

  const onRefresh = async () => {
    setCurrentPage(1);
    await loadHistory(1, true);
  };

  const loadMoreHistory = async () => {
    if (pagination && pagination.hasNext && !loadingMore) {
      const nextPage = currentPage + 1;
      await loadHistory(nextPage, false, true);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'assigned': return 'person-add';
      case 'unassigned': return 'person-remove';
      case 'updated': return 'create';
      default: return 'information-circle';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'assigned': return '#10B981';
      case 'unassigned': return '#EF4444';
      case 'updated': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderHistoryItem = ({ item }) => {
    const actionColor = getActionColor(item.action);
    const actionIcon = getActionIcon(item.action);

    return (
      <View style={styles.historyItem}>
        <View style={[styles.actionIcon, { backgroundColor: actionColor }]}>
          <Ionicons name={actionIcon} size={20} color="white" />
        </View>
        
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.actionText}> was {item.action}</Text>
              {item.action === 'assigned' && ' as service provider'}
            </Text>
            <Text style={styles.historyTime}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <Text style={styles.userEmail}>{item.userEmail}</Text>
          
          {item.specialties && item.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              <Text style={styles.specialtiesLabel}>Specialties: </Text>
              <Text style={styles.specialtiesText}>{item.specialties.join(', ')}</Text>
            </View>
          )}
          
          {item.previousRole && item.newRole && (
            <View style={styles.roleChangeContainer}>
              <Text style={styles.roleChangeText}>
                Role changed from <Text style={styles.roleText}>{item.previousRole}</Text> to{' '}
                <Text style={styles.roleText}>{item.newRole}</Text>
              </Text>
            </View>
          )}
          
          <View style={styles.adminInfo}>
            <Ionicons name="person" size={14} color="#6B7280" />
            <Text style={styles.adminText}>by {item.adminName}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Assignment History</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery 
          ? 'No history matches your search criteria.' 
          : 'No service provider assignments have been made yet. Start by assigning your first service provider to see activity here.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('ServiceProviderAssignment')}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.getStartedButtonText}>Assign First Provider</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#7B2CBF" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assignment History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading history...</Text>
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
        <Text style={styles.headerTitle}>Assignment History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, admin, or action..."
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
      {pagination && pagination.totalRecords > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{pagination.totalRecords}</Text>
            <Text style={styles.summaryLabel}>Total Records</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{pagination.currentPage}</Text>
            <Text style={styles.summaryLabel}>Current Page</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{pagination.totalPages}</Text>
            <Text style={styles.summaryLabel}>Total Pages</Text>
          </View>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.1}
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
    fontSize: 20,
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
  historyItem: {
    flexDirection: 'row',
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
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontWeight: '600',
    color: '#7B2CBF',
  },
  actionText: {
    fontWeight: '400',
    color: '#374151',
  },
  historyTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specialtiesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  specialtiesText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  roleChangeContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  roleChangeText: {
    fontSize: 12,
    color: '#374151',
  },
  roleText: {
    fontWeight: '600',
    color: '#7B2CBF',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminText: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServiceProviderHistoryScreen;