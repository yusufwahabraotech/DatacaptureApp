# Additional Data Verification Assignment Screens & Endpoints

## Missing Screens from Main Documentation

### 1. Assignment Details Screen
**File**: `screens/AssignmentDetailsScreen.js`
**Route**: `AssignmentDetails`

#### UI Format
- **Header**: "Assignment Details" with back button
- **Assignment Overview**: Organization, assigned user, target user, status badge
- **Organization Locations**: Multiple location cards with brand name, type badges
- **Location Details**: Address, landmark, building details with icons
- **Actions**: Delete button for pending assignments

#### Endpoint on Page Load
```javascript
GET /super-admin/data-verification/assignments/{assignmentId}
// Called via: ApiService.getVerificationAssignmentDetails(assignmentId)
```

#### Button Actions & Endpoints
```javascript
// Delete Assignment Button
DELETE /super-admin/data-verification/assignments/{assignmentId}
// Called via: ApiService.deleteVerificationAssignment(assignmentId)
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "assignment": {
      "_id": "assignment_id",
      "organizationName": "Tech Solutions Ltd",
      "userName": "John Doe",
      "targetUserName": "Jane Smith",
      "targetUserEmail": "jane@techsolutions.com",
      "status": "pending",
      "assignedAt": "2024-01-15T10:30:00Z",
      "organizationLocationDetails": [
        {
          "brandName": "TechSol HQ",
          "locationType": "headquarters",
          "country": "Nigeria",
          "state": "Lagos",
          "lga": "Lagos Island",
          "city": "Lagos",
          "cityRegion": "Victoria Island",
          "houseNumber": "123",
          "street": "Broad Street",
          "landmark": "Near First Bank",
          "buildingColor": "Blue",
          "buildingType": "Office Complex"
        }
      ]
    }
  }
}
```

---

### 2. Assignment Location Details Screen
**File**: `screens/AssignmentLocationDetailsScreen.js`
**Route**: `AssignmentLocationDetails`

#### UI Format
- **Header**: "Location Details" with back button
- **Assignment Overview**: Organization name, target user, status
- **Locations to Verify**: Detailed location cards with address sections
- **Address Breakdown**: Street address, city/region, country/state/LGA
- **Building Details**: Color, type, landmark information
- **Action Button**: "Start Verification Process" for pending assignments

#### Data Source
- Receives assignment data as route parameter (no API call needed)
- Displays detailed breakdown of location information

#### Button Actions
```javascript
// Start Verification Process Button
navigation.navigate('CreateVerificationFromAssignment', { assignment })
```

---

### 3. My Verification Assignments Screen
**File**: `screens/MyVerificationAssignmentsScreen.js`
**Route**: `MyVerificationAssignments`

#### UI Format
- **Header**: "My Assignments" with back button
- **Assignment Cards**: Organization name, target user, location count
- **Assignment Details**: Location count with icon, assigned date
- **Action Buttons**: "View Locations", "Start Verification" (for pending)

#### Endpoint on Page Load
```javascript
GET /data-verification/assignments/my
// Called via: ApiService.getMyVerificationAssignments()
```

#### Button Actions
```javascript
// View Locations Button
navigation.navigate('AssignmentLocationDetails', { assignment })

// Start Verification Button
navigation.navigate('CreateVerificationFromAssignment', { assignment })
```

---

### 4. Pending Verification Assignments Screen
**File**: `screens/PendingVerificationAssignmentsScreen.js`
**Route**: `PendingVerificationAssignments`

#### UI Format
- **Header**: "Pending Tasks" with back button and list icon
- **Summary Card**: Active tasks count with pending/in-progress breakdown
- **Assignment Cards**: Organization, target user, location count, status
- **Action Buttons**: "View Details", "Start"/"Continue" based on status

#### Endpoint on Page Load
```javascript
GET /data-verification/assignments/pending
// Called via: ApiService.getPendingVerificationAssignments()
```

