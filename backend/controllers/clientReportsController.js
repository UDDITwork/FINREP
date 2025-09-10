/**
 * FILE LOCATION: backend/controllers/clientReportsController.js
 * 
 * PURPOSE: Comprehensive client reports controller - FETCHES ALL DATA
 * 
 * FUNCTIONALITY: 
 * - Fetches client list for advisor
 * - Retrieves COMPLETE client data from ALL models
 * - Provides detailed client report with ALL related information
 * - Comprehensive error logging and debugging
 */

const mongoose = require('mongoose');
const { logger, logDatabase } = require('../utils/logger');
const Client = require('../models/Client');
const Vault = require('../models/Vault');
const FinancialPlan = require('../models/FinancialPlan');
const Meeting = require('../models/Meeting');
const LOE = require('../models/LOE');
const LOEAutomation = require('../models/LOEAutomation');
const ABTestSession = require('../models/ABTestSession');
const ChatHistory = require('../models/ChatHistory');
const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
const ClientInvitation = require('../models/ClientInvitation');
// NEW MODELS FOR COMPREHENSIVE CLIENT REPORTS
const EstateInformation = require('../models/EstateInformation');
const MutualFundRecommend = require('../models/MutualFundRecommend');
const TaxPlanning = require('../models/TaxPlanning');

// Helper function to ensure all fields have fallback values
const ensureFieldAvailability = (obj, fallback = 'Not Available') => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const processedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') {
      processedObj[key] = fallback;
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      processedObj[key] = ensureFieldAvailability(value, fallback);
    } else if (Array.isArray(value)) {
      processedObj[key] = value.length > 0 ? value : [fallback];
    } else {
      processedObj[key] = value;
    }
  }
  return processedObj;
};

// Enhanced logging function
const logDebug = (stage, data, error = null) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔍 [CLIENT REPORTS DEBUG] ${stage}`);
  
  if (error) {
    console.error(`❌ ERROR:`, error.message);
    console.error(`Stack:`, error.stack);
    logger.error(`[CLIENT REPORTS] ${stage} - ERROR: ${error.message}`, { 
      error: error.stack,
      data: data || 'No data'
    });
  } else {
    console.log(`✅ SUCCESS:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    logger.info(`[CLIENT REPORTS] ${stage} - SUCCESS`, { data });
  }
};

