import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      id: 1,
      title: 'Capture Body Measurements',
      description: 'Easily record and track body measurements with precision using our advanced measurement tools.',
      icon: 'body',
      color: '#7C3AED',
      image: require('../assets/BodyMeasurement.png'),
    },
    {
      id: 2,
      title: 'AI-Powered Analysis',
      description: 'Leverage artificial intelligence to analyze measurements and provide intelligent insights for better results.',
      icon: 'brain-outline',
      color: '#F59E0B',
      image: require('../assets/AI analyze.png'),
    },
    {
      id: 3,
      title: 'Smart Analytics',
      description: 'Get insights from your measurements with detailed analytics, export data, and track progress over time.',
      icon: 'analytics',
      color: '#10B981',
      image: require('../assets/SmartAnalytics2.jpg'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      navigation.replace('RoleSelection');
    }
  };

  const handleSkip = () => {
    navigation.replace('RoleSelection');
  };

  const currentItem = onboardingData[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: currentItem.color + '10' }]}>
      {/* Animated Background Elements */}
      <Animated.View style={[styles.bgCircle1, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.bgCircle2, { opacity: fadeAnim }]} />
      
      {currentIndex > 0 && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentIndex(currentIndex - 1)}
        >
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.imageContainer}>
          <View style={[styles.imageGlow, { backgroundColor: currentItem.color + '20' }]} />
          <Image source={currentItem.image} style={styles.logo} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentItem.title}</Text>
          <Text style={styles.description}>{currentItem.description}</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={currentIndex === onboardingData.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color="white" 
          />
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
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    bottom: -50,
    left: -50,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 50,
    alignItems: 'center',
  },
  imageGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.6,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: 'white',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#7C3AED',
    width: 32,
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;