#### Button Actions
```javascript
// View Details Button
navigation.navigate('AssignmentLocationDetails', { assignment })

// Start/Continue Button
navigation.navigate('CreateVerificationFromAssignment', { assignment })

// Header List Icon
navigation.navigate('MyVerificationAssignments')
```

---

### 5. Create Verification From Assignment Screen
**File**: `screens/CreateVerificationFromAssignmentScreen.js`
**Route**: `CreateVerificationFromAssignment`

#### UI Format
- **Header**: "Create Verification" with back button
- **Assignment Details**: Organization info, target user, location count
- **Organization's Claimed Locations**: Location cards with brand, type, address
- **Start Verification**: Button to create draft verification
- **Footer Note**: Explanation about draft creation

#### Form Submission Endpoint
```javascript
POST /data-verification
// Called via: ApiService.createVerificationFromAssignment(verificationData)
```

#### Request Payload
```json
{
  "assignmentId": "assignment_id",
  "country": "Nigeria",
  "state": "Lagos",
  "lga": "Lagos Island",
  "city": "Lagos",
  "cityRegion": "Victoria Island",
  "organizationId": "org_id",
  "organizationName": "Tech Solutions Ltd",
  "targetUserId": "target_user_id",
  "targetUserFirstName": "Jane",
  "targetUserLastName": "Smith",
  "organizationClaimedLocation": {
    "brandName": "TechSol HQ",
    "locationType": "headquarters",
    "country": "Nigeria",
    "state": "Lagos",
    "lga": "Lagos Island",
    "city": "Lagos",
    "cityRegion": "Victoria Island",
    "houseNumber": "123",
    "street": "Broad Street",
    "landmark": "Near First Bank"
  },
  "organizationDetails": {
    "name": "Tech Solutions Ltd",
    "attachments": [],
    "headquartersAddress": "123 Broad Street, Victoria Island, Lagos",
    "addressAttachments": []
  },
  "buildingPictures": {},
  "transportationCost": {}
}
```

---

### 6. Super Admin Verification Details Screen
**File**: `screens/SuperAdminVerificationDetailsScreen.js`
**Route**: `SuperAdminVerificationDetails`

#### UI Format
- **Header**: "Verification Details" with back button
- **Status Card**: Verification ID, status badge, verifier info, dates
- **Location Information**: Country, state, LGA, city, region in grid format
- **Organization Details**: Name, address, attachments with file links
- **Building Pictures**: Grid layout with image previews and labels
- **Transportation Details**: Journey steps, final destination, return costs
- **Action Buttons**: Approve/Reject for submitted verifications

#### Endpoint on Page Load
```javascript
GET /super-admin/data-verification/verifications/{verificationId}
// Called via: ApiService.getSuperAdminVerificationDetails(verificationId)
```

#### Button Actions & Endpoints
```javascript
// Approve Button
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'approved', comments: 'Verification approved by Super Admin' }

// Reject Button
POST /super-admin/data-verification/verifications/{verificationId}/review
Body: { status: 'rejected', comments: 'Verification rejected by Super Admin' }

// File/Image Links
// Opens external URLs via Linking.openURL(url)
```

---

### 7. Verification Management Screen (Location Verification)
**File**: `screens/VerificationManagementScreen.js`
**Route**: `VerificationManagement`

#### UI Format
- **Header**: "Verification Management" with back button
- **Filter Tabs**: Pending, Rejected, Verified with loading states
- **Verification Cards**: Business type, organization ID, location, fee
- **Location Details**: Address, city region, landmark information
- **Action Buttons**: Approve/Reject for pending, Send Email for rejected
- **Reject Modal**: Text input for rejection reason

#### Endpoints Based on Filter
```javascript
// Pending Filter
GET /super-admin/location-verifications/pending
// Called via: ApiService.getPendingLocationVerifications()

// Rejected Filter
GET /super-admin/location-verifications/rejected
// Called via: ApiService.getRejectedLocationVerifications()

// Verified Filter
GET /super-admin/location-verifications/verified
// Called via: ApiService.getVerifiedLocationVerifications()
```

