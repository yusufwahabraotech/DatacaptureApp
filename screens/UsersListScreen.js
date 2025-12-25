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

const UsersListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUserProfile();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchUsers();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const isOrganizationAdmin = () => {
    return userProfile?.role === 'ORGANIZATION';
  };

  const fetchPermissions = async () => {
    try {
      const response = await ApiService.getMyPermissions();
      if (response.success) {
        setPermissions(response.data.permissions || []);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    }
  };

  const hasPermission = (permissionKey) => {
    return permissions.some(p => p.key === permissionKey || p === permissionKey);
  };

  const fetchUsers = async () => {
    try {
      // Wait for userProfile to be loaded first
      if (!userProfile) {
        return;
      }
      
      const response = isOrganizationAdmin() 
        ? await ApiService.getUsers()
        : await ApiService.getOrgUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'archived': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'active': return '#ECFDF5';
      case 'pending': return '#FFFBEB';
      case 'archived': return '#F9FAFB';
      default: return '#F9FAFB';
    }
  };

  const filteredUsers = users.filter(user => {
    const name = (user.fullName || user.email || '').toLowerCase();
    const matchesSearch = name.includes((searchQuery || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const response = isOrganizationAdmin()
        ? await ApiService.updateUserStatus(userId, newStatus)
        : await ApiService.updateOrgUserStatus(userId, newStatus);
      if (response.success) {
        Alert.alert('Success', 'User status updated successfully');
        fetchUsers();
      } else {
        Alert.alert('Error', response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.log('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const showUserActions = (user) => {
    const actions = [];
    const isOrgAdmin = isOrganizationAdmin();
    
    // View Details - always available
    actions.push({ text: 'View Details', onPress: () => navigation.navigate('UserDetails', { user }) });
    
    // Edit User
    if (isOrgAdmin || hasPermission('edit_users')) {
      actions.push({ text: 'Edit User', onPress: () => navigation.navigate('EditUser', { user }) });
    }
    
    // Status Management
    if (isOrgAdmin || hasPermission('manage_user_status')) {
      if (user.status === 'active') {
        actions.push({ text: 'Set to Pending', onPress: () => updateUserStatus(user._id || user.id, 'pending') });
        actions.push({ text: 'Archive User', onPress: () => updateUserStatus(user._id || user.id, 'archived') });
      } else if (user.status === 'pending') {
        actions.push({ text: 'Activate User', onPress: () => updateUserStatus(user._id || user.id, 'active') });
        actions.push({ text: 'Archive User', onPress: () => updateUserStatus(user._id || user.id, 'archived') });
      } else if (user.status === 'archived') {
        actions.push({ text: 'Activate User', onPress: () => updateUserStatus(user._id || user.id, 'active') });
      } else {
        actions.push({ text: 'Activate User', onPress: () => updateUserStatus(user._id || user.id, 'active') });
      }
    }
    
    // Password Management
    if (isOrgAdmin || hasPermission('edit_users')) {
      actions.push({ text: 'Reset Password', onPress: () => navigation.navigate('UserDetails', { user, action: 'resetPassword' }) });
    }
    
    // Send Email
    if (isOrgAdmin || hasPermission('send_emails')) {
      actions.push({ text: 'Send Login Credentials', onPress: () => navigation.navigate('UserDetails', { user, action: 'sendEmail' }) });
    }
    
    // Manage Permissions
    if (isOrgAdmin || hasPermission('manage_permissions')) {
      actions.push({ text: 'Manage Permissions', onPress: () => navigation.navigate('UserPermissions', { user }) });
    }
    
    // Delete User
    if (isOrgAdmin || hasPermission('delete_users')) {
      actions.push({ text: 'Delete User', style: 'destructive', onPress: () => confirmDeleteUser(user) });
    }
    
    actions.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert('User Actions', `Select an action for ${user.fullName}`, actions);
  };

  const confirmDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUser(user._id || user.id) }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const response = isOrganizationAdmin()
        ? await ApiService.deleteUser(userId)
        : await ApiService.deleteOrgUser(userId);
      if (response.success) {
        Alert.alert('Success', 'User deleted successfully');
        fetchUsers();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.log('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Users</Text>
        {hasPermission('create_users') && (
          <TouchableOpacity onPress={() => navigation.navigate('CreateUser')}>
            <Ionicons name="add" size={24} color="#7C3AED" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'pending', 'archived'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive
              ]}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.filter(u => u.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.filter(u => u.status === 'archived').length}</Text>
          <Text style={styles.statLabel}>Archived</Text>
        </View>
      </View>

      {/* Users List */}
      <ScrollView style={styles.usersList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'No users available'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user._id || user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.fullName || 'Unknown'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userRole}>{user.role}</Text>
                  </View>
                </View>
                <View style={styles.userMeta}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(user.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(user.status) }
                    ]}>
                      {user.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                  <Text style={styles.joinDate}>
                    Joined {formatDate(user.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{user.measurementCount || 0}</Text>
                  <Text style={styles.statItemLabel}>Measurements</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{user.questionnaireCount || 0}</Text>
                  <Text style={styles.statItemLabel}>Questionnaires</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{user.isVerified ? 'Yes' : 'No'}</Text>
                  <Text style={styles.statItemLabel}>Verified</Text>
                </View>
                {(hasPermission('edit_users') || hasPermission('manage_user_status') || hasPermission('manage_permissions')) && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => showUserActions(user)}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color="#7C3AED" />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
});

export default UsersListScreen;