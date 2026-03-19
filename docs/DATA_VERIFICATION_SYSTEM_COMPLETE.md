# Complete Data Verification System Documentation

## System Overview
The Data Verification System is a comprehensive workflow that allows Super Admins to assign data verification roles to users and assign them to organizations, while Field Agents can perform location verifications through a structured 5-step process.

## System Architecture

### User Roles
1. **Super Admin (ORGANIZATION role)**: Manages verification roles and organization assignments
2. **Field Agent (CUSTOMER with data verification role)**: Performs actual location verifications

### Workflow Summary
1. Super Admin creates verification roles and assigns users to organizations
2. Field Agents receive assignments with organization location details
3. Field Agents perform on-site verification using 5-step process
4. Super Admin reviews and approves/rejects verification reports

---

## SUPER ADMIN SECTION

### 1. Data Verification Management Screen
**File**: `screens/DataVerificationManagementScreen.js`
**Route**: `DataVerificationManagement`

#### UI Format
- **Header**: Title "Data Verification" with back button and action buttons
- **Stats Cards**: Total, Submitted, Approved, Rejected counts
- **Create Role Button**: Primary action to create verification roles
- **Status Filter**: Chips for All, Draft, Submitted, Approved, Rejected
- **Verification List**: Cards showing verification reports with status badges

#### Endpoints on Page Load
```javascript
// Fetch verification statistics
GET /super-admin/data-verification/verification-stats

// Fetch verifications (filtered by status)
GET /super-admin/data-verification/verifications?status={selectedStatus}
```

#### Button Actions & Endpoints
```javascript
// Create Role Button
navigation.navigate('CreateDataVerificationRole')

// Users Button (header)
navigation.navigate('DataVerificationUsers')

// Assignments Button (header)  
navigation.navigate('VerificationAssignments')

// View Details Button
navigation.navigate('SuperAdminVerificationDetails', { verificationId })

// Approve Button
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'approved', comments: 'Verification approved' }

// Reject Button
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'rejected', comments: 'Verification rejected' }
```

#### Response Formats
```json
// Verification Stats Response
{
  "success": true,
  "data": {
    "stats": {
      "total": 25,
      "submitted": 8,
      "approved": 12,
      "rejected": 3
    }
  }
}

// Verifications List Response
{
  "success": true,
  "data": {
    "verifications": [
      {
        "_id": "verification_id",
        "verificationId": "VER-2024-001",
        "organizationName": "Tech Solutions Ltd",
        "verifierName": "John Doe",
        "status": "submitted",
        "city": "Lagos",
        "state": "Lagos",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 2. Create Data Verification Role Screen
**File**: `screens/CreateDataVerificationRoleScreen.js`
**Route**: `CreateDataVerificationRole`

#### UI Format
- **Header**: Title "Create Verification Role" with back button
- **Role Details Section**: Role name and description inputs
- **User Selection Section**: Search bar and user list with checkboxes
- **Organization Assignment**: Dropdown for each selected user to assign organizations
- **Assignment Summary**: Shows total assignments and user-organization mappings
- **Create Button**: Submit role creation with assignments

#### Endpoints on Page Load
```javascript
// Fetch all users available for verification roles
GET /super-admin/data-verification/users

// Fetch all organizations for assignment
GET /super-admin/data-verification/organizations
```

#### Form Submission Endpoint
```javascript
// Create role and assign organizations
POST /super-admin/data-verification/create-role
```

#### Request Payload
```json
{
  "roleName": "Field Agent Team A",
  "description": "Field agents for Lagos region verification",
  "selectedUserIds": ["user1_id", "user2_id"],
  "assignedOrganizations": [
    {
      "userId": "user1_id",
      "organizationId": "org1_id",
      "organizationName": "Tech Solutions Ltd"
    },
    {
      "userId": "user2_id", 
      "organizationId": "org2_id",
      "organizationName": "Business Corp"
    }
  ]
}
```

#### Response Formats
```json
// Users Response
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "fullName": "John Doe",
        "email": "john@example.com",
        "organizationName": "Parent Organization",
        "hasDataVerificationRole": false
      }
    ]
  }
}

// Organizations Response
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_id",
        "name": "Tech Solutions Ltd",
        "organizationId": "org_internal_id"
      }
    ]
  }
}

