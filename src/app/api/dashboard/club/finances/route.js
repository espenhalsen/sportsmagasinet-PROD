import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';
import { getLicensePackageById, calculateMonthlyClubDebt } from '@/utils/packages';

export async function GET(request) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = auth;

    // Check if user is club admin
    if (user.role !== 'club_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = admin.firestore();

    // Get club data - try both adminId and clubId from user claims
    let clubDoc = null;
    
    // First try to find club by adminId
    if (user.uid) {
      const clubsSnapshot = await db.collection('clubs')
        .where('adminId', '==', user.uid)
        .limit(1)
        .get();
      
      if (!clubsSnapshot.empty) {
        clubDoc = clubsSnapshot.docs[0];
      }
    }
    
    // If not found and user has clubId in claims, try that
    if (!clubDoc && user.clubId) {
      const clubDocRef = await db.collection('clubs').doc(user.clubId).get();
      if (clubDocRef.exists) {
        clubDoc = clubDocRef;
      }
    }

    if (!clubDoc) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    const clubData = clubDoc.data();
    const clubId = clubDoc.id;

    // Get package details
    const packageData = getLicensePackageById(clubData.packageId);
    if (!packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Calculate months since package activation
    const activatedAt = clubData.packageActivatedAt?.toDate() || new Date();
    const now = new Date();
    const monthsSinceActivation = Math.floor((now - activatedAt) / (1000 * 60 * 60 * 24 * 30));
    
    // Get all financial transactions for this club
    const transactionsSnapshot = await db.collection('club_finances')
      .where('clubId', '==', clubId)
      .orderBy('createdAt', 'desc')
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    // Calculate current balance
    let totalDebt = 0;
    let totalIncome = 0;
    let currentMonthDebt = 0;
    let currentMonthIncome = 0;

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(transaction => {
      const amount = transaction.amount || 0;
      
      if (transaction.type === 'monthly_debt' || transaction.type === 'package_activation') {
        // For debt transactions, amount is negative, so we need to handle it correctly
        totalDebt += Math.abs(amount);
        
        const transactionDate = new Date(transaction.createdAt);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          currentMonthDebt += Math.abs(amount);
        }
      } else if (transaction.type === 'license_sale') {
        totalIncome += Math.abs(amount);
        
        const transactionDate = new Date(transaction.createdAt);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          currentMonthIncome += Math.abs(amount);
        }
      }
    });

    // Get license sales count
    const salesSnapshot = await db.collection('license_sales')
      .where('clubId', '==', clubId)
      .get();

    const totalLicensesSold = salesSnapshot.size;
    
    // Calculate pending monthly debt (if not yet charged this month)
    const pendingMonthlyDebt = calculateMonthlyClubDebt(clubData.packageId);
    
    const financialSummary = {
      // Current balances
      currentBalance: totalIncome - totalDebt,
      totalDebt: totalDebt || 0,
      totalIncome: totalIncome || 0,
      
      // Monthly figures
      currentMonthDebt: currentMonthDebt || 0,
      currentMonthIncome: currentMonthIncome || 0,
      currentMonthBalance: (currentMonthIncome || 0) - (currentMonthDebt || 0),
      pendingMonthlyDebt: pendingMonthlyDebt || 0,
      
      // Package info
      packageInfo: {
        name: packageData.name,
        licenses: packageData.licenses,
        debtPerLicense: packageData.debtPerLicense || 0,
        profitPerLicense: packageData.profitPerLicense || 0,
        retailPrice: packageData.retailPrice || 0,
        monthlyDebt: packageData.monthlyDebt || 0,
      },
      
      // Statistics
      totalLicensesSold: totalLicensesSold || 0,
      licensesRemaining: Math.max(0, (packageData.licenses || 0) - (totalLicensesSold || 0)),
      monthsSinceActivation: monthsSinceActivation || 0,
      
      // Next debt due date
      nextDebtDate: new Date(activatedAt.getFullYear(), activatedAt.getMonth() + monthsSinceActivation + 1, activatedAt.getDate()),
    };

    console.log('Financial summary calculated:', {
      totalDebt: financialSummary.totalDebt,
      totalIncome: financialSummary.totalIncome,
      currentBalance: financialSummary.currentBalance,
      transactionCount: transactions.length
    });

    return NextResponse.json({
      summary: financialSummary,
      transactions: transactions.slice(0, 20), // Last 20 transactions
      pagination: {
        total: transactions.length,
        showing: Math.min(20, transactions.length),
      }
    });

  } catch (error) {
    console.error('Error fetching club finances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
