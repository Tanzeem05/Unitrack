// server/routes/messages.js
import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Routeconsole.log('messages.js router loaded');
r();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Test route to check if tables exist
router.get('/test', async (req, res) => {
    try {
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%message%'
        `);

        res.json({ tables: tables.rows, user: req.user });
    } catch (err) {
        console.error('Database test error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Search users for messaging
router.get('/search-users', async (req, res) => {
    const { query, userType, batchYear } = req.query;

    if (!query || query.trim() === '') {
        return res.json([]);
    }

    try {
        let sql = `
            SELECT 
                u.user_id,
                u.username,
                u.first_name,
                u.last_name,
                u.user_type,
                s.batch_year,
                t.specialization
            FROM Users u
            LEFT JOIN Students s ON u.user_id = s.user_id
            LEFT JOIN Teachers t ON u.user_id = t.user_id
            WHERE 
                (u.username ILIKE $1 
                OR u.first_name ILIKE $1 
                OR u.last_name ILIKE $1)
                AND u.user_id != $2
        `;

        const params = [`%${query}%`, req.user.user_id];
        let paramCount = 2;

        // Filter by user type
        if (userType && userType !== 'all') {
            paramCount++;
            sql += ` AND u.user_type = $${paramCount}`;
            params.push(userType);
        }

        // Filter by batch year (only for students)
        if (batchYear && batchYear !== 'all') {
            paramCount++;
            sql += ` AND s.batch_year = $${paramCount}`;
            params.push(parseInt(batchYear));
        }

        sql += ` ORDER BY u.first_name, u.last_name LIMIT 10`;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all conversations for a user
router.get('/conversations', async (req, res) => {
    const user_id = req.user.user_id;

    try {
        // Get all conversations with user details
        const result = await db.query(`
            WITH conversation_users AS (
                SELECT DISTINCT
                    CASE 
                        WHEN sender_id = $1 THEN receiver_id 
                        ELSE sender_id 
                    END as other_user_id,
                    MAX(created_at) as last_message_time
                FROM private_messages 
                WHERE sender_id = $1 OR receiver_id = $1
                GROUP BY other_user_id
            ),
            last_messages AS (
                SELECT DISTINCT ON (
                    CASE 
                        WHEN sender_id = $1 THEN receiver_id 
                        ELSE sender_id 
                    END
                )
                    CASE 
                        WHEN sender_id = $1 THEN receiver_id 
                        ELSE sender_id 
                    END as other_user_id,
                    message_text as last_message,
                    created_at
                FROM private_messages 
                WHERE sender_id = $1 OR receiver_id = $1
                ORDER BY other_user_id, created_at DESC
            )
            SELECT                 COALESCE(s.batch_year, '') as batch_year,
me,
                u.last_name,
                u.user_type,
                COALESCE(s.batch_year, 0) as batch_year,
                cu.last_message_time,
                COALESCE(
                    (SELECT COUNT(*) FROM private_messages 
                     WHERE sender_id = u.user_id AND receiver_id = $1 AND read_status = false), 
                    0
                ) as unread_count,
                COALESCE(lm.last_message, 'No messages yet') as last_message
            FROM conversation_users cu
            JOIN Users u ON cu.other_user_id = u.user_id
            LEFT JOIN Students s ON u.user_id = s.user_id
            LEFT JOIN last_messages lm ON cu.other_user_id = lm.other_user_id
            ORDER BY cu.last_message_time DESC
        `, [user_id]);

        res.json(result.rows);
    } catc// Get available batch years for filtering
router.get('/batch-years', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT DISTINCT batch_year 
            FROM Students 
            WHERE batch_year IS NOT NULL 
            ORDER BY batch_year DESC
        `);

        res.json(result.rows.map(row => row.batch_year));
    } catch (err) {
        console.error('Error fetching batch years:', err);
        res.status(500).json({ error: err.message });
    }
});

