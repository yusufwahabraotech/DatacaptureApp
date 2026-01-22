import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SuperAdminOrganizationAdminsScreen = ({ navigation }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrganizationAdmins();
  }, []);

  const fetchOrganizationAdmins = async () => {
    try {
      const response = await ApiService.getSuperAdminOrganizationAdmins({ page: 1, limit: 100 });
      if (response.success) {
        setAdmins(response.data.admins);
      }
    } catch (error) {
      console.log('Error fetching organization admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAdminPassword = async (userId) => {
    try {
      const response = await ApiService.resetSuperAdminUserPassword(userId, {});
      if (response.success) {
        Alert.alert('Success', `Password reset successfully!\nNew Password: ${response.data.newPassword}`);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>Organization Admins</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search admins or companies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Admins List */}
      <ScrollView style={styles.adminsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : filteredAdmins.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No organization admins found</Text>
          </View>
        ) : (
          filteredAdmins.map((admin) => (
            <View key={admin.id} style={styles.adminCard}>
              <View style={styles.adminHeader}>
                <View style={styles.adminInfo}>
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>
                      {admin.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </Text>
                  </View>
                  <View style={styles.adminDetails}>
                    <Text style={styles.adminName}>{admin.fullName}</Text>
                    <Text style={styles.adminEmail}>{admin.email}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{admin.role}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: admin.status === 'active' ? '#10B981' : '#EF4444' }
                  ]}>
                    <Text style={styles.statusBadgeText}>{admin.status}</Text>
                  </View>
                </View>
              </View>

              {/* Company Details */}
              <View style={styles.companySection}>
                <Text style={styles.sectionTitle}>Company Details</Text>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{admin.organizationName}</Text>
                  <Text style={styles.companyDetail}>ID: {admin.organizationDetails?.customIdPrefix}</Text>
                  <Text style={styles.companyDetail}>Country: {admin.country}</Text>
                  <Text style={styles.companyDetail}>Created: {formatDate(admin.organizationDetails?.createdAt)}</Text>
                </View>
              </View>

              {/* Organization Stats */}
              {admin.organizationStats && (
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Organization Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{admin.organizationStats.totalUsers}</Text>
                      <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{admin.organizationStats.activeUsers}</Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{admin.organizationStats.pendingUsers}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.adminActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={() => Alert.alert(
                    'Company Details',
                    `Company: ${admin.organizationName}\nAdmin: ${admin.fullName}\nEmail: ${admin.email}\nCountry: ${admin.country}\nTotal Users: ${admin.organizationStats?.totalUsers || 'N/A'}`
                  )}
                >
                  <Ionicons name="business-outline" size={16} color="#7C3AED" />
                  <Text style={styles.actionButtonText}>View Company</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={() => resetAdminPassword(admin.id)}
                >
                  <Ionicons name="key-outline" size={16} color="#EF4444" />
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  adminsList: {
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
  adminCard: {
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
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
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
  roleBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  companySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  companyInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 4,
  },
  resetButton: {
    borderColor: '#EF4444',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 4,
  },
});

export default SuperAdminOrganizationAdminsScreen;