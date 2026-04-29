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
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'completed'
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      filterHistory();
    } else {
      filterTasks();
    }
  }, [searchQuery, history, completedTasks, activeTab]);

  const loadData = async () => {
    if (activeTab === 'history') {
      await loadHistory();
    } else {
      await loadCompletedTasks();
    }
  };

  const loadCompletedTasks = async () => {
    setLoading(true);
    try {
      console.log('🚨 LOADING COMPLETED TASKS WITH DETAILS 🚨');
      
      const response = await ApiService.getCompletedTasksWithDetails();
      
      if (response.success) {
        console.log('✅ Completed tasks loaded:', response.data.tasks?.length || 0);
        setCompletedTasks(response.data.tasks || []);
      } else {
        console.log('❌ Failed to load completed tasks:', response.message);
        setCompletedTasks([]);
      }
    } catch (error) {
      console.error('Error loading completed tasks:', error);
      setCompletedTasks([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filterTasks = () => {
    if (!searchQuery.trim()) {
      setFilteredTasks(completedTasks);
    } else {
      const filtered = completedTasks.filter(item => {
        const serviceName = item.serviceName?.toLowerCase() || '';
        const customerName = item.customerFullName?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return serviceName.includes(query) || customerName.includes(query);
      });
      setFilteredTasks(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'history') {
      setCurrentPage(1);
      await loadHistory(1, true);
    } else {
      await loadCompletedTasks();
    }
    setRefreshing(false);
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

  const renderCompletedTaskItem = ({ item }) => {
    const hasConfirmation = item.confirmationDetails;
    const hasDeliveryConfirmation = item.canConfirmDelivery === false; // Already confirmed

    return (
      <View style={styles.taskItem}>
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{item.serviceName}</Text>
            <Text style={styles.taskCustomer}>Customer: {item.customerFullName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.taskId}>#{item.taskId?.slice(-6)}</Text>
            <Text style={styles.taskDate}>{formatDate(item.completedAt)}</Text>
          </View>
        </View>

        {/* Confirmation Status */}
        <View style={styles.confirmationStatus}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: hasConfirmation ? '#10B981' : '#EF4444' }]}>
              <Ionicons 
                name={hasConfirmation ? "checkmark-circle" : "close-circle"} 
                size={12} 
                color="white" 
              />
            </View>
            <Text style={styles.statusText}>
              Task Confirmation: {hasConfirmation ? 'Complete' : 'Missing'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: hasDeliveryConfirmation ? '#10B981' : '#F59E0B' }]}>
              <Ionicons 
                name={hasDeliveryConfirmation ? "checkmark-circle" : "time"} 
                size={12} 
                color="white" 
              />
            </View>
            <Text style={styles.statusText}>
              Delivery Status: {hasDeliveryConfirmation ? 'Confirmed' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Completion Details */}
        {hasConfirmation && (
          <View style={styles.completionDetails}>
            <Text style={styles.completionLabel}>Completion Declaration:</Text>
            <Text style={styles.completionText} numberOfLines={2}>
              {item.confirmationDetails.serviceCompletionDeclaration}
            </Text>
            
            {item.confirmationDetails.serviceImages?.length > 0 && (
              <Text style={styles.mediaInfo}>
                📷 {item.confirmationDetails.serviceImages.length} images attached
              </Text>
            )}
            
            {item.confirmationDetails.serviceVideoUrl && (
              <Text style={styles.mediaInfo}>🎥 Video attached</Text>
            )}
          </View>
        )}

        {/* Action Button */}
        {!hasDeliveryConfirmation && (
          <TouchableOpacity 
            style={styles.confirmDeliveryBtn}
            onPress={() => navigation.navigate('DeliveryConfirmationForm', { orderId: item.orderId })}
          >
            <Ionicons name="checkmark-done" size={16} color="#7B2CBF" />
            <Text style={styles.confirmDeliveryBtnText}>Confirm Delivery</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.headerTitle}>Service Provider History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time" 
            size={16} 
            color={activeTab === 'history' ? '#7B2CBF' : '#9CA3AF'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Assignment History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Ionicons 
            name="checkmark-done" 
            size={16} 
            color={activeTab === 'completed' ? '#7B2CBF' : '#9CA3AF'} 
          />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed Tasks
          </Text>
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

      {/* Content List */}
      <FlatList
        data={activeTab === 'history' ? filteredHistory : filteredTasks}
        renderItem={activeTab === 'history' ? renderHistoryItem : renderCompletedTaskItem}
        keyExtractor={(item) => activeTab === 'history' ? item.id : item.taskId}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={activeTab === 'history' ? renderFooter : null}
        onEndReached={activeTab === 'history' ? loadMoreHistory : null}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#F3E8FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#7B2CBF',
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
  // Completed Tasks Styles
  taskItem: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskCustomer: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  confirmationStatus: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  completionDetails: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  completionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },
  completionText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  mediaInfo: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  confirmDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  confirmDeliveryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
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