import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/auth/middleware';
import { getLicensePackageById } from '@/utils/packages';

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
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const status = url.searchParams.get('status'); // optional filter

    // Debug: Log agent UID for troubleshooting
    console.log('Agent dashboard - Looking for clubs with agentId:', user.uid);
    console.log('Agent email:', user.email);

    // The issue: agentId in club doesn't match user.uid
    // Need to find clubs where this user is the responsible agent
    // Try multiple approaches to find the correct clubs

    let clubsSnapshot;
    let allClubs = [];

    // Approach 1: Direct agentId match
    try {
      const directQuery = await db.collection('clubs')
        .where('agentId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      if (!directQuery.empty) {
        allClubs.push(...directQuery.docs);
        console.log('Found', directQuery.size, 'clubs by direct agentId match');
      }
    } catch (error) {
      console.error('Error in direct agentId query:', error);
    }

    // Approach 2: Look for clubs where user email matches agent email in club metadata
    try {
      const emailQuery = await db.collection('clubs')
        .where('agentEmail', '==', user.email)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      if (!emailQuery.empty) {
        allClubs.push(...emailQuery.docs);
        console.log('Found', emailQuery.size, 'clubs by agent email match');
      }
    } catch (error) {
      console.error('Error in agent email query:', error);
    }

    // Approach 3: Get all clubs and check invitations collection for this agent
    try {
      const invitationsSnapshot = await db.collection('invitations')
        .where('agentId', '==', user.uid)
        .where('type', '==', 'club_package')
        .get();
      
      if (!invitationsSnapshot.empty) {
        const clubIds = invitationsSnapshot.docs.map(doc => doc.data().clubId).filter(Boolean);
        
        if (clubIds.length > 0) {
          const clubPromises = clubIds.map(clubId => db.collection('clubs').doc(clubId).get());
          const clubDocs = await Promise.all(clubPromises);
          const existingClubs = clubDocs.filter(doc => doc.exists);
          
          allClubs.push(...existingClubs);
          console.log('Found', existingClubs.length, 'clubs through invitations');
        }
      }
    } catch (error) {
      console.error('Error in invitations query:', error);
    }

    // Remove duplicates based on document ID
    const uniqueClubs = allClubs.reduce((unique, doc) => {
      if (!unique.find(existing => existing.id === doc.id)) {
        unique.push(doc);
      }
      return unique;
    }, []);

    console.log('Total unique clubs found:', uniqueClubs.length);
    
    // Log first club for debugging
    if (uniqueClubs.length > 0) {
      const firstClub = uniqueClubs[0].data();
      console.log('First club data:', {
        id: uniqueClubs[0].id,
        name: firstClub.name,
        packageStatus: firstClub.packageStatus,
        packageId: firstClub.packageId,
        adminId: firstClub.adminId
      });
    }

    // Create a mock snapshot object
    clubsSnapshot = {
      docs: uniqueClubs,
      size: uniqueClubs.length,
      empty: uniqueClubs.length === 0
    };

    // If still no clubs found, debug by showing all clubs
    if (clubsSnapshot.empty) {
      console.log('No clubs found for agent. Debugging...');
      const debugQuery = await db.collection('clubs').limit(3).get();
      console.log('Sample clubs in database:');
      debugQuery.docs.forEach(doc => {
        const data = doc.data();
        console.log('Club ID:', doc.id);
        console.log('  agentId:', data.agentId);
        console.log('  agentEmail:', data.agentEmail);
        console.log('  name:', data.name);
      });
      
      const debugInvitations = await db.collection('invitations').limit(3).get();
      console.log('Sample invitations:');
      debugInvitations.docs.forEach(doc => {
        const data = doc.data();
        console.log('Invitation ID:', doc.id);
        console.log('  agentId:', data.agentId);
        console.log('  clubId:', data.clubId);
        console.log('  type:', data.type);
      });
    }

    // Add status filter if provided and we have clubs
    if (status && !clubsSnapshot.empty) {
      // Apply status filter to existing results
      const filteredDocs = clubsSnapshot.docs.filter(doc => 
        doc.data().packageStatus === status
      );
      clubsSnapshot = { docs: filteredDocs, size: filteredDocs.length, empty: filteredDocs.length === 0 };
    }

    console.log('Processing club data for', clubsSnapshot.docs.length, 'clubs...');
    
    const clubs = await Promise.all(
      clubsSnapshot.docs.map(async (doc, index) => {
        try {
          console.log(`Processing club ${index + 1}: ${doc.id}`);
          const clubData = doc.data();
          
          // Get package details if club has a package
          let packageInfo = null;
          if (clubData.packageId) {
            packageInfo = getLicensePackageById(clubData.packageId);
            console.log(`Club ${doc.id} package:`, packageInfo ? packageInfo.name : 'not found');
          }

          // Get club admin info
          let adminInfo = null;
          if (clubData.adminId) {
            try {
              const adminDoc = await db.collection('users').doc(clubData.adminId).get();
              if (adminDoc.exists) {
                const adminData = adminDoc.data();
                adminInfo = {
                  firstName: adminData.firstName,
                  lastName: adminData.lastName,
                  email: adminData.email,
                  phone: adminData.phone,
                };
                console.log(`Club ${doc.id} admin:`, adminInfo.firstName, adminInfo.lastName);
              } else {
                console.log(`Club ${doc.id} admin not found:`, clubData.adminId);
              }
            } catch (error) {
              console.error(`Error fetching admin info for club ${doc.id}:`, error);
            }
          }

          // Get financial summary
          const financesSnapshot = await db.collection('club_finances')
            .where('clubId', '==', doc.id)
            .get();

          let totalDebt = 0;
          let totalIncome = 0;
          
          financesSnapshot.docs.forEach(financeDoc => {
            const finance = financeDoc.data();
            if (finance.type === 'monthly_debt') {
              totalDebt += finance.amount || 0;
            } else if (finance.type === 'license_sale') {
              totalIncome += finance.amount || 0;
            }
          });

          // Get license sales count
          const salesSnapshot = await db.collection('license_sales')
            .where('clubId', '==', doc.id)
            .get();

          const processedClub = {
            id: doc.id,
            ...clubData,
            // Convert Firestore timestamps
            createdAt: clubData.createdAt?.toDate?.()?.toISOString(),
            updatedAt: clubData.updatedAt?.toDate?.()?.toISOString(),
            packageAssignedAt: clubData.packageAssignedAt?.toDate?.()?.toISOString(),
            packageActivatedAt: clubData.packageActivatedAt?.toDate?.()?.toISOString(),
            
            // Additional computed data
            packageInfo,
            adminInfo,
            financialSummary: {
              totalDebt,
              totalIncome,
              currentBalance: totalIncome - totalDebt,
              totalLicensesSold: salesSnapshot.size,
              licensesRemaining: packageInfo ? (packageInfo.licenses - salesSnapshot.size) : 0,
            }
          };
          
          console.log(`Processed club ${doc.id}:`, {
            name: processedClub.name,
            status: processedClub.packageStatus,
            hasPackage: !!processedClub.packageInfo,
            hasAdmin: !!processedClub.adminInfo
          });
          
          return processedClub;
          
        } catch (error) {
          console.error(`Error processing club ${doc.id}:`, error);
          // Return basic club data if processing fails
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
            packageInfo: null,
            adminInfo: null,
            financialSummary: {
              totalDebt: 0,
              totalIncome: 0,
              currentBalance: 0,
              totalLicensesSold: 0,
              licensesRemaining: 0,
            }
          };
        }
      })
    );
    
    console.log('Final clubs array length:', clubs.length);
    console.log('First club in response:', clubs[0] ? {
      id: clubs[0].id,
      name: clubs[0].name,
      packageStatus: clubs[0].packageStatus
    } : 'no clubs');

    // Calculate summary statistics
    const summary = {
      totalClubs: clubs.length,
      activeClubs: clubs.filter(c => c.packageStatus === 'active').length,
      pendingClubs: clubs.filter(c => c.packageStatus === 'pending_payment').length,
      totalRevenue: clubs.reduce((sum, club) => sum + club.financialSummary.totalIncome, 0),
      totalCommissions: clubs.length * 1, // 1 NOK per license per month - simplified calculation
    };

    const responseData = {
      clubs,
      summary,
      pagination: {
        total: clubsSnapshot.size,
        limit,
        hasMore: clubsSnapshot.size === limit,
      }
    };
    
    console.log('Sending response with clubs count:', responseData.clubs.length);
    console.log('Response summary:', responseData.summary);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching agent clubs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
