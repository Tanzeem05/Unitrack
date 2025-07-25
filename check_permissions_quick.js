// Quick permission check script
import pool from './server/db.js';

async function checkPermissions() {
  try {
    console.log('=== DEBUGGING COURSE WEEKS PERMISSIONS ===\n');
    
    // 1. Check all users
    console.log('1. All Users:');
    const users = await pool.query('SELECT user_id, username, user_type FROM "Users" ORDER BY user_id');
    console.table(users.rows);
    
    // 2. Check all teachers
    console.log('\n2. All Teachers:');
    const teachers = await pool.query(`
      SELECT t.teacher_id, t.user_id, u.username, t.specialization 
      FROM "Teachers" t 
      JOIN "Users" u ON t.user_id = u.user_id
    `);
    console.table(teachers.rows);
    
    // 3. Check all courses
    console.log('\n3. All Courses:');
    const courses = await pool.query('SELECT course_id, course_code, course_name FROM "Courses" ORDER BY course_id');
    console.table(courses.rows);
    
    // 4. Check course-teacher assignments
    console.log('\n4. Course-Teacher Assignments:');
    const assignments = await pool.query(`
      SELECT ct.course_id, ct.teacher_id, c.course_name, u.username as teacher_name
      FROM "Course_Teachers" ct
      JOIN "Courses" c ON ct.course_id = c.course_id
      JOIN "Teachers" t ON ct.teacher_id = t.teacher_id
      JOIN "Users" u ON t.user_id = u.user_id
      ORDER BY ct.course_id
    `);
    console.table(assignments.rows);
    
    // 5. Test the permission check for course 2
    console.log('\n5. Testing Permission Check for Course 2:');
    const permissionTest = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.user_type,
        CASE 
          WHEN u.user_type = 'admin' THEN true
          WHEN EXISTS (
            SELECT 1 FROM "Course_Teachers" ct 
            JOIN "Teachers" t ON ct.teacher_id = t.teacher_id 
            WHERE ct.course_id = $1 AND t.user_id = u.user_id
          ) THEN true
          ELSE false
        END as has_access
      FROM "Users" u
      ORDER BY u.user_id
    `, [2]);
    console.table(permissionTest.rows);
    
    // 6. Suggest fixes
    console.log('\n=== SUGGESTED FIXES ===');
    
    // Find users who might need teacher records
    const usersWithoutTeachers = await pool.query(`
      SELECT u.user_id, u.username 
      FROM "Users" u 
      LEFT JOIN "Teachers" t ON u.user_id = t.user_id 
      WHERE u.user_type = 'teacher' AND t.teacher_id IS NULL
    `);
    
    if (usersWithoutTeachers.rows.length > 0) {
      console.log('\nUsers marked as teachers but missing teacher records:');
      usersWithoutTeachers.rows.forEach(user => {
        console.log(`- User ${user.user_id} (${user.username}): Run this SQL to fix:`);
        console.log(`  INSERT INTO "Teachers" (user_id) VALUES (${user.user_id});`);
      });
    }
    
    // Check if any teachers are not assigned to course 2
    const unassignedTeachers = await pool.query(`
      SELECT t.teacher_id, u.username 
      FROM "Teachers" t 
      JOIN "Users" u ON t.user_id = u.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM "Course_Teachers" ct 
        WHERE ct.teacher_id = t.teacher_id AND ct.course_id = 2
      )
    `);
    
    if (unassignedTeachers.rows.length > 0) {
      console.log('\nTeachers not assigned to Course 2:');
      unassignedTeachers.rows.forEach(teacher => {
        console.log(`- Teacher ${teacher.teacher_id} (${teacher.username}): Run this SQL to assign:`);
        console.log(`  INSERT INTO "Course_Teachers" (course_id, teacher_id) VALUES (2, ${teacher.teacher_id});`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPermissions();
