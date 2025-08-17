import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';
import { getLicensePackageById } from '@/utils/packages';
import { getClubLicenseStats } from '@/utils/licenseManager';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    // Debug logging
    console.log('Seller club-info debug:', {
      uid: user.uid,
      role: user.role,
      clubId: user.clubId,
      userObject: JSON.stringify(user, null, 2)
    });
    
    if (user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get seller's club information - also check Firestore as fallback
    let clubId = user.clubId;
    
    if (!clubId) {
      // Fallback: check Firestore user document
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        clubId = userData.clubId;
        console.log('Fallback clubId from Firestore:', clubId);
      }
    }
    
    if (!clubId) {
      return NextResponse.json(
        { error: 'Seller is not assigned to any club' },
        { status: 400 }
      );
    }

    // Fetch club data
    const clubDoc = await db.collection('clubs').doc(clubId).get();
    if (!clubDoc.exists) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    const clubData = clubDoc.data();

    // Get package information
    let packageInfo = null;
    if (clubData.packageId) {
      packageInfo = getLicensePackageById(clubData.packageId);
    }

    // Get license stats from the new license tracking system
    const licenseStats = await getClubLicenseStats(clubId);
    const totalLicenses = licenseStats.total;
    const availableLicenses = licenseStats.available;
    const totalLicensesSold = licenseStats.completed;

    // Get club financial data
    const financeDoc = await db.collection('club_finances').doc(clubId).get();
    const financeData = financeDoc.exists ? financeDoc.data() : {};

    return NextResponse.json({
      success: true,
      club: {
        id: clubData.id || clubId,
        name: clubData.name,
        status: clubData.status,
        packageStatus: clubData.packageStatus
      },
      package: packageInfo,
      licenses: {
        total: totalLicenses,
        sold: totalLicensesSold,
        available: availableLicenses,
        percentage: totalLicenses > 0 ? Math.round((totalLicensesSold / totalLicenses) * 100) : 0
      },
      finances: {
        totalIncome: financeData.totalIncome || 0,
        totalLicensesSold: financeData.totalLicensesSold || totalLicensesSold,
        currentBalance: financeData.currentBalance || 0
      }
    });

  } catch (error) {
    console.error('Error in seller club info API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
