import fs from 'fs';

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

console.log('[NotificationDaemon] Iniciando vigilancia de notificaciones...');

async function check() {
  try {
    const res = await fetch('http://localhost:3000/api/cron/notifications');
    const data = await res.json();
    if (data.sent && data.sent.length > 0) {
      console.log(`[${new Date().toLocaleTimeString('es-ES')}] ¡Notificación enviada con éxito!`, data.sent);
    }
  } catch (err) {
    // server might be busy or restarting
  }
}

// Run immediately and every 15 seconds
check();
setInterval(check, 15000);
