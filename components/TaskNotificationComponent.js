import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const TaskNotificationComponent = ({ navigation, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is a service provider by role or isServiceProvider flag
    const isServiceProvider = user?.role === 'SERVICE_PROVIDER' || user?.isServiceProvider;
    
    if (isServiceProvider) {
      loadNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Get assigned tasks as notifications
      const response = await ApiService.getAssignedTasks();
      if (response.success) {
        const tasks = response.data.tasks || [];
        setNotifications(tasks);
        setUnreadCount(tasks.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationPress = () => {
    setShowModal(true);
  };

  const handleTaskPress = (task) => {
    setShowModal(false);
    navigation.navigate('ServiceProviderTaskDashboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleTaskPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>New Task Assignment</Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.assignedAt)}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>
          {item.serviceName} for {item.customerFirstName}
        </Text>
        <View style={styles.notificationDetails}>
          <Text style={styles.notificationDetail}>
            📅 {formatDate(item.date)} at {item.time}
          </Text>
          <Text style={styles.notificationDetail}>
            💰 ₦{item.fee?.toLocaleString()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const isServiceProvider = user?.isServiceProvider || user?.role === 'SERVICE_PROVIDER';
  
  if (!isServiceProvider || unreadCount === 0) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleNotificationPress}
      >
        <Ionicons name="notifications" size={20} color="#7B2CBF" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Notifications</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.taskId}
              style={styles.notificationsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off" size={48} color="#E5E7EB" />
                  <Text style={styles.emptyText}>No new notifications</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setShowModal(false);
                navigation.navigate('ServiceProviderTaskDashboard');
              }}
            >
              <Text style={styles.viewAllText}>View All Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  notificationDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  notificationDetail: {
    fontSize: 12,
    color: '#7B2CBF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  viewAllButton: {
    backgroundColor: '#7B2CBF',
    margin: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default TaskNotificationComponent;