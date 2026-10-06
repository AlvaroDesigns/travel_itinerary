import fs from 'fs';

// Load .env.local
let env = '';
if (fs.existsSync('.env.local')) {
  env = fs.readFileSync('.env.local', 'utf8');
} else if (fs.existsSync('.env')) {
  env = fs.readFileSync('.env', 'utf8');
}

for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[m[1].trim()] = val;
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
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

function createTravelEmail({
  preheader,
  eyebrow,
  title,
  intro,
  highlight,
  highlightStyle = 'card',
  detail,
  cta,
}) {
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

async function sendEmail({ to, bcc = [], subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;
  if (!apiKey || !from) throw new Error('El servicio de email no está configurado');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      ...(bcc.length > 0 ? { bcc } : {}),
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend respondió con ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const instructions = `- Mochila de viaje\n- Temperaturas de 11 grados  a 26 grados maximo\n- Calzado comodo\n- Puede llover`;
const instructionsHours = 48;
const recipient = 'laura_bonnin@hotmail.com';
const bcc = ['info.alvarodesigns@gmail.com'];

const destinations = ['Andorra', 'Oviedo', 'Bruselas', 'Basilea', 'Amsterdam'];

const html = createTravelEmail({
  preheader: 'Instrucciones para tu salida próxima.',
  eyebrow: `${instructionsHours} horas antes`,
  title: 'Todo listo para salir',
  intro: `Quedan menos de ${instructionsHours} horas para tu salida.`,
  highlight: { label: 'Instrucciones', value: instructions },
  highlightStyle: 'minimal',
});

async function main() {
  console.log(`Iniciando envío de señuelos a ${recipient} con bcc ${bcc}...`);
  for (const dest of destinations) {
    const subject = `Instrucciones para ${dest}`;
    console.log(`Enviando: "${subject}"...`);
    const res = await sendEmail({
      to: recipient,
      bcc,
      subject,
      html,
    });
    console.log(`  -> Éxito! ID: ${res.id}`);
    // Wait 1.5 seconds between sends
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log('¡Todos los señuelos enviados con éxito!');
}

main().catch((err) => {
  console.error('Error enviando señuelos:', err);
  process.exit(1);
});
