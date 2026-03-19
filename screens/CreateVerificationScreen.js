import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const CreateVerificationScreen = ({ navigation }) => {
  const [assignedLocations, setAssignedLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Assignment data
    assignmentId: '',
    selectedLocationId: '', // Add specific location ID for selection
    selectedLocationIndex: 0,
    
    // Location data (what field agent actually found)
    country: '',
    state: '',
    lga: '',
    city: '',
    cityRegion: '',
    
    // Organization data (auto-filled)
    organizationId: '',
    organizationName: '',
    targetUserId: '',
    targetUserFirstName: '',
    targetUserLastName: '',
    
    // Organization claimed location (what organization says)
    organizationClaimedLocation: {},
    
    // Organization Details
    headquartersAddress: '',
    
    // Building Pictures with captions
    frontView: { fileUrl: '', caption: '' },
    streetPicture: { fileUrl: '', caption: '' },
    agentInFrontBuilding: { fileUrl: '', caption: '' },
    whatsappLocation: { fileUrl: '', caption: '' },
    insideOrganization: { fileUrl: '', caption: '' },
    withStaffOrOwner: { fileUrl: '', caption: '' },
    videoWithNeighbor: { fileUrl: '', caption: '' },
    
    // Transportation
    transportationSteps: [{ startPoint: '', time: '', nextDestination: '', fareSpent: 0, timeSpent: '' }],
    finalDestination: '',
    finalFareSpent: 0,
    finalTime: '',
    totalJourneyTime: '',
    totalTransportationCost: 0,
    otherExpensesCost: 0,
  });

  const steps = [
    { title: 'Select Location', icon: 'location' },
    { title: 'Details', icon: 'document-text' },
    { title: 'Organization Details', icon: 'business' },
    { title: 'Pictures', icon: 'camera' },
    { title: 'Transportation', icon: 'car' },
  ];

  useEffect(() => {
    fetchAssignedLocations();
  }, []);

  const fetchAssignedLocations = async () => {
    try {
      console.log('🚨 FETCHING ASSIGNED LOCATIONS - NEW ENDPOINT 🚨');
      const response = await ApiService.getMyAssignedLocations();
      
      if (response.success) {
        console.log('✅ NEW ENDPOINT SUCCESS');
        console.log('Total locations:', response.data.total);
        console.log('Locations data:', JSON.stringify(response.data.locations, null, 2));
        
        // Remove duplicates based on organization + brand + location type combination
        const uniqueLocations = [];
        const seenLocations = new Set();
        
        response.data.locations.forEach((location, index) => {
          // Create a unique identifier for deduplication
          const locationKey = `${location.organizationId}-${location.brandName}-${location.locationType}-${location.cityRegion}-${location.city}`;
          
          if (!seenLocations.has(locationKey)) {
            seenLocations.add(locationKey);
            
            // Create truly unique key using index to handle duplicate location data
            location.uniqueKey = `location-${uniqueLocations.length}-${location.assignmentId}-${Date.now()}`;
            // Also create a unique selection ID that includes the index
            location.uniqueSelectionId = `${location.locationId || 'loc'}-${uniqueLocations.length}-${location.assignmentId}`;
            
            uniqueLocations.push(location);
          }
        });
        
        // Set the deduplicated locations
        setAllLocations(uniqueLocations);
        
        // Extract unique organizations for display purposes
        const uniqueOrgs = [];
        const orgMap = new Map();
        
        uniqueLocations.forEach((location) => {
          if (!orgMap.has(location.organizationId)) {
            orgMap.set(location.organizationId, {
              _id: location.assignmentId,
              organizationId: location.organizationId,
              organizationName: location.organizationName,
              targetUserId: location.targetUserId,
              targetUserName: location.targetUserName,
              targetUserEmail: location.targetUserEmail,
              status: location.assignmentStatus
            });
            uniqueOrgs.push(orgMap.get(location.organizationId));
          }
        });
        
        setAssignedLocations(uniqueOrgs);
        
        console.log('📊 PROCESSING SUMMARY (DEDUPLICATED):');
        console.log(`- Total locations after deduplication: ${uniqueLocations.length}`);
        console.log(`- Unique organizations: ${uniqueOrgs.length}`);
        
        uniqueLocations.forEach((location, index) => {
          console.log(`${index + 1}. ${location.organizationName} - ${location.brandName || 'No Brand'} (${location.locationType})`);
        });
        
      } else {
        console.log('❌ NEW ENDPOINT FAILED:', response.message);
        // Fallback to old method if new endpoint fails
        console.log('🔄 FALLING BACK TO OLD METHOD');
        await fetchAssignedLocationsOldMethod();
      }
    } catch (error) {
      console.log('❌ ERROR WITH NEW ENDPOINT:', error);
      // Fallback to old method on error
      console.log('🔄 FALLING BACK TO OLD METHOD');
      await fetchAssignedLocationsOldMethod();
    }
  };
  
  // Fallback method using old endpoint
  const fetchAssignedLocationsOldMethod = async () => {
    try {
      const response = await ApiService.getMyVerificationAssignments();
      if (response.success) {
        console.log('📦 OLD METHOD - FETCHED ASSIGNMENTS DEBUG');
        console.log('Total assignments:', response.data.assignments?.length || 0);
        
        setAssignedLocations(response.data.assignments);
        
        // Flatten all locations from ALL assignments/organizations
        const allLocs = [];
        const seenLocations = new Set();
        
        response.data.assignments.forEach(assignment => {
          console.log('Processing assignment for org:', assignment.organizationName);
          console.log('Locations count:', assignment.organizationLocationDetails?.length || 0);
          
          if (assignment.organizationLocationDetails && assignment.organizationLocationDetails.length > 0) {
            assignment.organizationLocationDetails.forEach((location, index) => {
              // Create unique identifier for deduplication
              const locationKey = `${assignment.organizationId}-${location.brandName}-${location.locationType}-${location.cityRegion}-${location.city}`;
              
              if (!seenLocations.has(locationKey)) {
                seenLocations.add(locationKey);
                
                const flattenedLocation = {
                  assignmentId: assignment._id,
                  organizationId: assignment.organizationId,
                  organizationName: assignment.organizationName,
                  targetUserId: assignment.targetUserId,
                  targetUserName: assignment.targetUserName,
                  targetUserEmail: assignment.targetUserEmail,
                  assignmentStatus: assignment.status,
                  locationType: location.locationType,
                  brandName: location.brandName,
                  country: location.country,
                  state: location.state,
                  lga: location.lga,
                  city: location.city,
                  cityRegion: location.cityRegion,
                  houseNumber: location.houseNumber,
                  street: location.street,
                  landmark: location.landmark,
                  buildingColor: location.buildingColor,
                  buildingType: location.buildingType,
                  fullAddress: `${location.houseNumber || ''} ${location.street || ''}, ${location.cityRegion || ''}, ${location.city || ''}`.trim(),
                  locationId: `${assignment.organizationId}-${location.locationType}-${location.brandName}`.toLowerCase().replace(/\s+/g, '-'),
                  // Keep old structure for compatibility
                  selectedLocation: location,
                  locationIndex: allLocs.length,
                  uniqueId: `${assignment._id}_${allLocs.length}`,
                  uniqueKey: `location-${allLocs.length}-${assignment._id}-${Date.now()}`,
                  uniqueSelectionId: `${assignment.organizationId}-${location.locationType}-${location.brandName}-${allLocs.length}-${assignment._id}`.toLowerCase().replace(/\s+/g, '-')
                };
                
                allLocs.push(flattenedLocation);
                console.log(`Added unique location: ${flattenedLocation.organizationName} - ${flattenedLocation.brandName || 'No Brand'}`);
              } else {
                console.log(`Skipped duplicate location: ${assignment.organizationName} - ${location.brandName || 'No Brand'}`);
              }
            });
          } else {
            console.log('No locations found for assignment:', assignment.organizationName);
          }
        });
        
        console.log('📦 OLD METHOD - TOTAL DEDUPLICATED LOCATIONS');
        console.log('Total unique locations across all organizations:', allLocs.length);
        
        setAllLocations(allLocs);
      } else {
        console.log('Failed to fetch assignments:', response.message);
      }
    } catch (error) {
      console.log('Error fetching assigned locations (old method):', error);
    }
  };

  const addTransportationStep = () => {
    setFormData({
      ...formData,
      transportationSteps: [...formData.transportationSteps, 
        { startPoint: '', time: '', nextDestination: '', fareSpent: 0, timeSpent: '' }
      ]
    });
  };

  const selectLocation = (locationData) => {
    console.log('📍 LOCATION SELECTED:', locationData.organizationName, '-', locationData.brandName);
    console.log('📍 UNIQUE SELECTION ID:', locationData.uniqueSelectionId);
    
    setSelectedLocation(locationData);
    setFormData({
      ...formData,
      assignmentId: locationData.assignmentId,
      selectedLocationId: locationData.uniqueSelectionId, // Use truly unique selection ID
      selectedLocationIndex: 0, // Not needed for new endpoint but kept for compatibility
      organizationId: locationData.organizationId,
      organizationName: locationData.organizationName,
      targetUserId: locationData.targetUserId,
      targetUserFirstName: locationData.targetUserName?.split(' ')[0] || '',
      targetUserLastName: locationData.targetUserName?.split(' ').slice(1).join(' ') || '',
      
      // Set claimed location (what organization says)
      organizationClaimedLocation: {
        locationType: locationData.locationType,
        brandName: locationData.brandName,
        country: locationData.country || '',
        state: locationData.state || '',
        lga: locationData.lga || '',
        city: locationData.city || '',
        cityRegion: locationData.cityRegion || '',
        houseNumber: locationData.houseNumber || '',
        street: locationData.street || '',
        landmark: locationData.landmark || '',
        address: locationData.fullAddress || ''
      },
      
      // Initialize actual found location with claimed location (field agent can modify)
      country: locationData.country || '',
      state: locationData.state || '',
      lga: locationData.lga || '',
      city: locationData.city || '',
      cityRegion: locationData.cityRegion || '',
      headquartersAddress: locationData.fullAddress || '',
    });
  };

  const updateTransportationStep = (index, field, value) => {
    const updatedSteps = formData.transportationSteps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    );
    setFormData({ ...formData, transportationSteps: updatedSteps });
  };

  const pickImage = async (pictureKey) => {
    console.log('pickImage called for:', pictureKey);
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => {
          console.log('Camera selected');
          openCamera(pictureKey);
        }},
        { text: 'Gallery', onPress: () => {
          console.log('Gallery selected');
          openGallery(pictureKey);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async (pictureKey) => {
    console.log('openCamera called for:', pictureKey);
    try {
      console.log('Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission result:', permissionResult);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        setFormData(prev => ({ 
          ...prev, 
          [pictureKey]: {
            ...prev[pictureKey],
            fileUrl: result.assets[0].uri
          }
        }));
      } else {
        console.log('Camera canceled or no image');
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera: ' + error.message);
    }
  };

  const openGallery = async (pictureKey) => {
    console.log('openGallery called for:', pictureKey);
    try {
      console.log('Requesting gallery permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Gallery permission result:', permissionResult);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required');
        return;
      }

      console.log('Launching gallery...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('Gallery result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        setFormData(prev => ({ 
          ...prev, 
          [pictureKey]: {
            ...prev[pictureKey],
            fileUrl: result.assets[0].uri
          }
        }));
      } else {
        console.log('Gallery canceled or no image');
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery: ' + error.message);
    }
  };

  const createVerification = async () => {
    if (!formData.assignmentId) {
      Alert.alert('Error', 'Please select a location to verify');
      return;
    }

    const verificationData = {
      assignmentId: formData.assignmentId,
      
      country: formData.country,
      state: formData.state,
      lga: formData.lga,
      city: formData.city,
      cityRegion: formData.cityRegion,
      
      organizationId: formData.organizationId,
      organizationName: formData.organizationName,
      targetUserId: formData.targetUserId,
      targetUserFirstName: formData.targetUserFirstName,
      targetUserLastName: formData.targetUserLastName,
      
      organizationClaimedLocation: formData.organizationClaimedLocation,
      
      organizationDetails: {
        name: formData.organizationName,
        attachments: [],
        headquartersAddress: formData.headquartersAddress,
        addressAttachments: []
      },
      
      buildingPictures: {
        frontView: {
          fileUrl: formData.frontView.fileUrl || 'placeholder-url',
          caption: formData.frontView.caption || ''
        },
        streetPicture: {
          fileUrl: formData.streetPicture.fileUrl || 'placeholder-url',
          caption: formData.streetPicture.caption || ''
        },
        agentInFrontBuilding: {
          fileUrl: formData.agentInFrontBuilding.fileUrl || 'placeholder-url',
          caption: formData.agentInFrontBuilding.caption || ''
        },
        whatsappLocation: {
          fileUrl: formData.whatsappLocation.fileUrl || 'placeholder-url',
          caption: formData.whatsappLocation.caption || ''
        },
        insideOrganization: {
          fileUrl: formData.insideOrganization.fileUrl || 'placeholder-url',
          caption: formData.insideOrganization.caption || ''
        },
        withStaffOrOwner: {
          fileUrl: formData.withStaffOrOwner.fileUrl || 'placeholder-url',
          caption: formData.withStaffOrOwner.caption || ''
        },
        videoWithNeighbor: {
          fileUrl: formData.videoWithNeighbor.fileUrl || 'placeholder-url',
          caption: formData.videoWithNeighbor.caption || ''
        }
      },
      
      transportationCost: {
        going: formData.transportationSteps,
        finalDestination: formData.finalDestination,
        finalFareSpent: Number(formData.finalFareSpent),
        finalTime: formData.finalTime,
        totalJourneyTime: formData.totalJourneyTime,
        comingBack: {
          totalTransportationCost: Number(formData.totalTransportationCost),
          otherExpensesCost: Number(formData.otherExpensesCost),
          receiptUrl: ''
        }
      }
    };

    try {
      // Step 1: Create verification (saves as draft)
      const response = await ApiService.createVerificationFromAssignment(verificationData);
      if (response.success) {
        // Step 2: Submit verification (changes status to submitted)
        const submitResponse = await ApiService.submitVerification(response.data.verificationId);
        if (submitResponse.success) {
          Alert.alert('Success', 'Verification submitted successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Warning', 'Verification created but failed to submit. You can submit it later.');
        }
      } else {
        Alert.alert('Error', 'Failed to create verification');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create verification');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Location to Verify</Text>
            <Text style={styles.infoText}>Choose from your assigned locations across all organizations</Text>
            
            {allLocations.length === 0 ? (
              <View style={styles.noLocationsCard}>
                <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noLocationsText}>No locations assigned yet</Text>
                <Text style={styles.noLocationsSubText}>Contact your administrator to get organization assignments</Text>
              </View>
            ) : (
              <>
                <Text style={styles.locationCountText}>
                  {allLocations.length} location{allLocations.length !== 1 ? 's' : ''} available across {assignedLocations.length} organization{assignedLocations.length !== 1 ? 's' : ''}
                </Text>
                
                <ScrollView style={styles.locationsContainer} showsVerticalScrollIndicator={false}>
                  {allLocations.map((locationData, index) => (
                    <TouchableOpacity
                      key={locationData.uniqueKey || `location-${index}`}
                      style={[
                        styles.locationCard, 
                        formData.selectedLocationId === locationData.uniqueSelectionId && 
                        styles.selectedLocationCard
                      ]}
                      onPress={() => selectLocation(locationData)}
                    >
                      <View style={styles.locationHeader}>
                        <Text style={styles.locationOrgName}>{locationData.organizationName || 'Unknown Organization'}</Text>
                        <View style={[
                          styles.locationBadge, 
                          locationData.locationType === 'headquarters' ? 
                          styles.headquartersBadge : styles.branchBadge
                        ]}>
                          <Text style={styles.locationBadgeText}>
                            {locationData.locationType || 'Location'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.locationTarget}>
                        Target: {locationData.targetUserName || 'N/A'}
                      </Text>
                      
                      <Text style={styles.locationBrand}>
                        Brand: {locationData.brandName || 'N/A'}
                      </Text>
                      
                      <Text style={styles.locationAddress}>
                        {locationData.cityRegion || 'N/A'}, {locationData.city || 'N/A'}, {locationData.state || 'N/A'}
                      </Text>
                      
                      <Text style={styles.locationFullAddress}>
                        {locationData.fullAddress || 'Address not available'}
                      </Text>
                      
                      {/* Add location index for identical locations */}
                      <Text style={styles.locationIndex}>
                        Location #{index + 1}
                      </Text>
                      
                      {locationData.landmark && (
                        <Text style={styles.locationLandmark}>
                          📍 {locationData.landmark}
                        </Text>
                      )}
                      
                      {locationData.buildingColor && locationData.buildingType && (
                        <Text style={styles.buildingInfo}>
                          🏢 {locationData.buildingColor} {locationData.buildingType}
                        </Text>
                      )}
                      
                      {locationData.buildingColor && !locationData.buildingType && (
                        <Text style={styles.buildingInfo}>
                          🏢 {locationData.buildingColor} Building
                        </Text>
                      )}
                      
                      {/* Selection indicator */}
                      {formData.selectedLocationId === locationData.uniqueSelectionId && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          <Text style={styles.selectedText}>Selected</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}}
                </ScrollView>
              </>
            )}
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Organization Details</Text>
            <Text style={styles.infoText}>Complete organization information from selected location</Text>
            {selectedLocation && (
              <View style={styles.fullDetailsCard}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Organization Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Organization Name:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.organizationName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Target User:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.targetUserName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Target Email:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.targetUserEmail || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assignment ID:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.assignmentId || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assignment Status:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.assignmentStatus || 'N/A'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Location Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand Name:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.brandName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location Type:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.locationType || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Country:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.country || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.state || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>LGA:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.lga || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.city || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City Region:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.cityRegion || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>House Number:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.houseNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Street:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.street || 'N/A'}</Text>
                  </View>
                  {selectedLocation.landmark && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Landmark:</Text>
                      <Text style={styles.detailValue}>{selectedLocation.landmark}</Text>
                    </View>
                  )}
                  {selectedLocation.buildingColor && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Building Color:</Text>
                      <Text style={styles.detailValue}>{selectedLocation.buildingColor}</Text>
                    </View>
                  )}
                  {selectedLocation.buildingType && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Building Type:</Text>
                      <Text style={styles.detailValue}>{selectedLocation.buildingType}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Full Address</Text>
                  <Text style={styles.fullAddress}>{selectedLocation.fullAddress || 'Address not available'}</Text>
                </View>
              </View>
            )}
            {!selectedLocation && (
              <View style={styles.noSelectionCard}>
                <Ionicons name="information-circle" size={48} color="#9CA3AF" />
                <Text style={styles.noSelectionText}>Please select a location first</Text>
              </View>
            )}
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Field Verification Details</Text>
            <Text style={styles.infoText}>Enter what you actually found during verification</Text>
            
            <Text style={styles.subTitle}>Organization Claims vs Your Findings</Text>
            {selectedLocation && (
              <View style={styles.claimedLocationCard}>
                <Text style={styles.claimedTitle}>Organization Claims:</Text>
                <Text style={styles.claimedText}>
                  {formData.organizationClaimedLocation.cityRegion}, {formData.organizationClaimedLocation.city}
                </Text>
                <Text style={styles.claimedAddress}>{formData.organizationClaimedLocation.address}</Text>
              </View>
            )}
            
            <Text style={styles.subTitle}>What You Actually Found:</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter country name"
                value={formData.country}
                onChangeText={(text) => setFormData({...formData, country: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state name"
                value={formData.state}
                onChangeText={(text) => setFormData({...formData, state: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LGA (Local Government Area)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter LGA name"
                value={formData.lga}
                onChangeText={(text) => setFormData({...formData, lga: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city name"
                value={formData.city}
                onChangeText={(text) => setFormData({...formData, city: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City Region</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city region/area"
                value={formData.cityRegion}
                onChangeText={(text) => setFormData({...formData, cityRegion: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Headquarters Address (What you found)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter the actual address you found during verification"
                value={formData.headquartersAddress}
                onChangeText={(text) => setFormData({...formData, headquartersAddress: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Building Pictures</Text>
            <Text style={styles.infoText}>Take photos and add captions to describe what each picture shows</Text>
            
            {[
              { key: 'frontView', label: 'Front View of Building' },
              { key: 'streetPicture', label: 'Street Picture' },
              { key: 'agentInFrontBuilding', label: 'Agent in Front of Building' },
              { key: 'whatsappLocation', label: 'WhatsApp Location Screenshot' },
              { key: 'insideOrganization', label: 'Inside Organization' },
              { key: 'withStaffOrOwner', label: 'With Staff or Owner' },
              { key: 'videoWithNeighbor', label: 'Video with Neighbor' },
            ].map((picture) => (
              <View key={picture.key} style={styles.pictureItem}>
                <Text style={styles.pictureLabel}>{picture.label}</Text>
                
                {/* Image/Video Upload Section */}
                {formData[picture.key].fileUrl ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: formData[picture.key].fileUrl }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => pickImage(picture.key)}
                    >
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.pictureButton}
                    onPress={() => pickImage(picture.key)}
                  >
                    <Ionicons name="camera" size={20} color="#7C3AED" />
                    <Text style={styles.pictureButtonText}>
                      {picture.key === 'videoWithNeighbor' ? 'Take Video' : 'Take Photo'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Caption Input Section */}
                <View style={styles.captionSection}>
                  <Text style={styles.captionLabel}>Caption/Description:</Text>
                  <TextInput
                    style={styles.captionInput}
                    placeholder={`Describe what this ${picture.key === 'videoWithNeighbor' ? 'video' : 'photo'} shows...`}
                    value={formData[picture.key].caption}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      [picture.key]: {
                        ...prev[picture.key],
                        caption: text
                      }
                    }))}
                    multiline
                    numberOfLines={2}
                    maxLength={200}
                  />
                  <Text style={styles.captionCounter}>
                    {formData[picture.key].caption.length}/200
                  </Text>
                </View>
              </View>
            ))}
            
            <Text style={styles.noteText}>
              📸 Tap "Take Photo" to capture images or select from gallery{"\n"}
              ✍️ Add descriptive captions to provide context for each picture
            </Text>
          </View>
        );
      
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Transportation Details</Text>
            
            <Text style={styles.subTitle}>Journey Steps</Text>
            {formData.transportationSteps.map((step, index) => (
              <View key={index} style={styles.transportStep}>
                <Text style={styles.stepNumber}>Step {index + 1}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Point</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Home, Office, Bus Stop"
                    value={step.startPoint}
                    onChangeText={(text) => updateTransportationStep(index, 'startPoint', text)}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Departure Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 08:00 AM"
                    value={step.time}
                    onChangeText={(text) => updateTransportationStep(index, 'time', text)}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Next Destination</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Bus Terminal, Train Station"
                    value={step.nextDestination}
                    onChangeText={(text) => updateTransportationStep(index, 'nextDestination', text)}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fare Spent (₦)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 500"
                    value={step.fareSpent.toString()}
                    onChangeText={(text) => updateTransportationStep(index, 'fareSpent', Number(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time Spent</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 30 minutes, 1 hour"
                    value={step.timeSpent}
                    onChangeText={(text) => updateTransportationStep(index, 'timeSpent', text)}
                  />
                </View>
              </View>
            ))}}
            
            <TouchableOpacity style={styles.addStepButton} onPress={addTransportationStep}>
              <Ionicons name="add" size={20} color="#7C3AED" />
              <Text style={styles.addStepText}>Add Step</Text>
            </TouchableOpacity>
            
            <Text style={styles.subTitle}>Final Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Final Destination</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Organization Office, Target Location"
                value={formData.finalDestination}
                onChangeText={(text) => setFormData({...formData, finalDestination: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Final Fare Spent (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 200"
                value={formData.finalFareSpent.toString()}
                onChangeText={(text) => setFormData({...formData, finalFareSpent: Number(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Final Arrival Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 09:15 AM"
                value={formData.finalTime}
                onChangeText={(text) => setFormData({...formData, finalTime: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Journey Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1 hour 15 minutes"
                value={formData.totalJourneyTime}
                onChangeText={(text) => setFormData({...formData, totalJourneyTime: text})}
              />
            </View>
            
            <Text style={styles.subTitle}>Return Costs</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Transportation Cost (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1500"
                value={formData.totalTransportationCost.toString()}
                onChangeText={(text) => setFormData({...formData, totalTransportationCost: Number(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Other Expenses Cost (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 300 (food, calls, etc.)"
                value={formData.otherExpensesCost.toString()}
                onChangeText={(text) => setFormData({...formData, otherExpensesCost: Number(text) || 0})}
                keyboardType="numeric"
              />
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep > index + 1 && styles.completedStep,
              currentStep === index + 1 && styles.activeStep
            ]}>
              <Ionicons 
                name={currentStep > index + 1 ? 'checkmark' : step.icon} 
                size={16} 
                color={currentStep >= index + 1 ? 'white' : '#9CA3AF'} 
              />
            </View>
            <Text style={styles.stepLabel}>{step.title}</Text>
          </View>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 5 ? (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={() => {
              // Validation for step 1 - must select location
              if (currentStep === 1 && !selectedLocation) {
                Alert.alert('Error', 'Please select a location to verify before proceeding');
                return;
              }
              setCurrentStep(currentStep + 1);
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.createButton} onPress={createVerification}>
            <Text style={styles.createButtonText}>Submit Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeStep: {
    backgroundColor: '#7C3AED',
  },
  completedStep: {
    backgroundColor: '#10B981',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4, // Reduced since we now have inputGroup margin
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectionScroll: {
    marginBottom: 20,
  },
  selectionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
  },
  selectedCard: {
    backgroundColor: '#7C3AED',
  },
  cardText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedText: {
    color: 'white',
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  transportStep: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addStepText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  pictureItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pictureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  pictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  pictureButtonText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 8,
  },
  pictureStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  changeButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for location selection
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  orgInfoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  orgTarget: {
    fontSize: 14,
    color: '#16A34A',
    marginTop: 2,
  },
  orgAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedLocationCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationOrgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  locationBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  locationTarget: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  locationFullAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationBrand: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 2,
    fontWeight: '500',
  },
  headquartersBadge: {
    backgroundColor: '#10B981',
  },
  branchBadge: {
    backgroundColor: '#3B82F6',
  },
  claimedLocationCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  claimedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  claimedText: {
    fontSize: 14,
    color: '#92400E',
  },
  claimedAddress: {
    fontSize: 12,
    color: '#A16207',
    marginTop: 2,
  },
  fullDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 120,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontWeight: '400',
  },
  fullAddress: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noSelectionCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 20,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  noLocationsCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noLocationsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noLocationsSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  locationCountText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  locationsContainer: {
    maxHeight: 400,
  },
  locationLandmark: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  captionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  captionCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  locationIndex: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});

export default CreateVerificationScreen;