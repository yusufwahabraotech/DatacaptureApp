# Enhanced Bulk Service Provider Assignment API

## Overview
The bulk service provider assignment endpoint has been enhanced to include fee information for each assigned service provider. This allows administrators to set compensation details during the assignment process.

## API Endpoint
```
POST /service-provider-assignment/assign
```

## Enhanced Payload Structure

### Basic Structure
```json
{
  "userAssignments": [
    {
      "userId": "string",
      "isServiceProvider": boolean,
      "serviceProviderFee": {
        "name": "string",
        "description": "string", 
        "amount": number,
        "frequency": "string"
      }
    }
  ]
}
```

### Field Descriptions

#### userAssignments (Array)
- **userId** (string, required): The unique identifier of the user
- **isServiceProvider** (boolean, required): 
  - `true` to assign service provider role
  - `false` to remove service provider role
- **serviceProviderFee** (object, optional): Fee structure for the service provider

#### serviceProviderFee Object
- **name** (string, required): Display name for the fee structure
- **description** (string, required): Detailed explanation of the fee
- **amount** (number, required): Numeric fee amount
- **frequency** (string, required): Payment frequency (flexible string value)

### Frequency Options
The frequency field accepts any string value. Common examples include:
- `"hourly"`
- `"daily"`
- `"weekly"`
- `"monthly"`
- `"per project"`
- `"per task"`
- `"per delivery"`
- `"commission"`
- `"quarterly"`
- `"annually"`
- Any custom frequency as needed

## Usage Examples

### 1. Assign Multiple Users with Different Fee Structures
```json
{
  "userAssignments": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "isServiceProvider": true,
      "serviceProviderFee": {
        "name": "Standard Hourly Rate",
        "description": "Basic hourly compensation for general service tasks",
        "amount": 2500,
        "frequency": "hourly"
      }
    },
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "isServiceProvider": true,
      "serviceProviderFee": {
        "name": "Project-Based Fee",
        "description": "Fixed payment per completed project",
        "amount": 50000,
        "frequency": "per project"
      }
    },
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
      "isServiceProvider": true,
      "serviceProviderFee": {
        "name": "Monthly Retainer",
        "description": "Monthly payment for dedicated service providers",
        "amount": 150000,
        "frequency": "monthly"
      }
    }
  ]
}
```

### 2. Assign with Commission-Based Fee
```json
{
  "userAssignments": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
      "isServiceProvider": true,
      "serviceProviderFee": {
        "name": "Sales Commission",
        "description": "10% commission on successful sales transactions",
        "amount": 10,
        "frequency": "commission"
      }
    }
  ]
}
```

### 3. Remove Service Provider Role
```json
{
  "userAssignments": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "isServiceProvider": false
    }
  ]
}
```
*Note: When removing service provider role, the serviceProviderFee object is ignored.*

## Frontend Implementation

### React Native API Call
```javascript
import ApiService from '../services/api';

const assignServiceProvidersWithFee = async (selectedUsers, feeData) => {
  const assignmentData = {
    userAssignments: selectedUsers.map(userId => ({
      userId: userId,
      isServiceProvider: true,
      serviceProviderFee: {
        name: feeData.name,
        description: feeData.description,
        amount: parseFloat(feeData.amount),
        frequency: feeData.frequency
      }
    }))
  };

  try {
    const response = await ApiService.bulkAssignServiceProviders(assignmentData);
    
    if (response.success) {
      console.log('Service providers assigned successfully');
      return response;
    } else {
      console.error('Assignment failed:', response.message);
      return response;
    }
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

### Frequency Dropdown Options
```javascript
const frequencyOptions = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Per Project', value: 'per project' },
  { label: 'Per Task', value: 'per task' },
  { label: 'Per Delivery', value: 'per delivery' },
  { label: 'Commission Based', value: 'commission' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Annually', value: 'annually' },
];
```

## Backend Considerations

### Database Schema Updates
The backend should be updated to store the fee information:

```javascript
// Service Provider Fee Schema
{
  userId: ObjectId,
  serviceProviderFee: {
    name: String,
    description: String,
    amount: Number,
    frequency: String,
    createdAt: Date,
    updatedAt: Date
  },
  isActive: Boolean,
  assignedBy: ObjectId,
  assignedAt: Date
}
```

### Validation Rules
- **name**: Required, minimum 3 characters, maximum 100 characters
- **description**: Required, minimum 10 characters, maximum 500 characters
- **amount**: Required, must be a positive number
- **frequency**: Required, any non-empty string
- **userId**: Must be a valid user ID
- **isServiceProvider**: Must be boolean

### Response Format
```json
{
  "success": true,
  "message": "Successfully assigned 3 service provider(s) with fee structures",
  "data": {
    "assignedCount": 3,
    "assignments": [
      {
        "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
        "userName": "John Doe",
        "feeStructure": {
          "name": "Standard Hourly Rate",
          "amount": 2500,
          "frequency": "hourly"
        },
        "assignedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

## Key Benefits

1. **Comprehensive Assignment**: Assign users and set their compensation in one API call
2. **Flexible Frequency**: Support for any payment frequency without backend constraints
3. **Bulk Operations**: Handle multiple users with different fee structures efficiently
4. **Audit Trail**: Track when fees were set and by whom
5. **Consistent Data**: Ensure fee information is always associated with service provider assignments

## Migration Notes

- Existing assignments without fee information should continue to work
- The `serviceProviderFee` object is optional for backward compatibility
- Frontend should handle both old and new response formats during transition period