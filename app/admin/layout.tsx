"use client";

import { useAuth } from "@/context/AuthContext"; // ← ده المسار الصحيح من الكود اللي عندك
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FaChartBar, FaBus, FaFileAlt, FaSignOutAlt } from "react-icons/fa";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useAuth(); // ← استخدام الـ role من context
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.replace("/login");
    }
  }, [role, router]);

  // لو مش مسجل دخول أو role مش موجود → ما يظهرش حاجة
  if (!role) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
      {/* Sidebar واحد نظيف */}
      <aside className="w-full md:w-64 bg-indigo-950/80 backdrop-blur-md p-4 md:p-6 flex md:flex-col gap-4 md:gap-6 border-b md:border-b-0 md:border-r border-indigo-800/50">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 text-white text-base md:text-lg font-medium hover:text-indigo-300 transition whitespace-nowrap"
        >
          <FaChartBar className="text-xl md:text-2xl" /> Dashboard
        </Link>

        <Link
          href="/admin/buses"
          className="flex items-center gap-3 text-white text-base md:text-lg font-medium hover:text-indigo-300 transition whitespace-nowrap"
        >
          <FaBus className="text-xl md:text-2xl" /> Buses
        </Link>

        <Link
          href="/admin/reports"
          className="flex items-center gap-3 text-white text-base md:text-lg font-medium hover:text-indigo-300 transition whitespace-nowrap"
        >
          <FaFileAlt className="text-xl md:text-2xl" /> Reports
        </Link>

        {/* زر تسجيل الخروج تحت خالص */}
        <div className="mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem("role");
              setRole("supervisor"); // أو أي default
              router.replace("/login");
            }}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 text-base md:text-lg font-medium transition whitespace-nowrap w-full"
          >
            <FaSignOutAlt className="text-xl md:text-2xl" /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}