import pool from './db.js';

async function checkSchema() {
  try {
    // Check assignment_submissions table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'assignment_submissions' 
      ORDER BY ordinal_position
    `);
    console.log('assignment_submissions table structure:');
    console.table(result.rows);
    
    // Check if students table exists
    try {
      const studentsCheck = await pool.query('SELECT COUNT(*) FROM students LIMIT 1');
      console.log('Students table exists: true');
    } catch (e) {
      console.log('Students table exists: false');
      console.log('Error:', e.message);
    }
    
    // Check if assignments table exists
    try {
      const assignmentsCheck = await pool.query('SELECT COUNT(*) FROM assignments LIMIT 1');
      console.log('Assignments table exists: true');
    } catch (e) {
      console.log('Assignments table exists: false');
      console.log('Error:', e.message);
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

checkSchema();
