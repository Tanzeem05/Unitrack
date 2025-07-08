import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all submissions for a specific assignment
router.get('/assignment/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const query = `
      SELECT
        s.*,
        u.username,
        u.first_name,
        u.last_name
      FROM Assignment_Submissions s
      JOIN Students st ON s.student_id = st.student_id
      JOIN Users u ON st.user_id = u.user_id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC;
    `;
    const result = await pool.query(query, [assignmentId]);
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'No submissions found for this assignment.' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error('DB error fetching submissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific submission (for grading)
router.put('/:submissionId', async (req, res) => {
  const { submissionId } = req.params;
  const { points_earned, feedback, graded_by } = req.body; // graded_by should be user_id of the teacher

  try {
    const query = `
      UPDATE Assignment_Submissions
      SET
        points_earned = $1,
        feedback = $2,
        graded_by = $3,
        graded_at = NOW()
      WHERE submission_id = $4
      RETURNING *;
    `;
    const values = [points_earned, feedback, graded_by, submissionId];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    res.json({ message: 'Submission updated successfully', submission: result.rows[0] });
  } catch (err) {
    console.error('DB error updating submission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;