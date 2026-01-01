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
import * as Clipboard from 'expo-clipboard';
import ApiService from '../services/api';
import { generateMeasurementsPDF, viewPDF } from '../utils/pdfGenerator';

const UserDetailsScreen = ({ navigation, route }) => {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [storedPassword, setStoredPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userStatus, setUserStatus] = useState(initialUser.status);
  const [editUser, setEditUser] = useState({
    firstName: initialUser.firstName || '',
    lastName: initialUser.lastName || '',
    email: initialUser.email || '',
    phoneNumber: initialUser.phoneNumber || ''
  });
  const [emailMessage, setEmailMessage] = useState('');
  const [generateNewPassword, setGenerateNewPassword] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  // Implemented by VScode copilot
  // State for user measurements
  const [measurements, setMeasurements] = useState([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);
  const [measurementsPage, setMeasurementsPage] = useState(1);
  const [hasMoreMeasurements, setHasMoreMeasurements] = useState(false);
  const [pdfGeneratingId, setPdfGeneratingId] = useState(null);

  const statusOptions = [
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'archived', label: 'Archived', color: '#6B7280' }
  ];

  // API Endpoints:
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}/password
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}
  // DELETE: https://datacapture-backend.onrender.com/api/admin/users/${userId}
  // POST: https://datacapture-backend.onrender.com/api/admin/users/${userId}/send-email

  useEffect(() => {
    fetchUserProfile();
    fetchUserDetails();
    fetchStoredPassword();
    fetchUserMeasurements();
  }, []);

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

  const fetchUserDetails = async () => {
    try {
      const response = await ApiService.getUserById(initialUser.id);
      if (response.success && response.data.user) {
        setUser(response.data.user);
        setUserStatus(response.data.user.status);
        setEditUser({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          email: response.data.user.email || '',
          phoneNumber: response.data.user.phoneNumber || ''
        });
      }
    } catch (error) {
      console.log('Error fetching user details:', error);
    }
  };

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

  // Implemented by VScode copilot
  // Fetch measurements for specific user using role-based routing
  const fetchUserMeasurements = async (page = 1) => {
    setMeasurementsLoading(true);
    try {
      console.log(`=== FRONTEND DEBUG: fetchUserMeasurements ===`);
      console.log(`User ID: ${user.id}`);
      console.log(`Custom User ID: ${user.customUserId}`);
      console.log(`Page: ${page}`);
      console.log(`Current measurements count: ${measurements.length}`);

      const response = await ApiService.getUserMeasurements(user.id, page, 20);
      console.log(`API Response:`, {
        success: response?.success,
        measurementsCount: response?.data?.measurements?.length || 0,
        totalCount: response?.data?.total || 0,
        currentPage: response?.data?.currentPage || 0
      });

      if (response && response.success) {
        const newMeasurements = response.data?.measurements || [];
        console.log(`Processing ${newMeasurements.length} measurements`);
        
        if (page === 1) {
          console.log('Replacing measurements (page 1)');
          setMeasurements(newMeasurements);
        } else {
          console.log('Appending measurements (page > 1)');
          setMeasurements(prev => [...prev, ...newMeasurements]);
        }
        
        setMeasurementsPage(page);
        setHasMoreMeasurements(newMeasurements.length === 20);
        console.log(`Final measurements count: ${page === 1 ? newMeasurements.length : measurements.length + newMeasurements.length}`);
      } else {
        console.log('API returned success: false or no response');
        setMeasurements([]);
      }
    } catch (error) {
      console.log('Exception in fetchUserMeasurements:', error);
      setMeasurements([]);
    } finally {
      setMeasurementsLoading(false);
    }
  };

  const editUserInfo = async () => {
    if (!editUser.firstName || !editUser.lastName || !editUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await ApiService.updateOrgUser(user.id, editUser);
      if (response.success) {
        Alert.alert('Success', 'User information updated successfully');
        setShowEditModal(false);
        Object.assign(user, editUser, { fullName: `${editUser.firstName} ${editUser.lastName}` });
      } else {
        Alert.alert('Error', response.message);
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
      const response = await ApiService.sendOrgUserEmail(user.id, {
        adminMessage: emailMessage,
        generateNewPassword: true
      });

      if (response.success) {
        if (response.data.newPassword) {
          const userPasswords = await AsyncStorage.getItem('userPasswords') || '{}';
          const passwordsObj = JSON.parse(userPasswords);
          passwordsObj[user.id || user.customUserId] = response.data.newPassword;
          await AsyncStorage.setItem('userPasswords', JSON.stringify(passwordsObj));
          setStoredPassword(response.data.newPassword);
          
          Alert.alert('Success', `${response.data.message}\nNew password: ${response.data.newPassword}`);
        } else {
          Alert.alert('Success', response.data.message);
        }
        setShowEmailModal(false);
        setEmailMessage('');
        setGenerateNewPassword(true);
      } else {
        Alert.alert('Error', response.message);
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
      const response = await ApiService.resetOrgUserPassword(user.id, { password: newPassword });

      if (response.success) {
        const userPasswords = await AsyncStorage.getItem('userPasswords') || '{}';
        const passwordsObj = JSON.parse(userPasswords);
        passwordsObj[user.id || user.customUserId] = newPassword;
        await AsyncStorage.setItem('userPasswords', JSON.stringify(passwordsObj));
        
        setStoredPassword(newPassword);
        setShowResetModal(false);
        setNewPassword('');
        Alert.alert('Success', 'Password reset successfully');
      } else {
        Alert.alert('Error', response.message);
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

  // Implemented by VScode copilot
  // Fixed copyToClipboard function - Now actually copies text to clipboard using expo-clipboard
  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Success', 'Copied to clipboard');
    } catch (error) {
      console.log('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
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

  const updateUserStatus = async (newStatus) => {
    const actionText = newStatus === 'archived' ? 'archive' : newStatus === 'pending' ? 'set to pending' : newStatus === 'active' ? (userStatus === 'pending' ? 'activate' : 'unarchive') : 'update';
    const actionTitle = actionText.charAt(0).toUpperCase() + actionText.slice(1);
    
    Alert.alert(
      `${actionTitle} User`,
      `Are you sure you want to ${actionText} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: actionTitle, style: newStatus === 'active' ? 'default' : 'destructive', onPress: () => confirmStatusUpdate(newStatus, actionText) }
      ]
    );
  };

  const confirmStatusUpdate = async (newStatus, actionText) => {
    setUpdateLoading(true);
    try {
      const response = await ApiService.updateOrgUserStatus(user._id || user.id, newStatus);
      if (response.success) {
        setUserStatus(newStatus);
        setUser(prev => ({ ...prev, status: newStatus }));
        Alert.alert('Success', `User ${actionText}d successfully`);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${actionText} user`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmDelete = async () => {
    setUpdateLoading(true);
    try {
      const response = await ApiService.deleteUser(user.id);
      if (response.success) {
        Alert.alert('Success', 'User deleted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message);
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
            onPress={() => navigation.navigate('UserPermissions', { 
              userId: user.id || user._id, 
              userName: user.fullName 
            })}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Manage Roles</Text>
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
          
          {(userStatus === 'active' || userStatus === 'pending') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateUserStatus('pending')}
            >
              <Ionicons name="ban-outline" size={20} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Set to Pending</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          
          {userStatus === 'pending' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateUserStatus('active')}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.actionButtonText}>Activate User</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          
          {(userStatus === 'active' || userStatus === 'pending') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateUserStatus('archived')}
            >
              <Ionicons name="archive-outline" size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>Archive User</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          
          {userStatus === 'archived' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateUserStatus('active')}
            >
              <Ionicons name="refresh-outline" size={20} color="#10B981" />
              <Text style={styles.actionButtonText}>Unarchive User</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={deleteUser}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete User</Text>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Implemented by VScode copilot - User Measurements Section */}
        <View style={styles.measurementsSection}>
          <View style={styles.measurementsSectionHeader}>
            <Text style={styles.sectionTitle}>User Measurements</Text>
            <View style={styles.measurementHeaderRight}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => fetchUserMeasurements(1)}
                disabled={measurementsLoading}
              >
                <Ionicons 
                  name="refresh" 
                  size={18} 
                  color={measurementsLoading ? '#9CA3AF' : '#7C3AED'} 
                />
              </TouchableOpacity>
              <Text style={styles.measurementCount}>{measurements.length}</Text>
            </View>
          </View>
          
          {measurementsLoading && measurements.length === 0 ? (
            <View style={styles.loadingMeasurements}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading measurements...</Text>
            </View>
          ) : measurements.length === 0 ? (
            <View style={styles.noMeasurementsContainer}>
              <Ionicons name="body-outline" size={24} color="#9CA3AF" />
              <Text style={styles.noMeasurementsText}>No measurements yet</Text>
              <Text style={styles.noMeasurementsSubtext}>This user hasn't created any measurements</Text>
            </View>
          ) : (
            <>
              <View>
                {measurements.map((measurement) => (
                  <View key={measurement.id} style={styles.measurementItem}>
                    <View style={styles.measurementItemHeader}>
                      <View>
                        <Text style={styles.measurementItemType}>
                          {measurement.submissionType || 'Manual'}
                        </Text>
                        <Text style={styles.measurementItemDate}>
                          {measurement.createdAt ? new Date(measurement.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                      <View style={[
                        styles.measurementItemBadge,
                        {
                          backgroundColor: measurement.submissionType === 'AI' 
                            ? '#EDE9FE' 
                            : '#FEF3C7'
                        }
                      ]}>
                        <Text style={[
                          styles.measurementItemBadgeText,
                          {
                            color: measurement.submissionType === 'AI' 
                              ? '#7C3AED' 
                              : '#F59E0B'
                          }
                        ]}>
                          {measurement.submissionType || 'Manual'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.measurementItemPreview}>
                      {measurement.sections && measurement.sections.length > 0 ? (
                        measurement.sections.map((section, sIndex) => (
                          <View key={`section-${sIndex}`} style={{ marginBottom: 6 }}>
                            {section.measurements && section.measurements.slice(0, 3).map((m, mi) => (
                              <Text key={`m-${mi}`} style={styles.measurementItemValue}>
                                {m.bodyPartName || m.name || `${m.key || ''}`}: {m.size}{m.unit || 'cm'}
                              </Text>
                            ))}
                          </View>
                        ))
                      ) : (
                        Object.entries(measurement.measurements || {}).slice(0, 3).map(([key, value]) => (
                          <Text key={key} style={styles.measurementItemValue}>
                            {key}: {value}cm
                          </Text>
                        ))
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.measurementViewButton}
                      onPress={() => {
                        navigation.navigate('MeasurementDetails', {
                          measurementId: measurement.id || measurement._id,
                          measurement: measurement
                        });
                      }}
                    >
                      <Text style={styles.measurementViewButtonText}>View Full Details</Text>
                      <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {hasMoreMeasurements && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={() => fetchUserMeasurements(measurementsPage + 1)}
                  disabled={measurementsLoading}
                >
                  {measurementsLoading ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <Text style={styles.loadMoreButtonText}>Load More Measurements</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
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
                    onPress={() => {
                      // Implemented by VScode copilot
                      // Prevent toggling and inform admin that password generation is enforced
                      Alert.alert('Notice', 'A new password will always be generated and sent when using this admin email action.');
                    }}
                  >
                    <View style={styles.checkedBox}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Generate new password</Text>
                </View>
                <Text style={styles.checkboxNote}>
                  A new password will always be generated and sent to the user when using this action.
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
  // Implemented by VScode copilot - Measurements Section Styles
  measurementsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 32,
  },
  measurementsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Implemented by VScode copilot - Refresh button for measurements
  measurementHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loadingMeasurements: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMeasurementsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMeasurementsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 8,
  },
  noMeasurementsSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  measurementItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  measurementItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  measurementItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  measurementItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  measurementItemBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  measurementHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  measurementViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginTop: 8,
  },
  measurementViewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
    marginRight: 4,
  },
  measurementItemPreview: {
    marginTop: 8,
  },
  measurementItemValue: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 12,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
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