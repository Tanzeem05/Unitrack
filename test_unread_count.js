// Test script to verify the unread count API endpoint
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testUnreadCount() {
  try {
    // Replace with a valid token from your authentication
    const token = 'your-test-token-here';
    
    const response = await fetch(`${BASE_URL}/messages/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Unread count response:', data);
    
    if (response.ok) {
      console.log('✓ Unread count API is working correctly');
      console.log('Unread count:', data.unreadCount);
    } else {
      console.error('✗ API Error:', data.error);
    }
  } catch (error) {
    console.error('✗ Network Error:', error.message);
  }
}

// Run the test
testUnreadCount();
