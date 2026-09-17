"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1527] text-white p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Ha ocurrido un error inesperado</h1>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        {error.message || "Se ha producido un problema al cargar la vista."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0052CC] transition cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  );
}
