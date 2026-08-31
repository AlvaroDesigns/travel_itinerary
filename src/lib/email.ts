export interface EmailMessage {
  to: string;
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
}

interface TravelEmailTemplateOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  highlight?: { label: string; value: string };
  highlightStyle?: 'card' | 'minimal';
  detail?: string;
  cta?: { label: string; url: string };
}

export function isEmailServiceConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function surpriseCountdownMessage() {
  const messages = [
    'Hay una aventura esperándote y cada día está más cerca.',
    'Muy pronto tendrás una sorpresa marcada en el calendario.',
    'Empieza a ilusionarte: una experiencia especial se está acercando.',
    'Una próxima aventura sigue su cuenta atrás, pero la fecha sigue siendo un secreto.',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Devuelve una cuenta atrás señuelo para el modo sorpresa. No refleja los días
 * reales; su objetivo es despistar sobre la fecha auténtica de salida.
 */
export function decoyCountdownValue() {
  const decoys = [
'Próximamente, estate alerta.', 'Falta muy poco'
  ];
  return decoys[Math.floor(Math.random() * decoys.length)];
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character] || character));
}

function appUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Plantilla clara basada en tablas e inline CSS. Replica la interfaz editorial
 * de Wanderlust y mantiene compatibilidad con Gmail, Apple Mail y Outlook.
 */
export function createTravelEmail({
  preheader,
  eyebrow,
  title,
  intro,
  highlight,
  highlightStyle = 'card',
  detail,
  cta,
}: TravelEmailTemplateOptions) {
  const logoUrl = `${appUrl()}/wanderlust_horizontal_negro.png`;
  const isLongValue = Boolean(highlight && highlight.value.length > 60);
  const minimalValueStyle = isLongValue
    ? 'margin:0;color:#2b2b2b;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;line-height:24px;'
    : 'margin:0;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:800;line-height:31px;letter-spacing:-0.4px;';
  const highlightHtml = highlight
    ? highlightStyle === 'minimal'
      ? `<tr><td style="padding:2px 32px 30px;"><p style="margin:0 0 7px;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;">${escapeHtml(highlight.label)}</p><p style="${minimalValueStyle}">${escapeHtml(highlight.value).replace(/\n/g, '<br />')}</p></td></tr>`
      : `<tr><td style="padding:0 32px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e0e0e0;border-radius:14px;background:#f7f7f7;"><tr><td style="padding:18px 20px;"><p style="margin:0 0 6px;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;">${escapeHtml(highlight.label)}</p><p style="margin:0;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;line-height:29px;letter-spacing:-0.3px;">${escapeHtml(highlight.value)}</p></td></tr></table></td></tr>`
    : '';
  const detailHtml = detail
    ? `<tr><td style="padding:0 32px 26px;"><p style="margin:0;color:#454545;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:500;line-height:22px;">${escapeHtml(detail).replace(/\n/g, '<br />')}</p></td></tr>`
    : '';
  const ctaHtml = cta
    ? `<tr><td style="padding:4px 32px 34px;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;border-radius:12px;background:#000000;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;line-height:20px;padding:13px 20px;text-decoration:none;">${escapeHtml(cta.label)}&nbsp;&nbsp;→</a></td></tr>`
    : '';

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"></head><body style="margin:0;padding:0;background:#f6f6f6;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f6f6;"><tr><td align="center" style="padding:30px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #e5e5e5;border-radius:18px;overflow:hidden;background:#ffffff;"><tr><td style="border-bottom:1px solid #e5e5e5;padding:24px 32px;"><img src="${escapeHtml(logoUrl)}" width="172" alt="Wanderlust" style="display:block;width:172px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr><tr><td style="padding:34px 32px 16px;"><p style="margin:0 0 11px;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p><h1 style="margin:0;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;letter-spacing:-0.8px;line-height:36px;">${escapeHtml(title)}</h1><p style="margin:16px 0 0;color:#454545;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:500;line-height:24px;">${escapeHtml(intro)}</p></td></tr>${highlightHtml}${detailHtml}${ctaHtml}<tr><td style="border-top:1px solid #e5e5e5;padding:20px 32px 25px;"><p style="margin:0;color:#8f8f8f;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">Recibes este aviso porque está configurado para este viaje. Si tienes cualquier duda, responde a este email.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail({ to, bcc = [], subject, html, text }: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;
  if (!apiKey || !from) throw new Error('El servicio de email no está configurado');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], ...(bcc.length > 0 ? { bcc } : {}), subject, html, ...(text ? { text } : {}), ...(replyTo ? { reply_to: replyTo } : {}) }),
  });

  if (!response.ok) throw new Error(`Resend respondió con ${response.status}: ${await response.text()}`);
}


export function createPasswordResetOtpEmail(code: string) {
  const safeCode = escapeHtml(code);
  return {
    subject: 'Tu código para restablecer la contraseña',
    text: `Tu código de recuperación es ${code}. Caduca en 10 minutos. Si no lo solicitaste, ignora este correo.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border:1px solid #e5e5e5;border-radius:16px"><tr><td style="padding:32px"><p style="margin:0 0 10px;color:#666;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Wanderlust</p><h1 style="margin:0;font-size:26px">Restablece tu contraseña</h1><p style="line-height:1.6;color:#454545">Introduce este código en la aplicación. Caduca en 10 minutos y solo puede usarse una vez.</p><p style="margin:26px 0;padding:16px;border-radius:10px;background:#f6f6f6;text-align:center;font-size:30px;font-weight:800;letter-spacing:8px">${safeCode}</p><p style="color:#666;font-size:13px;line-height:1.5">Si no solicitaste este cambio, puedes ignorar este correo.</p></td></tr></table></td></tr></table></body></html>`,
  };
}


export function createWelcomeInvitationEmail(challengeId: string, code: string) {
  const setupUrl = `${appUrl()}/login#welcome=1&challengeId=${encodeURIComponent(challengeId)}&code=${encodeURIComponent(code)}`;
  return {
    subject: 'Bienvenido a Wanderlust: crea tu contraseña',
    text: `Te damos la bienvenida a Wanderlust. Para crear tu contraseña, abre este enlace: ${setupUrl}\n\nEl enlace caduca en 10 minutos y solo puede utilizarse una vez. Si no esperabas esta invitación, puedes ignorar este correo.`,
    html: createTravelEmail({
      preheader: 'Tu invitación a Wanderlust está lista.',
      eyebrow: 'Bienvenido a Wanderlust',
      title: 'Crea tu contraseña',
      intro: 'Se ha creado una cuenta para ti. Elige una contraseña segura para activar tu acceso al planificador.',
      detail: 'Por seguridad, este enlace caduca en 10 minutos y solo puede utilizarse una vez. Si no esperabas esta invitación, puedes ignorar este correo.',
      cta: { label: 'Crear mi contraseña', url: setupUrl },
    }),
  };
}
