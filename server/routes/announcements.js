import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a new announcement
router.post('/:created_by', async (req, res) => {
  const { created_by } = req.params;
  const { course_id, title, content } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO announcements (course_id, title, content, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [course_id, title, content, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all announcements for a course (for teachers)
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;
  console.log(`Fetching all announcements for course_id: ${course_id}`);

  try {
    // const result = await db.query(
    //   `SELECT a.*, t.teacher_id, u.first_name || ' ' || u.last_name as teacher_name
    //    FROM announcements a
    //    LEFT JOIN teachers t ON a.created_by = t.teacher_id
    //    LEFT JOIN users u ON t.user_id = u.user_id
    //    WHERE a.course_id = $1 AND a.is_deleted = false
    //    ORDER BY a.created_at DESC`,
    //   [course_id]
    // );

    const result = await db.query(
      `SELECT * FROM announcements a
       WHERE a.course_id = $1 AND a.is_deleted = false`,
      [course_id]
    );

    console.log(`Found ${result.rows.length} announcements for course ${course_id}`);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error details:', err);
    console.error('Error message:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Get announcements by course, marking which are unread for the student
router.get('/course/:course_id/:student_id', async (req, res) => {
  const { course_id, student_id } = req.params;
  console.log(`Fetching announcements for course_id: ${course_id} and student_id: ${student_id}`);

  try {
    // Get the user_id for the student first
    const studentResult = await db.query(
      `SELECT user_id FROM students WHERE student_id = $1`,
      [student_id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const user_id = studentResult.rows[0].user_id;
    
    const result = await db.query(
      `SELECT a.*, u1.first_name || ' ' || u1.last_name as teacher_name, 
              CASE WHEN av.user_id IS NOT NULL THEN true ELSE false END as is_read
       FROM announcements a
       LEFT JOIN announcement_views av 
         ON a.announcement_id = av.announcement_id AND av.user_id = $2
       LEFT JOIN course_teachers ct ON a.course_id = ct.course_id
       LEFT JOIN teachers t ON ct.teacher_id = t.teacher_id
       LEFT JOIN users u1 ON t.user_id = u1.user_id
       WHERE a.course_id = $1
       ORDER BY a.created_at DESC`,
      [course_id, user_id]
    );

    console.log('Basic announcements found:', result.rows.length);
    res.json(result.rows);
    
  } catch (err) {
    console.error('DB error details:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({ error: err.message, details: err.detail });
  }
});


// Get a specific announcement by title
router.get('/title/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM announcements WHERE title = $1`,
      [title]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update an announcement
router.put('/:announcement_id', async (req, res) => {
  const { announcement_id } = req.params;
  const { title, content, updated_by } = req.body;

  try {
    const result = await db.query(
      `UPDATE announcements 
       SET title = $1, content = $2, updated_by = $3, updated_at = NOW() 
       WHERE announcement_id = $4 RETURNING *`,
      [title, content, updated_by, announcement_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Count unread announcements for a course
router.get('/unread/:course_id/:student_id', async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const studentId = parseInt(req.params.student_id, 10);

  if (isNaN(courseId) || isNaN(studentId)) {
    return res.status(400).json({ error: 'Invalid course or student ID' });
  }

  try {
    // Get the user_id for the student first
    const studentResult = await db.query(
      `SELECT user_id FROM students WHERE student_id = $1`,
      [studentId]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const user_id = studentResult.rows[0].user_id;

    const result = await db.query(
      `SELECT COUNT(*) FROM announcements 
       WHERE course_id = $1 AND announcement_id NOT IN (
         SELECT announcement_id FROM announcement_views 
         WHERE user_id = $2
       )`,
      [courseId, user_id]
    );

    res.json({ unread_count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Mark an announcement as read 
router.post('/read', async (req, res) => {
  const { announcement_id, student_id } = req.body;

  try {
    // Get the user_id for the student first
    const studentResult = await db.query(
      `SELECT user_id FROM students WHERE student_id = $1`,
      [student_id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const user_id = studentResult.rows[0].user_id;

    const result = await db.query(
      `INSERT INTO announcement_views (announcement_id, user_id, viewed_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [announcement_id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to mark announcement as read' });
    }
    res.status(201).json({ message: 'Announcement marked as read', view: result.rows[0] });
    } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
    }
}
);

//Delete announcements
router.delete('/delete/:announcement_id' , async (req,res) => {
  const { announcement_id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM announcements WHERE announcement_id = $1 RETURNING *`,
      [announcement_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all announcements for a student
router.get('/student/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await db.query(
       `SELECT a.*, c.course_name, u1.username as teacher_name
       FROM announcements a
       JOIN courses c ON a.course_id = c.course_id
       JOIN course_teachers ct ON c.course_id = ct.course_id
       JOIN teachers t ON ct.teacher_id = t.teacher_id
       JOIN users u1 ON t.user_id = u1.user_id
       JOIN student_enrollment se ON c.course_id = se.course_id
       JOIN students s ON se.student_id = s.student_id
       JOIN users u ON s.user_id = u.user_id
       WHERE u.username = $1
       ORDER BY a.created_at DESC`,
      [username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get announcements by course code and username (simplified approach)
router.get('/course-code/:course_code/username/:username', async (req, res) => {
  const { course_code, username } = req.params;
  console.log(`Fetching announcements for course_code: ${course_code} and username: ${username}`);

  try {
    const result = await db.query(
      `SELECT a.*, c.course_name, u1.first_name || ' ' || u1.last_name as teacher_name,
              CASE WHEN av.user_id IS NOT NULL THEN true ELSE false END as is_read
       FROM announcements a
       JOIN courses c ON a.course_id = c.course_id
       JOIN course_teachers ct ON c.course_id = ct.course_id
       JOIN teachers t ON ct.teacher_id = t.teacher_id
       JOIN users u1 ON t.user_id = u1.user_id
       JOIN student_enrollment se ON c.course_id = se.course_id
       JOIN students s ON se.student_id = s.student_id
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN announcement_views av ON a.announcement_id = av.announcement_id AND av.user_id = u.user_id
       WHERE c.course_code = $1 AND u.username = $2
       ORDER BY a.created_at DESC`,
      [course_code, username]
    );

    console.log(`Found ${result.rows.length} announcements for course ${course_code}`);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error details:', err);
    console.error('Error message:', err.message);
    res.status(500).json({ error: err.message });
  }
});


export default router;