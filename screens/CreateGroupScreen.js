import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const CreateGroupScreen = ({ navigation, route }) => {
  const { editMode = false, group: existingGroup } = route.params || {};
  const [groupData, setGroupData] = useState({
    name: existingGroup?.name || '',
    description: existingGroup?.description || '',
    memberIds: existingGroup?.memberIds || []
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchUsers();
      fetchRoles();
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

  const fetchUsers = async () => {
    try {
      // Always use admin users endpoint since org endpoints return 403/501
      const response = await ApiService.getUsers();

      if (response.success) {
        const users = response.data.users || [];
        
        // Fetch role names for users with roleId
        const usersWithRoles = await Promise.all(
          users.map(async (user) => {
            try {
              if (user.roleId) {
                const roleResponse = await ApiService.getRoleById(user.roleId);
                if (roleResponse.success) {
                  return {
                    ...user,
                    roleName: roleResponse.data.role.name,
                    displayRole: roleResponse.data.role.name
                  };
                }
              }
              return {
                ...user,
                roleName: user.role === 'ORGANIZATION' ? 'Organization Admin' : user.role,
                displayRole: user.role === 'ORGANIZATION' ? 'Organization Admin' : user.role
              };
            } catch (error) {
              return {
                ...user,
                roleName: user.role || 'No Role',
                displayRole: user.role || 'No Role'
              };
            }
          })
        );
        
        setAvailableUsers(usersWithRoles);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await ApiService.getRoles(1, 100);
      if (response.success) {
        const roleNames = (response.data.roles || []).map(role => role.name);
        setAvailableRoles(['ORGANIZATION', 'CUSTOMER', ...roleNames]);
      }
    } catch (error) {
      console.log('Error fetching roles:', error);
      setAvailableRoles(['ORGANIZATION', 'CUSTOMER']);
    }
  };

  const toggleSelectAll = () => {
    const filteredUserIds = filteredUsers.map(user => user.id || user._id);
    const allSelected = filteredUserIds.every(id => groupData.memberIds.includes(id));
    
    setGroupData(prev => ({
      ...prev,
      memberIds: allSelected 
        ? prev.memberIds.filter(id => !filteredUserIds.includes(id))
        : [...new Set([...prev.memberIds, ...filteredUserIds])]
    }));
  };

  const toggleUserSelection = (userId) => {
    setGroupData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.displayRole === roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const uniqueRoles = availableRoles.length > 0 ? availableRoles : [...new Set(availableUsers.map(user => user.role).filter(Boolean))];

  const handleCreateGroup = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!groupData.description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    setLoading(true);
    try {
      if (editMode) {
        // Update group basic info first
        const updateResponse = await ApiService.updateGroup(existingGroup.id || existingGroup._id, {
          name: groupData.name,
          description: groupData.description
        });
        
        if (!updateResponse.success) {
          Alert.alert('Error', updateResponse.message || 'Failed to update group');
          return;
        }
        
        // Handle member changes
        const existingMemberIds = existingGroup.memberIds || [];
        const newMemberIds = groupData.memberIds;
        
        const membersToAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));
        const membersToRemove = existingMemberIds.filter(id => !newMemberIds.includes(id));
        
        // Add new members
        if (membersToAdd.length > 0) {
          const addResponse = await ApiService.manageGroupMembers(
            existingGroup.id || existingGroup._id, 
            'add', 
            membersToAdd
          );
          
          if (!addResponse.success) {
            Alert.alert('Warning', 'Group updated but failed to add some members');
          }
        }
        
        // Remove members
        if (membersToRemove.length > 0) {
          const removeResponse = await ApiService.manageGroupMembers(
            existingGroup.id || existingGroup._id, 
            'remove', 
            membersToRemove
          );
          
          if (!removeResponse.success) {
            Alert.alert('Warning', 'Group updated but failed to remove some members');
          }
        }
        
        Alert.alert('Success', 'Group updated successfully', [
          { text: 'OK', onPress: () => {
            navigation.navigate('Groups', { refresh: true });
          }}
        ]);
      } else {
        // Create new group
        const response = await ApiService.createGroup(groupData);
        
        if (response.success) {
          Alert.alert('Success', 'Group created successfully', [
            { text: 'OK', onPress: () => {
              navigation.navigate('Groups', { refresh: true });
            }}
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to create group');
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${editMode ? 'update' : 'create'} group`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editMode ? 'Edit Group' : 'Create Group'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={groupData.name}
              onChangeText={(text) => setGroupData({...groupData, name: text})}
              placeholder="Enter group name (e.g., Marketing Team)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={groupData.description}
              onChangeText={(text) => setGroupData({...groupData, description: text})}
              placeholder="Describe the purpose of this group"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <View style={styles.selectAllContainer}>
            <Text style={styles.sectionSubtitle}>
              Select users to add to this group ({groupData.memberIds.length} selected)
            </Text>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Text style={styles.selectAllText}>
                {filteredUsers.length > 0 && filteredUsers.every(user => groupData.memberIds.includes(user.id || user._id)) ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['all', 'active', 'pending', 'inactive'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterChip,
                        statusFilter === status && styles.filterChipActive
                      ]}
                      onPress={() => setStatusFilter(status)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        statusFilter === status && styles.filterChipTextActive
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Role:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      roleFilter === 'all' && styles.filterChipActive
                    ]}
                    onPress={() => setRoleFilter('all')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      roleFilter === 'all' && styles.filterChipTextActive
                    ]}>
                      All Roles
                    </Text>
                  </TouchableOpacity>
                  {uniqueRoles.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.filterChip,
                        roleFilter === role && styles.filterChipActive
                      ]}
                      onPress={() => setRoleFilter(role)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        roleFilter === role && styles.filterChipTextActive
                      ]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredUsers.length} of {availableUsers.length} users
            </Text>
            {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all') && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
              >
                <Text style={styles.clearFilters}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingUsers ? (
            <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users match your filters</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id || user._id}
                style={styles.userItem}
                onPress={() => toggleUserSelection(user.id || user._id)}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <Text style={styles.userRole}>{user.displayRole || user.role || 'No Role'}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: user.status === 'active' ? '#ECFDF5' : user.status === 'pending' ? '#FEF3C7' : '#FEF2F2' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: user.status === 'active' ? '#10B981' : user.status === 'pending' ? '#F59E0B' : '#EF4444' }
                        ]}>
                          {user.status || 'inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={[
                  styles.checkbox,
                  groupData.memberIds.includes(user.id || user._id) && styles.checkboxChecked
                ]}>
                  {groupData.memberIds.includes(user.id || user._id) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Group' : 'Create Group')}
          </Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
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
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  clearFilters: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#7C3AED',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});

export default CreateGroupScreen;