import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BottomNavigation from '../components/BottomNavigation';

const ObjectMeasurementScreen = ({ navigation }) => {
  const [measurements, setMeasurements] = useState([
    { name: 'Package A', dimensions: '30x20x15 cm', weight: '2.5 kg', date: '2024-01-15' },
    { name: 'Furniture Item', dimensions: '120x80x45 cm', weight: '25 kg', date: '2024-01-14' },
    { name: 'Electronics Box', dimensions: '45x35x20 cm', weight: '3.2 kg', date: '2024-01-13' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeasurements = measurements.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Object Measurements</Text>
        <View style={styles.headerRight}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.profileImage}>
            <Text style={styles.profileText}>U</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search objects..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Objects</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {/* Create New Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('TakeNewMeasurement')}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Measure New Object</Text>
        </TouchableOpacity>

        {/* Recent Measurements */}
        <View style={styles.measurementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Measurements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredMeasurements.map((item, index) => (
            <View key={index} style={styles.measurementCard}>
              <View style={styles.cardLeft}>
                <View style={styles.objectIcon}>
                  <Ionicons name="cube-outline" size={24} color="#7C3AED" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.objectName}>{item.name}</Text>
                  <Text style={styles.objectDimensions}>{item.dimensions}</Text>
                  <Text style={styles.objectWeight}>Weight: {item.weight}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.measurementDate}>{item.date}</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {filteredMeasurements.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No objects found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or create a new measurement</Text>
          </View>
        )}
      </ScrollView>

      <BottomNavigation navigation={navigation} activeTab="ObjectMeasurement" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    bottom: -50,
    left: -50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  measurementsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  measurementCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  objectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  objectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  objectDimensions: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  objectWeight: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  measurementDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  activeNavText: {
    color: '#7C3AED',
  },
});

export default ObjectMeasurementScreen;