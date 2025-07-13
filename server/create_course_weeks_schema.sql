-- Course weekly schedule and topics schema
-- Add this to your existing database

-- Table to store weekly topics and schedules for courses
CREATE TABLE IF NOT EXISTS course_weeks (
    week_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    topic_title VARCHAR(200),
    topic_description TEXT,
    learning_objectives TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    UNIQUE(course_id, week_number)
);

-- Add week_assigned column to assignments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = assignments 
                   AND column_name = week_assigned) THEN
        ALTER TABLE assignments 
        ADD COLUMN week_assigned INTEGER;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_course_weeks_course_id ON course_weeks(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_week_assigned ON assignments(week_assigned);

-- Insert sample weekly data function (optional - for testing)
CREATE OR REPLACE FUNCTION generate_course_weeks(
    p_course_id INTEGER,
    p_start_date DATE,
    p_end_date DATE,
    p_created_by INTEGER
) RETURNS VOID AS $$
DECLARE
    current_date DATE := p_start_date;
    week_num INTEGER := 1;
    week_end DATE;
BEGIN
    -- Delete existing weeks for this course
    DELETE FROM course_weeks WHERE course_id = p_course_id;
    
    -- Generate weeks
    WHILE current_date <= p_end_date LOOP
        week_end := current_date + INTERVAL '6 days';
        IF week_end > p_end_date THEN
            week_end := p_end_date;
        END IF;
        
        INSERT INTO course_weeks (
            course_id, 
            week_number, 
            start_date, 
            end_date, 
            topic_title,
            created_by
        ) VALUES (
            p_course_id,
            week_num,
            current_date,
            week_end,
            'Week ' || week_num || ' - Topic to be announced',
            p_created_by
        );
        
        current_date := current_date + INTERVAL '7 days';
        week_num := week_num + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
