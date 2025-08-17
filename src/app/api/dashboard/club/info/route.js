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
      console.log('Club not found for user:', { uid: user.uid, clubId: user.clubId });
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    const clubData = {
      id: clubDoc.id,
      ...clubDoc.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: clubDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: clubDoc.data().updatedAt?.toDate?.()?.toISOString(),
      packageAssignedAt: clubDoc.data().packageAssignedAt?.toDate?.()?.toISOString(),
      packageActivatedAt: clubDoc.data().packageActivatedAt?.toDate?.()?.toISOString(),
    };

    return NextResponse.json(clubData);

  } catch (error) {
    console.error('Error fetching club info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
