// Test script to check existing advisor accounts
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Advisor = require('./backend/models/Advisor');

async function checkAdvisorAccounts() {
  try {
    console.log('🔍 CHECKING EXISTING ADVISOR ACCOUNTS\n');
    
    const advisors = await Advisor.find({}).select('firstName lastName email status createdAt');
    
    if (advisors.length === 0) {
      console.log('❌ No advisor accounts found in database');
      console.log('\n📝 To create a test advisor account:');
      console.log('1. Go to your application registration page');
      console.log('2. Create a new advisor account');
      console.log('3. Use those credentials to login');
    } else {
      console.log(`✅ Found ${advisors.length} advisor account(s):\n`);
      
      advisors.forEach((advisor, index) => {
        console.log(`${index + 1}. ${advisor.firstName} ${advisor.lastName}`);
        console.log(`   Email: ${advisor.email}`);
        console.log(`   Status: ${advisor.status}`);
        console.log(`   Created: ${advisor.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      console.log('🔑 Use any of these email addresses to login');
      console.log('📝 If you don\'t know the password, you may need to reset it or create a new account');
    }
    
  } catch (error) {
    console.error('❌ Error checking advisor accounts:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkAdvisorAccounts();
