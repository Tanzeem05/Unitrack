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
    INSERT INTO Courses (course_code, course_name, description, start_date, end_date, created_by, updated_by)
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

  const query = 'SELECT * FROM Courses';
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
router.get('/:id', async (req, res) => {

  const { id } = req.params;
  const query = 'SELECT * FROM Courses WHERE course_id = $1';
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




// Update course
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const query = `UPDATE Courses  
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
    data = await pool.query('SELECT * FROM Courses WHERE course_id = $1', [id]);
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

  const query = 'DELETE FROM Courses WHERE course_id = $1 RETURNING *';
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

export default router;



// NO need to create assignments and submissions routes here, as they are handled in the assignmentRoutes file.

// // Create assignment
// router.post('/:id/assignments', async (req, res) => {
//   const { id } = req.params;
//   const {
//     title,
//     description,
//     due_date,
//     max_points,
//     weight_percentage,
//     created_by
//   } = req.body;

//   const { data, error } = await supabase.from('Assignments').insert([
//     {
//       course_id: id,
//       title,
//       description,
//       due_date,
//       max_points,
//       weight_percentage,
//       created_by
//     }
//   ]).select();

//   if (error) return res.status(500).json({ error: error.message });
//   res.status(201).json({ message: 'Assignment created', assignment: data[0] });
// });



// // Get assignments for a course
// router.get('/:id/assignments', async (req, res) => {
//   const { id } = req.params;
//   const { data, error } = await supabase.from('Assignments').select('*').eq('course_id', id);
//   if (error) return res.status(500).json({ error: error.message });
//   res.json(data);
// });



// // Submit assignment
// router.post('/:courseId/assignments/:assignmentId/submit', async (req, res) => {
//   const { assignmentId } = req.params;
//   const { student_id, points_earned, feedback, graded_by } = req.body;

//   const { data, error } = await supabase.from('Assignment_Submissions').insert([
//     {
//       assignment_id: assignmentId,
//       student_id,
//       points_earned,
//       feedback,
//       graded_by
//     }
//   ]).select();

//   if (error) return res.status(500).json({ error: error.message });
//   res.status(201).json({ message: 'Assignment submitted', submission: data[0] });
// });

// // Get all submissions for an assignment
// router.get('/:courseId/assignments/:assignmentId/submissions', async (req, res) => {
//   const { assignmentId } = req.params;
//   const { data, error } = await supabase.from('Assignment_Submissions').select('*').eq('assignment_id', assignmentId);
//   if (error) return res.status(500).json({ error: error.message });
//   res.json(data);
// });


