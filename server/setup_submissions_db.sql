-- Complete database setup for assignment submissions
-- Run this script to ensure all required tables exist

-- Create students table if it doesn't exist
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_number VARCHAR(20) UNIQUE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id)
);

-- Create assignment_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignment_submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    file_url TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    points_earned DECIMAL(5,2),
    feedback TEXT,
    graded_by INTEGER REFERENCES users(user_id),
    graded_at TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment 
ON assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student 
ON assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_students_user_id 
ON students(user_id);

-- Insert test student records for existing users if they don't exist
-- This assumes you have users with role 'student'
INSERT INTO students (user_id, student_number)
SELECT u.user_id, CONCAT('STU', LPAD(u.user_id::text, 6, '0'))
FROM users u 
LEFT JOIN students s ON u.user_id = s.user_id
WHERE u.role = 'student' AND s.student_id IS NULL;

-- Verify tables exist and show structure
SELECT 'students table:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT 'assignment_submissions table:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' 
ORDER BY ordinal_position;
