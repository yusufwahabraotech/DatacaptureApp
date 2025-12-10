import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TutorialModal = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const tutorialSteps = [
    {
      id: 1,
      title: 'Quick Actions',
      description: 'Access your recent measurements and copy data instantly from the dashboard header.',
      icon: 'flash',
      color: '#7C3AED',
    },
    {
      id: 2,
      title: 'Measurement Cards',
      description: 'View your body, object, and questionnaire data at a glance with quick create buttons.',
      icon: 'grid',
      color: '#F59E0B',
    },
    {
      id: 3,
      title: 'Data Management',
      description: 'Export, filter, and manage all your measurements in the comprehensive data table below.',
      icon: 'document-text',
      color: '#10B981',
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      setCurrentStep(0);
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* Message Bubble Tail */}
          <View style={styles.bubbleTail} />
          
          {/* Gradient Background */}
          <View style={[styles.gradientBackground, { backgroundColor: `${currentTutorial.color}15` }]} />
          
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: currentTutorial.color }]}>
              <Ionicons name={currentTutorial.icon} size={40} color="white" />
            </View>

            <Text style={styles.stepIndicator}>
              Step {currentStep + 1} of {tutorialSteps.length}
            </Text>

            <Text style={styles.title}>{currentTutorial.title}</Text>
            <Text style={styles.description}>{currentTutorial.description}</Text>

            <View style={styles.pagination}>
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.nextButton, currentStep === 0 && styles.fullWidthButton]} 
                onPress={handleNext}
              >
                <Text style={styles.nextText}>
                  {currentStep === tutorialSteps.length - 1 ? 'Got it!' : 'Next'}
                </Text>
                <Ionicons 
                  name={currentStep === tutorialSteps.length - 1 ? 'checkmark' : 'arrow-forward'} 
                  size={18} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    width: width * 0.9,
    maxWidth: 400,
    paddingVertical: 35,
    paddingHorizontal: 30,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#F3F4F6',
    position: 'relative',
    overflow: 'visible',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -15,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 30,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#F3F4F6',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    opacity: 0.3,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: 'white',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 35,
    paddingHorizontal: 5,
    fontWeight: '400',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#7C3AED',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 6,
  },
});

export default TutorialModal;