-- Verify submission-related tables exist with correct structure

-- Check assignment_submissions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' 
ORDER BY ordinal_position;

-- Check if we need to add any missing columns
DO $$
BEGIN
    -- Add graded_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignment_submissions' 
                   AND column_name = 'graded_by') THEN
        ALTER TABLE assignment_submissions 
        ADD COLUMN graded_by INTEGER REFERENCES users(user_id);
    END IF;
    
    -- Add graded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignment_submissions' 
                   AND column_name = 'graded_at') THEN
        ALTER TABLE assignment_submissions 
        ADD COLUMN graded_at TIMESTAMP;
    END IF;
    
    -- Add feedback column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignment_submissions' 
                   AND column_name = 'feedback') THEN
        ALTER TABLE assignment_submissions 
        ADD COLUMN feedback TEXT;
    END IF;
    
    -- Add points_earned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignment_submissions' 
                   AND column_name = 'points_earned') THEN
        ALTER TABLE assignment_submissions 
        ADD COLUMN points_earned DECIMAL(5,2);
    END IF;
END $$;

-- Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' 
ORDER BY ordinal_position;
