import { db } from '@/lib/firebase/admin';
import { getLicensePackageById } from './packages';

/**
 * Record a license sale by a seller to an end user
 * @param {string} sellerId - The seller who made the sale
 * @param {string} clubId - The club the seller belongs to
 * @param {Object} saleData - Sale information
 * @returns {Promise<{success: boolean, saleId?: string, error?: string}>}
 */
export async function recordLicenseSale(sellerId, clubId, saleData) {
  const batch = db.batch();

  try {
    // Validate required fields
    if (!sellerId || !clubId) {
      throw new Error('Seller ID and Club ID are required');
    }

    // Get club data to check package info
    const clubDoc = await db.collection('clubs').doc(clubId).get();
    if (!clubDoc.exists) {
      throw new Error('Club not found');
    }

    const clubData = clubDoc.data();
    if (!clubData.packageId) {
      throw new Error('Club has no active package');
    }

    // Get package information
    const packageInfo = getLicensePackageById(clubData.packageId);
    if (!packageInfo) {
      throw new Error('Package information not found');
    }

    // Verify seller belongs to club
    const sellerDoc = await db.collection('users').doc(sellerId).get();
    if (!sellerDoc.exists || sellerDoc.data().clubId !== clubId) {
      throw new Error('Seller does not belong to this club');
    }

    const sellerData = sellerDoc.data();

    // Create license sale record
    const saleRef = db.collection('license_sales').doc();
    const saleRecord = {
      id: saleRef.id,
      sellerId,
      sellerName: sellerData.name || sellerData.email,
      clubId,
      clubName: clubData.name,
      packageId: clubData.packageId,
      packageName: packageInfo.name,
      
      // Sale details
      customerEmail: saleData.customerEmail,
      customerName: saleData.customerName || '',
      salePrice: saleData.salePrice || packageInfo.retailPrice,
      profit: (saleData.salePrice || packageInfo.retailPrice) - packageInfo.debtPerLicense,
      
      // Timestamps
      createdAt: new Date(),
      licenseValidFrom: new Date(),
      licenseValidUntil: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year from now
      
      // Status
      status: 'active',
      
      // Additional data
      metadata: {
        retailPrice: packageInfo.retailPrice,
        debtPerLicense: packageInfo.debtPerLicense,
        profitMargin: packageInfo.profitPerLicense,
        ...saleData.metadata
      }
    };

    batch.set(saleRef, saleRecord);

    // Update club finances
    const financeRef = db.collection('club_finances').doc(clubId);
    const financeDoc = await financeRef.get();
    const currentFinanceData = financeDoc.exists ? financeDoc.data() : {};

    const newTotalIncome = (currentFinanceData.totalIncome || 0) + saleRecord.profit;
    const newCurrentBalance = newTotalIncome - (currentFinanceData.totalDebt || 0);
    const newLicensesSold = (currentFinanceData.totalLicensesSold || 0) + 1;

    batch.set(financeRef, {
      totalIncome: newTotalIncome,
      currentBalance: newCurrentBalance,
      totalLicensesSold: newLicensesSold,
      updatedAt: new Date()
    }, { merge: true });

    // Add income transaction
    const transactionRef = db.collection('club_finances')
      .doc(clubId)
      .collection('transactions')
      .doc();

    batch.set(transactionRef, {
      type: 'license_sale',
      amount: saleRecord.profit,
      description: `Lisensalg av ${saleData.customerName || saleData.customerEmail}`,
      createdAt: new Date(),
      sellerId,
      sellerName: sellerData.name || sellerData.email,
      customerEmail: saleData.customerEmail,
      saleId: saleRef.id,
      metadata: {
        salePrice: saleRecord.salePrice,
        debtPerLicense: packageInfo.debtPerLicense,
        profit: saleRecord.profit
      }
    });

    await batch.commit();

    return {
      success: true,
      saleId: saleRef.id,
      profit: saleRecord.profit
    };

  } catch (error) {
    console.error('Error recording license sale:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get license sales for a specific club
 * @param {string} clubId - The club ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of license sales
 */
export async function getClubLicenseSales(clubId, options = {}) {
  try {
    const { limit = 50, sellerId = null, status = null } = options;

    let query = db.collection('license_sales')
      .where('clubId', '==', clubId)
      .orderBy('createdAt', 'desc');

    if (sellerId) {
      query = query.where('sellerId', '==', sellerId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());

  } catch (error) {
    console.error('Error getting club license sales:', error);
    return [];
  }
}

/**
 * Get license sales for a specific seller
 * @param {string} sellerId - The seller ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of license sales
 */
export async function getSellerLicenseSales(sellerId, options = {}) {
  try {
    const { limit = 50, status = null } = options;

    let query = db.collection('license_sales')
      .where('sellerId', '==', sellerId)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());

  } catch (error) {
    console.error('Error getting seller license sales:', error);
    return [];
  }
}

/**
 * Get sales statistics for a club
 * @param {string} clubId - The club ID
 * @returns {Promise<Object>} Sales statistics
 */
export async function getClubSalesStats(clubId) {
  try {
    // Get all sales for the club
    const salesSnapshot = await db.collection('license_sales')
      .where('clubId', '==', clubId)
      .get();

    const sales = salesSnapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

    // Group by seller
    const sellerStats = sales.reduce((acc, sale) => {
      const sellerId = sale.sellerId;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerId,
          sellerName: sale.sellerName,
          sales: 0,
          revenue: 0,
          profit: 0
        };
      }
      acc[sellerId].sales++;
      acc[sellerId].revenue += sale.salePrice || 0;
      acc[sellerId].profit += sale.profit || 0;
      return acc;
    }, {});

    // Get current month sales
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthSales = sales.filter(sale => 
      new Date(sale.createdAt) >= currentMonth
    );

    return {
      total: {
        sales: totalSales,
        revenue: totalRevenue,
        profit: totalProfit
      },
      currentMonth: {
        sales: monthSales.length,
        revenue: monthSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
        profit: monthSales.reduce((sum, sale) => sum + (sale.profit || 0), 0)
      },
      sellers: Object.values(sellerStats).sort((a, b) => b.sales - a.sales)
    };

  } catch (error) {
    console.error('Error getting club sales stats:', error);
    return {
      total: { sales: 0, revenue: 0, profit: 0 },
      currentMonth: { sales: 0, revenue: 0, profit: 0 },
      sellers: []
    };
  }
}

/**
 * Check if a license is still valid
 * @param {string} saleId - The license sale ID
 * @returns {Promise<{valid: boolean, sale?: Object, daysRemaining?: number}>}
 */
export async function checkLicenseValidity(saleId) {
  try {
    const saleDoc = await db.collection('license_sales').doc(saleId).get();
    
    if (!saleDoc.exists) {
      return { valid: false, error: 'License not found' };
    }

    const saleData = saleDoc.data();
    const now = new Date();
    const validUntil = new Date(saleData.licenseValidUntil);
    
    const valid = now <= validUntil && saleData.status === 'active';
    const daysRemaining = Math.max(0, Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24)));

    return {
      valid,
      sale: saleData,
      daysRemaining
    };

  } catch (error) {
    console.error('Error checking license validity:', error);
    return { valid: false, error: error.message };
  }
}
