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
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    draft: '#F59E0B',
    submitted: '#3B82F6',
    approved: '#10B981',
    rejected: '#EF4444'
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await ApiService.getMyVerifications();
      if (response.success) {
        setVerifications(response.data.verifications);
      }
    } catch (error) {
      console.log('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (verificationId) => {
    try {
      const response = await ApiService.submitVerification(verificationId);
      if (response.success) {
        Alert.alert('Success', 'Verification submitted successfully');
        fetchVerifications();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification');
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
        <Text style={styles.headerTitle}>My Verifications</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateVerification')}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Verifications List */}
      <ScrollView style={styles.verificationsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : verifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No verifications yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateVerification')}
            >
              <Text style={styles.createButtonText}>Create First Verification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          verifications.map((verification) => (
            <View key={verification._id} style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
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
                  onPress={() => navigation.navigate('VerificationDetails', { verificationId: verification._id })}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                
                {verification.status === 'draft' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => navigation.navigate('EditVerification', { verificationId: verification._id })}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.submitButton]}
                      onPress={() => submitVerification(verification._id)}
                    >
                      <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                  </>
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
  verificationsList: {
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  actionButtonText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    borderColor: '#F59E0B',
  },
  editButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FieldAgentVerificationScreen;