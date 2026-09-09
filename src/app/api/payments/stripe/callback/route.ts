import { NextRequest, NextResponse } from 'next/server';
import { initDb, pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const accountId = searchParams.get('accountId');
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (userId) {
      await initDb();
      // Mark Stripe as connected in user's preferences
      await pool.query(
        `UPDATE users 
         SET preferences = jsonb_set(
           COALESCE(preferences, '{}'::jsonb),
           '{paymentProviders,stripe}',
           $1::jsonb
         )
         WHERE id = $2`,
        [
          JSON.stringify({
            status: 'connected',
            connected: true,
            accountId: accountId || undefined,
            connectedAt: new Date().toISOString(),
          }),
          Number(userId),
        ]
      );
    }

    // Redirect user back to /cuenta?tab=pagos with success message
    return NextResponse.redirect(`${origin}/cuenta?tab=pagos&stripe=success`);
  } catch (error) {
    console.error('Error in Stripe callback:', error);
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/cuenta?tab=pagos&stripe=error`);
  }
}
