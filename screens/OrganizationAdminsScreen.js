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

const OrganizationAdminsScreen = ({ navigation, route }) => {
  const { orgId, orgName } = route.params;
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrganizationAdmins();
  }, []);

  const fetchOrganizationAdmins = async () => {
    try {
      const response = await ApiService.getOrganizationUsers(orgId, { page: 1, limit: 100 });
      if (response.success) {
        // Filter only admins (ORGANIZATION or ADMIN roles)
        const adminUsers = response.data.users.filter(user => 
          user.role === 'ORGANIZATION' || user.role === 'ADMIN'
        );
        setAdmins(adminUsers);
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
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Organization Admins</Text>
          <Text style={styles.headerSubtitle}>{orgName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search admins..."
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
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No admins found</Text>
            <Text style={styles.emptyStateSubtext}>This organization has no admin users</Text>
          </View>
        ) : (
          filteredAdmins.map((admin) => (
            <View key={admin.id} style={styles.adminCard}>
              <View style={styles.adminInfo}>
                <View style={styles.adminAvatar}>
                  <Text style={styles.adminAvatarText}>
                    {admin.fullName?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
                <View style={styles.adminDetails}>
                  <Text style={styles.adminName}>{admin.fullName}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                  <View style={styles.adminMeta}>
                    <View style={[
                      styles.roleBadge,
                      { backgroundColor: admin.role === 'ORGANIZATION' ? '#7C3AED' : '#10B981' }
                    ]}>
                      <Text style={styles.roleBadgeText}>{admin.role}</Text>
                    </View>
                    <Text style={styles.adminDate}>Joined: {formatDate(admin.createdAt)}</Text>
                  </View>
                  {admin.phoneNumber && (
                    <Text style={styles.adminPhone}>📞 {admin.phoneNumber}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.adminActions}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => resetAdminPassword(admin.id)}
                >
                  <Ionicons name="key-outline" size={16} color="white" />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerSpacer: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 20,
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
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
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  adminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  adminDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  adminPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  adminActions: {
    alignItems: 'flex-start',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default OrganizationAdminsScreen;