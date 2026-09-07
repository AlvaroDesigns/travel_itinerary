"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import type { AuthenticatedUser } from "@/lib/auth";

export function AdminShell({
  children,
}: {
  currentUser?: AuthenticatedUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  let activeMenu:
    | "admin"
    | "admin_usuarios" = "admin";

  if (pathname === "/admin/usuarios" || pathname.startsWith("/admin/usuarios/")) {
    activeMenu = "admin_usuarios";
  }

  return (
    <DashboardShell activeMenu={activeMenu}>
      <div className="w-full space-y-6">{children}</div>
    </DashboardShell>
  );
}
