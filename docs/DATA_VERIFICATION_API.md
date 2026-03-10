# Data Verification API Integration Documentation

## Overview
This documentation covers the complete API integration for the Data Verification Organization Assignment System, including all endpoints, payloads, step-based verification workflow, and their usage in the React Native application.

## Base Configuration
- **Base URLs**: Multiple fallback URLs with automatic switching
  - Primary: `http://192.168.0.183:3000/api`
  - Fallback: `http://192.168.1.183:3000/api`, `http://172.20.10.2:3000/api`
  - Production: `https://datacapture.onrender.com/api`
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
- **Purpose**: Create a new verification report from an assignment using 5-step workflow
- **Payload Structure**:
```json
{
  "assignmentId": "string",
  
  // Step 3: What field agent actually found (can differ from claimed location)
  "country": "string",
  "state": "string", 
  "lga": "string",
  "city": "string",
  "cityRegion": "string",
  
  // Organization data (auto-filled from assignment)
  "organizationId": "string",
  "organizationName": "string",
  "targetUserId": "string",
  "targetUserFirstName": "string",
  "targetUserLastName": "string",
  
  // Step 1: What organization claims (from assignment data)
  "organizationClaimedLocation": {
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
    "address": "formatted_address_string"
  },
  
  // Step 3: Organization details
  "organizationDetails": {
    "name": "string",
    "attachments": [],
    "headquartersAddress": "string", // What agent actually found
    "addressAttachments": []
  },
  
  // Step 4: Building pictures with all required photos
  "buildingPictures": {
    "frontView": "image_url_or_placeholder",
    "streetPicture": "image_url_or_placeholder",
    "agentInFrontBuilding": "image_url_or_placeholder",
    "whatsappLocation": "image_url_or_placeholder",
    "insideOrganization": "image_url_or_placeholder",
    "withStaffOrOwner": "image_url_or_placeholder",
    "videoWithNeighbor": "image_url_or_placeholder"
  },
  
  // Step 5: Transportation cost breakdown
  "transportationCost": {
    "going": [
      {
        "startPoint": "string",
        "time": "string",
        "nextDestination": "string",
        "fareSpent": "number",
        "timeSpent": "string"
      }
    ],
    "finalDestination": "string",
    "finalFareSpent": "number",
    "finalTime": "string",
    "totalJourneyTime": "string",
    "comingBack": {
      "totalTransportationCost": "number",
      "otherExpensesCost": "number",
      "receiptUrl": "string"
    }
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
All methods are implemented in `services/api.js` using the base `apiCall` method with automatic URL fallback:

```javascript
static async apiCall(endpoint, options = {}) {
  const token = await this.getToken();
  
  // Try each base URL until one works
  for (let i = 0; i < BASE_URLS.length; i++) {
    const baseUrl = BASE_URLS[(currentBaseUrlIndex + i) % BASE_URLS.length];
    const url = `${baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (response.ok) {
        // Update successful base URL index
        currentBaseUrlIndex = (currentBaseUrlIndex + i) % BASE_URLS.length;
        return await response.json();
      }
      // Try next URL if server error
      if (response.status >= 500) continue;
      
      return await response.json();
    } catch (error) {
      // Try next URL on network error
      if (i === BASE_URLS.length - 1) {
        return {
          success: false,
          message: `Network error: ${error.message}`,
          data: { error: error.message }
        };
      }
      continue;
    }
  }
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

#### CreateVerificationScreen (5-Step Workflow)
- **File**: `screens/CreateVerificationScreen.js`
- **Step 1**: Location Selection from assignments
- **Step 2**: Organization details display
- **Step 3**: Field verification details (what agent found vs claimed)
- **Step 4**: Building pictures capture
- **Step 5**: Transportation cost tracking

**Step 1 - Location Selection:**
```javascript
// Flatten all locations from assignments
const allLocs = [];
response.data.assignments.forEach(assignment => {
  if (assignment.organizationLocationDetails?.length > 0) {
    assignment.organizationLocationDetails.forEach((location, index) => {
      allLocs.push({
        ...assignment,
        selectedLocation: location,
        locationIndex: index,
        uniqueId: `${assignment._id}_${index}`
      });
    });
  }
});
```

**Step 2 - Organization Details Display:**
- Shows complete organization information
- Displays location details (brand name, type, address components)
- Shows formatted full address

**Step 3 - Field Verification vs Claims:**
```javascript
// Organization claims (from assignment)
organizationClaimedLocation: {
  country: location?.country || '',
  state: location?.state || '',
  // ... other claimed location fields
  address: `${location?.houseNumber || ''} ${location?.street || ''}`.trim()
}

// What agent actually found (editable)
country: location?.country || '', // Pre-filled but editable
state: location?.state || '',
// ... agent can modify these fields
```

**Step 4 - Building Pictures:**
- Front View of Building
- Street Picture
- Agent in Front of Building
- WhatsApp Location Screenshot
- Inside Organization
- With Staff or Owner
- Video with Neighbor

**Step 5 - Transportation Tracking:**
```javascript
transportationCost: {
  going: formData.transportationSteps, // Array of journey steps
  finalDestination: formData.finalDestination,
  finalFareSpent: Number(formData.finalFareSpent),
  finalTime: formData.finalTime,
  totalJourneyTime: formData.totalJourneyTime,
  comingBack: {
    totalTransportationCost: Number(formData.totalTransportationCost),
    otherExpensesCost: Number(formData.otherExpensesCost),
    receiptUrl: ''
  }
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
- **Step 1**: No location selected from assignments
- **Step 3**: Missing required location fields (country, state, lga, city, cityRegion)
- **Step 4**: Missing required building pictures
- **Step 5**: Invalid transportation cost data (non-numeric values)
- **General**: Authentication token expired
- **Assignment**: Invalid organization assignment data
- **Network**: Connection failures with automatic URL fallback

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
5. **Start Verification** → CreateVerificationScreen (5-step workflow)

### CreateVerificationScreen Step Flow
1. **Step 1**: Select location from flattened assignment locations
2. **Step 2**: Review complete organization and location details
3. **Step 3**: Enter field verification findings (compare with claims)
4. **Step 4**: Capture all required building pictures
5. **Step 5**: Record transportation costs and journey details

### Location Data Structure
**Assignment Location Structure:**
```javascript
{
  _id: "assignment_id",
  organizationName: "string",
  targetUserName: "string",
  organizationLocationDetails: [
    {
      locationType: "headquarters|branch",
      brandName: "string",
      country: "string",
      state: "string",
      lga: "string",
      city: "string",
      cityRegion: "string",
      houseNumber: "string",
      street: "string",
      landmark: "string",
      _id: "location_id"
    }
  ]
}
```

**Flattened Location for Selection:**
```javascript
{
  ...assignment, // All assignment fields
  selectedLocation: location, // Specific location object
  locationIndex: index, // Index in organizationLocationDetails array
  uniqueId: `${assignment._id}_${index}` // Unique identifier
}
```

## Key Implementation Notes
- **Route ordering**: Critical on backend to prevent ObjectId parsing conflicts
- **Assignment vs Verification data**: Different structures for assignments and actual verifications
- **Tabbed interface**: Separates assignments from actual verifications
- **5-Step workflow**: Structured verification creation process
- **Location flattening**: Multiple locations per assignment are flattened for selection
- **Claims vs Findings**: Distinguishes between what organization claims and what agent finds
- **Image handling**: Supports both camera capture and gallery selection
- **Transportation tracking**: Detailed journey step recording with costs
- **Keyboard handling**: KeyboardAvoidingView implemented for proper form interaction
- **API fallback**: Automatic URL switching for network reliability
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Authentication**: Bearer token automatically included in all requests

## Data Flow Summary
1. **Assignment Creation**: Super admin assigns organizations to field agents
2. **Location Selection**: Field agent selects specific location from assignment
3. **Claims vs Reality**: System captures both claimed location and actual findings
4. **Evidence Collection**: Photos and transportation details recorded
5. **Verification Submission**: Complete verification report created with all data

## Payload Structure Key Points
- `assignmentId`: Links verification to original assignment
- `organizationClaimedLocation`: What organization says (from assignment)
- `country`, `state`, etc.: What field agent actually found (can differ)
- `buildingPictures`: All 7 required photo types
- `transportationCost`: Detailed journey tracking with going/coming back costs