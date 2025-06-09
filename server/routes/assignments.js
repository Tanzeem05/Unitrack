// server/routes/assignments.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Create an assignment
router.post('/', async (req, res) => {
  const {
    course_id,
    title,
    description,
    due_date,
    max_points,
    weight_percentage,
    created_by
  } = req.body;

  const query = `
    INSERT INTO Assignments 
    (course_id, title, description, due_date, max_points, weight_percentage, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;

  const values = [course_id, title, description, due_date, max_points, weight_percentage, created_by];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to create assignment' });
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

  res.status(201).json({ message: 'Assignment created', assignment: data[0] });
});



// Get all assignments for a course
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;

  const query = 'SELECT * FROM Assignments WHERE course_id = $1';
  const values = [course_id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
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
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const query = `
    UPDATE Assignments
    SET title = $1, description = $2, due_date = $3, max_points = $4, weight_percentage = $5
    WHERE assignment_id = $6
    RETURNING *`;
  const values = [
    updates.title,
    updates.description,
    updates.due_date,
    updates.max_points,
    updates.weight_percentage,
    id
  ];
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

  res.json({ message: 'Assignment updated', assignment: data });
});



// Delete assignment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM Assignments WHERE assignment_id = $1 RETURNING *';
  const values = [id];
  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
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
  res.json({ message: 'Assignment deleted successfully' });
});

export default router;
