import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingStep1SelectDayScreen = ({ navigation, route }) => {
  const { service } = route.params;
  const [loading, setLoading] = useState(true);
  const [availableDays, setAvailableDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    console.log('🚨 ADMIN MONTH/YEAR CHANGED 🚨');
    console.log('New month:', currentMonth, 'New year:', currentYear);
    loadAvailableDays();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    console.log('🚨 ADMIN AVAILABLE DAYS CHANGED 🚨');
    console.log('Available days updated:', availableDays.length);
    generateCalendar();
  }, [availableDays, currentMonth, currentYear]);

  const loadAvailableDays = async () => {
    try {
      setLoading(true);
      console.log('🚨 ADMIN LOADING AVAILABLE DAYS 🚨');
      console.log('Service ID:', service._id);
      console.log('Month:', currentMonth, 'Year:', currentYear);
      console.log('Using ADMIN BOOKING endpoint: /admin/booking/available-days');
      
      // Use the correct admin booking endpoint
      const response = await ApiService.getAdminBookingAvailableDays(
        currentMonth,
        currentYear,
        service._id
      );

      console.log('🚨 ADMIN AVAILABLE DAYS RESPONSE 🚨');
      console.log('Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        const availableDaysData = response.data.availableDays || [];
        console.log('Admin available days count:', availableDaysData.length);
        console.log('Admin available days:', availableDaysData);
        
        // For admin bookings, trust the API response - don't filter based on service config
        // The backend should handle the business logic for admin availability
        console.log('🔧 ADMIN: Using all API available days without filtering');
        setAvailableDays(availableDaysData);
      } else {
        console.log('❌ ADMIN API Error:', response.message);
        Alert.alert('Error', response.message || 'Failed to load available days');
        setAvailableDays([]);
      }
    } catch (error) {
      console.error('❌ ADMIN Exception loading available days:', error);
      Alert.alert('Error', 'Failed to load available days');
      setAvailableDays([]);
    } finally {
      console.log('🚨 ADMIN SETTING LOADING TO FALSE 🚨');
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    console.log('🚨 ADMIN GENERATING CALENDAR 🚨');
    console.log('Current month:', currentMonth, 'Current year:', currentYear);
    console.log('Available days:', availableDays.length, availableDays);
    
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    console.log('🚨 ADMIN CALENDAR DEBUG 🚨');
    console.log('First day of month:', firstDay.toDateString(), 'Day of week:', firstDay.getDay());
    console.log('Start date for calendar:', startDate.toDateString(), 'Day of week:', startDate.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Create date string in local timezone to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const isCurrentMonth = date.getMonth() === currentMonth - 1;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const isAvailable = availableDays.includes(dateString);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Debug first few days to see alignment
      if (i < 14) {
        console.log(`Admin Day ${i}: ${date.toDateString()} (${dayOfWeek}) - ${dateString} - Available: ${isAvailable}`);
      }

      // FOR ADMIN: Allow selection of any available date from API (trust backend logic)
      const isAdminSelectable = isCurrentMonth && !isPast && isAvailable;

      days.push({
        date: date,
        dateString: dateString,
        day: date.getDate(),
        dayOfWeek: dayOfWeek,
        isCurrentMonth,
        isToday,
        isPast,
        isAvailable: isAvailable, // From API
        isSelectable: isAdminSelectable, // Admin can select any API available date
      });
    }

    console.log('🚨 ADMIN CALENDAR GENERATED 🚨');
    console.log('Total days:', days.length);
    console.log('API Available days in calendar:', days.filter(d => d.isAvailable).length);
    console.log('Admin selectable days:', days.filter(d => d.isSelectable).length);
    console.log('Current month days:', days.filter(d => d.isCurrentMonth).length);
    
    // Debug day alignment
    const firstWeek = days.slice(0, 7);
    console.log('Admin first week alignment:');
    firstWeek.forEach((day, index) => {
      console.log(`Position ${index} (${dayNames[index]}): ${day.date.toDateString()} (actual: ${dayNames[day.dayOfWeek]}) - Selectable: ${day.isSelectable}`);
    });
    
    setCalendarDays(days);
  };

  const handleDateSelect = (day) => {
    if (!day.isSelectable) return;
    setSelectedDate(day.dateString);
  };

  const handleNext = () => {
    if (!selectedDate) {
      Alert.alert('Please Select a Date', 'Choose an available date to continue');
      return;
    }

    navigation.navigate('AdminBookingStep2SelectTime', {
      service,
      selectedDate,
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentYear, currentMonth - 1 + direction, 1);
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(null);
  };

  const renderCalendarDay = (day, index) => {
    const isSelected = selectedDate === day.dateString;
    const expectedDayOfWeek = index % 7; // Expected position in week
    const actualDayOfWeek = day.dayOfWeek; // Actual day of week
    
    // Debug misalignment
    if (day.isCurrentMonth && expectedDayOfWeek !== actualDayOfWeek) {
      console.log(`⚠️ ADMIN DAY MISALIGNMENT: Position ${index} (${dayNames[expectedDayOfWeek]}) has ${day.date.toDateString()} (${dayNames[actualDayOfWeek]})`);
    }
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.otherMonthDay,
          day.isToday && styles.todayDay,
          day.isSelectable && styles.availableDay, // Use isSelectable for admin
          isSelected && styles.selectedDay,
          !day.isSelectable && styles.disabledDay,
        ]}
        onPress={() => handleDateSelect(day)}
        disabled={!day.isSelectable}
      >
        <Text style={[
          styles.dayText,
          !day.isCurrentMonth && styles.otherMonthText,
          day.isToday && styles.todayText,
          day.isSelectable && styles.availableText, // Use isSelectable for admin
          isSelected && styles.selectedText,
          !day.isSelectable && styles.disabledText,
        ]}>
          {day.day}
        </Text>
        {day.isSelectable && !isSelected && (
          <View style={styles.availableDot} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Booking - Select Date</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading available dates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Booking - Select Date</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
        <Text style={styles.progressText}>Step 1 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceProvider}>{service.producer}</Text>
          <View style={styles.serviceMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#7B2CBF" />
              <Text style={styles.metaText}>
                {service.bookingAvailability?.slotDurationMinutes || 60} minutes
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="card-outline" size={16} color="#7B2CBF" />
              <Text style={styles.metaText}>
                ₦{(service.actualAmount || service.priceInDollars || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#7B2CBF" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {monthNames[currentMonth - 1]} {currentYear}
            </Text>
            
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth(1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#7B2CBF" />
            </TouchableOpacity>
          </View>



          <View style={styles.dayNamesRow}>
            {dayNames.map((dayName, index) => (
              <View key={index} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{dayName}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.availableDot]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.selectedLegendDot]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.unavailableLegendDot]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>

        {selectedDate && (
          <View style={styles.selectedDateInfo}>
            <Ionicons name="calendar" size={20} color="#7B2CBF" />
            <Text style={styles.selectedDateText}>
              {(() => {
                // Parse the date string and create date in local timezone
                const [year, month, day] = selectedDate.split('-').map(Number);
                const localDate = new Date(year, month - 1, day);
                return localDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              })()
            }</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedDate && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedDate}
        >
          <Text style={styles.nextButtonText}>Continue to Time Selection</Text>
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
  serviceMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  calendarContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  availableDay: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  selectedDay: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
  },
  disabledDay: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  todayText: {
    color: '#92400E',
    fontWeight: '600',
  },
  availableText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7B2CBF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: 'white',
    margin: 8,
    padding: 16,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedLegendDot: {
    backgroundColor: '#7B2CBF',
  },
  unavailableLegendDot: {
    backgroundColor: '#E5E7EB',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7B2CBF',
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

export default AdminBookingStep1SelectDayScreen;