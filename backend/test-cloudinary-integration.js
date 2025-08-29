/**
 * FILE LOCATION: backend/test-cloudinary-integration.js
 * 
 * PURPOSE: Test Cloudinary integration for LOE PDF storage
 * 
 * FUNCTIONALITY: Test both local and cloud storage options
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinaryService = require('./services/cloudinaryService');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Test PDF generation function
const generateTestPDF = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;

  // Add test content
  page.drawText('Test LOE PDF', {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0.12, 0.25, 0.68)
  });
  yPosition -= 30;

  page.drawText('This is a test PDF for Cloudinary integration', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaFont,
    color: rgb(0.42, 0.45, 0.50)
  });
  yPosition -= 60;

  page.drawText(`Generated at: ${new Date().toISOString()}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0.07, 0.10, 0.15)
  });

  return await pdfDoc.save();
};

// Test Cloudinary integration
const testCloudinaryIntegration = async () => {
  try {
    console.log('🧪 Testing Cloudinary Integration...\n');

    // 1. Check Cloudinary configuration
    console.log('1️⃣ Checking Cloudinary configuration...');
    const isConfigured = cloudinaryService.isCloudinaryAvailable();
    console.log(`   Cloudinary configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);
    
    if (!isConfigured) {
      console.log('   ⚠️  Cloudinary not configured - will use local storage only');
      console.log('   📝 To configure, add these environment variables:');
      console.log('      CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('      CLOUDINARY_API_KEY=your_api_key');
      console.log('      CLOUDINARY_API_SECRET=your_api_secret\n');
    }

    // 2. Generate test PDF
    console.log('2️⃣ Generating test PDF...');
    const pdfBuffer = await generateTestPDF();
    console.log(`   ✅ PDF generated: ${pdfBuffer.length} bytes`);

    // 3. Upload PDF to Cloudinary service
    console.log('3️⃣ Uploading PDF to Cloudinary service...');
    const fileName = `test_loe_${Date.now()}.pdf`;
    const uploadResult = await cloudinaryService.uploadPDF(pdfBuffer, fileName, {
      test: true,
      timestamp: new Date().toISOString()
    });

    console.log('   Upload result:', {
      success: uploadResult.success,
      localUrl: uploadResult.localUrl,
      cloudUrl: uploadResult.cloudUrl,
      error: uploadResult.error
    });

    if (uploadResult.success) {
      console.log('   ✅ PDF uploaded successfully');
      
      if (uploadResult.localUrl) {
        console.log(`   📁 Local URL: ${uploadResult.localUrl}`);
      }
      
      if (uploadResult.cloudUrl) {
        console.log(`   ☁️  Cloudinary URL: ${uploadResult.cloudUrl}`);
      }
    } else {
      console.log(`   ❌ Upload failed: ${uploadResult.error}`);
    }

    // 4. Test URL retrieval
    console.log('\n4️⃣ Testing URL retrieval...');
    try {
      const retrievedUrl = await cloudinaryService.getPDFUrl(fileName, uploadResult.cloudUrl);
      console.log(`   ✅ Retrieved URL: ${retrievedUrl}`);
    } catch (error) {
      console.log(`   ❌ URL retrieval failed: ${error.message}`);
    }

    // 5. Get storage statistics
    console.log('\n5️⃣ Getting storage statistics...');
    const stats = await cloudinaryService.getStorageStats();
    console.log('   Storage stats:', stats);

    // 6. Clean up test file
    console.log('\n6️⃣ Cleaning up test file...');
    const deleteResult = await cloudinaryService.deletePDF(fileName, uploadResult.cloudUrl);
    console.log('   Delete result:', deleteResult);

    console.log('\n🎉 Cloudinary integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB if needed
  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        console.log('✅ Connected to MongoDB');
        return testCloudinaryIntegration();
      })
      .then(() => {
        console.log('✅ Test completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
      });
  } else {
    // Run without MongoDB connection
    testCloudinaryIntegration()
      .then(() => {
        console.log('✅ Test completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { testCloudinaryIntegration };
