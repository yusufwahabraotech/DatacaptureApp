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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const CreateVerificationScreen = ({ navigation }) => {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Location
    country: '',
    state: '',
    lga: '',
    city: '',
    cityRegion: '',
    
    // Target
    organizationId: '',
    organizationName: '',
    targetUserId: '',
    targetUserFirstName: '',
    targetUserLastName: '',
    
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
    { title: 'Location', icon: 'location' },
    { title: 'Organization', icon: 'business' },
    { title: 'Details', icon: 'document-text' },
    { title: 'Pictures', icon: 'camera' },
    { title: 'Transportation', icon: 'car' },
  ];

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await ApiService.getVerificationOrganizations();
      if (response.success) {
        setOrganizations(response.data.organizations);
      }
    } catch (error) {
      console.log('Error fetching organizations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await ApiService.getVerificationUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
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
    if (!formData.organizationId || !formData.targetUserId) {
      Alert.alert('Error', 'Please select organization and target user');
      return;
    }

    const verificationData = {
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
      const response = await ApiService.createVerification(verificationData);
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
            <Text style={styles.stepTitle}>Location Details</Text>
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
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Organization</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
              {organizations.map((org) => (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.selectionCard, formData.organizationId === org.id && styles.selectedCard]}
                  onPress={() => setFormData({
                    ...formData,
                    organizationId: org.id,
                    organizationName: org.name
                  })}
                >
                  <Text style={[styles.cardText, formData.organizationId === org.id && styles.selectedText]}>
                    {org.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.stepTitle}>Select Target User</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.selectionCard, formData.targetUserId === user.id && styles.selectedCard]}
                  onPress={() => setFormData({
                    ...formData,
                    targetUserId: user.id,
                    targetUserFirstName: user.firstName,
                    targetUserLastName: user.lastName
                  })}
                >
                  <Text style={[styles.cardText, formData.targetUserId === user.id && styles.selectedText]}>
                    {user.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Organization Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Headquarters Address"
              value={formData.headquartersAddress}
              onChangeText={(text) => setFormData({...formData, headquartersAddress: text})}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.noteText}>Note: Building pictures and attachments will be added later</Text>
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
    <View style={styles.container}>
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

      <ScrollView style={styles.content}>
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
});

export default CreateVerificationScreen;