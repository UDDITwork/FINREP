// File: backend/controllers/vaultController.js
const Vault = require('../models/Vault');
const { logger } = require('../utils/logger');

/**
 * Get vault data for authenticated advisor
 */
const getVaultData = async (req, res) => {
  try {
    const advisorId = req.advisor.id;

    let vault = await Vault.findOne({ advisorId });

    // If no vault exists, create one with defaults
    if (!vault) {
      vault = new Vault({
        advisorId,
        firstName: req.advisor.firstName || '',
        lastName: req.advisor.lastName || '',
        email: req.advisor.email || '',
        phoneNumber: '',
        firmName: '',
        sebiRegNumber: '',
        revenueModel: '',
        fpsbNumber: '',
        riaNumber: '',
        arnNumber: '',
        amfiRegNumber: '',
        isEmailVerified: false,
        status: 'active',
        certifications: [],
        memberships: [],
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          logo: {
            url: '',
            altText: ''
          },
          typography: {
            primaryFont: 'Inter',
            secondaryFont: 'Roboto',
            fontSize: 'medium'
          },
          tagline: ''
        },
        digitalPresence: {
          website: '',
          linkedin: '',
          twitter: '',
          facebook: '',
          instagram: '',
          youtube: ''
        },
        whiteLabel: {
          isEnabled: false,
          companyName: '',
          customDomain: '',
          apiKeys: []
        },
        reportCustomization: {
          headerStyle: 'professional',
          footerStyle: 'detailed',
          watermark: {
            isEnabled: false,
            text: '',
            opacity: 0.3
          },
          customFooter: ''
        },
        scheduling: {
          workingHours: {
            monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
            tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
            wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
            thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
            friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
            saturday: { isWorking: false, startTime: '09:00', endTime: '13:00' },
            sunday: { isWorking: false, startTime: '09:00', endTime: '13:00' }
          },
          appointmentDuration: 60,
          timezone: 'Asia/Kolkata',
          bufferTime: {
            before: 15,
            after: 15
          }
        }
      });
      
      await vault.save();
      logger.info(`Created default vault for advisor: ${advisorId}`);
    }

    res.json({
      success: true,
      data: vault
    });

  } catch (error) {
    logger.error('Error getting vault data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vault data',
      error: error.message
    });
  }
};

/**
 * Update vault data - handles all sections with proper validation
 */
const updateVaultData = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const section = req.query.section;
    const updateData = req.body;

    logger.info(`Updating vault section: ${section} for advisor: ${advisorId}`);
    logger.debug('Update data received:', JSON.stringify(updateData, null, 2));

    // Find existing vault or create new one
    let vault = await Vault.findOne({ advisorId });
    
    if (!vault) {
      // Create new vault with required fields
      vault = new Vault({
        advisorId,
        firstName: req.advisor.firstName || '',
        lastName: req.advisor.lastName || '',
        email: req.advisor.email || ''
      });
    }

    // Clean and validate update data based on section
    let processedData = {};

    switch (section) {
      case 'advisor':
        // Handle advisor personal details
        processedData = cleanAdvisorData(updateData);
        Object.assign(vault, processedData);
        break;

      case 'branding':
        // Handle branding data
        processedData.branding = cleanBrandingData(updateData.branding);
        if (!vault.branding) vault.branding = {};
        Object.assign(vault.branding, processedData.branding);
        break;

      case 'digital':
        // Handle digital presence
        processedData.digitalPresence = cleanDigitalPresenceData(updateData.digitalPresence);
        if (!vault.digitalPresence) vault.digitalPresence = {};
        Object.assign(vault.digitalPresence, processedData.digitalPresence);
        break;

      case 'reports':
        // Handle report customization
        processedData.reportCustomization = cleanReportCustomizationData(updateData.reportCustomization);
        if (!vault.reportCustomization) vault.reportCustomization = {};
        Object.assign(vault.reportCustomization, processedData.reportCustomization);
        break;

      case 'scheduling':
        // Handle scheduling preferences
        processedData.scheduling = cleanSchedulingData(updateData.scheduling);
        if (!vault.scheduling) vault.scheduling = {};
        Object.assign(vault.scheduling, processedData.scheduling);
        break;

      case 'whitelabel':
        // Handle white label configuration
        processedData.whiteLabel = cleanWhiteLabelData(updateData.whiteLabel);
        if (!vault.whiteLabel) vault.whiteLabel = {};
        Object.assign(vault.whiteLabel, processedData.whiteLabel);
        break;

      default:
        // Handle general update
        processedData = cleanGeneralData(updateData);
        Object.assign(vault, processedData);
    }

    logger.debug('Processed data for save:', JSON.stringify(processedData, null, 2));

    // Save the updated vault
    const savedVault = await vault.save();

    logger.info(`Successfully updated vault section: ${section} for advisor: ${advisorId}`);

    res.json({
      success: true,
      message: 'Vault updated successfully',
      data: savedVault
    });

  } catch (error) {
    logger.error('Error updating vault:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      }));

      logger.error('Validation errors:', validationErrors);

      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: validationErrors,
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update vault',
      error: error.message
    });
  }
};

