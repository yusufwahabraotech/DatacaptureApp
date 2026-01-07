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
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const ExtendedFormScreen = ({ navigation, route }) => {
  const [sections, setSections] = useState([
    {
      id: 1,
      bodyPart: '',
      measurementUnit: 'cm',
      showBodyPartDropdown: false,
      showUnitDropdown: false,
      fields: [
        { id: 1, bodyPartTitle: '', sizes: '', sizeError: '' }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { firstName, lastName } = route.params || {};
  
  const validateSizes = (text, sectionId, fieldId) => {
    const validPattern = /^[0-9.,% ]*$/;
    const isValid = validPattern.test(text);
    
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            fields: section.fields.map(field => 
              field.id === fieldId 
                ? { 
                    ...field, 
                    sizes: text, 
                    sizeError: isValid ? '' : 'Only numbers, decimals, and percentages are allowed'
                  }
                : field
            )
          }
        : section
    ));
  };
  
  const updateField = (sectionId, fieldId, key, value) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            fields: section.fields.map(field => 
              field.id === fieldId ? { ...field, [key]: value } : field
            )
          }
        : section
    ));
  };
  
  const addNewField = (sectionId) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            fields: [...section.fields, {
              id: section.fields.length + 1,
              bodyPartTitle: '',
              sizes: '',
              sizeError: ''
            }]
          }
        : section
    ));
  };
  
  const addNewSection = () => {
    const newSection = {
      id: sections.length + 1,
      bodyPart: '',
      measurementUnit: 'cm',
      showBodyPartDropdown: false,
      showUnitDropdown: false,
      fields: [
        { id: 1, bodyPartTitle: '', sizes: '', sizeError: '' }
      ]
    };
    setSections(prev => [...prev, newSection]);
  };
  
  const updateSectionBodyPart = (sectionId, bodyPart) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, bodyPart, showBodyPartDropdown: false }
        : section
    ));
  };
  
  const updateSectionUnit = (sectionId, measurementUnit) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, measurementUnit, showUnitDropdown: false }
        : { ...section, measurementUnit }
    ));
  };
  
  const toggleSectionDropdown = (sectionId, dropdownType) => {
    if (dropdownType === 'showUnitDropdown' && sectionId !== 1) {
      alert('Only one measurement unit can be used throughout. Change from the first section to update all sections.');
      return;
    }
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, [dropdownType]: !section[dropdownType] }
        : section
    ));
  };
  
  const bodyParts = ['Head', 'Chest', 'Waist', 'Hips', 'Arms', 'Legs', 'Shoulders', 'Neck', 'Thighs', 'Calves'];
  const measurementUnits = ['cm', 'm', 'inches', 'ft', 'mm'];

  const saveMeasurement = async () => {
    // Validate required fields
    if (!firstName || !lastName) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    // Check if at least one section has data
    const hasValidData = sections.some(section => 
      section.bodyPart && section.fields.some(field => 
        field.bodyPartTitle && field.sizes
      )
    );

    if (!hasValidData) {
      Alert.alert('Error', 'Please fill in at least one measurement');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Format sections for API
      const formattedSections = sections
        .filter(section => section.bodyPart)
        .map(section => ({
          sectionName: `${section.bodyPart} Section`,
          measurements: section.fields
            .filter(field => field.bodyPartTitle && field.sizes)
            .map(field => ({
              bodyPartName: field.bodyPartTitle,
              size: parseFloat(field.sizes) || 0
            }))
        }))
        .filter(section => section.measurements.length > 0);

      const measurementData = {
        measurementType: 'Manual',
        subject: 'Others', // Fixed: should be 'Others' when firstName/lastName are provided
        firstName,
        lastName,
        status: 'submitted',
        sections: formattedSections
      };

      console.log('🚨 MANUAL MEASUREMENT SAVE DEBUG 🚨');
      console.log('Called method: ApiService.saveManualMeasurement');
      console.log('Expected endpoint: POST /api/manual-measurements/save');
      console.log('firstName:', firstName);
      console.log('lastName:', lastName);
      console.log('Full measurement data:', JSON.stringify(measurementData, null, 2));
      
      const response = await ApiService.saveManualMeasurement(measurementData);
      console.log('Response:', response);

      if (response.success) {
        Alert.alert('Success', 'Measurement saved successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save measurement');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
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
        <Text style={styles.headerTitle}>Take New Measurement</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Dynamic Sections */}
          {sections.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{section.bodyPart ? `${section.bodyPart.toUpperCase()} SECTION` : `SECTION ${section.id}`}</Text>
              
              {/* Body Part and Measurement Unit Row for each section */}
              <View style={styles.rowContainer}>
                <View style={styles.halfFieldContainer}>
                  <Text style={styles.fieldLabel}>Section Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter section name"
                    placeholderTextColor="#9CA3AF"
                    value={section.bodyPart}
                    onChangeText={(text) => updateSectionBodyPart(section.id, text)}
                  />
                </View>

                <View style={styles.halfFieldContainer}>
                  <Text style={styles.fieldLabel}>Measurement Unit</Text>
                  <TouchableOpacity 
                    style={[styles.dropdown, section.id !== 1 && styles.disabledDropdown]}
                    onPress={() => toggleSectionDropdown(section.id, 'showUnitDropdown')}
                  >
                    <Text style={[styles.dropdownText, section.id !== 1 && styles.disabledText]}>{section.measurementUnit}</Text>
                    <Ionicons name="chevron-down" size={20} color={section.id !== 1 ? "#D1D5DB" : "#9CA3AF"} />
                  </TouchableOpacity>
                  {section.showUnitDropdown && section.id === 1 && (
                    <View style={styles.dropdownOptions}>
                      {measurementUnits.map((unit) => (
                        <TouchableOpacity 
                          key={unit}
                          style={styles.dropdownOption}
                          onPress={() => updateSectionUnit(section.id, unit)}
                        >
                          <Text style={styles.dropdownOptionText}>{unit}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              
              {section.fields.map((field) => (
                <View key={field.id} style={styles.rowContainer}>
                  <View style={styles.halfFieldContainer}>
                    <Text style={styles.fieldLabel}>Body Part Title</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter body part title"
                      placeholderTextColor="#9CA3AF"
                      value={field.bodyPartTitle}
                      onChangeText={(text) => updateField(section.id, field.id, 'bodyPartTitle', text)}
                    />
                  </View>

                  <View style={styles.halfFieldContainer}>
                    <Text style={styles.fieldLabel}>Sizes</Text>
                    <TextInput
                      style={[styles.textInput, field.sizeError && styles.textInputError]}
                      placeholder="Enter sizes (e.g., 36, 36.5, 50%)"
                      placeholderTextColor="#9CA3AF"
                      value={field.sizes}
                      onChangeText={(text) => validateSizes(text, section.id, field.id)}
                      keyboardType="numeric"
                    />
                    {field.sizeError ? <Text style={styles.errorText}>{field.sizeError}</Text> : null}
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                style={styles.addFieldButton}
                onPress={() => addNewField(section.id)}
              >
                <Ionicons name="add" size={16} color="#7C3AED" />
                <Text style={styles.addFieldText}>Add New Field</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add New Section Button */}
          <TouchableOpacity 
            style={styles.addSectionButton}
            onPress={addNewSection}
          >
            <Ionicons name="add" size={16} color="#7C3AED" />
            <Text style={styles.addSectionText}>Add New Section</Text>
          </TouchableOpacity>
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
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveMeasurement}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Measurement</Text>
          )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 20,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfFieldContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  disabledDropdown: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addFieldText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 24,
    alignSelf: 'center',
  },
  addSectionText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
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
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default ExtendedFormScreen;