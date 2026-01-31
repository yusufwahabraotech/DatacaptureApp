import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const VerificationManagementScreen = ({ navigation }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    loadVerifications();
  }, [activeFilter]);

  const loadVerifications = async () => {
    try {
      let response;
      if (activeFilter === 'pending') {
        response = await ApiService.getPendingLocationVerifications();
      } else if (activeFilter === 'rejected') {
        response = await ApiService.getRejectedLocationVerifications();
      } else if (activeFilter === 'verified') {
        response = await ApiService.getVerifiedLocationVerifications();
      }
      
      if (response.success) {
        const key = activeFilter === 'pending' ? 'pendingLocationVerifications' : 
                   activeFilter === 'rejected' ? 'rejectedLocationVerifications' : 
                   'verifiedLocationVerifications';
        setVerifications(response.data[key] || []);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVerifications();
  };

  const approveVerification = (profileId, locationIndex) => {
    Alert.alert(
      'Approve Location Verification',
      'Are you sure you want to approve this location for verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await ApiService.approveLocationVerification(profileId, locationIndex);
              if (response.success) {
                Alert.alert('Success', 'Location approved successfully');
                loadVerifications();
              } else {
                Alert.alert('Error', response.message || 'Failed to approve');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to approve verification');
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (verification) => {
    setSelectedVerification(verification);
    setShowRejectModal(true);
  };

  const sendRejectionEmail = async (profileId, locationIndex) => {
    setSendingEmail(true);
    try {
      const response = await ApiService.sendLocationRejectionEmail(profileId, locationIndex);
      
      if (response.success) {
        Alert.alert(
          'Email Sent Successfully',
          `Rejection notification sent to ${response.data.recipientEmail}`,
          [{ text: 'OK' }]
        );
        loadVerifications(); // Refresh to show updated email status
      } else {
        Alert.alert('Error', response.message || 'Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send rejection email');
    } finally {
      setSendingEmail(false);
    }
  };

  const rejectVerification = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      const response = await ApiService.rejectLocationVerification(
        selectedVerification.profileId,
        selectedVerification.locationIndex,
        rejectReason.trim()
      );

      if (response.success) {
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedVerification(null);
        Alert.alert('Success', 'Location rejected successfully');
        loadVerifications();
      } else {
        Alert.alert('Error', response.message || 'Failed to reject');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reject verification');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Management</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'pending' && styles.activeFilter]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.filterText, activeFilter === 'pending' && styles.activeFilterText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'rejected' && styles.activeFilter]}
          onPress={() => setActiveFilter('rejected')}
        >
          <Text style={[styles.filterText, activeFilter === 'rejected' && styles.activeFilterText]}>Rejected</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'verified' && styles.activeFilter]}
          onPress={() => setActiveFilter('verified')}
        >
          <Text style={[styles.filterText, activeFilter === 'verified' && styles.activeFilterText]}>Verified</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {verifications.length > 0 ? (
          verifications.map((verification) => (
            <View key={`${verification.profileId}-${verification.locationIndex}-${activeFilter}`} style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
                <View style={styles.organizationInfo}>
                  <Text style={styles.businessType}>{verification.location.brandName}</Text>
                  <Text style={styles.organizationId}>Org: {verification.organizationId}</Text>
                  <Text style={styles.submissionDate}>
                    Location: {verification.location.city}, {verification.location.state}
                  </Text>
                  <Text style={styles.submissionDate}>
                    Fee: ₦{verification.location.cityRegionFee?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeFilter) }]}>
                  <Text style={styles.statusText}>
                    {activeFilter === 'pending' ? 'PENDING VERIFICATION' : 
                     activeFilter === 'rejected' ? 'REJECTED' : 'VERIFIED'}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDetails}>
                <Text style={styles.sectionTitle}>Location Details</Text>
                <Text style={styles.locationText}>
                  {verification.location.houseNumber} {verification.location.street}
                </Text>
                <Text style={styles.locationText}>
                  {verification.location.cityRegion}, {verification.location.lga}
                </Text>
                {verification.location.landmark && (
                  <Text style={styles.locationText}>Near: {verification.location.landmark}</Text>
                )}
              </View>

              <View style={styles.actionButtons}>
                {activeFilter === 'pending' ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => approveVerification(verification.profileId, verification.locationIndex)}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => openRejectModal(verification)}
                    >
                      <Ionicons name="close" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                ) : activeFilter === 'rejected' ? (
                  verification.location.emailSent ? (
                    <View style={[styles.actionButton, styles.emailSentButton]}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.emailSentText}>Email sent on {new Date(verification.location.emailSentAt).toLocaleDateString()}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.emailButton]}
                      onPress={() => sendRejectionEmail(verification.profileId, verification.locationIndex)}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="mail" size={20} color="#FFFFFF" />
                      )}
                      <Text style={styles.actionButtonText}>Send Email</Text>
                    </TouchableOpacity>
                  )
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#7C3AED" />
            <Text style={styles.emptyTitle}>No {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Verifications</Text>
            <Text style={styles.emptyText}>No {activeFilter} location verification requests found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Verification</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this verification request:
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedVerification(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectConfirmButton} onPress={rejectVerification}>
                <Text style={styles.rejectConfirmButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  organizationInfo: {
    flex: 1,
  },
  businessType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  organizationId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 3,
  },
  submissionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationDetails: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  moreLocations: {
    fontSize: 14,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#7C3AED',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  emailButton: {
    backgroundColor: '#3B82F6',
  },
  emailSentButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  emailSentText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
  },
  rejectConfirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    marginLeft: 10,
  },
  rejectConfirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default VerificationManagementScreen;