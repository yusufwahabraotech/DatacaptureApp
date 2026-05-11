import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminCompletedTasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const response = await ApiService.getAdminCompletedTasksList(true);
      if (response.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.log('Error fetching completed tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompletedTasks();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || 0}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading completed tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Completed Tasks</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>Total Tasks</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(tasks.reduce((sum, t) => sum + (t.amountPaid || 0), 0))}
          </Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </View>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No completed tasks yet</Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <TouchableOpacity
              key={task.taskId || index}
              style={styles.taskCard}
              onPress={() => navigation.navigate('AdminTaskCompletionDetails', { taskId: task.taskId })}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskHeaderLeft}>
                  <Text style={styles.taskId}>#{task.sn}</Text>
                  <Text style={styles.serviceName}>{task.serviceName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.settlementStatus) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(task.settlementStatus) }]}>
                    {task.settlementStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.taskDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Provider: {task.serviceProvider}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Customer: {task.customerFullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{formatDate(task.completedAt)}</Text>
                </View>
              </View>

              <View style={styles.taskFooter}>
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Amount Paid</Text>
                  <Text style={styles.amountValue}>{formatCurrency(task.amountPaid)}</Text>
                </View>
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Provider Fee</Text>
                  <Text style={styles.providerFee}>{formatCurrency(task.providerFee)}</Text>
                </View>
              </View>

              {task.confirmationDetails && (
                <View style={styles.confirmationPreview}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.confirmationText}>
                    {task.confirmationDetails.serviceImages?.length || 0} images uploaded
                  </Text>
                </View>
              )}

              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#7B2CBF" />
              </View>
            </TouchableOpacity>
          ))
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flex: 1,
  },
  taskId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 12,
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  providerFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  confirmationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmationText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2CBF',
    marginRight: 4,
  },
});

export default AdminCompletedTasksScreen;
