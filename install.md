# Quick Installation Guide

## Step-by-Step Installation

### 1. Prepare the Extension Files
- Ensure all files are in the same directory
- The directory should contain:
  - `manifest.json`
  - `background.js`
  - `content.js`
  - `popup.html`
  - `popup.js`
  - `icon.svg` (or converted PNG files)

### 2. Convert Icons (if needed)
If you only have the SVG icon, you'll need to convert it to PNG files:
- Use the included `icon-generator.html` file
- Open it in your browser and download the three icon sizes
- Save as `icon16.png`, `icon48.png`, and `icon128.png`
- Place them in the same directory

### 3. Install in Chrome
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing your extension files
6. The extension should appear in your extensions list

### 4. Configure the Extension
1. Click the extension icon in your Chrome toolbar
2. Enter your QNAP NAS IP address
3. Set the port (default: 8080)
4. Add username/password if needed
5. Click "Save Configuration"
6. Test the connection

### 5. Test the Extension
1. Go to any webpage with magnet links
2. **Right-click on a magnet link** (look for small blue dots)
3. Choose from the context menu:
   - "Send to gigaQNAP Download Station"
   - "Copy Magnet Link"
4. Check your QNAP Download Station for new downloads

## How to Use

### Context Menu Options
- **Right-click on any magnet link** to see the context menu
- **"Send to gigaQNAP Download Station"** - Sends directly to your NAS
- **"Copy Magnet Link"** - Copies the magnet URL to clipboard

### Visual Indicators
- Magnet links will show small **blue dots** to identify them
- Tooltips will appear on hover explaining the right-click options

## Troubleshooting Quick Fixes

- **Extension not loading**: Check that all files are present and `manifest.json` is valid
- **Icons not showing**: Ensure PNG files are named exactly as specified
- **Permission errors**: Check that all required permissions are in `manifest.json`
- **Connection issues**: Verify QNAP IP address and port in configuration
- **Context menu not appearing**: Make sure you're right-clicking on a `magnet:` link
- **No visual indicators**: Refresh the page to re-scan for magnet links

## File Checklist
- [ ] manifest.json
- [ ] background.js
- [ ] content.js
- [ ] popup.html
- [ ] popup.js
- [ ] icon16.png (or use icon-generator.html)
- [ ] icon48.png (or use icon-generator.html)
- [ ] icon128.png (or use icon-generator.html)
- [ ] icon-generator.html
- [ ] README.md
