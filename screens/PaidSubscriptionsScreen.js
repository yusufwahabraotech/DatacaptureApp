import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const PaidSubscriptionsScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, searchQuery]);

  const fetchSubscriptions = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      console.log('🚨 FETCHING SUBSCRIPTIONS DEBUG 🚨');
      console.log('Params:', JSON.stringify(params, null, 2));

      const response = await ApiService.getPaidSubscriptions(params);
      
      console.log('🚨 SUBSCRIPTIONS RESPONSE DEBUG 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setSubscriptions(response.data?.subscriptions || []);
        setTotalPages(response.data?.totalPages || 1);
        setTotal(response.data?.total || 0);
      } else {
        console.log('API Error:', response.message);
        Alert.alert('Error', response.message || 'Failed to fetch subscriptions');
        setSubscriptions([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.log('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch subscriptions');
      setSubscriptions([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchSubscriptions();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => `₦${amount.toLocaleString()}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expired': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  const renderSubscriptionItem = ({ item }) => (
    <View style={styles.subscriptionCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.packageTitle}>{item.packageTitle || 'Unknown Package'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'unknown') }]}>
          <Text style={styles.statusText}>{(item.status || 'UNKNOWN').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.userInfo?.fullName || 'Unknown User'}</Text>
        <Text style={styles.userEmail}>{item.userInfo?.email || 'No email'}</Text>
        {item.userInfo?.phoneNumber && (
          <Text style={styles.userPhone}>{item.userInfo.phoneNumber}</Text>
        )}
        {item.userInfo?.customUserId && (
          <Text style={styles.userType}>ID: {item.userInfo.customUserId}</Text>
        )}
      </View>

      <View style={styles.subscriptionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{item.subscriptionDuration || 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatAmount(item.amountPaid || 0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date:</Text>
          <Text style={styles.detailValue}>{item.startDate ? formatDate(item.startDate) : 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Date:</Text>
          <Text style={styles.detailValue}>{item.endDate ? formatDate(item.endDate) : 'Unknown'}</Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#9CA3AF' : '#7C3AED'} />
      </TouchableOpacity>

      <Text style={styles.pageInfo}>
        Page {currentPage} of {totalPages} ({total} total)
      </Text>

      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#9CA3AF' : '#7C3AED'} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paid Subscriptions</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or package..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={subscriptions}
        renderItem={renderSubscriptionItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No paid subscriptions found</Text>
          </View>
        }
        ListFooterComponent={subscriptions.length > 0 ? renderPagination : null}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  userInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  userType: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  subscriptionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    marginTop: 16,
    borderRadius: 12,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default PaidSubscriptionsScreen;