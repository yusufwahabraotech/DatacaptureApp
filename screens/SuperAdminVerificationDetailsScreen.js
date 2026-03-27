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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SuperAdminVerificationDetailsScreen = ({ route, navigation }) => {
  const { verificationId } = route.params;
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationDetails();
  }, []);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching verification details for ID:', verificationId);
      
      const response = await ApiService.getSuperAdminVerificationDetails(verificationId);
      console.log('📥 Raw API response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const verificationData = response.data.verification;
        console.log('✅ Verification data received:', JSON.stringify(verificationData, null, 2));
        
        // Debug building pictures specifically
        if (verificationData.buildingPictures) {
          console.log('🖼️ Building pictures found:', JSON.stringify(verificationData.buildingPictures, null, 2));
          
          // Check each picture type
          Object.keys(verificationData.buildingPictures).forEach(key => {
            const picture = verificationData.buildingPictures[key];
            console.log(`📸 ${key}:`, picture);
            
            if (typeof picture === 'object' && picture.fileUrl) {
              console.log(`  - URL: ${picture.fileUrl}`);
              console.log(`  - Caption: ${picture.caption || 'No caption'}`);
            } else if (typeof picture === 'string') {
              console.log(`  - Direct URL: ${picture}`);
            } else {
              console.log(`  - Invalid format:`, typeof picture, picture);
            }
          });
        } else {
          console.log('❌ No buildingPictures found in verification data');
        }
        
        setVerification(verificationData);
      } else {
        console.log('❌ API response failed:', response.message);
        Alert.alert('Error', response.message || 'Failed to load verification details');
      }
    } catch (error) {
      console.log('💥 Exception in fetchVerificationDetails:', error);
      Alert.alert('Error', 'Failed to load verification details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'submitted': return '#3B82F6';
      case 'draft': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const openFile = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const reviewVerification = async (status, comments = '') => {
    try {
      const response = await ApiService.reviewVerification(verificationId, status, comments);
      if (response.success) {
        Alert.alert('Success', `Verification ${status} successfully`);
        fetchVerificationDetails();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to review verification');
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
          <ActivityIndicator size="large" color="#7C3AED" />
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
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
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
        {/* Status and Basic Info */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.verificationId}>{verification.verificationId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(verification.status) }]}>
              <Text style={styles.statusText}>{verification.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.verifierInfo}>Verified by: {verification.verifierName}</Text>
          <Text style={styles.dateInfo}>Created: {new Date(verification.createdAt).toLocaleDateString()}</Text>
          {verification.submittedAt && (
            <Text style={styles.dateInfo}>Submitted: {new Date(verification.submittedAt).toLocaleDateString()}</Text>
          )}
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.value}>{verification.country}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>State:</Text>
              <Text style={styles.value}>{verification.state}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>LGA:</Text>
              <Text style={styles.value}>{verification.lga}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.value}>{verification.city}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Region:</Text>
              <Text style={styles.value}>{verification.cityRegion}</Text>
            </View>
          </View>
        </View>

        {/* Organization Details */}
        {verification.organizationDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization Details</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{verification.organizationDetails.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{verification.organizationDetails.headquartersAddress}</Text>
              </View>
            </View>
            
            {verification.organizationDetails.attachments && verification.organizationDetails.attachments.length > 0 && (
              <View style={styles.attachmentsSection}>
                <Text style={styles.subSectionTitle}>Organization Attachments</Text>
                {verification.organizationDetails.attachments.map((attachment, index) => (
                  <TouchableOpacity key={index} style={styles.attachmentItem} onPress={() => openFile(attachment.fileUrl)}>
                    <Ionicons name="document" size={20} color="#3B82F6" />
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentComment}>{attachment.comments}</Text>
                      <Text style={styles.attachmentUrl}>Tap to view document</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {verification.organizationDetails.addressAttachments && verification.organizationDetails.addressAttachments.length > 0 && (
              <View style={styles.attachmentsSection}>
                <Text style={styles.subSectionTitle}>Address Attachments</Text>
                {verification.organizationDetails.addressAttachments.map((attachment, index) => (
                  <TouchableOpacity key={index} style={styles.attachmentItem} onPress={() => openFile(attachment.fileUrl)}>
                    <Ionicons name="document" size={20} color="#3B82F6" />
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentComment}>{attachment.comments}</Text>
                      <Text style={styles.attachmentUrl}>Tap to view document</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Building Pictures */}
        {verification.buildingPictures ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Pictures</Text>
            
            <View style={styles.picturesGrid}>
              {[
                { key: 'frontView', label: 'Front View of Building' },
                { key: 'streetPicture', label: 'Street Picture' },
                { key: 'agentInFrontBuilding', label: 'Agent in Front of Building' },
                { key: 'whatsappLocation', label: 'WhatsApp Location Screenshot' },
                { key: 'insideOrganization', label: 'Inside Organization' },
                { key: 'withStaffOrOwner', label: 'With Staff or Owner' },
                { key: 'videoWithNeighbor', label: 'Video with Neighbor' },
              ].map((pictureType) => {
                const picture = verification.buildingPictures[pictureType.key];
                
                let imageUrl = null;
                let caption = null;
                
                // Handle multiple possible formats from backend
                if (typeof picture === 'string' && picture.trim() !== '') {
                  imageUrl = picture;
                } else if (picture && typeof picture === 'object') {
                  imageUrl = picture.fileUrl || picture.url || picture.imageUrl || picture.secure_url;
                  caption = picture.caption || picture.comment;
                }
                
                // Skip if no valid URL
                if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'placeholder-url') {
                  return (
                    <View key={pictureType.key} style={styles.pictureContainer}>
                      <View style={styles.placeholderContainer}>
                        <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.placeholderText}>No image uploaded</Text>
                      </View>
                      <Text style={styles.pictureLabel}>{pictureType.label}</Text>
                    </View>
                  );
                }
                
                // Ensure URL is properly formatted
                if (!imageUrl.startsWith('http')) {
                  return (
                    <View key={pictureType.key} style={styles.pictureContainer}>
                      <View style={styles.placeholderContainer}>
                        <Ionicons name="warning" size={48} color="#F59E0B" />
                        <Text style={styles.placeholderText}>Invalid URL</Text>
                      </View>
                      <Text style={styles.pictureLabel}>{pictureType.label}</Text>
                    </View>
                  );
                }
                
                return (
                  <View key={pictureType.key} style={styles.pictureContainer}>
                    <TouchableOpacity onPress={() => openFile(imageUrl)} style={{ width: '100%' }}>
                      <View style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 8,
                        backgroundColor: '#F3F4F6',
                        overflow: 'hidden',
                      }}>
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 8,
                          }}
                          resizeMode="cover"
                          onError={(error) => {
                            console.log(`❌ Image failed to load: ${pictureType.key}`);
                            console.log(`❌ URL: ${imageUrl}`);
                            console.log(`❌ Error:`, error.nativeEvent);
                          }}
                          onLoad={() => {
                            console.log(`✅ Image rendered successfully: ${pictureType.key}`);
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.pictureLabel}>{pictureType.label}</Text>
                    {caption && (
                      <View style={styles.captionContainer}>
                        <Text style={styles.captionText}>{caption}</Text>
                      </View>
                    )}
                  </View>
                );
              }).filter(Boolean)}
            </View>
            
            {/* Show message if no valid pictures found */}
            {[
              'frontView', 'streetPicture', 'agentInFrontBuilding', 'whatsappLocation',
              'insideOrganization', 'withStaffOrOwner', 'videoWithNeighbor'
            ].every(key => {
              const picture = verification.buildingPictures[key];
              let imageUrl = null;
              if (typeof picture === 'string' && picture.trim() !== '') {
                imageUrl = picture;
              } else if (picture && typeof picture === 'object') {
                imageUrl = picture.fileUrl || picture.url || picture.imageUrl || picture.secure_url;
              }
              return !imageUrl || imageUrl.trim() === '' || imageUrl === 'placeholder-url' || !imageUrl.startsWith('http');
            }) && (
              <View style={styles.noPicturesContainer}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noPicturesText}>No building pictures available</Text>
                <Text style={styles.noPicturesSubText}>Pictures may still be uploading or were not provided</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Pictures</Text>
            <View style={styles.noPicturesContainer}>
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noPicturesText}>No building pictures section found</Text>
              <Text style={styles.noPicturesSubText}>Building pictures data is missing from verification</Text>
            </View>
          </View>
        )}

        {/* Transportation Cost */}
        {verification.transportationCost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transportation Details</Text>
            
            {verification.transportationCost.going && verification.transportationCost.going.length > 0 && (
              <View style={styles.transportSection}>
                <Text style={styles.subSectionTitle}>Journey Going</Text>
                {verification.transportationCost.going.map((journey, index) => (
                  <View key={index} style={styles.journeyItem}>
                    <Text style={styles.journeyText}>From: {journey.startPoint} → {journey.nextDestination}</Text>
                    <Text style={styles.journeyText}>Time: {journey.time} | Fare: ₦{journey.fareSpent}</Text>
                    <Text style={styles.journeyText}>Duration: {journey.timeSpent}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.transportSection}>
              <Text style={styles.subSectionTitle}>Final Destination</Text>
              <Text style={styles.journeyText}>Destination: {verification.transportationCost.finalDestination}</Text>
              <Text style={styles.journeyText}>Arrival Time: {verification.transportationCost.finalTime}</Text>
              <Text style={styles.journeyText}>Final Fare: ₦{verification.transportationCost.finalFareSpent}</Text>
              <Text style={styles.journeyText}>Total Journey Time: {verification.transportationCost.totalJourneyTime}</Text>
            </View>

            {verification.transportationCost.comingBack && (
              <View style={styles.transportSection}>
                <Text style={styles.subSectionTitle}>Return Journey</Text>
                <Text style={styles.journeyText}>Total Transportation: ₦{verification.transportationCost.comingBack.totalTransportationCost}</Text>
                <Text style={styles.journeyText}>Other Expenses: ₦{verification.transportationCost.comingBack.otherExpensesCost}</Text>
                {verification.transportationCost.comingBack.receiptUrl && (
                  <TouchableOpacity style={styles.receiptButton} onPress={() => openFile(verification.transportationCost.comingBack.receiptUrl)}>
                    <Ionicons name="receipt" size={16} color="#3B82F6" />
                    <Text style={styles.receiptText}>View Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {verification.status === 'submitted' && (
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => reviewVerification('approved', 'Verification approved by Super Admin')}
            >
              <Text style={styles.actionButtonText}>Approve Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => reviewVerification('rejected', 'Verification rejected by Super Admin')}
            >
              <Text style={styles.actionButtonText}>Reject Verification</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: '#1F2937',
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
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  verifierInfo: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  attachmentsSection: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  attachmentComment: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  attachmentUrl: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  picturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  pictureContainer: {
    width: '48%',
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 16,
  },
  picture: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  pictureLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  captionContainer: {
    marginTop: 6,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    width: '100%',
  },
  captionText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
  placeholderContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  debugSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    display: 'none', // Hide debug section in production
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#A16207',
    fontFamily: 'monospace',
  },
  noPicturesContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noPicturesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noPicturesSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  transportSection: {
    marginBottom: 16,
  },
  journeyItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  journeyText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  receiptText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 4,
  },
  actionSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SuperAdminVerificationDetailsScreen;