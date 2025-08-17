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
    const period = url.searchParams.get('period') || 'month'; // month, quarter, year

    // Get date range based on period
    const now = new Date();
    let startDate, endDate = now;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get agent's clubs
    const clubsSnapshot = await db.collection('clubs')
      .where('agentId', '==', user.uid)
      .get();

    const totalClubs = clubsSnapshot.size;
    let activeClubs = 0;
    let pendingClubs = 0;

    clubsSnapshot.docs.forEach(doc => {
      const club = doc.data();
      if (club.packageStatus === 'active') {
        activeClubs++;
      } else if (club.packageStatus === 'pending_payment') {
        pendingClubs++;
      }
    });

    // Get commissions for the period
    const commissionsSnapshot = await db.collection('commissions')
      .where('agentId', '==', user.uid)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .get();

    let periodEarnings = 0;
    let paidCommissions = 0;
    let pendingCommissions = 0;

    commissionsSnapshot.docs.forEach(doc => {
      const commission = doc.data();
      const amount = commission.amount || 0;
      
      periodEarnings += amount;
      
      if (commission.status === 'paid') {
        paidCommissions += amount;
      } else if (commission.status === 'pending' || commission.status === 'earned') {
        pendingCommissions += amount;
      }
    });

    // Get total all-time commissions
    const allCommissionsSnapshot = await db.collection('commissions')
      .where('agentId', '==', user.uid)
      .get();

    let totalEarnings = 0;
    let totalPaid = 0;

    allCommissionsSnapshot.docs.forEach(doc => {
      const commission = doc.data();
      const amount = commission.amount || 0;
      totalEarnings += amount;
      
      if (commission.status === 'paid') {
        totalPaid += amount;
      }
    });

    // Calculate growth (compare with previous period)
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    switch (period) {
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'quarter':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      default: // month
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
    }

    const previousCommissionsSnapshot = await db.collection('commissions')
      .where('agentId', '==', user.uid)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(previousStartDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(previousEndDate))
      .get();

    let previousPeriodEarnings = 0;
    previousCommissionsSnapshot.docs.forEach(doc => {
      previousPeriodEarnings += doc.data().amount || 0;
    });

    const growthRate = previousPeriodEarnings > 0 
      ? ((periodEarnings - previousPeriodEarnings) / previousPeriodEarnings * 100)
      : (periodEarnings > 0 ? 100 : 0);

    return NextResponse.json({
      period,
      clubs: {
        total: totalClubs,
        active: activeClubs,
        pending: pendingClubs,
      },
      earnings: {
        period: periodEarnings,
        total: totalEarnings,
        paid: totalPaid,
        pending: pendingCommissions,
        growth: Math.round(growthRate * 100) / 100, // Round to 2 decimals
      },
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching agent stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
