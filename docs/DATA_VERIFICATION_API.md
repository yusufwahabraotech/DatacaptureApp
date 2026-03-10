# Data Verification API Integration Documentation

## Overview
This documentation covers the complete API integration for the Data Verification Organization Assignment System, including all endpoints, payloads, and their usage in the React Native application.

## Base Configuration
- **Base URL**: `http://192.168.0.183:3000/api`
- **Authentication**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## API Service Methods

### Super Admin Endpoints

#### 1. Create Data Verification Role
```javascript
static async createDataVerificationRole(roleData)
```
- **Endpoint**: `POST /super-admin/data-verification/create-role`
- **Purpose**: Assign data verification permission to a user
- **Payload**:
```json
{
  "userId": "string",
  "assign": true
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Data verification role assigned successfully"
}
```

#### 2. Get Data Verification Organizations
```javascript
static async getDataVerificationOrganizations()
```
- **Endpoint**: `GET /super-admin/data-verification/organizations`
- **Purpose**: Fetch all organizations available for verification assignments
- **Response**:
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "string",
        "name": "string",
        "organizationId": "string"
      }
    ]
  }
}
```

#### 3. Get All Users for Data Verification
```javascript
static async getDataVerificationAllUsers()
```
- **Endpoint**: `GET /super-admin/data-verification/users`
- **Purpose**: Fetch all users who can be assigned verification roles
- **Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "hasDataVerificationPermission": boolean
      }
    ]
  }
}
```

#### 4. Assign Organization to User
```javascript
static async assignOrganizationToUser(userId, organizationId)
```
- **Endpoint**: `POST /super-admin/data-verification/assign-organization`
- **Purpose**: Assign specific organization to a field agent for verification
- **Payload**:
```json
{
  "userId": "string",
  "organizationId": "string"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Organization assigned successfully",
  "data": {
    "assignmentId": "string"
  }
}
```

#### 5. Get All Verification Assignments
```javascript
static async getAllVerificationAssignments()
```
- **Endpoint**: `GET /super-admin/data-verification/assignments`
- **Purpose**: View all organization assignments made by super admin
- **Response**:
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "string",
        "userId": "string",
        "userName": "string",
        "organizationId": "string",
        "organizationName": "string",
        "status": "pending|in_progress|completed",
        "assignedAt": "ISO_DATE"
      }
    ]
  }
}
```

#### 6. Delete Verification Assignment
```javascript
static async deleteVerificationAssignment(assignmentId)
```
- **Endpoint**: `DELETE /super-admin/data-verification/assignments/{assignmentId}`
- **Purpose**: Remove an assignment
- **Response**:
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

### Field Agent Endpoints

#### 7. Get My Verification Assignments
```javascript
static async getMyVerificationAssignments()
```
- **Endpoint**: `GET /data-verification/assignments/my`
- **Purpose**: Fetch organizations assigned to the current user
- **Response**:
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "string",
        "userId": "string",
        "userName": "string",
        "organizationId": "string",
        "organizationName": "string",
        "targetUserId": "string",
        "targetUserName": "string",
        "targetUserEmail": "string",
        "organizationLocationDetails": [
          {
            "locationType": "headquarters|branch",
            "brandName": "string",
            "country": "string",
            "state": "string",
            "lga": "string",
            "city": "string",
            "cityRegion": "string",
            "houseNumber": "string",
            "street": "string",
            "landmark": "string",
            "_id": "string"
          }
        ],
        "status": "pending|in_progress|completed",
        "assignedBy": "string",
        "assignedAt": "ISO_DATE",
        "createdAt": "ISO_DATE",
        "updatedAt": "ISO_DATE"
      }
    ],
    "total": 1
  },
  "message": "Assignments retrieved successfully"
}
```

#### 8. Get My Actual Verifications
```javascript
static async getMyActualVerifications()
```
- **Endpoint**: `GET /data-verification/my-verifications`
- **Purpose**: Fetch verification reports created by the current user
- **Response**:
```json
{
  "success": true,
  "data": {
    "verifications": [
      {
        "_id": "string",
        "verificationId": "string",
        "organizationName": "string",
        "status": "draft|submitted|approved|rejected",
        "createdAt": "ISO_DATE",
        "location": {
          "country": "string",
          "state": "string",
          "lga": "string",
          "city": "string",
          "cityRegion": "string"
        },
        "organizationDetails": {
          "name": "string",
          "type": "string",
          "address": "string",
          "contactPerson": "string",
          "phoneNumber": "string"
        },
        "buildingPictures": [
          {
            "url": "string",
            "label": "string"
          }
        ],
        "transportationCost": {
          "amount": "number",
          "description": "string"
        },
        "reviewComments": "string"
      }
    ]
  }
}
```

