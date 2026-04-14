import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const TABS = [
  { id: 'assigned',  title: 'Assigned',  icon: 'notifications',    color: '#FF9800' },
  { id: 'accepted',  title: 'Accepted',  icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'rejected',  title: 'Rejected',  icon: 'close-circle',     color: '#F44336' },
  { id: 'completed', title: 'Completed', icon: 'trophy',           color: '#9C27B0' },
];

const ServiceProviderTaskDashboardScreen = ({ navigation }) => {
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [activeTab, setActiveTab]           = useState('assigned');
  const [allBookings, setAllBookings]       = useState([]);
  const [statistics, setStatistics]         = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask]     = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        ApiService.getMyBookings(),
        ApiService.getTaskStatistics(),
      ]);

      if (bookingsRes.success) {
        setAllBookings(bookingsRes.data.bookings || []);
        // Use summary from bookings response as fallback
        if (!statsRes.success) {
          setStatistics(bookingsRes.data.summary || null);
        }
      } else if (bookingsRes.message !== 'Service provider profile not found') {
        Alert.alert('Error', bookingsRes.message || 'Failed to load bookings');
      }

      if (statsRes.success) {
        setStatistics(statsRes.data.statistics || statsRes.data.summary || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const tasksForTab = allBookings.filter(b => {
    const status = (b.taskStatus || b.status || '').toLowerCase();
    return status === activeTab;
  });

  const handleAccept = (task) => {
    Alert.alert(
      'Accept Task',
      `Accept the ${task.serviceName} task for ${task.customerFirstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            const res = await ApiService.acceptTask(task.taskId);
            if (res.success) {
              // Merge revealed customer details back into local state
              setAllBookings(prev => prev.map(b =>
                b.taskId === task.taskId
                  ? { ...b, taskStatus: 'accepted', status: 'accepted', ...res.data.customerDetails && {
                      customerFullName: res.data.customerDetails.fullName,
                      customerEmail:    res.data.customerDetails.email,
                      customerPhone:    res.data.customerDetails.phone,
                    }}
                  : b
              ));
              Alert.alert('Success', res.message || 'Task accepted! Customer has been notified.');
              loadData();
            } else {
              Alert.alert('Error', res.message || 'Failed to accept task');
            }
          },
        },
      ]
    );
  };

  const handleReject = (task) => {
    setSelectedTask(task);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    const res = await ApiService.rejectTask(selectedTask.taskId, rejectionReason.trim());
    if (res.success) {
      setShowRejectModal(false);
      setSelectedTask(null);
      Alert.alert('Rejected', res.message || 'Task rejected. Admin has been notified.');
      loadData();
    } else {
      Alert.alert('Error', res.message || 'Failed to reject task');
    }
  };

  const handleComplete = (task) => {
    Alert.alert(
      'Complete Task',
      `Mark the ${task.serviceName} task as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            const res = await ApiService.completeTask(task.taskId);
            if (res.success) {
              Alert.alert('Success', 'Task marked as completed!');
              loadData();
            } else {
              Alert.alert('Error', res.message || 'Failed to complete task');
            }
          },
        },
      ]
    );
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  /* ── Statistics card ── */
  const renderStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Task Overview</Text>
      <View style={styles.statsGrid}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} style={styles.statItem} onPress={() => setActiveTab(tab.id)}>
            <View style={[styles.statIcon, { backgroundColor: tab.color }]}>
              <Ionicons name={tab.icon} size={20} color="white" />
            </View>
            <Text style={styles.statValue}>{statistics?.[tab.id] ?? 0}</Text>
            <Text style={styles.statLabel}>{tab.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /* ── Task card ── */
  const renderTask = ({ item }) => {
    const status = (item.taskStatus || item.status || '').toLowerCase();
    const locationText = typeof item.location === 'string'
      ? item.location
      : item.location?.address || 'Location TBD';

    return (
      <View style={styles.taskCard}>
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.customerName}>
              Customer: {item.customerFirstName}
              {item.customerId ? `  ·  ID: ${item.customerId}` : ''}
            </Text>
            {item.customerFullName && (
              <Text style={styles.customerFullName}>{item.customerFullName}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.taskId}>#{item.taskId?.slice(-6)}</Text>
            <Text style={styles.taskFee}>₦{item.fee?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.taskDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={15} color="#7B2CBF" />
            <Text style={styles.detailText}>{formatDate(item.date)} at {item.time}</Text>
          </View>
          {!!item.duration && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={15} color="#7B2CBF" />
              <Text style={styles.detailText}>{item.duration} minutes</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="location" size={15} color="#7B2CBF" />
            <Text style={styles.detailText} numberOfLines={2}>{locationText}</Text>
          </View>
        </View>

        {/* Customer contact — revealed after accept */}
        {status === 'accepted' && (item.customerEmail || item.customerPhone) && (
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Customer Contact</Text>
            {item.customerEmail && (
              <View style={styles.detailRow}>
                <Ionicons name="mail" size={15} color="#7B2CBF" />
                <Text style={styles.detailText}>{item.customerEmail}</Text>
              </View>
            )}
            {item.customerPhone && (
              <View style={styles.detailRow}>
                <Ionicons name="call" size={15} color="#7B2CBF" />
                <Text style={styles.detailText}>{item.customerPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {(item.canAccept ?? status === 'assigned') && (
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => handleAccept(item)}>
              <Ionicons name="checkmark" size={15} color="white" />
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          )}
          {(item.canReject ?? status === 'assigned') && (
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={15} color="white" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          )}
          {(item.canComplete ?? status === 'accepted') && (
            <TouchableOpacity style={[styles.btn, styles.completeBtn]} onPress={() => handleComplete(item)}>
              <Ionicons name="checkmark-done" size={15} color="white" />
              <Text style={styles.btnText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {status === 'rejected' && item.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionLabel}>Reason:</Text>
              <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
            </View>
          )}
          {status === 'completed' && (
            <View style={styles.completedBox}>
              <Text style={styles.completedText}>
                ✅ Completed {item.completedAt ? `on ${formatDate(item.completedAt)}` : ''}
              </Text>
              {item.settlementStatus && (
                <Text style={styles.settlementText}>Settlement: {item.settlementStatus}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name={TABS.find(t => t.id === activeTab)?.icon || 'document'} size={60} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No {activeTab} tasks</Text>
      <Text style={styles.emptyMsg}>
        {activeTab === 'assigned' ? 'New task assignments will appear here' : `No ${activeTab} tasks at the moment`}
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
          <Text style={styles.headerTitle}>My Tasks</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
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
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats */}
        {statistics && renderStats()}

        {/* Tabs */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
              {TABS.map(tab => {
                const count = statistics?.[tab.id] ?? 0;
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, active && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons name={tab.icon} size={15} color={active ? tab.color : '#9CA3AF'} />
                    <Text style={[styles.tabText, active && { color: tab.color }]}>{tab.title}</Text>
                    {count > 0 && (
                      <View style={[styles.badge, { backgroundColor: tab.color }]}>
                        <Text style={styles.badgeText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Task list */}
        <View style={{ padding: 16 }}>
          <FlatList
            data={tasksForTab}
            renderItem={renderTask}
            keyExtractor={item => item.taskId}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Reject modal */}
      <Modal visible={showRejectModal} transparent animationType="slide" onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Task</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>
                Please provide a reason for rejecting this task:
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="e.g., Not available at that time, Outside service area..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, !rejectionReason.trim() && styles.disabledBtn]}
                onPress={submitRejection}
                disabled={!rejectionReason.trim()}
              >
                <Text style={styles.submitBtnText}>Submit Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F9FAFB' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle:    { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:    { marginTop: 12, fontSize: 15, color: '#6B7280' },
  statsCard:      { backgroundColor: 'white', margin: 16, borderRadius: 12, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  statsTitle:     { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  statsGrid:      { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:       { alignItems: 'center' },
  statIcon:       { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue:      { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  statLabel:      { fontSize: 11, color: '#6B7280' },
  tabBar:         { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 5 },
  tabText:        { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
  badge:          { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  badgeText:      { fontSize: 10, fontWeight: '600', color: 'white' },
  taskCard:       { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  taskHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  serviceName:    { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 3 },
  customerName:   { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  customerFullName: { fontSize: 13, fontWeight: '500', color: '#7B2CBF' },
  taskId:         { fontSize: 11, color: '#9CA3AF', marginBottom: 3 },
  taskFee:        { fontSize: 15, fontWeight: '700', color: '#10B981' },
  taskDetails:    { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginBottom: 10, gap: 6 },
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailText:     { fontSize: 13, color: '#6B7280', flex: 1 },
  contactBox:     { backgroundColor: '#F3E8FF', borderRadius: 8, padding: 12, marginBottom: 10, gap: 6 },
  contactTitle:   { fontSize: 13, fontWeight: '600', color: '#7B2CBF', marginBottom: 4 },
  actions:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 4, flex: 1, justifyContent: 'center' },
  acceptBtn:      { backgroundColor: '#10B981' },
  rejectBtn:      { backgroundColor: '#EF4444' },
  completeBtn:    { backgroundColor: '#7B2CBF' },
  btnText:        { fontSize: 13, fontWeight: '600', color: 'white' },
  rejectionBox:   { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 },
  rejectionLabel: { fontSize: 11, fontWeight: '600', color: '#DC2626', marginBottom: 3 },
  rejectionText:  { fontSize: 13, color: '#1F2937' },
  completedBox:   { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10 },
  completedText:  { fontSize: 13, fontWeight: '500', color: '#15803D', marginBottom: 3 },
  settlementText: { fontSize: 11, color: '#6B7280' },
  empty:          { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:     { fontSize: 17, fontWeight: '600', color: '#1F2937', marginTop: 14, marginBottom: 6 },
  emptyMsg:       { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modal:          { backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 400 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle:     { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  reasonInput:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 15, color: '#1F2937', minHeight: 100 },
  modalActions:   { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  cancelBtn:      { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText:  { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  submitBtn:      { flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  disabledBtn:    { backgroundColor: '#D1D5DB' },
  submitBtnText:  { fontSize: 15, fontWeight: '600', color: 'white' },
});

export default ServiceProviderTaskDashboardScreen;
