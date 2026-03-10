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

const FieldAgentVerificationScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    draft: '#F59E0B',
    submitted: '#3B82F6',
    approved: '#10B981',
    rejected: '#EF4444'
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'assignments') {
        const response = await ApiService.getMyVerificationAssignments();
        if (response.success) {
          setAssignments(response.data.assignments || []);
        }
      } else {
        // Fetch actual verifications created by user
        const response = await ApiService.getMyActualVerifications();
        if (response.success) {
          setVerifications(response.data.verifications || []);
        }
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTabButton = (tabKey, title) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={[styles.tabButtonText, activeTab === tabKey && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderAssignments = () => (
    assignments.length === 0 ? (
      <View style={styles.emptyState}>
        <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No assignments yet</Text>
      </View>
    ) : (
      assignments.map((assignment) => (
        <View key={assignment._id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.organizationName}>{assignment.organizationName}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusColors[assignment.status] }
            ]}>
              <Text style={styles.statusBadgeText}>{assignment.status}</Text>
            </View>
          </View>
          <Text style={styles.targetUser}>Target: {assignment.targetUserName}</Text>
          <Text style={styles.date}>Assigned: {formatDate(assignment.assignedAt)}</Text>
          <Text style={styles.locationCount}>
            {assignment.organizationLocationDetails?.length || 0} locations to verify
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('VerificationDetails', { 
                verificationId: assignment._id,
                isAssignment: true 
              })}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
            {assignment.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.startButton]}
                onPress={() => navigation.navigate('CreateVerification', { assignment })}
              >
                <Text style={styles.startButtonText}>Start Verification</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))
    )
  );

  const renderVerifications = () => (
    verifications.length === 0 ? (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No verifications yet</Text>
      </View>
    ) : (
      verifications.map((verification) => (
        <View key={verification._id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.verificationId}>{verification.verificationId}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusColors[verification.status] }
            ]}>
              <Text style={styles.statusBadgeText}>{verification.status}</Text>
            </View>
          </View>
          <Text style={styles.organizationName}>{verification.organizationName}</Text>
          <Text style={styles.date}>Created: {formatDate(verification.createdAt)}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('VerificationDetails', { 
                verificationId: verification._id,
                isAssignment: false 
              })}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))
    )
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {renderTabButton('assignments', 'My Assignments')}
        {renderTabButton('verifications', 'My Verifications')}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          activeTab === 'assignments' ? renderAssignments() : renderVerifications()
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  verificationId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    flex: 1,
  },
  targetUser: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  locationCount: {
    fontSize: 12,
    color: '#7C3AED',
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  actionButtonText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FieldAgentVerificationScreen;