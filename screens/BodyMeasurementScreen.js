import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import BottomNavigation from '../components/BottomNavigation';
import ApiService from '../services/api';

const BodyMeasurementScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectedMeasurements, setSelectedMeasurements] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchUserProfile();
    fetchMeasurements();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMeasurements();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const fetchMeasurements = async () => {
    try {
      console.log('=== FETCH MEASUREMENTS DEBUG START ===');
      
      // Try multiple endpoints to see what data is available
      const endpoints = [
        { name: 'getMyMeasurements', method: () => ApiService.getMyMeasurements() },
        { name: 'getMeasurements', method: () => ApiService.getMeasurements() },
        { name: 'getManualMeasurements', method: () => ApiService.getManualMeasurements() }
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\n=== TESTING ${endpoint.name} ===`);
          const response = await endpoint.method();
          console.log(`${endpoint.name} success:`, response.success);
          console.log(`${endpoint.name} count:`, response.data?.measurements?.length || 0);
          if (response.success && response.data?.measurements) {
            response.data.measurements.forEach((m, i) => {
              console.log(`  ${i}: ${m.submissionType || 'unknown'} - ${m.firstName} ${m.lastName}`);
            });
          }
        } catch (error) {
          console.log(`${endpoint.name} error:`, error.message);
        }
      }
      
      // Use the primary method
      const response = await ApiService.getMyMeasurements();
      if (response.success) {
        console.log('=== DETAILED MEASUREMENT STRUCTURE DEBUG ===');
        console.log('Total measurements:', response.data.measurements?.length || 0);
        response.data.measurements?.forEach((measurement, index) => {
          console.log(`\n--- Measurement ${index} ---`);
          console.log('ID:', measurement.id);
          console.log('Name:', measurement.firstName, measurement.lastName);
          console.log('Type:', measurement.submissionType);
          console.log('Has AI measurements:', !!measurement.measurements);
          console.log('Has sections:', !!measurement.sections);
          
          if (measurement.submissionType === 'Manual' && measurement.sections) {
            console.log('MANUAL MEASUREMENT SECTIONS:');
            measurement.sections.forEach((section, sIndex) => {
              console.log(`  Section ${sIndex}:`, section.sectionName || 'No name');
              if (section.measurements) {
                section.measurements.forEach((bodyPart, bIndex) => {
                  console.log(`    ${bIndex}: ${bodyPart.bodyPartName} = ${bodyPart.size}cm`);
                });
              }
            });
          }
          
          if (measurement.submissionType === 'AI' && measurement.measurements) {
            console.log('AI MEASUREMENT DATA:');
            Object.entries(measurement.measurements).forEach(([key, value]) => {
              console.log(`  ${key}: ${value}cm`);
            });
          }
          
          // Check if manual measurement has AI data mixed in
          if (measurement.submissionType === 'Manual' && measurement.measurements) {
            console.log('⚠️  MANUAL MEASUREMENT HAS AI DATA:');
            Object.entries(measurement.measurements).forEach(([key, value]) => {
              console.log(`  AI Data: ${key}: ${value}cm`);
            });
          }
        });
        setMeasurements(response.data.measurements || []);
      }
    } catch (error) {
      console.log('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeasurementSelection = (id) => {
    setSelectedMeasurements(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleShare = async (measurement) => {
    Alert.alert(
      'Share Measurement',
      'Choose how you want to share this measurement:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share to Organization', onPress: () => shareToOrganization(measurement) },
        { text: 'Share to Others', onPress: () => shareToOthers(measurement) }
      ]
    );
  };

  const handleDelete = async (measurement) => {
    Alert.alert(
      'Delete Measurement',
      'Are you sure you want to delete this measurement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(measurement.id);
              const response = await ApiService.deleteMeasurement(measurement.id);
              if (response.success) {
                // Immediately remove from local state for instant feedback
                setMeasurements(prev => prev.filter(m => m.id !== measurement.id));
                Alert.alert('Success', 'Measurement deleted successfully!');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete measurement');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete measurement. Please try again.');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const shareToOrganization = (measurement) => {
    setCurrentMeasurement(measurement);
    setOneTimeCode('');
    setShowCodeModal(true);
  };

  const handleShareWithCode = async () => {
    if (!oneTimeCode || oneTimeCode.trim().length === 0) {
      Alert.alert('Error', 'Please enter a valid code');
      return;
    }
    
    try {
      const response = await ApiService.shareToOrganization(currentMeasurement.id, oneTimeCode.trim());
      if (response.success) {
        Alert.alert('Success', 'Measurement shared to organization successfully!');
        setShowCodeModal(false);
        setOneTimeCode('');
        setCurrentMeasurement(null);
      } else {
        Alert.alert('Error', response.message || 'Failed to share measurement');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share measurement. Please check your code and try again.');
    }
  };

  const shareToOthers = async (measurement) => {
    try {
      const allBodyParts = [];
      
      // Handle both AI and Manual measurements
      if (measurement.submissionType === 'AI' && measurement.measurements) {
        // For AI measurements, convert object to array format
        Object.entries(measurement.measurements).forEach(([key, value]) => {
          allBodyParts.push({
            bodyPartName: key.charAt(0).toUpperCase() + key.slice(1),
            size: parseFloat(value)
          });
        });
      } else if (measurement.sections) {
        // For manual measurements, use existing structure
        measurement.sections.forEach(section => {
          section.measurements?.forEach(bodyPart => {
            allBodyParts.push(bodyPart);
          });
        });
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Body Measurement Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #7C3AED; padding-bottom: 20px; }
            .title { color: #7C3AED; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .person-info { background: #F5F3FF; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .measurements { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            .measurement-row { display: flex; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #F3F4F6; }
            .measurement-row:last-child { border-bottom: none; }
            .measurement-label { font-weight: 500; color: #6B7280; }
            .measurement-value { font-weight: 600; color: #1F2937; }
            .footer { text-align: center; margin-top: 40px; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Body Measurement Report</div>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="person-info">
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> ${measurement.firstName} ${measurement.lastName}</p>
            <p><strong>Date:</strong> ${new Date(measurement.createdAt).toLocaleDateString()}</p>
            <p><strong>Measurement Type:</strong> ${measurement.submissionType === 'AI' ? 'AI Scan' : 'Manual'}</p>
          </div>

          <div class="measurements">
            ${allBodyParts.map(bodyPart => `
              <div class="measurement-row">
                <span class="measurement-label">${bodyPart.bodyPartName}:</span>
                <span class="measurement-value">${bodyPart.size.toFixed(2)} cm</span>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>This report was generated by Vestradat</p>
            <p>© ${new Date().getFullYear()} Vestradat. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Body Measurement Report'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share measurement report. Please try again.');
    }
  };
  const filteredMeasurements = measurements.filter(measurement => {
    const matchesSearch = !searchQuery || 
      (measurement.firstName && measurement.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (measurement.lastName && measurement.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'AI' && measurement.submissionType === 'AI') ||
      (typeFilter === 'manual' && measurement.submissionType !== 'AI');
    
    const measurementDate = new Date(measurement.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && measurementDate >= today) ||
      (dateFilter === 'week' && measurementDate >= weekAgo) ||
      (dateFilter === 'month' && measurementDate >= monthAgo);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const handleDownload = async (measurement) => {
    try {
      Alert.alert(
        'Downloading PDF...',
        'Please wait while we generate your measurement report.',
        [{ text: 'OK' }]
      );

      const allBodyParts = [];
      
      // Handle both AI and Manual measurements
      if (measurement.submissionType === 'AI' && measurement.measurements) {
        // For AI measurements, convert object to array format
        Object.entries(measurement.measurements).forEach(([key, value]) => {
          allBodyParts.push({
            bodyPartName: key.charAt(0).toUpperCase() + key.slice(1),
            size: parseFloat(value)
          });
        });
      } else if (measurement.sections) {
        // For manual measurements, use existing structure
        measurement.sections.forEach(section => {
          section.measurements?.forEach(bodyPart => {
            allBodyParts.push(bodyPart);
          });
        });
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Body Measurement Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #7C3AED; padding-bottom: 20px; }
            .title { color: #7C3AED; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .person-info { background: #F5F3FF; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .measurements { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            .measurement-row { display: flex; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #F3F4F6; }
            .measurement-row:last-child { border-bottom: none; }
            .measurement-label { font-weight: 500; color: #6B7280; }
            .measurement-value { font-weight: 600; color: #1F2937; }
            .footer { text-align: center; margin-top: 40px; color: #374151; font-size: 14px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Body Measurement Report</div>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="person-info">
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> ${measurement.firstName} ${measurement.lastName}</p>
            <p><strong>Date:</strong> ${new Date(measurement.createdAt).toLocaleDateString()}</p>
            <p><strong>Measurement Type:</strong> ${measurement.submissionType === 'AI' ? 'AI Scan' : 'Manual'}</p>
          </div>

          <div class="measurements">
            ${allBodyParts.map(bodyPart => `
              <div class="measurement-row">
                <span class="measurement-label">${bodyPart.bodyPartName}:</span>
                <span class="measurement-value">${bodyPart.size.toFixed(2)} cm</span>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>This report was generated by Vestradat</p>
            <p>© ${new Date().getFullYear()} Vestradat. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      
      Alert.alert(
        'PDF Downloaded Successfully!',
        'Your measurement report is ready. Tap "View PDF" to open it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View PDF', 
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'View Body Measurement Report'
                  });
                }
              } catch (error) {
                Alert.alert('Error', 'Could not open PDF viewer');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search measurements..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>
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

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <View style={styles.filterOptions}>
              {['all', 'AI', 'manual'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, typeFilter === type && styles.filterChipActive]}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text style={[styles.filterChipText, typeFilter === type && styles.filterChipTextActive]}>
                    {type === 'all' ? 'All' : type === 'AI' ? 'AI Scan' : 'Manual'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date:</Text>
            <View style={styles.filterOptions}>
              {['all', 'today', 'week', 'month'].map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.filterChip, dateFilter === date && styles.filterChipActive]}
                  onPress={() => setDateFilter(date)}
                >
                  <Text style={[styles.filterChipText, dateFilter === date && styles.filterChipTextActive]}>
                    {date === 'all' ? 'All Time' : date === 'today' ? 'Today' : date === 'week' ? 'This Week' : 'This Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Page Title */}
      <Text style={styles.pageTitle}>Body Measurement</Text>

      {/* Quick Actions */}
      {measurements.length > 0 && (
        <View style={styles.quickActionsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsContainer}>
            {(() => {
              const allBodyParts = [];
              measurements.forEach(measurement => {
                // Handle both AI and Manual measurements
                if (measurement.submissionType === 'AI' && measurement.measurements) {
                  // For AI measurements, convert object to array format
                  Object.entries(measurement.measurements).forEach(([key, value]) => {
                    allBodyParts.push({
                      bodyPartName: key.charAt(0).toUpperCase() + key.slice(1),
                      size: parseFloat(value)
                    });
                  });
                } else if (measurement.sections) {
                  // For manual measurements, use existing structure
                  measurement.sections.forEach(section => {
                    section.measurements?.forEach(bodyPart => {
                      allBodyParts.push(bodyPart);
                    });
                  });
                }
              });
              return allBodyParts.slice(0, 4).map((bodyPart, index) => (
                <View key={index} style={styles.quickActionButton}>
                  <Text style={styles.quickActionSize}>{bodyPart.size.toFixed(0)}cm</Text>
                  <Text style={styles.quickActionName}>{bodyPart.bodyPartName}</Text>
                </View>
              ));
            })()}
          </ScrollView>
          <TouchableOpacity style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color="#7C3AED" />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overview Section */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>Overview</Text>
        <TouchableOpacity 
          style={styles.createNewButtonRounded}
          onPress={() => navigation.navigate('TakeNewMeasurement')}
        >
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.createNewText}>Create New</Text>
        </TouchableOpacity>
      </View>

        {/* Content */}
        <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading measurements...</Text>
          </View>
        ) : filteredMeasurements.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="document-outline" size={80} color="#C4B5FD" />
              <Text style={styles.emptyStateTitle}>No measurements recorded yet!</Text>
              <Text style={styles.emptyStateSubtext}>
                There is nothing to view right now. Create a body measurement to see here
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.measurementsContainer}>
            {filteredMeasurements.map((measurement) => {
              const allBodyParts = [];
              if (measurement.submissionType === 'AI') {
                // For AI measurements, convert object to array format
                Object.entries(measurement.measurements || {}).forEach(([key, value]) => {
                  allBodyParts.push({
                    bodyPartName: key.charAt(0).toUpperCase() + key.slice(1),
                    size: parseFloat(value)
                  });
                });
              } else {
                // For manual measurements, use existing structure
                measurement.sections?.forEach(section => {
                  section.measurements?.forEach(bodyPart => {
                    allBodyParts.push(bodyPart);
                  });
                });
              }

              return (
                <View key={measurement.id} style={styles.measurementCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Body Part Measurement:</Text>
                    <View style={styles.cardHeaderActions}>
                      <TouchableOpacity 
                        style={[styles.deleteButton, deleting === measurement.id && styles.deletingButton]}
                        onPress={() => handleDelete(measurement)}
                        disabled={deleting === measurement.id}
                      >
                        {deleting === measurement.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Text style={styles.seeLessText}>See less</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>
                      {measurement.firstName && measurement.lastName 
                        ? `${measurement.firstName} ${measurement.lastName}` 
                        : measurement.submissionType === 'AI' && user?.fullName
                        ? user.fullName
                        : 'Unknown User'}
                    </Text>
                    <Text style={styles.measurementDate}>{new Date(measurement.createdAt).toLocaleDateString()}</Text>
                    <View style={styles.measurementTypeBadge}>
                      <Text style={styles.measurementTypeText}>
                        {measurement.submissionType === 'AI' ? 'AI Scan' : 'Manual'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.measurementsList}>
                    {allBodyParts.map((bodyPart, bodyPartIndex) => (
                      <View key={bodyPartIndex}>
                        <View style={styles.measurementRow}>
                          <Text style={styles.measurementLabel}>{bodyPart.bodyPartName}:</Text>
                          <Text style={styles.measurementValue}>{bodyPart.size.toFixed(2)} cm</Text>
                        </View>
                        {bodyPartIndex < allBodyParts.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(measurement)}>
                      <Ionicons name="share-outline" size={16} color="#7C3AED" style={{ marginRight: 8 }} />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.downloadButtonCard} onPress={() => handleDownload(measurement)}>
                      <Ionicons name="download-outline" size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.downloadButtonText}>Download PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <BottomNavigation navigation={navigation} activeTab="BodyMeasurement" />
      
      {/* One-Time Code Modal */}
      <Modal
        visible={showCodeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share to Organization</Text>
            <Text style={styles.modalSubtitle}>Enter the one-time code provided by the organization:</Text>
            
            <TextInput
              style={styles.codeInput}
              placeholder="Enter code"
              value={oneTimeCode}
              onChangeText={setOneTimeCode}
              keyboardType="numeric"
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCodeModal(false);
                  setOneTimeCode('');
                  setCurrentMeasurement(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shareModalButton}
                onPress={handleShareWithCode}
              >
                <Text style={styles.shareModalButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
    paddingHorizontal: 12,
    marginRight: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
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
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 24,
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
  overviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  createNewButtonRounded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  createNewText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  measurementsContainer: {
    paddingHorizontal: 20,
  },
  measurementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  deletingButton: {
    opacity: 0.5,
  },
  seeLessText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  personInfo: {
    marginBottom: 20,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  measurementDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  measurementsList: {
    marginBottom: 20,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  measurementLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  measurementValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  shareButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButtonCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  checkboxColumn: {
    width: 50,
    alignItems: 'center',
  },
  nameColumn: {
    width: 140,
    paddingRight: 16,
  },
  sectionColumn: {
    width: 120,
    paddingRight: 16,
  },
  bodyPartColumn: {
    width: 150,
    paddingRight: 16,
  },
  sizeColumn: {
    width: 80,
    paddingRight: 16,
    alignItems: 'center',
  },
  dateColumn: {
    width: 100,
    paddingRight: 16,
  },
  statusColumn: {
    width: 100,
    paddingRight: 16,
  },
  actionColumn: {
    width: 100,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  sizeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  checkedBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  submittedBadge: {
    backgroundColor: '#D1FAE5',
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  submittedText: {
    color: '#065F46',
  },
  draftText: {
    color: '#92400E',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  downloadText: {
    fontSize: 12,
    color: '#7C3AED',
    marginLeft: 4,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  shareModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  shareModalButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  measurementTypeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  measurementTypeText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});

export default BodyMeasurementScreen;