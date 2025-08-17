/**
 * Vipps API configuration and utilities
 */

export const VIPPS_CONFIG = {
  // API URLs
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://apitest.vipps.no' 
    : 'https://apitest.vipps.no', // Test environment
  
  // Credentials
  CLIENT_ID: process.env.VIPPS_CLIENT_ID,
  CLIENT_SECRET: process.env.VIPPS_CLIENT_SECRET,
  SUBSCRIPTION_KEY: process.env.VIPPS_SUBSCRIPTION_KEY,
  
  // Merchant info
  MERCHANT_SERIAL_NUMBER: process.env.VIPPS_MERCHANT_SERIAL_NUMBER,
  
  // Fixed price for all sales (100 NOK)
  SALE_PRICE: 100,
  
  // Currency
  CURRENCY: 'NOK'
};

/**
 * Vipps API endpoints
 */
export const VIPPS_ENDPOINTS = {
  // Authentication
  ACCESS_TOKEN: '/accesstoken/get',
  
  // Recurring payments
  CREATE_AGREEMENT: '/recurring/v3/agreements',
  GET_AGREEMENT: '/recurring/v3/agreements/{agreementId}',
  CHARGE_AGREEMENT: '/recurring/v3/agreements/{agreementId}/charges',
  CANCEL_AGREEMENT: '/recurring/v3/agreements/{agreementId}',
  
  // Regular payments (ecom)
  INITIATE_PAYMENT: '/ecomm/v2/payments',
  GET_PAYMENT: '/ecomm/v2/payments/{orderId}',
  CAPTURE_PAYMENT: '/ecomm/v2/payments/{orderId}/capture',
  CANCEL_PAYMENT: '/ecomm/v2/payments/{orderId}/cancel'
};

/**
 * Get Vipps API headers
 */
export function getVippsHeaders(accessToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': VIPPS_CONFIG.SUBSCRIPTION_KEY,
    'Merchant-Serial-Number': VIPPS_CONFIG.MERCHANT_SERIAL_NUMBER,
    'Vipps-System-Name': 'Sportsmagasinet',
    'Vipps-System-Version': '1.0.0',
    'Vipps-System-Plugin-Name': 'sportsmagasinet-plugin',
    'Vipps-System-Plugin-Version': '1.0.0'
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * Validate Vipps configuration
 */
export function validateVippsConfig() {
  const required = [
    'VIPPS_CLIENT_ID',
    'VIPPS_CLIENT_SECRET', 
    'VIPPS_SUBSCRIPTION_KEY',
    'VIPPS_MERCHANT_SERIAL_NUMBER'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Vipps configuration: ${missing.join(', ')}`);
  }
  
  return true;
}
