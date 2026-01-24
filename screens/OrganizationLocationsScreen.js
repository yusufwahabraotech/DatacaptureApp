import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const OrganizationLocationsScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    
    // Reload profile when returning from AddLocationScreen
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      const response = await ApiService.getOrganizationProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };



  const deleteLocation = (index) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteOrganizationLocation(index);
              if (response.success) {
                loadProfile();
                Alert.alert('Success', 'Location deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete location');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          },
        },
      ]
    );
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization Locations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddLocation')}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {profile?.locations?.length > 0 ? (
          profile.locations.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  {location.description && (
                    <Text style={styles.locationDescription}>{location.description}</Text>
                  )}
                </View>
                <View style={styles.locationActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AddLocation', { 
                      editingLocation: location, 
                      locationIndex: index 
                    })}
                  >
                    <Ionicons name="pencil" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteLocation(index)}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={80} color="#7C3AED" />
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>Add your organization locations to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfo: {
    flex: 1,
    marginRight: 15,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  locationDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  locationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },

});

export default OrganizationLocationsScreen;