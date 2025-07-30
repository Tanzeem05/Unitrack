import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes working!' });
});

// Test endpoint to check courses without pagination
router.get('/courses-test', async (req, res) => {
    try {
        const query = 'SELECT * FROM courses ORDER BY created_at DESC LIMIT 5';
        const result = await pool.query(query);
        console.log('Simple courses test:', result.rows);
        res.json({
            message: 'Simple course test',
            count: result.rows.length,
            courses: result.rows
        });
    } catch (err) {
        console.error('Error in courses test:', err);
        res.status(500).json({ error: 'Test failed', details: err.message });
    }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('Fetching admin stats...');

        // Get total users count
        const totalUsersQuery = 'SELECT COUNT(*) as total_users FROM users';
        const totalUsersResult = await pool.query(totalUsersQuery);
        const totalUsers = parseInt(totalUsersResult.rows[0].total_users);
        console.log('Total users:', totalUsers);

        // Get active courses count (courses that haven't ended yet)
        const activeCoursesQuery = `
      SELECT COUNT(*) as active_courses 
      FROM courses 
      WHERE end_date >= CURRENT_DATE OR end_date IS NULL
    `;
        const activeCoursesResult = await pool.query(activeCoursesQuery);
        const activeCourses = parseInt(activeCoursesResult.rows[0].active_courses);
        console.log('Active courses:', activeCourses);

        // Get total enrollments count
        const totalEnrollmentsQuery = 'SELECT COUNT(*) as total_enrollments FROM student_enrollment';
        const totalEnrollmentsResult = await pool.query(totalEnrollmentsQuery);
        const totalEnrollments = parseInt(totalEnrollmentsResult.rows[0].total_enrollments);
        console.log('Total enrollments:', totalEnrollments);

        // Calculate percentage changes (for demo purposes, using random changes)
        // In a real scenario, you'd compare with previous period
        const stats = {
            totalUsers: {
                value: totalUsers,
                change: '+12%' // This would be calculated based on previous period
            },
            activeCourses: {
                value: activeCourses,
                change: '+5%'
            },
            totalEnrollments: {
                value: totalEnrollments,
                change: '+18%'
            }
        };

        console.log('Sending stats:', stats);
        res.json(stats);
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: 'Failed to fetch admin statistics', details: err.message });
    }
});

// Get detailed enrollment statistics by course
router.get('/enrollments/by-course', async (req, res) => {
    try {
        const query = `
      SELECT 
        c.course_code,
        c.course_name,
        COUNT(se.enrollment_id) as enrollment_count,
        c.start_date,
        c.end_date
      FROM courses c
      LEFT JOIN student_enrollment se ON c.course_id = se.course_id
      GROUP BY c.course_id, c.course_code, c.course_name, c.start_date, c.end_date
      ORDER BY enrollment_count DESC
    `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enrollment stats:', err);
        res.status(500).json({ error: 'Failed to fetch enrollment statistics' });
    }
});

// Get recent activities for admin dashboard
router.get('/recent-activities', async (req, res) => {
    try {
        const activities = [];

        // Get recent user registrations
        const recentUsersQuery = `
      SELECT 'user' as type, 
             'New user registered' as title,
             first_name || ' ' || last_name || ' joined as ' || user_type as description,
             created_at as time
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
        const recentUsersResult = await pool.query(recentUsersQuery);
        activities.push(...recentUsersResult.rows);

        // Get recent course creations
        const recentCoursesQuery = `
      SELECT 'course' as type,
             'Course created' as title,
             course_name as description,
             created_at as time
      FROM courses
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
        const recentCoursesResult = await pool.query(recentCoursesQuery);
        activities.push(...recentCoursesResult.rows);

        // Get recent global announcements
        const recentGlobalAnnouncementsQuery = `
      SELECT 'global_announcement' as type,
             'Global announcement created' as title,
             title as description,
             created_at as time
      FROM global_announcements
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
        const recentGlobalAnnouncementsResult = await pool.query(recentGlobalAnnouncementsQuery);
        activities.push(...recentGlobalAnnouncementsResult.rows);

        // Get recent deletion activities from admin logs
        const recentDeletionsQuery = `
      SELECT 
             CASE 
               WHEN al.action_type = 'DELETE_USER' THEN 'user_deletion'
               WHEN al.action_type = 'DELETE_COURSE' THEN 'course_deletion'
               ELSE 'deletion'
             END as type,
             CASE 
               WHEN al.action_type = 'DELETE_USER' THEN 'User deleted'
               WHEN al.action_type = 'DELETE_COURSE' THEN 'Course deleted'
               ELSE 'Item deleted'
             END as title,
             al.description,
             al.created_at as time
      FROM admin_logs al
      WHERE al.action_type IN ('DELETE_USER', 'DELETE_COURSE') 
        AND al.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY al.created_at DESC
      LIMIT 3
    `;
        const recentDeletionsResult = await pool.query(recentDeletionsQuery);
        activities.push(...recentDeletionsResult.rows);

        // Get recent update activities from admin logs
        const recentUpdatesQuery = `
      SELECT 
             CASE 
               WHEN al.action_type = 'UPDATE_USER' THEN 'user_update'
               WHEN al.action_type = 'UPDATE_COURSE' THEN 'course_update'
               ELSE 'update'
             END as type,
             CASE 
               WHEN al.action_type = 'UPDATE_USER' THEN 'User updated'
               WHEN al.action_type = 'UPDATE_COURSE' THEN 'Course updated'
               ELSE 'Item updated'
             END as title,
             al.description,
             al.created_at as time
      FROM admin_logs al
      WHERE al.action_type IN ('UPDATE_USER', 'UPDATE_COURSE') 
        AND al.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY al.created_at DESC
      LIMIT 2
    `;
        const recentUpdatesResult = await pool.query(recentUpdatesQuery);
        activities.push(...recentUpdatesResult.rows);

        // Sort all activities by time and limit to 10
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const limitedActivities = activities.slice(0, 10);

        res.json(limitedActivities);
    } catch (err) {
        console.error('Error fetching recent activities:', err);
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
});

// Get recent users for admin dashboard
router.get('/recent-users', async (req, res) => {
    try {
        const query = `
      SELECT 
        user_id,
        first_name || ' ' || last_name as name,
        email,
        user_type as role,
        'Active' as status,
        TO_CHAR(created_at, 'YYYY-MM-DD') as join_date
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching recent users:', err);
        res.status(500).json({ error: 'Failed to fetch recent users' });
    }
});

