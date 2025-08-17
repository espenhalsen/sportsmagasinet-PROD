/**
 * License Management System
 * Individual license tracking with states: available, reserved, completed, expired
 */

import { db } from '@/lib/firebase/admin';

/**
 * Get available licenses for a club
 */
export async function getAvailableLicenses(clubId) {
  const licensesRef = db.collection('club_licenses').doc(clubId).collection('licenses');
  const availableQuery = await licensesRef.where('state', '==', 'available').get();
  
  return availableQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Reserve a license for a sale
 */
export async function reserveLicense(clubId, sellerId, reservationId) {
  try {
    const licensesRef = db.collection('club_licenses').doc(clubId).collection('licenses');
    
    // Find first available license
    const availableQuery = await licensesRef
      .where('state', '==', 'available')
      .limit(1)
      .get();
    
    if (availableQuery.empty) {
      return {
        success: false,
        error: 'No available licenses'
      };
    }
    
    const licenseDoc = availableQuery.docs[0];
    const licenseId = licenseDoc.id;
    
    // Reserve the license
    await licenseDoc.ref.update({
      state: 'reserved',
      reservedAt: new Date(),
      reservationId: reservationId,
      sellerId: sellerId,
      updatedAt: new Date()
    });
    
    return {
      success: true,
      licenseId: licenseId,
      licenseData: licenseDoc.data()
    };
    
  } catch (error) {
    console.error('Error reserving license:', error);
    return {
      success: false,
      error: 'Failed to reserve license'
    };
  }
}

/**
 * Complete a license sale (mark as completed)
 */
export async function completeLicenseSale(clubId, licenseId, saleData) {
  try {
    const licenseRef = db.collection('club_licenses').doc(clubId).collection('licenses').doc(licenseId);
    
    await licenseRef.update({
      state: 'completed',
      completedAt: new Date(),
      saleId: saleData.saleId,
      buyerInfo: saleData.buyerInfo,
      vippsAgreementId: saleData.vippsAgreementId,
      price: saleData.price,
      updatedAt: new Date()
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error completing license sale:', error);
    return {
      success: false,
      error: 'Failed to complete license sale'
    };
  }
}

/**
 * Cancel a license reservation (return to available)
 */
export async function cancelLicenseReservation(clubId, licenseId) {
  try {
    const licenseRef = db.collection('club_licenses').doc(clubId).collection('licenses').doc(licenseId);
    
    await licenseRef.update({
      state: 'available',
      reservedAt: null,
      reservationId: null,
      sellerId: null,
      updatedAt: new Date()
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error canceling license reservation:', error);
    return {
      success: false,
      error: 'Failed to cancel license reservation'
    };
  }
}

/**
 * Add licenses when package is activated
 */
export async function addLicensesToClub(clubId, packageData) {
  try {
    const licensesRef = db.collection('club_licenses').doc(clubId).collection('licenses');
    const licenseCount = packageData.licenseCount || 0;
    
    const batch = db.batch();
    
    for (let i = 0; i < licenseCount; i++) {
      const licenseRef = licensesRef.doc(); // Auto-generated ID
      
      const licenseData = {
        licenseNumber: `${clubId}-${Date.now()}-${i + 1}`,
        state: 'available',
        packageId: packageData.packageId,
        packageName: packageData.packageName,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: packageData.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };
      
      batch.set(licenseRef, licenseData);
    }
    
    await batch.commit();
    
    return {
      success: true,
      licensesAdded: licenseCount
    };
    
  } catch (error) {
    console.error('Error adding licenses to club:', error);
    return {
      success: false,
      error: 'Failed to add licenses'
    };
  }
}

/**
 * Get license statistics for a club
 */
export async function getClubLicenseStats(clubId) {
  try {
    const licensesRef = db.collection('club_licenses').doc(clubId).collection('licenses');
    
    const [availableSnap, reservedSnap, completedSnap] = await Promise.all([
      licensesRef.where('state', '==', 'available').get(),
      licensesRef.where('state', '==', 'reserved').get(),
      licensesRef.where('state', '==', 'completed').get()
    ]);
    
    return {
      available: availableSnap.size,
      reserved: reservedSnap.size,
      completed: completedSnap.size,
      total: availableSnap.size + reservedSnap.size + completedSnap.size
    };
    
  } catch (error) {
    console.error('Error getting license stats:', error);
    return {
      available: 0,
      reserved: 0,
      completed: 0,
      total: 0
    };
  }
}
