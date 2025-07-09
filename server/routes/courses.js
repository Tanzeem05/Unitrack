// server/routes/courses.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Create a course
router.post('/', async (req, res) => {
  const {
    course_code,
    course_name,
    description,
    start_date,
    end_date,
    created_by,
    updated_by
  } = req.body;

  // Insert new course into the database
  const query = `
    INSERT INTO courses (course_code, course_name, description, start_date, end_date, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    course_code,
    course_name,
    description,
    start_date,
    end_date,
    created_by,
    updated_by
  ];

  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to create course' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows returned, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }


  res.status(201).json({ message: 'Course created', course: data[0] });
});



// Get all courses
router.get('/', async (req, res) => {

  const query = 'SELECT * FROM courses';
  let data;
  let error;
  try {
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No courses found' });
    }
    // If the query was successful, extract the data
    data = result.rows;
    res.json(data);
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

});



// Get course by ID
router.get('/course/:id', async (req, res) => {


  const { id } = req.params;
  const query = 'SELECT * FROM courses WHERE course_id = $1';
  let data;
  let error;
  try {
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    data = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);

});

// GET /course_code/:course_code
router.get('/course_code/:course_code', async (req, res) => {
  const { course_code: encodedCourseCode } = req.params;
  const decodedCourseCode = decodeURIComponent(encodedCourseCode);
  console.log(`Fetching course with code: ${decodedCourseCode}`);

  const query = `
    SELECT * FROM courses 
    WHERE LOWER(REPLACE(course_code, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
  `;

  try {
    const result = await pool.query(query, [decodedCourseCode]);
    console.log('Course query result:', result.rows);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Update course
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const query = `UPDATE courses  
    SET course_code = $1, course_name = $2, description = $3, start_date = $4, end_date = $5, updated_by = $6
    WHERE course_id = $7 RETURNING *`;
  const values = [
    updates.course_code,
    updates.course_name,
    updates.description,
    updates.start_date,
    updates.end_date,
    updates.updated_by,
    id
  ];
  let data;
  let error;
  try {
    const result= await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (result.rowCount > 1) {
      return res.status(500).json({ error: 'Multiple rows updated, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = await pool.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  }
  catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.json({ message: 'Course updated', course: data });
});




// Delete course
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM courses WHERE course_id = $1 RETURNING *';
  let error;
  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json({ message: 'Course deleted successfully' });
});


// Get all current courses for a user
router.get('/user/:userName/current', async (req, res) => {
  const { userName } = req.params;
  const query = `
    SELECT c.* FROM courses c
    JOIN student_enrollment e ON c.course_id = e.course_id
    join students s ON e.student_id = s.student_id
    join users u ON s.user_id = u.user_id
    WHERE u.username = $1 AND (CURRENT_DATE BETWEEN c.start_date AND c.end_date)
  `;
  let data;
  try {
    const result = await pool.query(query, [userName]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current courses found for this user' });
    }
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);
});

// Get all completed courses for a user
router.get('/user/:userName/completed', async (req, res) => {
  const { userName } = req.params;
  const query = `
    SELECT c.* FROM courses c
    JOIN student_enrollment e ON c.course_id = e.course_id
    join students s ON e.student_id = s.student_id
    join users u ON s.user_id = u.user_id
    WHERE u.username = $1 AND (CURRENT_DATE > c.end_date)
  `;
  let data;
  try {
    const result = await pool.query(query, [userName]);
    if (result.rows.length === 0) {
      return res.status(200).json({ error: 'No past courses found for this user' });
    }
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);
});

// Get all courses created by a teacher
router.get('/teacher/:userName', async (req, res) => {
  const { userName } = req.params;
  console.log(`Fetching courses for teacher: ${userName}`);

  // First, let's check if the teacher exists
  const teacherCheckQuery = `
    SELECT u.username, u.user_id, t.teacher_id 
    FROM users u 
    JOIN teachers t ON u.user_id = t.user_id 
    WHERE u.username = $1
  `;
  
  try {
    const teacherCheck = await pool.query(teacherCheckQuery, [userName]);
    console.log(`Teacher check result:`, teacherCheck.rows);
    
    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const query = `
      SELECT c.* FROM courses c
      JOIN course_teachers ct ON c.course_id = ct.course_id
      JOIN teachers t ON ct.teacher_id = t.teacher_id
      JOIN users u ON t.user_id = u.user_id
      WHERE u.username = $1
    `;
    
    const result = await pool.query(query, [userName]);
    console.log(`Query result for ${userName}:`, result.rows);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No courses found for this teacher' });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug route to see all teachers
console.log('Registering /debug/teachers route');
console.log('Registering /debug/teachers route');
router.get('/debug/teachers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, u.user_id, t.teacher_id, t.specialization 
      FROM users u 
      JOIN teachers t ON u.user_id = t.user_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to see all course assignments
router.get('/debug/course-teachers', async (req, res) => {
  console.log('Accessing /debug/course-teachers route');
  console.log('Accessing /debug/course-teachers route');
  try {
    const result = await pool.query(`
      SELECT c.course_name, c.course_code, u.username, t.teacher_id
      FROM courses c
      JOIN course_teachers ct ON c.course_id = ct.course_id
      JOIN teachers t ON ct.teacher_id = t.teacher_id
      JOIN users u ON t.user_id = u.user_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;