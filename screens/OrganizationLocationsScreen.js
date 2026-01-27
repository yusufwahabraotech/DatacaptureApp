import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const OrganizationLocationsScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    loadProfile();
    
    // Reload profile when returning from AddLocationScreen
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    
    return unsubscribe;
  }, [navigation]);

  const getLocationStatusColor = (location) => {
    if (!location.isPaidFor) return '#F59E0B'; // Orange for pending payment
    if (location.verificationStatus === 'verified') return '#10B981'; // Green for verified
    if (location.verificationStatus === 'rejected') return '#EF4444'; // Red for rejected
    return '#F59E0B'; // Orange for pending verification
  };

  const getLocationStatusText = (location) => {
    if (!location.isPaidFor) return 'Pending Payment';
    if (location.verificationStatus === 'verified') return 'Verified';
    if (location.verificationStatus === 'rejected') return 'Rejected';
    return 'Pending Verification';
  };

  const loadProfile = async () => {
    try {
      const response = await ApiService.getOrganizationProfile();
      console.log('=== ORGANIZATION LOCATIONS PROFILE DEBUG ===');
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Handle different response structures
        if (response.data.profile) {
          console.log('Using response.data.profile');
          const profileData = response.data.profile;
          
          // Clean up locations data from Mongoose documents
          if (profileData.locations && profileData.locations.length > 0) {
            profileData.locations = profileData.locations.map(location => {
              // Extract clean data from Mongoose document
              return location._doc || location;
            });
          }
          
          setProfile(profileData);
        } else {
          console.log('Using response.data directly');
          setProfile(response.data);
        }
      } else {
        console.log('API response not successful:', response.message);
      }
      
      // Check if payment is required for verified badge
      const paymentResponse = await ApiService.checkVerifiedBadgePaymentRequired();
      if (paymentResponse.success) {
        setPaymentRequired(paymentResponse.data.paymentRequired || false);
        setVerificationStatus(paymentResponse.data.verificationStatus);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };



  const deleteLocation = (index) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteOrganizationLocation(index);
              if (response.success) {
                loadProfile();
                Alert.alert('Success', 'Location deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete location');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          },
        },
      ]
    );
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Locations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddLocation')}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {profile?.locations?.length > 0 ? (
          <>
            {profile.locations.map((location, index) => (
              <View key={index} style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationInfo}>
                    <View style={styles.locationNameRow}>
                      <Text style={styles.locationName}>{location.brandName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getLocationStatusColor(location) }]}>
                        <Text style={styles.statusText}>{getLocationStatusText(location)}</Text>
                      </View>
                    </View>
                    <Text style={styles.locationAddress}>
                      {location.houseNumber} {location.street}, {location.city}, {location.state}
                    </Text>
                    <Text style={styles.locationDescription}>
                      {location.locationType} • {location.lga} • {location.cityRegion}
                    </Text>
                    {location.landmark && (
                      <Text style={styles.locationLandmark}>Near: {location.landmark}</Text>
                    )}
                    <View style={styles.feeContainer}>
                      <Text style={styles.feeLabel}>Verification Fee:</Text>
                      <Text style={styles.feeAmount}>₦{location.cityRegionFee?.toLocaleString() || '0'}</Text>
                    </View>
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('AddLocation', { 
                        editingLocation: location, 
                        locationIndex: index 
                      })}
                    >
                      <Ionicons name="pencil" size={20} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteLocation(index)}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {/* Payment Summary Card - Only show if payment is required */}
            {paymentRequired && (
              <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Ionicons name="shield-checkmark" size={24} color="#7C3AED" />
                  <Text style={styles.paymentTitle}>Get Verified Badge</Text>
                </View>
                <Text style={styles.paymentDescription}>
                  Verify your organization to build trust with customers and get priority listing.
                </Text>
                
                <View style={styles.feeBreakdown}>
                  <Text style={styles.breakdownTitle}>Fee Breakdown:</Text>
                  {profile.locations.filter(location => !location.isPaidFor).map((location, index) => (
                    <View key={index} style={styles.breakdownItem}>
                      <Text style={styles.breakdownLocation}>{location.brandName} - {location.cityRegion}</Text>
                      <Text style={styles.breakdownAmount}>₦{location.cityRegionFee?.toLocaleString() || '0'}</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmount}>
                      ₦{profile.locations.filter(location => !location.isPaidFor).reduce((sum, loc) => sum + (loc.cityRegionFee || 0), 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.payButton}
                  onPress={() => navigation.navigate('VerifiedBadgePayment')}
                >
                  <Ionicons name="card" size={20} color="white" />
                  <Text style={styles.payButtonText}>Pay for Verification</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={80} color="#7C3AED" />
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>Add your organization locations to get started</Text>
            <Text style={styles.debugText}>Profile: {profile ? 'exists' : 'null'}</Text>
            <Text style={styles.debugText}>Locations: {profile?.locations?.length || 0}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfo: {
    flex: 1,
    marginRight: 15,
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  locationDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  locationLandmark: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  feeAmount: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  feeBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLocation: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  breakdownAmount: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
  },

});

export default OrganizationLocationsScreen;