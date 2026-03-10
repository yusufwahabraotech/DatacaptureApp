# Payment System Documentation

## Overview
This document provides comprehensive documentation of all payment systems implemented in the DataCapturingApp, including endpoints, verification methods, authentication requirements, and integration details.

## Payment Systems Overview

The application implements **4 distinct payment systems**:

1. **Subscription Payments** - Organization subscription packages
2. **Combined Payments** - Subscription + Verified Badge together
3. **Verified Badge Payments** - Standalone verified badge payments
4. **Product Order Payments** - Customer product purchases

---

## 1. Subscription Payment System

### Purpose
Allows organizations to purchase subscription packages for accessing platform services.

### Payment Flow
```
User Selection → Payment Initialization → Flutterwave WebView → Payment Verification → Subscription Activation
```

### API Endpoints

#### Initialize Payment
- **Endpoint**: `POST /api/payment/initialize`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "packageId": "string",
  "subscriptionDuration": "monthly|quarterly|yearly",
  "email": "user@example.com",
  "name": "User Full Name",
  "phone": "+1234567890",
  "promoCode": "optional_promo_code"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentLink": "https://checkout.flutterwave.com/...",
    "tx_ref": "unique_transaction_reference"
  }
}
```

#### Verify Payment
- **Endpoint**: `POST /api/payment/verify`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "tx_ref": "transaction_reference_from_flutterwave"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "packageId": "string",
      "duration": "monthly",
      "startDate": "2024-01-01",
      "endDate": "2024-02-01",
      "status": "active"
    }
  }
}
```

### Verification Method
- **Primary**: Direct API verification after Flutterwave callback
- **Webhook**: Not implemented (relies on frontend verification)
- **Fallback**: Manual verification through WebView URL monitoring

### Authentication & Authorization
- **Token**: Required (Bearer token in Authorization header)
- **Organization ID**: Automatically extracted from authenticated user profile
- **Role**: Organization admin or authorized user

---

## 2. Combined Payment System

### Purpose
Allows organizations to pay for both subscription and verified badge in a single transaction.

### Payment Flow
```
Package + Location Selection → Combined Payment Initialization → Flutterwave WebView → Payment Verification → Subscription + Badge Processing
```

### API Endpoints

#### Initialize Combined Payment
- **Endpoint**: `POST /api/payment/combined/initialize`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "packageId": "string",
  "subscriptionDuration": "monthly|quarterly|yearly",
  "email": "user@example.com",
  "name": "User Full Name",
  "phone": "+1234567890",
  "includeVerifiedBadge": true,
  "locations": [
    {
      "brandName": "Business Name",
      "country": "Nigeria",
      "state": "Lagos",
      "lga": "Ikeja",
      "city": "Ikeja",
      "cityRegion": "GRA",
      "fee": 50000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentLink": "https://checkout.flutterwave.com/...",
    "tx_ref": "unique_transaction_reference",
    "breakdown": {
      "subscriptionAmount": 100000,
      "verifiedBadgeAmount": 50000,
      "totalAmount": 150000
    }
  }
}
```

#### Verify Combined Payment
- **Endpoint**: `POST /api/payment/combined/verify`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "tx_ref": "transaction_reference_from_flutterwave"
}
```

### Verification Method
- **Primary**: Direct API verification after Flutterwave callback
- **Webhook**: Not implemented
- **Processing**: Creates subscription AND marks locations as paid for verification

### Authentication & Authorization
- **Token**: Required (Bearer token in Authorization header)
- **Organization ID**: Automatically extracted from authenticated user profile
- **Role**: Organization admin or authorized user

---

## 3. Verified Badge Payment System

### Purpose
Standalone payment for organization verification badge without subscription.

### Payment Flow
```
Pricing Check → Location Validation → Payment Initialization → Flutterwave WebView → Payment Verification → Badge Processing
```

### API Endpoints

#### Check Payment Required
- **Endpoint**: `GET /api/payment/verified-badge/check-payment-required`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentRequired": true,
    "unpaidLocations": 3,
    "totalAmount": 150000
  }
}
```

#### Get Pricing
- **Endpoint**: `GET /api/payment/verified-badge/pricing`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 150000,
    "unpaidLocations": 3,
    "locations": [
      {
        "brandName": "Location 1",
        "cityRegion": "GRA",
        "fee": 50000
      }
    ]
  }
}
```

