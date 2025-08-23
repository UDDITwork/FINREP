/**
 * FILE LOCATION: backend/controllers/mutualFundExitController.js
 * 
 * PURPOSE: Controller for managing mutual fund exit strategies and client fund data
 * FIXED: Corrected field names + proper ObjectId handling
 */

const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
const Client = require('../models/Client');
const FinancialPlan = require('../models/FinancialPlan');
const Advisor = require('../models/Advisor');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

class MutualFundExitController {
  /**
   * Get clients with mutual funds for the authenticated advisor
   * FIXED: Field names now match frontend expectations
   */
  async getClientsWithFunds(req, res) {
    try {
      const advisorId = req.advisor.id;
      
      logger.info(`Fetching clients with mutual funds for advisor: ${advisorId}`);
      console.log('🔍 [MF Exit] Starting client fetch for advisor:', advisorId);

      // DEBUG: Check database connection and query
      const mongoose = require('mongoose');
      console.log('🔍 [MF Exit] Database Status:', {
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
      console.log('🔍 [MF Exit] Total Clients in Database:', totalClientsInDB);
      
      // DEBUG: Test if there are ANY clients with any advisor
      const clientsWithAnyAdvisor = await Client.countDocuments({ advisor: { $exists: true } });
      console.log('🔍 [MF Exit] Clients with Any Advisor:', clientsWithAnyAdvisor);

      // DEBUG: Log the exact query being executed
      console.log('🔍 [MF Exit] Client Query Strategy:', {
        advisorIdType: typeof advisorId,
        advisorIdValue: advisorId,
        isObjectId: advisorId?.toString && typeof advisorId.toString === 'function',
        queriesToTry: [
          { advisor: advisorId, isActive: true },
          { advisor: advisorId },
          { advisor: 'ObjectId(advisorId)' }
        ]
      });

      // Get advisor's clients - try both ObjectId and string formats
      // First try with isActive filter
      let clients = await Client.find({ advisor: advisorId, isActive: true })
        .select('firstName lastName email phoneNumber casData assets')
        .lean();
      
      // If no clients found, try without isActive filter (some clients might not have this field)
      if (!clients || clients.length === 0) {
        console.log('🔍 [MF Exit] No clients found with isActive filter, trying without it...');
        clients = await Client.find({ advisor: advisorId })
          .select('firstName lastName email phoneNumber casData assets')
          .lean();
        console.log('🔍 [MF Exit] Query without isActive result:', { 
          clientsFound: clients?.length || 0
        });
      }
      
      // If still no clients found, try with ObjectId conversion
      if (!clients || clients.length === 0) {
        console.log('🔍 [MF Exit] No clients found with string advisorId, trying ObjectId conversion...');
        try {
          const advisorObjectId = new mongoose.Types.ObjectId(advisorId);
          clients = await Client.find({ advisor: advisorObjectId })
            .select('firstName lastName email phoneNumber casData assets')
            .lean();
          console.log('🔍 [MF Exit] ObjectId query result:', { 
            clientsFound: clients?.length || 0,
            advisorObjectId: advisorObjectId.toString()
          });
        } catch (objectIdError) {
          console.log('🔍 [MF Exit] ObjectId conversion failed:', objectIdError.message);
        }
      }

      // DEBUG: Log the database query result
      console.log('🔍 [MF Exit] Database Result:', {
        clientsFound: clients?.length || 0,
        clients: clients?.map(c => ({ 
          id: c._id, 
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          advisor: c.advisor,
          hasCasData: !!c.casData,
          hasAssets: !!c.assets
        })) || [],
        finalQueryUsed: clients && clients.length > 0 ? 'Query successful' : 'All queries failed'
      });
      
      console.log('📋 [MF Exit] Found clients:', clients.length);
      
      // Debug: Log first client structure
      if (clients.length > 0) {
        console.log('🔍 [MF Exit] First client sample:', {
          id: clients[0]._id,
          name: `${clients[0].firstName} ${clients[0].lastName}`,
          advisor: clients[0].advisor,
          hasCasData: !!clients[0].casData,
          hasAssets: !!clients[0].assets,
          casDataKeys: clients[0].casData ? Object.keys(clients[0].casData) : [],
          assetsKeys: clients[0].assets ? Object.keys(clients[0].assets) : []
        });
      }

      const clientsWithFunds = [];

      for (const client of clients) {
        const clientFunds = {
          _id: client._id,
          clientId: client._id,                              // ✅ FIXED: Added clientId
          firstName: client.firstName,
          lastName: client.lastName,
          clientName: `${client.firstName} ${client.lastName}`, // ✅ FIXED: Changed from "name" to "clientName"
          clientEmail: client.email,                          // ✅ FIXED: Changed from "email" to "clientEmail"
          clientPhone: client.phoneNumber,                    // ✅ FIXED: Changed from "phone" to "clientPhone"
          existingFunds: [],
          recommendedFunds: [],
          totalValue: 0,
          mutualFunds: {
            existing: [],
            recommended: [],
            totalCount: 0
          }
        };

        // Extract existing mutual funds from CAS data
        if (client.casData?.parsedData?.mutual_funds) {
          console.log(`🔍 [MF Exit] Client ${client.firstName} has CAS mutual funds:`, client.casData.parsedData.mutual_funds.length);
          client.casData.parsedData.mutual_funds.forEach(fund => {
            if (fund.schemes) {
              fund.schemes.forEach(scheme => {
                clientFunds.mutualFunds.existing.push({
                  id: `cas_${fund.folio_number}_${scheme.scheme_name}`,
                  fundId: `cas_${fund.folio_number}_${scheme.scheme_name}`, // ✅ ADDED: fundId field
                  sourceType: 'existing',
                  amc: fund.amc,
                  folioNumber: fund.folio_number,
                  fundName: scheme.scheme_name,
                  fundCategory: scheme.scheme_type || 'Equity', // ✅ ADDED: fundCategory
                  currentValue: scheme.value || 0,
                  currentUnits: scheme.units || 0,
                  units: scheme.units || 0,                    // ✅ ADDED: units field
                  currentNAV: scheme.nav || 0,
                  nav: scheme.nav || 0,                        // ✅ ADDED: nav field
                  schemeType: scheme.scheme_type
                });
              });
            }
          });
        } else {
          console.log(`🔍 [MF Exit] Client ${client.firstName} has no CAS mutual funds`);
        }

        // Extract from manual assets
        if (client.assets?.investments?.equity?.mutualFunds) {
          const mfValue = parseFloat(client.assets.investments.equity.mutualFunds) || 0;
          console.log(`🔍 [MF Exit] Client ${client.firstName} has manual MF assets:`, mfValue);
          if (mfValue > 0) {
            clientFunds.mutualFunds.existing.push({
              id: 'manual_mf',
              fundId: 'manual_mf',                           // ✅ ADDED: fundId field
              sourceType: 'existing',
              fundName: 'Mutual Funds (Manual Entry)',
              fundCategory: 'Equity',                        // ✅ ADDED: fundCategory
              currentValue: mfValue,
              units: 0,                                      // ✅ ADDED: units field
              nav: 0,                                        // ✅ ADDED: nav field
              schemeType: 'Equity',
              isManualEntry: true
            });
          }
        } else {
          console.log(`🔍 [MF Exit] Client ${client.firstName} has no manual MF assets`);
        }

        // 🔍 NEW: Extract recommended mutual funds from Financial Plans
        try {
          const financialPlans = await FinancialPlan.find({ 
            clientId: client._id, 
            status: { $in: ['active', 'completed'] }
          }).lean();

          console.log(`🔍 [MF Exit] Client ${client.firstName} has ${financialPlans.length} financial plans`);

          for (const plan of financialPlans) {
            // Extract fund recommendations from goal-based planning
            if (plan.planDetails?.goalBasedPlan?.selectedGoals) {
              plan.planDetails.goalBasedPlan.selectedGoals.forEach(goal => {
                if (goal.investmentStrategy && goal.investmentStrategy.toLowerCase().includes('mutual fund')) {
                  clientFunds.mutualFunds.recommended.push({
                    id: `plan_${plan._id}_${goal.goalName}`,
                    fundId: `plan_${plan._id}_${goal.goalName}`,
                    sourceType: 'recommended',
                    source: 'Financial Plan - Goal Based',
                    fundName: goal.investmentStrategy,
                    fundCategory: 'Goal-Based',
                    currentValue: 0, // Recommended, not existing
                    units: 0,
                    nav: 0,
                    monthlyAllocation: goal.monthlyAllocation || 0,
                    targetAmount: goal.targetAmount || 0,
                    targetDate: goal.targetDate,
                    priority: goal.priority,
                    planId: plan._id,
                    goalName: goal.goalName
                  });
                }
              });
            }

            // Extract investment recommendations
            if (plan.planDetails?.cashFlowPlan?.investmentRecommendations?.monthlyInvestments) {
              plan.planDetails.cashFlowPlan.investmentRecommendations.monthlyInvestments.forEach(investment => {
                if (investment.fundType && investment.fundType.toLowerCase().includes('mutual fund')) {
                  clientFunds.mutualFunds.recommended.push({
                    id: `plan_${plan._id}_${investment.fundName}`,
                    fundId: `plan_${plan._id}_${investment.fundName}`,
                    sourceType: 'recommended',
                    source: 'Financial Plan - Investment',
                    fundName: investment.fundName,
                    fundCategory: investment.category || 'Equity',
                    currentValue: 0, // Recommended, not existing
                    units: 0,
                    nav: 0,
                    monthlyAmount: investment.monthlyAmount || 0,
                    purpose: investment.purpose,
                    expectedReturn: investment.expectedReturn,
                    riskLevel: investment.riskLevel,
                    planId: plan._id
                  });
                }
              });
            }

            // Extract fund recommendations from cash flow planning
            if (plan.planDetails?.cashFlowPlan?.debtManagement?.prioritizedDebts) {
              // Check if there are any investment recommendations in debt management
              // This could include mutual fund recommendations for debt payoff
            }
          }

          console.log(`🔍 [MF Exit] Client ${client.firstName} has ${clientFunds.mutualFunds.recommended.length} recommended funds`);
        } catch (planError) {
          console.log(`⚠️ [MF Exit] Error fetching financial plans for client ${client.firstName}:`, planError.message);
        }

        // Populate existingFunds and recommendedFunds arrays for compatibility
        clientFunds.existingFunds = clientFunds.mutualFunds.existing;
        clientFunds.recommendedFunds = clientFunds.mutualFunds.recommended;
        
        // Calculate total value
        clientFunds.totalValue = clientFunds.existingFunds.reduce((sum, fund) => sum + (fund.currentValue || 0), 0);
        
        // Calculate total count
        clientFunds.mutualFunds.totalCount = clientFunds.mutualFunds.existing.length + clientFunds.mutualFunds.recommended.length;

        console.log(`🔍 [MF Exit] Client ${client.firstName} processed:`, {
          existingFunds: clientFunds.mutualFunds.existing.length,
          recommendedFunds: clientFunds.mutualFunds.recommended.length,
          totalCount: clientFunds.mutualFunds.totalCount,
          totalValue: clientFunds.totalValue
        });

        // Add label for clients with no mutual funds
        if (clientFunds.mutualFunds.totalCount === 0) {
          clientFunds.status = 'No Mutual Fund in Portfolio';
          clientFunds.statusColor = 'text-gray-500';
          clientFunds.statusIcon = 'info';
        } else {
          clientFunds.status = `${clientFunds.mutualFunds.totalCount} Fund${clientFunds.mutualFunds.totalCount > 1 ? 's' : ''}`;
          clientFunds.statusColor = 'text-green-600';
          clientFunds.statusIcon = 'check';
        }

        // Include all clients, but mark those without funds
        clientsWithFunds.push(clientFunds);
      }

      console.log('✅ [MF Exit] Total clients found:', clientsWithFunds.length);
      const clientsWithFundsCount = clientsWithFunds.filter(c => c.mutualFunds.totalCount > 0).length;
      console.log('📊 [MF Exit] Clients with mutual funds:', clientsWithFundsCount);
      logger.info(`Found ${clientsWithFunds.length} total clients, ${clientsWithFundsCount} with mutual funds`);

      res.json({
        success: true,
        data: {
          clients: clientsWithFunds,
          summary: {
            totalClients: clientsWithFunds.length,
            clientsWithFunds: clientsWithFunds.filter(c => c.mutualFunds.totalCount > 0).length,
            totalExistingFunds: clientsWithFunds.reduce((sum, c) => sum + c.mutualFunds.existing.length, 0),
            totalRecommendedFunds: clientsWithFunds.reduce((sum, c) => sum + c.mutualFunds.recommended.length, 0)
          }
        }
      });

    } catch (error) {
      console.error('❌ [MF Exit] Error:', error);
      logger.error('Error fetching clients with mutual funds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients with mutual funds',
        error: error.message
      });
    }
  }

  /**
   * Create a new mutual fund exit strategy
   */
  async createExitStrategy(req, res) {
    try {
      const advisorId = req.advisor.id;
      const strategyData = req.body;

      logger.info(`Creating exit strategy for client: ${strategyData.clientId}, fund: ${strategyData.fundId}`);

      // Verify client belongs to advisor
      const client = await Client.findOne({
        _id: strategyData.clientId,
        advisor: advisorId,
        isActive: true
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found or access denied'
        });
      }

      // Auto-populate advisor details
      strategyData.advisorId = advisorId;
      strategyData.createdBy = advisorId;
      
      // Initialize advisorCertification if not exists
      if (!strategyData.advisorCertification) {
        strategyData.advisorCertification = {};
      }
      strategyData.advisorCertification.certifiedBy = advisorId;
      strategyData.advisorCertification.certificationDate = new Date();

      // Calculate tax implications
      if (strategyData.taxImplications && strategyData.primaryExitAnalysis) {
        const holdingPeriod = strategyData.taxImplications.holdingPeriod;
        const currentValue = strategyData.primaryExitAnalysis.currentValue;
        
        if (holdingPeriod === 'long_term') {
          strategyData.taxImplications.taxRate = 10;
        } else {
          strategyData.taxImplications.taxRate = 15;
        }
        
        strategyData.taxImplications.taxAmount = (currentValue * strategyData.taxImplications.taxRate) / 100;
      }

      // Create execution steps if not provided
      if (!strategyData.executionActionPlan?.steps || strategyData.executionActionPlan.steps.length === 0) {
        if (!strategyData.executionActionPlan) {
          strategyData.executionActionPlan = {};
        }
        strategyData.executionActionPlan.steps = [
          {
            stepNumber: 1,
            action: 'Review and approve exit strategy',
            timeline: 'Immediate',
            responsible: 'Advisor',
            status: 'pending'
          },
          {
            stepNumber: 2,
            action: 'Client acknowledgment',
            timeline: 'Within 24 hours',
            responsible: 'Client',
            status: 'pending'
          },
          {
            stepNumber: 3,
            action: 'Execute exit order',
            timeline: 'As per timing strategy',
            responsible: 'Advisor',
            status: 'pending'
          },
          {
            stepNumber: 4,
            action: 'Monitor execution',
            timeline: 'Ongoing',
            responsible: 'Advisor',
            status: 'pending'
          }
        ];
      }

      const exitStrategy = new MutualFundExitStrategy(strategyData);
      await exitStrategy.save();

      logger.info(`Exit strategy created successfully: ${exitStrategy._id}`);

      res.status(201).json({
        success: true,
        message: 'Exit strategy created successfully',
        data: exitStrategy
      });

    } catch (error) {
      logger.error('Error creating exit strategy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exit strategy',
        error: error.message
      });
    }
  }

  /**
   * Get a specific exit strategy by ID
   */
  async getExitStrategy(req, res) {
    try {
      const advisorId = req.advisor.id;
      const strategyId = req.params.id;

      logger.info(`Fetching exit strategy: ${strategyId}`);

      const exitStrategy = await MutualFundExitStrategy.findById(strategyId)
        .populate('clientId', 'firstName lastName email phoneNumber')
        .populate('advisorId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email');

      if (!exitStrategy) {
        return res.status(404).json({
          success: false,
          message: 'Exit strategy not found'
        });
      }

      // Verify advisor has access to this strategy
      if (exitStrategy.advisorId.toString() !== advisorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this exit strategy'
        });
      }

      res.json({
        success: true,
        data: exitStrategy
      });

    } catch (error) {
      logger.error('Error fetching exit strategy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exit strategy',
        error: error.message
      });
    }
  }

  /**
   * Update an existing exit strategy
   */
  async updateExitStrategy(req, res) {
    try {
      const advisorId = req.advisor.id;
      const strategyId = req.params.id;
      const updateData = req.body;

      logger.info(`Updating exit strategy: ${strategyId}`);

      const exitStrategy = await MutualFundExitStrategy.findById(strategyId);

      if (!exitStrategy) {
        return res.status(404).json({
          success: false,
          message: 'Exit strategy not found'
        });
      }

      // Verify advisor has access to this strategy
      if (exitStrategy.advisorId.toString() !== advisorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this exit strategy'
        });
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'advisorId' && key !== 'clientId') {
          exitStrategy[key] = updateData[key];
        }
      });

      exitStrategy.updatedBy = advisorId;
      exitStrategy.version += 1;

      await exitStrategy.save();

      logger.info(`Exit strategy updated successfully: ${strategyId}`);

      res.json({
        success: true,
        message: 'Exit strategy updated successfully',
        data: exitStrategy
      });

    } catch (error) {
      logger.error('Error updating exit strategy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exit strategy',
        error: error.message
      });
    }
  }

  /**
   * Get all exit strategies for a specific client
   */
  async getClientExitStrategies(req, res) {
    try {
      const advisorId = req.advisor.id;
      const clientId = req.params.clientId;

      logger.info(`Fetching exit strategies for client: ${clientId}`);

      // Verify client belongs to advisor
      const client = await Client.findOne({
        _id: clientId,
        advisor: advisorId,
        isActive: true
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found or access denied'
        });
      }

      const exitStrategies = await MutualFundExitStrategy.find({
        clientId,
        advisorId: new mongoose.Types.ObjectId(advisorId), // ✅ FIXED: Convert to ObjectId
        isActive: true
      }).populate('advisorId', 'firstName lastName email');

      res.json({
        success: true,
        data: exitStrategies,
        count: exitStrategies.length
      });

    } catch (error) {
      logger.error('Error fetching client exit strategies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client exit strategies',
        error: error.message
      });
    }
  }

  /**
   * Get exit strategies summary for advisor dashboard
   */
  async getAdvisorExitStrategiesSummary(req, res) {
    try {
      const advisorId = req.advisor.id;

      logger.info(`Fetching exit strategies summary for advisor: ${advisorId}`);

      // ✅ FIXED: Convert advisorId to ObjectId for aggregation
      const advisorObjectId = new mongoose.Types.ObjectId(advisorId);

      const summary = await MutualFundExitStrategy.aggregate([
        { $match: { advisorId: advisorObjectId, isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$primaryExitAnalysis.currentValue' },
            avgNetBenefit: { $avg: '$costBenefitAnalysis.netBenefit' }
          }
        }
      ]);

      const totalStrategies = await MutualFundExitStrategy.countDocuments({
        advisorId: advisorObjectId,
        isActive: true
      });

      const totalValue = await MutualFundExitStrategy.aggregate([
        { $match: { advisorId: advisorObjectId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$primaryExitAnalysis.currentValue' } } }
      ]);

      res.json({
        success: true,
        data: {
          summary,
          totalStrategies,
          totalValue: totalValue[0]?.total || 0
        }
      });

    } catch (error) {
      logger.error('Error fetching advisor exit strategies summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exit strategies summary',
        error: error.message
      });
    }
  }
}

module.exports = new MutualFundExitController();