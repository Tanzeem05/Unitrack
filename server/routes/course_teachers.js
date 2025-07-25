import express from 'express';
import pool from '../db.js';

const router = express.Router();


// Assign teachers to course
router.post('/:id/assign-teacher', async (req, res) => {
  const { id } = req.params;
  const { teacher_id } = req.body;

  console.log('Assign teacher request:', { course_id: id, received_id: teacher_id });

  try {
    // The frontend always sends user_id, so convert it to teacher_id
    const userToTeacherCheck = await pool.query(
      'SELECT teacher_id FROM teachers WHERE user_id = $1',
      [teacher_id]
    );
    
    if (userToTeacherCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Teacher not found' });
    }
    
    const actualTeacherId = userToTeacherCheck.rows[0].teacher_id;
    console.log(`Converting user_id ${teacher_id} to teacher_id ${actualTeacherId}`);

    // Check if teacher is already assigned to this course
    const checkQuery = 'SELECT * FROM course_teachers WHERE course_id = $1 AND teacher_id = $2';
    const checkResult = await pool.query(checkQuery, [id, actualTeacherId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Teacher is already assigned to this course' });
    }

    // If not assigned, proceed with assignment
    const insertQuery = 'INSERT INTO Course_Teachers (course_id, teacher_id) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(insertQuery, [id, actualTeacherId]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to assign teacher' });
    }

    res.json({ 
      message: 'Teacher assigned successfully', 
      data: result.rows[0] 
    });

  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update teacher for a course
router.put('/:course_id/teacher/:teacher_id', async (req, res) => {
  const { course_id, teacher_id } = req.params;
  const { new_teacher_id } = req.body;

  try {
    const query = 'UPDATE Course_Teachers SET teacher_id = $1 WHERE course_id = $2 AND teacher_id = $3 RETURNING *';
    const values = [new_teacher_id, course_id, teacher_id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course-teacher assignment not found' });
    }
    res.json({ message: 'Teacher updated for course', assignment: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete teacher from a course
router.delete('/:course_id/teacher/:teacher_id', async (req, res) => {
  const { course_id, teacher_id } = req.params;

  try {
    const query = 'DELETE FROM Course_Teachers WHERE course_id = $1 AND teacher_id = $2 RETURNING *';
    const values = [course_id, teacher_id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course-teacher assignment not found' });
    }
    res.json({ message: 'Teacher removed from course' });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;