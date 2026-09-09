import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getStripeClient, createStripeConnectedAccount, createStripeConnectAccountLink } from '@/lib/stripe';
import { initDb, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await initDb();

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const refreshUrl = `${origin}/cuenta?tab=pagos&stripe=refresh`;
    const returnUrl = `${origin}/api/payments/stripe/callback?userId=${auth.userId}`;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const clientId = process.env.STRIPE_CLIENT_ID;

    // Option A: If Stripe Connect Client ID is configured for OAuth
    if (clientId) {
      const state = Buffer.from(JSON.stringify({ userId: auth.userId, timestamp: Date.now() })).toString('base64');
      const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&stripe_user[email]=${encodeURIComponent(auth.email)}`;
      return NextResponse.json({ url: stripeOAuthUrl });
    }

    // Option B: If Stripe Secret Key is present, create an Express Account Link
    if (secretKey && !secretKey.includes('placeholder')) {
      try {
        const account = await createStripeConnectedAccount({
          email: auth.email,
          businessName: auth.agencyName,
          country: 'ES',
        });

        const onboardingUrl = await createStripeConnectAccountLink({
          accountId: account.id,
          refreshUrl,
          returnUrl: `${returnUrl}&accountId=${account.id}`,
        });

        // Store intermediate account ID in user preferences
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
              status: 'in_progress',
              connected: false,
              accountId: account.id,
              email: auth.email,
            }),
            auth.userId,
          ]
        );

        return NextResponse.json({ url: onboardingUrl });
      } catch (stripeErr) {
        console.warn('Stripe Connect Express creation warning:', stripeErr);
      }
    }

    // Fallback: Direct onboarding to Stripe Dashboard / Hosted page
    const directStripeUrl = `https://dashboard.stripe.com/register?email=${encodeURIComponent(auth.email)}`;
    return NextResponse.json({ url: directStripeUrl });
  } catch (error) {
    console.error('Error in Stripe Connect initialization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al conectar con Stripe' },
      { status: 500 }
    );
  }
}
