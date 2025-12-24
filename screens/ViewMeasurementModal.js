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
              {measurementData ? (
                <>
                  {/* Name Section */}
                  <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Name:</Text>
                    <Text style={styles.contentValue}>
                      {measurementData.firstName} {measurementData.lastName}
                    </Text>
                  </View>

                  {/* Method Section */}
                  <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Method:</Text>
                    <Text style={[styles.contentValue, styles.methodValue]}>
                      {measurementData.measurementType || 'Manual'}
                    </Text>
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
                      {measurementData.sections?.map((section, index) => (
                        <View key={index}>
                          {section.measurements?.map((measurement, mIndex) => (
                            <Text key={mIndex} style={styles.summaryItem}>
                              {section.sectionName}: {measurement.bodyPartName}, {measurement.size}{measurement.unit || 'cm'}
                            </Text>
                          ))}
                        </View>
                      )) || (
                        <Text style={styles.summaryItem}>No measurements available</Text>
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noDataText}>No measurement data available</Text>
                  <Text style={styles.noDataSubtext}>Please select a measurement to view details</Text>
                </View>
              )}

              {measurementData && (
                <View style={styles.imageSection}>
                  <View style={styles.imageSectionHeader}>
                    <Text style={styles.imageLabel}>Image Uploads:</Text>
                    <TouchableOpacity style={styles.downloadAllButton}>
                      <Ionicons name="download-outline" size={16} color="#7C3AED" />
                      <Text style={styles.downloadAllText}>Download All</Text>
                    </TouchableOpacity>
                  </View>

                  {measurementData.images?.length > 0 ? (
                    measurementData.images.map((image, index) => (
                      <View key={index} style={styles.imageItem}>
                        <View style={styles.imageThumbnail}>
                          <Ionicons name="person" size={24} color="#9CA3AF" />
                        </View>
                        <Text style={styles.imageFilename}>
                          {measurementData.firstName}_{index + 1}.jpg
                        </Text>
                        <TouchableOpacity style={styles.downloadIcon}>
                          <Ionicons name="download-outline" size={20} color="#7C3AED" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noImagesText}>No images uploaded</Text>
                  )}
                </View>
              )}
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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  noImagesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default ViewMeasurementModal;