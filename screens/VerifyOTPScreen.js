import React, { useState, useRef } from 'react';
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
import ApiService from '../services/api';

const VerifyOTPScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);
  const { email } = route.params;

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

    setLoading(true);
    try {
      const response = await ApiService.verifyOTP(email, otpCode);

      if (response.success) {
        // Store the token and navigate directly to dashboard for new users
        await AsyncStorage.setItem('userToken', response.data.jwtToken);
        
        const userRole = response.data.user.role;
        if (userRole === 'SUPER_ADMIN') {
          navigation.replace('SuperAdminDashboard', { showTutorial: true, fromSignup: true });
        } else if (userRole === 'ORGANIZATION' || userRole === 'ADMIN') {
          navigation.replace('AdminDashboard', { showTutorial: true, fromSignup: true });
        } else {
          navigation.replace('Dashboard', { showTutorial: true, fromSignup: true });
        }
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
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
            style={styles.resendContainer}
            onPress={handleResendOTP}
            disabled={resendLoading}
          >
            <Text style={styles.resendText}>
              Didn't receive the code? {' '}
              {resendLoading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Text style={styles.resendLink}>Resend</Text>
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
});

export default VerifyOTPScreen;