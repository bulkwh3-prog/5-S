import React, { useState, useEffect } from "react";
import { Sparkles, ClipboardCheck, LayoutDashboard, Calendar, Settings2, ShieldCheck, Check, Send, Sparkle, AlertCircle, RefreshCw, Database, LogOut, Globe } from "lucide-react";
import { motion } from "motion/react";
import { DatabaseState, CLEANING_AREAS, Report } from "./types";
import { UploadBox } from "./components/UploadBox";
import { DailyMission } from "./components/DailyMission";
import { Dashboard } from "./components/Dashboard";
import { HistoryViewer } from "./components/HistoryViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import { CelebrationPopup } from "./components/CelebrationPopup";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  uploadImageToDrive,
  findExistingSpreadsheet,
  createNewSpreadsheet,
  fetchSheetData,
  appendReportToSheet,
  overwriteReportsInSheet,
  overwriteSubmittersInSheet,
  ensureSheetSchema,
  User,
} from "./lib/googleService";
import { computeStreakBonusWinners } from "./utils/streak";

// Safe fetch helper to handle non-JSON responses gracefully
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `เซิร์ฟเวอร์ตอบสนองด้วยสถานะข้อผิดพลาด (สถานะ: ${response.status})`;
    if (isJson) {
      try {
        const errData = await response.json();
        errorMessage = errData.error || errorMessage;
      } catch (e) {
        // ignore
      }
    } else {
      try {
        const text = await response.text();
        if (text && text.length < 150 && !text.includes("<!DOCTYPE html>")) {
          errorMessage = text;
        }
      } catch (e) {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    throw new Error("เซิร์ฟเวอร์ส่งคืนข้อมูลที่ไม่ใช่ JSON (กรุณารีเฟรชหน้าต่างหรือลองเชื่อมต่อใหม่อีกครั้ง)");
  }

  try {
    return await response.json() as T;
  } catch (e: any) {
    throw new Error("รูปแบบข้อมูล JSON ไม่ถูกต้อง: " + (e.message || "ข้อผิดพลาด"));
  }
}

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "dashboard" | "history" | "settings">("report");
  
  // Google OAuth Sync States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const DEFAULT_SPREADSHEET_ID = "1FH1qOHjwRvhkSQtR4KYZ930Z97_K2AVloiJCaqs7ArE";
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    const saved = localStorage.getItem("sparkle_spreadsheet_id");
    if (!saved) {
      localStorage.setItem("sparkle_spreadsheet_id", DEFAULT_SPREADSHEET_ID);
      return DEFAULT_SPREADSHEET_ID;
    }
    return saved;
  });
  
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

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

  // Helper to extract sheet ID
  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Sync with Google Sheets
  const syncFromGoogle = async (token: string, currentSpreadsheetId: string | null) => {
    setIsSyncingGoogle(true);
    setErrorMsg(null);
    try {
      let sheetId = currentSpreadsheetId;
      if (!sheetId) {
        // Search Drive for existing sheet
        sheetId = await findExistingSpreadsheet(token);
        if (!sheetId) {
          // If none exists, create a new one
          sheetId = await createNewSpreadsheet(token);
        }
        localStorage.setItem("sparkle_spreadsheet_id", sheetId);
        setSpreadsheetId(sheetId);
      }

      await ensureSheetSchema(sheetId, token);

      const { reports, submitters } = await fetchSheetData(sheetId, token);
      const streakBonusWinners = computeStreakBonusWinners(reports);

      setDbState({
        submitters,
        googleSheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        reports,
        streakBonusWinners,
      });

      // Auto-select first submitter if available
      if (submitters.length > 0 && !selectedSubmitter) {
        setSelectedSubmitter(submitters[0]);
      }
    } catch (err: any) {
      console.error("Google Sync error:", err);
      setErrorMsg("ไม่สามารถซิงก์ข้อมูลจาก Google Sheets ได้: " + err.message);
      // Fallback
      fetchData();
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Fetch initial data (local server fallback)
  const fetchData = async () => {
    try {
      const data = await safeFetchJson<DatabaseState>("/api/data");
      setDbState(data);
      setErrorMsg(null);
      
      // Auto-select first submitter if available
      if (data.submitters.length > 0 && !selectedSubmitter) {
        setSelectedSubmitter(data.submitters[0]);
      }
    } catch (e: any) {
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

  // Handle Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        await syncFromGoogle(result.accessToken, spreadsheetId);
        setSuccessMsg("เชื่อมต่อบัญชี Google และเปิดระบบซิงก์เรียบร้อยแล้ว!");
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      if (
        err.code === "auth/popup-closed-by-user" || 
        err.message?.includes("popup-closed-by-user") ||
        err.message?.includes("cancelled-by-user")
      ) {
        setErrorMsg(
          "⚠️ การเข้าสู่ระบบล้มเหลวเนื่องจากป๊อปอัปความปลอดภัยถูกปิดลงหรือถูกบล็อกโดยเบราว์เซอร์"
        );
      } else {
        setErrorMsg("เข้าสู่ระบบล้มเหลว: " + err.message);
      }
    }
  };

  // Handle Sign-Out
  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setAccessToken(null);
      setSpreadsheetId(null);
      localStorage.removeItem("sparkle_spreadsheet_id");
      
      // Clear server-side Google Sheet connection URL
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitters: dbState?.submitters || [],
          googleSheetUrl: ""
        })
      });

      setSuccessMsg("ลบข้อมูลการเชื่อมต่อทั้งหมดและออกจากระบบ Google เรียบร้อยแล้ว (สลับเป็นโหมดโลคอล)");
      fetchData();
    } catch (err: any) {
      console.error("Logout/Disconnect failed:", err);
      setGoogleUser(null);
      setAccessToken(null);
      setSpreadsheetId(null);
      localStorage.removeItem("sparkle_spreadsheet_id");
      setSuccessMsg("ออกจากระบบ Google เรียบร้อยแล้ว");
      fetchData();
    }
  };

  useEffect(() => {
    initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        syncFromGoogle(token, spreadsheetId);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        fetchData();
      }
    );
  }, [spreadsheetId]);

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
    const reportDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const localTimestamp = now.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    // Handle Google Sheets persistent submission
    if (googleUser && accessToken && spreadsheetId) {
      try {
        setSuccessMsg("กำลังอัปโหลดรูปภาพไปยัง Google Drive...");
        const beforeUrl = await uploadImageToDrive(beforeImage, `before_${Date.now()}.jpg`, accessToken);
        const afterUrl = await uploadImageToDrive(afterImage, `after_${Date.now()}.jpg`, accessToken);

        setSuccessMsg("กำลังเพิ่มรายงานไปยัง Google Sheet...");
        const newReport: Report = {
          id: Date.now().toString(),
          submitter: selectedSubmitter,
          area: selectedArea,
          beforeImage: beforeUrl,
          afterImage: afterUrl,
          timestamp: localTimestamp,
          date: reportDate,
          points: 10
        };

        await appendReportToSheet(spreadsheetId, newReport, accessToken);

        // Trigger success popup
        setSuccessSubmitter(selectedSubmitter);
        setIsCelebrationOpen(true);

        // Reset form
        setBeforeImage(null);
        setAfterImage(null);
        setSelectedArea(CLEANING_AREAS[0]);
        setSuccessMsg("ส่งข้อมูลรายงานทำความสะอาดและบันทึกลง Google Sheets สำเร็จ!");

        // Sync again to fetch latest data
        await syncFromGoogle(accessToken, spreadsheetId);
      } catch (err: any) {
        console.error("Google Submit failed:", err);
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Google Sheets");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Local / Express Backend fallback submission
    const body = {
      submitter: selectedSubmitter,
      area: selectedArea,
      beforeImage,
      afterImage,
      timestamp: localTimestamp
    };

    try {
      const result = await safeFetchJson<{ success: boolean; report: Report; db: DatabaseState }>("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDbState(result.db);
      
      // Trigger success popup
      setSuccessSubmitter(selectedSubmitter);
      setIsCelebrationOpen(true);

      // Reset form images and area (keep submitter for next reports)
      setBeforeImage(null);
      setAfterImage(null);
      setSelectedArea(CLEANING_AREAS[0]);
      setSuccessMsg("ส่งข้อมูลรายงานทำความสะอาดเรียบร้อยแล้ว! (จัดเก็บในระบบออฟไลน์/เซิร์ฟเวอร์ชั่วคราว)");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดทางเทคนิค");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    const confirmed = window.confirm("คุณต้องการลบรายการรายงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้");
    if (!confirmed) return;

    if (googleUser && accessToken && spreadsheetId && dbState) {
      setIsSyncingGoogle(true);
      try {
        const updatedReports = dbState.reports.filter(r => r.id !== id);
        await overwriteReportsInSheet(spreadsheetId, updatedReports, accessToken);
        setSuccessMsg("ลบรายงานออกจาก Google Sheet เรียบร้อยแล้ว!");
        await syncFromGoogle(accessToken, spreadsheetId);
      } catch (err: any) {
        console.error("Google Delete failed:", err);
        setErrorMsg("เกิดข้อผิดพลาดในการลบข้อมูลจาก Google Sheets: " + err.message);
      } finally {
        setIsSyncingGoogle(false);
      }
      return;
    }

    try {
      const result = await safeFetchJson<{ success: boolean; db: DatabaseState }>(`/api/reports/${id}`, {
        method: "DELETE"
      });
      setDbState(result.db);
    } catch (e: any) {
      console.error("Error deleting report:", e);
      alert(e.message || "ไม่สามารถลบรายการได้");
    }
  };

  const handleEditReport = async (id: string, updatedData: { submitter: string; area: string }) => {
    if (googleUser && accessToken && spreadsheetId && dbState) {
      setIsSyncingGoogle(true);
      try {
        const updatedReports = dbState.reports.map(r => {
          if (r.id === id) {
            return { ...r, ...updatedData };
          }
          return r;
        });
        await overwriteReportsInSheet(spreadsheetId, updatedReports, accessToken);
        setSuccessMsg("แก้ไขข้อมูลรายงานใน Google Sheet เรียบร้อยแล้ว!");
        await syncFromGoogle(accessToken, spreadsheetId);
      } catch (err: any) {
        console.error("Google Edit failed:", err);
        setErrorMsg("เกิดข้อผิดพลาดในการแก้ไขข้อมูลใน Google Sheets: " + err.message);
      } finally {
        setIsSyncingGoogle(false);
      }
      return;
    }

    try {
      const result = await safeFetchJson<{ success: boolean; db: DatabaseState }>(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      setDbState(result.db);
    } catch (e: any) {
      console.error("Error editing report:", e);
      alert(e.message || "ไม่สามารถแก้ไขรายการได้");
    }
  };

  const handleSaveSettings = async (settings: { submitters: string[]; googleSheetUrl: string }) => {
    // If logged in with Google, save to Google Sheet
    if (googleUser && accessToken && spreadsheetId) {
      setIsSyncingGoogle(true);
      try {
        if (settings.googleSheetUrl) {
          // Paste external sheet ID
          const parsedId = extractSpreadsheetId(settings.googleSheetUrl);
          if (parsedId) {
            localStorage.setItem("sparkle_spreadsheet_id", parsedId);
            setSpreadsheetId(parsedId);
            await syncFromGoogle(accessToken, parsedId);
            setSuccessMsg("เปลี่ยนฐานข้อมูล Google Sheet สำเร็จ!");
          } else {
            throw new Error("ลิงก์ Google Sheet ไม่ถูกต้อง");
          }
        } else {
          // Manual roster overwrite inside Google Sheet Submitters tab
          await overwriteSubmittersInSheet(spreadsheetId, settings.submitters, accessToken);
          setSuccessMsg("บันทึกรายชื่อผู้ส่งงานลง Google Sheet สำเร็จ!");
          await syncFromGoogle(accessToken, spreadsheetId);
        }
      } catch (err: any) {
        console.error("Google Settings update failed:", err);
        setErrorMsg("ไม่สามารถอัปเดตการตั้งค่าไปยัง Google Sheets ได้: " + err.message);
      } finally {
        setIsSyncingGoogle(false);
      }
      return;
    }

    const result = await safeFetchJson<{ success: boolean; db: DatabaseState }>("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setDbState(result.db);
  };

  const handleForceSync = async () => {
    if (googleUser && accessToken && spreadsheetId) {
      await syncFromGoogle(accessToken, spreadsheetId);
      return;
    }

    const result = await safeFetchJson<{ success: boolean; db: DatabaseState }>("/api/sync", {
      method: "POST"
    });
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
              <span className="text-xs font-black text-slate-700 bg-white shadow-xs px-3.5 py-1.5 rounded-xl border border-slate-200">
                📅 วันนี้: {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button
                onClick={fetchData}
                className="p-1.5 hover:bg-white rounded-xl transition hover:shadow-xs active:scale-95 cursor-pointer"
                title="ดึงข้อมูลใหม่ล่าสุด"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600 hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8 relative z-10">

        {/* Global Notifications for Auth Errors/Success (highly visible on any tab) */}
        {(errorMsg || successMsg) && (
          <div className="space-y-3">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100/80 text-rose-800 text-xs font-semibold p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-black transition active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    ลองเข้าสู่ระบบอีกครั้ง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      fetchData();
                    }}
                    className="inline-flex items-center gap-1.5 bg-rose-200 hover:bg-rose-300 text-rose-800 px-3 py-1.5 rounded-xl text-[11px] font-black transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    ปิด
                  </button>
                </div>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 text-xs"
                >
                  ปิด
                </button>
              </motion.div>
            )}
          </div>
        )}

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

                  {/* Form fields */}
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
                  onEditReport={handleEditReport}
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
                <HistoryViewer
                  dbState={dbState}
                  onDeleteReport={handleDeleteReport}
                  onEditReport={handleEditReport}
                />
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
                  googleUser={googleUser}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                  isSyncingGoogle={isSyncingGoogle}
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
