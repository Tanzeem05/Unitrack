// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user information from database
    const userQuery = 'SELECT username, user_id, first_name, last_name, user_type FROM Users WHERE user_id = $1';
    const result = await pool.query(userQuery, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    } else {
      return res.status(500).json({ error: 'Authentication error' });
    }
  }
};
