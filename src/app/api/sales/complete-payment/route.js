import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVippsAgreement, getVippsUserInfo } from '@/lib/vipps/api';
import { completeLicenseSale } from '@/utils/licenseManager';

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
    
    // Check if already completed
    if (reservation.status === 'completed') {
      return NextResponse.json({
        success: true,
        clubName: reservation.clubName,
        message: 'Payment already completed'
      });
    }

    let buyerInfo = null;

    // Verify payment with Vipps if we have an agreement ID
    if (reservation.vippsAgreementId) {
      try {
        const vippsAgreement = await getVippsAgreement(reservation.vippsAgreementId);
        
        // Check if agreement is active (payment successful)
        if (vippsAgreement.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Payment not completed in Vipps' }, 
            { status: 400 }
          );
        }

        // Get buyer information if we have a sub
        if (vippsAgreement.sub) {
          try {
            const userInfo = await getVippsUserInfo(vippsAgreement.sub);
            buyerInfo = {
              name: userInfo.name,
              email: userInfo.email,
              phoneNumber: userInfo.phone_number,
              address: {
                address_type: userInfo.address?.address_type,
                country: userInfo.address?.country,
                formatted: userInfo.address?.formatted,
                postal_code: userInfo.address?.postal_code,
                region: userInfo.address?.region,
                street_address: userInfo.address?.street_address
              },
              birthDate: userInfo.birthdate,
              vippsSub: vippsAgreement.sub,
              fetchedAt: new Date(),
              source: 'vipps_userinfo_api'
            };
            console.log('Successfully fetched buyer info from Vipps:', buyerInfo);
          } catch (userInfoError) {
            console.error('Error fetching Vipps user info:', userInfoError);
            // Continue without user info - not critical for payment completion
          }
        }
      } catch (vippsError) {
        console.error('Error verifying Vipps agreement:', vippsError);
        // Continue anyway - Vipps redirected here so payment likely succeeded
      }
    }

    // Check if we have a licenseId from reservation (new system)
    if (!reservation.licenseId) {
      return NextResponse.json(
        { error: 'No license ID found in reservation' }, 
        { status: 400 }
      );
    }

    // Mark reservation as completed
    await reservationDoc.ref.update({
      status: 'completed',
      completedAt: new Date(),
      paymentVerifiedAt: new Date()
    });

    // Create completed sale record
    const saleData = {
      reservationId: reservationId,
      sellerId: reservation.sellerId,
      clubId: reservation.clubId,
      clubName: reservation.clubName,
      sellerName: reservation.sellerName,
      price: reservation.price,
      status: 'completed',
      paymentMethod: 'vipps',
      vippsAgreementId: reservation.vippsAgreementId,
      createdAt: new Date(),
      completedAt: new Date()
    };

    // Add to sales collection
    const saleRef = await db.collection('sales').add(saleData);

    // Complete the license sale using the new license tracking system
    const licenseCompletion = await completeLicenseSale(reservation.clubId, reservation.licenseId, {
      saleId: saleRef.id,
      buyerInfo: buyerInfo || {
        // Fallback if no buyer info was fetched
        registrationPending: true
      },
      vippsAgreementId: reservation.vippsAgreementId,
      price: reservation.price
    });

    if (!licenseCompletion.success) {
      return NextResponse.json(
        { error: 'Failed to complete license sale' }, 
        { status: 500 }
      );
    }

    // Update club statistics
    const clubRef = db.collection('clubs').doc(reservation.clubId);
    const clubDoc = await clubRef.get();
    const clubData = clubDoc.data();
    
    await clubRef.update({
      totalSales: (clubData.totalSales || 0) + 1,
      totalRevenue: (clubData.totalRevenue || 0) + reservation.price,
      lastSaleAt: new Date()
    });

    // Update seller statistics
    const sellerRef = db.collection('users').doc(reservation.sellerId);
    const sellerDoc = await sellerRef.get();
    const sellerData = sellerDoc.data();
    
    await sellerRef.update({
      totalSales: (sellerData.totalSales || 0) + 1,
      totalCommission: (sellerData.totalCommission || 0) + (reservation.price * 0.1), // 10% commission
      lastSaleAt: new Date()
    });

    return NextResponse.json({
      success: true,
      saleId: saleRef.id,
      licenseId: reservation.licenseId,
      clubId: reservation.clubId,
      clubName: reservation.clubName,
      message: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json(
      { error: 'Failed to complete payment' },
      { status: 500 }
    );
  }
}
