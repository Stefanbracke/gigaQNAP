// Background service worker for handling magnet links

// Track created context menu IDs
let createdMenuIds = new Set();

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, creating context menus...');
  createContextMenus();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, setting up...');
  // Set default configuration
  chrome.storage.sync.set({
    qnapServer: '172.28.1.250',
    qnapPort: '8080',
    qnapUsername: '',
    qnapPassword: '',
    autoSend: true,
    downloadDirectories: [
      { name: 'Downloads', path: 'Download' },
      { name: 'Movies', path: 'Movies' }
    ]
  }, () => {
    console.log('Default configuration set, creating context menus...');
    createContextMenus();
  });
});

// Function to verify context menus are created
function verifyContextMenus() {
  console.log('Verifying context menus...');
  console.log('Tracked menu IDs:', Array.from(createdMenuIds));
  
  if (createdMenuIds.size === 0) {
    console.log('No context menus tracked, attempting to create them...');
    createContextMenus();
    return;
  }
  
  // Check if main menu exists by trying to update it
  chrome.contextMenus.update('magnetOptions', {}, (success) => {
    if (chrome.runtime.lastError) {
      console.error('magnetOptions menu not found:', chrome.runtime.lastError.message);
      console.log('Attempting to recreate context menus...');
      createdMenuIds.clear(); // Clear tracked IDs
      setTimeout(createContextMenus, 100);
    } else {
      console.log('magnetOptions menu exists and is working');
      
      // Check if copy menu exists
      chrome.contextMenus.update('copyMagnetLink', {}, (copySuccess) => {
        if (chrome.runtime.lastError) {
          console.error('copyMagnetLink menu not found:', chrome.runtime.lastError.message);
        } else {
          console.log('copyMagnetLink menu exists and is working');
        }
      });
      
      // Check if direct copy menu exists
      chrome.contextMenus.update('copyMagnetLinkDirect', {}, (copyDirectSuccess) => {
        if (chrome.runtime.lastError) {
          console.error('copyMagnetLinkDirect menu not found:', chrome.runtime.lastError.message);
        } else {
          console.log('copyMagnetLinkDirect menu exists and is working');
        }
      });
      
      console.log(`Successfully verified ${createdMenuIds.size} context menus`);
    }
  });
}

// Function to create context menus
function createContextMenus() {
  console.log('Starting context menu creation...');
  
  // Check if contextMenus API is available
  if (!chrome.contextMenus) {
    console.error('Context menus API not available!');
    return;
  }
  
  // Remove existing context menus first
  chrome.contextMenus.removeAll(() => {
    try {
      console.log('Existing menus removed, creating new ones...');
      
      // Create main context menu for magnet links
      chrome.contextMenus.create({
        id: 'magnetOptions',
        title: 'gigaQNAP Options',
        contexts: ['link'],
        targetUrlPatterns: ['magnet:*']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating magnetOptions menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
          return;
        }
        
        console.log('magnetOptions menu created successfully');
        
        // Create copy option
        chrome.contextMenus.create({
          id: 'copyMagnetLink',
          title: 'Copy Magnet Link',
          contexts: ['link'],
          targetUrlPatterns: ['magnet:*'],
          parentId: 'magnetOptions'
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error creating copyMagnetLink menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
            return;
          }
          
          console.log('copyMagnetLink menu created successfully');
          
          // Create separator
          chrome.contextMenus.create({
            id: 'separator1',
            type: 'separator',
            contexts: ['link'],
            targetUrlPatterns: ['magnet:*'],
            parentId: 'magnetOptions'
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error creating separator:', chrome.runtime.lastError.message || chrome.runtime.lastError);
              return;
            }
            
            console.log('Separator created successfully');
            
            // Create directory options
            createDirectoryMenus();
          });
        });
      });
      
      // Create individual menu items directly (no parent menu)
      // This will create a cleaner two-level structure
      
      // Create copy option directly
      chrome.contextMenus.create({
        id: 'copyMagnetLinkDirect',
        title: 'Copy Magnet Link',
        contexts: ['link']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating copyMagnetLinkDirect menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
        } else {
          console.log('copyMagnetLinkDirect menu created successfully');
          createdMenuIds.add('copyMagnetLinkDirect');
        }
      });
      
      // Create directory options directly
      createDirectoryMenusDirect();
      
      // Verify menus after creation
      setTimeout(() => {
        verifyContextMenus();
      }, 500);
      
    } catch (error) {
      console.error('Error in createContextMenus:', error);
    }
  });
}

