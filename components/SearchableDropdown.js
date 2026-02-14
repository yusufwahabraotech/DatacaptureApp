import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchableDropdown = ({
  visible,
  onClose,
  data,
  onSelect,
  title,
  searchPlaceholder = "Search...",
  showOthersOption = false,
  onOthersSelect,
}) => {
  const [searchText, setSearchText] = useState('');
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [othersText, setOthersText] = useState('');

  const filteredData = (data || []).filter(item => 
    (item.label || item.name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const handleOthersPress = () => {
    setShowOthersInput(true);
  };

  const handleOthersSubmit = () => {
    if (othersText.trim()) {
      onOthersSelect && onOthersSelect(othersText.trim());
      setShowOthersInput(false);
      setOthersText('');
      onClose();
    }
  };

  const handleClose = () => {
    setSearchText('');
    setShowOthersInput(false);
    setOthersText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {showOthersInput ? (
            <View style={styles.othersInputContainer}>
              <TextInput
                style={styles.othersInput}
                value={othersText}
                onChangeText={setOthersText}
                placeholder="Enter custom value..."
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              <View style={styles.othersButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowOthersInput(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleOthersSubmit}
                >
                  <Text style={styles.submitButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onSelect(item);
                    handleClose();
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label || item.name}</Text>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                showOthersOption ? (
                  <TouchableOpacity
                    style={[styles.modalItem, styles.othersItem]}
                    onPress={handleOthersPress}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#7C3AED" />
                    <Text style={styles.othersText}>Others (Add Custom)</Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  othersItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  othersText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 8,
  },
  othersInputContainer: {
    padding: 20,
  },
  othersInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  othersButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default SearchableDropdown;