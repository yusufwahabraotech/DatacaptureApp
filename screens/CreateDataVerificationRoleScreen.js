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

const CreateDataVerificationRoleScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [organizationAssignments, setOrganizationAssignments] = useState([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, orgsResponse] = await Promise.all([
        ApiService.getDataVerificationAllUsers(),
        ApiService.getDataVerificationOrganizations()
      ]);
      
      if (usersResponse.success) {
        setUsers(usersResponse.data.users);
      }
      if (orgsResponse.success) {
        setOrganizations(orgsResponse.data.organizations);
        console.log('Organizations loaded:', orgsResponse.data.organizations.length);
        console.log('Organizations data:', orgsResponse.data.organizations);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Update organization assignments when users change
      setOrganizationAssignments(prevAssignments => 
        prevAssignments.filter(assignment => newSelection.includes(assignment.userId))
      );
      
      // Close dropdown for deselected users
      if (!newSelection.includes(userId)) {
        setShowOrgDropdown(prev => ({ ...prev, [userId]: false }));
      }
      
      return newSelection;
    });
  };

  const addOrganizationAssignment = (userId, organizationId) => {
    const organization = organizations.find(org => org.id === organizationId);
    if (!organization) return;

    const newAssignment = {
      userId,
      organizationId,
      organizationName: organization.name
    };

    setOrganizationAssignments(prev => {
      // Check if assignment already exists
      const exists = prev.some(a => a.userId === userId && a.organizationId === organizationId);
      if (exists) return prev;
      
      return [...prev, newAssignment];
    });
  };

  const removeOrganizationAssignment = (userId, organizationId) => {
    setOrganizationAssignments(prev => 
      prev.filter(a => !(a.userId === userId && a.organizationId === organizationId))
    );
  };

  const createRole = async () => {
    if (!roleName.trim()) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    setCreating(true);
    try {
      const response = await ApiService.createDataVerificationRole({
        roleName: roleName.trim(),
        description: description.trim(),
        selectedUserIds: selectedUsers,
        assignedOrganizations: organizationAssignments
      });

      if (response.success) {
        Alert.alert('Success', response.message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserAssignments = (userId) => {
    return organizationAssignments.filter(a => a.userId === userId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Verification Role</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Role Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role Name *</Text>
            <TextInput
              style={styles.input}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g., Field Agent Team A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Field agents for Lagos region verification"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* User Selection */}
        <View style={styles.section}>
          <View style={styles.selectionHeader}>
            <Text style={styles.sectionTitle}>Select Users</Text>
            <Text style={styles.selectedCount}>
              {selectedUsers.length} selected
            </Text>
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

          {/* Users List */}
          {loading ? (
            <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
          ) : (
            filteredUsers.map((user, userIndex) => {
              const isSelected = selectedUsers.includes(user.id);
              const userAssignments = getUserAssignments(user.id);
              
              return (
                <View key={`${user.id}-${userIndex}`} style={styles.userCard}>
                  <TouchableOpacity
                    style={styles.userHeader}
                    onPress={() => toggleUserSelection(user.id)}
                  >
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.fullName}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.userOrg}>{user.organizationName}</Text>
                        {user.hasDataVerificationRole && (
                          <Text style={styles.hasRoleText}>Already has verification role</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.checkbox}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Organization Assignment for Selected Users */}
                  {isSelected && (
                    <View style={styles.organizationSection}>
                      <Text style={styles.orgSectionTitle}>Assign Organizations:</Text>
                      
                      {/* Organization Dropdown */}
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setShowOrgDropdown(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                      >
                        <Text style={styles.dropdownButtonText}>Select Organizations</Text>
                        <Ionicons 
                          name={showOrgDropdown[user.id] ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#6B7280" 
                        />
                      </TouchableOpacity>

                      {/* Dropdown List */}
                      {showOrgDropdown[user.id] && (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                          {organizations.filter(org => org.name && org.name.trim()).length === 0 ? (
                            <View style={styles.dropdownItem}>
                              <Text style={styles.dropdownItemText}>No organizations found</Text>
                            </View>
                          ) : (
                            organizations.filter(org => org.name && org.name.trim()).map((org, orgIndex) => {
                              const isAssigned = userAssignments.some(a => a.organizationId === org.id);
                              return (
                                <TouchableOpacity
                                  key={`${org.id}-${user.id}-${orgIndex}`}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    if (isAssigned) {
                                      removeOrganizationAssignment(user.id, org.id);
                                    } else {
                                      addOrganizationAssignment(user.id, org.id);
                                    }
                                  }}
                                >
                                  <View style={styles.dropdownItemContent}>
                                    <Text style={styles.dropdownItemText}>
                                      {org.name}
                                    </Text>
                                    {isAssigned && (
                                      <Ionicons name="checkmark" size={20} color="#10B981" />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </ScrollView>
                      )}
                      
                      {userAssignments.length > 0 && (
                        <View style={styles.selectedOrgsContainer}>
                          <Text style={styles.selectedOrgsTitle}>Selected Organizations:</Text>
                          {userAssignments.map((assignment, assignmentIndex) => (
                            <View key={`${assignment.organizationId}-${user.id}-${assignmentIndex}`} style={styles.selectedOrgItem}>
                              <Text style={styles.selectedOrgText}>{assignment.organizationName}</Text>
                              <TouchableOpacity
                                onPress={() => removeOrganizationAssignment(user.id, assignment.organizationId)}
                              >
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Assignment Summary */}
        {organizationAssignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment Summary</Text>
            <Text style={styles.summaryText}>
              Total Assignments: {organizationAssignments.length}
            </Text>
            {selectedUsers.map((userId, summaryIndex) => {
              const user = users.find(u => u.id === userId);
              const userAssignments = getUserAssignments(userId);
              if (userAssignments.length === 0) return null;
              
              return (
                <View key={`${userId}-summary-${summaryIndex}`} style={styles.summaryItem}>
                  <Text style={styles.summaryUserName}>{user?.fullName}</Text>
                  <Text style={styles.summaryOrgs}>
                    {userAssignments.map(a => a.organizationName).join(', ')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={createRole}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Role & Assign Organizations</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedCount: {
    fontSize: 14,
    color: '#7C3AED',
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
    fontSize: 16,
    color: '#1F2937',
  },
  loader: {
    marginTop: 20,
  },
  userCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userOrg: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  hasRoleText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orgSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  selectedOrgsContainer: {
    marginTop: 8,
  },
  selectedOrgsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedOrgItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  selectedOrgText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryOrgs: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateDataVerificationRoleScreen;