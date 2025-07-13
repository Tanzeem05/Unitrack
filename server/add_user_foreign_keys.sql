-- Add two columns to users table with foreign key references to users table
-- This allows users to reference other users (e.g., created_by, updated_by, manager_id, mentor_id, etc.)

-- First, add the columns (allowing NULL initially)
ALTER TABLE users 
ADD COLUMN created_by INTEGER,
ADD COLUMN updated_by INTEGER;

-- Add foreign key constraints
ALTER TABLE users 
ADD CONSTRAINT fk_users_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE users 
ADD CONSTRAINT fk_users_updated_by 
FOREIGN KEY (updated_by) REFERENCES users(user_id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional: Add indexes for better performance
CREATE INDEX idx_users_created_by ON users(created_by);
CREATE INDEX idx_users_updated_by ON users(updated_by);

-- Optional: Set default values for existing records (if needed)
-- This would set all existing records to be created/updated by the first admin user
-- UPDATE users SET created_by = (SELECT user_id FROM users WHERE user_type = 'admin' ORDER BY user_id LIMIT 1) WHERE created_by IS NULL;
-- UPDATE users SET updated_by = (SELECT user_id FROM users WHERE user_type = 'admin' ORDER BY user_id LIMIT 1) WHERE updated_by IS NULL;

-- Alternative example with different column names (uncomment if preferred):
-- ALTER TABLE users 
-- ADD COLUMN manager_id INTEGER,
-- ADD COLUMN mentor_id INTEGER;

-- ALTER TABLE users 
-- ADD CONSTRAINT fk_users_manager 
-- FOREIGN KEY (manager_id) REFERENCES users(user_id) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE users 
-- ADD CONSTRAINT fk_users_mentor 
-- FOREIGN KEY (mentor_id) REFERENCES users(user_id) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- CREATE INDEX idx_users_manager_id ON users(manager_id);
-- CREATE INDEX idx_users_mentor_id ON users(mentor_id);








DECLARE
  acting_admin_id INTEGER;
  action_desc TEXT;
  admin_id_setting TEXT;
BEGIN
  -- Get admin ID from session variable with better error handling
  admin_id_setting := current_setting('app.current_admin_id', true);
  
  -- Handle empty string, null, or invalid values
  IF admin_id_setting IS NULL OR admin_id_setting = '' THEN
    -- Try to get the first available admin as fallback
    SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
    
    -- If still no admin found, skip logging
    IF acting_admin_id IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSE
    -- Try to cast to integer, use fallback if it fails
    BEGIN
      acting_admin_id := admin_id_setting::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback to first available admin
      SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
      IF acting_admin_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    action_desc := 'Created course: ' || NEW.course_name;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_course_id, created_at
    ) VALUES (
      acting_admin_id, 'CREATE_COURSE', action_desc, NEW.course_id, CURRENT_TIMESTAMP
    );

  ELSIF TG_OP = 'UPDATE' THEN
    action_desc := 'Updated course: ' || NEW.course_name;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_course_id, created_at
    ) VALUES (
      acting_admin_id, 'UPDATE_COURSE', action_desc, NEW.course_id, CURRENT_TIMESTAMP
    );

  ELSIF TG_OP = 'DELETE' THEN
    action_desc := 'Deleted course: ' || OLD.course_name;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_course_id, created_at
    ) VALUES (
      acting_admin_id, 'DELETE_COURSE', action_desc, OLD.course_id, CURRENT_TIMESTAMP
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;


-------
DECLARE
  acting_admin_id INTEGER;
  action_desc TEXT;
  admin_id_setting TEXT;
BEGIN
  -- Get admin ID from session variable
 admin_id_setting := current_setting('app.current_admin_id', true);

 IF admin_id_setting IS NULL OR admin_id_setting = '' THEN
    -- Try to get the first available admin as fallback
    SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
    
    -- If still no admin found, skip logging
    IF acting_admin_id IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSE

  -- Try to cast to integer, use fallback if it fails
    BEGIN
      acting_admin_id := admin_id_setting::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback to first available admin
      SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
      IF acting_admin_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    action_desc := 'Created user: ' || NEW.username;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_user_id, created_at
    ) VALUES (
      acting_admin_id, 'CREATE_USER', action_desc, NEW.user_id, CURRENT_TIMESTAMP
    );

  ELSIF TG_OP = 'UPDATE' THEN
    action_desc := 'Updated user: ' || NEW.username;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_user_id, created_at
    ) VALUES (
      acting_admin_id, 'UPDATE_USER', action_desc, NEW.user_id, CURRENT_TIMESTAMP
    );

  ELSIF TG_OP = 'DELETE' THEN
    action_desc := 'Deleted user: ' || OLD.username;
    INSERT INTO admin_logs (
      admin_id, action_type, description, affected_user_id, created_at
    ) VALUES (
      acting_admin_id, 'DELETE_USER', action_desc, OLD.user_id, CURRENT_TIMESTAMP
    );
  END IF;

  RETURN NULL; -- AFTER trigger doesn’t need return value
END;

