import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const PublicOrganizationProfilesScreen = ({ navigation }) => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [searchQuery, profiles]);

  const loadProfiles = async () => {
    try {
      const response = await ApiService.getAllPublicProfiles();
      if (response.success) {
        setProfiles(response.data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfiles();
  };

  const filterProfiles = () => {
    if (!searchQuery.trim()) {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.businessType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.locations?.some(location => 
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredProfiles(filtered);
    }
  };

  const getVerificationIcon = (status) => {
    if (status === 'verified') {
      return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <Text style={styles.headerTitle}>Organization Directory</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.resultsCount}>
          {filteredProfiles.length} organization{filteredProfiles.length !== 1 ? 's' : ''} found
        </Text>

        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <View key={profile._id} style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.businessType}>{profile.businessType}</Text>
                    {getVerificationIcon(profile.verificationStatus)}
                  </View>
                  <Text style={styles.joinDate}>
                    Member since {formatDate(profile.createdAt)}
                  </Text>
                </View>
              </View>

              {profile.locations && profile.locations.length > 0 && (
                <View style={styles.locationsSection}>
                  <Text style={styles.sectionTitle}>
                    Locations ({profile.locations.length})
                  </Text>
                  {profile.locations.slice(0, 3).map((location, index) => (
                    <View key={index} style={styles.locationItem}>
                      <Ionicons name="location" size={16} color="#7C3AED" />
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <Text style={styles.locationAddress}>{location.address}</Text>
                        {location.description && (
                          <Text style={styles.locationDescription}>{location.description}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                  {profile.locations.length > 3 && (
                    <Text style={styles.moreLocations}>
                      +{profile.locations.length - 3} more locations
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Ionicons name="location" size={16} color="#7C3AED" />
                  <Text style={styles.statText}>
                    {profile.locations?.length || 0} locations
                  </Text>
                </View>
                {profile.verificationStatus === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={80} color="#7C3AED" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Results Found' : 'No Organizations'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `No organizations match "${searchQuery}"`
                : 'No public organization profiles available'
              }
            </Text>
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  profileCard: {
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
  profileHeader: {
    marginBottom: 15,
  },
  profileInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  businessType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  joinDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationDetails: {
    marginLeft: 8,
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  moreLocations: {
    fontSize: 14,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 5,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
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

export default PublicOrganizationProfilesScreen;