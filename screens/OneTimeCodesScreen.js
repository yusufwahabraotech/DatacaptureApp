import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const OneTimeCodesScreen = ({ navigation }) => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sentCodes, setSentCodes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newCode, setNewCode] = useState({
    userEmail: '',
    expirationHours: '24'
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async (page = 1) => {
    try {
      console.log('=== FETCHING ONE-TIME CODES ===');
      console.log('Page:', page, 'Limit: 10');
      const response = await ApiService.getOneTimeCodes(page, 10);
      console.log('Response:', JSON.stringify(response, null, 2));
      if (response.success) {
        setCodes(response.data.codes || []);
        setCurrentPage(response.data.pagination?.page || page);
        setTotalPages(response.data.pagination?.totalPages || 1);
        console.log('Set totalPages to:', response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.log('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!newCode.userEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      const response = await ApiService.generateOneTimeCode({
        userEmail: newCode.userEmail,
        expirationHours: parseInt(newCode.expirationHours)
      });

      if (response.success) {
        Alert.alert('Success', `One-time code generated: ${response.data.code}\nFor: ${response.data.userEmail}\n\nClick the "Send Email" button to send instructions to the user.`);
        setShowCreateModal(false);
        setNewCode({ userEmail: '', expirationHours: '24' });
        fetchCodes();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate code');
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

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const sendCodeEmail = async (codeValue) => {
    try {
      const response = await ApiService.sendOneTimeCodeEmail(codeValue);
      if (response.success) {
        setSentCodes(prev => new Set([...prev, codeValue]));
        Alert.alert('Success', 'Email sent successfully with instructions!');
      } else {
        Alert.alert('Error', response.message || 'Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>One-Time Codes</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.length}</Text>
          <Text style={styles.statLabel}>Total Generated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.filter(c => c.isUsed).length}</Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{codes.filter(c => !c.isUsed && !isExpired(c.expiresAt)).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Codes List */}
      <KeyboardAwareScrollView 
        style={styles.codesList}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : codes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No codes generated yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to generate your first code</Text>
          </View>
        ) : (
          codes.map((code, index) => (
            <View key={code._id || code.id || code.code || `code-${index}`} style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeValue}>{code.code}</Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: code.isUsed 
                      ? '#EF4444' 
                      : isExpired(code.expiresAt) 
                        ? '#6B7280' 
                        : '#10B981'
                  }
                ]}>
                  <Text style={styles.statusText}>
                    {code.isUsed ? 'Used' : isExpired(code.expiresAt) ? 'Expired' : 'Active'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.codeDetails}>
                <View style={styles.codeDetailRow}>
                  <Ionicons name="mail" size={16} color="#6B7280" />
                  <Text style={styles.codeDetailText}>{code.userEmail}</Text>
                </View>
                
                <View style={styles.codeDetailRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.codeDetailText}>
                    Expires: {formatDate(code.expiresAt)}
                  </Text>
                </View>
                
                <View style={styles.codeDetailRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.codeDetailText}>
                    Created: {formatDate(code.createdAt)}
                  </Text>
                </View>
                
                {!code.isUsed && !isExpired(code.expiresAt) && (
                  <View style={styles.emailActions}>
                    {!sentCodes.has(code.code) ? (
                      <TouchableOpacity 
                        style={styles.sendButton}
                        onPress={() => sendCodeEmail(code.code)}
                      >
                        <Ionicons name="mail-outline" size={16} color="#7C3AED" />
                        <Text style={styles.sendButtonText}>Send Email</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.emailActionsRow}>
                        <View style={styles.sentButton}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.sentButtonText}>Sent</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.resendButton}
                          onPress={() => sendCodeEmail(code.code)}
                        >
                          <Ionicons name="refresh" size={16} color="#7C3AED" />
                          <Text style={styles.resendButtonText}>Resend</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </KeyboardAwareScrollView>

      {/* Pagination - DEBUG: Always show for testing */}
      <View style={styles.pagination}>
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => {
            if (currentPage > 1) {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              fetchCodes(newPage);
            }
          }}
          disabled={currentPage === 1}
        >
          <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
        
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => {
            if (currentPage < totalPages) {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              fetchCodes(newPage);
            }
          }}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Generate Code Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate One-Time Code</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <KeyboardAwareScrollView 
              style={styles.modalContent}
              enableOnAndroid={true}
              extraScrollHeight={20}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={newCode.userEmail}
                  onChangeText={(text) => setNewCode({...newCode, userEmail: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expiration (Hours)</Text>
                <View style={styles.expirationButtons}>
                  {['1', '6', '12', '24', '48', '168'].map((hours) => (
                    <TouchableOpacity
                      key={`expiration-${hours}`}
                      style={[
                        styles.expirationButton,
                        newCode.expirationHours === hours && styles.expirationButtonActive
                      ]}
                      onPress={() => setNewCode({...newCode, expirationHours: hours})}
                    >
                      <Text style={[
                        styles.expirationButtonText,
                        newCode.expirationHours === hours && styles.expirationButtonTextActive
                      ]}>
                        {hours}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#7C3AED" />
                <Text style={styles.infoText}>
                  The code will be generated and displayed. Use the "Send Email" button in the codes list to send instructions to the provided email address.
                </Text>
              </View>
            </KeyboardAwareScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateCode}
              >
                <Text style={styles.generateButtonText}>Generate Code</Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  codesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  codeCard: {
    backgroundColor: 'white',
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
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  codeDetails: {
    gap: 8,
  },
  codeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
    maxHeight: '80%',
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
  expirationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expirationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  expirationButtonActive: {
    backgroundColor: '#7C3AED',
  },
  expirationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  expirationButtonTextActive: {
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
  generateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sendButtonText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 4,
  },
  emailActions: {
    marginTop: 8,
  },
  emailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sentButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  resendButtonText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  pageButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  pageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageInfo: {
    fontSize: 14,
    color: '#6B7280',
  },

});

export default OneTimeCodesScreen;