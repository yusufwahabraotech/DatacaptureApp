import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchableDropdown = ({ 
  placeholder, 
  value, 
  options, 
  onSelect, 
  disabled,
  searchPlaceholder = "Search...",
  keyExtractor = (item, index) => index.toString(),
  labelExtractor = (item) => item.label || item.name || item,
  valueExtractor = (item) => item.value || item.name || item
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    return options.filter(item => {
      const label = labelExtractor(item);
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchQuery, labelExtractor]);

  const handleSelect = (item) => {
    onSelect(valueExtractor(item));
    setShowOptions(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setShowOptions(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={[styles.dropdownButton, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setShowOptions(true)}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          onPress={handleClose}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredOptions}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.dropdownOptionText}>
                    {labelExtractor(item)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
              maxHeight={250}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  dropdownDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '80%',
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 5,
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default SearchableDropdown;