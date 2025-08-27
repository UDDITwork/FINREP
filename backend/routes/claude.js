/**
 * FILE LOCATION: backend/routes/claude.js
 * 
 * Claude AI routes for market analysis, insights, and recommendations.
 * All routes are protected and require authentication.
 */

const express = require('express');
const router = express.Router();
const claudeController = require('../controllers/claudeController');
const { auth } = require('../middleware/auth');

/**
 * @route POST /api/claude/analyze
 * @desc Generate market analysis using Claude AI
 * @access Private
 */
router.post('/analyze', auth, claudeController.analyzeMarket);

/**
 * @route POST /api/claude/sentiment
 * @desc Analyze market sentiment for specific stocks
 * @access Private
 */
router.post('/sentiment', auth, claudeController.analyzeSentiment);

/**
 * @route POST /api/claude/recommendations
 * @desc Generate stock recommendations
 * @access Private
 */
router.post('/recommendations', auth, claudeController.generateRecommendations);

/**
 * @route POST /api/claude/mutual-funds
 * @desc Analyze mutual funds
 * @access Private
 */
router.post('/mutual-funds', auth, claudeController.analyzeMutualFunds);

/**
 * @route POST /api/claude/outlook
 * @desc Generate market outlook
 * @access Private
 */
router.post('/outlook', auth, claudeController.generateMarketOutlook);

module.exports = router;
