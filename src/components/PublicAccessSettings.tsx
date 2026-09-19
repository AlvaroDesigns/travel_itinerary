'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Eye, Link2, Wallet } from 'lucide-react';
import { SettingsSwitch } from '@/components/SettingsSwitch';
import type { NotificationSettings } from '@/lib/notification-settings';
import { useTravel } from '@/context/TravelContext';
import { isAgencyUser, normalizeAgencyUrl, buildPublicTripUrl } from '@/lib/user-utils';

interface PublicAccessSettingsProps {
  settings: NotificationSettings;
  onChange: (changes: Partial<NotificationSettings>) => void;
}

export function PublicAccessSettings({ settings, onChange }: PublicAccessSettingsProps) {
  const { user } = useTravel();
  const isAgency = isAgencyUser(user);
  const [copied, setCopied] = useState(false);

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveBase = (isAgency && user?.agencyUrl) ? normalizeAgencyUrl(user.agencyUrl) : baseOrigin;

  const publicUrl = settings.publicAccessToken
    ? buildPublicTripUrl(effectiveBase, settings.publicAccessToken)
    : '';

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF]"><Link2 className="h-5 w-5" /></div>
          <div>
            <h3 className="font-bold text-zinc-900">URL pública del itinerario</h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">Permite abrir el viaje sin iniciar sesión. Desactívala cuando quieras revocar el acceso.</p>
          </div>
        </div>
        <SettingsSwitch
          label="URL pública activa"
          checked={settings.publicAccessEnabled}
          onCheckedChange={(publicAccessEnabled) => onChange({ publicAccessEnabled })}
        />
      </div>

      {settings.publicAccessEnabled && <div className="mt-5 rounded-xl border border-blue-200/80 bg-blue-50/60 p-4">
        {publicUrl ? <><label className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">Enlace para compartir</label><div className="mt-2 flex gap-2"><input readOnly value={publicUrl} className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none" /><button type="button" onClick={copyUrl} className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0066FF] px-3 py-2 text-xs font-bold text-white hover:bg-[#0052CC]"><Copy className="h-3.5 w-3.5" />{copied ? 'Copiado' : 'Copiar'}</button><a href={publicUrl} target="_blank" rel="noreferrer" className="flex shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-[#0066FF] hover:bg-blue-100" title="Abrir enlace público"><ExternalLink className="h-4 w-4" /></a></div></> : <p className="text-sm text-[#0066FF]">Guarda la configuración para generar la URL pública.</p>}
      </div>}

      <div className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${settings.publicAccessEnabled ? '' : 'opacity-55'}`}>
        <div>
          <div className="flex items-start gap-2"><Eye className="mt-0.5 h-4 w-4 text-zinc-500" /><div><p className="text-sm font-bold text-zinc-700">Cuándo mostrar el itinerario</p><p className="mt-0.5 text-xs leading-relaxed text-zinc-500">Elige si el enlace muestra el plan desde ahora o lo reserva para el último día.</p></div></div>
          <div className="mt-3 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm font-semibold"><button type="button" disabled={!settings.publicAccessEnabled} onClick={() => onChange({ publicItineraryVisibility: 'all' })} className={`rounded-lg px-2 py-2 transition ${settings.publicItineraryVisibility === 'all' ? 'bg-white text-[#0066FF] shadow-xs' : 'text-zinc-500'}`}>Todo ahora</button><button type="button" disabled={!settings.publicAccessEnabled} onClick={() => onChange({ publicItineraryVisibility: 'day_before' })} className={`rounded-lg px-2 py-2 transition ${settings.publicItineraryVisibility === 'day_before' ? 'bg-white text-[#0066FF] shadow-xs' : 'text-zinc-500'}`}>24 h antes</button></div>
        </div>
        <div>
          <div className="flex items-start gap-2"><Wallet className="mt-0.5 h-4 w-4 text-slate-500" /><div><p className="text-sm font-bold text-slate-700">Gastos visibles</p><p className="mt-0.5 text-xs leading-relaxed text-slate-500">Muestra u oculta los costes de cada actividad y el total estimado.</p></div></div>
          <SettingsSwitch
            label="Mostrar gastos en el enlace"
            disabled={!settings.publicAccessEnabled}
            checked={settings.publicShowExpenses}
            onCheckedChange={(publicShowExpenses) => onChange({ publicShowExpenses })}
          />
        </div>
      </div>
    </div>
  );
}
