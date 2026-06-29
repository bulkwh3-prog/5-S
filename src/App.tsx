import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Trash2, 
  Upload, 
  Settings, 
  X, 
  Download, 
  CheckCircle, 
  Award, 
  TrendingUp, 
  Calendar, 
  User, 
  FileText, 
  PlusCircle, 
  Clock, 
  Grid, 
  List,
  AlertCircle,
  Volume2,
  RefreshCw,
  Trophy,
  Flame,
  Check,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Translation dictionary for Thai, English, Burmese
const T = {
  th: {
    title: "ระบบรายงานการทำความสะอาด",
    subtitle: "ถ่ายรูป Before/After เปรียบเทียบผลงาน สะสมแต้ม และพิชิตภารกิจทำความสะอาดรายวัน",
    dailyMission: "ภารกิจวันนี้ (Daily Mission)",
    dailyMissionDesc: "เป้าหมายการส่งของวันเพื่อเติมแต้มพิเศษสะสม ให้คนทำความสะอาดมากที่สุด!",
    todayProgress: "ความสำเร็จวันนี้",
    needMore: (num: number) => `ต้องการอีก ${num} เรื่อง เพื่อบรรลุเป้าหมาย`,
    missionSuccess: "🎉 สำเร็จภารกิจประจำวันนี้แล้ว! ยอดเยี่ยมมาก",
    streakBonus: "Streak Bonus: +20 แต้มพิเศษสำหรับยอดผู้ส่งสูงสุดของวัน",
    tabDashboard: "แดชบอร์ดสถิติ & สรุปผล",
    tabSubmit: "ส่งรายงานความสะอาด",
    tabHistory: (count: number) => `ประวัติรายงาน (${count})`,
    loadingText: "กำลังโหลดข้อมูลและซิงค์คะแนนสะสม...",
    configBtn: "ตั้งค่ารายชื่อผู้ส่ง",
    manageSheets: "จัดการรายชื่อและเป้าหมายจาก Google Sheets",
    sheetUrlLabel: "ลิงก์ Google Sheets (แชร์เป็นสาธารณะ / ทุกคนมีสิทธิ์อ่าน)",
    saveBtn: "บันทึกและซิงค์ข้อมูล",
    saving: "กำลังบันทึก...",
    selectSubmitter: "👤 เลือกรายชื่อผู้ส่งของคุณ",
    selectCategory: "🧹 เลือกประเภทการทำความสะอาด / พื้นที่",
    beforeLabel: "ก่อนกวาดถู (Before)",
    afterLabel: "หลังกวาดถู (After)",
    uploadBefore: "อัปโหลดรูป Before",
    uploadAfter: "อัปโหลดรูป After",
    uploadDescBefore: "รูปถ่ายพื้นที่ที่ยังสกปรก",
    uploadDescAfter: "รูปถ่ายเมื่อทำความสะอาดเสร็จแล้ว",
    fileSize: (size: string) => `ขนาดไฟล์: ${size} KB (บีบอัดแล้ว)`,
    detailsHeader: "รายละเอียดการรายงานความสะอาด",
    submitterLabel: "รายชื่อผู้จัดทำ",
    chooseSubmitterOption: "-- เลือกรายชื่อผู้จัดทำ --",
    pointsAccumulated: (pts: number) => `คะแนนรวม: ${pts} แต้ม`,
    streakDays: (days: number) => `Streak: ${days} วัน`,
    submitBtnText: "ส่งรายงานความสะอาดสะสม +10 แต้ม!",
    submittingText: "กำลังบันทึกข้อมูลและเพิ่มเวลารูปภาพ...",
    leaderboardTitle: "ตารางผู้นำคะแนนสะสม",
    leaderboardSub: "จัดอันดับพนักงานที่ทำความสะอาดและสะสมแต้มมากที่สุด",
    pointsText: "แต้ม",
    streakLabel: "วัน",
    dailyBonusWinner: "ผู้ได้รับแต้มพิเศษ Streak Bonus +20",
    lastUpdated: "อัปเดตล่าสุด",
    allTimeTitle: "สถิติผู้ส่งทั้งหมดในระบบ",
    reportsCount: (count: number) => `${count} ครั้ง`,
    showCompareDetails: "แสดงรายละเอียดรูปภาพเปรียบเทียบ",
    hideCompareDetails: "ซ่อนรายละเอียดรูปภาพเปรียบเทียบ",
    filterDateLabel: "📅 เลือกช่วงเวลาดูย้อนหลัง",
    allDates: "📅 ทั้งหมด",
    todayOnly: "📅 วันนี้",
    submittersAndCompact: "รายชื่อผู้ส่งรายงาน & รูปภาพแบบย่อ",
    submittersAndCompactSub: "รายชื่อพนักงานผู้ส่ง พร้อมแสดงภาพเปรียบเทียบ Before/After แบบย่อล่าสุดของแต่ละคน",
    noSubmittersToday: "ยังไม่มีผู้ส่งรายงานในวันนี้",
    noReportsHistory: "ยังไม่มีรายงานในประวัติ",
    historySub: "ตรวจสอบข้อมูลการรายงาน Before & After ย้อนหลังทั้งหมด",
    timeBefore: "ก่อนกวาดถู",
    timeAfter: "หลังกวาดถู",
    confirmDelete: "ยืนยันการลบรายงานนี้?",
    deleteSuccess: "ลบรายงานสำเร็จ",
    errorRequired: "กรุณากรอกข้อมูลและอัปโหลดรูปให้ครบถ้วน",
    langTh: "ไทย",
    langEn: "English",
    langMy: "မြန်မာ"
  },
  en: {
    title: "Cleaning Reporting System",
    subtitle: "Take Before/After photos to compare work, earn points, and complete daily cleaning missions",
    dailyMission: "Daily Mission",
    dailyMissionDesc: "Today's report target to earn bonus points for cleaners!",
    todayProgress: "Today's Progress",
    needMore: (num: number) => `Needs ${num} more report(s) to reach the daily goal`,
    missionSuccess: "🎉 Daily mission accomplished! Excellent job",
    streakBonus: "Streak Bonus: +20 special points for today's top submitter",
    tabDashboard: "Dashboard & Summary",
    tabSubmit: "Submit Report",
    tabHistory: (count: number) => `Report History (${count})`,
    loadingText: "Loading data and syncing points...",
    configBtn: "Configure Submitters",
    manageSheets: "Manage Names & Targets from Google Sheets",
    sheetUrlLabel: "Google Sheets Link (Must be shared publicly / anyone with link can view)",
    saveBtn: "Save & Sync Data",
    saving: "Saving...",
    selectSubmitter: "👤 Choose your name (Submitter)",
    selectCategory: "🧹 Select Cleaning Category / Area",
    beforeLabel: "Before Cleaning (Before)",
    afterLabel: "After Cleaning (After)",
    uploadBefore: "Upload Before Image",
    uploadAfter: "Upload After Image",
    uploadDescBefore: "Photo of dirty/unclean area",
    uploadDescAfter: "Photo of cleaned/finished area",
    fileSize: (size: string) => `File size: ${size} KB (Compressed)`,
    detailsHeader: "Cleaning Report Details",
    submitterLabel: "Submitted By",
    chooseSubmitterOption: "-- Choose Submitter Name --",
    pointsAccumulated: (pts: number) => `Total: ${pts} pts`,
    streakDays: (days: number) => `Streak: ${days} day(s)`,
    submitBtnText: "Submit Report & Get +10 Points!",
    submittingText: "Saving report & stamping image timestamp...",
    leaderboardTitle: "Points Leaderboard",
    leaderboardSub: "Ranking of cleaners who submitted and earned most points",
    pointsText: "pts",
    streakLabel: "days",
    dailyBonusWinner: "Streak Bonus +20 Winners",
    lastUpdated: "Last updated",
    allTimeTitle: "All Active Submitters",
    reportsCount: (count: number) => `${count} report(s)`,
    showCompareDetails: "Show Comparison Image Details",
    hideCompareDetails: "Hide Comparison Image Details",
    filterDateLabel: "📅 Select Date Range",
    allDates: "📅 All Dates",
    todayOnly: "📅 Today",
    submittersAndCompact: "Today's Active Submitters",
    submittersAndCompactSub: "List of active submitters with their latest Before/After thumbnail comparisons",
    noSubmittersToday: "No submitters for today yet",
    noReportsHistory: "No reports found in history",
    historySub: "Check all historical Before & After reports",
    timeBefore: "Before Cleaned",
    timeAfter: "After Cleaned",
    confirmDelete: "Are you sure you want to delete this report?",
    deleteSuccess: "Report deleted successfully",
    errorRequired: "Please complete all fields and upload both photos",
    langTh: "ไทย",
    langEn: "English",
    langMy: "မြန်မာ"
  },
  my: {
    title: "သန့်ရှင်းရေး အစီရင်ခံစနစ်",
    subtitle: "အလုပ်များကို နှိုင်းယှဉ်ရန်၊ အမှတ်များရရှိရန်နှင့် နေ့စဉ်သန့်ရှင်းရေးမစ်ရှင်များ ပြီးမြောက်ရန် Before/After ဓာတ်ပုံများရိုက်ပါ",
    dailyMission: "ယနေ့လုပ်ငန်းစဉ် (Daily Mission)",
    dailyMissionDesc: "သန့်ရှင်းရေးဝန်ထမ်းများအတွက် ဘောနပ်စ်အမှတ်များရရှိရန် ယနေ့အစီရင်ခံစာ ပန်းတိုင်!",
    todayProgress: "ယနေ့တိုးတက်မှု",
    needMore: (num: number) => `ပန်းတိုင်ရောက်ရန် အစီရင်ခံစာ ${num} ခု ထပ်လိုပါသည်`,
    missionSuccess: "🎉 ယနေ့လုပ်ငန်းစဉ် အောင်မြင်ပါပြီ။ ကောင်းမွန်စွာလုပ်ဆောင်နိုင်ခဲ့ပါသည်",
    streakBonus: "Streak Bonus: ယနေ့အများဆုံးပေးပို့သူအတွက် အထူးအမှတ် +၂၀ ရရှိပါမည်",
    tabDashboard: "ဒက်ရှ်ဘုတ်နှင့် အကျဉ်းချုပ်",
    tabSubmit: "သန့်ရှင်းရေး အစီရင်ခံစာ တင်သွင်းရန်",
    tabHistory: (count: number) => `အစီရင်ခံစာ မှတ်တမ်း (${count})`,
    loadingText: "အချက်အလက်များတင်နေပြီး အမှတ်များကို စင့်ခ်လုပ်နေပါသည်...",
    configBtn: "ပေးပို့သူစာရင်း သတ်မှတ်ရန်",
    manageSheets: "Google Sheets မှ အမည်များနှင့် ပန်းတိုင်များကို စီမံခန့်ခွဲရန်",
    sheetUrlLabel: "Google Sheets လင့်ခ် (အများပြည်သူကြည့်ရှုနိုင်ရန် မျှဝေထားရမည်)",
    saveBtn: "သိမ်းဆည်းပြီး ဒေတာစင့်ခ်လုပ်ရန်",
    saving: "သိမ်းဆည်းနေပါသည်...",
    selectSubmitter: "👤 သင့်အမည်ကို ရွေးချယ်ပါ",
    selectCategory: "🧹 သန့်ရှင်းရေးအမျိုးအစား / နေရာ ရွေးချယ်ပါ",
    beforeLabel: "သန့်ရှင်းရေးမလုပ်မီ (Before)",
    afterLabel: "သန့်ရှင်းရေးလုပ်ပြီးနောက် (After)",
    uploadBefore: "Before ပုံ တင်ရန်",
    uploadAfter: "After ပုံ တင်ရန်",
    uploadDescBefore: "မသန့်ရှင်းသေးသော နေရာဓာတ်ပုံ",
    uploadDescAfter: "သန့်ရှင်းရေးလုပ်ပြီးနောက် နေရာဓာတ်ပုံ",
    fileSize: (size: string) => `ဖိုင်အရွယ်အစား: ${size} KB (ချုံ့ထားသည်)`,
    detailsHeader: "သန့်ရှင်းရေး အစီရင်ခံစာ အသေးစိတ်",
    submitterLabel: "တင်ပြသူအမည်",
    chooseSubmitterOption: "-- တင်ပြသူအမည်ကို ရွေးချယ်ပါ --",
    pointsAccumulated: (pts: number) => `စုစုပေါင်းအမှတ်: ${pts} အမှတ်`,
    streakDays: (days: number) => `ဆက်တိုက်လုပ်ဆောင်မှု: ${days} ရက်`,
    submitBtnText: "အစီရင်ခံစာတင်သွင်းပြီး +၁၀ အမှတ်ရယူပါ!",
    submittingText: "အချက်အလက်များကို သိမ်းဆည်းပြီး ဓာတ်ပုံအချိန်မှတ်သားနေပါသည်...",
    leaderboardTitle: "အမှတ်အများဆုံးရသူများစာရင်း",
    leaderboardSub: "အစီရင်ခံစာတင်သွင်းပြီး အမှတ်အများဆုံးရရှိသော သန့်ရှင်းရေးဝန်ထမ်းများ",
    pointsText: "အမှတ်",
    streakLabel: "ရက်",
    dailyBonusWinner: "နေ့စဉ် အထူးအမှတ် Streak Bonus +၂၀ ရရှိသူများ",
    lastUpdated: "နောက်ဆုံးအပ်ဒိတ်လုပ်ချိန်",
    allTimeTitle: "စနစ်အတွင်းရှိ ပေးပို့သူအားလုံး",
    reportsCount: (count: number) => `${count} ကြိမ်`,
    showCompareDetails: "ပုံနှိုင်းယှဉ်မှု အသေးစိတ်ကို ပြသပါ",
    hideCompareDetails: "ပုံနှိုင်းယှဉ်မှု အသေးစိတ်ကို ဝှက်ထားပါ",
    filterDateLabel: "📅 နေ့ရက် ရွေးချယ်ရန်",
    allDates: "📅 အားလုံး",
    todayOnly: "📅 ယနေ့",
    submittersAndCompact: "ယနေ့ အစီရင်ခံစာ တင်သွင်းသူများ",
    submittersAndCompactSub: "ပေးပို့သူဝန်ထမ်းများနှင့် ၎င်းတို့၏ နောက်ဆုံး Before/After ဓာတ်ပုံပုံရိပ်အကျဉ်းများ",
    noSubmittersToday: "ယနေ့ အစီရင်ခံစာ တင်သွင်းသူ မရှိသေးပါ",
    noReportsHistory: "မှတ်တမ်းတွင် အစီရင်ခံစာ မရှိသေးပါ",
    historySub: "ယခင် Before & After အစီရင်ခံစာမှတ်တမ်းအားလုံးကို စစ်ဆေးပါ",
    timeBefore: "သန့်ရှင်းရေးမလုပ်မီ",
    timeAfter: "သန့်ရှင်းရေးလုပ်ပြီးနောက်",
    confirmDelete: "ဤအစီရင်ခံစာကို ဖျက်ရန် သေฉာပါသလား?",
    deleteSuccess: "အစီရင်ခံစာ ဖျက်သိမ်းခြင်း အောင်မြင်ပါသည်",
    errorRequired: "ကျေးဇူးပြု၍ အချက်အလက်များပြည့်စုံစွာဖြည့်စွက်ပြီး ဓာတ်ပုံနှစ်ပုံစလုံးကို တင်ပါ",
    langTh: "ไทย",
    langEn: "English",
    langMy: "မြန်မာ"
  }
};

