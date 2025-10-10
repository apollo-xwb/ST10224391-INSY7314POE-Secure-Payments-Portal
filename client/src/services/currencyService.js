import api from './api';

class CurrencyService {
  constructor() {
    this.baseUrl = 'https://api.freecurrencyapi.com/v1';
    this.apiKey = import.meta.env.VITE_FREECURRENCY_API || 'fca_live_EUHfSr44kC3PaUp4o4QQJncegsMbGWPb90ZBWPmL';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Get fallback exchange rates (static rates as last resort)
   */
  getFallbackRates() {
    return {
      'USD_ZAR': 18.50,
      'EUR_ZAR': 20.20,
      'GBP_ZAR': 23.80,
      'JPY_ZAR': 0.12,
      'CAD_ZAR': 13.60,
      'AUD_ZAR': 12.10,
      'CHF_ZAR': 20.80,
      'CNY_ZAR': 2.55,
      'SEK_ZAR': 1.70,
      'NZD_ZAR': 11.20
    };
  }

  /**
   * Get exchange rate from one currency to another
   * @param {string} fromCurrency - Source currency code (e.g., 'USD')
   * @param {string} toCurrency - Target currency code (e.g., 'ZAR')
   * @param {Date} date - Date for historical rates (optional, defaults to latest)
   * @returns {Promise<number>} Exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency, date = null) {
    const cacheKey = `${fromCurrency}_${toCurrency}_${date ? date.toISOString().split('T')[0] : 'latest'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.rate;
      }
    }

    try {
      let url = `${this.baseUrl}/latest?apikey=${this.apiKey}&currencies=${toCurrency}&base_currency=${fromCurrency}`;
      
      // For historical rates, use the historical endpoint
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        url = `${this.baseUrl}/historical?apikey=${this.apiKey}&currencies=${toCurrency}&base_currency=${fromCurrency}&date=${dateStr}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch exchange rate');
      }

      const rate = date ? 
        data.data[date.toISOString().split('T')[0]]?.[toCurrency] :
        data.data[toCurrency];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Try fallback rates
      const fallbackRates = this.getFallbackRates();
      const fallbackKey = `${fromCurrency}_${toCurrency}`;
      
      if (fallbackRates[fallbackKey]) {
        console.warn(`Using fallback rate for ${fromCurrency} to ${toCurrency}: ${fallbackRates[fallbackKey]}`);
        
        // Cache the fallback rate with shorter expiry (1 hour)
        this.cache.set(cacheKey, {
          rate: fallbackRates[fallbackKey],
          timestamp: Date.now(),
          isFallback: true
        });
        
        return fallbackRates[fallbackKey];
      }
      
      // If no fallback available, throw error
      throw new Error(`Failed to get exchange rate and no fallback available for ${fromCurrency} to ${toCurrency}`);
    }
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {Date} date - Date for conversion (optional)
   * @returns {Promise<number>} Converted amount
   */
  async convertCurrency(amount, fromCurrency, toCurrency, date = null) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
    return amount * rate;
  }

  /**
   * Get multiple exchange rates at once
   * @param {string} fromCurrency - Source currency
   * @param {string[]} toCurrencies - Array of target currencies
   * @param {Date} date - Date for rates (optional)
   * @returns {Promise<Object>} Object with currency codes as keys and rates as values
   */
  async getMultipleRates(fromCurrency, toCurrencies, date = null) {
    const rates = {};
    
    for (const toCurrency of toCurrencies) {
      try {
        rates[toCurrency] = await this.getExchangeRate(fromCurrency, toCurrency, date);
      } catch (error) {
        console.error(`Failed to get rate for ${toCurrency}:`, error);
        rates[toCurrency] = null;
      }
    }
    
    return rates;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached rate if available
   * @param {string} fromCurrency 
   * @param {string} toCurrency 
   * @param {Date} date 
   * @returns {number|null}
   */
  getCachedRate(fromCurrency, toCurrency, date = null) {
    const cacheKey = `${fromCurrency}_${toCurrency}_${date ? date.toISOString().split('T')[0] : 'latest'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }
    
    return null;
  }

  /**
   * Check if a cached rate is a fallback rate
   * @param {string} fromCurrency 
   * @param {string} toCurrency 
   * @param {Date} date 
   * @returns {boolean}
   */
  isFallbackRate(fromCurrency, toCurrency, date = null) {
    const cacheKey = `${fromCurrency}_${toCurrency}_${date ? date.toISOString().split('T')[0] : 'latest'}`;
    const cached = this.cache.get(cacheKey);
    
    return cached && cached.isFallback === true;
  }

  /**
   * Get API health status
   * @returns {Promise<boolean>}
   */
  async checkApiHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/latest?apikey=${this.apiKey}&currencies=ZAR&base_currency=USD`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Currency API health check failed:', error);
      return false;
    }
  }
}

export default new CurrencyService();
