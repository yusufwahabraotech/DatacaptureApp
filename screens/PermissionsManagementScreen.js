import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PermissionsManagementScreen = ({ navigation }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

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

  const getPermissionsByCategory = () => {
    const categories = {
      'Body Measurements': permissions.filter(p => p.key.includes('measurements')),
      'User Management': permissions.filter(p => p.key.includes('users') || p.key.includes('user_status')),
      'One-Time Codes': permissions.filter(p => p.key.includes('one_time_codes')),
      'System & Reports': permissions.filter(p => ['view_dashboard_stats', 'send_emails', 'export_data', 'manage_permissions'].includes(p.key))
    };
    return categories;
  };

  const getPermissionIcon = (key) => {
    if (key.includes('measurements')) return 'body';
    if (key.includes('users')) return 'people';
    if (key.includes('one_time_codes')) return 'key';
    if (key.includes('dashboard')) return 'analytics';
    if (key.includes('email')) return 'mail';
    if (key.includes('export')) return 'download';
    if (key.includes('permissions')) return 'shield-checkmark';
    return 'settings';
  };

  const getPermissionColor = (key) => {
    if (key.includes('measurements')) return '#7C3AED';
    if (key.includes('users')) return '#10B981';
    if (key.includes('one_time_codes')) return '#F59E0B';
    if (key.includes('dashboard') || key.includes('export')) return '#EC4899';
    if (key.includes('email')) return '#3B82F6';
    if (key.includes('permissions')) return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions Overview</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#7C3AED" />
        <Text style={styles.infoText}>
          Permissions allow granular control over what users can access and modify in your organization.
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading permissions...</Text>
          </View>
        ) : (
          <>
            {/* Permission Categories */}
            {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
              categoryPermissions.length > 0 && (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.categoryDescription}>
                    {category === 'Body Measurements' && 'Control access to customer measurement data'}
                    {category === 'User Management' && 'Manage organization users and their status'}
                    {category === 'One-Time Codes' && 'Generate and view access codes for external users'}
                    {category === 'System & Reports' && 'Access dashboard, send emails, and export data'}
                  </Text>
                  
                  {categoryPermissions.map((permission) => (
                    <View key={permission.key} style={styles.permissionCard}>
                      <View style={styles.permissionHeader}>
                        <View style={[styles.permissionIcon, { backgroundColor: getPermissionColor(permission.key) }]}>
                          <Ionicons 
                            name={getPermissionIcon(permission.key)} 
                            size={16} 
                            color="white" 
                          />
                        </View>
                        <Text style={styles.permissionName}>{permission.name}</Text>
                      </View>
                      <Text style={styles.permissionDescription}>{permission.description}</Text>
                      <View style={styles.permissionKey}>
                        <Text style={styles.permissionKeyText}>{permission.key}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ))}

            {/* Usage Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Common Permission Combinations</Text>
              
              <View style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>📏 Measurement Specialist</Text>
                <Text style={styles.exampleDescription}>
                  Can only work with body measurements
                </Text>
                <View style={styles.examplePermissions}>
                  <Text style={styles.examplePermission}>• view_measurements</Text>
                  <Text style={styles.examplePermission}>• create_measurements</Text>
                  <Text style={styles.examplePermission}>• edit_measurements</Text>
                </View>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>👥 Customer Service Rep</Text>
                <Text style={styles.exampleDescription}>
                  Can view customers and send emails
                </Text>
                <View style={styles.examplePermissions}>
                  <Text style={styles.examplePermission}>• view_users</Text>
                  <Text style={styles.examplePermission}>• send_emails</Text>
                  <Text style={styles.examplePermission}>• view_one_time_codes</Text>
                </View>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>📊 Data Manager</Text>
                <Text style={styles.exampleDescription}>
                  Can view all data and export reports
                </Text>
                <View style={styles.examplePermissions}>
                  <Text style={styles.examplePermission}>• view_measurements</Text>
                  <Text style={styles.examplePermission}>• view_users</Text>
                  <Text style={styles.examplePermission}>• export_data</Text>
                  <Text style={styles.examplePermission}>• view_dashboard_stats</Text>
                </View>
              </View>
            </View>
          </>
        )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  permissionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  permissionKey: {
    alignSelf: 'flex-start',
  },
  permissionKeyText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examplesSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  exampleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  examplePermissions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 8,
  },
  examplePermission: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default PermissionsManagementScreen;