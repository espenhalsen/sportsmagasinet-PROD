/*import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import admin from '@/lib/firebase/admin';
import { getLicensePackageById } from '@/utils/packages';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, db);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, db);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, db);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, db);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, db);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, db);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session, db) {
  const { metadata, subscription: subscriptionId } = session;
  const { clubId, packageId, adminId, agentId, licenses } = metadata;

  if (!clubId || !packageId) {
    console.error('Missing metadata in checkout session:', metadata);
    return;
  }

  const batch = db.batch();
  
  try {
    // Update club with active package status
    const clubRef = db.collection('clubs').doc(clubId);
    batch.update(clubRef, {
      packageStatus: 'active',
      packageActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeSubscriptionId: subscriptionId,
      availableLicenses: parseInt(licenses),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create subscription record
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    batch.set(subscriptionRef, {
      clubId,
      packageId,
      adminId,
      agentId: agentId || null,
      stripeSubscriptionId: subscriptionId,
      stripeSessionId: session.id,
      status: 'active',
      licenses: parseInt(licenses),
      licensesUsed: 0,
      licensesAvailable: parseInt(licenses),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create initial commission record for agent if exists
    if (agentId && licenses) {
      const packageInfo = getLicensePackageById(packageId);
      const monthlyCommission = parseInt(licenses) * 1; // 1 NOK per license per month

      const commissionRef = db.collection('commissions').doc();
      batch.set(commissionRef, {
        agentId,
        clubId,
        packageId,
        subscriptionId,
        type: 'monthly_license',
        amount: monthlyCommission,
        licenses: parseInt(licenses),
        status: 'pending',
        paymentMethod: 'auto',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`Package activated for club ${clubId} with ${licenses} licenses`);
    
  } catch (error) {
    console.error('Error activating package:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription, db) {
  // Subscription is already handled in checkout.session.completed
  console.log('Subscription created:', subscription.id);
}

async function handleSubscriptionUpdated(subscription, db) {
  const { metadata, status } = subscription;
  
  if (metadata?.clubId) {
    try {
      // Update subscription status
      await db.collection('subscriptions').doc(subscription.id).update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update club package status based on subscription status
      let packageStatus = 'active';
      if (status === 'canceled' || status === 'unpaid') {
        packageStatus = 'inactive';
      } else if (status === 'past_due') {
        packageStatus = 'payment_failed';
      }

      await db.collection('clubs').doc(metadata.clubId).update({
        packageStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Subscription ${subscription.id} updated to ${status}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }
}

async function handleSubscriptionDeleted(subscription, db) {
  const { metadata } = subscription;
  
  if (metadata?.clubId) {
    try {
      const batch = db.batch();

      // Update subscription status
      const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
      batch.update(subscriptionRef, {
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Deactivate club package
      const clubRef = db.collection('clubs').doc(metadata.clubId);
      batch.update(clubRef, {
        packageStatus: 'inactive',
        availableLicenses: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      console.log(`Subscription ${subscription.id} canceled`);
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  }
}

async function handlePaymentSucceeded(invoice, db) {
  const { subscription: subscriptionId, metadata } = invoice;
  
  if (subscriptionId) {
    try {
      // Get subscription data to create commission record
      const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
      
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        
        // Create monthly commission record for agent
        if (subscriptionData.agentId) {
          await db.collection('commissions').add({
            agentId: subscriptionData.agentId,
            clubId: subscriptionData.clubId,
            packageId: subscriptionData.packageId,
            subscriptionId,
            invoiceId: invoice.id,
            type: 'monthly_license',
            amount: subscriptionData.licenses * 1, // 1 NOK per license per month
            licenses: subscriptionData.licenses,
            status: 'earned',
            paymentMethod: 'auto',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Update subscription with latest payment
        await db.collection('subscriptions').doc(subscriptionId).update({
          lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(`Payment succeeded for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error processing payment success:', error);
    }
  }
}

async function handlePaymentFailed(invoice, db) {
  const { subscription: subscriptionId } = invoice;
  
  if (subscriptionId) {
    try {
      // Get subscription data
      const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
      
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        
        // Update club package status
        await db.collection('clubs').doc(subscriptionData.clubId).update({
          packageStatus: 'payment_failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(`Payment failed for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error processing payment failure:', error);
    }
  }
}
*/
