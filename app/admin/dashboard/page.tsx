"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { FaBus, FaPlayCircle, FaUsers, FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";
import Link from "next/link";

interface Trip {
  id: string;
  busId: string;
  busName: string;
  date: string;
  presentCount: number;
  absentCount: number;
  status: string;
  supervisorName?: string; // ← الإضافة الجديدة
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalTrips, setTotalTrips] = useState(0);
  const [activeTrips, setActiveTrips] = useState(0);
  const [totalAttendance, setTotalAttendance] = useState(0);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const busesSnap = await getDocs(collection(db, "buses"));

    let allTrips: Trip[] = [];
    let attendanceSum = 0;
    let activeCount = 0;

    for (const busDoc of busesSnap.docs) {
      const busId = busDoc.id;
      const busName = busDoc.data().name || `باص ${busId}`;
      const supervisorName = busDoc.data().supervisorName || "غير محدد"; // ← جلب اسم المشرفة

      const tripsSnap = await getDocs(collection(db, "buses", busId, "trips"));

      tripsSnap.forEach((tripDoc) => {
        const data = tripDoc.data();

        const present = data.presentCount ?? data.attendanceCount ?? 0;

        const trip: Trip = {
          id: tripDoc.id,
          busId,
          busName,
          date: data.date || "-",
          presentCount: present,
          absentCount: data.absentCount || 0,
          status: data.status || "finished",
          supervisorName, // ← إضافته لكل رحلة
        };

        allTrips.push(trip);

        if (trip.status === "finished") {
          attendanceSum += present;
        }

        if (trip.status === "active") {
          activeCount++;
        }
      });
    }

    allTrips.sort((a, b) => b.date.localeCompare(a.date));

    setTrips(allTrips);
    setTotalTrips(allTrips.length);
    setTotalAttendance(attendanceSum);
    setActiveTrips(activeCount);
    setLoading(false);
  };

  const handleDelete = async (busId: string, tripId: string) => {
    if (!confirm("متأكد من حذف الرحلة دي؟")) return;
    await deleteDoc(doc(db, "buses", busId, "trips", tripId));
    fetchTrips();
  };

  const handleStop = async (busId: string, tripId: string) => {
    if (!confirm("متأكد من إنهاء الرحلة دي؟")) return;
    await updateDoc(doc(db, "buses", busId, "trips", tripId), {
      status: "finished",
    });
    fetchTrips();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
      {/* خلفية blobs متحركة متسقة مع اللوجين */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 md:p-10 container mx-auto max-w-7xl">
        {/* العنوان الكبير مع حركة وgradient */}
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-3 md:gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <FaBus className="text-6xl md:text-9xl text-indigo-400 opacity-80" />
            </motion.div>

            <h1 className="text-4xl md:text-8xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tighter">
              لوحة التحكم
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-3xl text-gray-300 font-light mt-4"
          >
            نظام إدارة الباصات المدرسية الذكي
          </motion.p>
        </motion.div>

        {/* الكروت الكبيرة */}
        {loading ? (
          <div className="flex justify-center items-center h-48 md:h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="text-7xl md:text-8xl text-indigo-400"
            >
              ⏳
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-6 md:p-8 rounded-3xl flex flex-col items-center text-center backdrop-blur-xl border border-indigo-500/20"
            >
              <FaBus className="text-6xl md:text-7xl text-indigo-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">عدد الرحلات</h3>
              <p className="text-5xl md:text-6xl font-extrabold text-indigo-300">{totalTrips}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-6 md:p-8 rounded-3xl flex flex-col items-center text-center backdrop-blur-xl border border-green-500/20"
            >
              <FaPlayCircle className="text-6xl md:text-7xl text-green-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">النشطة</h3>
              <p className="text-5xl md:text-6xl font-extrabold text-green-300">{activeTrips}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-6 md:p-8 rounded-3xl flex flex-col items-center text-center backdrop-blur-xl border border-purple-500/20"
            >
              <FaUsers className="text-6xl md:text-7xl text-purple-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">إجمالي الحضور</h3>
              <p className="text-5xl md:text-6xl font-extrabold text-purple-300">{totalAttendance}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="glass p-6 md:p-8 rounded-3xl flex flex-col items-center text-center backdrop-blur-xl border border-red-500/20"
            >
              <FaTimesCircle className="text-6xl md:text-7xl text-red-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">الغياب</h3>
              <p className="text-5xl md:text-6xl font-extrabold text-red-300">
                {trips.reduce((sum, t) => sum + t.absentCount, 0)}
              </p>
            </motion.div>
          </div>
        )}

        {/* قائمة الرحلات مع اسم المشرفة */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 md:space-y-6"
        >
          {trips.map((trip) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              className="glass p-4 sm:p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 backdrop-blur-xl border border-indigo-500/20 shadow-xl transition-all duration-300"
            >
              <Link
                href={`/admin/dashboard/${trip.busId}/${trip.id}`}
                className="flex-1 cursor-pointer w-full"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                    <FaBus className="text-4xl md:text-5xl text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {trip.busName}
                    </h3>
                    <p className="text-gray-300 text-base md:text-lg mt-1">
                      📅 {trip.date} • مشرفة: {trip.supervisorName || "غير محدد"}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full md:w-auto">
                <div className="text-center min-w-[80px] md:min-w-[100px]">
                  <p className="text-green-400 font-bold text-3xl md:text-4xl flex items-center justify-center gap-2 md:gap-3">
                    <FaCheckCircle className="text-2xl md:text-4xl" /> {trip.presentCount}
                  </p>
                  <p className="text-gray-400 text-sm md:text-base mt-1">حضور</p>
                </div>

                <div className="text-center min-w-[80px] md:min-w-[100px]">
                  <p className="text-red-400 font-bold text-3xl md:text-4xl flex items-center justify-center gap-2 md:gap-3">
                    <FaTimesCircle className="text-2xl md:text-4xl" /> {trip.absentCount}
                  </p>
                  <p className="text-gray-400 text-sm md:text-base mt-1">غياب</p>
                </div>

                <div className="flex gap-4 md:gap-5 w-full md:w-auto">
                  {trip.status === "active" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStop(trip.busId, trip.id)}
                      className="flex-1 md:flex-none bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 px-6 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 md:gap-3"
                    >
                      <FaPlayCircle /> إيقاف
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(trip.busId, trip.id)}
                    className="flex-1 md:flex-none bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 px-6 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 md:gap-3"
                  >
                    <FaTrash /> حذف
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}