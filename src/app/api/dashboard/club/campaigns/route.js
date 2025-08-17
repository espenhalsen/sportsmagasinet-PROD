import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';

export async function GET(request) {
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

    // Get campaigns for this club
    const campaignsSnapshot = await db.collection('campaigns')
      .where('clubId', '==', user.clubId)
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns = [];
    
    for (const doc of campaignsSnapshot.docs) {
      const campaignData = doc.data();
      
      // Get campaign progress
      const salesSnapshot = await db.collection('sales')
        .where('campaignId', '==', doc.id)
        .where('status', '==', 'completed')
        .get();

      const soldLicenses = salesSnapshot.size;
      
      // Count participants
      const participants = campaignData.sellerIds ? campaignData.sellerIds.length : 0;
      
      campaigns.push({
        id: doc.id,
        name: campaignData.name,
        description: campaignData.description,
        targetLicenses: campaignData.targetLicenses,
        soldLicenses,
        participants,
        startDate: campaignData.startDate,
        endDate: campaignData.endDate,
        status: campaignData.status,
        createdAt: campaignData.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
