import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const LocationManagementScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLocations();
  }, [currentPage]);

  const fetchLocations = async () => {
    try {
      const response = await ApiService.getAllLocations({
        page: currentPage,
        limit: 10,
      });

      if (response.success) {
        setLocations(response.data?.locations || []);
        setTotalPages(response.data?.totalPages || 1);
        setTotal(response.data?.total || 0);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchLocations();
  };

  const handleDelete = (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location hierarchy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLocation(locationId),
        },
      ]
    );
  };

  const deleteLocation = async (locationId) => {
    try {
      const response = await ApiService.deleteLocation(locationId);
      if (response.success) {
        Alert.alert('Success', 'Location deleted successfully');
        fetchLocations();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete location');
    }
  };

  const formatAmount = (amount) => `₦${(Number(amount) || 0).toLocaleString()}`;

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.countryCell]}>Country</Text>
      <Text style={[styles.headerCell, styles.stateCell]}>State</Text>
      <Text style={[styles.headerCell, styles.lgaCell]}>LGA</Text>
      <Text style={[styles.headerCell, styles.cityCell]}>City</Text>
      <Text style={[styles.headerCell, styles.regionCell]}>City Regions</Text>
      <Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
    </View>
  );

  const renderLocationRow = ({ item }) => {
    const cityRegions = item.cityRegions || [];
    
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.countryCell]}>{item.country}</Text>
        <Text style={[styles.cell, styles.stateCell]}>{item.state}</Text>
        <Text style={[styles.cell, styles.lgaCell]}>{item.lga}</Text>
        <Text style={[styles.cell, styles.cityCell]}>{item.city}</Text>
        <View style={[styles.cell, styles.regionCell]}>
          {cityRegions.length > 0 ? (
            cityRegions.map((region, index) => (
              <View key={index} style={styles.regionItem}>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.regionPrice}>{formatAmount(region.fee)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noRegions}>No regions</Text>
          )}
        </View>
        <View style={[styles.cell, styles.actionCell]}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateLocation', { location: item })}
          >
            <Ionicons name="pencil" size={14} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#9CA3AF' : '#7C3AED'} />
      </TouchableOpacity>

      <Text style={styles.pageInfo}>
        Page {currentPage} of {totalPages} ({total} total)
      </Text>

      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#9CA3AF' : '#7C3AED'} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateLocation')}
        >
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={locations}
            renderItem={renderLocationRow}
            keyExtractor={(item) => item._id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No locations found</Text>
                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={() => navigation.navigate('CreateLocation')}
                >
                  <Text style={styles.createFirstButtonText}>Create First Location</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </ScrollView>
      
      {locations.length > 0 && renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 16,
  },
  addButton: {
    padding: 8,
  },
  tableContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 900,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  cell: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  countryCell: {
    width: 100,
  },
  stateCell: {
    width: 120,
  },
  lgaCell: {
    width: 120,
  },
  cityCell: {
    width: 100,
  },
  regionCell: {
    width: 200,
  },
  actionCell: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  regionName: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  regionPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  noRegions: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F5F3FF',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    width: 900,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationManagementScreen;