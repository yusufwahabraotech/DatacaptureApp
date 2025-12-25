import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../services/api';

const UserPermissionsScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailablePermissions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserPermissions();
    }, [])
  );

  const fetchAvailablePermissions = async () => {
    try {
      const response = await ApiService.getAvailablePermissions();
      if (response.success) {
        setAvailablePermissions(response.data.permissions);
      }
    } catch (error) {
      console.log('Error fetching available permissions:', error);
    }
  };

  const fetchUserPermissions = async () => {
    console.log('Fetching permissions for user:', user.id);
    setLoading(true);
    try {
      const response = await ApiService.getUserPermissions(user.id);
      console.log('Fetch permissions response:', response);
      
      if (response.success) {
        console.log('User permissions from backend:', response.data.permissions);
        setUserPermissions(response.data.permissions || []);
      } else {
        console.log('Fetch failed:', response.message);
      }
    } catch (error) {
      console.log('Error fetching user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionKey) => {
    setUserPermissions(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const savePermissions = async () => {
    console.log('Saving permissions for user:', user.id);
    console.log('Permissions to save:', userPermissions);
    
    setSaving(true);
    try {
      const response = await ApiService.updateUserPermissions(user.id, userPermissions);
      console.log('Save permissions response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'User permissions updated successfully');
        // Add small delay then refetch to ensure backend has processed the update
        setTimeout(() => {
          fetchUserPermissions();
        }, 500);
      } else {
        console.log('Save failed with message:', response.message);
        Alert.alert('Error', response.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.log('Save permissions error:', error);
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const groupPermissions = (permissions) => {
    const groups = {
      'Measurements': permissions.filter(p => p.key.includes('measurement')),
      'Users': permissions.filter(p => p.key.includes('user')),
      'Codes': permissions.filter(p => p.key.includes('code')),
      'System': permissions.filter(p => !p.key.includes('measurement') && !p.key.includes('user') && !p.key.includes('code'))
    };
    return groups;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Permissions</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </View>
    );
  }

  const permissionGroups = groupPermissions(availablePermissions);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Permissions</Text>
        <TouchableOpacity onPress={savePermissions} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
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

        {Object.entries(permissionGroups).map(([groupName, permissions]) => (
          permissions.length > 0 && (
            <View key={groupName} style={styles.permissionGroup}>
              <Text style={styles.groupTitle}>{groupName}</Text>
              {permissions.map((permission) => (
                <TouchableOpacity
                  key={permission.key}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(permission.key)}
                >
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    <Text style={styles.permissionDescription}>{permission.description}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    userPermissions.includes(permission.key) && styles.checkboxChecked
                  ]}>
                    {userPermissions.includes(permission.key) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ))}
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionGroup: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
});

export default UserPermissionsScreen;