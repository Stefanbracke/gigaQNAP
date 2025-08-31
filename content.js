// Content script for handling magnet links via context menu
(function() {
  'use strict';

  // Function to show notification
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: opacity 0.3s ease;
    `;
    
    if (type === 'success') {
      notification.style.backgroundColor = '#4CAF50';
    } else {
      notification.style.backgroundColor = '#f44336';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Function to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Magnet link copied to clipboard!', 'success');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification('Failed to copy to clipboard', 'error');
      return false;
    }
  }

  // Function to find and process all magnet links on the page
  function processMagnetLinks() {
    const magnetLinks = document.querySelectorAll('a[href^="magnet:"]');
    
    magnetLinks.forEach(link => {
      // Add visual indicator that this is a magnet link
      link.style.cssText += `
        position: relative;
        cursor: pointer;
      `;
      
      // Add tooltip
      if (!link.title) {
        link.title = 'Right-click for gigaQNAP options: Choose download directory or copy link';
      }
      
      // Add a small visual indicator
      if (!link.querySelector('.magnet-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'magnet-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #007bff;
          border-radius: 50%;
          border: 1px solid white;
          pointer-events: none;
        `;
        link.style.position = 'relative';
        link.appendChild(indicator);
      }
    });
  }

  // Process magnet links when page loads
  processMagnetLinks();

  // Process magnet links when DOM changes (for dynamic content)
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches('a[href^="magnet:"]')) {
              shouldProcess = true;
            }
            if (node.querySelectorAll && node.querySelectorAll('a[href^="magnet:"]').length > 0) {
              shouldProcess = true;
            }
          }
        });
      }
    });
    
    if (shouldProcess) {
      setTimeout(processMagnetLinks, 100);
    }
  });

  // Start observing DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
      copyToClipboard(request.text)
        .then(success => {
          sendResponse({ success: success });
        });
      return true; // Keep message channel open for async response
    } else if (request.action === 'refreshMagnetLinks') {
      processMagnetLinks();
      // Also refresh context menus to ensure directory options are current
      chrome.runtime.sendMessage({action: 'refreshContextMenus'});
      sendResponse({success: true});
    }
  });

  // Verify context menus are working when page loads
  chrome.runtime.sendMessage({action: 'verifyContextMenus'});

})();
