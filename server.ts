import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Enable parsing of large payloads (for base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploads folder statically
app.use("/uploads", express.static(UPLOADS_DIR));

interface Report {
  id: string;
  submitter: string;
  area: string;
  beforeImage: string; // url
  afterImage: string; // url
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  date: string; // YYYY-MM-DD
  points: number;
}

interface Database {
  submitters: string[];
  googleSheetUrl: string;
  reports: Report[];
  streakBonusWinners: Record<string, { winner: string; count: number; bonus: number }>; // date -> winner stats
}

const DEFAULT_SUBMITTERS = [
  "สมชาย รักสะอาด",
  "สมหญิง ปัดกวาด",
  "วิชัย เช็ดถู",
  "อนงค์ จัดระเบียบ",
  "เกียรติศักดิ์ เงาวับ"
];

const initialDb: Database = {
  submitters: DEFAULT_SUBMITTERS,
  googleSheetUrl: "https://docs.google.com/spreadsheets/d/1FH1qOHjwRvhkSQtR4KYZ930Z97_K2AVloiJCaqs7ArE/edit?gid=0#gid=0",
  reports: [],
  streakBonusWinners: {}
};

// Helper to get Thai local date string (YYYY-MM-DD) in Asia/Bangkok timezone from millisecond timestamp
function getThaiDateStringFromTimestamp(ts: number): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date(ts));
  const year = parts.find(p => p.type === "year")?.value || "";
  const month = parts.find(p => p.type === "month")?.value || "";
  const day = parts.find(p => p.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

// Helper to read DB
function readDb(): Database {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    
    const reports = parsed.reports || [];
    let migrated = false;

    // Migrate report dates if they are in Thai format
    reports.forEach((report: any) => {
      if (!report.date || !/^\d{4}-\d{2}-\d{2}$/.test(report.date)) {
        const ts = Number(report.id);
        if (!isNaN(ts)) {
          report.date = getThaiDateStringFromTimestamp(ts);
          migrated = true;
        } else {
          report.date = getThaiDateStringFromTimestamp(Date.now());
          migrated = true;
        }
      }
    });

    const streakBonusWinners: Record<string, any> = {};
    if (parsed.streakBonusWinners) {
      Object.entries(parsed.streakBonusWinners).forEach(([date, winner]: [string, any]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          // Find matching report to recover the correct ISO date
          const matchingReport = reports.find((r: any) => {
            const ts = Number(r.id);
            if (!isNaN(ts)) {
              const oldDatePart = r.timestamp ? r.timestamp.substring(0, 10) : "";
              return oldDatePart.startsWith(date.substring(0, 5));
            }
            return false;
          });
          if (matchingReport) {
            streakBonusWinners[matchingReport.date] = winner;
            migrated = true;
          } else {
            const todayIso = getThaiDateStringFromTimestamp(Date.now());
            streakBonusWinners[todayIso] = winner;
            migrated = true;
          }
        } else {
          streakBonusWinners[date] = winner;
        }
      });
    }

    const db: Database = {
      submitters: parsed.submitters || DEFAULT_SUBMITTERS,
      googleSheetUrl: parsed.googleSheetUrl || "",
      reports: reports,
      streakBonusWinners: streakBonusWinners
    };

    if (migrated) {
      writeDb(db);
    }

    return db;
  } catch (e) {
    console.error("Error reading database file, resetting to default.", e);
    return initialDb;
  }
}

