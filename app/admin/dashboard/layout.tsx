"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f2c] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#111a3a] p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-10">
            🚍 School Bus
          </h2>

          <nav className="space-y-4">
            <Link
              href="/admin/dashboard"
              className="block p-3 rounded-xl hover:bg-blue-600 transition"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/buses"
              className="block p-3 rounded-xl hover:bg-blue-600 transition"
            >
              Buses
            </Link>

            <Link
              href="/admin/reports"
              className="block p-3 rounded-xl hover:bg-blue-600 transition"
            >
              Reports
            </Link>
          </nav>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 p-3 rounded-xl hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-10">{children}</div>
    </div>
  );
}
