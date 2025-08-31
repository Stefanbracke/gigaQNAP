# Troubleshooting Guide

## Context Menu Issues

### Error: "Cannot find menu item with id magnetOptions"

This error occurs when the context menus aren't properly created. Here are the solutions:

#### Solution 1: Refresh Context Menus (Recommended)
1. Click the extension icon in your Chrome toolbar
2. Click the **"Refresh Context Menus"** button
3. Wait for the success message
4. Try right-clicking on a magnet link again

#### Solution 2: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "gigaQNAP Magnet Link Handler"
3. Click the **reload button** (🔄)
4. Wait for the extension to reload
5. Try right-clicking on a magnet link

#### Solution 3: Check Browser Console
1. Right-click on the extension icon → "Inspect popup"
2. Go to the **Console** tab
3. Look for any error messages
4. Check if there are messages about context menu creation

#### Solution 4: Verify Permissions
1. Go to `chrome://extensions/`
2. Find "gigaQNAP Magnet Link Handler"
3. Click **"Details"**
4. Ensure **"Context menus"** permission is enabled
5. If not, enable it and reload the extension

## Common Issues and Solutions

### Context Menu Not Appearing
- **Cause**: Extension not properly loaded or context menus not created
- **Solution**: Use the "Refresh Context Menus" button in the popup

### No Magnet Link Detection
- **Cause**: Content script not running or page not refreshed
- **Solution**: Refresh the webpage after installing the extension

### API Connection Errors
- **Cause**: Incorrect QNAP server IP or port
- **Solution**: Verify server IP and port in the configuration

### Authentication Failures
- **Cause**: Wrong username/password or user permissions
- **Solution**: Check QNAP user credentials and permissions

## Debugging Steps

### Step 1: Check Extension Status
1. Go to `chrome://extensions/`
2. Ensure the extension is **enabled**
3. Check for any error messages

### Step 2: Test Basic Functionality
1. Open the extension popup
2. Verify your QNAP server settings
3. Use "Test Connection" button

### Step 3: Check Context Menus
1. Use "Refresh Context Menus" button
2. Look for success/error messages
3. Check browser console for details

### Step 4: Test on Magnet Links
1. Go to a webpage with magnet links
2. Right-click on a magnet link
3. Look for "gigaQNAP Options" in context menu

## Console Messages to Look For

### Success Messages
- "Context menus refreshed successfully!"
- "Magnet link successfully sent to QNAP directory: [Name]"
- "Connection successful! QNAP server is reachable."

### Error Messages
- "Error creating magnetOptions menu: [details]"
- "Failed to refresh context menus"
- "Connection failed: [details]"

## If Nothing Works

1. **Uninstall and reinstall** the extension
2. **Clear browser cache** and cookies
3. **Restart Chrome** completely
4. **Check QNAP server** is accessible from your network
5. **Verify Download Station V4 API** is working

## Getting Help

If you're still experiencing issues:

1. **Check the browser console** for detailed error messages
2. **Note the exact error messages** you see
3. **Describe what you're trying to do** when the error occurs
4. **Include your QNAP model and firmware version**

## Prevention

To avoid context menu issues in the future:

1. **Always use the "Refresh Context Menus" button** after making configuration changes
2. **Reload the extension** if you make significant changes
3. **Check the console** for any error messages during setup
4. **Test on a simple page** with magnet links first

