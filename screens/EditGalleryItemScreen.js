import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const EditGalleryItemScreen = ({ navigation, route }) => {
  const { itemId } = route.params || {};
  
  // Enhanced validation with better error handling
  if (!itemId || itemId === 'undefined' || itemId === 'null') {
    console.error('Invalid itemId:', itemId);
    Alert.alert('Error', 'Gallery item ID is required', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Invalid item ID</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  console.log('EditGalleryItemScreen loaded with itemId:', itemId);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    itemType: '',
    categoryId: '',
    sku: '',
    upc: '',
    platformUniqueCode: '',
    totalAvailableQuantity: '0',
    priceInDollars: '0.00',
    discountPercentage: '0',
    platformChargePercentage: '5',
    upfrontPaymentPercentage: '0',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '23:59',
    visibilityToPublic: true,
    notes: '',
    locationIndex: '',
  });

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [commissionRate, setCommissionRate] = useState(0);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mediaUsage, setMediaUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load for itemId:', itemId);
        await Promise.all([
          fetchGalleryItem(),
          fetchCategories(),
          fetchLocations(),
          fetchMediaUsage()
        ]);
        console.log('All data loaded successfully');
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load gallery item data');
      }
    };
    
    loadData();
  }, [itemId]);

  const fetchGalleryItem = async () => {
    try {
      const result = await ApiService.getGalleryItem(itemId);
      console.log('Gallery item fetch result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data?.galleryItem) {
        const item = result.data.galleryItem;
        console.log('Setting form data for item:', item._id);
        
        setFormData({
          name: item.name || '',
          description: item.description || '',
          itemType: item.itemType || '',
          categoryId: item.categoryId || item.category || '',
          sku: item.sku || '',
          upc: item.upc || '',
          platformUniqueCode: item.platformUniqueCode || '',
          totalAvailableQuantity: item.totalAvailableQuantity?.toString() || '0',
          priceInDollars: item.priceInDollars?.toString() || '0.00',
          discountPercentage: item.discountPercentage?.toString() || '0',
          platformChargePercentage: item.platformChargePercentage?.toString() || '5',
          upfrontPaymentPercentage: item.upfrontPaymentPercentage?.toString() || '0',
          startDate: item.startDate ? item.startDate.split('T')[0] : '',
          startTime: item.startTime || '09:00',
          endDate: item.endDate ? item.endDate.split('T')[0] : '',
          endTime: item.endTime || '23:59',
          visibilityToPublic: item.visibilityToPublic !== false,
          notes: item.notes || '',
          locationIndex: item.locationIndex?.toString() || '',
        });
        
        setCurrentImage(item.imageUrl || null);
        setCurrentVideo(item.videoUrl || null);
        console.log('Form data set successfully');
      } else {
        console.log('Gallery item not found in response');
        Alert.alert('Error', 'Gallery item not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      Alert.alert('Error', 'Failed to fetch gallery item', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiService.getGalleryCategories();
      console.log('Categories fetch result:', JSON.stringify(result, null, 2));
      if (result.success && result.data?.categories) {
        setCategories(result.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const result = await ApiService.getGalleryLocations();
      if (result.success && result.data?.locations) {
        setLocations(result.data.locations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchCommissionRate = async (categoryId) => {
    try {
      const result = await ApiService.apiCall(`/admin/gallery/commission/${categoryId}`);
      if (result.success) {
        setCommissionRate(result.data.commission.commissionRate);
      }
    } catch (error) {
      console.error('Failed to fetch commission rate:', error);
      setCommissionRate(0);
    }
  };

  const fetchMediaUsage = async () => {
    try {
      const result = await ApiService.getGalleryMediaUsage();
      console.log('Media usage fetch result:', JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        setMediaUsage(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch media usage:', error);
    }
  };

  const pickImage = async () => {
    if (!currentImage && mediaUsage?.images?.remaining <= 0) {
      Alert.alert(
        'Upload Limit Reached',
        `You've reached your image limit (${mediaUsage.images.max}). ${
          !mediaUsage.verified ? 'Subscribe to verified badge for more uploads.' : ''
        }`
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const pickVideo = async () => {
    if (!mediaUsage?.verified) {
      Alert.alert(
        'Verification Required',
        'Unverified organizations cannot upload videos. Please subscribe to verified badge.'
      );
      return;
    }

    if (!currentVideo && mediaUsage?.videos?.remaining <= 0) {
      Alert.alert('Upload Limit Reached', `You've reached your video limit (${mediaUsage.videos.max}).`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0]);
    }
  };

  const updateGalleryItem = async () => {
    console.log('=== UPDATE VALIDATION DEBUG ===');
    console.log('Name:', formData.name);
    console.log('Description:', formData.description);
    console.log('Item Type:', formData.itemType);
    console.log('Category ID:', formData.categoryId);
    console.log('Location Index:', formData.locationIndex);
    
    if (!formData.name?.trim() || !formData.description?.trim() || !formData.categoryId) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Description, Category)');
      return;
    }

    setUpdating(true);

    try {
      // Update gallery item
      const result = await ApiService.updateGalleryItem(itemId, {
        name: formData.name,
        description: formData.description,
        itemType: formData.itemType,
        categoryId: formData.categoryId,
        sku: formData.sku,
        upc: formData.upc,
        totalAvailableQuantity: parseInt(formData.totalAvailableQuantity) || 0,
        priceInDollars: parseFloat(formData.priceInDollars) || 0,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        upfrontPaymentPercentage: parseFloat(formData.upfrontPaymentPercentage) || 0,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        visibilityToPublic: formData.visibilityToPublic,
        notes: formData.notes,
        locationIndex: parseInt(formData.locationIndex) || 0,
      });

      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to update gallery item');
        return;
      }

      // Upload new image if selected
      if (selectedImage) {
        try {
          await ApiService.uploadGalleryImage(itemId, selectedImage);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }

      // Upload new video if selected
      if (selectedVideo) {
        try {
          await ApiService.uploadGalleryVideo(itemId, selectedVideo);
        } catch (error) {
          console.error('Error uploading video:', error);
        }
      }

      Alert.alert('Success', 'Gallery item updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update gallery item');
    } finally {
      setUpdating(false);
    }
  };



  useEffect(() => {
    if (formData.categoryId) {
      fetchCommissionRate(formData.categoryId);
    } else {
      setCommissionRate(0);
    }
  }, [formData.categoryId]);

  const calculateActualAmount = () => {
    const price = parseFloat(formData.priceInDollars) || 0;
    const discount = parseFloat(formData.discountPercentage) || 0;
    const platformCharge = commissionRate || 0;
    
    return price - (price * discount / 100) + (price * platformCharge / 100);
  };

  const calculateUpfrontAmount = () => {
    const actualAmount = calculateActualAmount();
    const upfrontPercentage = parseFloat(formData.upfrontPaymentPercentage) || 0;
    return actualAmount * (upfrontPercentage / 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading gallery item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Gallery Item</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchGalleryItem();
              fetchCategories();
              fetchMediaUsage();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Edit Gallery Item</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.locationIndex}
              style={[
                styles.checkboxItem,
                location.status === 'Pending Payment' && styles.disabledItem
              ]}
              onPress={() => {
                if (location.status !== 'Pending Payment') {
                  setFormData({...formData, locationIndex: location.locationIndex.toString()});
                }
              }}
              disabled={location.status === 'Pending Payment'}
            >
              <View style={styles.checkbox}>
                {formData.locationIndex === location.locationIndex.toString() && (
                  <Ionicons name="checkmark" size={16} color="#7B2CBF" />
                )}
              </View>
              <Text style={[
                styles.checkboxText,
                location.status === 'Pending Payment' && styles.disabledText
              ]}>
                {location.brandName} - {location.cityRegion} ({location.status})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Item Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Type *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setFormData({...formData, itemType: 'product'})}
            >
              <View style={styles.radioButton}>
                {formData.itemType === 'product' && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setFormData({...formData, itemType: 'service'})}
            >
              <View style={styles.radioButton}>
                {formData.itemType === 'service' && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.inputLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product/service name"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />

          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter description"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={[
              styles.dropdownText,
              !formData.categoryId && styles.placeholderText
            ]}>
              {formData.categoryId ? categories.find(c => (c.id || c._id) === formData.categoryId)?.name : 'Select Category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {commissionRate > 0 && (
            <View style={styles.commissionInfo}>
              <Text style={styles.commissionText}>Platform Commission: {commissionRate}%</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>SKU (Stock Keeping Unit Code)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter SKU"
            value={formData.sku}
            onChangeText={(text) => setFormData({...formData, sku: text})}
          />

          <Text style={styles.inputLabel}>UPC (Universal Product Code)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter UPC"
            value={formData.upc}
            onChangeText={(text) => setFormData({...formData, upc: text})}
          />

          <Text style={styles.inputLabel}>Platform Unique Code (Auto-generated)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={formData.platformUniqueCode}
            editable={false}
            placeholder="Auto-generated"
          />

          <Text style={styles.inputLabel}>Total Available Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.totalAvailableQuantity}
            onChangeText={(text) => setFormData({...formData, totalAvailableQuantity: text})}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Price (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={formData.priceInDollars}
            onChangeText={(text) => setFormData({...formData, priceInDollars: text})}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.discountPercentage}
            onChangeText={(text) => setFormData({...formData, discountPercentage: text})}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Upfront Payment (%) - Optional</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.upfrontPaymentPercentage}
            onChangeText={(text) => setFormData({...formData, upfrontPaymentPercentage: text})}
            keyboardType="numeric"
          />
          {parseFloat(formData.upfrontPaymentPercentage) > 0 && (
            <View style={styles.upfrontInfo}>
              <Text style={styles.upfrontText}>Upfront Amount: ₦{calculateUpfrontAmount().toFixed(2)}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Platform Charge (%)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={commissionRate.toString()}
            editable={false}
            placeholder="Auto-fetched from category"
          />

          <View style={styles.calculatedPrice}>
            <Text style={styles.calculatedPriceLabel}>Actual Amount:</Text>
            <Text style={styles.calculatedPriceValue}>₦{calculateActualAmount().toFixed(2)}</Text>
          </View>

          <Text style={styles.inputLabel}>Start Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.startDate}
            onChangeText={(text) => setFormData({...formData, startDate: text})}
          />

          <Text style={styles.inputLabel}>Start Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={formData.startTime}
            onChangeText={(text) => setFormData({...formData, startTime: text})}
          />

          <Text style={styles.inputLabel}>End Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.endDate}
            onChangeText={(text) => setFormData({...formData, endDate: text})}
          />

          <Text style={styles.inputLabel}>End Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={formData.endTime}
            onChangeText={(text) => setFormData({...formData, endTime: text})}
          />

          <Text style={styles.inputLabel}>Visibility to Public</Text>
          <Text style={styles.inputDescription}>Make this item visible on your public profile</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setFormData({...formData, visibilityToPublic: true})}
            >
              <View style={styles.radioButton}>
                {formData.visibilityToPublic && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setFormData({...formData, visibilityToPublic: false})}
            >
              <View style={styles.radioButton}>
                {!formData.visibilityToPublic && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text style={styles.radioText}>No</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Current Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Media</Text>
          
          {currentImage && (
            <View style={styles.currentMediaContainer}>
              <Text style={styles.currentMediaLabel}>Current Image:</Text>
              <Image source={{ uri: currentImage }} style={styles.currentImage} />
            </View>
          )}

          {currentVideo && (
            <View style={styles.currentMediaContainer}>
              <Text style={styles.currentMediaLabel}>Current Video:</Text>
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam" size={40} color="#7B2CBF" />
                <Text style={styles.videoPlaceholderText}>Video attached</Text>
              </View>
            </View>
          )}
        </View>

        {/* Update Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Media</Text>
          
          {mediaUsage && (
            <View style={styles.mediaUsage}>
              <Text style={styles.mediaUsageText}>
                Images: {mediaUsage.images?.current || 0}/{mediaUsage.images?.max || 0}
              </Text>
              <Text style={styles.mediaUsageText}>
                Videos: {mediaUsage.videos?.current || 0}/{mediaUsage.videos?.max || 0}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#7B2CBF" />
            <Text style={styles.mediaButtonText}>
              {currentImage ? 'Replace Image' : 'Add Image'}
            </Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          )}

          <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
            <Ionicons name="videocam" size={24} color="#7B2CBF" />
            <Text style={styles.mediaButtonText}>
              {currentVideo ? 'Replace Video' : 'Add Video'}
            </Text>
          </TouchableOpacity>

          {selectedVideo && (
            <Text style={styles.videoSelected}>New video selected: {selectedVideo.fileName || 'video.mp4'}</Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={updateGalleryItem}
          disabled={updating}
        >
          <Text style={styles.updateButtonText}>
            {updating ? 'Updating...' : 'Update Gallery Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id || category._id}
                style={styles.modalItem}
                onPress={() => {
                  setFormData({...formData, categoryId: category.id || category._id});
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  picker: {
    height: 50,
  },
  calculatedPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calculatedPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatedPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  currentMediaContainer: {
    marginBottom: 16,
  },
  currentMediaLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  currentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoPlaceholder: {
    height: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: 8,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  mediaUsage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaUsageText: {
    fontSize: 14,
    color: '#666',
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#7B2CBF',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoSelected: {
    textAlign: 'center',
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  updateButtonDisabled: {
    backgroundColor: '#CCC',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledItem: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#7B2CBF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disabledText: {
    color: '#999',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7B2CBF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B2CBF',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  commissionInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commissionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  readOnlyInput: {
    backgroundColor: '#F0F0F0',
    color: '#666',
  },
  upfrontInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  upfrontText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
    marginBottom: 6,
    marginTop: 4,
  },
  inputDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
  },
});

export default EditGalleryItemScreen;