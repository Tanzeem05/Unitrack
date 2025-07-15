-- Create Global Announcements Table
-- This is separate from course announcements and is for admin-to-all communications

CREATE TABLE global_announcements (
    global_announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'admins')),
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NULL, -- Optional expiration date
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX idx_global_announcements_active ON global_announcements(is_active);
CREATE INDEX idx_global_announcements_target ON global_announcements(target_audience);
CREATE INDEX idx_global_announcements_created_at ON global_announcements(created_at);
CREATE INDEX idx_global_announcements_priority ON global_announcements(priority);

-- Create table to track which users have read which global announcements
CREATE TABLE global_announcement_reads (
    read_id SERIAL PRIMARY KEY,
    global_announcement_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (global_announcement_id) REFERENCES global_announcements(global_announcement_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(global_announcement_id, user_id)
);

-- Create index for read tracking
CREATE INDEX idx_global_announcement_reads_user ON global_announcement_reads(user_id);
CREATE INDEX idx_global_announcement_reads_announcement ON global_announcement_reads(global_announcement_id);

-- Insert some sample global announcements (optional)
INSERT INTO global_announcements (title, content, priority, target_audience, created_by) VALUES
('Welcome to the New Academic Year', 'We are excited to welcome all students and faculty to the new academic year. Please review the updated policies and procedures.', 'high', 'all', 1),
('System Maintenance Notice', 'The learning management system will undergo maintenance on Sunday from 2 AM to 6 AM. Please plan accordingly.', 'normal', 'all', 1),
('Faculty Meeting Reminder', 'All faculty members are reminded about the monthly meeting scheduled for Friday at 3 PM in the main conference room.', 'normal', 'teachers', 1),
('Student Registration Deadline', 'The deadline for course registration is approaching. Please ensure you complete your registration by the end of this week.', 'urgent', 'students', 1);
