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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const EditGalleryItemScreen = ({ navigation, route }) => {
  const { itemId } = route.params;
  
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
  });

  const [categories, setCategories] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mediaUsage, setMediaUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchGalleryItem();
    fetchCategories();
    fetchMediaUsage();
  }, []);

  const fetchGalleryItem = async () => {
    try {
      const result = await ApiService.getGalleryItem(itemId);
      
      if (result.success) {
        const item = result.data.galleryItem;
        setFormData({
          description: item.description || '',
          category: item.category || '',
          sku: item.sku || '',
          upc: item.upc || '',
          platformUniqueCode: item.platformUniqueCode || '',
          totalAvailableQuantity: item.totalAvailableQuantity?.toString() || '0',
          priceInDollars: item.priceInDollars?.toString() || '0.00',
          discountPercentage: item.discountPercentage?.toString() || '0',
          platformChargePercentage: item.platformChargePercentage?.toString() || '5',
          startDate: item.startDate ? item.startDate.split('T')[0] : '',
          startTime: item.startTime || '09:00',
          endDate: item.endDate ? item.endDate.split('T')[0] : '',
          endTime: item.endTime || '23:59',
          visibilityToPublic: item.visibilityToPublic !== false,
          notes: item.notes || '',
        });
        
        setCurrentImage(item.imageUrl);
        setCurrentVideo(item.videoUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gallery item');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiService.getGalleryCategories();
      if (result.success) {
        setCategories(result.data.categories);
      }
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
    if (!formData.description.trim() || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUpdating(true);

    try {
      // Update gallery item
      const result = await ApiService.updateGalleryItem(itemId, {
        ...formData,
        totalAvailableQuantity: parseInt(formData.totalAvailableQuantity) || 0,
        priceInDollars: parseFloat(formData.priceInDollars) || 0,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        platformChargePercentage: parseFloat(formData.platformChargePercentage) || 5,
      });

      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to update gallery item');
        return;
      }

      // Upload new image if selected
      if (selectedImage) {
        await ApiService.uploadGalleryImage(itemId, selectedImage);
      }

      // Upload new video if selected
      if (selectedVideo) {
        await ApiService.uploadGalleryVideo(itemId, selectedVideo);
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

  const uploadImage = async () => {
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

  const uploadVideo = async () => {
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
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Description *"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={3}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
              style={styles.picker}
            >
              <Picker.Item label="Select Category *" value="" />
              {categories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="SKU"
            value={formData.sku}
            onChangeText={(text) => setFormData({...formData, sku: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="UPC"
            value={formData.upc}
            onChangeText={(text) => setFormData({...formData, upc: text})}
          />
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Price ($)"
            value={formData.priceInDollars}
            onChangeText={(text) => setFormData({...formData, priceInDollars: text})}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Discount (%)"
            value={formData.discountPercentage}
            onChangeText={(text) => setFormData({...formData, discountPercentage: text})}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Platform Charge (%)"
            value={formData.platformChargePercentage}
            onChangeText={(text) => setFormData({...formData, platformChargePercentage: text})}
            keyboardType="numeric"
          />

          <View style={styles.calculatedPrice}>
            <Text style={styles.calculatedPriceLabel}>Actual Amount:</Text>
            <Text style={styles.calculatedPriceValue}>${calculateActualAmount().toFixed(2)}</Text>
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Available Quantity"
            value={formData.totalAvailableQuantity}
            onChangeText={(text) => setFormData({...formData, totalAvailableQuantity: text})}
            keyboardType="numeric"
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
});

export default EditGalleryItemScreen;