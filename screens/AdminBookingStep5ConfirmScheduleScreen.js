import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminBookingStep5ConfirmScheduleScreen = ({ navigation, route }) => {
  const { service, selectedDate, selectedSlot, bookingDetails, locationData } = route.params;
  const [loading, setLoading] = useState(false);
  const [processPayment, setProcessPayment] = useState(true);
  const [paymentType, setPaymentType] = useState('upfront');
  const [upfrontPercentage, setUpfrontPercentage] = useState(
    service?.bookingAvailability?.upfrontPercentage
  );
  
  // Sub-service states
  const [subServices, setSubServices] = useState([]);
  const [loadingSubServices, setLoadingSubServices] = useState(true);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [showSubServiceModal, setShowSubServiceModal] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  useEffect(() => {
    fetchSubServices();
  }, []);

  useEffect(() => {
    if (selectedSubServices.length > 0) {
      calculatePricing();
    }
  }, [selectedSubServices, paymentType, upfrontPercentage]);

  const fetchSubServices = async () => {
    try {
      setLoadingSubServices(true);
      const response = await ApiService.getAdminBookingSubServices(service._id);
      
      if (response.success && response.data.subServices) {
        // Handle nested structure: response.data.subServices.subServices
        const subServicesData = response.data.subServices.subServices || response.data.subServices;
        setSubServices(Array.isArray(subServicesData) ? subServicesData : []);
      }
    } catch (error) {
      console.error('Error fetching sub-services:', error);
    } finally {
      setLoadingSubServices(false);
    }
  };

  const calculatePricing = async () => {
    try {
      setCalculatingPrice(true);
      const response = await ApiService.calculateAdminBookingPricing({
        serviceId: service._id,
        bookedForPersons: [{
          name: bookingDetails.customerType === 'existing' 
            ? bookingDetails.customer.name 
            : bookingDetails.customer.name,
          selectedSubServices: selectedSubServices
        }],
        paymentType: paymentType === 'upfront' ? 'upfront' : 'full',
        upfrontPercentage: upfrontPercentage
      });

      if (response.success && response.data) {
        setPricingBreakdown(response.data);
        // Update upfront percentage from backend response
        if (response.data.upfrontPercentage) {
          setUpfrontPercentage(response.data.upfrontPercentage);
        }
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const toggleSubService = (subService) => {
    setSelectedSubServices(prev => {
      const exists = prev.find(s => s.subServiceId === subService.subServiceId);
      if (exists) {
        return prev.filter(s => s.subServiceId !== subService.subServiceId);
      } else {
        return [...prev, subService];
      }
    });
  };

  const handleCreateBooking = async () => {
    try {
      setLoading(true);

      let customerId = null;
      if (bookingDetails.customerType === 'existing' && bookingDetails.customer) {
        customerId = bookingDetails.customer.id || 
                    bookingDetails.customer._id || 
                    bookingDetails.customer.userId || 
                    bookingDetails.customer.customUserId;
        
        if (!customerId) {
          Alert.alert('Error', 'Customer ID is missing. Please select the customer again.');
          setLoading(false);
          return;
        }
      }

      const bookingPayload = {
        serviceId: service._id,
        serviceName: service.name,
        servicePrice: service.actualAmount || service.priceInDollars || 0,
        
        customerType: bookingDetails.customerType,
        
        ...(bookingDetails.customerType === 'existing' ? {
          customerId: customerId,
        } : {
          customerName: bookingDetails.customer.name,
          customerEmail: bookingDetails.customer.email,
          customerPhone: bookingDetails.customer.phone || '',
        }),
        
        primarySlot: selectedSlot.datetime,
        
        // Include sub-services
        primaryCustomerSubServices: selectedSubServices,
        primaryCustomerTotal: pricingBreakdown?.individualBreakdowns?.[0]?.individualTotal || 
                             (service.actualAmount || service.priceInDollars || 0),
        
        guests: [],
        
        location: locationData,
        customerNotes: bookingDetails.customerNotes,
        
        ...(bookingDetails.serviceProvider && {
          serviceProviderId: bookingDetails.serviceProvider.id || bookingDetails.serviceProvider._id,
        }),
        paymentType,
        upfrontPercentage,
        processPayment,
      };

      const response = await ApiService.createAdminBooking(bookingPayload);

      if (response.success) {
        if (processPayment && response.data.booking.paymentLink) {
          navigation.navigate('AdminBookingPayment', {
            booking: response.data.booking,
            paymentLink: response.data.booking.paymentLink,
          });
        } else {
          navigation.navigate('AdminBookingSuccess', {
            booking: response.data.booking,
          });
        }
      } else {
        Alert.alert('Booking Failed', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking creation error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAmount = () => {
    if (pricingBreakdown) {
      return paymentType === 'upfront' 
        ? pricingBreakdown.upfrontAmount 
        : pricingBreakdown.grandTotal;
    }
    const totalAmount = service.actualAmount || service.priceInDollars || 0;
    if (paymentType === 'upfront' && upfrontPercentage) {
      return (totalAmount * upfrontPercentage) / 100;
    }
    return totalAmount;
  };

  const renderSummarySection = (title, children) => (
    <View style={styles.summarySection}>
      <Text style={styles.summarySectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSummaryRow = (label, value, icon = null) => (
    <View style={styles.summaryRow}>
      <View style={styles.summaryRowLeft}>
        {icon && <Ionicons name={icon} size={16} color="#6B7280" />}
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const renderSubServiceModal = () => (
    <Modal
      visible={showSubServiceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubServiceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sub-Services</Text>
            <TouchableOpacity onPress={() => setShowSubServiceModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {subServices.map((subService) => {
              const isSelected = selectedSubServices.find(
                s => s.subServiceId === subService.subServiceId
              );
              
              return (
                <TouchableOpacity
                  key={subService.subServiceId}
                  style={[
                    styles.subServiceItem,
                    isSelected && styles.subServiceItemSelected
                  ]}
                  onPress={() => toggleSubService(subService)}
                >
                  <View style={styles.subServiceInfo}>
                    <Text style={styles.subServiceName}>{subService.name}</Text>
                    {subService.description && (
                      <Text style={styles.subServiceDescription}>
                        {subService.description}
                      </Text>
                    )}
                    <Text style={styles.subServicePrice}>
                      ₦{subService.price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSubServiceModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Booking - Confirm</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.completedStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
        </View>
        <Text style={styles.progressText}>Step 5 of 5</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          {renderSummarySection('Service Details', (
            <>
              {renderSummaryRow('Service', service.name, 'briefcase')}
              {renderSummaryRow('Provider', service.producer, 'business')}
              {renderSummaryRow('Duration', `${service.bookingAvailability?.slotDurationMinutes || 60} minutes`, 'time')}
              {renderSummaryRow('Base Price', `₦${(service.actualAmount || service.priceInDollars || 0).toLocaleString()}`, 'card')}
            </>
          ))}

          {/* Sub-Services Section */}
          {!loadingSubServices && subServices.length > 0 && (
            <View style={styles.subServicesSection}>
              <View style={styles.subServicesSectionHeader}>
                <Text style={styles.summarySectionTitle}>Sub-Services</Text>
                <TouchableOpacity
                  style={styles.selectSubServicesButton}
                  onPress={() => setShowSubServiceModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#7B2CBF" />
                  <Text style={styles.selectSubServicesText}>
                    {selectedSubServices.length > 0 ? 'Edit' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedSubServices.length > 0 ? (
                <View style={styles.selectedSubServicesList}>
                  {selectedSubServices.map((subService) => (
                    <View key={subService.subServiceId} style={styles.selectedSubServiceItem}>
                      <Text style={styles.selectedSubServiceName}>{subService.name}</Text>
                      <Text style={styles.selectedSubServicePrice}>
                        ₦{subService.price.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSubServicesText}>No sub-services selected</Text>
              )}
            </View>
          )}

          {renderSummarySection('Schedule', (
            <>
              {renderSummaryRow('Date', formatDate(selectedDate), 'calendar')}
              {renderSummaryRow('Time', selectedSlot.displayTime, 'time')}
            </>
          ))}

          {renderSummarySection('Customer', (
            <>
              {renderSummaryRow('Name', 
                bookingDetails.customerType === 'existing' 
                  ? bookingDetails.customer.name 
                  : bookingDetails.customer.name, 
                'person'
              )}
              {renderSummaryRow('Email', 
                bookingDetails.customerType === 'existing' 
                  ? bookingDetails.customer.email 
                  : bookingDetails.customer.email, 
                'mail'
              )}
              {renderSummaryRow('Type', 
                bookingDetails.customerType === 'existing' 
                  ? 'Organization User' 
                  : 'External Customer', 
                'people'
              )}
            </>
          ))}

          {bookingDetails.serviceProvider && renderSummarySection('Assigned Provider', (
            <>
              {renderSummaryRow('Name', bookingDetails.serviceProvider.name, 'person-circle')}
              {renderSummaryRow('Email', bookingDetails.serviceProvider.email, 'mail')}
              {renderSummaryRow('Rating', `⭐ ${bookingDetails.serviceProvider.rating || 'N/A'}`, 'star')}
            </>
          ))}

          {renderSummarySection('Location', (
            <>
              {renderSummaryRow('Type', 
                locationData.locationType === 'merchant_location' ? 'Merchant Location' :
                locationData.locationType === 'customer_address' ? 'Customer Address' :
                locationData.locationType === 'new_address' ? 'Custom Address' :
                locationData.locationType === 'whatsapp_location' ? 'WhatsApp Location' : 'Unknown',
                'location'
              )}
              {locationData.address && renderSummaryRow('Address', locationData.address, 'home')}
            </>
          ))}

          {bookingDetails.customerNotes && renderSummarySection('Special Instructions', (
            <Text style={styles.notesText}>{bookingDetails.customerNotes}</Text>
          ))}
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.paymentTitle}>Payment Options</Text>
          
          <View style={styles.paymentOption}>
            <View style={styles.paymentOptionHeader}>
              <Text style={styles.paymentOptionLabel}>Process Payment</Text>
              <Switch
                value={processPayment}
                onValueChange={setProcessPayment}
                trackColor={{ false: '#E5E7EB', true: '#7B2CBF' }}
                thumbColor={processPayment ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.paymentOptionDescription}>
              {processPayment 
                ? 'Customer will be charged via Flutterwave' 
                : 'Create booking without payment (internal booking)'}
            </Text>
          </View>

          {processPayment && (
            <>
              <View style={styles.paymentTypeContainer}>
                <Text style={styles.paymentTypeLabel}>Payment Type</Text>
                <View style={styles.paymentTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      paymentType === 'upfront' && styles.paymentTypeButtonActive,
                    ]}
                    onPress={() => setPaymentType('upfront')}
                  >
                    <Text style={[
                      styles.paymentTypeText,
                      paymentType === 'upfront' && styles.paymentTypeTextActive,
                    ]}>
                      Upfront ({upfrontPercentage}%)
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      paymentType === 'full' && styles.paymentTypeButtonActive,
                    ]}
                    onPress={() => setPaymentType('full')}
                  >
                    <Text style={[
                      styles.paymentTypeText,
                      paymentType === 'full' && styles.paymentTypeTextActive,
                    ]}>
                      Full Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.amountSummary}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Service Price:</Text>
                  <Text style={styles.amountValue}>
                    ₦{pricingBreakdown 
                      ? pricingBreakdown.grandTotal.toLocaleString() 
                      : (service.actualAmount || service.priceInDollars || 0).toLocaleString()}
                  </Text>
                </View>
                {pricingBreakdown && selectedSubServices.length > 0 && (
                  <View style={styles.priceBreakdownContainer}>
                    <Text style={styles.breakdownLabel}>Price Breakdown:</Text>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownItem}>• Base Service</Text>
                      <Text style={styles.breakdownValue}>
                        ₦{pricingBreakdown.baseServicePrice.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownItem}>• Sub-Services</Text>
                      <Text style={styles.breakdownValue}>
                        ₦{pricingBreakdown.individualBreakdowns[0].subServicesTotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabelBold}>Amount to Charge:</Text>
                  <Text style={styles.amountValueBold}>
                    ₦{calculateAmount().toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.createButtonText}>
                {processPayment ? 'Create Booking & Process Payment' : 'Create Booking'}
              </Text>
              <Ionicons name="checkmark" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderSubServiceModal()}
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
  summaryContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  subServicesSection: {
    marginBottom: 20,
  },
  subServicesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectSubServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectSubServicesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  selectedSubServicesList: {
    gap: 8,
  },
  selectedSubServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
  },
  selectedSubServiceName: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectedSubServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  noSubServicesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  paymentContainer: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 20,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentOption: {
    marginBottom: 16,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentTypeContainer: {
    marginBottom: 16,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentTypeTextActive: {
    color: '#7B2CBF',
  },
  amountSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  amountLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  priceBreakdownContainer: {
    marginLeft: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  breakdownItem: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
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
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    padding: 20,
  },
  subServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  subServiceItemSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  subServiceInfo: {
    flex: 1,
    marginRight: 12,
  },
  subServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subServiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  subServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminBookingStep5ConfirmScheduleScreen;
