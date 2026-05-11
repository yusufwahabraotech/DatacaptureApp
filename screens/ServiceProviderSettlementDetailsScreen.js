import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ServiceProviderSettlementDetailsScreen = ({ route, navigation }) => {
  const { settlementId } = route.params;
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadSettlement();
  }, []);

  const loadSettlement = async () => {
    try {
      const response = await ApiService.getSettlementById(settlementId);
      if (response.success) {
        setSettlement(response.data.settlement);
      } else {
        Alert.alert('Error', response.message || 'Failed to load settlement');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    Alert.alert(
      'Confirm Settlement',
      'Have you received this payment in your bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true);
            try {
              const response = await ApiService.confirmSettlement(settlementId, comment);
              if (response.success) {
                Alert.alert('Success', 'Settlement confirmed successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', response.message || 'Failed to confirm settlement');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setConfirming(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'disputed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settlement.settlementStatus) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(settlement.settlementStatus) }]}>
              {settlement.settlementStatus.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(settlement.amount, settlement.currency)}</Text>
          <Text style={styles.settlementId}>{settlement.settlementId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{settlement.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Bank Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{settlement.providerBankDetails.bankName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{settlement.providerBankDetails.accountNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Name</Text>
            <Text style={styles.infoValue}>{settlement.providerBankDetails.accountName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Settlement Date</Text>
            <Text style={styles.infoValue}>{formatDate(settlement.settlementDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Processed At</Text>
            <Text style={styles.infoValue}>{formatDate(settlement.processedAt)}</Text>
          </View>
        </View>

        {settlement.paymentEvidenceUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Evidence</Text>
            <Image source={{ uri: settlement.paymentEvidenceUrl }} style={styles.evidenceImage} />
          </View>
        )}

        {settlement.settlementStatus === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmation Comment (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment about this payment..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.confirmButtonText}>Confirm Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {settlement.settlementStatus === 'confirmed' && settlement.providerComment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Comment</Text>
            <Text style={styles.comment}>{settlement.providerComment}</Text>
            <Text style={styles.confirmedDate}>Confirmed on {formatDate(settlement.providerConfirmedAt)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 8,
  },
  settlementId: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFBFC',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#6EE7B7',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  confirmedDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default ServiceProviderSettlementDetailsScreen;
