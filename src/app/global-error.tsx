"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#0d1527] text-white p-6 text-center font-sans">
        <h1 className="text-2xl font-bold mb-2">Error en la aplicación</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          {error.message || "Se ha producido un error inesperado."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white transition cursor-pointer"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
