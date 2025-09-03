/**
 * FILE LOCATION: frontend/src/services/mutualFundRecommendAPI.js
 * 
 * PURPOSE: API service for mutual fund recommendations
 * 
 * FUNCTIONALITY:
 * - CRUD operations for mutual fund recommendations
 * - Claude AI integration for fund details
 * - Error handling and response formatting
 * - Authentication token management
 * 
 * API ENDPOINTS:
 * - GET /client/:clientId: Get client recommendations
 * - POST /: Create recommendation
 * - PUT /:id: Update recommendation
 * - DELETE /:id: Delete recommendation
 * - POST /claude/fund-details: Fetch fund details from Claude AI
 * - GET /summary: Get recommendations summary
 */

import { apiClient } from './apiClient';

const BASE_URL = '/api/mutual-fund-recommend';

export const mutualFundRecommendAPI = {
  /**
   * Get all recommendations for a specific client
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - API response
   */
  getClientRecommendations: async (clientId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client recommendations:', error);
      throw error;
    }
  },

  /**
   * Create a new mutual fund recommendation
   * @param {Object} recommendationData - Recommendation data
   * @returns {Promise<Object>} - API response
   */
  createRecommendation: async (recommendationData) => {
    try {
      const response = await apiClient.post(`${BASE_URL}`, recommendationData);
      return response.data;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw error;
    }
  },

  /**
   * Update an existing recommendation
   * @param {string} id - Recommendation ID
   * @param {Object} updateData - Updated data
   * @returns {Promise<Object>} - API response
   */
  updateRecommendation: async (id, updateData) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  },

  /**
   * Delete a recommendation
   * @param {string} id - Recommendation ID
   * @returns {Promise<Object>} - API response
   */
  deleteRecommendation: async (id) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  },

  /**
   * Get a specific recommendation by ID
   * @param {string} id - Recommendation ID
   * @returns {Promise<Object>} - API response
   */
  getRecommendationById: async (id) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      throw error;
    }
  },

  /**
   * Get recommendations summary for the advisor
   * @returns {Promise<Object>} - API response
   */
  getRecommendationsSummary: async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations summary:', error);
      throw error;
    }
  },

  /**
   * Fetch mutual fund details from Claude AI
   * @param {string} fundName - Fund name
   * @param {string} fundHouseName - Fund house name
   * @returns {Promise<Object>} - API response
   */
  fetchFundDetails: async (fundName, fundHouseName) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/claude/fund-details`, {
        fundName,
        fundHouseName
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching fund details from Claude AI:', error);
      throw error;
    }
  }
};