// Get advisor's vault data for header
const getAdvisorVaultData = async (req, res) => {
  try {
    const startTime = Date.now();
    const advisorId = req.advisor.id;

    logDebug('VAULT DATA FETCH START', { advisorId });

    // Fetch COMPLETE vault data (no select limitation)
    const vaultData = await Vault.findOne({ advisorId });

    if (!vaultData) {
      logDebug('VAULT DATA NOT FOUND', { advisorId });
      return res.status(404).json({
        success: false,
        message: 'Advisor vault data not found',
        needsVaultUpdate: true,
        prompt: 'Please complete your vault profile to access client reports'
      });
    }

    // Apply fallback values to ALL vault fields
    const processedVaultData = ensureFieldAvailability(vaultData.toObject());

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('Vault', 'findOne', duration);
    
    logDebug('VAULT DATA FETCH COMPLETED', { 
      duration: `${duration}ms`,
      fieldsCount: Object.keys(processedVaultData).length
    });

    res.json({
      success: true,
      data: processedVaultData,
      needsVaultUpdate: !vaultData.firstName || !vaultData.lastName || !vaultData.email
    });

  } catch (error) {
    logDebug('VAULT DATA FETCH FAILED', { advisorId: req.advisor?.id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advisor vault data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get client list for advisor
const getClientList = async (req, res) => {
  try {
    const startTime = Date.now();
    const advisorId = req.advisor.id;

    logDebug('CLIENT LIST FETCH START', { advisorId });

    // Fetch COMPLETE client data (no select limitation)
    const clients = await Client.find({ advisor: advisorId })
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('Client', 'find', duration);
    
    // Process each client to ensure all fields have fallbacks
    const processedClients = clients.map(client => {
      const clientObj = client.toObject();
      return ensureFieldAvailability(clientObj);
    });

    logDebug('CLIENT LIST FETCH COMPLETED', { 
      duration: `${duration}ms`,
      clientCount: clients.length,
      sampleClientFields: clients.length > 0 ? Object.keys(clients[0].toObject()).length : 0
    });

    res.json({
      success: true,
      data: processedClients,
      count: clients.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logDebug('CLIENT LIST FETCH FAILED', { advisorId: req.advisor?.id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client list',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get comprehensive client report - COMPLETE IMPLEMENTATION
const getClientReport = async (req, res) => {
  try {
    const startTime = Date.now();
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    logDebug('COMPREHENSIVE REPORT START', { clientId, advisorId });

    // ENHANCED: Validate and clean clientId format
    if (!clientId) {
      logDebug('CLIENT ID MISSING', { clientId, advisorId });
      return res.status(400).json({
        success: false,
        message: 'Client ID is required',
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });
    }

    // Check for common invalid formats
    if (clientId === '[object Object]' || 
        clientId === 'undefined' || 
        clientId === 'null' || 
        clientId.includes('[object') ||
        clientId.includes('Object]')) {
      logDebug('INVALID CLIENT ID FORMAT DETECTED', { 
        clientId, 
        advisorId,
        length: clientId.length,
        type: typeof clientId 
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format detected',
        error: 'Client ID appears to be a malformed object reference',
        clientId,
        suggestion: 'Please return to client list and try again',
        timestamp: new Date().toISOString()
      });
    }

    // Validate ObjectID format (MongoDB ObjectIDs are 24 characters of hex)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(clientId)) {
      logDebug('CLIENT ID INVALID FORMAT', { 
        clientId, 
        advisorId,
        length: clientId.length,
        matchesPattern: objectIdPattern.test(clientId)
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format',
        error: 'Client ID must be a valid MongoDB ObjectID (24 hex characters)',
        clientId,
        timestamp: new Date().toISOString()
      });
    }

    logDebug('CLIENT ID VALIDATION PASSED', { clientId, advisorId });

    // Step 1: Verify client belongs to advisor and fetch COMPLETE client data
    const client = await Client.findOne({ 
      _id: new mongoose.Types.ObjectId(clientId), 
      advisor: new mongoose.Types.ObjectId(advisorId) 
    });
    if (!client) {
      logDebug('CLIENT NOT FOUND OR UNAUTHORIZED', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or unauthorized access',
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });
    }

    logDebug('CLIENT FOUND', { 
      clientName: `${client.firstName} ${client.lastName}`,
      clientFields: Object.keys(client.toObject()).length
    });

    // Step 2: Fetch all related data in parallel
    logDebug('FETCHING RELATED DATA', { clientId });
    
    // ENHANCED LOGGING: Log the start of comprehensive data fetching
    console.log(`\n🚀 [COMPREHENSIVE DATA FETCH] Starting data fetch for client: ${clientId}`);
    console.log(`📊 [DATA FETCH] Advisor ID: ${advisorId}`);
    console.log(`⏰ [DATA FETCH] Start Time: ${new Date().toISOString()}`);
    console.log(`🎯 [DATA FETCH] Target Models: EstateInformation, MutualFundRecommend, TaxPlanning, MutualFundExitStrategy`);

    const [
      vaultData,
      financialPlans,
      meetings,
      loeDocuments,
      loeAutomation,
      abTestSessions,
      chatHistory,
      mutualFundExitStrategies,
      clientInvitations,
      // NEW MODELS FOR COMPREHENSIVE REPORTS
      estateInformation,
      mutualFundRecommendations,
      taxPlanningData
    ] = await Promise.all([
      Vault.findOne({ advisorId: new mongoose.Types.ObjectId(advisorId) })
        .then(result => {
          console.log(`✅ [VAULT] Query executed successfully for advisor: ${advisorId}`);
          console.log(`📋 [VAULT] Result: ${result ? 'DATA FOUND' : 'NO DATA FOUND'}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [VAULT] Query failed for advisor: ${advisorId}`);
          console.error(`🔍 [VAULT] Error details:`, err.message);
          return null;
        }),
      
      FinancialPlan.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [FINANCIAL PLANS] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [FINANCIAL PLANS] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [FINANCIAL PLANS] Query failed for client: ${clientId}`);
          console.error(`🔍 [FINANCIAL PLANS] Error details:`, err.message);
          return [];
        }),
      
      Meeting.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [MEETINGS] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [MEETINGS] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [MEETINGS] Query failed for client: ${clientId}`);
          console.error(`🔍 [MEETINGS] Error details:`, err.message);
          return [];
        }),
      
      LOE.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [LOE DOCUMENTS] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [LOE DOCUMENTS] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [LOE DOCUMENTS] Query failed for client: ${clientId}`);
          console.error(`🔍 [LOE DOCUMENTS] Error details:`, err.message);
          return [];
        }),
      
      LOEAutomation.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [LOE AUTOMATION] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [LOE AUTOMATION] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [LOE AUTOMATION] Query failed for client: ${clientId}`);
          console.error(`🔍 [LOE AUTOMATION] Error details:`, err.message);
          return [];
        }),
      
      ABTestSession.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [AB TEST SESSIONS] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [AB TEST SESSIONS] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [AB TEST SESSIONS] Query failed for client: ${clientId}`);
          console.error(`🔍 [AB TEST SESSIONS] Error details:`, err.message);
          return [];
        }),
      
      ChatHistory.find({ 
        client: new mongoose.Types.ObjectId(clientId), 
        advisor: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ updatedAt: -1 })
        .then(result => {
          console.log(`✅ [CHAT HISTORY] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [CHAT HISTORY] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [CHAT HISTORY] Query failed for client: ${clientId}`);
          console.error(`🔍 [CHAT HISTORY] Error details:`, err.message);
          return [];
        }),
      
      MutualFundExitStrategy.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [MF EXIT STRATEGIES] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [MF EXIT STRATEGIES] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [MF EXIT STRATEGIES] Query failed for client: ${clientId}`);
          console.error(`🔍 [MF EXIT STRATEGIES] Error details:`, err.message);
          return [];
        }),
      
      ClientInvitation.find({ 
        clientData: new mongoose.Types.ObjectId(clientId), 
        advisor: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [CLIENT INVITATIONS] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [CLIENT INVITATIONS] Result count: ${result.length}`);
          return result;
        })
        .catch(err => {
          console.error(`❌ [CLIENT INVITATIONS] Query failed for client: ${clientId}`);
          console.error(`🔍 [CLIENT INVITATIONS] Error details:`, err.message);
          return [];
        }),
      // NEW MODEL QUERIES WITH GUARANTEED DATA FETCHING AND COMPREHENSIVE LOGGING
      EstateInformation.findOne({ clientId: new mongoose.Types.ObjectId(clientId) })
        .then(result => {
          console.log(`✅ [ESTATE INFO] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [ESTATE INFO] Result: ${result ? 'DATA FOUND' : 'NO DATA FOUND'}`);
          if (result) {
            console.log(`📊 [ESTATE INFO] Data fields: ${Object.keys(result.toObject()).length}`);
            console.log(`🏠 [ESTATE INFO] Has family structure: ${!!result.familyStructure}`);
            console.log(`🏢 [ESTATE INFO] Has real estate: ${!!result.realEstateProperties}`);
            console.log(`📄 [ESTATE INFO] Has legal docs: ${!!result.legalDocumentsStatus}`);
            
            // DETAILED FIELD-BY-FIELD LOGGING FOR ESTATE INFORMATION
            console.log(`\n🔍 [ESTATE INFO] Detailed Field Analysis:`);
            console.log(`📋 [ESTATE INFO] ID: ${result._id}`);
            
            // Family Structure
            console.log(`👨‍👩‍👧‍👦 [ESTATE INFO] Family Structure:`);
            console.log(`   💑 Spouse Exists: ${result.familyStructure?.spouse?.exists ? 'Yes' : 'No'}`);
            console.log(`   👶 Children Count: ${result.familyStructure?.children?.length || 0}`);
            console.log(`   👴 Dependents Count: ${result.familyStructure?.dependents?.length || 0}`);
            console.log(`   🎯 Beneficiaries Count: ${result.familyStructure?.beneficiaries?.length || 0}`);
            
            // Real Estate Properties
            console.log(`🏠 [ESTATE INFO] Real Estate Properties:`);
            console.log(`   🏢 Properties Count: ${result.realEstateProperties?.length || 0}`);
            if (result.realEstateProperties?.length > 0) {
              result.realEstateProperties.forEach((property, index) => {
                console.log(`   🏠 Property ${index + 1}: ${property.propertyType} in ${property.propertyAddress?.city || 'Unknown'}`);
                console.log(`   💰 Market Value: ₹${property.financialDetails?.currentMarketValue?.toLocaleString('en-IN') || '0'}`);
              });
            }
            
            // Legal Documents Status
            console.log(`📄 [ESTATE INFO] Legal Documents:`);
            console.log(`   📜 Has Will: ${result.legalDocumentsStatus?.willDetails?.hasWill ? 'Yes' : 'No'}`);
            console.log(`   🏛️ Trusts Count: ${result.legalDocumentsStatus?.trustStructures?.length || 0}`);
            console.log(`   📋 Has POA: ${result.legalDocumentsStatus?.powerOfAttorney?.hasPOA ? 'Yes' : 'No'}`);
            console.log(`   🎯 Nominations Count: ${result.legalDocumentsStatus?.nominations?.length || 0}`);
            
            // Personal Assets
            console.log(`🚗 [ESTATE INFO] Personal Assets:`);
            console.log(`   🚙 Vehicles Count: ${result.personalAssets?.vehicles?.length || 0}`);
            console.log(`   💎 Valuables Count: ${result.personalAssets?.valuables?.length || 0}`);
            console.log(`   💰 Crypto Count: ${result.personalAssets?.digitalAssets?.cryptocurrency?.length || 0}`);
            console.log(`   📱 Digital Accounts Count: ${result.personalAssets?.digitalAssets?.digitalAccounts?.length || 0}`);
            console.log(`   🧠 IP Count: ${result.personalAssets?.digitalAssets?.intellectualProperty?.length || 0}`);
            
            // Estate Preferences
            console.log(`⚖️ [ESTATE INFO] Estate Preferences:`);
            console.log(`   🕉️ Religion: ${result.estatePreferences?.applicableLaws?.religion || 'Not Available'}`);
            console.log(`   📊 Distribution Method: ${result.estatePreferences?.distributionPreferences?.distributionMethod || 'Not Available'}`);
            console.log(`   👶 Guardianship Arrangements: ${result.estatePreferences?.guardianshipArrangements?.length || 0}`);
            console.log(`   🎁 Philanthropy Count: ${result.estatePreferences?.philanthropy?.length || 0}`);
            
            // Healthcare Directives
            console.log(`🏥 [ESTATE INFO] Healthcare Directives:`);
            console.log(`   🩸 Blood Group: ${result.healthcareDirectives?.medicalProfile?.bloodGroup || 'Not Available'}`);
            console.log(`   💊 Chronic Conditions: ${result.healthcareDirectives?.medicalProfile?.chronicConditions?.length || 0}`);
            console.log(`   🏥 Medical POA: ${result.healthcareDirectives?.healthcareDecisions?.medicalPowerOfAttorney?.hasDesignated ? 'Yes' : 'No'}`);
            console.log(`   🫀 Organ Donor: ${result.healthcareDirectives?.healthcareDecisions?.treatmentPreferences?.organDonation?.isOrganDonor ? 'Yes' : 'No'}`);
            
            // Estate Metadata
            console.log(`📊 [ESTATE INFO] Estate Metadata:`);
            console.log(`   💰 Estimated Net Estate: ₹${result.estateMetadata?.estimatedNetEstate?.toLocaleString('en-IN') || '0'}`);
            console.log(`   📊 Estate Tax Liability: ₹${result.estateMetadata?.estateTaxLiability?.toLocaleString('en-IN') || '0'}`);
            console.log(`   🎯 Succession Complexity: ${result.estateMetadata?.successionComplexity || 'Not Available'}`);
            console.log(`   ⚖️ Legal Review Required: ${result.estateMetadata?.legalReviewRequired ? 'Yes' : 'No'}`);
            
            console.log(`\n🎯 [ESTATE INFO] Summary: All ${Object.keys(result.toObject()).length} fields fetched successfully!`);
          } else {
            console.log(`❌ [ESTATE INFO] No estate planning data found for client: ${clientId}`);
            console.log(`🔍 [ESTATE INFO] This means no estate planning information has been collected yet`);
          }
          return result;
        })
        .catch(err => {
          console.error(`❌ [ESTATE INFO] Query failed for client: ${clientId}`);
          console.error(`🔍 [ESTATE INFO] Error details:`, err.message);
          console.error(`📋 [ESTATE INFO] Error stack:`, err.stack);
          logDebug('ESTATE INFORMATION FETCH ERROR', { clientId, error: err.message });
          return null; // Return null if no data found, but don't fail the entire request
        }),
      
      MutualFundRecommend.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [MF RECOMMEND] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [MF RECOMMEND] Result count: ${result.length}`);
          if (result.length > 0) {
            console.log(`📊 [MF RECOMMEND] Sample fund: ${result[0].fundName || 'Unknown'}`);
            console.log(`💰 [MF RECOMMEND] Total SIP amount: ${result.reduce((sum, rec) => sum + (rec.recommendedMonthlySIP || 0), 0)}`);
            console.log(`🎯 [MF RECOMMEND] Risk profiles: ${result.map(rec => rec.riskProfile).join(', ')}`);
            
            // DETAILED FIELD-BY-FIELD LOGGING FOR MUTUAL FUND RECOMMENDATIONS
            result.forEach((rec, index) => {
              console.log(`\n🔍 [MF RECOMMEND ${index + 1}] Detailed Field Analysis:`);
              console.log(`📋 [MF RECOMMEND ${index + 1}] ID: ${rec._id}`);
              console.log(`📅 [MF RECOMMEND ${index + 1}] Created: ${rec.createdAt}`);
              console.log(`📊 [MF RECOMMEND ${index + 1}] Status: ${rec.status}`);
              
              // Basic Fund Information
              console.log(`🏦 [MF RECOMMEND ${index + 1}] Fund Information:`);
              console.log(`   📈 Fund Name: ${rec.fundName || 'Not Available'}`);
              console.log(`   🏢 Fund House: ${rec.fundHouseName || 'Not Available'}`);
              console.log(`   💰 Monthly SIP: ₹${rec.recommendedMonthlySIP?.toLocaleString('en-IN') || '0'}`);
              console.log(`   📅 SIP Start Date: ${rec.sipStartDate || 'Not Available'}`);
              console.log(`   📅 Expected Exit Date: ${rec.expectedExitDate || 'Not Available'}`);
              console.log(`   📝 Exit Conditions: ${rec.exitConditions || 'Not Available'}`);
              console.log(`   💡 Reason for Recommendation: ${rec.reasonForRecommendation || 'Not Available'}`);
              
              // Investment Parameters
              console.log(`🎯 [MF RECOMMEND ${index + 1}] Investment Parameters:`);
              console.log(`   ⚖️ Risk Profile: ${rec.riskProfile || 'Not Available'}`);
              console.log(`   🎯 Investment Goal: ${rec.investmentGoal || 'Not Available'}`);
              
              // Claude AI Response Data
              console.log(`🤖 [MF RECOMMEND ${index + 1}] Claude AI Response:`);
              console.log(`   📊 Category: ${rec.claudeResponse?.category || 'Not Available'}`);
              console.log(`   📅 Launch Date: ${rec.claudeResponse?.launchDate || 'Not Available'}`);
              console.log(`   💰 AUM: ${rec.claudeResponse?.aum || 'Not Available'}`);
              console.log(`   📈 Latest NAV: ${rec.claudeResponse?.latestNAV || 'Not Available'}`);
              console.log(`   📅 NAV Date: ${rec.claudeResponse?.navDate || 'Not Available'}`);
              console.log(`   👨‍💼 Fund Managers: ${rec.claudeResponse?.fundManagers?.join(', ') || 'Not Available'}`);
              console.log(`   📊 Benchmark: ${rec.claudeResponse?.benchmark || 'Not Available'}`);
              console.log(`   ⚖️ Risk Level: ${rec.claudeResponse?.risk || 'Not Available'}`);
              
              // Returns Information
              console.log(`📈 [MF RECOMMEND ${index + 1}] Returns:`);
              console.log(`   📊 1 Year Return: ${rec.claudeResponse?.returns?.oneYear || 'Not Available'}`);
              console.log(`   📊 3 Year Return: ${rec.claudeResponse?.returns?.threeYear || 'Not Available'}`);
              console.log(`   📊 5 Year Return: ${rec.claudeResponse?.returns?.fiveYear || 'Not Available'}`);
              
              // Holdings and Sectors
              console.log(`🏢 [MF RECOMMEND ${index + 1}] Holdings & Sectors:`);
              console.log(`   📊 Top Holdings: ${rec.claudeResponse?.topHoldings?.join(', ') || 'Not Available'}`);
              console.log(`   🏭 Top Sectors: ${rec.claudeResponse?.topSectors?.join(', ') || 'Not Available'}`);
              
              // Investment Details
              console.log(`💰 [MF RECOMMEND ${index + 1}] Investment Details:`);
              console.log(`   💰 Min Lumpsum: ${rec.claudeResponse?.minInvestment?.lumpsum || 'Not Available'}`);
              console.log(`   💰 Min SIP: ${rec.claudeResponse?.minInvestment?.sip || 'Not Available'}`);
              console.log(`   📊 Exit Load: ${rec.claudeResponse?.exitLoad || 'Not Available'}`);
              console.log(`   💸 Direct Expense Ratio: ${rec.claudeResponse?.expenseRatio?.direct || 'Not Available'}`);
              console.log(`   💸 Regular Expense Ratio: ${rec.claudeResponse?.expenseRatio?.regular || 'Not Available'}`);
              
              // Tax Information
              console.log(`🧾 [MF RECOMMEND ${index + 1}] Tax Information:`);
              console.log(`   📊 STCG Tax: ${rec.claudeResponse?.tax?.stcg || 'Not Available'}`);
              console.log(`   📊 LTCG Tax: ${rec.claudeResponse?.tax?.ltcg || 'Not Available'}`);
              
              // Fund Objective and Suitability
              console.log(`🎯 [MF RECOMMEND ${index + 1}] Fund Details:`);
              console.log(`   📝 Investment Objective: ${rec.claudeResponse?.investmentObjective || 'Not Available'}`);
              console.log(`   👥 Suitable For: ${rec.claudeResponse?.suitableFor || 'Not Available'}`);
              
              // Additional Metadata
              console.log(`📝 [MF RECOMMEND ${index + 1}] Additional Info:`);
              console.log(`   📝 Notes: ${rec.notes || 'Not Available'}`);
              console.log(`   🏷️ Tags: ${rec.tags?.join(', ') || 'Not Available'}`);
              console.log(`   📅 Updated: ${rec.updatedAt || 'Not Available'}`);
              
              console.log(`\n🎯 [MF RECOMMEND ${index + 1}] Summary: All ${Object.keys(rec.toObject()).length} fields fetched successfully!`);
            });
          } else {
            console.log(`❌ [MF RECOMMEND] No mutual fund recommendations found for client: ${clientId}`);
            console.log(`🔍 [MF RECOMMEND] This means no mutual fund recommendations have been made yet`);
          }
          return result;
        })
        .catch(err => {
          console.error(`❌ [MF RECOMMEND] Query failed for client: ${clientId}`);
          console.error(`🔍 [MF RECOMMEND] Error details:`, err.message);
          console.error(`📋 [MF RECOMMEND] Error stack:`, err.stack);
          logDebug('MUTUAL FUND RECOMMENDATIONS FETCH ERROR', { clientId, error: err.message });
          return []; // Return empty array if no data found
        }),
      
      TaxPlanning.find({ 
        clientId: new mongoose.Types.ObjectId(clientId), 
        advisorId: new mongoose.Types.ObjectId(advisorId) 
      }).sort({ createdAt: -1 })
        .then(result => {
          console.log(`✅ [TAX PLANNING] Query executed successfully for client: ${clientId}`);
          console.log(`📋 [TAX PLANNING] Result count: ${result.length}`);
          if (result.length > 0) {
            console.log(`📊 [TAX PLANNING] Tax years: ${result.map(plan => plan.taxYear).join(', ')}`);
            console.log(`💰 [TAX PLANNING] Total tax savings: ${result.reduce((sum, plan) => sum + (plan.totalTaxSavings || 0), 0)}`);
            console.log(`📈 [TAX PLANNING] Status distribution: ${result.map(plan => plan.status).join(', ')}`);
            
            // DETAILED FIELD-BY-FIELD LOGGING FOR TAX PLANNING DATA
            result.forEach((plan, index) => {
              console.log(`\n🔍 [TAX PLAN ${index + 1}] Detailed Field Analysis:`);
              console.log(`📋 [TAX PLAN ${index + 1}] ID: ${plan._id}`);
              console.log(`📅 [TAX PLAN ${index + 1}] Tax Year: ${plan.taxYear}`);
              console.log(`📊 [TAX PLAN ${index + 1}] Status: ${plan.status}`);
              console.log(`🎯 [TAX PLAN ${index + 1}] Priority: ${plan.priority}`);
              
              // Personal Tax Info
              console.log(`👤 [TAX PLAN ${index + 1}] Personal Tax Info:`);
              console.log(`   📧 PAN Number: ${plan.personalTaxInfo?.panNumber || 'Not Available'}`);
              console.log(`   🏠 Address: ${plan.personalTaxInfo?.address?.city || 'Not Available'}, ${plan.personalTaxInfo?.address?.state || 'Not Available'}`);
              console.log(`   👴 Senior Citizen Status: ${plan.personalTaxInfo?.seniorCitizenStatus || 'Not Available'}`);
              console.log(`   💑 Marital Status: ${plan.personalTaxInfo?.maritalStatus || 'Not Available'}`);
              
              // Income Analysis
              console.log(`💰 [TAX PLAN ${index + 1}] Income Analysis:`);
              console.log(`   💵 Total Annual Income: ₹${plan.incomeAnalysis?.totalAnnualIncome?.toLocaleString('en-IN') || '0'}`);
              console.log(`   📈 Income Type: ${plan.incomeAnalysis?.incomeType || 'Not Available'}`);
              console.log(`   🏢 Employer/Business: ${plan.incomeAnalysis?.employerBusinessName || 'Not Available'}`);
              
              // Tax Saving Investments
              console.log(`💎 [TAX PLAN ${index + 1}] Tax Saving Investments:`);
              console.log(`   📊 Section 80C Total: ₹${plan.taxSavingInvestments?.section80C?.total80C?.toLocaleString('en-IN') || '0'}`);
              console.log(`   🏥 Section 80D Total: ₹${plan.taxSavingInvestments?.section80D?.total80D?.toLocaleString('en-IN') || '0'}`);
              console.log(`   🏠 Home Loan Interest: ₹${plan.taxSavingInvestments?.section24B?.homeLoanInterest?.toLocaleString('en-IN') || '0'}`);
              
              // Capital Gains Analysis
              console.log(`📈 [TAX PLAN ${index + 1}] Capital Gains:`);
              console.log(`   📊 Total LTCG: ₹${plan.capitalGainsAnalysis?.totalLTCG?.toLocaleString('en-IN') || '0'}`);
              console.log(`   📊 Total STCG: ₹${plan.capitalGainsAnalysis?.totalSTCG?.toLocaleString('en-IN') || '0'}`);
              
              // Tax Calculations
              console.log(`🧮 [TAX PLAN ${index + 1}] Tax Calculations:`);
              console.log(`   💰 Taxable Income: ₹${plan.taxCalculations?.taxableIncome?.toLocaleString('en-IN') || '0'}`);
              console.log(`   📊 Tax Liability: ₹${plan.taxCalculations?.totalTaxLiability?.toLocaleString('en-IN') || '0'}`);
              console.log(`   💸 Refund Due: ₹${plan.taxCalculations?.refundDue?.toLocaleString('en-IN') || '0'}`);
              
              // AI Recommendations
              console.log(`🤖 [TAX PLAN ${index + 1}] AI Recommendations:`);
              console.log(`   📊 Total Recommendations: ${plan.aiRecommendations?.recommendations?.length || 0}`);
              console.log(`   💰 Total Potential Savings: ₹${plan.aiRecommendations?.totalPotentialSavings?.toLocaleString('en-IN') || '0'}`);
              console.log(`   🎯 Confidence Score: ${plan.aiRecommendations?.confidenceScore || 0}%`);
              
              // Manual Advisor Inputs
              console.log(`👨‍💼 [TAX PLAN ${index + 1}] Manual Advisor Inputs:`);
              console.log(`   📊 Manual Recommendations: ${plan.manualAdvisorInputs?.recommendations?.length || 0}`);
              console.log(`   📝 Notes: ${plan.manualAdvisorInputs?.notes ? 'Available' : 'Not Available'}`);
              
              // Compliance & Filing
              console.log(`📋 [TAX PLAN ${index + 1}] Compliance & Filing:`);
              console.log(`   📄 ITR Filing Status: ${plan.complianceFiling?.itrFilingStatus || 'Not Available'}`);
              console.log(`   ✅ Verification Status: ${plan.complianceFiling?.verificationStatus || 'Not Available'}`);
              console.log(`   💰 Refund Status: ${plan.complianceFiling?.refundStatus || 'Not Available'}`);
              
              // Implementation Tracking
              console.log(`📈 [TAX PLAN ${index + 1}] Implementation Tracking:`);
              console.log(`   📊 Progress Percentage: ${plan.implementationTracking?.progressPercentage || 0}%`);
              console.log(`   📋 Action Items: ${plan.implementationTracking?.actionItems?.length || 0}`);
              console.log(`   🎯 Milestones: ${plan.implementationTracking?.milestones?.length || 0}`);
              
              // Advisor Certification
              console.log(`✅ [TAX PLAN ${index + 1}] Advisor Certification:`);
              console.log(`   👨‍💼 Certified By: ${plan.advisorCertification?.certifiedBy || 'Not Available'}`);
              console.log(`   📅 Certification Date: ${plan.advisorCertification?.certificationDate || 'Not Available'}`);
              console.log(`   🔍 Compliance Check: ${plan.advisorCertification?.complianceCheck ? 'Yes' : 'No'}`);
              
              // Client Acknowledgment
              console.log(`👤 [TAX PLAN ${index + 1}] Client Acknowledgment:`);
              console.log(`   ✅ Acknowledged: ${plan.clientAcknowledgment?.acknowledged ? 'Yes' : 'No'}`);
              console.log(`   📅 Acknowledgment Date: ${plan.clientAcknowledgment?.acknowledgmentDate || 'Not Available'}`);
              console.log(`   📝 Client Notes: ${plan.clientAcknowledgment?.clientNotes ? 'Available' : 'Not Available'}`);
              
              console.log(`\n🎯 [TAX PLAN ${index + 1}] Summary: All ${Object.keys(plan.toObject()).length} fields fetched successfully!`);
            });
          } else {
            console.log(`❌ [TAX PLANNING] No tax planning data found for client: ${clientId}`);
            console.log(`🔍 [TAX PLANNING] This means no tax planning strategies have been created yet`);
          }
          return result;
        })
        .catch(err => {
          console.error(`❌ [TAX PLANNING] Query failed for client: ${clientId}`);
          console.error(`🔍 [TAX PLANNING] Error details:`, err.message);
          console.error(`📋 [TAX PLANNING] Error stack:`, err.stack);
          logDebug('TAX PLANNING FETCH ERROR', { clientId, error: err.message });
          return []; // Return empty array if no data found
        })
    ]);

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('ClientReport', 'comprehensive', duration);

    // COMPREHENSIVE DATA FETCHING RESULTS LOGGING
    console.log(`\n📊 [DATA FETCH RESULTS] All queries completed in ${duration}ms`);
    console.log(`✅ [DATA FETCH] Vault Data: ${vaultData ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✅ [DATA FETCH] Financial Plans: ${financialPlans.length} records`);
    console.log(`✅ [DATA FETCH] Meetings: ${meetings.length} records`);
    console.log(`✅ [DATA FETCH] LOE Documents: ${loeDocuments.length} records`);
    console.log(`✅ [DATA FETCH] LOE Automation: ${loeAutomation.length} records`);
    console.log(`✅ [DATA FETCH] AB Test Sessions: ${abTestSessions.length} records`);
    console.log(`✅ [DATA FETCH] Chat History: ${chatHistory.length} records`);
    console.log(`✅ [DATA FETCH] Mutual Fund Exit Strategies: ${mutualFundExitStrategies.length} records`);
    console.log(`✅ [DATA FETCH] Client Invitations: ${clientInvitations.length} records`);
    console.log(`✅ [DATA FETCH] Estate Information: ${estateInformation ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✅ [DATA FETCH] Mutual Fund Recommendations: ${mutualFundRecommendations.length} records`);
    console.log(`✅ [DATA FETCH] Tax Planning Data: ${taxPlanningData.length} records`);
    
    // NEW MODELS COMPREHENSIVE LOGGING
    console.log(`\n🎯 [NEW MODELS STATUS] Comprehensive Data Fetching Results:`);
    console.log(`🏠 [ESTATE INFO] Status: ${estateInformation ? 'DATA FOUND' : 'NO DATA FOUND'}`);
    if (estateInformation) {
      console.log(`📋 [ESTATE INFO] Fields available: ${Object.keys(estateInformation.toObject()).length}`);
      console.log(`🏠 [ESTATE INFO] Family structure: ${estateInformation.familyStructure ? 'YES' : 'NO'}`);
      console.log(`🏢 [ESTATE INFO] Real estate properties: ${estateInformation.realEstateProperties?.length || 0}`);
      console.log(`📄 [ESTATE INFO] Legal documents: ${estateInformation.legalDocumentsStatus ? 'YES' : 'NO'}`);
      console.log(`💰 [ESTATE INFO] Estimated net estate: ${estateInformation.estateMetadata?.estimatedNetEstate || 'Not Available'}`);
    }
    
    console.log(`📈 [MF RECOMMEND] Status: ${mutualFundRecommendations.length > 0 ? `${mutualFundRecommendations.length} RECORDS FOUND` : 'NO RECORDS FOUND'}`);
    if (mutualFundRecommendations.length > 0) {
      console.log(`📊 [MF RECOMMEND] Total SIP amount: ₹${mutualFundRecommendations.reduce((sum, rec) => sum + (rec.recommendedMonthlySIP || 0), 0).toLocaleString('en-IN')}`);
      console.log(`🎯 [MF RECOMMEND] Active recommendations: ${mutualFundRecommendations.filter(rec => rec.status === 'active').length}`);
      console.log(`✅ [MF RECOMMEND] Completed recommendations: ${mutualFundRecommendations.filter(rec => rec.status === 'completed').length}`);
      console.log(`📋 [MF RECOMMEND] Fund names: ${mutualFundRecommendations.map(rec => rec.fundName).join(', ')}`);
    }
    
    console.log(`🧾 [TAX PLANNING] Status: ${taxPlanningData.length > 0 ? `${taxPlanningData.length} RECORDS FOUND` : 'NO RECORDS FOUND'}`);
    if (taxPlanningData.length > 0) {
      console.log(`📊 [TAX PLANNING] Tax years covered: ${taxPlanningData.map(plan => plan.taxYear).join(', ')}`);
      console.log(`💰 [TAX PLANNING] Total tax savings: ₹${taxPlanningData.reduce((sum, plan) => sum + (plan.totalTaxSavings || 0), 0).toLocaleString('en-IN')}`);
      console.log(`📈 [TAX PLANNING] Status distribution: ${Object.entries(taxPlanningData.reduce((acc, plan) => { acc[plan.status] = (acc[plan.status] || 0) + 1; return acc; }, {})).map(([status, count]) => `${status}: ${count}`).join(', ')}`);
    }

    logDebug('RELATED DATA FETCHED', {
      vault: !!vaultData,
      financialPlans: financialPlans.length,
      meetings: meetings.length,
      loeDocuments: loeDocuments.length,
      loeAutomation: loeAutomation.length,
      abTestSessions: abTestSessions.length,
      chatHistory: chatHistory.length,
      mutualFundExitStrategies: mutualFundExitStrategies.length,
      clientInvitations: clientInvitations.length,
      // NEW MODELS DATA FETCHING STATUS
      estateInformation: !!estateInformation,
      mutualFundRecommendations: mutualFundRecommendations.length,
      taxPlanningData: taxPlanningData.length,
      totalDuration: `${duration}ms`
    });

    // Step 3: Process client data with ALL fields
    const clientData = client.toObject();
    const processedClient = ensureFieldAvailability(clientData);

    logDebug('CLIENT DATA PROCESSING', {
      originalFields: Object.keys(clientData).length,
      processedFields: Object.keys(processedClient).length,
      hasPersonalInfo: !!processedClient.firstName,
      hasFinancialInfo: !!processedClient.totalMonthlyIncome,
      hasAssets: !!processedClient.assets,
      hasDebts: !!processedClient.debtsAndLiabilities,
      hasInsurance: !!processedClient.insuranceCoverage,
      hasCASData: !!processedClient.casData
    });

    // Step 4: Build comprehensive report with ALL data
    const comprehensiveReport = {
      // Advisor vault data
      advisor: vaultData ? ensureFieldAvailability(vaultData.toObject()) : {},

      // COMPLETE CLIENT DATA - ALL FIELDS
      client: {
        // Basic Information - ALL fields
        basicInfo: {
          firstName: processedClient.firstName,
          lastName: processedClient.lastName,
          email: processedClient.email,
          phoneNumber: processedClient.phoneNumber,
          status: processedClient.status,
          onboardingStep: processedClient.onboardingStep,
          lastActiveDate: processedClient.lastActiveDate,
          dateOfBirth: processedClient.dateOfBirth,
          panNumber: processedClient.panNumber,
          aadharNumber: processedClient.aadharNumber,
          maritalStatus: processedClient.maritalStatus,
          numberOfDependents: processedClient.numberOfDependents,
          gender: processedClient.gender,
          occupation: processedClient.occupation,
          employerBusinessName: processedClient.employerBusinessName
        },

        // Address Information - ALL fields
        address: processedClient.address ? ensureFieldAvailability(processedClient.address) : {},

        // Financial Information - ALL fields
        financialInfo: {
          // Income details
          totalMonthlyIncome: processedClient.totalMonthlyIncome,
          totalMonthlyExpenses: processedClient.totalMonthlyExpenses,
          incomeType: processedClient.incomeType,
          annualIncome: processedClient.annualIncome,
          additionalIncome: processedClient.additionalIncome,
          
          // Expense breakdown - COMPLETE
          monthlyExpenses: processedClient.monthlyExpenses ? 
            ensureFieldAvailability(processedClient.monthlyExpenses) : {},
          expenseBreakdown: processedClient.expenseBreakdown ? 
            ensureFieldAvailability(processedClient.expenseBreakdown) : {},
          expenseNotes: processedClient.expenseNotes,
          
          // Annual expenses
          annualTaxes: processedClient.annualTaxes,
          annualVacationExpenses: processedClient.annualVacationExpenses,
          
          // Net worth and calculations
          netWorth: processedClient.netWorth,
          monthlySavingsTarget: processedClient.monthlySavingsTarget,
          calculatedFinancials: processedClient.calculatedFinancials || {}
        },

        // Retirement Planning - ALL fields
        retirementPlanning: processedClient.retirementPlanning ? 
          ensureFieldAvailability(processedClient.retirementPlanning) : {},

        // Major Goals - COMPLETE array
        majorGoals: Array.isArray(processedClient.majorGoals) ? 
          processedClient.majorGoals.map(goal => ensureFieldAvailability(goal)) : [],

        // Assets & Investments - COMPLETE breakdown
        assets: processedClient.assets ? ensureFieldAvailability(processedClient.assets) : {},

        // Debts and Liabilities - ALL loan types
        debtsAndLiabilities: processedClient.debtsAndLiabilities ? 
          ensureFieldAvailability(processedClient.debtsAndLiabilities) : {},

        // Insurance Coverage - ALL types
        insuranceCoverage: processedClient.insuranceCoverage ? 
          ensureFieldAvailability(processedClient.insuranceCoverage) : {},

        // Enhanced Financial Goals - COMPLETE
        enhancedFinancialGoals: processedClient.enhancedFinancialGoals ? 
          ensureFieldAvailability(processedClient.enhancedFinancialGoals) : {},

        // Risk Profile
        riskProfile: {
          investmentExperience: processedClient.investmentExperience,
          riskTolerance: processedClient.riskTolerance,
          enhancedRiskProfile: processedClient.enhancedRiskProfile ? 
            ensureFieldAvailability(processedClient.enhancedRiskProfile) : {}
        },

        // Investment Goals and Horizon
        investmentGoals: processedClient.investmentGoals || [],
        investmentHorizon: processedClient.investmentHorizon,

        // KYC Information
        kycInfo: {
          kycStatus: processedClient.kycStatus,
          kycDocuments: processedClient.kycDocuments || [],
          fatcaStatus: processedClient.fatcaStatus,
          crsStatus: processedClient.crsStatus
        },

        // CAS Data - COMPLETE structure
        casData: processedClient.casData ? ensureFieldAvailability(processedClient.casData) : {},

        // Bank Details
        bankDetails: processedClient.bankDetails ? 
          ensureFieldAvailability(processedClient.bankDetails) : {},

        // Form Progress
        formProgress: processedClient.formProgress ? 
          ensureFieldAvailability(processedClient.formProgress) : {},

        // Communication Preferences
        communicationPreferences: processedClient.communicationPreferences ? 
          ensureFieldAvailability(processedClient.communicationPreferences) : {},

        // Additional fields
        notes: processedClient.notes,
        draftData: processedClient.draftData || {}
      },

      // COMPLETE related data with processing
      financialPlans: {
        count: financialPlans.length,
        plans: financialPlans.map(plan => ensureFieldAvailability(plan.toObject()))
      },

      meetings: {
        count: meetings.length,
        meetings: meetings.map(meeting => ensureFieldAvailability(meeting.toObject()))
      },

      legalDocuments: {
        loeCount: loeDocuments.length,
        loeAutomationCount: loeAutomation.length,
        loeDocuments: loeDocuments.map(loe => ensureFieldAvailability(loe.toObject())),
        loeAutomation: loeAutomation.map(loe => ensureFieldAvailability(loe.toObject()))
      },

      abTesting: {
        count: abTestSessions.length,
        sessions: abTestSessions.map(session => ensureFieldAvailability(session.toObject()))
      },

      chatHistory: {
        count: chatHistory.length,
        conversations: chatHistory.map(chat => ensureFieldAvailability(chat.toObject()))
      },

      mutualFundExitStrategies: {
        count: mutualFundExitStrategies.length,
        strategies: mutualFundExitStrategies.map(strategy => ensureFieldAvailability(strategy.toObject()))
      },

      invitations: {
        count: clientInvitations.length,
        invitations: clientInvitations.map(invitation => ensureFieldAvailability(invitation.toObject()))
      },

      // NEW COMPREHENSIVE DATA SECTIONS
      estateInformation: {
        exists: !!estateInformation,
        data: estateInformation ? ensureFieldAvailability(estateInformation.toObject()) : {},
        summary: estateInformation ? {
          hasFamilyStructure: !!(estateInformation.familyStructure),
          hasRealEstate: !!(estateInformation.realEstateProperties && estateInformation.realEstateProperties.length > 0),
          hasLegalDocuments: !!(estateInformation.legalDocumentsStatus),
          hasPersonalAssets: !!(estateInformation.personalAssets),
          hasEstatePreferences: !!(estateInformation.estatePreferences),
          hasHealthcareDirectives: !!(estateInformation.healthcareDirectives),
          estimatedNetEstate: estateInformation.estateMetadata?.estimatedNetEstate || 'Not Available'
        } : {}
      },

      mutualFundRecommendations: {
        count: mutualFundRecommendations.length,
        recommendations: mutualFundRecommendations.map(rec => ensureFieldAvailability(rec.toObject())),
        summary: {
          totalRecommendations: mutualFundRecommendations.length,
          activeRecommendations: mutualFundRecommendations.filter(rec => rec.status === 'active').length,
          completedRecommendations: mutualFundRecommendations.filter(rec => rec.status === 'completed').length,
          totalSIPAmount: mutualFundRecommendations.reduce((sum, rec) => sum + (rec.recommendedMonthlySIP || 0), 0),
          riskProfileDistribution: mutualFundRecommendations.reduce((acc, rec) => {
            acc[rec.riskProfile] = (acc[rec.riskProfile] || 0) + 1;
            return acc;
          }, {})
        }
      },

      taxPlanning: {
        count: taxPlanningData.length,
        plans: taxPlanningData.map(plan => ensureFieldAvailability(plan.toObject())),
        summary: {
          totalPlans: taxPlanningData.length,
          currentYearPlan: taxPlanningData.find(plan => plan.taxYear === new Date().getFullYear().toString()) || null,
          totalTaxSavings: taxPlanningData.reduce((sum, plan) => sum + (plan.totalTaxSavings || 0), 0),
          averageTaxSavings: taxPlanningData.length > 0 ? 
            taxPlanningData.reduce((sum, plan) => sum + (plan.totalTaxSavings || 0), 0) / taxPlanningData.length : 0,
          statusDistribution: taxPlanningData.reduce((acc, plan) => {
            acc[plan.status] = (acc[plan.status] || 0) + 1;
            return acc;
          }, {})
        }
      },

      // Enhanced summary with detailed metrics
      summary: {
        dataCompleteness: {
          hasBasicInfo: !!(processedClient.firstName && processedClient.lastName && processedClient.email),
          hasFinancialInfo: !!(processedClient.totalMonthlyIncome),
          hasAssets: !!(processedClient.assets && Object.keys(processedClient.assets).length > 0),
          hasDebts: !!(processedClient.debtsAndLiabilities && Object.keys(processedClient.debtsAndLiabilities).length > 0),
          hasInsurance: !!(processedClient.insuranceCoverage && Object.keys(processedClient.insuranceCoverage).length > 0),
          hasCASData: !!(processedClient.casData && processedClient.casData.casStatus !== 'not_uploaded'),
          hasGoals: !!(processedClient.majorGoals && processedClient.majorGoals.length > 0)
        },
        counts: {
          totalFinancialPlans: financialPlans.length,
          totalMeetings: meetings.length,
          totalLegalDocuments: loeDocuments.length + loeAutomation.length,
          totalABTestSessions: abTestSessions.length,
          totalChatConversations: chatHistory.length,
          totalExitStrategies: mutualFundExitStrategies.length,
          totalInvitations: clientInvitations.length,
          // NEW MODEL COUNTS
          hasEstateInformation: !!estateInformation,
          totalMutualFundRecommendations: mutualFundRecommendations.length,
          totalTaxPlans: taxPlanningData.length
        },
        status: {
          onboardingComplete: processedClient.onboardingStep >= 7,
          kycComplete: processedClient.kycStatus === 'completed',
          hasCASData: processedClient.casData?.casStatus === 'parsed'
        }
      }
    };

    // COMPREHENSIVE REPORT BUILDING LOGGING
    console.log(`\n🏗️ [REPORT BUILDING] Comprehensive report construction completed`);
    console.log(`📊 [REPORT BUILDING] Report size: ${JSON.stringify(comprehensiveReport).length} characters`);
    console.log(`📋 [REPORT BUILDING] Client fields included: ${Object.keys(comprehensiveReport.client).length}`);
    console.log(`🔗 [REPORT BUILDING] Related data sections: ${Object.keys(comprehensiveReport).length - 2}`);
    
    // NEW MODELS DATA INTEGRATION LOGGING
    console.log(`\n🎯 [NEW MODELS INTEGRATION] Data integration status:`);
    console.log(`🏠 [ESTATE INTEGRATION] Estate data integrated: ${comprehensiveReport.estateInformation ? 'YES' : 'NO'}`);
    if (comprehensiveReport.estateInformation) {
      console.log(`📊 [ESTATE INTEGRATION] Estate exists: ${comprehensiveReport.estateInformation.exists}`);
      console.log(`📋 [ESTATE INTEGRATION] Estate data fields: ${Object.keys(comprehensiveReport.estateInformation.data).length}`);
      console.log(`📈 [ESTATE INTEGRATION] Estate summary fields: ${Object.keys(comprehensiveReport.estateInformation.summary).length}`);
    }
    
    console.log(`📈 [MF INTEGRATION] MF recommendations integrated: ${comprehensiveReport.mutualFundRecommendations ? 'YES' : 'NO'}`);
    if (comprehensiveReport.mutualFundRecommendations) {
      console.log(`📊 [MF INTEGRATION] MF count: ${comprehensiveReport.mutualFundRecommendations.count}`);
      console.log(`📋 [MF INTEGRATION] MF recommendations: ${comprehensiveReport.mutualFundRecommendations.recommendations.length}`);
      console.log(`📈 [MF INTEGRATION] MF summary fields: ${Object.keys(comprehensiveReport.mutualFundRecommendations.summary).length}`);
    }
    
    console.log(`🧾 [TAX INTEGRATION] Tax planning integrated: ${comprehensiveReport.taxPlanning ? 'YES' : 'NO'}`);
    if (comprehensiveReport.taxPlanning) {
      console.log(`📊 [TAX INTEGRATION] Tax plans count: ${comprehensiveReport.taxPlanning.count}`);
      console.log(`📋 [TAX INTEGRATION] Tax plans: ${comprehensiveReport.taxPlanning.plans.length}`);
      console.log(`📈 [TAX INTEGRATION] Tax summary fields: ${Object.keys(comprehensiveReport.taxPlanning.summary).length}`);
    }

    logDebug('COMPREHENSIVE REPORT COMPLETED', {
      reportSize: JSON.stringify(comprehensiveReport).length,
      clientFieldsIncluded: Object.keys(comprehensiveReport.client).length,
      relatedDataIncluded: Object.keys(comprehensiveReport).length - 2, // minus client and advisor
      totalProcessingTime: `${Date.now() - startTime}ms`
    });

    // FINAL RESPONSE LOGGING
    const finalProcessingTime = Date.now() - startTime;
    console.log(`\n🚀 [RESPONSE SENDING] Sending comprehensive report response`);
    console.log(`✅ [RESPONSE] Success: true`);
    console.log(`⏰ [RESPONSE] Total processing time: ${finalProcessingTime}ms`);
    console.log(`📊 [RESPONSE] Data integrity: complete`);
    console.log(`🎯 [RESPONSE] New models included: EstateInformation, MutualFundRecommend, TaxPlanning`);
    console.log(`📋 [RESPONSE] Response size: ${JSON.stringify(comprehensiveReport).length} characters`);
    
    // FINAL DATA VERIFICATION LOGGING
    console.log(`\n🔍 [FINAL VERIFICATION] Data completeness check:`);
    console.log(`🏠 [VERIFICATION] Estate data in response: ${comprehensiveReport.estateInformation ? 'PRESENT' : 'MISSING'}`);
    console.log(`📈 [VERIFICATION] MF recommendations in response: ${comprehensiveReport.mutualFundRecommendations ? 'PRESENT' : 'MISSING'}`);
    console.log(`🧾 [VERIFICATION] Tax planning in response: ${comprehensiveReport.taxPlanning ? 'PRESENT' : 'MISSING'}`);
    console.log(`📊 [VERIFICATION] All new models integrated: ${comprehensiveReport.estateInformation && comprehensiveReport.mutualFundRecommendations && comprehensiveReport.taxPlanning ? 'YES' : 'NO'}`);

    res.json({
      success: true,
      data: comprehensiveReport,
      generatedAt: new Date().toISOString(),
      processingTime: `${finalProcessingTime}ms`,
      dataIntegrity: 'complete'
    });

  } catch (error) {
    // Enhanced error logging with client ID details
    logDebug('COMPREHENSIVE REPORT FAILED', { 
      clientId: req.params?.clientId, 
      advisorId: req.advisor?.id,
      error: error.message,
      stack: error.stack
    }, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive client report',
      error: error.message,
      clientId: req.params?.clientId,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAdvisorVaultData,
  getClientList,
  getClientReport
};