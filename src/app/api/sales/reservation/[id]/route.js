import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    // Get reservation data
    const reservationDoc = await db.collection('license_reservations').doc(id).get();
    
    if (!reservationDoc.exists) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservationData = reservationDoc.data();
    
    // Handle different reservation statuses
    if (reservationData.status === 'completed') {
      // Return completed reservation with success status
      return NextResponse.json({
        id: reservationData.id,
        clubName: reservationData.clubName,
        sellerName: reservationData.sellerName,
        price: reservationData.price,
        status: reservationData.status,
        completedAt: reservationData.completedAt,
        message: 'Sale completed successfully'
      });
    }

    if (reservationData.status === 'expired' || reservationData.status === 'cancelled') {
      return NextResponse.json(
        { error: `Reservation is ${reservationData.status}` },
        { status: 400 }
      );
    }

    // Only process active 'reserved' status reservations for expiry check
    if (reservationData.status !== 'reserved') {
      return NextResponse.json(
        { error: 'Reservation is no longer active' },
        { status: 400 }
      );
    }

    // Check if reservation has expired
    if (new Date() > new Date(reservationData.expiresAt)) {
      // Update to expired status
      await reservationDoc.ref.update({
        status: 'expired',
        expiredAt: new Date()
      });
      
      return NextResponse.json(
        { error: 'Reservation has expired' },
        { status: 400 }
      );
    }

    // Return reservation data (excluding sensitive info)
    return NextResponse.json({
      id: reservationData.id,
      clubName: reservationData.clubName,
      sellerName: reservationData.sellerName,
      price: reservationData.price,
      expiresAt: reservationData.expiresAt,
      vippsLandingPage: reservationData.vippsLandingPage,
      status: reservationData.status
    });

  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}