// Function to create directory-specific context menus
function createDirectoryMenus() {
  console.log('Creating directory menus...');
  
  chrome.storage.sync.get(['downloadDirectories'], function(items) {
    try {
      const directories = items.downloadDirectories || [];
      console.log('Found directories:', directories);
      
      directories.forEach((dir, index) => {
        if (dir.name && dir.path) {
          console.log(`Creating menu for directory ${index}: ${dir.name} -> ${dir.path}`);
          
          chrome.contextMenus.create({
            id: `sendToDirectory_${index}`,
            title: `Download to: ${dir.name}`,
            contexts: ['link'],
            targetUrlPatterns: ['magnet:*'],
            parentId: 'magnetOptions'
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating directory menu ${index}:`, chrome.runtime.lastError.message || chrome.runtime.lastError);
            } else {
              console.log(`Directory menu ${index} created successfully`);
              createdMenuIds.add(`sendToDirectory_${index}`);
            }
          });
        } else {
          console.warn(`Skipping directory ${index}: name=${dir.name}, path=${dir.path}`);
        }
      });
      
      console.log('Directory menu creation completed');
    } catch (error) {
      console.error('Error in createDirectoryMenus:', error);
    }
  });
}

// Function to create directory-specific context menus directly (no parent menu)
function createDirectoryMenusDirect() {
  console.log('Creating directory menus directly...');
  
  chrome.storage.sync.get(['downloadDirectories'], function(items) {
    try {
      const directories = items.downloadDirectories || [];
      console.log('Found directories for direct menus:', directories);
      
      directories.forEach((dir, index) => {
        if (dir.name && dir.path) {
          console.log(`Creating direct menu for directory ${index}: ${dir.name} -> ${dir.path}`);
          
          chrome.contextMenus.create({
            id: `sendToDirectoryDirect_${index}`,
            title: `Download to: ${dir.name}`,
            contexts: ['link']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating direct directory menu ${index}:`, chrome.runtime.lastError.message || chrome.runtime.lastError);
            } else {
              console.log(`Direct directory menu ${index} created successfully`);
              createdMenuIds.add(`sendToDirectoryDirect_${index}`);
            }
          });
        } else {
          console.warn(`Skipping direct directory ${index}: name=${dir.name}, path=${dir.path}`);
        }
      });
      
      console.log('Direct directory menu creation completed');
      
      // Create a debug menu that appears on all pages
      createDebugMenu();
    } catch (error) {
      console.error('Error in createDirectoryMenusDirect:', error);
    }
  });
}



// Function to create a debug menu that appears on all pages
function createDebugMenu() {
  console.log('Creating debug menu...');
  
  chrome.contextMenus.create({
    id: 'debugMenu',
    title: '🔧 Debug Menu',
    contexts: ['all']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error creating debug menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
    } else {
      console.log('Debug menu created successfully');
      createdMenuIds.add('debugMenu');
      
      // Create debug subitems
      chrome.contextMenus.create({
        id: 'debugInfo',
        title: 'Show Debug Info',
        contexts: ['all'],
        parentId: 'debugMenu'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating debugInfo menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
        } else {
          console.log('debugInfo menu created successfully');
          createdMenuIds.add('debugInfo');
        }
      });
      
      chrome.contextMenus.create({
        id: 'debugRefresh',
        title: 'Refresh Context Menus',
        contexts: ['all'],
        parentId: 'debugMenu'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating debugRefresh menu:', chrome.runtime.lastError.message || chrome.runtime.lastError);
        } else {
          console.log('debugRefresh menu created successfully');
          createdMenuIds.add('debugRefresh');
        }
      });
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    console.log('Context menu clicked:', info.menuItemId, 'on link:', info.linkUrl);
    
    if (info.menuItemId === 'copyMagnetLink') {
      copyMagnetLinkToClipboard(info.linkUrl, tab.id);
    } else if (info.menuItemId === 'copyMagnetLinkDirect') {
      copyMagnetLinkToClipboard(info.linkUrl, tab.id);
    } else if (info.menuItemId.startsWith('sendToDirectory_')) {
      const index = parseInt(info.menuItemId.split('_')[1]);
      sendToSpecificDirectory(info.linkUrl, tab.url, index);
    } else if (info.menuItemId.startsWith('sendToDirectoryDirect_')) {
      const index = parseInt(info.menuItemId.split('_')[1]);
      sendToSpecificDirectory(info.linkUrl, tab.url, index);
    } else if (info.menuItemId === 'debugInfo') {
      console.log('Debug info requested');
      console.log('Current tracked menu IDs:', Array.from(createdMenuIds));
      console.log('Current tab info:', tab);
      // Show debug info in badge
      chrome.action.setBadgeText({ text: 'i', tabId: tab.id });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }, 2000);
    } else if (info.menuItemId === 'debugRefresh') {
      console.log('Debug refresh requested');
      createContextMenus();
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
});

