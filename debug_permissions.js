// Debug script to check user permissions for course weeks

import pool from './server/db.js';

async function debugUserPermissions(userId, courseId) {
  try {
    console.log(`Debugging permissions for User ID: ${userId}, Course ID: ${courseId}\n`);
    
    // Check user details
    const userQuery = 'SELECT * FROM "Users" WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User Details:');
    console.log(`   ID: ${user.user_id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Type: ${user.user_type}`);
    console.log(`   Email: ${user.email}`);
    
    // Check if user is a teacher
    if (user.user_type === 'teacher') {
      const teacherQuery = 'SELECT * FROM "Teachers" WHERE user_id = $1';
      const teacherResult = await pool.query(teacherQuery, [userId]);
      
      if (teacherResult.rows.length > 0) {
        const teacher = teacherResult.rows[0];
        console.log('\n🎓 Teacher Details:');
        console.log(`   Teacher ID: ${teacher.teacher_id}`);
        console.log(`   Specialization: ${teacher.specialization || 'Not set'}`);
        
        // Check course assignments
        const courseTeacherQuery = `
          SELECT ct.*, c.course_name, c.course_code 
          FROM "Course_Teachers" ct
          JOIN "Courses" c ON ct.course_id = c.course_id
          WHERE ct.teacher_id = $1
        `;
        const courseTeacherResult = await pool.query(courseTeacherQuery, [teacher.teacher_id]);
        
        console.log('\n📚 Assigned Courses:');
        if (courseTeacherResult.rows.length === 0) {
          console.log('   ❌ No courses assigned');
        } else {
          courseTeacherResult.rows.forEach(assignment => {
            console.log(`   ✅ ${assignment.course_name} (${assignment.course_code}) - ID: ${assignment.course_id}`);
            if (assignment.course_id == courseId) {
              console.log('      🎯 THIS IS THE TARGET COURSE!');
            }
          });
        }
        
        // Check specific course assignment
        const specificCourseQuery = `
          SELECT ct.*, c.course_name, c.course_code 
          FROM "Course_Teachers" ct
          JOIN "Courses" c ON ct.course_id = c.course_id
          WHERE ct.teacher_id = $1 AND ct.course_id = $2
        `;
        const specificResult = await pool.query(specificCourseQuery, [teacher.teacher_id, courseId]);
        
        console.log(`\n🔍 Course ${courseId} Assignment Check:`);
        if (specificResult.rows.length === 0) {
          console.log('   ❌ Teacher is NOT assigned to this course');
        } else {
          console.log('   ✅ Teacher IS assigned to this course');
          console.log(`   Course: ${specificResult.rows[0].course_name}`);
        }
      } else {
        console.log('\n❌ User is marked as teacher but no teacher record found');
      }
    } else if (user.user_type === 'admin') {
      console.log('\n👑 User is an admin - should have access to all courses');
    } else {
      console.log('\n👨‍🎓 User is a student - no course management access');
    }
    
    // Test the exact query used in the API
    console.log('\n🧪 Testing API Permission Query:');
    const apiQuery = `
      SELECT 
        u.user_type,
        CASE 
          WHEN u.user_type = 'admin' THEN true
          WHEN EXISTS (
            SELECT 1 FROM "Course_Teachers" ct 
            JOIN "Teachers" t ON ct.teacher_id = t.teacher_id 
            WHERE ct.course_id = $1 AND t.user_id = $2
          ) THEN true
          ELSE false
        END as has_access
      FROM "Users" u
      WHERE u.user_id = $2
    `;
    
    const apiResult = await pool.query(apiQuery, [courseId, userId]);
    
    if (apiResult.rows.length === 0) {
      console.log('   ❌ API query returned no rows');
    } else {
      const result = apiResult.rows[0];
      console.log(`   User Type: ${result.user_type}`);
      console.log(`   Has Access: ${result.has_access}`);
      
      if (result.has_access) {
        console.log('   ✅ User SHOULD have access');
      } else {
        console.log('   ❌ User does NOT have access');
      }
    }
    
  } catch (error) {
    console.error('Error debugging permissions:', error);
  } finally {
    await pool.end();
  }
}

// Usage example:
const userId = 1; // Replace with actual user ID
const courseId = 2; // Replace with actual course ID

console.log('🔍 Course Weeks Permission Debugger');
console.log('=====================================\n');

debugUserPermissions(userId, courseId);
