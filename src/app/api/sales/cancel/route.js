import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { cancelReservation } from '@/utils/licenseReservation';

export async function POST(request) {
  try {
    // Authenticate seller
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    if (user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    // Verify the reservation belongs to this seller
    const { db } = await import('@/lib/firebase/admin');
    const reservationDoc = await db.collection('license_reservations').doc(reservationId).get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservationData = reservationDoc.data();

    if (reservationData.sellerId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this reservation' },
        { status: 403 }
      );
    }

    if (reservationData.status !== 'reserved') {
      return NextResponse.json(
        { error: 'Reservation cannot be cancelled' },
        { status: 400 }
      );
    }

    // Cancel the reservation
    const result = await cancelReservation(reservationId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling sale:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sale' },
      { status: 500 }
    );
  }
}
