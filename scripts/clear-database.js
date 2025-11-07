// Script to clear all users, sessions, and payments from the database
require('dotenv').config();
const { connectDB, User, Session, Payment, Employee } = require('../models');

const clearDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

    // Clear customer data collections (NOT employees - they are static accounts)
    const userResult = await User.deleteMany({});
    const sessionResult = await Session.deleteMany({});
    const paymentResult = await Payment.deleteMany({});
    
    // Verify employees are preserved
    const employeeCount = await Employee.countDocuments({});
    
    console.log(`\n🗑️  Database cleared:`);
    console.log(`   - Users (customers) deleted: ${userResult.deletedCount}`);
    console.log(`   - Sessions deleted: ${sessionResult.deletedCount}`);
    console.log(`   - Payments deleted: ${paymentResult.deletedCount}`);
    console.log(`   - Employees preserved: ${employeeCount} (static accounts)`);
    
    console.log(`\n✅ Database cleared successfully!`);
    console.log(`\n📝 Note: Employee accounts were NOT deleted (they are static accounts)`);
    console.log(`   You can now register a new customer account.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();

