import express from 'express';
import pool from '../db.js';

const router = express.Router();


// Enroll student to course
<<<<<<< HEAD
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
=======
// router.post('/:id/enroll-student', async (req, res) => {
//   const { id } = req.params;
//   const { student_id } = req.body;

//     const query = 'INSERT INTO Student_Enrollment (course_id, student_id) VALUES ($1, $2) RETURNING *';
//     const values = [id, student_id];
//     let data;
//     let error;
//     try {
//         const result = await pool.query(query, values);

//         if (result.rows.length === 0) {
//             return res.status(400).json({ error: 'Failed to enroll student' });
//         }
//         if (result.rows.length > 1) {
//             return res.status(500).json({ error: 'Multiple rows returned, unexpected behavior' });
//         }
//         // If the query was successful, extract the data
//         data = result.rows[0];
//     } catch (err) {
//         console.error('DB error:', err);
//         return res.status(500).json({ error: 'Internal server error' });
//     }

//   res.json({ message: 'Student enrolled to course' });
// });

// Enroll student to course using username and course code
// router.post('/:course_code/enroll-student-username', async (req, res) => {
//   const { course_code } = req.params;
//   const { username } = req.body;

//   const query = `
//     INSERT INTO Student_Enrollment (course_id, student_id)
//     VALUES (
//       (SELECT course_id FROM Courses WHERE course_code = $1),
//       (SELECT student_id FROM Students s
//       JOIN Users u ON s.user_id = u.user_id
//       WHERE u.username = $2)
//     )
//     RETURNING *
//   `;
//   const values = [course_code, username];
//   try {
//     const result = await pool.query(query, values);
//     if (result.rows.length === 0) {
//       return res.status(400).json({ error: 'Failed to enroll student' });
//     }
//     res.json({ message: 'Student enrolled to course' });
//   } catch (err) {
//     console.error('DB error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

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
>>>>>>> master
