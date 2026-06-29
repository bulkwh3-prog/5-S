import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Request body size limit extended to support base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_FILE = path.join(process.cwd(), "db.json");

// Default list of submitters in case Google Sheet is not configured or fails
const DEFAULT_SUBMITTERS = [
  { id: "sub_1", name: "สมพงษ์ สะอาดดี", points: 150, streak: 3, lastSubmitted: "2026-06-24" },
  { id: "sub_2", name: "สมศรี ใจดี", points: 120, streak: 2, lastSubmitted: "2026-06-25" },
  { id: "sub_3", name: "วิชัย กวาดถู", points: 210, streak: 5, lastSubmitted: "2026-06-25" },
  { id: "sub_4", name: "สุพัตรา รักสะอาด", points: 80, streak: 1, lastSubmitted: "2026-06-23" },
  { id: "sub_5", name: "อานนท์ ปัดเป่า", points: 0, streak: 0, lastSubmitted: "" }
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
  createdAt: string; // Date string: YYYY-MM-DD
  createdTimestamp: string; // ISO datetime
  pointsEarned: number;
}

interface DBState {
  submitters: Submitter[];
  reports: Report[];
  settings: {
    googleSheetUrl: string;
    dailyTarget: number;
  };
  streakBonusWinners: {
    date: string;
    name: string;
    points: number;
  }[];
}

// Initialize database
let db: DBState = {
  submitters: DEFAULT_SUBMITTERS,
  reports: [],
  settings: {
    googleSheetUrl: "",
    dailyTarget: 15
  },
  streakBonusWinners: []
};

// Load database from file if it exists
try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    db = JSON.parse(data);
    // Ensure vital structures are initialized
    if (!db.submitters || db.submitters.length === 0) {
      db.submitters = DEFAULT_SUBMITTERS;
    }
    if (!db.reports) db.reports = [];
    if (!db.settings) db.settings = { googleSheetUrl: "", dailyTarget: 15 };
    if (!db.streakBonusWinners) db.streakBonusWinners = [];
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }
} catch (error) {
  console.error("Failed to load or parse db.json, using defaults:", error);
}

// Active SSE client connections
let sseClients: any[] = [];

function broadcastUpdate() {
  sseClients.forEach(client => {
    try {
      client.write("data: update\n\n");
    } catch (e) {
      // ignore client errors
    }
  });
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    broadcastUpdate();
  } catch (error) {
    console.error("Failed to write to db.json:", error);
  }
}

// Google Sheets URL Parser & Fetcher
async function fetchNamesFromSheet(sheetUrl: string): Promise<string[]> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("ลิ้งค์ Google Sheet ไม่ถูกต้อง กรุณาใช้ลิ้งค์รูปแบบที่แชร์จากบราวเซอร์");
  }
  const spreadsheetId = match[1];
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error("ไม่สามารถดาวน์โหลดไฟล์จาก Google Sheet ได้ กรุณาเปิดแชร์เป็นสาธารณะ (ทุกคนที่มีลิงก์มีสิทธิ์อ่าน)");
  }
  
  const csvText = await response.text();
  const lines = csvText.split(/\r?\n/);
  const names: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // split by comma, clean quotes
    const columns = line.split(',');
    let name = columns[0].replace(/^["']|["']$/g, '').trim();
    
    // Skip generic headers
    if (i === 0 && (
      name.toLowerCase().includes('name') || 
      name.includes('ชื่อ') || 
      name.includes('ผู้ส่ง') || 
      name.includes('รายชื่อ')
    )) {
      continue;
    }
    if (name) {
      names.push(name);
    }
  }
  return names;
}

// Check for daily rollover to award Streak Bonus for "yesterday"
function checkAndAwardStreakBonus() {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  
  // Find last date we awarded a streak bonus
  const lastBonusDate = db.streakBonusWinners.length > 0 
    ? db.streakBonusWinners[db.streakBonusWinners.length - 1].date 
    : "";
    
  // If we haven't awarded a bonus for "yesterday" yet, check if we should
  // To keep it simple and real-time, we look at the reports of previous dates that don't have a bonus awarded.
  // We look for any date with submissions that is earlier than todayStr, and find the winner for it.
  const datesWithSubmissions = Array.from(new Set(db.reports.map(r => r.createdAt)))
    .filter(d => d < todayStr && d > lastBonusDate)
    .sort();

  for (const date of datesWithSubmissions) {
    // Find who had the most reports on this date
    const reportsOnDate = db.reports.filter(r => r.createdAt === date);
    const counts: { [submitterId: string]: { name: string; count: number } } = {};
    
    reportsOnDate.forEach(r => {
      if (!counts[r.submitterId]) {
        counts[r.submitterId] = { name: r.submitterName, count: 0 };
      }
      counts[r.submitterId].count++;
    });

    let maxCount = 0;
    let winners: { id: string; name: string }[] = [];

    Object.entries(counts).forEach(([id, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        winners = [{ id, name: data.name }];
      } else if (data.count === maxCount) {
        winners.push({ id, name: data.name });
      }
    });

    if (maxCount > 0) {
      const bonusPoints = 20; // Streak bonus score
      winners.forEach(winner => {
        // Award points to current submitter state
        const sub = db.submitters.find(s => s.id === winner.id);
        if (sub) {
          sub.points += bonusPoints;
        }
        
        db.streakBonusWinners.push({
          date: date,
          name: winner.name,
          points: bonusPoints
        });
      });
    }
  }
  if (datesWithSubmissions.length > 0) {
    saveDB();
  }
}

