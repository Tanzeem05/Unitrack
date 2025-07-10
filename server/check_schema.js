import pool from './db.js';

async function checkSubmissionsSchema() {
  try {
    console.log('Checking database schema for submissions...');
    
    // Check if assignment_submissions table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'assignment_submissions'
      );
    `;
    const tableExists = await pool.query(tableExistsQuery);
    console.log('assignment_submissions table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        ORDER BY ordinal_position;
      `;
      const structure = await pool.query(structureQuery);
      console.log('Table structure:');
      console.table(structure.rows);
    }
    
    // Check if students table exists
    const studentsExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'students'
      );
    `;
    const studentsExists = await pool.query(studentsExistsQuery);
    console.log('students table exists:', studentsExists.rows[0].exists);
    
    // Check if assignments table exists
    const assignmentsExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'assignments'
      );
    `;
    const assignmentsExists = await pool.query(assignmentsExistsQuery);
    console.log('assignments table exists:', assignmentsExists.rows[0].exists);
    
    await pool.end();
  } catch (error) {
    console.error('Error checking schema:', error);
    console.error('Stack:', error.stack);
  }
}

checkSubmissionsSchema();
