import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const TakeNewMeasurementScreen = ({ navigation }) => {
  const [measurementMethod, setMeasurementMethod] = useState('');
  const [whoseMeasurement, setWhoseMeasurement] = useState('Self');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showWhoseDropdown, setShowWhoseDropdown] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [sideImage, setSideImage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userHeight, setUserHeight] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    console.log('🚨 NAME SETTING DEBUG 🚨');
    console.log('whoseMeasurement:', whoseMeasurement);
    console.log('userProfile:', userProfile ? 'exists' : 'null');
    
    if (whoseMeasurement === 'Self' && userProfile) {
      let firstName = userProfile.firstName;
      let lastName = userProfile.lastName;
      
      // If firstName/lastName are null but fullName exists, extract from fullName
      if ((!firstName || !lastName) && userProfile.fullName) {
        const nameParts = userProfile.fullName.trim().split(' ');
        firstName = firstName || nameParts[0] || '';
        lastName = lastName || nameParts.slice(1).join(' ') || '';
        console.log('Extracted from fullName:', firstName, lastName);
      }
      
      console.log('Setting names:', firstName, lastName);
      setFirstName(firstName || '');
      setLastName(lastName || '');
    } else if (whoseMeasurement === 'Others') {
      console.log('Clearing names for Others');
      setFirstName('');
      setLastName('');
    }
  }, [whoseMeasurement, userProfile]);

  const fetchUserProfile = async () => {
    try {
      console.log('🚨 FETCHING USER PROFILE DEBUG 🚨');
      const response = await ApiService.getUserProfile();
      console.log('Profile API response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const user = response.data.user;
        console.log('User data:', JSON.stringify(user, null, 2));
        console.log('User firstName:', user.firstName);
        console.log('User lastName:', user.lastName);
        console.log('User role:', user.role);
        setUserProfile(user);
      } else {
        console.log('Profile fetch failed:', response.message);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const pickImage = async (imageType) => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add the image:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto(imageType) },
        { text: 'Choose from Gallery', onPress: () => chooseFromGallery(imageType) }
      ]
    );
  };

  const takePhoto = async (imageType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (!result.canceled) {
      if (imageType === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
    }
  };

  const chooseFromGallery = async (imageType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (!result.canceled) {
      if (imageType === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.log('Error converting image to base64:', error);
      throw error;
    }
  };

  const startAnimations = () => {
    // Rolling animation for the circle
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Blinking animation for the status text
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    rotateAnim.stopAnimation();
    blinkAnim.stopAnimation();
    rotateAnim.setValue(0);
    blinkAnim.setValue(1);
  };

  const handleAIScan = async () => {
    if (!frontImage || !sideImage || !userHeight) {
      Alert.alert('Missing Information', 'Please upload both front and side images and enter your height.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please fill in first name and last name.');
      return;
    }

    setIsProcessing(true);
    startAnimations();
    
    try {
      console.log('🚨 CLOUDINARY UPLOAD DEBUG 🚨');
      console.log('Front image URI:', frontImage);
      console.log('Side image URI:', sideImage);
      
      // Upload images directly to Cloudinary
      console.log('Uploading front image...');
      const frontImageUrl = await ApiService.uploadToCloudinary(frontImage);
      console.log('Front image uploaded:', frontImageUrl);
      
      console.log('Uploading side image...');
      const sideImageUrl = await ApiService.uploadToCloudinary(sideImage);
      console.log('Side image uploaded:', sideImageUrl);
      
      if (!frontImageUrl || !sideImageUrl) {
        Alert.alert('Upload Failed', 'Failed to upload images to Cloudinary. Please try again.');
        return;
      }
      
      const requestData = {
        frontImageUrl,
        sideImageUrl,
        userHeight: parseInt(userHeight),
        scanTimestamp: new Date().toISOString(),
        firstName: firstName,
        lastName: lastName,
        subject: whoseMeasurement === 'Self' ? 'Self measurement' : 'Other measurement'
      };

      console.log('🚨 AI SCAN REQUEST DATA 🚨');
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

      const response = await ApiService.scanMeasurement(requestData);
      
      if (response.success) {
        setAiResults(response.data);
        setShowResultModal(true);
      } else {
        Alert.alert(
          'Scan Failed', 
          response.message || 'The AI service is currently unavailable. Please try again later or contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('AI scan error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the AI service. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      stopAnimations();
    }
  };

  const saveAIResults = async () => {
    console.log('=== AI RESULTS PROCESSED ===');
    console.log('AI measurements are automatically saved by the scan endpoint');
    console.log('No manual save needed for AI results');
    
    setShowResultModal(false);
    Alert.alert('Success', 'AI measurement completed successfully!', [
      { text: 'OK', onPress: () => navigation.navigate('BodyMeasurement') }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Take New Measurement</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.formIdRow}>
        <View style={styles.formIdContainer}>
          <Text style={styles.formIdLabel}>Form ID: </Text>
          <View style={styles.formIdBox}>
            <Text style={styles.formIdNumber}>24.01.26.225</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Manual or AI Measurement */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Manual or AI Measurement</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowMethodDropdown(!showMethodDropdown)}
            >
              <Text style={styles.dropdownText}>
                {measurementMethod || 'Select Method'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {showMethodDropdown && (
              <View style={styles.dropdownOptions}>
                <TouchableOpacity 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setMeasurementMethod('Manual');
                    setShowMethodDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setMeasurementMethod('AI');
                    setShowMethodDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>AI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Whose Measurement */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Whose Measurement</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowWhoseDropdown(!showWhoseDropdown)}
            >
              <Text style={styles.dropdownText}>{whoseMeasurement}</Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {showWhoseDropdown && (
              <View style={styles.dropdownOptions}>
                <TouchableOpacity 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setWhoseMeasurement('Self');
                    setShowWhoseDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>Self</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setWhoseMeasurement('Others');
                    setShowWhoseDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>Others</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* First Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={[styles.textInput, whoseMeasurement === 'Self' && styles.disabledInput]}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              editable={whoseMeasurement !== 'Self'}
            />
          </View>

          {/* Last Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={[styles.textInput, whoseMeasurement === 'Self' && styles.disabledInput]}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              editable={whoseMeasurement !== 'Self'}
            />
          </View>

          {/* Image Upload Section - Only show for AI measurement */}
          {measurementMethod === 'AI' && (
            <>
              {/* Upload Front Image */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Front View Image *</Text>
                <Text style={styles.fieldDescription}>Take or upload a full-body front view photo</Text>
                <TouchableOpacity 
                  style={[styles.imageUploadBox, frontImage && styles.imageUploadBoxFilled]}
                  onPress={() => pickImage('front')}
                >
                  {frontImage ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.changeImageText}>Change</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="person-outline" size={48} color="#7C3AED" />
                      <Text style={styles.uploadTitle}>Add Front View</Text>
                      <Text style={styles.uploadSubtitle}>Take photo or choose from gallery</Text>
                      <View style={styles.uploadActions}>
                        <Ionicons name="camera-outline" size={20} color="#7C3AED" />
                        <Text style={styles.uploadActionText}>Camera</Text>
                        <Text style={styles.uploadSeparator}>or</Text>
                        <Ionicons name="image-outline" size={20} color="#7C3AED" />
                        <Text style={styles.uploadActionText}>Gallery</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Upload Side Image */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Side View Image *</Text>
                <Text style={styles.fieldDescription}>Take or upload a full-body side view photo</Text>
                <TouchableOpacity 
                  style={[styles.imageUploadBox, sideImage && styles.imageUploadBoxFilled]}
                  onPress={() => pickImage('side')}
                >
                  {sideImage ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: sideImage }} style={styles.uploadedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.changeImageText}>Change</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="body-outline" size={48} color="#7C3AED" />
                      <Text style={styles.uploadTitle}>Add Side View</Text>
                      <Text style={styles.uploadSubtitle}>Take photo or choose from gallery</Text>
                      <View style={styles.uploadActions}>
                        <Ionicons name="camera-outline" size={20} color="#7C3AED" />
                        <Text style={styles.uploadActionText}>Camera</Text>
                        <Text style={styles.uploadSeparator}>or</Text>
                        <Ionicons name="image-outline" size={20} color="#7C3AED" />
                        <Text style={styles.uploadActionText}>Gallery</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
          {/* Height Input - Only show for AI measurement */}
          {measurementMethod === 'AI' && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter height in centimeters"
                placeholderTextColor="#9CA3AF"
                value={userHeight}
                onChangeText={setUserHeight}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        {measurementMethod === 'AI' ? (
          <TouchableOpacity 
            style={[styles.nextButton, isProcessing && styles.disabledButton]}
            onPress={handleAIScan}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text style={styles.nextButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.nextButtonText}>Scan with AI</Text>
            )}
          </TouchableOpacity>
        ) : (
            <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => {
              if (!firstName.trim() || !lastName.trim()) {
                Alert.alert('Error', 'Please fill in first name and last name');
                return;
              }
              console.log('🚨 NAVIGATION TO EXTENDED FORM DEBUG 🚨');
              console.log('firstName:', firstName);
              console.log('lastName:', lastName);
              console.log('whoseMeasurement:', whoseMeasurement);
              navigation.navigate('ExtendedForm', { firstName, lastName });
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Results Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Scan Results</Text>
              <TouchableOpacity 
                onPress={() => setShowResultModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {aiResults && (
              <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{firstName} {lastName}</Text>
                  <Text style={styles.heightInfo}>Height: {aiResults.measurements.userHeight} cm</Text>
                </View>
                
                <View style={styles.measurementsList}>
                  {Object.entries(aiResults.measurements.measurements).map(([key, value]) => (
                    <View key={key} style={styles.measurementRow}>
                      <Text style={styles.measurementLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </Text>
                      <Text style={styles.measurementValue}>{value} cm</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.discardButton}
                    onPress={() => setShowResultModal(false)}
                  >
                    <Text style={styles.discardButtonText}>Discard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={saveAIResults}
                  >
                    <Text style={styles.saveButtonText}>Save Results</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <Modal
          visible={isProcessing}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.processingOverlay}>
            <View style={styles.processingModal}>
              <View style={styles.aiScanIcon}>
                <Animated.View 
                  style={[
                    styles.scanningRing,
                    {
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="body" size={40} color="#7C3AED" />
                </Animated.View>
                <View style={styles.scanningPulse} />
              </View>
              <Animated.Text style={[styles.processingTitle, { opacity: blinkAnim }]}>AI Analyzing Images</Animated.Text>
              <Text style={styles.processingSubtitle}>
                Our advanced AI is scanning your photos to extract precise body measurements.
              </Text>
              <View style={styles.progressSteps}>
                <View style={styles.progressStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepText}>Processing Images</Text>
                </View>
                <View style={styles.progressStep}>
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                  <Text style={styles.stepText}>Extracting Measurements</Text>
                </View>
                <View style={styles.progressStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepText}>Finalizing Results</Text>
                </View>
              </View>
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 20 }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,

  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  formIdRow: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    marginTop: 8,
  },
  formIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formIdLabel: {
    fontSize: 12,
    color: '#1F2937',
  },
  formIdBox: {
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  formIdNumber: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 15,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 200,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C3AED',
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  uploadFrontContainer: {
    marginTop: 16,
  },
  uploadSideContainer: {
    marginTop: 16,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  disabledButton: {
    opacity: 0.6,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  resultsContainer: {
    padding: 20,
  },
  personInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  heightInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  measurementsList: {
    marginBottom: 20,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  measurementLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  discardButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 320,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  aiScanIcon: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
  scanningPulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#7C3AED',
    opacity: 0.3,
  },
  progressSteps: {
    marginTop: 24,
    marginBottom: 8,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  stepDotActive: {
    backgroundColor: '#7C3AED',
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 200,
    backgroundColor: '#FAFAFA',
  },
  imageUploadBoxFilled: {
    borderStyle: 'solid',
    borderColor: '#7C3AED',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadActionText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  uploadSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
});

export default TakeNewMeasurementScreen;