import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/PurpleLogo.png')} style={styles.logoImage} />
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select how you want to use the app</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => navigation.navigate('Login', { userRole: 'user' })}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="person" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.roleTitle}>User</Text>
            <Text style={styles.roleDescription}>
              Take measurements, create questionnaires, and track your data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => navigation.navigate('Login', { userRole: 'admin' })}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.roleTitle}>Admin</Text>
            <Text style={styles.roleDescription}>
              Manage users, view all measurements, and oversee system operations
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: height,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: height < 700 ? 20 : 40,
  },
  logoImage: {
    width: height < 700 ? 60 : 80,
    height: height < 700 ? 60 : 80,
    resizeMode: 'contain',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: height < 700 ? 30 : 60,
  },
  title: {
    fontSize: height < 700 ? 24 : 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: height < 700 ? 14 : 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: height < 700 ? 16 : 24,
    marginTop: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: height < 700 ? 24 : 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: height < 700 ? 180 : 220,
  },
  roleIcon: {
    width: height < 700 ? 60 : 80,
    height: height < 700 ? 60 : 80,
    borderRadius: height < 700 ? 30 : 40,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height < 700 ? 16 : 20,
  },
  roleTitle: {
    fontSize: height < 700 ? 20 : 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: height < 700 ? 8 : 12,
  },
  roleDescription: {
    fontSize: height < 700 ? 14 : 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: height < 700 ? 20 : 24,
    paddingHorizontal: 8,
  },
});

export default RoleSelectionScreen;