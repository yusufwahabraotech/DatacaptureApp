import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BottomNavigation = ({ navigation, activeTab }) => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await fetch('https://datacapture-backend.onrender.com/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setUserRole(data.data.user.role);
        }
      }
    } catch (error) {
      console.log('Error getting user role:', error);
    }
  };

  // Admin/Organization navigation
  if (userRole === 'ORGANIZATION' || userRole === 'ADMIN') {
    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Ionicons name="home" size={24} color={activeTab === 'Dashboard' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Dashboard' && styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Ionicons name="people" size={24} color={activeTab === 'Users' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Users' && styles.activeNavText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminMeasurements')}
        >
          <Ionicons name="body" size={24} color={activeTab === 'Measurements' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Measurements' && styles.activeNavText]}>Measurements</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('OneTimeCodes')}
        >
          <Ionicons name="key" size={24} color={activeTab === 'Codes' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Codes' && styles.activeNavText]}>Codes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Super Admin navigation
  if (userRole === 'SUPER_ADMIN') {
    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('SuperAdminDashboard')}
        >
          <Ionicons name="home" size={24} color={activeTab === 'Dashboard' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Dashboard' && styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('OrganizationManagement')}
        >
          <Ionicons name="business" size={24} color={activeTab === 'Organizations' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Organizations' && styles.activeNavText]}>Organizations</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('CustomerManagement')}
        >
          <Ionicons name="people" size={24} color={activeTab === 'Customers' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Customers' && styles.activeNavText]}>Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('SubscriptionManagement')}
        >
          <Ionicons name="card" size={24} color={activeTab === 'Subscriptions' ? '#7C3AED' : '#9CA3AF'} />
          <Text style={[styles.navText, activeTab === 'Subscriptions' && styles.activeNavText]}>Subscriptions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Regular user navigation
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