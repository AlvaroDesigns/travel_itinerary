import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { verifyStripeCredentials } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { secretKey } = await req.json();
    if (!secretKey || typeof secretKey !== 'string') {
      return NextResponse.json({ error: 'Debes proporcionar la clave secreta de Stripe' }, { status: 400 });
    }

    const result = await verifyStripeCredentials(secretKey.trim());
    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Clave de Stripe no válida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      livemode: result.livemode,
      message: 'Credenciales de Stripe verificadas correctamente con la API oficial.',
    });
  } catch (error) {
    console.error('Error verifying Stripe credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar con Stripe' },
      { status: 500 }
    );
  }
}
