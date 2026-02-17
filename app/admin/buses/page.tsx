"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaBus, FaUserPlus, FaPlay, FaStop, FaQrcode } from "react-icons/fa";

export default function BusesPage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [studentInputs, setStudentInputs] = useState<any>({});
  const [activeTrips, setActiveTrips] = useState<any>({});

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    const snap = await getDocs(collection(db, "buses"));
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBuses(data);

    data.forEach((bus) => checkActiveTrip(bus.id));
  };

  const checkActiveTrip = async (busId: string) => {
    const q = query(
      collection(db, "buses", busId, "trips"),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      setActiveTrips((prev: any) => ({
        ...prev,
        [busId]: snap.docs[0].id,
      }));
    }
  };

  const handleInputChange = (busId: string, field: string, value: string) => {
    setStudentInputs((prev: any) => ({
      ...prev,
      [busId]: {
        ...prev[busId],
        [field]: value,
      },
    }));
  };

  const addStudent = async (busId: string) => {
    const student = studentInputs[busId];
    if (!student?.name) return alert("أدخل اسم الطالب");

    await addDoc(collection(db, "buses", busId, "students"), {
      name: student.name,
      nationalId: student.nationalId || "",
      area: student.area || "",
      createdAt: serverTimestamp(),
    });

    setStudentInputs((prev: any) => ({
      ...prev,
      [busId]: { name: "", nationalId: "", area: "" },
    }));

    alert("تم إضافة الطالب بنجاح ✔");
  };

  const startTrip = async (busId: string) => {
    await addDoc(collection(db, "buses", busId, "trips"), {
      status: "active",
      date: new Date().toISOString().split("T")[0],
      attendanceCount: 0,
      startedAt: serverTimestamp(),
    });

    fetchBuses();
  };

  const endTrip = async (busId: string) => {
    const tripId = activeTrips[busId];
    if (!tripId) return;

    await updateDoc(doc(db, "buses", busId, "trips", tripId), {
      status: "finished",
      endedAt: serverTimestamp(),
    });

    setActiveTrips((prev: any) => ({
      ...prev,
      [busId]: null,
    }));

    // بعد الإنهاء يدخل مباشرة على صفحة الاسكان
    window.location.href = `/admin/buses/${busId}/scan`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
      {/* خلفية blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-6 md:p-10">
        <motion.h1
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tighter text-center mb-4"
        >
          إدارة الباصات
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-gray-300 font-light text-center mb-12"
        >
          تحكم كامل في جميع الباصات والطلاب
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {buses.map((bus) => (
            <motion.div
              key={bus.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: bus.id * 0.1 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="glass p-8 rounded-3xl border border-indigo-500/20 shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300"
            >
              {/* عنوان الباص + دخول للتفاصيل */}
              <Link href={`/admin/buses/${bus.id}`}>
                <div className="flex items-center gap-4 mb-6 cursor-pointer">
                  <div className="w-14 h-14 bg-indigo-600/20 rounded-full flex items-center justify-center">
                    <FaBus className="text-3xl text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white hover:text-indigo-300 transition">
                    {bus.name}
                  </h2>
                </div>
              </Link>

              {/* الحقول */}
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-gray-300 text-lg mb-2 font-medium">اسم الطالب</label>
                  <input
                    type="text"
                    placeholder="اسم الطالب"
                    value={studentInputs[bus.id]?.name || ""}
                    onChange={(e) => handleInputChange(bus.id, "name", e.target.value)}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-lg mb-2 font-medium">الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="الرقم القومي"
                    value={studentInputs[bus.id]?.nationalId || ""}
                    onChange={(e) => handleInputChange(bus.id, "nationalId", e.target.value)}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-lg mb-2 font-medium">المنطقة</label>
                  <input
                    type="text"
                    placeholder="المنطقة"
                    value={studentInputs[bus.id]?.area || ""}
                    onChange={(e) => handleInputChange(bus.id, "area", e.target.value)}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-lg"
                  />
                </div>
              </div>

              {/* الأزرار */}
              <div className="grid grid-cols-2 gap-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => addStudent(bus.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-3 text-lg py-5 rounded-xl font-medium shadow-lg transition-all"
                >
                  <FaUserPlus className="text-xl" /> إضافة طالب
                </motion.button>

                {!activeTrips[bus.id] ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => startTrip(bus.id)}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 flex items-center justify-center gap-3 text-lg py-5 rounded-xl font-medium shadow-lg transition-all"
                  >
                    <FaPlay className="text-xl" /> بدء
                  </motion.button>
                ) : (
                  <Link href={`/admin/buses/${bus.id}/scan`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center justify-center gap-3 text-lg py-5 rounded-xl font-medium shadow-lg transition-all"
                    >
                      <FaStop className="text-xl" /> إنهاء ومسح
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}