import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { reserveLicense } from '@/utils/licenseReservation';
import { db } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    // Authenticate seller
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    console.log('Sales start - user data:', {
      uid: user.uid,
      email: user.email,
      role: user.role,
      clubId: user.clubId
    });
    
    if (user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.clubId) {
      console.log('No clubId found for seller, checking Firestore directly...');
      
      // Additional fallback: check Firestore directly
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('User data from Firestore:', {
            clubId: userData.clubId,
            role: userData.role,
            email: userData.email
          });
          
          if (userData.clubId) {
            user.clubId = userData.clubId;
          } else {
            return NextResponse.json(
              { error: 'Seller is not assigned to any club in database' },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'User document not found in database' },
            { status: 400 }
          );
        }
      } catch (dbError) {
        console.error('Error checking user in Firestore:', dbError);
        return NextResponse.json(
          { error: 'Error checking user data' },
          { status: 500 }
        );
      }
    }

    // Reserve a license
    const reservation = await reserveLicense(user.uid, user.clubId);
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error },
        { status: 400 }
      );
    }

    // Get club data for the response
    const clubDoc = await db.collection('clubs').doc(user.clubId).get();
    const clubData = clubDoc.data();

    // Generate QR code URL (buyer invitation link)
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/buy/invite?r=${reservation.reservationId}`;

    return NextResponse.json({
      success: true,
      reservationId: reservation.reservationId,
      qrCodeUrl: inviteUrl,
      expiresAt: reservation.expiresAt,
      clubName: clubData.name,
      price: 100 // Fixed price
    });

  } catch (error) {
    console.error('Error starting sale:', error);
    return NextResponse.json(
      { error: 'Failed to start sale' },
      { status: 500 }
    );
  }
}
