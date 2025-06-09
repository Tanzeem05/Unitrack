// server/routes/messages.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// Send a message
router.post('/', async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;

    // Validate Required Fields
    if (!sender_id || !receiver_id || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.query(
            'INSERT INTO Messages (sender_id, receiver_id, content, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [sender_id, receiver_id, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages between two users
router.get('/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    if (isNaN(user1) || isNaN(user2)) {
        return res.status(400).json({ error: 'Invalid user ID(s)' });
    }

    try {
        const result = await db.query(
            `SELECT * FROM Messages WHERE 
        (sender_id = $1 AND receiver_id = $2) OR 
        (sender_id = $2 AND receiver_id = $1)
        ORDER BY timestamp asc`,
            [user1, user2]
        );
        res.json(result.rows);
    } catch (err) {
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