"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";

interface Student {
  id: string;
  name: string;
  nationalId: string;
  area: string;
}

export default function BusDetailsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusDetails();
  }, []);

  const fetchBusDetails = async () => {
    // اسم المشرفة
    const busDoc = await getDoc(doc(db, "buses", id as string));
    if (busDoc.exists()) {
      setSupervisorName(busDoc.data().supervisorName || "غير محدد");
    }

    // الطلاب
    const studentsSnap = await getDocs(collection(db, "buses", id as string, "students"));
    const list: Student[] = studentsSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      nationalId: doc.data().nationalId,
      area: doc.data().area,
    }));

    setStudents(list);
    setLoading(false);
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("متأكد من حذف الطالب ده؟")) return;

    await deleteDoc(doc(db, "buses", id as string, "students", studentId));
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-8xl text-indigo-400"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black p-4 sm:p-6 md:p-10">
      {/* خلفية blobs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-extrabold text-center text-white mb-6 md:mb-8 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
        >
          تفاصيل باص {id}
        </motion.h1>

        {supervisorName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-center text-indigo-300 mb-8 md:mb-10"
          >
            مشرفة الباص: <span className="font-bold text-white">{supervisorName}</span>
          </motion.p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="glass p-6 rounded-3xl border border-indigo-500/20 shadow-xl backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-3">{student.name}</h2>
              <p className="text-gray-300 mb-2">🆔 {student.nationalId}</p>
              <p className="text-gray-300 mb-4">📍 {student.area}</p>

              <div className="bg-white p-4 rounded-2xl mb-4 flex justify-center">
                <QRCode value={JSON.stringify({ id: student.id, name: student.name })} size={140} />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDelete(student.id)}
                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                <FaTrash /> حذف الطالب
              </motion.button>
            </motion.div>
          ))}
        </div>

        {students.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-gray-400 text-xl mt-12"
          >
            لا يوجد طلاب في هذا الباص حاليًا
          </motion.p>
        )}
      </div>
    </div>
  );
}