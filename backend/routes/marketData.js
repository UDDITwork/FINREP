// File: backend/routes/marketData.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth: authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * Health check endpoint (no authentication required)
 * GET /api/market-data/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Market Data API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply authentication to all other routes
router.use(authenticateToken);

/**
 * Get NIFTY 50 data
 * GET /api/market-data/nifty50
 */
router.get('/nifty50', async (req, res) => {
  try {
    logger.info('[MARKET DATA] Fetching NIFTY 50 data');
    
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', {
      params: {
        interval: '1m',
        range: '1d'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = response.data;
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;
      const currentPrice = quote.close[quote.close.length - 1];
      const previousClose = result.meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const marketData = {
        symbol: '^NSEI',
        name: 'NIFTY 50',
        currentPrice: currentPrice,
        previousClose: previousClose,
        change: change,
        changePercent: changePercent,
        volume: quote.volume[quote.volume.length - 1] || 0,
        high: Math.max(...quote.high.filter(h => h !== null)),
        low: Math.min(...quote.low.filter(l => l !== null)),
        open: quote.open[0],
        timestamp: new Date().toISOString()
      };

      logger.info('[MARKET DATA] NIFTY 50 data fetched successfully');
      
      res.json({
        success: true,
        data: marketData
      });
    } else {
      throw new Error('Invalid data structure received from Yahoo Finance');
    }
  } catch (error) {
    logger.error('[MARKET DATA] Error fetching NIFTY 50:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NIFTY 50 data',
      error: error.message
    });
  }
});

/**
 * Get SENSEX data
 * GET /api/market-data/sensex
 */
router.get('/sensex', async (req, res) => {
  try {
    logger.info('[MARKET DATA] Fetching SENSEX data');
    
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN', {
      params: {
        interval: '1m',
        range: '1d'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = response.data;
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;
      const currentPrice = quote.close[quote.close.length - 1];
      const previousClose = result.meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const marketData = {
        symbol: '^BSESN',
        name: 'SENSEX',
        currentPrice: currentPrice,
        previousClose: previousClose,
        change: change,
        changePercent: changePercent,
        volume: quote.volume[quote.volume.length - 1] || 0,
        high: Math.max(...quote.high.filter(h => h !== null)),
        low: Math.min(...quote.low.filter(l => l !== null)),
        open: quote.open[0],
        timestamp: new Date().toISOString()
      };

      logger.info('[MARKET DATA] SENSEX data fetched successfully');
      
      res.json({
        success: true,
        data: marketData
      });
    } else {
      throw new Error('Invalid data structure received from Yahoo Finance');
    }
  } catch (error) {
    logger.error('[MARKET DATA] Error fetching SENSEX:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SENSEX data',
      error: error.message
    });
  }
});

/**
 * Get Bank Nifty data
 * GET /api/market-data/banknifty
 */
router.get('/banknifty', async (req, res) => {
  try {
    logger.info('[MARKET DATA] Fetching Bank Nifty data');
    
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK', {
      params: {
        interval: '1m',
        range: '1d'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = response.data;
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;
      const currentPrice = quote.close[quote.close.length - 1];
      const previousClose = result.meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const marketData = {
        symbol: '^NSEBANK',
        name: 'Bank Nifty',
        currentPrice: currentPrice,
        previousClose: previousClose,
        change: change,
        changePercent: changePercent,
        volume: quote.volume[quote.volume.length - 1] || 0,
        high: Math.max(...quote.high.filter(h => h !== null)),
        low: Math.min(...quote.low.filter(l => l !== null)),
        open: quote.open[0],
        timestamp: new Date().toISOString()
      };

      logger.info('[MARKET DATA] Bank Nifty data fetched successfully');
      
      res.json({
        success: true,
        data: marketData
      });
    } else {
      throw new Error('Invalid data structure received from Yahoo Finance');
    }
  } catch (error) {
    logger.error('[MARKET DATA] Error fetching Bank Nifty:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Bank Nifty data',
      error: error.message
    });
  }
});

/**
 * Get all market data in one request
 * GET /api/market-data/overview
 */
router.get('/overview', async (req, res) => {
  try {
    logger.info('[MARKET DATA] Fetching market overview');
    
    // Fetch all market data in parallel
    const [niftyResponse, sensexResponse, bankNiftyResponse] = await Promise.allSettled([
      axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', {
        params: { interval: '1m', range: '1d' },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }),
      axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN', {
        params: { interval: '1m', range: '1d' },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }),
      axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK', {
        params: { interval: '1m', range: '1d' },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    ]);

    const marketData = {};

    // Process NIFTY 50
    if (niftyResponse.status === 'fulfilled') {
      const data = niftyResponse.value.data;
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const quote = result.indicators.quote[0];
        const currentPrice = quote.close[quote.close.length - 1];
        const previousClose = result.meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        marketData.nifty50 = {
          symbol: '^NSEI',
          name: 'NIFTY 50',
          currentPrice: currentPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: quote.volume[quote.volume.length - 1] || 0,
          high: Math.max(...quote.high.filter(h => h !== null)),
          low: Math.min(...quote.low.filter(l => l !== null)),
          open: quote.open[0]
        };
      }
    }

    // Process SENSEX
    if (sensexResponse.status === 'fulfilled') {
      const data = sensexResponse.value.data;
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const quote = result.indicators.quote[0];
        const currentPrice = quote.close[quote.close.length - 1];
        const previousClose = result.meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        marketData.sensex = {
          symbol: '^BSESN',
          name: 'SENSEX',
          currentPrice: currentPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: quote.volume[quote.volume.length - 1] || 0,
          high: Math.max(...quote.high.filter(h => h !== null)),
          low: Math.min(...quote.low.filter(l => l !== null)),
          open: quote.open[0]
        };
      }
    }

    // Process Bank Nifty
    if (bankNiftyResponse.status === 'fulfilled') {
      const data = bankNiftyResponse.value.data;
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const quote = result.indicators.quote[0];
        const currentPrice = quote.close[quote.close.length - 1];
        const previousClose = result.meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        marketData.bankNifty = {
          symbol: '^NSEBANK',
          name: 'Bank Nifty',
          currentPrice: currentPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: quote.volume[quote.volume.length - 1] || 0,
          high: Math.max(...quote.high.filter(h => h !== null)),
          low: Math.min(...quote.low.filter(l => l !== null)),
          open: quote.open[0]
        };
      }
    }

    marketData.timestamp = new Date().toISOString();

    logger.info('[MARKET DATA] Market overview fetched successfully');
    
    res.json({
      success: true,
      data: marketData
    });

  } catch (error) {
    logger.error('[MARKET DATA] Error fetching market overview:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview',
      error: error.message
    });
  }
});

module.exports = router;
