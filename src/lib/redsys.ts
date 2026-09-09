import crypto from 'crypto';

export interface RedsysMerchantConfig {
  fuc: string; // Merchant Code (e.g. '999008881' for sandbox)
  terminal: string; // e.g. '001'
  secretKey: string; // e.g. 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
  environment: 'test' | 'real';
}

export const DEFAULT_REDSYS_SANDBOX_CONFIG: RedsysMerchantConfig = {
  fuc: '999008881',
  terminal: '001',
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
  environment: 'test',
};

export const REDSYS_SANDBOX_URL = 'https://sis-t.redsys.es:25443/sis/realizarPago';
export const REDSYS_PRODUCTION_URL = 'https://sis.redsys.es/sis/realizarPago';

/**
 * 3DES key derivation using order number and secret key as required by Redsys HMAC-SHA256 specification.
 */
function encrypt3DES(order: string, keyBase64: string): Buffer {
  const secretKeyBytes = Buffer.from(keyBase64, 'base64');
  const iv = Buffer.alloc(8, 0); // 8 zero bytes IV
  const cipher = crypto.createCipheriv('des-ede3-cbc', secretKeyBytes, iv);
  cipher.setAutoPadding(true);
  
  // Pad order to 8 or 16 bytes if necessary
  const orderBuffer = Buffer.from(order, 'utf8');
  return Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
}

/**
 * Generates HMAC-SHA256 signature of merchant parameters base64 string using the 3DES derived key.
 */
function createSignature(merchantParametersBase64: string, order: string, keyBase64: string): string {
  const derivedKey = encrypt3DES(order, keyBase64);
  const hmac = crypto.createHmac('sha256', derivedKey);
  hmac.update(merchantParametersBase64);
  return hmac.digest('base64');
}

export interface CreateRedsysChargeOptions {
  amount: number; // in Euros (e.g. 250.00)
  orderId?: string; // 4 to 12 alphanumeric characters, starting with 4 digits
  productDescription: string;
  returnUrlOk: string;
  returnUrlKo: string;
  merchantUrlNotification?: string;
  config?: Partial<RedsysMerchantConfig>;
}

export function createRedsysPaymentPayload(options: CreateRedsysChargeOptions) {
  const config: RedsysMerchantConfig = {
    ...DEFAULT_REDSYS_SANDBOX_CONFIG,
    ...(options.config || {}),
  };

  // Convert amount to cents string (e.g. 250 -> '25000')
  const amountCents = Math.round(options.amount * 100).toString();

  // Generate order ID if not provided (must be 4 to 12 chars, starting with 4 digits)
  const now = Date.now().toString();
  const orderId = options.orderId || `${now.slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  const merchantParamsObj = {
    DS_MERCHANT_AMOUNT: amountCents,
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_MERCHANTCODE: config.fuc,
    DS_MERCHANT_CURRENCY: '978', // EUR
    DS_MERCHANT_TRANSACTIONTYPE: '0', // Autorización standard
    DS_MERCHANT_TERMINAL: config.terminal.padStart(3, '0'),
    DS_MERCHANT_MERCHANTURL: options.merchantUrlNotification || options.returnUrlOk,
    DS_MERCHANT_URLOK: options.returnUrlOk,
    DS_MERCHANT_URLKO: options.returnUrlKo,
    DS_MERCHANT_PRODUCTDESCRIPTION: options.productDescription.slice(0, 125),
    DS_MERCHANT_PAYMETHODS: 'T', // Tarjetas (incluye Bizum y 3D Secure)
  };

  const merchantParamsJson = JSON.stringify(merchantParamsObj);
  const dsMerchantParameters = Buffer.from(merchantParamsJson, 'utf8').toString('base64');
  const dsSignature = createSignature(dsMerchantParameters, orderId, config.secretKey);
  const formUrl = config.environment === 'real' ? REDSYS_PRODUCTION_URL : REDSYS_SANDBOX_URL;

  return {
    formUrl,
    orderId,
    amount: options.amount,
    currency: 'EUR',
    environment: config.environment,
    params: {
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: dsMerchantParameters,
      Ds_Signature: dsSignature,
    },
  };
}
