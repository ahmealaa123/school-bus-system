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
import Link from "next/link";
import { motion } from "framer-motion";
import { FaBus, FaPlayCircle, FaUsers } from "react-icons/fa"; // Install react-icons: npm i react-icons

interface Trip {
  id: string;
  busId: string;
  busName: string;
  date: string;
  presentCount?: number;
  attendanceCount?: number;
  absentCount: number;
  status: string;
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
          attendanceCount: data.attendanceCount,
          absentCount: data.absentCount || 0,
          status: data.status || "finished",
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
    await deleteDoc(doc(db, "buses", busId, "trips", tripId));
    fetchTrips();
  };

  const handleStop = async (busId: string, tripId: string) => {
    await updateDoc(doc(db, "buses", busId, "trips", tripId), {
      status: "finished",
    });
    fetchTrips();
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <FaBus /> لوحة التحكم
      </h1>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-700 to-blue-500 p-6 rounded-xl shadow-xl"
            >
              <h2 className="text-xl flex items-center gap-2"><FaBus className="text-blue-200" /> عدد الرحلات</h2>
              <p className="text-4xl font-bold mt-2">{totalTrips}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-700 to-green-500 p-6 rounded-xl shadow-xl"
            >
              <h2 className="text-xl flex items-center gap-2"><FaPlayCircle className="text-green-200" /> الرحلات النشطة</h2>
              <p className="text-4xl font-bold mt-2">{activeTrips}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-700 to-purple-500 p-6 rounded-xl shadow-xl"
            >
              <h2 className="text-xl flex items-center gap-2"><FaUsers className="text-purple-200" /> إجمالي الحضور</h2>
              <p className="text-4xl font-bold mt-2">{totalAttendance}</p>
            </motion.div>
          </motion.div>

          <div className="space-y-4">
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md"
              >
                <Link
                  href={`/admin/dashboard/${trip.busId}/${trip.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div>
                    <p className="text-xl font-semibold flex items-center gap-2"><FaBus /> {trip.busName}</p>
                    <p className="text-gray-300">📅 {trip.date}</p>
                    <p>✅ حضور: {trip.presentCount}</p>
                    <p>❌ غياب: {trip.absentCount}</p>
                    <p>
                      الحالة: 
                      <span className={trip.status === "active" ? "text-green-400" : "text-red-400"}>
                        {trip.status === "active" ? " 🟢 نشطة" : " 🔴 منتهية"}
                      </span>
                    </p>
                  </div>
                </Link>

                <div className="flex gap-3">
                  {trip.status === "active" && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStop(trip.busId, trip.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
                    >
                      إيقاف
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(trip.busId, trip.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                  >
                    حذف
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}