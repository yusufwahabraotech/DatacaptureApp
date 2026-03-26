import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const VerificationAssignmentsScreen = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await ApiService.getAllVerificationAssignments();
      if (response.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.log('Error fetching assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const deleteAssignment = async (assignmentId) => {
    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to delete this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteVerificationAssignment(assignmentId);
              if (response.success) {
                Alert.alert('Success', 'Assignment deleted successfully');
                fetchAssignments();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete assignment');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Assignments</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No assignments found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create verification roles to see assignments here
            </Text>
          </View>
        ) : (
          assignments.map((assignment, index) => (
            <View key={`${assignment._id}-${index}`} style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <View style={styles.assignmentInfo}>
                  <Text style={styles.organizationName}>{assignment.organizationName}</Text>
                  <Text style={styles.userName}>Assigned to: {assignment.userName}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(assignment.status) }
                ]}>
                  <Text style={styles.statusText}>{assignment.status}</Text>
                </View>
              </View>

              <View style={styles.assignmentDetails}>
                <Text style={styles.targetUser}>Target: {assignment.targetUserName}</Text>
                <Text style={styles.assignedDate}>
                  Assigned: {formatDate(assignment.assignedAt)}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => navigation.navigate('AssignmentDetails', { 
                    assignmentId: assignment._id 
                  })}
                >
                  <Ionicons name="eye" size={16} color="#7C3AED" />
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                
                {assignment.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteAssignment(assignment._id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  headerSpacer: {
    width: 24,
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  assignmentDetails: {
    marginBottom: 12,
  },
  targetUser: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  assignedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VerificationAssignmentsScreen;