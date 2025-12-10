import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const TakeNewMeasurementScreen = ({ navigation }) => {
  const [measurementMethod, setMeasurementMethod] = useState('');
  const [whoseMeasurement, setWhoseMeasurement] = useState('Self');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showWhoseDropdown, setShowWhoseDropdown] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [sideImage, setSideImage] = useState(null);

  const pickImage = async (imageType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (imageType === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
    }
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
              style={styles.textInput}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Upload Front Image */}
          <View style={[styles.fieldContainer, styles.uploadFrontContainer]}>
            <Text style={styles.fieldLabel}>Upload Front Image</Text>
            <TouchableOpacity 
              style={styles.uploadBox}
              onPress={() => pickImage('front')}
            >
              {frontImage ? (
                <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#7C3AED" />
                  <Text style={styles.uploadText}>
                    Upload front view or paste your file here
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Upload Side Image */}
          <View style={[styles.fieldContainer, styles.uploadSideContainer]}>
            <Text style={styles.fieldLabel}>Upload Side Image</Text>
            <TouchableOpacity 
              style={styles.uploadBox}
              onPress={() => pickImage('side')}
            >
              {sideImage ? (
                <Image source={{ uri: sideImage }} style={styles.uploadedImage} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color="#7C3AED" />
                  <Text style={styles.uploadText}>
                    Upload side view or paste your file here
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => {
            if (!firstName.trim() || !lastName.trim()) {
              Alert.alert('Error', 'Please fill in first name and last name');
              return;
            }
            navigation.navigate('ExtendedForm', { firstName, lastName });
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    resizeMode: 'cover',
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
});

export default TakeNewMeasurementScreen;