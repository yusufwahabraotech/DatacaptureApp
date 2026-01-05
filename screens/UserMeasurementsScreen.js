import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ApiService from '../services/api';

const UserMeasurementsScreen = ({ navigation }) => {
  const [measurements, setMeasurements] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  useEffect(() => {
    fetchMeasurements();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await ApiService.getMyPermissions();
      if (response.success) {
        setPermissions(response.data.permissions || []);
      }
    } catch (error) {
      console.log('Error fetching permissions:', error);
    }
  };

  const hasPermission = (permissionKey) => {
    return permissions.some(p => p.key === permissionKey || p === permissionKey);
  };

  const fetchMeasurements = async () => {
    try {
      const response = await ApiService.getMyMeasurements();
      if (response.success) {
        setMeasurements(response.data.measurements || []);
      }
    } catch (error) {
      console.log('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportAll = async () => {
    if (measurements.length === 0) {
      Alert.alert('No Data', 'No measurements to export');
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>My Measurements Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #7C3AED; padding-bottom: 20px; }
            .title { color: #7C3AED; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #7C3AED; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { text-align: center; margin-top: 40px; color: #374151; font-size: 14px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">My Measurements Report</div>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Records: ${measurements.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Date</th>
                <th>Measurements</th>
              </tr>
            </thead>
            <tbody>
              ${measurements.map(measurement => {
                let measurementText = 'No measurements';
                
                // Try different possible data structures
                if (measurement.sections && Array.isArray(measurement.sections)) {
                  const allMeasurements = [];
                  measurement.sections.forEach(section => {
                    if (section.measurements && Array.isArray(section.measurements)) {
                      section.measurements.forEach(m => {
                        allMeasurements.push(`${m.bodyPartName}: ${m.size}cm`);
                      });
                    }
                  });
                  if (allMeasurements.length > 0) {
                    measurementText = allMeasurements.join(', ');
                  }
                } else if (measurement.measurements && typeof measurement.measurements === 'object') {
                  const entries = Object.entries(measurement.measurements);
                  if (entries.length > 0) {
                    measurementText = entries.map(([key, value]) => `${key}: ${value}cm`).join(', ');
                  }
                } else if (measurement.bodyParts && Array.isArray(measurement.bodyParts)) {
                  measurementText = measurement.bodyParts.map(bp => `${bp.name || bp.bodyPartName}: ${bp.size || bp.value}cm`).join(', ');
                } else if (measurement.data && typeof measurement.data === 'object') {
                  const entries = Object.entries(measurement.data);
                  if (entries.length > 0) {
                    measurementText = entries.map(([key, value]) => `${key}: ${value}cm`).join(', ');
                  }
                }
                
                return `
                <tr>
                  <td>${measurement.userInfo?.fullName || measurement.userInfo?.email || 'Unknown'}</td>
                  <td>${measurement.submissionType || 'Manual'}</td>
                  <td>${new Date(measurement.createdAt).toLocaleDateString()}</td>
                  <td>${measurementText}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
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
          dialogTitle: 'Export My Measurements'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export measurements');
    }
  };

  const filteredMeasurements = measurements.filter(measurement => {
    const name = (measurement.userInfo?.fullName || measurement.userInfo?.email || '').toString();
    const matchesSearch = name.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(measurement.submissionType);
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const showMeasurementActions = (measurement) => {
    const actions = [];
    
    if (hasPermission('edit_measurements')) {
      actions.push({ text: 'Edit Measurement', onPress: () => editMeasurement(measurement) });
    }
    
    if (hasPermission('delete_measurements')) {
      actions.push({ text: 'Delete Measurement', style: 'destructive', onPress: () => confirmDeleteMeasurement(measurement) });
    }
    
    actions.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert('Measurement Actions', 'Select an action', actions);
  };

  const editMeasurement = (measurement) => {
    // Navigate to edit screen or show edit modal
    Alert.alert('Edit Measurement', 'Edit functionality would be implemented here');
  };

  const confirmDeleteMeasurement = (measurement) => {
    Alert.alert(
      'Delete Measurement',
      'Are you sure you want to delete this measurement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMeasurement(measurement._id || measurement.id) }
      ]
    );
  };

  const deleteMeasurement = async (measurementId) => {
    try {
      const response = await ApiService.deleteOrgMeasurement(measurementId);
      if (response.success) {
        Alert.alert('Success', 'Measurement deleted successfully');
        fetchMeasurements();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete measurement');
      }
    } catch (error) {
      console.log('Error deleting measurement:', error);
      Alert.alert('Error', 'Failed to delete measurement');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurements</Text>
        <View style={styles.headerActions}>
          {hasPermission('create_measurements') && (
            <TouchableOpacity onPress={() => navigation.navigate('AdminCreateMeasurement')} style={styles.createButton}>
              <Ionicons name="add" size={20} color="#7C3AED" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleExportAll} style={styles.exportButton}>
            <Ionicons name="download" size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search measurements..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilters.length > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="filter" size={20} color={selectedFilters.length > 0 ? "#FFFFFF" : "#7C3AED"} />
          {selectedFilters.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{measurements.length}</Text>
          <Text style={styles.statLabel}>Total Measurements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{measurements.filter(m => m.submissionType === 'AI').length}</Text>
          <Text style={styles.statLabel}>AI Generated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{measurements.filter(m => m.submissionType === 'Manual').length}</Text>
          <Text style={styles.statLabel}>Manual</Text>
        </View>
      </View>

      {/* Measurements List */}
      <ScrollView style={styles.measurementsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : filteredMeasurements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="body" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No measurements found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'No measurements available'}
            </Text>
          </View>
        ) : (
          filteredMeasurements.map((measurement) => (
            <View key={measurement._id || measurement.id} style={styles.measurementCard}>
              <View style={styles.measurementHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(measurement.userInfo?.fullName || measurement.userInfo?.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{measurement.userInfo?.fullName || measurement.userInfo?.email || 'Unknown'}</Text>
                    <Text style={styles.userCustomId}>{measurement.userInfo?.customUserId || '-'}</Text>
                  </View>
                </View>
                <View style={styles.measurementMeta}>
                  <View style={[
                    styles.typeBadge,
                    {
                      backgroundColor: measurement.submissionType === 'AI' 
                        ? '#EDE9FE' 
                        : measurement.submissionType === 'Manual' 
                          ? '#FEF3C7' 
                          : '#F3F4F6'
                    }
                  ]}>
                    <Text style={[
                      styles.typeBadgeText,
                      {
                        color: measurement.submissionType === 'AI' 
                          ? '#7C3AED' 
                          : measurement.submissionType === 'Manual' 
                            ? '#F59E0B' 
                            : '#6B7280'
                      }
                    ]}>
                      {measurement.submissionType}
                    </Text>
                  </View>
                  <Text style={styles.measurementDate}>
                    {formatDate(measurement.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Measurement Preview */}
              <View style={styles.measurementPreview}>
                {Object.entries(measurement.measurements || {}).slice(0, 4).map(([key, value], index) => (
                  <View key={`${measurement._id || measurement.id}-${key}-${index}`} style={styles.measurementItem}>
                    <Text style={styles.measurementKey}>{key}:</Text>
                    <Text style={styles.measurementValue}>{value}cm</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => {
                  navigation.navigate('MeasurementDetails', { 
                    measurementId: measurement._id || measurement.id,
                    measurement: measurement
                  });
                }}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
              </TouchableOpacity>
              
              {(hasPermission('edit_measurements') || hasPermission('delete_measurements')) && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => showMeasurementActions(measurement)}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color="#7C3AED" />
                  <Text style={styles.actionButtonText}>Actions</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter by Type</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {['AI', 'Manual', 'External'].map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilters.includes(filter) && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleFilter(filter)}
                >
                  <View style={[
                    styles.filterCheckbox,
                    selectedFilters.includes(filter) && styles.filterCheckboxSelected
                  ]}>
                    {selectedFilters.includes(filter) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilters.includes(filter) && styles.filterOptionTextSelected
                  ]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilter(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterOptions: {
    marginBottom: 24,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  filterOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCheckboxSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  filterOptionTextSelected: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  measurementsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  measurementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userCustomId: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  measurementMeta: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  measurementDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  measurementPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  measurementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 4,
  },
  measurementKey: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  measurementValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginRight: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 4,
  },
});

export default UserMeasurementsScreen;