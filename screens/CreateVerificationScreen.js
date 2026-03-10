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
    
    // Building Pictures
    frontView: '',
    streetPicture: '',
    agentInFrontBuilding: '',
    whatsappLocation: '',
    insideOrganization: '',
    withStaffOrOwner: '',
    videoWithNeighbor: '',
    
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
      const response = await ApiService.getMyVerificationAssignments();
      if (response.success) {
        setAssignedLocations(response.data.assignments);
        
        // Flatten all locations from all assignments
        const allLocs = [];
        response.data.assignments.forEach(assignment => {
          if (assignment.organizationLocationDetails && assignment.organizationLocationDetails.length > 0) {
            assignment.organizationLocationDetails.forEach((location, index) => {
              allLocs.push({
                ...assignment,
                selectedLocation: location,
                locationIndex: index,
                uniqueId: `${assignment._id}_${index}`
              });
            });
          }
        });
        setAllLocations(allLocs);
      }
    } catch (error) {
      console.log('Error fetching assigned locations:', error);
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
    const location = locationData.selectedLocation;
    setSelectedLocation(locationData);
    setFormData({
      ...formData,
      assignmentId: locationData._id,
      selectedLocationIndex: locationData.locationIndex,
      organizationId: locationData.organizationId,
      organizationName: locationData.organizationName,
      targetUserId: locationData.targetUserId,
      targetUserFirstName: locationData.targetUserName?.split(' ')[0] || '',
      targetUserLastName: locationData.targetUserName?.split(' ').slice(1).join(' ') || '',
      // Set claimed location (what organization says)
      organizationClaimedLocation: {
        country: location?.country || '',
        state: location?.state || '',
        lga: location?.lga || '',
        city: location?.city || '',
        cityRegion: location?.cityRegion || '',
        address: `${location?.houseNumber || ''} ${location?.street || ''}`.trim()
      },
      // Initialize actual found location with claimed location (field agent can modify)
      country: location?.country || '',
      state: location?.state || '',
      lga: location?.lga || '',
      city: location?.city || '',
      cityRegion: location?.cityRegion || '',
      headquartersAddress: `${location?.houseNumber || ''} ${location?.street || ''}, ${location?.cityRegion || ''}, ${location?.city || ''}`.trim(),
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
        setFormData(prev => ({ ...prev, [pictureKey]: result.assets[0].uri }));
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
        setFormData(prev => ({ ...prev, [pictureKey]: result.assets[0].uri }));
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
        frontView: formData.frontView || 'placeholder-url',
        streetPicture: formData.streetPicture || 'placeholder-url',
        agentInFrontBuilding: formData.agentInFrontBuilding || 'placeholder-url',
        whatsappLocation: formData.whatsappLocation || 'placeholder-url',
        insideOrganization: formData.insideOrganization || 'placeholder-url',
        withStaffOrOwner: formData.withStaffOrOwner || 'placeholder-url',
        videoWithNeighbor: formData.videoWithNeighbor || 'placeholder-url'
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
      const response = await ApiService.createVerificationFromAssignment(verificationData);
      if (response.success) {
        Alert.alert('Success', 'Verification created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
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
            <Text style={styles.infoText}>Choose from your assigned locations</Text>
            {allLocations.map((locationData) => (
              <TouchableOpacity
                key={locationData.uniqueId}
                style={[styles.locationCard, formData.assignmentId === locationData._id && formData.selectedLocationIndex === locationData.locationIndex && styles.selectedLocationCard]}
                onPress={() => selectLocation(locationData)}
              >
                <View style={styles.locationHeader}>
                  <Text style={styles.locationOrgName}>{locationData.organizationName}</Text>
                  <View style={[styles.locationBadge, locationData.selectedLocation.locationType === 'headquarters' ? styles.headquartersBadge : styles.branchBadge]}>
                    <Text style={styles.locationBadgeText}>{locationData.selectedLocation.locationType || 'Location'}</Text>
                  </View>
                </View>
                <Text style={styles.locationTarget}>Target: {locationData.targetUserName}</Text>
                <Text style={styles.locationBrand}>Brand: {locationData.selectedLocation.brandName}</Text>
                <Text style={styles.locationAddress}>
                  {locationData.selectedLocation.cityRegion}, {locationData.selectedLocation.city}
                </Text>
                <Text style={styles.locationFullAddress}>
                  {locationData.selectedLocation.houseNumber} {locationData.selectedLocation.street}
                </Text>
              </TouchableOpacity>
            ))}
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
                    <Text style={styles.detailValue}>{selectedLocation.organizationName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Target User:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.targetUserName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assignment ID:</Text>
                    <Text style={styles.detailValue}>{selectedLocation._id}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Location Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand Name:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.brandName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location Type:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.locationType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Country:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.country}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>State:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.state}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>LGA:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.lga}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.city}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City Region:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.cityRegion}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>House Number:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.houseNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Street:</Text>
                    <Text style={styles.detailValue}>{selectedLocation.selectedLocation.street}</Text>
                  </View>
                  {selectedLocation.selectedLocation.landmark && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Landmark:</Text>
                      <Text style={styles.detailValue}>{selectedLocation.selectedLocation.landmark}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Full Address</Text>
                  <Text style={styles.fullAddress}>{formData.headquartersAddress}</Text>
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
            <TextInput
              style={styles.input}
              placeholder="Country"
              value={formData.country}
              onChangeText={(text) => setFormData({...formData, country: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="State"
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="LGA"
              value={formData.lga}
              onChangeText={(text) => setFormData({...formData, lga: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="City Region"
              value={formData.cityRegion}
              onChangeText={(text) => setFormData({...formData, cityRegion: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Headquarters Address (What you found)"
              value={formData.headquartersAddress}
              onChangeText={(text) => setFormData({...formData, headquartersAddress: text})}
              multiline
              numberOfLines={3}
            />
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Building Pictures</Text>
            
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
                
                {formData[picture.key] ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: formData[picture.key] }} style={styles.previewImage} />
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
                    <Text style={styles.pictureButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <Text style={styles.noteText}>Tap "Take Photo" to capture images or select from gallery</Text>
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
                <TextInput
                  style={styles.input}
                  placeholder="Start Point"
                  value={step.startPoint}
                  onChangeText={(text) => updateTransportationStep(index, 'startPoint', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Time (e.g., 08:00)"
                  value={step.time}
                  onChangeText={(text) => updateTransportationStep(index, 'time', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Next Destination"
                  value={step.nextDestination}
                  onChangeText={(text) => updateTransportationStep(index, 'nextDestination', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Fare Spent"
                  value={step.fareSpent.toString()}
                  onChangeText={(text) => updateTransportationStep(index, 'fareSpent', Number(text) || 0)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Time Spent (e.g., 30 minutes)"
                  value={step.timeSpent}
                  onChangeText={(text) => updateTransportationStep(index, 'timeSpent', text)}
                />
              </View>
            ))}
            
            <TouchableOpacity style={styles.addStepButton} onPress={addTransportationStep}>
              <Ionicons name="add" size={20} color="#7C3AED" />
              <Text style={styles.addStepText}>Add Step</Text>
            </TouchableOpacity>
            
            <Text style={styles.subTitle}>Final Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Final Destination"
              value={formData.finalDestination}
              onChangeText={(text) => setFormData({...formData, finalDestination: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Final Fare Spent"
              value={formData.finalFareSpent.toString()}
              onChangeText={(text) => setFormData({...formData, finalFareSpent: Number(text) || 0})}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Final Time (e.g., 09:15)"
              value={formData.finalTime}
              onChangeText={(text) => setFormData({...formData, finalTime: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Journey Time"
              value={formData.totalJourneyTime}
              onChangeText={(text) => setFormData({...formData, totalJourneyTime: text})}
            />
            
            <Text style={styles.subTitle}>Return Costs</Text>
            <TextInput
              style={styles.input}
              placeholder="Total Transportation Cost"
              value={formData.totalTransportationCost.toString()}
              onChangeText={(text) => setFormData({...formData, totalTransportationCost: Number(text) || 0})}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Other Expenses Cost"
              value={formData.otherExpensesCost.toString()}
              onChangeText={(text) => setFormData({...formData, otherExpensesCost: Number(text) || 0})}
              keyboardType="numeric"
            />
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
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.createButton} onPress={createVerification}>
            <Text style={styles.createButtonText}>Create Verification</Text>
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
    marginBottom: 12,
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
});

export default CreateVerificationScreen;