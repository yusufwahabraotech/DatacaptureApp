import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerifyOTPScreen from './screens/VerifyOTPScreen';
import ProfileScreen from './screens/ProfileScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import DashboardScreen from './screens/DashboardScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SuperAdminDashboardScreen from './screens/SuperAdminDashboardScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import UserDetailsScreen from './screens/UserDetailsScreen';
import UserPermissionsScreen from './screens/UserPermissionsScreen';
import OneTimeCodesScreen from './screens/OneTimeCodesScreen';
import BodyMeasurementScreen from './screens/BodyMeasurementScreen';
import ObjectMeasurementScreen from './screens/ObjectMeasurementScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import AdminMeasurementsScreen from './screens/AdminMeasurementsScreen';
import OrganizationManagementScreen from './screens/OrganizationManagementScreen';
import CustomerManagementScreen from './screens/CustomerManagementScreen';
import SubscriptionManagementScreen from './screens/SubscriptionManagementScreen';
import TakeNewMeasurementScreen from './screens/TakeNewMeasurementScreen';
import ExtendedFormScreen from './screens/ExtendedFormScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
        <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
        <Stack.Screen name="UserPermissions" component={UserPermissionsScreen} />
        <Stack.Screen name="OneTimeCodes" component={OneTimeCodesScreen} />
        <Stack.Screen name="AdminMeasurements" component={AdminMeasurementsScreen} />
        <Stack.Screen name="OrganizationManagement" component={OrganizationManagementScreen} />
        <Stack.Screen name="CustomerManagement" component={CustomerManagementScreen} />
        <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} />
        <Stack.Screen name="BodyMeasurement" component={BodyMeasurementScreen} />
        <Stack.Screen name="ObjectMeasurement" component={ObjectMeasurementScreen} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <Stack.Screen name="TakeNewMeasurement" component={TakeNewMeasurementScreen} />
        <Stack.Screen name="ExtendedForm" component={ExtendedFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
