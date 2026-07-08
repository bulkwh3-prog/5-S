import React, { useState } from "react";
import { Calendar, Award, CheckCircle, Search, Clock, MapPin, User, FileX, Download, RefreshCw, Trash2 } from "lucide-react";
import { DatabaseState, Report } from "../types";

interface HistoryViewerProps {
  dbState: DatabaseState;
  onDeleteReport?: (id: string) => void;
}

export function HistoryViewer({ dbState, onDeleteReport }: HistoryViewerProps) {
  // Find all unique dates that have reports
  const uniqueDates = Array.from(new Set(dbState.reports.map((r) => r.date)))
    .sort((a, b) => b.localeCompare(a)); // Latest first

  const [selectedDate, setSelectedDate] = useState<string>(
    uniqueDates[0] || new Date().toISOString().substring(0, 10)
  );

  const [mergingId, setMergingId] = useState<string | null>(null);

  // Filter reports of the selected date
  const reportsOnDate = dbState.reports.filter((r) => r.date === selectedDate);
  
  // Find streak bonus winner for selected date
  const streakWinner = dbState.streakBonusWinners[selectedDate];

  // Daily target completion for that date
  const targetCount = 15;
  const percentage = Math.min(100, Math.round((reportsOnDate.length / targetCount) * 100));

  const handleCombineAndDownload = async (report: Report) => {
    if (mergingId) return;
    setMergingId(report.id);
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("การโหลดรูปภาพใช้เวลานานเกินไป (8 วินาที)"));
          }, 8000);

          const img = new Image();
          img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
          };
          img.onerror = () => {
            if (img.crossOrigin === "anonymous") {
              // Retry without crossOrigin
              const retryImg = new Image();
              retryImg.onload = () => {
                clearTimeout(timeout);
                resolve(retryImg);
              };
              retryImg.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("ล้มเหลวในการโหลดรูปภาพ"));
              };
              retryImg.src = src;
            } else {
              clearTimeout(timeout);
              reject(new Error("ล้มเหลวในการโหลดรูปภาพ"));
            }
          };
          img.crossOrigin = "anonymous";
          img.src = src;
        });
      };

      const [bImg, aImg] = await Promise.all([
        loadImage(report.beforeImage),
        loadImage(report.afterImage)
      ]);

      const targetHeight = 600;
      const bWidth = (bImg.width / bImg.height) * targetHeight;
      const aWidth = (aImg.width / aImg.height) * targetHeight;

      const canvas = document.createElement("canvas");
      const totalWidth = bWidth + aWidth;
      const headerHeight = 90;
      
      canvas.width = totalWidth;
      canvas.height = targetHeight + headerHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D context");

      // Draw background (elegant clean dark slate background)
      ctx.fillStyle = "#1e293b"; // slate-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`รายงานการทำความสะอาด: ${report.area.split(" (")[0]}`, 30, 42);

      // Subtitle
      ctx.fillStyle = "#94a3b8"; // slate-400
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(`ผู้ส่งรายงาน: ${report.submitter}   |   วันเวลา: ${report.timestamp}`, 30, 68);

      // Draw Images
      ctx.drawImage(bImg, 0, headerHeight, bWidth, targetHeight);
      ctx.drawImage(aImg, bWidth, headerHeight, aWidth, targetHeight);

      // Rose-500 badge for BEFORE
      ctx.fillStyle = "rgba(244, 63, 94, 0.95)";
      ctx.fillRect(15, headerHeight + 15, 150, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BEFORE (ก่อนทำ)", 15 + 75, headerHeight + 15 + 21);

      // Cyan-500 badge for AFTER
      ctx.fillStyle = "rgba(6, 182, 212, 0.95)";
      ctx.fillRect(bWidth + 15, headerHeight + 15, 150, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AFTER (หลังทำ)", bWidth + 15 + 75, headerHeight + 15 + 21);

      const mergedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = mergedDataUrl;
      link.download = `combined_${report.submitter}_${report.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Error merging images:", err);
      alert(err.message || "ไม่สามารถรวมรูปภาพได้ในขณะนี้");
    } finally {
      setMergingId(null);
    }
  };

  return (
    <div id="history-viewer-container" className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-[0_15px_40px_rgba(99,102,241,0.06)] border border-slate-100/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/3 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              ประวัติข้อมูลย้อนหลัง (Historical Archives)
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">เลือกวันที่ต้องการเพื่อเปิดดูสถิติและภาพถ่ายย้อนหลัง</p>
          </div>

          {/* Date Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold text-slate-600">เลือกวันที่:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-150 cursor-pointer"
            >
              {uniqueDates.length > 0 ? (
                uniqueDates.map((date) => {
                  const formattedDate = new Date(date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  return (
                    <option key={date} value={date}>
                      📅 {formattedDate} {date === new Date().toISOString().substring(0, 10) ? "(วันนี้)" : ""}
                    </option>
                  );
                })
              ) : (
                <option value={new Date().toISOString().substring(0, 10)}>
                  {new Date().toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Selected date overview banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Total Reports */}
          <div className="bg-slate-50 border border-slate-100/75 rounded-2xl p-4">
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">จำนวนรายงานทั้งหมด</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{reportsOnDate.length}</span>
              <span className="text-slate-500 text-xs font-semibold">รายการ</span>
            </div>
          </div>

          {/* Daily Mission Achieved */}
          <div className="bg-slate-50 border border-slate-100/75 rounded-2xl p-4">
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">เป้าหมายภารกิจสำเร็จ</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900">{percentage}%</span>
              <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak Winner */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
            <span className="text-[10px] text-amber-600 font-bold block mb-1 uppercase tracking-wider">ผู้ได้รับโบนัสสตรีคสูงสุดประจำวัน</span>
            {streakWinner ? (
              <div className="flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500 fill-amber-100 shrink-0" />
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px]" title={streakWinner.winner}>
                  {streakWinner.winner}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full border border-amber-200 ml-auto shrink-0">
                  {streakWinner.count} งาน (+50)
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic block mt-1 font-medium">ยังไม่มีผู้ชนะโบนัสสะสม</span>
            )}
          </div>
        </div>
      </div>

      {/* List of reports for that day */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-slate-700">
          รายการส่งงานประจำวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
        </h4>

        {reportsOnDate.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportsOnDate.map((report) => (
              <div key={report.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition duration-200">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h5 className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-1.5 text-xs border border-indigo-100/50">
                      📍 {report.area.split(" (")[0]}
                    </h5>
                    <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {report.submitter}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {report.timestamp.split(" ")[1] || report.timestamp}
                    </p>
                    <span className="inline-block text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100 mt-1">
                      +10 Points
                    </span>
                  </div>
                </div>

                {/* Before and After images */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={report.beforeImage} alt="Before" className="w-full h-28 object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-pink-600 text-white font-black text-[8px]">
                      ก่อนทำ
                    </span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={report.afterImage} alt="After" className="w-full h-28 object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-cyan-600 text-white font-black text-[8px]">
                      หลังทำ
                    </span>
                  </div>
                </div>

                {/* Download and Delete links */}
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleCombineAndDownload(report)}
                    disabled={mergingId === report.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-95 text-white font-black py-2 px-3 rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {mergingId === report.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> รวมเป็นรูปเดียว
                      </>
                    )}
                  </button>
                  {onDeleteReport && (
                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="inline-flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer shrink-0"
                      title="ลบรายงานการส่งนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <FileX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">ไม่มีข้อมูลการส่งรายงานในวันที่กำหนด</p>
          </div>
        )}
      </div>
    </div>
  );
}
