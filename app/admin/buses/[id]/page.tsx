"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { FaTrash, FaEdit } from "react-icons/fa";

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

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editArea, setEditArea] = useState("");

  useEffect(() => {
    fetchBusDetails();
  }, []);

  const fetchBusDetails = async () => {
    const busDoc = await getDoc(doc(db, "buses", id as string));
    if (busDoc.exists()) {
      setSupervisorName(busDoc.data().supervisorName || "غير محدد");
    }

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
    if (!confirm("متأكد من حذف الطالبة دي؟")) return;
    await deleteDoc(doc(db, "buses", id as string, "students", studentId));
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const openEditModal = (student: Student) => {
    setEditStudent(student);
    setEditName(student.name);
    setEditNationalId(student.nationalId);
    setEditArea(student.area);
  };

  const saveEdit = async () => {
    if (!editStudent) return;

    await updateDoc(doc(db, "buses", id as string, "students", editStudent.id), {
      name: editName,
      nationalId: editNationalId,
      area: editArea,
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === editStudent.id
          ? { ...s, name: editName, nationalId: editNationalId, area: editArea }
          : s
      )
    );

    setEditStudent(null);
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
              className="glass p-6 rounded-3xl border border-indigo-500/20 shadow-xl backdrop-blur-xl relative"
            >
              <h2 className="text-2xl font-bold text-white mb-3">{student.name}</h2>
              <p className="text-gray-300 mb-2">🆔 {student.nationalId}</p>
              <p className="text-gray-300 mb-4">📍 {student.area}</p>

              {/* QR Code بـ studentId فقط (الحل النهائي) */}
              <div className="bg-white p-4 rounded-2xl mb-4 flex justify-center">
                <QRCode 
                  value={JSON.stringify({ studentId: student.id })} 
                  size={140} 
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openEditModal(student)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <FaEdit /> تعديل
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(student.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <FaTrash /> حذف
                </motion.button>
              </div>
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

      {/* Modal تعديل الطالبة */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 p-8 rounded-2xl border border-indigo-500/30 w-full max-w-md"
          >
            <h3 className="text-2xl font-bold text-white mb-6">تعديل بيانات الطالبة</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">الاسم</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">الرقم القومي</label>
                <input
                  type="text"
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">المنطقة</label>
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={saveEdit}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl text-white font-bold"
              >
                حفظ التعديلات
              </button>

              <button
                onClick={() => setEditStudent(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-xl text-white font-bold"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
