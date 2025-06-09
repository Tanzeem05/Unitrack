import express from 'express';
import pool from '../db.js';

const router = express.Router();


// Assign teachers to course
router.post('/:id/assign-teacher', async (req, res) => {
  const { id } = req.params;
  const { teacher_id } = req.body;

    const query = 'INSERT INTO Course_Teachers (course_id, teacher_id) VALUES ($1, $2) RETURNING *';
    const values = [id, teacher_id];
    let data;
    let error;
    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Failed to assign teacher' });
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

  res.json({ message: 'Teacher assigned to course' });
});