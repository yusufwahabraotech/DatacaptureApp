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

const DataVerificationManagementScreen = ({ navigation }) => {
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusOptions = [
    { key: 'all', label: 'All', color: '#6B7280' },
    { key: 'draft', label: 'Draft', color: '#F59E0B' },
    { key: 'submitted', label: 'Submitted', color: '#3B82F6' },
    { key: 'approved', label: 'Approved', color: '#10B981' },
    { key: 'rejected', label: 'Rejected', color: '#EF4444' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  const fetchData = async () => {
    try {
      const [verificationsRes, statsRes] = await Promise.all([
        ApiService.getSuperAdminVerifications(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        ApiService.getVerificationStats()
      ]);

      if (verificationsRes.success) {
        setVerifications(verificationsRes.data.verifications);
      }
      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reviewVerification = async (verificationId, status, comments = '') => {
    try {
      const response = await ApiService.reviewVerification(verificationId, status, comments);
      if (response.success) {
        Alert.alert('Success', `Verification ${status} successfully`);
        fetchData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to review verification');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Verification</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreateDataVerificationRole')}
          >
            <Ionicons name="add" size={20} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DataVerificationUsers')}>
            <Ionicons name="people" size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.submitted || 0}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.approved || 0}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.rejected || 0}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Create Role Button */}
      <View style={styles.createRoleSection}>
        <TouchableOpacity 
          style={styles.createRoleButton}
          onPress={() => navigation.navigate('CreateDataVerificationRole')}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.createRoleButtonText}>Create Verification Role</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterContainer}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusChip,
              selectedStatus === status.key && { backgroundColor: status.color }
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === status.key && { color: 'white' }
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Verifications List */}
      <ScrollView style={styles.verificationsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : verifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No verifications found</Text>
          </View>
        ) : (
          verifications.map((verification) => (
            <View key={verification._id} style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
                <Text style={styles.verificationId}>{verification.verificationId}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusOptions.find(s => s.key === verification.status)?.color }
                ]}>
                  <Text style={styles.statusBadgeText}>{verification.status}</Text>
                </View>
              </View>

              <Text style={styles.organizationName}>{verification.organizationName}</Text>
              <Text style={styles.verifierName}>By: {verification.verifierName}</Text>
              <Text style={styles.location}>{verification.city}, {verification.state}</Text>
              <Text style={styles.date}>Created: {formatDate(verification.createdAt)}</Text>

              {verification.status === 'submitted' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => reviewVerification(verification._id, 'approved', 'Verification approved')}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => reviewVerification(verification._id, 'rejected', 'Verification rejected')}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  verificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  verificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  verifierName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  createRoleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  createRoleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DataVerificationManagementScreen;