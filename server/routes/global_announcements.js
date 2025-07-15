// Global Announcements routes for Students and Teachers
// These routes provide read-only access to global announcements based on user role

import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get global announcements for current user (Students/Teachers)
// This endpoint filters announcements based on user type and shows only active, non-expired ones
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Support both parameter naming conventions for flexibility
        const userType = req.query.user_role || req.query.userType || 'student';
        const userId = req.query.user_id || req.query.userId;
        const unreadOnly = req.query.unread_only === 'true';
        const priority = req.query.priority;

        // Convert user type to match database target_audience values
        const targetAudience = userType === 'student' ? 'students' : 
                              userType === 'teacher' ? 'teachers' : 
                              userType === 'admin' ? 'admins' :
                              userType;

        console.log('Global announcements filtering:', { userType, targetAudience });

        // Build query to get announcements relevant to user type
        let whereClause = `
            WHERE is_active = true 
            AND (expires_at IS NULL OR expires_at > NOW())
            AND (target_audience = 'all' OR target_audience = $1)
        `;

        let paramIndex = 2;
        let additionalParams = [];

        // Add priority filter if specified
        if (priority) {
            whereClause += ` AND priority = $${paramIndex}`;
            additionalParams.push(priority);
            paramIndex++;
        }

        // Add unread filter if specified and userId is provided
        if (unreadOnly && userId) {
            whereClause += ` AND ga.global_announcement_id NOT IN (
                SELECT global_announcement_id 
                FROM global_announcement_reads 
                WHERE user_id = $${paramIndex}
            )`;
            additionalParams.push(userId);
            paramIndex++;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM global_announcements ga
            ${whereClause}
        `;
        const countParams = [targetAudience, ...additionalParams];
        const countResult = await pool.query(countQuery, countParams);
        const totalAnnouncements = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalAnnouncements / limit);

        // Get announcements with read status if userId is provided
        let announcementsQuery;
        let queryParams;

        if (userId) {
            announcementsQuery = `
                SELECT 
                    ga.global_announcement_id,
                    ga.title,
                    ga.content,
                    ga.priority,
                    ga.target_audience,
                    ga.is_pinned,
                    ga.expires_at,
                    ga.created_at,
                    CASE 
                        WHEN ga.is_active = true AND (ga.expires_at IS NULL OR ga.expires_at > NOW()) THEN 'active'
                        WHEN ga.expires_at IS NOT NULL AND ga.expires_at <= NOW() THEN 'expired'
                        ELSE 'inactive'
                    END as status,
                    u.first_name || ' ' || u.last_name as creator_name,
                    CASE WHEN gar.read_at IS NOT NULL THEN true ELSE false END as is_read,
                    gar.read_at
                FROM global_announcements ga
                LEFT JOIN users u ON ga.created_by = u.user_id
                LEFT JOIN global_announcement_reads gar ON ga.global_announcement_id = gar.global_announcement_id 
                    AND gar.user_id = $${paramIndex}
                ${whereClause}
                ORDER BY ga.is_pinned DESC, ga.created_at DESC
                LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
            `;
            queryParams = [targetAudience, ...additionalParams, userId, limit, offset];
        } else {
            announcementsQuery = `
                SELECT 
                    ga.global_announcement_id,
                    ga.title,
                    ga.content,
                    ga.priority,
                    ga.target_audience,
                    ga.is_pinned,
                    ga.expires_at,
                    ga.created_at,
                    CASE 
                        WHEN ga.is_active = true AND (ga.expires_at IS NULL OR ga.expires_at > NOW()) THEN 'active'
                        WHEN ga.expires_at IS NOT NULL AND ga.expires_at <= NOW() THEN 'expired'
                        ELSE 'inactive'
                    END as status,
                    u.first_name || ' ' || u.last_name as creator_name,
                    false as is_read,
                    null as read_at
                FROM global_announcements ga
                LEFT JOIN users u ON ga.created_by = u.user_id
                ${whereClause}
                ORDER BY ga.is_pinned DESC, ga.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            queryParams = [targetAudience, ...additionalParams, limit, offset];
        }

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

