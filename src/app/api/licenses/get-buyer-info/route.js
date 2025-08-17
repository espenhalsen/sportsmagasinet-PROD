import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId');
    const clubId = searchParams.get('club'); // URL parameter is 'club', not 'clubId'

    if (!licenseId) {
      return NextResponse.json({ error: 'Missing licenseId parameter' }, { status: 400 });
    }

    if (!clubId) {
      return NextResponse.json({ error: 'Missing club parameter' }, { status: 400 });
    }

    console.log('Direct license lookup:', { licenseId, clubId });
    
    // Direct access to the license using the provided clubId
    const licenseDoc = await db
      .collection('club_licenses')
      .doc(clubId)
      .collection('licenses')
      .doc(licenseId)
      .get();
    
    console.log('License found:', licenseDoc.exists);
    
    if (!licenseDoc.exists) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const licenseData = licenseDoc.data();
    console.log('License state:', licenseData.state);

    // Check if license is in completed state
    if (licenseData.state !== 'completed') {
      return NextResponse.json({ error: 'License is not completed' }, { status: 400 });
    }

    // Get club information
    let clubName = 'Unknown Club';
    const clubDoc = await db.collection('clubs').doc(clubId).get();
    if (clubDoc.exists) {
      clubName = clubDoc.data().name;
    }

    return NextResponse.json({
      success: true,
      licenseId: licenseId,
      clubId: clubId,
      clubName: clubName,
      buyerInfo: licenseData.buyerInfo || { registrationPending: true },
      packageId: licenseData.packageId,
      state: licenseData.state
    });

  } catch (error) {
    console.error('Error getting license buyer info:', error);
    return NextResponse.json(
      { error: 'Failed to get license information' },
      { status: 500 }
    );
  }
}
