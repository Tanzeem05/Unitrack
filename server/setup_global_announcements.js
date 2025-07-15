// Quick setup script for global announcements
import pool from './db.js';
import fs from 'fs';
import path from 'path';

async function setupGlobalAnnouncements() {
    try {
        console.log('🔧 Setting up global announcements system...');
        
        // Check if tables exist
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('global_announcements', 'global_announcement_reads')
        `);
        
        if (tableCheck.rows.length === 2) {
            console.log('✅ Global announcements tables already exist!');
            
            // Test by inserting a sample announcement if none exist
            const countCheck = await pool.query('SELECT COUNT(*) as count FROM global_announcements');
            if (parseInt(countCheck.rows[0].count) === 0) {
                console.log('📝 Adding sample global announcement...');
                await pool.query(`
                    INSERT INTO global_announcements (title, content, priority, target_audience, created_by)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    'Welcome to Unitrack!',
                    'This is a sample global announcement to test the system. Global announcements are visible to all users based on their role.',
                    'normal',
                    'all',
                    1 // Assuming admin user with ID 1 exists
                ]);
                console.log('✅ Sample announcement created!');
            }
            
            console.log('🎉 Global announcements system is ready!');
            return;
        }
        
        console.log('📚 Creating global announcements tables...');
        
        // Read and execute the SQL file
        const sqlFile = path.join(process.cwd(), 'create_global_announcements.sql');
        if (!fs.existsSync(sqlFile)) {
            console.log('❌ SQL file not found:', sqlFile);
            console.log('Please ensure create_global_announcements.sql exists in the server directory');
            return;
        }
        
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
            }
        }
        
        console.log('✅ Global announcements tables created successfully!');
        console.log('🎉 Setup complete! You can now use the global announcements system.');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n🔧 Manual setup instructions:');
        console.log('1. Ensure PostgreSQL is running');
        console.log('2. Run the SQL in create_global_announcements.sql in your database');
        console.log('3. Make sure a user with ID 1 exists in the users table');
    } finally {
        await pool.end();
    }
}

setupGlobalAnnouncements();
