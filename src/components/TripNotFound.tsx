"use client";

import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

export interface TripNotFoundProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  wrapInShell?: boolean;
}

export function TripNotFound({
  title = "Itinerario no encontrado",
  description = "No se ha podido cargar el viaje solicitado o el identificador no existe en tu cuenta.",
  buttonText = "Volver a mis viajes",
  buttonHref = "/viajes",
  wrapInShell = true,
}: TripNotFoundProps) {
  const content = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] mb-4 shadow-xs border border-blue-100/50">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-[#101828] mb-2">{title}</h2>
      <p className="text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <Link
        href={buttonHref}
        className="rounded-full bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] active:scale-[0.98] transition-all"
      >
        {buttonText}
      </Link>
    </div>
  );

  if (wrapInShell) {
    return <DashboardShell>{content}</DashboardShell>;
  }

  return content;
}
