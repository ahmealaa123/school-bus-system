"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

interface Student {
  id: string;
  name: string;
  nationalId: string;
  area: string;
}

export default function BusDetailsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const snap = await getDocs(
      collection(db, "buses", id as string, "students")
    );

    const list: Student[] = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Student, "id">),
    }));

    setStudents(list);
    setLoading(false);
  };

  const handleDelete = async (studentId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "buses", id as string, "students", studentId)
    );

    setStudents((prev) =>
      prev.filter((student) => student.id !== studentId)
    );
  };

  if (loading) {
    return (
      <div className="text-white text-xl p-6">
        Loading students...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
        🎓 Bus {id} Students
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <motion.div
            key={student.id}
            whileHover={{ scale: 1.03 }}
            className="bg-[#1c2440] p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <h2 className="text-xl font-semibold text-white mb-2">
              {student.name}
            </h2>

            <p className="text-gray-300">
              National ID: {student.nationalId}
            </p>

            <p className="text-gray-300 mb-4">
              Area: {student.area}
            </p>

            <div className="bg-white p-3 rounded-lg mb-4 flex justify-center">
              <QRCode
                value={JSON.stringify({
                  id: student.id,
                  name: student.name,
                })}
                size={120}
              />
            </div>

            <button
              onClick={() => handleDelete(student.id)}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all py-2 rounded-lg text-white font-semibold"
            >
              Delete Student
            </button>
          </motion.div>
        ))}
      </div>

      {students.length === 0 && (
        <p className="text-gray-400">
          No students in this bus.
        </p>
      )}
    </div>
  );
}
