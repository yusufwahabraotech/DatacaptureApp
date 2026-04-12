import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BookingConfirmationScreen = ({ navigation, route }) => {
  const { order, service, paymentAmount, paymentType } = route.params;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const shareBookingDetails = async () => {
    try {
      const bookingDetails = `
🎉 Booking Confirmed!

Service: ${service.name}
Provider: ${service.producer}
Date: ${formatDate(order.bookingDetails.bookingDate)}
Time: ${formatTime(order.bookingDetails.bookingTime)}
Amount Paid: ₦${paymentAmount.toLocaleString()}
Order ID: ${order.id}

Thank you for booking with us!
      `.trim();

      await Share.share({
        message: bookingDetails,
        title: 'Booking Confirmation',
      });
    } catch (error) {
      console.error('Error sharing booking details:', error);
    }
  };

  const getLocationText = () => {
    const location = order.bookingDetails.location;
    switch (location.type) {
      case 'merchant_location':
        return 'Service provider\'s location';
      case 'customer_address':
        return 'Your registered address';
      case 'new_address':
        return location.address;
      case 'whatsapp_location':
        return 'WhatsApp shared location';
      default:
        return 'Location to be confirmed';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('PublicProductSearch')}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <TouchableOpacity onPress={shareBookingDetails}>
          <Ionicons name="share" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Success Status */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successMessage}>
            Your booking has been successfully confirmed. You will receive a confirmation email shortly.
          </Text>
          
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderIdValue}>{order.id}</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <View style={styles.detailsCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceProvider}>{service.producer}</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={20} color="#7B2CBF" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(order.bookingDetails.bookingDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time" size={20} color="#7B2CBF" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(order.bookingDetails.bookingTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location" size={20} color="#7B2CBF" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{getLocationText()}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="hourglass" size={20} color="#7B2CBF" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {order.bookingDetails.duration || 60} minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Booked Persons */}
        {order.bookingDetails.bookedPersons && order.bookingDetails.bookedPersons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booked For</Text>
            
            {order.bookingDetails.bookedPersons.map((person, index) => (
              <View key={index} style={styles.personCard}>
                <View style={styles.personHeader}>
                  <Text style={styles.personName}>{person.name}</Text>
                  {person.isMainBooker && (
                    <View style={styles.mainBookerBadge}>
                      <Text style={styles.mainBookerText}>Main Booker</Text>
                    </View>
                  )}
                </View>
                
                {person.email && (
                  <Text style={styles.personEmail}>{person.email}</Text>
                )}
                
                <Text style={styles.personTime}>
                  Time: {new Date(person.slotDateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
                
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statusText}>{person.bookingStatus || 'Confirmed'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentValue}>₦{order.totalAmount.toLocaleString()}</Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid:</Text>
              <Text style={styles.paidValue}>₦{order.paidAmount.toLocaleString()}</Text>
            </View>
            
            {order.remainingAmount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Remaining Balance:</Text>
                <Text style={styles.remainingValue}>₦{order.remainingAmount.toLocaleString()}</Text>
              </View>
            )}
            
            <View style={styles.paymentDivider} />
            
            <View style={styles.paymentRow}>
              <Text style={styles.statusLabel}>Payment Status:</Text>
              <View style={styles.paymentStatusBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.paymentStatusText}>
                  {order.paymentStatus === 'upfront_paid' ? 'Partially Paid' : 'Paid'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Confirmation Email</Text>
                <Text style={styles.stepDescription}>
                  You'll receive a detailed confirmation email with all booking information
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Service Provider Contact</Text>
                <Text style={styles.stepDescription}>
                  The service provider will contact you to confirm appointment details
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Service Delivery</Text>
                <Text style={styles.stepDescription}>
                  Enjoy your service at the scheduled time and location
                </Text>
              </View>
            </View>

            {order.remainingAmount > 0 && (
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Remaining Payment</Text>
                  <Text style={styles.stepDescription}>
                    Pay the remaining ₦{order.remainingAmount.toLocaleString()} at service time
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Support Info */}
        <View style={styles.supportSection}>
          <View style={styles.supportHeader}>
            <Ionicons name="help-circle" size={20} color="#7B2CBF" />
            <Text style={styles.supportTitle}>Need Help?</Text>
          </View>
          <Text style={styles.supportText}>
            If you have any questions about your booking, please contact our support team or the service provider directly.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('PublicProductSearch')}
        >
          <Text style={styles.secondaryButtonText}>Browse More Services</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={shareBookingDetails}
        >
          <Ionicons name="share" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Share Details</Text>
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
  content: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 32,
    marginBottom: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  orderIdValue: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '700',
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
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  serviceHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  personCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  mainBookerBadge: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainBookerText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  personEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  personTime: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  paidValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentStatusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingConfirmationScreen;