// server/routes/progress.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// Update or create progress record for a student in a course
router.post('/', async (req, res) => {
  const { student_id, course_id, progress } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO Progress (student_id, course_id, progress) 
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, course_id)
       DO UPDATE SET progress = EXCLUDED.progress RETURNING *`,
      [student_id, course_id, progress]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get progress of a student in a course
router.get('/:student_id/:course_id', async (req, res) => {
  const { student_id, course_id } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM Progress WHERE student_id = $1 AND course_id = $2`,
      [student_id, course_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
