import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { user } = auth;
    
    // Get full user data from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // Get additional data based on role
    let additionalData = {};
    
    if (user.role === 'agent') {
      // Get agent's clubs count
      const clubsSnapshot = await db.collection('clubs')
        .where('agentId', '==', user.uid)
        .get();
      additionalData.totalClubs = clubsSnapshot.size;
      
    } else if (user.role === 'club_admin' && user.clubId) {
      // Get club data
      const clubDoc = await db.collection('clubs').doc(user.clubId).get();
      if (clubDoc.exists) {
        additionalData.club = clubDoc.data();
      }
      
    } else if (user.role === 'seller' && user.clubId) {
      // Get seller's club info
      const clubDoc = await db.collection('clubs').doc(user.clubId).get();
      if (clubDoc.exists) {
        additionalData.clubName = clubDoc.data().name;
      }
      
      // Get seller's subscribers count
      const subscribersSnapshot = await db.collection('users')
        .where('role', '==', 'subscriber')
        .where('sellerId', '==', user.uid)
        .get();
      additionalData.totalSubscribers = subscribersSnapshot.size;
      
    } else if (user.role === 'subscriber') {
      // Get subscription info
      const subscriptionDoc = await db.collection('subscriptions')
        .where('userId', '==', user.uid)
        .where('status', '==', 'active')
        .limit(1)
        .get();
        
      if (!subscriptionDoc.empty) {
        additionalData.subscription = subscriptionDoc.docs[0].data();
      }
    }
    
    return NextResponse.json({
      uid: user.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      phone: userData.phone,
      createdAt: userData.createdAt,
      clubId: userData.clubId || user.clubId || null, // Fallback to auth custom claims
      profileImageUrl: userData.profileImageUrl || null,
      city: userData.city || null,
      address: userData.address || null,
      postalCode: userData.postalCode || null,
      ...additionalData,
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
