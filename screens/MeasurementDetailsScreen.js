import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { generateMeasurementsPDF, viewPDF } from '../utils/pdfGenerator';

const MeasurementDetailsScreen = ({ navigation, route }) => {
  const { measurementId, measurement: initialMeasurement } = route.params;
  const [measurement, setMeasurement] = useState(initialMeasurement);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    // Always fetch fresh data to ensure we have complete measurement details
    if (measurementId) {
      fetchMeasurementDetails();
    }
  }, [measurementId]);

  const fetchMeasurementDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching measurement details for ID:', measurementId);
      const response = await ApiService.getMeasurementById(measurementId);
      console.log('API Response:', response);
      
      if (response.success && response.data.measurement) {
        const measurementData = response.data.measurement;
        console.log('Measurement data received:', measurementData);
        console.log('Measurements object:', measurementData.measurements);
        setMeasurement(measurementData);
      } else {
        console.log('Failed to fetch measurement:', response.message);
        if (initialMeasurement) {
          console.log('Using initial measurement as fallback');
          setMeasurement(initialMeasurement);
        }
      }
    } catch (error) {
      console.log('Error fetching measurement details:', error);
      if (initialMeasurement) {
        console.log('Using initial measurement as fallback after error');
        setMeasurement(initialMeasurement);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !measurement) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Measurement Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading measurement details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurement Details</Text>
        <TouchableOpacity onPress={fetchMeasurementDetails} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Ionicons name="refresh" size={24} color="#7C3AED" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(measurement.userInfo?.fullName || measurement.userInfo?.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{measurement.userInfo?.fullName || 'Unknown User'}</Text>
              <Text style={styles.userEmail}>{measurement.userInfo?.email || 'No email'}</Text>
              <Text style={styles.userCustomId}>ID: {measurement.userInfo?.customUserId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Measurement Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <View style={[
                styles.typeBadge,
                {
                  backgroundColor: measurement.submissionType === 'AI' 
                    ? '#EDE9FE' 
                    : measurement.submissionType === 'Manual' 
                      ? '#FEF3C7' 
                      : '#ECFDF5'
                }
              ]}>
                <Text style={[
                  styles.typeBadgeText,
                  {
                    color: measurement.submissionType === 'AI' 
                      ? '#7C3AED' 
                      : measurement.submissionType === 'Manual' 
                        ? '#F59E0B' 
                        : '#10B981'
                  }
                ]}>
                  {measurement.submissionType || 'Manual'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(measurement.createdAt)}</Text>
            </View>
            {measurement.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{measurement.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <View style={styles.measurementHeader}>
            <Text style={styles.sectionTitle}>Body Measurements</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    setPdfGenerating(true);
                    const tableData = [
                      {
                        name: measurement.userInfo?.fullName || 'Unknown User',
                        type: 'Body',
                        ...Object.fromEntries(
                          Object.entries(measurement.measurements || {}).map(([key, value]) => [
                            key.toLowerCase(),
                            value
                          ])
                        )
                      }
                    ];
                    const uri = await generateMeasurementsPDF(tableData, {
                      fullName: measurement.userInfo?.fullName || 'Unknown User',
                      email: measurement.userInfo?.email || '',
                      customUserId: measurement.userInfo?.customUserId || ''
                    });
                    await viewPDF(uri);
                  } catch (err) {
                    console.log('Error generating PDF:', err);
                    Alert.alert('Error', 'Failed to generate measurement PDF');
                  } finally {
                    setPdfGenerating(false);
                  }
                }}
                disabled={pdfGenerating}
              >
                {pdfGenerating ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#7C3AED" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    setPdfGenerating(true);
                    const tableData = [
                      {
                        name: measurement.userInfo?.fullName || 'Unknown User',
                        type: 'Body',
                        ...Object.fromEntries(
                          Object.entries(measurement.measurements || {}).map(([key, value]) => [
                            key.toLowerCase(),
                            value
                          ])
                        )
                      }
                    ];
                    const uri = await generateMeasurementsPDF(tableData, {
                      fullName: measurement.userInfo?.fullName || 'Unknown User',
                      email: measurement.userInfo?.email || '',
                      customUserId: measurement.userInfo?.customUserId || ''
                    });
                    await viewPDF(uri);
                  } catch (err) {
                    console.log('Error sharing PDF:', err);
                    Alert.alert('Error', 'Failed to share measurement PDF');
                  } finally {
                    setPdfGenerating(false);
                  }
                }}
                disabled={pdfGenerating}
              >
                <Ionicons name="share-social-outline" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
          
          {measurement.sections && measurement.sections.length > 0 ? (
            measurement.sections.map((section, sIndex) => (
              <View key={`section-${sIndex}`} style={styles.sectionGroup}>
                <Text style={styles.sectionGroupTitle}>{section.sectionName || `Section ${sIndex + 1}`}</Text>
                <View style={styles.measurementsGrid}>
                  {section.measurements && section.measurements.map((m, mi) => (
                    <View key={`m-${mi}`} style={styles.measurementCard}>
                      <Text style={styles.measurementLabel}>{m.bodyPartName || m.name || m.key || 'Unknown'}</Text>
                      <Text style={styles.measurementValue}>{m.size || m.value || 0} {m.unit || 'cm'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : measurement.measurements && Object.keys(measurement.measurements).length > 0 ? (
            <View style={styles.measurementsGrid}>
              {Object.entries(measurement.measurements || {}).map(([key, value]) => (
                <View key={key} style={styles.measurementCard}>
                  <Text style={styles.measurementLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.measurementValue}>{value} cm</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No body measurement data available</Text>
              {measurement.submissionType === 'External' && measurement.originalMeasurementId && (
                <Text style={styles.noDataSubtext}>Original measurement ID: {measurement.originalMeasurementId}</Text>
              )}
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchMeasurementDetails}
              >
                <Text style={styles.retryButtonText}>Retry Loading Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userCustomId: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  measurementCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionGroup: {
    marginBottom: 20,
  },
  sectionGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MeasurementDetailsScreen;