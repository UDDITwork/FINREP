// Debug script to check meeting and transcription matching
// Run with: node debug-meeting-matching.js

const mongoose = require('mongoose');
const Meeting = require('./backend/models/Meeting');
const Transcription = require('./backend/models/Transcription');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugMeetingMatching() {
  try {
    console.log('🔍 Debugging Meeting and Transcription Matching...\n');

    // Check meetings
    console.log('📋 MEETINGS IN DATABASE:');
    const meetings = await Meeting.find({}).select('roomName dailyRoomId dailyMtgSessionId scheduledAt createdAt _id').sort({createdAt: -1}).limit(10);
    
    if (meetings.length === 0) {
      console.log('❌ No meetings found in database!');
    } else {
      console.log(`✅ Found ${meetings.length} meetings:`);
      meetings.forEach((meeting, index) => {
        console.log(`  ${index + 1}. Meeting ID: ${meeting._id}`);
        console.log(`     Room Name: "${meeting.roomName}"`);
        console.log(`     Daily Room ID: "${meeting.dailyRoomId}"`);
        console.log(`     Daily Session ID: "${meeting.dailyMtgSessionId || 'null'}"`);
        console.log(`     Scheduled: ${meeting.scheduledAt}`);
        console.log(`     Created: ${meeting.createdAt}`);
        console.log('');
      });
    }

    // Check transcriptions
    console.log('📄 TRANSCRIPTIONS IN DATABASE:');
    const transcriptions = await Transcription.find({}).select('transcriptId dailyRoomId meetingId status createdAt _id').sort({createdAt: -1}).limit(10);
    
    if (transcriptions.length === 0) {
      console.log('❌ No transcriptions found in database!');
    } else {
      console.log(`✅ Found ${transcriptions.length} transcriptions:`);
      transcriptions.forEach((transcription, index) => {
        console.log(`  ${index + 1}. Transcription ID: ${transcription._id}`);
        console.log(`     Daily Transcript ID: "${transcription.transcriptId}"`);
        console.log(`     Daily Room ID: "${transcription.dailyRoomId}"`);
        console.log(`     Meeting ID: "${transcription.meetingId || 'null'}"`);
        console.log(`     Status: ${transcription.status}`);
        console.log(`     Created: ${transcription.createdAt}`);
        console.log('');
      });
    }

    // Check for orphaned transcriptions (no meeting)
    console.log('🔍 ORPHANED TRANSCRIPTIONS (no matching meeting):');
    const orphanedTranscriptions = transcriptions.filter(t => !t.meetingId);
    
    if (orphanedTranscriptions.length === 0) {
      console.log('✅ No orphaned transcriptions found.');
    } else {
      console.log(`⚠️ Found ${orphanedTranscriptions.length} orphaned transcriptions:`);
      orphanedTranscriptions.forEach((transcription, index) => {
        console.log(`  ${index + 1}. Transcript ID: ${transcription.transcriptId}`);
        console.log(`     Daily Room ID: "${transcription.dailyRoomId}"`);
        console.log(`     Status: ${transcription.status}`);
        
        // Try to find matching meeting
        const matchingMeeting = meetings.find(m => 
          m.dailyRoomId === transcription.dailyRoomId ||
          m.roomName === transcription.dailyRoomId // Sometimes roomId is actually roomName
        );
        
        if (matchingMeeting) {
          console.log(`     ✅ Potential match found: Meeting ${matchingMeeting._id} (${matchingMeeting.roomName})`);
        } else {
          console.log(`     ❌ No matching meeting found`);
        }
        console.log('');
      });
    }

    // Check for meetings without transcriptions
    console.log('🔍 MEETINGS WITHOUT TRANSCRIPTIONS:');
    const meetingsWithoutTranscriptions = meetings.filter(m => {
      return !transcriptions.some(t => t.meetingId && t.meetingId.toString() === m._id.toString());
    });
    
    if (meetingsWithoutTranscriptions.length === 0) {
      console.log('✅ All meetings have transcriptions.');
    } else {
      console.log(`⚠️ Found ${meetingsWithoutTranscriptions.length} meetings without transcriptions:`);
      meetingsWithoutTranscriptions.forEach((meeting, index) => {
        console.log(`  ${index + 1}. Meeting ID: ${meeting._id}`);
        console.log(`     Room Name: "${meeting.roomName}"`);
        console.log(`     Daily Room ID: "${meeting.dailyRoomId}"`);
        console.log(`     Status: ${meeting.status || 'unknown'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug function
debugMeetingMatching();
