// DISABLED - Not currently in use
// Causing build errors due to Firebase config issues
// Uncomment and fix imports when needed

/*
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, FieldValue } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/utils/auth';
import { getLicensePackageById } from '@/utils/packages';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authResult;

    // Check if user is club admin
    if (user.role !== 'club_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { packageId, clubId, returnUrl, cancelUrl } = await request.json();

    if (!packageId || !clubId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // db is already imported

    // Verify club ownership
    const clubDoc = await db.collection('clubs').doc(clubId).get();
    if (!clubDoc.exists || clubDoc.data().adminId !== user.uid) {
      return NextResponse.json({ error: 'Club not found or access denied' }, { status: 403 });
    }

    const clubData = clubDoc.data();

    // Get package details
    const packageInfo = getLicensePackageById(packageId);
    if (!packageInfo) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Verify package assignment
    if (clubData.packageId !== packageId) {
      return NextResponse.json({ error: 'Package not assigned to club' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'nok',
            product_data: {
              name: `${packageInfo.name} - Lisensabonnement`,
              description: `${packageInfo.licenses} lisenser for ${clubData.name}`,
              metadata: {
                packageId: packageInfo.id,
                clubId: clubId,
                licenses: packageInfo.licenses.toString(),
              },
            },
            unit_amount: packageInfo.monthlyPrice * 100, // Convert NOK to øre
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: clubId,
      metadata: {
        clubId: clubId,
        packageId: packageInfo.id,
        adminId: user.uid,
        agentId: clubData.agentId || '',
        licenses: packageInfo.licenses.toString(),
      },
      success_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/club?payment=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/club?payment=cancelled`,
    });

    // Update club status to indicate payment in progress
    await db.collection('clubs').doc(clubId).update({
      packageStatus: 'pending_payment',
      stripeSessionId: session.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
*/

// Placeholder function to prevent build errors
export async function POST(request) {
  return new Response(JSON.stringify({ error: 'Stripe checkout disabled' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}
