# gigaQNAP - A smart Magnet Link Handler Chrome Extension

A Chrome extension that provides right-click context menu options for magnet links, allowing you to send them directly to specific directories on your QNAP NAS Download Station or copy them to clipboard.

## Features

- 🔗 **Context Menu Integration**: Right-click on magnet links for options
- 🚀 **Directory Selection**: Choose from multiple configured download locations
- 📁 **Custom Directories**: Configure your own QNAP download directories
- 📋 **Copy to Clipboard**: Copy magnet links for manual use
- ⚙️ **Configurable**: Easy configuration for server IP, port, and authentication
- 🔒 **Secure**: Optional username/password authentication
- 🎨 **User Friendly**: Clean, modern interface with visual indicators
- 👁️ **Visual Indicators**: Small blue dots show which links are magnet links
- 📊 **Task Monitoring**: Query current download tasks from QNAP

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now appear in your extensions list

### Method 2: Pack Extension (For Distribution)

1. In `chrome://extensions/`, click "Pack extension"
2. Select the extension directory
3. This will create a `.crx` file that can be installed

## How to Use

1. **Navigate to any webpage** containing magnet links
2. **Look for small blue dots** on magnet links
3. **Right-click** on a magnet link
4. **Choose from the context menu**:
   - **"Download to: [Directory Name]"** - Downloads to specific QNAP folder
   - **"Copy Magnet Link"** - Copies the magnet URL to clipboard
5. **Get feedback** via notifications and clipboard confirmations

## Configuration

### Basic Settings
1. Click on the extension icon in your Chrome toolbar
2. Enter your QNAP NAS IP address (e.g., `172.28.1.250`)
3. Set the port (default: `8080`)
4. Optionally enter username and password if authentication is required
5. Choose whether to enable automatic sending to QNAP
6. Click "Save Configuration"

### Download Directories
1. **Add directories** using the "+ Add Directory" button
2. **Set directory name** (e.g., "Movies", "TV Shows", "Downloads")
3. **Set folder name** (e.g., "Movies", "TV", "Download") - this is the actual folder name on QNAP
4. **Remove directories** using the × button if needed
5. **Save changes** - they're automatically applied

### Default Directories
The extension comes with two default directories:
- **Downloads**: `Download` - General downloads (TEMP folder)
- **Movies**: `Movies` - Movie files

## QNAP API Integration

This extension uses the **QNAP Download Station V4 API**:

### API Endpoints
- **Add URL**: `POST /downloadstation/V4/Task/AddUrl`
- **Query Tasks**: `GET /downloadstation/V4/Task/Query`

### API Parameters
When sending magnet links, the extension sends:
- **`sid`**: Unique session ID (auto-generated)
- **`temp`**: Temporary folder (always "Download")
- **`move`**: Target folder from your configuration
- **`url`**: The magnet link URL

### Example API Call
```
POST http://172.28.1.250:8080/downloadstation/V4/Task/AddUrl
Content-Type: application/x-www-form-urlencoded

sid=sid_abc123_1234567890
temp=Download
move=Movies
url=magnet:?xt=urn:btih:...
```

## How It Works

1. **Detection**: The extension scans web pages for links starting with `magnet:`
2. **Visual Indicators**: Small blue dots appear on magnet links
3. **Context Menu**: Right-click reveals options for each magnet link
4. **Directory Selection**: Choose specific download location on your QNAP
5. **API Integration**: Magnet link sent to QNAP Download Station V4 API with target directory
6. **Feedback**: Get success/error notifications and clipboard confirmations

## QNAP Server Requirements

- QNAP NAS with Download Station app installed
- Download Station must support V4 API
- The default port is usually 8080, but may vary
- Ensure your NAS is accessible from your local network
- Download Station must support destination directory specification

## Directory Configuration Examples

Common QNAP folder names you might use:
- `Download` - Default download folder (TEMP)
- `Movies` - Movie collection
- `TV` - TV show collection
- `Music` - Music collection
- `Books` - E-book collection
- `Software` - Software downloads

**Note**: Use folder names (not full paths) as the API expects just the folder name.

## Testing and Monitoring

### Test Connection
- Use the "Test Connection" button to verify QNAP server accessibility
- Tests the `/downloadstation/V4/Task/Query` endpoint

### Query Current Tasks
- Use the "Query Current Tasks" button to see active downloads
- Displays current download tasks in the browser console
- Useful for debugging and monitoring

## Troubleshooting

### Connection Issues
- Verify your QNAP NAS IP address is correct
- Check if Download Station is running and accessible
- Ensure your firewall allows connections to the specified port
- Try the "Test Connection" button to diagnose issues

### Authentication Issues
- Verify username and password are correct
- Check if your QNAP user has permission to access Download Station
- Ensure the user account is not locked or expired

### Extension Not Working
- Check the browser console for error messages
- Verify the extension is enabled in `chrome://extensions/`
- Try refreshing the webpage after installing the extension
- Check if the extension has the necessary permissions

### Context Menu Not Appearing
- Ensure you're right-clicking on a link that starts with `magnet:`
- Check that the extension is properly loaded
- Try refreshing the page to re-scan for magnet links

### Directory Issues
- Verify folder names are correct and exist on QNAP
- Check that Download Station V4 API supports destination specification
- Ensure your user has write permissions to target folders
- Use simple folder names like "Movies", "TV", etc.

### API Issues
- Check browser console for API request/response details
- Verify the V4 API endpoints are accessible
- Ensure proper authentication if required
- Check QNAP Download Station logs for errors

## File Structure

```
gigaQNAP-magnet-handler/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for webpage interaction
├── popup.html            # Configuration popup interface
├── popup.js              # Popup functionality
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
├── icon-generator.html   # Tool to generate PNG icons
└── README.md             # This file
```

## Technical Details

- **Manifest Version**: 3 (Latest Chrome extension standard)
- **Permissions**: 
  - `activeTab`: Access to current tab
  - `storage`: Save configuration data
  - `webRequest`: Intercept network requests
  - `contextMenus`: Create right-click menu options
- **Content Scripts**: Automatically injected into all web pages
- **Background Script**: Handles context menu creation and QNAP API communication
- **Dynamic Menus**: Context menus update automatically when directories change
- **API Integration**: Uses QNAP Download Station V4 API with proper parameters

## Security Notes

- The extension only processes magnet links (URLs starting with `magnet:`)
- Configuration data is stored locally in Chrome's sync storage
- No data is sent to external servers except your configured QNAP NAS
- Authentication credentials are stored locally and only sent to your NAS
- Context menu only appears on magnet links, not on other content
- Directory paths are validated before sending to QNAP
- Session IDs are generated locally for each request

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension.

## License

This project is open source and available under the MIT License.

## About me
Hello, i am Stefan Bracke, born in 1969 in Belgium.
If you like this extension, please throw me a star on github.
I am available on github and linkedin.
Thank you for your support!

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your QNAP NAS configuration
4. Ensure Download Station V4 API is accessible
5. Check that target directories exist and are writable
6. Use the "Query Current Tasks" button for debugging
