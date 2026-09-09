import { NextResponse } from 'next/server';
import { pool, initDb } from '@/lib/db';
import { createRedsysPaymentPayload, DEFAULT_REDSYS_SANDBOX_CONFIG, RedsysMerchantConfig } from '@/lib/redsys';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { tripId, token, amount, description, clientEmail, clientName } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Importe de pago no válido' }, { status: 400 });
    }

    // Try to find the agency/user who owns this trip to load their custom Redsys configuration if set
    let merchantConfig: Partial<RedsysMerchantConfig> = DEFAULT_REDSYS_SANDBOX_CONFIG;

    if (tripId) {
      try {
        const tripResult = await pool.query<{ user_id: number; tenant_id: string }>(
          'SELECT user_id, tenant_id FROM trips WHERE id = $1',
          [tripId]
        );

        if (tripResult.rows.length > 0) {
          const userId = tripResult.rows[0].user_id;
          const userResult = await pool.query<{ payment_providers: any }>(
            'SELECT payment_providers FROM users WHERE id = $1',
            [userId]
          );

          const redsysData = userResult.rows[0]?.payment_providers?.redsys;
          if (redsysData?.connected && redsysData?.fuc && redsysData?.secretKey) {
            merchantConfig = {
              fuc: redsysData.fuc,
              terminal: redsysData.terminal || '001',
              secretKey: redsysData.secretKey,
              environment: redsysData.environment === 'real' ? 'real' : 'test',
            };
          }
        }
      } catch (err) {
        console.warn('Could not load custom Redsys config, using sandbox defaults:', err);
      }
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const appUrl = `${proto}://${host}`;

    const tripToken = token || tripId || 'viaje';
    const returnUrlOk = `${appUrl}/publico/${encodeURIComponent(tripToken)}?pago=ok`;
    const returnUrlKo = `${appUrl}/publico/${encodeURIComponent(tripToken)}?pago=ko`;
    const merchantUrlNotification = `${appUrl}/api/payments/redsys/webhook`;

    const payload = createRedsysPaymentPayload({
      amount: parsedAmount,
      productDescription: description || 'Depósito Reserva de Viaje',
      returnUrlOk,
      returnUrlKo,
      merchantUrlNotification,
      config: merchantConfig,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error creating Redsys charge payload:', error);
    return NextResponse.json(
      { error: 'No se ha podido inicializar la pasarela Redsys' },
      { status: 500 }
    );
  }
}
