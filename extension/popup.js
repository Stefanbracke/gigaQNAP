// Popup script for configuration and testing
document.addEventListener('DOMContentLoaded', function() {
  const configForm = document.getElementById('configForm');
  const testConnectionBtn = document.getElementById('testConnection');
  const statusDiv = document.getElementById('status');
  const addDirectoryBtn = document.getElementById('addDirectory');
  const directoryList = document.getElementById('directoryList');
  
  // Verify critical elements exist
  if (!addDirectoryBtn) {
    console.error('Add directory button not found in DOM!');
  }
  if (!directoryList) {
    console.error('Directory list element not found in DOM!');
  }
  
  // Load saved configuration
  loadConfiguration();
  
  // Handle form submission
  configForm.addEventListener('submit', function(e) {
    e.preventDefault();
    saveConfiguration();
  });
  
  // Handle test connection
  testConnectionBtn.addEventListener('click', function() {
    testConnection();
  });
  
  // Handle test endpoints
  const testEndpointsBtn = document.getElementById('testEndpoints');
  testEndpointsBtn.addEventListener('click', function() {
    testEndpoints();
  });
  
  // Handle refresh context menus
  const refreshMenusBtn = document.getElementById('refreshMenus');
  refreshMenusBtn.addEventListener('click', function() {
    refreshContextMenus();
  });
  
  // Handle verify context menus
  const verifyMenusBtn = document.getElementById('verifyMenus');
  verifyMenusBtn.addEventListener('click', function() {
    verifyContextMenus();
  });
  
  // Handle get menu count
  const getMenuCountBtn = document.getElementById('getMenuCount');
  getMenuCountBtn.addEventListener('click', function() {
    getMenuCount();
  });
  
  // Handle clear and recreate menus
  const clearAndRecreateBtn = document.getElementById('clearAndRecreate');
  clearAndRecreateBtn.addEventListener('click', function() {
    clearAndRecreateMenus();
  });
  
  // Handle add directory - use both addEventListener and global handler
  // Make function globally accessible as fallback
  window.addDirectoryHandler = function() {
    console.log('Add directory button clicked (global handler)');
    addDirectory();
  };
  
  if (addDirectoryBtn) {
    console.log('Add directory button found, setting up event listener');
    addDirectoryBtn.addEventListener('click', function(e) {
      console.log('Add directory button clicked (event listener)');
      e.preventDefault();
      e.stopPropagation();
      addDirectory();
    });
    
    // Also try direct onclick as backup
    addDirectoryBtn.onclick = function(e) {
      console.log('Add directory button clicked (onclick handler)');
      e.preventDefault();
      e.stopPropagation();
      addDirectory();
    };
  } else {
    console.error('Add directory button not found!');
  }
  
  // Function to load configuration from storage
  function loadConfiguration() {
    chrome.storage.sync.get([
      'qnapServer',
      'qnapPort',
      'qnapUsername',
      'qnapPassword',
      'autoSend',
      'downloadDirectories'
    ], function(items) {
      document.getElementById('qnapServer').value = items.qnapServer || '';
      document.getElementById('qnapPort').value = items.qnapPort || '';
      document.getElementById('qnapUsername').value = items.qnapUsername || '';
      document.getElementById('qnapPassword').value = items.qnapPassword || '';
      document.getElementById('autoSend').checked = items.autoSend !== false;
      
      // Load directories - if none exist, initialize with 4 defaults
      let directories = items.downloadDirectories;
      if (!directories || directories.length === 0) {
        directories = [
          { name: 'Downloads', path: 'Download' },
          { name: 'Movies', path: 'Movies' },
          { name: 'TV Shows', path: 'TV' },
          { name: 'Music', path: 'Music' }
        ];
        // Save the default directories
        chrome.storage.sync.set({ downloadDirectories: directories }, function() {
          console.log('Initialized with default directories');
        });
      }
      renderDirectories(directories);
    });
  }
  
  // Function to render directories
  function renderDirectories(directories) {
    if (!directoryList) {
      console.error('directoryList element not found!');
      return;
    }
    console.log('Rendering directories:', directories);
    directoryList.innerHTML = '';
    directories.forEach((dir, index) => {
      const dirItem = createDirectoryItem(dir, index);
      directoryList.appendChild(dirItem);
    });
    console.log('Directories rendered. Count:', directories.length);
  }
  
  // Function to create directory item
  function createDirectoryItem(dir, index) {
    const dirItem = document.createElement('div');
    dirItem.className = 'directory-item';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Directory Name (e.g., Movies)';
    nameInput.value = dir.name;
    nameInput.dataset.index = index;
    nameInput.dataset.field = 'name';
    
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.placeholder = 'Folder Name (e.g., Movies)';
    pathInput.value = dir.path;
    pathInput.dataset.index = index;
    pathInput.dataset.field = 'path';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dir-btn';
    removeBtn.textContent = '×';
    removeBtn.dataset.index = index; // Store index in data attribute
    removeBtn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      removeDirectory(idx);
    });
    
    dirItem.appendChild(nameInput);
    dirItem.appendChild(pathInput);
    dirItem.appendChild(removeBtn);
    
    // Add change listeners
    nameInput.addEventListener('input', function() {
      updateDirectory(index, 'name', this.value);
    });
    
    pathInput.addEventListener('input', function() {
      updateDirectory(index, 'path', this.value);
    });
    
    return dirItem;
  }
  
  // Function to add directory - make it globally accessible
  function addDirectory() {
    console.log('=== addDirectory function called ===');
    console.trace('Call stack:');
    
    try {
      chrome.storage.sync.get(['downloadDirectories'], function(items) {
        if (chrome.runtime.lastError) {
          console.error('Error getting directories:', chrome.runtime.lastError);
          showStatus('Error reading directories: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        
        try {
          const directories = items.downloadDirectories || [];
          console.log('Current directories before add:', directories);
          console.log('Current count:', directories.length);
          
          // Add new empty directory
          directories.push({ name: '', path: '' });
          console.log('New directories array:', directories);
          console.log('New count:', directories.length);
          
          chrome.storage.sync.set({ downloadDirectories: directories }, function() {
            if (chrome.runtime.lastError) {
              console.error('Error saving directories:', chrome.runtime.lastError);
              showStatus('Failed to add directory: ' + chrome.runtime.lastError.message, 'error');
            } else {
              console.log('✓ Directories saved successfully, rendering...');
              renderDirectories(directories);
              showStatus('Directory added successfully! Fill in the name and folder path.', 'success');
            }
          });
        } catch (error) {
          console.error('Error in addDirectory callback:', error);
          showStatus('Error adding directory: ' + error.message, 'error');
        }
      });
    } catch (error) {
      console.error('Error in addDirectory:', error);
      showStatus('Error adding directory: ' + error.message, 'error');
    }
  }
  
  // Make function globally accessible
  window.addDirectory = addDirectory;
  
  // Function to remove directory
  function removeDirectory(index) {
    chrome.storage.sync.get(['downloadDirectories'], function(items) {
      const directories = items.downloadDirectories || [];
      directories.splice(index, 1);
      
      chrome.storage.sync.set({ downloadDirectories: directories }, function() {
        renderDirectories(directories);
      });
    });
  }
  
  // Function to update directory
  function updateDirectory(index, field, value) {
    chrome.storage.sync.get(['downloadDirectories'], function(items) {
      const directories = items.downloadDirectories || [];
      if (directories[index]) {
        directories[index][field] = value;
        chrome.storage.sync.set({ downloadDirectories: directories });
      }
    });
  }
  
  // Function to save configuration to storage
  function saveConfiguration() {
    const config = {
      qnapServer: document.getElementById('qnapServer').value.trim(),
      qnapPort: document.getElementById('qnapPort').value.trim() || '8080',
      qnapUsername: document.getElementById('qnapUsername').value.trim(),
      qnapPassword: document.getElementById('qnapPassword').value.trim(),
      autoSend: document.getElementById('autoSend').checked
    };
    
    // Validate required fields
    if (!config.qnapServer) {
      showStatus('QNAP server IP address is required', 'error');
      return;
    }
    
    // Validate IP address format
    if (!isValidIPAddress(config.qnapServer)) {
      showStatus('Please enter a valid IP address', 'error');
      return;
    }
    
    // Save to storage
    chrome.storage.sync.set(config, function() {
      showStatus('Configuration saved successfully!', 'success');
      
      // Refresh magnet links on current tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'refreshMagnetLinks'});
        }
      });
    });
  }
  
  // Function to test connection to QNAP server
  function testConnection() {
    const server = document.getElementById('qnapServer').value.trim();
    const port = document.getElementById('qnapPort').value.trim() || '8080';
    const username = document.getElementById('qnapUsername').value.trim();
    const password = document.getElementById('qnapPassword').value.trim();
    
    if (!server) {
      showStatus('Please enter a server IP address first', 'error');
      return;
    }
    
    if (!isValidIPAddress(server)) {
      showStatus('Please enter a valid IP address', 'error');
      return;
    }
    
    showStatus('Testing connection...', 'success');
    
    // Test connection by trying to reach the QNAP server
    const testUrl = `http://${server}:${port}/downloadstation/V4/Task/Query`;
    
    const requestOptions = {
      method: 'GET',
      headers: {}
    };
    
    // Add authentication if provided
    if (username && password) {
      const credentials = btoa(`${username}:${password}`);
      requestOptions.headers['Authorization'] = `Basic ${credentials}`;
    }
    
    // Use fetch to test connection
    fetch(testUrl, requestOptions)
      .then(response => {
        if (response.ok) {
          showStatus('Connection successful! QNAP server is reachable.', 'success');
        } else if (response.status === 401) {
          showStatus('Connection successful but authentication failed. Check username/password.', 'error');
        } else {
          showStatus(`Connection successful but server returned: ${response.status}`, 'error');
        }
      })
      .catch(error => {
        console.error('Connection test failed:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          showStatus('Connection failed. Check if the server is reachable and port is correct.', 'error');
        } else {
          showStatus(`Connection failed: ${error.message}`, 'error');
        }
      });
  }
  
  // Function to query current tasks
  function queryTasks() {
    const server = document.getElementById('qnapServer').value.trim();
    const port = document.getElementById('qnapPort').value.trim() || '8080';
    const username = document.getElementById('qnapUsername').value.trim();
    const password = document.getElementById('qnapPassword').value.trim();
    
    if (!server) {
      showStatus('Please enter a server IP address first', 'error');
      return;
    }
    
    if (!isValidIPAddress(server)) {
      showStatus('Please enter a valid IP address', 'error');
      return;
    }
    
    showStatus('Querying current tasks...', 'success');
    
    // Send message to background script to query tasks
    chrome.runtime.sendMessage({action: 'queryTasks'}, function(response) {
      if (response && response.success) {
        showStatus('Tasks queried successfully! Check console for details.', 'success');
        console.log('Current QNAP tasks:', response.tasks);
      } else {
        showStatus(`Failed to query tasks: ${response.error}`, 'error');
      }
    });
  }
  
  // Function to test QNAP endpoints
  function testEndpoints() {
    const server = document.getElementById('qnapServer').value.trim();
    const port = document.getElementById('qnapPort').value.trim() || '8080';
    const username = document.getElementById('qnapUsername').value.trim();
    const password = document.getElementById('qnapPassword').value.trim();
    
    if (!server) {
      showStatus('Please enter a server IP address first', 'error');
      return;
    }
    
    if (!isValidIPAddress(server)) {
      showStatus('Please enter a valid IP address', 'error');
      return;
    }
    
    showStatus('Testing QNAP endpoints...', 'success');
    
    // Send message to background script to test endpoints
    chrome.runtime.sendMessage({action: 'testQnapEndpoints'}, function(response) {
      if (response && response.success) {
        showStatus('Endpoints tested successfully! Check console for detailed results.', 'success');
        console.log('QNAP endpoint test results:', response.results);
        
        // Show a summary in the status
        const workingEndpoints = Object.entries(response.results)
          .filter(([endpoint, result]) => result.ok)
          .map(([endpoint]) => endpoint);
        
        if (workingEndpoints.length > 0) {
          showStatus(`Found ${workingEndpoints.length} working endpoints: ${workingEndpoints.join(', ')}`, 'success');
        } else {
          showStatus('No working endpoints found. Check QNAP configuration.', 'error');
        }
      } else {
        showStatus(`Failed to test endpoints: ${response.error}`, 'error');
      }
    });
  }
  
  // Function to refresh context menus
  function refreshContextMenus() {
    showStatus('Refreshing context menus...', 'success');
    
    // Send message to background script to refresh context menus
    chrome.runtime.sendMessage({action: 'refreshContextMenus'}, function(response) {
      if (response && response.success) {
        showStatus('Context menus refreshed successfully!', 'success');
      } else {
        showStatus('Failed to refresh context menus', 'error');
      }
    });
  }
  
  // Function to verify context menus
  function verifyContextMenus() {
    showStatus('Verifying context menus...', 'success');
    
    // Send message to background script to verify context menus
    chrome.runtime.sendMessage({action: 'verifyContextMenus'}, function(response) {
      if (response && response.success) {
        showStatus('Context menus verified successfully!', 'success');
      } else {
        showStatus('Failed to verify context menus', 'error');
      }
    });
  }
  
  // Function to get context menu count
  function getMenuCount() {
    showStatus('Getting context menu count...', 'success');
    
    // Send message to background script to get context menu count
    chrome.runtime.sendMessage({action: 'getContextMenuCount'}, function(response) {
      if (response && response.success) {
        showStatus(`Found ${response.count} context menus. Tracked IDs: ${response.tracked.join(', ')}`, 'success');
        console.log('Context menu details:', response);
      } else {
        showStatus('Failed to get context menu count', 'error');
      }
    });
  }
  
  // Function to clear and recreate context menus
  function clearAndRecreateMenus() {
    showStatus('Clearing and recreating context menus...', 'success');
    
    // Send message to background script to clear and recreate context menus
    chrome.runtime.sendMessage({action: 'clearAndRecreateMenus'}, function(response) {
      if (response && response.success) {
        showStatus('Context menus cleared and recreated successfully!', 'success');
      } else {
        showStatus('Failed to clear and recreate context menus', 'error');
      }
    });
  }
  
  // Function to validate IP address format
  function isValidIPAddress(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }
  
  // Function to show status messages
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
  
  // Auto-hide error messages when user starts typing
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      if (statusDiv.style.display === 'block' && statusDiv.classList.contains('error')) {
        statusDiv.style.display = 'none';
      }
    });
  });
});
