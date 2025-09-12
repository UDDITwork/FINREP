/**
 * PDF Generation Debug Test
 * This script tests PDF generation with comprehensive logging
 */

const PDFController = require('./controllers/pdfController');

async function testPDFGeneration() {
  console.log('🧪 Starting PDF Generation Debug Test...');
  
  const pdfController = new PDFController();

  // Mock request and response objects
  const mockReq = {
    params: { clientId: '689948712345678901234567' },
    advisor: { id: '689948712345678901234567' },
    method: 'POST',
    url: '/api/pdf/generate-client-report/689948712345678901234567',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer test-token',
      'origin': 'http://localhost:5173',
      'user-agent': 'Mozilla/5.0 Test Browser'
    }
  };

  const mockRes = {
    setHeader: (key, value) => console.log(`📋 Setting header: ${key} = ${value}`),
    send: (data) => {
      if (Buffer.isBuffer(data)) {
        console.log(`📤 Sending PDF buffer: ${data.length} bytes`);
      } else {
        console.log(`📤 Sending response data: ${typeof data}`, data);
      }
    },
    status: (code) => ({
      json: (data) => console.log(`📄 JSON response [${code}]:`, data)
    })
  };

  try {
    console.log('\n🚀 Calling PDF generation...');
    await pdfController.generateClientReport(mockReq, mockRes);
    console.log('\n✅ PDF generation test completed');
  } catch (error) {
    console.log('\n❌ PDF generation test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPDFGeneration();