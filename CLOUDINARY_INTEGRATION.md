# Cloudinary Integration Guide for React Native Frontend

## Overview
This guide explains how to integrate Cloudinary image uploads in the DataCapturingApp React Native frontend for AI body measurement functionality.

## Prerequisites
- Cloudinary account (free tier available)
- React Native app with Expo
- Image picker functionality (expo-image-picker)

## 1. Cloudinary Account Setup

### Step 1: Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Note your **Cloud Name** from the dashboard

### Step 2: Create Upload Preset
1. Go to **Settings** → **Upload**
2. Click **Add upload preset**
3. Configure preset:
   - **Preset name**: `vestradat_preset` (or your preferred name)
   - **Signing Mode**: **Unsigned** (important!)
   - **Use filename**: `false`
   - **Unique filename**: `false`
   - **Use filename as display name**: `true`
   - **Asset folder**: `AI_BODY_SCAN` (optional, for organization)
4. Click **Save**

## 2. Frontend Implementation

### API Service Integration

Add this method to your `services/api.js`:

```javascript
// CLOUDINARY DIRECT UPLOAD
static async uploadToCloudinary(imageUri) {
  console.log('🚨 CLOUDINARY UPLOAD START 🚨');
  console.log('Image URI:', imageUri);
  
  try {
    const formData = new FormData();
    
    // Extract file extension and create unique filename
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const fileName = `measurement-${Date.now()}.${fileExtension}`;
    
    // Append file to FormData
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileExtension}`,
      name: fileName,
    });
    
    // Use your upload preset name
    formData.append('upload_preset', 'vestradat_preset');
    
    console.log('FormData created with file:', fileName);
    console.log('Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Cloudinary response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('❌ Cloudinary error response:', errorText);
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    console.log('Cloudinary response:', JSON.stringify(result, null, 2));
    
    if (result.secure_url) {
      console.log('✅ Upload successful:', result.secure_url);
      return result.secure_url;
    } else {
      console.log('❌ No secure_url in response');
      throw new Error('No secure_url in Cloudinary response');
    }
  } catch (error) {
    console.log('❌ Cloudinary upload error:', error);
    console.log('Error details:', error.message);
    throw error;
  }
}
```

### Screen Implementation

In your measurement screen (e.g., `TakeNewMeasurementScreen.js`):

```javascript
const handleAIScan = async () => {
  // Validation checks...
  
  setIsProcessing(true);
  startAnimations();
  
  try {
    console.log('🚨 CLOUDINARY UPLOAD DEBUG 🚨');
    console.log('Front image URI:', frontImage);
    console.log('Side image URI:', sideImage);
    
    // Upload images to Cloudinary
    console.log('Uploading front image...');
    const frontImageUrl = await ApiService.uploadToCloudinary(frontImage);
    console.log('Front image uploaded:', frontImageUrl);
    
    console.log('Uploading side image...');
    const sideImageUrl = await ApiService.uploadToCloudinary(sideImage);
    console.log('Side image uploaded:', sideImageUrl);
    
    if (!frontImageUrl || !sideImageUrl) {
      Alert.alert('Upload Failed', 'Failed to upload images to Cloudinary. Please try again.');
      return;
    }
    
    // Prepare data for backend
    const requestData = {
      frontImageUrl,
      sideImageUrl,
      userHeight: parseInt(userHeight),
      scanTimestamp: new Date().toISOString(),
      firstName: firstName,
      lastName: lastName,
      subject: whoseMeasurement === 'Self' ? 'Self measurement' : 'Other measurement'
    };

    console.log('🚨 AI SCAN REQUEST DATA 🚨');
    console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

    // Send to backend for AI processing
    const response = await ApiService.scanMeasurement(requestData);
    
    if (response.success) {
      setAiResults(response.data);
      setShowResultModal(true);
    } else {
      Alert.alert('Scan Failed', response.message || 'AI service unavailable');
    }
  } catch (error) {
    console.log('AI scan error:', error);
    Alert.alert('Connection Error', 'Unable to connect to AI service');
  } finally {
    setIsProcessing(false);
    stopAnimations();
  }
};
```

## 3. Configuration Variables

### Update These Values:
1. **Cloud Name**: Replace `YOUR_CLOUD_NAME` with your actual Cloudinary cloud name
2. **Upload Preset**: Use the preset name you created (e.g., `vestradat_preset`)
3. **Asset Folder**: Optional, set in preset configuration

### Current Configuration:
```javascript
// In api.js
const CLOUDINARY_CLOUD_NAME = 'disz21zwr';  // Replace with yours
const UPLOAD_PRESET = 'vestradat_preset';   // Replace with yours
```

## 4. Image Picker Configuration

Ensure your image picker is configured for optimal uploads:

```javascript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.7,        // Compress to reduce upload time
  maxWidth: 1024,      // Limit dimensions
  maxHeight: 1024,     // Limit dimensions
});
```

## 5. Error Handling

### Common Errors and Solutions:

**"Upload preset not found"**
- Solution: Create the upload preset in Cloudinary dashboard
- Ensure preset name matches exactly

**"Invalid cloud name"**
- Solution: Check your cloud name in Cloudinary dashboard
- Update the URL in your code

**"Network timeout"**
- Solution: Check internet connection
- Reduce image quality/size

**"Unsigned upload not allowed"**
- Solution: Set upload preset to "Unsigned" mode

## 6. Testing

### Debug Logs to Monitor:
```
🚨 CLOUDINARY UPLOAD START 🚨
FormData created with file: measurement-1234567890.jpg
Uploading to Cloudinary...
Cloudinary response status: 200
✅ Upload successful: https://res.cloudinary.com/...
```

### Test Flow:
1. Select images using image picker
2. Check console logs for upload progress
3. Verify secure URLs are returned
4. Confirm backend receives URLs correctly

## 7. Security Considerations

### Unsigned Uploads:
- ✅ **Pros**: No API keys in frontend code
- ⚠️ **Cons**: Anyone can upload to your account
- 🛡️ **Mitigation**: Set upload restrictions in preset

### Recommended Preset Settings:
- **Resource Type**: `image`
- **Allowed Formats**: `jpg,png,jpeg`
- **Max File Size**: `10MB`
- **Max Image Width/Height**: `2048px`

## 8. Backend Integration

Your backend should expect this payload structure:

```json
{
  "frontImageUrl": "https://res.cloudinary.com/disz21zwr/image/upload/v123/front.jpg",
  "sideImageUrl": "https://res.cloudinary.com/disz21zwr/image/upload/v123/side.jpg",
  "userHeight": 175,
  "scanTimestamp": "2024-01-15T10:30:00.000Z",
  "firstName": "John",
  "lastName": "Doe",
  "subject": "Self measurement"
}
```

## 9. Troubleshooting

### Check These If Upload Fails:
1. **Internet Connection**: Ensure device has internet access
2. **Cloud Name**: Verify it matches your Cloudinary account
3. **Preset Name**: Ensure it exists and is spelled correctly
4. **Preset Mode**: Must be set to "Unsigned"
5. **Image Format**: Ensure it's a supported format (jpg, png)
6. **File Size**: Check if image is too large

### Debug Commands:
```javascript
// Test upload directly
const testUrl = await ApiService.uploadToCloudinary(imageUri);
console.log('Test upload result:', testUrl);
```

## 10. Production Checklist

- [ ] Cloudinary account created
- [ ] Upload preset configured as "Unsigned"
- [ ] Cloud name updated in code
- [ ] Preset name updated in code
- [ ] Error handling implemented
- [ ] Image compression configured
- [ ] Upload restrictions set
- [ ] Backend integration tested
- [ ] End-to-end flow tested

## Support

For issues:
1. Check Cloudinary dashboard for upload logs
2. Monitor React Native console for error messages
3. Verify network connectivity
4. Test with different image formats/sizes

---

**Note**: This implementation uses direct frontend-to-Cloudinary uploads for optimal performance and reduced backend load. The backend receives clean image URLs for AI processing.