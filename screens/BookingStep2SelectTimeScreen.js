import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingStep2SelectTimeScreen = ({ navigation, route }) => {
  const { service, selectedDate } = route.params;
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAvailableSlots(
        service.organizationId,
        selectedDate,
        service._id
      );

      if (response.success) {
        setAvailableSlots(response.data.slots || []);
      } else {
        Alert.alert('Error', 'Failed to load available time slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleNext = () => {
    if (!selectedSlot) {
      Alert.alert('Please Select a Time', 'Choose an available time slot to continue');
      return;
    }

    navigation.navigate('BookingStep3EnterDetails', {
      service,
      selectedDate,
      selectedSlot,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderTimeSlot = ({ item: slot }) => {
    const isSelected = selectedSlot?.datetime === slot.datetime;
    const duration = service.bookingAvailability?.slotDurationMinutes || 60;
    
    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
        ]}
        onPress={() => handleSlotSelect(slot)}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeInfo}>
            <Text style={[
              styles.timeText,
              isSelected && styles.selectedTimeText,
            ]}>
              {slot.displayTime}
            </Text>
            <Text style={[
              styles.durationText,
              isSelected && styles.selectedDurationText,
            ]}>
              {duration} minutes
            </Text>
          </View>
          
          <View style={styles.timeSlotRight}>
            <View style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Available Slots</Text>
      <Text style={styles.emptyMessage}>
        There are no available time slots for this date. Please try selecting a different date.
      </Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Choose Different Date</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Time</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading available time slots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Time</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
        <Text style={styles.progressText}>Step 2 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceProvider}>{service.producer}</Text>
          
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={16} color="#7B2CBF" />
            <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.slotsContainer}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your preferred time for the {service.bookingAvailability?.slotDurationMinutes || 60}-minute session
          </Text>

          {availableSlots.length > 0 ? (
            <FlatList
              data={availableSlots}
              renderItem={renderTimeSlot}
              keyExtractor={(item) => item.datetime}
              scrollEnabled={false}
              contentContainerStyle={styles.slotsList}
            />
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <View style={styles.selectedSlotInfo}>
            <View style={styles.selectedSlotHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.selectedSlotTitle}>Selected Time Slot</Text>
            </View>
            
            <View style={styles.selectedSlotDetails}>
              <View style={styles.slotDetailRow}>
                <Text style={styles.slotDetailLabel}>Date:</Text>
                <Text style={styles.slotDetailValue}>{formatDate(selectedDate)}</Text>
              </View>
              <View style={styles.slotDetailRow}>
                <Text style={styles.slotDetailLabel}>Time:</Text>
                <Text style={styles.slotDetailValue}>{selectedSlot.displayTime}</Text>
              </View>
              <View style={styles.slotDetailRow}>
                <Text style={styles.slotDetailLabel}>Duration:</Text>
                <Text style={styles.slotDetailValue}>
                  {service.bookingAvailability?.slotDurationMinutes || 60} minutes
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedSlot && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedSlot}
        >
          <Text style={styles.nextButtonText}>Continue to Details</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#7B2CBF',
  },
  completedStep: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  serviceInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 16,
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 12,
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  slotsContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  slotsList: {
    gap: 12,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  selectedTimeSlot: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedTimeText: {
    color: '#7B2CBF',
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedDurationText: {
    color: '#7B2CBF',
  },
  timeSlotRight: {
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#7B2CBF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectedSlotInfo: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  selectedSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectedSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedSlotDetails: {
    gap: 8,
  },
  slotDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  slotDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingStep2SelectTimeScreen;