// Get admin activity logs
router.get('/logs', async (req, res) => {
    try {
        const query = `
      SELECT 
        al.log_id,
        al.admin_id,
        al.action_type as action,
        al.description as details,
        al.affected_user_id as target_id,
        CASE 
          WHEN al.affected_user_id IS NOT NULL THEN 'User'
          WHEN al.affected_course_id IS NOT NULL THEN 'Course'
          ELSE 'System'
        END as target_type,
        al.created_at,
        u.first_name || ' ' || u.last_name as admin_name,
        NULL as ip_address
      FROM admin_logs al
      LEFT JOIN admins a ON al.admin_id = a.admin_id
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin logs:', err);
        res.status(500).json({ error: 'Failed to fetch admin logs', details: err.message });
    }
});

// Get all courses for admin management
router.get('/courses', async (req, res) => {
    try {
        console.log('Received request for courses with query:', req.query);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        console.log('Pagination params:', { page, limit, offset });

        // Get total count for pagination
        const countQuery = 'SELECT COUNT(*) as total FROM courses';
        const countResult = await pool.query(countQuery);
        const totalCourses = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCourses / limit);

        console.log('Total courses in database:', totalCourses);

        const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.start_date,
        c.end_date,
        c.created_at,
        COUNT(se.enrollment_id) as enrollment_count,
        CASE 
          WHEN c.end_date < CURRENT_DATE THEN 'Completed'
          WHEN c.start_date > CURRENT_DATE THEN 'Upcoming'
          ELSE 'Active'
        END as status
      FROM courses c
      LEFT JOIN student_enrollment se ON c.course_id = se.course_id
      GROUP BY c.course_id, c.course_code, c.course_name, c.description, c.start_date, c.end_date, c.created_at
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `;

        const result = await pool.query(query, [limit, offset]);
        
        console.log('Pagination query result:', {
            totalCourses,
            totalPages,
            currentPage: page,
            coursesReturned: result.rows.length,
            sampleCourse: result.rows[0] || 'No courses found'
        });
        
        res.json({
            courses: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCourses: totalCourses,
                limit: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Create new course
router.post('/courses', async (req, res) => {
    try {
        const {
            course_code,
            course_name,
            description,
            start_date,
            end_date,
            created_by
        } = req.body;

        // Validate required fields
        if (!course_code || !course_name || !start_date || !end_date) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Get a valid admin_id from the admins table if created_by is not provided
        let adminId = created_by;
        if (!adminId) {
            const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
            const adminResult = await pool.query(adminQuery);
            
            if (adminResult.rows.length === 0) {
                console.error('No admin found in admins table');
                return res.status(500).json({ error: 'No admin user available for this operation' });
            }
            
            adminId = adminResult.rows[0].admin_id;
        }

        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);

            const query = `
        INSERT INTO courses (course_code, course_name, description, start_date, end_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

            const values = [course_code, course_name, description, start_date, end_date, adminId];
            const result = await client.query(query, values);
            
            // Get the created course with status calculation
            const courseWithStatus = await client.query(`
                SELECT 
                    c.course_id,
                    c.course_code,
                    c.course_name,
                    c.description,
                    c.start_date,
                    c.end_date,
                    c.created_at,
                    COUNT(se.enrollment_id) as enrollment_count,
                    CASE 
                        WHEN c.end_date < CURRENT_DATE THEN 'Completed'
                        WHEN c.start_date > CURRENT_DATE THEN 'Upcoming'
                        ELSE 'Active'
                    END as status
                FROM courses c
                LEFT JOIN student_enrollment se ON c.course_id = se.course_id
                WHERE c.course_id = $1
                GROUP BY c.course_id, c.course_code, c.course_name, c.description, c.start_date, c.end_date, c.created_at
            `, [result.rows[0].course_id]);
            
            await client.query('COMMIT');
            client.release();

            res.status(201).json(courseWithStatus.rows[0]);
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error creating course:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Course code already exists' });
        } else if (err.code === '23502') {
            res.status(500).json({ error: 'Database constraint violation - missing required admin reference' });
        } else {
            res.status(500).json({ error: 'Failed to create course' });
        }
    }
});

// Update existing course
router.put('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            course_code,
            course_name,
            description,
            start_date,
            end_date
        } = req.body;

        console.log('Updating course with ID:', id);
        console.log('Update data:', { course_code, course_name, description, start_date, end_date });

        // First, get a valid admin_id from the admins table
        const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            console.error('No admin found in admins table');
            return res.status(500).json({ error: 'No admin user available for this operation' });
        }

        const adminId = adminResult.rows[0].admin_id;
        console.log('Using admin_id:', adminId);

        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);
            
            const query = `
        UPDATE courses
        SET course_code = $1, course_name = $2, description = $3, 
            start_date = $4, end_date = $5, updated_at = CURRENT_TIMESTAMP, updated_by = $6
        WHERE course_id = $7
        RETURNING *
      `;

            const values = [course_code, course_name, description, start_date, end_date, adminId, id];
            console.log('Query values:', values);

            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(404).json({ error: 'Course not found' });
            }

            // Get the updated course with status calculation
            const courseWithStatus = await client.query(`
                SELECT 
                    c.course_id,
                    c.course_code,
                    c.course_name,
                    c.description,
                    c.start_date,
                    c.end_date,
                    c.created_at,
                    COUNT(se.enrollment_id) as enrollment_count,
                    CASE 
                        WHEN c.end_date < CURRENT_DATE THEN 'Completed'
                        WHEN c.start_date > CURRENT_DATE THEN 'Upcoming'
                        ELSE 'Active'
                    END as status
                FROM courses c
                LEFT JOIN student_enrollment se ON c.course_id = se.course_id
                WHERE c.course_id = $1
                GROUP BY c.course_id, c.course_code, c.course_name, c.description, c.start_date, c.end_date, c.created_at
            `, [id]);
            
            await client.query('COMMIT');
            client.release();

            console.log('Course updated successfully:', courseWithStatus.rows[0]);
            res.json(courseWithStatus.rows[0]);
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error updating course:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint
        });

        if (err.code === '23505') {
            res.status(400).json({ error: 'Course code already exists' });
        } else if (err.code === '23503') {
            res.status(400).json({ error: 'Invalid foreign key reference' });
        } else if (err.code === '23502') {
            res.status(500).json({ error: 'Database constraint violation - missing required admin reference' });
        } else {
            res.status(500).json({ error: 'Failed to update course', details: err.message });
        }
    }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get a valid admin_id from the admins table for the trigger
        const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            console.error('No admin found in admins table');
            return res.status(500).json({ error: 'No admin user available for this operation' });
        }

        const adminId = adminResult.rows[0].admin_id;
        
        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);

            // First, delete all related records to avoid foreign key constraint violations
            
            // Delete student enrollments
            await client.query('DELETE FROM student_enrollment WHERE course_id = $1', [id]);
            
            // Delete course teachers
            await client.query('DELETE FROM course_teachers WHERE course_id = $1', [id]);
            
            // Delete course weeks/content (if exists)
            try {
                await client.query('DELETE FROM course_weeks WHERE course_id = $1', [id]);
            } catch (err) {
                // Table might not exist, continue
                console.log('course_weeks table not found, skipping...');
            }
            
            // Delete course resources
            try {
                await client.query('DELETE FROM course_resources WHERE course_id = $1', [id]);
            } catch (err) {
                // Table might not exist, continue
                console.log('course_resources table not found, skipping...');
            }
            
            // Delete assignment submissions first (due to foreign key dependencies)
            try {
                await client.query('DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = $1)', [id]);
            } catch (err) {
                console.log('assignment_submissions table not found, skipping...');
            }
            
            // Delete assignments related to this course
            try {
                await client.query('DELETE FROM assignments WHERE course_id = $1', [id]);
            } catch (err) {
                console.log('assignments table not found, skipping...');
            }
            
            // Delete announcements related to this course
            try {
                await client.query('DELETE FROM announcements WHERE course_id = $1', [id]);
            } catch (err) {
                console.log('announcements table not found, skipping...');
            }
            
            // Delete admin logs related to this course
            try {
                await client.query('DELETE FROM admin_logs WHERE affected_course_id = $1', [id]);
            } catch (err) {
                console.log('admin_logs table not found, skipping...');
            }
            
            // Finally, delete the course itself
            const query = 'DELETE FROM courses WHERE course_id = $1 RETURNING *';
            const result = await client.query(query, [id]);
            
            await client.query('COMMIT');
            client.release();

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            res.json({ 
                message: 'Course and all related data deleted successfully',
                deletedCourse: result.rows[0]
            });
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// Get available teachers for course assignment
router.get('/teachers', async (req, res) => {
    try {
        const query = `
      SELECT 
        u.user_id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        t.specialization
      FROM users u
      JOIN teachers t ON u.user_id = t.user_id
      WHERE u.user_type = 'teacher'
      ORDER BY u.first_name, u.last_name
    `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

// Get all users with pagination and search
router.get('/users', async (req, res) => {
    try {
        console.log('Received request for users with query:', req.query);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const userType = req.query.userType || '';
        const adminLevel = req.query.adminLevel || '';
        const session = req.query.session || '';
        const departmentId = req.query.departmentId || '';

        console.log('Pagination params:', { page, limit, offset, search, userType, adminLevel, session, departmentId });

        // Build WHERE clause for search and filtering
        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause += `WHERE (
                LOWER(u.first_name) LIKE LOWER($${paramIndex}) OR 
                LOWER(u.last_name) LIKE LOWER($${paramIndex}) OR 
                LOWER(u.email) LIKE LOWER($${paramIndex}) OR 
                LOWER(u.username) LIKE LOWER($${paramIndex})
            )`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (userType) {
            if (whereClause) {
                whereClause += ` AND u.user_type = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.user_type = $${paramIndex}`;
            }
            queryParams.push(userType);
            paramIndex++;
        }

        if (adminLevel && userType === 'admin') {
            if (whereClause) {
                whereClause += ` AND u.admin_level = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.admin_level = $${paramIndex}`;
            }
            queryParams.push(adminLevel);
            paramIndex++;
        }

        // Add session filter for students
        if (session && userType === 'student') {
            if (whereClause) {
                whereClause += ` AND u.batch_year = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.batch_year = $${paramIndex}`;
            }
            queryParams.push(session);
            paramIndex++;
        }

        // Add department filter for students
        if (departmentId && userType === 'student') {
            if (whereClause) {
                whereClause += ` AND u.department_id = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.department_id = $${paramIndex}`;
            }
            queryParams.push(departmentId);
            paramIndex++;
        }

        // Add specialization filter for teachers
        if (req.query.specialization && userType === 'teacher') {
            if (whereClause) {
                whereClause += ` AND u.specialization = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.specialization = $${paramIndex}`;
            }
            queryParams.push(req.query.specialization);
            paramIndex++;
        }

        // Add department filter for teachers (if they have department assignments)
        if (req.query.teacherDepartmentId && userType === 'teacher') {
            if (whereClause) {
                whereClause += ` AND u.department_id = $${paramIndex}`;
            } else {
                whereClause += `WHERE u.department_id = $${paramIndex}`;
            }
            queryParams.push(req.query.teacherDepartmentId);
            paramIndex++;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM users u LEFT JOIN department d ON u.department_id = d.department_id ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalUsers = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalUsers / limit);

        console.log('Total users found:', totalUsers);

        // Get users with pagination
        const usersQuery = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.user_type,
                u.admin_level,
                u.specialization,
                u.batch_year,
                u.department_id,
                d.name as department_name,
                u.created_at,
                u.updated_at,
                CASE 
                    WHEN u.user_type = 'admin' THEN 'Administrator'
                    WHEN u.user_type = 'teacher' THEN 'Teacher'
                    WHEN u.user_type = 'student' THEN 'Student'
                    ELSE 'Unknown'
                END as role_display
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await pool.query(usersQuery, queryParams);
        
        console.log('Users query result:', {
            totalUsers,
            totalPages,
            currentPage: page,
            usersReturned: result.rows.length,
            sampleUser: result.rows[0] || 'No users found'
        });
        
        res.json({
            users: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalUsers: totalUsers,
                limit: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.user_type,
                u.admin_level,
                u.specialization,
                u.batch_year,
                u.department_id,
                d.name as department_name,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE u.user_id = $1
        `;

        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            first_name,
            last_name,
            user_type,
            admin_level,
            specialization,
            batch_year,
            department_id
        } = req.body;

        // Validate required fields
        if (!username || !password || !email || !first_name || !last_name || !user_type) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate role-specific fields
        if (user_type === 'admin' && !admin_level) {
            return res.status(400).json({ error: 'Admin level is required for admin users' });
        }
        if (user_type === 'teacher' && !specialization) {
            return res.status(400).json({ error: 'Specialization is required for teacher users' });
        }
        if (user_type === 'teacher' && !department_id) {
            return res.status(400).json({ error: 'Department is required for teacher users' });
        }
        if (user_type === 'student' && !batch_year) {
            return res.status(400).json({ error: 'Batch year is required for student users' });
        }
        if (user_type === 'student' && !department_id) {
            return res.status(400).json({ error: 'Department is required for student users' });
        }

        // Check if username already exists
        const usernameCheck = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Get a valid admin_id from the admins table for the trigger
        const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            console.error('No admin found in admins table');
            return res.status(500).json({ error: 'No admin user available for this operation' });
        }

        const adminId = adminResult.rows[0].admin_id;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);

            const query = `
                INSERT INTO users (username, password, email, first_name, last_name, user_type, admin_level, specialization, batch_year, department_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, LOWER($8), $9, $10)
                RETURNING user_id, username, email, first_name, last_name, user_type, admin_level, specialization, batch_year, department_id, created_at
            `;

            const values = [
                username,
                hashedPassword,
                email,
                first_name,
                last_name,
                user_type,
                admin_level || null,
                specialization || null,
                batch_year || null,
                department_id || null
            ];

            const result = await client.query(query, values);
            
            await client.query('COMMIT');
            client.release();
            
            res.status(201).json(result.rows[0]);
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error creating user:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create user', details: err.message });
        }
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username,
            email,
            first_name,
            last_name,
            user_type,
            admin_level,
            specialization,
            batch_year,
            department_id,
            password
        } = req.body;

        // Validate required fields
        if (!username || !email || !first_name || !last_name || !user_type) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for duplicate username
        const usernameCheck = await pool.query(
            'SELECT user_id FROM users WHERE username = $1 AND user_id != $2',
            [username, id]
        );
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check for duplicate email
        const emailCheck = await pool.query(
            'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
            [email, id]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Get a valid admin_id from the admins table for the trigger
        const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            console.error('No admin found in admins table');
            return res.status(500).json({ error: 'No admin user available for this operation' });
        }

        const adminId = adminResult.rows[0].admin_id;

        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);

            let query;
            let values;

            if (password) {
                // Hash new password
                const hashedPassword = await bcrypt.hash(password, 10);
                
                query = `
                    UPDATE users 
                    SET username = $1, password = $2, email = $3, first_name = $4, 
                        last_name = $5, user_type = $6, admin_level = $7, 
                        specialization = $8, batch_year = $9, department_id = $10, updated_at = CURRENT_TIMESTAMP, updated_by = $11
                    WHERE user_id = $12
                    RETURNING *
                `;
                values = [username, hashedPassword, email, first_name, last_name, user_type, admin_level || null, specialization || null, batch_year || null, department_id || null, adminId, id];
            } else {
                query = `
                    UPDATE users 
                    SET username = $1, email = $2, first_name = $3, 
                        last_name = $4, user_type = $5, admin_level = $6, 
                        specialization = $7, batch_year = $8, department_id = $9, updated_at = CURRENT_TIMESTAMP, updated_by = $10
                    WHERE user_id = $11
                    RETURNING *
                `;
                values = [username, email, first_name, last_name, user_type, admin_level || null, specialization || null, batch_year || null, department_id || null, adminId, id];
            }

            const result = await client.query(query, values);
            
            await client.query('COMMIT');
            client.release();
            
            res.json(result.rows[0]);
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error updating user:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update user', details: err.message });
        }
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const userCheck = await pool.query('SELECT user_id, username FROM users WHERE user_id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get a valid admin_id from the admins table for the trigger
        const adminQuery = 'SELECT admin_id FROM admins ORDER BY admin_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            console.error('No admin found in admins table');
            return res.status(500).json({ error: 'No admin user available for this operation' });
        }

        const adminId = adminResult.rows[0].admin_id;

        // Use a transaction to ensure the session variable is set properly
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set the session variable for the trigger
            await client.query('SELECT set_config($1, $2, false)', ['app.current_admin_id', adminId.toString()]);

            const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id, username, email';
            const result = await client.query(query, [id]);
            
            await client.query('COMMIT');
            client.release();
            
            res.json({ 
                message: 'User deleted successfully',
                deletedUser: result.rows[0]
            });
        } catch (queryErr) {
            await client.query('ROLLBACK');
            client.release();
            throw queryErr;
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        if (err.code === '23503') {
            res.status(400).json({ error: 'Cannot delete user: user has associated records' });
        } else {
            res.status(500).json({ error: 'Failed to delete user', details: err.message });
        }
    }
});

