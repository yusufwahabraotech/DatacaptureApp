import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminMeasurementsScreen = ({ navigation }) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    try {
      const response = await ApiService.getAdminMeasurements(1, 100);
      if (response.success) {
        setMeasurements(response.data.measurements);
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
    const name = (measurement.userInfo?.fullName || measurement.userInfo?.email || measurement.userInfo?.customUserId || '').toString();
    return name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Measurements</Text>
        <View style={styles.headerSpacer} />
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
          <Text style={styles.statValue}>{measurements.filter(m => m.submissionType === 'External').length}</Text>
          <Text style={styles.statLabel}>External</Text>
        </View>
      </View>

      {/* Measurements List */}
      <ScrollView style={styles.measurementsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          filteredMeasurements.map((measurement) => (
            <View key={measurement._id || measurement.id} style={styles.measurementCard}>
              <View style={styles.measurementHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(() => {
                        const display = (measurement.userInfo?.fullName || measurement.userInfo?.email || '').toString();
                        return display && display.length ? display.charAt(0).toUpperCase() : '?';
                      })()}
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
                          : measurement.submissionType === 'External'
                            ? '#ECFDF5'
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
                            : measurement.submissionType === 'External'
                              ? '#10B981'
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
                <Text style={styles.viewButtonText}>View Full Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
              </TouchableOpacity>
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
    marginBottom: 8,
  },
  measurementKey: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  measurementValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginRight: 4,
  },
});

export default AdminMeasurementsScreen;