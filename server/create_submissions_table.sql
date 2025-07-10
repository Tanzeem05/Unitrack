-- Create assignment_submissions table if it doesn't exist

-- First, create the assignment_submissions table with all required columns
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment 
ON assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student 
ON assignment_submissions(student_id);

-- Verify the table was created correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' 
ORDER BY ordinal_position;
