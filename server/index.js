// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import assignmentRoutes from './routes/assignments.js';
// import messageRoutes from './routes/messages.js';
// import fileRoutes from './routes/files.js';
// import announcementRoutes from './routes/announcements.js';
// import discussionRoutes from './routes/discussions.js';
// import progressRoutes from './routes/progress.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/announcements', announcementRoutes);
// app.use('/api/discussions', discussionRoutes);
// app.use('/api/progress', progressRoutes);

app.get('/', (req, res) => res.send('Course Management Backend Running'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
