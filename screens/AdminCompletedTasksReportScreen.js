import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, FlatList, Image, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminCompletedTasksReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadCompletedTasks = useCallback(async () => {
    try {
      const response = await ApiService.getAdminCompletedTasks({
        includeConfirmation: true,
        page: 1,
        limit: 50
      });

      if (response.success) {
        setCompletedTasks(response.data.tasks || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load completed tasks');
      }
    } catch (error) {
      console.error('Error loading completed tasks:', error);
      Alert.alert('Error', 'Failed to load completed tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCompletedTasks();
  }, [loadCompletedTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCompletedTasks();
  };

  const loadTaskDetails = async (taskId) => {
    setLoadingDetails(true);
    try {
      const response = await ApiService.getAdminTaskCompletionDetails(taskId);
      if (response.success) {
        setTaskDetails(response.data.task);
      } else {
        Alert.alert('Error', response.message || 'Failed to load task details');
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
    loadTaskDetails(task.taskId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTaskCard = ({ item }) => {
    const hasConfirmation = item.confirmationDetails;
    const hasDeliveryConfirmation = item.deliveryConfirmation;

    return (
      <View style={styles.taskCard}>
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.service?.name || 'Service'}</Text>
            <Text style={styles.customerName}>
              Customer: {item.customer?.fullName || 'N/A'}
            </Text>
            <Text style={styles.providerName}>
              Provider: {item.serviceProvider?.name || 'N/A'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.taskId}>#{item.taskId?.slice(-6)}</Text>
            <Text style={styles.taskFee}>₦{item.financial?.providerFee?.toLocaleString() || '0'}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.taskDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={15} color="#7B2CBF" />
            <Text style={styles.detailText}>
              {formatDate(item.service?.date)} at {item.service?.time}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done" size={15} color="#10B981" />
            <Text style={styles.detailText}>
              Completed: {formatDate(item.confirmationDetails?.confirmedAt)}
            </Text>
          </View>
        </View>

        {/* Confirmation Status */}
        <View style={styles.confirmationStatus}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: hasConfirmation ? '#10B981' : '#EF4444' }]}>
              <Ionicons 
                name={hasConfirmation ? "checkmark-circle" : "close-circle"} 
                size={12} 
                color="white" 
              />
            </View>
            <Text style={styles.statusText}>
              Task Confirmation: {hasConfirmation ? 'Complete' : 'Missing'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: hasDeliveryConfirmation ? '#10B981' : '#F59E0B' }]}>
              <Ionicons 
                name={hasDeliveryConfirmation ? "checkmark-circle" : "time"} 
                size={12} 
                color="white" 
              />
            </View>
            <Text style={styles.statusText}>
              Delivery Confirmation: {hasDeliveryConfirmation ? 'Complete' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Media Preview */}
        {hasConfirmation && item.confirmationDetails.serviceImages?.length > 0 && (
          <View style={styles.mediaPreview}>
            <Text style={styles.mediaLabel}>Service Images ({item.confirmationDetails.serviceImages.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imageRow}>
                {item.confirmationDetails.serviceImages.slice(0, 3).map((imageUrl, index) => (
                  <Image key={index} source={{ uri: imageUrl }} style={styles.previewImage} />
                ))}
                {item.confirmationDetails.serviceImages.length > 3 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>+{item.confirmationDetails.serviceImages.length - 3}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.viewDetailsBtn} 
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye" size={16} color="#7B2CBF" />
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
          </TouchableOpacity>
          
          {item.financial && (
            <View style={styles.financialInfo}>
              <Text style={styles.financialText}>
                Total: ₦{item.financial.totalFee?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.financialSubtext}>
                Platform: ₦{item.financial.platformFee?.toLocaleString() || '0'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Task Completion Details</Text>
          <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {loadingDetails ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : taskDetails ? (
          <ScrollView style={styles.modalContent}>
            {/* Task Info */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Task Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Service</Text>
                  <Text style={styles.infoValue}>{taskDetails.service?.name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>{taskDetails.customer?.fullName}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Provider</Text>
                  <Text style={styles.infoValue}>{taskDetails.serviceProvider?.name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(taskDetails.service?.date)} at {taskDetails.service?.time}
                  </Text>
                </View>
              </View>
            </View>

            {/* Completion Details */}
            {taskDetails.confirmationDetails && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Service Completion</Text>
                <View style={styles.completionCard}>
                  <Text style={styles.completionLabel}>Declaration:</Text>
                  <Text style={styles.completionText}>
                    {taskDetails.confirmationDetails.serviceCompletionDeclaration}
                  </Text>
                  
                  {taskDetails.confirmationDetails.serviceComment && (
                    <>
                      <Text style={[styles.completionLabel, { marginTop: 12 }]}>Comments:</Text>
                      <Text style={styles.completionText}>
                        {taskDetails.confirmationDetails.serviceComment}
                      </Text>
                    </>
                  )}
                  
                  <Text style={styles.completionTime}>
                    Completed: {formatDate(taskDetails.confirmationDetails.confirmedAt)} at {formatTime(taskDetails.confirmationDetails.confirmedAt)}
                  </Text>
                </View>

                {/* Service Images */}
                {taskDetails.confirmationDetails.serviceImages?.length > 0 && (
                  <View style={styles.mediaSection}>
                    <Text style={styles.mediaTitle}>Service Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.imageGallery}>
                        {taskDetails.confirmationDetails.serviceImages.map((imageUrl, index) => (
                          <Image key={index} source={{ uri: imageUrl }} style={styles.galleryImage} />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Service Video */}
                {taskDetails.confirmationDetails.serviceVideoUrl && (
                  <View style={styles.mediaSection}>
                    <Text style={styles.mediaTitle}>Service Video</Text>
                    <View style={styles.videoPlaceholder}>
                      <Ionicons name="videocam" size={24} color="#7B2CBF" />
                      <Text style={styles.videoText}>Video Available</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Delivery Confirmation */}
            {taskDetails.deliveryConfirmation && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Delivery Confirmation</Text>
                <View style={styles.completionCard}>
                  <Text style={styles.completionLabel}>Satisfaction Declaration:</Text>
                  <Text style={styles.completionText}>
                    {taskDetails.deliveryConfirmation.satisfactionDeclaration}
                  </Text>
                  
                  <Text style={styles.completionTime}>
                    Confirmed: {formatDate(taskDetails.deliveryConfirmation.confirmedAt)} at {formatTime(taskDetails.deliveryConfirmation.confirmedAt)}
                  </Text>
                </View>
              </View>
            )}

            {/* Financial Details */}
            {taskDetails.financial && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Financial Information</Text>
                <View style={styles.financialCard}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Total Fee:</Text>
                    <Text style={styles.financialAmount}>₦{taskDetails.financial.totalFee?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Provider Fee:</Text>
                    <Text style={styles.financialAmount}>₦{taskDetails.financial.providerFee?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Platform Fee:</Text>
                    <Text style={styles.financialAmount}>₦{taskDetails.financial.platformFee?.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load task details</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="document-text" size={60} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Completed Tasks</Text>
      <Text style={styles.emptyMessage}>
        Completed service provider tasks will appear here with confirmation details.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Completed Tasks Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading completed tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Completed Tasks Report</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{completedTasks.length}</Text>
          <Text style={styles.summaryLabel}>Completed Tasks</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {completedTasks.filter(t => t.confirmationDetails).length}
          </Text>
          <Text style={styles.summaryLabel}>With Confirmation</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {completedTasks.filter(t => t.deliveryConfirmation).length}
          </Text>
          <Text style={styles.summaryLabel}>Delivery Confirmed</Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={completedTasks}
        renderItem={renderTaskCard}
        keyExtractor={item => item.taskId}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Details Modal */}
      {renderDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  summary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  customerName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  providerName: {
    fontSize: 13,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  taskId: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 3,
  },
  taskFee: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  taskDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  confirmationStatus: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  mediaPreview: {
    marginBottom: 10,
  },
  mediaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7B2CBF',
    marginBottom: 6,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  moreImagesOverlay: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  viewDetailsBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  financialInfo: {
    alignItems: 'flex-end',
  },
  financialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  financialSubtext: {
    fontSize: 11,
    color: '#6B7280',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
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
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoGrid: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  completionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  completionText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  completionTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  mediaSection: {
    marginTop: 16,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  imageGallery: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  videoPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  videoText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  financialCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  financialAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
  },
});

export default AdminCompletedTasksReportScreen;