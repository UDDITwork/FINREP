/**
 * FILE LOCATION: backend/controllers/loeAutomationController.js
 * 
 * PURPOSE: LOE Automation controller for managing client LOE status
 * 
 * FUNCTIONALITY: Fetch clients with LOE status for logged-in advisor
 */

const Client = require('../models/Client');
const LOEAutomation = require('../models/LOEAutomation');
const { logger } = require('../utils/logger');
const { sendEmail, createEmailTransporter } = require('../utils/emailService');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const cloudinaryService = require('../services/cloudinaryService');

// DEBUG: Check if models are loaded correctly
console.log('🔍 DEBUG Models Loaded:', {
  ClientModel: !!Client,
  ClientModelName: Client?.modelName || 'undefined',
  LOEAutomationModel: !!LOEAutomation,
  LOEAutomationModelName: LOEAutomation?.modelName || 'undefined'
});

/**
 * Extract advisor ID from request object
 * Handles different auth middleware implementations
 */
const extractAdvisorId = (req) => {
  // DEBUG: Log the actual request object structure
  console.log('🔍 DEBUG Request Object:', {
    hasUser: !!req.user,
    hasAdvisor: !!req.advisor,
    userKeys: req.user ? Object.keys(req.user) : 'none',
    advisorKeys: req.advisor ? Object.keys(req.advisor) : 'none',
    
    // Check both id and _id formats
    advisor_id: req.advisor?.id,
    advisor_objectId: req.advisor?._id,
    user_id: req.user?.id,
    user_objectId: req.user?._id
  });

  // Try both _id and id formats (MongoDB vs JSON)
  const possiblePaths = [
    req.advisor?._id,     // MongoDB ObjectId format (most likely)
    req.advisor?.id,      // JSON converted format
    req.user?._id,        // User ObjectId format
    req.user?.id,         // User JSON format
    req.advisorId,        // Direct property
    req.userId            // Direct user property
  ];

  // Find the first valid ID and convert ObjectId to string if needed
  let foundAdvisorId = null;
  
  for (const id of possiblePaths) {
    if (!id) continue;
    
    // If it's a MongoDB ObjectId, convert to string
    if (id.toString && typeof id.toString === 'function') {
      foundAdvisorId = id.toString();
      break;
    }
    
    // If it's already a string and not empty
    if (typeof id === 'string' && id.length > 0) {
      foundAdvisorId = id;
      break;
    }
  }
  
  console.log('🔍 DEBUG Final Result:', {
    foundAdvisorId,
    pathResults: possiblePaths.map((path, index) => ({
      index,
      value: path,
      type: typeof path,
      isObjectId: path?.toString && typeof path.toString === 'function',
      stringValue: path?.toString ? path.toString() : path
    }))
  });

  if (!foundAdvisorId) {
    logger.error('Advisor ID extraction failed', {
      userKeys: req.user ? Object.keys(req.user) : 'undefined',
      advisorKeys: req.advisor ? Object.keys(req.advisor) : 'undefined',
      directProps: {
        userId: req.userId,
        advisorId: req.advisorId
      },
      requestPath: req.path,
      method: req.method
    });
  }

  return foundAdvisorId;
};

/**
 * Get all clients with LOE status for the logged-in advisor
 */
const getClientsWithLOEStatus = async (req, res) => {
  try {
    const advisorId = extractAdvisorId(req);
    
    if (!advisorId) {
      logger.warn('LOE Automation request without valid advisor ID', {
        path: req.path,
        method: req.method,
        headers: req.headers.authorization ? 'present' : 'missing'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required: Advisor ID not found'
      });
    }

    logger.info('Fetching clients with LOE status', { advisorId });

    // DEBUG: Check database connection
    const mongoose = require('mongoose');
    console.log('🔍 DEBUG Database Status:', {
      connectionState: mongoose.connection.readyState,
      connectionStates: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      },
      databaseName: mongoose.connection.name,
      host: mongoose.connection.host
    });

    // DEBUG: Test if there are ANY clients in the database
    const totalClientsInDB = await Client.countDocuments({});
    console.log('🔍 DEBUG Total Clients in Database:', totalClientsInDB);
    
    // DEBUG: Test if there are ANY clients with any advisor
    const clientsWithAnyAdvisor = await Client.countDocuments({ advisor: { $exists: true } });
    console.log('🔍 DEBUG Clients with Any Advisor:', clientsWithAnyAdvisor);

    // DEBUG: Log the exact query being executed
    console.log('🔍 DEBUG Client Query:', {
      query: { advisor: advisorId },
      advisorIdType: typeof advisorId,
      advisorIdValue: advisorId,
      isObjectId: advisorId?.toString && typeof advisorId.toString === 'function'
    });

    // Get all clients for the advisor - try both ObjectId and string formats
    let clients = await Client.find({ advisor: advisorId }).lean();
    
    // If no clients found, try with ObjectId conversion
    if (!clients || clients.length === 0) {
      console.log('🔍 DEBUG: No clients found with string advisorId, trying ObjectId conversion...');
      try {
        const mongoose = require('mongoose');
        const advisorObjectId = new mongoose.Types.ObjectId(advisorId);
        clients = await Client.find({ advisor: advisorObjectId }).lean();
        console.log('🔍 DEBUG: ObjectId query result:', { 
          clientsFound: clients?.length || 0,
          advisorObjectId: advisorObjectId.toString()
        });
      } catch (objectIdError) {
        console.log('🔍 DEBUG: ObjectId conversion failed:', objectIdError.message);
      }
    }
    
    // DEBUG: Log the database query result
    console.log('🔍 DEBUG Database Result:', {
      clientsFound: clients?.length || 0,
      clients: clients?.map(c => ({ 
        id: c._id, 
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        advisor: c.advisor
      })) || [],
      query: { advisor: advisorId }
    });
    
    if (!clients || clients.length === 0) {
      logger.info('No clients found for advisor', { advisorId });
      return res.json({
        success: true,
        data: {
          clients: [],
          totalClients: 0,
          clientsWithLOE: 0
        }
      });
    }

    // Get LOE status for all clients
    const clientIds = clients.map(client => client._id);
    const loeRecords = await LOEAutomation.find({ 
      clientId: { $in: clientIds },
      advisorId: advisorId
    }).lean();

    // Create a map of clientId to LOE status
    const loeStatusMap = {};
    loeRecords.forEach(loe => {
      loeStatusMap[loe.clientId.toString()] = {
        loeId: loe._id,
        status: loe.status,
        createdAt: loe.createdAt,
        sentAt: loe.sentAt,
        viewedAt: loe.viewedAt,
        signedAt: loe.signedAt,
        expiresAt: loe.expiresAt,
        accessToken: loe.accessToken
      };
    });

    // Combine client data with LOE status
    const clientsWithLOEStatus = clients.map(client => {
      const clientIdStr = client._id.toString();
      const loeStatus = loeStatusMap[clientIdStr];
      
      return {
        _id: client._id,
        firstName: client.firstName || client.personalInfo?.firstName || '',
        lastName: client.lastName || client.personalInfo?.lastName || '',
        email: client.email || client.personalInfo?.email || '',
        phoneNumber: client.phoneNumber || client.personalInfo?.phoneNumber || '',
        hasLOE: !!loeStatus,
        loeStatus: loeStatus || null,
        clientName: `${client.firstName || client.personalInfo?.firstName || ''} ${client.lastName || client.personalInfo?.lastName || ''}`.trim()
      };
    });

    const clientsWithLOE = clientsWithLOEStatus.filter(client => client.hasLOE).length;

    logger.info('Clients with LOE status fetched successfully', {
      advisorId,
      totalClients: clientsWithLOEStatus.length,
      clientsWithLOE
    });

    res.json({
      success: true,
      data: {
        clients: clientsWithLOEStatus,
        totalClients: clientsWithLOEStatus.length,
        clientsWithLOE
      }
    });

  } catch (error) {
    logger.error('Failed to fetch clients with LOE status', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients with LOE status',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

/**
 * Get detailed LOE information for a specific client
 */
const getClientLOEDetails = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = extractAdvisorId(req);

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!clientId || !clientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID format'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (!client) {
      logger.warn('Client not found or access denied', {
        clientId,
        advisorId
      });
      
      return res.status(404).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }

    // Get LOE records for this client
    const loeRecords = await LOEAutomation.find({ 
      clientId, 
      advisorId: advisorId 
    }).sort({ createdAt: -1 }).lean();

    const clientData = {
      _id: client._id,
      firstName: client.firstName || client.personalInfo?.firstName || '',
      lastName: client.lastName || client.personalInfo?.lastName || '',
      email: client.email || client.personalInfo?.email || '',
      phoneNumber: client.phoneNumber || client.personalInfo?.phoneNumber || '',
      clientName: `${client.firstName || client.personalInfo?.firstName || ''} ${client.lastName || client.personalInfo?.lastName || ''}`.trim()
    };

    logger.info('Client LOE details fetched successfully', {
      clientId,
      advisorId,
      loeCount: loeRecords.length
    });

    res.json({
      success: true,
      data: {
        client: clientData,
        loeRecords: loeRecords,
        totalLOEs: loeRecords.length
      }
    });

  } catch (error) {
    logger.error('Failed to fetch client LOE details', {
      clientId: req.params.clientId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client LOE details',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

/**
 * Create a new LOE for a client (Simplified - No Meeting ID required)
 */
const createLOEForClient = async (req, res) => {
  try {
    const { customNotes } = req.body;
    const { clientId } = req.params; // Get clientId from URL params
    const advisorId = extractAdvisorId(req);

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }

    // Validate ObjectId format for clientId only
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Client ID format'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }

    // Create new LOE using LOEAutomation model
    const newLOE = new LOEAutomation({
      advisorId: advisorId,
      clientId,
      content: {
        customNotes: customNotes || ''
      }
    });

    await newLOE.save();

    // Send email to client with LOE link
    try {
      await sendLOEEmailToClient(client, newLOE);
      await newLOE.markAsSent();
    } catch (emailError) {
      logger.error('Failed to send LOE email', {
        loeId: newLOE._id,
        clientId,
        error: emailError.message
      });
      // Don't fail the request if email fails
    }

    logger.info('New LOE created successfully', {
      loeId: newLOE._id,
      clientId,
      advisorId
    });

    res.json({
      success: true,
      data: {
        loeId: newLOE._id,
        status: newLOE.status,
        accessToken: newLOE.accessToken,
        clientAccessUrl: newLOE.clientAccessUrl,
        message: 'LOE created and sent to client successfully'
      }
    });

  } catch (error) {
    logger.error('Failed to create LOE for client', {
      clientId: req.body.clientId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create LOE for client',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

/**
 * Get LOE data for client signing page
 */
const getClientLOEData = async (req, res) => {
  try {
    const { accessToken } = req.params;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Find LOE by access token
    const loe = await LOEAutomation.findByToken(accessToken);
    
    if (!loe) {
      return res.status(404).json({
        success: false,
        error: 'LOE not found or access token expired'
      });
    }

    // Mark as viewed if not already viewed
    if (loe.status === 'sent') {
      await loe.markAsViewed(req.ip, req.get('User-Agent'));
    }

    // Get client data separately since clientId is not populated
    const client = await Client.findById(loe.clientId).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    logger.info('Client LOE data fetched', {
      loeId: loe._id,
      clientId: loe.clientId,
      status: loe.status
    });

    res.json({
      success: true,
      data: {
        loe: {
          _id: loe._id,
          status: loe.status,
          content: loe.content,
          expiresAt: loe.expiresAt
        },
        client: {
          firstName: client.firstName || client.personalInfo?.firstName || '',
          lastName: client.lastName || client.personalInfo?.lastName || '',
          email: client.email || client.personalInfo?.email || ''
        },
        advisor: {
          firstName: loe.advisorId.firstName,
          lastName: loe.advisorId.lastName,
          email: loe.advisorId.email,
          phone: loe.advisorId.phone,
          firmName: loe.advisorId.firmName
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch client LOE data', {
      accessToken: req.params.accessToken,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LOE data',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

/**
 * Handle client LOE signature submission
 */
const submitClientSignature = async (req, res) => {
  try {
    const { accessToken } = req.params;
    const { signature, ipAddress, userAgent } = req.body;

    if (!accessToken || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Access token and signature are required'
      });
    }

    // Find LOE by access token
    const loe = await LOEAutomation.findByToken(accessToken);
    
    if (!loe) {
      return res.status(404).json({
        success: false,
        error: 'LOE not found or access token expired'
      });
    }

    if (loe.status === 'signed') {
      return res.status(400).json({
        success: false,
        error: 'LOE has already been signed'
      });
    }

    // Save signature
    await loe.saveSignature(signature, ipAddress || req.ip, userAgent || req.get('User-Agent'));

    // Generate signed PDF using Cloudinary service
    let pdfUrl = null;
    let cloudinaryUrl = null;
    try {
      pdfUrl = await generateSignedLOEPDF(loe);
      
      // Update LOE record with PDF URLs
      if (pdfUrl) {
        if (pdfUrl.startsWith('http')) {
          // Cloudinary URL
          cloudinaryUrl = pdfUrl;
          loe.cloudinaryPdfUrl = cloudinaryUrl;
          // Extract filename for local fallback
          const fileName = pdfUrl.split('/').pop();
          loe.signedPdfUrl = `/uploads/loe/${fileName}`;
        } else {
          // Local URL
          loe.signedPdfUrl = pdfUrl;
        }
        
        // Mark LOE as having a signed PDF
        loe.hasSignedPdf = true;
        loe.pdfGeneratedAt = new Date();
        
        await loe.save();
        
        logger.info('✅ Signed PDF generated and stored successfully', {
          loeId: loe._id,
          cloudinaryUrl: !!cloudinaryUrl,
          localUrl: !!loe.signedPdfUrl
        });
      }
    } catch (pdfError) {
      logger.error('Failed to generate signed PDF', {
        loeId: loe._id,
        error: pdfError.message
      });
    }

    // Send confirmation email to advisor
    try {
      await sendLOESignedNotificationToAdvisor(loe);
    } catch (emailError) {
      logger.error('Failed to send advisor notification', {
        loeId: loe._id,
        error: emailError.message
      });
    }

    logger.info('Client LOE signed successfully', {
      loeId: loe._id,
      clientId: loe.clientId,
      advisorId: loe.advisorId._id
    });

    res.json({
      success: true,
      data: {
        message: 'LOE signed successfully',
        pdfUrl: pdfUrl,
        signedAt: loe.signedAt
      }
    });

  } catch (error) {
    logger.error('Failed to submit client signature', {
      accessToken: req.params.accessToken,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit signature',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

/**
 * Send LOE email to client
 */
const sendLOEEmailToClient = async (client, loe) => {
  // Handle different client data structures
  const clientFirstName = client.firstName || client.personalInfo?.firstName || '';
  const clientLastName = client.lastName || client.personalInfo?.lastName || '';
  const clientEmail = client.email || client.personalInfo?.email || '';
  
  const subject = 'Letter of Engagement - Action Required';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Letter of Engagement</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Financial Advisory Services</p>
      </div>
      
      <div style="padding: 30px; background: white;">
        <p>Dear ${clientFirstName} ${clientLastName},</p>
        
        <p>Thank you for choosing our financial advisory services. We are pleased to provide you with a comprehensive Letter of Engagement (LOE) that outlines our professional relationship and the services we will provide.</p>
        
        <p><strong>What's Next:</strong></p>
        <ul>
          <li>Review the LOE document carefully</li>
          <li>Sign the document using our secure digital signature system</li>
          <li>Download your signed copy for your records</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loe.clientAccessUrl}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Sign Letter of Engagement
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Important:</strong> This link will expire in 7 days. If you have any questions, please contact your advisor directly.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  // Create email transporter and send email
  const transporter = createEmailTransporter();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: subject,
    html: htmlContent
  };

  const result = await sendEmail(transporter, mailOptions);
  
  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error}`);
  }
  
  return result;
};

/**
 * Send LOE signed notification to advisor
 */
const sendLOESignedNotificationToAdvisor = async (loe) => {
  // Get client data separately since clientId is not populated
  const client = await Client.findById(loe.clientId).lean();
  
  if (!client) {
    throw new Error('Client not found for email notification');
  }

  const clientFirstName = client.firstName || client.personalInfo?.firstName || '';
  const clientLastName = client.lastName || client.personalInfo?.lastName || '';
  const clientEmail = client.email || client.personalInfo?.email || '';

  const subject = 'LOE Signed - Client Action Required';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LOE Signed Successfully!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Client has completed the engagement process</p>
      </div>
      
      <div style="padding: 30px; background: white;">
        <p>Dear ${loe.advisorId.firstName} ${loe.advisorId.lastName},</p>
        
        <p>Great news! Your client <strong>${clientFirstName} ${clientLastName}</strong> has successfully signed the Letter of Engagement.</p>
        
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">Client Details:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${clientFirstName} ${clientLastName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${clientEmail}</p>
          <p style="margin: 5px 0;"><strong>Signed At:</strong> ${new Date(loe.signedAt).toLocaleString()}</p>
        </div>
        
        <p>You can now proceed with providing financial advisory services to this client. The signed LOE is available in your dashboard for download.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your LOE Automation system.
        </p>
      </div>
    </div>
  `;

  // Create email transporter and send email
  const transporter = createEmailTransporter();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: loe.advisorId.email,
    subject: subject,
    html: htmlContent
  };

  const result = await sendEmail(transporter, mailOptions);
  
  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error}`);
  }
  
  return result;
};

/**
 * Generate signed LOE PDF
 */
const generateSignedLOEPDF = async (loe) => {
  try {
    // Get client data separately since clientId is not populated
    const client = await Client.findById(loe.clientId).lean();
    
    if (!client) {
      throw new Error('Client not found for PDF generation');
    }

    const clientFirstName = client.firstName || client.personalInfo?.firstName || '';
    const clientLastName = client.lastName || client.personalInfo?.lastName || '';
    const clientEmail = client.email || client.personalInfo?.email || '';

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/loe');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `LOE_${clientFirstName}_${clientLastName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Embed the standard font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50; // Start from top with margin

    // Header with firm information
    page.drawText(loe.advisorId.firmName || 'Financial Advisory Firm', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(0.12, 0.25, 0.68) // Blue color
    });
    yPosition -= 30;

    page.drawText('Professional Financial Services', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaFont,
      color: rgb(0.42, 0.45, 0.50) // Gray color
    });
    yPosition -= 60;

    // Document title
    page.drawText('LETTER OF ENGAGEMENT', {
      x: 50,
      y: yPosition,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0.07, 0.10, 0.15) // Dark color
    });
    yPosition -= 40;

    // Date and client info
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.22, 0.25, 0.32)
    });
    yPosition -= 20;

    page.drawText(`To: ${clientFirstName} ${clientLastName}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.22, 0.25, 0.32)
    });
    yPosition -= 20;

    page.drawText(`Email: ${clientEmail}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.22, 0.25, 0.32)
    });
    yPosition -= 40;

    // Content
    page.drawText(`Dear ${clientFirstName},`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 30;

    const welcomeText = `Welcome to ${loe.advisorId.firmName || 'our firm'}! We are delighted to have you as a client and look forward to providing you with comprehensive financial advisory services.`;
    page.drawText(welcomeText, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15),
      maxWidth: width - 100
    });
    yPosition -= 50;

    const engagementText = 'This Letter of Engagement (LOE) outlines the terms and conditions of our professional relationship, including the services we will provide, our fee structure, and your responsibilities as a client.';
    page.drawText(engagementText, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15),
      maxWidth: width - 100
    });
    yPosition -= 60;

    // Services section
    page.drawText('Services to be Provided:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 30;

    const services = [
      'Comprehensive Financial Planning and Analysis',
      'Investment Advisory and Portfolio Management',
      'Risk Assessment and Management Strategies',
      'Retirement Planning and Wealth Preservation',
      'Tax-Efficient Investment Strategies',
      'Regular Portfolio Reviews and Rebalancing'
    ];

    services.forEach(service => {
      page.drawText(`• ${service}`, {
        x: 70,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.07, 0.10, 0.15)
      });
      yPosition -= 20;
    });

    yPosition -= 20;

    // Fee structure
    page.drawText('Fee Structure:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 30;

    const fees = [
      'Initial Financial Planning Fee: $5,000',
      'Ongoing Advisory Fee: 1% of assets under management',
      'Reduced fee of 0.75% for assets above $1,000,000',
      'Quarterly billing in advance'
    ];

    fees.forEach(fee => {
      page.drawText(`• ${fee}`, {
        x: 70,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.07, 0.10, 0.15)
      });
      yPosition -= 20;
    });

    yPosition -= 30;

    // Custom notes if any
    if (loe.content?.customNotes) {
      page.drawText('Additional Notes:', {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.07, 0.10, 0.15)
      });
      yPosition -= 30;

      page.drawText(loe.content.customNotes, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.07, 0.10, 0.15),
        maxWidth: width - 100
      });
      yPosition -= 60;
    }

    // Signature section
    page.drawText('Client Signature:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 30;

    // Add signature image if available
    if (loe.signatures?.client?.data) {
      try {
        const signatureData = loe.signatures.client.data;
        const base64Data = signatureData.replace(/^data:image\/[a-z]+;base64,/, '');
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        
        // For now, we'll just add a placeholder for the signature
        // In a full implementation, you'd embed the image properly
        page.drawText('[Client Signature Image]', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: rgb(0.42, 0.45, 0.50)
        });
        yPosition -= 40;
      } catch (imageError) {
        logger.error('Failed to process signature image', { error: imageError.message });
      }
    }

    // Signature details
    page.drawText(`Signed by: ${clientFirstName} ${clientLastName}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 20;

    page.drawText(`Date: ${new Date(loe.signedAt).toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15)
    });
    yPosition -= 20;

    page.drawText(`Time: ${new Date(loe.signedAt).toLocaleTimeString()}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.07, 0.10, 0.15)
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Upload to Cloudinary service (handles both local and cloud storage)
    const uploadResult = await cloudinaryService.uploadPDF(pdfBytes, fileName, {
      advisorId: loe.advisorId,
      clientId: loe.clientId,
      loeId: loe._id
    });

    if (uploadResult.success) {
      // Return Cloudinary URL if available, otherwise local URL
      return uploadResult.cloudUrl || uploadResult.localUrl;
    } else {
      // Fallback to local storage only
      fs.writeFileSync(filePath, pdfBytes);
      return `/uploads/loe/${fileName}`;
    }

  } catch (error) {
    logger.error('Failed to generate signed PDF', {
      loeId: loe._id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getClientsWithLOEStatus,
  getClientLOEDetails,
  createLOEForClient,
  getClientLOEData,
  submitClientSignature
};
