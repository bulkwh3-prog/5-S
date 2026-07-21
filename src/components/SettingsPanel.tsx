import React, { useState } from "react";
import { Save, RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet, Users } from "lucide-react";

interface SettingsPanelProps {
  submittersList: string[];
  googleSheetUrl: string;
  onSaveSettings: (settings: { submitters: string[]; googleSheetUrl: string }) => Promise<void>;
  onForceSync: () => Promise<void>;
  googleUser?: any;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
  isSyncingGoogle?: boolean;
}

export function SettingsPanel({
  submittersList,
  googleSheetUrl,
  onSaveSettings,
  onForceSync,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isSyncingGoogle,
}: SettingsPanelProps) {
  const [useGoogleSheet, setUseGoogleSheet] = useState<boolean>(!!googleSheetUrl);
  const [sheetUrl, setSheetUrl] = useState<string>(googleSheetUrl || "");
  const [manualNames, setManualNames] = useState<string>(submittersList.join("\n"));
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const parsedNames = manualNames
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);

    if (!useGoogleSheet && parsedNames.length === 0) {
      setErrorMsg("กรุณาเพิ่มชื่ออย่างน้อย 1 รายชื่อสำหรับการใช้งาน");
      setIsSaving(false);
      return;
    }

    try {
      await onSaveSettings({
        submitters: useGoogleSheet ? [] : parsedNames,
        googleSheetUrl: useGoogleSheet ? sheetUrl.trim() : "",
      });
      setSuccessMsg("บันทึกการตั้งค่ารายชื่อเรียบร้อยแล้ว!");
      // If we synced from google sheets, update the local text area as well
      if (useGoogleSheet) {
        setTimeout(() => window.location.reload(), 1500); // Reload to pull freshly updated names
      }
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await onForceSync();
      setSuccessMsg("ดึงข้อมูลรายชื่อใหม่ล่าสุดจาก Google Sheet สำเร็จ!");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการซิงก์ข้อมูล");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="settings-panel-container" className="bg-white rounded-3xl p-6 shadow-[0_15px_40px_rgba(99,102,241,0.06)] border border-slate-100/80 max-w-2xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/3 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <Users className="w-6 h-6 text-indigo-500" />
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">จัดการรายชื่อผู้ส่งงาน (Submitter Rosters)</h3>
          <p className="text-slate-500 text-xs font-medium">กำหนดรายชื่อที่จะนำไปแสดงในดรอปดาวน์ฟอร์มรายงาน</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2.5 mb-6 font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-2xl flex items-center gap-2.5 mb-6 font-bold">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs to select name source */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => setUseGoogleSheet(false)}
          className={`py-2.5 text-xs font-black rounded-xl transition cursor-pointer ${
            !useGoogleSheet
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ✍️ แก้ไขชื่อในแอปเอง (Manual)
        </button>
        <button
          type="button"
          onClick={() => setUseGoogleSheet(true)}
          className={`py-2.5 text-xs font-black rounded-xl transition cursor-pointer ${
            useGoogleSheet
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🟢 ดึงรายชื่อจาก Google Sheet
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {useGoogleSheet ? (
          <div className="space-y-4">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                วิธีเชื่อมโยงข้อมูลกับ Google Sheet:
              </h4>
              <ol className="text-[11px] text-emerald-800 list-decimal pl-4 space-y-1 leading-relaxed font-semibold">
                <li>เปิด Google Sheet ของคุณที่มีรายชื่อของพนักงาน/ผู้ส่งงาน</li>
                <li>ใส่รายชื่อไว้ใน **คอลัมน์แรก (คอลัมน์ A)** แถวละ 1 คน</li>
                <li>กดแชร์ (Share) ที่มุมขวาบน -&gt; เปลี่ยนเป็น **ทุกคนที่มีลิงก์มีสิทธิ์อ่าน** (Anyone with link can view)</li>
                <li>คัดลอกลิงก์มาวางในช่องด้านล่างนี้</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700">ลิงก์ Google Sheet ของคุณ</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  required={useGoogleSheet}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-150"
                />
                
                {googleSheetUrl && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                    title="ซิงก์ข้อมูลตอนนี้"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    ดึงข้อมูลใหม่
                  </button>
                )}
              </div>
            </div>

            {googleSheetUrl && (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>กำลังเชื่อมต่อกับ Google Sheet ปลายทางอยู่ ปัจจุบันมีรายชื่อสะสม {submittersList.length} คน</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">รายชื่อผู้ส่งงาน (เขียน 1 คนต่อ 1 แถว)</label>
            <textarea
              rows={8}
              placeholder="สมชาย รักสะอาด&#10;สมหญิง ปัดกวาด&#10;วิชัย เช็ดถู"
              value={manualNames}
              onChange={(e) => setManualNames(e.target.value)}
              required={!useGoogleSheet}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed transition duration-150"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              * พิมพ์รายชื่อเรียงลงไปทีละแถว เมื่อเสร็จแล้วกดบันทึกข้อมูลเพื่ออัปเดตลงในดรอปดาวน์ทันที
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 disabled:bg-slate-300 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </form>
    </div>
  );
}