// Create Role Response
{
  "success": true,
  "message": "Verification role created and organizations assigned successfully",
  "data": {
    "roleId": "role_id",
    "assignmentsCreated": 2
  }
}
```

---

### 3. Data Verification Users Screen
**File**: `screens/DataVerificationUsersScreen.js`
**Route**: `DataVerificationUsers`

#### UI Format
- **Header**: Title "Verification Agents" with back button
- **User List**: Cards showing users with verification roles
- **User Info**: Avatar, name, email, role, join date
- **Role Badge**: "Data Verification" badge
- **Remove Button**: Remove verification role from user

#### Endpoints on Page Load
```javascript
// Fetch users with data verification roles
GET /super-admin/data-verification/verification-users
```

#### Button Actions & Endpoints
```javascript
// Remove Role Button
POST /super-admin/data-verification/assign-role/{userId}
Body: { assign: false }
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "fullName": "John Doe",
        "email": "john@example.com",
        "role": "CUSTOMER",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 4. Verification Assignments Screen
**File**: `screens/VerificationAssignmentsScreen.js`
**Route**: `VerificationAssignments`

#### UI Format
- **Header**: Title "Organization Assignments" with back button
- **Assignment Cards**: Organization name, assigned user, target user, status
- **Status Badge**: Color-coded status indicators
- **Action Buttons**: View Details, Delete (for pending assignments)

#### Endpoints on Page Load
```javascript
// Fetch all verification assignments
GET /super-admin/data-verification/assignments
```

#### Button Actions & Endpoints
```javascript
// View Details Button
navigation.navigate('AssignmentDetails', { assignmentId })

// Delete Button
DELETE /super-admin/data-verification/assignments/{assignmentId}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "assignment_id",
        "organizationName": "Tech Solutions Ltd",
        "userName": "John Doe",
        "targetUserName": "Jane Smith",
        "status": "pending",
        "assignedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 5. Super Admin Verification Details Screen
**File**: `screens/SuperAdminVerificationDetailsScreen.js`
**Route**: `SuperAdminVerificationDetails`

#### UI Format
- **Header**: Title "Verification Details" with back button
- **Status Card**: Large status indicator with submission date
- **Organization Information**: Name, target user, email
- **Location Details**: Multiple location cards if applicable
- **Organization Details**: Type, address, contact information
- **Building Pictures**: Horizontal scroll of verification photos
- **Transportation Cost**: Amount and description
- **Review Comments**: Admin feedback if available
- **Action Buttons**: Approve/Reject for submitted verifications

#### Endpoints on Page Load
```javascript
// Fetch detailed verification information
GET /super-admin/data-verification/verifications/{verificationId}
```

#### Button Actions & Endpoints
```javascript
// Approve Button
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'approved', comments: 'Verification approved' }

// Reject Button  
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'rejected', comments: 'Verification rejected' }
```

---

## FIELD AGENT SECTION

### 6. Field Agent Verification Screen
**File**: `screens/FieldAgentVerificationScreen.js`
**Route**: `FieldAgentVerification`

#### UI Format
- **Header**: Title "Data Verification" with back button
- **Tab Navigation**: "My Assignments" and "My Verifications" tabs
- **Assignment Cards**: Organization name, target user, location count, status
- **Verification Cards**: Verification ID, organization name, creation date, status
- **Action Buttons**: View Details, Start Verification (for pending assignments)

#### Endpoints on Page Load
```javascript
// My Assignments Tab
GET /data-verification/assignments/my

// My Verifications Tab  
GET /data-verification/my-verifications
```

#### Button Actions & Endpoints
```javascript
// View Details Button (Assignment)
navigation.navigate('VerificationDetails', { 
  verificationId: assignment._id, 
  isAssignment: true 
})

// View Details Button (Verification)
navigation.navigate('VerificationDetails', { 
  verificationId: verification._id, 
  isAssignment: false 
})

// Start Verification Button
navigation.navigate('CreateVerification', { assignment })
```

#### Response Formats
```json
// My Assignments Response
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "assignment_id",
        "organizationName": "Tech Solutions Ltd",
        "targetUserName": "Jane Smith",
        "organizationLocationDetails": [
          {
            "locationType": "headquarters",
            "brandName": "TechSol HQ",
            "country": "Nigeria",
            "state": "Lagos",
            "lga": "Lagos Island",
            "city": "Lagos",
            "cityRegion": "Victoria Island",
            "houseNumber": "123",
            "street": "Broad Street",
            "landmark": "Near First Bank",
            "_id": "location_id"
          }
        ],
        "status": "pending",
        "assignedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}

