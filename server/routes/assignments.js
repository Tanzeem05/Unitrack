// server/routes/assignments.js
import express from 'express';
import multer from 'multer';
import * as fileHelper from '../utils/file.js';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware to all routes except debug
router.use('/debug', (req, res, next) => next()); // Skip auth for debug routes
router.use(authenticateToken);

// Add a debug route to check table structure
router.get('/debug/tables', async (req, res) => {
  try {
    // Check if tables exist and their structure
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%assignment%' OR table_name ILIKE '%course%')
      ORDER BY table_name`;

    const tablesResult = await pool.query(tablesQuery);

    // Get sample data from assignments table if it exists
    let sampleData = null;
    try {
      const sampleQuery = 'SELECT * FROM assignments LIMIT 1';
      const sampleResult = await pool.query(sampleQuery);
      sampleData = sampleResult.rows[0] || 'No data found';
    } catch (err) {
      sampleData = `Error accessing assignments table: ${err.message}`;
    }

    res.json({
      tables: tablesResult.rows,
      sampleAssignment: sampleData
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create an assignment


router.post('/', upload.single('assignmentFile'), async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);

  const {
    course_id,
    title,
    description,
    due_date,
    max_points,
    weight_percentage
  } = req.body;

  // Get created_by from authenticated user
  // const created_by = req.user.user_id;
  const userId = req.user.user_id;

  const teacherResult = await pool.query('SELECT teacher_id FROM teachers WHERE user_id = $1', [userId]);

  if (teacherResult.rows.length === 0) {
    return res.status(403).json({ error: 'No teacher profile found for this user' });
  }

  const created_by = teacherResult.rows[0].teacher_id;
  const file = req.file;
  let file_url = null;

  // Basic validation
  if (!course_id || !title || !due_date || !max_points || !weight_percentage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (file) {
      try {
        const uploadedFile = await fileHelper.uploadToBucket(file);
        file_url = uploadedFile.publicUrl;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file' });
      }
    }

    const query = `
      INSERT INTO assignments 
      (course_id, title, description, due_date, max_points, weight_percentage, created_by, file_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;

    const values = [
      parseInt(course_id),
      title,
      description,
      new Date(due_date).toISOString(),
      parseInt(max_points),
      parseFloat(weight_percentage),
      created_by,
      file_url
    ];

    console.log('Inserting with values:', values);
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to create assignment' });
    }

    res.status(201).json({ message: 'Assignment created', assignment: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    // Check for foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid course_id or created_by user ID' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/debug/check-fk/:courseId/:userId', async (req, res) => {
  const { courseId, userId } = req.params;

  try {
    // Check if course exists
    const courseQuery = 'SELECT * FROM courses WHERE course_id = $1';
    const courseResult = await pool.query(courseQuery, [courseId]);

    // Check if user exists (try both common table names)
    let userResult;
    try {
      const userQuery = 'SELECT * FROM users WHERE user_id = $1';
      userResult = await pool.query(userQuery, [userId]);
    } catch (err) {
      // If users table doesn't exist, try accounts or other common names
      try {
        const accountQuery = 'SELECT * FROM accounts WHERE user_id = $1';
        userResult = await pool.query(accountQuery, [userId]);
      } catch (err2) {
        userResult = { rows: [], error: 'User table not found' };
      }
    }

    res.json({
      course: {
        exists: courseResult.rows.length > 0,
        data: courseResult.rows[0] || null,
        total_courses: courseResult.rows.length
      },
      user: {
        exists: userResult.rows.length > 0,
        data: userResult.rows[0] || null,
        total_users: userResult.rows.length,
        error: userResult.error || null
      }
    });
  } catch (err) {
    console.error('Debug FK error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Get all assignments for a course by course_code
router.get('/course_code/:course_code', async (req, res) => {
  const { course_code } = req.params;
  const query = `SELECT a.* FROM assignments a
                 JOIN courses c ON a.course_id = c.course_id
                  WHERE c.course_code = $1`;
  const values = [course_code];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(200).json([]); // Return empty array instead of error message
    }
    // If the query was successful, extract the data
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.json(data);
});

// Get all assignments for a course
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;
  console.log(`Fetching assignments for course ID: ${course_id}`);
  const query = 'SELECT * FROM assignments WHERE course_id = $1';
  const values = [course_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    console.log(`Query result for course ID ${course_id}:`, result.rows);
    if (result.rows.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404 error
    }
    // If the query was successful, extract the data
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);
});



// Get assignment by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM assignments WHERE assignment_id = $1';
  const values = [id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows returned, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.json(data);
});



// Update assignment
router.put('/:id', upload.single('assignmentFile'), async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, max_points, weight_percentage } = req.body;
  const file = req.file;
  let file_url = req.body.file_url; // This will be null if no file is sent or if explicitly set to null

  try {
    // Fetch current assignment to get existing file_url
    const currentAssignmentQuery = 'SELECT file_url FROM assignments WHERE assignment_id = $1';
    const currentAssignmentResult = await pool.query(currentAssignmentQuery, [id]);
    const currentFileUrl = currentAssignmentResult.rows[0]?.file_url;

    if (file) {
      // New file uploaded, delete old one if exists
      if (currentFileUrl) {
        await fileHelper.deleteFromBucket(currentFileUrl);
      }
      const uploadedFile = await fileHelper.uploadToBucket(file);
      file_url = uploadedFile.publicUrl;
    } else if (file_url === null && currentFileUrl) {
      // Explicitly removing file, delete from bucket
      await fileHelper.deleteFromBucket(currentFileUrl);
    }

    const query = `
      UPDATE assignments
      SET title = $1, description = $2, due_date = $3, max_points = $4, weight_percentage = $5, file_url = $6
      WHERE assignment_id = $7
      RETURNING *`;
    const values = [
      title,
      description,
      due_date,
      max_points,
      weight_percentage,
      file_url,
      id
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    const data = result.rows[0];
    res.json({ message: 'Assignment updated', assignment: data });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get the file_url before deleting the assignment
    const getFileQuery = 'SELECT file_url FROM assignments WHERE assignment_id = $1';
    const fileResult = await pool.query(getFileQuery, [id]);
    const file_url = fileResult.rows[0]?.file_url;

    const query = 'DELETE FROM assignments WHERE assignment_id = $1 RETURNING *';
    const values = [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // If a file was associated, delete it from Supabase
    if (file_url) {
      await fileHelper.deleteFromBucket(file_url);
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
