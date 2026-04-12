import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const BookingStep3EnterDetailsScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot } = route.params;
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [guests, setGuests] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [currentGuest, setCurrentGuest] = useState({
    name: '',
    email: '',
    selectedSlot: null,
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [editingGuestIndex, setEditingGuestIndex] = useState(-1);

  useEffect(() => {
    loadUserProfile();
    loadAvailableSlots();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success && response.data.user) {
        const user = response.data.user;
        setCustomerInfo({
          name: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          notes: '',
        });
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await ApiService.getAvailableSlots(
        service.organizationId,
        selectedDate,
        service._id
      );

      if (response.success) {
        setAvailableSlots(response.data.slots || []);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const handleNext = () => {
    if (!customerInfo.name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return;
    }

    if (!customerInfo.email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return;
    }

    if (!customerInfo.phone.trim()) {
      Alert.alert('Required Field', 'Please enter your phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate guest information
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (!guest.name.trim()) {
        Alert.alert('Guest Information', `Please enter name for Guest ${i + 1}`);
        return;
      }
      if (!guest.selectedSlot) {
        Alert.alert('Guest Information', `Please select time slot for Guest ${i + 1}`);
        return;
      }
    }

    navigation.navigate('BookingStep4SelectLocation', {
      service,
      selectedDate,
      selectedSlot,
      customerInfo,
      guests,
    });
  };

  const handleAddGuest = () => {
    setCurrentGuest({
      name: '',
      email: '',
      selectedSlot: null,
    });
    setEditingGuestIndex(-1);
    setShowGuestModal(true);
  };

  const handleEditGuest = (index) => {
    setCurrentGuest({ ...guests[index] });
    setEditingGuestIndex(index);
    setShowGuestModal(true);
  };

  const handleSaveGuest = () => {
    if (!currentGuest.name.trim()) {
      Alert.alert('Required Field', 'Please enter guest name');
      return;
    }

    if (!currentGuest.selectedSlot) {
      Alert.alert('Required Field', 'Please select a time slot for the guest');
      return;
    }

    if (editingGuestIndex >= 0) {
      // Editing existing guest
      const updatedGuests = [...guests];
      updatedGuests[editingGuestIndex] = { ...currentGuest };
      setGuests(updatedGuests);
    } else {
      // Adding new guest
      setGuests([...guests, { ...currentGuest }]);
    }

    setShowGuestModal(false);
    setCurrentGuest({ name: '', email: '', selectedSlot: null });
  };

  const handleRemoveGuest = (index) => {
    Alert.alert(
      'Remove Guest',
      'Are you sure you want to remove this guest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedGuests = guests.filter((_, i) => i !== index);
            setGuests(updatedGuests);
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderGuestItem = ({ item: guest, index }) => (
    <View style={styles.guestItem}>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{guest.name}</Text>
        {guest.email && <Text style={styles.guestEmail}>{guest.email}</Text>}
        <Text style={styles.guestSlot}>
          Time: {guest.selectedSlot?.displayTime || 'Not selected'}
        </Text>
      </View>
      <View style={styles.guestActions}>
        <TouchableOpacity
          style={styles.guestActionButton}
          onPress={() => handleEditGuest(index)}
        >
          <Ionicons name="pencil" size={16} color="#7B2CBF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.guestActionButton}
          onPress={() => handleRemoveGuest(index)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSlotOption = ({ item: slot }) => {
    const isSelected = currentGuest.selectedSlot?.datetime === slot.datetime;
    
    return (
      <TouchableOpacity
        style={[
          styles.slotOption,
          isSelected && styles.selectedSlotOption,
        ]}
        onPress={() => setCurrentGuest({ ...currentGuest, selectedSlot: slot })}
      >
        <Text style={[
          styles.slotOptionText,
          isSelected && styles.selectedSlotOptionText,
        ]}>
          {slot.displayTime}
        </Text>
        <View style={[
          styles.slotRadio,
          isSelected && styles.selectedSlotRadio,
        ]}>
          {isSelected && <View style={styles.slotRadioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
        <Text style={styles.progressText}>Step 3 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.bookingSummary}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedSlot.displayTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>
              {service.bookingAvailability?.slotDurationMinutes || 60} minutes
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>
          <Text style={styles.sectionSubtitle}>
            Please provide your contact details for the booking
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.name}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.email}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
              placeholder="Enter your email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={customerInfo.phone}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={customerInfo.notes}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, notes: text })}
              placeholder="Any special instructions or requests..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Guest Booking */}
        <View style={styles.section}>
          <View style={styles.guestHeaderText}>
            <Text style={styles.sectionTitle}>Guest Booking</Text>
            <Text style={styles.sectionSubtitle}>
              Add guests who will also book this service
            </Text>
          </View>

          {guests.length > 0 ? (
            <>
              <FlatList
                data={guests}
                renderItem={renderGuestItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.guestsList}
              />
              <TouchableOpacity
                style={styles.addGuestButton}
                onPress={handleAddGuest}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addGuestText}>Add Another Guest</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.noGuestsContainer}>
                <Ionicons name="people-outline" size={32} color="#E5E7EB" />
                <Text style={styles.noGuestsText}>No guests added</Text>
                <Text style={styles.noGuestsSubtext}>
                  Guests can book their own time slots for the same service
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addGuestButton}
                onPress={handleAddGuest}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addGuestText}>Add Guest</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue to Location</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Guest Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGuestIndex >= 0 ? 'Edit Guest' : 'Add Guest'}
              </Text>
              <TouchableOpacity onPress={() => setShowGuestModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Guest Name *</Text>
                <TextInput
                  style={styles.input}
                  value={currentGuest.name}
                  onChangeText={(text) => setCurrentGuest({ ...currentGuest, name: text })}
                  placeholder="Enter guest's full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Guest Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={currentGuest.email}
                  onChangeText={(text) => setCurrentGuest({ ...currentGuest, email: text })}
                  placeholder="Enter guest's email (optional)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Time Slot *</Text>
                <Text style={styles.slotSelectionNote}>
                  Guest can choose a different time slot than yours
                </Text>
                <FlatList
                  data={availableSlots}
                  renderItem={renderSlotOption}
                  keyExtractor={(item) => item.datetime}
                  scrollEnabled={false}
                  contentContainerStyle={styles.slotOptionsList}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGuestModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveGuest}
              >
                <Text style={styles.saveButtonText}>
                  {editingGuestIndex >= 0 ? 'Update Guest' : 'Add Guest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  bookingSummary: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  section: {
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
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  guestHeaderText: {
    marginBottom: 16,
  },
  addGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addGuestText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  guestsList: {
    gap: 12,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  guestEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  guestSlot: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  guestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  guestActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noGuestsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noGuestsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noGuestsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    height: '95%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  slotSelectionNote: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  slotOptionsList: {
    gap: 8,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  selectedSlotOption: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  slotOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedSlotOptionText: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
  slotRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSlotRadio: {
    borderColor: '#7B2CBF',
  },
  slotRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingStep3EnterDetailsScreen;