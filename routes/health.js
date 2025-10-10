const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const apiHealth = await currencyService.checkApiHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        currencyApi: apiHealth ? 'ok' : 'degraded'
      },
      fallbackRates: {
        available: Object.keys(currencyService.getFallbackRates()).length,
        currencies: Object.keys(currencyService.getFallbackRates()).map(key => key.split('_')[0])
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;

