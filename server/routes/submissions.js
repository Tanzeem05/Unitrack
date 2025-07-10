import express from 'express';
import multer from 'multer';
import * as fileHelper from '../utils/file.js';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Submit an assignment (for students)
router.post('/', upload.single('file'), async (req, res) => {
  console.log('=== SUBMISSION REQUEST START ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
  console.log('User from auth:', req.user);
  
  const { assignment_id } = req.body;
  const student_user_id = req.user.user_id;
  const file = req.file;
  
  // Validate input
  if (!assignment_id) {
    console.log('Missing assignment_id');
    return res.status(400).json({ error: 'Assignment ID is required' });
  }
  
  if (!file) {
    console.log('Missing file');
    return res.status(400).json({ error: 'File is required' });
  }

  try {
    // First, check if assignment exists
    console.log('Checking if assignment exists:', assignment_id);
    const assignmentCheck = await pool.query('SELECT assignment_id FROM assignments WHERE assignment_id = $1', [assignment_id]);
    if (assignmentCheck.rows.length === 0) {
      console.log('Assignment not found:', assignment_id);
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Get student_id from user_id
    console.log('Looking up student for user_id:', student_user_id);
    const studentQuery = 'SELECT student_id FROM students WHERE user_id = $1';
    const studentResult = await pool.query(studentQuery, [student_user_id]);
    
    if (studentResult.rows.length === 0) {
      console.log('Student not found for user_id:', student_user_id);
      // Try to create student record if it doesn't exist
      try {
        const createStudentQuery = 'INSERT INTO students (user_id, student_number) VALUES ($1, $2) RETURNING student_id';
        const studentNumber = `STU${String(student_user_id).padStart(6, '0')}`;
        const createResult = await pool.query(createStudentQuery, [student_user_id, studentNumber]);
        console.log('Created student record:', createResult.rows[0]);
      } catch (createErr) {
        console.error('Failed to create student record:', createErr);
        return res.status(404).json({ error: 'Student not found and could not be created' });
      }
      
      // Re-fetch the student
      const newStudentResult = await pool.query(studentQuery, [student_user_id]);
      if (newStudentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student could not be found or created' });
      }
    }
    
    // Re-fetch student_id (in case we just created it)
    const finalStudentResult = await pool.query(studentQuery, [student_user_id]);
    const student_id = finalStudentResult.rows[0].student_id;
    console.log('Found student_id:', student_id);
    
    // Upload file to storage
    console.log('Uploading file to storage...');
    let file_url = null;
    try {
      const uploadedFile = await fileHelper.uploadToBucket(file);
      file_url = uploadedFile.publicUrl;
      console.log('File uploaded successfully:', file_url);
    } catch (uploadErr) {
      console.error('File upload error:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Check if submission already exists
    console.log('Checking for existing submission...');
    const existingQuery = 'SELECT submission_id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2';
    const existingResult = await pool.query(existingQuery, [assignment_id, student_id]);
    
    if (existingResult.rows.length > 0) {
      console.log('Updating existing submission...');
      // Update existing submission
      const updateQuery = `
        UPDATE assignment_submissions 
        SET file_url = $1, submitted_at = NOW()
        WHERE assignment_id = $2 AND student_id = $3
        RETURNING *`;
      const updateResult = await pool.query(updateQuery, [file_url, assignment_id, student_id]);
      console.log('Submission updated:', updateResult.rows[0]);
      res.json({ message: 'Assignment resubmitted successfully', submission: updateResult.rows[0] });
    } else {
      console.log('Creating new submission...');
      // Create new submission
      const insertQuery = `
        INSERT INTO assignment_submissions (assignment_id, student_id, file_url, submitted_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *`;
      const insertResult = await pool.query(insertQuery, [assignment_id, student_id, file_url]);
      console.log('Submission created:', insertResult.rows[0]);
      res.status(201).json({ message: 'Assignment submitted successfully', submission: insertResult.rows[0] });
    }
  } catch (err) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Error details:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
  
  console.log('=== SUBMISSION REQUEST END ===');
});

// Get student's submission for a specific assignment
router.get('/student/:assignment_id', async (req, res) => {
  const { assignment_id } = req.params;
  const student_user_id = req.user.user_id;

  try {
    // Get student_id from user_id
    const studentQuery = 'SELECT student_id FROM students WHERE user_id = $1';
    const studentResult = await pool.query(studentQuery, [student_user_id]);
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student_id = studentResult.rows[0].student_id;

    const query = `
      SELECT s.*, a.title as assignment_title, a.due_date, a.max_points
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      WHERE s.assignment_id = $1 AND s.student_id = $2
    `;
    const result = await pool.query(query, [assignment_id, student_id]);
    
    if (result.rows.length === 0) {
      return res.status(200).json(null); // No submission found
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error fetching student submission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all submissions for a specific assignment (for teachers)
router.get('/assignment/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;
  
  try {
    // First get assignment details
    const assignmentQuery = `
      SELECT a.*, c.course_name, c.course_code
      FROM assignments a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.assignment_id = $1
    `;
    const assignmentResult = await pool.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Get all submissions for this assignment
    const submissionsQuery = `
      SELECT
        s.*,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        grader.first_name as grader_first_name,
        grader.last_name as grader_last_name
      FROM assignment_submissions s
      JOIN students st ON s.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN users grader ON s.graded_by = grader.user_id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `;
    const submissionsResult = await pool.query(submissionsQuery, [assignmentId]);
    
    res.json({
      assignment,
      submissions: submissionsResult.rows
    });
  } catch (err) {
    console.error('DB error fetching submissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all assignments for a course with submission counts (for teachers)
router.get('/course/:courseId/assignments', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    const query = `
      SELECT 
        a.*,
        COUNT(s.submission_id) as submission_count,
        COUNT(CASE WHEN s.graded_at IS NOT NULL THEN 1 END) as graded_count
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
      WHERE a.course_id = $1
      GROUP BY a.assignment_id
      ORDER BY a.due_date DESC
    `;
    const result = await pool.query(query, [courseId]);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error fetching course assignments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific submission (for grading)
router.put('/:submissionId', async (req, res) => {
  const { submissionId } = req.params;
  const { points_earned, feedback, graded_by } = req.body; // graded_by should be user_id of the teacher

  try {
    const query = `
      UPDATE assignment_submissions
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
    res.json({ message: 'Submission graded successfully', submission: result.rows[0] });
  } catch (err) {
    console.error('DB error updating submission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;