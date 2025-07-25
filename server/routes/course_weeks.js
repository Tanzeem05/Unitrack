import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get course weeks with assignments and topics
router.get('/course/:courseId/weeks', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Get course weeks with topics
    const weeksQuery = `
      SELECT 
        cw.*,
        c.start_date as course_start_date,
        c.end_date as course_end_date,
        c.course_name,
        c.course_code
      FROM course_weeks cw
      JOIN courses c ON cw.course_id = c.course_id
      WHERE cw.course_id = $1
      ORDER BY cw.week_number
    `;
    
    const weeksResult = await pool.query(weeksQuery, [courseId]);
    
    // Get assignments for this course with their assigned weeks
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
    
    // If no weeks exist, generate them automatically
    if (weeksResult.rows.length === 0) {
      const courseQuery = 'SELECT * FROM courses WHERE course_id = $1';
      const courseResult = await pool.query(courseQuery, [courseId]);
      
      if (courseResult.rows.length > 0) {
        const course = courseResult.rows[0];
        
        // Generate weeks automatically
        await pool.query(
          'SELECT generate_course_weeks($1, $2, $3, $4)',
          [courseId, course.start_date, course.end_date, req.user.user_id]
        );
        
        // Fetch the generated weeks
        const newWeeksResult = await pool.query(weeksQuery, [courseId]);
        weeksResult.rows = newWeeksResult.rows;
      }
    }
    
    // Organize assignments by week
    const weeks = weeksResult.rows.map(week => ({
      ...week,
      assignments: assignmentsResult.rows.filter(assignment => 
        assignment.calculated_week === week.week_number ||
        (assignment.due_date >= week.start_date && assignment.due_date <= week.end_date)
      )
    }));
    
    res.json(weeks);
  } catch (err) {
    console.error('Error fetching course weeks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update week topic (teachers only)
router.put('/weeks/:weekId', async (req, res) => {
  const { weekId } = req.params;
  const { topic_title, topic_description, learning_objectives } = req.body;

  try {
    console.log('Update request for week:', weekId, 'by user:', req.user.user_id);

    // 1. Verify teacher access to this course
    const accessQuery = `
      SELECT 1
      FROM course_weeks cw
      JOIN course_teachers ct ON cw.course_id = ct.course_id
      JOIN teachers t ON ct.teacher_id = t.teacher_id
      WHERE cw.week_id = $1 AND t.user_id = $2
    `;
    const accessResult = await pool.query(accessQuery, [weekId, req.user.user_id]);

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Only course teachers can update week topics' });
    }

    // 2. Prepare fields to update dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (topic_title !== undefined) {
      updates.push(`topic_title = $${paramIndex++}`);
      values.push(topic_title);
    }
    if (topic_description !== undefined) {
      updates.push(`topic_description = $${paramIndex++}`);
      values.push(topic_description);
    }
    if (learning_objectives !== undefined) {
      updates.push(`learning_objectives = $${paramIndex++}`);
      values.push(learning_objectives);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add updated_at field
    updates.push(`updated_at = NOW()`);

    // Add weekId as the last value
    values.push(weekId);

    // 3. Execute update query
    const updateQuery = `
      UPDATE course_weeks
      SET ${updates.join(', ')}
      WHERE week_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Week not found' });
    }

    console.log('Week updated:', result.rows[0]);
    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error updating week:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


// Generate weeks for a course (admin/teacher only)
router.post('/course/:courseId/generate-weeks', async (req, res) => {
  const { courseId } = req.params;
  
  try {
    console.log('Generate weeks request for course:', courseId, 'by user:', req.user.user_id);
    
    // Check if user is admin or teacher for this course
    const accessCheckQuery = `
      SELECT 
        u.user_type,
        CASE 
          WHEN u.user_type = 'admin' THEN true
          WHEN EXISTS (
            SELECT 1 FROM course_teachers ct 
            JOIN Teachers t ON ct.teacher_id = t.teacher_id 
            WHERE ct.course_id = $1 AND t.user_id = $2
          ) THEN true
          ELSE false
        END as has_access
      FROM users u
      WHERE u.user_id = $2
    `;
    
    const accessCheck = await pool.query(accessCheckQuery, [courseId, req.user.user_id]);
    
    console.log('Access check result:', accessCheck.rows);
    
    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!accessCheck.rows[0]?.has_access) {
      return res.status(403).json({ 
        error: 'Access denied. Only course teachers and admins can generate weekly schedules.',
        userType: accessCheck.rows[0]?.user_type,
        hasAccess: accessCheck.rows[0]?.has_access
      });
    }
    
    // Get course details
    const courseQuery = 'SELECT * FROM courses WHERE course_id = $1';
    const courseResult = await pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    console.log('Course found:', course.course_name);
    
    // Generate weeks
    await pool.query(
      'SELECT generate_course_weeks($1, $2, $3, $4)',
      [courseId, course.start_date, course.end_date, req.user.user_id]
    );
    
    console.log('Weeks generated successfully for course:', courseId);
    res.json({ message: 'Course weeks generated successfully' });
  } catch (err) {
    console.error('Error generating course weeks:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;
