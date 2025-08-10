// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import jwt from 'jsonwebtoken';


const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  const { username, password, email, first_name, last_name, user_type } = req.body;

  if (!password) return res.status(400).json({ error: 'Password is required' });
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!first_name) return res.status(400).json({ error: 'First name is required' });
  if (!last_name) return res.status(400).json({ error: 'Last name is required' });
  if (!user_type) return res.status(400).json({ error: 'User type is required' });

  if (!['admin', 'teacher', 'student'].includes(user_type))
    return res.status(400).json({ error: 'Invalid user_type' });
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  // password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    });
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  const existingUserQuery = 'SELECT * FROM Users WHERE username = $1';
  const existingUserResult = await pool.query(existingUserQuery, [username]);
  if (existingUserResult.rows.length > 0) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Insert new user into the database
  let user;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, email, first_name, last_name, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, hashedPassword, email, first_name, last_name, user_type]
    );
    user = result.rows[0];
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Add to role-specific table
  const roleTable = {
    admin: 'Admins',
    teacher: 'Teachers',
    student: 'Students',
  }[user_type];

  // Insert into role-specific table
  const roleInsertQuery = `INSERT INTO ${roleTable} (user_id) VALUES ($1)`;
  const roleInsertResult = await pool.query(roleInsertQuery, [user.user_id]);
  if (roleInsertResult.rowCount === 0) {
    return res.status(500).json({ error: 'Failed to assign role' });
  }

  res.status(201).json({ message: 'User registered successfully', user });

});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Get user with student_id if they're a student
    const userQuery = `
      SELECT u.*, s.student_id, t.teacher_id, a.admin_id
      FROM Users u
      LEFT JOIN Students s ON u.user_id = s.user_id
      LEFT JOIN Teachers t ON u.user_id = t.user_id  
      LEFT JOIN Admins a ON u.user_id = a.user_id
      WHERE u.username = $1
    `;
    const userResult = await pool.query(userQuery, [username]);
    const user = userResult.rows[0];

    console.log('User found:', user);
    if (!user || !user.password) {
      console.log('User or password not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // const isMatch = await bcrypt.compare(password, user.password); 
    const isMatch = (password === user.password); 
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue a JWT that includes the user ID
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Optional: Omit password before sending user data back
    delete user.password;

    return res.status(200).json({ message: 'Login successful', user: user, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user ID from the token (assuming middleware sets req.user)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user from database
    const userQuery = 'SELECT * FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = (currentPassword === user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password (note: you should use bcrypt in production)
    // const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // For now, using plain text as the existing code does
    const updateQuery = 'UPDATE Users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2';
    await pool.query(updateQuery, [newPassword, userId]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
