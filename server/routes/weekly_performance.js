import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// //Get weekly performance for current user (student). I wanna retrieve week number,topic_title,active_performance(what he got in avrg in that week), expected performance(total_number/total_assignments),graded assignments,totalassignments
// router.get('/courses/:courseId', async (req, res) => {
//     const { courseId } = req.params;
//     const userId = req.user.user_id;

//     try {

//     const studentIdquery = `select student_id from students where user_id = userId`;
//     // Get course information and weeks
//     const courseQuery = `
//       SELECT 
//         c.*, s.points_earned as actual_performance,a.max_points/actual_performance as performance percentage,
//         cw.week_id,
//         cw.week_number,
//         cw.start_date as week_start_date,
//         cw.end_date as week_end_date,
//         cw.topic_title,
//         cw.topic_description
//       FROM courses c
//       LEFT JOIN course_weeks cw ON c.course_id = cw.course_id
//       LEFT JOIN assignments a ON c.course_id = a.course_id
//       LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = $2
//       WHERE c.course_id = $1
//       ORDER BY cw.week_number
//     `;

//     const gradedQuery = `select COUNT(s.points_earned),count(s.assignment_id) from assignment_submissions s where s.student_id = $2 and s.course_id= $1`;

//     const gradedResult = await pool.query(gradedQuery,[courseId],studentIdquery)
//     const courseResult = await pool.query(courseQuery, [courseId],studentIdquery);
//     if (courseResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Course not found' });
//     }
//   } catch (error) {
//     console.error('Error fetching course data:', error);
//     return res.status(500).json({ error: 'Failed to fetch course data' });
//   }

//   res.json({
//       course_info: {
//         course_id: courseData.course_id,
//         course_name: courseData.course_name,
//         course_code: courseData.course_code,
//         start_date: courseData.start_date,
//         end_date: courseData.end_date,
//         total_possible_points: totalCoursePoints,
//         total_earned_points: totalCourseEarned,
//         overall_performance_percentage: overallPerformance
//       },
//       weekly_performance: weeks
//     });

// });

