// Background service worker for handling magnet links

// Track created context menu IDs
let createdMenuIds = new Set();

// Task counter for badge display
let taskCounter = 0;

// Function to update the badge counter on the extension icon
async function updateTaskCounter(increment = false) {
  try {
    if (increment) {
      taskCounter++;
      // Store counter in storage for persistence
      await chrome.storage.local.set({ taskCounter: taskCounter });
    } else {
      // Load counter from storage
      const stored = await chrome.storage.local.get(['taskCounter']);
      taskCounter = stored.taskCounter || 0;
    }
    
    // Update badge text (show counter if > 0)
    if (taskCounter > 0) {
      chrome.action.setBadgeText({ text: taskCounter.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green for success
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    
    // Auto-reset counter after 5 seconds (optional - remove if you want it to persist)
    if (increment && taskCounter > 0) {
      setTimeout(async () => {
        taskCounter = 0;
        await chrome.storage.local.set({ taskCounter: 0 });
        chrome.action.setBadgeText({ text: '' });
      }, 5000);
    }
  } catch (error) {
    console.error('Failed to update task counter:', error);
  }
}


// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, creating context menus...');
  createContextMenus();
  updateTaskCounter(false); // Load counter on startup
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
    updateTaskCounter(false); // Load counter on install
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

// Build base URL for QNAP
function getQnapBaseUrl(server, port) {
  return `http://${server}:${port || '8080'}`;
}

// Attempt login to QNAP QTS to obtain a session cookie
async function loginToQnap(server, port, username, password) {
  if (!username || !password) {
    return { ok: false, reason: 'missing_credentials' };
  }

  const baseUrl = getQnapBaseUrl(server, port);

  // QNAP QTS auth (best-effort): try POST first, then fallback to GET
  const formBody = new URLSearchParams();
  formBody.set('user', username);
  formBody.set('pwd', password);

  // Primary: POST
  try {
    const resp = await fetch(`${baseUrl}/cgi-bin/authLogin.cgi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
      // include so cookies like NAS_SID are stored by the browser
      credentials: 'include'
    });
    const text = await resp.text();
    // Try to extract sid from XML <authSid>...</authSid>
    const sidMatch = text.match(/<authSid>([^<]+)<\/authSid>/i);
    const sid = sidMatch ? sidMatch[1] : undefined;
    return { ok: resp.ok, status: resp.status, body: text, sid };
  } catch (e) {
    // fall through to GET attempt
  }

  // Fallback: GET (some systems accept query params)
  try {
    const resp = await fetch(`${baseUrl}/cgi-bin/authLogin.cgi?user=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`, {
      method: 'GET',
      credentials: 'include'
    });
    const text = await resp.text();
    const sidMatch = text.match(/<authSid>([^<]+)<\/authSid>/i);
    const sid = sidMatch ? sidMatch[1] : undefined;
    return { ok: resp.ok, status: resp.status, body: text, sid };
  } catch (e2) {
    return { ok: false, error: e2?.message || 'login_failed' };
  }
}

// Attempt login to QNAP Download Station to obtain session ID and token
// Endpoint: /downloadstation/V4/Misc/Login
// Uses POST with 'user' and 'pass' parameters, password Base64 encoded
// Returns both sid and token for use in subsequent API calls
async function loginToDownloadStation(server, port, username, password) {
  if (!username || !password) {
    return { ok: false, reason: 'missing_credentials' };
  }

  const baseUrl = getQnapBaseUrl(server, port);
  const loginUrl = `${baseUrl}/downloadstation/V4/Misc/Login`;
  
  try {
    // Prepare form data: user and Base64 encoded password
    const formBody = new URLSearchParams();
    formBody.set('user', username);
    const encodedPassword = btoa(password);
    formBody.set('pass', encodedPassword);

    console.log('Attempting Download Station login:', loginUrl);
    console.log('User:', username);
    
    const resp = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
      credentials: 'include'
    });
    
    const text = await resp.text();
    console.log('Login response status:', resp.status);
    console.log('Login response:', text);
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse login response as JSON:', e);
      return { ok: false, status: resp.status, body: text, error: 'parse_error', reason: 'Response is not valid JSON' };
    }
    
    // Check for error in response (error > 0 means failure)
    if (parsed.error && parsed.error > 0) {
      console.error('Login failed with error:', parsed.error, parsed.reason);
      return { ok: false, status: resp.status, body: text, error: parsed.error, reason: parsed.reason };
    }
    
    // Success: extract both sid and token from response
    if (parsed.sid) {
      const token = parsed.token || null;
      console.log('Login successful! sid:', parsed.sid, 'token:', token);
      return { 
        ok: true, 
        status: resp.status, 
        body: text, 
        sid: parsed.sid, 
        token: token,
        user: parsed.user,
        admin: parsed.admin,
        privilege: parsed.privilege
      };
    } else {
      console.error('Login response missing sid:', parsed);
      return { ok: false, status: resp.status, body: text, error: 'no_sid', reason: 'Response missing sid field' };
    }
  } catch (e) {
    console.error('Login request failed:', e.message);
    return { ok: false, error: e.message || 'network_error' };
  }
}

// Logout from QNAP Download Station
// Endpoint: /downloadstation/V4/Misc/Logout?sid=...
// Only requires sid as query parameter
async function logoutFromDownloadStation(server, port, sid) {
  if (!sid) {
    console.warn('No sid provided for logout');
    return { ok: false, reason: 'missing_sid' };
  }

  const baseUrl = getQnapBaseUrl(server, port);
  const logoutUrl = `${baseUrl}/downloadstation/V4/Misc/Logout?sid=${encodeURIComponent(sid)}`;
  
  try {
    console.log('Attempting Download Station logout:', logoutUrl);
    
    const resp = await fetch(logoutUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    const text = await resp.text();
    console.log('Logout response status:', resp.status);
    console.log('Logout response:', text);
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Not JSON, that's okay - logout might return empty or different format
      console.log('Logout response is not JSON, assuming success');
      return { ok: resp.ok, status: resp.status, body: text };
    }
    
    // Check for error in response (error > 0 means failure)
    if (parsed.error && parsed.error > 0) {
      console.error('Logout failed with error:', parsed.error, parsed.reason);
      return { ok: false, status: resp.status, body: text, error: parsed.error, reason: parsed.reason };
    }
    
    // Success
    console.log('Logout successful');
    return { 
      ok: true, 
      status: resp.status, 
      body: text
    };
  } catch (e) {
    console.error('Logout request failed:', e.message);
    return { ok: false, error: e.message || 'network_error' };
  }
}

// Try to parse QNAP Download Station JSON; return {ok, error, raw}
async function parseDownloadStationResponse(response) {
  const rawText = await response.text();
  try {
    const data = JSON.parse(rawText);
    if (typeof data.error !== 'undefined') {
      return { ok: data.error === 0, error: data.error, reason: data.reason, raw: rawText };
    }
    // Some endpoints might return different shapes; consider HTTP ok as success if no explicit error
    return { ok: response.ok, raw: rawText };
  } catch (_) {
    // Not JSON; fallback to HTTP status only
    return { ok: response.ok, raw: rawText };
  }
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

    console.log('Sending to QNAP:', {
      server: config.qnapServer,
      port: config.qnapPort || '8080',
      targetDir: targetDir.name,
      magnetUrl: magnetUrl
    });

    // Use the confirmed working endpoint: GET with query parameters
    const baseEndpoint = `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/AddUrl`;

    let success = false;
    let lastError = null;
    let didLogin = false;
    let sid = undefined;
    let token = undefined;

    // Proactively login to Download Station to obtain sid and token
    if (config.qnapUsername && config.qnapPassword) {
      console.log('Credentials provided, attempting login...');
      const loginResult = await loginToDownloadStation(config.qnapServer, config.qnapPort, config.qnapUsername, config.qnapPassword);
      didLogin = true;
      sid = loginResult.sid;
      token = loginResult.token;
      console.log('Initial Download Station login attempt before AddUrl:', { 
        ok: loginResult.ok, 
        hasSid: Boolean(sid),
        hasToken: Boolean(token),
        status: loginResult.status,
        error: loginResult.error,
        reason: loginResult.reason
      });
      
      if (!sid && !loginResult.ok) {
        console.error('Login failed! Error:', loginResult.error, 'Reason:', loginResult.reason);
        throw new Error(`Failed to authenticate with QNAP: ${loginResult.reason || loginResult.error || 'Unknown error'}`);
      }
      
      if (!sid) {
        console.error('Login succeeded but no sid received');
        throw new Error('Login succeeded but no session ID (sid) received from QNAP');
      }
    } else {
      console.warn('No credentials provided - request may fail with session error');
    }

    // Both sid and token are REQUIRED for all Download Station API calls
    if (!sid) {
      throw new Error('Session ID (sid) is required but not available. Please ensure credentials are configured and login succeeded.');
    }
    
    try {
      // Build URL with query parameters (GET method - confirmed working)
      const queryParams = new URLSearchParams();
      queryParams.set('sid', sid);
      if (token) {
        queryParams.set('token', token);
      }
      queryParams.set('temp', 'Download');
      queryParams.set('move', targetDir.path); // path should match QNAP share/folder
      queryParams.set('url', magnetUrl);
      
      const fullUrl = `${baseEndpoint}?${queryParams.toString()}`;
      
      console.log('Sending request to:', fullUrl);
      console.log('Has credentials:', config.qnapUsername && config.qnapPassword ? 'yes' : 'no');
      console.log('Has sid:', sid ? 'yes (' + sid + ')' : 'no');
      console.log('Has token:', token ? 'yes (' + token + ')' : 'no');

      const requestOptions = {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': getQnapBaseUrl(config.qnapServer, config.qnapPort),
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      };

      let response = await fetch(fullUrl, requestOptions);
      let parsed = await parseDownloadStationResponse(response);
      
      console.log('Response status:', response.status);
      console.log('Response parsed:', parsed);

      // If we got a session error (commonly error 5), try to login once and retry
      if (!parsed.ok && parsed.error === 5 && config.qnapUsername && config.qnapPassword) {
        console.log('Session error from Download Station, attempting Download Station login...');
        const loginResult = await loginToDownloadStation(config.qnapServer, config.qnapPort, config.qnapUsername, config.qnapPassword);
        didLogin = true;
        sid = loginResult.sid || sid;
        token = loginResult.token || token;
        console.log('Download Station login result:', { ok: loginResult.ok, status: loginResult.status, hasSid: Boolean(sid), hasToken: Boolean(token) });
        
        // Retry with new sid and token
        const retryParams = new URLSearchParams();
        retryParams.set('sid', sid);
        if (token) {
          retryParams.set('token', token);
        }
        retryParams.set('temp', 'Download');
        retryParams.set('move', targetDir.path);
        retryParams.set('url', magnetUrl);
        
        const retryUrl = `${baseEndpoint}?${retryParams.toString()}`;
        response = await fetch(retryUrl, requestOptions);
        parsed = await parseDownloadStationResponse(response);
      }

      if (parsed.ok) {
        console.log(`Success! Task added to QNAP:`, parsed.raw);
        success = true;
        
        // Update badge counter to show successful task submission
        await updateTaskCounter(true);
      } else {
        lastError = new Error(parsed.reason || `HTTP ${response.status}`);
        throw lastError;
      }
    } catch (error) {
      console.error(`Failed to add task:`, error.message);
      lastError = error;
      throw error;
    }

    if (success) {
      console.log(`Magnet link successfully sent to QNAP directory: ${targetDir.name}`);
      return true;
    } else {
      throw new Error(`All endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
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

// Function to test QNAP API endpoints
async function testQnapEndpoints() {
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

    console.log('Testing QNAP API endpoints...');
    
    const baseUrl = `http://${config.qnapServer}:${config.qnapPort || '8080'}`;
    const endpoints = [
      '/downloadstation/V4/Task/Query',
      '/downloadstation/V4/Task/AddUrl',
      '/downloadstation/V4/Task/Add',
      '/downloadstation/V3/Task/Query',
      '/downloadstation/V3/Task/AddUrl'
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const url = baseUrl + endpoint;
        console.log(`Testing: ${url}`);
        
        const requestOptions = {
          method: 'GET',
          headers: {}
        };

        if (config.qnapUsername && config.qnapPassword) {
          const credentials = btoa(`${config.qnapUsername}:${config.qnapPassword}`);
          requestOptions.headers['Authorization'] = `Basic ${credentials}`;
        }

        const response = await fetch(url, requestOptions);
        results[endpoint] = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        };
        
        if (response.ok) {
          const responseText = await response.text();
          results[endpoint].response = responseText.substring(0, 200) + '...';
        }
        
      } catch (error) {
        results[endpoint] = {
          error: error.message,
          ok: false
        };
      }
    }
    
    console.log('QNAP API endpoint test results:', results);
    return results;

  } catch (error) {
    console.error('Failed to test QNAP endpoints:', error);
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
    } else if (request.action === 'testQnapEndpoints') {
      console.log('Testing QNAP endpoints...');
      testQnapEndpoints().then(results => {
        sendResponse({ success: true, results: results });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
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

    console.log('Legacy handler: Sending magnet link to QNAP');
    
    // Try to send to default Downloads folder
    try {
      // Use the same improved approach as sendToSpecificDirectory
      const endpoints = [
        `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/AddUrl`,
        `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V4/Task/Add`,
        `http://${config.qnapServer}:${config.qnapPort || '8080'}/downloadstation/V3/Task/AddUrl`
      ];

      let success = false;
      for (const endpoint of endpoints) {
        try {
          console.log(`Legacy handler trying: ${endpoint}`);
          
          if (endpoint.includes('AddUrl')) {
            const formData = new FormData();
            formData.append('url', magnetUrl);
            formData.append('destination', 'Download');
            
            const response = await fetch(endpoint, {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              console.log('Legacy handler: Success with', endpoint);
              success = true;
              break;
            }
          }
        } catch (error) {
          console.log(`Legacy handler failed with ${endpoint}:`, error.message);
          continue;
        }
      }
      
      if (success) {
        console.log('Magnet link successfully sent to QNAP via legacy handler');
        return true;
      }
    } catch (error) {
      console.log('Legacy handler failed, will fallback to clipboard');
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(magnetUrl);
      console.log('Magnet link copied to clipboard as fallback');
      return true;
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError);
      throw error;
    }

  } catch (error) {
    console.error('Failed to handle magnet link:', error);
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
