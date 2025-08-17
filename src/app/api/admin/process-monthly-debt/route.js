import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/utils/auth';
import { processAllClubsMonthlyDebt, getClubsWithOverdueDebt } from '@/utils/monthlyDebt';

export async function POST(request) {
  try {
    const user = await verifySessionCookie();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { action = 'process' } = await request.json();

    if (action === 'check') {
      // Check which clubs have overdue debt
      const overdueClubs = await getClubsWithOverdueDebt();
      
      return NextResponse.json({
        success: true,
        overdueClubs,
        count: overdueClubs.length
      });
    }

    if (action === 'process') {
      // Process monthly debt for all clubs
      const result = await processAllClubsMonthlyDebt();
      
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in process-monthly-debt API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await verifySessionCookie();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get overdue clubs for admin dashboard
    const overdueClubs = await getClubsWithOverdueDebt();
    
    return NextResponse.json({
      success: true,
      overdueClubs,
      count: overdueClubs.length
    });

  } catch (error) {
    console.error('Error fetching overdue debt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
