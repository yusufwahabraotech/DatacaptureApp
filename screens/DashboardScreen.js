import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorialModal from './TutorialModal';
import ViewMeasurementModal from './ViewMeasurementModal';
import BottomNavigation from '../components/BottomNavigation';
import { generateMeasurementsPDF, viewPDF } from '../utils/pdfGenerator';
import ApiService from '../services/api';

const DashboardScreen = ({ navigation, route }) => {
  const [quickActions, setQuickActions] = useState([]);

  const [tableData, setTableData] = useState([
    { name: 'Emmanuel', type: 'Body', chestLength: 36, hipsHeight: 35, legs: 28, checked: false },
    { name: 'Tobi Wale', type: 'Body', chestLength: 32, hipsHeight: 30, legs: 25, checked: false },
    { name: 'Ada Uzo', type: 'Body', chestLength: 38, hipsHeight: 36, legs: 30, checked: false },
    { name: 'Dispatch', type: 'Object', chestLength: 40, hipsHeight: 38, legs: 32, checked: false },
    { name: 'My Box', type: 'Object', chestLength: 35, hipsHeight: 33, legs: 27, checked: true },
    { name: 'Favour Alo', type: 'Body', chestLength: 42, hipsHeight: 40, legs: 34, checked: false },
  ]);

  const [showActionModal, setShowActionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showTutorial, setShowTutorial] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    bodyMeasurements: 0,
    objectMeasurements: 0,
    questionnaires: 0,
    oneTimeCodes: 0
  });
  const [measurements, setMeasurements] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardData();
    // Show tutorial only when coming from signup (not login)
    if (route.params?.showTutorial && route.params?.fromSignup) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [route.params]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchUserProfile();
    setRefreshing(false);
  };

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      console.log('=== DASHBOARD DEBUG ===');
      // Use dashboard stats endpoint that includes one-time codes data
      const statsResponse = await ApiService.getDashboardStats();
      console.log('Dashboard stats response:', statsResponse);
      
      if (statsResponse.success) {
        const stats = statsResponse.data;
        console.log('Dashboard stats data:', stats);
        console.log('One-time codes generated:', stats.oneTimeCodesGenerated);
        
        setDashboardData({
          bodyMeasurements: stats.totalMeasurements || 0,
          objectMeasurements: 0,
          questionnaires: 0,
          oneTimeCodes: stats.oneTimeCodesGenerated || 0
        });
        
        console.log('Set dashboard data with oneTimeCodes:', stats.oneTimeCodesGenerated || 0);
      } else {
        console.log('Dashboard stats failed:', statsResponse.message);
      }

      // Still fetch measurements for table display
      const measurementsResponse = await ApiService.getManualMeasurements();
      if (measurementsResponse.success) {
        const allMeasurements = measurementsResponse.data.measurements || [];
        setMeasurements(allMeasurements);
        
        // Get unique body parts for table columns
        const bodyPartsSet = new Set();
        allMeasurements.forEach(measurement => {
          measurement.sections?.forEach(section => {
            section.measurements?.forEach(bodyPart => {
              bodyPartsSet.add(bodyPart.bodyPartName);
            });
          });
        });
        
        const uniqueBodyParts = Array.from(bodyPartsSet).slice(0, 3);
        setTableColumns(uniqueBodyParts);
        
        const tableRows = allMeasurements.map(measurement => {
          const row = {
            name: `${measurement.firstName} ${measurement.lastName}`,
            type: 'Body',
            checked: false
          };
          
          uniqueBodyParts.forEach(bodyPartName => {
            row[bodyPartName] = getBodyPartSize(measurement, bodyPartName);
          });
          
          return row;
        });
        
        setTableData(tableRows);
        
        // Update quick actions
        if (allMeasurements.length > 0) {
          const latestMeasurement = allMeasurements[0];
          const actions = [];
          
          latestMeasurement.sections?.forEach(section => {
            section.measurements?.forEach(bodyPart => {
              if (actions.length < 4) {
                actions.push({
                  name: bodyPart.bodyPartName,
                  size: `${bodyPart.size}${bodyPart.unit || 'cm'}`
                });
              }
            });
          });
          
          setQuickActions(actions);
        }
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
      setDashboardData({
        bodyMeasurements: 0,
        objectMeasurements: 0,
        questionnaires: 0,
        oneTimeCodes: 0
      });
    }
  };

  const getBodyPartSize = (measurement, bodyPartName) => {
    const target = (bodyPartName || '').toString();
    for (const section of measurement.sections || []) {
      for (const bodyPart of section.measurements || []) {
        const bpName = (bodyPart?.bodyPartName || '').toString();
        if (bpName.toLowerCase().includes(target.toLowerCase())) {
          return `${bodyPart.size}${bodyPart.unit || 'cm'}`;
        }
      }
    }
    return '-';
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token:', token);
      
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await ApiService.getUserProfile();
      console.log('Profile response:', response);
      
      if (response.success) {
        setUser(response.data.user);
      } else {
        console.log('Profile fetch failed:', response.message);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const handleMenuPress = (event, rowIndex) => {
    const { pageX, pageY } = event.nativeEvent;
    setModalPosition({ x: pageX - 90, y: pageY - 50 });
    setSelectedRowIndex(rowIndex);
    setShowActionModal(true);
  };

  const handleViewMeasurement = () => {
    if (selectedRowIndex !== null && measurements[selectedRowIndex]) {
      setSelectedMeasurement(measurements[selectedRowIndex]);
      setShowViewModal(true);
      setShowActionModal(false);
    }
  };

  const toggleCheckbox = (index) => {
    setTableData(prevData => 
      prevData.map((item, i) => 
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleExportPDF = async () => {
    try {
      Alert.alert(
        'Generating PDF...',
        'Please wait while we generate your measurement report.',
        [{ text: 'OK' }]
      );

      const pdfUri = await generateMeasurementsPDF(tableData, user);
      
      Alert.alert(
        'PDF Generated Successfully!',
        'Your measurement report is ready. Tap "View PDF" to open it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View PDF', 
            onPress: async () => {
              try {
                await viewPDF(pdfUri);
              } catch (error) {
                Alert.alert('Error', 'Could not open PDF viewer');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.fullName || 'User'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? '#9CA3AF' : '#7C3AED'} 
            />
          </TouchableOpacity>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
          </View>
          <TouchableOpacity 
            style={styles.profileImage}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <View key={index} style={styles.quickActionButton}>
                <Text style={styles.quickActionSize}>{action.size}</Text>
                <Text style={styles.quickActionName}>{action.name}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color="#7C3AED" />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Measurement Cards */}
        <View style={styles.cardsContainer}>
          {/* My Role Card - Only for org-users with permissions */}
          {user?.organizationId && (user?.role === 'ORGANIZATION' || (user?.permissions && user.permissions.length > 0)) && (
            <TouchableOpacity 
              style={[styles.card, styles.roleCard]}
              onPress={() => navigation.navigate('UserSettings')}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>My Role & Permissions</Text>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <Text style={styles.cardValue}>{user?.role === 'ORGANIZATION' ? 'Admin' : 'Organization User'}</Text>
              <View style={styles.createNewButton}>
                <Text style={styles.createNew}>View Details</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.card, styles.bodyCard]}
            onPress={() => navigation.navigate('BodyMeasurement')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total Body Measurement</Text>
              <Ionicons name="body" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.cardValue}>{dashboardData.bodyMeasurements}</Text>
            <View style={styles.createNewButton}>
              <Text style={styles.createNew}>Create New</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.objectCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total Object Measurement</Text>
              <Ionicons name="cube" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.cardValue}>{dashboardData.objectMeasurements}</Text>
            <View style={styles.createNewButton}>
              <Text style={styles.createNew}>Create New</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.questionnaireCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total Questionnaire</Text>
              <Ionicons name="document-text" size={24} color="#EC4899" />
            </View>
            <Text style={styles.cardValue}>{dashboardData.questionnaires}</Text>
            <View style={styles.createNewButton}>
              <Text style={styles.createNew}>Create New</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.codesCard]}
            onPress={() => navigation.navigate('OneTimeCodes')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>One-Time Codes</Text>
              <Ionicons name="key" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.cardValue}>{dashboardData.oneTimeCodes || 0}</Text>
            <View style={styles.createNewButton}>
              <Text style={styles.createNew}>Generate New</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Total Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleContainer}>
              <Text style={styles.summaryTitle}>Total Summary</Text>
              <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
              <Ionicons name="share-outline" size={16} color="#7C3AED" />
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.checkboxColumn}>
                  <Ionicons name="checkbox-outline" size={16} color="#9CA3AF" />
                </View>
                <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                <Text style={[styles.tableHeaderText, styles.typeColumn]}>Measurement Type</Text>
                {tableColumns.map((columnName, index) => (
                  <View key={index} style={styles.measurementColumn}>
                    <Text style={styles.tableHeaderText}>
                      {columnName}
                    </Text>
                  </View>
                ))}
                <View style={styles.actionColumn}></View>
              </View>
              {tableData.map((row, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <TouchableOpacity 
                    style={styles.checkboxColumn}
                    onPress={() => toggleCheckbox(index)}
                  >
                    {row.checked ? (
                      <View style={styles.checkedBox}>
                        <Ionicons 
                          name="checkmark" 
                          size={12} 
                          color="white" 
                        />
                      </View>
                    ) : (
                      <Ionicons 
                        name="square-outline" 
                        size={16} 
                        color="#9CA3AF" 
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.nameColumn}>
                    <Text style={styles.tableCellText}>{row.name}</Text>
                  </View>
                  <View style={styles.typeColumn}>
                    <View style={[styles.typeBadge, row.type === 'Body' ? styles.bodyBadge : styles.objectBadge]}>
                      <Text style={[styles.typeBadgeText, row.type === 'Body' ? styles.bodyBadgeText : styles.objectBadgeText]}>
                        {row.type}
                      </Text>
                    </View>
                  </View>
                  {tableColumns.map((columnName, colIndex) => (
                    <View key={colIndex} style={styles.measurementColumn}>
                      <Text style={styles.tableCellText}>
                        {row[columnName] || '-'}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.actionColumn}>
                    <TouchableOpacity onPress={(event) => handleMenuPress(event, index)}>
                      <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.pagination}>
            <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
            <Text style={styles.paginationText}>1 of 3</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </ScrollView>

      <BottomNavigation navigation={navigation} activeTab="Dashboard" />

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
            <TouchableOpacity style={styles.menuItem} onPress={handleViewMeasurement}>
              <Text style={styles.menuItemText}>View Measurement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Edit Measurement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* View Measurement Modal */}
      <ViewMeasurementModal 
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        measurementData={selectedMeasurement}
      />

      {/* Tutorial Modal */}
      <TutorialModal 
        visible={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  quickActionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F5F3FF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
  },
  quickActionsContainer: {
    flex: 1,
  },
  quickActionButton: {
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  quickActionSize: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  quickActionName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  copyButton: {
    padding: 8,
    alignItems: 'center',
  },
  copyText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  bodyCard: {
    backgroundColor: '#F5F3FF',
  },
  objectCard: {
    backgroundColor: '#FFF9F0',
  },
  questionnaireCard: {
    backgroundColor: '#FFF0F5',
  },
  roleCard: {
    backgroundColor: '#ECFDF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  createNewButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  createNew: {
    fontSize: 14,
    color: '#7C3AED',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  table: {
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
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameColumn: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 16,
  },
  typeColumn: {
    width: 140,
    justifyContent: 'center',
    paddingRight: 16,
  },
  measurementColumn: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 16,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  checkbox: {
    marginRight: 8,
  },
  tableCellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
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
  },
  bodyBadgeText: {
    color: 'white',
  },
  objectBadgeText: {
    color: 'white',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 16,
  },

  centerText: {
    textAlign: 'center',
  },
  checkedBox: {
    width: 16,
    height: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
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

export default DashboardScreen;