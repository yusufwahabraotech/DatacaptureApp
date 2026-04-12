import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ProductDetailsScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    try {
      const response = await ApiService.getPublicProductDetails(productId);
      if (response.success) {
        console.log('🚨 PRODUCT DETAILS API RESPONSE 🚨');
        console.log('Full response:', JSON.stringify(response, null, 2));
        
        const productData = {
          ...response.data.product,
          serviceProvider: response.data.serviceProvider,
          serviceLocations: response.data.serviceLocations
        };
        console.log('🚨 PROCESSED PRODUCT DATA 🚨');
        console.log('Product data:', JSON.stringify(productData, null, 2));
        console.log('Image URL:', productData.imageUrl);
        console.log('🚨 SERVICE FIELDS DEBUG 🚨');
        console.log('itemType:', productData.itemType);
        console.log('producer:', productData.producer);
        console.log('hasSubServices:', productData.hasSubServices);
        console.log('subServices:', productData.subServices);
        console.log('availability:', productData.availability);
        console.log('totalAvailableServiceProviders:', productData.totalAvailableServiceProviders);
        
        // Debug sub-service images specifically
        if (productData.subServices && productData.subServices.length > 0) {
          console.log('🚨 SUB-SERVICE IMAGES DEBUG 🚨');
          productData.subServices.forEach((subService, index) => {
            console.log(`Sub-service ${index + 1}:`);
            console.log('  - Name:', subService.name);
            console.log('  - Price:', subService.price);
            console.log('  - Image URL:', subService.uploadPicture);
            console.log('  - Image exists:', !!subService.uploadPicture);
          });
        }
        
        setProduct(productData);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageSection}>
          {(product.imageUrl || product.images?.main || product.image) ? (
            <Image 
              source={{ uri: product.imageUrl || product.images?.main || product.image }} 
              style={styles.productImage} 
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cube" size={80} color="#7B2CBF" />
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          <View style={styles.badgeContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.productInfo?.category}</Text>
            </View>
            {product.location?.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {product.pricing?.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.pricing.discount}% OFF</Text>
              </View>
            )}
          </View>

          <Text style={styles.productTitle}>{product.name || product.title}</Text>
          <Text style={styles.businessName}>{product.location?.brandName}</Text>

          <View style={styles.pricingSection}>
            {product.pricing?.discount > 0 && (
              <Text style={styles.originalPrice}>₦{product.pricing.originalPrice?.toLocaleString()}</Text>
            )}
            <Text style={styles.currentPrice}>₦{product.pricing?.discountedPrice?.toLocaleString()}</Text>
          </View>

          {product.pricing?.youSave > 0 && (
            <Text style={styles.savings}>You save ₦{product.pricing.youSave?.toLocaleString()}</Text>
          )}

          <View style={styles.stockSection}>
            <Text style={styles.stockText}>{product.productInfo?.availableQuantity} items available</Text>
          </View>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{product.itemType}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{product.productInfo?.category}</Text>
            </View>
            
            {product.productInfo?.sku && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SKU:</Text>
                <Text style={styles.infoValue}>{product.productInfo.sku}</Text>
              </View>
            )}
            
            {product.productInfo?.upc && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UPC:</Text>
                <Text style={styles.infoValue}>{product.productInfo.upc}</Text>
              </View>
            )}
            
            {product.productInfo?.platformUniqueCode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Product Code:</Text>
                <Text style={styles.infoValue}>{product.productInfo.platformUniqueCode}</Text>
              </View>
            )}
          </View>

          {product.pricing?.upfrontPaymentPercentage > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Upfront Payment:</Text>
                <Text style={styles.infoValue}>{product.pricing.upfrontPaymentPercentage}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Upfront Amount:</Text>
                <Text style={styles.infoValue}>₦{product.pricing.upfrontPaymentAmount?.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {product.ingredients && product.ingredients !== 'Not specified' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.description}>{product.ingredients}</Text>
            </View>
          )}

          {product.paymentMethods && product.paymentMethods !== 'Not specified' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              <Text style={styles.description}>{product.paymentMethods}</Text>
            </View>
          )}

          {product.location && (
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Main Location</Text>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>
                  {product.location.address}
                </Text>
              </View>
            </View>
          )}

          {product.notes && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Text style={styles.description}>{product.notes}</Text>
            </View>
          )}

          {/* Service-specific fields */}
          {product.itemType === 'service' && (
            <>
              {product.producer && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Service Provider</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Producer:</Text>
                    <Text style={styles.infoValue}>{product.producer}</Text>
                  </View>
                  {product.totalAvailableServiceProviders && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Available Providers:</Text>
                      <Text style={styles.infoValue}>{product.totalAvailableServiceProviders}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Enhanced Booking Configuration */}
              {product.bookingConfiguration && (
                <View style={styles.bookingConfigSection}>
                  <Text style={styles.sectionTitle}>Booking Information</Text>
                  
                  {/* Quick Info Summary */}
                  {product.availabilityQuickInfo && (
                    <View style={styles.quickInfoCard}>
                      <View style={styles.quickInfoRow}>
                        <View style={styles.quickInfoItem}>
                          <Ionicons name="time-outline" size={20} color="#7B2CBF" />
                          <Text style={styles.quickInfoLabel}>Duration</Text>
                          <Text style={styles.quickInfoValue}>{product.availabilityQuickInfo.slotDuration}</Text>
                        </View>
                        <View style={styles.quickInfoItem}>
                          <Ionicons name="people-outline" size={20} color="#7B2CBF" />
                          <Text style={styles.quickInfoLabel}>Max Bookings</Text>
                          <Text style={styles.quickInfoValue}>{product.availabilityQuickInfo.maxBookingsPerSlot}</Text>
                        </View>
                      </View>
                      <View style={styles.quickInfoRow}>
                        <View style={styles.quickInfoItem}>
                          <Ionicons name="globe-outline" size={20} color="#7B2CBF" />
                          <Text style={styles.quickInfoLabel}>Timezone</Text>
                          <Text style={styles.quickInfoValue}>{product.bookingConfiguration.timezone}</Text>
                        </View>
                        <View style={styles.quickInfoItem}>
                          <Ionicons name="calendar-outline" size={20} color="#7B2CBF" />
                          <Text style={styles.quickInfoLabel}>Total Days</Text>
                          <Text style={styles.quickInfoValue}>{product.availabilityQuickInfo.totalAvailableDays}</Text>
                        </View>
                      </View>
                      
                      {/* Available Days Display */}
                      {product.availabilityQuickInfo.availableDaysNames?.length > 0 && (
                        <View style={styles.availableDaysSection}>
                          <Text style={styles.availableDaysTitle}>Available Days:</Text>
                          <View style={styles.availableDaysGrid}>
                            {product.availabilityQuickInfo.availableDaysNames.map((day, index) => (
                              <View key={index} style={styles.availableDayChip}>
                                <Text style={styles.availableDayText}>{day}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      <View style={styles.timeRangeContainer}>
                        <Text style={styles.timeRangeLabel}>Operating Hours:</Text>
                        <Text style={styles.timeRangeValue}>
                          {product.availabilityQuickInfo.earliestTime} - {product.availabilityQuickInfo.latestTime}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Booking Rules */}
                  {product.bookingConfiguration.bookingRules && (
                    <View style={styles.bookingRulesCard}>
                      <Text style={styles.bookingRulesTitle}>How Booking Works</Text>
                      <View style={styles.bookingRule}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.bookingRuleText}>{product.bookingConfiguration.bookingRules.slotDuration}</Text>
                      </View>
                      <View style={styles.bookingRule}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.bookingRuleText}>{product.bookingConfiguration.bookingRules.maxSimultaneousBookings}</Text>
                      </View>
                      <View style={styles.bookingRule}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.bookingRuleText}>{product.bookingConfiguration.bookingRules.timezone}</Text>
                      </View>
                      <View style={styles.bookingRule}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.bookingRuleText}>{product.bookingConfiguration.bookingRules.bookingWindow}</Text>
                      </View>
                    </View>
                  )}

                  {/* Weekly Schedule */}
                  {product.bookingConfiguration.weeklySchedule && (
                    <View style={styles.weeklyScheduleCard}>
                      <Text style={styles.weeklyScheduleTitle}>Weekly Schedule</Text>
                      {product.bookingConfiguration.weeklySchedule.map((day, index) => (
                        <View key={index} style={styles.dayScheduleItem}>
                          <View style={styles.dayHeader}>
                            <Text style={styles.dayName}>{day.dayName}</Text>
                            <View style={[
                              styles.dayStatusBadge,
                              day.isAvailable ? styles.dayAvailable : styles.dayUnavailable
                            ]}>
                              <Text style={[
                                styles.dayStatusText,
                                day.isAvailable ? styles.dayAvailableText : styles.dayUnavailableText
                              ]}>
                                {day.isAvailable ? 'Available' : 'Closed'}
                              </Text>
                            </View>
                          </View>
                          {day.isAvailable && day.timeWindows && (
                            <View style={styles.timeWindowsList}>
                              {day.timeWindows.map((window, windowIndex) => (
                                <View key={windowIndex} style={styles.timeWindowItem}>
                                  <View style={styles.timeWindowBadge}>
                                    <Text style={styles.timeWindowText}>{window.displayTime}</Text>
                                  </View>
                                  <Text style={styles.timeWindowDuration}>({window.duration})</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {product.availability && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Service Availability</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>
                      {product.availability.type === 'unlimited' ? 'Always Available' :
                       product.availability.type === 'within_year' ? 'Within Year' :
                       product.availability.type === 'within_years' ? 'Within Years' :
                       product.availability.type === 'period' ? 'Specific Period' : product.availability.type}
                    </Text>
                  </View>
                  {product.availability.type !== 'unlimited' && (
                    <>
                      {product.availability.startDate && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Start Date:</Text>
                          <Text style={styles.infoValue}>{new Date(product.availability.startDate).toLocaleDateString()}</Text>
                        </View>
                      )}
                      {product.availability.endDate && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>End Date:</Text>
                          <Text style={styles.infoValue}>{new Date(product.availability.endDate).toLocaleDateString()}</Text>
                        </View>
                      )}
                      {product.availability.startTime && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Start Time:</Text>
                          <Text style={styles.infoValue}>{product.availability.startTime}</Text>
                        </View>
                      )}
                      {product.availability.endTime && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>End Time:</Text>
                          <Text style={styles.infoValue}>{product.availability.endTime}</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {product.hasSubServices && product.subServices && product.subServices.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Available Sub-Services ({product.subServiceCount || product.subServices.length})</Text>
                  <View style={styles.subServicesGrid}>
                    {product.subServices.map((subService, index) => (
                      <View key={index} style={styles.subServiceCard}>
                        {subService.uploadPicture && (
                          <View style={styles.subServiceImageContainer}>
                            <Image 
                              source={{ uri: subService.uploadPicture }} 
                              style={styles.subServiceImage}
                              onError={(error) => {
                                console.log('Sub-service image load error:', error.nativeEvent.error);
                                console.log('Image URL:', subService.uploadPicture);
                              }}
                            />
                            <View style={styles.subServiceImageOverlay}>
                              <Text style={styles.subServiceIndex}>#{index + 1}</Text>
                            </View>
                          </View>
                        )}
                        {!subService.uploadPicture && (
                          <View style={styles.subServicePlaceholder}>
                            <Ionicons name="image-outline" size={32} color="#ccc" />
                            <Text style={styles.subServicePlaceholderText}>No Image</Text>
                          </View>
                        )}
                        <View style={styles.subServiceContent}>
                          <View style={styles.subServiceHeader}>
                            <Text style={styles.subServiceName} numberOfLines={2}>{subService.name}</Text>
                            <View style={styles.subServicePriceContainer}>
                              <Text style={styles.subServicePrice}>₦{subService.price?.toLocaleString()}</Text>
                            </View>
                          </View>
                          {subService.description && (
                            <Text style={styles.subServiceDescription} numberOfLines={3}>
                              {subService.description}
                            </Text>
                          )}
                          {subService.subPlatformUniqueCode && (
                            <View style={styles.subServiceCodeContainer}>
                              <Text style={styles.subServiceCodeLabel}>Code:</Text>
                              <Text style={styles.subServiceCode}>{subService.subPlatformUniqueCode}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Service Provider Information */}
        {product.serviceProvider && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Service Provider</Text>
            {product.serviceProvider.producer && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Provider:</Text>
                <Text style={styles.infoValue}>{product.serviceProvider.producer}</Text>
              </View>
            )}
            {product.serviceProvider.contact?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{product.serviceProvider.contact.phone}</Text>
              </View>
            )}
            {product.serviceProvider.contact?.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{product.serviceProvider.contact.email}</Text>
              </View>
            )}
            {product.serviceProvider.availability?.hours && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hours:</Text>
                <Text style={styles.infoValue}>{product.serviceProvider.availability.hours}</Text>
              </View>
            )}
            {product.serviceProvider.availability?.days && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Days:</Text>
                <Text style={styles.infoValue}>{product.serviceProvider.availability.days}</Text>
              </View>
            )}
          </View>
        )}

        {/* Service Locations */}
        {product.serviceLocations && product.serviceLocations.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Service Locations</Text>
            {product.serviceLocations.map((location, index) => (
              <View key={index} style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  {location.title && <Text style={styles.locationTitle}>{location.title}</Text>}
                  {location.subtitle && <Text style={styles.locationSubtitle}>{location.subtitle}</Text>}
                  {location.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                {location.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={styles.infoValue}>{location.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoValue}>
                    {[location.lga, location.state, location.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
                {location.fee && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Service Fee:</Text>
                    <Text style={styles.infoValue}>₦{location.fee.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomSection}>
        {product.itemType === 'service' ? (
          <>
            <TouchableOpacity 
              style={styles.bookServiceButton}
              onPress={() => navigation.navigate('BookingStep1SelectDay', { service: product })}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.bookServiceButtonText}>Book Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.inquireButton}
              onPress={() => Alert.alert('Contact Info', 'Feature coming soon - direct contact with service provider')}
            >
              <Ionicons name="chatbubble" size={20} color="#7B2CBF" />
              <Text style={styles.inquireButtonText}>Inquire</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => navigation.navigate('ProductPayment', { product })}
            >
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => Alert.alert('Coming Soon', 'Feature coming soon')}
            >
              <Ionicons name="cart" size={20} color="#7B2CBF" />
              <Text style={styles.cartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    height: 250,
    backgroundColor: 'white',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
  },
  contentSection: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 16,
    color: '#7B2CBF',
    marginBottom: 16,
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  savings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 16,
  },
  stockSection: {
    marginBottom: 24,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  locationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  specifications: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
  },
  locationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B2CBF',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  cartButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inquireButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  inquireButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookServiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  bookServiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  subServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  subServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    overflow: 'hidden',
  },
  subServiceImageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  subServiceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  subServiceImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(123, 44, 191, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subServiceIndex: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subServicePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  subServicePlaceholderText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  subServiceContent: {
    padding: 16,
  },
  subServiceHeader: {
    marginBottom: 12,
  },
  subServiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  subServicePriceContainer: {
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  subServicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  subServiceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  subServiceCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  subServiceCodeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  subServiceCode: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  subServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    gap: 8,
  },
  subServiceButtonText: {
    color: '#7B2CBF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Enhanced Booking Configuration Styles
  bookingConfigSection: {
    marginBottom: 24,
  },
  quickInfoCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quickInfoValue: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: 'bold',
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRangeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  availableDaysSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },
  availableDaysTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  availableDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  availableDayChip: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  availableDayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingRulesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  bookingRulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bookingRule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bookingRuleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  weeklyScheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  weeklyScheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dayScheduleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayStatusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayAvailable: {
    backgroundColor: '#E8F5E8',
  },
  dayUnavailable: {
    backgroundColor: '#FFEBEE',
  },
  dayStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayAvailableText: {
    color: '#4CAF50',
  },
  dayUnavailableText: {
    color: '#F44336',
  },
  timeWindowsList: {
    gap: 8,
  },
  timeWindowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeWindowBadge: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeWindowText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  timeWindowDuration: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ProductDetailsScreen;