// Get unread announcement count for user
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.query.user_id || req.query.userId;
        const userType = req.query.user_role || req.query.userType || 'student';

        console.log('Unread count request:', { userId, userType, query: req.query });

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Convert user type to match database target_audience values
        const targetAudience = userType === 'student' ? 'students' : 
                              userType === 'teacher' ? 'teachers' : 
                              userType === 'admin' ? 'admins' :
                              userType;

        console.log('Unread count filtering:', { userType, targetAudience });

        const query = `
            SELECT COUNT(*) as unread_count
            FROM global_announcements ga
            LEFT JOIN global_announcement_reads gar ON ga.global_announcement_id = gar.global_announcement_id 
                AND gar.user_id = $1
            WHERE ga.is_active = true 
            AND (ga.expires_at IS NULL OR ga.expires_at > NOW())
            AND (ga.target_audience = 'all' OR ga.target_audience = $2)
            AND gar.read_at IS NULL
        `;

        const result = await pool.query(query, [userId, targetAudience]);
        res.json({ unread_count: parseInt(result.rows[0].unread_count) });
    } catch (err) {
        console.error('Error getting unread count:', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Get single global announcement details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.user_id || req.query.userId;
        const userType = req.query.user_role || req.query.userType || 'student';

        // Convert user type to match database target_audience values
        const targetAudience = userType === 'student' ? 'students' : 
                              userType === 'teacher' ? 'teachers' : 
                              userType === 'admin' ? 'admins' :
                              userType;

        let query;
        let queryParams;

        if (userId) {
            query = `
                SELECT 
                    ga.*,
                    u.first_name || ' ' || u.last_name as creator_name,
                    CASE WHEN gar.read_at IS NOT NULL THEN true ELSE false END as is_read,
                    gar.read_at
                FROM global_announcements ga
                LEFT JOIN users u ON ga.created_by = u.user_id
                LEFT JOIN global_announcement_reads gar ON ga.global_announcement_id = gar.global_announcement_id 
                    AND gar.user_id = $2
                WHERE ga.global_announcement_id = $1
                AND ga.is_active = true 
                AND (ga.expires_at IS NULL OR ga.expires_at > NOW())
                AND (ga.target_audience = 'all' OR ga.target_audience = $3)
            `;
            queryParams = [id, userId, targetAudience];
        } else {
            query = `
                SELECT 
                    ga.*,
                    u.first_name || ' ' || u.last_name as creator_name,
                    false as is_read,
                    null as read_at
                FROM global_announcements ga
                LEFT JOIN users u ON ga.created_by = u.user_id
                WHERE ga.global_announcement_id = $1
                AND ga.is_active = true 
                AND (ga.expires_at IS NULL OR ga.expires_at > NOW())
                AND (ga.target_audience = 'all' OR ga.target_audience = $2)
            `;
            queryParams = [id, targetAudience];
        }

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found or not accessible' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching global announcement:', err);
        res.status(500).json({ error: 'Failed to fetch global announcement' });
    }
});

// Mark global announcement as read
router.post('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.body.user_id || req.body.userId;

        console.log('Mark as read request:', { 
            announcementId: id, 
            userId, 
            userRole: req.body.user_role,
            body: req.body 
        });

        if (!userId) {
            console.log('No user ID provided in request body:', req.body);
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if announcement exists and is accessible
        const announcementCheck = await pool.query(`
            SELECT global_announcement_id 
            FROM global_announcements 
            WHERE global_announcement_id = $1 
            AND is_active = true 
            AND (expires_at IS NULL OR expires_at > NOW())
        `, [id]);

        if (announcementCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found or not accessible' });
        }

        // Insert or update read record
        const query = `
            INSERT INTO global_announcement_reads (global_announcement_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (global_announcement_id, user_id) 
            DO UPDATE SET read_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await pool.query(query, [id, userId]);
        res.json({ message: 'Announcement marked as read', readRecord: result.rows[0] });
    } catch (err) {
        console.error('Error marking announcement as read:', err);
        res.status(500).json({ error: 'Failed to mark announcement as read' });
    }
});

export default router;