// Get user statistics
router.get('/users/stats/summary', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN user_type = 'student' THEN 1 END) as total_students,
                COUNT(CASE WHEN user_type = 'teacher' THEN 1 END) as total_teachers,
                COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as total_admins,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7_days
            FROM users
        `;

        const result = await pool.query(statsQuery);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user statistics:', err);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});

// ===================== GLOBAL ANNOUNCEMENTS ROUTES =====================

// Get all global announcements with pagination and filtering (Admin only)
router.get('/global-announcements', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const priority = req.query.priority || '';
        const target_audience = req.query.target_audience || '';
        const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : null;

        // Build WHERE clause
        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        const conditions = [];
        
        if (priority) {
            conditions.push(`priority = $${paramIndex}`);
            queryParams.push(priority);
            paramIndex++;
        }
        
        if (target_audience) {
            conditions.push(`target_audience = $${paramIndex}`);
            queryParams.push(target_audience);
            paramIndex++;
        }
        
        if (is_active !== null) {
            conditions.push(`is_active = $${paramIndex}`);
            queryParams.push(is_active);
            paramIndex++;
        }

        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM global_announcements ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalAnnouncements = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalAnnouncements / limit);

        // Get announcements with creator info
        const announcementsQuery = `
            SELECT 
                ga.*,
                u.first_name || ' ' || u.last_name as creator_name,
                u.email as creator_email,
                CASE 
                    WHEN ga.expires_at IS NOT NULL AND ga.expires_at < NOW() THEN 'expired'
                    WHEN ga.is_active = false THEN 'inactive'
                    ELSE 'active'
                END as status
            FROM global_announcements ga
            LEFT JOIN users u ON ga.created_by = u.user_id
            ${whereClause}
            ORDER BY ga.is_pinned DESC, ga.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await pool.query(announcementsQuery, queryParams);

        res.json({
            announcements: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalAnnouncements: totalAnnouncements,
                limit: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching global announcements:', err);
        res.status(500).json({ error: 'Failed to fetch global announcements' });
    }
});

