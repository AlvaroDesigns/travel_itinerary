import Stripe from 'stripe';

const DEFAULT_STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

/**
 * Returns a Stripe client instance. If a custom secret key is provided (e.g. from user preferences),
 * it uses that; otherwise it falls back to the environment variable.
 */
export function getStripeClient(customSecretKey?: string): Stripe {
  const key = customSecretKey || DEFAULT_STRIPE_SECRET_KEY;
  if (!key) {
    // Return dummy client with placeholder key if none configured yet
    return new Stripe('sk_test_placeholder_mogu_key', {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
  }
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  });
}

/**
 * Creates a Stripe Connect onboarding link for an agency / user
 */
export async function createStripeConnectAccountLink({
  accountId,
  refreshUrl,
  returnUrl,
  customSecretKey,
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  customSecretKey?: string;
}): Promise<string> {
  const stripe = getStripeClient(customSecretKey);
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return accountLink.url;
}

/**
 * Creates an Express or Standard Connected Account on Stripe
 */
export async function createStripeConnectedAccount({
  email,
  businessName,
  country = 'ES',
  customSecretKey,
}: {
  email: string;
  businessName?: string;
  country?: string;
  customSecretKey?: string;
}): Promise<Stripe.Account> {
  const stripe = getStripeClient(customSecretKey);
  return await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    company: businessName ? { name: businessName } : undefined,
  });
}

/**
 * Verifies if the provided Stripe credentials are valid by calling the Stripe API
 */
export async function verifyStripeCredentials(secretKey: string): Promise<{
  valid: boolean;
  error?: string;
  accountId?: string;
  email?: string;
  livemode?: boolean;
}> {
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
    // Attempt to retrieve balance or account information
    const balance = await stripe.balance.retrieve();
    return {
      valid: true,
      livemode: balance.livemode,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Clave de Stripe no válida',
    };
  }
}
