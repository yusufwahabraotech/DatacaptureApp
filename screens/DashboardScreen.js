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
      const measurementsResponse = await ApiService.getManualMeasurements(1, 50);
      if (measurementsResponse.success) {
        const allMeasurements = measurementsResponse.data.measurements || [];
        setMeasurements(allMeasurements);
        
        const tableRows = allMeasurements.map(measurement => {
          const row = {
            name: `${measurement.firstName} ${measurement.lastName}`,
            type: measurement.submissionType || 'Manual',
            date: measurement.createdAt ? new Date(measurement.createdAt).toLocaleDateString() : 'N/A',
            checked: false,
            measurements: [] // Store individual measurements for this person
          };
          
          // Handle both AI and Manual measurements
          if (measurement.submissionType === 'AI' && measurement.measurements) {
            // For AI measurements, convert object to array format
            Object.entries(measurement.measurements).forEach(([key, value]) => {
              row.measurements.push({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: `${value}cm`
              });
            });
          } else if (measurement.sections) {
            // For manual measurements, use existing structure
            measurement.sections.forEach(section => {
              section.measurements?.forEach(bodyPart => {
                if (bodyPart.bodyPartName && bodyPart.size) {
                  row.measurements.push({
                    name: bodyPart.bodyPartName,
                    value: `${bodyPart.size}${bodyPart.unit || 'cm'}`
                  });
                }
              });
            });
          }
          
          return row;
        });
        
        setTableData(tableRows);
        setTableColumns([]); // No fixed columns needed
        
        // Update quick actions
        if (allMeasurements.length > 0) {
          const latestMeasurement = allMeasurements[0];
          const actions = [];
          
          // Handle both AI and Manual measurements for quick actions
          if (latestMeasurement.submissionType === 'AI' && latestMeasurement.measurements) {
            // For AI measurements, convert object to array format
            Object.entries(latestMeasurement.measurements).forEach(([key, value]) => {
              if (actions.length < 4) {
                actions.push({
                  name: key.charAt(0).toUpperCase() + key.slice(1),
                  size: `${value}cm`
                });
              }
            });
          } else if (latestMeasurement.sections) {
            // For manual measurements, use existing structure
            latestMeasurement.sections.forEach(section => {
              section.measurements?.forEach(bodyPart => {
                if (actions.length < 4) {
                  actions.push({
                    name: bodyPart.bodyPartName,
                    size: `${bodyPart.size}${bodyPart.unit || 'cm'}`
                  });
                }
              });
            });
          }
          
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

  const handleViewMeasurement = () => {
    if (selectedRowIndex !== null && measurements[selectedRowIndex]) {
      setSelectedMeasurement(measurements[selectedRowIndex]);
      setShowViewModal(true);
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
        {/* Admin Dashboard Navigation Message */}
        {user?.role === 'ORGANIZATION' && (
          <View style={styles.adminMessageContainer}>
            <View style={styles.adminMessageContent}>
              <Ionicons name="information-circle" size={20} color="#7C3AED" />
              <Text style={styles.adminMessageText}>
                You are currently viewing your personal dashboard. To access your organization's administrative dashboard with full management capabilities, please tap the Dashboard icon in the bottom navigation.
              </Text>
            </View>
          </View>
        )}

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
          {/* My Role Card - Only for org-users */}
          {user?.organizationId && (user?.role === 'ORGANIZATION' || user?.role === 'CUSTOMER') && (
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

          {/* One-Time Codes Card - Only for ORGANIZATION role */}
          {user?.role === 'ORGANIZATION' && (
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
          )}
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
                <Text style={[styles.tableHeaderText, styles.typeColumn]}>Type</Text>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.measurementsColumn]}>Measurements</Text>
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
                    <View style={[styles.typeBadge, row.type === 'AI' ? styles.aiBadge : styles.manualBadge]}>
                      <Text style={[styles.typeBadgeText, row.type === 'AI' ? styles.aiBadgeText : styles.manualBadgeText]}>
                        {row.type}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateColumn}>
                    <Text style={styles.tableCellText}>{row.date}</Text>
                  </View>
                  <View style={styles.measurementsColumn}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.measurementsList}>
                        {row.measurements?.map((measurement, mIndex) => (
                          <View key={mIndex} style={styles.measurementItem}>
                            <Text style={styles.measurementName}>{measurement.name}</Text>
                            <Text style={styles.measurementValue}>{measurement.value}</Text>
                          </View>
                        ))}
                        {(!row.measurements || row.measurements.length === 0) && (
                          <Text style={styles.noMeasurements}>No measurements</Text>
                        )}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={styles.actionColumn}>
                    <TouchableOpacity onPress={() => {
                      setSelectedRowIndex(index);
                      handleViewMeasurement();
                    }}>
                      <Text style={styles.viewMeasurementText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <BottomNavigation navigation={navigation} activeTab="Dashboard" />

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
  dateColumn: {
    width: 100,
    justifyContent: 'center',
    paddingRight: 16,
  },
  measurementColumn: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 16,
  },
  measurementsColumn: {
    width: 300,
    justifyContent: 'center',
    paddingRight: 16,
  },
  measurementsList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    alignItems: 'center',
  },
  measurementName: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  measurementValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  noMeasurements: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
  aiBadge: {
    backgroundColor: '#8B5CF6',
  },
  manualBadge: {
    backgroundColor: '#10B981',
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
  aiBadgeText: {
    color: 'white',
  },
  manualBadgeText: {
    color: 'white',
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
  viewMeasurementText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
});

export default DashboardScreen;