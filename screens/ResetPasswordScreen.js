import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, otpData } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const inputRefs = useRef([]);
  const countdownInterval = useRef(null);
  const resendInterval = useRef(null);

  useEffect(() => {
    console.log('🚨 RESET PASSWORD OTP METADATA DEBUG 🚨');
    console.log('Route params:', route.params);
    console.log('OTP Data:', otpData);
    
    // Initialize OTP metadata from route params
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
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
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
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (countdown === 0) {
      Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚨 VERIFYING RESET OTP 🚨');
      console.log('Email:', email);
      console.log('OTP:', otp);
      
      const response = await ApiService.resetPassword(email, otpCode, newPassword);
      console.log('Verify Reset OTP Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Clear countdown on success
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        if (resendInterval.current) {
          clearInterval(resendInterval.current);
        }
        
        Alert.alert('Success', 'Password reset successfully. You can now login with your new password.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        console.log('OTP verification failed:', response.message);
        
        // Update remaining attempts if provided in response
        if (response.remainingAttempts !== undefined) {
          setRemainingAttempts(response.remainingAttempts);
        } else {
          setRemainingAttempts(prev => Math.max(0, prev - 1));
        }
        
        if (remainingAttempts <= 1) {
          Alert.alert('Maximum Verification Attempts Exceeded', 'You have exceeded the maximum number of verification attempts. Please request a new code.');
        } else {
          Alert.alert('Verification Failed', response.message || 'Invalid code. Please try again.');
        }
      }
    } catch (error) {
      console.log('OTP verification error:', error);
      Alert.alert('Verification Error', 'Unable to verify code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const response = await ApiService.forgotPassword(email);
      if (response.success) {
        Alert.alert('Success', 'New verification code sent to your email');
        setOtp(['', '', '', '', '', '']); // Clear current OTP
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
        Alert.alert('Error', response.message || 'Failed to resend code');
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
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#7C3AED" />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the verification code and your new password
        </Text>
        
        {/* Countdown Timer */}
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color="#7C3AED" />
          <Text style={styles.timerText}>
            {countdown > 0 ? `Code expires in ${formatTime(countdown)}` : 'Code has expired'}
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

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.resendButton,
            resendCountdown > 0 && styles.resendButtonDisabled
          ]}
          onPress={handleResendCode}
          disabled={resendCountdown > 0 || resendLoading || remainingAttempts === 0}
        >
          <Text style={[
            styles.resendButtonText,
            resendCountdown > 0 && styles.resendButtonTextDisabled
          ]}>
            {resendCountdown > 0 ? (
              `Resend code in ${resendCountdown}s`
            ) : remainingAttempts === 0 ? (
              'Maximum verification attempts exceeded'
            ) : resendLoading ? (
              'Sending new code...'
            ) : (
              'Didn\'t receive code? Resend'
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.verifyButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
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
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resetButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
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
    marginBottom: 24,
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
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ResetPasswordScreen;