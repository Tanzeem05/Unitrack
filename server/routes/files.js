// server/routes/files.js
import express from 'express';
import multer from 'multer';
import db from '../db.js';
import * as fileHelper from '../utils/file.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for Supabase

// Upload file to Supabase + insert metadata into DB
router.post('/upload/:course_id', upload.single('file'), async (req, res) => {
  const { course_id } = req.params;
  const { uploaded_by, file_name } = req.body;
  const file = req.file;

  try {
    const { publicUrl } = await fileHelper.uploadToBucket(file);

    const result = await db.query(
      `INSERT INTO files (file_name, file_path, file_type, file_size, uploaded_by, uploaded_at, course_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING *`,
      [file_name || file.originalname, publicUrl, file.mimetype, file.size, uploaded_by, course_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Get all files for a course
router.get('/course/:course_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM files WHERE course_id = $1 AND is_deleted = false',
      [req.params.course_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download: redirect to public Supabase file URL
router.get('/download/:file_id', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM files WHERE file_id = $1`, [req.params.file_id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'File not found' });

    res.redirect(result.rows[0].file_path);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

// Delete file from Supabase and mark as deleted in DB
router.delete('/:file_id', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM files WHERE file_id = $1`, [req.params.file_id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'File not found' });

    const filePath = result.rows[0].file_path;
    await fileHelper.deleteFromBucket(filePath);

    await db.query(`UPDATE files SET is_deleted = true WHERE file_id = $1`, [req.params.file_id]);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
});

export default router;