// My Verifications Response
{
  "success": true,
  "data": {
    "verifications": [
      {
        "_id": "verification_id",
        "verificationId": "VER-2024-001",
        "organizationName": "Tech Solutions Ltd",
        "status": "submitted",
        "createdAt": "2024-01-16T14:20:00Z"
      }
    ]
  }
}
```

---

### 7. Create Verification Screen (5-Step Process)
**File**: `screens/CreateVerificationScreen.js`
**Route**: `CreateVerification`

#### UI Format
- **Header**: Title "Create Verification" with back button
- **Step Indicator**: 5 circular progress indicators with icons
- **Step Content**: Dynamic content based on current step
- **Navigation Footer**: Back/Next buttons, Create button on final step

#### Step 1: Location Selection
**UI Elements**:
- Location cards with organization name, target user, brand name, location type badge
- Selection highlighting
- Location address details

**Data Source**: Assignment data passed from previous screen

#### Step 2: Organization Details Display
**UI Elements**:
- Read-only organization information display
- Location details breakdown
- Full formatted address
- Assignment ID and target user info

**Purpose**: Review and confirm assignment details

#### Step 3: Field Verification Details
**UI Elements**:
- "Organization Claims vs Your Findings" section
- Claimed location card (yellow background)
- Editable input fields for actual findings
- Country, State, LGA, City, City Region inputs
- Headquarters address text area

**Data Flow**: Pre-filled with claimed data, agent can modify

#### Step 4: Building Pictures
**UI Elements**:
- 7 required photo sections:
  - Front View of Building
  - Street Picture  
  - Agent in Front of Building
  - WhatsApp Location Screenshot
  - Inside Organization
  - With Staff or Owner
  - Video with Neighbor
- Camera/Gallery selection for each photo
- Image preview with change option

**Image Handling**:
```javascript
// Camera capture
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: 'Images',
  allowsEditing: false,
  quality: 0.8,
});

// Gallery selection
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'Images', 
  allowsEditing: false,
  quality: 0.8,
});
```

#### Step 5: Transportation Details
**UI Elements**:
- Journey steps (dynamic array)
- Each step: Start point, time, destination, fare, time spent
- Add step button
- Final destination details
- Return journey costs
- Total transportation and other expenses

**Transportation Data Structure**:
```javascript
transportationSteps: [
  {
    startPoint: "Home",
    time: "08:00", 
    nextDestination: "Bus Stop",
    fareSpent: 200,
    timeSpent: "15 minutes"
  }
]
```

#### Form Submission Endpoint
```javascript
// Create verification from assignment
POST /data-verification
```

#### Complete Request Payload
```json
{
  "assignmentId": "assignment_id",
  
  // What field agent actually found
  "country": "Nigeria",
  "state": "Lagos", 
  "lga": "Lagos Island",
  "city": "Lagos",
  "cityRegion": "Victoria Island",
  
  // Organization data (from assignment)
  "organizationId": "org_id",
  "organizationName": "Tech Solutions Ltd",
  "targetUserId": "target_user_id",
  "targetUserFirstName": "Jane",
  "targetUserLastName": "Smith",
  
  // What organization claimed
  "organizationClaimedLocation": {
    "country": "Nigeria",
    "state": "Lagos",
    "lga": "Lagos Island", 
    "city": "Lagos",
    "cityRegion": "Victoria Island",
    "address": "123 Broad Street"
  },
  
  // Organization details
  "organizationDetails": {
    "name": "Tech Solutions Ltd",
    "attachments": [],
    "headquartersAddress": "123 Broad Street, Victoria Island, Lagos",
    "addressAttachments": []
  },
  
  // All building pictures
  "buildingPictures": {
    "frontView": "image_url_or_placeholder",
    "streetPicture": "image_url_or_placeholder", 
    "agentInFrontBuilding": "image_url_or_placeholder",
    "whatsappLocation": "image_url_or_placeholder",
    "insideOrganization": "image_url_or_placeholder",
    "withStaffOrOwner": "image_url_or_placeholder",
    "videoWithNeighbor": "image_url_or_placeholder"
  },
  
  // Transportation cost breakdown
  "transportationCost": {
    "going": [
      {
        "startPoint": "Home",
        "time": "08:00",
        "nextDestination": "Bus Stop", 
        "fareSpent": 200,
        "timeSpent": "15 minutes"
      }
    ],
    "finalDestination": "Tech Solutions Office",
    "finalFareSpent": 500,
    "finalTime": "09:15",
    "totalJourneyTime": "1 hour 15 minutes",
    "comingBack": {
      "totalTransportationCost": 1400,
      "otherExpensesCost": 300,
      "receiptUrl": ""
    }
  }
}
```

---

### 8. Verification Details Screen
**File**: `screens/VerificationDetailsScreen.js`
**Route**: `VerificationDetails`

#### UI Format
- **Header**: Title "Verification Details" with back button
- **Status Card**: Status icon, text, and submission date
- **Organization Information**: Name, target user, email
- **Organization Locations**: Multiple location cards if applicable
- **Organization Details**: Name, type, address, contact person, phone
- **Building Pictures**: Horizontal scroll of photos with labels
- **Transportation Cost**: Amount and description
- **Review Comments**: Admin feedback if available

#### Endpoints Based on Type
```javascript
// For assignments (isAssignment: true)
GET /data-verification/assignments/my
// Find specific assignment by ID

