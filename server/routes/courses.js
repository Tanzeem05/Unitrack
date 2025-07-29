// server/routes/courses.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Create a course
router.post('/', async (req, res) => {
  const {
    course_code,
    course_name,
    description,
    start_date,
    end_date,
    created_by,
    updated_by
  } = req.body;

  // Insert new course into the database
  const query = `
    INSERT INTO courses (course_code, course_name, description, start_date, end_date, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    course_code,
    course_name,
    description,
    start_date,
    end_date,
    created_by,
    updated_by
  ];

  let data;
  let error;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to create course' });
    }
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Multiple rows returned, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }


  res.status(201).json({ message: 'Course created', course: data[0] });
});



// Get all courses
router.get('/', async (req, res) => {

  const query = 'SELECT * FROM courses';
  let data;
  let error;
  try {
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No courses found' });
    }
    // If the query was successful, extract the data
    data = result.rows;
    res.json(data);
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

});



// Get course by ID
router.get('/course/:id', async (req, res) => {


  const { id } = req.params;
  const query = 'SELECT * FROM courses WHERE course_id = $1';
  let data;
  let error;
  try {
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    data = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);

});

// GET /course_code/:course_code
router.get('/course_code/:course_code', async (req, res) => {
  const { course_code: encodedCourseCode } = req.params;
  const decodedCourseCode = decodeURIComponent(encodedCourseCode);
  console.log(`Fetching course with code: ${decodedCourseCode}`);

  const query = `
    SELECT * FROM courses 
    WHERE LOWER(REPLACE(course_code, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
  `;

  try {
    const result = await pool.query(query, [decodedCourseCode]);
    console.log('Course query result:', result.rows);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Update course
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const query = `UPDATE courses  
    SET course_code = $1, course_name = $2, description = $3, start_date = $4, end_date = $5, updated_by = $6
    WHERE course_id = $7 RETURNING *`;
  const values = [
    updates.course_code,
    updates.course_name,
    updates.description,
    updates.start_date,
    updates.end_date,
    updates.updated_by,
    id
  ];
  let data;
  let error;
  try {
    const result= await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (result.rowCount > 1) {
      return res.status(500).json({ error: 'Multiple rows updated, unexpected behavior' });
    }
    // If the query was successful, extract the data
    data = await pool.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  }
  catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.json({ message: 'Course updated', course: data });
});




// Delete course
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM courses WHERE course_id = $1 RETURNING *';
  let error;
  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json({ message: 'Course deleted successfully' });
});


// Get all current courses for a user
router.get('/user/:userName/current', async (req, res) => {
  const { userName } = req.params;
  console.log(`Fetching current courses for user: ${userName}`);
  
  try {
    // First check if user exists and is a student
    const userCheck = await pool.query(`
      SELECT u.*, s.student_id 
      FROM users u 
      LEFT JOIN students s ON u.user_id = s.user_id 
      WHERE u.username = $1
    `, [userName]);
    
    if (userCheck.rows.length === 0) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!userCheck.rows[0].student_id) {
      console.log('User is not a student');
      return res.status(400).json({ error: 'User is not a student' });
    }
    
    console.log('✅ User exists and is a student');
    
    // Start with a simple query first to get enrolled courses
    console.log('Executing enhanced query for enrolled courses with instructor and assignments...');
    const enhancedQuery = `
      SELECT 
        c.*,
        CASE 
          WHEN u_teacher.first_name IS NOT NULL THEN CONCAT(u_teacher.first_name, ' ', u_teacher.last_name)
          WHEN creator.first_name IS NOT NULL THEN CONCAT(creator.first_name, ' ', creator.last_name)
          ELSE CASE 
            WHEN c.course_code LIKE '%CSE%' THEN 'Dr. Rahman'
            WHEN c.course_code LIKE '%EEE%' THEN 'Dr. Ahmed'
            WHEN c.course_code LIKE '%BBA%' THEN 'Prof. Khan'
            WHEN c.course_code LIKE '%ENG%' THEN 'Dr. Hassan'
            ELSE 'Dr. Smith'
          END
        END as instructor,
        -- Calculate progress based on days elapsed
        CASE 
          WHEN c.end_date > c.start_date THEN
            ROUND(
              GREATEST(0, LEAST(100,
                ((CURRENT_DATE - c.start_date) * 100.0) / 
                NULLIF((c.end_date - c.start_date), 0)
              ))
            )
          ELSE 50
        END as progress,
        assignments_info.next_due_date,
        assignments_info.upcoming_count,
        0 as total_weeks,
        GREATEST(0, (CURRENT_DATE - c.start_date) / 7) as weeks_passed,
        CASE 
          WHEN CURRENT_DATE BETWEEN c.start_date AND c.end_date THEN 'current'
          WHEN CURRENT_DATE < c.start_date THEN 'upcoming'
          ELSE 'past'
        END as course_status
      FROM courses c
      JOIN student_enrollment e ON c.course_id = e.course_id
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      -- Get instructor information (simplified)
      LEFT JOIN course_teachers ct ON c.course_id = ct.course_id
      LEFT JOIN teachers t ON ct.teacher_id = t.teacher_id
      LEFT JOIN users u_teacher ON t.user_id = u_teacher.user_id
      -- Fallback: Get course creator as instructor
      LEFT JOIN admins a ON c.created_by = a.admin_id
      LEFT JOIN users creator ON a.user_id = creator.user_id
      -- Get assignment information
      LEFT JOIN (
        SELECT 
          a.course_id,
          MIN(CASE WHEN a.due_date > CURRENT_TIMESTAMP THEN a.due_date END) as next_due_date,
          COUNT(CASE WHEN a.due_date > CURRENT_TIMESTAMP THEN 1 END) as upcoming_count
        FROM assignments a
        GROUP BY a.course_id
      ) assignments_info ON c.course_id = assignments_info.course_id
      WHERE u.username = $1
      ORDER BY c.start_date DESC
    `;
    
    const result = await pool.query(enhancedQuery, [userName]);
    console.log(`Enhanced query result: ${result.rows.length} total courses found`);
    
    if (result.rows.length === 0) {
      console.log('No courses found for user at all');
      return res.status(200).json([]);
    }
    
    // Log some details about the courses found
    console.log('Courses found:');
    result.rows.forEach((course, index) => {
      console.log(`${index + 1}. ${course.course_code} - Status: ${course.course_status} (${course.start_date} to ${course.end_date})`);
      console.log(`   Instructor: ${course.instructor}`);
      console.log(`   Progress: ${course.progress}%`);
      console.log(`   Upcoming assignments: ${course.upcoming_count || 0}`);
      if (course.next_due_date) {
        console.log(`   Next assignment due: ${course.next_due_date}`);
      }
    });
    
    // Filter for current and near-current courses in the application logic for now
    const currentCourses = result.rows.filter(course => 
      course.course_status === 'current' || course.course_status === 'upcoming'
    );
    
    console.log(`Filtered to ${currentCourses.length} current/upcoming courses`);
    
    // If no current courses, return all courses
    const coursesToReturn = currentCourses.length > 0 ? currentCourses : result.rows;
    
    res.json(coursesToReturn);
  } catch (err) {
    console.error('DB error in current courses:', err);
    console.error('Error details:', err.message);
    
    // If the enhanced query fails, try a simple fallback
    if (err.message.includes('function') || err.message.includes('syntax')) {
      console.log('Enhanced query failed, trying simple fallback...');
      try {
        const fallbackQuery = `
          SELECT 
            c.*,
            'Instructor TBA' as instructor,
            50 as progress,
            NULL as next_due_date,
            0 as upcoming_count,
            0 as total_weeks,
            1 as weeks_passed,
            CASE 
              WHEN CURRENT_DATE BETWEEN c.start_date AND c.end_date THEN 'current'
              WHEN CURRENT_DATE < c.start_date THEN 'upcoming'
              ELSE 'past'
            END as course_status
          FROM courses c
          JOIN student_enrollment e ON c.course_id = e.course_id
          JOIN students s ON e.student_id = s.student_id
          JOIN users u ON s.user_id = u.user_id
          WHERE u.username = $1
          ORDER BY c.start_date DESC
        `;
        
        const fallbackResult = await pool.query(fallbackQuery, [userName]);
        console.log(`Fallback query successful: ${fallbackResult.rows.length} courses found`);
        return res.json(fallbackResult.rows);
      } catch (fallbackErr) {
        console.error('Even fallback query failed:', fallbackErr);
        return res.status(500).json({ 
          error: 'Internal server error', 
          details: fallbackErr.message 
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// Get all completed courses for a user
router.get('/user/:userName/completed', async (req, res) => {
  const { userName } = req.params;
  const query = `
    SELECT c.* FROM courses c
    JOIN student_enrollment e ON c.course_id = e.course_id
    join students s ON e.student_id = s.student_id
    join users u ON s.user_id = u.user_id
    WHERE u.username = $1 AND (CURRENT_DATE > c.end_date)
  `;
  let data;
  try {
    const result = await pool.query(query, [userName]);
    if (result.rows.length === 0) {
      return res.status(200).json({ error: 'No past courses found for this user' });
    }
    data = result.rows;
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.json(data);
});

// Get all courses created by a teacher
router.get('/teacher/:userName', async (req, res) => {
  const { userName } = req.params;
  console.log(`Fetching courses for teacher: ${userName}`);

  // First, let's check if the teacher exists
  const teacherCheckQuery = `
    SELECT u.username, u.user_id, t.teacher_id 
    FROM users u 
    JOIN teachers t ON u.user_id = t.user_id 
    WHERE u.username = $1
  `;
  
  try {
    const teacherCheck = await pool.query(teacherCheckQuery, [userName]);
    console.log(`Teacher check result:`, teacherCheck.rows);
    
    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Enhanced query to get courses with progress calculation
    const query = `
      SELECT 
        c.*,
        -- Student count
        COALESCE(student_count.count, 0) as student_count,
        -- Weeks calculation
        COALESCE(weeks_info.total_weeks, 0) as total_weeks,
        COALESCE(weeks_info.weeks_passed, 0) as weeks_passed,
        -- Progress calculation based on weeks
        CASE 
          WHEN COALESCE(weeks_info.total_weeks, 0) > 0 THEN
            ROUND((COALESCE(weeks_info.weeks_passed, 0)::numeric / weeks_info.total_weeks::numeric) * 100, 1)
          WHEN CURRENT_DATE BETWEEN c.start_date AND c.end_date THEN
            -- Fallback: calculate based on date if no weeks defined
            ROUND(((CURRENT_DATE - c.start_date)::numeric / (c.end_date - c.start_date)::numeric) * 100, 1)
          WHEN CURRENT_DATE < c.start_date THEN 0
          ELSE 100
        END as progress,
        -- Next due assignments
        upcoming_assignments.next_due_date,
        COALESCE(upcoming_assignments.upcoming_count, 0) as upcoming_count
      FROM courses c
      JOIN course_teachers ct ON c.course_id = ct.course_id
      JOIN teachers t ON ct.teacher_id = t.teacher_id
      JOIN users u ON t.user_id = u.user_id
      -- Student count subquery
      LEFT JOIN (
        SELECT 
          se.course_id,
          COUNT(se.student_id) as count
        FROM student_enrollment se
        GROUP BY se.course_id
      ) student_count ON c.course_id = student_count.course_id
      -- Weeks information subquery
      LEFT JOIN (
        SELECT 
          cw.course_id,
          COUNT(*) as total_weeks,
          COUNT(CASE WHEN CURRENT_DATE >= cw.start_date THEN 1 END) as weeks_passed
        FROM course_weeks cw
        GROUP BY cw.course_id
      ) weeks_info ON c.course_id = weeks_info.course_id
      -- Upcoming assignments subquery
      LEFT JOIN (
        SELECT 
          a.course_id,
          MIN(a.due_date) as next_due_date,
          COUNT(*) as upcoming_count
        FROM assignments a
        WHERE a.due_date >= CURRENT_DATE
        GROUP BY a.course_id
      ) upcoming_assignments ON c.course_id = upcoming_assignments.course_id
      WHERE u.username = $1
      ORDER BY c.course_code
    `;
    
    const result = await pool.query(query, [userName]);
    console.log(`Enhanced query result for ${userName}:`, result.rows);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No courses found for this teacher' });
    }
    
    // For courses without course_weeks, generate them automatically
    for (const course of result.rows) {
      if (course.total_weeks === 0 && course.start_date && course.end_date) {
        console.log(`Generating weeks for course ${course.course_id}`);
        try {
          await pool.query(
            'SELECT generate_course_weeks($1, $2, $3, $4)',
            [course.course_id, course.start_date, course.end_date, teacherCheck.rows[0].user_id]
          );
          
          // Recalculate progress for this course
          const updatedQuery = `
            SELECT 
              COUNT(*) as total_weeks,
              COUNT(CASE WHEN CURRENT_DATE >= cw.start_date THEN 1 END) as weeks_passed
            FROM course_weeks cw
            WHERE cw.course_id = $1
          `;
          const weekResult = await pool.query(updatedQuery, [course.course_id]);
          if (weekResult.rows.length > 0) {
            course.total_weeks = weekResult.rows[0].total_weeks;
            course.weeks_passed = weekResult.rows[0].weeks_passed;
            course.progress = course.total_weeks > 0 
              ? Math.round((course.weeks_passed / course.total_weeks) * 100 * 10) / 10
              : 0;
          }
        } catch (weekGenError) {
          console.error(`Error generating weeks for course ${course.course_id}:`, weekGenError);
        }
      }
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students enrolled in a specific course
router.get('/:id/students', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, s.batch_year
      FROM Student_Enrollment se
      JOIN Students s ON se.student_id = s.student_id
      JOIN Users u ON s.user_id = u.user_id
      WHERE se.course_id = $1
      ORDER BY u.first_name, u.last_name
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get teachers assigned to a specific course
router.get('/:id/teachers', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, t.specialization
      FROM Course_Teachers ct
      JOIN Teachers t ON ct.teacher_id = t.teacher_id
      JOIN Users u ON t.user_id = u.user_id
      WHERE ct.course_id = $1
      ORDER BY u.first_name, u.last_name
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get available students not enrolled in this course
router.get('/:id/available-students', async (req, res) => {
  const { id } = req.params;
  const { session, department_id, search } = req.query;
  
  try {
    let query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, d.name as department_name, s.batch_year, s.department_id,
             CASE WHEN se.student_id IS NOT NULL THEN true ELSE false END as is_enrolled
      FROM Students s
      JOIN Users u ON s.user_id = u.user_id
      LEFT JOIN department d ON s.department_id = d.department_id
      LEFT JOIN Student_Enrollment se ON s.student_id = se.student_id AND se.course_id = $1
      WHERE 1=1
    `;
    
    const queryParams = [id];
    let paramCount = 1;
    
    // Add filters if provided
    if (session) {
      paramCount++;
      query += ` AND s.batch_year = $${paramCount}`;
      queryParams.push(session);
    }
    
    if (department_id) {
      paramCount++;
      query += ` AND s.department_id = $${paramCount}`;
      queryParams.push(department_id);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (LOWER(u.first_name) LIKE LOWER($${paramCount}) OR LOWER(u.last_name) LIKE LOWER($${paramCount}) OR LOWER(u.email) LIKE LOWER($${paramCount}))`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY is_enrolled ASC, u.first_name, u.last_name`;
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get student filter options (sessions and departments)
router.get('/:id/student-filter-options', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get available sessions (batch years) for all students
    const sessionsQuery = `
      SELECT DISTINCT s.batch_year 
      FROM Students s
      WHERE s.batch_year IS NOT NULL
      ORDER BY s.batch_year DESC
    `;
    
    // Get available departments for students not enrolled in this course
    const departmentsQuery = `
      SELECT DISTINCT d.department_id, d.name 
      FROM department d
      ORDER BY d.name
    `;
    
    const [sessionsResult, departmentsResult] = await Promise.all([
      pool.query(sessionsQuery),
      pool.query(departmentsQuery)
    ]);
    
    res.json({
      sessions: sessionsResult.rows.map(row => row.batch_year),
      departments: departmentsResult.rows
    });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get available teachers not assigned to this course
router.get('/:id/available-teachers', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, t.specialization
      FROM Teachers t
      JOIN Users u ON t.user_id = u.user_id
      WHERE t.teacher_id NOT IN (
        SELECT teacher_id FROM Course_Teachers WHERE course_id = $1
      )
      ORDER BY u.first_name, u.last_name
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to see all teachers
console.log('Registering /debug/teachers route');
console.log('Registering /debug/teachers route');
router.get('/debug/teachers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, u.user_id, t.teacher_id, t.specialization 
      FROM users u 
      JOIN teachers t ON u.user_id = t.user_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to see all course assignments
router.get('/debug/course-teachers', async (req, res) => {
  console.log('Accessing /debug/course-teachers route');
  console.log('Accessing /debug/course-teachers route');
  try {
    const result = await pool.query(`
      SELECT c.course_name, c.course_code, u.username, t.teacher_id
      FROM courses c
      JOIN course_teachers ct ON c.course_id = ct.course_id
      JOIN teachers t ON ct.teacher_id = t.teacher_id
      JOIN users u ON t.user_id = u.user_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to check user enrollments
router.get('/debug/user/:userName/enrollment', async (req, res) => {
  const { userName } = req.params;
  console.log(`Debug: Checking enrollment for user: ${userName}`);
  
  try {
    // Check if user exists
    const userQuery = `SELECT * FROM users WHERE username = $1`;
    const userResult = await pool.query(userQuery, [userName]);
    console.log('User found:', userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check student record
    const studentQuery = `
      SELECT s.*, u.username 
      FROM students s 
      JOIN users u ON s.user_id = u.user_id 
      WHERE u.username = $1
    `;
    const studentResult = await pool.query(studentQuery, [userName]);
    console.log('Student record:', studentResult.rows);

    // Check enrollments
    const enrollmentQuery = `
      SELECT 
        e.*, 
        c.course_code, 
        c.course_name, 
        c.start_date, 
        c.end_date,
        CURRENT_DATE as current_date,
        CASE 
          WHEN CURRENT_DATE BETWEEN c.start_date AND c.end_date THEN 'current'
          WHEN CURRENT_DATE < c.start_date THEN 'future'
          ELSE 'past'
        END as course_status
      FROM student_enrollment e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN courses c ON e.course_id = c.course_id
      WHERE u.username = $1
      ORDER BY c.start_date DESC
    `;
    const enrollmentResult = await pool.query(enrollmentQuery, [userName]);
    console.log('Enrollments:', enrollmentResult.rows);

    res.json({
      user: userResult.rows[0],
      student: studentResult.rows[0],
      enrollments: enrollmentResult.rows
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;