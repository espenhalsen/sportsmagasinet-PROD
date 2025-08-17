import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';

export async function GET(request) {
  try {
    // Verify authentication and seller role
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    if (user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active campaign assignments for this seller
    const assignmentsSnapshot = await db.collection('campaignAssignments')
      .where('sellerId', '==', user.uid)
      .where('status', '==', 'active')
      .get();

    const campaigns = [];
    
    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignment = assignmentDoc.data();
      
      // Get campaign details
      const campaignDoc = await db.collection('campaigns').doc(assignment.campaignId).get();
      
      if (campaignDoc.exists) {
        const campaign = campaignDoc.data();
        
        // Count sold licenses for this seller in this campaign
        const salesSnapshot = await db.collection('sales')
          .where('sellerId', '==', user.uid)
          .where('campaignId', '==', assignment.campaignId)
          .where('status', '==', 'completed')
          .get();

        const soldLicenses = salesSnapshot.size;
        
        // Calculate days remaining
        const endDate = new Date(campaign.endDate);
        const today = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
        
        campaigns.push({
          id: assignment.campaignId,
          assignmentId: assignmentDoc.id,
          name: campaign.name,
          description: campaign.description,
          targetLicenses: assignment.targetLicenses,
          soldLicenses,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          daysRemaining,
          status: campaign.status,
          progress: assignment.targetLicenses > 0 ? (soldLicenses / assignment.targetLicenses) * 100 : 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Error fetching seller campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
