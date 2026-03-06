"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const busId = id;

  const qrRef = useRef<Html5Qrcode | null>(null);

  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [lastStudent, setLastStudent] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [scanLock, setScanLock] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Qatar",
  });

  let lastDecodedText = "";

  useEffect(() => {
    fetchActiveTrip();
  }, []);

  const fetchActiveTrip = async () => {
    try {
      const tripsRef = collection(db, "buses", busId, "trips");
      const q = query(
        tripsRef,
        where("status", "==", "active"),
        where("date", "==", today)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const tripDoc = snap.docs[0];
        setActiveTripId(tripDoc.id);
      }
    } catch (err) {
      console.error("[FETCH] خطأ:", err);
    } finally {
      setLoadingTrip(false);
    }
  };

  const startTrip = async () => {
    try {
      const tripsRef = collection(db, "buses", busId, "trips");

      const newTrip = await addDoc(tripsRef, {
        status: "active",
        startedAt: new Date(),
        date: today,
        totalStudents: 0,
        absentCount: 0,
        presentCount: 0,
      });

      setActiveTripId(newTrip.id);
      setLastStudent("تم بدء الرحلة ✓");
    } catch (err) {
      console.error("[START] خطأ:", err);
      setLastStudent("خطأ في بدء الرحلة");
    }
  };

  const endTrip = async () => {
    if (!activeTripId) {
      alert("لا توجد رحلة نشطة");
      return;
    }

    try {
      if (qrRef.current && isRunning) {
        await qrRef.current.stop();
        qrRef.current.clear();
        qrRef.current = null;
        setIsRunning(false);
      }
    } catch (err) {
      console.warn("[END] مشكلة إيقاف:", err);
    }

    try {
      const studentsSnap = await getDocs(collection(db, "buses", busId, "students"));
      const total = studentsSnap.size;

      const attSnap = await getDocs(
        collection(db, "buses", busId, "trips", activeTripId, "attendance")
      );

      const present = attSnap.size;
      const absent = total - present;

      const tripRef = doc(db, "buses", busId, "trips", activeTripId);
      await updateDoc(tripRef, {
        status: "finished",
        endedAt: new Date(),
        totalStudents: total,
        presentCount: present,
        absentCount: absent,
      });

      // جلب اسم المشرفة من Firestore
      const busDoc = await getDoc(doc(db, "buses", busId));
      const supervisorName = busDoc.exists() ? busDoc.data()?.supervisorName || "غير محدد" : "غير محدد";

      // إرسال الإيميل مع اسم المشرفة
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busName: `باص ${busId}`,
          date: today,
          presentCount: present,
          absentCount: absent,
          supervisorName,
        }),
      });

      setLastStudent(`تم الإنهاء ✓ حضور: ${present} | غياب: ${absent}`);
      setActiveTripId(null);
      lastDecodedText = "";
    } catch (err) {
      console.error("[END] خطأ:", err);
      setLastStudent("خطأ في الإنهاء");
    }
  };

  const startScanner = async () => {
    if (!activeTripId) {
      alert("ابدأ الرحلة أولاً");
      return;
    }

    if (qrRef.current) {
      try {
        await qrRef.current.stop();
        qrRef.current.clear();
        qrRef.current = null;
      } catch (e) {
        console.warn("[SCANNER] مشكلة إيقاف قديم:", e);
      }
    }

    setScanLock(false);
    lastDecodedText = "";

    const qr = new Html5Qrcode("reader");
    qrRef.current = qr;

    try {
      // @ts-ignore - html5-qrcode has no official types, but it works at runtime
      await qr.start(
        { facingMode: cameraFacing },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (decodedText === lastDecodedText) return;
          lastDecodedText = decodedText;

          if (scanLock) return;
          setScanLock(true);

          try {
            let student: any;

            try {
              student = JSON.parse(decodedText);
            } catch {
              const q = query(
                collection(db, "buses", busId, "students"),
                where("id", "==", decodedText)
              );
              const snap = await getDocs(q);

              if (snap.empty) {
                setLastStudent("⚠️ طالبة غير موجودة");
                setTimeout(() => setScanLock(false), 600);
                return;
              }

              student = snap.docs[0].data();
            }

            if (!student?.id) {
              setLastStudent("⚠️ QR غير صالح");
              setTimeout(() => setScanLock(false), 600);
              return;
            }

            const attRef = collection(db, "buses", busId, "trips", activeTripId, "attendance");
            const checkQ = query(attRef, where("studentId", "==", student.id), limit(1));
            const existing = await getDocs(checkQ);

            if (!existing.empty) {
              setLastStudent(`⚠️ ${student.name || student.id} موجودة`);
              setTimeout(() => setScanLock(false), 800);
              return;
            }

            await addDoc(attRef, {
              studentId: student.id,
              studentName: student.name || "غير معروف",
              nationalId: student.nationalId || "",
              area: student.area || "",
              scannedAt: new Date(),
            });

            setLastStudent(`✅ ${student.name || student.id}`);
          } catch (err: any) {
            console.error("[QR] خطأ:", err);
            setLastStudent("⚠️ خطأ");
          }

          setTimeout(() => {
            setScanLock(false);
            lastDecodedText = "";
          }, 400);
        }
      );

      setIsRunning(true);
      setLastStudent("الماسح شغال...");
    } catch (err: any) {
      console.error("[SCANNER] فشل التشغيل:", err);
      setLastStudent("فشل الكاميرا: " + (err.message || ""));
    }
  };

  const stopScanner = async () => {
    try {
      if (qrRef.current && isRunning) {
        await qrRef.current.stop();
        qrRef.current.clear();
        qrRef.current = null;
        setIsRunning(false);
        setLastStudent("تم إيقاف الماسح");
        lastDecodedText = "";
      }
    } catch (err) {
      console.warn("[STOP] مشكلة:", err);
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        📷 نظام تسجيل الحضور الذكي
      </h1>

      {loadingTrip ? (
        <p>جاري التحميل...</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-8">
            {!activeTripId ? (
              <button
                onClick={startTrip}
                className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl text-lg font-bold shadow-lg"
              >
                بدء الرحلة
              </button>
            ) : (
              <button
                onClick={endTrip}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl text-lg font-bold shadow-lg"
              >
                إنهاء الرحلة
              </button>
            )}
          </div>

          {activeTripId && (
            <>
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={startScanner}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium shadow"
                >
                  تشغيل الماسح
                </button>

                <button
                  onClick={stopScanner}
                  disabled={!isRunning}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 px-6 py-3 rounded-lg font-medium shadow"
                >
                  إيقاف الماسح
                </button>

                <button
                  onClick={() => setCameraFacing((p) => (p === "environment" ? "user" : "environment"))}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium shadow"
                >
                  تبديل الكاميرا
                </button>
              </div>

              <div
                id="reader"
                className="w-full max-w-md mx-auto border-4 border-blue-500 rounded-2xl overflow-hidden bg-black aspect-square shadow-2xl"
              />

              {lastStudent && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-8 text-center text-2xl font-bold p-5 rounded-xl bg-gray-800/70 backdrop-blur-sm border border-gray-700"
                >
                  {lastStudent}
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}