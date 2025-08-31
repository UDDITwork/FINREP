// File: backend/routes/estatePlanning.js
/**
 * Estate Planning API Routes
 * Handles estate planning data endpoints for financial advisors
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getClientEstatePlanningData,
  createOrUpdateEstateInformation,
  getEstateInformation,
  createOrUpdateWill,
  getWill
} = require('../controllers/estatePlanningController');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/estate-planning/client/:clientId
 * @desc    Get comprehensive estate planning data for a specific client
 * @access  Private (Advisor only)
 */
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    console.log('🏛️ [Estate Planning Route] Request received:', {
      clientId: req.params.clientId,
      advisorId: req.advisor.id,
      timestamp: new Date().toISOString()
    });

    await getClientEstatePlanningData(req, res);
  } catch (error) {
    console.error('❌ [Estate Planning Route] Error:', error);
    logger.error('Estate Planning Route Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route   POST /api/estate-planning/client/:clientId/information
 * @desc    Create or update comprehensive estate information for a client
 * @access  Private (Advisor only)
 */
router.post('/client/:clientId/information', auth, async (req, res) => {
  try {
    console.log('🏛️ [Estate Planning Route] Estate information update request received:', {
      clientId: req.params.clientId,
      advisorId: req.advisor.id,
      timestamp: new Date().toISOString()
    });

    await createOrUpdateEstateInformation(req, res);
  } catch (error) {
    console.error('❌ [Estate Planning Route] Estate information error:', error);
    logger.error('Estate Planning Route Estate Information Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route   GET /api/estate-planning/client/:clientId/information
 * @desc    Get comprehensive estate information for a specific client
 * @access  Private (Advisor only)
 */
router.get('/client/:clientId/information', auth, async (req, res) => {
  try {
    console.log('🏛️ [Estate Planning Route] Estate information fetch request received:', {
      clientId: req.params.clientId,
      advisorId: req.advisor.id,
      timestamp: new Date().toISOString()
    });

    await getEstateInformation(req, res);
  } catch (error) {
    console.error('❌ [Estate Planning Route] Estate information fetch error:', error);
    logger.error('Estate Planning Route Estate Information Fetch Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route   POST /api/estate-planning/client/:clientId/will
 * @desc    Create or update will content for a client
 * @access  Private (Advisor only)
 */
router.post('/client/:clientId/will', auth, async (req, res) => {
  try {
    console.log('📜 [Estate Planning Route] Will creation/update request received:', {
      clientId: req.params.clientId,
      advisorId: req.advisor.id,
      timestamp: new Date().toISOString()
    });

    await createOrUpdateWill(req, res);
  } catch (error) {
    console.error('❌ [Estate Planning Route] Will error:', error);
    logger.error('Estate Planning Route Will Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route   GET /api/estate-planning/client/:clientId/will
 * @desc    Get will content for a specific client
 * @access  Private (Advisor only)
 */
router.get('/client/:clientId/will', auth, async (req, res) => {
  try {
    console.log('📜 [Estate Planning Route] Will fetch request received:', {
      clientId: req.params.clientId,
      advisorId: req.advisor.id,
      timestamp: new Date().toISOString()
    });

    await getWill(req, res);
  } catch (error) {
    console.error('❌ [Estate Planning Route] Will fetch error:', error);
    logger.error('Estate Planning Route Will Fetch Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;
