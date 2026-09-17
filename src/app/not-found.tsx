import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1527] text-white p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-[#0066FF] mb-4 border border-blue-500/20">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        El recurso o viaje que buscas no existe o el enlace ha caducado.
      </p>
      <Link
        href="/viajes"
        className="rounded-full bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0052CC] transition"
      >
        Volver a mis viajes
      </Link>
    </div>
  );
}
