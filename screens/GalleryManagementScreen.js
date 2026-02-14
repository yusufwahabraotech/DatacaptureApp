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

const GalleryManagementScreen = ({ navigation, route }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchGalleryItems();
  }, [filters]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.refresh) {
        fetchGalleryItems();
        navigation.setParams({ refresh: false });
      } else {
        fetchGalleryItems();
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const fetchGalleryItems = async () => {
    try {
      const result = await ApiService.getGalleryItems(filters);
      if (result.success) {
        setGalleryItems(result.data.items);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gallery items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const deleteGalleryItem = async (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this gallery item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteGalleryItem(itemId);
              fetchGalleryItems();
              Alert.alert('Success', 'Gallery item deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete gallery item');
            }
          }
        }
      ]
    );
  };

  const renderGalleryItem = ({ item }) => (
    <View style={styles.itemCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name || 'Unnamed Item'}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemPrice}>${item.actualAmount?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.totalAvailableQuantity}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            try {
              console.log('Navigating to EditGalleryItem with itemId:', item._id);
              if (!item._id) {
                Alert.alert('Error', 'Invalid item ID');
                return;
              }
              navigation.navigate('EditGalleryItem', { itemId: item._id });
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert('Error', 'Failed to open edit screen');
            }
          }}
        >
          <Ionicons name="pencil" size={20} color="#7B2CBF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteGalleryItem(item._id)}
        >
          <Ionicons name="trash" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery Management</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={24} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading gallery items...</Text>
        </View>
      ) : (
        <FlatList
          data={galleryItems}
          renderItem={renderGalleryItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchGalleryItems();
            }} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No gallery items found</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGalleryItem')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Gallery Items</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={filters.category}
              onChangeText={(text) => setFilters({...filters, category: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Min Price"
              value={filters.minPrice}
              onChangeText={(text) => setFilters({...filters, minPrice: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Max Price"
              value={filters.maxPrice}
              onChangeText={(text) => setFilters({...filters, maxPrice: text})}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => {
                  setFilterVisible(false);
                  fetchGalleryItems();
                }}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
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

  itemCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F0F0',
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  applyButton: {
    backgroundColor: '#7B2CBF',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  applyButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GalleryManagementScreen;