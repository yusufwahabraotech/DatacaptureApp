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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const OrganizationProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [businessType, setBusinessType] = useState('registered');
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ApiService.getOrganizationProfile();
      if (response.success) {
        setProfile(response.data);
        checkEligibility();
      } else if (response.message?.includes('not found')) {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const response = await ApiService.checkVerificationEligibility();
      if (response.success) {
        setEligibility(response.data);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // Don't show error to user, just log it
    }
  };

  const createProfile = async () => {
    try {
      const response = await ApiService.createOrganizationProfile({
        businessType,
      });

      if (response.success) {
        setShowCreateModal(false);
        loadProfile();
        Alert.alert('Success', 'Organization profile created successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to create profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile');
    }
  };

  const submitForVerification = async () => {
    Alert.alert(
      'Submit for Verification',
      'Are you sure you want to submit your organization for verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              const response = await ApiService.submitForVerification();
              if (response.success) {
                Alert.alert('Success', 'Submitted for verification successfully');
                loadProfile();
              } else {
                Alert.alert('Error', response.message || 'Failed to submit');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to submit for verification');
            }
          },
        },
      ]
    );
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organization Profile</Text>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={80} color="#7C3AED" />
          <Text style={styles.emptyTitle}>No Organization Profile</Text>
          <Text style={styles.emptyText}>Create your organization profile to get started</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showCreateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Organization Profile</Text>
              <Text style={styles.radioLabel}>Business Type</Text>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setBusinessType('registered')}
              >
                <View style={styles.radioCircle}>
                  {businessType === 'registered' && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioText}>Registered Business</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setBusinessType('unregistered')}
              >
                <View style={styles.radioCircle}>
                  {businessType === 'unregistered' && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioText}>Unregistered Business</Text>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={createProfile}>
                  <Text style={styles.submitButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Ionicons name="business" size={40} color="#7C3AED" />
            <View style={styles.profileInfo}>
              <Text style={styles.businessType}>{profile.businessType}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getVerificationStatusColor(profile.verificationStatus) }]}>
                <Text style={styles.statusText}>{profile.verificationStatus?.toUpperCase() || 'UNVERIFIED'}</Text>
              </View>
            </View>
          </View>
        </View>

        {eligibility && eligibility.currentLimits && eligibility.maxLimits && (
          <View style={styles.limitsCard}>
            <Text style={styles.cardTitle}>Current Limits</Text>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Locations:</Text>
              <Text style={styles.limitValue}>{eligibility.currentLimits.locations || 0} / {eligibility.maxLimits.locations || 'N/A'}</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Images per location:</Text>
              <Text style={styles.limitValue}>{eligibility.maxLimits.imagesPerLocation || 'N/A'}</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Videos per location:</Text>
              <Text style={styles.limitValue}>{eligibility.maxLimits.videosPerLocation || 'N/A'}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('OrganizationLocations')}
          >
            <Ionicons name="location" size={24} color="#7C3AED" />
            <Text style={styles.actionText}>Manage Locations</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {profile.verificationStatus !== 'verified' && profile.verificationStatus !== 'pending' && (
            <TouchableOpacity style={styles.actionButton} onPress={submitForVerification}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.actionText}>Submit for Verification</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {profile.verificationStatus !== 'verified' && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('VerifiedBadgePayment')}
            >
              <Ionicons name="card" size={24} color="#F59E0B" />
              <Text style={styles.actionText}>Get Verified Badge</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  businessType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  limitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  limitLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 15,
    flex: 1,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 50,
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 15,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7C3AED',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
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
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    marginLeft: 10,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default OrganizationProfileScreen;