#### Initialize Payment
- **Endpoint**: `POST /api/payment/verified-badge/initialize`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "amount": 150000,
  "currency": "NGN",
  "email": "user@example.com",
  "name": "User Full Name",
  "redirect_url": "https://your-app.com/payment-success"
}
```

#### Verify Payment
- **Endpoint**: `POST /api/payment/verified-badge/verify`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Direct API call

**Request Payload:**
```json
{
  "tx_ref": "transaction_reference_from_flutterwave"
}
```

### Verification Method
- **Primary**: Direct API verification after Flutterwave callback
- **Webhook**: Not implemented
- **Processing**: Marks organization locations as paid and queues for verification

### Authentication & Authorization
- **Token**: Required (Bearer token in Authorization header)
- **Organization ID**: Automatically extracted from authenticated user profile
- **Role**: Organization admin or authorized user

---

## 4. Product Order Payment System

### Purpose
Allows customers to purchase products/services from organizations with flexible payment options.

### Payment Flow
```
Product Selection → Payment Type Selection → Customer Info → Payment Initialization → Flutterwave WebView → Payment Verification → Order Creation
```

### API Endpoints

#### Initialize Product Payment (Public)
- **Endpoint**: `POST /api/orders/public/initiate`
- **Authentication**: None Required (Public endpoint)
- **Organization ID**: Provided in request payload
- **Method**: Direct API call

**Request Payload:**
```json
{
  "productId": "string",
  "productName": "Product Name",
  "organizationId": "org_id_from_product",
  "organizationName": "Organization Name",
  "productPrice": 100000,
  "upfrontPercentage": 50,
  "userId": "optional_user_id",
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "customerPhone": "+1234567890",
  "paymentType": "full|upfront|remaining",
  "subServices": [
    {
      "name": "Additional Service",
      "code": "service_code",
      "price": 25000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "link": "https://checkout.flutterwave.com/...",
    "orderId": "order_unique_id",
    "tx_ref": "transaction_reference"
  }
}
```

#### Verify Product Payment (Public)
- **Endpoint**: `POST /api/orders/public/verify`
- **Authentication**: None Required (Public endpoint)
- **Organization ID**: Not required for verification
- **Method**: Direct API call

**Request Payload:**
```json
{
  "transactionId": "transaction_id_from_flutterwave"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "string",
      "status": "paid",
      "paymentType": "full",
      "totalAmount": 125000,
      "customerInfo": {
        "name": "Customer Name",
        "email": "customer@example.com"
      }
    }
  }
}
```

### User Order Management

#### Get User Orders
- **Endpoint**: `GET /api/orders/user/my-orders`
- **Authentication**: Bearer Token Required
- **Organization ID**: Not required
- **Method**: Direct API call

#### Get Order Details
- **Endpoint**: `GET /api/orders/user/{orderId}`
- **Authentication**: Bearer Token Required
- **Organization ID**: Not required
- **Method**: Direct API call

### Organization Order Management

#### Get Organization Orders
- **Endpoint**: `GET /api/admin/orders` or `GET /api/org-user/orders`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Role-based routing (admin vs org-user)

#### Update Order Status
- **Endpoint**: `PUT /api/admin/orders/{orderId}/status`
- **Authentication**: Bearer Token Required
- **Organization ID**: Extracted from user profile
- **Method**: Role-based routing

### Verification Method
- **Primary**: Direct API verification after Flutterwave callback
- **Webhook**: Not implemented
- **Processing**: Creates order record and updates payment status

### Authentication & Authorization
- **Public Endpoints**: No authentication required for payment initiation/verification
- **User Endpoints**: Bearer token required for order management
- **Organization Endpoints**: Bearer token + organization role required

---

## Flutterwave Integration Details

### WebView Implementation
All payment systems use React Native WebView for Flutterwave integration:

```javascript
import { WebView } from 'react-native-webview';

// WebView navigation monitoring
const handleWebViewNavigationStateChange = (navState) => {
  const { url } = navState;
  
  // Success detection
  if (url.includes('status=successful') || url.includes('successful')) {
    // Extract transaction ID and verify
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const transactionId = urlParams.get('transaction_id');
    verifyPayment(transactionId);
  }
  
  // Failure detection
  if (url.includes('status=cancelled') || url.includes('failed')) {
    handlePaymentFailure();
  }
};
```

### Transaction ID Extraction
Multiple methods used to extract transaction IDs:
- URL parameters: `transaction_id`, `tx_ref`
- Response data: `tx_ref`, `transactionRef`
- Fallback: Original reference from initialization

### Error Handling
- Network errors: Retry mechanism with exponential backoff
- Verification failures: Multiple verification attempts (up to 5)
- User cancellation: Graceful handling with navigation options

---

## Security Considerations

### Authentication
- **Bearer Tokens**: All authenticated endpoints require valid JWT tokens
- **Token Validation**: Server-side token verification for all protected routes
- **Role-Based Access**: Organization-specific data isolation

### Data Protection
- **PII Handling**: Customer information encrypted in transit
- **Payment Data**: No sensitive payment data stored locally
- **Transaction References**: Unique, non-guessable transaction IDs

### API Security
- **HTTPS Only**: All API calls use secure HTTPS connections
- **Request Validation**: Server-side input validation and sanitization
- **Rate Limiting**: Protection against abuse (implementation dependent)

---

## Error Handling & Recovery

### Common Error Scenarios
1. **Network Failures**: Retry with exponential backoff
2. **Payment Timeouts**: Manual verification options
3. **Verification Failures**: Multiple attempt strategy
4. **User Cancellation**: Graceful navigation handling

### Recovery Mechanisms
- **Manual Verification**: User-initiated verification buttons
- **Transaction Lookup**: Support for transaction ID lookup
- **Fallback Navigation**: Alternative paths for failed payments

---

## Testing & Debugging

### Debug Information
All payment screens include debug information:
- Transaction IDs
- Order IDs
- Payment amounts
- Verification attempts

### Logging
Comprehensive console logging for:
- Payment initialization
- WebView navigation
- Verification attempts
- Error conditions

### Test Scenarios
- Successful payments
- Failed payments
- Cancelled payments
- Network interruptions
- Multiple verification attempts

---

## Integration Summary

| Payment Type | Authentication | Organization ID | Webhook | Verification Method |
|-------------|---------------|-----------------|---------|-------------------|
| Subscription | Bearer Token | From User Profile | No | Direct API Call |
| Combined | Bearer Token | From User Profile | No | Direct API Call |
| Verified Badge | Bearer Token | From User Profile | No | Direct API Call |
| Product Orders | Public/Token | In Request/Profile | No | Direct API Call |

### Key Implementation Notes
1. **No Webhook Implementation**: All systems rely on frontend verification
2. **Role-Based Routing**: Organization endpoints use dynamic routing based on user role
3. **Public Product Payments**: Only payment system that works without authentication
4. **Unified WebView**: All systems use same WebView implementation pattern
5. **Flutterwave Integration**: Consistent across all payment types

This documentation provides a complete overview of all payment systems, their endpoints, authentication requirements, and implementation details for maintenance and future development.