#### Button Actions & Endpoints
```javascript
// Approve Button
PUT /super-admin/location-verifications/{profileId}/{locationIndex}/approve
// Called via: ApiService.approveLocationVerification(profileId, locationIndex)

// Reject Button (with reason)
PUT /super-admin/location-verifications/{profileId}/{locationIndex}/reject
Body: { reason: "rejection_reason_text" }
// Called via: ApiService.rejectLocationVerification(profileId, locationIndex, reason)

// Send Email Button
POST /super-admin/location-verifications/{profileId}/{locationIndex}/send-rejection-email
// Called via: ApiService.sendLocationRejectionEmail(profileId, locationIndex)
```

---

## Additional API Endpoints Not in Main Documentation

### Assignment Management Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/super-admin/data-verification/assignments/{assignmentId}` | Get specific assignment details |
| GET | `/data-verification/assignments/pending` | Get pending assignments for field agent |
| GET | `/super-admin/location-verifications/pending` | Get pending location verifications |
| GET | `/super-admin/location-verifications/rejected` | Get rejected location verifications |
| GET | `/super-admin/location-verifications/verified` | Get verified location verifications |
| PUT | `/super-admin/location-verifications/{profileId}/{locationIndex}/approve` | Approve location verification |
| PUT | `/super-admin/location-verifications/{profileId}/{locationIndex}/reject` | Reject location verification |
| POST | `/super-admin/location-verifications/{profileId}/{locationIndex}/send-rejection-email` | Send rejection email |

### API Service Methods Not Covered
```javascript
// Assignment Details
static async getVerificationAssignmentDetails(assignmentId)

// Pending Assignments
static async getPendingVerificationAssignments()

// Location Verification Management
static async getPendingLocationVerifications()
static async getRejectedLocationVerifications()
static async getVerifiedLocationVerifications()
static async approveLocationVerification(profileId, locationIndex)
static async rejectLocationVerification(profileId, locationIndex, reason)
static async sendLocationRejectionEmail(profileId, locationIndex)
```

---

## Navigation Flow Updates

### Complete Super Admin Flow
```
DataVerificationManagement
├── CreateDataVerificationRole
├── DataVerificationUsers
├── VerificationAssignments
│   └── AssignmentDetails
├── SuperAdminVerificationDetails
└── VerificationManagement (Location Verification)
```

### Complete Field Agent Flow
```
FieldAgentVerification
├── MyVerificationAssignments
│   └── AssignmentLocationDetails
│       └── CreateVerificationFromAssignment
├── PendingVerificationAssignments
│   └── AssignmentLocationDetails
│       └── CreateVerificationFromAssignment
├── VerificationDetails (isAssignment: true/false)
└── CreateVerification (5-step process)
```

---

## Key Features in Additional Screens

### Assignment Location Flattening
Multiple locations per assignment are displayed individually with detailed breakdowns including:
- Address components (house number, street, city region)
- Geographic hierarchy (city, LGA, state, country)
- Building details (color, type, landmark)
- Location type badges (headquarters vs branch)

### Draft Verification Creation
The `CreateVerificationFromAssignment` screen creates a draft verification that:
- Pre-fills organization and location data from assignment
- Updates assignment status to "in_progress"
- Allows completion later through the full 5-step process

### Location Verification Management
Separate from data verification, handles organization location verification with:
- Three-state filtering (pending, rejected, verified)
- Email notification system for rejections
- Fee display and approval workflow

### Enhanced Assignment Views
- Detailed location breakdowns with icons and formatting
- Status-based action buttons (Start vs Continue)
- Summary cards showing task counts and breakdowns
- Comprehensive address display with landmarks and building details

This documentation covers all the assignment-related screens and endpoints that were missing from the main documentation, providing complete coverage of the data verification system.