// API Routes
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Send initial signal
  res.write("data: connected\n\n");
  
  sseClients.push(res);
  
  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

app.get("/api/data", (req, res) => {
  // Always check streak bonus before returning data
  checkAndAwardStreakBonus();
  res.json(db);
});

// Submit report
app.post("/api/submit", (req, res) => {
  const { submitterId, category, beforeImage, afterImage, beforeTime, afterTime } = req.body;
  
  if (!submitterId || !category || !beforeImage || !afterImage) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลและอัปโหลดรูปให้ครบถ้วน" });
  }

  const submitter = db.submitters.find(s => s.id === submitterId);
  if (!submitter) {
    return res.status(404).json({ error: "ไม่พบรายชื่อผู้ส่งนี้ในระบบ" });
  }

  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const pointsEarned = 10;

  // Create report
  const newReport: Report = {
    id: "rep_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    submitterId,
    submitterName: submitter.name,
    category,
    beforeImage,
    afterImage,
    beforeTime,
    afterTime,
    createdAt: todayStr,
    createdTimestamp: new Date().toISOString(),
    pointsEarned
  };

  // Update submitter's points and streak
  submitter.points += pointsEarned;
  
  // Calculate streak: if last submission was yesterday, streak + 1. If today, streak stays. If older, reset to 1.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  if (submitter.lastSubmitted === yesterdayStr) {
    submitter.streak += 1;
  } else if (submitter.lastSubmitted === todayStr) {
    // Keep current streak
  } else {
    submitter.streak = 1;
  }
  submitter.lastSubmitted = todayStr;

  db.reports.unshift(newReport); // Add to beginning
  
  saveDB();
  
  // After saving, check streak bonus award
  checkAndAwardStreakBonus();

  res.json({ 
    success: true, 
    report: newReport, 
    newPoints: submitter.points,
    newStreak: submitter.streak
  });
});

// Configure Google Sheet URL
app.post("/api/settings", async (req, res) => {
  const { googleSheetUrl, dailyTarget } = req.body;
  
  try {
    if (googleSheetUrl !== undefined) {
      db.settings.googleSheetUrl = googleSheetUrl;
      
      if (googleSheetUrl.trim()) {
        // Fetch new list of names
        const names = await fetchNamesFromSheet(googleSheetUrl);
        
        if (names.length === 0) {
          throw new Error("ไม่พบรายชื่อใน Google Sheet (กรุณากรอกชื่อในคอลัมน์แรก แถวแรกเป็นต้นไป)");
        }
        
        // Map names to submitter structures, preserving existing points/streaks for matching names
        const updatedSubmitters: Submitter[] = names.map((name, index) => {
          const existing = db.submitters.find(s => s.name === name);
          return {
            id: existing ? existing.id : `sub_gs_${Date.now()}_${index}`,
            name,
            points: existing ? existing.points : 0,
            streak: existing ? existing.streak : 0,
            lastSubmitted: existing ? existing.lastSubmitted : ""
          };
        });
        
        db.submitters = updatedSubmitters;
      } else {
        // If sheet URL cleared, revert to default submitters (if none left)
        if (db.submitters.filter(s => s.id.startsWith("sub_gs_")).length > 0) {
          db.submitters = DEFAULT_SUBMITTERS;
        }
      }
    }
    
    if (dailyTarget !== undefined) {
      db.settings.dailyTarget = Number(dailyTarget) || 15;
    }
    
    saveDB();
    res.json({ success: true, db });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheet" });
  }
});

// Reset data (mostly for test/clear)
app.post("/api/reset", (req, res) => {
  db = {
    submitters: DEFAULT_SUBMITTERS.map(s => ({ ...s, points: 0, streak: 0, lastSubmitted: "" })),
    reports: [],
    settings: {
      googleSheetUrl: "",
      dailyTarget: 15
    },
    streakBonusWinners: []
  };
  saveDB();
  res.json({ success: true, db });
});

// Reset today's reports (only reports of todayStr)
app.post("/api/reset-today", (req, res) => {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  
  // Find reports of today and calculate points to deduct
  const todayReports = db.reports.filter(r => r.createdAt === todayStr);
  
  // Deduct points from submitters for today's reports
  todayReports.forEach(report => {
    const sub = db.submitters.find(s => s.id === report.submitterId);
    if (sub) {
      sub.points = Math.max(0, sub.points - report.pointsEarned);
    }
  });

  // Remove today's reports
  db.reports = db.reports.filter(r => r.createdAt !== todayStr);
  
  saveDB();
  res.json({ success: true, db });
});

// Delete a specific report
app.delete("/api/reports/:id", (req, res) => {
  const { id } = req.params;
  const reportIndex = db.reports.findIndex(r => r.id === id);
  if (reportIndex === -1) {
    return res.status(404).json({ error: "ไม่พบรายงานนี้ในระบบ" });
  }

  const report = db.reports[reportIndex];
  
  // Deduct points from the submitter
  const sub = db.submitters.find(s => s.id === report.submitterId);
  if (sub) {
    sub.points = Math.max(0, sub.points - (report.pointsEarned || 10));
  }

  // Remove the report
  db.reports.splice(reportIndex, 1);
  
  saveDB();
  res.json({ success: true, db });
});

// Serve Vite dynamic client in development or client bundle in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cleaning App Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
