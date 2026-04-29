import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const DeliveryConfirmationFormScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({
    satisfactionDeclaration: '',
    deliveryComment: '',
    deliveryImages: [],
    deliveryVideo: null,
    videoUrl: ''
  });

  useEffect(() => {
    loadTemplate();
    requestPermissions();
  }, []);

  const loadTemplate = async () => {
    try {
      const response = await ApiService.getDeliveryTemplate(orderId);
      if (response.success) {
        setTemplate(response.data.template);
      } else {
        Alert.alert('Error', response.message || 'Failed to load delivery template');
      }
    } catch (error) {
      console.error('Template loading error:', error);
      Alert.alert('Error', 'Failed to load delivery form');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are needed to select images.');
    }
  };

  const handleImagePicker = async () => {
    try {
      if (formData.deliveryImages.length >= 5) {
        Alert.alert('Limit Reached', 'Maximum 5 images allowed');
        return;
      }

      Alert.alert(
        'Select Images',
        'Choose how you want to add images',
        [
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Gallery', onPress: () => openGallery() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `delivery_image_${Date.now()}.jpg`
        };
        setFormData(prev => ({
          ...prev,
          deliveryImages: [...prev.deliveryImages, newImage]
        }));
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - formData.deliveryImages.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `delivery_image_${Date.now()}_${index}.jpg`
        }));
        
        setFormData(prev => ({
          ...prev,
          deliveryImages: [...prev.deliveryImages, ...newImages].slice(0, 5)
        }));
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const handleVideoPicker = async () => {
    try {
      Alert.alert(
        'Select Video',
        'Choose how you want to add video',
        [
          { text: 'Camera', onPress: () => recordVideo() },
          { text: 'Gallery', onPress: () => selectVideo() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('Video picker error:', error);
      Alert.alert('Error', 'Failed to open video picker');
    }
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        videoMaxDuration: 120, // 2 minutes
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          deliveryVideo: {
            uri: result.assets[0].uri,
            type: 'video/mp4',
            name: `delivery_video_${Date.now()}.mp4`
          }
        }));
      }
    } catch (error) {
      console.log('Video recording error:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const selectVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          deliveryVideo: {
            uri: result.assets[0].uri,
            type: 'video/mp4',
            name: `delivery_video_${Date.now()}.mp4`
          }
        }));
      }
    } catch (error) {
      console.log('Video selection error:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      deliveryImages: prev.deliveryImages.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, deliveryVideo: null }));
  };

  const handleSubmit = async () => {
    if (!formData.satisfactionDeclaration.trim()) {
      Alert.alert('Required Field', 'Satisfaction declaration is required');
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('satisfactionDeclaration', formData.satisfactionDeclaration);
      submitData.append('deliveryComment', formData.deliveryComment);
      submitData.append('videoUrl', formData.videoUrl);

      // Add images
      formData.deliveryImages.forEach((image, index) => {
        submitData.append('deliveryImages', {
          uri: image.uri,
          type: image.type,
          name: image.name || `delivery_image_${index}.jpg`
        });
      });

      // Add video
      if (formData.deliveryVideo) {
        submitData.append('deliveryVideo', {
          uri: formData.deliveryVideo.uri,
          type: formData.deliveryVideo.type,
          name: formData.deliveryVideo.name || 'delivery_video.mp4'
        });
      }

      const response = await ApiService.confirmServiceDelivery(orderId, submitData);
      
      if (response.success) {
        Alert.alert(
          'Delivery Confirmed!', 
          'Service delivery has been confirmed successfully.',
          [
            {
              text: 'Done',
              onPress: () => navigation.navigate('ServiceProviderTaskDashboard')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to confirm delivery');
      }
    } catch (error) {
      console.error('Delivery confirmation error:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading delivery form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Delivery</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        {template && (
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{template.serviceName}</Text>
            <View style={styles.serviceDetails}>
              <Text style={styles.detailText}>Customer: {template.customerName}</Text>
              <Text style={styles.detailText}>Order ID: {template.orderId}</Text>
              <Text style={styles.detailText}>Service Date: {template.serviceDate}</Text>
            </View>
          </View>
        )}

        {/* Satisfaction Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Satisfaction Declaration *</Text>
          <Text style={styles.sectionSubtitle}>
            Confirm the quality and completion of the service delivery
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Service was delivered successfully and customer expressed satisfaction with the quality of work..."
            value={formData.satisfactionDeclaration}
            onChangeText={(text) => setFormData(prev => ({ ...prev, satisfactionDeclaration: text }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Delivery Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Comments</Text>
          <Text style={styles.sectionSubtitle}>
            Any additional notes about the delivery process (optional)
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Customer provided positive feedback. No issues encountered during delivery..."
            value={formData.deliveryComment}
            onChangeText={(text) => setFormData(prev => ({ ...prev, deliveryComment: text }))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Delivery Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Evidence Images</Text>
          <Text style={styles.sectionSubtitle}>
            Add photos showing the delivered service (Max 5 images)
          </Text>
          
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleImagePicker}
            disabled={formData.deliveryImages.length >= 5}
          >
            <Ionicons name="camera" size={20} color="#7B2CBF" />
            <Text style={styles.addButtonText}>
              Add Images ({formData.deliveryImages.length}/5)
            </Text>
          </TouchableOpacity>

          {formData.deliveryImages.length > 0 && (
            <View style={styles.mediaGrid}>
              {formData.deliveryImages.map((image, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delivery Video */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Evidence Video</Text>
          <Text style={styles.sectionSubtitle}>
            Add a video showing the delivered service (Max 2 minutes)
          </Text>
          
          {!formData.deliveryVideo ? (
            <TouchableOpacity style={styles.addButton} onPress={handleVideoPicker}>
              <Ionicons name="videocam" size={20} color="#7B2CBF" />
              <Text style={styles.addButtonText}>Add Video</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.videoItem}>
              <View style={styles.videoInfo}>
                <Ionicons name="videocam" size={20} color="#7B2CBF" />
                <Text style={styles.videoName}>{formData.deliveryVideo.name}</Text>
              </View>
              <TouchableOpacity onPress={removeVideo}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* External Video URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>External Video URL</Text>
          <Text style={styles.sectionSubtitle}>
            Link to external video (YouTube, Vimeo, etc.) - optional
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://youtube.com/watch?v=..."
            value={formData.videoUrl}
            onChangeText={(text) => setFormData(prev => ({ ...prev, videoUrl: text }))}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={submitting || !formData.satisfactionDeclaration.trim()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="white" />
              <Text style={styles.submitButtonText}>Confirm Delivery</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  serviceInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  serviceDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7B2CBF',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  mediaItem: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  videoName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DeliveryConfirmationFormScreen;