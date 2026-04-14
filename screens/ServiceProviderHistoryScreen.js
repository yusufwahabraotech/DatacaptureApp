import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const response = await ApiService.getServiceProviderHistory(page, 20);

      if (response.success && response.data) {
        const newHistory = response.data.history || [];
        
        if (append) {
          setHistory(prev => [...prev, ...newHistory]);
        } else {
          setHistory(newHistory);
        }

        setHasMore(newHistory.length === 20);
        setCurrentPage(page);
      }
    } catch (error) {
      console.log('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadHistory(currentPage + 1, true);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'assigned':
        return { name: 'add-circle', color: '#4CAF50' };
      case 'removed':
        return { name: 'remove-circle', color: '#FF6B6B' };
      case 'created':
        return { name: 'create', color: '#2196F3' };
      default:
        return { name: 'information-circle', color: '#666666' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderHistoryItem = ({ item }) => {
    const icon = getActionIcon(item.action);
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>{item.description}</Text>
          
          {item.userDetails && (
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.userDetails.fullName}</Text>
              <Text style={styles.userEmail}>{item.userDetails.email}</Text>
            </View>
          )}
          
          <View style={styles.historyMeta}>
            <Text style={styles.performedBy}>
              By: {item.performedBy?.fullName || 'System'}
            </Text>
            <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#7B2CBF" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && history.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment History</Text>
        <View style={styles.placeholder} />
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item._id || item.id || `history-${Date.now()}-${Math.random()}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No History Available</Text>
          <Text style={styles.emptyText}>
            Service provider assignment history will appear here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  userDetails: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performedBy: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ServiceProviderHistoryScreen;