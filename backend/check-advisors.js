/**
 * Check existing advisors in the database
 */

const mongoose = require('mongoose');
const Advisor = require('./models/Advisor');
require('dotenv').config();

async function checkAdvisors() {
  try {
    console.log('🔍 Checking advisors in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all advisors
    const advisors = await Advisor.find({}, 'email firstName lastName status');
    
    console.log(`📊 Found ${advisors.length} advisor(s) in database:`);
    
    if (advisors.length === 0) {
      console.log('❌ No advisors found. You need to create an advisor account first.');
      console.log('💡 Try registering a new advisor account through the signup page.');
    } else {
      advisors.forEach((advisor, index) => {
        console.log(`${index + 1}. ${advisor.firstName} ${advisor.lastName} (${advisor.email}) - Status: ${advisor.status}`);
      });
      
      // Use the first advisor's email for testing
      const testEmail = advisors[0].email;
      console.log(`\n🧪 You can test password reset with email: ${testEmail}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAdvisors();
