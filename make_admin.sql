-- FASTEST FIX: Make your user an admin
-- Replace YOUR_USER_ID with your actual user ID

-- Method 1: Update existing user to admin
UPDATE "Users" SET user_type = 'admin' WHERE user_id = YOUR_USER_ID;

-- Method 2: Create admin record
INSERT INTO "Admins" (user_id, admin_level) 
VALUES (YOUR_USER_ID, 'standard') 
ON CONFLICT (user_id) DO NOTHING;
