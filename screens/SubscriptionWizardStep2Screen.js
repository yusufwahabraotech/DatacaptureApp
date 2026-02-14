import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const SubscriptionWizardStep2Screen = ({ navigation, route }) => {
  const { selectedPackage, selectedDuration, promoCode, includeVerifiedBadge } = route.params;
  const [businessRegistrationStatus, setBusinessRegistrationStatus] = useState('registered');
  const [publicProfile, setPublicProfile] = useState('yes');
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const handleNext = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'User profile not loaded');
      return;
    }

    setLoading(true);
    try {
      // Get organization ID from user profile
      const organizationId = userProfile.organizationId || userProfile._id;
      
      // Prepare profile data according to API specification
      const profileData = {
        businessType: businessRegistrationStatus,
        isPublicProfile: publicProfile === 'yes',
        verificationStatus: verificationStatus,
      };

      console.log('Updating organization profile with:', profileData);
      const response = await ApiService.updateOrganizationProfileSettings(organizationId, profileData);
      
      if (response.success) {
        // If public profile is 'no' OR verification status is 'unverified', skip to step 5
        if (publicProfile === 'no' || verificationStatus === 'unverified') {
          navigation.navigate('SubscriptionWizardStep5', {
            selectedPackage,
            selectedDuration,
            promoCode,
            includeVerifiedBadge: false,
            profileData: {
              businessRegistrationStatus,
              publicProfile,
              verificationStatus,
            },
            locationData: null,
            paymentSummary: {
              packagePrice: selectedPackage.services
                ?.filter(service => service.duration === selectedDuration)
                ?.reduce((total, service) => total + service.price, 0) || 0,
              locationVerificationPrice: 0,
              totalAmount: selectedPackage.services
                ?.filter(service => service.duration === selectedDuration)
                ?.reduce((total, service) => total + service.price, 0) || 0,
            },
          });
        } else {
          // Continue to next step for location setup
          navigation.navigate('SubscriptionWizardStep3', {
            selectedPackage,
            selectedDuration,
            promoCode,
            includeVerifiedBadge,
            profileData: {
              businessRegistrationStatus,
              publicProfile,
              verificationStatus,
            },
          });
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to update organization profile');
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update organization profile');
    } finally {
      setLoading(false);
    }
  };



  const renderProgressSteps = () => (
    <View style={styles.progressContainer}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.completedStep]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={[styles.stepText, styles.completedText]}>Packages</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.activeStep]}>
          <Text style={styles.activeStepText}>2</Text>
        </View>
        <Text style={[styles.stepText, styles.activeText]}>Profile</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.upcomingStep]}>
          <Text style={styles.upcomingStepText}>3</Text>
        </View>
        <Text style={[styles.stepText, styles.upcomingText]}>Locations</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.upcomingStep]}>
          <Text style={styles.upcomingStepText}>4</Text>
        </View>
        <Text style={[styles.stepText, styles.upcomingText]}>Location Payment</Text>
      </View>
      
      <View style={styles.stepLine} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.upcomingStep]}>
          <Text style={styles.upcomingStepText}>5</Text>
        </View>
        <Text style={[styles.stepText, styles.upcomingText]}>Package Payment</Text>
      </View>
    </View>
  );

  const renderRadioOption = (value, currentValue, onPress, label) => (
    <TouchableOpacity style={styles.radioOption} onPress={() => onPress(value)}>
      <View style={styles.radioCircle}>
        {currentValue === value && <View style={styles.radioSelected} />}
      </View>
      <Text style={styles.radioText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Profile Setup</Text>
      </View>

      {renderProgressSteps()}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Organization Profile Setup</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Registration Status:</Text>
          {renderRadioOption('registered', businessRegistrationStatus, setBusinessRegistrationStatus, 'Registered')}
          {renderRadioOption('unregistered', businessRegistrationStatus, setBusinessRegistrationStatus, 'Unregistered')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Make Your Organization Profile Available to the Public?</Text>
          {renderRadioOption('yes', publicProfile, (value) => {
            setPublicProfile(value);
            if (value === 'no') {
              setVerificationStatus('unverified');
            }
          }, 'Yes')}
          {renderRadioOption('no', publicProfile, (value) => {
            setPublicProfile(value);
            if (value === 'no') {
              setVerificationStatus('unverified');
            }
          }, 'No')}
        </View>

        {publicProfile === 'yes' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Status:</Text>
            {renderRadioOption('verified', verificationStatus, setVerificationStatus, 'Verified')}
            {renderRadioOption('unverified', verificationStatus, setVerificationStatus, 'Unverified')}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {publicProfile === 'no' ? 'Pay Now' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completedStep: {
    backgroundColor: '#6B7280',
  },
  activeStep: {
    backgroundColor: '#7C3AED',
  },
  upcomingStep: {
    backgroundColor: '#E5E7EB',
  },
  activeStepText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingStepText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 10,
    textAlign: 'center',
  },
  completedText: {
    color: '#6B7280',
  },
  activeText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  upcomingText: {
    color: '#6B7280',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#E5E7EB',
    flex: 0.5,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7C3AED',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default SubscriptionWizardStep2Screen;