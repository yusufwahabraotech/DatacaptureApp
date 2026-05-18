# EAS Update Cache Fix Guide

## Problem
When you send an EAS update link to testers, they see cached/old versions of the app even after reloading. This happens because:

1. **EAS Updates are aggressively cached** - The app caches updates locally for performance
2. **Reload doesn't always fetch new updates** - Simple reload uses cached version
3. **Race conditions** - Industries might not load if backend is slow or sleeping

## Solution Implemented

### 1. Automatic Update Check on App Start
The app now automatically checks for updates when it starts:
- Shows "Checking for updates..." loading screen
- Downloads new updates in the background
- Prompts user to restart when update is ready
- Continues with current version if check fails

### 2. Loading UI for Industries
Added comprehensive loading states:
- Spinner in the industry field while loading
- Loading state in the modal
- Retry button if loading fails
- Clear error messages

## How to Use

### For You (Developer):

#### 1. Publish a New Update
```bash
# Make your changes to the code
# Then publish the update
eas update --branch preview --message "Fixed industry loading"
```

#### 2. Test the Update
```bash
# Clear your local cache first
expo start --clear

# Or force reload in Expo Go:
# Shake device → "Reload" → Hold "Reload" → "Clear cache and reload"
```

#### 3. Share the Update Link
```bash
# Get the update link
eas update:view --branch preview

# Share the link with testers
# Example: exp://u.expo.dev/update/[update-id]
```

### For Testers:

#### Method 1: Wait for Automatic Update (Recommended)
1. Open the app
2. Wait for "Checking for updates..." screen
3. If update is found, tap "Restart Now"
4. App will reload with latest version

#### Method 2: Force Clear Cache (If stuck on old version)
**On Expo Go:**
1. Shake your device
2. Tap "Reload"
3. **Hold down** the "Reload" button for 3 seconds
4. Select "Clear cache and reload"

**On Development Build:**
1. Close the app completely
2. Clear app data:
   - **iOS**: Settings → General → iPhone Storage → [App] → Delete App → Reinstall
   - **Android**: Settings → Apps → [App] → Storage → Clear Data
3. Reopen the app

#### Method 3: Manual Reload
1. Shake device (or press Cmd+D on iOS simulator, Cmd+M on Android)
2. Tap "Reload"
3. Wait for industries to load (you'll see a spinner)

## Troubleshooting

### Issue: "Available industries count: 0"
**Cause:** Backend is sleeping (Render free tier) or slow network

**Solution:**
1. Wait 30-60 seconds for backend to wake up
2. Tap the industry field to retry
3. Check internet connection
4. Verify backend is running: https://datacapture-backend.onrender.com/api/auth/industries

### Issue: Still seeing old version after update
**Cause:** Aggressive caching or update not published correctly

**Solution:**
1. Check if update was published:
   ```bash
   eas update:list --branch preview
   ```
2. Verify update ID matches the link you shared
3. Force clear cache (see Method 2 above)
4. Republish update with a new message

### Issue: "Checking for updates..." stuck
**Cause:** Network issue or EAS servers slow

**Solution:**
1. Wait 10 seconds - it will timeout and continue
2. Check internet connection
3. Try again later

## Best Practices

### Before Sending to Testers:
1. ✅ Test the update yourself first
2. ✅ Verify backend is running and has data
3. ✅ Check that `/auth/industries` returns data
4. ✅ Publish update with clear message
5. ✅ Wait 1-2 minutes after publishing before sharing link

### When Testing:
1. ✅ Always wait for "Checking for updates..." to complete
2. ✅ If industries don't load, wait 60 seconds (backend waking up)
3. ✅ Use the retry button if loading fails
4. ✅ Check console logs for errors

### For Production:
1. ✅ Use production backend (not Render free tier)
2. ✅ Set up proper error monitoring
3. ✅ Add analytics to track update adoption
4. ✅ Test updates on staging first

## Technical Details

### Update Check Flow:
```
App Start
  ↓
Check for Updates (expo-updates)
  ↓
Update Available? → Yes → Download → Prompt Restart
  ↓
  No → Continue to App
  ↓
Fetch Industries (if admin signup)
  ↓
Show Loading UI
  ↓
Industries Loaded → Enable Selection
```

### Cache Locations:
- **Expo Go**: `~/.expo/cache/`
- **iOS**: App's Documents directory
- **Android**: App's cache directory

### Update Channels:
- `preview` - For testing with testers
- `production` - For production releases
- `development` - For local development

## Commands Reference

```bash
# Publish update to preview channel
eas update --branch preview --message "Your message"

# View latest updates
eas update:list --branch preview

# View specific update
eas update:view [update-id]

# Delete old updates (if needed)
eas update:delete [update-id]

# Check update configuration
cat eas.json
```

## Monitoring

### Check if update is working:
1. Look for console logs:
   ```
   🔄 Checking for EAS updates...
   ✅ New update available! Downloading...
   ✅ Update downloaded! Reloading app...
   ```

2. Check industries loading:
   ```
   🚨 FETCHING INDUSTRIES 🚨
   ✅ Industries fetched successfully: 3
   ```

3. Verify no errors:
   ```
   ❌ Failed to fetch industries: [error]
   ```

## Additional Resources

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Troubleshooting Updates](https://docs.expo.dev/eas-update/debug/)

## Support

If issues persist:
1. Check backend logs
2. Verify API endpoints are accessible
3. Test with a fresh install
4. Contact Expo support if EAS Updates issue
