import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;

    // Check if user is agent
    if (user.role !== 'agent') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = admin.firestore();
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // optional filter
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    // Debug: Log agent UID for troubleshooting
    console.log('Looking for commissions with agentId:', user.uid);

    // Base query for agent commissions
    let query = db.collection('commissions')
      .where('agentId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Add status filter if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    const commissionsSnapshot = await query.get();
    
    const commissions = commissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      paidAt: doc.data().paidAt?.toDate?.()?.toISOString(),
      dueDate: doc.data().dueDate?.toDate?.()?.toISOString(),
    }));

    // Calculate commission summary
    const summary = {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      currentMonthEarnings: 0,
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    commissions.forEach(commission => {
      const amount = commission.amount || 0;
      
      switch (commission.status) {
        case 'earned':
        case 'paid':
          summary.totalEarned += amount;
          if (commission.status === 'paid') {
            summary.totalPaid += amount;
          }
          break;
        case 'pending':
          summary.totalPending += amount;
          // Check if overdue
          if (commission.dueDate && new Date(commission.dueDate) < now) {
            summary.totalOverdue += amount;
          }
          break;
      }

      // Calculate current month earnings
      if (commission.createdAt) {
        const commissionDate = new Date(commission.createdAt);
        if (commissionDate.getMonth() === currentMonth && 
            commissionDate.getFullYear() === currentYear) {
          summary.currentMonthEarnings += amount;
        }
      }
    });

    return NextResponse.json({
      commissions,
      summary,
      pagination: {
        total: commissionsSnapshot.size,
        limit,
        hasMore: commissionsSnapshot.size === limit,
      }
    });

  } catch (error) {
    console.error('Error fetching agent commissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
