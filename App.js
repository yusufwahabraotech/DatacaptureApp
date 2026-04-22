import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
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
import ProductPaymentScreen from './screens/ProductPaymentScreen';
import ProductPaymentVerificationScreen from './screens/ProductPaymentVerificationScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import OrganizationOrdersScreen from './screens/OrganizationOrdersScreen';
import SuperAdminOrdersScreen from './screens/SuperAdminOrdersScreen';
import SuperAdminOrderDetailsScreen from './screens/SuperAdminOrderDetailsScreen';
import DeliveryConfirmationScreen from './screens/DeliveryConfirmationScreen';
import BankDetailsScreen from './screens/BankDetailsScreen';
import ConfirmedDeliveriesScreen from './screens/ConfirmedDeliveriesScreen';
import ProcessRemittanceScreen from './screens/ProcessRemittanceScreen';
import SettlementsScreen from './screens/SettlementsScreen';
import VerificationAssignmentsScreen from './screens/VerificationAssignmentsScreen';
import AssignmentDetailsScreen from './screens/AssignmentDetailsScreen';
import MyVerificationAssignmentsScreen from './screens/MyVerificationAssignmentsScreen';
import AssignmentLocationDetailsScreen from './screens/AssignmentLocationDetailsScreen';
import CreateVerificationFromAssignmentScreen from './screens/CreateVerificationFromAssignmentScreen';
import PendingVerificationAssignmentsScreen from './screens/PendingVerificationAssignmentsScreen';
import ServiceBookingCalendarScreen from './screens/ServiceBookingCalendarScreen';
import ServiceProviderManagementScreen from './screens/ServiceProviderManagementScreen';
import ServiceProviderAssignmentScreen from './screens/ServiceProviderAssignmentScreen';
import ServiceProviderHistoryScreen from './screens/ServiceProviderHistoryScreen';
import ServiceProviderListScreen from './screens/ServiceProviderListScreen';
import MySubscriptionScreen from './screens/MySubscriptionScreen';
import BookingStep1SelectDayScreen from './screens/BookingStep1SelectDayScreen';
import BookingStep2SelectTimeScreen from './screens/BookingStep2SelectTimeScreen';
import BookingStep3EnterDetailsScreen from './screens/BookingStep3EnterDetailsScreen';
import BookingStep4SelectLocationScreen from './screens/BookingStep4SelectLocationScreen';
import BookingStep5ConfirmScheduleScreen from './screens/BookingStep5ConfirmScheduleScreen';
import BookingPaymentVerificationScreen from './screens/BookingPaymentVerificationScreen';
import BookingPaymentSuccessScreen from './screens/BookingPaymentSuccessScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';
import ServiceProviderTaskDashboardScreen from './screens/ServiceProviderTaskDashboardScreen';
import AdminTaskNotificationsScreen from './screens/AdminTaskNotificationsScreen';
import ServiceProviderProfileScreen from './screens/ServiceProviderProfileScreen';
import ServiceProviderDebugScreen from './screens/ServiceProviderDebugScreen';
import AdminBookingStep1SelectDayScreen from './screens/AdminBookingStep1SelectDayScreen';
import AdminBookingStep2SelectTimeScreen from './screens/AdminBookingStep2SelectTimeScreen';
import AdminBookingStep3EnterDetailsScreen from './screens/AdminBookingStep3EnterDetailsScreen';
import AdminBookingStep4SelectLocationScreen from './screens/AdminBookingStep4SelectLocationScreen';
import AdminBookingStep5ConfirmScheduleScreen from './screens/AdminBookingStep5ConfirmScheduleScreen';
import AdminBookingSuccessScreen from './screens/AdminBookingSuccessScreen';
import AdminBookingManagementScreen from './screens/AdminBookingManagementScreen';
import AdminGalleryItemsScreen from './screens/AdminGalleryItemsScreen';
import AdminGalleryItemDetailsScreen from './screens/AdminGalleryItemDetailsScreen';
import AdminPurchaseFlowScreen from './screens/AdminPurchaseFlowScreen';
import AdminPurchaseManagementScreen from './screens/AdminPurchaseManagementScreen';
import AdminPurchaseSuccessScreen from './screens/AdminPurchaseSuccessScreen';

const Stack = createStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['vestradat://'],
  config: {
    screens: {
      BookingPaymentSuccess: 'payment/verify-order',
      ProductPaymentVerification: 'payment/verify-product',
      PaymentVerification: 'payment/verify-subscription',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Handle deep links when app is already running
    const handleDeepLink = (url) => {
      console.log('🚨 APP-LEVEL DEEP LINK RECEIVED 🚨');
      console.log('URL:', url);
      
      if (url.includes('payment/verify-order')) {
        // Extract parameters and navigate to booking verification
        const urlParts = url.split('?');
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const status = params.get('status');
          const txRef = params.get('tx_ref') || params.get('transaction_id');
          
          console.log('💳 Payment verification data:', { status, txRef });
          
          // Navigate to BookingPaymentVerification with the deep link data
          if (navigationRef.current) {
            navigationRef.current.navigate('BookingPaymentVerification', {
              deepLinkData: {
                status,
                txRef,
                fromDeepLink: true
              }
            });
          }
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
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
        <Stack.Screen name="MySubscription" component={MySubscriptionScreen} />
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
        <Stack.Screen name="VerificationAssignments" component={VerificationAssignmentsScreen} />
        <Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} />
        <Stack.Screen name="MyVerificationAssignments" component={MyVerificationAssignmentsScreen} />
        <Stack.Screen name="PendingVerificationAssignments" component={PendingVerificationAssignmentsScreen} />
        <Stack.Screen name="AssignmentLocationDetails" component={AssignmentLocationDetailsScreen} />
        <Stack.Screen name="CreateVerificationFromAssignment" component={CreateVerificationFromAssignmentScreen} />
        <Stack.Screen name="ServiceBookingCalendar" component={ServiceBookingCalendarScreen} />
        <Stack.Screen name="ServiceProviderManagement" component={ServiceProviderManagementScreen} />
        <Stack.Screen name="ServiceProviderAssignment" component={ServiceProviderAssignmentScreen} />
        <Stack.Screen name="ServiceProviderHistory" component={ServiceProviderHistoryScreen} />
        <Stack.Screen name="ServiceProviderList" component={ServiceProviderListScreen} />
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
        
        {/* Product Order & Payment Screens */}
        <Stack.Screen name="ProductPayment" component={ProductPaymentScreen} />
        <Stack.Screen name="ProductPaymentVerification" component={ProductPaymentVerificationScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrganizationOrders" component={OrganizationOrdersScreen} />
        <Stack.Screen name="OrganizationOrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="SuperAdminOrders" component={SuperAdminOrdersScreen} />
        <Stack.Screen name="SuperAdminOrderDetails" component={SuperAdminOrderDetailsScreen} />
        <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmationScreen} />
        <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
        <Stack.Screen name="ConfirmedDeliveries" component={ConfirmedDeliveriesScreen} />
        <Stack.Screen name="ProcessRemittance" component={ProcessRemittanceScreen} />
        <Stack.Screen name="Settlements" component={SettlementsScreen} />
        
        {/* 5-Step Booking Flow Screens */}
        <Stack.Screen name="BookingStep1SelectDay" component={BookingStep1SelectDayScreen} />
        <Stack.Screen name="BookingStep2SelectTime" component={BookingStep2SelectTimeScreen} />
        <Stack.Screen name="BookingStep3EnterDetails" component={BookingStep3EnterDetailsScreen} />
        <Stack.Screen name="BookingStep4SelectLocation" component={BookingStep4SelectLocationScreen} />
        <Stack.Screen name="BookingStep5ConfirmSchedule" component={BookingStep5ConfirmScheduleScreen} />
        <Stack.Screen name="BookingPaymentVerification" component={BookingPaymentVerificationScreen} />
        <Stack.Screen name="BookingPaymentSuccess" component={BookingPaymentSuccessScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <Stack.Screen name="ServiceProviderTaskDashboard" component={ServiceProviderTaskDashboardScreen} />
        <Stack.Screen name="AdminTaskNotifications" component={AdminTaskNotificationsScreen} />
        <Stack.Screen name="ServiceProviderProfile" component={ServiceProviderProfileScreen} />
        <Stack.Screen name="ServiceProviderDebug" component={ServiceProviderDebugScreen} />
        
        {/* Admin Booking Flow Screens */}
        <Stack.Screen name="AdminBookingStep1SelectDay" component={AdminBookingStep1SelectDayScreen} />
        <Stack.Screen name="AdminBookingStep2SelectTime" component={AdminBookingStep2SelectTimeScreen} />
        <Stack.Screen name="AdminBookingStep3EnterDetails" component={AdminBookingStep3EnterDetailsScreen} />
        <Stack.Screen name="AdminBookingStep4SelectLocation" component={AdminBookingStep4SelectLocationScreen} />
        <Stack.Screen name="AdminBookingStep5ConfirmSchedule" component={AdminBookingStep5ConfirmScheduleScreen} />
        <Stack.Screen name="AdminBookingSuccess" component={AdminBookingSuccessScreen} />
        <Stack.Screen name="AdminBookingManagement" component={AdminBookingManagementScreen} />
        
        {/* Admin Gallery & Purchase Flow Screens */}
        <Stack.Screen name="AdminGalleryItems" component={AdminGalleryItemsScreen} />
        <Stack.Screen name="AdminGalleryItemDetails" component={AdminGalleryItemDetailsScreen} />
        <Stack.Screen name="AdminPurchaseFlow" component={AdminPurchaseFlowScreen} />
        <Stack.Screen name="AdminPurchaseManagement" component={AdminPurchaseManagementScreen} />
        <Stack.Screen name="AdminPurchaseSuccess" component={AdminPurchaseSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
