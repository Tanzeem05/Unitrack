// Test script to verify the submissions API endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

// Mock test data
const testStudent = {
  username: 'student1',
  password: 'password123'
};

let authToken = null;

async function login() {
  try {
    console.log('Logging in as student...');
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStudent),
    });
    
    const data = await response.json();
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('✓ Login successful');
      return true;
    } else {
      console.error('✗ Login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('✗ Login error:', error.message);
    return false;
  }
}

async function testSubmissionAPI() {
  try {
    console.log('Testing submissions API...');
    
    // First login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('Cannot test submissions without authentication');
      return;
    }
    
    // Test 1: Get assignments for a course
    console.log('\n1. Testing get assignments by course code...');
    const courseCode = 'CS101';
    const assignmentsResponse = await fetch(`${BASE_URL}/assignments/course_code/${courseCode}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const assignmentsData = await assignmentsResponse.json();
    if (assignmentsResponse.ok && assignmentsData.length > 0) {
      console.log(`✓ Found ${assignmentsData.length} assignments`);
      const testAssignmentId = assignmentsData[0].assignment_id;
      
      // Test 2: Check existing submission
      console.log('\n2. Testing get existing submission...');
      const existingSubmissionResponse = await fetch(`${BASE_URL}/submissions/student/${testAssignmentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const existingSubmission = await existingSubmissionResponse.json();
      if (existingSubmissionResponse.ok) {
        console.log('✓ Get existing submission endpoint works');
        console.log('Existing submission:', existingSubmission);
      }
      
      // Test 3: Create a test file and submit
      console.log('\n3. Testing file submission...');
      
      // Create a temporary test file
      const testContent = 'This is a test submission file content.';
      const testFileName = 'test_submission.txt';
      fs.writeFileSync(testFileName, testContent);
      
      try {
        const formData = new FormData();
        formData.append('assignment_id', testAssignmentId);
        formData.append('file', fs.createReadStream(testFileName));
        
        const submissionResponse = await fetch(`${BASE_URL}/submissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });
        
        const submissionData = await submissionResponse.json();
        
        if (submissionResponse.ok) {
          console.log('✓ File submission successful');
          console.log('Submission result:', submissionData);
        } else {
          console.error('✗ File submission failed:', submissionData);
          console.error('Status:', submissionResponse.status);
        }
        
        // Clean up test file
        fs.unlinkSync(testFileName);
        
      } catch (submitError) {
        console.error('✗ Submission error:', submitError.message);
        // Clean up test file even on error
        if (fs.existsSync(testFileName)) {
          fs.unlinkSync(testFileName);
        }
      }
      
    } else {
      console.error('✗ No assignments found for testing');
      console.error('Response:', assignmentsData);
    }
    
  } catch (error) {
    console.error('✗ Test error:', error.message);
  }
}

// Run the test
console.log('Starting submissions API test...');
testSubmissionAPI();
