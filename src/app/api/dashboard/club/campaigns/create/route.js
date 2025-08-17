import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    // Verify authentication and club admin role
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    if (user.role !== 'club_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      targetLicenses,
      startDate,
      endDate,
      selectedSellers
    } = body;

    // Validate input
    if (!name || !startDate || !endDate || !selectedSellers.length || !targetLicenses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Verify sellers belong to this club
    const sellersSnapshot = await db.collection('users')
      .where('clubId', '==', user.clubId)
      .where('role', '==', 'seller')
      .get();

    const validSellerIds = sellersSnapshot.docs.map(doc => doc.id);
    const invalidSellers = selectedSellers.filter(id => !validSellerIds.includes(id));

    if (invalidSellers.length > 0) {
      return NextResponse.json(
        { error: 'Invalid seller selection' },
        { status: 400 }
      );
    }

    // Create unique campaign ID
    const campaignId = db.collection('campaigns').doc().id;

    // Create campaign document
    const campaignData = {
      id: campaignId,
      name: name.trim(),
      description: description?.trim() || '',
      clubId: user.clubId,
      targetLicenses: parseInt(targetLicenses),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      sellerIds: selectedSellers,
      status: 'active',
      createdAt: new Date(),
      createdBy: user.uid,
    };

    // Save campaign
    await db.collection('campaigns').doc(campaignId).set(campaignData);

    // Create seller assignments
    const batch = db.batch();
    
    selectedSellers.forEach(sellerId => {
      const assignmentRef = db.collection('campaignAssignments').doc();
      batch.set(assignmentRef, {
        campaignId,
        sellerId,
        clubId: user.clubId,
        targetLicenses: Math.ceil(targetLicenses / selectedSellers.length), // Distribute evenly
        soldLicenses: 0,
        status: 'active',
        createdAt: new Date(),
      });
    });

    await batch.commit();

    // Log the campaign creation
    await db.collection('activityLogs').add({
      type: 'campaign_created',
      userId: user.uid,
      clubId: user.clubId,
      campaignId,
      timestamp: new Date(),
      metadata: {
        campaignName: name,
        targetLicenses,
        sellerCount: selectedSellers.length,
      }
    });

    console.log('Campaign created:', campaignId, 'by club admin:', user.uid);

    return NextResponse.json({
      success: true,
      campaignId,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
