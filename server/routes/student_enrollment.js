import express from 'express';
import pool from '../db.js';

const router = express.Router();


// Enroll student to course
router.post('/:id/enroll-student', async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

    const query = 'INSERT INTO Student_Enrollment (course_id, student_id) VALUES ($1, $2) RETURNING *';
    const values = [id, student_id];
    let data;
    let error;
    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Failed to enroll student' });
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

  res.json({ message: 'Student enrolled to course' });
});