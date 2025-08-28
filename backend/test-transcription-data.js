const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// Import the Meeting model
const Meeting = require('./models/Meeting');

async function testTranscriptionData() {
  try {
    console.log('🔍 Testing transcription data access...\n');
    
    // Test 1: Check if Meeting model loads
    console.log('1️⃣ Meeting model loaded successfully');
    
    // Test 2: Find meetings with transcriptions
    const meetingsWithTranscripts = await Meeting.find({
      'transcript.transcriptId': { $exists: true, $ne: null }
    }).limit(5);
    
    console.log('2️⃣ Found meetings with transcriptions:', meetingsWithTranscripts.length);
    
    if (meetingsWithTranscripts.length > 0) {
      const meeting = meetingsWithTranscripts[0];
      console.log('3️⃣ Sample meeting data:');
      console.log('   - Meeting ID:', meeting._id);
      console.log('   - Room Name:', meeting.roomName);
      console.log('   - Transcript ID:', meeting.transcript?.transcriptId);
      console.log('   - VTT URL:', meeting.transcript?.vttFileUrl ? 'YES' : 'NO');
      console.log('   - Transcript Status:', meeting.transcript?.status);
      console.log('   - Has Parsed Data:', !!meeting.transcript?.parsedTranscript);
    }
    
    // Test 3: Check specific advisor transcriptions
    const advisorId = '6883ec3e2cc2c6df98e40604'; // From your logs
    const advisorMeetings = await Meeting.find({
      advisorId,
      'transcript.transcriptId': { $exists: true, $ne: null }
    }).limit(3);
    
    console.log('\n4️⃣ Advisor transcriptions found:', advisorMeetings.length);
    
    advisorMeetings.forEach((meeting, index) => {
      console.log(`   Meeting ${index + 1}:`);
      console.log('     - ID:', meeting._id);
      console.log('     - Room:', meeting.roomName);
      console.log('     - Transcript ID:', meeting.transcript?.transcriptId);
      console.log('     - VTT URL:', meeting.transcript?.vttFileUrl ? 'AVAILABLE' : 'MISSING');
      console.log('     - Status:', meeting.transcript?.status);
    });
    
    console.log('\n✅ Transcription data test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTranscriptionData();
