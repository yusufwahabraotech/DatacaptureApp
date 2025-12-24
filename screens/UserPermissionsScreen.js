import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserPermissionsScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [permissions, setPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  // API Endpoints:
  // GET: https://datacapture-backend.onrender.com/api/admin/permissions
  // GET: https://datacapture-backend.onrender.com/api/admin/users/${userId}/permissions
  // PUT: https://datacapture-backend.onrender.com/api/admin/users/${userId}/permissions

  useEffect(() => {
    fetchPermissions();
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUserPermissions(data.data.permissions || []);
      }
    } catch (error) {
      console.log('Error fetching user permissions:', error);
      // Fallback to route params if API fails
      setUserPermissions(user.permissions || []);
    }
  };

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
        setPermissions(data.data.permissions);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionKey) => {
    if (userPermissions.includes(permissionKey)) {
      setUserPermissions(userPermissions.filter(p => p !== permissionKey));
    } else {
      setUserPermissions([...userPermissions, permissionKey]);
    }
  };

  const savePermissions = async () => {
    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`https://datacapture-backend.onrender.com/api/admin/users/${user.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: userPermissions }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'User permissions updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categories = {
      'Measurements': permissions.filter(p => p.key.includes('measurements')),
      'Users': permissions.filter(p => p.key.includes('users') || p.key.includes('user_status')),
      'One-Time Codes': permissions.filter(p => p.key.includes('one_time_codes')),
      'System': permissions.filter(p => ['view_dashboard_stats', 'send_emails', 'export_data', 'manage_permissions'].includes(p.key))
    };
    return categories;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Permissions</Text>
        <TouchableOpacity 
          onPress={savePermissions}
          disabled={updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#7C3AED" />
          )}
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading permissions...</Text>
          </View>
        ) : (
          Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
            categoryPermissions.length > 0 && (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categoryPermissions.map((permission) => (
                  <TouchableOpacity
                    key={permission.key}
                    style={styles.permissionItem}
                    onPress={() => togglePermission(permission.key)}
                  >
                    <View style={styles.permissionInfo}>
                      <Text style={styles.permissionName}>{permission.name}</Text>
                      <Text style={styles.permissionDescription}>{permission.description}</Text>
                    </View>
                    <View style={styles.checkbox}>
                      {userPermissions.includes(permission.key) ? (
                        <View style={styles.checkedBox}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      ) : (
                        <View style={styles.uncheckedBox} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ))
        )}

        {/* Permission Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Selected Permissions ({userPermissions.length})</Text>
          {userPermissions.length === 0 ? (
            <Text style={styles.noPermissions}>No permissions selected</Text>
          ) : (
            userPermissions.map((permKey) => {
              const perm = permissions.find(p => p.key === permKey);
              return perm ? (
                <View key={permKey} style={styles.selectedPermission}>
                  <Text style={styles.selectedPermissionText}>{perm.name}</Text>
                </View>
              ) : null;
            })
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, updateLoading && styles.saveButtonDisabled]}
          onPress={savePermissions}
          disabled={updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Permissions</Text>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
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
  content: {
    flex: 1,
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
  categorySection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
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
  },
  checkedBox: {
    width: 24,
    height: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 100,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  noPermissions: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  selectedPermission: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  selectedPermissionText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default UserPermissionsScreen;