// Create new global announcement (Admin only)
router.post('/global-announcements', async (req, res) => {
    try {
        const {
            title,
            content,
            priority = 'normal',
            target_audience = 'all',
            is_pinned = false,
            expires_at = null
        } = req.body;

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Get admin user ID (in a real app, this would come from auth token)
        const adminQuery = 'SELECT user_id FROM users WHERE user_type = \'admin\' ORDER BY user_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            return res.status(500).json({ error: 'No admin user found' });
        }

        const adminId = adminResult.rows[0].user_id;

        const query = `
            INSERT INTO global_announcements 
            (title, content, priority, target_audience, is_pinned, expires_at, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [title, content, priority, target_audience, is_pinned, expires_at, adminId];
        const result = await pool.query(query, values);

        // Get the created announcement with creator info
        const createdAnnouncement = await pool.query(`
            SELECT 
                ga.*,
                u.first_name || ' ' || u.last_name as creator_name,
                u.email as creator_email
            FROM global_announcements ga
            LEFT JOIN users u ON ga.created_by = u.user_id
            WHERE ga.global_announcement_id = $1
        `, [result.rows[0].global_announcement_id]);

        res.status(201).json(createdAnnouncement.rows[0]);
    } catch (err) {
        console.error('Error creating global announcement:', err);
        res.status(500).json({ error: 'Failed to create global announcement' });
    }
});

// Update global announcement (Admin only)
router.put('/global-announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            priority,
            target_audience,
            is_active,
            is_pinned,
            expires_at
        } = req.body;

        // Get admin user ID
        const adminQuery = 'SELECT user_id FROM users WHERE user_type = \'admin\' ORDER BY user_id LIMIT 1';
        const adminResult = await pool.query(adminQuery);
        
        if (adminResult.rows.length === 0) {
            return res.status(500).json({ error: 'No admin user found' });
        }

        const adminId = adminResult.rows[0].user_id;

        const query = `
            UPDATE global_announcements 
            SET title = $1, content = $2, priority = $3, target_audience = $4, 
                is_active = $5, is_pinned = $6, expires_at = $7, 
                updated_at = CURRENT_TIMESTAMP, updated_by = $8
            WHERE global_announcement_id = $9
            RETURNING *
        `;

        const values = [title, content, priority, target_audience, is_active, is_pinned, expires_at, adminId, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Global announcement not found' });
        }

        // Get updated announcement with creator info
        const updatedAnnouncement = await pool.query(`
            SELECT 
                ga.*,
                u.first_name || ' ' || u.last_name as creator_name,
                u.email as creator_email
            FROM global_announcements ga
            LEFT JOIN users u ON ga.created_by = u.user_id
            WHERE ga.global_announcement_id = $1
        `, [id]);

        res.json(updatedAnnouncement.rows[0]);
    } catch (err) {
        console.error('Error updating global announcement:', err);
        res.status(500).json({ error: 'Failed to update global announcement' });
    }
});

// Delete global announcement (Admin only)
router.delete('/global-announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM global_announcements WHERE global_announcement_id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Global announcement not found' });
        }

        res.json({ message: 'Global announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting global announcement:', err);
        res.status(500).json({ error: 'Failed to delete global announcement' });
    }
});

// Get announcement statistics (Admin only)
router.get('/global-announcements/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_announcements,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_announcements,
                COUNT(CASE WHEN is_pinned = true THEN 1 END) as pinned_announcements,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_announcements,
                COUNT(CASE WHEN target_audience = 'students' THEN 1 END) as student_announcements,
                COUNT(CASE WHEN target_audience = 'teachers' THEN 1 END) as teacher_announcements,
                COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END) as expired_announcements
            FROM global_announcements
        `;

        const result = await pool.query(statsQuery);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching announcement statistics:', err);
        res.status(500).json({ error: 'Failed to fetch announcement statistics' });
    }
});

// Get all departments for dropdown (Admin only)
router.get('/departments', async (req, res) => {
    try {
        const query = `
            SELECT 
                department_id, 
                name
            FROM department 
            ORDER BY name
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get unique admin levels for filtering (Admin only)
router.get('/admin-levels', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT admin_level
            FROM users
            WHERE user_type = 'admin' AND admin_level IS NOT NULL
            ORDER BY admin_level
        `;

        const result = await pool.query(query);
        res.json(result.rows.map(row => row.admin_level));
    } catch (err) {
        console.error('Error fetching admin levels:', err);
        res.status(500).json({ error: 'Failed to fetch admin levels' });
    }
});

// Get unique batch years/sessions for filtering students (Admin only)
router.get('/sessions', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT batch_year
            FROM users
            WHERE user_type = 'student' AND batch_year IS NOT NULL
            ORDER BY batch_year DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows.map(row => row.batch_year));
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get unique specializations for filtering teachers (Admin only)
router.get('/specializations', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT specialization
            FROM users
            WHERE user_type = 'teacher' AND specialization IS NOT NULL
            ORDER BY specialization ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows.map(row => row.specialization));
    } catch (err) {
        console.error('Error fetching specializations:', err);
        res.status(500).json({ error: 'Failed to fetch specializations' });
    }
});

// ===================== USER DETAILS ROUTES =====================

// Get student enrollment details (Admin only)
router.get('/users/:id/enrollments', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First verify the user exists and is a student
        const userCheck = await pool.query(
            'SELECT user_id, user_type, first_name, last_name FROM users WHERE user_id = $1',
            [id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (userCheck.rows[0].user_type !== 'student') {
            return res.status(400).json({ error: 'User is not a student' });
        }
        
        const query = `
            SELECT 
                se.enrollment_id,
                se.enrollment_date,
                c.course_id,
                c.course_code,
                c.course_name,
                c.description as course_description,
                c.start_date,
                c.end_date,
                (select d.name from department d where d.department_id = st.department_id) as department_name,
                CASE 
                    WHEN c.end_date < CURRENT_DATE THEN 'Completed'
                    WHEN c.start_date > CURRENT_DATE THEN 'Upcoming'
                    ELSE 'Active'
                END as course_status,
                -- Get progress information if available
                COALESCE(
                    (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.course_id), 0
                ) as total_assignments,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM assignment_submissions asub 
                     JOIN assignments a ON asub.assignment_id = a.assignment_id 
                     WHERE a.course_id = c.course_id AND asub.student_id = se.student_id), 0
                ) as submitted_assignments
            FROM student_enrollment se
            JOIN courses c ON se.course_id = c.course_id
            LEFT JOIN students st ON se.student_id = st.student_id
            WHERE se.student_id = $1
            ORDER BY se.enrollment_date DESC, c.start_date DESC
        `;

        const result = await pool.query(query, [id]);
        
        const userInfo = userCheck.rows[0];
        
        res.json({
            student: {
                user_id: userInfo.user_id,
                name: `${userInfo.first_name} ${userInfo.last_name}`,
                user_type: userInfo.user_type
            },
            enrollments: result.rows,
            summary: {
                total_courses: result.rows.length,
                active_courses: result.rows.filter(row => row.course_status === 'Active').length,
                completed_courses: result.rows.filter(row => row.course_status === 'Completed').length,
                upcoming_courses: result.rows.filter(row => row.course_status === 'Upcoming').length
            }
        });
        
    } catch (err) {
        console.error('Error fetching student enrollments:', err);
        res.status(500).json({ error: 'Failed to fetch student enrollments', details: err.message });
    }
});

// Get teacher information and courses (Admin only)
router.get('/users/:id/teacher-info', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First verify the user exists and is a teacher
        const userCheck = await pool.query(
            'SELECT user_id, user_type, first_name, last_name, specialization FROM users WHERE user_id = $1',
            [id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (userCheck.rows[0].user_type !== 'teacher') {
            return res.status(400).json({ error: 'User is not a teacher' });
        }
        
        // Get courses taught by this teacher
        const coursesQuery = `
            SELECT 
                c.course_id,
                c.course_code,
                c.course_name,
                c.description as course_description,
                c.start_date,
                c.end_date,
                CASE 
                    WHEN c.end_date < CURRENT_DATE THEN 'Completed'
                    WHEN c.start_date > CURRENT_DATE THEN 'Upcoming'
                    ELSE 'Active'
                END as course_status,
                COUNT(se.enrollment_id) as enrolled_students,
                ct.assigned_date
            FROM course_teachers ct
            JOIN courses c ON ct.course_id = c.course_id
            LEFT JOIN student_enrollment se ON c.course_id = se.course_id
            WHERE ct.teacher_id = $1
            GROUP BY c.course_id, c.course_code, c.course_name, c.description, 
                     c.start_date, c.end_date, ct.assigned_date
            ORDER BY ct.assigned_date DESC, c.start_date DESC
        `;

        const coursesResult = await pool.query(coursesQuery, [id]);
        
        // Get assignment statistics for this teacher
        const assignmentsQuery = `
            SELECT 
                COUNT(*) as total_assignments,
                COUNT(CASE WHEN a.due_date >= CURRENT_DATE THEN 1 END) as active_assignments,
                COUNT(CASE WHEN a.due_date < CURRENT_DATE THEN 1 END) as past_assignments
            FROM assignments a
            JOIN courses c ON a.course_id = c.course_id
            JOIN course_teachers ct ON c.course_id = ct.course_id
            WHERE ct.teacher_id = $1
        `;

        const assignmentsResult = await pool.query(assignmentsQuery, [id]);
        
        const userInfo = userCheck.rows[0];
        
        res.json({
            teacher: {
                user_id: userInfo.user_id,
                name: `${userInfo.first_name} ${userInfo.last_name}`,
                user_type: userInfo.user_type,
                specialization: userInfo.specialization
            },
            courses: coursesResult.rows,
            assignments: assignmentsResult.rows[0] || {
                total_assignments: 0,
                active_assignments: 0,
                past_assignments: 0
            },
            summary: {
                total_courses: coursesResult.rows.length,
                active_courses: coursesResult.rows.filter(row => row.course_status === 'Active').length,
                completed_courses: coursesResult.rows.filter(row => row.course_status === 'Completed').length,
                upcoming_courses: coursesResult.rows.filter(row => row.course_status === 'Upcoming').length,
                total_students: coursesResult.rows.reduce((sum, course) => sum + parseInt(course.enrolled_students), 0)
            }
        });
        
    } catch (err) {
        console.error('Error fetching teacher information:', err);
        res.status(500).json({ error: 'Failed to fetch teacher information', details: err.message });
    }
});

