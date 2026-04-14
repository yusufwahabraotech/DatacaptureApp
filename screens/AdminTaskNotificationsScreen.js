import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const TYPE_CONFIG = {
  task_accepted: { icon: 'checkmark-circle', color: '#10B981', label: 'Accepted' },
  task_rejected: { icon: 'close-circle', color: '#EF4444', label: 'Rejected' },
  task_completed: { icon: 'trophy', color: '#7B2CBF', label: 'Completed' },
  all_providers_rejected: { icon: 'warning', color: '#F59E0B', label: 'All Rejected' },
};

const formatCurrency = (amount) =>
  amount != null ? `₦${Number(amount).toLocaleString()}` : '—';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDetailModal = ({ notification, visible, onClose }) => {
  if (!notification) return null;
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.task_accepted;
  const d = notification.data || {};

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notification Detail</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: `${cfg.color}15` }]}>
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <Text style={styles.modalNotifTitle}>{notification.title}</Text>
          <Text style={styles.modalNotifMessage}>{notification.message}</Text>
          <Text style={styles.modalTimestamp}>{formatDate(notification.createdAt)}</Text>

          {/* all_providers_rejected — simple alert */}
          {notification.type === 'all_providers_rejected' && (
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.alertText}>
                All providers rejected task for "{d.serviceName}". Manual reassignment required.
              </Text>
            </View>
          )}

          {/* Provider info */}
          {d.provider && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Service Provider</Text>
              <DetailRow icon="person" label="Name" value={d.provider.name} />
              <DetailRow icon="mail" label="Email" value={d.provider.email} />
              <DetailRow icon="call" label="Phone" value={d.provider.phone} />
            </View>
          )}

          {/* Service info */}
          {d.service && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Service Details</Text>
              <DetailRow icon="briefcase" label="Service" value={d.service.name} />
              <DetailRow icon="calendar" label="Date" value={formatDate(d.service.date)} />
              <DetailRow icon="time" label="Time" value={d.service.time} />
              {d.service.duration != null && (
                <DetailRow icon="hourglass" label="Duration" value={`${d.service.duration} min`} />
              )}
              <DetailRow icon="location" label="Location" value={d.service.location} />
              {d.service.notes ? (
                <DetailRow icon="document-text" label="Notes" value={d.service.notes} />
              ) : null}
            </View>
          )}

          {/* Customer info */}
          {d.customer && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Customer</Text>
              <DetailRow icon="person-circle" label="Name" value={d.customer.fullName || d.customer.firstName} />
              {d.customer.email && <DetailRow icon="mail" label="Email" value={d.customer.email} />}
              {d.customer.phone && <DetailRow icon="call" label="Phone" value={d.customer.phone} />}
              <DetailRow icon="id-card" label="Customer ID" value={d.customer.customerId} />
            </View>
          )}

          {/* Financials */}
          {d.financials && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Financials</Text>
              <DetailRow icon="cash" label="Total Fee" value={formatCurrency(d.financials.totalFee)} />
              <DetailRow icon="wallet" label="Provider Fee" value={formatCurrency(d.financials.providerFee)} />
              {d.financials.settlementStatus && (
                <DetailRow icon="checkmark-done" label="Settlement" value={d.financials.settlementStatus} />
              )}
            </View>
          )}

          {/* Rejection reason */}
          {d.rejectionReason && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rejection Reason</Text>
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionText}>{d.rejectionReason}</Text>
              </View>
            </View>
          )}

          {/* Task ID */}
          {d.taskId && (
            <Text style={styles.taskId}>Task ID: {d.taskId}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#7B2CBF" style={styles.detailIcon} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

const AdminTaskNotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications(1, false);
    loadUnreadCount();
  }, [unreadOnly]);

  const loadUnreadCount = async () => {
    const res = await ApiService.getAdminNotificationUnreadCount();
    if (res.success) setUnreadCount(res.data.unreadCount || 0);
  };

  const loadNotifications = async (pageNum = 1, append = false) => {
    if (pageNum === 1 && !append) setLoading(true);
    const res = await ApiService.getAdminNotifications({ page: pageNum, limit: 20, unreadOnly });
    if (res.success) {
      const list = res.data.notifications || [];
      setNotifications(append ? (prev) => [...prev, ...list] : list);
      setUnreadCount(res.data.unreadCount ?? unreadCount);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setPage(pageNum);
    }
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, false);
    loadUnreadCount();
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    loadNotifications(page + 1, true);
  };

  const openNotification = async (item) => {
    setSelectedNotif(item);
    if (!item.isRead) {
      await ApiService.markAdminNotificationRead(item._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const res = await ApiService.markAllAdminNotificationsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } else {
      Alert.alert('Error', res.message || 'Failed to mark all as read');
    }
    setMarkingAll(false);
  };

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task_accepted;
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => openNotification(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}15` }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </TouchableOpacity>
    );
  };

  const renderFooter = () =>
    loadingMore ? <ActivityIndicator size="small" color="#7B2CBF" style={{ marginVertical: 16 }} /> : null;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>{unreadOnly ? 'No Unread Notifications' : 'No Notifications'}</Text>
      <Text style={styles.emptyMessage}>
        {unreadOnly
          ? 'All caught up! Switch to "All" to see past notifications.'
          : 'Provider activity notifications will appear here.'}
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
          <Text style={styles.headerTitle}>Task Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Task Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Filter + Mark All */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, !unreadOnly && styles.filterBtnActive]}
            onPress={() => setUnreadOnly(false)}
          >
            <Text style={[styles.filterBtnText, !unreadOnly && styles.filterBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, unreadOnly && styles.filterBtnActive]}
            onPress={() => setUnreadOnly(true)}
          >
            <Text style={[styles.filterBtnText, unreadOnly && styles.filterBtnTextActive]}>
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} disabled={markingAll} style={styles.markAllBtn}>
            {markingAll
              ? <ActivityIndicator size="small" color="#7B2CBF" />
              : <Text style={styles.markAllText}>Mark all read</Text>}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7B2CBF" />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      <NotificationDetailModal
        notification={selectedNotif}
        visible={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterBtnActive: { backgroundColor: '#7B2CBF' },
  filterBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterBtnTextActive: { color: 'white' },
  markAllBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markAllText: { fontSize: 13, color: '#7B2CBF', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#7B2CBF' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1, marginRight: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B2CBF',
    marginLeft: 6,
  },
  cardMessage: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 4 },
  cardTime: { fontSize: 11, color: '#9CA3AF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
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
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  modalBody: { flex: 1, padding: 20 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  typeBadgeText: { fontSize: 14, fontWeight: '700' },
  modalNotifTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  modalNotifMessage: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 6 },
  modalTimestamp: { fontSize: 12, color: '#9CA3AF', marginBottom: 20 },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7B2CBF', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  detailIcon: { marginRight: 8, marginTop: 1 },
  detailLabel: { fontSize: 13, color: '#6B7280', width: 80 },
  detailValue: { flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '500' },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectionText: { fontSize: 14, color: '#991B1B', lineHeight: 20 },
  taskId: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 20 },
});

export default AdminTaskNotificationsScreen;
