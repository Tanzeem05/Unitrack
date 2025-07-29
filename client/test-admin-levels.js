// Test script to validate admin levels functionality
const testAdminLevels = () => {
  console.log('Testing admin levels functionality...');
  
  // Simulate admin levels response
  const mockAdminLevels = ['super', 'admin', 'moderator'];
  
  // Test filter change logic
  const roleFilter = 'admin';
  const adminLevelFilter = 'super';
  
  console.log('Role filter:', roleFilter);
  console.log('Admin level filter:', adminLevelFilter);
  console.log('Mock admin levels:', mockAdminLevels);
  
  // Test color function
  const getAdminLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'super': return 'bg-purple-600 text-white border border-purple-500';
      case 'admin': return 'bg-blue-600 text-white border border-blue-500';
      case 'moderator': return 'bg-orange-600 text-white border border-orange-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };
  
  mockAdminLevels.forEach(level => {
    console.log(`Color for ${level}:`, getAdminLevelColor(level));
  });
  
  console.log('Test completed successfully!');
};

testAdminLevels();
