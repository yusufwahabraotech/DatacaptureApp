import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminDashboardScreen = ({ navigation }) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const [allMeasurements] = useState([
    { id: 1, userName: 'Emmanuel', type: 'Body', bodyPart: 'Chest', measurement: '36cm', date: '2024-01-15' },
    { id: 2, userName: 'Tobi Wale', type: 'Body', bodyPart: 'Waist', measurement: '32cm', date: '2024-01-14' },
    { id: 3, userName: 'Ada Uzo', type: 'Object', bodyPart: 'Package', measurement: '40x30cm', date: '2024-01-13' },
    { id: 4, userName: 'Favour Alo', type: 'Body', bodyPart: 'Hips', measurement: '38cm', date: '2024-01-12' },
  ]);

  const handleMenuPress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setModalPosition({ x: pageX - 90, y: pageY - 50 });
    setShowActionModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <View style={styles.headerRight}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.profileImage}>
            <Text style={styles.profileText}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Admin Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="body" size={24} color="#10B981" />
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Measurements</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Questionnaires</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Questionnaire')}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Create Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.actionButtonText}>Manage Users</Text>
          </TouchableOpacity>
        </View>

        {/* All Measurements Table */}
        <View style={styles.measurementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All User Measurements</Text>
            <TouchableOpacity>
              <Ionicons name="download-outline" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.userColumn]}>User</Text>
                <Text style={[styles.tableHeaderText, styles.typeColumn]}>Type</Text>
                <Text style={[styles.tableHeaderText, styles.bodyPartColumn]}>Body Part</Text>
                <Text style={[styles.tableHeaderText, styles.measurementColumn]}>Measurement</Text>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
                <View style={styles.actionColumn}></View>
              </View>
              {allMeasurements.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, styles.userColumn]}>{item.userName}</Text>
                  <View style={styles.typeColumn}>
                    <View style={[styles.typeBadge, item.type === 'Body' ? styles.bodyBadge : styles.objectBadge]}>
                      <Text style={styles.typeBadgeText}>{item.type}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCellText, styles.bodyPartColumn]}>{item.bodyPart}</Text>
                  <Text style={[styles.tableCellText, styles.measurementColumn]}>{item.measurement}</Text>
                  <Text style={[styles.tableCellText, styles.dateColumn]}>{item.date}</Text>
                  <TouchableOpacity style={styles.actionColumn} onPress={handleMenuPress}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#7C3AED" />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Questionnaire')}
        >
          <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <View style={[styles.actionMenu, { left: modalPosition.x - 120, top: modalPosition.y }]}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  measurementsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  table: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  userColumn: {
    flex: 1.5,
  },
  typeColumn: {
    flex: 1,
  },
  bodyPartColumn: {
    flex: 1.2,
  },
  measurementColumn: {
    flex: 1.2,
  },
  dateColumn: {
    flex: 1,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bodyBadge: {
    backgroundColor: '#7C3AED',
  },
  objectBadge: {
    backgroundColor: '#F59E0B',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  activeNavText: {
    color: '#7C3AED',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  deleteText: {
    color: '#EF4444',
  },
});

export default AdminDashboardScreen;