#### 9. Create Verification from Assignment
```javascript
static async createVerificationFromAssignment(verificationData)
```
- **Endpoint**: `POST /data-verification`
- **Purpose**: Create a new verification report from an assignment
- **Payload**:
```json
{
  "assignmentId": "string",
  "country": "string",
  "state": "string",
  "lga": "string",
  "city": "string",
  "cityRegion": "string",
  "organizationId": "string",
  "organizationName": "string",
  "targetUserId": "string",
  "targetUserFirstName": "string",
  "targetUserLastName": "string",
  "organizationClaimedLocation": {
    "locationType": "string",
    "brandName": "string",
    "country": "string",
    "state": "string",
    "lga": "string",
    "city": "string",
    "cityRegion": "string",
    "houseNumber": "string",
    "street": "string",
    "landmark": "string"
  },
  "organizationDetails": {
    "name": "string",
    "attachments": [],
    "headquartersAddress": "string",
    "addressAttachments": []
  },
  "buildingPictures": {},
  "transportationCost": {
    "comingBack": {
      "otherExpensesCost": "number",
      "totalTransportationCost": "number"
    },
    "totalJourneyTime": "string",
    "finalTime": "string",
    "finalFareSpent": "number",
    "finalDestination": "string"
  }
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Verification created successfully",
  "data": {
    "verificationId": "string",
    "status": "draft"
  }
}
```

## Frontend Integration

### API Service Implementation
All methods are implemented in `services/api.js` using the base `apiCall` method:

```javascript
static async apiCall(endpoint, options = {}) {
  const token = await this.getToken();
  let url = `${BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  return await response.json();
}
```

### Screen Integration

#### FieldAgentVerificationScreen
- **File**: `screens/FieldAgentVerificationScreen.js`
- **My Assignments Tab**: Uses `getMyVerificationAssignments()`
- **My Verifications Tab**: Uses `getMyActualVerifications()`
- **Navigation**: Passes assignment data to verification creation flow

```javascript
// Fetch assignments
const response = await ApiService.getMyVerificationAssignments();
if (response.success) {
  setAssignments(response.data.assignments || []);
}

// Fetch verifications
const response = await ApiService.getMyActualVerifications();
if (response.success) {
  setVerifications(response.data.verifications || []);
}
```

#### VerificationDetailsScreen
- **File**: `screens/VerificationDetailsScreen.js`
- **Assignment Details**: Fetches from assignments endpoint
- **Verification Details**: Fetches from verifications endpoint
- **Parameter**: `isAssignment` boolean to determine data source

```javascript
if (isAssignment) {
  // Fetch assignment details
  const response = await ApiService.getMyVerifications();
  const foundVerification = response.data.assignments?.find(
    v => v._id === verificationId
  );
} else {
  // Fetch actual verification details
  const response = await ApiService.getMyActualVerifications();
  const foundVerification = response.data.verifications?.find(
    v => v._id === verificationId
  );
}
```

#### CreateDataVerificationRoleScreen
- **File**: `screens/CreateDataVerificationRoleScreen.js`
- **Organization Dropdown**: Uses `getDataVerificationOrganizations()`
- **Assignment Creation**: Uses `assignOrganizationToUser()`

```javascript
// Load organizations
const response = await ApiService.getDataVerificationOrganizations();
if (response.success) {
  setOrganizations(response.data.organizations || []);
}

// Create assignment
const response = await ApiService.assignOrganizationToUser(userId, organizationId);
```

## Status Flow
1. **Assignment Created**: Status = `pending`
2. **Verification Started**: Status = `in_progress` (when user clicks "Start Verification")
3. **Verification Completed**: Status = `completed` (when verification is submitted)

## Error Handling
All API calls include comprehensive error handling:

### Network Errors
```javascript
catch (error) {
  return {
    success: false,
    message: `Network error: ${error.message}. Please check your connection.`,
    data: { error: error.message, type: error.name }
  };
}
```

### HTTP Status Errors
```javascript
if (!response.ok) {
  const error = await response.json().catch(() => ({ error: 'Unknown error' }));
  return {
    success: false,
    message: error.message || `HTTP ${response.status}: ${response.statusText}`,
    data: error
  };
}
```

### Validation Errors
Common validation errors include:
- Missing required fields in transportation cost
- Invalid organization assignment data
- Authentication token expired

## Authentication
All endpoints require Bearer token authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Navigation Flow
1. **Super Admin** → CreateDataVerificationRoleScreen → Assign organizations to users
2. **Field Agent** → FieldAgentVerificationScreen → View assignments and verifications
3. **Assignment Details** → VerificationDetailsScreen (isAssignment: true)
4. **Verification Details** → VerificationDetailsScreen (isAssignment: false)
5. **Start Verification** → CreateVerification screen (multi-step form)

## Key Implementation Notes
- Route ordering is critical on backend to prevent ObjectId parsing conflicts
- Assignment data structure differs from verification data structure
- Tabbed interface separates assignments from actual verifications
- All API methods use consistent error handling and response format
- Authentication token is automatically included in all requests