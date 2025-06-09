import express from 'express';
import db from '../db.js';

const router = express.Router();

// Upload file metadata (assuming file storage is handled externally, e.g., S3)
router.post('/', async (req, res) => {
  const { file_name, file_url, uploaded_by, course_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO Files (file_name, file_url, uploaded_by, course_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [file_name, file_url, uploaded_by, course_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all files for a course
router.get('/course/:course_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM Files WHERE course_id = $1',
      [req.params.course_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
