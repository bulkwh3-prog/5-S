import React from "react";
import { CheckCircle2, Flame, Trophy, Award, Zap, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { DatabaseState } from "../types";

interface DailyMissionProps {
  dbState: DatabaseState;
}

export function DailyMission({ dbState }: DailyMissionProps) {
  const getTodayDateString = () => {
    return new Date().toISOString().substring(0, 10);
  };

  const todayStr = getTodayDateString();
  const reportsToday = dbState.reports.filter(r => r.date === todayStr);
  const reportsCount = reportsToday.length;
  const targetCount = 15;
  const percentage = Math.min(100, Math.round((reportsCount / targetCount) * 100));

  // Determine today's top contributor and count
  const counts: Record<string, number> = {};
  reportsToday.forEach(r => {
    counts[r.submitter] = (counts[r.submitter] || 0) + 1;
  });

  let todayLeader = "";
  let todayLeaderCount = 0;
  Object.entries(counts).forEach(([name, count]) => {
    if (count > todayLeaderCount) {
      todayLeaderCount = count;
      todayLeader = name;
    }
  });

  // Get list of previous days' winners
  const previousWinners = Object.entries(dbState.streakBonusWinners)
    .filter(([date]) => date !== todayStr)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // newest first
    .slice(0, 5); // top 5 previous days

  return (
    <div id="daily-mission-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Progress Card */}
      <div id="progress-card" className="bg-gradient-to-br from-white to-slate-50/50 rounded-3xl p-6 shadow-[0_15px_40px_rgba(99,102,241,0.06)] border border-slate-100/80 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/3 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              ภารกิจวันนี้ (Daily Mission)
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-600 animate-pulse" />
              เป้าหมายร่วมกัน
            </span>
          </div>

          <p className="text-slate-500 text-sm mb-5 leading-relaxed">
            ช่วยกันส่งรายงานการทำความสะอาดให้ครบถ้วนในแต่ละวัน เพื่อสร้างสภาพแวดล้อมที่สะอาดน่าอยู่ร่วมกัน!
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {reportsCount} <span className="text-slate-400 font-medium text-sm">/ {targetCount} เรื่อง</span>
              </span>
              <span className={`text-sm font-black ${percentage >= 100 ? "text-pink-600" : "text-slate-500"}`}>
                {percentage}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  percentage >= 100 
                    ? "from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-pink-200" 
                    : "from-indigo-500 via-purple-500 to-pink-500"
                }`}
              />
            </div>
          </div>
        </div>

        {percentage >= 100 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-lg pointer-events-none" />
            <Trophy className="w-8 h-8 text-amber-500 fill-amber-300 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">สำเร็จภารกิจประจำวันแล้ว! 🎉</p>
              <p className="text-slate-600 text-xs">วันนี้ทุกคนร่วมมือร่วมใจกันสร้างพื้นที่ที่สะอาดหมดจด ยอดเยี่ยมมาก!</p>
            </div>
          </motion.div>
        ) : (
          <p className="text-xs text-slate-400 italic font-medium">
            * ต้องการอีก {targetCount - reportsCount} รายงานเพื่อบรรลุภารกิจของวันนี้
          </p>
        )}
      </div>

      {/* Streak Bonus Card */}
      <div id="streak-bonus-card" className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/15">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-6 -mt-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-pink-500 fill-pink-500 animate-bounce" />
            <h3 className="font-extrabold text-white text-base">โบนัสสตรีคประจำวัน (Streak Bonus)</h3>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed mb-4 font-medium">
            ผู้ที่ส่งรายงานการทำความสะอาดมากที่สุดในแต่ละวัน จะได้รับโบนัสแต้มพิเศษ <span className="text-amber-400 font-bold">+50 แต้ม</span> ตอนสิ้นวัน!
          </p>

          {todayLeader ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                  👑
                </div>
                <div className="min-w-0">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ผู้นำอันดับหนึ่งวันนี้</p>
                  <p className="font-bold text-sm text-white truncate max-w-[140px]">{todayLeader}</p>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <span className="text-xs font-black bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-1 rounded-full border border-pink-500/20">
                    {todayLeaderCount} รายการ
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10 mb-4">
              <p className="text-xs text-slate-400 font-medium">ยังไม่มีผู้ส่งรายงานในวันนี้</p>
              <p className="text-[10px] text-slate-500 mt-0.5">คุณอาจเป็นคนแรกที่ได้รับสตรีคโบนัส!</p>
            </div>
          )}
        </div>

        {/* Previous Streak Winners List */}
        <div>
          <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5 mb-2.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            ประวัติผู้ชนะโบนัสสตรีคก่อนหน้า
          </h4>
          <div className="space-y-2">
            {previousWinners.length > 0 ? (
              previousWinners.map(([date, stat]) => {
                const formattedDate = new Date(date).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short"
                });
                return (
                  <div key={date} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 font-bold">{formattedDate}</span>
                    <span className="font-bold text-slate-200 truncate max-w-[100px]">{stat.winner}</span>
                    <span className="text-amber-400 font-black">+{stat.bonus} แต้ม ({stat.count} รายการ)</span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-500 italic">ไม่มีข้อมูลประวัติผู้ชนะก่อนหน้า</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
