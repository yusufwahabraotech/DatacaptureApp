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

const UserSettingsScreen = ({ navigation }) => {
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserPermissions();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      // First, let's check what the debug endpoint shows
      console.log('=== CALLING DEBUG ENDPOINT ===');
      const debugResponse = await ApiService.apiCall('/admin/debug/user-info');
      console.log('Debug endpoint response:', JSON.stringify(debugResponse, null, 2));
      
      const response = await ApiService.getAvailablePermissions();
      console.log('=== UserSettings Permissions DEBUG ===');
      console.log('Permissions response:', JSON.stringify(response, null, 2));
      if (response.success) {
        const perms = response.data.permissions || [];
        console.log('Permissions array length:', perms.length);
        console.log('All permissions:', perms.map(p => typeof p === 'object' ? p.key : p));
        console.log('Missing group permissions:', ['view_groups', 'create_groups', 'edit_groups', 'delete_groups', 'manage_group_members'].filter(perm => !perms.some(p => p.key === perm || p === perm)));
        console.log('Has view_groups permission:', perms.some(p => p.key === 'view_groups' || p === 'view_groups'));
        setPermissions(perms);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionKey) => {
    const hasIt = permissions.some(p => p.key === permissionKey || p === permissionKey);
    console.log(`Checking permission '${permissionKey}':`, hasIt);
    return hasIt;
  };

  const getPermissionCards = () => {
    const cards = [];
    console.log('=== getPermissionCards DEBUG ===');
    console.log('User organizationId:', user?.organizationId);
    console.log('Total permissions:', permissions.length);

    // Only show organization features if user has organizationId
    if (!user?.organizationId) {
      console.log('No organizationId - returning empty cards');
      return cards;
    }

    // Define all possible features with their permission requirements
    const allFeatures = [
      {
        title: 'View Users',
        subtitle: 'View organization users',
        icon: 'people',
        color: '#10B981',
        bgColor: '#ECFDF5',
        permission: 'view_users',
        onPress: () => navigation.navigate('UserManagement')
      },
      {
        title: 'Create Users',
        subtitle: 'Add new users',
        icon: 'person-add',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        permission: 'create_users',
        onPress: () => navigation.navigate('UserManagement')
      },
      {
        title: 'Manage Users',
        subtitle: 'Edit user details',
        icon: 'create',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        permission: 'edit_users',
        onPress: () => navigation.navigate('UserManagement')
      },
      {
        title: 'Roles Management',
        subtitle: 'Manage user roles',
        icon: 'shield-checkmark',
        color: '#7C3AED',
        bgColor: '#F5F3FF',
        permission: 'view_roles',
        onPress: () => navigation.navigate('Roles')
      },
      {
        title: 'Groups Management',
        subtitle: 'Manage user groups',
        icon: 'layers',
        color: '#EC4899',
        bgColor: '#FDF2F8',
        permission: 'view_groups',
        onPress: () => navigation.navigate('Groups')
      },
      {
        title: 'View Measurements',
        subtitle: 'View all measurements',
        icon: 'body',
        color: '#7C3AED',
        bgColor: '#F5F3FF',
        permission: 'view_measurements',
        onPress: () => navigation.navigate('UserMeasurements')
      },
      {
        title: 'Create Measurements',
        subtitle: 'Add new measurements',
        icon: 'add-circle',
        color: '#EF4444',
        bgColor: '#FEF2F2',
        permission: 'create_measurements',
        onPress: () => navigation.navigate('BodyMeasurement')
      },
      {
        title: 'One-Time Codes',
        subtitle: 'Manage access codes',
        icon: 'key',
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        permission: 'view_one_time_codes',
        onPress: () => navigation.navigate('UserOneTimeCodes')
      },
      {
        title: 'Dashboard',
        subtitle: 'View organization stats',
        icon: 'analytics',
        color: '#06B6D4',
        bgColor: '#ECFEFF',
        permission: 'view_dashboard_stats',
        onPress: () => navigation.navigate('AdminDashboard')
      }
    ];

    // Add all features, marking those without permission as disabled
    allFeatures.forEach(feature => {
      const hasAccess = hasPermission(feature.permission);
      cards.push({
        ...feature,
        hasAccess,
        onPress: hasAccess ? feature.onPress : () => {
          Alert.alert(
            'Permission Required',
            `You need the "${feature.permission.replace(/_/g, ' ')}" permission to access this feature. Please contact your organization administrator.`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      });
    });

    // Sort cards: enabled first, then disabled
    cards.sort((a, b) => {
      if (a.hasAccess && !b.hasAccess) return -1;
      if (!a.hasAccess && b.hasAccess) return 1;
      return 0;
    });

    return cards;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assigned Role</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </View>
    );
  }

  const permissionCards = getPermissionCards();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Role</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>

        {/* Available Features */}
        {user?.organizationId && permissionCards.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Organization Features</Text>
            <Text style={styles.sectionSubtitle}>
              Features available to your organization. Grayed out items require additional permissions.
            </Text>
            
            <View style={styles.featuresGrid}>
              {permissionCards.map((card, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.featureCard, 
                    { backgroundColor: card.hasAccess ? card.bgColor : '#F9FAFB' },
                    !card.hasAccess && styles.disabledCard
                  ]}
                  onPress={card.onPress}
                >
                  <View style={[
                    styles.featureIcon,
                    { backgroundColor: card.hasAccess ? 'rgba(255,255,255,0.8)' : '#E5E7EB' }
                  ]}>
                    <Ionicons 
                      name={card.hasAccess ? card.icon : 'lock-closed'} 
                      size={24} 
                      color={card.hasAccess ? card.color : '#9CA3AF'} 
                    />
                  </View>
                  <Text style={[
                    styles.featureTitle,
                    !card.hasAccess && styles.disabledText
                  ]}>
                    {card.title}
                  </Text>
                  <Text style={[
                    styles.featureSubtitle,
                    !card.hasAccess && styles.disabledSubtext
                  ]}>
                    {card.hasAccess ? card.subtitle : 'Permission required'}
                  </Text>
                  {!card.hasAccess && (
                    <View style={styles.permissionBadge}>
                      <Text style={styles.permissionBadgeText}>No Access</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Permissions Summary */}
        <View style={styles.permissionsSection}>
          <Text style={styles.sectionTitle}>Your Permissions</Text>
          {!user?.organizationId ? (
            <View style={styles.noOrganization}>
              <Ionicons name="business" size={48} color="#9CA3AF" />
              <Text style={styles.noOrganizationText}>Not part of an organization</Text>
              <Text style={styles.noOrganizationSubtext}>
                Join an organization to access additional features
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>
                You have access to {permissions.length} feature{permissions.length !== 1 ? 's' : ''}
              </Text>
              
              {permissions.length === 0 ? (
                <View style={styles.noPermissions}>
                  <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
                  <Text style={styles.noPermissionsText}>No permissions granted</Text>
                  <Text style={styles.noPermissionsSubtext}>
                    Contact your organization admin to request access
                  </Text>
                </View>
              ) : (
                <View style={styles.permissionsList}>
                  {permissions.map((permission, index) => (
                    <View key={index} style={styles.permissionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.permissionText}>
                        {typeof permission === 'object' ? permission.name : permission}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  permissionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  noPermissions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPermissionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  noPermissionsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionsList: {
    marginTop: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  noOrganization: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noOrganizationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  noOrganizationSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  disabledSubtext: {
    color: '#9CA3AF',
  },
  permissionBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  permissionBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default UserSettingsScreen;