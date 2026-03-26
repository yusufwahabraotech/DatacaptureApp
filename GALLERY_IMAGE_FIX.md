# Gallery Image Display Fix

## Issues Identified

1. **Image Upload Process**: Images may not be uploading correctly to the server
2. **API Response Structure**: Backend may not be returning imageUrl in expected format
3. **Image URL Storage**: Database may not be storing image URLs correctly

## Debugging Steps

### 1. Check API Response Structure
Add debugging to see what the backend is actually returning:

```javascript
// In GalleryManagementScreen.js - fetchGalleryItems function
const fetchGalleryItems = async () => {
  try {
    const result = await ApiService.getGalleryItems(filters);
    if (result.success) {
      console.log('🚨 GALLERY ITEMS DEBUG 🚨');
      console.log('Full API response:', JSON.stringify(result, null, 2));
      
      // Check each item's image data
      result.data.items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item._id,
          name: item.name,
          imageUrl: item.imageUrl,
          image: item.image,
          images: item.images,
          hasImage: !!item.imageUrl
        });
      });
      
      setGalleryItems(result.data.items);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch gallery items');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

### 2. Check Image Upload Process
Add debugging to the image upload in CreateGalleryItemScreen.js:

```javascript
// In createGalleryItem function, after the API call
const result = await ApiService.createGalleryItem(payload, selectedImages[0], subServiceImages);

console.log('🚨 GALLERY CREATION RESULT 🚨');
console.log('Success:', result.success);
console.log('Created item:', JSON.stringify(result.data, null, 2));

if (result.success && result.data.galleryItem) {
  console.log('Created item image URL:', result.data.galleryItem.imageUrl);
}
```

### 3. Backend API Endpoint Check
Verify the backend is handling image uploads correctly by checking:

1. **Image Upload Endpoint**: `/admin/gallery` (POST)
2. **Image Retrieval Endpoint**: `/admin/gallery` (GET)
3. **Image Storage**: Cloudinary or local storage

### 4. Fix Image Display Logic
Update the image display logic to handle multiple possible image field names:

```javascript
// In GalleryManagementScreen.js - renderGalleryItem
const getImageUrl = (item) => {
  return item.imageUrl || 
         item.image || 
         (item.images && item.images.main) || 
         (item.images && item.images[0]) ||
         null;
};

const renderGalleryItem = ({ item }) => {
  const imageUrl = getImageUrl(item);
  
  return (
    <View style={styles.itemCard}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.itemImage}
          onError={(error) => {
            console.log('Image load error for item:', item._id);
            console.log('Image URL:', imageUrl);
            console.log('Error:', error.nativeEvent.error);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
          }}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      )}
      {/* Rest of the item content */}
    </View>
  );
};
```

## Backend Fixes Needed

### 1. Image Upload Endpoint
Ensure the backend `/admin/gallery` POST endpoint:
- Properly handles FormData with image files
- Uploads images to Cloudinary or storage service
- Returns the image URL in the response
- Saves the image URL to the database

### 2. Image Retrieval Endpoint
Ensure the backend `/admin/gallery` GET endpoint:
- Returns items with proper image URLs
- Includes all image-related fields in the response

### 3. Database Schema
Verify the gallery item schema includes:
```javascript
{
  imageUrl: String,        // Main image URL
  images: [String],        // Array of image URLs
  subServices: [{
    uploadPicture: String  // Sub-service image URL
  }]
}
```

## Testing Steps

1. **Create a new gallery item** with an image
2. **Check browser network tab** to see if image upload succeeds
3. **Check database** to verify image URL is saved
4. **Refresh gallery management screen** to see if image displays
5. **Check public product details** to verify image shows for users

## Quick Fix Implementation

If the backend is working correctly, the issue might be in the frontend image display logic. Try this immediate fix:

```javascript
// Add this to both GalleryManagementScreen.js and ProductDetailsScreen.js
const ImageWithFallback = ({ imageUrl, style, placeholder }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!imageUrl || imageError) {
    return placeholder;
  }
  
  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={(error) => {
        console.log('Image failed to load:', imageUrl);
        console.log('Error:', error.nativeEvent.error);
        setImageError(true);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', imageUrl);
      }}
    />
  );
};
```

Then use it like:
```javascript
<ImageWithFallback
  imageUrl={item.imageUrl}
  style={styles.itemImage}
  placeholder={
    <View style={styles.placeholderImage}>
      <Ionicons name="image-outline" size={40} color="#ccc" />
    </View>
  }
/>
```