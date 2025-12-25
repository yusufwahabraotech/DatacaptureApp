import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const UserOneTimeCodesScreen = ({ navigation }) => {
  const [codes, setCodes] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [expirationHours, setExpirationHours] = useState('1');
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  useEffect(() => {
    fetchCodes();
    fetchPermissions();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await ApiService.getMyOneTimeCodes();
      if (response.success) {
        setCodes(response.data.codes || []);
      }
    } catch (error) {
      console.log('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await ApiService.getMyPermissions();
      if (response.success) {
        setPermissions(response.data.permissions || []);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    }
  };

  const hasPermission = (permissionKey) => {
    return permissions.some(p => p.key === permissionKey || p === permissionKey);
  };

  const generateCode = async () => {
    if (!userEmail.trim()) {
      Alert.alert('Error', 'Please enter a user email');
      return;
    }

    setGenerating(true);
    try {
      console.log('Generating code with:', { userEmail: userEmail.trim(), expirationHours: parseInt(expirationHours) });
      const response = await ApiService.generateOrgOneTimeCode(userEmail.trim(), parseInt(expirationHours));
      console.log('Generate code response:', response);
      if (response.success) {
        Alert.alert('Success', 'One-time code generated successfully');
        setUserEmail('');
        setExpirationHours('1');
        setShowGenerateForm(false);
        fetchCodes();
      } else {
        Alert.alert('Error', response.message || 'Failed to generate code');
      }
    } catch (error) {
      console.log('Error generating code:', error);
      Alert.alert('Error', 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const sendEmail = async (code) => {
    if (!hasPermission('send_emails')) {
      Alert.alert('Permission Required', 'You need the "send_emails" permission to send one-time code emails. Please contact your administrator.');
      return;
    }
    
    try {
      const response = await ApiService.sendOrgOneTimeCodeEmail(code);
      if (response.success) {
        Alert.alert('Success', 'Email sent successfully');
        fetchCodes();
      } else {
        Alert.alert('Error', response.message || 'Failed to send email');
      }
    } catch (error) {
      console.log('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (code) => {
    if (code.isUsed) return 'Used';
    if (new Date(code.expiresAt) < new Date()) return 'Expired';
    return 'Available';
  };

  const getStatusColor = (code) => {
    const status = getStatusText(code);
    switch (status) {
      case 'Available': return '#10B981';
      case 'Used': return '#6B7280';
      case 'Expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (code) => {
    const status = getStatusText(code);
    switch (status) {
      case 'Available': return '#ECFDF5';
      case 'Used': return '#F9FAFB';
      case 'Expired': return '#FEF2F2';
      default: return '#F9FAFB';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>One-Time Codes</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading codes...</Text>
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
        <Text style={styles.headerTitle}>One-Time Codes</Text>
        {hasPermission('generate_one_time_codes') && (
          <TouchableOpacity onPress={() => setShowGenerateForm(!showGenerateForm)}>
            <Ionicons name="add" size={24} color="#7C3AED" />
          </TouchableOpacity>
        )}
      </View>

      {/* Generate Form */}
      {showGenerateForm && hasPermission('generate_one_time_codes') && (
        <View style={styles.generateForm}>
          <Text style={styles.formTitle}>Generate New Code</Text>
          <Text style={styles.infoText}>
            The code would be generated and displayed. Use the Send Email button in the codes list to send instructions to the provided email address.
          </Text>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter user email"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiration Hours</Text>
            <View style={styles.hoursSelector}>
              {[1, 12, 24, 168].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.hourOption,
                    expirationHours === hours.toString() && styles.hourOptionSelected
                  ]}
                  onPress={() => setExpirationHours(hours.toString())}
                >
                  <Text style={[
                    styles.hourOptionText,
                    expirationHours === hours.toString() && styles.hourOptionTextSelected
                  ]}>
                    {hours === 1 ? '1 Hour' : hours === 12 ? '12 Hours' : hours === 24 ? '24 Hours' : '1 Week'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowGenerateForm(false);
                setUserEmail('');
                setExpirationHours('1');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateCode}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.generateButtonText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.length}</Text>
          <Text style={styles.statLabel}>Total Codes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.filter(c => getStatusText(c) === 'Available').length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.filter(c => getStatusText(c) === 'Used').length}</Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
      </View>

      {/* Codes List */}
      <ScrollView style={styles.codesList}>
        {codes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="key" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No codes found</Text>
            <Text style={styles.emptySubtitle}>
              {hasPermission('generate_one_time_codes') 
                ? 'Generate your first one-time code' 
                : 'No codes available'}
            </Text>
          </View>
        ) : (
          codes.map((code) => (
            <View key={code._id || code.id} style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <View style={styles.codeInfo}>
                  <Text style={styles.codeValue}>{code.code}</Text>
                  <Text style={styles.userEmail}>{code.userEmail}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(code) }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(code) }
                  ]}>
                    {getStatusText(code).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.codeDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Created: {formatDate(code.createdAt)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Expires: {formatDate(code.expiresAt)}
                  </Text>
                </View>
                {code.usedAt && (
                  <View style={styles.detailItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Used: {formatDate(code.usedAt)}
                    </Text>
                  </View>
                )}
              </View>

              {getStatusText(code) === 'Available' && (
                <TouchableOpacity 
                  style={styles.codeCardSendEmailButton}
                  onPress={() => sendEmail(code.code)}
                >
                  <Ionicons name="mail" size={16} color="white" />
                  <Text style={styles.codeCardSendEmailText}>
                    {code.emailSent ? 'Resend Email' : 'Send Email'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
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
  generateForm: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
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
  emailInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  hoursSelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  hourOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  hourOptionSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  hourOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  hourOptionTextSelected: {
    color: 'white',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  generateButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  codesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeInfo: {
    flex: 1,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  codeDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  codeCardSendEmailButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  codeCardSendEmailText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
});

export default UserOneTimeCodesScreen;