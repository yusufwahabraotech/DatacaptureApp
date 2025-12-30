import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const CreateRoleScreen = ({ navigation, route }) => {
  const { editMode = false, role: existingRole } = route.params || {};
  const [roleData, setRoleData] = useState({
    name: existingRole?.name || '',
    description: existingRole?.description || '',
    permissions: existingRole?.permissions || []
  });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchPermissions();
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

  const fetchPermissions = async () => {
    try {
      const isOrgAdmin = userProfile?.role === 'ORGANIZATION';
      const response = isOrgAdmin
        ? await ApiService.getAvailablePermissions()
        : await ApiService.getOrgAvailablePermissions();
      
      if (response.success) {
        setAvailablePermissions(response.data.permissions || []);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    }
  };

  const togglePermission = (permissionKey) => {
    setRoleData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }));
  };

  const handleCreateRole = async () => {
    if (!roleData.name.trim()) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }

    if (!roleData.description.trim()) {
      Alert.alert('Error', 'Please enter a role description');
      return;
    }

    if (roleData.permissions.length === 0) {
      Alert.alert('Error', 'Please select at least one permission');
      return;
    }

    setLoading(true);
    try {
      const response = editMode
        ? await ApiService.updateRole(existingRole.id || existingRole._id, roleData)
        : await ApiService.createRole(roleData);

      if (response.success) {
        Alert.alert('Success', `Role ${editMode ? 'updated' : 'created'} successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || `Failed to ${editMode ? 'update' : 'create'} role`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${editMode ? 'update' : 'create'} role`);
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    // Filter permissions based on search query
    const matchesSearch = !permissionSearchQuery || 
      (permission.name?.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
       permission.description?.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
       permission.key?.toLowerCase().includes(permissionSearchQuery.toLowerCase()));
    
    if (matchesSearch) {
      const category = permission.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
    }
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editMode ? 'Edit Role' : 'Create Role'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role Name *</Text>
            <TextInput
              style={styles.input}
              value={roleData.name}
              onChangeText={(text) => setRoleData({...roleData, name: text})}
              placeholder="Enter role name (e.g., Data Analyst)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={roleData.description}
              onChangeText={(text) => setRoleData({...roleData, description: text})}
              placeholder="Describe what this role can do"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Select the permissions for this role ({roleData.permissions.length} selected)
          </Text>

          {/* Search for Permissions */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search permissions..."
              value={permissionSearchQuery}
              onChangeText={setPermissionSearchQuery}
            />
          </View>

          {Object.keys(groupedPermissions).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No permissions match your search</Text>
            </View>
          ) : (
            Object.entries(groupedPermissions).map(([category, permissions]) => (
              <View key={category} style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>{category}</Text>
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
                      roleData.permissions.includes(permission.key) && styles.checkboxChecked
                    ]}>
                      {roleData.permissions.includes(permission.key) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
          onPress={handleCreateRole}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Role' : 'Create Role')}
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
  categoryGroup: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default CreateRoleScreen;