// Data cleaning functions
function cleanAdvisorData(data) {
  const cleaned = {};
  
  // Required fields
  if (data.firstName !== undefined) cleaned.firstName = String(data.firstName || '').trim();
  if (data.lastName !== undefined) cleaned.lastName = String(data.lastName || '').trim();
  if (data.email !== undefined) cleaned.email = String(data.email || '').toLowerCase().trim();
  
  // Optional fields - only include if not empty
  if (data.phoneNumber && String(data.phoneNumber).trim()) {
    cleaned.phoneNumber = String(data.phoneNumber).trim();
  }
  if (data.firmName && String(data.firmName).trim()) {
    cleaned.firmName = String(data.firmName).trim();
  }
  if (data.sebiRegNumber && String(data.sebiRegNumber).trim()) {
    cleaned.sebiRegNumber = String(data.sebiRegNumber).toUpperCase().trim();
  }
  if (data.revenueModel && String(data.revenueModel).trim()) {
    cleaned.revenueModel = String(data.revenueModel).trim();
  }
  if (data.fpsbNumber && String(data.fpsbNumber).trim()) {
    cleaned.fpsbNumber = String(data.fpsbNumber).trim();
  }
  if (data.riaNumber && String(data.riaNumber).trim()) {
    cleaned.riaNumber = String(data.riaNumber).trim();
  }
  if (data.arnNumber && String(data.arnNumber).trim()) {
    cleaned.arnNumber = String(data.arnNumber).toUpperCase().trim();
  }
  if (data.amfiRegNumber && String(data.amfiRegNumber).trim()) {
    cleaned.amfiRegNumber = String(data.amfiRegNumber).trim();
  }
  if (data.status !== undefined) {
    cleaned.status = data.status;
  }
  
  return cleaned;
}

function cleanBrandingData(data) {
  if (!data) return {};
  
  const cleaned = {};
  
  // Colors
  if (data.primaryColor) cleaned.primaryColor = String(data.primaryColor);
  if (data.secondaryColor) cleaned.secondaryColor = String(data.secondaryColor);
  if (data.accentColor) cleaned.accentColor = String(data.accentColor);
  
  // Logo
  if (data.logo) {
    cleaned.logo = {};
    if (data.logo.url) cleaned.logo.url = String(data.logo.url).trim();
    if (data.logo.altText) cleaned.logo.altText = String(data.logo.altText).trim();
  }
  
  // Typography
  if (data.typography) {
    cleaned.typography = {};
    if (data.typography.primaryFont) cleaned.typography.primaryFont = String(data.typography.primaryFont);
    if (data.typography.secondaryFont) cleaned.typography.secondaryFont = String(data.typography.secondaryFont);
    if (data.typography.fontSize) cleaned.typography.fontSize = String(data.typography.fontSize);
  }
  
  // Tagline
  if (data.tagline) cleaned.tagline = String(data.tagline).trim();
  
  return cleaned;
}

function cleanDigitalPresenceData(data) {
  if (!data) return {};
  
  const cleaned = {};
  
  const urlFields = ['website', 'linkedin', 'twitter', 'facebook', 'instagram', 'youtube'];
  urlFields.forEach(field => {
    if (data[field] && String(data[field]).trim()) {
      cleaned[field] = String(data[field]).trim();
    }
  });
  
  return cleaned;
}

function cleanReportCustomizationData(data) {
  if (!data) return {};
  
  const cleaned = {};
  
  if (data.headerStyle) cleaned.headerStyle = String(data.headerStyle);
  if (data.footerStyle) cleaned.footerStyle = String(data.footerStyle);
  if (data.customFooter) cleaned.customFooter = String(data.customFooter).trim();
  
  // Watermark
  if (data.watermark) {
    cleaned.watermark = {};
    cleaned.watermark.isEnabled = Boolean(data.watermark.isEnabled);
    if (data.watermark.text) cleaned.watermark.text = String(data.watermark.text).trim();
    if (data.watermark.opacity !== undefined) {
      const opacity = Number(data.watermark.opacity);
      cleaned.watermark.opacity = isNaN(opacity) ? 0.3 : Math.max(0.1, Math.min(1.0, opacity));
    }
  }
  
  return cleaned;
}

function cleanSchedulingData(data) {
  if (!data) return {};
  
  const cleaned = {};
  
  // Appointment duration
  if (data.appointmentDuration !== undefined) {
    const duration = Number(data.appointmentDuration);
    cleaned.appointmentDuration = isNaN(duration) ? 60 : duration;
  }
  
  // Timezone
  if (data.timezone) cleaned.timezone = String(data.timezone);
  
  // Buffer time
  if (data.bufferTime) {
    cleaned.bufferTime = {};
    if (data.bufferTime.before !== undefined) {
      const before = Number(data.bufferTime.before);
      cleaned.bufferTime.before = isNaN(before) ? 15 : before;
    }
    if (data.bufferTime.after !== undefined) {
      const after = Number(data.bufferTime.after);
      cleaned.bufferTime.after = isNaN(after) ? 15 : after;
    }
  }
  
  // Working hours (if provided)
  if (data.workingHours) {
    cleaned.workingHours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      if (data.workingHours[day]) {
        cleaned.workingHours[day] = {
          isWorking: Boolean(data.workingHours[day].isWorking),
          startTime: String(data.workingHours[day].startTime || '09:00'),
          endTime: String(data.workingHours[day].endTime || '17:00')
        };
      }
    });
  }
  
  return cleaned;
}

function cleanWhiteLabelData(data) {
  if (!data) return {};
  
  const cleaned = {};
  
  cleaned.isEnabled = Boolean(data.isEnabled);
  
  if (data.companyName && String(data.companyName).trim()) {
    cleaned.companyName = String(data.companyName).trim();
  }
  if (data.customDomain && String(data.customDomain).trim()) {
    cleaned.customDomain = String(data.customDomain).trim();
  }
  
  // API keys (if provided)
  if (data.apiKeys && Array.isArray(data.apiKeys)) {
    cleaned.apiKeys = data.apiKeys.map(key => ({
      name: String(key.name || '').trim(),
      key: String(key.key || '').trim(),
      isActive: Boolean(key.isActive !== undefined ? key.isActive : true),
      createdAt: key.createdAt || new Date()
    }));
  }
  
  return cleaned;
}

function cleanGeneralData(data) {
  // Fallback for general updates
  const cleaned = {};
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof data[key] === 'string' && data[key].trim() === '') {
        // Skip empty strings
        return;
      }
      cleaned[key] = data[key];
    }
  });
  
  return cleaned;
}

/**
 * Add certification
 */
const addCertification = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const certificationData = req.body;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    // Clean certification data
    const cleanedData = {
      name: String(certificationData.name || '').trim(),
      issuingBody: String(certificationData.issuingBody || '').trim(),
      issueDate: new Date(certificationData.issueDate),
      expiryDate: certificationData.expiryDate ? new Date(certificationData.expiryDate) : undefined,
      certificateNumber: certificationData.certificateNumber ? String(certificationData.certificateNumber).trim() : undefined,
      isActive: Boolean(certificationData.isActive !== undefined ? certificationData.isActive : true)
    };

    vault.certifications.push(cleanedData);
    await vault.save();

    res.json({
      success: true,
      message: 'Certification added successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error adding certification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add certification',
      error: error.message
    });
  }
};

/**
 * Update certification
 */
const updateCertification = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const certId = req.params.certId;
    const updateData = req.body;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    const certification = vault.certifications.id(certId);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    // Update certification fields
    if (updateData.name) certification.name = String(updateData.name).trim();
    if (updateData.issuingBody) certification.issuingBody = String(updateData.issuingBody).trim();
    if (updateData.issueDate) certification.issueDate = new Date(updateData.issueDate);
    if (updateData.expiryDate) certification.expiryDate = new Date(updateData.expiryDate);
    if (updateData.certificateNumber) certification.certificateNumber = String(updateData.certificateNumber).trim();
    if (updateData.isActive !== undefined) certification.isActive = Boolean(updateData.isActive);

    await vault.save();

    res.json({
      success: true,
      message: 'Certification updated successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error updating certification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certification',
      error: error.message
    });
  }
};

/**
 * Delete certification
 */
const deleteCertification = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const certId = req.params.certId;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    vault.certifications.id(certId).remove();
    await vault.save();

    res.json({
      success: true,
      message: 'Certification deleted successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error deleting certification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certification',
      error: error.message
    });
  }
};

/**
 * Add membership
 */
const addMembership = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const membershipData = req.body;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    // Clean membership data
    const cleanedData = {
      organization: String(membershipData.organization || '').trim(),
      membershipType: String(membershipData.membershipType || '').trim(),
      memberSince: new Date(membershipData.memberSince),
      membershipNumber: membershipData.membershipNumber ? String(membershipData.membershipNumber).trim() : undefined,
      isActive: Boolean(membershipData.isActive !== undefined ? membershipData.isActive : true)
    };

    vault.memberships.push(cleanedData);
    await vault.save();

    res.json({
      success: true,
      message: 'Membership added successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error adding membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add membership',
      error: error.message
    });
  }
};

/**
 * Update membership
 */
const updateMembership = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const membershipId = req.params.membershipId;
    const updateData = req.body;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    const membership = vault.memberships.id(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    // Update membership fields
    if (updateData.organization) membership.organization = String(updateData.organization).trim();
    if (updateData.membershipType) membership.membershipType = String(updateData.membershipType).trim();
    if (updateData.memberSince) membership.memberSince = new Date(updateData.memberSince);
    if (updateData.membershipNumber) membership.membershipNumber = String(updateData.membershipNumber).trim();
    if (updateData.isActive !== undefined) membership.isActive = Boolean(updateData.isActive);

    await vault.save();

    res.json({
      success: true,
      message: 'Membership updated successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error updating membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership',
      error: error.message
    });
  }
};

/**
 * Delete membership
 */
const deleteMembership = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const membershipId = req.params.membershipId;

    const vault = await Vault.findOne({ advisorId });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    vault.memberships.id(membershipId).remove();
    await vault.save();

    res.json({
      success: true,
      message: 'Membership deleted successfully',
      data: vault
    });

  } catch (error) {
    logger.error('Error deleting membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete membership',
      error: error.message
    });
  }
};

module.exports = {
  getVaultData,
  updateVaultData,
  addCertification,
  updateCertification,
  deleteCertification,
  addMembership,
  updateMembership,
  deleteMembership
};