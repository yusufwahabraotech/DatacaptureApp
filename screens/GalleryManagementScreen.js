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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const GalleryManagementScreen = ({ navigation, route }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaUsage, setMediaUsage] = useState(null);
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
    fetchMediaUsage();
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
        if (result.data.mediaUsage) {
          setMediaUsage(result.data.mediaUsage);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gallery items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMediaUsage = async () => {
    try {
      const result = await ApiService.getGalleryMediaUsage();
      if (result.success) {
        setMediaUsage(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch media usage:', error);
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
          onPress={() => navigation.navigate('EditGalleryItem', { itemId: item._id })}
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

  const MediaUsageCard = () => (
    <View style={styles.usageCard}>
      <Text style={styles.usageTitle}>Media Usage</Text>
      <View style={styles.usageRow}>
        <Text>Images: {mediaUsage?.images?.current || 0}/{mediaUsage?.images?.max || 0}</Text>
        <Text>Videos: {mediaUsage?.videos?.current || 0}/{mediaUsage?.videos?.max || 0}</Text>
      </View>
      {!mediaUsage?.verified && (
        <Text style={styles.upgradeText}>
          Upgrade to verified badge for more uploads
        </Text>
      )}
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

      {mediaUsage && <MediaUsageCard />}

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
  usageCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7B2CBF',
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upgradeText: {
    color: '#FF6B35',
    fontSize: 12,
    marginTop: 4,
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