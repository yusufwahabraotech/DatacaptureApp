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

const AssignmentDetailsScreen = ({ navigation, route }) => {
  const { assignmentId } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignmentDetails();
  }, []);

  const fetchAssignmentDetails = async () => {
    try {
      const response = await ApiService.getVerificationAssignmentDetails(assignmentId);
      if (response.success) {
        setAssignment(response.data.assignment);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load assignment details');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assignment Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assignment Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Assignment not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Assignment Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assignment Overview</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(assignment.status) }
            ]}>
              <Text style={styles.statusText}>{assignment.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organization:</Text>
            <Text style={styles.infoValue}>{assignment.organizationName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned to:</Text>
            <Text style={styles.infoValue}>{assignment.userName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target User:</Text>
            <Text style={styles.infoValue}>{assignment.targetUserName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Email:</Text>
            <Text style={styles.infoValue}>{assignment.targetUserEmail}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Date:</Text>
            <Text style={styles.infoValue}>{formatDate(assignment.assignedAt)}</Text>
          </View>
        </View>

        {/* Organization Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Locations</Text>
          <Text style={styles.sectionSubtitle}>
            {assignment.organizationLocationDetails?.length || 0} location(s) to verify
          </Text>

          {assignment.organizationLocationDetails?.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationBrand}>{location.brandName}</Text>
                <View style={[
                  styles.locationTypeBadge,
                  location.locationType === 'headquarters' 
                    ? styles.headquartersBadge 
                    : styles.branchBadge
                ]}>
                  <Text style={[
                    styles.locationTypeText,
                    location.locationType === 'headquarters' 
                      ? styles.headquartersText 
                      : styles.branchText
                  ]}>
                    {location.locationType}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDetails}>
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.addressText}>
                    {location.houseNumber} {location.street}, {location.cityRegion}
                  </Text>
                </View>

                <View style={styles.addressRow}>
                  <Ionicons name="map" size={16} color="#6B7280" />
                  <Text style={styles.addressText}>
                    {location.city}, {location.lga}, {location.state}, {location.country}
                  </Text>
                </View>

                {location.landmark && (
                  <View style={styles.addressRow}>
                    <Ionicons name="flag" size={16} color="#6B7280" />
                    <Text style={styles.addressText}>{location.landmark}</Text>
                  </View>
                )}

                {location.buildingColor && (
                  <View style={styles.addressRow}>
                    <Ionicons name="color-palette" size={16} color="#6B7280" />
                    <Text style={styles.addressText}>
                      {location.buildingColor} {location.buildingType}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        {assignment.status === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Delete Assignment',
                  'Are you sure you want to delete this assignment?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const response = await ApiService.deleteVerificationAssignment(assignmentId);
                          if (response.success) {
                            Alert.alert('Success', 'Assignment deleted successfully', [
                              { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                          } else {
                            Alert.alert('Error', response.message);
                          }
                        } catch (error) {
                          Alert.alert('Error', 'Failed to delete assignment');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Delete Assignment</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  locationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headquartersBadge: {
    backgroundColor: '#10B981',
  },
  branchBadge: {
    backgroundColor: '#3B82F6',
  },
  locationTypeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  headquartersText: {
    color: 'white',
  },
  branchText: {
    color: 'white',
  },
  locationDetails: {
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AssignmentDetailsScreen;