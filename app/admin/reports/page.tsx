"use client";

import { useEffect, useState, Fragment } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import { FaChartBar, FaBus, FaCalendarAlt, FaFilter, FaFileExcel, FaFilePdf, FaUsers, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface ReportRow {
  bus: string;
  tripId: string;
  status: string;
  students: number;
  names: string[];
  startedAt: string;
  attendance: { name: string; present: boolean }[];
  absentCount: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filtered, setFiltered] = useState<ReportRow[]>([]);
  const [busFilter, setBusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<ReportRow | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const busesSnap = await getDocs(collection(db, "buses"));
    const rows: ReportRow[] = [];

    for (const busDoc of busesSnap.docs) {
      const busName = busDoc.data().name || `باص ${busDoc.id}`;
      const tripsSnap = await getDocs(collection(db, "buses", busDoc.id, "trips"));

      for (const tripDoc of tripsSnap.docs) {
        const attendanceSnap = await getDocs(
          collection(db, "buses", busDoc.id, "trips", tripDoc.id, "attendance")
        );

        const attendanceNames = attendanceSnap.docs.map((a) => a.data().studentName || "غير معروف");

        const studentsSnap = await getDocs(collection(db, "buses", busDoc.id, "students"));
        const allStudents = studentsSnap.docs.map((s) => s.data().name || "غير معروف");
        const absentNames = allStudents.filter((name) => !attendanceNames.includes(name));

        rows.push({
          bus: busName,
          tripId: tripDoc.id,
          status: tripDoc.data().status || "غير معروف",
          students: attendanceSnap.size,
          names: attendanceNames,
          startedAt: tripDoc.data().startedAt?.toDate?.().toLocaleString("ar-EG") || "",
          attendance: [
            ...attendanceNames.map((name) => ({ name, present: true })),
            ...absentNames.map((name) => ({ name, present: false })),
          ],
          absentCount: absentNames.length,
        });
      }
    }

    setReports(rows);
    setFiltered(rows);
  };

  const applyFilter = () => {
    let data = [...reports];

    if (busFilter !== "all") data = data.filter((r) => r.bus === busFilter);
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (fromDate) data = data.filter((r) => new Date(r.startedAt) >= new Date(fromDate));
    if (toDate) data = data.filter((r) => new Date(r.startedAt) <= new Date(toDate));

    setFiltered(data);
  };

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        الباص: r.bus,
        الرحلة: r.tripId,
        الحالة: r.status,
        عدد_الحضور: r.students,
        عدد_الغياب: r.absentCount,
        الأسماء_الحاضرين: r.names.join(", "),
        التاريخ: r.startedAt,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "التقارير");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), "تقارير_الباصات.xlsx");
  };

  const exportPDF = async () => {
    try {
      const fontUrl = "/fonts/Amiri-Regular.ttf";
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error("فشل تحميل الخط العربي");

      const fontBlob = await response.blob();
      const fontArrayBuffer = await fontBlob.arrayBuffer();

      const base64Font = btoa(
        new Uint8Array(fontArrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const doc = new jsPDF({ orientation: "landscape" });

      doc.addFileToVFS("Amiri-Regular.ttf", base64Font);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      doc.setFont("Amiri");

      doc.setFontSize(22);
      // استخدام عرض ثابت للـ landscape (حوالي 297 مم = 842 نقطة)
      const pageWidth = 842;
      doc.text("تقارير نظام الباصات المدرسية", pageWidth - 14, 20, { align: "right" });

      autoTable(doc, {
        startY: 35,
        head: [["الباص", "الرحلة", "الحالة", "عدد الحضور", "عدد الغياب", "الأسماء", "التاريخ"]],
        body: filtered.map((r) => [
          r.bus,
          r.tripId,
          r.status,
          r.students,
          r.absentCount,
          r.names.join(", "),
          r.startedAt,
        ]),
        theme: "grid",
        headStyles: { 
          fillColor: [79, 70, 229], 
          textColor: [255, 255, 255], 
          font: "Amiri", 
          fontStyle: "normal",
          halign: "right" 
        },
        bodyStyles: { 
          font: "Amiri", 
          fontStyle: "normal", 
          halign: "right",
          valign: "middle"
        },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        styles: { 
          fontSize: 11, 
          cellPadding: 4, 
          overflow: "linebreak",
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        didParseCell: (data) => {
          data.cell.styles.halign = "right";
        },
      });

      doc.save("تقارير_الباصات.pdf");
    } catch (err) {
      console.error("خطأ في تصدير PDF:", err);
      alert("حدث خطأ أثناء إنشاء الـ PDF - تأكد من وجود الخط في public/fonts");
    }
  };

  const openModal = (trip: ReportRow) => {
    setSelectedTrip(trip);
    setIsOpen(true);
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
          التقارير الشاملة
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-gray-300 font-light text-center mb-12"
        >
          استعراض وتصدير جميع الرحلات والحضور
        </motion.p>

        {/* فلاتر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-6 md:p-8 rounded-3xl mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                <FaBus /> الباص
              </label>
              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="all">جميع الباصات</option>
                {[...new Set(reports.map((r) => r.bus))].map((bus) => (
                  <option key={bus} value={bus}>{bus}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                <FaFilter /> الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="all">الكل</option>
                <option value="active">نشطة</option>
                <option value="finished">منتهية</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                <FaCalendarAlt /> من تاريخ
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                <FaCalendarAlt /> إلى تاريخ
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-700 p-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex items-end gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={applyFilter}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 p-3 rounded-lg font-bold shadow-lg transition-all"
              >
                تطبيق الفلتر
              </motion.button>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={exportExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 p-3 rounded-lg font-bold shadow-lg transition-all"
            >
              <FaFileExcel /> Excel
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={exportPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 p-3 rounded-lg font-bold shadow-lg transition-all"
            >
              <FaFilePdf /> PDF
            </motion.button>
          </div>
        </motion.div>

        {/* الجدول */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass overflow-x-auto rounded-3xl shadow-2xl border border-gray-700"
        >
          <table className="w-full text-right min-w-max">
            <thead className="bg-gradient-to-r from-indigo-700 to-purple-700">
              <tr>
                <th className="p-4">الباص</th>
                <th className="p-4">الرحلة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الحضور</th>
                <th className="p-4">الغياب</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={i}
                  whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
                  className="border-b border-gray-700 hover:bg-indigo-900/30 transition-colors"
                >
                  <td className="p-4">{r.bus}</td>
                  <td className="p-4 font-mono">{r.tripId.slice(0, 8)}...</td>
                  <td className="p-4">
                    <span className={r.status === "active" ? "text-green-400" : "text-red-400"}>
                      {r.status === "active" ? "نشطة" : "منتهية"}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-green-400">{r.students}</td>
                  <td className="p-4 font-bold text-red-400">{r.absentCount}</td>
                  <td className="p-4">{r.startedAt}</td>
                  <td className="p-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openModal(r)}
                      className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      عرض التفاصيل
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Modal تفاصيل الرحلة */}
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/70" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-900 p-8 text-left align-middle shadow-xl transition-all border border-indigo-500/30">
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-white mb-6 flex items-center gap-3">
                      <FaBus className="text-indigo-400" /> تفاصيل الرحلة - {selectedTrip?.bus}
                    </Dialog.Title>

                    <div className="mt-2 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-gray-300">
                        <div>
                          <p className="font-semibold">الحالة:</p>
                          <p className={selectedTrip?.status === "active" ? "text-green-400" : "text-red-400"}>
                            {selectedTrip?.status === "active" ? "نشطة" : "منتهية"}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">عدد الحضور:</p>
                          <p className="text-indigo-300 font-bold">{selectedTrip?.students}</p>
                        </div>
                        <div>
                          <p className="font-semibold">عدد الغياب:</p>
                          <p className="text-red-300 font-bold">{selectedTrip?.absentCount}</p>
                        </div>
                        <div>
                          <p className="font-semibold">التاريخ:</p>
                          <p>{selectedTrip?.startedAt}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <FaCheckCircle /> الحاضرين ({selectedTrip?.students})
                        </h4>
                        <ul className="list-disc pl-6 space-y-1 text-gray-200">
                          {selectedTrip?.attendance.filter((a) => a.present).map((a, i) => (
                            <li key={i}>{a.name}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                          <FaTimesCircle /> الغائبين ({selectedTrip?.absentCount})
                        </h4>
                        <ul className="list-disc pl-6 space-y-1 text-gray-200">
                          {selectedTrip?.attendance.filter((a) => !a.present).map((a, i) => (
                            <li key={i}>{a.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        onClick={() => setIsOpen(false)}
                      >
                        إغلاق
                      </motion.button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}