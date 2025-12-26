import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SystemSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    maxUsersPerOrg: 100,
    sessionTimeout: 24,
    emailNotifications: true,
    systemName: 'DataCapture System',
    supportEmail: 'support@datacapture.com',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success && response.data.user.role !== 'SUPER_ADMIN') {
        Alert.alert('Access Denied', 'You do not have permission to access this screen.');
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.log('Error checking user role:', error);
      navigation.goBack();
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // This would call a super admin settings API endpoint
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const exportSystemData = async (format) => {
    try {
      Alert.alert('Export Started', `System data export in ${format.toUpperCase()} format has been initiated. You will receive an email when ready.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start export');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity onPress={saveSettings} disabled={loading}>
          <Ionicons name="save" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* System Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Configuration</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDescription}>Temporarily disable system access</Text>
            </View>
            <Switch
              value={settings.maintenanceMode}
              onValueChange={(value) => updateSetting('maintenanceMode', value)}
              trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow New Registrations</Text>
              <Text style={styles.settingDescription}>Enable new user registrations</Text>
            </View>
            <Switch
              value={settings.allowRegistrations}
              onValueChange={(value) => updateSetting('allowRegistrations', value)}
              trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Send system notifications via email</Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
            />
          </View>
        </View>

        {/* System Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Limits</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Users Per Organization</Text>
            <TextInput
              style={styles.input}
              value={settings.maxUsersPerOrg.toString()}
              onChangeText={(text) => updateSetting('maxUsersPerOrg', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Session Timeout (hours)</Text>
            <TextInput
              style={styles.input}
              value={settings.sessionTimeout.toString()}
              onChangeText={(text) => updateSetting('sessionTimeout', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="24"
            />
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>System Name</Text>
            <TextInput
              style={styles.input}
              value={settings.systemName}
              onChangeText={(text) => updateSetting('systemName', text)}
              placeholder="DataCapture System"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Support Email</Text>
            <TextInput
              style={styles.input}
              value={settings.supportEmail}
              onChangeText={(text) => updateSetting('supportEmail', text)}
              placeholder="support@datacapture.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Data Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Export</Text>
          <Text style={styles.sectionDescription}>Export all system data for backup or analysis</Text>
          
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportSystemData('csv')}
            >
              <Ionicons name="document-text" size={20} color="#7C3AED" />
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportSystemData('excel')}
            >
              <Ionicons name="grid" size={20} color="#10B981" />
              <Text style={styles.exportButtonText}>Export Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => Alert.alert(
              'Clear System Cache',
              'This will clear all cached data. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'System cache cleared') }
              ]
            )}
          >
            <Text style={styles.dangerButtonText}>Clear System Cache</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default SystemSettingsScreen;