const CATEGORY_TRANSLATIONS: Record<string, Record<"th" | "en" | "my", string>> = {
  "ห้องน้ำ": {
    th: "ห้องน้ำ",
    en: "Toilet / Restroom",
    my: "အိမ်သာ / ရေချိုးခန်း"
  },
  "ห้องครัว / โซนอาหาร": {
    th: "ห้องครัว / โซนอาหาร",
    en: "Kitchen / Dining Area",
    my: "မီးဖိုချောင် / စားသောက်ခန်း"
  },
  "โต๊ะทำงาน / ห้องประชุม": {
    th: "โต๊ะทำงาน / ห้องประชุม",
    en: "Desks / Meeting Rooms",
    my: "အလုပ်စားပွဲ / အစည်းအဝေးခန်း"
  },
  "ล็อบบี้ / ทางเข้า": {
    th: "ล็อบบี้ / ทางเข้า",
    en: "Lobby / Entrance",
    my: "ဧည့်ခန်း / အဝင်ဝ"
  },
  "กระจก / ประตูหน้าต่าง": {
    th: "กระจก / ประตูหน้าต่าง",
    en: "Glass / Windows / Doors",
    my: "မှัน / ပြတင်းပေါက် / တံခါး"
  },
  "ถังขยะ / จุดคัดแยก": {
    th: "ถังขยะ / จุดคัดแยก",
    en: "Trash bins / Sorting Point",
    my: "အမှိုက်ပုံး / အမှိုက်ခွဲခြားရာနေရာ"
  },
  "พื้น / ทางเดิน": {
    th: "พื้น / ทางเดิน",
    en: "Floor / Hallways",
    my: "ကြမ်းပြင် / လမ်းလျှောက်လမ်း"
  },
  "อื่นๆ": {
    th: "อื่นๆ",
    en: "Others",
    my: "အခြား"
  },
  "ทั่วไป": {
    th: "ทั่วไป",
    en: "General",
    my: "အထွေထွေ"
  }
};


// Standard cleaning categories
const CATEGORIES = [
  "ห้องน้ำ",
  "ห้องครัว / โซนอาหาร",
  "โต๊ะทำงาน / ห้องประชุม",
  "ล็อบบี้ / ทางเข้า",
  "กระจก / ประตูหน้าต่าง",
  "ถังขยะ / จุดคัดแยก",
  "พื้น / ทางเดิน",
  "อื่นๆ"
];

interface Submitter {
  id: string;
  name: string;
  points: number;
  streak: number;
  lastSubmitted: string;
}

interface Report {
  id: string;
  submitterId: string;
  submitterName: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  beforeTime: string;
  afterTime: string;
  createdAt: string;
  createdTimestamp: string;
  pointsEarned: number;
}

interface StreakBonusWinner {
  date: string;
  name: string;
  points: number;
}

interface DBState {
  submitters: Submitter[];
  reports: Report[];
  settings: {
    googleSheetUrl: string;
    dailyTarget: number;
  };
  streakBonusWinners: StreakBonusWinner[];
}

