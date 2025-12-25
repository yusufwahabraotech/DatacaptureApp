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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const UserMeasurementsScreen = ({ navigation }) => {
  const [measurements, setMeasurements] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMeasurements = measurements.filter(measurement => {
    const name = (measurement.userInfo?.fullName || measurement.userInfo?.email || '').toString();
    return name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

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
        {hasPermission('create_measurements') && (
          <TouchableOpacity onPress={() => navigation.navigate('BodyMeasurement')}>
            <Ionicons name="add" size={24} color="#7C3AED" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search measurements..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
  headerSpacer: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 20,
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