import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const VerificationDetailsScreen = ({ route, navigation }) => {
  const { verificationId } = route.params;
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationDetails();
  }, []);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMyVerifications();
      if (response.success) {
        const foundVerification = response.data.verifications.find(
          v => v._id === verificationId
        );
        setVerification(foundVerification);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load verification details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading verification details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!verification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Verification not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon(verification.status)} 
              size={24} 
              color={getStatusColor(verification.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(verification.status) }]}>
              {verification.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.submittedDate}>
            Submitted: {new Date(verification.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Country:</Text>
            <Text style={styles.value}>{verification.location?.country}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>State:</Text>
            <Text style={styles.value}>{verification.location?.state}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>LGA:</Text>
            <Text style={styles.value}>{verification.location?.lga}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{verification.location?.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Region:</Text>
            <Text style={styles.value}>{verification.location?.cityRegion}</Text>
          </View>
        </View>

        {/* Organization Details */}
        {verification.organizationDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{verification.organizationDetails.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{verification.organizationDetails.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{verification.organizationDetails.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{verification.organizationDetails.contactPerson}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{verification.organizationDetails.phoneNumber}</Text>
            </View>
          </View>
        )}

        {/* Building Pictures */}
        {verification.buildingPictures && verification.buildingPictures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Pictures</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {verification.buildingPictures.map((picture, index) => (
                <View key={index} style={styles.pictureContainer}>
                  <Image source={{ uri: picture.url }} style={styles.picture} />
                  <Text style={styles.pictureLabel}>{picture.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Transportation Cost */}
        {verification.transportationCost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transportation Cost</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Amount:</Text>
              <Text style={styles.value}>₦{verification.transportationCost.amount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{verification.transportationCost.description}</Text>
            </View>
          </View>
        )}

        {/* Review Comments */}
        {verification.reviewComments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Comments</Text>
            <Text style={styles.comments}>{verification.reviewComments}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#F44336',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  submittedDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  pictureContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  picture: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  pictureLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  comments: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default VerificationDetailsScreen;