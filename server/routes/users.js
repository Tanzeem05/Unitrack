import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Register a user
router.post('/register', async (req, res) => {
    const { username,
        password,
        email,
        phone,
        first_name,
        last_name,
        user_type,
        admin_level,
        specialization,
        batch_year
    } = req.body;

    //check if all required fields are provided
    if (!username || !password || !email || !first_name || !last_name || !user_type) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { username: existingUsername } = req.body;
    const existingUserQuery = 'SELECT * FROM users WHERE username = $1';
    const existingUserResult = await pool.query(existingUserQuery, [existingUsername]);
    if (existingUserResult.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate role-specific fields
    if (user_type === 'admin' && !admin_level) {
        return res.status(400).json({ error: 'Admin level is required' });
    }
    if (user_type === 'teacher' && !specialization) {
        return res.status(400).json({ error: 'Specialization is required' });
    }
    if (user_type === 'student' && !batch_year) {
        return res.status(400).json({ error: 'Batch year is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    try {
        //start transaction
        await pool.query('BEGIN');

        const result = await pool.query(
            `INSERT INTO users (username, password, email, phone, first_name, last_name, user_type, admin_level, specialization, batch_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [username, hashedPassword, email, phone, first_name, last_name, user_type, admin_level, specialization, batch_year]
        );

        //commit transaction
        await pool.query('COMMIT');

        // If the query was successful, return the new user
        res.status(201).json(
            {
                message: 'User registered', user: result.rows[0]
            }
        );
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        username,
        password,
        email,
        phone,
        first_name,
        last_name,
        user_type,
        admin_level,
        specialization,
        batch_year
    } = req.body;

    if (!email || !first_name || !last_name) {
        return res.status(400).json({ error: 'Email, first name, and last name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone number format if provided
    if (phone && phone.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
    }

    // Prevent duplicate email
    const emailCheck = await pool.query(
        'SELECT u.user_id FROM users u JOIN students s ON u.user_id = s.user_id WHERE u.email = $1 AND s.student_id <> $2',
        [email, id]
    );
    if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already in use by another user.' });
    }

    try {
        // Check if user exists first
        const userExists = await pool.query('SELECT u.*, s.student_id FROM users u JOIN students s ON u.user_id = s.user_id WHERE s.student_id = $1', [id]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingUser = userExists.rows[0];

        // Get the user_id for the update
        const userIdResult = await pool.query('SELECT u.user_id FROM users u JOIN students s ON u.user_id = s.user_id WHERE s.student_id = $1', [id]);
        const userId = userIdResult.rows[0].user_id;
        
        const result = await pool.query(
            `UPDATE users 
             SET email = $1, phone = $2, first_name = $3, last_name = $4, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $5
             RETURNING *`,
            [
                email,
                phone || existingUser.phone,
                first_name,
                last_name,
                userId
            ]
        );

        // Remove password from response
        const updatedUser = result.rows[0];
        delete updatedUser.password;

        res.json({ message: 'User profile updated successfully', user: updatedUser });
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    //delete user from the database
    try {
        const result = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a user by username with student info
router.get('/username/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const result = await pool.query(`
            SELECT u.*, s.student_id 
            FROM Users u
            LEFT JOIN Students s ON u.user_id = s.user_id
            WHERE u.username = $1
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;





// // Get a user by any attribute
// router.get('/search', async (req, res) => {
//     const { key, value } = req.query;

//     // Whitelist of allowed fields to prevent SQL injection
//     const allowedFields = ['user_id', 'username', 'email', 'first_name', 'last_name', 'user_type'];

//     if (!allowedFields.includes(key)) {
//         return res.status(400).json({ error: 'Invalid search key' });
//     }

//     try {
//         const query = `SELECT * FROM users WHERE ${key} = $1`;
//         const result = await pool.query(query, [value]);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         res.json(result.rows);
//     } catch (err) {
//         console.error('DB error:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
