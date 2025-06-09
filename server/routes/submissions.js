// server/routes/submissions.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Submit assignment
router.post('/', async (req, res) => {
  const { assignment_id, student_id } = req.body;

  const query = `
    INSERT INTO Assignment_Submissions (assignment_id, student_id)
    VALUES ($1, $2)
    RETURNING *`;
  const values = [assignment_id, student_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to submit assignment' });
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
  res.status(201).json({ message: 'Submission successful', submission: data });
});

// Get submissions by assignment
router.get('/assignment/:assignment_id', async (req, res) => {
  const { assignment_id } = req.params;

  const query = 'SELECT * FROM Assignment_Submissions WHERE assignment_id = $1';
  const values = [assignment_id];
  let data;
  let error;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No submissions found for this assignment' });
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

  res.json(data);
});

// Get submissions by student
router.get('/student/:student_id', async (req, res) => {
  const { student_id } = req.params;

  const query = 'SELECT * FROM Assignment_Submissions WHERE student_id = $1';
  const values = [student_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No submissions found for this student' });
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

  res.json(data);
});

// Grade a submission
router.put('/:submission_id/grade', async (req, res) => {
  const { submission_id } = req.params;
  const { points_earned, feedback, graded_by } = req.body;

  // const { data, error } = await supabase
  //   .from('Assignment_Submissions')
  //   .update({
  //     points_earned,
  //     feedback,
  //     graded_by,
  //     graded_at: new Date().toISOString()
  //   })
  //   .eq('submission_id', submission_id)
  //   .select()
  //   .single();

  // if (error) return res.status(500).json({ error: error.message });

  const query = `
    UPDATE Assignment_Submissions
    SET points_earned = $1, feedback = $2, graded_by = $3, graded_at = NOW()
    WHERE submission_id = $4
    RETURNING *`;
  const values = [points_earned, feedback, graded_by, submission_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows updated, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.json({ message: 'Submission graded', submission: data });
});

// Delete submission
router.delete('/:submission_id', async (req, res) => {
  const { submission_id } = req.params;
  // const { error } = await supabase
  //   .from('Assignment_Submissions')
  //   .delete()
  //   .eq('submission_id', submission_id);

  // if (error) return res.status(500).json({ error: error.message });
  const query = 'DELETE FROM Assignment_Submissions WHERE submission_id = $1 RETURNING *';
  const values = [submission_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows deleted, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.json({ message: 'Submission deleted successfully' });
});

export default router;
//We need a trigger such that when a submission is graded, the average grade for the assignment is updated in the Assignments table.
// This can be done using a PostgreSQL trigger function that calculates the average grade
// and updates the Assignments table whenever a submission is graded.
// ** CREATE OR REPLACE FUNCTION update_assignment_average()
// RETURNS TRIGGER AS $$
// BEGIN
//     UPDATE Assignments
//     SET average_grade = (
//         SELECT AVG(points_earned)
//         FROM Assignment_Submissions
//         WHERE assignment_id = NEW.assignment_id
//           AND points_earned IS NOT NULL
//     )
//     WHERE assignment_id = NEW.assignment_id;

//     RETURN NEW;
// END;

//We also need to create a trigger that calls this function after an update on the Assignment_Submissions table.
// **CREATE TRIGGER after_submission_update
// AFTER UPDATE ON Assignment_Submissions
// FOR EACH ROW
// EXECUTE FUNCTION update_assignment_average();


// We again need to create a trigger so that when a submission is deleted, the average grade for the assignment is updated in the Assignments table.
// ** CREATE OR REPLACE FUNCTION update_assignment_average_on_delete()
// RETURNS TRIGGER AS $$
// BEGIN
//     UPDATE Assignments
//     SET average_grade = (
//         SELECT AVG(points_earned)  
//         FROM Assignment_Submissions
//         WHERE assignment_id = OLD.assignment_id
//           AND points_earned IS NOT NULL
//     )
//     WHERE assignment_id = OLD.assignment_id;
//     RETURN OLD;
// END;

// CREATE TRIGGER after_submission_delete
// AFTER DELETE ON Assignment_Submissions
// FOR EACH ROW
// EXECUTE FUNCTION update_assignment_average_on_delete();

// We need a trigger function so that when an assignment is deleted, all submissions related to that assignment are also deleted.
// ** CREATE OR REPLACE FUNCTION delete_submissions_on_assignment_delete()
// RETURNS TRIGGER AS $$
// BEGIN
//     DELETE FROM Assignment_Submissions
//     WHERE assignment_id = OLD.assignment_id;
//     RETURN OLD;
// END;

// CREATE TRIGGER after_assignment_delete
// AFTER DELETE ON Assignments
// FOR EACH ROW
// EXECUTE FUNCTION delete_submissions_on_assignment_delete();


// We need a trigger function so that when a course is deleted, all assignments related to that course are also deleted.
// ** CREATE OR REPLACE FUNCTION delete_assignments_on_course_delete()
// RETURNS TRIGGER AS $$
// BEGIN
//     DELETE FROM Assignments
//     WHERE course_id = OLD.course_id;
//     RETURN OLD;
// END;
//
// CREATE TRIGGER after_course_delete
// AFTER DELETE ON Courses
// FOR EACH ROW
// EXECUTE FUNCTION delete_assignments_on_course_delete();
//


