import { db } from '@/lib/firebase/admin';
import { getPackageById } from './packages';

/**
 * Calculate the next debt due date based on activation date
 * @param {Date} activationDate - The date when the package was activated
 * @returns {Date} Next debt due date
 */
export function calculateNextDebtDate(activationDate) {
  const nextDate = new Date(activationDate);
  const today = new Date();
  
  // Add months until we get to a future date
  while (nextDate <= today) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}

/**
 * Calculate how many debt payments are due since activation
 * @param {Date} activationDate - The date when the package was activated
 * @param {Date} lastDebtDate - The last date debt was charged (optional)
 * @returns {number} Number of months of debt that should be charged
 */
export function calculateDebtPaymentsDue(activationDate, lastDebtDate = null) {
  const today = new Date();
  const startDate = lastDebtDate ? new Date(lastDebtDate) : new Date(activationDate);
  
  // Calculate months between start date and today
  const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                    (today.getMonth() - startDate.getMonth());
  
  // If it's past the anniversary day of the month, include this month
  const daysDiff = today.getDate() - startDate.getDate();
  
  return daysDiff >= 0 ? monthsDiff + 1 : monthsDiff;
}

/**
 * Process monthly debt for a specific club
 * @param {string} clubId - The club ID
 * @returns {Promise<{success: boolean, processed: number, amount: number}>}
 */
export async function processClubMonthlyDebt(clubId) {
  const batch = db.batch();
  let totalAmount = 0;
  let paymentsProcessed = 0;

  try {
    // Get club data
    const clubDoc = await db.collection('clubs').doc(clubId).get();
    if (!clubDoc.exists) {
      throw new Error('Club not found');
    }

    const clubData = clubDoc.data();
    if (!clubData.packageId || !clubData.packageActivatedAt) {
      return { success: true, processed: 0, amount: 0 }; // No package or not activated
    }

    // Get package information
    const packageInfo = getPackageById(clubData.packageId);
    if (!packageInfo) {
      throw new Error('Package not found');
    }

    // Get club finances document
    const financeRef = db.collection('club_finances').doc(clubId);
    const financeDoc = await financeRef.get();
    const financeData = financeDoc.exists ? financeDoc.data() : {};

    const activationDate = clubData.packageActivatedAt.toDate();
    const lastDebtDate = financeData.lastDebtChargedAt ? financeData.lastDebtChargedAt.toDate() : null;
    
    // Calculate how many payments are due
    const paymentsDue = calculateDebtPaymentsDue(activationDate, lastDebtDate);
    
    if (paymentsDue <= 0) {
      return { success: true, processed: 0, amount: 0 }; // No payments due
    }

    // Calculate total debt amount
    totalAmount = packageInfo.monthlyDebt * paymentsDue;
    paymentsProcessed = paymentsDue;

    // Update club finances
    const newTotalDebt = (financeData.totalDebt || 0) + totalAmount;
    const newCurrentBalance = (financeData.totalIncome || 0) - newTotalDebt;
    
    batch.set(financeRef, {
      totalDebt: newTotalDebt,
      currentBalance: newCurrentBalance,
      lastDebtChargedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Add transaction records for each month
    for (let i = 0; i < paymentsDue; i++) {
      const transactionDate = new Date(lastDebtDate || activationDate);
      transactionDate.setMonth(transactionDate.getMonth() + i + 1);
      
      const transactionRef = db.collection('club_finances')
        .doc(clubId)
        .collection('transactions')
        .doc();

      batch.set(transactionRef, {
        type: 'monthly_debt',
        amount: packageInfo.monthlyDebt,
        description: `Månedlig gjeld for ${packageInfo.name}`,
        createdAt: transactionDate,
        packageId: clubData.packageId,
        metadata: {
          licensesCount: packageInfo.licenses,
          debtPerLicense: packageInfo.debtPerLicense
        }
      });

      // Create agent commission if club has an agent
      if (clubData.agentId) {
        const commissionAmount = packageInfo.licenses * 1; // 1 NOK per license per month
        const commissionRef = db.collection('commissions').doc();
        
        batch.set(commissionRef, {
          agentId: clubData.agentId,
          clubId: clubId,
          clubName: clubData.name,
          packageId: clubData.packageId,
          packageName: packageInfo.name,
          licenseCount: packageInfo.licenses,
          amount: commissionAmount,
          type: 'monthly_commission',
          status: 'earned',
          period: {
            year: transactionDate.getFullYear(),
            month: transactionDate.getMonth() + 1,
          },
          createdAt: transactionDate,
          updatedAt: transactionDate,
          dueDate: new Date(transactionDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          metadata: {
            generatedBy: 'monthly_debt_cron',
            debtAmount: packageInfo.monthlyDebt
          }
        });

        console.log(`Created monthly commission for agent ${clubData.agentId}: ${commissionAmount} NOK for club ${clubData.name}`);
      }
    }

    await batch.commit();

    return {
      success: true,
      processed: paymentsProcessed,
      amount: totalAmount
    };

  } catch (error) {
    console.error('Error processing club monthly debt:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      amount: 0
    };
  }
}

/**
 * Process monthly debt for all active clubs
 * @returns {Promise<{success: boolean, results: Array}>}
 */
export async function processAllClubsMonthlyDebt() {
  try {
    // Get all clubs with active packages
    const clubsSnapshot = await db.collection('clubs')
      .where('packageId', '!=', null)
      .where('packageActivatedAt', '!=', null)
      .get();

    const results = [];
    
    for (const clubDoc of clubsSnapshot.docs) {
      const clubId = clubDoc.id;
      const clubData = clubDoc.data();
      
      console.log(`Processing monthly debt for club: ${clubData.name} (${clubId})`);
      
      const result = await processClubMonthlyDebt(clubId);
      results.push({
        clubId,
        clubName: clubData.name,
        ...result
      });
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalAmount = results.reduce((sum, r) => sum + r.amount, 0);

    return {
      success: true,
      results,
      summary: {
        clubsProcessed: results.length,
        totalPayments: totalProcessed,
        totalAmount
      }
    };

  } catch (error) {
    console.error('Error processing all clubs monthly debt:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Check which clubs have overdue debt payments
 * @returns {Promise<Array>} Array of clubs with overdue payments
 */
export async function getClubsWithOverdueDebt() {
  try {
    const clubsSnapshot = await db.collection('clubs')
      .where('packageId', '!=', null)
      .where('packageActivatedAt', '!=', null)
      .get();

    const overdueClubs = [];

    for (const clubDoc of clubsSnapshot.docs) {
      const clubData = clubDoc.data();
      const clubId = clubDoc.id;

      // Get finance data
      const financeDoc = await db.collection('club_finances').doc(clubId).get();
      const financeData = financeDoc.exists ? financeDoc.data() : {};

      const activationDate = clubData.packageActivatedAt.toDate();
      const lastDebtDate = financeData.lastDebtChargedAt ? financeData.lastDebtChargedAt.toDate() : null;
      
      const paymentsDue = calculateDebtPaymentsDue(activationDate, lastDebtDate);
      
      if (paymentsDue > 0) {
        const packageInfo = getPackageById(clubData.packageId);
        overdueClubs.push({
          clubId,
          clubName: clubData.name,
          packageName: packageInfo?.name,
          activationDate,
          lastDebtDate,
          paymentsDue,
          amountDue: paymentsDue * (packageInfo?.monthlyDebt || 0)
        });
      }
    }

    return overdueClubs;

  } catch (error) {
    console.error('Error getting clubs with overdue debt:', error);
    return [];
  }
}
