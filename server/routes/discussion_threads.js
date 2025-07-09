import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a discussion thread
//there are thread-id,course_id,created_by,created_at,title in my discussions thread
// then there are post_id,thread_id,user_id,content,replyt_to_post_id,created_at in my discussion posts
router.post('/', async (req, res) => {
    const { course_id, created_by, title } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO discussion_threads (course_id, created_by, title, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [course_id, created_by, title]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all discussions for a course
router.get('/course/:course_id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.*, u.username
             FROM discussion_threads t
             JOIN users u ON t.created_by = u.user_id
             WHERE course_id = $1
             ORDER BY created_at DESC`,
            [req.params.course_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a specific discussion thread by title
router.get('/title/:title', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM discussion_threads
             WHERE title ILIKE $1`,
            [`%${req.params.title}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//delete a discussion thread
router.delete('/:thread_id', async (req, res) => {
    const { thread_id } = req.params;
    try {
        const result = await db.query(
            `DELETE FROM discussion_threads
             WHERE id = $1 RETURNING *`,
            [thread_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Discussion thread not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;