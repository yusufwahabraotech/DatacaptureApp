import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SettlementsScreen = ({ navigation }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await ApiService.getSettlements();
      if (response.success) {
        setSettlements(response.data.settlements || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch settlements');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch settlements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirmRemittance = (order) => {
    setSelectedOrder(order);
    setComment('');
    setShowConfirmModal(true);
  };

  const submitConfirmation = async () => {
    if (!selectedOrder) return;

    setConfirming(true);
    try {
      const response = await ApiService.confirmRemittance(selectedOrder._id, comment);
      
      if (response.success) {
        Alert.alert('Success', 'Remittance confirmed successfully');
        setShowConfirmModal(false);
        fetchSettlements();
      } else {
        Alert.alert('Error', response.message || 'Failed to confirm remittance');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm remittance');
    } finally {
      setConfirming(false);
    }
  };

  const renderSettlementItem = ({ item }) => (
    <View style={styles.settlementCard}>
      <View style={styles.settlementHeader}>
        <View style={styles.settlementInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.settlementDate}>
            Settlement: {formatDate(item.remittance.settlementDate)}
          </Text>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amountValue}>₦{item.remittance.amountRemitted?.toLocaleString()}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.remittance.remittanceStatus === 'confirmed' ? '#10B981' : '#F59E0B' }
          ]}>
            <Text style={styles.statusText}>
              {item.remittance.remittanceStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bank Details */}
      <View style={styles.bankSection}>
        <Text style={styles.bankTitle}>Bank Details</Text>
        <View style={styles.bankDetails}>
          <Text style={styles.bankText}>
            {item.remittance.organizationBankName} - {item.remittance.organizationAccountNumber}
          </Text>
          <Text style={styles.bankText}>{item.remittance.organizationAccountName}</Text>
        </View>
      </View>

      {/* Payment Evidence */}
      {item.remittance.paymentEvidenceUrl && (
        <TouchableOpacity style={styles.evidenceButton}>
          <Ionicons name="document-text" size={16} color="#7B2CBF" />
          <Text style={styles.evidenceText}>View Payment Evidence</Text>
        </TouchableOpacity>
      )}

      {/* Organization Comment */}
      {item.remittance.organizationComment && (
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>Your Comment:</Text>
          <Text style={styles.commentText}>{item.remittance.organizationComment}</Text>
        </View>
      )}

      {/* Action Button */}
      {item.remittance.remittanceStatus === 'pending' && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirmRemittance(item)}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.confirmButtonText}>Confirm Receipt</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Settlements Yet</Text>
      <Text style={styles.emptyMessage}>
        Your payment settlements will appear here once orders are processed.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settlements</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading settlements...</Text>
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
        <Text style={styles.headerTitle}>Settlements</Text>
        <TouchableOpacity onPress={() => fetchSettlements(true)}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={settlements}
        renderItem={renderSettlementItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.settlementsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSettlements(true)} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Receipt</Text>
            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Confirm that you have received the payment of ₦{selectedOrder?.remittance.amountRemitted?.toLocaleString()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Comment (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment about this payment..."
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.modalConfirmButton, confirming && styles.modalConfirmButtonDisabled]}
              onPress={submitConfirmation}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalConfirmButtonText}>Confirm Receipt</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  settlementsList: {
    padding: 16,
  },
  settlementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settlementInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settlementDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bankSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  bankDetails: {
    gap: 4,
  },
  bankText: {
    fontSize: 12,
    color: '#6B7280',
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  evidenceText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  commentSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 12,
    color: '#6B7280',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  modalConfirmButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettlementsScreen;