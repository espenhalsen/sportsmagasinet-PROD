import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;

    // Check if user is club admin
    if (user.role !== 'club_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = admin.firestore();

    // Get club data - try both adminId and clubId from user claims
    let clubDoc = null;
    
    // First try to find club by adminId
    if (user.uid) {
      const clubsSnapshot = await db.collection('clubs')
        .where('adminId', '==', user.uid)
        .limit(1)
        .get();
      
      if (!clubsSnapshot.empty) {
        clubDoc = clubsSnapshot.docs[0];
      }
    }
    
    // If not found and user has clubId in claims, try that
    if (!clubDoc && user.clubId) {
      const clubDocRef = await db.collection('clubs').doc(user.clubId).get();
      if (clubDocRef.exists) {
        clubDoc = clubDocRef;
      }
    }

    if (!clubDoc) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const clubData = clubDoc.data();
    const clubId = clubDoc.id;

    // Get members count
    const membersSnapshot = await db.collection('users')
      .where('clubId', '==', clubId)
      .where('role', '==', 'subscriber')
      .get();

    // Get sellers count
    const sellersSnapshot = await db.collection('users')
      .where('clubId', '==', clubId)
      .where('role', '==', 'seller')
      .get();

    // Get pending invites count
    const invitesSnapshot = await db.collection('invites')
      .where('clubId', '==', clubId)
      .where('status', '==', 'pending')
      .get();

    // Calculate stats
    const stats = {
      totalMembers: membersSnapshot.size,
      activeLicenses: clubData.activeLicenses || 0,
      totalRevenue: clubData.totalRevenue || 0,
      monthlyGrowth: 0, // TODO: Calculate based on historical data
      totalSellers: sellersSnapshot.size,
      pendingInvites: invitesSnapshot.size,
      availableLicenses: clubData.availableLicenses || 0,
      expiringLicenses: 0, // TODO: Calculate based on subscription end dates
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching club stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
