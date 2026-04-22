import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const AdminGalleryItemsScreen = ({ navigation }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    itemType: '',
    categoryId: '',
    search: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchGalleryItems();
    fetchCategories();
  }, [filters]);

  const fetchGalleryItems = async () => {
    try {
      const result = await ApiService.getAdminGalleryItems(filters);
      if (result.success) {
        setGalleryItems(result.data.items || []);
      } else {
        Alert.alert('Error', result.message || 'Failed to fetch gallery items');
      }
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      Alert.alert('Error', 'Failed to fetch gallery items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiService.getAdminGalleryCategories();
      if (result.success) {
        setCategories(result.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGalleryItems();
  };

  const handleBookService = (service) => {
    navigation.navigate('AdminBookingStep1SelectDay', { service });
  };

  const handleBuyProduct = (product) => {
    navigation.navigate('AdminPurchaseFlow', { product });
  };

  const handleViewDetails = (item) => {
    navigation.navigate('AdminGalleryItemDetails', { itemId: item.id });
  };

  const renderGalleryItem = ({ item }) => {
    const imageUrl = item.imageUrl || item.image || null;
    const isService = item.itemType === 'service';
    const isProduct = item.itemType === 'product';
    
    return (
      <View style={styles.itemCard}>
        <TouchableOpacity onPress={() => handleViewDetails(item)}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Ionicons 
                name={isService ? "calendar" : "cube"} 
                size={32} 
                color="#ccc" 
              />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.itemContent}>
          <TouchableOpacity onPress={() => handleViewDetails(item)}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.itemCategory}>{item.categoryName}</Text>
            <Text style={styles.itemPrice}>
              ₦{item.actualAmount?.toFixed(2) || '0.00'}
            </Text>
            
            {isService && (
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceProviders}>
                  {item.totalAvailableServiceProviders || 0} providers
                </Text>
                {item.hasBookingAvailability && (
                  <View style={styles.availabilityBadge}>
                    <Text style={styles.availabilityText}>Bookable</Text>
                  </View>
                )}
              </View>
            )}
            
            {isProduct && (
              <Text style={styles.stockInfo}>
                Stock: {item.totalAvailableQuantity || 0}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.itemActions}>
            {isService && item.canBook && (
              <TouchableOpacity
                style={[styles.actionButton, styles.bookButton]}
                onPress={() => handleBookService(item)}
              >
                <Ionicons name="calendar" size={16} color="white" />
                <Text style={styles.actionButtonText}>Book Service</Text>
              </TouchableOpacity>
            )}
            
            {isProduct && item.canPurchase && (
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={() => handleBuyProduct(item)}
              >
                <Ionicons name="bag" size={16} color="white" />
                <Text style={styles.actionButtonText}>Buy Product</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => handleViewDetails(item)}
            >
              <Ionicons name="eye" size={16} color="#7B2CBF" />
              <Text style={[styles.actionButtonText, { color: '#7B2CBF' }]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>No Gallery Items</Text>
      <Text style={styles.emptyMessage}>
        {filters.search || filters.itemType || filters.categoryId
          ? 'No items match your current filters'
          : 'No gallery items found for your organization'}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateGalleryItem')}
      >
        <Text style={styles.createButtonText}>Create Gallery Item</Text>
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
          <Text style={styles.headerTitle}>Gallery Items</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading gallery items...</Text>
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
        <Text style={styles.headerTitle}>Gallery Items</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={filters.search}
          onChangeText={(text) => setFilters({...filters, search: text})}
        />
      </View>

      {/* Active Filters */}
      {(filters.itemType || filters.categoryId) && (
        <View style={styles.activeFilters}>
          {filters.itemType && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {filters.itemType === 'service' ? 'Services' : 'Products'}
              </Text>
              <TouchableOpacity onPress={() => setFilters({...filters, itemType: ''})}>
                <Ionicons name="close" size={16} color="#7B2CBF" />
              </TouchableOpacity>
            </View>
          )}
          {filters.categoryId && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {categories.find(c => c.id === filters.categoryId)?.name || 'Category'}
              </Text>
              <TouchableOpacity onPress={() => setFilters({...filters, categoryId: ''})}>
                <Ionicons name="close" size={16} color="#7B2CBF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={galleryItems}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
      />

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Items</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Item Type</Text>
              <View style={styles.filterOptions}>
                {['', 'service', 'product'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.itemType === type && styles.filterOptionSelected,
                    ]}
                    onPress={() => setFilters({...filters, itemType: type})}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.itemType === type && styles.filterOptionTextSelected,
                    ]}>
                      {type === '' ? 'All Items' : 
                       type === 'service' ? 'Services' : 'Products'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.categoryId === '' && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilters({...filters, categoryId: ''})}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.categoryId === '' && styles.filterOptionTextSelected,
                  ]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterOption,
                      filters.categoryId === category.id && styles.filterOptionSelected,
                    ]}
                    onPress={() => setFilters({...filters, categoryId: category.id})}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.categoryId === category.id && styles.filterOptionTextSelected,
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setFilters({
                    itemType: '',
                    categoryId: '',
                    search: '',
                    page: 1,
                    limit: 20,
                  });
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
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
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    padding: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemCategory: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceProviders: {
    fontSize: 12,
    color: '#6B7280',
  },
  availabilityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  stockInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  bookButton: {
    backgroundColor: '#10B981',
  },
  buyButton: {
    backgroundColor: '#F59E0B',
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  createButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  filterOptionTextSelected: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default AdminGalleryItemsScreen;