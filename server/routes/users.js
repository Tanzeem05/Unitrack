import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Register a user
router.post('/register', async (req, res) => {
    const { username,
        password,
        email,
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
            `INSERT INTO users (username, password, email, first_name, last_name, user_type, admin_level, specialization, batch_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [username, hashedPassword, email, first_name, last_name, user_type, admin_level, specialization, batch_year]
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


router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        username,
        password,
        email,
        first_name,
        last_name,
        user_type,
        admin_level,
        specialization,
        batch_year
    } = req.body;

    if (!username || !email || !first_name || !last_name || !user_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent duplicate email
    const emailCheck = await pool.query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id <> $2',
        [email, id]
    );
    if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already in use by another user.' });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
             SET username = $1, password = $2, email = $3, first_name = $4, 
                 last_name = $5, user_type = $6, admin_level = $7, 
                 specialization = $8, batch_year = $9
             WHERE user_id = $10
             RETURNING *`,
            [
                username, password, email, first_name, last_name, user_type,
                admin_level || null,
                specialization || null,
                batch_year || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated', user: result.rows[0] });
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
