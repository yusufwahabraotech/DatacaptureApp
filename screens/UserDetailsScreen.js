import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserDetailsScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [storedPassword, setStoredPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userStatus, setUserStatus] = useState(user.status);
  const [editUser, setEditUser] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || ''
  });
  const [emailMessage, setEmailMessage] = useState('');
  const [generateNewPassword, setGenerateNewPassword] = useState(true);

  const statusOptions = [
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'disabled', label: 'Disabled', color: '#EF4444' },
    { key: 'archived', label: 'Archived', color: '#6B7280' }
  ];

  // API Endpoints:
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}/password
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}
  // DELETE: https://datacapture-backend.onrender.com/api/admin/users/${userId}
  // POST: https://datacapture-backend.onrender.com/api/admin/users/${userId}/send-email

  useEffect(() => {
    fetchStoredPassword();
  }, []);

  const fetchStoredPassword = async () => {
    try {
      const userPasswords = await AsyncStorage.getItem('userPasswords');
      if (userPasswords) {
        const passwordsObj = JSON.parse(userPasswords);
        const password = passwordsObj[user.id] || passwordsObj[user.customUserId];
        setStoredPassword(password || null);
      }
    } catch (error) {
      console.log('Error fetching stored password:', error);
    } finally {
      setLoading(false);
    }
  };

  const editUserInfo = async () => {
    if (!editUser.firstName || !editUser.lastName || !editUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'User information updated successfully');
        setShowEditModal(false);
        Object.assign(user, editUser, { fullName: `${editUser.firstName} ${editUser.lastName}` });
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update user information');
    } finally {
      setUpdateLoading(false);
    }
  };

  const sendEmail = async () => {
    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          adminMessage: emailMessage,
          generateNewPassword: generateNewPassword
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Store new password locally if generated
        if (data.data.newPassword) {
          const userPasswords = await AsyncStorage.getItem('userPasswords') || '{}';
          const passwordsObj = JSON.parse(userPasswords);
          passwordsObj[user.id || user.customUserId] = data.data.newPassword;
          await AsyncStorage.setItem('userPasswords', JSON.stringify(passwordsObj));
          setStoredPassword(data.data.newPassword);
          
          Alert.alert('Success', `${data.data.message}\nNew password: ${data.data.newPassword}`);
        } else {
          Alert.alert('Success', data.data.message);
        }
        setShowEmailModal(false);
        setEmailMessage('');
        setGenerateNewPassword(true);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setUpdateLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();
      if (data.success) {
        // Update stored password locally
        const userPasswords = await AsyncStorage.getItem('userPasswords') || '{}';
        const passwordsObj = JSON.parse(userPasswords);
        passwordsObj[user.id || user.customUserId] = newPassword;
        await AsyncStorage.setItem('userPasswords', JSON.stringify(passwordsObj));
        
        setStoredPassword(newPassword);
        setShowResetModal(false);
        setNewPassword('');
        Alert.alert('Success', 'Password reset successfully');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setUpdateLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const copyToClipboard = (text) => {
    Alert.alert('Copied', `${text} copied to clipboard`);
  };

  const deleteUser = () => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'User deleted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Avatar & Basic Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.fullName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusOptions.find(s => s.key === userStatus)?.color }]}>
            <Text style={styles.statusText}>{userStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>User Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user.fullName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Name</Text>
            <Text style={styles.infoValue}>{user.firstName || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <Text style={styles.infoValue}>{user.lastName || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Custom ID</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{user.customUserId}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(user.customUserId)}>
                <Ionicons name="copy-outline" size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{user.email}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(user.email)}>
                <Ionicons name="copy-outline" size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>

          {user.phoneNumber ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(user.phoneNumber)}>
                  <Ionicons name="copy-outline" size={16} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>Not provided</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user.role || 'USER'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: statusOptions.find(s => s.key === userStatus)?.color }]}>
              {userStatus.toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.passwordSection}>
          <Text style={styles.sectionTitle}>Password Information</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading password...</Text>
            </View>
          ) : storedPassword ? (
            <View style={styles.passwordContainer}>
              <View style={styles.passwordRow}>
                <Text style={styles.infoLabel}>Password</Text>
                <View style={styles.passwordValueContainer}>
                  <Text style={styles.passwordValue}>
                    {showPassword ? storedPassword : '••••••••••••'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={16} 
                      color="#7C3AED" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => copyToClipboard(storedPassword)}>
                    <Ionicons name="copy-outline" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.passwordNote}>
                This password was set when the user was created
              </Text>
            </View>
          ) : (
            <View style={styles.noPasswordContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
              <Text style={styles.noPasswordText}>No password stored</Text>
              <Text style={styles.noPasswordSubtext}>
                Password information is only available for users created through this app
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserPermissions', { user })}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Manage Permissions</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Edit User</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEmailModal(true)}
          >
            <Ionicons name="mail-outline" size={20} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Send Email</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowResetModal(true)}
          >
            <Ionicons name="key-outline" size={20} color="#F59E0B" />
            <Text style={styles.actionButtonText}>Reset Password</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={deleteUser}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete User</Text>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reset Password Modal */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowResetModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>Enter new password for {user.fullName}</Text>
              
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons 
                    name={showNewPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={generatePassword}
                >
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.resetButton, updateLoading && styles.resetButtonDisabled]}
                onPress={resetPassword}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.firstName}
                  onChangeText={(text) => setEditUser({...editUser, firstName: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.lastName}
                  onChangeText={(text) => setEditUser({...editUser, lastName: text})}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.email}
                  onChangeText={(text) => setEditUser({...editUser, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.phoneNumber}
                  onChangeText={(text) => setEditUser({...editUser, phoneNumber: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, updateLoading && styles.saveButtonDisabled]}
                onPress={editUserInfo}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Email Modal */}
      <Modal visible={showEmailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Email</Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>Send login credentials to {user.fullName}</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setGenerateNewPassword(!generateNewPassword)}
                  >
                    {generateNewPassword ? (
                      <View style={styles.checkedBox}>
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    ) : (
                      <View style={styles.uncheckedBox} />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Generate new password</Text>
                </View>
                <Text style={styles.checkboxNote}>
                  {generateNewPassword 
                    ? "A new password will be generated and sent to the user"
                    : "Email will be sent without password (login instructions only)"
                  }
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Custom Message (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={emailMessage}
                  onChangeText={setEmailMessage}
                  placeholder="Welcome to our organization! Please use these credentials to access your account."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, updateLoading && styles.sendButtonDisabled]}
                onPress={sendEmail}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.sendButtonText}>Send Email</Text>
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  passwordSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  passwordContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  eyeButton: {
    padding: 4,
  },
  passwordNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  noPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noPasswordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 8,
  },
  noPasswordSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
  },
  dangerText: {
    color: '#EF4444',
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
    maxWidth: 400,
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
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  passwordInputContainer: {
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
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  checkedBox: {
    width: 20,
    height: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  checkboxNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default UserDetailsScreen;