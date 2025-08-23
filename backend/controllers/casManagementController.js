// Location: backend/controllers/casManagementController.js

const Client = require('../models/Client');
const { logger } = require('../utils/logger');

class CASManagementController {
  /**
   * Get all clients of an advisor who have CAS data
   */
  static getAdvisorClientsWithCAS = async (req, res) => {
    try {
      const advisorId = req.advisor.id;
      
      console.log(`📋 [CAS Management] Fetching clients with CAS data for advisor: ${advisorId}`);
      
      // Find all clients belonging to this advisor who have CAS data
      const clients = await Client.find({
        advisor: advisorId,
        'casData.casStatus': { $in: ['parsed', 'uploaded'] },
        'casData.parsedData': { $exists: true, $ne: null }
      })
      .select('firstName lastName email casData status createdAt')
      .sort({ createdAt: -1 });

      console.log(`✅ [CAS Management] Found ${clients.length} clients with CAS data`);

      // Format the response
      const formattedClients = clients.map(client => {
        const casData = client.casData;
        const portfolioValue = casData?.parsedData?.summary?.total_value || 0;
        const dematAccounts = casData?.parsedData?.demat_accounts?.length || 0;
        const mutualFunds = casData?.parsedData?.mutual_funds?.length || 0;
        
        return {
          clientId: client._id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          status: client.status,
          createdAt: client.createdAt,
          casInfo: {
            status: casData.casStatus,
            lastParsedAt: casData.lastParsedAt,
            portfolioValue: portfolioValue,
            dematAccountsCount: dematAccounts,
            mutualFundsCount: mutualFunds,
            fileName: casData.casFile?.fileName || 'Unknown',
            uploadDate: casData.casFile?.uploadDate
          }
        };
      });

      res.json({
        success: true,
        data: {
          totalClients: formattedClients.length,
          clients: formattedClients
        }
      });

    } catch (error) {
      logger.error('Error fetching clients with CAS data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients with CAS data',
        error: error.message
      });
    }
  };

  /**
   * Get detailed CAS information for a specific client
   */
  static getClientCASDetails = async (req, res) => {
    try {
      const advisorId = req.advisor.id;
      const { clientId } = req.params;

      console.log(`📊 [CAS Management] Fetching CAS details for client: ${clientId}`);

      // Find client belonging to this advisor with CAS data
      const client = await Client.findOne({
        _id: clientId,
        advisor: advisorId,
        'casData.casStatus': { $in: ['parsed', 'uploaded'] }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found or no CAS data available'
        });
      }

      const casData = client.casData;
      
      // Format detailed CAS information
      const casDetails = {
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email
        },
        casFile: {
          fileName: casData.casFile?.fileName || 'Unknown',
          uploadDate: casData.casFile?.uploadDate,
          fileSize: casData.casFile?.fileSize,
          status: casData.casStatus,
          lastParsedAt: casData.lastParsedAt
        },
        investor: casData.parsedData?.investor || {},
        portfolio: {
          totalValue: casData.parsedData?.summary?.total_value || 0,
          currency: casData.parsedData?.summary?.currency || 'INR',
          assetAllocation: casData.parsedData?.summary?.asset_allocation || {}
        },
        accounts: {
          demat: {
            count: casData.parsedData?.demat_accounts?.length || 0,
            totalValue: casData.parsedData?.summary?.accounts?.demat?.total_value || 0,
            accounts: casData.parsedData?.demat_accounts || []
          },
          mutualFunds: {
            count: casData.parsedData?.mutual_funds?.length || 0,
            totalValue: casData.parsedData?.summary?.accounts?.mutual_funds?.total_value || 0,
            folios: casData.parsedData?.mutual_funds || []
          },
          insurance: {
            lifePolicies: casData.parsedData?.insurance?.life_insurance_policies?.length || 0,
            healthPolicies: casData.parsedData?.insurance?.health_insurance_policies?.length || 0,
            totalSumAssured: casData.parsedData?.summary?.accounts?.insurance?.total_sum_assured || 0
          }
        },
        processingHistory: casData.processingHistory || []
      };

      console.log(`✅ [CAS Management] CAS details fetched successfully for client: ${client.firstName} ${client.lastName}`);

      res.json({
        success: true,
        data: casDetails
      });

    } catch (error) {
      logger.error('Error fetching client CAS details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client CAS details',
        error: error.message
      });
    }
  };

  /**
   * Get CAS summary statistics for advisor
   */
  static getAdvisorCASSummary = async (req, res) => {
    try {
      const advisorId = req.advisor.id;
      
      console.log(`📈 [CAS Management] Fetching CAS summary for advisor: ${advisorId}`);

      // Get all clients with CAS data
      const clientsWithCAS = await Client.find({
        advisor: advisorId,
        'casData.casStatus': { $in: ['parsed', 'uploaded'] }
      });

      // Calculate summary statistics
      const totalClients = await Client.countDocuments({ advisor: advisorId });
      const clientsWithCASCount = clientsWithCAS.length;
      const casPercentage = totalClients > 0 ? Math.round((clientsWithCASCount / totalClients) * 100) : 0;

      let totalPortfolioValue = 0;
      let totalDematAccounts = 0;
      let totalMutualFundFolios = 0;

      clientsWithCAS.forEach(client => {
        const casData = client.casData;
        totalPortfolioValue += casData?.parsedData?.summary?.total_value || 0;
        totalDematAccounts += casData?.parsedData?.demat_accounts?.length || 0;
        totalMutualFundFolios += casData?.parsedData?.mutual_funds?.length || 0;
      });

      const summary = {
        totalClients,
        clientsWithCAS: clientsWithCASCount,
        casPercentage,
        totalPortfolioValue,
        totalDematAccounts,
        totalMutualFundFolios,
        averagePortfolioValue: clientsWithCASCount > 0 ? Math.round(totalPortfolioValue / clientsWithCASCount) : 0
      };

      console.log(`✅ [CAS Management] Summary calculated: ${clientsWithCASCount}/${totalClients} clients have CAS data`);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Error fetching CAS summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch CAS summary',
        error: error.message
      });
    }
  };
}

module.exports = CASManagementController;
