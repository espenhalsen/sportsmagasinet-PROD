import { db } from '@/lib/firebase/admin';
import { reserveLicense as reserveClubLicense, getAvailableLicenses } from './licenseManager';

/**
 * Reserve a license for sale using the new license tracking system
 */
export async function reserveLicense(sellerId, clubId) {
  try {
    // Generate unique reservation ID
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check available licenses first
    const availableLicenses = await getAvailableLicenses(clubId);
    if (availableLicenses.length === 0) {
      return {
        success: false,
        error: 'No licenses available'
      };
    }
    
    // Reserve a specific license
    const licenseReservation = await reserveClubLicense(clubId, sellerId, reservationId);
    if (!licenseReservation.success) {
      return licenseReservation;
    }
    
    // Get club and seller data
    const [clubDoc, sellerDoc] = await Promise.all([
      db.collection('clubs').doc(clubId).get(),
      db.collection('users').doc(sellerId).get()
    ]);
    
    const clubData = clubDoc.data();
    const sellerData = sellerDoc.data();
    
    if (!clubData || !sellerData) {
      return {
        success: false,
        error: 'Club or seller not found'
      };
    }
    
    // Create reservation with 15 minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const reservationData = {
      reservationId: reservationId,
      licenseId: licenseReservation.licenseId,
      sellerId: sellerId,
      clubId: clubId,
      clubName: clubData.name,
      sellerName: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName}` : sellerData.email,
      price: 100, // Fixed price for now
      status: 'reserved',
      expiresAt: expiresAt,
      createdAt: new Date()
    };
    
    // Save reservation
    await db.collection('license_reservations').doc(reservationId).set(reservationData);
    
    return {
      success: true,
      reservationId: reservationId,
      expiresAt: expiresAt,
      licenseId: licenseReservation.licenseId
    };
    
  } catch (error) {
    console.error('Error creating license reservation:', error);
    return {
      success: false,
      error: 'Failed to create reservation'
    };
  }
}

/**
 * Cancel a license reservation
 * @param {string} reservationId - The reservation ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function cancelReservation(reservationId) {
  try {
    const reservationRef = db.collection('license_reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      throw new Error('Reservation not found');
    }

    const reservationData = reservationDoc.data();

    // Cancel Vipps agreement if it exists
    if (reservationData.vippsAgreementId) {
      try {
        const { cancelVippsAgreement } = await import('@/lib/vipps/api');
        await cancelVippsAgreement(reservationData.vippsAgreementId);
      } catch (vippsError) {
        console.warn('Failed to cancel Vipps agreement:', vippsError);
        // Continue with cancellation even if Vipps fails
      }
    }

    // Update reservation status
    await reservationRef.update({
      status: 'cancelled',
      cancelledAt: new Date()
    });

    return { success: true };

  } catch (error) {
    console.error('Error canceling reservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert reservation to completed sale
 * @param {string} reservationId - The reservation ID
 * @param {Object} customerData - Customer information
 * @returns {Promise<{success: boolean, saleId?: string, error?: string}>}
 */
export async function completeReservation(reservationId, customerData) {
  const batch = db.batch();

  try {
    // Get reservation data
    const reservationRef = db.collection('license_reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      throw new Error('Reservation not found');
    }

    const reservationData = reservationDoc.data();

    if (reservationData.status !== 'reserved') {
      throw new Error('Reservation is not active');
    }

    // Create license sale record
    const saleRef = db.collection('license_sales').doc();
    const saleRecord = {
      id: saleRef.id,
      sellerId: reservationData.sellerId,
      sellerName: reservationData.sellerName,
      clubId: reservationData.clubId,
      clubName: reservationData.clubName,
      packageId: reservationData.packageId,
      packageName: reservationData.packageName,
      
      // Customer details
      customerEmail: customerData.customerEmail,
      customerName: customerData.customerName || '',
      customerPhone: customerData.customerPhone || '',
      
      // Sale details
      salePrice: reservationData.price,
      profit: reservationData.price - reservationData.metadata.debtPerLicense,
      
      // Timestamps
      createdAt: new Date(),
      licenseValidFrom: new Date(),
      licenseValidUntil: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year
      
      // Status
      status: 'active',
      
      // Vipps data
      vippsAgreementId: reservationData.vippsAgreementId,
      paymentMethod: 'vipps',
      
      // Additional data
      metadata: {
        ...reservationData.metadata,
        originalReservationId: reservationId,
        completedFromReservation: true
      }
    };

    batch.set(saleRef, saleRecord);

    // Update reservation status
    batch.update(reservationRef, {
      status: 'completed',
      completedAt: new Date(),
      saleId: saleRef.id
    });

    // Update club finances
    const financeRef = db.collection('club_finances').doc(reservationData.clubId);
    const financeDoc = await financeRef.get();
    const currentFinanceData = financeDoc.exists ? financeDoc.data() : {};

    const newTotalIncome = (currentFinanceData.totalIncome || 0) + saleRecord.profit;
    const newCurrentBalance = newTotalIncome - (currentFinanceData.totalDebt || 0);
    const newLicensesSold = (currentFinanceData.totalLicensesSold || 0) + 1;

    batch.set(financeRef, {
      totalIncome: newTotalIncome,
      currentBalance: newCurrentBalance,
      totalLicensesSold: newLicensesSold,
      updatedAt: new Date()
    }, { merge: true });

    // Add income transaction
    const transactionRef = db.collection('club_finances')
      .doc(reservationData.clubId)
      .collection('transactions')
      .doc();

    batch.set(transactionRef, {
      type: 'license_sale',
      amount: saleRecord.profit,
      description: `Lisensalg av ${customerData.customerName || customerData.customerEmail}`,
      createdAt: new Date(),
      sellerId: reservationData.sellerId,
      sellerName: reservationData.sellerName,
      customerEmail: customerData.customerEmail,
      saleId: saleRef.id,
      paymentMethod: 'vipps',
      metadata: {
        salePrice: saleRecord.salePrice,
        debtPerLicense: reservationData.metadata.debtPerLicense,
        profit: saleRecord.profit,
        vippsAgreementId: reservationData.vippsAgreementId
      }
    });

    await batch.commit();

    return {
      success: true,
      saleId: saleRef.id,
      profit: saleRecord.profit
    };

  } catch (error) {
    console.error('Error completing reservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean up expired reservations
 */
export async function cleanupExpiredReservations() {
  try {
    const now = new Date();
    const expiredSnapshot = await db.collection('license_reservations')
      .where('status', '==', 'reserved')
      .where('expiresAt', '<=', now)
      .get();

    const batch = db.batch();
    
    expiredSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        expiredAt: now
      });
    });

    if (!expiredSnapshot.empty) {
      await batch.commit();
      console.log(`Cleaned up ${expiredSnapshot.size} expired reservations`);
    }

    return { success: true, cleanedUp: expiredSnapshot.size };

  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
    return { success: false, error: error.message };
  }
}
