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
  googleSignInWithRedirect,
  handleRedirectResult,
  logout,
  getAccessToken,
  uploadImageToDrive,
  findExistingSpreadsheet,
  createNewSpreadsheet,
  fetchSheetData,
  appendReportToSheet,
  overwriteReportsInSheet,
  overwriteSubmittersInSheet,
} from "./lib/googleService";
import { User } from "firebase/auth";
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
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem("sparkle_spreadsheet_id"));
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
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      
      if (errorCode === "auth/popup-closed-by-user" || errorMessage.includes("popup-closed-by-user")) {
        setErrorMsg("คุณได้ปิดหน้าต่างลงชื่อเข้าใช้ (การเชื่อมต่อถูกยกเลิก)");
      } else if (errorCode === "auth/popup-blocked" || errorMessage.includes("popup-blocked")) {
        setErrorMsg("ป๊อปอัปถูกบล็อกโดยเบราว์เซอร์ของคุณ กรุณาอนุญาตให้เปิดป๊อปอัปสำหรับหน้านี้แล้วลองใหม่อีกครั้ง");
      } else if (errorCode === "auth/cancelled-popup-request" || errorMessage.includes("cancelled-popup-request")) {
        setErrorMsg("มีหน้าต่างเข้าสู่ระบบกำลังทำงานอยู่ กรุณารอสักครู่หรือรีเฟรชหน้าเว็บ");
      } else {
        setErrorMsg("เข้าสู่ระบบล้มเหลว: " + (err.message || err));
      }
    }
  };

  const handleGoogleSignInWithRedirect = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg("กำลังนำทางท่านไปยังหน้าลงชื่อเข้าใช้ของ Google...");
      await googleSignInWithRedirect();
    } catch (err: any) {
      console.error("Google redirect login failed:", err);
      setErrorMsg("เข้าสู่ระบบด้วยการนำทางล้มเหลว: " + (err.message || err));
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
      setSuccessMsg("ออกจากระบบ Google เรียบร้อยแล้ว (สลับเป็นโหมดออฟไลน์)");
      fetchData();
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  // Check redirect results on mount
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          setGoogleUser(result.user);
          setAccessToken(result.accessToken);
          await syncFromGoogle(result.accessToken, spreadsheetId);
          setSuccessMsg("เชื่อมต่อบัญชี Google สำเร็จจากระบบการนำทาง (Redirect)!");
        }
      } catch (err: any) {
        console.error("Redirect check failed:", err);
        setErrorMsg("ไม่สามารถดึงข้อมูลผลการนำทางได้: " + err.message);
      }
    };
    checkRedirect();
  }, []);

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
        
        {/* Google Sheets Sync & Auth Status Panel */}
        <div id="google-sync-panel" className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(99,102,241,0.05)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/3 rounded-full blur-xl pointer-events-none" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center md:text-left flex-col md:flex-row">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  googleUser ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                }`}>
                  <Database className={`w-5 h-5 ${isSyncingGoogle ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 justify-center md:justify-start">
                    {googleUser ? "🟢 ซิงก์ข้อมูลกับ Google Sheets เรียบร้อยแล้ว" : "☁️ โหมดบันทึกข้อมูลแบบแชร์ (Google Sheets Sync)"}
                    {isSyncingGoogle && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold animate-pulse">กำลังซิงก์...</span>}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">
                    {googleUser 
                      ? `บัญชีผู้ใช้: ${googleUser.email} | ข้อมูลทั้งหมดจัดเก็บอย่างปลอดภัยบนสเปรดชีตและไดรฟ์ส่วนตัว`
                      : "เชื่อมต่อบัญชี Google ของคุณเพื่อบันทึกและซิงก์รายงานทำความสะอาดทั้งหมดกับคนอื่นในทีมแบบเรียลไทม์"
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end shrink-0 w-full md:w-auto">
                {googleUser ? (
                  <>
                    {dbState?.googleSheetUrl && (
                      <a
                        href={dbState.googleSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 font-bold px-4 py-2.5 rounded-2xl text-xs transition-all duration-150 cursor-pointer shadow-xs"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        เปิด Google Sheet
                      </a>
                    )}
                    <button
                      onClick={handleForceSync}
                      disabled={isSyncingGoogle}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition duration-150 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? "animate-spin" : ""}`} />
                      ดึงข้อมูลใหม่
                    </button>
                    <button
                      onClick={handleGoogleSignOut}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-bold px-4 py-2.5 rounded-2xl text-xs transition duration-150 cursor-pointer"
                      title="ออกจากระบบ"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      ยกเลิกการซิงก์
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto items-center">
                    <button
                      onClick={handleGoogleSignIn}
                      className="gsi-material-button inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl text-xs transition shadow-xs cursor-pointer active:scale-95 w-full sm:w-auto"
                    >
                      <div className="gsi-material-button-icon shrink-0">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "16px", height: "16px" }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents font-bold">เชื่อมต่อผ่านป๊อปอัป (Popup)</span>
                    </button>

                    <button
                      onClick={handleGoogleSignInWithRedirect}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-emerald-200 hover:border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 font-extrabold rounded-2xl text-xs transition shadow-xs cursor-pointer active:scale-95 w-full sm:w-auto animate-pulse"
                    >
                      <Globe className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                      <span>แนะนำ: เชื่อมต่อผ่าน Redirect (ปลอดภัย 100%)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-800 text-xs font-bold p-4 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-[10px] text-red-600 hover:underline cursor-pointer font-extrabold shrink-0"
                >
                  ปิดแจ้งเตือน [X]
                </button>
              </div>
            )}

            {!googleUser && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 font-bold space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-900">💡 คำแนะนำเมื่อกดปุ่มเชื่อมต่อแล้วเงียบหายหรือไม่ตอบสนอง:</p>
                    <p className="font-normal text-slate-600 mt-1">
                      เนื่องจากเบราว์เซอร์จะบล็อกการเปิดหน้าต่างใหม่ (Popups) ภายในโหมดพรีวิวของ AI Studio เพื่อความปลอดภัยสูงสุด กรุณาดำเนินการข้อใดข้อหนึ่งด้านล่างนี้:
                    </p>
                    <ul className="list-decimal list-inside font-medium text-slate-700 mt-1.5 space-y-1 pl-1">
                      <li>คลิกไอคอน <strong className="text-indigo-600 font-black">"เปิดในแท็บใหม่" (Open in new tab ↗️)</strong> ที่มุมขวาบนสุดของหน้าต่างพรีวิว เพื่อใช้งานนอก Iframe และลงชื่อเข้าใช้ได้ราบรื่น 100%</li>
                      <li>หรือ ตรวจสอบมุมขวาของช่องกรอก URL ในเบราว์เซอร์ของคุณ เพื่อกด <strong className="text-amber-800 font-black">"อนุญาตป๊อปอัปและคุกกี้จากหน้านี้" (Allow Popups)</strong> แล้วลองกดใหม่อีกครั้ง</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                <HistoryViewer
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
