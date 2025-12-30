import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const CreateUserScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [roles, setRoles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleId: '',
  });

  useEffect(() => {
    fetchUserProfile();
    fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await ApiService.getRoles(1, 50);
      if (response.success) {
        setRoles(response.data.roles || []);
      }
    } catch (error) {
      console.log('Error fetching roles:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (!formData.roleId) {
      Alert.alert('Error', 'Please select a role');
      return false;
    }
    return true;
  };

  const createUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        ...formData,
        generateNew: generatePassword
      };
      
      if (generatePassword) {
        delete userData.password;
      }
      
      const response = await ApiService.createOrgUser(userData);
      if (response.success) {
        const message = response.data.generatedPassword 
          ? `User created successfully!\n\nGenerated Password: ${response.data.generatedPassword}\n\nPlease save this password and share it with the user.`
          : 'User created successfully!';
        
        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Handle specific error messages for duplicates
        let errorMessage = response.message || 'Failed to create user';
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exist')) {
          errorMessage = 'This email address is already registered. Please use a different email.';
        } else if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('exist')) {
          errorMessage = 'This phone number is already registered. Please use a different phone number.';
        } else if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already')) {
          errorMessage = 'The email or phone number already exists. Please use different details.';
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.log('Error creating user:', error);
      Alert.alert('Error', 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create User</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter first name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter last name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.roleId}
                onValueChange={(value) => handleInputChange('roleId', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select a role" value="" />
                {roles.map((role) => (
                  <Picker.Item 
                    key={role.id || role._id} 
                    label={role.name} 
                    value={role.id || role._id} 
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.helpText}>
              Select a role to assign permissions to this user
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Generate Password Automatically</Text>
              <Switch
                value={generatePassword}
                onValueChange={setGeneratePassword}
                trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
                thumbColor={generatePassword ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.helpText}>
              {generatePassword 
                ? 'A secure password will be generated automatically'
                : 'User will set their own password or you can provide one'}
            </Text>
          </View>

          {!generatePassword && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Enter password"
                secureTextEntry
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create User</Text>
              </>
            )}
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
    color: '#1F2937',
  },
});

export default CreateUserScreen;