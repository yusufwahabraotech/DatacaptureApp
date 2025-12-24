import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    permissions: []
  });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [showRoleSection, setShowRoleSection] = useState(false);

  const statusOptions = [
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'disabled', label: 'Disabled', color: '#EF4444' },
    { key: 'archived', label: 'Archived', color: '#6B7280' }
  ];

  // API Endpoints (backed up):
  // GET: https://datacapture-backend.onrender.com/api/admin/users/status/${selectedStatus}
  // POST: https://datacapture-backend.onrender.com/api/admin/users
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}/status

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, [selectedStatus]);

  const fetchPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://datacapture-backend.onrender.com/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAvailablePermissions(data.data.permissions);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    }
  };

  const fetchUsers = async () => {
    setStatusLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/status/${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    } finally {
      setLoading(false);
      setStatusLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({...newUser, password});
  };

  const createUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://datacapture-backend.onrender.com/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (data.success) {
        // Store password locally for viewing in UserDetails
        const finalPassword = newUser.password || data.data.generatedPassword;
        const userPasswords = await AsyncStorage.getItem('userPasswords') || '{}';
        const passwordsObj = JSON.parse(userPasswords);
        passwordsObj[data.data.id || data.data.customUserId] = finalPassword;
        await AsyncStorage.setItem('userPasswords', JSON.stringify(passwordsObj));
        
        Alert.alert('Success', `User created successfully!\nCustom ID: ${data.data.customUserId}${data.data.generatedPassword ? `\nPassword: ${data.data.generatedPassword}` : ''}`);
        setShowCreateModal(false);
        setNewUser({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', permissions: [] });
        setShowRoleSection(false);
        fetchUsers();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.customUserId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Status Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statusFilter}
          contentContainerStyle={styles.statusFilterContent}
        >
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.statusButton,
                selectedStatus === status.key && { backgroundColor: status.color }
              ]}
              onPress={() => setSelectedStatus(status.key)}
              disabled={statusLoading}
            >
              {statusLoading && selectedStatus === status.key ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[
                  styles.statusButtonText,
                  selectedStatus === status.key && { color: 'white' }
                ]}>
                  {status.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Users List */}
        <View style={styles.usersContainer}>
          {loading || statusLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phoneNumber && <Text style={styles.userPhone}>{user.phoneNumber}</Text>}
                    <Text style={styles.userCustomId}>ID: {user.customUserId}</Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <View style={[styles.statusBadge, { backgroundColor: statusOptions.find(s => s.key === user.status)?.color }]}>
                    <Text style={styles.statusBadgeText}>{user.status}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('UserDetails', { 
                      user: {
                        ...user,
                        storedPassword: null // Will be fetched in UserDetails screen
                      }
                    })}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.firstName}
                  onChangeText={(text) => setNewUser({...newUser, firstName: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.lastName}
                  onChangeText={(text) => setNewUser({...newUser, lastName: text})}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({...newUser, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.phoneNumber}
                  onChangeText={(text) => setNewUser({...newUser, phoneNumber: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newUser.password}
                    onChangeText={(text) => setNewUser({...newUser, password: text})}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.roleHeader}>
                  <Text style={styles.inputLabel}>Assign Role</Text>
                  <Text style={styles.optionalText}>(Optional)</Text>
                </View>
                <Text style={styles.roleDescription}>You can assign permissions now or skip and set them later</Text>
                <TouchableOpacity 
                  style={styles.toggleRoleButton}
                  onPress={() => setShowRoleSection(!showRoleSection)}
                >
                  <Text style={styles.toggleRoleText}>
                    {showRoleSection ? 'Hide Role Assignment' : 'Show Role Assignment'}
                  </Text>
                  <Ionicons 
                    name={showRoleSection ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#7C3AED" 
                  />
                </TouchableOpacity>
                
                {showRoleSection && (
                  <View style={styles.permissionsContainer}>
                    <Text style={styles.permissionsTitle}>Select Permissions:</Text>
                    <ScrollView style={styles.permissionsList} nestedScrollEnabled>
                      {availablePermissions.map((permission, index) => (
                        <TouchableOpacity
                          key={permission.id || `permission-${index}`}
                          style={styles.permissionItem}
                          onPress={() => {
                            const permissionId = permission.id || index;
                            const isSelected = newUser.permissions.includes(permissionId);
                            const updatedPermissions = isSelected
                              ? newUser.permissions.filter(p => p !== permissionId)
                              : [...newUser.permissions, permissionId];
                            setNewUser({...newUser, permissions: updatedPermissions});
                          }}
                        >
                          <View style={styles.permissionInfo}>
                            <Text style={styles.permissionName}>{permission.name}</Text>
                            <Text style={styles.permissionDescription}>{permission.description}</Text>
                          </View>
                          <View style={[
                            styles.checkbox,
                            newUser.permissions.includes(permission.id || index) && styles.checkboxActive
                          ]}>
                            {newUser.permissions.includes(permission.id || index) && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, createLoading && styles.createButtonDisabled]}
                onPress={createUser}
                disabled={createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  mainContent: {
    flex: 1,
  },
  statusFilter: {
    marginBottom: 16,
  },
  statusFilterContent: {
    paddingHorizontal: 20,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  usersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  userPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  userCustomId: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  actionButton: {
    padding: 4,
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
  inputGroup: {
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  eyeButton: {
    padding: 12,
    marginRight: 8,
  },
  generateButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionalText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  toggleRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleRoleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginRight: 8,
  },
  permissionsContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  permissionsList: {
    maxHeight: 200,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modalActions: {
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
});

export default UserManagementScreen;