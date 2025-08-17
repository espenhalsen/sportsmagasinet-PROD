/**
 * Vipps API client and utilities
 */

import { VIPPS_CONFIG, VIPPS_ENDPOINTS, getVippsHeaders, validateVippsConfig } from './config';

/**
 * Get Vipps access token
 */
export async function getVippsAccessToken() {
  validateVippsConfig();
  
  console.log('Vipps auth request:', {
    url: `${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.ACCESS_TOKEN}`,
    clientId: VIPPS_CONFIG.CLIENT_ID ? VIPPS_CONFIG.CLIENT_ID.substring(0, 8) + '...' : 'MISSING',
    clientSecret: VIPPS_CONFIG.CLIENT_SECRET ? 'SET (length: ' + VIPPS_CONFIG.CLIENT_SECRET.length + ')' : 'MISSING',
    subscriptionKey: VIPPS_CONFIG.SUBSCRIPTION_KEY ? VIPPS_CONFIG.SUBSCRIPTION_KEY.substring(0, 8) + '...' : 'MISSING',
    merchantSerial: VIPPS_CONFIG.MERCHANT_SERIAL_NUMBER || 'MISSING'
  });
  
  try {
    const authHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Ocp-Apim-Subscription-Key': VIPPS_CONFIG.SUBSCRIPTION_KEY,
      'client_id': VIPPS_CONFIG.CLIENT_ID,
      'client_secret': VIPPS_CONFIG.CLIENT_SECRET,
      'Vipps-System-Name': 'Sportsmagasinet',
      'Vipps-System-Version': '1.0.0',
      'Vipps-System-Plugin-Name': 'sportsmagasinet-plugin',
      'Vipps-System-Plugin-Version': '1.0.0'
    };

    console.log('Vipps auth headers:', {
      ...authHeaders,
      client_secret: 'HIDDEN'
    });

    const response = await fetch(`${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.ACCESS_TOKEN}`, {
      method: 'POST',
      headers: authHeaders,
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString()
    });

    console.log('Vipps auth response:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log('Vipps auth error body:', errorBody);
      throw new Error(`Vipps auth failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Vipps access token:', error);
    throw error;
  }
}

/**
 * Create a Vipps recurring payment agreement for license sale
 */
export async function createVippsAgreement(saleData) {
  const accessToken = await getVippsAccessToken();
  
  // Ensure URLs are HTTPS
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';
  const httpsBaseUrl = baseUrl.startsWith('http://') ? baseUrl.replace('http://', 'https://') : baseUrl;
  
  // Truncate productName to max 45 characters
  const maxProductNameLength = 45;
  let productName = `${saleData.clubName} - Lisens`;
  if (productName.length > maxProductNameLength) {
    productName = productName.substring(0, maxProductNameLength - 3) + '...';
  }

  // Check if we should add a free campaign until 2026-01-01
  const now = new Date();
  const campaignEndDate = new Date('2026-01-01T00:00:00Z');
  const shouldAddCampaign = now < campaignEndDate;

  const agreementData = {
    interval: {
      unit: 'MONTH', 
      count: 1
    },
    merchantRedirectUrl: `${httpsBaseUrl}/buy/success?r=${saleData.saleId}`,
    merchantAgreementUrl: `${httpsBaseUrl}/buy/manage?r=${saleData.saleId}`,
    pricing: {
      amount: VIPPS_CONFIG.SALE_PRICE * 100, // Convert to øre (100 NOK = 10000 øre)
      currency: VIPPS_CONFIG.CURRENCY
    },
    productName: productName,
    productDescription: `Månedlig lisens for ${saleData.clubName}`,
    scope: "address name email birthDate phoneNumber" // Request user profile information
  };

  // Add campaign if start date is before 2026-01-01
  if (shouldAddCampaign) {
    agreementData.campaign = {
      type: "PRICE_CAMPAIGN",
      end: "2026-01-01T00:00:00Z",
      price: 0
    };
  }

  console.log('Vipps agreement data:', {
    ...agreementData,
    productNameLength: productName.length
  });

  try {
    // Generate unique idempotency key (UUID format)
    const idempotencyKey = crypto.randomUUID();
    
    const headers = {
      ...getVippsHeaders(accessToken),
      'Idempotency-Key': idempotencyKey
    };

    console.log('Vipps request headers:', {
      ...headers,
      'Authorization': 'Bearer [HIDDEN]'
    });

    const response = await fetch(`${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.CREATE_AGREEMENT}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(agreementData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vipps agreement creation failed: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    
    console.log('Vipps API response:', result);
    
    return {
      agreementId: result.agreementId,
      vippsLandingPage: result.vippsConfirmationUrl || result.vippsLandingPage
    };
  } catch (error) {
    console.error('Error creating Vipps agreement:', error);
    throw error;
  }
}

/**
 * Get Vipps agreement status
 */
export async function getVippsAgreement(agreementId) {
  const accessToken = await getVippsAccessToken();
  
  try {
    const response = await fetch(
      `${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.GET_AGREEMENT.replace('{agreementId}', agreementId)}`,
      {
        method: 'GET',
        headers: getVippsHeaders(accessToken)
      }
    );

    if (!response.ok) {
      throw new Error(`Vipps get agreement failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Vipps agreement:', error);
    throw error;
  }
}

/**
 * Cancel Vipps agreement
 */
export async function cancelVippsAgreement(agreementId) {
  const accessToken = await getVippsAccessToken();
  
  try {
    const response = await fetch(
      `${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.CANCEL_AGREEMENT.replace('{agreementId}', agreementId)}`,
      {
        method: 'PATCH',
        headers: getVippsHeaders(accessToken),
        body: JSON.stringify({
          status: 'STOPPED'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Vipps cancel agreement failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling Vipps agreement:', error);
    throw error;
  }
}

/**
 * Charge a Vipps agreement (for the actual payment)
 */
export async function chargeVippsAgreement(agreementId, chargeData) {
  const accessToken = await getVippsAccessToken();
  
  const charge = {
    amount: VIPPS_CONFIG.SALE_PRICE,
    currency: VIPPS_CONFIG.CURRENCY,
    description: `Lisensalg - ${chargeData.customerName || chargeData.customerEmail}`,
    due: new Date().toISOString(),
    retryDays: 3,
    orderId: chargeData.orderId || `sale-${Date.now()}`
  };

  try {
    const response = await fetch(
      `${VIPPS_CONFIG.BASE_URL}${VIPPS_ENDPOINTS.CHARGE_AGREEMENT.replace('{agreementId}', agreementId)}`,
      {
        method: 'POST',
        headers: getVippsHeaders(accessToken),
        body: JSON.stringify(charge)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vipps charge failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error charging Vipps agreement:', error);
    throw error;
  }
}

/**
 * Get user information from Vipps using the sub from agreement
 */
export async function getVippsUserInfo(sub) {
  try {
    // Note: userinfo endpoint requires different auth - no subscription key
    const response = await fetch(
      `${VIPPS_CONFIG.BASE_URL}/vipps-userinfo-api/userinfo/${sub}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getVippsAccessToken()}`,
          'Vipps-System-Name': 'Sportsmagasinet',
          'Vipps-System-Version': '1.0.0',
          'Vipps-System-Plugin-Name': 'sportsmagasinet-plugin',
          'Vipps-System-Plugin-Version': '1.0.0'
          // Note: No Ocp-Apim-Subscription-Key for userinfo endpoint
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vipps userinfo failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Vipps user info:', error);
    throw error;
  }
}
