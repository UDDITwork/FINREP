const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_MEETING_ID = '68a7f2ca50aa6699b02e496c'; // From your logs

// Test the enhanced transcription endpoints
async function testEnhancedTranscription() {
  console.log('🧪 Testing Enhanced Transcription Functionality\n');

  try {
    // Test 1: Get advisor transcriptions
    console.log('1️⃣ Testing GET /api/enhanced-transcriptions');
    try {
      const response = await axios.get(`${BASE_URL}/api/enhanced-transcriptions`);
      console.log('✅ Success:', {
        status: response.status,
        total: response.data.total,
        hasMeetings: response.data.meetings && response.data.meetings.length > 0
      });
      
      if (response.data.meetings && response.data.meetings.length > 0) {
        const meeting = response.data.meetings[0];
        console.log('📋 Sample meeting:', {
          id: meeting._id,
          client: meeting.clientId?.firstName + ' ' + meeting.clientId?.lastName,
          hasParsedData: meeting.hasParsedData,
          needsParsing: meeting.needsParsing,
          hasVttUrl: meeting.hasVttUrl
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Parse specific meeting transcription
    console.log('2️⃣ Testing POST /api/enhanced-transcriptions/:meetingId/parse');
    try {
      const response = await axios.post(`${BASE_URL}/api/enhanced-transcriptions/${TEST_MEETING_ID}/parse`);
      console.log('✅ Success:', {
        status: response.status,
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.data) {
        console.log('📊 Parsed data:', {
          speakerCount: response.data.data.speakers?.length,
          totalSegments: response.data.data.totalSegments,
          totalDuration: response.data.data.totalDuration
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get meeting transcription details
    console.log('3️⃣ Testing GET /api/enhanced-transcriptions/:meetingId/details');
    try {
      const response = await axios.get(`${BASE_URL}/api/enhanced-transcriptions/${TEST_MEETING_ID}/details`);
      console.log('✅ Success:', {
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data
      });
      
      if (response.data.data) {
        const { transcription } = response.data.data;
        console.log('📋 Transcription details:', {
          transcriptId: transcription.transcriptId,
          status: transcription.status,
          totalSegments: transcription.totalSegments,
          totalDuration: transcription.totalDuration,
          speakerCount: transcription.speakers?.length
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Search transcriptions
    console.log('4️⃣ Testing GET /api/enhanced-transcriptions/search?query=meeting');
    try {
      const response = await axios.get(`${BASE_URL}/api/enhanced-transcriptions/search?query=meeting`);
      console.log('✅ Success:', {
        status: response.status,
        success: response.data.success,
        query: response.data.query,
        resultsFound: response.data.total
      });
      
      if (response.data.results && response.data.results.length > 0) {
        console.log('🔍 Sample search result:', {
          client: response.data.results[0].client?.firstName + ' ' + response.data.results[0].client?.lastName,
          matchCount: response.data.results[0].matchCount
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Bulk parse transcriptions
    console.log('5️⃣ Testing POST /api/enhanced-transcriptions/bulk-parse');
    try {
      const response = await axios.post(`${BASE_URL}/api/enhanced-transcriptions/bulk-parse`);
      console.log('✅ Success:', {
        status: response.status,
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.results) {
        console.log('📊 Bulk parse results:', {
          total: response.data.results.total,
          successful: response.data.results.successful,
          failed: response.data.results.failed
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Run the tests
console.log('🚀 Starting Enhanced Transcription API Tests...\n');
testEnhancedTranscription().then(() => {
  console.log('\n✨ Test suite completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
