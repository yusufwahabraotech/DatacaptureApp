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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login(email, password);

      if (response.success) {
        console.log('Login response:', response);
        console.log('JWT Token:', response.data.jwtToken);
        console.log('User verified status:', response.data.user.isVerified);
        
        // Check if user is verified
        if (!response.data.user.isVerified) {
          console.log('User not verified, redirecting to VerifyOTP');
          navigation.navigate('VerifyOTP', { 
            email: email.toLowerCase(),
            fromLogin: true // Flag to indicate this came from login attempt
          });
          return;
        }
        
        await AsyncStorage.setItem('userToken', response.data.jwtToken);
        
        // Verify token was stored
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('Stored token:', storedToken);
        
        const userRole = response.data.user.role;
        
        // Check login status for organization admins using new endpoint
        if (userRole === 'ORGANIZATION') {
          try {
            const loginStatusResponse = await ApiService.checkLoginStatus();
            console.log('Login status response:', loginStatusResponse);
            
            if (loginStatusResponse.success && loginStatusResponse.data.requiresSubscription) {
              navigation.replace('SubscriptionSelection');
              return;
            }
          } catch (error) {
            console.log('Login status check error:', error);
            navigation.replace('SubscriptionSelection');
            return;
          }
        }
        
        // Navigate to appropriate dashboard only if subscription check passes
        if (userRole === 'SUPER_ADMIN') {
          navigation.replace('SuperAdminDashboard', { showTutorial: true });
        } else if (userRole === 'ORGANIZATION') {
          navigation.replace('AdminDashboard', { showTutorial: true });
        } else {
          navigation.replace('Dashboard', { showTutorial: true });
        }
      } else {
        // Check if error data contains EMAIL_NOT_VERIFIED code
        const errorData = response.data || response;
        if (errorData.code === 'EMAIL_NOT_VERIFIED') {
          console.log('Email not verified, redirecting to VerifyOTP');
          navigation.navigate('VerifyOTP', { 
            email: errorData.email || email.toLowerCase(),
            fromLogin: true
          });
        } else if (errorData.code === 'ACCOUNT_SUSPENDED') {
          Alert.alert('Account Suspended', errorData.message || response.message);
        } else {
          Alert.alert('Login Failed', response.message || 'Invalid credentials');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Background Elements */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../assets/PurpleLogo.png')} style={styles.logoImage} />
          </View>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
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
                <Text style={styles.floatingLabel}>Password</Text>
                <View style={[styles.passwordContainer, passwordFocused && styles.passwordContainerFocused]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate('SignUp')}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    bottom: -50,
    left: -50,
  },
  inner: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 60,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#7C3AED',
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
});

export default LoginScreen;