/**
 * FILE LOCATION: backend/controllers/mutualFundRecommendController.js
 * 
 * PURPOSE: Controller for managing mutual fund recommendations
 * 
 * FUNCTIONALITY:
 * - CRUD operations for mutual fund recommendations
 * - Integration with Claude AI API for fund details
 * - Multi-tenant data isolation for advisors
 * - Validation and error handling
 * - Audit logging and tracking
 * 
 * API ENDPOINTS:
 * - GET /: Get all recommendations for a client
 * - POST /: Create new recommendation with Claude AI integration
 * - PUT /:id: Update existing recommendation
 * - DELETE /:id: Delete recommendation
 * - GET /summary: Get recommendations summary
 * 
 * SECURITY:
 * - JWT authentication required
 * - Advisor role validation
 * - Client ownership verification
 * - Data isolation between advisors
 */

const MutualFundRecommend = require('../models/MutualFundRecommend');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');
const claudeMutualFundService = require('../services/claudeMutualFundService');

/**
 * Get all mutual fund recommendations for a specific client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClientRecommendations = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;

    // Verify client ownership
    const client = await Client.findOne({ _id: clientId, advisorId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get recommendations for the client
    const recommendations = await MutualFundRecommend.find({ 
      clientId, 
      advisorId 
    }).sort({ createdAt: -1 });

    logger.info(`Retrieved ${recommendations.length} recommendations for client ${clientId} by advisor ${advisorId}`);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    logger.error('Error in getClientRecommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create a new mutual fund recommendation with Claude AI integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRecommendation = async (req, res) => {
  try {
    // 🐛 DEBUG: Log incoming request details
    console.log(`🔍 [CONTROLLER DEBUG] createRecommendation called:`, {
      hasAdvisor: !!req.advisor,
      advisorId: req.advisor?.id,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'NO_BODY',
      timestamp: new Date().toISOString()
    });

    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      console.log(`❌ [CONTROLLER DEBUG] Authentication failed: no advisor`);
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;
    const {
      clientId,
      fundName,
      fundHouseName,
      recommendedMonthlySIP,
      sipStartDate,
      expectedExitDate,
      exitConditions,
      reasonForRecommendation,
      riskProfile,
      investmentGoal
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'clientId', 'fundName', 'fundHouseName', 'recommendedMonthlySIP',
      'sipStartDate', 'expectedExitDate', 'exitConditions', 
      'reasonForRecommendation', 'riskProfile', 'investmentGoal'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Verify client ownership
    console.log(`🔍 [CONTROLLER DEBUG] Looking for client: clientId=${clientId}, advisorId=${advisorId}`);
    logger.info(`Looking for client with ID: ${clientId} and advisorId: ${advisorId}`);
    
    const client = await Client.findOne({ _id: clientId, advisorId });
    console.log(`🔍 [CONTROLLER DEBUG] Client lookup result:`, {
      found: !!client,
      clientId,
      advisorId,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'NOT_FOUND'
    });
    
    if (!client) {
      console.log(`❌ [CONTROLLER DEBUG] Client not found: clientId=${clientId}, advisorId=${advisorId}`);
      logger.warn(`Client not found: clientId=${clientId}, advisorId=${advisorId}`);
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }
    
    console.log(`✅ [CONTROLLER DEBUG] Client found: ${client.firstName} ${client.lastName}`);
    logger.info(`Found client: ${client.firstName} ${client.lastName}`);

    // Validate dates
    const startDate = new Date(sipStartDate);
    const exitDate = new Date(expectedExitDate);
    const today = new Date();

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'SIP start date cannot be in the past'
      });
    }

    if (exitDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Exit date must be after SIP start date'
      });
    }

    // Validate SIP amount
    if (recommendedMonthlySIP < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum monthly SIP amount is ₹100'
      });
    }

    // Create recommendation object
    const recommendationData = {
      clientId,
      advisorId,
      fundName: fundName.trim(),
      fundHouseName: fundHouseName.trim(),
      recommendedMonthlySIP,
      sipStartDate: startDate,
      expectedExitDate: exitDate,
      exitConditions: exitConditions.trim(),
      reasonForRecommendation: reasonForRecommendation.trim(),
      riskProfile,
      investmentGoal,
      claudeResponse: req.body.claudeResponse || null
    };

    // Create the recommendation
    const recommendation = new MutualFundRecommend(recommendationData);
    await recommendation.save();

    logger.info(`Created mutual fund recommendation for client ${clientId} by advisor ${advisorId}`);

    res.status(201).json({
      success: true,
      message: 'Recommendation created successfully',
      data: recommendation
    });

  } catch (error) {
    logger.error('Error in createRecommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update an existing mutual fund recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;
    const updateData = req.body;

    // Find and verify ownership
    const recommendation = await MutualFundRecommend.findOne({ 
      _id: id, 
      advisorId 
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found or access denied'
      });
    }

    // Validate dates if provided
    if (updateData.sipStartDate || updateData.expectedExitDate) {
      const startDate = updateData.sipStartDate ? new Date(updateData.sipStartDate) : recommendation.sipStartDate;
      const exitDate = updateData.expectedExitDate ? new Date(updateData.expectedExitDate) : recommendation.expectedExitDate;
      const today = new Date();

      if (startDate < today) {
        return res.status(400).json({
          success: false,
          message: 'SIP start date cannot be in the past'
        });
      }

      if (exitDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'Exit date must be after SIP start date'
        });
      }
    }

    // Validate SIP amount if provided
    if (updateData.recommendedMonthlySIP && updateData.recommendedMonthlySIP < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum monthly SIP amount is ₹100'
      });
    }

    // Update the recommendation
    const updatedRecommendation = await MutualFundRecommend.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    logger.info(`Updated mutual fund recommendation ${id} by advisor ${advisorId}`);

    res.json({
      success: true,
      message: 'Recommendation updated successfully',
      data: updatedRecommendation
    });

  } catch (error) {
    logger.error('Error in updateRecommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete a mutual fund recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;

    // Find and verify ownership
    const recommendation = await MutualFundRecommend.findOne({ 
      _id: id, 
      advisorId 
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found or access denied'
      });
    }

    // Delete the recommendation
    await MutualFundRecommend.findByIdAndDelete(id);

    logger.info(`Deleted mutual fund recommendation ${id} by advisor ${advisorId}`);

    res.json({
      success: true,
      message: 'Recommendation deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteRecommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get recommendations summary for an advisor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRecommendationsSummary = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;

    // Get summary statistics
    const totalRecommendations = await MutualFundRecommend.countDocuments({ advisorId });
    const activeRecommendations = await MutualFundRecommend.countDocuments({ 
      advisorId, 
      status: 'active' 
    });
    const completedRecommendations = await MutualFundRecommend.countDocuments({ 
      advisorId, 
      status: 'completed' 
    });

    // Get recent recommendations
    const recentRecommendations = await MutualFundRecommend.find({ advisorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fundName fundHouseName clientId status createdAt');

    // Get recommendations by risk profile
    const riskProfileStats = await MutualFundRecommend.aggregate([
      { $match: { advisorId: new require('mongoose').Types.ObjectId(advisorId) } },
      { $group: { _id: '$riskProfile', count: { $sum: 1 } } }
    ]);

    // Get recommendations by investment goal
    const investmentGoalStats = await MutualFundRecommend.aggregate([
      { $match: { advisorId: new require('mongoose').Types.ObjectId(advisorId) } },
      { $group: { _id: '$investmentGoal', count: { $sum: 1 } } }
    ]);

    const summary = {
      total: totalRecommendations,
      active: activeRecommendations,
      completed: completedRecommendations,
      recent: recentRecommendations,
      riskProfileDistribution: riskProfileStats,
      investmentGoalDistribution: investmentGoalStats
    };

    logger.info(`Retrieved recommendations summary for advisor ${advisorId}`);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error in getRecommendationsSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get a specific recommendation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;

    // Find and verify ownership
    const recommendation = await MutualFundRecommend.findOne({ 
      _id: id, 
      advisorId 
    }).populate('clientId', 'firstName lastName email');

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found or access denied'
      });
    }

    logger.info(`Retrieved mutual fund recommendation ${id} by advisor ${advisorId}`);

    res.json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    logger.error('Error in getRecommendationById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Fetch mutual fund details from Claude AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fetchFundDetailsFromClaude = async (req, res) => {
  try {
    const { fundName, fundHouseName } = req.body;
    
    // Check if user is authenticated
    if (!req.advisor || !req.advisor.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const advisorId = req.advisor.id;

    // Validate required fields
    if (!fundName || !fundHouseName) {
      return res.status(400).json({
        success: false,
        message: 'Fund name and fund house name are required'
      });
    }

    logger.info(`Fetching fund details from Claude AI for: ${fundName} (${fundHouseName}) by advisor ${advisorId}`);

    // Fetch details from Claude AI
    const claudeResponse = await claudeMutualFundService.fetchMutualFundDetails(fundName, fundHouseName);

    if (!claudeResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fund details from Claude AI',
        error: claudeResponse.error
      });
    }

    // Parse the Claude AI response into structured data
    const parsedData = claudeMutualFundService.parseClaudeResponse(claudeResponse.data);
    
    // Validate the response data
    const validation = claudeMutualFundService.validateFundData(parsedData);

    logger.info(`Successfully fetched fund details from Claude AI for ${fundName}. Completeness: ${validation.completeness}%`);

    res.json({
      success: true,
      data: parsedData,
      validation
    });

  } catch (error) {
    logger.error('Error in fetchFundDetailsFromClaude:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getClientRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  getRecommendationsSummary,
  getRecommendationById,
  fetchFundDetailsFromClaude
};
