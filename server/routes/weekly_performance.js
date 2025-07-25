import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get weekly performance for current user (student)
router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.user_id;
  
  try {
    // Get course information and weeks
    const courseQuery = `
      SELECT 
        c.*,
        cw.week_id,
        cw.week_number,
        cw.start_date as week_start_date,
        cw.end_date as week_end_date,
        cw.topic_title,
        cw.topic_description
      FROM courses c
      LEFT JOIN course_weeks cw ON c.course_id = cw.course_id
      WHERE c.course_id = $1
      ORDER BY cw.week_number
    `;
    
    const courseResult = await pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get all assignments for this course with their week assignments
    const assignmentsQuery = `
      SELECT 
        a.*,
        CASE 
          WHEN a.week_assigned IS NOT NULL THEN a.week_assigned
          ELSE EXTRACT(WEEK FROM a.due_date) - EXTRACT(WEEK FROM c.start_date) + 1
        END as calculated_week
      FROM assignments a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.course_id = $1
      ORDER BY a.due_date
    `;
    
    const assignmentsResult = await pool.query(assignmentsQuery, [courseId]);
    
    // Get all submissions for this student in this course
    const submissionsQuery = `
      SELECT 
        s.*,
        a.assignment_id,
        a.max_points,
        CASE 
          WHEN a.week_assigned IS NOT NULL THEN a.week_assigned
          ELSE EXTRACT(WEEK FROM a.due_date) - EXTRACT(WEEK FROM c.start_date) + 1
        END as calculated_week
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN courses c ON a.course_id = c.course_id
      JOIN students st ON s.student_id = st.student_id
      WHERE a.course_id = $1 AND st.user_id = $2
    `;
    
    const submissionsResult = await pool.query(submissionsQuery, [courseId, userId]);
    
    // Organize data by weeks
    const weeks = [];
    const courseData = courseResult.rows[0];
    const weekNumbers = [...new Set(courseResult.rows.map(row => row.week_number).filter(Boolean))];
    
    // If no weeks exist, create them based on course duration
    if (weekNumbers.length === 0) {
      const startDate = new Date(courseData.start_date);
      const endDate = new Date(courseData.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      for (let i = 1; i <= diffWeeks; i++) {
        weekNumbers.push(i);
      }
    }
    
    weekNumbers.forEach(weekNumber => {
      const weekInfo = courseResult.rows.find(row => row.week_number === weekNumber) || {};
      
      // Get assignments for this week
      const weekAssignments = assignmentsResult.rows.filter(
        assignment => assignment.calculated_week === weekNumber
      );
      
      // Get submissions for this week
      const weekSubmissions = submissionsResult.rows.filter(
        submission => submission.calculated_week === weekNumber
      );
      
      // Calculate week performance
      const totalPossiblePoints = weekAssignments.reduce(
        (sum, assignment) => sum + (assignment.max_points || 0), 0
      );
      
      const totalEarnedPoints = weekSubmissions.reduce(
        (sum, submission) => sum + (submission.points_earned || 0), 0
      );
      
      const totalSubmittedAssignments = weekSubmissions.length;
      const totalGradedAssignments = weekSubmissions.filter(
        submission => submission.points_earned !== null
      ).length;
      
      const expectedPerformance = totalPossiblePoints; // 100% of possible points
      const actualPerformance = totalEarnedPoints;
      const performancePercentage = totalPossiblePoints > 0 
        ? (totalEarnedPoints / totalPossiblePoints) * 100 
        : 0;
      
      const completionRate = weekAssignments.length > 0 
        ? (totalSubmittedAssignments / weekAssignments.length) * 100 
        : 0;
      
      weeks.push({
        week_number: weekNumber,
        week_id: weekInfo.week_id || null,
        topic_title: weekInfo.topic_title || `Week ${weekNumber}`,
        topic_description: weekInfo.topic_description || null,
        week_start_date: weekInfo.week_start_date || null,
        week_end_date: weekInfo.week_end_date || null,
        
        // Performance metrics
        total_assignments: weekAssignments.length,
        submitted_assignments: totalSubmittedAssignments,
        graded_assignments: totalGradedAssignments,
        
        total_possible_points: totalPossiblePoints,
        total_earned_points: totalEarnedPoints,
        expected_performance: expectedPerformance,
        actual_performance: actualPerformance,
        performance_percentage: performancePercentage,
        completion_rate: completionRate,
        
        // Assignment details
        assignments: weekAssignments.map(assignment => ({
          ...assignment,
          submission: weekSubmissions.find(sub => sub.assignment_id === assignment.assignment_id) || null
        }))
      });
    });
    
    // Calculate overall course performance for comparison
    const totalCoursePoints = assignmentsResult.rows.reduce(
      (sum, assignment) => sum + (assignment.max_points || 0), 0
    );
    
    const totalCourseEarned = submissionsResult.rows.reduce(
      (sum, submission) => sum + (submission.points_earned || 0), 0
    );
    
    const overallPerformance = totalCoursePoints > 0 
      ? (totalCourseEarned / totalCoursePoints) * 100 
      : 0;
    
    res.json({
      course_info: {
        course_id: courseData.course_id,
        course_name: courseData.course_name,
        course_code: courseData.course_code,
        start_date: courseData.start_date,
        end_date: courseData.end_date,
        total_possible_points: totalCoursePoints,
        total_earned_points: totalCourseEarned,
        overall_performance_percentage: overallPerformance
      },
      weekly_performance: weeks
    });
    
  } catch (err) {
    console.error('Error fetching weekly performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
