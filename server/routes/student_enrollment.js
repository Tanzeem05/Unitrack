import express from 'express';
import pool from '../db.js';

const router = express.Router();

console.log('✅ student_enrollment.js is loaded');


// Enroll student to course
router.post('/:id/enroll-student', async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  console.log('Enroll request:', { course_id: id, received_id: student_id });

  try {
    // Check if the course is completed before allowing student enrollment
    const courseCheck = await pool.query(
      'SELECT end_date FROM courses WHERE course_id = $1',
      [id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseCheck.rows[0];
    const currentDate = new Date();
    const isEndDatePassed = course.end_date && new Date(course.end_date) < currentDate;
    
    if (isEndDatePassed) {
      return res.status(400).json({ error: 'Cannot enroll students in a completed course' });
    }

    // The frontend always sends user_id, so convert it to student_id
    const userToStudentCheck = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [student_id]
    );
    
    if (userToStudentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    const actualStudentId = userToStudentCheck.rows[0].student_id;
    console.log(`Converting user_id ${student_id} to student_id ${actualStudentId}`);

    // Check if student is already enrolled
    const checkQuery = 'SELECT * FROM student_enrollment WHERE course_id = $1 AND student_id = $2';
    const checkResult = await pool.query(checkQuery, [id, actualStudentId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }

    // If not enrolled, proceed with enrollment
    const insertQuery = 'INSERT INTO student_enrollment (course_id, student_id) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(insertQuery, [id, actualStudentId]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to enroll student' });
    }

    res.json({ 
      message: 'Student enrolled successfully', 
      data: result.rows[0] 
    });

  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Enroll student to course using username and course code
router.post('/:course_code/enroll-student-username', async (req, res) => {
  const { course_code } = req.params;
  const { username } = req.body;

  // First, check if the course exists
  const courseCheck = await pool.query(
    'SELECT course_id FROM Courses WHERE course_code = $1',
    [course_code]
  );
  if (courseCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Then, check if the student exists
  const studentCheck = await pool.query(
    'SELECT student_id FROM Students s JOIN Users u ON s.user_id = u.user_id WHERE u.username = $1',
    [username]
  );
  if (studentCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }

  // If both exist, proceed with enrollment
  const query = `
    INSERT INTO Student_Enrollment (course_id, student_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  const values = [courseCheck.rows[0].course_id, studentCheck.rows[0].student_id];

  try {
    const result = await pool.query(query, values);
    res.json({ message: 'Student enrolled successfully', data: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Remove/Unenroll student from course
router.delete('/:course_id/remove-student/:student_user_id', async (req, res) => {
  const { course_id, student_user_id } = req.params;

  console.log('Remove student request:', { course_id, student_user_id });

  try {
    // Convert user_id to student_id
    const userToStudentCheck = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [student_user_id]
    );
    
    if (userToStudentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    const actualStudentId = userToStudentCheck.rows[0].student_id;
    console.log(`Converting user_id ${student_user_id} to student_id ${actualStudentId}`);

    // Check if student is enrolled in the course
    const checkQuery = 'SELECT * FROM student_enrollment WHERE course_id = $1 AND student_id = $2';
    const checkResult = await pool.query(checkQuery, [course_id, actualStudentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(400).json({ error: 'Student is not enrolled in this course' });
    }

    // Remove the enrollment
    const deleteQuery = 'DELETE FROM student_enrollment WHERE course_id = $1 AND student_id = $2 RETURNING *';
    const result = await pool.query(deleteQuery, [course_id, actualStudentId]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to remove student from course' });
    }

    res.json({ 
      message: 'Student removed from course successfully', 
      data: result.rows[0] 
    });

  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all enrolled students for a course and using username
router.get('/:course_code/enrolled-students', async (req, res) => {
  const { course_code } = req.params;
  
  const query = `
    select u.username, u.first_name, u.last_name, u.batch_year
    from Student_Enrollment se
    join Students s on se.student_id = s.student_id
    join Users u on s.user_id = u.user_id
    where se.course_id = (select course_id from Courses where course_code = $1)
  `;

  
  const values = [course_code];
  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
