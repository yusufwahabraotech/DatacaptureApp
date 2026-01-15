import React, { useState, useRef, useEffect } from 'react';
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

const VerifyOTPScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const inputRefs = useRef([]);
  const countdownInterval = useRef(null);
  const resendInterval = useRef(null);
  const { email, otpData } = route.params;

  useEffect(() => {
    console.log('🚨 OTP METADATA DEBUG 🚨');
    console.log('Route params:', route.params);
    console.log('OTP Data:', otpData);
    
    // Initialize OTP metadata from route params or set defaults
    if (otpData) {
      console.log('Setting remainingAttempts:', otpData.remainingAttempts);
      console.log('Setting maxAttempts:', otpData.maxAttempts);
      console.log('Setting countdown from otpExpiresIn:', otpData.otpExpiresIn);
      
      setRemainingAttempts(otpData.remainingAttempts || 3);
      setMaxAttempts(otpData.maxAttempts || 3);
      
      if (otpData.otpExpiresIn) {
        setCountdown(otpData.otpExpiresIn);
        startCountdown(otpData.otpExpiresIn);
      }
    } else {
      console.log('No OTP data found, setting default 10 minute countdown');
      // Fallback: Set default 10 minute countdown if no metadata
      setCountdown(600); // 10 minutes
      startCountdown(600);
      // Start 60-second resend countdown
      setResendCountdown(60);
      startResendCountdown(60);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (resendInterval.current) {
        clearInterval(resendInterval.current);
      }
    };
  }, [otpData]);

  const startCountdown = (seconds) => {
    console.log('Starting countdown with seconds:', seconds);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        console.log('Countdown tick:', newValue);
        
        if (newValue <= 0) {
          console.log('Countdown finished, clearing interval');
          clearInterval(countdownInterval.current);
          return 0;
        }
        return newValue;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startResendCountdown = (seconds) => {
    console.log('Starting resend countdown with seconds:', seconds);
    
    if (resendInterval.current) {
      clearInterval(resendInterval.current);
    }

    resendInterval.current = setInterval(() => {
      setResendCountdown((prev) => {
        const newValue = prev - 1;
        console.log('Resend countdown tick:', newValue);
        
        if (newValue <= 0) {
          console.log('Resend countdown finished, clearing interval');
          clearInterval(resendInterval.current);
          return 0;
        }
        return newValue;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    if (countdown === 0) {
      Alert.alert('OTP Expired', 'The OTP has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚨 VERIFYING OTP 🚨');
      console.log('Email:', email);
      console.log('OTP Code:', otpCode);
      
      const response = await ApiService.verifyOTP(email, otpCode);
      console.log('Verify OTP Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        // Clear countdown on success
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        
        // Store the token and navigate directly to dashboard for new users
        if (response.data.jwtToken) {
          await AsyncStorage.setItem('userToken', response.data.jwtToken);
        }
        
        const userRole = response.data.user?.role;
        if (userRole === 'SUPER_ADMIN') {
          navigation.replace('SuperAdminDashboard', { showTutorial: true, fromSignup: true });
        } else if (userRole === 'ORGANIZATION' || userRole === 'ADMIN') {
          navigation.replace('AdminDashboard', { showTutorial: true, fromSignup: true });
        } else {
          navigation.replace('Dashboard', { showTutorial: true, fromSignup: true });
        }
      } else {
        console.log('OTP verification failed:', response.message);
        
        // Update remaining attempts if provided in response
        if (response.remainingAttempts !== undefined) {
          setRemainingAttempts(response.remainingAttempts);
        } else {
          setRemainingAttempts(prev => Math.max(0, prev - 1));
        }
        
        if (remainingAttempts <= 1) {
          Alert.alert('Maximum Verification Attempts Exceeded', 'You have exceeded the maximum number of verification attempts. Please request a new OTP.');
        } else {
          Alert.alert('Verification Failed', response.message || 'Invalid OTP. Please try again.');
        }
      }
    } catch (error) {
      console.log('OTP verification error:', error);
      Alert.alert('Verification Error', 'Unable to verify OTP. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await ApiService.resendOTP(email);

      if (response.success) {
        Alert.alert('Success', 'OTP sent successfully!');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Update OTP metadata from response
        if (response.data) {
          setRemainingAttempts(response.data.remainingAttempts || 3);
          setMaxAttempts(response.data.maxAttempts || 3);
          
          if (response.data.otpExpiresIn) {
            setCountdown(response.data.otpExpiresIn);
            startCountdown(response.data.otpExpiresIn);
          }
          
          // Start new 60-second resend countdown
          setResendCountdown(60);
          startResendCountdown(60);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          
          <View style={styles.logoContainer}>
            <Image source={require('../assets/PurpleLogo.png')} style={styles.logoImage} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email}
            </Text>
            
            {/* Countdown Timer */}
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color="#7C3AED" />
              <Text style={styles.timerText}>
                {countdown > 0 ? `OTP expires in ${formatTime(countdown)}` : 'OTP has expired'}
              </Text>
            </View>
            
            {/* Remaining Attempts */}
            {remainingAttempts < maxAttempts && (
              <View style={styles.attemptsContainer}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                <Text style={styles.attemptsText}>
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            )}
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.resendContainer,
              resendCountdown > 0 && styles.resendDisabled
            ]}
            onPress={handleResendOTP}
            disabled={resendCountdown > 0 || resendLoading || remainingAttempts === 0}
          >
            <Text style={[
              styles.resendText,
              resendCountdown > 0 && styles.resendTextDisabled
            ]}>
              {resendCountdown > 0 ? (
                `Resend OTP in ${resendCountdown}s`
              ) : remainingAttempts === 0 ? (
                'Maximum verification attempts exceeded'
              ) : (
                <>Didn't receive the code? {' '}
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  )}
                </>
              )}
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
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
    paddingHorizontal: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    alignSelf: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 6,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    alignSelf: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 6,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
});

export default VerifyOTPScreen;