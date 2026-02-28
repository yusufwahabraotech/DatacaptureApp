import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const DeliveryConfirmationScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  
  // Form state
  const [deliveryMode, setDeliveryMode] = useState('pickup_center');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupCenterName, setPickupCenterName] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [representativeImage, setRepresentativeImage] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [imageComment, setImageComment] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [satisfactionDeclaration, setSatisfactionDeclaration] = useState('');

  useEffect(() => {
    // Check if order is fully paid
    if (order.orderStatus !== 'fully_paid') {
      Alert.alert('Order Not Ready', 'This order must be fully paid before delivery confirmation.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, []);

  const getTemplate = async () => {
    setTemplateLoading(true);
    try {
      const response = await ApiService.getDeliveryTemplate(order._id);
      if (response.success) {
        setSatisfactionDeclaration(response.data.template);
      } else {
        Alert.alert('Error', response.message || 'Failed to get template');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const pickImage = async (imageType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are required to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageData = { uri: result.assets[0].uri };
      
      switch (imageType) {
        case 'product':
          setProductImage(imageData);
          break;
        case 'representative':
          setRepresentativeImage(imageData);
          break;
        case 'user':
          setUserImage(imageData);
          break;
      }
    }
  };

  const takePhoto = async (imageType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permissions are required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageData = { uri: result.assets[0].uri };
      
      switch (imageType) {
        case 'product':
          setProductImage(imageData);
          break;
        case 'representative':
          setRepresentativeImage(imageData);
          break;
        case 'user':
          setUserImage(imageData);
          break;
      }
    }
  };

  const showImagePicker = (imageType) => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add the image',
      [
        { text: 'Camera', onPress: () => takePhoto(imageType) },
        { text: 'Gallery', onPress: () => pickImage(imageType) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateForm = () => {
    if (!satisfactionDeclaration.trim()) {
      Alert.alert('Required Field', 'Satisfaction declaration is required');
      return false;
    }

    if (deliveryMode === 'shipping' && !deliveryAddress.trim()) {
      Alert.alert('Required Field', 'Delivery address is required for shipping mode');
      return false;
    }

    if (deliveryMode === 'pickup_center' && !pickupCenterName.trim()) {
      Alert.alert('Required Field', 'Pickup center name is required for pickup mode');
      return false;
    }

    return true;
  };

  const submitConfirmation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const confirmationData = {
        deliveryMode,
        ...(deliveryMode === 'shipping' && { deliveryAddress }),
        ...(deliveryMode === 'pickup_center' && { pickupCenterName }),
        ...(productImage && { productImage }),
        ...(representativeImage && { representativeImage }),
        ...(userImage && { userImage }),
        ...(imageComment && { imageComment }),
        ...(videoUrl && { videoUrl }),
        satisfactionDeclaration,
      };

      const response = await ApiService.confirmDelivery(order._id, confirmationData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Delivery confirmed successfully! Payment will be released to the organization.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to confirm delivery');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit confirmation');
    } finally {
      setLoading(false);
    }
  };

  const renderImageUpload = (title, image, imageType) => (
    <View style={styles.imageUploadSection}>
      <Text style={styles.imageUploadTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.imageUploadBox}
        onPress={() => showImagePicker(imageType)}
      >
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
        ) : (
          <View style={styles.imageUploadPlaceholder}>
            <Ionicons name="camera" size={40} color="#9CA3AF" />
            <Text style={styles.imageUploadText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Delivery</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderCard}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.organizationName}>{order.organizationName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Paid:</Text>
              <Text style={styles.priceValue}>₦{order.totalAmountPaid?.toLocaleString()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.orderStatus}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Mode</Text>
          {['pickup_center', 'shipping', 'organization_location'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.radioOption, deliveryMode === mode && styles.radioOptionSelected]}
              onPress={() => setDeliveryMode(mode)}
            >
              <View style={[styles.radioCircle, deliveryMode === mode && styles.radioCircleSelected]}>
                {deliveryMode === mode && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>
                {mode === 'pickup_center' ? 'Pickup Center' : 
                 mode === 'shipping' ? 'Shipping to Address' : 'Organization Location'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conditional Fields */}
        {deliveryMode === 'shipping' && (
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Delivery Address *</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter delivery address"
              multiline
            />
          </View>
        )}

        {deliveryMode === 'pickup_center' && (
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Pickup Center Name *</Text>
            <TextInput
              style={styles.textInput}
              value={pickupCenterName}
              onChangeText={setPickupCenterName}
              placeholder="Enter pickup center name"
            />
          </View>
        )}

        {/* Image Uploads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Photos</Text>
          {renderImageUpload('Product Photo', productImage, 'product')}
          {renderImageUpload('Representative/Staff Photo', representativeImage, 'representative')}
          {renderImageUpload('Your Photo', userImage, 'user')}
          
          <Text style={styles.inputLabel}>Image Comment</Text>
          <TextInput
            style={styles.textInput}
            value={imageComment}
            onChangeText={setImageComment}
            placeholder="Add a comment about the photos"
            multiline
          />
        </View>

        {/* Video URL */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Video URL (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="Enter video URL if available"
          />
        </View>

        {/* Satisfaction Declaration */}
        <View style={styles.section}>
          <View style={styles.declarationHeader}>
            <Text style={styles.sectionTitle}>Satisfaction Declaration *</Text>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={getTemplate}
              disabled={templateLoading}
            >
              {templateLoading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Text style={styles.templateButtonText}>Get Template</Text>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.declarationInput}
            value={satisfactionDeclaration}
            onChangeText={setSatisfactionDeclaration}
            placeholder="Edit the template with your actual information"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {satisfactionDeclaration.length} characters
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitConfirmation}
          disabled={loading || !satisfactionDeclaration.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Delivery</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioOptionSelected: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  radioText: {
    fontSize: 16,
    color: '#1F2937',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 44,
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  imageUploadTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadPlaceholder: {
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  declarationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  templateButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  templateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  declarationInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 8,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryConfirmationScreen;