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

        // Get active announcements count (announcements from last 30 days)
        const activeAnnouncementsQuery = `
      SELECT COUNT(*) as active_announcements 
      FROM announcements 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
        const activeAnnouncementsResult = await pool.query(activeAnnouncementsQuery);
        const activeAnnouncements = parseInt(activeAnnouncementsResult.rows[0].active_announcements);
        console.log('Active announcements:', activeAnnouncements);

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
            },
            activeAnnouncements: {
                value: activeAnnouncements,
                change: '-2%'
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

        // Get recent announcements
        const recentAnnouncementsQuery = `
      SELECT 'announcement' as type,
             'Announcement sent' as title,
             title as description,
             created_at as time
      FROM announcements
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
        const recentAnnouncementsResult = await pool.query(recentAnnouncementsQuery);
        activities.push(...recentAnnouncementsResult.rows);

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

            const query = 'DELETE FROM courses WHERE course_id = $1 RETURNING *';
            const result = await client.query(query, [id]);
            
            await client.query('COMMIT');
            client.release();

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            res.json({ message: 'Course deleted successfully' });
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

        console.log('Pagination params:', { page, limit, offset, search, userType });

        // Build WHERE clause for search and filtering
        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause += `WHERE (
                LOWER(first_name) LIKE LOWER($${paramIndex}) OR 
                LOWER(last_name) LIKE LOWER($${paramIndex}) OR 
                LOWER(email) LIKE LOWER($${paramIndex}) OR 
                LOWER(username) LIKE LOWER($${paramIndex})
            )`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (userType) {
            if (whereClause) {
                whereClause += ` AND user_type = $${paramIndex}`;
            } else {
                whereClause += `WHERE user_type = $${paramIndex}`;
            }
            queryParams.push(userType);
            paramIndex++;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalUsers = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalUsers / limit);

        console.log('Total users found:', totalUsers);

        // Get users with pagination
        const usersQuery = `
            SELECT 
                user_id,
                username,
                email,
                first_name,
                last_name,
                user_type,
                admin_level,
                specialization,
                batch_year,
                created_at,
                updated_at,
                CASE 
                    WHEN user_type = 'admin' THEN 'Administrator'
                    WHEN user_type = 'teacher' THEN 'Teacher'
                    WHEN user_type = 'student' THEN 'Student'
                    ELSE 'Unknown'
                END as role_display
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC
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
                user_id,
                username,
                email,
                first_name,
                last_name,
                user_type,
                admin_level,
                specialization,
                batch_year,
                created_at,
                updated_at
            FROM users 
            WHERE user_id = $1
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
            batch_year
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
        if (user_type === 'student' && !batch_year) {
            return res.status(400).json({ error: 'Batch year is required for student users' });
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
                INSERT INTO users (username, password, email, first_name, last_name, user_type, admin_level, specialization, batch_year)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING user_id, username, email, first_name, last_name, user_type, admin_level, specialization, batch_year, created_at
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
                batch_year || null // Keep as string, don't convert to integer
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
                        specialization = $8, batch_year = $9, updated_at = CURRENT_TIMESTAMP, updated_by = $10
                    WHERE user_id = $11
                    RETURNING *
                `;
                values = [username, hashedPassword, email, first_name, last_name, user_type, admin_level || null, specialization || null, batch_year || null, id];
            } else {
                query = `
                    UPDATE users 
                    SET username = $1, email = $2, first_name = $3, 
                        last_name = $4, user_type = $5, admin_level = $6, 
                        specialization = $7, batch_year = $8, updated_at = CURRENT_TIMESTAMP, updated_by = $9
                    WHERE user_id = $10
                    RETURNING *
                `;
                values = [username, email, first_name, last_name, user_type, admin_level || null, specialization || null, batch_year || null, adminId, id];
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

export default router;
