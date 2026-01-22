import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const CompanyDetailsScreen = ({ navigation, route }) => {
  const { adminId, companyName } = route.params;
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const response = await ApiService.getSuperAdminOrganizationAdmins({ page: 1, limit: 100 });
      if (response.success) {
        const admin = response.data.admins.find(a => a.id === adminId);
        setCompanyData(admin);
      }
    } catch (error) {
      console.log('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading company details...</Text>
      </View>
    );
  }

  if (!companyData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="business-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>Company details not found</Text>
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
        <Text style={styles.headerTitle}>Company Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Company Header */}
        <View style={styles.section}>
          <View style={styles.companyHeader}>
            <View style={styles.companyAvatar}>
              <Text style={styles.companyAvatarText}>
                {companyName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.companyId}>ID: {companyData.organizationDetails?.customIdPrefix}</Text>
              <Text style={styles.companyCountry}>{companyData.country}</Text>
            </View>
          </View>
        </View>

        {/* Admin Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrator</Text>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>
                {companyData.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{companyData.fullName}</Text>
              <Text style={styles.adminEmail}>{companyData.email}</Text>
              <Text style={styles.adminPhone}>{companyData.phoneNumber}</Text>
              <View style={styles.adminBadges}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{companyData.role}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: companyData.status === 'active' ? '#10B981' : '#EF4444' }
                ]}>
                  <Text style={styles.statusBadgeText}>{companyData.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Company Statistics */}
        {companyData.organizationStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{companyData.organizationStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {companyData.organizationStats.activeUsers}
                </Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {companyData.organizationStats.pendingUsers}
                </Text>
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
            <Text style={styles.detailValue}>{companyData.organizationId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Custom ID Prefix</Text>
            <Text style={styles.detailValue}>{companyData.organizationDetails?.customIdPrefix}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>User Counter</Text>
            <Text style={styles.detailValue}>{companyData.organizationDetails?.userCounter}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Country</Text>
            <Text style={styles.detailValue}>{companyData.country}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Verified</Text>
            <Text style={[styles.detailValue, { color: companyData.isVerified ? '#10B981' : '#EF4444' }]}>
              {companyData.isVerified ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Company Created</Text>
            <Text style={styles.detailValue}>
              {formatDate(companyData.organizationDetails?.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Admin Joined</Text>
            <Text style={styles.detailValue}>{formatDate(companyData.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {formatDate(companyData.organizationDetails?.updatedAt)}
            </Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  companyId: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 4,
  },
  companyCountry: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  adminEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adminPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adminBadges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
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
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'right',
  },
});

export default CompanyDetailsScreen;