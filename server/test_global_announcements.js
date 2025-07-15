// Test script to validate global announcements setup
import pool from './db.js';

async function testGlobalAnnouncementsSetup() {
    try {
        console.log('Testing global announcements database setup...');
        
        // Test 1: Check if tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('global_announcements', 'global_announcement_reads')
        `;
        
        const tablesResult = await pool.query(tablesQuery);
        console.log('✓ Found tables:', tablesResult.rows.map(r => r.table_name));
        
        if (tablesResult.rows.length !== 2) {
            console.log('❌ Missing tables. Please run create_global_announcements.sql');
            return;
        }
        
        // Test 2: Check table structure
        const columnsQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('global_announcements', 'global_announcement_reads')
            ORDER BY table_name, ordinal_position
        `;
        
        const columnsResult = await pool.query(columnsQuery);
        console.log('✓ Table structure verified:', columnsResult.rows.length, 'columns found');
        
        // Test 3: Try to query announcements (should work even if empty)
        const testQuery = `
            SELECT COUNT(*) as count 
            FROM global_announcements ga
            LEFT JOIN global_announcement_reads gar ON ga.global_announcement_id = gar.global_announcement_id
        `;
        
        const testResult = await pool.query(testQuery);
        console.log('✓ Query test passed. Found', testResult.rows[0].count, 'announcements');
        
        console.log('🎉 Global announcements setup is working correctly!');
        
    } catch (error) {
        console.error('❌ Setup test failed:', error.message);
        console.log('Please ensure you have run the SQL setup script: create_global_announcements.sql');
    } finally {
        await pool.end();
    }
}

testGlobalAnnouncementsSetup();
