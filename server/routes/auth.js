// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

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
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, email, first_name, last_name, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, hashedPassword, email, first_name, last_name, user_type]
    );
    const user = result.rows[0];
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
  const roleInsertResult = await pool.query(roleInsertQuery, [users.user_id]);
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
    const userQuery = 'SELECT * FROM Users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);
    const user = userResult.rows[0];

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password or username' });
    }

    // Optional: Omit password before sending user data back
    delete user.password;

    return res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
