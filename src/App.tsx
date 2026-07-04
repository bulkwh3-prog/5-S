import React, { useState, useEffect } from "react";
import { Sparkles, ClipboardCheck, LayoutDashboard, Calendar, Settings2, ShieldCheck, Check, Send, Sparkle, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { DatabaseState, CLEANING_AREAS, Report } from "./types";
import { UploadBox } from "./components/UploadBox";
import { DailyMission } from "./components/DailyMission";
import { Dashboard } from "./components/Dashboard";
import { HistoryViewer } from "./components/HistoryViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import { CelebrationPopup } from "./components/CelebrationPopup";

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "dashboard" | "history" | "settings">("report");
  
  // Form States
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>(CLEANING_AREAS[0]);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Celebration States
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [successSubmitter, setSuccessSubmitter] = useState("");

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data: DatabaseState = await res.json();
        setDbState(data);
        
        // Auto-select first submitter if available
        if (data.submitters.length > 0 && !selectedSubmitter) {
          setSelectedSubmitter(data.submitters[0]);
        }
      } else {
        throw new Error("เซิร์ฟเวอร์ตอบสนองด้วยสถานะข้อผิดพลาด");
      }
    } catch (e) {
      console.error("Error fetching state:", e);
      // Fallback local mock state so the app doesn't hang forever in spinning state
      const localFallback: DatabaseState = {
        submitters: [
          "สมชาย รักสะอาด",
          "สมหญิง ปัดกวาด",
          "วิชัย เช็ดถู",
          "อนงค์ จัดระเบียบ",
          "เกียรติศักดิ์ เงาวับ"
        ],
        googleSheetUrl: "",
        reports: [],
        streakBonusWinners: {}
      };
      setDbState(localFallback);
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กำลังสลับใช้งานโหมดออฟไลน์ชั่วคราว");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected submitter if submitters list updates
  useEffect(() => {
    if (dbState && dbState.submitters.length > 0 && !selectedSubmitter) {
      setSelectedSubmitter(dbState.submitters[0]);
    }
  }, [dbState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmitter) {
      setErrorMsg("กรุณาเลือกรายชื่อผู้ส่งรายงาน");
      return;
    }
    if (!selectedArea) {
      setErrorMsg("กรุณาเลือกบริเวณพื้นที่ทำความสะอาด");
      return;
    }
    if (!beforeImage) {
      setErrorMsg("กรุณาอัปโหลดรูปภาพก่อนทำความสะอาด (Before Image)");
      return;
    }
    if (!afterImage) {
      setErrorMsg("กรุณาอัปโหลดรูปภาพหลังทำความสะอาดเสร็จสิ้น (After Image)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const now = new Date();
    const localTimestamp = now.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const body = {
      submitter: selectedSubmitter,
      area: selectedArea,
      beforeImage,
      afterImage,
      timestamp: localTimestamp
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "เกิดข้อผิดพลาดในการส่งข้อมูลรายงาน");
      }

      const result = await response.json();
      setDbState(result.db);
      
      // Trigger success popup
      setSuccessSubmitter(selectedSubmitter);
      setIsCelebrationOpen(true);

      // Reset form images and area (keep submitter for next reports)
      setBeforeImage(null);
      setAfterImage(null);
      setSelectedArea(CLEANING_AREAS[0]);
      setSuccessMsg("ส่งข้อมูลรายงานทำความสะอาดเรียบร้อยแล้ว!");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดทางเทคนิค");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const result = await response.json();
        setDbState(result.db);
      } else {
        const err = await response.json();
        alert(err.error || "ไม่สามารถลบรายการได้");
      }
    } catch (e) {
      console.error("Error deleting report:", e);
    }
  };

  const handleSaveSettings = async (settings: { submitters: string[]; googleSheetUrl: string }) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "ล้มเหลวในการบันทึกการตั้งค่า");
    }
    const result = await response.json();
    setDbState(result.db);
  };

  const handleForceSync = async () => {
    const response = await fetch("/api/sync", {
      method: "POST"
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "ล้มเหลวในการซิงก์ข้อมูล");
    }
    const result = await response.json();
    setDbState(result.db);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white pb-12 font-sans relative overflow-hidden">
      {/* Decorative floating blur circles for Vibrant background depth */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-fuchsia-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[45%] right-[25%] w-80 h-80 bg-amber-300/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Thick glowing top gradient bar */}
      <div className="h-2.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 via-cyan-400 to-amber-400 shadow-[0_2px_15px_rgba(219,39,119,0.25)]" />

      {/* Header section */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-6 px-4 md:px-8 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <Sparkles className="w-8 h-8 fill-white/10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ระบบรายงานการทำความสะอาด
                </span>
                <span className="text-pink-600 font-extrabold text-xs bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                  Sparkle clean
                </span>
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                ส่งรูปงานด่วน แสตมป์เวลาอัตโนมัติ พิชิตภารกิจและคะแนนโบนัสสตรีคทุกวัน ✨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-slate-100 p-2 rounded-2xl border border-slate-200/50">
            <span className="text-xs font-black text-slate-700 bg-white shadow-xs px-3.5 py-1.5 rounded-xl border border-slate-200">
              📅 วันนี้: {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <div className="h-4 w-[1px] bg-slate-300" />
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-white rounded-xl transition hover:shadow-xs active:scale-95"
              title="ดึงข้อมูลใหม่ล่าสุด"
            >
              <RefreshCw className="w-4 h-4 text-slate-600 hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8 relative z-10">
        
        {/* Daily Mission Widget */}
        {dbState && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <DailyMission dbState={dbState} />
          </motion.div>
        )}

        {/* Tab Navigation links */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200/40 shadow-inner">
          <button
            onClick={() => { setActiveTab("report"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 font-extrabold text-xs rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "report"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <ClipboardCheck className={`w-4 h-4 ${activeTab === "report" ? "text-white" : "text-indigo-500"}`} />
            ส่งรายงานทำความสะอาด
          </button>
          <button
            onClick={() => { setActiveTab("dashboard"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 font-extrabold text-xs rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === "dashboard" ? "text-white" : "text-pink-500"}`} />
            สถิติ & บอร์ดผลงาน (Dashboard)
          </button>
          <button
            onClick={() => { setActiveTab("history"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 font-extrabold text-xs rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "history"
                ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === "history" ? "text-white" : "text-rose-500"}`} />
            ดูข้อมูลย้อนหลัง (History)
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 font-extrabold text-xs rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <Settings2 className={`w-4 h-4 ${activeTab === "settings" ? "text-white" : "text-amber-500"}`} />
            จัดการรายชื่อผู้ส่ง (Rosters)
          </button>
        </div>

        {/* Tab View Contents */}
        <div id="tab-views-container">
          {activeTab === "report" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {dbState ? (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_15px_40px_rgba(99,102,241,0.08)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] transition-all duration-300 border border-slate-100/80 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="mb-6 border-b border-slate-50 pb-4">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      ✍️ เขียนรายงานชิ้นงานทำความสะอาด
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">กรอกข้อมูล เลือกพื้นที่ และอัปโหลดภาพก่อน-หลังที่ได้ทำการแสตมป์เวลาแล้ว</p>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-100 text-red-800 text-xs font-bold p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          fetchData();
                        }}
                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-black transition active:scale-95 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> ลองเชื่อมต่ออีกครั้ง
                      </button>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 mb-6">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Submitter Dropdown */}
                    <div className="space-y-2">
                      <label htmlFor="submitter-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        👤 เลือกรายชื่อผู้ส่งงาน
                      </label>
                      <select
                        id="submitter-select"
                        value={selectedSubmitter}
                        onChange={(e) => setSelectedSubmitter(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-150"
                        required
                      >
                        {dbState.submitters.length > 0 ? (
                          dbState.submitters.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))
                        ) : (
                          <option value="">ไม่มีรายชื่อ (โปรดตั้งค่าที่เมนู จัดการรายชื่อ)</option>
                        )}
                      </select>
                    </div>

                    {/* Before & After Upload Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <UploadBox
                        label="ภาพก่อนเริ่มทำความสะอาด (Before Image)"
                        type="before"
                        imageUrl={beforeImage}
                        onImageStamped={setBeforeImage}
                      />
                      
                      <UploadBox
                        label="ภาพทำความสะอาดเรียบร้อยแล้ว (After Image)"
                        type="after"
                        imageUrl={afterImage}
                        onImageStamped={setAfterImage}
                      />
                    </div>

                    {/* Submit Button Bar */}
                    <div className="border-t border-slate-100 pt-6 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>รูปภาพที่อัปโหลดจะถูกแสตมป์วันที่และเวลาด้วยสติ๊กเกอร์กันแก้</span>
                      </div>

                      <button
                        type="submit"
                        id="submit-report-btn"
                        disabled={isSubmitting || !selectedSubmitter || !selectedArea || !beforeImage || !afterImage}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed font-black text-white px-8 py-4 text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? "กำลังส่งรายงาน..." : "ส่งรายงาน"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {dbState ? (
                <Dashboard
                  dbState={dbState}
                  onDeleteReport={handleDeleteReport}
                />
              ) : (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {dbState ? (
                <HistoryViewer dbState={dbState} />
              ) : (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {dbState ? (
                <SettingsPanel
                  submittersList={dbState.submitters}
                  googleSheetUrl={dbState.googleSheetUrl}
                  onSaveSettings={handleSaveSettings}
                  onForceSync={handleForceSync}
                />
              ) : (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Celebratory Celebration popup overlay (+10 Points!) */}
      <CelebrationPopup
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        submitterName={successSubmitter}
      />
    </div>
  );
}
