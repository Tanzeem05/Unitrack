// server/routes/resources.js
import express from 'express';
import multer from 'multer';
import db from '../db.js';
import * as fileHelper from '../utils/file.js'; 
const router = express.Router();

// use memory storage since we'll upload to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// Upload a file to Supabase and insert into DB
router.post('/:course_id/upload', upload.single('file'), async (req, res) => {
  const { course_id } = req.params;
  const { user_id, title } = req.body;
  const file = req.file;

  try {
    const { publicUrl, uniqueFileName } = await fileHelper.uploadToBucket(file);

    const result = await db.query(
      `INSERT INTO files (file_name, file_path, file_type, file_size, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [title || file.originalname, publicUrl, file.mimetype, file.size, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Get all files of a course
router.get('/:course_id', async (req, res) => {
  const { course_id } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM files WHERE course_id = $1 AND is_deleted = false`,
      [course_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources', details: err.message });
  }
});

// Redirect to Supabase public URL to download
router.get('/download/:file_id', async (req, res) => {
  const { file_id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM files WHERE file_id = $1`, [file_id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'File not found' });

    res.redirect(result.rows[0].file_path);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

// Delete file from Supabase and DB
router.delete('/:file_id', async (req, res) => {
  const { file_id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM files WHERE file_id = $1`, [file_id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'File not found' });

    const filePath = result.rows[0].file_path;
    await fileHelper.deleteFromBucket(filePath);

    await db.query(`UPDATE files SET is_deleted = true WHERE file_id = $1`, [file_id]);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
});

export default router;
