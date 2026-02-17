"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

interface Student {
  id: string;
  name: string;
  nationalId: string;
  area: string;
}

export default function TripDetailsPage() {
  const { busId, tripId } = useParams();

  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails();
  }, []);

  const fetchTripDetails = async () => {
    // 1️⃣ كل الطلاب في الباص
    const studentsSnap = await getDocs(
      collection(db, "buses", busId as string, "students")
    );

    const allStudents: Student[] = [];

    studentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      allStudents.push({
        id: docSnap.id,
        name: data.name,
        nationalId: data.nationalId,
        area: data.area,
      });
    });

    // 2️⃣ الحضور في الرحلة
    const attendanceSnap = await getDocs(
      collection(
        db,
        "buses",
        busId as string,
        "trips",
        tripId as string,
        "attendance"
      )
    );

    const presentIds: string[] = [];

    attendanceSnap.forEach((docSnap) => {
      presentIds.push(docSnap.data().studentId);
    });

    const present = allStudents.filter((s) =>
      presentIds.includes(s.id)
    );

    const absent = allStudents.filter(
      (s) => !presentIds.includes(s.id)
    );

    setPresentStudents(present);
    setAbsentStudents(absent);
    setLoading(false);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        📊 تفاصيل الرحلة
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* الحضور */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-green-400">
              ✅ الحضور ({presentStudents.length})
            </h2>

            <div className="space-y-3">
              {presentStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-green-800 p-3 rounded-lg"
                >
                  <p>👩 {student.name}</p>
                  <p>🆔 {student.nationalId}</p>
                  <p>📍 {student.area}</p>
                </div>
              ))}
            </div>
          </div>

          {/* الغياب */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-red-400">
              ❌ الغياب ({absentStudents.length})
            </h2>

            <div className="space-y-3">
              {absentStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-red-800 p-3 rounded-lg"
                >
                  <p>👩 {student.name}</p>
                  <p>🆔 {student.nationalId}</p>
                  <p>📍 {student.area}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
