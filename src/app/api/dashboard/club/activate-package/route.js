import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';
import { getLicensePackageById, calculateMonthlyClubDebt } from '@/utils/packages';
import { addLicensesToClub } from '@/utils/licenseManager';

export async function POST(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;

    if (!user || user.role !== 'club_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!user.clubId) {
      return NextResponse.json(
        { error: 'No club associated with this user' },
        { status: 400 }
      );
    }

    // Get club data
    const clubDoc = await db.collection('clubs').doc(user.clubId).get();
    
    if (!clubDoc.exists) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    const clubData = clubDoc.data();
    
    // Check if package is already active
    if (clubData.packageStatus === 'active') {
      return NextResponse.json(
        { error: 'Package is already active' },
        { status: 400 }
      );
    }

    // Check if package exists
    if (!clubData.packageId) {
      return NextResponse.json(
        { error: 'No package assigned to this club' },
        { status: 400 }
      );
    }

    const packageData = getLicensePackageById(clubData.packageId);
    if (!packageData) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    // Update club with active package
    const clubRef = db.collection('clubs').doc(user.clubId);
    batch.update(clubRef, {
      packageStatus: 'active',
      packageActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create initial commission for the agent if club has agentId
    if (clubData.agentId && packageData) {
      const activationCommission = packageData.licenses * 1; // 1 NOK per license per month
      const commissionRef = db.collection('commissions').doc();
      
      batch.set(commissionRef, {
        agentId: clubData.agentId,
        clubId: user.clubId,
        clubName: clubData.name,
        packageId: clubData.packageId,
        packageName: packageData.name,
        licenseCount: packageData.licenses,
        amount: activationCommission,
        type: 'activation_commission',
        status: 'earned',
        period: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
        metadata: {
          generatedBy: 'package_activation',
          activationType: 'instant'
        }
      });

      console.log('Created activation commission for agent:', clubData.agentId, 'amount:', activationCommission);
    }

    // Create initial financial tracking with debt
    const financeRef = db.collection('club_finances').doc();
    batch.set(financeRef, {
      clubId: user.clubId,
      packageId: clubData.packageId,
      type: 'package_activation',
      description: `Package activation: ${packageData.name}`,
      amount: -packageData.monthlyDebt, // Negative = debt
      balance: -packageData.monthlyDebt,
      createdAt: now,
      metadata: {
        packageName: packageData.name,
        licenses: packageData.licenses,
        monthlyDebt: packageData.monthlyDebt,
        activationType: 'instant', // vs 'stripe_payment'
      }
    });

    // Create activity log
    batch.set(db.collection('activityLogs').doc(), {
      type: 'package_activated',
      clubId: user.clubId,
      userId: user.uid,
      packageId: clubData.packageId,
      timestamp: now,
      metadata: {
        packageName: packageData.name,
        licenses: packageData.licenses,
        monthlyDebt: packageData.monthlyDebt,
        activationType: 'instant',
      }
    });

    await batch.commit();

    // Add individual licenses to the club_licenses collection
    const licenseResult = await addLicensesToClub(user.clubId, {
      packageId: clubData.packageId,
      packageName: packageData.name,
      licenseCount: packageData.licenses,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from activation
    });

    if (!licenseResult.success) {
      console.error('Failed to add licenses to club:', licenseResult.error);
      // Don't fail the activation, but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Package activated successfully',
      packageData: {
        id: packageData.id,
        name: packageData.name,
        licenses: packageData.licenses,
        monthlyDebt: packageData.monthlyDebt,
        status: 'active',
        activatedAt: new Date().toISOString(),
      },
      licensesCreated: licenseResult.success ? licenseResult.licensesAdded : 0
    });

  } catch (error) {
    console.error('Error activating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
