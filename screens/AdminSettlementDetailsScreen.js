import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminSettlementDetailsScreen = ({ route, navigation }) => {
  const { settlementId } = route.params;
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettlement();
  }, []);

  const loadSettlement = async () => {
    try {
      const response = await ApiService.getAdminSettlementById(settlementId);
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
          <Text style={styles.sectionTitle}>Provider Bank Details</Text>
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
          <Text style={styles.sectionTitle}>Your Bank Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{settlement.adminBankDetails.bankName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{settlement.adminBankDetails.accountNumber}</Text>
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
          {settlement.providerConfirmedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Confirmed At</Text>
              <Text style={[styles.infoValue, { color: '#10B981' }]}>{formatDate(settlement.providerConfirmedAt)}</Text>
            </View>
          )}
        </View>

        {settlement.paymentEvidenceUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Evidence</Text>
            <Image source={{ uri: settlement.paymentEvidenceUrl }} style={styles.evidenceImage} />
          </View>
        )}

        {settlement.providerComment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Comment</Text>
            <Text style={styles.comment}>{settlement.providerComment}</Text>
          </View>
        )}

        {settlement.settlementStatus === 'pending' && (
          <View style={styles.alertBox}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.alertText}>Awaiting provider confirmation</Text>
          </View>
        )}

        {settlement.settlementStatus === 'confirmed' && (
          <View style={[styles.alertBox, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.alertText, { color: '#10B981' }]}>Settlement confirmed by provider</Text>
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
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
});

export default AdminSettlementDetailsScreen;
