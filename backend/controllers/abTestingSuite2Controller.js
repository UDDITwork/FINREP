// File: backend/controllers/abTestingSuite2Controller.js
const ABTestSession = require('../models/ABTestSession');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');
const { validationResult } = require('express-validator');

// Create new A/B testing session
const createSession = async (req, res) => {
  try {
    const { clientId } = req.body;
    const advisorId = req.advisor.id;

    // Validate client exists and belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or not accessible'
      });
    }

    // Check for existing incomplete session
    const existingSession = await ABTestSession.findOne({
      clientId,
      advisorId,
      status: 'in_progress'
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'Existing session found',
        session: existingSession
      });
    }

    // Create client data snapshot
    const clientDataSnapshot = {
      personalInfo: {
        firstName: client.firstName,
        lastName: client.lastName,
        age: client.age || new Date().getFullYear() - new Date(client.dateOfBirth || '1990-01-01').getFullYear(),
        email: client.email,
        phoneNumber: client.phoneNumber
      },
      financialInfo: {
        totalMonthlyIncome: client.totalMonthlyIncome || 0,
        totalMonthlyExpenses: client.totalMonthlyExpenses || 0,
        incomeType: client.incomeType || 'Unknown',
        netWorth: client.calculatedFinancials?.netWorth || 0
      },
      existingInvestments: {
        totalValue: client.assets?.investments?.totalValue || 0,
        breakdown: client.casData?.parsedData?.summary || {}
      },
      goals: []
    };

    // Extract goals
    if (client.majorGoals && client.majorGoals.length > 0) {
      clientDataSnapshot.goals = client.majorGoals.map(goal => ({
        goalName: goal.goalName,
        targetAmount: goal.targetAmount,
        targetYear: goal.targetYear,
        priority: goal.priority
      }));
    }

    // Add retirement goal if exists
    if (client.retirementPlanning?.targetRetirementCorpus) {
      clientDataSnapshot.goals.push({
        goalName: 'Retirement Planning',
        targetAmount: client.retirementPlanning.targetRetirementCorpus,
        targetYear: client.retirementPlanning.retirementAge || 60,
        priority: 'High'
      });
    }

    // Create new session
    const newSession = new ABTestSession({
      clientId,
      advisorId,
      clientDataSnapshot,
      sessionStartTime: new Date(),
      status: 'in_progress'
    });

    await newSession.save();

    logger.info(`A/B Testing session created: ${newSession.sessionId} for client: ${clientId}`);

    res.status(201).json({
      success: true,
      message: 'A/B testing session created successfully',
      session: newSession
    });

  } catch (error) {
    logger.error('Error creating A/B testing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create A/B testing session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update risk profile
const updateRiskProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { riskProfile } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    await session.updateRiskProfile(riskProfile);
    await session.addUserInteraction('risk_assessment_complete', { riskProfile });

    logger.info(`Risk profile updated for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Risk profile updated successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error updating risk profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add investment scenarios
const addScenarios = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { scenarios } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    // Clear existing scenarios and add new ones
    session.scenarios = [];
    
    for (const scenarioData of scenarios) {
      await session.addScenario(scenarioData);
    }

    await session.addUserInteraction('scenarios_generated', { 
      scenarioCount: scenarios.length,
      scenarioTypes: scenarios.map(s => s.scenarioType)
    });

    logger.info(`${scenarios.length} scenarios added to session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Scenarios added successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error adding scenarios:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add scenarios',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update scenario selection
const updateScenarioSelection = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selectedScenarios } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    // Update selection status for all scenarios
    session.scenarios.forEach(scenario => {
      scenario.isSelected = selectedScenarios.includes(scenario.scenarioId);
    });

    await session.save();
    await session.addUserInteraction('scenario_selection_updated', { 
      selectedScenarios,
      totalSelected: selectedScenarios.length
    });

    logger.info(`Scenario selection updated for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Scenario selection updated successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error updating scenario selection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scenario selection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add simulation results
const addSimulationResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { simulationResults } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    // Clear existing simulation results and add new ones
    session.simulationResults = [];

    for (const [scenarioId, results] of Object.entries(simulationResults)) {
      await session.addSimulationResults(scenarioId, results);
    }

    await session.addUserInteraction('simulation_completed', {
      scenarioCount: Object.keys(simulationResults).length,
      calculationTimestamp: new Date()
    });

    logger.info(`Simulation results added for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Simulation results added successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error adding simulation results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add simulation results',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add stress test results
const addStressTestResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stressTestResults } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    // Clear existing stress test results and add new ones
    session.stressTestResults = [];

    for (const [scenarioId, results] of Object.entries(stressTestResults)) {
      await session.addStressTestResults(scenarioId, results);
    }

    await session.addUserInteraction('stress_testing_completed', {
      scenarioCount: Object.keys(stressTestResults).length,
      crisisScenariosTested: Object.keys(Object.values(stressTestResults)[0] || {}),
      calculationTimestamp: new Date()
    });

    logger.info(`Stress test results added for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Stress test results added successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error adding stress test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add stress test results',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Complete session
const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { completionData } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId,
      status: 'in_progress'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not accessible'
      });
    }

    await session.completeSession(completionData);
    await session.addUserInteraction('session_completed', completionData);

    logger.info(`A/B Testing session completed: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get session by ID
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId
    }).populate('clientId', 'firstName lastName email').populate('advisorId', 'firstName lastName');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      session: session
    });

  } catch (error) {
    logger.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all sessions for advisor
const getAdvisorSessions = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { page = 1, limit = 10, status, clientId } = req.query;

    const query = { advisorId };
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;

    const sessions = await ABTestSession.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ sessionStartTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ABTestSession.countDocuments(query);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching advisor sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add session note
const addSessionNote = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { noteType, content } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.addSessionNote(noteType, content, advisorId);

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      session: session
    });

  } catch (error) {
    logger.error('Error adding session note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Export session data
const exportSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { exportType = 'pdf_report' } = req.body;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId
    }).populate('clientId', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // For now, return the session data for frontend processing
    // In production, you might want to generate the export server-side
    const exportData = {
      sessionMetadata: {
        sessionId: session.sessionId,
        clientName: `${session.clientId.firstName} ${session.clientId.lastName}`,
        sessionDate: session.sessionStartTime,
        completionStatus: session.status,
        duration: session.currentDurationMinutes
      },
      clientData: session.clientDataSnapshot,
      riskProfile: session.riskProfile,
      scenarios: session.scenarios.filter(s => s.isSelected),
      simulationResults: session.simulationResults,
      stressTestResults: session.stressTestResults,
      finalRecommendations: session.finalRecommendations
    };

    await session.addExport(exportType, {
      fileName: `AB_Test_Report_${sessionId}.${exportType.split('_')[0]}`,
      fileSize: JSON.stringify(exportData).length,
      downloadCount: 1
    });

    res.status(200).json({
      success: true,
      message: 'Export data prepared',
      exportData
    });

  } catch (error) {
    logger.error('Error exporting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete/archive session
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const advisorId = req.advisor.id;

    const session = await ABTestSession.findOne({
      sessionId,
      advisorId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Archive instead of hard delete
    session.status = 'archived';
    await session.save();

    logger.info(`A/B Testing session archived: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session archived successfully'
    });

  } catch (error) {
    logger.error('Error archiving session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createSession,
  updateRiskProfile,
  addScenarios,
  updateScenarioSelection,
  addSimulationResults,
  addStressTestResults,
  completeSession,
  getSession,
  getAdvisorSessions,
  addSessionNote,
  exportSession,
  deleteSession
};