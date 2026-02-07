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
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../services/api';

const CreateGalleryItemScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    sku: '',
    upc: '',
    platformUniqueCode: '',
    totalAvailableQuantity: '0',
    priceInDollars: '0.00',
    discountPercentage: '0',
    platformChargePercentage: '5',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '23:59',
    visibilityToPublic: true,
    notes: '',
    locationIndex: '',
  });

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [mediaUsage, setMediaUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchCategories();
    fetchMediaUsage();
  }, []);

  const fetchLocations = async () => {
    try {
      const result = await ApiService.getGalleryLocations();
      if (result.success) {
        setLocations(result.data.locations);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch locations');
    }
  };

  const fetchCategories = async () => {
    try {
      const categories = [
        'Electronics',
        'Clothing & Fashion',
        'Home & Garden',
        'Sports & Outdoors',
        'Health & Beauty',
        'Books & Media',
        'Toys & Games',
        'Automotive',
        'Food & Beverages',
        'Jewelry & Accessories',
        'Art & Crafts',
        'Pet Supplies',
        'Office Supplies',
        'Musical Instruments',
        'Travel & Luggage'
      ];
      setCategories(categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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

  const pickImage = async () => {
    const selectedLocation = locations.find(loc => loc.locationIndex.toString() === formData.locationIndex);
    const isVerified = selectedLocation?.status === 'Verified';
    const maxImages = isVerified ? 10 : 3;
    
    if (selectedImages.length >= maxImages) {
      Alert.alert(
        'Upload Limit Reached',
        `You've reached the image limit for this location (${maxImages} images).`
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
      setSelectedImages([...selectedImages, result.assets[0]]);
    }
  };

  const pickVideo = async () => {
    const selectedLocation = locations.find(loc => loc.locationIndex.toString() === formData.locationIndex);
    const isVerified = selectedLocation?.status === 'Verified';
    const maxVideos = isVerified ? 2 : 0;
    
    if (!isVerified) {
      Alert.alert(
        'Verification Required',
        'Only verified locations can upload videos.'
      );
      return;
    }

    if (selectedVideos.length >= maxVideos) {
      Alert.alert('Upload Limit Reached', `You've reached the video limit for this location (${maxVideos} videos).`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedVideos([...selectedVideos, result.assets[0]]);
    }
  };

  const createGalleryItem = async () => {
    if (!formData.description.trim() || !formData.category || !formData.locationIndex) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create gallery item
      const result = await ApiService.createGalleryItem({
        ...formData,
        locationIndex: parseInt(formData.locationIndex),
        totalAvailableQuantity: parseInt(formData.totalAvailableQuantity) || 0,
        priceInDollars: parseFloat(formData.priceInDollars) || 0,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        platformChargePercentage: parseFloat(formData.platformChargePercentage) || 5,
      });

      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to create gallery item');
        return;
      }

      const itemId = result.data.galleryItem._id;

      // Upload images if selected
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          await ApiService.uploadGalleryImage(itemId, image);
        }
      }

      // Upload videos if selected
      if (selectedVideos.length > 0) {
        for (const video of selectedVideos) {
          await ApiService.uploadGalleryVideo(itemId, video);
        }
      }

      Alert.alert('Success', 'Gallery item created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create gallery item');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (itemId) => {
    const formData = new FormData();
    formData.append('image', {
      uri: selectedImage.uri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    const response = await fetch(`/api/admin/gallery/${itemId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const uploadVideo = async (itemId) => {
    const formData = new FormData();
    formData.append('video', {
      uri: selectedVideo.uri,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    const response = await fetch(`/api/admin/gallery/${itemId}/upload-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload video');
    }
  };

  const calculateActualAmount = () => {
    const price = parseFloat(formData.priceInDollars) || 0;
    const discount = parseFloat(formData.discountPercentage) || 0;
    const platformCharge = parseFloat(formData.platformChargePercentage) || 0;
    
    return price - (price * discount / 100) + (price * platformCharge / 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Gallery Item</Text>
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

        {/* Media Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          {formData.locationIndex && (() => {
            const selectedLocation = locations.find(loc => loc.locationIndex.toString() === formData.locationIndex);
            const isVerified = selectedLocation?.status === 'Verified';
            const maxImages = isVerified ? 10 : 3;
            const maxVideos = isVerified ? 2 : 0;
            
            return (
              <View style={styles.mediaUsage}>
                <Text style={styles.mediaUsageText}>
                  Images: {selectedImages.length}/{maxImages}
                </Text>
                <Text style={styles.mediaUsageText}>
                  Videos: {selectedVideos.length}/{maxVideos}
                </Text>
              </View>
            );
          })()}

          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#7B2CBF" />
            <Text style={styles.mediaButtonText}>Add Image</Text>
          </TouchableOpacity>

          {selectedImages.map((image, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
            <Ionicons name="videocam" size={24} color="#7B2CBF" />
            <Text style={styles.mediaButtonText}>Add Video</Text>
          </TouchableOpacity>

          {selectedVideos.map((video, index) => (
            <View key={index} style={styles.mediaItem}>
              <Text style={styles.videoSelected}>Video {index + 1}: {video.fileName || 'video.mp4'}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => setSelectedVideos(selectedVideos.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
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
              !formData.category && styles.placeholderText
            ]}>
              {formData.category || 'Select Category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <Modal
            visible={categoryModalVisible}
            transparent
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.modalItem}
                    onPress={() => {
                      setFormData({...formData, category});
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{category}</Text>
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

          <Text style={styles.inputLabel}>Platform Unique Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter platform unique code"
            value={formData.platformUniqueCode}
            onChangeText={(text) => setFormData({...formData, platformUniqueCode: text})}
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

          <Text style={styles.inputLabel}>Platform Charge (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={formData.platformChargePercentage}
            onChangeText={(text) => setFormData({...formData, platformChargePercentage: text})}
            keyboardType="numeric"
          />

          <View style={styles.calculatedPrice}>
            <Text style={styles.calculatedPriceLabel}>Actual Amount:</Text>
            <Text style={styles.calculatedPriceValue}>₦{calculateActualAmount().toFixed(2)}</Text>
          </View>

          <Text style={styles.inputLabel}>Start Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowStartDatePicker(true)}>
            <Text style={startDate ? styles.inputText : styles.placeholderText}>
              {startDate ? startDate.toDateString() : 'Select Start Date'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Start Time</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
            <Text style={startTime ? styles.inputText : styles.placeholderText}>
              {startTime ? startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Select Start Time'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>End Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowEndDatePicker(true)}>
            <Text style={endDate ? styles.inputText : styles.placeholderText}>
              {endDate ? endDate.toDateString() : 'Select End Date'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>End Time</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
            <Text style={endTime ? styles.inputText : styles.placeholderText}>
              {endTime ? endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Select End Time'}
            </Text>
          </TouchableOpacity>

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

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={createGalleryItem}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Gallery Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              setFormData({...formData, startDate: selectedDate.toISOString().split('T')[0]});
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
              setFormData({...formData, endDate: selectedDate.toISOString().split('T')[0]});
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) {
              setStartTime(selectedTime);
              setFormData({...formData, startTime: selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})});
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) {
              setEndTime(selectedTime);
              setFormData({...formData, endTime: selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})});
            }
          }}
        />
      )}
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B2CBF',
    marginBottom: 6,
    marginTop: 4,
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
  inputDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
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
  createButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediaItem: {
    position: 'relative',
    marginBottom: 12,
  },
  inputText: {
    color: '#333',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default CreateGalleryItemScreen;