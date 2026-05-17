import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { countries } from '../data/countries';
import ApiService from '../services/api';

const SignUpScreen = ({ navigation, route }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedIndustryName, setSelectedIndustryName] = useState('');
  const [industries, setIndustries] = useState([]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [industrySearchText, setIndustrySearchText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [organizationNameFocused, setOrganizationNameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  const userRole = route?.params?.userRole || 'CUSTOMER';
  const isAdmin = userRole === 'ORGANIZATION';

  // Fetch industries when component mounts and user is admin
  React.useEffect(() => {
    if (isAdmin) {
      fetchIndustries();
    }
  }, [isAdmin]);

  const fetchIndustries = async () => {
    try {
      setLoadingIndustries(true);
      console.log('🚨 FETCHING INDUSTRIES 🚨');
      console.log('Making API call to: /auth/industries');
      
      // Try the auth endpoint first
      let response = await ApiService.apiCall('/auth/industries');
      console.log('🚨 INDUSTRIES API RESPONSE (auth endpoint) 🚨');
      console.log('Response success:', response.success);
      console.log('Response message:', response.message);
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      // If auth endpoint fails or returns no data, try the public endpoint
      if (!response.success || !response.data || !response.data.industries || response.data.industries.length === 0) {
        console.log('🔄 Trying alternative endpoint: /super-admin/industries');
        response = await ApiService.apiCall('/super-admin/industries');
        console.log('🚨 INDUSTRIES API RESPONSE (super-admin endpoint) 🚨');
        console.log('Response success:', response.success);
        console.log('Full response:', JSON.stringify(response, null, 2));
      }
      
      if (response.success) {
        if (response.data && response.data.industries) {
          console.log('✅ Industries fetched successfully:', response.data.industries.length);
          console.log('Industries array:', JSON.stringify(response.data.industries, null, 2));
          setIndustries(response.data.industries);
        } else {
          console.log('❌ No industries in response data');
          console.log('Response data structure:', response.data);
          Alert.alert('Error', 'No industries available. Please contact support.');
        }
      } else {
        console.log('❌ Failed to fetch industries:', response.message);
        Alert.alert('Error', response.message || 'Failed to load industries');
      }
    } catch (error) {
      console.error('❌ Failed to fetch industries - exception:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Error', 'Failed to load industries. Please try again.');
    } finally {
      setLoadingIndustries(false);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setPasswordMismatch(password !== text && text.length > 0);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordMismatch(confirmPassword !== text && confirmPassword.length > 0);
  };

  const handleSignUp = async () => {
    const requiredFields = [fullName, email, phoneNumber, password, confirmPassword];
    if (isAdmin) {
      requiredFields.push(organizationName, selectedCountry, selectedIndustry);
    }

    console.log('🚨 SIGNUP VALIDATION DEBUG 🚨');
    console.log('Full Name:', fullName);
    console.log('Email:', email);
    console.log('Phone:', phoneNumber);
    console.log('Password:', password ? '***' : 'empty');
    console.log('Confirm Password:', confirmPassword ? '***' : 'empty');
    if (isAdmin) {
      console.log('Organization Name:', organizationName);
      console.log('Country:', selectedCountry);
      console.log('Industry ID:', selectedIndustry);
      console.log('Industry Name:', selectedIndustryName);
    }

    if (requiredFields.some(field => !field)) {
      console.log('❌ VALIDATION FAILED - Missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        email: email.toLowerCase(),
        password,
        fullName,
        phoneNumber,
        role: userRole,
      };

      if (isAdmin) {
        requestBody.organizationName = organizationName;
        requestBody.country = selectedCountry;
        requestBody.industryId = selectedIndustry;
        requestBody.industryName = selectedIndustryName;
      }

      const response = await ApiService.register(requestBody);
      console.log('🚨 SIGNUP RESPONSE DEBUG 🚨');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      console.log('Response message:', response.message);

      if (response.success) {
        console.log('✅ Registration successful, navigating to VerifyOTP');
        console.log('Navigating to VerifyOTP with data:', {
          email: email.toLowerCase(),
          otpData: response.data
        });
        
        navigation.navigate('VerifyOTP', { 
          email: email.toLowerCase(),
          otpData: response.data // Pass OTP metadata
        });
      } else {
        console.log('❌ Registration failed:', response.message);
        Alert.alert('Registration Failed', response.message || 'Failed to create account');
      }
    } catch (error) {
      console.log('❌ SIGNUP ERROR:', error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(countrySearchText.toLowerCase())
  );

  const filteredIndustries = industries.filter(industry => 
    industry.name.toLowerCase().includes(industrySearchText.toLowerCase())
  );

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
      }}
    >
      <Text style={styles.countryText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderIndustryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        console.log('🚨 INDUSTRY SELECTED 🚨');
        console.log('Industry ID:', item.id);
        console.log('Industry Name:', item.name);
        setSelectedIndustry(item.id);
        setSelectedIndustryName(item.name);
        setShowIndustryModal(false);
      }}
    >
      <Text style={styles.countryText}>{item.name}</Text>
      {item.description && (
        <Text style={styles.industryDescription}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.inner}>
            {/* Background Elements */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/Vestradat_logo_new.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.roleToggleButton}
                onPress={() => navigation.navigate('RoleSelection')}
              >
                <Ionicons name="people" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign Up</Text>
              <Text style={styles.subtitle}>
                Create {isAdmin ? 'an admin' : 'a customer'} account and get started!
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.floatingLabel}>Full Name</Text>
                  <TextInput
                    style={[styles.input, fullNameFocused && styles.inputFocused]}
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setFullNameFocused(true)}
                    onBlur={() => setFullNameFocused(false)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.floatingLabel}>Email Address</Text>
                  <TextInput
                    style={[styles.input, emailFocused && styles.inputFocused]}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Enter your email address"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.floatingLabel}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, phoneNumberFocused && styles.inputFocused]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => setPhoneNumberFocused(true)}
                    onBlur={() => setPhoneNumberFocused(false)}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {isAdmin && (
                <>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.floatingLabel}>Organization Name</Text>
                      <TextInput
                        style={[styles.input, organizationNameFocused && styles.inputFocused]}
                        value={organizationName}
                        onChangeText={setOrganizationName}
                        onFocus={() => setOrganizationNameFocused(true)}
                        onBlur={() => setOrganizationNameFocused(false)}
                        placeholder="Enter your organization name"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.floatingLabel}>Country</Text>
                      <TouchableOpacity
                        style={[styles.input, styles.countrySelector]}
                        onPress={() => setShowCountryModal(true)}
                      >
                        <Text style={[styles.countryText, !selectedCountry && styles.placeholderText]}>
                          {selectedCountry || 'Select your country'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.floatingLabel}>Industry</Text>
                      <TouchableOpacity
                        style={[styles.input, styles.countrySelector, loadingIndustries && styles.inputDisabled]}
                        onPress={() => {
                          if (loadingIndustries) {
                            Alert.alert('Please wait', 'Industries are still loading...');
                            return;
                          }
                          if (industries.length === 0) {
                            Alert.alert('No Industries', 'No industries available. Please try again later.');
                            return;
                          }
                          console.log('🚨 OPENING INDUSTRY MODAL 🚨');
                          console.log('Current selectedIndustry:', selectedIndustry);
                          console.log('Current selectedIndustryName:', selectedIndustryName);
                          console.log('Available industries count:', industries.length);
                          setShowIndustryModal(true);
                        }}
                        disabled={loadingIndustries}
                      >
                        {loadingIndustries ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#7C3AED" />
                            <Text style={[styles.countryText, styles.loadingText]}>Loading industries...</Text>
                          </View>
                        ) : (
                          <>
                            <Text style={[styles.countryText, !selectedIndustryName && styles.placeholderText]}>
                              {selectedIndustryName || 'Select your industry'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.floatingLabel}>Password</Text>
                  <View style={[styles.passwordContainer, passwordFocused && styles.passwordContainerFocused]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={handlePasswordChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.floatingLabel}>Confirm Password</Text>
                  <View style={[styles.passwordContainer, confirmPasswordFocused && styles.passwordContainerFocused]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordMismatch && (
                    <Text style={styles.errorText}>Password mismatch</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]} 
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text
                  style={styles.loginLink}
                  onPress={() => navigation.navigate('Login')}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            onPress={() => setShowCountryModal(false)} 
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => {
                setShowCountryModal(false);
                setCountrySearchText('');
              }}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor="#9CA3AF"
                value={countrySearchText}
                onChangeText={setCountrySearchText}
              />
            </View>
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item}
              style={styles.countryList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>
      {/* Industry Selection Modal */}
      <Modal
        visible={showIndustryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIndustryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            onPress={() => setShowIndustryModal(false)} 
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Industry</Text>
              <TouchableOpacity onPress={() => {
                setShowIndustryModal(false);
                setIndustrySearchText('');
              }}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search industries..."
                placeholderTextColor="#9CA3AF"
                value={industrySearchText}
                onChangeText={setIndustrySearchText}
              />
            </View>
            {loadingIndustries ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.modalLoadingText}>Loading industries...</Text>
              </View>
            ) : filteredIndustries.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                <Text style={styles.modalEmptyText}>
                  {industrySearchText ? 'No industries found' : 'No industries available'}
                </Text>
                {!industrySearchText && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={fetchIndustries}
                  >
                    <Ionicons name="refresh" size={20} color="#7C3AED" />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredIndustries}
                renderItem={renderIndustryItem}
                keyExtractor={(item) => item.id}
                style={styles.countryList}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  bgCircle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    top: -150,
    right: -120,
  },
  bgCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    bottom: -80,
    left: -80,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  roleToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logo: {
    width: 120,
    height: 60,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    top: -8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#7C3AED',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  passwordContainerFocused: {
    borderColor: '#7C3AED',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
  },
  signUpButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  signUpButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 60,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryText: {
    fontSize: 16,
    color: '#1F2937',
  },
  industryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#7C3AED',
    marginLeft: 10,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default SignUpScreen;