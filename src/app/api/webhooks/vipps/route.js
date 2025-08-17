import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { getVippsAgreement } from '@/lib/vipps/api';
import { completeReservation } from '@/utils/licenseReservation';

export async function POST(request) {
  try {
    const webhookData = await request.json();
    
    console.log('Vipps webhook received:', JSON.stringify(webhookData, null, 2));

    // Verify webhook authenticity (in production, implement proper verification)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract agreement ID from webhook
    const { agreementId, status, eventType } = webhookData;
    
    if (!agreementId) {
      console.error('No agreement ID in webhook');
      return NextResponse.json({ error: 'Missing agreement ID' }, { status: 400 });
    }

    // Find reservation by Vipps agreement ID
    const reservationsSnapshot = await db.collection('license_reservations')
      .where('vippsAgreementId', '==', agreementId)
      .where('status', '==', 'reserved')
      .limit(1)
      .get();

    if (reservationsSnapshot.empty) {
      console.error('No reservation found for agreement ID:', agreementId);
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservationDoc = reservationsSnapshot.docs[0];
    const reservationData = reservationDoc.data();

    // Get updated agreement status from Vipps
    const vippsAgreement = await getVippsAgreement(agreementId);
    
    // Update reservation with Vipps status
    await reservationDoc.ref.update({
      vippsStatus: status || vippsAgreement.status,
      vippsEventType: eventType,
      lastVippsUpdate: new Date(),
      vippsData: vippsAgreement
    });

    // Handle different event types
    switch (eventType) {
      case 'AGREEMENT_ACTIVATED':
      case 'CHARGE_COMPLETED':
        // Payment successful - complete the sale
        if (vippsAgreement.status === 'ACTIVE') {
          // Extract customer data from Vipps agreement
          const customerData = {
            customerEmail: vippsAgreement.userInfo?.email || `customer-${agreementId}@vipps.no`,
            customerName: vippsAgreement.userInfo?.name || 'Vipps Customer',
            customerPhone: vippsAgreement.userInfo?.phoneNumber || ''
          };

          const completionResult = await completeReservation(reservationData.id, customerData);
          
          if (completionResult.success) {
            console.log('Sale completed successfully:', completionResult.saleId);
            
            // Optionally trigger real-time notification to seller
            // This could be implemented with WebSockets or Server-Sent Events
            
            return NextResponse.json({
              status: 'success',
              message: 'Sale completed',
              saleId: completionResult.saleId
            });
          } else {
            console.error('Failed to complete sale:', completionResult.error);
            return NextResponse.json({ error: 'Failed to complete sale' }, { status: 500 });
          }
        }
        break;
        
      case 'AGREEMENT_REJECTED':
      case 'AGREEMENT_CANCELLED':
      case 'AGREEMENT_EXPIRED':
        // Payment failed or cancelled - cancel reservation
        await reservationDoc.ref.update({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: `Vipps: ${eventType}`
        });
        
        console.log('Reservation cancelled due to Vipps event:', eventType);
        
        return NextResponse.json({
          status: 'cancelled',
          message: 'Reservation cancelled due to payment failure'
        });
        
      default:
        console.log('Unhandled Vipps event type:', eventType);
        return NextResponse.json({
          status: 'acknowledged',
          message: 'Event received but not processed'
        });
    }

    return NextResponse.json({
      status: 'acknowledged',
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('Error processing Vipps webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
