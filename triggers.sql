--when insert a new user, assign them to the appropriate role
CREATE OR REPLACE FUNCTION assign_user_to_role()
RETURNS TRIGGER AS $$
BEGIN
  -- ADMIN role logic
  IF NEW.user_type = 'admin' THEN
    IF EXISTS (SELECT 1 FROM admins WHERE user_id = NEW.user_id) THEN
      UPDATE admins
      SET admin_level = NEW.admin_level
      WHERE user_id = NEW.user_id;
    ELSE
      INSERT INTO admins (user_id, admin_level)
      VALUES (NEW.user_id, NEW.admin_level);
    END IF;

  -- TEACHER role logic
  ELSIF NEW.user_type = 'teacher' THEN
    IF EXISTS (SELECT 1 FROM teachers WHERE user_id = NEW.user_id) THEN
      UPDATE teachers
      SET specialization = NEW.specialization
      WHERE user_id = NEW.user_id;
    ELSE
      INSERT INTO teachers (user_id, specialization)
      VALUES (NEW.user_id, NEW.specialization);
    END IF;

  -- STUDENT role logic
  ELSIF NEW.user_type = 'student' THEN
    IF EXISTS (SELECT 1 FROM students WHERE user_id = NEW.user_id) THEN
      UPDATE students
      SET batch_year = NEW.batch_year
      WHERE user_id = NEW.user_id;
    ELSE
      INSERT INTO students (user_id, batch_year)
      VALUES (NEW.user_id, NEW.batch_year);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
CREATE TRIGGER trg_log_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION log_admin_user_changes();

-- Trigger for UPDATE
CREATE TRIGGER trg_log_user_update
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION log_admin_user_changes();

-- Trigger for DELETE
CREATE TRIGGER trg_log_user_delete
AFTER DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION log_admin_user_changes();



-- Trigger to call the function after inserting,updating or deleting a new user by an admin. Update admin_log
CREATE OR REPLACE FUNCTION log_admin_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  acting_admin_id INTEGER;
  action_desc TEXT;
  admin_id_setting TEXT;
BEGIN
  admin_id_setting := current_setting('app.current_admin_id', true);

  -- If session variable is missing or empty, use fallback admin
  IF admin_id_setting IS NULL OR admin_id_setting = '' THEN
    SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
    IF acting_admin_id IS NULL THEN
      RETURN COALESCE(NEW, OLD); 
    END IF;

  ELSE
    BEGIN
      acting_admin_id := admin_id_setting::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      -- If casting fails, fallback to default admin
      SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
      IF acting_admin_id IS NULL THEN
        RETURN COALESCE(NEW, OLD); -- No admin found, skip logging
      END IF;
    END;
  END IF;

  -- Log actions based on operation type
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

  RETURN NULL; -- AFTER trigger doesn't need to return NEW or OLD
END;
$$ LANGUAGE plpgsql;



--trigger admin_log after course changes
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

  -- Insert into admin_logs based on the trigger operation
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

  RETURN COALESCE(NEW, OLD); -- Always return a row
END;
$$ LANGUAGE plpgsql;

-- After Insert
CREATE TRIGGER trigger_log_course_insert
AFTER INSERT ON courses
FOR EACH ROW
EXECUTE FUNCTION log_admin_course_changes();
-- After Update
CREATE TRIGGER trigger_log_course_update
AFTER UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION log_admin_course_changes();
-- After Delete (optional)
CREATE TRIGGER trigger_log_course_delete
BEFORE DELETE ON courses
FOR EACH ROW
EXECUTE FUNCTION log_admin_course_changes();


--If discussion thread is deleted, delete associated posts
CREATE OR REPLACE FUNCTION delete_posts_of_thread()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM discussion_posts WHERE thread_id = OLD.thread_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_thread_posts
AFTER DELETE ON discussion_threads
FOR EACH ROW
EXECUTE FUNCTION delete_posts_of_thread();



--if a post is deleted, then it's replies should be deleted
CREATE OR REPLACE FUNCTION delete_post_replies()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM discussion_posts WHERE reply_to_post_id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_delete_replies
AFTER DELETE ON discussion_posts
FOR EACH ROW
EXECUTE FUNCTION delete_post_replies();


--For notification
CREATE OR REPLACE FUNCTION log_announcement()
RETURNS TRIGGER AS $$
DECLARE
  msg TEXT;
BEGIN
  msg := 'Announcement "' || NEW.title || '" posted for course ID ' || NEW.course_id;
  RAISE NOTICE '%', msg;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_announcement_notice
AFTER INSERT ON announcements
FOR EACH ROW
EXECUTE FUNCTION log_announcement();


--course delete
DECLARE
  acting_admin_id INTEGER;
  action_desc TEXT;
BEGIN
  BEGIN
    -- Try to get acting admin from session variable
    acting_admin_id := current_setting('app.current_admin_id')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: use first available admin
    SELECT admin_id INTO acting_admin_id FROM admins ORDER BY admin_id LIMIT 1;
    IF acting_admin_id IS NULL THEN
      RAISE NOTICE 'No admin found. Logging skipped.';
      RETURN OLD;
    END IF;
  END;

  -- Prepare course deletion log description
  action_desc := 'Deleted course: ' || OLD.course_code ;

  -- Insert log entry
  INSERT INTO admin_logs (
    admin_id, action_type, description, affected_course_id, created_at
  ) VALUES (
    acting_admin_id, 'DELETE_COURSE', action_desc, OLD.course_id, CURRENT_TIMESTAMP
  );

  RETURN OLD; -- Allow the deletion
END;