export default function App() {
  const [db, setDb] = useState<DBState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Language State (Thai, English, Burmese)
  const [language, setLanguage] = useState<"th" | "en" | "my">(() => {
    return (localStorage.getItem("preferred_lang") as "th" | "en" | "my") || "th";
  });

  const changeLanguage = (lang: "th" | "en" | "my") => {
    setLanguage(lang);
    localStorage.setItem("preferred_lang", lang);
  };
  
  // Settings Form
  const [sheetUrl, setSheetUrl] = useState("");
  const [dailyTarget, setDailyTarget] = useState(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Submit Form State
  const [selectedSubmitterId, setSelectedSubmitterId] = useState("");
  const [customSubmitterName, setCustomSubmitterName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั่วไป");
  const [customCategory, setCustomCategory] = useState("");
  
  // Image states
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [beforeTime, setBeforeTime] = useState("");
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [afterTime, setAfterTime] = useState("");
  const [imageError, setImageError] = useState("");

  // UI state
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successStreak, setSuccessStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<"submit" | "dashboard" | "history">("dashboard");
  const [filterCategory, setFilterCategory] = useState("ทั้งหมด");
  const [filterDate, setFilterDate] = useState("ทั้งหมด");
  const [customFilterDate, setCustomFilterDate] = useState("");

  // Custom Alert / Confirm states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "success"
  });

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDb(data);
      if (data.settings) {
        setSheetUrl(data.settings.googleSheetUrl || "");
        setDailyTarget(data.settings.dailyTarget || 15);
      }
      setFetchError(null);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching database:", error);
      setFetchError(error?.message || "JSON Parse Error / Connection Lost");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Live real-time updates: Connect to server events
    const eventSource = new EventSource("/api/events");
    
    eventSource.onmessage = (event) => {
      if (event.data === "update") {
        fetchData();
      }
    };

    eventSource.onerror = (err) => {
      console.warn("Real-time updates connection closed or errored, will retry automatically:", err);
    };

    // Periodic fallback polling (every 10 seconds) to guarantee quick recovery on connection drop
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Web Audio Synth: Success double chime
  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, startTime);
        
        // Add a slight frequency glide for a cute arcade chime
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.05, startTime + duration);
        
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = audioCtx.currentTime;
      // Synthesize elegant double chord chime
      playNote(523.25, now, 0.15); // C5
      playNote(659.25, now + 0.1, 0.15); // E5
      playNote(783.99, now + 0.18, 0.3); // G5
      playNote(1046.50, now + 0.25, 0.4); // C6 (Octave higher sparkle)
    } catch (e) {
      console.warn("Audio Context not supported or allowed yet", e);
    }
  };

  // Helper to format date-time
  const getFormattedDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear() + 543; // Thai Buddhist calendar year
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getThaiFormattedDate = () => {
    const now = new Date();
    if (language === "en") {
      return now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (language === "my") {
      const days = ["တနင်္ဂနွေ", "တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ"];
      const months = ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"];
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      return `${dayName}၊ ${monthName} ${dateNum}၊ ${year}`;
    }
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const yearThai = now.getFullYear() + 543;
    return `${dayName}ที่ ${dateNum} ${monthName} พ.ศ. ${yearThai}`;
  };

  // Helper to calculate approximate KB size of a base64 string
  const getBase64SizeKb = (base64Str: string | null) => {
    if (!base64Str) return "0";
    const bytes = Math.round((base64Str.length * 3) / 4);
    return (bytes / 1024).toFixed(1);
  };

  // Embed timestamp onto the uploaded image using HTML Canvas
  const processImageWithTimestamp = (file: File, label: "BEFORE" | "AFTER"): Promise<{ dataUrl: string; timeStr: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject("Cannot get canvas 2D context");
            return;
          }

          // Optimized maximum size (800px width/height is the gold standard for high-performance mobile and web review)
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Prepare text & banner
          const timeStr = getFormattedDateTime();
          const displayLabel = label === "BEFORE" ? "ก่อนกวาดถู (Before)" : "หลังกวาดถู (After)";
          const bannerText = `${displayLabel} • ${timeStr}`;

          // Responsive font size based on canvas width
          const fontSize = Math.max(14, Math.round(width * 0.035));
          ctx.font = `bold ${fontSize}px "Kanit", sans-serif`;

          const textWidth = ctx.measureText(bannerText).width;
          const paddingX = fontSize * 0.8;
          const paddingY = fontSize * 0.5;
          const bannerHeight = fontSize + paddingY * 2;

          // Draw semi-transparent background banner at the bottom
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Deep slate dark overlay
          ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

          // Draw yellow/green accent bar on top of the banner
          ctx.fillStyle = label === "BEFORE" ? "#f43f5e" : "#10b981"; // Rose for Before, Emerald for After
          ctx.fillRect(0, height - bannerHeight, width, Math.round(fontSize * 0.15));

          // Draw text
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(bannerText, paddingX, height - bannerHeight / 2 + Math.round(fontSize * 0.08));

          // Export as highly-compressed JPEG (0.7 quality) to minimize base64 payload size
          const resultUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve({ dataUrl: resultUrl, timeStr });
        };
        img.onerror = () => reject("Failed to load image");
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject("Failed to read file");
      reader.readAsDataURL(file);
    });
  };

  // Generate and download Before/After side-by-side comparison collage as a single JPG image
  const downloadComparisonCollage = (report: any) => {
    const beforeImg = new Image();
    const afterImg = new Image();
    
    let loadedCount = 0;
    const onLoadImage = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Both images loaded, draw collage
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        // Collage layout size
        const headerHeight = 130;
        const imgWidth = 780;
        const imgHeight = 780;
        const spacing = 15;
        const padding = 20;
        
        const canvasWidth = padding * 2 + imgWidth * 2 + spacing;
        const canvasHeight = headerHeight + imgHeight + padding * 2;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Fill canvas with elegant off-white background
        ctx.fillStyle = "#f8fafc"; // Slate-50
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw Header background
        ctx.fillStyle = "#0f172a"; // Slate-900
        ctx.fillRect(0, 0, canvasWidth, headerHeight);
        
        // Title text
        ctx.fillStyle = "#facc15"; // Yellow-400
        ctx.font = "bold 28px sans-serif";
        ctx.fillText(language === "th" ? "รายงานเปรียบเทียบผลการทำความสะอาด" : language === "en" ? "Cleaning Comparison Report" : "သန့်ရှင်းရေး အစီရင်ခံစာ", padding, 50);
        
        // Subtitle details (Submitter name, category/zone, date)
        ctx.fillStyle = "#e2e8f0"; // Slate-200
        ctx.font = "bold 18px sans-serif";
        const categoryLabel = CATEGORY_TRANSLATIONS[report.category]?.[language] || report.category;
        const infoText = `${language === "th" ? "ผู้ทำความสะอาด" : language === "en" ? "Cleaner" : "သန့်ရှင်းရေးသမား"}: ${report.submitterName}   |   ${language === "th" ? "พื้นที่" : language === "en" ? "Zone" : "နေရာ"}: ${categoryLabel}   |   ${language === "th" ? "วันที่" : language === "en" ? "Date" : "နေ့စွဲ"}: ${report.createdAt}`;
        ctx.fillText(infoText, padding, 95);
        
        // Draw Before Image
        const beforeX = padding;
        const beforeY = headerHeight + padding;
        ctx.drawImage(beforeImg, beforeX, beforeY, imgWidth, imgHeight);
        
        // Draw BEFORE Badge
        ctx.fillStyle = "rgba(244, 63, 94, 0.9)"; // Rose-500
        ctx.fillRect(beforeX + 15, beforeY + 15, 140, 45);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(language === "th" ? "ก่อนกวาดถู" : language === "en" ? "BEFORE" : "မလုပ်မီ", beforeX + 15 + 70, beforeY + 15 + 22.5);
        
        // Draw Before Time Stamp bar
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fillRect(beforeX + 15, beforeY + imgHeight - 55, 300, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Time: ${report.beforeTime.split(' ')[1] || report.beforeTime}`, beforeX + 25, beforeY + imgHeight - 35);
        
        // Draw After Image
        const afterX = padding + imgWidth + spacing;
        const afterY = headerHeight + padding;
        ctx.drawImage(afterImg, afterX, afterY, imgWidth, imgHeight);
        
        // Draw AFTER Badge
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)"; // Emerald-500
        ctx.fillRect(afterX + 15, afterY + 15, 140, 45);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(language === "th" ? "หลังกวาดถู" : language === "en" ? "AFTER" : "ပြီးနောက်", afterX + 15 + 70, afterY + 15 + 22.5);
        
        // Draw After Time Stamp bar
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fillRect(afterX + 15, afterY + imgHeight - 55, 300, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Time: ${report.afterTime.split(' ')[1] || report.afterTime}`, afterX + 25, afterY + imgHeight - 35);
        
        // Footer tag
        ctx.fillStyle = "#94a3b8"; // Slate-400
        ctx.font = "italic 14px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("Generated by ระบบรายงานทำความสะอาด", canvasWidth - padding, canvasHeight - 12);
        
        // Convert and trigger download
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          const link = document.createElement("a");
          link.download = `Cleaning-Report-${report.submitterName}-${report.createdAt}-${report.id.slice(4, 9)}.jpg`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          triggerToast(language === "th" ? "ดาวน์โหลดภาพสำเร็จแล้ว!" : language === "en" ? "Download successful!" : "ဒေါင်းလုဒ်အောင်မြင်ပါသည်!", "success");
        } catch (err) {
          console.error("Collage export failed:", err);
          triggerToast(language === "th" ? "ไม่สามารถส่งออกภาพได้เนื่องจากข้อจำกัดความปลอดภัยของเบราว์เซอร์" : language === "en" ? "Export failed due to browser security restrictions" : "ဘရောက်ဇာလုံခြုံရေးကြောင့် ပုံထုတ်ယူ၍မရပါ", "error");
        }
      }
    };
    
    beforeImg.onerror = () => {
      triggerToast(language === "th" ? "ไม่สามารถโหลดรูปภาพก่อนทำได้" : language === "en" ? "Failed to load before image" : "မလုပ်မီပုံ မတင်နိုင်ပါ", "error");
    };
    afterImg.onerror = () => {
      triggerToast(language === "th" ? "ไม่สามารถโหลดรูปภาพหลังทำได้" : language === "en" ? "Failed to load after image" : "ပြီးနောက်ပုံ မတင်နိုင်ပါ", "error");
    };
    
    // Support potential cross-origin images
    beforeImg.crossOrigin = "anonymous";
    afterImg.crossOrigin = "anonymous";
    
    beforeImg.src = report.beforeImage;
    afterImg.src = report.afterImage;
  };

  // Handle file changes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    try {
      const result = await processImageWithTimestamp(file, type === "before" ? "BEFORE" : "AFTER");
      if (type === "before") {
        setBeforeImage(result.dataUrl);
        setBeforeTime(result.timeStr);
      } else {
        setAfterImage(result.dataUrl);
        setAfterTime(result.timeStr);
      }
    } catch (err) {
      console.error(err);
      setImageError("ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // Submit report handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError("");

    if (!selectedSubmitterId) {
      setImageError("กรุณาเลือกรายชื่อผู้ส่ง");
      return;
    }

    if (!beforeImage) {
      setImageError("กรุณาอัปโหลดรูป ก่อนทำความสะอาด (Before)");
      return;
    }

    if (!afterImage) {
      setImageError("กรุณาอัปโหลดรูป หลังทำความสะอาด (After)");
      return;
    }

    const finalCategory = selectedCategory === "อื่นๆ" ? (customCategory.trim() || "อื่นๆ") : selectedCategory;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterId: selectedSubmitterId,
          category: finalCategory,
          beforeImage,
          afterImage,
          beforeTime,
          afterTime
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }

      // Success! Play arcade double chime immediately
      playSuccessSound();

      // Show congratulations popup with values
      setSuccessPoints(10);
      setSuccessStreak(result.newStreak);
      setShowSubmitSuccess(true);

      // Refresh DB list to update stats and scores
      fetchData();

      // Reset form images and category
      setBeforeImage(null);
      setBeforeTime("");
      setAfterImage(null);
      setAfterTime("");
      setCustomCategory("");
      
    } catch (err: any) {
      setImageError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess(false);
    setIsSavingSettings(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleSheetUrl: sheetUrl,
          dailyTarget: Number(dailyTarget)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกค่า");
      }

      setDb(result.db);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message || "ไม่สามารถเชื่อมโยงรายชื่อได้ กรุณาตรวจสอบลิงก์ Google Sheet");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset database (helper for quick debug / demonstration)
  const handleResetData = async () => {
    setConfirmModal({
      isOpen: true,
      title: "รีเซ็ตข้อมูลทั้งหมด",
      message: "คุณต้องการรีเซ็ตข้อมูลรายงาน คะแนน และสถิติทั้งหมดใช่หรือไม่?",
      confirmText: "รีเซ็ตข้อมูล",
      cancelText: "ยกเลิก",
      onConfirm: async () => {
        try {
          const response = await fetch("/api/reset", { method: "POST" });
          const result = await response.json();
          if (result.success) {
            setDb(result.db);
            triggerToast("รีเซ็ตข้อมูลเรียบร้อยแล้ว", "success");
          }
        } catch (e) {
          console.error(e);
          triggerToast("เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ลบรายงานความสะอาด",
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบรายงานความสะอาดนี้? (คะแนนผู้จัดทำของรายงานนี้จะถูกหักออก)",
      confirmText: "ลบรายงาน",
      cancelText: "ยกเลิก",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/reports/${reportId}`, {
            method: "DELETE",
          });
          const result = await response.json();
          if (result.success) {
            setDb(result.db);
            triggerToast("ลบรายงานความสะอาดเรียบร้อยแล้ว!", "success");
          } else {
            triggerToast(result.error || "เกิดข้อผิดพลาดในการลบรายงาน", "error");
          }
        } catch (err) {
          console.error("Error deleting report:", err);
          triggerToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Calculated properties
  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayReports = db?.reports.filter(r => r.createdAt === todayStr) || [];
  const todayCount = todayReports.length;
  const targetCount = db?.settings.dailyTarget || 15;
  const progressPercent = Math.min(100, Math.round((todayCount / targetCount) * 100));

  const getFilteredReports = () => {
    if (!db || !db.reports) return [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    return db.reports.filter((report) => {
      // Category filter
      const matchesCategory = filterCategory === "ทั้งหมด" || report.category === filterCategory;
      
      // Date filter
      let matchesDate = true;
      if (filterDate === "วันนี้") {
        matchesDate = report.createdAt === todayStr;
      } else if (filterDate === "เมื่อวาน") {
        matchesDate = report.createdAt === yesterdayStr;
      } else if (filterDate === "custom") {
        matchesDate = !customFilterDate || report.createdAt === customFilterDate;
      }
      
      return matchesCategory && matchesDate;
    });
  };

  const filteredReportsList = getFilteredReports();

  // Category counts for dashboard
  const categoryCounts: { [category: string]: number } = {};
  db?.reports.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  // Submitter stats for Leaderboard
  const sortedSubmitters = db?.submitters 
    ? [...db.submitters].sort((a, b) => b.points - a.points)
    : [];

  // Streak bonus champion
  // Active most reports today:
  const todayCountsBySubmitter: { [id: string]: { name: string; count: number } } = {};
  todayReports.forEach(r => {
    if (!todayCountsBySubmitter[r.submitterId]) {
      todayCountsBySubmitter[r.submitterId] = { name: r.submitterName, count: 0 };
    }
    todayCountsBySubmitter[r.submitterId].count++;
  });

  const todayLeader = Object.entries(todayCountsBySubmitter)
    .sort((a, b) => b[1].count - a[1].count)[0];

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans" id="cleaning_app_root">
      
      {/* HEADER SECTION */}
      <header className="bg-white/95 backdrop-blur-md border-b-4 border-blue-400/80 sticky top-0 z-40 shadow-md" id="app_header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-amber-400 text-white p-3 rounded-2xl shadow-md shadow-orange-500/10 flex items-center justify-center animate-bounce-subtle">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-orange-500 to-amber-500">
                  {T[language].title}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {T[language].subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Language Switcher Button Row */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => changeLanguage("th")}
                className={`px-3.5 py-1.5 rounded-xl text-base font-black transition-all cursor-pointer flex items-center justify-center ${
                  language === "th" 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🇹🇭</span>
              </button>
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`px-3.5 py-1.5 rounded-xl text-base font-black transition-all cursor-pointer flex items-center justify-center ${
                  language === "en" 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🇺🇸</span>
              </button>
              <button
                type="button"
                onClick={() => changeLanguage("my")}
                className={`px-3.5 py-1.5 rounded-xl text-base font-black transition-all cursor-pointer flex items-center justify-center ${
                  language === "my" 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🇲🇲</span>
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer font-bold"
              id="settings_toggle_btn"
            >
              <Settings className="h-4 w-4" />
              <span>{T[language].configBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* SETTINGS CARD DROPDOWN (ANIMATED) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-blue-50/70 via-amber-50/50 to-orange-50/30 border-b-4 border-blue-100 shadow-inner py-8 px-4"
            id="settings_panel"
          >
            <div className="max-w-4xl mx-auto bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-blue-500" />
                  จัดการรายชื่อและเป้าหมายจาก Google Sheets
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      ลิงก์ Google Sheets (แชร์เป็นสาธารณะ / ทุกคนมีสิทธิ์อ่าน)
                    </label>
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/your-id/edit?usp=sharing"
                      className="w-full text-sm px-4 py-3 border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    />
                    <span className="text-[11px] text-slate-500 font-medium block mt-1.5">
                      * โปรดวางรายชื่อพนักงาน/ผู้ส่งใน คอลัมน์แรก (คอลัมน์ A) ของ Google Sheet เพื่อดึงข้อมูลมาทำเป็น Dropdown
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      เป้าหมายภารกิจรายวัน (จำนวนเรื่อง)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(Number(e.target.value))}
                      className="w-full text-sm px-4 py-3 border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
                  {settingsError && (
                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {settingsError}
                    </p>
                  )}
                  {settingsSuccess && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      เชื่อมโยงและอัปเดตรายชื่อสำเร็จ!
                    </p>
                  )}
                  {!settingsError && !settingsSuccess && <div />}

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>กำลังซิงค์รายชื่อ...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>บันทึกและซิงค์ข้อมูล</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Display loaded submitters */}
              {db && db.submitters && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wide">
                    รายชื่อผู้ส่งปัจจุบันในระบบ ({db.submitters.length} คน):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded-2xl">
                    {db.submitters.map((sub) => (
                      <span 
                        key={sub.id} 
                        className="text-xs px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-xl shadow-2xs font-bold flex items-center gap-1 transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {sub.name} <span className="text-blue-600 font-extrabold">({sub.points} แต้ม)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION TABS BAR */}
      <div className="bg-white/75 backdrop-blur-md border-b-2 border-slate-200/60 sticky top-[77px] sm:top-[77px] z-30 shadow-xs" id="tabs_navigation">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-4 px-3 text-sm font-bold border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "dashboard"
                ? "border-blue-500 text-blue-600 bg-blue-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
            id="tab_dashboard_btn"
          >
            <TrendingUp className="h-5 w-5" />
            <span>แดชบอร์ดสถิติ & สรุปผล</span>
          </button>

          <button
            onClick={() => setActiveTab("submit")}
            className={`py-4 px-3 text-sm font-bold border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "submit"
                ? "border-orange-500 text-orange-600 bg-orange-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
            id="tab_submit_btn"
          >
            <PlusCircle className="h-5 w-5" />
            <span>ส่งรายงานความสะอาด</span>
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-3 text-sm font-bold border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "history"
                ? "border-amber-500 text-amber-600 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
            id="tab_history_btn"
          >
            <Clock className="h-5 w-5" />
            <span>ประวัติรายงาน ({db?.reports.length || 0})</span>
          </button>
        </div>
      </div>

      {/* CORE WRAPPER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6" id="main_content">
        
        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500" id="loading_spinner">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">
              {language === "th" 
                ? "กำลังโหลดข้อมูลและซิงค์คะแนนสะสม..." 
                : language === "en" 
                ? "Loading data and syncing points..." 
                : "အချက်အလက်များတင်နေပြီး အမှတ်များကို စင့်ခ်လုပ်နေပါသည်..."}
            </p>
          </div>
        )}

        {/* ERROR STATE WITH AUTOMATIC RETRY */}
        {!loading && !db && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center bg-white/80 backdrop-blur-sm border-2 border-slate-100 rounded-3xl shadow-xl max-w-2xl mx-auto my-10" id="error_state_container">
            <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4 animate-pulse">
              <RefreshCw className="h-10 w-10 animate-spin" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2">
              {language === "th" 
                ? "กำลังรอการเชื่อมต่อเซิร์ฟเวอร์..." 
                : language === "en" 
                ? "Waiting for server connection..." 
                : "ဆာဗာချိတ်ဆက်မှုကို စောင့်ဆိုင်းနေပါသည်..."}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              {language === "th" 
                ? "เซิร์ฟเวอร์กำลังเริ่มต้นทำงานหรือกำลังดาวน์โหลดข้อมูลล่าสุด ระบบจะเชื่อมต่อและรีเฟรชหน้าจอนี้โดยอัตโนมัติภายในสักครู่" 
                : language === "en" 
                ? "The server is starting up or downloading the latest data. This page will automatically connect and refresh shortly." 
                : "ဆာဗာသည် စတင်နေပြီး နောက်ဆုံးအချက်အလက်များကို ရယူနေပါသည်။ ဤစာမျက်နှาသည် မကြာမီ အလိုအလျောက် ပြန်လည်စတင်ပါမည်။"}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>
                  {language === "th" 
                    ? "ลองเชื่อมต่อใหม่" 
                    : language === "en" 
                    ? "Retry Connection" 
                    : "ပြန်လည်ကြိုးစားပါ"}
                </span>
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-6 font-mono font-medium">
              Error Details: {fetchError || "Transient connection loss"}
            </p>
          </div>
        )}

        {!loading && db && (
          <>
            {/* DAILY MISSIONS PROGRESS BAR */}
            <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/40 border-2 border-amber-200/80 rounded-3xl p-6 shadow-lg shadow-amber-100/20" id="daily_mission_card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-amber-900 flex items-center gap-2">
                    <Award className="h-6 w-6 text-orange-500 animate-bounce" />
                    {T[language].dailyMission}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800 font-medium">
                    {T[language].dailyMissionDesc}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-orange-900 bg-white px-4 py-1.5 rounded-full border-2 border-orange-200 shadow-2xs">
                    {T[language].todayProgress}: {todayCount} / {targetCount} {language === "th" ? "เรื่อง" : language === "en" ? "report(s)" : "စောင်"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-amber-100/80 h-5.5 rounded-full overflow-hidden p-[2px] border-2 border-amber-200/60">
                <motion.div 
                  className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 h-full rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                >
                  {progressPercent > 5 && (
                    <span className="absolute inset-0 flex items-center justify-end pr-3 text-[10px] font-black text-white leading-none">
                      {progressPercent}%
                    </span>
                  )}
                </motion.div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-900">
                  {progressPercent >= 100 ? (
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      🎉 {language === "th" ? "สำเร็จภารกิจประจำวันนี้แล้ว! ยอดเยี่ยมมาก" : language === "en" ? "Daily mission completed! Excellent job" : "နေ့စဉ်ပန်းတိုင် ပြီးမြောက်ပါပြီ။ ထူးချွန်လွန်းပါတယ်"}
                    </span>
                  ) : (
                    <span>{language === "th" ? `ต้องการอีก ${targetCount - todayCount} เรื่อง เพื่อบรรลุเป้าหมาย` : language === "en" ? `Need ${targetCount - todayCount} more report(s) to reach target` : `ပန်းတိုင်ရောက်ရန် နောက်ထပ် ${targetCount - todayCount} စောင် လိုအပ်ပါသည်`}</span>
                  )}
                </span>
                
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                  <Flame className="h-4 w-4 text-white animate-pulse" />
                  {language === "th" ? "Streak Bonus: +20 แต้มพิเศษสำหรับยอดผู้ส่งสูงสุดของวัน" : language === "en" ? "Streak Bonus: +20 extra points for the top daily reporter" : "နေ့စဉ်အစီရင်ခံသူအများဆုံးအတွက် Streak Bonus +20 အပိုမှတ်"}
                </span>
              </div>
            </div>

            {/* TAB 1: SUBMIT REPORT */}
            {activeTab === "submit" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="submit_view">
                
                {/* SUBMIT FORM & BEFORE/AFTER BLOCKS */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* IMAGES UPLOAD SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* BEFORE IMAGE (LEFT COLUMN) */}
                    <div className="bg-white border-2 border-rose-200 rounded-3xl shadow-md shadow-rose-100/10 p-6 flex flex-col" id="before_card">
                      <div className="flex justify-between items-center mb-4 border-b border-rose-50 pb-2">
                        <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {T[language].beforeLabel}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          {beforeTime && (
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Clock className="h-4 w-4 text-rose-400" />
                              {beforeTime}
                            </span>
                          )}
                          {beforeImage && (
                            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold">
                              {T[language].fileSize(getBase64SizeKb(beforeImage))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview or Upload Zone */}
                      <div 
                        className={`flex-1 min-h-[240px] rounded-[2rem] border-3 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                          beforeImage 
                            ? "border-rose-300 bg-rose-50/10" 
                            : "border-slate-300 hover:border-rose-400 hover:bg-rose-50/50 cursor-pointer"
                        }`}
                        onClick={() => !beforeImage && beforeInputRef.current?.click()}
                      >
                        {beforeImage ? (
                          <>
                            <img 
                              src={beforeImage} 
                              alt="Before clean up" 
                              className="w-full h-full object-cover max-h-[320px]"
                            />
                            <div className="absolute top-3 right-3 flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBeforeImage(null);
                                  setBeforeTime("");
                                }}
                                className="bg-slate-900/95 hover:bg-rose-600 text-white p-2 rounded-xl transition-all shadow-md cursor-pointer"
                                title={language === "th" ? "ลบรูป" : language === "en" ? "Delete photo" : "ဓာတ်ပုံဖျက်ပါ"}
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-6 text-center">
                            <div className="mx-auto w-14 h-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-3 shadow-md shadow-rose-100">
                              <Upload className="h-7 w-7" />
                            </div>
                            <span className="block text-base font-black text-slate-800">{T[language].uploadBefore}</span>
                            <span className="text-xs text-slate-500 block mt-1.5 font-semibold">{T[language].uploadDescBefore}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={beforeInputRef}
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleImageUpload(e, "before")}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* AFTER IMAGE (RIGHT COLUMN) */}
                    <div className="bg-white border-2 border-emerald-200 rounded-3xl shadow-md shadow-emerald-100/10 p-6 flex flex-col" id="after_card">
                      <div className="flex justify-between items-center mb-4 border-b border-emerald-50 pb-2">
                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {T[language].afterLabel}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          {afterTime && (
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Clock className="h-4 w-4 text-emerald-500" />
                              {afterTime}
                            </span>
                          )}
                          {afterImage && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold">
                              {T[language].fileSize(getBase64SizeKb(afterImage))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview or Upload Zone */}
                      <div 
                        className={`flex-1 min-h-[240px] rounded-[2rem] border-3 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                          afterImage 
                            ? "border-emerald-300 bg-emerald-50/10" 
                            : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer"
                        }`}
                        onClick={() => !afterImage && afterInputRef.current?.click()}
                      >
                        {afterImage ? (
                          <>
                            <img 
                              src={afterImage} 
                              alt="After clean up" 
                              className="w-full h-full object-cover max-h-[320px]"
                            />
                            <div className="absolute top-3 right-3 flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAfterImage(null);
                                  setAfterTime("");
                                }}
                                className="bg-slate-900/95 hover:bg-rose-600 text-white p-2 rounded-xl transition-all shadow-md cursor-pointer"
                                title={language === "th" ? "ลบรูป" : language === "en" ? "Delete photo" : "ဓာတ်ပုံဖျက်ပါ"}
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-6 text-center">
                            <div className="mx-auto w-14 h-14 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-md shadow-emerald-100">
                              <Upload className="h-7 w-7" />
                            </div>
                            <span className="block text-base font-black text-slate-800">{T[language].uploadAfter}</span>
                            <span className="text-xs text-slate-500 block mt-1.5 font-semibold">{T[language].uploadDescAfter}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={afterInputRef}
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleImageUpload(e, "after")}
                          className="hidden"
                        />
                      </div>
                    </div>

                  </div>

                  {/* FORM FIELDS CARD */}
                  <div className="bg-white border-2 border-blue-100 rounded-3xl shadow-lg shadow-blue-100/10 p-6 space-y-5" id="form_details_card">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 border-b-2 border-blue-50 pb-2.5 flex items-center gap-2">
                      <FileText className="h-5.5 w-5.5 text-blue-500" />
                      {T[language].detailsHeader}
                    </h3>

                    <div>
                      {/* Submitter selector */}
                      <div className="w-full">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                          <User className="h-4.5 w-4.5 text-blue-500" />
                          {T[language].submitterLabel}
                        </label>
                        <select
                          value={selectedSubmitterId}
                          onChange={(e) => setSelectedSubmitterId(e.target.value)}
                          className="w-full text-sm px-4 py-3 border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                          required
                        >
                          <option value="">{T[language].chooseSubmitterOption}</option>
                          {db.submitters.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              👤 {sub.name} ({language === "th" ? "คะแนนรวม" : language === "en" ? "Points" : "စုစုပေါင်းအမှတ်"}: {sub.points} {language === "th" ? "แต้ม" : language === "en" ? "pts" : "အမှတ်"}, Streak: {sub.streak} {language === "th" ? "วัน" : language === "en" ? "days" : "ရက်"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Custom category input if 'others' selected */}
                    {selectedCategory === "อื่นๆ" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-amber-50/50 p-4 rounded-2xl border-2 border-amber-100"
                      >
                        <label className="block text-xs font-bold text-amber-900 mb-1.5 uppercase tracking-wide">
                          {language === "th" ? "ระบุชื่อสถานที่ / โซน / เรื่องอื่นๆ (ภาษาไทย)" : language === "en" ? "Specify Area / Zone / Other Location" : "သန့်ရှင်းရေးလုပ်သည့်နေရာ / အပိုင်း / အခြား"}
                        </label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder={language === "th" ? "เช่น สวนหย่อมด้านหน้า, ระเบียงชั้น 3" : language === "en" ? "e.g., Front garden, 3rd floor balcony" : "ဥပမာ- ရှေ့ပန်းခြံ၊ ၃ ထပ် ဝရန်တာ"}
                          className="w-full text-sm px-4 py-3 border-2 border-amber-200 bg-white rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 outline-none text-slate-800 font-bold"
                        />
                      </motion.div>
                    )}

                    {/* Error display if any */}
                    {imageError && (
                      <p className="text-sm text-rose-600 font-bold flex items-center gap-2 bg-rose-50 p-4 rounded-2xl border-2 border-rose-100">
                        <AlertCircle className="h-5.5 w-5.5 shrink-0 text-rose-500" />
                        {imageError}
                      </p>
                    )}

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:to-red-600 text-white font-black rounded-2xl text-base shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                        id="submit_report_btn"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>{T[language].submittingText}</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-6 w-6 font-black" />
                            <span>{T[language].submitBtnText}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </form>

                {/* SIDEBAR: LEADERBOARD & RECENT BONUS */}
                <div className="flex flex-col gap-6" id="leaderboard_sidebar">
                  
                  {/* HERO STATS */}
                  <div className="bg-gradient-to-br from-blue-950 via-[#1E3A8A] to-slate-900 text-white rounded-3xl p-6 shadow-xl border-2 border-blue-800 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-15">
                      <Trophy className="h-32 w-32 text-amber-400" />
                    </div>
                    
                    <div className="relative z-10">
                      <span className="text-[10px] font-black text-orange-300 bg-orange-500/20 border-2 border-orange-500/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        👑 {language === "th" ? "อันดับนักกวาดถูดีเด่น" : language === "en" ? "Top Cleaners Leaderboard" : "သန့်ရှင်းရေးထူးချွန်သူများစာရင်း"}
                      </span>
                      <h3 className="text-xl font-black mt-3.5 flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-amber-400 animate-pulse" />
                        {T[language].leaderboardTitle}
                      </h3>
                      <p className="text-xs text-blue-200 font-medium mt-1">
                        {T[language].leaderboardSub}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3.5 relative z-10 max-h-[250px] overflow-y-auto pr-1">
                      {sortedSubmitters.slice(0, 5).map((sub, index) => {
                        const medalColor = index === 0 ? "text-amber-400 bg-amber-500/20 border-2 border-amber-400/40" : index === 1 ? "text-slate-200 bg-slate-100/20 border-2 border-slate-300/30" : index === 2 ? "text-orange-400 bg-orange-500/20 border-2 border-orange-500/30" : "text-blue-300 bg-blue-100/5 border-transparent";
                        const isChampion = index === 0;

                        return (
                          <div key={sub.id} className="flex items-center justify-between border-b border-blue-900/60 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center ${medalColor}`}>
                                {index + 1}
                              </span>
                              <div>
                                <span className="text-sm font-black flex items-center gap-1.5 text-slate-100">
                                  {sub.name}
                                  {isChampion && <Sparkles className="h-4 w-4 text-amber-400" />}
                                </span>
                                <span className="text-[10px] text-blue-300 font-bold flex items-center gap-1 mt-0.5">
                                  <Flame className="h-3 w-3 text-orange-400 inline" /> Streak: {sub.streak} {language === "th" ? "วัน" : language === "en" ? "days" : "ရက်"}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-black text-amber-400 bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-400/25">
                              {sub.points} {language === "th" ? "แต้ม" : language === "en" ? "pts" : "အမှတ်"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STREAK BONUS LOG CARD */}
                  <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-lg shadow-amber-100/10 flex flex-col">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
                      <Award className="h-5.5 w-5.5 text-orange-500" />
                      {language === "th" ? "รางวัลโบนัสแต้มพิเศษย้อนหลัง" : language === "en" ? "Daily Streak Bonus History" : "ယခင်အထူးအမှတ် Streak Bonus ရရှိသူများ"}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
                      {language === "th" ? "ผู้ส่งรายงานสูงสุดในแต่ละวัน จะได้รับโบนัส Streak +20 แต้มพิเศษเมื่อเริ่มวันถัดไป!" : language === "en" ? "Top daily submitter receives a +20 Streak Bonus on the next day!" : "နေ့စဉ်အစီရင်ခံစာအများဆုံးတင်သွင်းသူသည် နောက်တစ်နေ့တွင် Streak Bonus +၂၀ အပိုမှတ် ရရှိပါမည်!"}
                    </p>

                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {db.streakBonusWinners.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                          <p className="text-xs text-slate-400 font-bold">{language === "th" ? "ยังไม่มีการแจกรางวัล Streak Bonus" : language === "en" ? "No Streak Bonus awarded yet" : "Streak Bonus ရရှိသူ မရှိသေးပါ"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{language === "th" ? "เริ่มส่งรายงานสูงสุดในวันนี้เพื่อรับแต้มพิเศษพรุ่งนี้!" : language === "en" ? "Be the top reporter today to win bonus points tomorrow!" : "မနက်ဖြန်အပိုမှတ်ရရန် ယနေ့အစီရင်ခံစာအများဆုံး စတင်ပေးပို့ပါ!"}</p>
                        </div>
                      ) : (
                        [...db.streakBonusWinners].reverse().map((bonus, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-2xl shadow-2xs">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                                <Trophy className="h-4 w-4" />
                              </span>
                              <div>
                                <span className="text-xs font-black text-slate-800 block">
                                  {bonus.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                                  {language === "th" ? `ยอดเยี่ยมของวันที่ ${bonus.date}` : language === "en" ? `Top cleaner of ${bonus.date}` : `${bonus.date} ၏ အကောင်းဆုံးသန့်ရှင်းရေးသမား`}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-orange-700 bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 shrink-0 shadow-2xs">
                              +{bonus.points} {language === "th" ? "แต้มพิเศษ" : language === "en" ? "Extra Points" : "အပိုမှတ်"}!
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: STATISTICS DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-fade-in" id="dashboard_view">
                
                {/* METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-gradient-to-br from-blue-50/60 to-white border-2 border-blue-100 rounded-3xl p-5 shadow-md flex items-center gap-4">
                    <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-sm shadow-blue-500/20">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">{language === "th" ? "จำนวนรายงานรวม" : language === "en" ? "Total Reports" : "စုစုပေါင်း အစီရင်ခံစာ"}</span>
                      <span className="text-2xl font-black text-blue-900">{db.reports.length} {language === "th" ? "ครั้ง" : language === "en" ? "time(s)" : "ကြိမ်"}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50/60 to-white border-2 border-orange-100 rounded-3xl p-5 shadow-md flex items-center gap-4">
                    <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-sm shadow-orange-500/20">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">{language === "th" ? "ผู้ส่งที่เปิดใช้งาน" : language === "en" ? "Active Submitters" : "လက်ရှိ ပေးပို့သူများ"}</span>
                      <span className="text-2xl font-black text-orange-900">{db.submitters.length} {language === "th" ? "ราย" : language === "en" ? "person(s)" : "ဦး"}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50/60 to-white border-2 border-amber-100 rounded-3xl p-5 shadow-md flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm shadow-amber-500/20">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">{language === "th" ? "Streak สูงสุดช่วงนี้" : language === "en" ? "Current Max Streak" : "လက်ရှိအမြင့်ဆုံး ဆက်တိုက်လုပ်ဆောင်မှု"}</span>
                      <span className="text-2xl font-black text-amber-900">
                        {Math.max(...db.submitters.map(s => s.streak), 0)} {language === "th" ? "วัน" : language === "en" ? "day(s)" : "ရက်"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50/60 to-white border-2 border-rose-100 rounded-3xl p-5 shadow-md flex items-center gap-4">
                    <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-sm shadow-rose-500/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">{language === "th" ? "เรื่องวันนี้ / เป้าหมาย" : language === "en" ? "Today's Reports / Target" : "ယနေ့အစီရင်ခံစာ / ပန်းတိုင်"}</span>
                      <span className="text-2xl font-black text-rose-900">{todayCount} / {targetCount}</span>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* SUBMITTERS & COMPACT IMAGES LIST */}
                  <div className="lg:col-span-2 bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-lg shadow-blue-100/5 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                          <User className="h-5.5 w-5.5 text-blue-500" />
                          {T[language].submittersAndCompact}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          {T[language].submittersAndCompactSub}
                        </p>
                      </div>
                      
                      {/* Localized Date Badge & Auto-Reset Status */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 bg-blue-50/50 border border-blue-100 p-3 rounded-2xl">
                        <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {getThaiFormattedDate()}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {language === "th" ? "รีเซ็ตเป้าหมายอัตโนมัติทุกวัน" : language === "en" ? "Auto-reset daily" : "နေ့စဉ် အလိုအလျောက် ပြန်လည်သတ်မှတ်ပါ"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: language === "th" ? "ล้างรายงานวันนี้" : language === "en" ? "Reset Today's Reports" : "ယနေ့အစီရင်ခံစာများ ပြန်လည်သတ်မှတ်မည်",
                                message: language === "th" ? "คุณต้องการล้างรายงานและสถิติทั้งหมดของวันนี้ใช่หรือไม่? (คะแนนผู้จัดทำของวันนี้จะถูกหักออก)" : language === "en" ? "Are you sure you want to reset all reports and statistics for today? (Points earned today will be deducted)" : "ယနေ့အတွက် အစီရင်ခံစာများနှင့် စာရင်းဇယားအားလုံးကို ပြန်လည်သတ်မှတ်ရန် သေချာပါသလား? (ယနေ့ရရှိထားသော အမှတ်များ နုတ်ယူခံရမည်ဖြစ်သည်)",
                                confirmText: language === "th" ? "ล้างวันนี้" : language === "en" ? "Reset Today" : "ယနေ့ ပြန်လည်သတ်မှတ်ပါ",
                                cancelText: language === "th" ? "ยกเลิก" : language === "en" ? "Cancel" : "ပယ်ဖျက်မည်",
                                onConfirm: async () => {
                                  try {
                                    const response = await fetch("/api/reset-today", { method: "POST" });
                                    const result = await response.json();
                                    if (result.success) {
                                      setDb(result.db);
                                      triggerToast(language === "th" ? "รีเซ็ตสถิติและข้อมูลประจำวันเรียบร้อยแล้ว!" : language === "en" ? "Successfully reset today's statistics!" : "ယနေ့ စာရင်းဇယားများကို အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ!", "success");
                                    }
                                  } catch (e) {
                                    console.error("Error resetting today's data:", e);
                                    triggerToast(language === "th" ? "เกิดข้อผิดพลาดในการล้างข้อมูล" : language === "en" ? "Failed to reset today's statistics" : "ယနေ့ စာရင်းဇယား ပြန်လည်သတ်မှတ်ရန် မအောင်မြင်ပါ", "error");
                                  } finally {
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  }
                                }
                              });
                            }}
                            className="text-[9px] bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-black px-2 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            {language === "th" ? "รีเซ็ตวันนี้" : language === "en" ? "Reset Today" : "ယနေ့ ပြันလည်သတ်မှတ်ပါ"}
                          </button>
                        </div>
                      </div>
                    </div>
 
                    {sortedSubmitters.filter(sub => todayReports.some(r => r.submitterId === sub.id)).length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                        <User className="h-12 w-12 text-slate-200 mb-2" />
                        <span className="text-sm font-bold">{T[language].noSubmittersToday}</span>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1 max-h-[380px] overflow-y-auto pr-1">
                        {sortedSubmitters
                          .filter(sub => todayReports.some(r => r.submitterId === sub.id))
                          .map((sub, index) => {
                            const subReports = db.reports.filter(r => r.submitterId === sub.id);
                            const latestReports = [...subReports]
                              .sort((a, b) => new Date(b.createdTimestamp || 0).getTime() - new Date(a.createdTimestamp || 0).getTime())
                              .slice(0, 3);
                            
                            const medalColor = index === 0 ? "bg-amber-100 text-amber-700 border-amber-300" : index === 1 ? "bg-slate-100 text-slate-700 border-slate-300" : index === 2 ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-slate-50 text-slate-600 border-slate-200";
 
                          return (
                            <div key={sub.id} className="p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-200">
                              
                              {/* Left Info Column */}
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center border shadow-xs ${medalColor}`}>
                                  {index + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-slate-800">{sub.name}</span>
                                    {sub.streak > 0 && (
                                      <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                                        <Flame className="h-3 w-3 fill-orange-500 text-orange-500 animate-pulse" />
                                        {sub.streak} {language === "th" ? "วัน" : language === "en" ? "days" : "ရက်"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                                    <span className="text-blue-600 font-black">🏆 {sub.points} {language === "th" ? "แต้ม" : language === "en" ? "pts" : "အမှတ်"}</span>
                                    <span>•</span>
                                    <span>{language === "th" ? `รายงานทั้งหมด: ${subReports.length} ครั้ง` : language === "en" ? `Total Reports: ${subReports.length}` : `စုစုပေါင်း အစီရင်ခံစာ: ${subReports.length} ကြိမ်`}</span>
                                  </div>
                                </div>
                              </div>
 
                              {/* Right Thumbnails Row */}
                              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-full sm:max-w-[240px] md:max-w-[320px]">
                                {latestReports.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-bold italic py-1">{language === "th" ? "ยังไม่มีการส่งรูปถ่าย" : language === "en" ? "No photos submitted" : "ဓာတ်ပုံများ မတင်ရသေးပါ"}</span>
                                ) : (
                                  latestReports.map((report) => (
                                    <div key={report.id} className="relative group shrink-0 border border-slate-200 rounded-xl p-1 bg-white flex items-center gap-1 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all" title={`${language === "th" ? "งาน:" : language === "en" ? "Job:" : "အလုပ်:"} ${CATEGORY_TRANSLATIONS[report.category]?.[language] || report.category} (${report.createdAt})`}>
                                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                                        <img 
                                          src={report.beforeImage} 
                                          className="w-full h-full object-cover" 
                                          alt="B" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <span className="absolute bottom-0 right-0 text-[7px] bg-rose-600 text-white font-black px-0.5 rounded-tl-md scale-90">B</span>
                                      </div>
                                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                                        <img 
                                          src={report.afterImage} 
                                          className="w-full h-full object-cover" 
                                          alt="A" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <span className="absolute bottom-0 right-0 text-[7px] bg-emerald-600 text-white font-black px-0.5 rounded-tl-md scale-90">A</span>
                                      </div>
                                      
                                      {/* Mini category tag overlay on hover or small badge */}
                                      <span className="absolute -top-1.5 -right-1 text-[8px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-black scale-80 border border-white max-w-[50px] truncate shadow-xs">
                                        {CATEGORY_TRANSLATIONS[report.category]?.[language]?.slice(0, 3) || report.category.slice(0, 3)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
 
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE CONTRIBUTOR OF THE DAY */}
                  <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-lg shadow-amber-100/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                        <Award className="h-5.5 w-5.5 text-orange-500" />
                        {language === "th" ? "ผู้ส่งสูงสุดประจำวัน" : language === "en" ? "Top Submitter of the Day" : "ယနေ့အများဆုံး တင်သွင်းသူ"}
                      </h3>
                      <p className="text-xs text-slate-500 mb-5 font-semibold">
                        {language === "th" ? "ผู้สร้างผลงานสะสมความสะอาดมากที่สุดเพื่อคว้ารางวัลโบนัสวันนี้" : language === "en" ? "The submitter with the most reports to win today's bonus" : "ယနေ့အပိုမှတ်ရရန် အစီရင်ခံစာအများဆုံး တင်သွင်းထားသူ"}
                      </p>

                      {todayLeader ? (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-200 rounded-2xl p-5 text-center shadow-md shadow-amber-100/10 relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <Trophy className="h-10 w-10 text-amber-500/15" />
                          </div>
                          
                          <div className="w-16 h-16 bg-white text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-orange-200 shadow-sm">
                            <User className="h-8 w-8" />
                          </div>
                          
                          <h4 className="text-base font-black text-slate-800">
                            {todayLeader[1].name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 font-bold">
                            {language === "th" ? "วันนี้ส่งไปแล้ว" : language === "en" ? "Submitted" : "ယနေ့တင်ပြပြီး"} <strong className="text-orange-600 font-extrabold text-sm">{todayLeader[1].count}</strong> {language === "th" ? "เรื่อง" : language === "en" ? "report(s)" : "စောင်"}
                          </p>
                          
                          <div className="mt-4 pt-3 border-t-2 border-amber-200/30 text-[11px] text-orange-800 font-black flex items-center justify-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                            {language === "th" ? "จ่อรับ Streak Bonus +20 คะแนนคืนนี้!" : language === "en" ? "Winning +20 Streak Bonus tonight!" : "ယနေ့ည Streak Bonus +၂၀ အမှတ် ရရှိရန် အလားအလာရှိသည်!"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 border-2 border-dashed border-amber-200/50 rounded-2xl bg-amber-50/25">
                          <p className="text-xs text-slate-400 font-bold">{language === "th" ? "ยังไม่มีการทำรายงานในวันนี้" : language === "en" ? "No reports submitted today" : "ယနေ့အတွက် အစီရင်ခံစာ မရှိသေးပါ"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{language === "th" ? "ส่งรายงานรายแรกของวันเพื่อเป็นผู้นำ Leaderboard!" : language === "en" ? "Submit the first report to lead the leaderboard!" : "Leaderboard တွင် ဦးဆောင်ရန် ယနေ့ပထမဆုံးအစီရင်ခံစာ ပေးပို့ပါ!"}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="text-xs bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl p-3.5 leading-relaxed font-semibold">
                        💡 <strong>{language === "th" ? "กติการางวัล:" : language === "en" ? "Rules:" : "စည်းကမ်းချက်-"}</strong> {language === "th" ? "ระบบจะประมวลผลให้โบนัสอัตโนมัติแก่ผู้ที่ส่งสูงสุดของวัน และผู้รับโบนัสจะต้องมีคะแนนส่งมากกว่า 1 รายการขึ้นไปเพื่อรักษาเป้าหมาย" : language === "en" ? "Bonus is automatically awarded to the top submitter of the day (minimum 2 reports required)." : "တစ်နေ့တာ အစီရင်ခံစာ အများဆုံး ပေးပို့သူကို အလိုအလျောက် အပိုမှတ်ပေးပါမည် (အနည်းဆုံး အစီရင်ခံစာ ၂ စောင် တင်ပြရပါမည်)။"}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 3: REPORT HISTORY & COLLAGE JPG DOWNLOADS */}
            {activeTab === "history" && (
              <div className="space-y-6 animate-fade-in" id="history_view">
                
                {/* FILTERS WIDGET */}
                <div className="bg-white border-2 border-slate-200/80 rounded-[2rem] p-6 shadow-md" id="history_filters_card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-500" />
                        {language === "th" ? "ตัวเลือกการคัดกรอง & ดูย้อนหลัง" : language === "en" ? "Filter Options & History" : "ရှာဖွေမှုစစ်ထုတ်ခြင်းနှင့် ယခင်မှတ်တမ်းများ"}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {language === "th" ? "ค้นหาและดูรายงานตามเรื่อง พื้นที่ หรือเลือกวันที่ต้องการเรียกดูย้อนหลัง" : language === "en" ? "Search and filter reports by zone, area, or selected date" : "အစီရင်ခံစာများကို သတ်မှတ်ထားသော နေရာ သို့မဟုတ် နေ့ရက်အလိုက် ရှာဖွေနိုင်ပါသည်"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setFilterCategory("ทั้งหมด");
                          setFilterDate("ทั้งหมด");
                          setCustomFilterDate("");
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        {language === "th" ? "ล้างการกรองทั้งหมด" : language === "en" ? "Clear All Filters" : "စစ်ထုတ်မှုအားလုံးကို ဖျက်ပါ"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-5">
                    {/* Date Filter */}
                    <div className="space-y-2.5 max-w-xl">
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wide">
                        📅 {language === "th" ? "เลือกช่วงเวลาดูย้อนหลัง" : language === "en" ? "Select Date Period" : "ရက်စွဲအပိုင်းအခြားကို ရွေးချယ်ပါ"}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-1.5">
                          {[
                            { label: language === "th" ? "ทั้งหมด" : language === "en" ? "All" : "အားလုံး", value: "ทั้งหมด" },
                            { label: language === "th" ? "วันนี้" : language === "en" ? "Today" : "ယနေ့", value: "วันนี้" },
                            { label: language === "th" ? "เมื่อวาน" : language === "en" ? "Yesterday" : "မနေ့က", value: "เมื่อวาน" }
                          ].map(item => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setFilterDate(item.value);
                                if (item.value !== "custom") {
                                  setCustomFilterDate("");
                                }
                              }}
                              className={`py-2 px-1.5 text-[11px] font-black rounded-xl border-2 transition-all cursor-pointer text-center ${
                                filterDate === item.value
                                  ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 flex gap-1.5 items-center">
                          <button
                            type="button"
                            onClick={() => setFilterDate("custom")}
                            className={`py-2 px-3 text-[11px] font-black rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                              filterDate === "custom"
                                ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {language === "th" ? "กำหนดเอง" : language === "en" ? "Custom" : "စိတ်ကြိုက်"}
                          </button>
                          {filterDate === "custom" ? (
                            <input
                              type="date"
                              value={customFilterDate}
                              onChange={(e) => setCustomFilterDate(e.target.value)}
                              className="flex-1 text-xs px-2.5 py-1.5 border-2 border-slate-200 bg-white rounded-xl focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic flex-1">
                              {filterDate === "ทั้งหมด" 
                                ? (language === "th" ? "แสดงประวัติทั้งหมด" : language === "en" ? "Showing all history" : "မှတ်တမ်းအားလုံးကို ပြသနေပါသည်") 
                                : filterDate === "วันนี้" 
                                ? (language === "th" ? "แสดงเฉพาะงานวันนี้" : language === "en" ? "Showing only today's reports" : "ယနေ့အစီရင်ခံစာများကိုသာ ပြသနေပါသည်") 
                                : (language === "th" ? "แสดงงานเมื่อวาน" : language === "en" ? "Showing yesterday's reports" : "မနေ့ကအစီရင်ခံစာများကို ပြသနေပါသည်")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIMELINE LIST OF REPORTS */}
                {filteredReportsList.length === 0 ? (
                  <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-12 text-center text-slate-400" id="no_reports_fallback">
                    <FileText className="h-14 w-14 mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-black text-slate-700">{language === "th" ? "ไม่พบรายงานทำความสะอาดตามเงื่อนไขที่เลือก" : language === "en" ? "No cleaning reports found matching selected criteria" : "ရွေးချယ်ထားသော အချက်အလက်နှင့် ကိုက်ညီသည့် အစီရင်ခံစာ မတွေ့ပါ"}</p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{language === "th" ? "ลองเปลี่ยนตัวเลือกการคัดกรอง หรือเริ่มทำความสะอาดและสร้างรายงานความสะอาดของคุณได้ทันที!" : language === "en" ? "Try changing filters or submit a new report now!" : "စစ်ထုတ်မှုကို ပြောင်းလဲပါ သို့မဟုတ် ယခုပင် အစီရင်ခံစာအသစ် တင်သွင်းပါ!"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="reports_grid">
                    {filteredReportsList
                      .map((report) => (
                        <div key={report.id} className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-[2rem] shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
                          
                          {/* Header of Report Card */}
                          <div className="px-5 py-4.5 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-sky-400 text-white rounded-full flex items-center justify-center font-black text-sm shadow-sm">
                                {report.submitterName.slice(0, 2)}
                              </div>
                              <div>
                                <span className="text-sm font-black text-slate-800 block leading-tight">{report.submitterName}</span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-bold">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {language === "th" ? "วันที่:" : language === "en" ? "Date:" : "နေ့စွဲ:"} {report.createdAt}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-black text-slate-700 bg-white border-2 border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                                📁 {CATEGORY_TRANSLATIONS[report.category]?.[language] || report.category}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-extrabold">
                                {language === "th" ? "+10 แต้มสำเร็จ!" : language === "en" ? "+10 Points Success!" : "+၁၀ အမှတ်ရရှိပြီး!"}
                              </span>
                            </div>
                          </div>

                          {/* Side-by-side Images Preview */}
                          <div className="grid grid-cols-2 bg-slate-900 aspect-video relative mx-4 my-3 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner">
                            {/* Before Image */}
                            <div className="relative border-r-2 border-slate-800 overflow-hidden">
                              <img 
                                src={report.beforeImage} 
                                alt="Before Clean" 
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 text-[9px] font-black tracking-wider bg-rose-600 text-white px-2.5 py-1 rounded-lg shadow-md">
                                {language === "th" ? "ก่อนกวาดถู" : language === "en" ? "BEFORE" : "သန့်ရှင်းရေးမလုပ်မီ"}
                              </span>
                            </div>
                            
                            {/* After Image */}
                            <div className="relative overflow-hidden">
                              <img 
                                src={report.afterImage} 
                                alt="After Clean" 
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 text-[9px] font-black tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-lg shadow-md">
                                {language === "th" ? "หลังกวาดถู" : language === "en" ? "AFTER" : "သန့်ရှင်းရေးလုပ်ပြီးနောက်"}
                              </span>
                            </div>
                          </div>

                          {/* Bottom controls */}
                          <div className="px-5 py-4 bg-white border-t border-slate-100 flex items-center justify-between mt-auto gap-2">
                            <div className="text-[11px] text-slate-500 font-bold leading-tight">
                              <span className="block text-slate-400">{language === "th" ? "เวลาก่อนทำ:" : language === "en" ? "Before:" : "မလုပ်မီအချိန်:"} {report.beforeTime.split(' ')[1] || "N/A"}</span>
                              <span className="block text-slate-400">{language === "th" ? "เวลาหลังทำ:" : language === "en" ? "After:" : "ပြီးနောက်အချိန်:"} {report.afterTime.split(' ')[1] || "N/A"}</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="flex items-center justify-center p-2.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer"
                                title={language === "th" ? "ลบรายงานนี้" : language === "en" ? "Delete report" : "အစီရင်ခံစာဖျက်မည်"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => downloadComparisonCollage(report)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-xs bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black border-none rounded-xl shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                title={language === "th" ? "ดาวน์โหลดภาพเปรียบเทียบ Before/After ขนาดเต็มเป็น JPG" : language === "en" ? "Download full-size Before/After comparison JPG" : "ပုံနှိုင်းယှဉ်ချက် JPG ကို ဒေါင်းလုဒ်ဆွဲပါ"}
                              >
                                <Download className="h-4 w-4" />
                                <span>{language === "th" ? "ดาวน์โหลด JPG" : language === "en" ? "Download JPG" : "JPG ဒေါင်းလုဒ်"}</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                  </div>
                )}

              </div>
            )}

          </>
        )}

      </main>

      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="custom_confirm_modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-[2rem] p-6 shadow-2xl border-2 border-slate-100 flex flex-col relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0 border border-rose-100">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-800">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 font-semibold mt-2 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  {confirmModal.cancelText || "ยกเลิก"}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {confirmModal.confirmText || "ยืนยัน"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-center gap-3"
            id="custom_toast"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === "success" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : toast.type === "error" 
                ? "bg-rose-500/20 text-rose-400" 
                : "bg-blue-500/20 text-blue-400"
            }`}>
              {toast.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : toast.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-200 flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS POPUP MODAL (CONGRATS +10 POINTS WITH ANIMATION) */}
      <AnimatePresence>
        {showSubmitSuccess && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="success_modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-[2.5rem] p-6 shadow-2xl border-3 border-orange-200 text-center relative overflow-hidden"
            >
              {/* Sparkle background elements */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
              
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-100 to-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-200 mt-2 shadow-md">
                <CheckCircle className="h-10 w-10 animate-bounce" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xl font-black text-slate-800">{language === "th" ? "ส่งรายงานความสะอาดแล้ว!" : language === "en" ? "Report Submitted Successfully!" : "အစီရင်ခံစာ ပေးပို့ပြီးပါပြီ!"}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-1">{language === "th" ? "ขอบคุณสำหรับความตั้งใจและรักษาความสะอาด" : language === "en" ? "Thank you for keeping the place clean!" : "သန့်ရှင်းရေးကို ဂရုစိုက်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်"}</p>
              </motion.div>

              {/* Big Score counter */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="my-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl inline-block px-8 relative shadow-sm"
              >
                <div className="absolute -top-3.5 -right-3 bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-0.5 animate-pulse">
                  <Flame className="h-3 w-3 text-red-600" />
                  Streak Active!
                </div>
                
                <span className="text-3xl font-black text-orange-600 block tracking-tight animate-pulse">
                  +{successPoints} Points!
                </span>
                <span className="text-[11px] text-amber-900 font-extrabold mt-1 block uppercase tracking-wider">
                  {language === "th" ? "สะสมคะแนนกวาดถูสำเร็จ" : language === "en" ? "Points Earned Successfully" : "အမှတ်များ စုဆောင်းမှု အောင်မြင်သည်"}
                </span>
              </motion.div>

              {/* Streak status message */}
              <div className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-2xl p-3.5 mb-5 font-bold">
                🔥 {language === "th" ? "คุณมี" : language === "en" ? "You have a" : "သင်၌"} <strong>{language === "th" ? `Streak ${successStreak} วันติดต่อกัน` : language === "en" ? `${successStreak}-Day Streak` : `${successStreak} ရက် ဆက်တိုက်လုပ်ဆောင်မှု`}</strong><br />
                {language === "th" ? "รักษายอดผลงานสะสมเพื่อพิชิตโบนัสความสะอาดวันนี้!" : language === "en" ? "Keep up the great work to claim today's bonus!" : "ယနေ့အပိုမှတ်ရရန် သင်၏စွမ်းဆောင်ရည်ကို ဆက်လက်ထိန်းသိမ်းပါ!"}
              </div>

              {/* OK Button */}
              <button
                onClick={() => setShowSubmitSuccess(false)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-black rounded-2xl text-sm shadow-md shadow-blue-500/10 transition-all cursor-pointer hover:scale-[1.01]"
                id="close_success_modal_btn"
              >
                {language === "th" ? "ตกลง, ทำความสะอาดชิ้นต่อไป!" : language === "en" ? "Got it, let's keep cleaning!" : "အိုကေ၊ နောက်တစ်ခု ဆက်လုပ်ကြစို့!"}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-white/40 backdrop-blur-xs border-t-2 border-slate-200/60 py-8 mt-12 text-center text-xs text-slate-500 font-bold" id="app_footer">
        <p className="font-extrabold">ระบบรายงานการทำความสะอาด © 2026</p>
        <p className="mt-1.5 font-medium text-slate-400">บันทึกรูปด้วยเทคโนโลยีฝัง Timestamp เปรียบเทียบผลงาน Before/After ทันที</p>
      </footer>

    </div>
  );
}
