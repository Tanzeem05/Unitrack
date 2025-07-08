// server/routes/assignments.js
import express from 'express';
import multer from 'multer';
import * as fileHelper from '../utils/file.js';
import pool from '../db.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create an assignment
router.post('/', upload.single('assignmentFile'), async (req, res) => {
  const {
    course_id,
    title,
    description,
    due_date,
    max_points,
    weight_percentage,
    created_by
  } = req.body;
  const file = req.file;
  let file_url = null;

  try {
    if (file) {
      const uploadedFile = await fileHelper.uploadToBucket(file);
      file_url = uploadedFile.publicUrl;
    }

    console.log(file_url);
    const query = `
      INSERT INTO assignments 
      (course_id, title, description, due_date, max_points, weight_percentage, created_by, file_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;

    const values = [course_id, title, description, due_date, max_points, weight_percentage, created_by, file_url];
    
    const result = await pool.query(query, values);
    console.log('Insert result:', result);


    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to create assignment' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows returned, unexpected behavior' });
    }
    const data = result.rows[0];
    res.status(201).json({ message: 'Assignment created', assignment: data });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Get all assignments for a course by course_code
router.get('/course_code/:course_code', async (req, res) => {
  const { course_code } = req.params;
  const query = `SELECT a.* FROM Assignments a
                 JOIN Courses c ON a.course_id = c.course_id
                  WHERE c.course_code = $1`;
  const values = [course_code];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(200).json({ error: 'No assignments found for this course' });
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
  const query = 'SELECT * FROM Assignments WHERE course_id = $1';
  const values = [course_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    console.log(`Query result for course ID ${course_id}:`, result.rows);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this course' });
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

  const query = 'SELECT * FROM Assignments WHERE assignment_id = $1';
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
    const currentAssignmentQuery = 'SELECT file_url FROM Assignments WHERE assignment_id = $1';
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
      UPDATE Assignments
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
    const getFileQuery = 'SELECT file_url FROM Assignments WHERE assignment_id = $1';
    const fileResult = await pool.query(getFileQuery, [id]);
    const file_url = fileResult.rows[0]?.file_url;

    const query = 'DELETE FROM Assignments WHERE assignment_id = $1 RETURNING *';
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
