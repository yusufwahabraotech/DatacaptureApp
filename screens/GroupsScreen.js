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
import ApiService from '../services/api';

const GroupsScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [showMemberFilters, setShowMemberFilters] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [showGroupFilters, setShowGroupFilters] = useState(false);
  const [groupStatusFilter, setGroupStatusFilter] = useState('all');
  const [groupDateFilter, setGroupDateFilter] = useState('all');

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchGroups();
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

  const fetchGroupMembers = async (group) => {
    setLoadingMembers(true);
    try {
      // Use getGroupById which calls GET /api/admin/groups/{groupId}
      const response = await ApiService.getGroupById(group.id || group._id);
      
      console.log('Group details response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const members = response.data.group.members || [];
        console.log('Members with roles:', members);
        setGroupMembers(members);
      } else {
        console.log('Failed to fetch group details:', response.message);
        setGroupMembers([]);
      }
    } catch (error) {
      console.log('Error fetching group details:', error);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchGroups = async () => {
    if (!userProfile) {
      console.log('No user profile available, skipping group fetch');
      return;
    }
    
    try {
      setLoading(true);
      const isOrgAdmin = userProfile?.role === 'ORGANIZATION';
      console.log('Fetching groups for role:', userProfile.role, 'isOrgAdmin:', isOrgAdmin);
      
      const response = isOrgAdmin 
        ? await ApiService.getOrgGroups(1, 50)
        : await ApiService.getGroups(1, 50);
      
      console.log('Groups API response:', response);
      
      if (response.success) {
        const groupsWithMembers = await Promise.all(
          (response.data.groups || []).map(async (group) => {
            try {
              const detailResponse = await ApiService.getGroupById(group.id || group._id);
              if (detailResponse.success) {
                return {
                  ...group,
                  members: detailResponse.data.group.members || [],
                  memberCount: detailResponse.data.group.members?.length || 0
                };
              }
            } catch (error) {
              console.log('Error fetching group details for', group.id, error);
            }
            return { ...group, members: [], memberCount: 0 };
          })
        );
        
        setGroups(groupsWithMembers);
        console.log('Set groups with member counts:', groupsWithMembers.map(g => ({ id: g.id, memberCount: g.memberCount })));
      } else {
        console.log('Groups API failed:', response.message);
      }
    } catch (error) {
      console.log('Error fetching groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to delete group:', groupId);
              
              // Use admin endpoint for all users since that's what the backend supports
              const response = await ApiService.deleteGroup(groupId);
              
              console.log('Delete group response:', response);
              
              if (response.success) {
                Alert.alert('Success', 'Group deleted successfully');
                fetchGroups();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete group');
              }
            } catch (error) {
              console.log('Delete group error:', error);
              Alert.alert('Error', 'Failed to delete group');
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
        <Text style={styles.headerTitle}>Groups Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.groupSearchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.groupSearchInput}
          placeholder="Search groups..."
          value={groupSearchQuery}
          onChangeText={setGroupSearchQuery}
        />
        <TouchableOpacity
          style={styles.groupFilterButton}
          onPress={() => setShowGroupFilters(!showGroupFilters)}
        >
          <Ionicons name="filter" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {showGroupFilters && (
        <View style={styles.groupFiltersContainer}>
          <View style={styles.groupFilterRow}>
            <Text style={styles.groupFilterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'active', 'inactive'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.groupFilterChip,
                    groupStatusFilter === status && styles.groupFilterChipActive
                  ]}
                  onPress={() => setGroupStatusFilter(status)}
                >
                  <Text style={[
                    styles.groupFilterChipText,
                    groupStatusFilter === status && styles.groupFilterChipTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.groupFilterRow}>
            <Text style={styles.groupFilterLabel}>Created:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'quarter', label: 'Last 3 Months' }
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.groupFilterChip,
                    groupDateFilter === key && styles.groupFilterChipActive
                  ]}
                  onPress={() => setGroupDateFilter(key)}
                >
                  <Text style={[
                    styles.groupFilterChipText,
                    groupDateFilter === key && styles.groupFilterChipTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statLabel}>Total Groups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {groups.reduce((sum, group) => sum + (group.members?.length || group.memberCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.groupsList}
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
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No groups created yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first group</Text>
          </View>
        ) : (() => {
          const filteredGroups = groups.filter(group => {
            const matchesSearch = !groupSearchQuery || 
              (group.name?.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
               group.description?.toLowerCase().includes(groupSearchQuery.toLowerCase()));
            
            const matchesStatus = groupStatusFilter === 'all' || 
              (groupStatusFilter === 'active' ? group.isActive !== false : !group.isActive);
            
            const matchesDate = (() => {
              if (groupDateFilter === 'all') return true;
              if (!group.createdAt) return false;
              
              const groupDate = new Date(group.createdAt);
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              
              switch (groupDateFilter) {
                case 'today':
                  return groupDate >= today;
                case 'week':
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return groupDate >= weekAgo;
                case 'month':
                  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  return groupDate >= monthAgo;
                case 'quarter':
                  const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                  return groupDate >= quarterAgo;
                default:
                  return true;
              }
            })();
            
            return matchesSearch && matchesStatus && matchesDate;
          });
          
          return filteredGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No groups match your search</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
            </View>
          ) : (
            filteredGroups.map((group) => (
            <View key={group.id || group._id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                </View>
                <View style={styles.groupActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      setSelectedGroup(group);
                      setShowGroupModal(true);
                      await fetchGroupMembers(group);
                    }}
                  >
                    <Ionicons name="eye" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CreateGroup', { 
                      editMode: true, 
                      groupId: group.id || group._id, 
                      group: group 
                    })}
                  >
                    <Ionicons name="pencil" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteGroup(group.id || group._id, group.name)}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.groupDetails}>
                <View style={styles.memberInfo}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.memberCount}>
                    {group.members?.length || group.memberCount || 0} members
                  </Text>
                </View>
                <Text style={styles.createdDate}>
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            ))
          );
        })()}
      </ScrollView>

      {/* Group Details Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>{selectedGroup?.description}</Text>
            
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Members ({groupMembers.length})</Text>
              
              {/* Search and Filters for Members */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                />
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowMemberFilters(!showMemberFilters)}
                >
                  <Ionicons name="filter" size={16} color="#7C3AED" />
                </TouchableOpacity>
              </View>

              {showMemberFilters && (
                <View style={styles.filtersContainer}>
                  <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Role:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          memberRoleFilter === 'all' && styles.filterChipActive
                        ]}
                        onPress={() => setMemberRoleFilter('all')}
                      >
                        <Text style={[
                          styles.filterChipText,
                          memberRoleFilter === 'all' && styles.filterChipTextActive
                        ]}>
                          All Roles
                        </Text>
                      </TouchableOpacity>
                      {[...new Set(groupMembers.map(m => m.role).filter(Boolean))].map(role => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.filterChip,
                            memberRoleFilter === role && styles.filterChipActive
                          ]}
                          onPress={() => setMemberRoleFilter(role)}
                        >
                          <Text style={[
                            styles.filterChipText,
                            memberRoleFilter === role && styles.filterChipTextActive
                          ]}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
              
              {loadingMembers ? (
                <ActivityIndicator size="small" color="#7C3AED" style={styles.modalLoader} />
              ) : groupMembers.length === 0 ? (
                <Text style={styles.noMembersText}>No members in this group</Text>
              ) : (() => {
                const filteredMembers = groupMembers.filter(member => {
                  const matchesSearch = !memberSearchQuery || 
                    (member.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                     member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase()));
                  
                  const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
                  
                  return matchesSearch && matchesRole;
                });
                
                return filteredMembers.length === 0 ? (
                  <Text style={styles.noMembersText}>No members match your filters</Text>
                ) : (
                  filteredMembers.map((member, index) => (
                    <View key={member.id || index} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.fullName || member.email}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        <Text style={styles.memberRole}>
                          {member.role || 'No Role'}
                        </Text>
                      </View>
                    </View>
                  ))
                );
              })()}
            </View>
          </ScrollView>
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
  groupSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  groupSearchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  groupFilterButton: {
    padding: 8,
  },
  groupFiltersContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  groupFilterRow: {
    marginBottom: 8,
  },
  groupFilterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  groupFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupFilterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  groupFilterChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupFilterChipTextActive: {
    color: '#FFFFFF',
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
  groupsList: {
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
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  groupActions: {
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
  groupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginVertical: 20,
  },
  membersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalLoader: {
    marginVertical: 20,
  },
  noMembersText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
    fontWeight: '500',
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
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    padding: 6,
  },
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 10,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});

export default GroupsScreen;