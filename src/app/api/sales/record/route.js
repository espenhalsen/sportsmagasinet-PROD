import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/utils/auth';
import { recordLicenseSale } from '@/utils/licenseSales';

export async function POST(request) {
  try {
    const user = await verifySessionCookie();
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!user.clubId) {
      return NextResponse.json(
        { error: 'Seller must belong to a club' },
        { status: 400 }
      );
    }

    const saleData = await request.json();

    // Validate required fields
    if (!saleData.customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(saleData.customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate sale price if provided
    if (saleData.salePrice && (isNaN(saleData.salePrice) || saleData.salePrice < 0)) {
      return NextResponse.json(
        { error: 'Invalid sale price' },
        { status: 400 }
      );
    }

    // Record the license sale
    const result = await recordLicenseSale(user.uid, user.clubId, {
      customerEmail: saleData.customerEmail.trim().toLowerCase(),
      customerName: saleData.customerName?.trim() || '',
      salePrice: saleData.salePrice || undefined,
      metadata: {
        sellerNotes: saleData.notes?.trim() || '',
        saleChannel: saleData.saleChannel || 'direct',
        recordedBy: user.email
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lisensalg registrert',
      saleId: result.saleId,
      profit: result.profit
    });

  } catch (error) {
    console.error('Error recording license sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