// Function to copy magnet link to clipboard
async function copyMagnetLinkToClipboard(magnetUrl, tabId) {
  try {
    // Send message to content script to copy to clipboard
    await chrome.tabs.sendMessage(tabId, {
      action: 'copyToClipboard',
      text: magnetUrl
    });
    
    // Show notification
    chrome.action.setBadgeText({ text: '✓', tabId: tabId });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }, 2000);
  } catch (error) {
    console.error('Failed to copy magnet link:', error);
  }
}

// Function to generate a random session ID
function generateSessionId() {
  return 'sid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Function to send magnet link to specific directory
async function sendToSpecificDirectory(magnetUrl, pageUrl, directoryIndex) {
  try {
    // Get configuration from storage
    const config = await chrome.storage.sync.get([
      'qnapServer',
      'qnapPort',
      'qnapUsername',
      'qnapPassword',
      'downloadDirectories'
    ]);

    // Validate configuration
    if (!config.qnapServer) {
      throw new Error('QNAP server address not configured');
    }

    const directories = config.downloadDirectories || [];
    const targetDir = directories[directoryIndex];
    
    if (!targetDir || !targetDir.name || !targetDir.path) {
      throw new Error('Selected directory not found or invalid');
    }

    // Generate unique session ID
    const sessionId = generateSessionId();

    // Prepare the request to QNAP Download Station V4 API
    const qnapUrl = `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/AddUrl`;
    
    // Create form data for QNAP Download Station V4 API
    const formData = new FormData();
    formData.append('sid', sessionId);
    formData.append('temp', 'Download'); // TEMP folder is always "Download"
    formData.append('move', targetDir.path); // Target folder from settings
    formData.append('url', magnetUrl); // The magnet URL
    
    // Prepare request options
    const requestOptions = {
      method: 'POST',
      body: formData,
      headers: {}
    };

    // Add authentication if provided
    if (config.qnapUsername && config.qnapPassword) {
      const credentials = btoa(`${config.qnapUsername}:${config.qnapPassword}`);
      requestOptions.headers['Authorization'] = `Basic ${credentials}`;
    }

    console.log('Sending to QNAP:', {
      url: qnapUrl,
      sid: sessionId,
      temp: 'Download',
      move: targetDir.path,
      url: magnetUrl
    });

    // Send request to QNAP
    const response = await fetch(qnapUrl, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('QNAP response:', responseText);
    
    // Check if the response indicates success
    if (responseText.includes('success') || responseText.includes('added') || response.status === 200) {
      console.log(`Magnet link successfully sent to QNAP directory: ${targetDir.name}`);
      return true;
    } else {
      console.warn('Unexpected response from QNAP:', responseText);
      return true; // Assume success if we get a response
    }

  } catch (error) {
    console.error('Failed to send magnet link to QNAP directory:', error);
    throw error;
  }
}

// Function to get context menu count (since getAll doesn't exist)
function getContextMenuCount() {
  return new Promise((resolve) => {
    let count = 0;
    let hasError = false;
    
    // Try to update each known menu ID to see if it exists
    const knownIds = [
      'magnetOptions', 'copyMagnetLink', 'copyMagnetLinkDirect'
    ];
    
    knownIds.forEach((id, index) => {
      chrome.contextMenus.update(id, {}, () => {
        if (chrome.runtime.lastError) {
          console.log(`Menu ${id} not found`);
        } else {
          count++;
        }
        
        // If this is the last check, resolve with the count
        if (index === knownIds.length - 1) {
          resolve(count);
        }
      });
    });
  });
}

// Function to query current tasks (for debugging/monitoring)
async function queryCurrentTasks() {
  try {
    const config = await chrome.storage.sync.get([
      'qnapServer',
      'qnapPort',
      'qnapUsername',
      'qnapPassword'
    ]);

    if (!config.qnapServer) {
      throw new Error('QNAP server address not configured');
    }

    const queryUrl = `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/Query`;
    
    const requestOptions = {
      method: 'GET',
      headers: {}
    };

    if (config.qnapUsername && config.qnapPassword) {
      const credentials = btoa(`${config.qnapUsername}:${config.qnapPassword}`);
      requestOptions.headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(queryUrl, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Current QNAP tasks:', responseText);
    return responseText;

  } catch (error) {
    console.error('Failed to query QNAP tasks:', error);
    throw error;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    console.log('Received message:', request.action);
    
    if (request.action === 'handleMagnetLink') {
      handleMagnetLink(request.magnetUrl, request.pageUrl)
        .then(result => {
          sendResponse({ success: result });
        })
        .catch(error => {
          console.error('Error handling magnet link:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true; // Keep message channel open for async response
    } else if (request.action === 'refreshContextMenus') {
      console.log('Refreshing context menus...');
      createContextMenus();
      sendResponse({ success: true });
    } else if (request.action === 'verifyContextMenus') {
      console.log('Verifying context menus...');
      verifyContextMenus();
      sendResponse({ success: true });
    } else if (request.action === 'queryTasks') {
      queryCurrentTasks()
        .then(result => {
          sendResponse({ success: true, tasks: result });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (request.action === 'forceCreateContextMenus') {
      console.log('Force creating context menus...');
      createContextMenus();
      sendResponse({ success: true });
    } else if (request.action === 'getContextMenuCount') {
      console.log('Getting context menu count...');
      getContextMenuCount().then(count => {
        sendResponse({ success: true, count: count, tracked: Array.from(createdMenuIds) });
      });
      return true;
    } else if (request.action === 'clearAndRecreateMenus') {
      console.log('Clearing and recreating context menus...');
      createdMenuIds.clear();
      chrome.contextMenus.removeAll(() => {
        createContextMenus();
        sendResponse({ success: true });
      });
      return true;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Function to handle magnet link (legacy support)
async function handleMagnetLink(magnetUrl, pageUrl) {
  try {
    // Get configuration from storage
    const config = await chrome.storage.sync.get([
      'qnapServer',
      'qnapPort',
      'qnapUsername',
      'qnapPassword',
      'autoSend'
    ]);

    if (!config.autoSend) {
      // If auto-send is disabled, just copy to clipboard
      await navigator.clipboard.writeText(magnetUrl);
      return true;
    }

    // Validate configuration
    if (!config.qnapServer) {
      throw new Error('QNAP server address not configured');
    }

    // Use the new V4 API for legacy support too
    const sessionId = generateSessionId();
    const qnapUrl = `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/AddUrl`;
    
    // Create form data for QNAP Download Station V4 API
    const formData = new FormData();
    formData.append('sid', sessionId);
    formData.append('temp', 'Download');
    formData.append('move', 'Download'); // Default to Downloads folder
    formData.append('url', magnetUrl);
    
    // Prepare request options
    const requestOptions = {
      method: 'POST',
      body: formData,
      headers: {}
    };

    // Add authentication if provided
    if (config.qnapUsername && config.qnapPassword) {
      const credentials = btoa(`${config.qnapUsername}:${config.qnapPassword}`);
      requestOptions.headers['Authorization'] = `Basic ${credentials}`;
    }

    // Send request to QNAP
    const response = await fetch(qnapUrl, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    
    // Check if the response indicates success
    if (responseText.includes('success') || responseText.includes('added') || response.status === 200) {
      console.log('Magnet link successfully sent to QNAP');
      return true;
    } else {
      console.warn('Unexpected response from QNAP:', responseText);
      return true; // Assume success if we get a response
    }

  } catch (error) {
    console.error('Failed to send magnet link to QNAP:', error);
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(magnetUrl);
      console.log('Magnet link copied to clipboard as fallback');
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError);
    }
    
    throw error;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup when extension icon is clicked
  chrome.action.setPopup({ popup: 'popup.html' });
});

// Listen for storage changes to update context menus
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.downloadDirectories) {
    // Add a small delay to ensure storage is fully updated
    setTimeout(() => {
      createContextMenus();
    }, 100);
  }
});
