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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const RolesScreen = ({ navigation, route }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchRoles();
    }
  }, [userProfile]);

  useEffect(() => {
    if (route.params?.refresh && userProfile) {
      fetchRoles();
    }
  }, [route.params?.refresh, userProfile]);

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

  const fetchRoleDetails = async (role) => {
    setLoadingUsers(true);
    try {
      console.log('=== FETCHING ROLE DETAILS ===');
      console.log('Role object:', JSON.stringify(role, null, 2));
      console.log('Role ID:', role.id || role._id);
      console.log('Role _id:', role._id);
      console.log('Role id:', role.id);
      console.log('Role name:', role.name);
      
      // Try both IDs to see which one returns assigned users
      const roleId = role._id; // Use _id first since that's what the assignment uses
      console.log('Using role ID for fetch:', roleId);
      
      const response = await ApiService.getRoleById(roleId);
      console.log('Role details response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const roleData = response.data.role;
        console.log('Role data keys:', Object.keys(roleData));
        console.log('Role assignedUsers:', roleData.assignedUsers?.length || 0);
        console.log('Role userCount:', roleData.userCount);
        
        setSelectedRole({
          ...role,
          permissions: roleData.permissions || [],
          assignedUsers: roleData.assignedUsers || [],
          userCount: roleData.userCount || 0
        });
        setAssignedUsers(roleData.assignedUsers || []);
        console.log('Final assigned users count:', roleData.assignedUsers?.length || 0);
      }
    } catch (error) {
      console.log('Error fetching role details:', error);
      setAssignedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // All users should use getRoles() which has proper role-based routing
      const response = await ApiService.getRoles(1, 50);
      
      if (response.success) {
        const basicRoles = response.data.roles || [];
        console.log('=== FETCHING DETAILED ROLE INFO ===');
        
        // Fetch detailed info for each role to get user counts
        const rolesWithUserCounts = await Promise.all(
          basicRoles.map(async (role) => {
            try {
              const detailResponse = await ApiService.getRoleById(role._id || role.id);
              if (detailResponse.success) {
                const detailedRole = detailResponse.data.role;
                return {
                  ...role,
                  userCount: detailedRole.userCount || 0,
                  assignedUsers: detailedRole.assignedUsers || []
                };
              }
              return role;
            } catch (error) {
              console.log(`Error fetching details for role ${role.name}:`, error);
              return role;
            }
          })
        );
        
        setRoles(rolesWithUserCounts);
      }
    } catch (error) {
      console.log('Error fetching roles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
  };

  const handleDeleteRole = async (roleId, roleName) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${roleName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use the unified deleteRole method which has proper role-based routing
              const response = await ApiService.deleteRole(roleId);
              
              if (response.success) {
                Alert.alert('Success', 'Role deleted successfully');
                fetchRoles();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete role');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete role');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roles Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateRole')}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search for Roles */}
      <View style={styles.roleSearchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.roleSearchInput}
          placeholder="Search roles..."
          value={roleSearchQuery}
          onChangeText={setRoleSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{roles.length}</Text>
          <Text style={styles.statLabel}>Total Roles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{roles.filter(r => r.isActive).length}</Text>
          <Text style={styles.statLabel}>Active Roles</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.rolesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : roles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No roles created yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first role</Text>
          </View>
        ) : (() => {
          const filteredRoles = roles.filter(role => {
            const matchesSearch = !roleSearchQuery || 
              (role.name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
               role.description?.toLowerCase().includes(roleSearchQuery.toLowerCase()));
            return matchesSearch;
          });
          
          return filteredRoles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No roles match your search</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
            </View>
          ) : (
            filteredRoles.map((role) => (
            <View key={role.id || role._id} style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>{role.name}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
                <View style={styles.roleActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      setShowRoleModal(true);
                      await fetchRoleDetails(role);
                    }}
                  >
                    <Ionicons name="eye" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CreateRole', { 
                      editMode: true, 
                      roleId: role.id || role._id, 
                      role: role 
                    })}
                  >
                    <Ionicons name="pencil" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteRole(role.id || role._id, role.name)}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.roleDetails}>
                <Text style={styles.permissionCount}>
                  {(role.permissions?.length || 0) + ' permissions • ' + (role.userCount || role.assignedUsers?.length || 0) + ' users assigned'}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            ))
          );
        })()}
      </ScrollView>

      {/* Role Details Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRole?.name}</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.roleDetailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedRole?.description}</Text>
              </View>

              <View style={styles.roleDetailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[
                  styles.statusBadgeModal,
                  { backgroundColor: selectedRole?.isActive ? '#ECFDF5' : '#FEF2F2' }
                ]}>
                  <Text style={[
                    styles.statusTextModal,
                    { color: selectedRole?.isActive ? '#10B981' : '#EF4444' }
                  ]}>
                    {selectedRole?.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.roleDetailSection}>
                <Text style={styles.detailLabel}>Permissions ({selectedRole?.permissions?.length || 0})</Text>
                {selectedRole?.permissions?.length > 0 ? (
                  selectedRole.permissions.map((permissionKey, index) => (
                    <View key={index} style={styles.permissionDetailItem}>
                      <View style={styles.permissionIcon}>
                        <Ionicons name="shield-checkmark" size={16} color="#7C3AED" />
                      </View>
                      <View style={styles.permissionDetailInfo}>
                        <Text style={styles.permissionDetailName}>{permissionKey}</Text>
                        <Text style={styles.permissionDetailDescription}>Permission granted</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noPermissions}>
                    <Ionicons name="shield-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.noPermissionsText}>No permissions assigned</Text>
                  </View>
                )}
              </View>
              <View style={styles.roleDetailSection}>
                <Text style={styles.detailLabel}>Assigned Users ({assignedUsers.length})</Text>
                {loadingUsers ? (
                  <ActivityIndicator size="small" color="#7C3AED" style={styles.modalLoader} />
                ) : assignedUsers.length > 0 ? (
                  assignedUsers.map((user, index) => (
                    <View key={user.id || user._id || index} style={styles.userItem}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.fullName || user.email}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noUsers}>
                    <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.noUsersText}>No users assigned to this role</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  rolesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  roleCard: {
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
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionCount: {
    fontSize: 12,
    color: '#7C3AED',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  roleDetailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusBadgeModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusTextModal: {
    fontSize: 12,
    fontWeight: '500',
  },
  permissionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionIcon: {
    marginRight: 12,
  },
  permissionDetailInfo: {
    flex: 1,
  },
  permissionDetailName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  permissionDetailDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noPermissions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPermissionsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalLoader: {
    marginVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noUsers: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noUsersText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  roleSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  roleSearchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
});

export default RolesScreen;