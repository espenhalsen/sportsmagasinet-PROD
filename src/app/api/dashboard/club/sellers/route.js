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

    const clubId = clubDoc.id;

    // Get club sellers
    const sellersSnapshot = await db.collection('users')
      .where('clubId', '==', clubId)
      .where('role', '==', 'seller')
      .get();

    const sellers = sellersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString(),
    }));

    // Get seller sales statistics
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const salesSnapshot = await db.collection('license_sales')
          .where('sellerId', '==', seller.id)
          .get();

        const totalSales = salesSnapshot.size;
        const totalRevenue = salesSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().salePrice || 0);
        }, 0);

        return {
          ...seller,
          stats: {
            totalSales,
            totalRevenue,
          }
        };
      })
    );

    return NextResponse.json({ sellers: sellersWithStats });

  } catch (error) {
    console.error('Error fetching club sellers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
