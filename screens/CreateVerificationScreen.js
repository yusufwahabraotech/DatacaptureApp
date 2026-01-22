import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const CreateVerificationScreen = ({ navigation }) => {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    lga: '',
    city: '',
    cityRegion: '',
    organizationId: '',
    organizationName: '',
    targetUserId: '',
    targetUserFirstName: '',
    targetUserLastName: '',
  });

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await ApiService.getVerificationOrganizations();
      if (response.success) {
        setOrganizations(response.data.organizations);
      }
    } catch (error) {
      console.log('Error fetching organizations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await ApiService.getVerificationUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    }
  };

  const createVerification = async () => {
    if (!formData.organizationId || !formData.targetUserId) {
      Alert.alert('Error', 'Please select organization and target user');
      return;
    }

    try {
      const verificationData = {
        ...formData,
        organizationDetails: {
          name: formData.organizationName,
          attachments: [],
          headquartersAddress: '',
          addressAttachments: []
        },
        buildingPictures: {
          frontView: '',
          streetPicture: '',
          agentInFrontBuilding: '',
          whatsappLocation: '',
          insideOrganization: '',
          withStaffOrOwner: '',
          videoWithNeighbor: ''
        },
        transportationCost: {
          going: [],
          finalDestination: '',
          finalFareSpent: 0,
          finalTime: '',
          totalJourneyTime: '',
          comingBack: {
            totalTransportationCost: 0,
            otherExpensesCost: 0,
            receiptUrl: ''
          }
        }
      };

      const response = await ApiService.createVerification(verificationData);
      if (response.success) {
        Alert.alert('Success', 'Verification created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create verification');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={formData.country}
            onChangeText={(text) => setFormData({...formData, country: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="State"
            value={formData.state}
            onChangeText={(text) => setFormData({...formData, state: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="LGA"
            value={formData.lga}
            onChangeText={(text) => setFormData({...formData, lga: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="City"
            value={formData.city}
            onChangeText={(text) => setFormData({...formData, city: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="City Region"
            value={formData.cityRegion}
            onChangeText={(text) => setFormData({...formData, cityRegion: text})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {organizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                style={[
                  styles.selectionCard,
                  formData.organizationId === org.id && styles.selectedCard
                ]}
                onPress={() => setFormData({
                  ...formData,
                  organizationId: org.id,
                  organizationName: org.name
                })}
              >
                <Text style={styles.cardText}>{org.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target User</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.selectionCard,
                  formData.targetUserId === user.id && styles.selectedCard
                ]}
                onPress={() => setFormData({
                  ...formData,
                  targetUserId: user.id,
                  targetUserFirstName: user.firstName,
                  targetUserLastName: user.lastName
                })}
              >
                <Text style={styles.cardText}>{user.fullName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createButton} onPress={createVerification}>
          <Text style={styles.createButtonText}>Create Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  selectionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
  },
  selectedCard: {
    backgroundColor: '#7C3AED',
  },
  cardText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateVerificationScreen;