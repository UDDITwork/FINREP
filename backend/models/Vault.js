// File: backend/models/Vault.js
const mongoose = require('mongoose');
const { logger, logDatabase } = require('../utils/logger');

const vaultSchema = new mongoose.Schema({
  // Advisor Personal Details (copied from Advisor model)
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor', required: true, unique: true },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid phone number
        return !v || /^[+]?[\d\s\-\(\)\.]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  firmName: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'Firm name cannot exceed 100 characters']
  },
  sebiRegNumber: {
    type: String,
    trim: true,
    default: '',
    uppercase: true
  },
  revenueModel: {
    type: String,
    enum: ['Fee-Only', 'Commission-Based', 'Fee + Commission', ''],
    default: ''
  },
  fpsbNumber: {
    type: String,
    trim: true,
    default: ''
  },
  riaNumber: {
    type: String,
    trim: true,
    default: ''
  },
  arnNumber: {
    type: String,
    trim: true,
    default: '',
    uppercase: true
  },
  amfiRegNumber: {
    type: String,
    trim: true,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Professional Certifications
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuingBody: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date
    },
    certificateNumber: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Professional Memberships
  memberships: [{
    organization: {
      type: String,
      required: true,
      trim: true
    },
    membershipType: {
      type: String,
      required: true,
      trim: true
    },
    memberSince: {
      type: Date,
      required: true
    },
    membershipNumber: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Branding Configuration
  branding: {
    primaryColor: {
      type: String,
      default: '#2563eb',
      validate: {
        validator: function(v) {
          return !v || /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondaryColor: {
      type: String,
      default: '#64748b',
      validate: {
        validator: function(v) {
          return !v || /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    },
    accentColor: {
      type: String,
      default: '#f59e0b',
      validate: {
        validator: function(v) {
          return !v || /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Accent color must be a valid hex color'
      }
    },
    logo: {
      url: {
        type: String,
        trim: true,
        default: ''
      },
      altText: {
        type: String,
        trim: true,
        default: '',
        maxlength: [100, 'Logo alt text cannot exceed 100 characters']
      }
    },
    typography: {
      primaryFont: {
        type: String,
        default: 'Inter',
        trim: true
      },
      secondaryFont: {
        type: String,
        default: 'Roboto',
        trim: true
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Tagline cannot exceed 200 characters']
    }
  },

  // Digital Presence
  digitalPresence: {
    website: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL'
      }
    },
    linkedin: {
      type: String,
      trim: true,
      default: ''
    },
    twitter: {
      type: String,
      trim: true,
      default: ''
    },
    facebook: {
      type: String,
      trim: true,
      default: ''
    },
    instagram: {
      type: String,
      trim: true,
      default: ''
    },
    youtube: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // White Label Configuration
  whiteLabel: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    customDomain: {
      type: String,
      trim: true,
      default: ''
    },
    apiKeys: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      key: {
        type: String,
        required: true,
        trim: true
      },
      isActive: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Report Customization
  reportCustomization: {
    headerStyle: {
      type: String,
      enum: ['minimal', 'professional', 'modern', 'classic'],
      default: 'professional'
    },
    footerStyle: {
      type: String,
      enum: ['minimal', 'detailed', 'legal', 'none'],
      default: 'detailed'
    },
    watermark: {
      isEnabled: {
        type: Boolean,
        default: false
      },
      text: {
        type: String,
        trim: true,
        default: '',
        maxlength: [50, 'Watermark text cannot exceed 50 characters']
      },
      opacity: {
        type: Number,
        min: [0.1, 'Opacity must be at least 0.1'],
        max: [1.0, 'Opacity cannot exceed 1.0'],
        default: 0.3,
        set: function(val) {
          // Ensure opacity is within bounds and convert to number
          if (val === null || val === undefined || val === '') return 0.3;
          const numVal = Number(val);
          if (isNaN(numVal)) return 0.3;
          return Math.max(0.1, Math.min(1.0, numVal));
        }
      }
    },
    customFooter: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Custom footer cannot exceed 500 characters']
    }
  },

  // Scheduling Preferences
  scheduling: {
    workingHours: {
      monday: {
        isWorking: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' }
      },
      tuesday: {
        isWorking: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' }
      },
      wednesday: {
        isWorking: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' }
      },
      thursday: {
        isWorking: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' }
      },
      friday: {
        isWorking: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' }
      },
      saturday: {
        isWorking: { type: Boolean, default: false },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '13:00' }
      },
      sunday: {
        isWorking: { type: Boolean, default: false },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '13:00' }
      }
    },
    appointmentDuration: {
      type: Number,
      min: [15, 'Appointment duration must be at least 15 minutes'],
      max: [480, 'Appointment duration cannot exceed 480 minutes'],
      default: 60,
      enum: [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480],
      set: function(val) {
        // Ensure appointment duration is valid and convert to number
        if (val === null || val === undefined || val === '') return 60;
        const numVal = Number(val);
        if (isNaN(numVal)) return 60;
        // Find closest valid value
        const validValues = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480];
        return validValues.reduce((prev, curr) => 
          Math.abs(curr - numVal) < Math.abs(prev - numVal) ? curr : prev
        );
      }
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true
    },
    bufferTime: {
      before: {
        type: Number,
        min: [0, 'Buffer time cannot be negative'],
        max: [60, 'Buffer time cannot exceed 60 minutes'],
        default: 15,
        set: function(val) {
          // Ensure buffer time is valid and convert to number
          if (val === null || val === undefined || val === '') return 15;
          const numVal = Number(val);
          if (isNaN(numVal)) return 15;
          return Math.max(0, Math.min(60, numVal));
        }
      },
      after: {
        type: Number,
        min: [0, 'Buffer time cannot be negative'],
        max: [60, 'Buffer time cannot exceed 60 minutes'],
        default: 15,
        set: function(val) {
          // Ensure buffer time is valid and convert to number
          if (val === null || val === undefined || val === '') return 15;
          const numVal = Number(val);
          if (isNaN(numVal)) return 15;
          return Math.max(0, Math.min(60, numVal));
        }
      }
    }
  }
}, { 
  timestamps: true,
  // Better error handling for validation
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
vaultSchema.index({ advisorId: 1 });
vaultSchema.index({ 'whiteLabel.isEnabled': 1 });
vaultSchema.index({ status: 1 });
vaultSchema.index({ email: 1 });

// Enhanced data sanitization middleware - runs before validation
vaultSchema.pre('save', function(next) {
  try {
    // Sanitize string fields with null checks
    if (this.firstName !== undefined) this.firstName = String(this.firstName || '').trim();
    if (this.lastName !== undefined) this.lastName = String(this.lastName || '').trim();
    if (this.email !== undefined) this.email = String(this.email || '').toLowerCase().trim();
    if (this.phoneNumber !== undefined) this.phoneNumber = String(this.phoneNumber || '').trim();
    if (this.firmName !== undefined) this.firmName = String(this.firmName || '').trim();
    if (this.sebiRegNumber !== undefined) this.sebiRegNumber = String(this.sebiRegNumber || '').toUpperCase().trim();
    if (this.arnNumber !== undefined) this.arnNumber = String(this.arnNumber || '').toUpperCase().trim();
    
    // Ensure boolean fields are actually boolean
    if (this.isEmailVerified !== undefined) this.isEmailVerified = Boolean(this.isEmailVerified);
    
    // Sanitize branding data
    if (this.branding) {
      if (this.branding.logo) {
        if (this.branding.logo.altText !== undefined) {
          this.branding.logo.altText = String(this.branding.logo.altText || '').trim();
        }
        if (this.branding.logo.url !== undefined) {
          this.branding.logo.url = String(this.branding.logo.url || '').trim();
        }
      }
      if (this.branding.tagline !== undefined) {
        this.branding.tagline = String(this.branding.tagline || '').trim();
      }
    }
    
    // Sanitize digital presence
    if (this.digitalPresence) {
      Object.keys(this.digitalPresence).forEach(key => {
        if (this.digitalPresence[key] !== undefined) {
          this.digitalPresence[key] = String(this.digitalPresence[key] || '').trim();
        }
      });
    }
    
    // Sanitize white label data
    if (this.whiteLabel) {
      if (this.whiteLabel.isEnabled !== undefined) {
        this.whiteLabel.isEnabled = Boolean(this.whiteLabel.isEnabled);
      }
      if (this.whiteLabel.companyName !== undefined) {
        this.whiteLabel.companyName = String(this.whiteLabel.companyName || '').trim();
      }
      if (this.whiteLabel.customDomain !== undefined) {
        this.whiteLabel.customDomain = String(this.whiteLabel.customDomain || '').trim();
      }
    }
    
    // Sanitize report customization
    if (this.reportCustomization) {
      if (this.reportCustomization.customFooter !== undefined) {
        this.reportCustomization.customFooter = String(this.reportCustomization.customFooter || '').trim();
      }
      if (this.reportCustomization.watermark) {
        if (this.reportCustomization.watermark.isEnabled !== undefined) {
          this.reportCustomization.watermark.isEnabled = Boolean(this.reportCustomization.watermark.isEnabled);
        }
        if (this.reportCustomization.watermark.text !== undefined) {
          this.reportCustomization.watermark.text = String(this.reportCustomization.watermark.text || '').trim();
        }
      }
    }
    
    // Sanitize working hours
    if (this.scheduling?.workingHours) {
      Object.keys(this.scheduling.workingHours).forEach(day => {
        const dayConfig = this.scheduling.workingHours[day];
        if (dayConfig) {
          if (dayConfig.isWorking !== undefined) dayConfig.isWorking = Boolean(dayConfig.isWorking);
          if (dayConfig.startTime !== undefined) dayConfig.startTime = String(dayConfig.startTime || '09:00').trim();
          if (dayConfig.endTime !== undefined) dayConfig.endTime = String(dayConfig.endTime || '17:00').trim();
        }
      });
    }
    
    // Ensure certifications and memberships have proper types
    if (this.certifications && Array.isArray(this.certifications)) {
      this.certifications.forEach(cert => {
        if (cert.name !== undefined) cert.name = String(cert.name || '').trim();
        if (cert.issuingBody !== undefined) cert.issuingBody = String(cert.issuingBody || '').trim();
        if (cert.certificateNumber !== undefined) cert.certificateNumber = String(cert.certificateNumber || '').trim();
        if (cert.isActive !== undefined) cert.isActive = Boolean(cert.isActive);
      });
    }
    
    if (this.memberships && Array.isArray(this.memberships)) {
      this.memberships.forEach(membership => {
        if (membership.organization !== undefined) membership.organization = String(membership.organization || '').trim();
        if (membership.membershipType !== undefined) membership.membershipType = String(membership.membershipType || '').trim();
        if (membership.membershipNumber !== undefined) membership.membershipNumber = String(membership.membershipNumber || '').trim();
        if (membership.isActive !== undefined) membership.isActive = Boolean(membership.isActive);
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error in pre-save middleware:', error);
    next(error);
  }
});

// Enhanced validation error handling
vaultSchema.post('validate', function(error, doc, next) {
  if (error) {
    logger.error('Vault validation error:', error.message);
    const validationErrors = Object.keys(error.errors || {}).map(key => ({
      field: key,
      message: error.errors[key].message,
      value: error.errors[key].value
    }));
    logger.error('Detailed validation errors:', validationErrors);
  }
  next(error);
});

// Mongoose middleware for logging database operations
vaultSchema.pre('save', function(next) {
  const startTime = Date.now();
  
  // Log the operation
  const isNew = this.isNew;
  const operation = isNew ? 'create' : 'update';
  const vaultId = this._id || 'new';
  const advisorId = this.advisorId || 'unknown';
  
  logger.debug(`DB Operation started: Vault.${operation} for ID: ${vaultId} (Advisor: ${advisorId})`);
  
  // Store start time for post middleware
  this._startTime = startTime;
  
  next();
});

vaultSchema.post('save', function(doc, next) {
  const duration = Date.now() - this._startTime;
  const operation = doc.isNew ? 'create' : 'update';
  
  logDatabase.queryExecution('Vault', operation, duration);
  logger.info(`DB Operation completed: Vault.${operation} for ID: ${doc._id} (Advisor: ${doc.advisorId}) in ${duration}ms`);
  
  next();
});

vaultSchema.post('save', function(error, doc, next) {
  if (error) {
    logDatabase.operationError('Vault.save', error);
    logger.error(`DB Operation failed: Vault.save for ID: ${doc?._id || 'unknown'} (Advisor: ${doc?.advisorId || 'unknown'}) - ${error.message}`);
  }
  next(error);
});

// Log find operations
vaultSchema.pre(/^find/, function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: Vault.${this.getOptions().op || 'find'}`);
});

vaultSchema.post(/^find/, function(result) {
  const duration = Date.now() - this._startTime;
  const operation = this.getOptions().op || 'find';
  const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
  
  logDatabase.queryExecution('Vault', operation, duration);
  logger.debug(`DB Operation completed: Vault.${operation} returned ${resultCount} document(s) in ${duration}ms`);
});

vaultSchema.post(/^find/, function(error, result, next) {
  if (error) {
    const operation = this.getOptions().op || 'find';
    logDatabase.operationError(`Vault.${operation}`, error);
    logger.error(`DB Operation failed: Vault.${operation} - ${error.message}`);
  }
  if (next) next(error);
});

// Log remove operations
vaultSchema.pre('remove', function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: Vault.remove for ID: ${this._id}`);
});

vaultSchema.post('remove', function(doc) {
  const duration = Date.now() - this._startTime;
  logDatabase.queryExecution('Vault', 'remove', duration);
  logger.info(`DB Operation completed: Vault.remove for ID: ${doc._id} in ${duration}ms`);
});

module.exports = mongoose.model('Vault', vaultSchema);