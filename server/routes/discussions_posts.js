import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a Post in a Thread
router.post('/', async (req, res) => {
    const { thread_id, user_id, content, reply_to_post_id } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO discussion_posts (thread_id, user_id, content, reply_to_post_id, created_at)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [thread_id, user_id, content, reply_to_post_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all posts in a thread
router.get('/thread/:thread_id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.username
            FROM discussion_posts p
            JOIN users u ON p.user_id = u.user_id
            WHERE thread_id = $1
            ORDER BY p.created_at ASC`,
            [req.params.thread_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Get All Top-Level Posts in a Thread
//example: post
//            ..3 replies
router.get('/thread/:thread_id/top-level', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.username
             FROM discussion_posts p
             JOIN users u ON p.user_id = u.user_id
             WHERE thread_id = $1 AND reply_to_post_id IS NULL
             ORDER BY created_at ASC`,
            [req.params.thread_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Replies to a Post
router.get('/post/:post_id/replies', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.username
             FROM discussion_posts p
             JOIN users u ON p.user_id = u.user_id
             WHERE reply_to_post_id = $1
             ORDER BY created_at ASC`,
            [req.params.post_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//count replies to a post
router.get('/post/:post_id/reply-count', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT COUNT(*) AS reply_count FROM discussion_posts
             WHERE reply_to_post_id = $1`,
            [req.params.post_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a Post
// Ensure users can only update their own posts
router.put('/:post_id', async (req, res) => {
    const { content } = req.body;
    try {
        const result = await db.query(
            `UPDATE discussion_posts
             SET content = $1, updated_at = NOW()
             WHERE post_id = $2 AND user_id = $3 RETURNING *`,
            [content, req.params.post_id, req.user.id] // Assuming req.user.id is the ID of the logged-in user
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found or not authorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a Post
//Again, ensure cascade or soft delete logic if there are replies.
router.delete('/:post_id', async (req, res) => {
    try {
        const result = await db.query(
            `DELETE FROM discussion_posts
             WHERE post_id = $1 AND user_id = $2 RETURNING *`,
            [req.params.post_id, req.user.id] // Assuming req.user.id is the ID of the logged-in user
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found or not authorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;