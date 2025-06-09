import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a new announcement
router.post('/:created_by', async (req, res) => {
  const { course_id, title, content } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO Announcements (course_id, title, content, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [course_id, title, content, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get announcements by course, marking which are unread for the student
router.get('/course/:course_id/:student_id', async (req, res) => {
  const { course_id, student_id } = req.params;

  try {
    const result = await db.query(
      `SELECT a.*, 
              av.student_id IS NOT NULL AS is_read
       FROM Announcements a
       LEFT JOIN Announcement_Views av 
         ON a.id = av.announcement_id AND av.student_id = $2
       WHERE a.course_id = $1
       ORDER BY a.created_at DESC`,
      [course_id, student_id]
    );

    // is_read will be true or false
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Get a specific announcement by title
router.get('/title/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM Announcements WHERE title = $1`,
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
      `UPDATE Announcements 
       SET title = $1, content = $2, updated_by = $3, updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
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
    const result = await db.query(
      `SELECT COUNT(*) FROM Announcements 
       WHERE course_id = $1 AND id NOT IN (
         SELECT announcement_id FROM Announcement_Views 
         WHERE student_id = $2
       )`,
      [courseId, studentId]
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
    const result = await db.query(
      `INSERT INTO Announcement_Views (announcement_id, student_id, viewed_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [announcement_id, student_id]
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
      `DELETE FROM Announcements WHERE id = $1 RETURNING *`,
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


export default router;
