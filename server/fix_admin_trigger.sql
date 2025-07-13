-- Fix the admin course trigger to handle empty strings and null values
CREATE OR REPLACE FUNCTION log_admin_course_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;
