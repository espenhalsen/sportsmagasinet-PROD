import { NextResponse } from 'next/server';
import { processAllClubsMonthlyDebt } from '@/utils/monthlyDebt';

export async function GET(request) {
  try {
    // Verify cron authorization (check for cron secret or specific header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting monthly debt processing cron job...');
    
    // Process monthly debt for all clubs
    const result = await processAllClubsMonthlyDebt();
    
    if (result.success) {
      console.log('Monthly debt processing completed:', result.summary);
      
      return NextResponse.json({
        success: true,
        message: 'Monthly debt processed successfully',
        ...result.summary
      });
    } else {
      console.error('Monthly debt processing failed:', result.error);
      
      return NextResponse.json(
        { error: 'Processing failed', details: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in monthly debt cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request); // Allow both GET and POST for flexibility
}