// For verifications (isAssignment: false)  
GET /data-verification/my-verifications
// Find specific verification by ID
```

#### Data Handling
```javascript
if (isAssignment) {
  // Show assignment details
  const foundVerification = response.data.assignments?.find(
    v => v._id === verificationId
  );
} else {
  // Show actual verification details
  const foundVerification = response.data.verifications?.find(
    v => v._id === verificationId
  );
}
```

---

## API ENDPOINTS SUMMARY

### Super Admin Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/super-admin/data-verification/verification-stats` | Get verification statistics |
| GET | `/super-admin/data-verification/verifications` | Get all verifications (with status filter) |
| POST | `/super-admin/data-verification/create-role` | Create verification role and assign organizations |
| GET | `/super-admin/data-verification/users` | Get all users for role assignment |
| GET | `/super-admin/data-verification/organizations` | Get all organizations for assignment |
| GET | `/super-admin/data-verification/verification-users` | Get users with verification roles |
| POST | `/super-admin/data-verification/assign-role/{userId}` | Assign/remove verification role |
| GET | `/super-admin/data-verification/assignments` | Get all organization assignments |
| DELETE | `/super-admin/data-verification/assignments/{assignmentId}` | Delete assignment |
| GET | `/super-admin/data-verification/verifications/{verificationId}` | Get verification details |
| POST | `/super-admin/data-verification/verifications/{verificationId}/review` | Approve/reject verification |

### Field Agent Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/data-verification/assignments/my` | Get my assignments |
| GET | `/data-verification/my-verifications` | Get my verifications |
| POST | `/data-verification` | Create verification from assignment |

---

## STATUS FLOW

### Assignment Status
1. **pending**: Assignment created, waiting for field agent
2. **in_progress**: Field agent started verification process
3. **completed**: Verification submitted by field agent

### Verification Status  
1. **draft**: Verification created but not submitted
2. **submitted**: Verification submitted for review
3. **approved**: Verification approved by super admin
4. **rejected**: Verification rejected by super admin

---

## NAVIGATION FLOW

### Super Admin Flow
```
DataVerificationManagement
├── CreateDataVerificationRole
├── DataVerificationUsers  
├── VerificationAssignments
│   └── AssignmentDetails
└── SuperAdminVerificationDetails
```

### Field Agent Flow
```
FieldAgentVerification
├── VerificationDetails (isAssignment: true/false)
└── CreateVerification (5-step process)
    ├── Step 1: Location Selection
    ├── Step 2: Organization Details
    ├── Step 3: Field Verification
    ├── Step 4: Building Pictures
    └── Step 5: Transportation
```

---

## KEY FEATURES

### Location Data Flattening
Assignments can have multiple locations. The system flattens these for selection:
```javascript
// Original structure
assignment.organizationLocationDetails = [location1, location2, location3]

// Flattened for selection
[
  { ...assignment, selectedLocation: location1, locationIndex: 0 },
  { ...assignment, selectedLocation: location2, locationIndex: 1 },
  { ...assignment, selectedLocation: location3, locationIndex: 2 }
]
```

### Claims vs Reality Tracking
The system tracks both what the organization claims and what the field agent actually finds:
- **organizationClaimedLocation**: From assignment data
- **country, state, lga, city, cityRegion**: What agent actually found (editable)

### Comprehensive Photo Requirements
7 specific photo types required for complete verification:
1. Front View of Building
2. Street Picture
3. Agent in Front of Building  
4. WhatsApp Location Screenshot
5. Inside Organization
6. With Staff or Owner
7. Video with Neighbor

### Detailed Transportation Tracking
- Journey steps with start/end points, times, and costs
- Final destination details
- Return journey costs
- Other expenses tracking
- Receipt URL support

### Error Handling
- Network error handling with automatic URL fallback
- Form validation at each step
- User-friendly error messages
- Loading states and empty states

### Authentication
- Bearer token authentication for all endpoints
- Automatic token inclusion in API calls
- Role-based access control

This documentation provides a complete overview of the data verification system, covering all screens, endpoints, UI formats, and data flows from super admin role creation to field agent verification completion.