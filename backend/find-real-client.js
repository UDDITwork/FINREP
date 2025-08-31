/**
 * Find real client and advisor IDs from the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');
const Advisor = require('./models/Advisor');

async function findRealClient() {
  console.log('🔍 Finding real client and advisor IDs...\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all advisors
    console.log('\n👥 Finding advisors...');
    const advisors = await Advisor.find({}).limit(5).lean();
    console.log(`Found ${advisors.length} advisors:`);
    advisors.forEach((advisor, index) => {
      console.log(`${index + 1}. ID: ${advisor._id}, Name: ${advisor.name || 'N/A'}, Email: ${advisor.email || 'N/A'}`);
    });
    
    if (advisors.length > 0) {
      const firstAdvisor = advisors[0];
      console.log(`\n🔍 Finding clients for advisor: ${firstAdvisor._id}`);
      
      // Find clients for the first advisor
      const clients = await Client.find({ advisor: firstAdvisor._id }).limit(5).lean();
      console.log(`Found ${clients.length} clients for this advisor:`);
      
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ID: ${client._id}, Name: ${client.firstName} ${client.lastName}, Email: ${client.email || 'N/A'}`);
      });
      
      if (clients.length > 0) {
        console.log('\n✅ Test with real IDs:');
        console.log(`Advisor ID: ${firstAdvisor._id}`);
        console.log(`Client ID: ${clients[0]._id}`);
        console.log(`\nYou can test with:`);
        console.log(`POST http://localhost:5000/api/tax-planning/client/${clients[0]._id}/ai-recommendations`);
      } else {
        console.log('\n❌ No clients found for this advisor');
      }
    } else {
      console.log('\n❌ No advisors found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

findRealClient().then(() => {
  console.log('\n🏁 Search completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Search failed:', error);
  process.exit(1);
});
