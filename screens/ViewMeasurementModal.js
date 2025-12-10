import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ViewMeasurementModal = ({ visible, onClose, measurementData }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>View Measurement</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Name Section */}
              <View style={styles.contentRow}>
                <Text style={styles.contentLabel}>Name:</Text>
                <Text style={styles.contentValue}>Emmanuel</Text>
              </View>

              {/* Method Section */}
              <View style={styles.contentRow}>
                <Text style={styles.contentLabel}>Method:</Text>
                <Text style={[styles.contentValue, styles.methodValue]}>Manual</Text>
              </View>

              {/* Measurement Type Section */}
              <View style={styles.contentRow}>
                <Text style={styles.contentLabel}>Measurement Type:</Text>
                <Text style={[styles.contentValue, styles.typeValue]}>Body</Text>
              </View>

              {/* Measurement Summary Section */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Measurement Summary:</Text>
                <View style={styles.summaryList}>
                  <Text style={styles.summaryItem}>Head Section: Round size, 30cm Depth size</Text>
                  <Text style={styles.summaryItem}>Head Section: Round size, 30cm Depth size</Text>
                  <Text style={styles.summaryItem}>Head Section: Round size, 30cm Depth size</Text>
                </View>
              </View>

              {/* Image Uploads Section */}
              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <Text style={styles.imageLabel}>Image Uploads:</Text>
                  <TouchableOpacity style={styles.downloadAllButton}>
                    <Ionicons name="download-outline" size={16} color="#7C3AED" />
                    <Text style={styles.downloadAllText}>Download All</Text>
                  </TouchableOpacity>
                </View>

                {/* Image Items */}
                <View style={styles.imageItem}>
                  <View style={styles.imageThumbnail}>
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  </View>
                  <Text style={styles.imageFilename}>Emmanuel.jpg</Text>
                  <TouchableOpacity style={styles.downloadIcon}>
                    <Ionicons name="download-outline" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                </View>

                <View style={styles.imageItem}>
                  <View style={styles.imageThumbnail}>
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  </View>
                  <Text style={styles.imageFilename}>Emmanuel.jpg</Text>
                  <TouchableOpacity style={styles.downloadIcon}>
                    <Ionicons name="download-outline" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxWidth: '90%',
    width: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  contentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  methodValue: {
    color: '#F59E0B',
  },
  typeValue: {
    color: '#7C3AED',
  },
  summarySection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  summaryList: {
    gap: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
  },
  imageSection: {
    paddingTop: 16,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadAllText: {
    fontSize: 14,
    color: '#7C3AED',
    marginLeft: 4,
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageFilename: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  downloadIcon: {
    padding: 4,
  },
});

export default ViewMeasurementModal;