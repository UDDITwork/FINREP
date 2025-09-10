// File: backend/models/EstateInformation.js
/**

 * - Estate metadata and planning status
 */

const mongoose = require('mongoose');

const estateInformationSchema = new mongoose.Schema({
  // Client Reference
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    unique: true
  },
  
  // FAMILY & BENEFICIARIES
  familyStructure: {
    // Spouse Details
    spouse: {
      exists: { type: Boolean, default: false },
      fullName: String,
      dateOfBirth: Date,
      panNumber: String,
      occupation: String,
      employerName: String,
      monthlyIncome: Number,
      marriageDate: Date,
      marriagePlace: String,
      contactNumber: String
    },
    
    // Children Details
    children: [{
      fullName: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      panNumber: String,
      relationshipType: { type: String, enum: ['biological', 'adopted'], default: 'biological' },
      educationStatus: String,
      currentInstitution: String,
      specialNeeds: { type: Boolean, default: false },
      specialNeedsDetails: String,
      isMinor: { type: Boolean, default: true },
      guardianRequired: { type: Boolean, default: true },
      contactNumber: String
    }],
    
    // Parents & Other Dependents
    dependents: [{
      fullName: { type: String, required: true },
      relationship: { 
        type: String, 
        enum: ['father', 'mother', 'father-in-law', 'mother-in-law', 'sibling', 'other'],
        required: true 
      },
      dateOfBirth: Date,
      panNumber: String,
      dependencyStatus: { type: Boolean, default: false },
      monthlySupport: { type: Number, default: 0 },
      medicalConditions: String,
      contactNumber: String,
      address: String
    }],
    
    // Estate Beneficiaries
    beneficiaries: [{
      beneficiaryName: { type: String, required: true },
      relationship: { type: String, required: true },
      contactNumber: String,
      emailAddress: String,
      address: String,
      inheritancePercentage: { type: Number, min: 0, max: 100 },
      specificAssets: [String],
      inheritanceConditions: String, // age milestones, education completion, etc.
      contingentBeneficiary: { type: Boolean, default: false },
      isMinor: { type: Boolean, default: false },
      guardianDetails: String
    }]
  },
  
  // REAL ESTATE PROPERTIES
  realEstateProperties: [{
    propertyId: String,
    propertyType: { 
      type: String, 
      enum: ['residential-house', 'residential-apartment', 'commercial-office', 'commercial-shop', 'agricultural-land', 'residential-plot', 'industrial'], 
      required: true 
    },
    propertySubType: String, // villa, studio, warehouse, etc.
    
    // Address Details
    propertyAddress: {
      plotNumber: String,
      buildingName: String,
      street: String,
      area: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: String,
      landmark: String
    },
    
    // Ownership Details
    ownershipDetails: {
      ownershipType: { 
        type: String, 
        enum: ['sole', 'joint', 'tenancy-in-common', 'tenancy-by-entirety'], 
        default: 'sole' 
      },
      ownershipPercentage: { type: Number, min: 0, max: 100, default: 100 },
      coOwners: [{
        name: String,
        relationship: String,
        ownershipShare: Number
      }]
    },
    
    // Financial Information
    financialDetails: {
      purchaseDate: Date,
      purchaseValue: Number,
      currentMarketValue: { type: Number, required: true },
      registrationValue: Number,
      stampDutyPaid: Number,
      registrationFeesPaid: Number,
      lastValuationDate: Date,
      valuationMethod: String // market comparison, rental yield, etc.
    },
    
    // Legal Documentation
    legalDocuments: {
      hasTitleDeed: { type: Boolean, default: false },
      titleDeedNumber: String,
      isRegistered: { type: Boolean, default: false },
      registrationDate: Date,
      registrationOffice: String,
      mutationCompleted: { type: Boolean, default: false },
      mutationNumber: String,
      hasApprovedPlan: { type: Boolean, default: false },
      hasOccupancyCertificate: { type: Boolean, default: false },
      documentLocation: String,
      legalIssues: String
    },
    
    // Rental Information
    rentalDetails: {
      isRented: { type: Boolean, default: false },
      monthlyRent: Number,
      securityDeposit: Number,
      tenantName: String,
      tenantContact: String,
      leaseStartDate: Date,
      leaseEndDate: Date,
      rentAgreementRegistered: { type: Boolean, default: false }
    },
    
    // Loan Against Property
    propertyLoan: {
      hasLoan: { type: Boolean, default: false },
      bankName: String,
      loanAccountNumber: String,
      originalLoanAmount: Number,
      outstandingAmount: Number,
      monthlyEMI: Number,
      interestRate: Number,
      loanStartDate: Date,
      loanEndDate: Date
    },
    
    // Property Specific Details
    propertySpecifics: {
      builtUpArea: Number, // in sq ft
      carpetArea: Number,
      plotArea: Number,
      numberOfRooms: Number,
      numberOfFloors: Number,
      parkingSpaces: Number,
      furnishingStatus: String,
      ageOfProperty: Number,
      maintenanceCharges: Number
    }
  }],
  
  // LEGAL DOCUMENTS STATUS
  legalDocumentsStatus: {
    // Will Information
    willDetails: {
      hasWill: { type: Boolean, default: false },
      willType: { type: String, enum: ['registered', 'unregistered', 'notarized'], default: 'unregistered' },
      dateOfWill: Date,
      willRegistrationNumber: String,
      registrarOffice: String,
      
      // Executor Details
      executorDetails: {
        primaryExecutor: String,
        primaryExecutorContact: String,
        primaryExecutorRelation: String,
        backupExecutor: String,
        backupExecutorContact: String,
        backupExecutorRelation: String,
        executorCompensation: Number
      },
      
      // Witness Information
      witnesses: [{
        witnessName: String,
        witnessContact: String,
        witnessAddress: String
      }],
      
      documentStorage: {
        originalLocation: String,
        copiesLocation: String,
        digitalCopyExists: { type: Boolean, default: false },
        accessInstructions: String
      },
      
      lastUpdated: Date,
      updateRequired: { type: Boolean, default: false },
      updateReasons: [String]
    },
    
    // Trust Information
    trustStructures: [{
      trustName: String,
      trustType: { type: String, enum: ['revocable', 'irrevocable', 'charitable', 'family'], required: true },
      dateOfCreation: Date,
      trustDeedNumber: String,
      registrationDetails: String,
      
      // Trustees
      trustees: [{
        trusteeName: { type: String, required: true },
        trusteeType: { type: String, enum: ['individual', 'corporate'], default: 'individual' },
        contactDetails: String,
        role: String, // managing trustee, successor trustee
        compensation: Number
      }],
      
      // Trust Beneficiaries
      trustBeneficiaries: [{
        beneficiaryName: String,
        beneficiaryType: { type: String, enum: ['income', 'principal', 'both'], default: 'both' },
        distributionPercentage: Number,
        distributionConditions: String
      }],
      
      // Trust Assets
      trustAssets: [{
        assetType: String, // cash, property, stocks, etc.
        assetDescription: String,
        assetValue: Number,
        dateTransferred: Date
      }],
      
      totalTrustValue: Number,
      trustPurpose: String,
      trustTerm: String, // perpetual, specific years, until event
      trustStatus: { type: String, enum: ['active', 'terminated', 'dormant'], default: 'active' }
    }],
    
    // Power of Attorney
    powerOfAttorney: {
      hasPOA: { type: Boolean, default: false },
      poaType: { type: String, enum: ['general', 'specific', 'durable', 'medical', 'financial'] },
      
      // Appointee Details
      appointeeDetails: {
        appointeeName: String,
        appointeeContact: String,
        appointeeRelation: String,
        appointeeAddress: String,
        backupAppointee: String,
        backupAppointeeContact: String
      },
      
      scopeOfPowers: String,
      specificLimitations: String,
      effectiveDate: Date,
      expirationDate: Date,
      revocable: { type: Boolean, default: true },
      
      // Registration Details
      registrationDetails: {
        isRegistered: { type: Boolean, default: false },
        registrationDate: Date,
        registrarOffice: String,
        registrationNumber: String
      },
      
      documentLocation: String,
      lastReviewed: Date
    },
    
    // Nominations Across Assets
    nominations: [{
      assetType: { 
        type: String, 
        enum: ['bank-account', 'insurance-policy', 'pf-account', 'gratuity', 'mutual-fund', 'demat-account', 'nps', 'ppf'], 
        required: true 
      },
      institutionName: String,
      accountNumber: String,
      policyNumber: String,
      
      // Nominee Details
      nomineeDetails: {
        nomineeName: { type: String, required: true },
        nomineeRelation: String,
        nomineeContact: String,
        nomineeAddress: String,
        nomineePan: String,
        nomineeAge: Number,
        nominationPercentage: { type: Number, default: 100 },
        isMinorNominee: { type: Boolean, default: false }
      },
      
      // Guardian for Minor Nominee
      guardianDetails: {
        guardianName: String,
        guardianRelation: String,
        guardianContact: String,
        guardianAddress: String
      },
      
      nominationDate: Date,
      lastUpdated: Date,
      needsUpdate: { type: Boolean, default: false }
    }]
  },
  
  // PERSONAL & DIGITAL ASSETS
  personalAssets: {
    // Vehicles
    vehicles: [{
      vehicleType: { type: String, enum: ['car', 'motorcycle', 'truck', 'bus', 'other'], required: true },
      brand: String,
      model: String,
      year: Number,
      registrationNumber: { type: String, required: true },
      chassisNumber: String,
      engineNumber: String,
      currentMarketValue: Number,
      purchaseValue: Number,
      purchaseDate: Date,
      
      // Loan Details
      vehicleLoan: {
        hasLoan: { type: Boolean, default: false },
        bankName: String,
        outstandingAmount: Number,
        monthlyEMI: Number,
        loanEndDate: Date
      },
      
      // Insurance
      insurance: {
        insuranceCompany: String,
        policyNumber: String,
        premiumAmount: Number,
        expiryDate: Date,
        idv: Number // Insured Declared Value
      },
      
      registrationExpiryDate: Date,
      fitnessExpiryDate: Date,
      permitDetails: String
    }],
    
    // Jewelry & Valuables
    valuables: [{
      itemCategory: { 
        type: String, 
        enum: ['gold-jewelry', 'diamond-jewelry', 'silver-items', 'precious-stones', 'artwork', 'antiques', 'collectibles', 'other'], 
        required: true 
      },
      itemDescription: { type: String, required: true },
      estimatedValue: { type: Number, required: true },
      purchaseValue: Number,
      purchaseDate: Date,
      valuationDate: Date,
      valuationCertificate: String,
      
      // Storage Location
      storageLocation: { type: String, enum: ['home', 'bank-locker', 'safe-deposit', 'other'], required: true },
      bankLockerDetails: {
        bankName: String,
        branchName: String,
        lockerNumber: String,
        nomineeOnLocker: String
      },
      
      // Insurance
      isInsured: { type: Boolean, default: false },
      insuranceDetails: {
        insuranceCompany: String,
        policyNumber: String,
        insuredValue: Number,
        premiumAmount: Number,
        policyExpiryDate: Date
      },
      
      photographs: [String], // file paths
      appraisalCertificates: [String]
    }],
    
    // Digital Assets
    digitalAssets: {
      // Cryptocurrency
      cryptocurrency: [{
        platform: { type: String, required: true }, // Binance, WazirX, CoinBase, etc.
        coinType: [String], // Bitcoin, Ethereum, etc.
        walletType: { type: String, enum: ['exchange', 'hardware', 'software', 'paper'] },
        walletAddress: String,
        estimatedValue: Number,
        lastUpdatedValue: Date,
        
        // Security Details
        privateKeyLocation: String,
        seedPhraseLocation: String,
        accessInstructions: String,
        securityMeasures: String
      }],
      
      // Digital Accounts
      digitalAccounts: [{
        platform: { type: String, required: true }, // Google, Facebook, LinkedIn, etc.
        accountType: String, // personal, business, creator
        username: String,
        associatedEmail: String,
        accountValue: Number, // for monetized accounts
        
        // Access Information
        recoveryEmail: String,
        recoveryPhone: String,
        twoFactorMethod: String,
        accessInstructions: String,
        
        // Business Accounts
        isMonetized: { type: Boolean, default: false },
        monthlyRevenue: Number,
        businessRegistration: String
      }],
      
      // Intellectual Property
      intellectualProperty: [{
        ipType: { type: String, enum: ['patent', 'trademark', 'copyright', 'trade-secret', 'domain'], required: true },
        title: String,
        description: String,
        registrationNumber: String,
        registrationDate: Date,
        expiryDate: Date,
        estimatedValue: Number,
        
        // Revenue Generation
        generatesRevenue: { type: Boolean, default: false },
        annualRevenue: Number,
        licenseAgreements: [String],
        
        registeredCountries: [String],
        legalDocumentLocation: String
      }]
    }
  },
  
  // ESTATE PLANNING PREFERENCES
  estatePreferences: {
    // Legal Framework
    applicableLaws: {
      religion: { type: String, enum: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Other'], required: true },
      personalLaw: String, // Hindu Succession Act, Muslim Personal Law, Indian Succession Act
      marriageLaw: String, // Hindu Marriage Act, Special Marriage Act, etc.
      specialConsiderations: String,
      ancestralProperty: { type: Boolean, default: false },
      coparcenaryRights: String
    },
    
    // Distribution Strategy
    distributionPreferences: {
      distributionMethod: { type: String, enum: ['equal', 'need-based', 'contribution-based', 'custom'], required: true },
      
      // Asset-wise Distribution
      assetDistribution: [{
        assetCategory: { type: String, enum: ['cash', 'real-estate', 'investments', 'business', 'personal-assets', 'all'], required: true },
        beneficiaryAllocations: [{
          beneficiaryName: String,
          allocationPercentage: Number,
          allocationConditions: String // age, education, marriage milestones
        }]
      }],
      
      // Special Bequests
      specificBequests: [{
        itemDescription: String,
        beneficiaryName: String,
        sentimentalValue: String,
        monetaryValue: Number
      }],
      
      // Contingency Plans
      contingencyPlan: {
        primaryBeneficiaryUnavailable: String,
        simultaneousDeathClause: String,
        commonDisasterClause: String
      }
    },
    
    // Guardianship for Dependents
    guardianshipArrangements: [{
      dependentName: String,
      dependentType: { type: String, enum: ['minor-child', 'adult-dependent', 'elderly-parent'], required: true },
      
      // Guardian Selection
      guardianPreferences: {
        primaryGuardian: String,
        primaryGuardianContact: String,
        backupGuardian: String,
        backupGuardianContact: String,
        guardianshipType: { type: String, enum: ['personal', 'financial', 'both'], default: 'both' }
      },
      
      // Financial Arrangements
      financialProvisions: {
        monthlyAllowance: Number,
        educationFund: Number,
        healthcareFund: Number,
        emergencyFund: Number,
        trustFundRequired: { type: Boolean, default: false }
      },
      
      guardianInstructions: String,
      specialNeeds: String
    }],
    
    // Charitable Giving
    philanthropy: [{
      organizationType: { type: String, enum: ['registered-ngo', 'educational-institution', 'religious-organization', 'healthcare', 'other'] },
      organizationName: String,
      organizationDetails: String,
      donationType: { type: String, enum: ['fixed-amount', 'percentage', 'specific-asset'], required: true },
      donationAmount: Number,
      donationPercentage: Number,
      specificAsset: String,
      donationPurpose: String,
      taxBenefits: { type: Boolean, default: true }
    }],
    
    // Business Succession (if applicable)
    businessSuccession: {
      hasBusinessInterest: { type: Boolean, default: false },
      businessDetails: [{
        businessName: String,
        businessType: String,
        ownershipPercentage: Number,
        currentValuation: Number,
        
        // Succession Plan
        successionPlan: {
          successorName: String,
          successorRelation: String,
          transitionPeriod: String,
          managementTransition: String,
          employeeProvisions: String
        },
        
        partnershipAgreements: String,
        buyoutClauses: String
      }]
    },
    
    // International Considerations
    internationalAssets: {
      hasInternationalAssets: { type: Boolean, default: false },
      countries: [String],
      assetTypes: [String],
      treatyBenefits: String,
      taxCompliance: String,
      foreignWillRequired: { type: Boolean, default: false }
    }
  },
  
  // HEALTHCARE & END-OF-LIFE DIRECTIVES
  healthcareDirectives: {
    // Medical Information
    medicalProfile: {
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
      chronicConditions: [String],
      currentMedications: [String],
      knownAllergies: [String],
      medicalHistory: String,
      emergencyMedicalContact: String,
      primaryPhysician: {
        doctorName: String,
        hospital: String,
        contactNumber: String,
        specialty: String
      }
    },
    
    // Healthcare Decision Making
    healthcareDecisions: {
      medicalPowerOfAttorney: {
        hasDesignated: { type: Boolean, default: false },
        appointeeName: String,
        appointeeContact: String,
        appointeeRelation: String,
        scopeOfAuthority: String,
        backupAppointee: String
      },
      
      hospitalPreferences: {
        preferredHospital: String,
        preferredLocation: String,
        specialInstructions: String,
        insuranceCoverage: String
      },
      
      treatmentPreferences: {
        lifeSustaining: { type: String, enum: ['all-measures', 'comfort-only', 'limited-intervention'] },
        organDonation: {
          isOrganDonor: { type: Boolean, default: false },
          organsSpecified: [String],
          organDonationCard: String,
          donationCardNumber: String
        },
        bodyDonation: {
          isBodyDonor: { type: Boolean, default: false },
          donationInstitution: String
        },
        bloodDonation: { type: Boolean, default: false }
      }
    },
    
    // Final Arrangements
    finalArrangements: {
      funeralPreferences: {
        ceremonialType: { type: String, enum: ['burial', 'cremation', 'religious-specific', 'other'] },
        specificRites: String,
        ceremonialLocation: String,
        religiousConsiderations: { type: Boolean, default: true },
        
        // Financial Arrangements
        budgetAllocation: Number,
        prepaidArrangements: { type: Boolean, default: false },
        arrangementProvider: String,
        policyNumber: String
      },
      
      memorialPreferences: {
        memorialType: { type: String, enum: ['headstone', 'plaque', 'tree-planting', 'donation', 'none', 'other'] },
        memorialLocation: String,
        inscriptionPreferences: String,
        memorialFund: Number
      },
      
      finalInstructions: String,
      documentsLocation: String
    }
  },
  
  // ESTATE METADATA
  estateMetadata: {
    estimatedNetEstate: Number,
    estateTaxLiability: Number,
    successionComplexity: { type: String, enum: ['simple', 'moderate', 'complex'], default: 'moderate' },
    legalReviewRequired: { type: Boolean, default: true },
    documentationGaps: [String],
    priorityActions: [String],
    lastReviewed: Date,
    nextReviewDate: Date,
    estateAdvisor: String,
    legalCounsel: String
  }
}, {
  timestamps: true
});

// Indexes
estateInformationSchema.index({ clientId: 1 }, { unique: true });
estateInformationSchema.index({ 'familyStructure.spouse.fullName': 1 });
estateInformationSchema.index({ 'realEstateProperties.propertyType': 1 });
estateInformationSchema.index({ 'legalDocumentsStatus.willDetails.hasWill': 1 });

module.exports = mongoose.model('EstateInformation', estateInformationSchema);
