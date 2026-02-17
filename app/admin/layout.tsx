"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-64 bg-slate-900 p-6 space-y-6">
        <h2 className="text-2xl font-bold">School Bus</h2>

        <nav className="space-y-4">
          <Link href="/admin/dashboard">Dashboard</Link>

          <Link href="/admin/buses">Buses</Link>

          {role === "manager" && (
            <Link href="/admin/reports">Reports</Link>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
