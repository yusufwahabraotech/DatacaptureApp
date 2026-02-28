import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DeliveryImagesModal = ({ visible, onClose, deliveryConfirmation }) => {
  if (!deliveryConfirmation) return null;

  const images = [
    { title: 'Product Photo', url: deliveryConfirmation.productImageUrl },
    { title: 'Representative Photo', url: deliveryConfirmation.representativeImageUrl },
    { title: 'Customer Photo', url: deliveryConfirmation.userImageUrl },
  ].filter(img => img.url);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Photos</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageSection}>
              <Text style={styles.imageTitle}>{image.title}</Text>
              <Image source={{ uri: image.url }} style={styles.image} />
            </View>
          ))}

          {deliveryConfirmation.videoUrl && (
            <View style={styles.videoSection}>
              <Text style={styles.imageTitle}>Confirmation Video</Text>
              <TouchableOpacity style={styles.videoButton}>
                <Ionicons name="play-circle" size={48} color="#7C3AED" />
                <Text style={styles.videoText}>Tap to view video</Text>
              </TouchableOpacity>
            </View>
          )}

          {deliveryConfirmation.satisfactionDeclaration && (
            <View style={styles.declarationSection}>
              <Text style={styles.imageTitle}>Satisfaction Declaration</Text>
              <Text style={styles.declarationText}>
                {deliveryConfirmation.satisfactionDeclaration}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  videoSection: {
    marginBottom: 24,
  },
  videoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 32,
  },
  videoText: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 8,
  },
  declarationSection: {
    marginBottom: 24,
  },
  declarationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
});

export default DeliveryImagesModal;