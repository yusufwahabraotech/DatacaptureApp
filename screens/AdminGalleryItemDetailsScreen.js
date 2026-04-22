import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminGalleryItemDetailsScreen = ({ navigation, route }) => {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getAdminGalleryItemDetails(itemId);
      if (result.success) {
        setItem(result.data.item);
      } else {
        Alert.alert('Error', result.message || 'Failed to fetch item details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      Alert.alert('Error', 'Failed to fetch item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    navigation.navigate('AdminBookingStep1SelectDay', { service: item });
  };

  const handleBuyProduct = () => {
    navigation.navigate('AdminPurchaseFlow', { product: item });
  };

  const handleEditItem = () => {
    navigation.navigate('EditGalleryItem', { itemId: item.id });
  };

  const renderDetailRow = (label, value, icon = null) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailRowLeft}>
          {icon && <Ionicons name={icon} size={16} color="#6B7280" />}
          <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isService = item.itemType === 'service';
  const isProduct = item.itemType === 'product';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity onPress={handleEditItem}>
          <Ionicons name="pencil" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Item Image */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        )}

        {/* Basic Information */}
        {renderSection('Basic Information', (
          <>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {renderDetailRow('Type', isService ? 'Service' : 'Product', 'pricetag')}
            {renderDetailRow('Category', item.categoryName, 'folder')}
            {renderDetailRow('Industry', item.industryName, 'business')}
            {renderDetailRow('Code', item.platformUniqueCode, 'barcode')}
          </>
        ))}

        {/* Pricing Information */}
        {renderSection('Pricing', (
          <>
            {renderDetailRow('Base Price', `₦${item.priceInDollars?.toFixed(2) || '0.00'}`, 'card')}
            {renderDetailRow('Platform Charge', `${item.platformChargePercentage || 0}%`, 'calculator')}
            {renderDetailRow('Final Price', `₦${item.actualAmount?.toFixed(2) || '0.00'}`, 'cash')}
            {item.discountPercentage > 0 && renderDetailRow('Discount', `${item.discountPercentage}%`, 'pricetag')}
            {isService && item.upfrontPaymentPercentage && (
              <>
                {renderDetailRow('Upfront Payment', `${item.upfrontPaymentPercentage}%`, 'card-outline')}
                {renderDetailRow('Upfront Amount', `₦${item.upfrontPaymentAmount?.toFixed(2) || '0.00'}`, 'wallet')}
              </>
            )}
          </>
        ))}

        {/* Service-Specific Information */}
        {isService && renderSection('Service Details', (
          <>
            {renderDetailRow('Producer', item.producer, 'business')}
            {renderDetailRow('Service Providers', item.totalAvailableServiceProviders?.toString() || '0', 'people')}
            {item.hasSubServices && renderDetailRow('Sub-Services', item.subServiceCount?.toString() || '0', 'list')}
            {item.bookingAvailability && (
              <>
                {renderDetailRow('Slot Duration', `${item.bookingAvailability.slotDurationMinutes || 60} minutes`, 'time')}
                {renderDetailRow('Concurrent Providers', item.bookingAvailability.concurrentProviders?.toString() || '1', 'people-circle')}
                {renderDetailRow('Timezone', item.bookingAvailability.timezone || 'Africa/Lagos', 'globe')}
              </>
            )}
          </>
        ))}

        {/* Product-Specific Information */}
        {isProduct && renderSection('Product Details', (
          <>
            {renderDetailRow('Stock Quantity', item.totalAvailableQuantity?.toString() || '0', 'cube')}
            {renderDetailRow('SKU', item.sku, 'barcode-outline')}
            {renderDetailRow('UPC', item.upc, 'scan')}
            {renderDetailRow('Ingredients', item.ingredients, 'leaf')}
          </>
        ))}

        {/* Location Information */}
        {item.locationDetails && renderSection('Location', (
          <>
            {renderDetailRow('Brand Name', item.locationDetails.brandName, 'storefront')}
            {renderDetailRow('Address', item.locationDetails.fullAddress, 'location')}
            {item.locationDetails.landmark && renderDetailRow('Landmark', item.locationDetails.landmark, 'flag')}
            {renderDetailRow('Verified', item.locationDetails.verified ? 'Yes' : 'No', 'checkmark-circle')}
          </>
        ))}

        {/* Sub-Services */}
        {isService && item.hasSubServices && item.subServices && item.subServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sub-Services</Text>
            {item.subServices.map((subService, index) => (
              <View key={index} style={styles.subServiceCard}>
                <View style={styles.subServiceHeader}>
                  <Text style={styles.subServiceName}>{subService.name}</Text>
                  <Text style={styles.subServicePrice}>₦{subService.price?.toFixed(2) || '0.00'}</Text>
                </View>
                <Text style={styles.subServiceDescription}>{subService.description}</Text>
                {subService.subPlatformUniqueCode && (
                  <Text style={styles.subServiceCode}>Code: {subService.subPlatformUniqueCode}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        {renderSection('Additional Information', (
          <>
            {renderDetailRow('Public Visibility', item.visibilityToPublic ? 'Yes' : 'No', 'eye')}
            {renderDetailRow('Payment Methods', item.paymentMethods, 'card-outline')}
            {item.notes && renderDetailRow('Notes', item.notes, 'document-text')}
            {renderDetailRow('Created', new Date(item.createdAt).toLocaleDateString(), 'calendar')}
            {renderDetailRow('Updated', new Date(item.updatedAt).toLocaleDateString(), 'refresh')}
          </>
        ))}

        {/* Availability Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityContainer}>
            {isService && (
              <View style={[styles.availabilityBadge, item.canBook ? styles.availableBadge : styles.unavailableBadge]}>
                <Ionicons 
                  name={item.canBook ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.availabilityText}>
                  {item.canBook ? 'Bookable' : 'Not Bookable'}
                </Text>
              </View>
            )}
            {isProduct && (
              <View style={[styles.availabilityBadge, item.canPurchase ? styles.availableBadge : styles.unavailableBadge]}>
                <Ionicons 
                  name={item.canPurchase ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.availabilityText}>
                  {item.canPurchase ? 'Purchasable' : 'Not Available'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {isService && item.canBook && (
          <TouchableOpacity
            style={[styles.actionButton, styles.bookButton]}
            onPress={handleBookService}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.actionButtonText}>Book This Service</Text>
          </TouchableOpacity>
        )}
        
        {isProduct && item.canPurchase && (
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={handleBuyProduct}
          >
            <Ionicons name="bag" size={20} color="white" />
            <Text style={styles.actionButtonText}>Buy This Product</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEditItem}
        >
          <Ionicons name="pencil" size={20} color="#7B2CBF" />
          <Text style={[styles.actionButtonText, { color: '#7B2CBF' }]}>Edit Item</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  content: {
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
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
  itemName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  subServiceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  subServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  subServicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  subServiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  subServiceCode: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  availabilityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  availableBadge: {
    backgroundColor: '#10B981',
  },
  unavailableBadge: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  bookButton: {
    backgroundColor: '#10B981',
  },
  buyButton: {
    backgroundColor: '#F59E0B',
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminGalleryItemDetailsScreen;