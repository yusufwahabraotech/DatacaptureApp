# Product Order & Payment System - Installation Guide

## New Dependencies Required

The product order and payment system requires one additional dependency:

### React Native WebView

Install the WebView component for payment verification:

```bash
npm install react-native-webview
```

For Expo managed workflow:
```bash
expo install react-native-webview
```

## New Screens Added

1. **ProductPaymentScreen** - Payment initiation with payment type selection
2. **ProductPaymentVerificationScreen** - Payment verification with WebView
3. **MyOrdersScreen** - User order history
4. **OrderDetailsScreen** - Detailed order view
5. **OrganizationOrdersScreen** - Organization order management

## API Integration

The following endpoints have been integrated:

### Public Endpoints (No Authentication)
- `POST /api/orders/public/initiate` - Initiate product payment
- `POST /api/orders/public/verify` - Verify payment

### User Endpoints (Authentication Required)
- `GET /api/orders/user/my-orders` - Get user's orders
- `GET /api/orders/user/:orderId` - Get specific order details

### Organization Endpoints (Role-based)
- `GET /api/admin/orders` or `/api/org-user/orders` - Get organization orders
- `PUT /api/admin/orders/:orderId/status` - Update order status

## Navigation Updates

New screens have been added to the navigation stack in `App.js`:
- ProductPayment
- ProductPaymentVerification
- MyOrders
- OrderDetails
- OrganizationOrders
- OrganizationOrderDetails

## Dashboard Integration

- **User Dashboard**: Added "My Orders" card for all authenticated users
- **Admin Dashboard**: Added "Orders Management" option for organization users

## Payment Flow

1. **Product Discovery**: Users browse products via `PublicProductSearchScreen`
2. **Product Details**: View product details with "Buy Now" button
3. **Payment Selection**: Choose payment type (full, upfront, remaining)
4. **Payment Processing**: Flutterwave integration via WebView
5. **Verification**: Automatic payment verification
6. **Order Management**: View orders and payment history

## Role-Based Access

- **All Users**: Can make payments and view their orders
- **Organization Users**: Can view and manage orders for their products
- **Super Admin**: Full system oversight (can be extended)

## Features Implemented

✅ Flexible payment options (full, upfront, remaining balance)
✅ Flutterwave payment integration
✅ Order status tracking
✅ Payment history
✅ Role-based order management
✅ Customer information capture
✅ Real-time payment verification
✅ Professional UI/UX design
✅ Error handling and validation

The system is now ready for production use with proper payment processing and order management capabilities.