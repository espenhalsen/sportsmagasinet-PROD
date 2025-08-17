import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/utils/auth';
import { getClubLicenseSales, getClubSalesStats } from '@/utils/licenseSales';

export async function GET(request) {
  try {
    const user = await verifySessionCookie();
    
    if (!user || user.role !== 'club_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'sales';
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (action === 'stats') {
      // Get sales statistics for the club
      const stats = await getClubSalesStats(user.clubId);
      
      return NextResponse.json({
        success: true,
        stats
      });
    }

    if (action === 'sales') {
      // Get license sales for the club
      const sales = await getClubLicenseSales(user.clubId, {
        limit,
        sellerId,
        status
      });
      
      return NextResponse.json({
        success: true,
        sales
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in club sales API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
