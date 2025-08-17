import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/firebase/admin';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;
    
    if (user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Get seller's completed sales from the new sales collection
    let query = db.collection('sales')
      .where('sellerId', '==', user.uid)
      .orderBy('completedAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const salesSnapshot = await query.get();
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      salePrice: doc.data().price, // Map price to salePrice for compatibility
      profit: doc.data().price * 0.1 // 10% commission
    }));

    // Calculate statistics
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

    // Current month statistics
    const currentMonthSales = sales.filter(sale => 
      new Date(sale.completedAt || sale.createdAt) >= currentMonth
    );
    
    const monthSales = currentMonthSales.length;
    const monthRevenue = currentMonthSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    const monthProfit = currentMonthSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

    return NextResponse.json({
      success: true,
      sales,
      stats: {
        total: {
          sales: totalSales,
          revenue: totalRevenue,
          profit: totalProfit
        },
        currentMonth: {
          sales: monthSales,
          revenue: monthRevenue,
          profit: monthProfit
        }
      }
    });

  } catch (error) {
    console.error('Error in seller sales API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
