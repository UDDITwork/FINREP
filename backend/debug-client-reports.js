/**
 * Debug script to check client reports data fetching
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function debugClientReports() {
  try {
    console.log('🔍 Debugging Client Reports Data...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const Client = require('./models/Client');
    const Advisor = require('./models/Advisor');
    const Vault = require('./models/Vault');
    
    // Check all advisors
    console.log('1️⃣ Checking all advisors:');
    const advisors = await Advisor.find({}).select('_id firstName lastName email');
    console.log(`   Found ${advisors.length} advisors:`);
    advisors.forEach(advisor => {
      console.log(`   - ${advisor.firstName} ${advisor.lastName} (${advisor.email}) - ID: ${advisor._id}`);
    });
    console.log('');
    
    // Check all clients
    console.log('2️⃣ Checking all clients:');
    const allClients = await Client.find({}).select('_id firstName lastName email advisor status');
    console.log(`   Found ${allClients.length} total clients:`);
    allClients.forEach(client => {
      console.log(`   - ${client.firstName} ${client.lastName} (${client.email})`);
      console.log(`     Advisor ID: ${client.advisor}`);
      console.log(`     Status: ${client.status}`);
      console.log('');
    });
    
    // Check specific advisor (UDDIT UDDIT)
    console.log('3️⃣ Checking UDDIT UDDIT specifically:');
    const udditAdvisor = await Advisor.findOne({ email: 'udditalerts247@gmail.com' });
    if (udditAdvisor) {
      console.log(`   ✅ Found UDDIT UDDIT advisor: ${udditAdvisor._id}`);
      
      // Check clients for this advisor
      const udditClients = await Client.find({ advisor: udditAdvisor._id });
      console.log(`   📊 UDDIT UDDIT has ${udditClients.length} clients:`);
      udditClients.forEach(client => {
        console.log(`     - ${client.firstName} ${client.lastName} (${client.email}) - Status: ${client.status}`);
      });
      
      // Check if there are any clients with different advisor ID format
      console.log(`   🔍 Checking for clients with advisor ID as string: ${udditAdvisor._id.toString()}`);
      const stringAdvisorClients = await Client.find({ advisor: udditAdvisor._id.toString() });
      console.log(`   📊 Found ${stringAdvisorClients.length} clients with string advisor ID`);
      
      // Check if there are any clients with ObjectId
      const objectIdAdvisorClients = await Client.find({ advisor: udditAdvisor._id });
      console.log(`   📊 Found ${objectIdAdvisorClients.length} clients with ObjectId advisor ID`);
      
    } else {
      console.log('   ❌ UDDIT UDDIT advisor not found');
    }
    
    // Check Client model schema
    console.log('\n4️⃣ Checking Client model schema:');
    const clientSchema = Client.schema.obj;
    console.log(`   Advisor field type: ${clientSchema.advisor.type}`);
    console.log(`   Advisor field ref: ${clientSchema.advisor.ref}`);
    
    // Check for any clients without advisor
    console.log('\n5️⃣ Checking for orphaned clients:');
    const orphanedClients = await Client.find({ advisor: { $exists: false } });
    console.log(`   Found ${orphanedClients.length} clients without advisor field`);
    
    const nullAdvisorClients = await Client.find({ advisor: null });
    console.log(`   Found ${nullAdvisorClients.length} clients with null advisor`);
    
    const emptyAdvisorClients = await Client.find({ advisor: '' });
    console.log(`   Found ${emptyAdvisorClients.length} clients with empty string advisor`);
    
    console.log('\n🎯 SUMMARY:');
    console.log(`   Total Advisors: ${advisors.length}`);
    console.log(`   Total Clients: ${allClients.length}`);
    console.log(`   UDDIT UDDIT Clients: ${udditAdvisor ? await Client.countDocuments({ advisor: udditAdvisor._id }) : 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

debugClientReports();
