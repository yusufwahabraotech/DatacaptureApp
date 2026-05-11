import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

const AdminTaskCompletionDetailsScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetails();
  }, []);

  const fetchTaskDetails = async () => {
    try {
      const response = await ApiService.getAdminTaskCompletionDetails(taskId);
      if (response.success) {
        setTask(response.data.task);
      }
    } catch (error) {
      console.log('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || 0}`;
  };

  const openVideo = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Task not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract data from nested structure
  const serviceName = task.service?.name || 'N/A';
  const serviceDate = task.service?.date;
  const serviceTime = task.service?.time;
  const completedAt = task.timeline?.completedAt;
  const providerName = task.serviceProvider?.name || 'N/A';
  const providerId = task.serviceProvider?.customUserId || task.serviceProvider?.id || 'N/A';
  const customerName = task.customer?.fullName || 'N/A';
  const customerId = task.customer?.customerId || task.customer?.userId || 'N/A';
  const totalFee = task.financial?.totalFee || task.order?.totalAmount || 0;
  const providerFee = task.financial?.providerFee || 0;
  const settlementStatus = task.financial?.settlementStatus || 'pending';
  const confirmation = task.confirmationDetails;
  const deliveryConfirmation = task.deliveryConfirmation;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task ID</Text>
              <Text style={styles.infoValue}>{task.taskId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{serviceName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completed At</Text>
              <Text style={styles.infoValue}>{formatDate(completedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Provider & Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People</Text>
          <View style={styles.card}>
            <View style={styles.personCard}>
              <Ionicons name="person" size={20} color="#7B2CBF" />
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>Service Provider</Text>
                <Text style={styles.personName}>{providerName}</Text>
                <Text style={styles.personId}>ID: {providerId}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.personCard}>
              <Ionicons name="person-outline" size={20} color="#10B981" />
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>Customer</Text>
                <Text style={styles.personName}>{customerName}</Text>
                <Text style={styles.personId}>ID: {customerId}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.card}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Amount Paid</Text>
              <Text style={styles.financialValue}>{formatCurrency(totalFee)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Provider Fee</Text>
              <Text style={[styles.financialValue, { color: '#7B2CBF' }]}>
                {formatCurrency(providerFee)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Settlement Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: settlementStatus === 'completed' ? '#ECFDF5' : '#FEF3C7' }]}>
                <Text style={[styles.statusText, { color: settlementStatus === 'completed' ? '#10B981' : '#F59E0B' }]}>
                  {settlementStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Confirmation Details */}
        {confirmation && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Completion Declaration</Text>
              <View style={styles.card}>
                <Text style={styles.declarationText}>
                  {confirmation.serviceCompletionDeclaration}
                </Text>
              </View>
            </View>

            {confirmation.serviceComment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Comments</Text>
                <View style={styles.card}>
                  <Text style={styles.commentText}>
                    {confirmation.serviceComment}
                  </Text>
                </View>
              </View>
            )}

            {/* Service Images */}
            {confirmation.serviceImages?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Service Images ({confirmation.serviceImages.length})
                </Text>
                <View style={styles.imagesGrid}>
                  {confirmation.serviceImages.map((imageUrl, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri: imageUrl }} style={styles.image} />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageNumber}>{index + 1}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Videos */}
            {(confirmation.serviceVideoUrl || confirmation.videoUrl) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Videos</Text>
                <View style={styles.card}>
                  {confirmation.serviceVideoUrl && (
                    <TouchableOpacity
                      style={styles.videoButton}
                      onPress={() => openVideo(confirmation.serviceVideoUrl)}
                    >
                      <Ionicons name="videocam" size={24} color="#7B2CBF" />
                      <Text style={styles.videoButtonText}>Service Video (Uploaded)</Text>
                      <Ionicons name="open-outline" size={20} color="#7B2CBF" />
                    </TouchableOpacity>
                  )}
                  {confirmation.videoUrl && (
                    <TouchableOpacity
                      style={[styles.videoButton, { marginTop: 12 }]}
                      onPress={() => openVideo(confirmation.videoUrl)}
                    >
                      <Ionicons name="link" size={24} color="#10B981" />
                      <Text style={styles.videoButtonText}>External Video Link</Text>
                      <Ionicons name="open-outline" size={20} color="#10B981" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Confirmation Metadata */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Confirmation Details</Text>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Confirmed At</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(confirmation.confirmedAt)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Confirmed By</Text>
                  <Text style={styles.infoValue}>{confirmation.confirmedBy}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Order Delivery Confirmation */}
        {deliveryConfirmation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Delivery Confirmation</Text>
            <View style={styles.card}>
              <View style={styles.confirmationBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.confirmationBadgeText}>Delivery Confirmed by Customer</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Confirmed At</Text>
                <Text style={styles.infoValue}>
                  {formatDate(deliveryConfirmation.confirmedAt)}
                </Text>
              </View>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  personInfo: {
    marginLeft: 12,
    flex: 1,
  },
  personLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  personId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  declarationText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imageContainer: {
    width: (width - 48) / 2,
    height: (width - 48) / 2,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  videoButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  confirmationBadgeText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminTaskCompletionDetailsScreen;
