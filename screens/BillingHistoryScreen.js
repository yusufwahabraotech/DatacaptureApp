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
import ApiService from '../services/api';

const BillingHistoryScreen = ({ navigation }) => {
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const response = await ApiService.getOrganizationBillingHistory();
      if (response.success) {
        setBillingHistory(response.data.billingHistory);
      }
    } catch (error) {
      console.log('Error fetching billing history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading billing history...</Text>
          </View>
        ) : billingHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Billing History</Text>
            <Text style={styles.emptyText}>Your billing history will appear here</Text>
          </View>
        ) : (
          billingHistory.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billHeader}>
                <View style={styles.billInfo}>
                  <Text style={styles.billDate}>{formatDate(bill.date)}</Text>
                  <Text style={styles.billDescription}>{bill.description}</Text>
                </View>
                <View style={styles.billAmount}>
                  <Text style={styles.amountText}>₦{bill.amount.toLocaleString()}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(bill.status) }
                  ]}>
                    <Text style={styles.statusText}>{bill.status}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.billDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Invoice ID:</Text>
                  <Text style={styles.detailValue}>{bill.invoiceId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>{bill.paymentMethod}</Text>
                </View>
                {bill.nextBillingDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Next Billing:</Text>
                    <Text style={styles.detailValue}>{formatDate(bill.nextBillingDate)}</Text>
                  </View>
                )}
              </View>

              {bill.downloadUrl && (
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download" size={16} color="#7C3AED" />
                  <Text style={styles.downloadText}>Download Invoice</Text>
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
  content: {
    flex: 1,
    padding: 20,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  billCard: {
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
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  billDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
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
  billDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 6,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 6,
  },
});

export default BillingHistoryScreen;