// Helper to write DB
function writeDb(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// Helper to extract Spreadsheet ID from Google Sheet URL
function extractSpreadsheetId(url: string): string | null {
  // Matches spreadsheet keys from various formats of Google Sheet links
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper to sync from Google Sheet
async function syncFromGoogleSheet(url: string): Promise<string[]> {
  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) {
    throw new Error("URL ของ Google Sheet ไม่ถูกต้อง โปรดตรวจสอบลิงก์อีกครั้ง");
  }

  // Fetch as CSV
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv`;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    // Fallback to secondary export format
    const fallbackUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const fallbackResponse = await fetch(fallbackUrl);
    if (!fallbackResponse.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ โปรดเปิดให้ 'ทุกคนที่มีลิงก์สามารถดูได้' (Anyone with link can view)");
    }
    return parseCsv(await fallbackResponse.text());
  }
  return parseCsv(await response.text());
}

function parseCsv(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/);
  const names: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser for the first column
    // Handle quoted values
    let firstCol = "";
    if (line.startsWith('"')) {
      const nextQuote = line.indexOf('"', 1);
      if (nextQuote !== -1) {
        firstCol = line.substring(1, nextQuote);
      } else {
        firstCol = line;
      }
    } else {
      firstCol = line.split(",")[0];
    }

    firstCol = firstCol.trim();
    // Exclude common headers
    if (
      firstCol && 
      firstCol.toLowerCase() !== "name" && 
      firstCol.toLowerCase() !== "names" && 
      firstCol !== "ชื่อ" && 
      firstCol !== "รายชื่อ" && 
      firstCol !== "ผู้ส่ง"
    ) {
      names.push(firstCol);
    }
  }
  
  // Return unique non-empty names
  return Array.from(new Set(names)).filter(Boolean);
}

// API: Get full dashboard and reports state
app.get("/api/data", (req, res) => {
  const db = readDb();
  res.json(db);
});

// API: Save settings (Manual list of names or Google Sheet URL)
app.post("/api/settings", async (req, res) => {
  try {
    const { submitters, googleSheetUrl } = req.body;
    const db = readDb();

    db.googleSheetUrl = googleSheetUrl || "";
    
    if (googleSheetUrl) {
      try {
        const sheetNames = await syncFromGoogleSheet(googleSheetUrl);
        if (sheetNames.length > 0) {
          db.submitters = sheetNames;
        } else {
          return res.status(400).json({ error: "ไม่พบรายชื่อใน Google Sheet ดังกล่าว" });
        }
      } catch (e: any) {
        return res.status(400).json({ error: e.message || "ล้มเหลวในการเชื่อมต่อ Google Sheet" });
      }
    } else if (Array.isArray(submitters)) {
      db.submitters = submitters.filter(Boolean);
    }

    writeDb(db);
    res.json({ success: true, db });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Force Sync Google Sheet
app.post("/api/sync", async (req, res) => {
  try {
    const db = readDb();
    if (!db.googleSheetUrl) {
      return res.status(400).json({ error: "ไม่มีลิงก์ Google Sheet ที่ตั้งค่าไว้" });
    }

    const sheetNames = await syncFromGoogleSheet(db.googleSheetUrl);
    if (sheetNames.length > 0) {
      db.submitters = sheetNames;
      writeDb(db);
      res.json({ success: true, db });
    } else {
      res.status(400).json({ error: "ไม่พบรายชื่อใน Google Sheet" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการเชื่อมโยง" });
  }
});

// Helper: Save Base64 Image to file
function saveBase64Image(base64Data: string, prefix: string, id: string): string {
  // matches "data:image/jpeg;base64,..."
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If not a valid base64 data URL, return as-is (might be fallback or path)
    return base64Data;
  }
  
  const buffer = Buffer.from(matches[2], "base64");
  const extension = "jpg"; // Convert/save as jpg
  const filename = `${prefix}_${id}.${extension}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

// API: Upload base64 image and return public URL
app.post("/api/upload", (req, res) => {
  try {
    const { image, type } = req.body;
    if (!image) {
      return res.status(400).json({ error: "กรุณาส่งรูปภาพในรูปแบบ Base64" });
    }
    const id = Date.now().toString() + "_" + Math.floor(Math.random() * 1000);
    const imageUrl = saveBase64Image(image, type || "upload", id);
    res.json({ success: true, url: imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Submit a cleaning report
app.post("/api/reports", (req, res) => {
  try {
    const { submitter, area, beforeImage, afterImage, timestamp } = req.body;
    if (!submitter || !area || !beforeImage || !afterImage) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน" });
    }

    const db = readDb();
    const id = Date.now().toString();

    // Parse and save images
    const beforeImageUrl = saveBase64Image(beforeImage, "before", id);
    const afterImageUrl = saveBase64Image(afterImage, "after", id);

    // Calculate correct ISO date (YYYY-MM-DD) based on Asia/Bangkok timezone
    const reportDate = getThaiDateStringFromTimestamp(Number(id));

    const newReport: Report = {
      id,
      submitter,
      area,
      beforeImage: beforeImageUrl,
      afterImage: afterImageUrl,
      timestamp: timestamp || new Date().toLocaleString("th-TH"),
      date: reportDate,
      points: 10
    };

    db.reports.push(newReport);

    // Recalculate Streak Bonus Winner for this date
    // Find the person who has the most reports on this date
    const reportsOnDate = db.reports.filter(r => r.date === reportDate);
    const counts: Record<string, number> = {};
    reportsOnDate.forEach(r => {
      counts[r.submitter] = (counts[r.submitter] || 0) + 1;
    });

    let topSubmitter = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSubmitter = name;
      }
    });

    if (topSubmitter) {
      // Award a streak bonus of +50 points to the top submitter of the day
      db.streakBonusWinners[reportDate] = {
        winner: topSubmitter,
        count: maxCount,
        bonus: 50
      };
    }

    writeDb(db);
    res.json({ success: true, report: newReport, db });
  } catch (error: any) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a report
app.delete("/api/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = db.reports.findIndex(r => r.id === id);
    
    if (index !== -1) {
      const report = db.reports[index];
      // Try to delete image files
      const beforeFilename = path.basename(report.beforeImage);
      const afterFilename = path.basename(report.afterImage);
      
      try {
        fs.unlinkSync(path.join(UPLOADS_DIR, beforeFilename));
        fs.unlinkSync(path.join(UPLOADS_DIR, afterFilename));
      } catch (err) {
        console.error("Could not delete image files, they might have been deleted already", err);
      }

      db.reports.splice(index, 1);

      // Recalculate streak winners for that date
      const reportDate = report.date;
      const reportsOnDate = db.reports.filter(r => r.date === reportDate);
      if (reportsOnDate.length === 0) {
        delete db.streakBonusWinners[reportDate];
      } else {
        const counts: Record<string, number> = {};
        reportsOnDate.forEach(r => {
          counts[r.submitter] = (counts[r.submitter] || 0) + 1;
        });

        let topSubmitter = "";
        let maxCount = 0;
        Object.entries(counts).forEach(([name, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topSubmitter = name;
          }
        });

        if (topSubmitter) {
          db.streakBonusWinners[reportDate] = {
            winner: topSubmitter,
            count: maxCount,
            bonus: 50
          };
        }
      }

      writeDb(db);
      res.json({ success: true, db });
    } else {
      res.status(404).json({ error: "ไม่พบรายการรายงานที่ระบุ" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Edit a report (Submitter and Area)
app.put("/api/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { submitter, area } = req.body;
    if (!submitter || !area) {
      return res.status(400).json({ error: "กรุณาระบุผู้ส่งงานและบริเวณพื้นที่ทำความสะอาด" });
    }

    const db = readDb();
    const report = db.reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "ไม่พบรายการรายงานที่ระบุ" });
    }

    report.submitter = submitter;
    report.area = area;

    // Recalculate streak winners for that date
    const reportDate = report.date;
    const reportsOnDate = db.reports.filter(r => r.date === reportDate);
    const counts: Record<string, number> = {};
    reportsOnDate.forEach(r => {
      counts[r.submitter] = (counts[r.submitter] || 0) + 1;
    });

    let topSubmitter = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSubmitter = name;
      }
    });

    if (topSubmitter) {
      db.streakBonusWinners[reportDate] = {
        winner: topSubmitter,
        count: maxCount,
        bonus: 50
      };
    } else {
      delete db.streakBonusWinners[reportDate];
    }

    writeDb(db);
    res.json({ success: true, db });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware for development, or serve built assets in production
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
