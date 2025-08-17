import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    // Get sale data
    const saleDoc = await db.collection('license_sales').doc(id).get();
    
    if (!saleDoc.exists) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const saleData = saleDoc.data();
    
    // Verify sale is active and payment completed
    if (saleData.status !== 'active') {
      return NextResponse.json(
        { error: 'Sale is not active' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let userExists = false;
    if (saleData.customerEmail) {
      const existingUserSnapshot = await db.collection('users')
        .where('email', '==', saleData.customerEmail)
        .limit(1)
        .get();
      
      userExists = !existingUserSnapshot.empty;
    }

    // Return sale data for verification
    return NextResponse.json({
      id: saleData.id,
      clubName: saleData.clubName,
      clubId: saleData.clubId,
      customerEmail: saleData.customerEmail,
      customerName: saleData.customerName,
      salePrice: saleData.salePrice,
      licenseValidUntil: saleData.licenseValidUntil,
      status: saleData.status,
      userExists: userExists,
      createdAt: saleData.createdAt
    });

  } catch (error) {
    console.error('Error verifying sale:', error);
    return NextResponse.json(
      { error: 'Failed to verify sale' },
      { status: 500 }
    );
  }
}
