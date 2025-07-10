-- Create resource_threads table
CREATE TABLE IF NOT EXISTS resource_threads (
    thread_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create resource_files table
CREATE TABLE IF NOT EXISTS resource_files (
    file_id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES resource_threads(thread_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    description TEXT NOT NULL, -- Description is required when file is uploaded
    uploaded_by INTEGER NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_threads_course_id ON resource_threads(course_id);
CREATE INDEX IF NOT EXISTS idx_resource_threads_created_by ON resource_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_resource_files_thread_id ON resource_files(thread_id);
CREATE INDEX IF NOT EXISTS idx_resource_files_uploaded_by ON resource_files(uploaded_by);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resource_threads_updated_at 
    BEFORE UPDATE ON resource_threads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
