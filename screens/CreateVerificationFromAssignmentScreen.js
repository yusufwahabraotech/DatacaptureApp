import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const CreateVerificationFromAssignmentScreen = ({ navigation, route }) => {
  const { assignment } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    assignmentId: assignment._id,
    country: assignment.organizationLocationDetails?.[0]?.country || '',
    state: assignment.organizationLocationDetails?.[0]?.state || '',
    lga: assignment.organizationLocationDetails?.[0]?.lga || '',
    city: assignment.organizationLocationDetails?.[0]?.city || '',
    cityRegion: assignment.organizationLocationDetails?.[0]?.cityRegion || '',
    
    organizationId: assignment.organizationId,
    organizationName: assignment.organizationName,
    targetUserId: assignment.targetUserId,
    targetUserFirstName: assignment.targetUserName?.split(' ')[0] || '',
    targetUserLastName: assignment.targetUserName?.split(' ').slice(1).join(' ') || '',
    
    organizationClaimedLocation: assignment.organizationLocationDetails?.[0] || {},
    
    organizationDetails: {
      name: assignment.organizationName,
      attachments: [],
      headquartersAddress: `${assignment.organizationLocationDetails?.[0]?.houseNumber || ''} ${assignment.organizationLocationDetails?.[0]?.street || ''}, ${assignment.organizationLocationDetails?.[0]?.cityRegion || ''}, ${assignment.organizationLocationDetails?.[0]?.city || ''}`.trim(),
      addressAttachments: []
    },
    
    buildingPictures: {},
    transportationCost: {}
  });

  const handleSubmit = async () => {
    if (!verificationData.organizationName) {
      Alert.alert('Error', 'Organization information is required');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.createVerificationFromAssignment(verificationData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Verification created successfully! Assignment status updated to in-progress.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Assignment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment Details</Text>
          <View style={styles.infoCard}>
            <Text style={styles.organizationName}>{assignment.organizationName}</Text>
            <Text style={styles.targetUser}>Target: {assignment.targetUserName}</Text>
            <Text style={styles.locationCount}>
              {assignment.organizationLocationDetails?.length || 0} location(s) to verify
            </Text>
          </View>
        </View>

        {/* Organization Claimed Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization's Claimed Locations</Text>
          <Text style={styles.sectionSubtitle}>
            Compare these claimed locations with your field findings
          </Text>
          
          {assignment.organizationLocationDetails?.map((location, index) => (
            <View key={index} style={styles.locationSummary}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationBrand}>{location.brandName}</Text>
                <View style={[
                  styles.locationTypeBadge,
                  location.locationType === 'headquarters' 
                    ? styles.headquartersBadge 
                    : styles.branchBadge
                ]}>
                  <Text style={styles.locationTypeText}>
                    {location.locationType}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationAddress}>
                {location.houseNumber} {location.street}, {location.cityRegion}
              </Text>
              <Text style={styles.locationCity}>
                {location.city}, {location.lga}, {location.state}
              </Text>
              {location.landmark && (
                <Text style={styles.locationLandmark}>
                  Landmark: {location.landmark}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Quick Action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Verification</Text>
          <Text style={styles.sectionSubtitle}>
            This will create a draft verification and mark the assignment as "in progress"
          </Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.startButtonText}>Create Draft Verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Draft Button */}
      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          This will create a draft verification that you can complete later
        </Text>
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
  locationCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  radioText: {
    fontSize: 14,
    color: '#1F2937',
  },
  locationSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  locationTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    color: 'white',
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationCity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  locationLandmark: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
    fontStyle: 'italic',
  },
  footerNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreateVerificationFromAssignmentScreen;