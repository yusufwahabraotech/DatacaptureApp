import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './services/NavigationService';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SetNewPasswordScreen from './screens/SetNewPasswordScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerifyOTPScreen from './screens/VerifyOTPScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import HelpScreen from './screens/HelpScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import DashboardScreen from './screens/DashboardScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SuperAdminDashboardScreen from './screens/SuperAdminDashboardScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import UserDetailsScreen from './screens/UserDetailsScreen';
import UserPermissionsScreen from './screens/UserPermissionsScreen';
import PermissionsManagementScreen from './screens/PermissionsManagementScreen';
import OneTimeCodesScreen from './screens/OneTimeCodesScreen';
import BodyMeasurementScreen from './screens/BodyMeasurementScreen';
import ObjectMeasurementScreen from './screens/ObjectMeasurementScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import AdminMeasurementsScreen from './screens/AdminMeasurementsScreen';
import OrganizationManagementScreen from './screens/OrganizationManagementScreen';
import CustomerManagementScreen from './screens/CustomerManagementScreen';
import SubscriptionManagementScreen from './screens/SubscriptionManagementScreen';
import SystemUsersScreen from './screens/SystemUsersScreen';
import SystemAnalyticsScreen from './screens/SystemAnalyticsScreen';
import SystemSettingsScreen from './screens/SystemSettingsScreen';
import SubscriptionDetailsScreen from './screens/SubscriptionDetailsScreen';
import OrganizationSubscriptionScreen from './screens/OrganizationSubscriptionScreen';
import BillingHistoryScreen from './screens/BillingHistoryScreen';
import TakeNewMeasurementScreen from './screens/TakeNewMeasurementScreen';
import ExtendedFormScreen from './screens/ExtendedFormScreen';
import MeasurementDetailsScreen from './screens/MeasurementDetailsScreen';
import UserSettingsScreen from './screens/UserSettingsScreen';
import UserMeasurementsScreen from './screens/UserMeasurementsScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import UserOneTimeCodesScreen from './screens/UserOneTimeCodesScreen';
import CreateUserScreen from './screens/CreateUserScreen';
import UsersListScreen from './screens/UsersListScreen';
import RolesScreen from './screens/RolesScreen';
import CreateRoleScreen from './screens/CreateRoleScreen';
import GroupsScreen from './screens/GroupsScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import AdminCreateMeasurementScreen from './screens/AdminCreateMeasurementScreen';
import AdminEditMeasurementScreen from './screens/AdminEditMeasurementScreen';
import ServiceManagementScreen from './screens/ServiceManagementScreen';
import SubscriptionPackageScreen from './screens/SubscriptionPackageScreen';
import ServiceDetailsScreen from './screens/ServiceDetailsScreen';
import PackageDetailsScreen from './screens/PackageDetailsScreen';
import ExportUsersScreen from './screens/ExportUsersScreen';
import SubscriptionSelectionScreen from './screens/SubscriptionSelectionScreen';
import PaymentVerificationScreen from './screens/PaymentVerificationScreen';
import PaidSubscriptionsScreen from './screens/PaidSubscriptionsScreen';
import LocationManagementScreen from './screens/LocationManagementScreen';
import CreateLocationScreen from './screens/CreateLocationScreen';
import SuperAdminOrganizationAdminsScreen from './screens/SuperAdminOrganizationAdminsScreen';
import DataVerificationManagementScreen from './screens/DataVerificationManagementScreen';
import DataVerificationUsersScreen from './screens/DataVerificationUsersScreen';
import FieldAgentVerificationScreen from './screens/FieldAgentVerificationScreen';
import CreateDataVerificationRoleScreen from './screens/CreateDataVerificationRoleScreen';
import CreateVerificationScreen from './screens/CreateVerificationScreen';
import VerificationDetailsScreen from './screens/VerificationDetailsScreen';
import SuperAdminVerificationDetailsScreen from './screens/SuperAdminVerificationDetailsScreen';
import OrganizationProfileScreen from './screens/OrganizationProfileScreen';
import OrganizationProfileSetupScreen from './screens/OrganizationProfileSetupScreen';
import OrganizationLocationsScreen from './screens/OrganizationLocationsScreen';
import AddLocationScreen from './screens/AddLocationScreen';
import VerifiedBadgePaymentScreen from './screens/VerifiedBadgePaymentScreen';
import VerificationManagementScreen from './screens/VerificationManagementScreen';
import PublicOrganizationProfilesScreen from './screens/PublicOrganizationProfilesScreen';
import CombinedPaymentScreen from './screens/CombinedPaymentScreen';
import DefaultPricingManagementScreen from './screens/DefaultPricingManagementScreen';
import GalleryManagementScreen from './screens/GalleryManagementScreen';
import CreateGalleryItemScreen from './screens/CreateGalleryItemScreen';
import EditGalleryItemScreen from './screens/EditGalleryItemScreen';
import IndustryManagementScreen from './screens/IndustryManagementScreen';
import CategoryManagementScreen from './screens/CategoryManagementScreen';
import PickupCenterManagementScreen from './screens/PickupCenterManagementScreen';
import PlatformCommissionManagementScreen from './screens/PlatformCommissionManagementScreen';
import PublicProductSearchScreen from './screens/PublicProductSearchScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import SubscriptionWizardStep2Screen from './screens/SubscriptionWizardStep2Screen';
import SubscriptionWizardStep3Screen from './screens/SubscriptionWizardStep3Screen';
import SubscriptionWizardStep4Screen from './screens/SubscriptionWizardStep4Screen';
import SubscriptionWizardStep5Screen from './screens/SubscriptionWizardStep5Screen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
        <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
        <Stack.Screen name="UserPermissions" component={UserPermissionsScreen} />
        <Stack.Screen name="PermissionsManagement" component={PermissionsManagementScreen} />
        <Stack.Screen name="OneTimeCodes" component={OneTimeCodesScreen} />
        <Stack.Screen name="AdminMeasurements" component={AdminMeasurementsScreen} />
        
        {/* Super Admin Only Screens */}
        <Stack.Screen name="OrganizationManagement" component={OrganizationManagementScreen} />
        <Stack.Screen name="CustomerManagement" component={CustomerManagementScreen} />
        <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} />
        <Stack.Screen name="ServiceManagement" component={ServiceManagementScreen} />
        <Stack.Screen name="SubscriptionPackage" component={SubscriptionPackageScreen} />
        <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
        <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
        <Stack.Screen name="SystemUsers" component={SystemUsersScreen} />
        <Stack.Screen name="SystemAnalytics" component={SystemAnalyticsScreen} />
        <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
        <Stack.Screen name="SubscriptionDetails" component={SubscriptionDetailsScreen} />
        
        {/* Organization Subscription Screens */}
        <Stack.Screen name="OrganizationSubscription" component={OrganizationSubscriptionScreen} />
        <Stack.Screen name="BillingHistory" component={BillingHistoryScreen} />
        <Stack.Screen name="BodyMeasurement" component={BodyMeasurementScreen} />
        <Stack.Screen name="ObjectMeasurement" component={ObjectMeasurementScreen} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <Stack.Screen name="TakeNewMeasurement" component={TakeNewMeasurementScreen} />
        <Stack.Screen name="ExtendedForm" component={ExtendedFormScreen} />
        <Stack.Screen name="MeasurementDetails" component={MeasurementDetailsScreen} />
        <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
        <Stack.Screen name="UserMeasurements" component={UserMeasurementsScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
        <Stack.Screen name="UserOneTimeCodes" component={UserOneTimeCodesScreen} />
        <Stack.Screen name="UsersList" component={UsersListScreen} />
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
        <Stack.Screen name="Roles" component={RolesScreen} />
        <Stack.Screen name="CreateRole" component={CreateRoleScreen} />
        <Stack.Screen name="Groups" component={GroupsScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="AdminCreateMeasurement" component={AdminCreateMeasurementScreen} />
        <Stack.Screen name="AdminEditMeasurement" component={AdminEditMeasurementScreen} />
        <Stack.Screen name="ExportUsers" component={ExportUsersScreen} />
        <Stack.Screen name="SubscriptionSelection" component={SubscriptionSelectionScreen} />
        <Stack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
        <Stack.Screen name="PaidSubscriptions" component={PaidSubscriptionsScreen} />
        <Stack.Screen name="LocationManagement" component={LocationManagementScreen} />
        <Stack.Screen name="CreateLocation" component={CreateLocationScreen} />
        <Stack.Screen name="SuperAdminOrganizationAdmins" component={SuperAdminOrganizationAdminsScreen} />
        <Stack.Screen name="DataVerificationManagement" component={DataVerificationManagementScreen} />
        <Stack.Screen name="DataVerificationUsers" component={DataVerificationUsersScreen} />
        <Stack.Screen name="FieldAgentVerification" component={FieldAgentVerificationScreen} />
        <Stack.Screen name="CreateDataVerificationRole" component={CreateDataVerificationRoleScreen} />
        <Stack.Screen name="CreateVerification" component={CreateVerificationScreen} />
        <Stack.Screen name="VerificationDetails" component={VerificationDetailsScreen} />
        <Stack.Screen name="SuperAdminVerificationDetails" component={SuperAdminVerificationDetailsScreen} />
        
        {/* Organization Profile & Verified Badge Screens */}
        <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
        <Stack.Screen name="OrganizationProfileSetup" component={OrganizationProfileSetupScreen} />
        <Stack.Screen name="OrganizationLocations" component={OrganizationLocationsScreen} />
        <Stack.Screen name="AddLocation" component={AddLocationScreen} />
        <Stack.Screen name="VerifiedBadgePayment" component={VerifiedBadgePaymentScreen} />
        <Stack.Screen name="CombinedPayment" component={CombinedPaymentScreen} />
        <Stack.Screen name="VerificationManagement" component={VerificationManagementScreen} />
        <Stack.Screen name="PublicOrganizationProfiles" component={PublicOrganizationProfilesScreen} />
        <Stack.Screen name="DefaultPricingManagement" component={DefaultPricingManagementScreen} />
        
        {/* Gallery Management Screens */}
        <Stack.Screen name="GalleryManagement" component={GalleryManagementScreen} />
        <Stack.Screen name="CreateGalleryItem" component={CreateGalleryItemScreen} />
        <Stack.Screen name="EditGalleryItem" component={EditGalleryItemScreen} />
        
        {/* Super Admin Management Screens */}
        <Stack.Screen name="IndustryManagement" component={IndustryManagementScreen} />
        <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
        <Stack.Screen name="PickupCenterManagement" component={PickupCenterManagementScreen} />
        <Stack.Screen name="PlatformCommissionManagement" component={PlatformCommissionManagementScreen} />
        
        {/* Public Product Screens */}
        <Stack.Screen name="PublicProductSearch" component={PublicProductSearchScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        
        {/* Subscription Wizard Screens */}
        <Stack.Screen name="SubscriptionWizardStep2" component={SubscriptionWizardStep2Screen} />
        <Stack.Screen name="SubscriptionWizardStep3" component={SubscriptionWizardStep3Screen} />
        <Stack.Screen name="SubscriptionWizardStep4" component={SubscriptionWizardStep4Screen} />
        <Stack.Screen name="SubscriptionWizardStep5" component={SubscriptionWizardStep5Screen} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
