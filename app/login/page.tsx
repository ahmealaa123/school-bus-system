"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaGraduationCap, FaLock, FaEnvelope, FaArrowRight } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // محاكاة تأخير للشعور بالاحترافية
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === "admin@school.com" && password === "123456") {
      localStorage.setItem("admin", "true");
      router.push("/admin/dashboard");
    } else {
      setError("بيانات الدخول غير صحيحة");
    }

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
      {/* خلفية متحركة خفيفة (gradient blobs) */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* العنوان الرئيسي من فوق */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10"
      >
        <div className="flex items-center justify-center gap-4 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <FaGraduationCap className="text-6xl text-indigo-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tight">
            School Bus
          </h1>
        </div>
        <p className="text-xl text-gray-300 font-light tracking-wide">
          نظام إدارة الحافلات المدرسية الذكي
        </p>
      </motion.div>

      {/* صندوق اللوجين */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg relative"
        >
          {/* تأثير glow حول الصندوق */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-70 -z-10"></div>

          <div className="bg-gray-900/70 backdrop-blur-2xl p-10 md:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* خطوط ديكور خفيفة */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

            <div className="text-center mb-10">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent mb-3"
              >
                مرحباً بعودتك
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400"
              >
                سجل دخول لإدارة نظام الباصات
              </motion.p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* حقل الإيميل */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <FaEnvelope className="text-indigo-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-5 pr-12 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-300 outline-none"
                  placeholder="البريد الإلكتروني"
                  required
                />
              </motion.div>

              {/* حقل الباسورد */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <FaLock className="text-purple-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-300 outline-none"
                  placeholder="كلمة المرور"
                  required
                />
              </motion.div>

              {/* رسالة الخطأ */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-center text-sm bg-red-900/30 py-2 px-4 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              {/* زر الدخول */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    جاري الدخول...
                  </>
                ) : (
                  <>
                    تسجيل الدخول
                    <FaArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            {/* نص سفلي */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-gray-500 text-sm mt-8"
            >
              نظام إدارة الباصات المدرسية • الإصدار 2.0
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}