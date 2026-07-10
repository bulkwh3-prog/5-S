import React, { useState } from "react";
import { Link2, Save, UserPlus, RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet, Users, Globe, Database, LogOut, Copy } from "lucide-react";

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

      {/* Team Collaboration section */}
      <div id="team-share-collaboration-section" className="mt-8 border-t border-slate-200/60 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">แชร์ข้อมูลทำความสะอาดร่วมกันกับทีม (Share with Team)</h3>
            <p className="text-slate-500 text-xs font-medium">เชื่อมต่อกับเพื่อนร่วมงานหรือหัวหน้างานเพื่อดูรายงาน คะแนน และบอร์ดสถิติพร้อมกันแบบเรียลไทม์</p>
          </div>
        </div>

        {googleUser ? (
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-950">เชื่อมต่อระบบแชร์ข้อมูล Google Sheets สำเร็จ</span>
              </div>
              <button
                type="button"
                onClick={onGoogleSignOut}
                className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer border border-red-100"
              >
                <LogOut className="w-3 h-3" />
                ตัดการเชื่อมต่อบัญชี
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3.5 leading-relaxed">
              <p className="font-bold text-slate-700">👤 บัญชี Google ปัจจุบัน: <span className="text-indigo-600 font-extrabold">{googleUser.email}</span></p>
              
              {googleSheetUrl && (
                <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2.5 shadow-sm">
                  <p className="font-bold text-slate-600 text-xs">🔗 ลิงก์ Google Sheet สำหรับรายงานทำความสะอาด:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={googleSheetUrl}
                      className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-[11px] font-mono font-medium text-slate-500 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(googleSheetUrl);
                        alert("คัดลอกลิงก์ Google Sheet เรียบร้อยแล้ว! ส่งต่อลิงก์นี้ให้เพื่อนร่วมทีมของคุณเพื่อให้ทุกคนเห็นรายงานร่วมกันครับ");
                      }}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer border border-indigo-100 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      คัดลอกลิงก์
                    </button>
                    <a
                      href={googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-2.5 rounded-xl transition cursor-pointer shrink-0"
                      title="เปิดดูชีทในแท็บใหม่"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 leading-relaxed font-semibold">
                    💡 <strong>วิธีให้ผู้อื่นเห็นข้อมูลของคุณ:</strong> ส่งต่อลิงก์ Google Sheet ด้านบนนี้ให้เพื่อนร่วมทีมของคุณ จากนั้นให้พวกเขาลงชื่อเข้าใช้งาน Google ในหน้าจอนี้ แล้วนำลิงก์ที่คุณส่งให้ไปกรอกในส่วน "ดึงรายชื่อจาก Google Sheet" ด้านบน เพื่อเชื่อมต่อและใช้งานฐานข้อมูลร่วมกันแบบเรียลไทม์!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-3xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              สถานะของคุณขณะนี้คือ <span className="text-indigo-600 font-extrabold">โหมดออฟไลน์เฉพาะอุปกรณ์ (Local Mode)</span> ผู้ใช้อื่นจะไม่สามารถมองเห็นข้อมูลและคะแนนที่คุณส่งได้ และข้อมูลอาจรีเซ็ตเมื่อเซิร์ฟเวอร์เริ่มทำงานใหม่
            </p>

            {/* Check if preview is inside iframe */}
            {typeof window !== "undefined" && window.self !== window.top && (
              <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-[11px] text-amber-800 leading-relaxed font-semibold flex flex-col gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <span className="text-sm shrink-0">💡</span>
                  <div>
                    <strong>ข้อแนะนำสำหรับการพรีวิว:</strong> ขณะนี้คุณพรีวิวผ่าน iFrame ซึ่งเบราว์เซอร์มักบล็อกหน้าต่างล็อกอินความปลอดภัยของ Google แนะนำให้กดเปิดแท็บใหม่ด้านล่างนี้เลยครับ!
                  </div>
                </div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 shadow-sm active:scale-95 text-center cursor-pointer"
                >
                  🚀 คลิกที่นี่เพื่อเปิดแอปในแท็บใหม่ (แก้ปัญหาบล็อกป๊อปอัป)
                </a>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                ลงชื่อเข้าใช้งานด้วย Google เพื่อซิงก์และแบ่งปันข้อมูลกับทีม
              </button>
            </div>
            <div className="text-[11px] text-slate-400 font-medium leading-relaxed">
              * ข้อมูลและภาพรายงานทั้งหมดจะถูกจัดเก็บลงในบัญชี Google Sheets ของคุณและ Drive ร่วมกันอย่างปลอดภัยและเป็นส่วนตัวแบบเรียลไทม์
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
