import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
              <Text style={styles.infoLabel}>Industry:</Text>
              <Text style={styles.infoValue}>{product.productInfo?.industry}</Text>
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
        </View>

        {/* Service Provider Information */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Service Provider</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Provider:</Text>
            <Text style={styles.infoValue}>{product.serviceProvider?.producer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{product.serviceProvider?.contact?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{product.serviceProvider?.contact?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hours:</Text>
            <Text style={styles.infoValue}>{product.serviceProvider?.availability?.hours}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days:</Text>
            <Text style={styles.infoValue}>{product.serviceProvider?.availability?.days}</Text>
          </View>
        </View>

        {/* Service Locations */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Service Locations</Text>
          {product.serviceLocations?.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>{location.title}</Text>
                <Text style={styles.locationSubtitle}>{location.subtitle}</Text>
                {location.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{location.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{location.lga}, {location.state}, {location.country}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Fee:</Text>
                <Text style={styles.infoValue}>₦{location.fee?.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inquireButton}>
          <Ionicons name="chatbubble" size={20} color="#7B2CBF" />
          <Text style={styles.inquireButtonText}>Send Inquiry</Text>
        </TouchableOpacity>
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
    color: '#333',
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
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
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
});

export default ProductDetailsScreen;