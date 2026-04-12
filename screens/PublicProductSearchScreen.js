import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

const PublicProductSearchScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    itemType: '',
    categoryId: '',
    sortBy: 'priceInDollars',
    sortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Trigger search when filters change (but not on initial load)
    if (products.length > 0 || searchQuery) {
      console.log('🚨 FILTERS CHANGED - REFETCHING 🚨');
      setLoading(true);
      fetchProductsWithFilters(filters, true);
    }
  }, [filters.itemType, filters.sortBy, filters.sortOrder]);

  const fetchProducts = async (isRefresh = false) => {
    return fetchProductsWithFilters(filters, isRefresh);
  };
  
  const fetchProductsWithFilters = async (currentFilters, isRefresh = false) => {
    if (isRefresh) {
      setPage(1);
      setProducts([]);
    }

    try {
      console.log('🚨 FETCHING PRODUCTS WITH FILTERS 🚨');
      console.log('Search query:', searchQuery);
      console.log('Current filters being used:', currentFilters);
      
      const searchParams = {
        page: isRefresh ? 1 : page,
        limit: 20,
        search: searchQuery,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
      };
      
      // Only add itemType filter if it's selected
      if (currentFilters.itemType) {
        searchParams.itemType = currentFilters.itemType;
        console.log('🔍 ITEMTYPE FILTER APPLIED:', currentFilters.itemType);
      } else {
        console.log('🔍 NO ITEMTYPE FILTER - SHOWING ALL ITEMS');
      }
      
      // Only add categoryId filter if it's selected
      if (currentFilters.categoryId) {
        searchParams.categoryId = currentFilters.categoryId;
      }
      
      console.log('Final search params:', searchParams);

      const response = await ApiService.searchPublicProducts(searchParams);
      console.log('API Response:', response.success ? 'Success' : 'Failed');
      console.log('Items returned:', response.data?.items?.length || 0);

      if (response.success) {
        const newProducts = isRefresh ? response.data.items : [...products, ...response.data.items];
        
        // Debug the returned items
        console.log('🔍 API RETURNED ITEMS DEBUG:');
        console.log('Total items returned:', newProducts.length);
        if (newProducts.length > 0) {
          console.log('First 3 items itemType check:');
          newProducts.slice(0, 3).forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.name} - itemType: ${item.itemType}`);
          });
        }
        
        setProducts(newProducts);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        if (!isRefresh) setPage(page + 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProductsWithFilters(filters, true);
  };
  
  const handleFilterChange = (newFilters) => {
    console.log('🚨 FILTER CHANGED 🚨');
    console.log('Previous filters:', filters);
    console.log('New filters:', newFilters);
    console.log('ItemType being set:', newFilters.itemType);
    setFilters(newFilters);
    setLoading(true);
    // Pass the new filters directly to fetchProducts instead of relying on state
    fetchProductsWithFilters(newFilters, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchProducts();
    }
  };

  const renderBookingAvailability = (item) => {
    if (item.itemType !== 'service' || !item.availabilitySummary?.hasBookingAvailability) {
      return null;
    }

    const { availabilitySummary, bookingAvailability } = item;
    
    return (
      <View style={styles.bookingAvailabilitySection}>
        <View style={styles.bookingHeader}>
          <Ionicons name="calendar-outline" size={16} color="#7B2CBF" />
          <Text style={styles.bookingHeaderText}>Booking Available</Text>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.bookingRow}>
            <View style={styles.bookingItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.bookingItemText}>{availabilitySummary.slotDuration}</Text>
            </View>
            <View style={styles.bookingItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.bookingItemText}>Up to {availabilitySummary.maxBookingsPerSlot}</Text>
            </View>
          </View>
          
          <View style={styles.availableDaysContainer}>
            <Text style={styles.availableDaysLabel}>Available:</Text>
            <View style={styles.daysGrid}>
              {availabilitySummary.availableDays?.slice(0, 3).map((day, index) => (
                <View key={index} style={styles.dayChip}>
                  <Text style={styles.dayChipText}>{day.substring(0, 3)}</Text>
                </View>
              ))}
              {availabilitySummary.availableDays?.length > 3 && (
                <View style={styles.dayChip}>
                  <Text style={styles.dayChipText}>+{availabilitySummary.availableDays.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
          
          {bookingAvailability?.daysAvailable?.length > 0 && (
            <View style={styles.timeWindowsPreview}>
              <Text style={styles.timeWindowsLabel}>Today's Hours:</Text>
              <View style={styles.timeWindowsContainer}>
                {bookingAvailability.daysAvailable[0]?.timeWindows?.slice(0, 2).map((window, index) => (
                  <View key={index} style={styles.timeWindow}>
                    <Text style={styles.timeWindowText}>
                      {window.displayStartTime} - {window.displayEndTime}
                    </Text>
                  </View>
                ))}
                {bookingAvailability.daysAvailable[0]?.timeWindows?.length > 2 && (
                  <Text style={styles.moreTimeWindows}>+more</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSubServices = (item) => {
    if (!item.hasSubServices || !item.subServices?.length) {
      return null;
    }

    return (
      <View style={styles.subServicesSection}>
        <View style={styles.subServicesHeader}>
          <Ionicons name="add-circle-outline" size={16} color="#7B2CBF" />
          <Text style={styles.subServicesHeaderText}>Additional Services Available</Text>
        </View>
        <View style={styles.subServicesList}>
          {item.subServices.slice(0, 2).map((subService, index) => (
            <View key={index} style={styles.subServiceItem}>
              <Text style={styles.subServiceName}>{subService.name}</Text>
              <Text style={styles.subServicePrice}>+₦{subService.price?.toLocaleString()}</Text>
            </View>
          ))}
          {item.subServices.length > 2 && (
            <Text style={styles.moreSubServices}>+{item.subServices.length - 2} more services</Text>
          )}
        </View>
      </View>
    );
  };

  const renderLocationInfo = (item) => {
    if (!item.location) return null;

    return (
      <View style={styles.locationSection}>
        <View style={styles.locationHeader}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location.brandName} • {item.location.city}, {item.location.state}
          </Text>
        </View>
        {item.location.verified && (
          <View style={styles.locationVerified}>
            <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
            <Text style={styles.locationVerifiedText}>Verified Location</Text>
          </View>
        )}
      </View>
    );
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name={item.itemType === 'service' ? 'construct' : 'cube'} size={40} color="#7B2CBF" />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <View style={styles.badgeRow}>
            {item.location?.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {item.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discount}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.itemTypeBadge}>
            <Text style={styles.itemTypeText}>{item.itemType?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.name || item.title}</Text>
        <Text style={styles.provider}>{item.businessName}</Text>
        <Text style={styles.category}>{item.categoryName}</Text>
        
        {renderLocationInfo(item)}
        
        <View style={styles.pricingSection}>
          <View style={styles.priceContainer}>
            {item.discount > 0 && (
              <Text style={styles.originalPrice}>₦{item.originalPrice?.toLocaleString()}</Text>
            )}
            <Text style={styles.currentPrice}>₦{item.discountedPrice?.toLocaleString()}</Text>
          </View>
          {item.youSave > 0 && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savings}>Save ₦{item.youSave?.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {item.itemType === 'product' && (
          <View style={styles.stockSection}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.stock}>{item.availableQuantity || 0} in stock</Text>
          </View>
        )}

        {renderSubServices(item)}
        {renderBookingAvailability(item)}

        <TouchableOpacity 
          style={[
            styles.viewButton,
            item.itemType === 'service' && styles.serviceViewButton
          ]}
          onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        >
          <Ionicons 
            name={item.itemType === 'service' ? 'calendar' : 'eye'} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.viewButtonText}>
            {item.itemType === 'service' ? 'Book Service' : 'View Details'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Products & Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !filters.itemType && styles.activeFilter]}
          onPress={() => handleFilterChange({...filters, itemType: ''})}
        >
          <Text style={[styles.filterText, !filters.itemType && styles.activeFilterText]}>
            All Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.itemType === 'product' && styles.activeFilter]}
          onPress={() => {
            const newItemType = filters.itemType === 'product' ? '' : 'product';
            handleFilterChange({...filters, itemType: newItemType});
          }}
        >
          <Text style={[styles.filterText, filters.itemType === 'product' && styles.activeFilterText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.itemType === 'service' && styles.activeFilter]}
          onPress={() => {
            const newItemType = filters.itemType === 'service' ? '' : 'service';
            handleFilterChange({...filters, itemType: newItemType});
          }}
        >
          <Text style={[styles.filterText, filters.itemType === 'service' && styles.activeFilterText]}>
            Services
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Current Sort Indicator */}
      <View style={styles.sortIndicator}>
        <Text style={styles.resultCount}>
          {products.length} {filters.itemType ? filters.itemType + 's' : 'items'} found
        </Text>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchProductsWithFilters(filters, true)} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            hasMore && products.length > 0 ? (
              <ActivityIndicator size="small" color="#7B2CBF" style={styles.loadMore} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            ) : null
          }
        />
      )}
      
      <BottomNavigation navigation={navigation} activeTab="Products" />
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  activeFilter: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  sortIndicator: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  resultCount: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  productList: {
    padding: 16,
    paddingBottom: 100, // Add bottom padding for navigation
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#F3E5F5',
    position: 'relative',
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
  },
  badgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'column',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTypeBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pricingSection: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  savingsContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  savingsStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  savings: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  stock: {
    fontSize: 12,
    color: '#666',
  },
  provider: {
    fontSize: 14,
    color: '#7B2CBF',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    gap: 6,
  },
  serviceViewButton: {
    backgroundColor: '#4CAF50',
  },
  viewButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadMore: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  
  // Location Section Styles
  locationSection: {
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  locationVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationVerifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Sub-Services Section Styles
  subServicesSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  subServicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  subServicesHeaderText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  subServicesList: {
    gap: 4,
  },
  subServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subServiceName: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  subServicePrice: {
    fontSize: 11,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  moreSubServices: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Booking Availability Section Styles
  bookingAvailabilitySection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bookingHeaderText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bookingItemText: {
    fontSize: 11,
    color: '#666',
  },
  availableDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableDaysLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  dayChip: {
    backgroundColor: '#7B2CBF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayChipText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '500',
  },
  timeWindowsPreview: {
    gap: 4,
  },
  timeWindowsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  timeWindowsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeWindow: {
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeWindowText: {
    fontSize: 9,
    color: '#333',
    fontWeight: '500',
  },
  moreTimeWindows: {
    fontSize: 9,
    color: '#7B2CBF',
    fontWeight: '500',
  },
});

export default PublicProductSearchScreen;