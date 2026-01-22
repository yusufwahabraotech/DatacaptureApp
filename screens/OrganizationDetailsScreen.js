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

const OrganizationDetailsScreen = ({ navigation, route }) => {
  const { organizationData } = route.params;
  const [loading, setLoading] = useState(false);

  const updateOrganizationStatus = async (newStatus) => {
    try {
      const response = await ApiService.updateSuperAdminOrganizationStatus(organizationData.organizationId, newStatus);
      if (response.success) {
        Alert.alert('Success', `Organization ${newStatus} successfully`);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update organization status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!organizationData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Organization not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Organization Info */}
        <View style={styles.section}>
          <View style={styles.orgHeader}>
            <View style={styles.orgAvatar}>
              <Text style={styles.orgAvatarText}>
                {organizationData.organizationName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{organizationData.organizationName}</Text>
              <Text style={styles.orgEmail}>{organizationData.email}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: organizationData.status === 'active' ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusBadgeText}>{organizationData.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrator</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{organizationData.fullName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{organizationData.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{organizationData.phoneNumber || 'Not specified'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text style={styles.detailValue}>{organizationData.role}</Text>
          </View>
        </View>

        {/* Organization Stats */}
        {organizationData.organizationStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{organizationData.organizationStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{organizationData.organizationStats.activeUsers}</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{organizationData.organizationStats.pendingUsers}</Text>
                <Text style={styles.statLabel}>Pending Users</Text>
              </View>
            </View>
          </View>
        )}

        {/* Company Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Organization ID</Text>
            <Text style={styles.detailValue}>{organizationData.organizationId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Custom ID Prefix</Text>
            <Text style={styles.detailValue}>{organizationData.organizationDetails?.customIdPrefix}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>User Counter</Text>
            <Text style={styles.detailValue}>{organizationData.organizationDetails?.userCounter}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Country</Text>
            <Text style={styles.detailValue}>{organizationData.country}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Verified</Text>
            <Text style={[styles.detailValue, { color: organizationData.isVerified ? '#10B981' : '#EF4444' }]}>
              {organizationData.isVerified ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Company Created</Text>
            <Text style={styles.detailValue}>{formatDate(organizationData.organizationDetails?.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Admin Joined</Text>
            <Text style={styles.detailValue}>{formatDate(organizationData.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{formatDate(organizationData.organizationDetails?.updatedAt)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            {organizationData.status === 'active' ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => updateOrganizationStatus('suspended')}
              >
                <Ionicons name="pause-circle-outline" size={20} color="white" />
                <Text style={styles.suspendButtonText}>Suspend Organization</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.activateButton]}
                onPress={() => updateOrganizationStatus('active')}
              >
                <Ionicons name="play-circle-outline" size={20} color="white" />
                <Text style={styles.activateButtonText}>Activate Organization</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orgAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  orgEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  suspendButton: {
    backgroundColor: '#EF4444',
  },
  suspendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  activateButton: {
    backgroundColor: '#10B981',
  },
  activateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
    textAlign: 'center',
  },
});

export default OrganizationDetailsScreen;