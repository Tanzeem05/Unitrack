// Test script for resource endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
const TEST_COURSE_ID = 2; // Assuming course ID 2 exists

// Mock token - you'll need to replace with a real teacher token
const TEACHER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InRlYWNoZXIiLCJpYXQiOjE2OTMwNTcwNjB9.EXAMPLE_TOKEN';

async function testResourceEndpoints() {
  console.log('Testing Resource Endpoints...\n');

  try {
    // Test 1: Get all resources for a course
    console.log('1. Testing GET /api/resources/:courseId');
    const response1 = await fetch(`${BASE_URL}/resources/${TEST_COURSE_ID}`, {
      headers: {
        'Authorization': `Bearer ${TEACHER_TOKEN}`
      }
    });
    
    console.log('Status:', response1.status);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Response:', JSON.stringify(data1, null, 2));
    } else {
      const error1 = await response1.text();
      console.log('Error:', error1);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Create a resource thread
    console.log('2. Testing POST /api/resources/:courseId/threads');
    const response2 = await fetch(`${BASE_URL}/resources/${TEST_COURSE_ID}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEACHER_TOKEN}`
      },
      body: JSON.stringify({
        title: 'Test Resource Thread'
      })
    });
    
    console.log('Status:', response2.status);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Response:', JSON.stringify(data2, null, 2));
    } else {
      const error2 = await response2.text();
      console.log('Error:', error2);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Check if tables exist
async function checkTables() {
  console.log('Checking if resource tables exist...\n');
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'unitrack',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('resource_threads', 'resource_files')
      ORDER BY table_name;
    `);

    console.log('Existing resource tables:', result.rows.map(r => r.table_name));
    
    if (result.rows.length < 2) {
      console.log('Some tables are missing. Creating them...');
      const fs = require('fs');
      const sql = fs.readFileSync('create_resource_tables.sql', 'utf8');
      await pool.query(sql);
      console.log('Tables created successfully!');
    }

    await pool.end();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

// Run tests
async function main() {
  await checkTables();
  console.log('\n' + '='.repeat(50) + '\n');
  await testResourceEndpoints();
}

main().catch(console.error);
