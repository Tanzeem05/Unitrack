// Test script to verify the assignments API endpoint
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAssignmentsAPI() {
  try {
    console.log('Testing assignments API...');
    
    // Test the debug route first
    console.log('\n1. Testing debug route...');
    const debugResponse = await fetch(`${BASE_URL}/assignments/debug/tables`);
    const debugData = await debugResponse.json();
    console.log('Debug response:', JSON.stringify(debugData, null, 2));
    
    // Test fetching assignments by course code
    console.log('\n2. Testing assignments by course code...');
    const courseCode = 'CS101'; // Replace with a real course code
    const assignmentsResponse = await fetch(`${BASE_URL}/assignments/course_code/${courseCode}`);
    const assignmentsData = await assignmentsResponse.json();
    
    if (assignmentsResponse.ok) {
      console.log('✓ Assignments API is working correctly');
      console.log(`Found ${assignmentsData.length} assignments for course ${courseCode}`);
      console.log('Assignments:', JSON.stringify(assignmentsData, null, 2));
    } else {
      console.error('✗ API Error:', assignmentsData.error);
    }
    
  } catch (error) {
    console.error('✗ Network Error:', error.message);
  }
}

// Run the test
testAssignmentsAPI();