h (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get messages between current user and another user
router.get('/:otherUsername', async (req, res) => {
    const { otherUsername } = req.params;
    const currentUsername = req.user.username;
    const currentUserId = req.user.user_id;

    try {
        // Get user ID for the other user
        const otherUserResult = await db.query('SELECT user_id FROM Users WHERE username = $1', [otherUsername]);

        if (otherUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otherUserId = otherUserResult.rows[0].user_id;

        const result = await db.query(`
            SELECT 
                pm.message_id,
                pm.sender_id,
                pm.receiver_id,
                pm.message_text as message,
                pm.created_at as sent_at,
                pm.read_status,
                sender.username as sender_username,
                sender.first_name as sender_first_name,
                sender.last_name as sender_last_name,
                receiver.username as receiver_username,
                receiver.first_name as receiver_first_name,
                receiver.last_name as receiver_last_name
            FROM private_messages pm
            JOIN Users sender ON pm.sender_id = sender.user_id
            JOIN Users receiver ON pm.receiver_id = receiver.user_id
            WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) OR 
                  (pm.sender_id = $2 AND pm.receiver_id = $1)
            ORDER BY pm.created_at ASC
        `, [currentUserId,// Get messages between current user and another user
router.get('/:otherUsername', async (req, res) => {
    const { otherUsername } = req.params;
    const currentUsername = req.user.username;
    const currentUserId = req.user.user_id;

    try {
        // Get user ID for the other user
        const otherUserResult = await db.query('SELECT user_id FROM Users WHERE username = $1', [otherUsername]);

        if (otherUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otherUserId = otherUserResult.rows[0].user_id;

        const result = await db.query(`
            SELECT 
                pm.message_id,
                pm.sender_id,
                pm.receiver_id,
                pm.message_text as message,
                pm.created_at as sent_at,
                pm.read_status,
                sender.username as sender_username,
                sender.first_name as sender_first_name,
                sender.last_name as sender_last_name,
                receiver.username as receiver_username,
                receiver.first_name as receiver_first_name,
                receiver.last_name as receiver_last_name
            FROM private_messages pm
            JOIN Users sender ON pm.sender_id = sender.user_id
            JOIN Users receiver ON pm.receiver_id = receiver.user_id
            WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) OR 
                  (pm.sender_id = $2 AND pm.receiver_id = $1)
            ORDER BY pm.created_at ASC
        `, [currentUserId, otherUserId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: err.message });
    }
});

 otherUserId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: err.message });
    }
});

// Send a message
router.post('/', async (req, res) => {
    const { recipientUsername, message } = req.body;
    const senderUsername = req.user.username;
    const senderId = req.user.user_id;

    if (!recipientUsername || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get recipient user ID
        const recipientResult = await db.query('SELECT user_id FROM Users WHERE username = $1', [recipientUsername]);

        if (recipientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const receiverId = recipientResult.rows[0].user_id;

        const result = await db.query(`
            INSERT INTO private_messages (sender_id, receiver_id, message_text, created_at, read_status) 
            VALUES ($1, $2, $3, NOW(), false) RETURNING *
        `, [senderId, receiverId, message]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark messages as read
router.put('/:otherUsername/mark-read', async (req, res) => {
    const { otherUsername } = req.params;
    const currentUsername = req.user.username;
    const currentUserId = req.user.user_id;

    try {
        // Get other user ID
        const otherUserResult = await db.query('SELECT user_id FROM Users WHERE username = $1', [otherUsername]);

        if (otherUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otherUserId = otherUserResult.rows[0].user_id;

        const result = await db.query(`
            UPDATE private_messages 
            SET read_status = true 
            WHERE receiver_id = $1 AND sender_id = $2 AND read_status = false
            RETURNING *
        `, [currentUserId, otherUserId]);
// Send a message
on(result.rows.map(row => row.batch_year));
    } catch (err) {
        console.error('Error fetching batch years:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark a message as read
router.put('/:messageId/read', async (req, res) => {
    const { messageId } = req.params;
    try {
        const result = await db.query(
            'UPDATE Messages SET read_status = TRUE WHERE id = $1 RETURNING *',
            [messageId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
    const { messageId } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM Messages WHERE id = $1 RETURNING *',
            [messageId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully', deletedMessage: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get unread messages count for a user
router.get('/unread/:userId', async (req, res) => {
    const { userId } = req.params;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await db.query(
            'SELECT COUNT(*) FROM Messages WHERE receiver_id = $1 AND read_status = FALSE',
            [userId]
        );
        res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//Get unread messages between two users
// the count of unread messages that would be shown to user2 from user1
// how many messages of user1 are unread by user2
router.get('/unread/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    if (isNaN(user1) || isNaN(user2)) {
        return res.status(400).json({ error: 'Invalid user ID(s)' });
    }

    try {
        const result = await db.query(
            'SELECT COUNT(*) FROM Messages WHERE sender_id = $1 AND receiver_id = $2 AND read_status = FALSE',
            [user1, user2]
        );
        res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get messages by sender or receiver
// message list of a user
//order by read status and timestamp (if read status is false, show those first) 
router.get('/conversation/user/:userId', async (req, res) => {
    const { userId } = req.params;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await db.query(
            `SELECT * FROM Messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY read_status, timestamp DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get messages by date range
//search messages between a start date and end date
router.get('/date-range', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const result = await db.query(
            'SELECT * FROM Messages WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp',
            [new Date(startDate), new Date(endDate)]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages by content keyword
//search messages that contain a specific keyword in the content between two users
router.get('/search/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    const { keyword } = req.query;

    if (isNaN(user1) || isNaN(user2)) {
        return res.status(400).json({ error: 'Invalid user ID(s)' });
    }
    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    try {
        const result = await db.query(
            `SELECT * FROM Messages WHERE content ILIKE $1 AND 
            (
            (sender_id = $2 AND receiver_id = $3) 
              OR (sender_id = $3 AND receiver_id = $2)
            )   
            ORDER BY timestamp`,
            [`%${keyword}%`, user1, user2]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//update message content add updated at timestamp
router.put('/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { content, updatedAt } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const result = await db.query(
            'UPDATE Messages SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [content, messageId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



export default router;