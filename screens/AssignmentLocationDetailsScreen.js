import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AssignmentLocationDetailsScreen = ({ navigation, route }) => {
  const { assignment } = route.params;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Details</Text>
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

          <View style={styles.infoCard}>
            <Text style={styles.organizationName}>{assignment.organizationName}</Text>
            <Text style={styles.targetUser}>Target: {assignment.targetUserName}</Text>
            <Text style={styles.assignedDate}>
              Assigned: {formatDate(assignment.assignedAt)}
            </Text>
          </View>
        </View>

        {/* Organization Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations to Verify</Text>
          <Text style={styles.sectionSubtitle}>
            Compare these claimed locations with your field findings
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
                <View style={styles.addressSection}>
                  <Text style={styles.addressTitle}>Address</Text>
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.addressText}>
                      {location.houseNumber} {location.street}
                    </Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Ionicons name="map" size={16} color="#6B7280" />
                    <Text style={styles.addressText}>
                      {location.cityRegion}, {location.city}
                    </Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Ionicons name="globe" size={16} color="#6B7280" />
                    <Text style={styles.addressText}>
                      {location.lga}, {location.state}, {location.country}
                    </Text>
                  </View>
                </View>

                {location.landmark && (
                  <View style={styles.addressSection}>
                    <Text style={styles.addressTitle}>Landmark</Text>
                    <View style={styles.addressRow}>
                      <Ionicons name="flag" size={16} color="#6B7280" />
                      <Text style={styles.addressText}>{location.landmark}</Text>
                    </View>
                  </View>
                )}

                {(location.buildingColor || location.buildingType) && (
                  <View style={styles.addressSection}>
                    <Text style={styles.addressTitle}>Building Details</Text>
                    <View style={styles.addressRow}>
                      <Ionicons name="business" size={16} color="#6B7280" />
                      <Text style={styles.addressText}>
                        {location.buildingColor} {location.buildingType}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        {assignment.status === 'pending' && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.startVerificationButton}
              onPress={() => navigation.navigate('CreateVerificationFromAssignment', {
                assignment: assignment
              })}
            >
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.startVerificationText}>Start Verification Process</Text>
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
    fontStyle: 'italic',
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
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  targetUser: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 4,
  },
  assignedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBrand: {
    fontSize: 16,
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
    textTransform: 'uppercase',
  },
  headquartersText: {
    color: 'white',
  },
  branchText: {
    color: 'white',
  },
  locationDetails: {
    gap: 12,
  },
  addressSection: {
    gap: 6,
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  startVerificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  startVerificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AssignmentLocationDetailsScreen;