// Get admin information and recent activities (Admin only)
router.get('/users/:id/admin-info', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First verify the user exists and is an admin
        const userCheck = await pool.query(
            'SELECT user_id, user_type, first_name, last_name, admin_level, created_at FROM users WHERE user_id = $1',
            [id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (userCheck.rows[0].user_type !== 'admin') {
            return res.status(400).json({ error: 'User is not an admin' });
        }
        
        // Get recent admin activities/logs
        const logsQuery = `
            SELECT 
                al.log_id,
                al.action_type,
                al.description,
                al.affected_user_id,
                al.affected_course_id,
                al.created_at,
                CASE 
                    WHEN al.affected_user_id IS NOT NULL THEN 'User Management'
                    WHEN al.affected_course_id IS NOT NULL THEN 'Course Management'
                    ELSE 'System Administration'
                END as category,
                -- Get affected user details if available
                CASE 
                    WHEN al.affected_user_id IS NOT NULL THEN 
                        (SELECT first_name || ' ' || last_name FROM users WHERE user_id = al.affected_user_id)
                    ELSE NULL
                END as affected_user_name,
                -- Get affected course details if available
                CASE 
                    WHEN al.affected_course_id IS NOT NULL THEN 
                        (SELECT course_name FROM courses WHERE course_id = al.affected_course_id)
                    ELSE NULL
                END as affected_course_name
            FROM admin_logs al
            WHERE al.admin_id = (SELECT admin_id FROM admins WHERE user_id = $1 LIMIT 1)
            ORDER BY al.created_at DESC
            LIMIT 20
        `;

        const logsResult = await pool.query(logsQuery, [id]);
        
        // Get admin statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_actions,
                COUNT(CASE WHEN al.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as actions_last_30_days,
                COUNT(CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as actions_last_7_days,
                COUNT(CASE WHEN al.action_type = 'CREATE' THEN 1 END) as create_actions,
                COUNT(CASE WHEN al.action_type = 'UPDATE' THEN 1 END) as update_actions,
                COUNT(CASE WHEN al.action_type = 'DELETE' THEN 1 END) as delete_actions
            FROM admin_logs al
            WHERE al.admin_id = (SELECT admin_id FROM admins WHERE user_id = $1 LIMIT 1)
        `;

        const statsResult = await pool.query(statsQuery, [id]);
        
        // Get system permissions/capabilities based on admin level
        const getPermissions = (adminLevel) => {
            const permissions = {
                'super_admin': [
                    'User Management',
                    'Course Management', 
                    'System Configuration',
                    'Global Announcements',
                    'Reports & Analytics',
                    'Admin Management'
                ],
                'admin': [
                    'User Management',
                    'Course Management',
                    'Global Announcements',
                    'Reports & Analytics'
                ],
                'moderator': [
                    'Course Management',
                    'Global Announcements'
                ]
            };
            return permissions[adminLevel] || ['Basic Admin Access'];
        };
        
        const userInfo = userCheck.rows[0];
        
        res.json({
            admin: {
                user_id: userInfo.user_id,
                name: `${userInfo.first_name} ${userInfo.last_name}`,
                user_type: userInfo.user_type,
                admin_level: userInfo.admin_level,
                account_created: userInfo.created_at,
                permissions: getPermissions(userInfo.admin_level)
            },
            recent_activities: logsResult.rows,
            statistics: statsResult.rows[0] || {
                total_actions: 0,
                actions_last_30_days: 0,
                actions_last_7_days: 0,
                create_actions: 0,
                update_actions: 0,
                delete_actions: 0
            },
            summary: {
                activity_categories: {
                    user_management: logsResult.rows.filter(log => log.category === 'User Management').length,
                    course_management: logsResult.rows.filter(log => log.category === 'Course Management').length,
                    system_administration: logsResult.rows.filter(log => log.category === 'System Administration').length
                },
                recent_activity_count: logsResult.rows.length
            }
        });
        
    } catch (err) {
        console.error('Error fetching admin information:', err);
        res.status(500).json({ error: 'Failed to fetch admin information', details: err.message });
    }
});

export default router;
