import { NextResponse } from 'next/server';
import { createVippsAgreement } from '@/lib/vipps/api';
import { db } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    // Get reservation data
    const reservationDoc = await db.collection('license_reservations').doc(reservationId).get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data();
    
    // Check if reservation is still valid
    if (reservation.status !== 'reserved') {
      return NextResponse.json({ error: 'Reservation no longer valid' }, { status: 400 });
    }

    if (new Date() > new Date(reservation.expiresAt.toDate())) {
      return NextResponse.json({ error: 'Reservation expired' }, { status: 400 });
    }

    // Get club and seller data for Vipps agreement
    const [clubDoc, sellerDoc] = await Promise.all([
      db.collection('clubs').doc(reservation.clubId).get(),
      db.collection('users').doc(reservation.sellerId).get()
    ]);

    const clubData = clubDoc.data();
    const sellerData = sellerDoc.data();

    // Prepare sale data for Vipps
    const saleData = {
      saleId: reservationId,
      clubName: clubData.name,
      sellerName: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName}` : sellerData.email,
      sellerId: reservation.sellerId,
      clubId: reservation.clubId
    };

    // Create Vipps agreement
    const vippsResult = await createVippsAgreement(saleData);

    // Update reservation with Vipps data
    await db.collection('license_reservations').doc(reservationId).update({
      vippsAgreementId: vippsResult.agreementId,
      vippsLandingPage: vippsResult.vippsLandingPage,
      vippsStatus: 'created',
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      vippsLandingPage: vippsResult.vippsLandingPage,
      agreementId: vippsResult.agreementId
    });

  } catch (error) {
    console.error('Error creating Vipps agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create Vipps agreement' },
      { status: 500 }
    );
  }
}
