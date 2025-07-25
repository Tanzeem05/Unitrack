-- QUICK FIX SQL COMMANDS FOR COURSE WEEKS PERMISSION ISSUE
-- Replace USER_ID with your actual user ID from localStorage token

-- Step 1: Check current users and find your user ID
SELECT user_id, username, user_type FROM "Users";

-- Step 2: Make sure you have a teacher record (replace USER_ID with your actual user ID)
INSERT INTO "Teachers" (user_id, specialization) 
VALUES (YOUR_USER_ID, 'Computer Science') 
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Assign yourself as teacher to course 2
INSERT INTO "Course_Teachers" (course_id, teacher_id)
SELECT 2, t.teacher_id 
FROM "Teachers" t 
WHERE t.user_id = YOUR_USER_ID
ON CONFLICT (course_id, teacher_id) DO NOTHING;

-- Step 4: Verify the assignment worked
SELECT 
    ct.course_id, 
    c.course_name, 
    u.username as teacher_name,
    u.user_type
FROM "Course_Teachers" ct
JOIN "Courses" c ON ct.course_id = c.course_id
JOIN "Teachers" t ON ct.teacher_id = t.teacher_id
JOIN "Users" u ON t.user_id = u.user_id
WHERE ct.course_id = 2;

-- Step 5: Test the permission check (replace USER_ID)
SELECT 
    u.user_type,
    CASE 
        WHEN u.user_type = 'admin' THEN true
        WHEN EXISTS (
            SELECT 1 FROM "Course_Teachers" ct 
            JOIN "Teachers" t ON ct.teacher_id = t.teacher_id 
            WHERE ct.course_id = 2 AND t.user_id = YOUR_USER_ID
        ) THEN true
        ELSE false
    END as has_access
FROM "Users" u
WHERE u.user_id = YOUR_USER_ID;
