import Stripe from 'stripe';

// Initialize Stripe - you'll need to add your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key', {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe customer
 */
export async function createCustomer(email, metadata = {}) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata,
    });
    return { success: true, customer };
  } catch (error) {
    console.error('Stripe create customer error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a payment intent for club license package purchase
 */
export async function createLicensePackagePayment(clubData, packageData) {
  try {
    const amount = packageData.pricePerLicense * packageData.size * 100; // Convert to øre
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'nok',
      description: `Lisenpakke - ${packageData.size} lisenser for ${clubData.name}`,
      metadata: {
        clubId: clubData.id,
        clubName: clubData.name,
        packageSize: packageData.size.toString(),
        pricePerLicense: packageData.pricePerLicense.toString(),
        type: 'license_package',
      },
    });
    
    return { success: true, paymentIntent };
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a subscription for a subscriber
 */
export async function createSubscription(customerId, clubId, subscriberId) {
  try {
    // First, create or get the price
    const price = await stripe.prices.create({
      unit_amount: 10000, // 100 NOK in øre
      currency: 'nok',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Sportsmagasinet Abonnement',
        metadata: {
          clubId,
          subscriberId,
        },
      },
    });
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        clubId,
        subscriberId,
      },
    });
    
    return { success: true, subscription };
  } catch (error) {
    console.error('Stripe subscription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a checkout session for immediate payment
 */
export async function createCheckoutSession(type, data) {
  try {
    let lineItems = [];
    let metadata = {};
    
    if (type === 'license_package') {
      lineItems = [{
        price_data: {
          currency: 'nok',
          product_data: {
            name: `Lisenpakke - ${data.packageSize} lisenser`,
            description: `For ${data.clubName}`,
          },
          unit_amount: data.pricePerLicense * 100,
        },
        quantity: data.packageSize,
      }];
      metadata = {
        type: 'license_package',
        clubId: data.clubId,
        packageSize: data.packageSize.toString(),
      };
    } else if (type === 'subscription') {
      lineItems = [{
        price_data: {
          currency: 'nok',
          product_data: {
            name: 'Sportsmagasinet Abonnement',
            description: `Via ${data.clubName}`,
          },
          unit_amount: 10000, // 100 NOK
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }];
      metadata = {
        type: 'subscription',
        subscriberId: data.subscriberId,
        clubId: data.clubId,
        sellerId: data.sellerId,
      };
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata,
    });
    
    return { success: true, session };
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Retrieve a checkout session
 */
export async function retrieveCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { success: true, session };
  } catch (error) {
    console.error('Retrieve session error:', error);
    return { success: false, error: error.message };
  }
}
