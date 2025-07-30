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
    // First, check if assignment exists and get its details including due date
    console.log('Checking if assignment exists:', assignment_id);
    const assignmentCheck = await pool.query(
      'SELECT assignment_id, due_date, title FROM assignments WHERE assignment_id = $1', 
      [assignment_id]
    );
    if (assignmentCheck.rows.length === 0) {
      console.log('Assignment not found:', assignment_id);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if assignment deadline has passed
    const assignment = assignmentCheck.rows[0];
    const dueDate = new Date(assignment.due_date);
    const currentDate = new Date();
    
    if (currentDate > dueDate) {
      console.log('Assignment deadline has passed:', assignment.due_date);
      return res.status(400).json({ 
        error: 'Cannot submit assignment. The deadline has passed.',
        due_date: assignment.due_date
      });
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
      SELECT s.submission_id, s.assignment_id, s.student_id, s.file_url, 
             s.submitted_at, s.points_earned, s.points_earned as grade, s.feedback, 
             s.graded_by, s.graded_at, a.title as assignment_title, a.due_date, a.max_points
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

// Get weekly submission trends for a course
router.get('/course/:courseId/weekly-trends', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Get total enrolled students for this course
    const enrolledQuery = `
      SELECT COUNT(*) as total_students
      FROM Student_Enrollment se
      WHERE se.course_id = $1
    `;
    const enrolledResult = await pool.query(enrolledQuery, [courseId]);
    const totalStudents = parseInt(enrolledResult.rows[0].total_students) || 1;

    // Get course start date to calculate relative week numbers
    const courseQuery = `
      SELECT start_date, end_date
      FROM courses
      WHERE course_id = $1
    `;
    const courseResult = await pool.query(courseQuery, [courseId]);
    const courseStartDate = courseResult.rows[0]?.start_date;

    // Get weekly submission data based on actual assignment due dates
    const weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', a.due_date) as week_start,
        COUNT(DISTINCT a.assignment_id) as total_assignments,
        COUNT(s.submission_id) as total_submissions,
        COUNT(DISTINCT s.student_id) as unique_submitters,
        MIN(a.due_date) as earliest_due,
        MAX(a.due_date) as latest_due,
        STRING_AGG(DISTINCT a.title, ', ' ORDER BY a.title) as assignment_titles
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
      WHERE a.course_id = $1 
      GROUP BY DATE_TRUNC('week', a.due_date)
      ORDER BY week_start ASC
    `;
    
    const weeklyResult = await pool.query(weeklyQuery, [courseId]);
    
    // Calculate course week numbers
    const weeklyTrends = weeklyResult.rows.map((row, index) => {
      const expectedSubmissions = parseInt(row.total_assignments) * totalStudents;
      const actualSubmissions = parseInt(row.total_submissions);
      const submissionRate = expectedSubmissions > 0 ? 
        Math.round((actualSubmissions / expectedSubmissions) * 100) : 0;
      
      // Calculate week number relative to course start
      let courseWeekNumber;
      if (courseStartDate) {
        const weekStart = new Date(row.week_start);
        const courseStart = new Date(courseStartDate);
        const daysDiff = Math.floor((weekStart - courseStart) / (1000 * 60 * 60 * 24));
        courseWeekNumber = Math.floor(daysDiff / 7) + 1;
      } else {
        // Fallback: use sequential numbering if no course start date
        courseWeekNumber = index + 1;
      }
      
      return {
        week: `Week ${courseWeekNumber}`,
        week_number: courseWeekNumber,
        week_start: row.week_start,
        submissions: submissionRate,
        target: 100,
        actual_submissions: actualSubmissions,
        expected_submissions: expectedSubmissions,
        total_assignments: parseInt(row.total_assignments),
        unique_submitters: parseInt(row.unique_submitters),
        earliest_due: row.earliest_due,
        latest_due: row.latest_due,
        assignment_titles: row.assignment_titles
      };
    });
    
    // Sort by course week number
    weeklyTrends.sort((a, b) => a.week_number - b.week_number);
    
    res.json({
      weekly_trends: weeklyTrends,
      total_students: totalStudents,
      course_start_date: courseStartDate
    });
  } catch (err) {
    console.error('DB error fetching weekly trends:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall course submission statistics
router.get('/course/:courseId/statistics', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Get total enrolled students
    const enrolledQuery = `
      SELECT COUNT(*) as total_students
      FROM Student_Enrollment se
      WHERE se.course_id = $1
    `;
    const enrolledResult = await pool.query(enrolledQuery, [courseId]);
    const totalStudents = parseInt(enrolledResult.rows[0].total_students) || 0;

    // Get overall submission statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT a.assignment_id) as total_assignments,
        COUNT(s.submission_id) as total_submissions,
        COUNT(CASE WHEN s.graded_at IS NOT NULL THEN 1 END) as total_graded,
        COUNT(DISTINCT s.student_id) as students_who_submitted
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
      WHERE a.course_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [courseId]);
    const stats = statsResult.rows[0];
    
    const totalAssignments = parseInt(stats.total_assignments) || 0;
    const totalSubmissions = parseInt(stats.total_submissions) || 0;
    const totalGraded = parseInt(stats.total_graded) || 0;
    const studentsWhoSubmitted = parseInt(stats.students_who_submitted) || 0;
    
    // Calculate rates
    const totalPossibleSubmissions = totalAssignments * totalStudents;
    const overallSubmissionRate = totalPossibleSubmissions > 0 ? 
      ((totalSubmissions / totalPossibleSubmissions) * 100).toFixed(1) : 0;
    
    const studentParticipationRate = totalStudents > 0 ? 
      ((studentsWhoSubmitted / totalStudents) * 100).toFixed(1) : 0;
    
    // Get actual grading statistics (scores and averages)
    const gradingStatsQuery = `
      SELECT 
        AVG(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (s.points_earned::float / a.max_points::float) * 100 
            ELSE NULL END) as class_average,
        COUNT(CASE WHEN s.points_earned IS NOT NULL THEN 1 END) as scored_submissions,
        SUM(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (CASE WHEN (s.points_earned::float / a.max_points::float) * 100 >= 90 THEN 1 ELSE 0 END)
            ELSE 0 END) as grade_a_count,
        SUM(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (CASE WHEN (s.points_earned::float / a.max_points::float) * 100 >= 80 AND (s.points_earned::float / a.max_points::float) * 100 < 90 THEN 1 ELSE 0 END)
            ELSE 0 END) as grade_b_count,
        SUM(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (CASE WHEN (s.points_earned::float / a.max_points::float) * 100 >= 70 AND (s.points_earned::float / a.max_points::float) * 100 < 80 THEN 1 ELSE 0 END)
            ELSE 0 END) as grade_c_count,
        SUM(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (CASE WHEN (s.points_earned::float / a.max_points::float) * 100 >= 60 AND (s.points_earned::float / a.max_points::float) * 100 < 70 THEN 1 ELSE 0 END)
            ELSE 0 END) as grade_d_count,
        SUM(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (CASE WHEN (s.points_earned::float / a.max_points::float) * 100 < 60 THEN 1 ELSE 0 END)
            ELSE 0 END) as grade_f_count
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
      WHERE a.course_id = $1 AND s.graded_at IS NOT NULL
    `;
    
    const gradingStatsResult = await pool.query(gradingStatsQuery, [courseId]);
    const gradingStats = gradingStatsResult.rows[0];
    
    const classAverage = gradingStats.class_average ? 
      Math.round(parseFloat(gradingStats.class_average) * 100) / 100 : null;
    const scoredSubmissions = parseInt(gradingStats.scored_submissions) || 0;
    
    // Grade distribution
    const gradeDistribution = [
      { grade: 'A (90-100)', count: parseInt(gradingStats.grade_a_count) || 0 },
      { grade: 'B (80-89)', count: parseInt(gradingStats.grade_b_count) || 0 },
      { grade: 'C (70-79)', count: parseInt(gradingStats.grade_c_count) || 0 },
      { grade: 'D (60-69)', count: parseInt(gradingStats.grade_d_count) || 0 },
      { grade: 'F (<60)', count: parseInt(gradingStats.grade_f_count) || 0 }
    ].map(grade => ({
      ...grade,
      percentage: scoredSubmissions > 0 ? Math.round((grade.count / scoredSubmissions) * 100) : 0
    }));
    
    res.json({
      total_students: totalStudents,
      total_assignments: totalAssignments,
      total_submissions: totalSubmissions,
      total_graded: totalGraded,
      students_who_submitted: studentsWhoSubmitted,
      total_possible_submissions: totalPossibleSubmissions,
      overall_submission_rate: parseFloat(overallSubmissionRate),
      student_participation_rate: parseFloat(studentParticipationRate),
      pending_grading: totalSubmissions - totalGraded,
      // New grading statistics
      class_average: classAverage,
      scored_submissions: scoredSubmissions,
      grade_distribution: gradeDistribution
    });
  } catch (err) {
    console.error('DB error fetching course statistics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignment-level grading statistics for charts
router.get('/course/:courseId/assignment-averages', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    const query = `
      SELECT 
        a.assignment_id,
        a.title,
        a.max_points,
        COUNT(s.submission_id) as submission_count,
        COUNT(CASE WHEN s.graded_at IS NOT NULL THEN 1 END) as graded_count,
        AVG(CASE WHEN s.points_earned IS NOT NULL AND a.max_points > 0 
            THEN (s.points_earned::float / a.max_points::float) * 100 
            ELSE NULL END) as average_percentage,
        COALESCE(AVG(s.points_earned), 0) as average_points
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
      WHERE a.course_id = $1
      GROUP BY a.assignment_id, a.title, a.max_points
      ORDER BY a.assignment_id
    `;
    
    const result = await pool.query(query, [courseId]);
    const assignments = result.rows.map(row => ({
      assignment_id: row.assignment_id,
      name: (row.title || 'Assignment').substring(0, 15) + (row.title && row.title.length > 15 ? '...' : ''),
      title: row.title,
      max_points: parseInt(row.max_points) || 100,
      submission_count: parseInt(row.submission_count) || 0,
      graded_count: parseInt(row.graded_count) || 0,
      average: row.average_percentage ? Math.round(parseFloat(row.average_percentage) * 100) / 100 : null,
      average_points: row.average_points ? Math.round(parseFloat(row.average_points) * 100) / 100 : 0
    }));
    
    res.json(assignments);
  } catch (err) {
    console.error('DB error fetching assignment averages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students falling behind (missed last 2 submissions for the course)
router.get('/course/:courseId/falling-behind', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Get the last 2 assignments for this course (by due date)
    const lastTwoAssignmentsQuery = `
      SELECT assignment_id, title, due_date
      FROM assignments 
      WHERE course_id = $1 AND due_date < NOW()
      ORDER BY due_date DESC 
      LIMIT 2
    `;
    
    const lastTwoAssignmentsResult = await pool.query(lastTwoAssignmentsQuery, [courseId]);
    const lastTwoAssignments = lastTwoAssignmentsResult.rows;
    
    if (lastTwoAssignments.length < 2) {
      // If there are less than 2 assignments, no one can be falling behind
      return res.json({
        falling_behind_students: [],
        last_two_assignments: lastTwoAssignments,
        total_falling_behind: 0
      });
    }
    
    // Get all enrolled students for this course
    const enrolledStudentsQuery = `
      SELECT se.student_id, u.first_name, u.last_name, u.email
      FROM student_enrollment se
      JOIN students s ON se.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE se.course_id = $1
    `;
    
    const enrolledStudentsResult = await pool.query(enrolledStudentsQuery, [courseId]);
    const enrolledStudents = enrolledStudentsResult.rows;
    
    const assignmentIds = lastTwoAssignments.map(a => a.assignment_id);
    
    // Find students who are falling behind (missed both of the last 2 assignments)
    const fallingBehindQuery = `
      SELECT 
        se.student_id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(s.submission_id) as submitted_count
      FROM student_enrollment se
      JOIN students st ON se.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN assignment_submissions s ON se.student_id = s.student_id 
        AND s.assignment_id = ANY($2)
      WHERE se.course_id = $1
      GROUP BY se.student_id, u.first_name, u.last_name, u.email
      HAVING COUNT(s.submission_id) = 0
    `;
    
    const fallingBehindResult = await pool.query(fallingBehindQuery, [courseId, assignmentIds]);
    const fallingBehindStudents = fallingBehindResult.rows;
    
    res.json({
      falling_behind_students: fallingBehindStudents,
      last_two_assignments: lastTwoAssignments,
      total_falling_behind: fallingBehindStudents.length,
      total_enrolled: enrolledStudents.length
    });
    
  } catch (err) {
    console.error('DB error fetching falling behind students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;