// Debug endpoint to check basic data
router.get('/debug/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.user_id;
  
  try {
    // Check if course exists
    const courseCheck = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    
    // Check if user is a student
    const studentCheck = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    
    // Check assignments for this course
    const assignmentsCheck = await pool.query('SELECT assignment_id, title, max_points, due_date, week_assigned FROM assignments WHERE course_id = $1', [courseId]);
    
    // Check submissions for this student
    const submissionsCheck = await pool.query(`
      SELECT s.*, a.title as assignment_title 
      FROM assignment_submissions s 
      JOIN assignments a ON s.assignment_id = a.assignment_id 
      JOIN students st ON s.student_id = st.student_id 
      WHERE a.course_id = $1 AND st.user_id = $2
    `, [courseId, userId]);
    
    // Check course weeks
    const weeksCheck = await pool.query('SELECT * FROM course_weeks WHERE course_id = $1 ORDER BY week_number', [courseId]);
    
    res.json({
      course: courseCheck.rows[0] || null,
      student: studentCheck.rows[0] || null,
      assignments: assignmentsCheck.rows,
      submissions: submissionsCheck.rows,
      course_weeks: weeksCheck.rows,
      debug_info: {
        courseId,
        userId,
        course_exists: courseCheck.rows.length > 0,
        is_student: studentCheck.rows.length > 0,
        assignments_count: assignmentsCheck.rows.length,
        submissions_count: submissionsCheck.rows.length,
        weeks_count: weeksCheck.rows.length
      }
    });
    
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get weekly performance for current user (student)
router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.user_id;
  
  try {
    console.log(`Fetching weekly performance for courseId: ${courseId}, userId: ${userId}`);
    
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
    console.log('Course query results:', courseResult.rows.length, 'rows');
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get all assignments for this course - simplified approach
    const assignmentsQuery = `
      SELECT 
        a.*,
        COALESCE(a.week_assigned, 
          CASE 
            WHEN a.due_date IS NOT NULL THEN 
              GREATEST(1, LEAST(20, 
                CEIL(EXTRACT(EPOCH FROM (a.due_date - c.start_date)) / (7 * 24 * 3600)) + 1
              ))
            ELSE 1 
          END
        ) as calculated_week
      FROM assignments a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.course_id = $1
      ORDER BY a.due_date
    `;
    
    const assignmentsResult = await pool.query(assignmentsQuery, [courseId]);
    console.log('Assignments query results:', assignmentsResult.rows.length, 'assignments found');
    assignmentsResult.rows.forEach(assignment => {
      console.log(`Assignment ${assignment.assignment_id}: week_assigned=${assignment.week_assigned}, calculated_week=${assignment.calculated_week}, max_points=${assignment.max_points}`);
    });
    
    // Get all submissions for this student in this course - simplified approach
    const submissionsQuery = `
      SELECT 
        s.*,
        a.assignment_id,
        a.max_points,
        COALESCE(a.week_assigned, 
          CASE 
            WHEN a.due_date IS NOT NULL THEN 
              GREATEST(1, LEAST(20, 
                CEIL(EXTRACT(EPOCH FROM (a.due_date - c.start_date)) / (7 * 24 * 3600)) + 1
              ))
            ELSE 1 
          END
        ) as calculated_week
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN courses c ON a.course_id = c.course_id
      JOIN students st ON s.student_id = st.student_id
      WHERE a.course_id = $1 AND st.user_id = $2
    `;
    
    const submissionsResult = await pool.query(submissionsQuery, [courseId, userId]);
    console.log('Submissions query results:', submissionsResult.rows.length, 'submissions found');
    submissionsResult.rows.forEach(submission => {
      console.log(`Submission ${submission.submission_id}: assignment_id=${submission.assignment_id}, points_earned=${submission.points_earned}, calculated_week=${submission.calculated_week}`);
    });
    
    // Organize data by weeks
    const weeks = [];
    const courseData = courseResult.rows[0];
    
    // Get all unique weeks from assignments and submissions
    const assignmentWeeks = [...new Set(assignmentsResult.rows.map(a => a.calculated_week).filter(w => w && w > 0))];
    const submissionWeeks = [...new Set(submissionsResult.rows.map(s => s.calculated_week).filter(w => w && w > 0))];
    const allDataWeeks = [...new Set([...assignmentWeeks, ...submissionWeeks])].sort((a, b) => a - b);
    
    console.log('Assignment weeks:', assignmentWeeks);
    console.log('Submission weeks:', submissionWeeks);
    console.log('All data weeks:', allDataWeeks);
    
    // Get course weeks from database
    let courseWeeks = [...new Set(courseResult.rows.map(row => row.week_number).filter(Boolean))];
    console.log('Course weeks from database:', courseWeeks);
    
    // Use data weeks if we have them, otherwise fall back to course weeks or generate basic weeks
    let weekNumbers;
    if (allDataWeeks.length > 0) {
      // Use weeks that have actual data
      weekNumbers = allDataWeeks;
      console.log('Using data-driven weeks:', weekNumbers);
    } else if (courseWeeks.length > 0) {
      // Limit to first 8 weeks to avoid too many empty weeks
      weekNumbers = courseWeeks.sort((a, b) => a - b).slice(0, 8);
      console.log('Using limited course weeks from database:', weekNumbers);
    } else {
      // Fallback: create a few basic weeks
      weekNumbers = [1, 2, 3, 4];
      console.log('Using fallback weeks:', weekNumbers);
    }
    
    console.log('Final week numbers to process:', weekNumbers);
    
    weekNumbers.forEach(weekNumber => {
      const weekInfo = courseResult.rows.find(row => row.week_number === weekNumber) || {};
      
      // Get assignments for this week
      const weekAssignments = assignmentsResult.rows.filter(
        assignment => {
          const calculatedWeek = assignment.calculated_week;
          console.log(`Assignment ${assignment.assignment_id} calculated week: ${calculatedWeek}, checking against week: ${weekNumber}`);
          return calculatedWeek === weekNumber;
        }
      );
      
      console.log(`Week ${weekNumber}: Found ${weekAssignments.length} assignments`);
      
      // Get submissions for this week
      const weekSubmissions = submissionsResult.rows.filter(
        submission => {
          const calculatedWeek = submission.calculated_week;
          console.log(`Submission ${submission.submission_id} calculated week: ${calculatedWeek}, checking against week: ${weekNumber}`);
          return calculatedWeek === weekNumber;
        }
      );
      
      console.log(`Week ${weekNumber}: Found ${weekSubmissions.length} submissions`);
      
      // Calculate week performance
      const totalPossiblePoints = weekAssignments.reduce(
        (sum, assignment) => {
          const points = parseFloat(assignment.max_points) || 0;
          console.log(`Assignment ${assignment.assignment_id} max_points: ${assignment.max_points} -> parsed: ${points}`);
          return sum + points;
        }, 0
      );
      
      const totalEarnedPoints = weekSubmissions.reduce(
        (sum, submission) => {
          const points = parseFloat(submission.points_earned) || 0;
          console.log(`Submission ${submission.submission_id} points_earned: ${submission.points_earned} -> parsed: ${points}`);
          return sum + points;
        }, 0
      );
      
      console.log(`Week ${weekNumber} totals: possible=${totalPossiblePoints}, earned=${totalEarnedPoints}`);
      
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
      
      const weekData = {
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
      };
      
      console.log(`Week ${weekNumber} final data:`, weekData);
      weeks.push(weekData);
    });
    
    // Calculate overall course performance for comparison
    const totalCoursePoints = assignmentsResult.rows.reduce(
      (sum, assignment) => {
        const points = parseFloat(assignment.max_points) || 0;
        console.log(`Course assignment ${assignment.assignment_id} max_points: ${assignment.max_points} -> parsed: ${points}`);
        return sum + points;
      }, 0
    );
    console.log(`Total Course Points Calculation: ${totalCoursePoints}`);
    
    const totalCourseEarned = submissionsResult.rows.reduce(
      (sum, submission) => {
        const points = parseFloat(submission.points_earned) || 0;
        console.log(`Submission points: ${submission.points_earned} -> parsed: ${points}`);
        return sum + points;
      }, 0
    );
    console.log(`Total Course Earned Calculation: ${totalCourseEarned}`);
    
    const overallPerformance = totalCoursePoints > 0 
      ? (totalCourseEarned / totalCoursePoints) * 100 
      : 0;
    
    const responseData = {
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
    };
    
    console.log('Final response data:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
    
  } catch (err) {
    console.error('Error fetching weekly performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
