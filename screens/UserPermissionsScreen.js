import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../services/api';

const UserPermissionsScreen = ({ navigation, route }) => {
  const { userId, userName } = route.params;
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserRole();
    }, [userId])
  );

  const loadData = async () => {
    await fetchRoles();
    await fetchUserRole();
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      console.log('=== FETCHING ROLES FOR ASSIGNMENT ===');
      const response = await ApiService.getAvailableRoles();
      console.log('getAvailableRoles response:', JSON.stringify(response, null, 2));
      if (response.success) {
        console.log('Roles data:', response.data);
        console.log('Roles array:', response.data.roles);
        setRoles(response.data.roles || []);
      } else {
        console.log('Failed to fetch roles:', response.message);
      }
    } catch (error) {
      console.log('Error fetching roles:', error);
    }
  };

  const fetchUserRole = async () => {
    if (!userId) return;
    
    try {
      console.log('=== FETCHING USER ROLE ===');
      console.log('User ID:', userId);
      
      const response = await ApiService.getUserRole(userId);
      console.log('getUserRole response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data.role) {
        console.log('Setting current role:', response.data.role);
        console.log('Role object keys:', Object.keys(response.data.role));
        console.log('Role _id:', response.data.role._id);
        console.log('Role id:', response.data.role.id);
        console.log('Role roleId:', response.data.role.roleId);
        setCurrentRole(response.data.role);
        // Try different possible ID fields
        const roleId = response.data.role._id || response.data.role.id || response.data.role.roleId;
        console.log('Setting selected role ID:', roleId);
        setSelectedRoleId(roleId || '');
      } else {
        console.log('No role found, clearing selection');
        setCurrentRole(null);
        setSelectedRoleId('');
      }
    } catch (error) {
      console.log('Error fetching user role:', error);
      setCurrentRole(null);
      setSelectedRoleId('');
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRoleId(selectedRoleId === roleId ? '' : roleId);
  };

  const handleAssignRole = async () => {
    console.log('=== HANDLE ASSIGN ROLE CALLED ===');
    console.log('Selected role ID:', selectedRoleId);
    
    if (!selectedRoleId) {
      console.log('No role selected, showing alert');
      Alert.alert('Error', 'Please select a role');
      return;
    }
    
    console.log('Starting role assignment...');
    setUpdating(true);
    try {
      console.log('Calling ApiService.assignUserRole with:', { userId, selectedRoleId });
      const response = await ApiService.assignUserRole(userId, selectedRoleId);
      console.log('Assignment completed, response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        Alert.alert('Success', 'Role assigned successfully');
        // Update current role to match the selected role
        const assignedRole = roles.find(role => role._id === selectedRoleId || role.id === selectedRoleId);
        setCurrentRole(assignedRole);
        // Keep the checkbox checked by maintaining selectedRoleId
      } else {
        console.log('Assignment failed:', response.message);
        Alert.alert('Error', response.message || 'Failed to assign role');
      }
    } catch (error) {
      console.log('Assignment error:', error);
      Alert.alert('Error', 'Failed to assign role');
    } finally {
      console.log('Assignment process completed');
      setUpdating(false);
    }
  };

  const renderRoleCard = ({ item }) => {
    const isSelected = selectedRoleId === item._id || selectedRoleId === item.id;
    const isCurrent = (currentRole?._id === item._id) || (currentRole?.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.roleCard,
          isSelected && styles.roleCardSelected,
          isCurrent && styles.roleCardCurrent
        ]}
        onPress={() => handleRoleSelect(item._id)}
        disabled={updating}
      >
        <View style={styles.roleHeader}>
          <View style={styles.roleIconContainer}>
            <Ionicons name="shield" size={20} color="#7C3AED" />
          </View>
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        </View>
        
        <Text style={styles.roleName}>{item.name}</Text>
        <Text style={styles.roleDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.rolePermissions}>
          {item.permissions?.length || 0} permissions
        </Text>
        
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assign Role</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading roles...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Role</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* User Info */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userSubtitle}>Select a role to assign</Text>
        </View>

        {/* Roles List */}
        <FlatList
          key="single-column"
          data={roles}
          renderItem={renderRoleCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Assign Button */}
        <TouchableOpacity
          style={[
            styles.assignButton,
            (!selectedRoleId || updating) && styles.assignButtonDisabled
          ]}
          onPress={handleAssignRole}
          disabled={!selectedRoleId || updating}
        >
          {updating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.assignButtonText}>Assign Selected Role</Text>
          )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 24,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userSubtitle: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  roleCardCurrent: {
    borderColor: '#10B981',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  rolePermissions: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  assignButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserPermissionsScreen;