import React, { useState } from "react";
import { Download, Trash2, Edit2, Calendar, MapPin, User, Trophy, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { DatabaseState, Report, CLEANING_AREAS } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  dbState: DatabaseState;
  onDeleteReport: (id: string) => void;
  onEditReport: (id: string, updatedData: { submitter: string; area: string }) => void;
}

export function Dashboard({ dbState, onDeleteReport, onEditReport }: DashboardProps) {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("");

  // Calculate Leaderboard (Points per user)
  // Each report is +10 points. Plus add +50 points for each streak bonus won!
  const userPoints: Record<string, number> = {};
  
  // Base submitters
  dbState.submitters.forEach(name => {
    userPoints[name] = 0;
  });

  // Calculate from reports (+10 points each)
  dbState.reports.forEach(report => {
    userPoints[report.submitter] = (userPoints[report.submitter] || 0) + 10;
  });

  // Calculate from streak bonuses (+50 points each)
  Object.values(dbState.streakBonusWinners).forEach(winnerData => {
    userPoints[winnerData.winner] = (userPoints[winnerData.winner] || 0) + winnerData.bonus;
  });

  const sortedLeaderboard = Object.entries(userPoints)
    .sort((a, b) => b[1] - a[1]);

  // Filtered reports
  const filteredReports = dbState.reports.filter((report) => {
    const matchUser = selectedUserFilter ? report.submitter === selectedUserFilter : true;
    return matchUser;
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Latest first

  const [mergingId, setMergingId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editSubmitter, setEditSubmitter] = useState<string>("");
  const [editArea, setEditArea] = useState<string>("");

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div id="dashboard-container" className="space-y-8">
      {/* Overview Statistics section */}
      <div className="max-w-2xl mx-auto w-full">
        {/* Points Leaderboard */}
        <div id="leaderboard-card" className="bg-gradient-to-br from-white to-slate-50/50 rounded-3xl p-6 shadow-[0_15px_40px_rgba(99,102,241,0.06)] border border-slate-100/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/3 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-100" />
            <h3 className="font-extrabold text-slate-900 text-base">ตารางคะแนนสะสม (Leaderboard)</h3>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {sortedLeaderboard.map(([name, points], index) => {
              // Medal or Rank badge
              let badge = (
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </div>
              );
              if (index === 0) {
                badge = (
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-300">
                    🥇
                  </div>
                );
              } else if (index === 1) {
                badge = (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-300">
                    🥈
                  </div>
                );
              } else if (index === 2) {
                badge = (
                  <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                    🥉
                  </div>
                );
              }

              return (
                <div key={name} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white transition duration-200 border border-transparent hover:border-slate-100 shadow-xs hover:shadow-sm">
                  {badge}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-800 text-xs truncate">{name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">ผู้ส่งรายงานการทำความสะอาด</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                      {points} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reports feed with Side-by-Side Images and download options */}
      <div id="reports-feed-section" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">รายการรายงานและรูปส่งงาน</h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">ส่องดูความสะอาดและดาวน์โหลดรูปภาพแสตมป์เวลาเป็นไฟล์ JPG</p>
          </div>

          {/* Filtering tools */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-150"
            >
              <option value="">👤 กรองตามชื่อผู้ส่งทั้งหมด</option>
              {dbState.submitters.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Cards Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-3xl p-5 shadow-[0_12px_30px_rgba(99,102,241,0.04)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_15px_35px_rgba(99,102,241,0.1)] transition-all duration-300 relative overflow-hidden"
              >
                <div>
                  {/* Header info */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        <MapPin className="w-3.5 h-3.5" />
                        {report.area.split(" (")[0]}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {report.submitter}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.timestamp}
                      </span>
                      <span className="inline-block mt-1 text-[11px] font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                        +10 Points
                      </span>
                    </div>
                  </div>

                  {/* Side by side Before and After comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Before Image */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group/img">
                      <img
                        src={report.beforeImage}
                        alt="Before cleaning"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-pink-600/95 text-white font-black text-[9px] tracking-wide shadow-xs">
                        BEFORE (ก่อนทำ)
                      </div>
                      
                      {/* Download Button Overlay */}
                      <button
                        onClick={() => handleDownload(report.beforeImage, `before_${report.submitter}_${report.id}.jpg`)}
                        className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition duration-150 shadow-md cursor-pointer"
                        title="ดาวน์โหลดรูป Before เป็นไฟล์ JPG"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {/* After Image */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group/img">
                      <img
                        src={report.afterImage}
                        alt="After cleaning"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-cyan-600/95 text-white font-black text-[9px] tracking-wide shadow-xs">
                        AFTER (หลังทำ)
                      </div>

                      {/* Download Button Overlay */}
                      <button
                        onClick={() => handleDownload(report.afterImage, `after_${report.submitter}_${report.id}.jpg`)}
                        className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition duration-150 shadow-md cursor-pointer"
                        title="ดาวน์โหลดรูป After เป็นไฟล์ JPG"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions (Edit, Delete & Combined Image) */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  <div className="flex gap-2 w-full">
                    <button
                      id="combine-images-btn"
                      onClick={() => handleCombineAndDownload(report)}
                      disabled={mergingId === report.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-95 text-white font-black py-2.5 px-3 rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                      title="รวมรูปก่อนและหลังทำความสะอาดเป็นรูปเดียวกัน"
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
                    
                    <button
                      onClick={() => {
                        setEditingReport(report);
                        setEditSubmitter(report.submitter);
                        setEditArea(report.area);
                      }}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition border border-indigo-100 flex items-center justify-center cursor-pointer shrink-0"
                      title="แก้ไขข้อมูลรายงาน"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายงานการส่งนี้ออก?")) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-100 flex items-center justify-center cursor-pointer shrink-0"
                      title="ลบรายงานการทำความสะอาดนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">ไม่พบคลิปหรือข้อมูลที่ต้องการกรอก</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">ลองเปลี่ยนการกรองตัวเลือกด้านบน หรือส่งรายงานใหม่ด้านบนได้เลย</p>
          </div>
        )}
      </div>

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/3 rounded-full blur-xl pointer-events-none" />
            
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 mb-4">
              <Edit2 className="w-5 h-5 text-indigo-500" />
              แก้ไขข้อมูลรายงานทำความสะอาด
            </h3>

            <div className="space-y-4">
              {/* Submitter Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">👤 ชื่อผู้ส่งงาน</label>
                <select
                  value={editSubmitter}
                  onChange={(e) => setEditSubmitter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                >
                  {dbState.submitters.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">📍 บริเวณพื้นที่ทำความสะอาด</label>
                <select
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                >
                  {CLEANING_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-6 border-t border-slate-100 pt-4 justify-end">
              <button
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (!editSubmitter || !editArea) return;
                  await onEditReport(editingReport.id, { submitter: editSubmitter, area: editArea });
                  setEditingReport(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
