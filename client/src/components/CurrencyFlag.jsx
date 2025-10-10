import React from 'react';

const CurrencyFlag = ({ currency, className = "w-5 h-5" }) => {
  const getFlagEmoji = (currency) => {
    const flagMap = {
      'USD': '🇺🇸', // United States
      'EUR': '🇪🇺', // European Union
      'GBP': '🇬🇧', // United Kingdom
      'JPY': '🇯🇵', // Japan
      'CAD': '🇨🇦', // Canada
      'AUD': '🇦🇺', // Australia
      'CHF': '🇨🇭', // Switzerland
      'CNY': '🇨🇳', // China
      'SEK': '🇸🇪', // Sweden
      'NZD': '🇳🇿', // New Zealand
      'ZAR': '🇿🇦', // South Africa
    };
    
    return flagMap[currency] || '🌍';
  };

  return (
    <span className={`inline-block ${className}`} role="img" aria-label={`${currency} flag`}>
      {getFlagEmoji(currency)}
    </span>
  );
};

export default CurrencyFlag;
