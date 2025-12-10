import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavigation = ({ navigation, activeTab }) => {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Ionicons name="home" size={24} color={activeTab === 'Dashboard' ? '#7C3AED' : '#9CA3AF'} />
        <Text style={[styles.navText, activeTab === 'Dashboard' && styles.activeNavText]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('BodyMeasurement')}
      >
        <Ionicons name="body" size={24} color={activeTab === 'BodyMeasurement' ? '#7C3AED' : '#9CA3AF'} />
        <Text style={[styles.navText, activeTab === 'BodyMeasurement' && styles.activeNavText]}>Body</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('ObjectMeasurement')}
      >
        <Ionicons name="cube-outline" size={24} color={activeTab === 'ObjectMeasurement' ? '#7C3AED' : '#9CA3AF'} />
        <Text style={[styles.navText, activeTab === 'ObjectMeasurement' && styles.activeNavText]}>Object</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Questionnaire')}
      >
        <Ionicons name="document-text-outline" size={24} color={activeTab === 'Questionnaire' ? '#7C3AED' : '#9CA3AF'} />
        <Text style={[styles.navText, activeTab === 'Questionnaire' && styles.activeNavText]}>Questionnaire</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default BottomNavigation;