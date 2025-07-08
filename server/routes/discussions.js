import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all discussion threads for a course
router.get('/course/:course_id', async (req, res) => {
  const { course_id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT dt.*, u.first_name || ' ' || u.last_name as creator_name, u.user_type,
              COUNT(dp.post_id) as post_count,
              MAX(dp.created_at) as last_activity
       FROM discussion_threads dt
       LEFT JOIN users u ON dt.created_by = u.user_id
       LEFT JOIN discussion_posts dp ON dt.thread_id = dp.thread_id
       WHERE dt.course_id = $1
       GROUP BY dt.thread_id, dt.course_id, dt.created_by, dt.title, dt.created_at, u.first_name, u.last_name, u.user_type
       ORDER BY COALESCE(MAX(dp.created_at), dt.created_at) DESC`,
      [course_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching discussion threads:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new discussion thread (teachers only)
router.post('/threads', async (req, res) => {
  const { course_id, title, created_by } = req.body;
  
  try {
    // Verify the user is a teacher
    const userCheck = await db.query(
      `SELECT u.user_type FROM users u WHERE u.user_id = $1`,
      [created_by]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create discussion threads' });
    }
    
    const result = await db.query(
      `INSERT INTO discussion_threads (course_id, created_by, title, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [course_id, created_by, title]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating discussion thread:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get posts for a specific thread
router.get('/threads/:thread_id/posts', async (req, res) => {
  const { thread_id } = req.params;
  
  try {
    // First get the thread info
    const threadResult = await db.query(
      `SELECT dt.*, u.first_name || ' ' || u.last_name as creator_name
       FROM discussion_threads dt
       LEFT JOIN users u ON dt.created_by = u.user_id
       WHERE dt.thread_id = $1`,
      [thread_id]
    );
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Get all posts for the thread with user info
    const postsResult = await db.query(
      `SELECT dp.*, u.first_name || ' ' || u.last_name as author_name, u.user_type,
              reply_author.first_name || ' ' || reply_author.last_name as reply_to_author
       FROM discussion_posts dp
       LEFT JOIN users u ON dp.user_id = u.user_id
       LEFT JOIN discussion_posts reply_post ON dp.reply_to_post_id = reply_post.post_id
       LEFT JOIN users reply_author ON reply_post.user_id = reply_author.user_id
       WHERE dp.thread_id = $1
       ORDER BY dp.created_at ASC`,
      [thread_id]
    );
    
    res.json({
      thread: threadResult.rows[0],
      posts: postsResult.rows
    });
  } catch (err) {
    console.error('Error fetching thread posts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new post in a thread
router.post('/threads/:thread_id/posts', async (req, res) => {
  const { thread_id } = req.params;
  const { user_id, content, reply_to_post_id } = req.body;
  
  try {
    // Verify the thread exists
    const threadCheck = await db.query(
      `SELECT thread_id FROM discussion_threads WHERE thread_id = $1`,
      [thread_id]
    );
    
    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // If replying to a post, verify it exists
    if (reply_to_post_id) {
      const replyCheck = await db.query(
        `SELECT post_id FROM discussion_posts WHERE post_id = $1 AND thread_id = $2`,
        [reply_to_post_id, thread_id]
      );
      
      if (replyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Post to reply to not found' });
      }
    }
    
    const result = await db.query(
      `INSERT INTO discussion_posts (thread_id, user_id, content, reply_to_post_id, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [thread_id, user_id, content, reply_to_post_id || null]
    );
    
    // Get the created post with user info
    const postWithUser = await db.query(
      `SELECT dp.*, u.first_name || ' ' || u.last_name as author_name, u.user_type
       FROM discussion_posts dp
       LEFT JOIN users u ON dp.user_id = u.user_id
       WHERE dp.post_id = $1`,
      [result.rows[0].post_id]
    );
    
    res.status(201).json(postWithUser.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a discussion thread (teachers only, and only their own threads)
router.delete('/threads/:thread_id', async (req, res) => {
  const { thread_id } = req.params;
  const { user_id } = req.body;
  
  try {
    // Verify the user is the creator and is a teacher
    const threadCheck = await db.query(
      `SELECT dt.created_by, u.user_type 
       FROM discussion_threads dt
       LEFT JOIN users u ON dt.created_by = u.user_id
       WHERE dt.thread_id = $1`,
      [thread_id]
    );
    
    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const thread = threadCheck.rows[0];
    if (thread.created_by !== parseInt(user_id) || thread.user_type !== 'teacher') {
      return res.status(403).json({ error: 'Only the thread creator can delete it' });
    }
    
    // Delete all posts in the thread first
    await db.query(`DELETE FROM discussion_posts WHERE thread_id = $1`, [thread_id]);
    
    // Delete the thread
    const result = await db.query(
      `DELETE FROM discussion_threads WHERE thread_id = $1 RETURNING *`,
      [thread_id]
    );
    
    res.json({ message: 'Thread deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting thread:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
