// server/routes/course_resources.js
import express from 'express';
import multer from 'multer';
import db from '../db.js';
import * as fileHelper from '../utils/file.js'; 
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// use memory storage since we'll upload to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// Create a new resource thread (teachers only)
router.post('/:course_id/threads', authenticateToken, async (req, res) => {
  const { course_id } = req.params;
  const { title } = req.body;
  const userId = req.user.user_id;

  try {
    // Validate input
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Verify user is a teacher for this course
    const teacherCheck = await db.query(
      `SELECT t.teacher_id FROM teachers t 
       JOIN course_teachers ct ON t.teacher_id = ct.teacher_id 
       WHERE t.user_id = $1 AND ct.course_id = $2`,
      [userId, course_id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only teachers can create resource threads' });
    }

    const teacherId = teacherCheck.rows[0].teacher_id;

    // Create resource thread (only title required)
    const result = await db.query(
      `INSERT INTO resource_threads (course_id, title, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [course_id, title, teacherId]
    );

    res.status(201).json({ 
      message: 'Resource thread created successfully',
      thread: result.rows[0] 
    });
  } catch (err) {
    console.error('Error creating resource thread:', err);
    res.status(500).json({ error: 'Failed to create resource thread', details: err.message });
  }
});

// Upload a file to a resource thread (teachers only)
router.post('/:course_id/threads/:thread_id/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { course_id, thread_id } = req.params;
  const { description } = req.body;
  const file = req.file;
  const userId = req.user.user_id;

  try {
    // Validate input
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required when uploading a file' });
    }

    // Verify user is a teacher for this course
    const teacherCheck = await db.query(
      `SELECT t.teacher_id FROM teachers t 
       JOIN course_teachers ct ON t.teacher_id = ct.teacher_id 
       WHERE t.user_id = $1 AND ct.course_id = $2`,
      [userId, course_id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only teachers can upload resource files' });
    }

    // Verify thread exists and belongs to this course
    const threadCheck = await db.query(
      `SELECT * FROM resource_threads WHERE thread_id = $1 AND course_id = $2 AND is_deleted = false`,
      [thread_id, course_id]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Resource thread not found' });
    }

    const { publicUrl, uniqueFileName } = await fileHelper.uploadToBucket(file);

    const result = await db.query(
      `INSERT INTO resource_files (thread_id, file_name, file_path, file_type, file_size, description, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [thread_id, file.originalname, publicUrl, file.mimetype, file.size, description, teacherCheck.rows[0].teacher_id]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: result.rows[0]
    });
  } catch (err) {
    console.error('Error uploading resource file:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Get all resource threads for a course
router.get('/:course_id/threads', authenticateToken, async (req, res) => {
  const { course_id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT rt.*, u.first_name, u.last_name, u.username,
              COUNT(rf.file_id) as file_count
       FROM resource_threads rt
       JOIN teachers t ON rt.created_by = t.teacher_id
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN resource_files rf ON rt.thread_id = rf.thread_id AND rf.is_deleted = false
       WHERE rt.course_id = $1 AND rt.is_deleted = false
       GROUP BY rt.thread_id, u.first_name, u.last_name, u.username
       ORDER BY rt.created_at DESC`,
      [course_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resource threads:', err);
    res.status(500).json({ error: 'Failed to fetch resource threads', details: err.message });
  }
});

// Get all resource threads with their files for a course (comprehensive endpoint)
router.get('/:course_id', authenticateToken, async (req, res) => {
  const { course_id } = req.params;
  const userId = req.user.user_id;
  
  try {
    // Check if user has access to this course (student or teacher)
    const accessCheck = await db.query(
      `SELECT 'teacher' as role FROM teachers t 
       JOIN course_teachers ct ON t.teacher_id = ct.teacher_id 
       WHERE t.user_id = $1 AND ct.course_id = $2
       UNION
       SELECT 'student' as role FROM students s 
       JOIN student_enrollment se ON s.student_id = se.student_id 
       WHERE s.user_id = $1 AND se.course_id = $2`,
      [userId, course_id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }

    // Get all threads for the course
    const threadsResult = await db.query(
      `SELECT rt.*, u.first_name, u.last_name, u.username
       FROM resource_threads rt
       JOIN teachers t ON rt.created_by = t.teacher_id
       JOIN users u ON t.user_id = u.user_id
       WHERE rt.course_id = $1 AND rt.is_deleted = false
       ORDER BY rt.created_at DESC`,
      [course_id]
    );

    // Get all files for these threads
    const threadsWithFiles = await Promise.all(
      threadsResult.rows.map(async (thread) => {
        const filesResult = await db.query(
          `SELECT rf.*, u.first_name, u.last_name, u.username
           FROM resource_files rf
           JOIN teachers t ON rf.uploaded_by = t.teacher_id
           JOIN users u ON t.user_id = u.user_id
           WHERE rf.thread_id = $1 AND rf.is_deleted = false
           ORDER BY rf.uploaded_at DESC`,
          [thread.thread_id]
        );

        return {
          ...thread,
          files: filesResult.rows
        };
      })
    );

    res.json({
      threads: threadsWithFiles
    });
  } catch (err) {
    console.error('Error fetching course resources:', err);
    res.status(500).json({ error: 'Failed to fetch course resources', details: err.message });
  }
});

// Get files for a specific resource thread
router.get('/:course_id/threads/:thread_id/files', authenticateToken, async (req, res) => {
  const { thread_id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT rf.*, u.first_name, u.last_name, u.username
       FROM resource_files rf
       JOIN teachers t ON rf.uploaded_by = t.teacher_id
       JOIN users u ON t.user_id = u.user_id
       WHERE rf.thread_id = $1 AND rf.is_deleted = false
       ORDER BY rf.uploaded_at DESC`,
      [thread_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resource files:', err);
    res.status(500).json({ error: 'Failed to fetch resource files', details: err.message });
  }
});

// Download/redirect to resource file
router.get('/files/:file_id/download', authenticateToken, async (req, res) => {
  const { file_id } = req.params;
  
  try {
    const result = await db.query(`SELECT * FROM resource_files WHERE file_id = $1 AND is_deleted = false`, [file_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.redirect(result.rows[0].file_path);
  } catch (err) {
    console.error('Error downloading resource file:', err);
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

// Delete resource thread (teachers only)
router.delete('/:course_id/threads/:thread_id', authenticateToken, async (req, res) => {
  const { course_id, thread_id } = req.params;
  const userId = req.user.user_id;

  try {
    // Verify user is a teacher for this course
    const teacherCheck = await db.query(
      `SELECT t.teacher_id FROM teachers t 
       JOIN course_teachers ct ON t.teacher_id = ct.teacher_id 
       WHERE t.user_id = $1 AND ct.course_id = $2`,
      [userId, course_id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only teachers can delete resource threads' });
    }

    await db.query(`UPDATE resource_threads SET is_deleted = true WHERE thread_id = $1 AND course_id = $2`, [thread_id, course_id]);

    res.json({ message: 'Resource thread deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource thread:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
});

// Delete resource file (teachers only)
router.delete('/files/:file_id', authenticateToken, async (req, res) => {
  const { file_id } = req.params;
  const userId = req.user.user_id;

  try {
    // Get file and verify teacher permissions
    const fileCheck = await db.query(
      `SELECT rf.*, rt.course_id FROM resource_files rf
       JOIN resource_threads rt ON rf.thread_id = rt.thread_id
       WHERE rf.file_id = $1`,
      [file_id]
    );

    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const courseId = fileCheck.rows[0].course_id;

    // Verify user is a teacher for this course
    const teacherCheck = await db.query(
      `SELECT t.teacher_id FROM teachers t 
       JOIN course_teachers ct ON t.teacher_id = ct.teacher_id 
       WHERE t.user_id = $1 AND ct.course_id = $2`,
      [userId, courseId]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only teachers can delete resource files' });
    }

    const filePath = fileCheck.rows[0].file_path;
    await fileHelper.deleteFromBucket(filePath);

    await db.query(`UPDATE resource_files SET is_deleted = true WHERE file_id = $1`, [file_id]);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource file:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
});

export default router;
