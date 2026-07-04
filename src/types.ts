export interface Report {
  id: string;
  submitter: string;
  area: string;
  beforeImage: string; // static URL like /uploads/before_X.jpg
  afterImage: string; // static URL like /uploads/after_X.jpg
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  date: string; // YYYY-MM-DD
  points: number;
}

export interface StreakBonusWinner {
  winner: string;
  count: number;
  bonus: number;
}

export interface DatabaseState {
  submitters: string[];
  googleSheetUrl: string;
  reports: Report[];
  streakBonusWinners: Record<string, StreakBonusWinner>;
}

export const CLEANING_AREAS = [
  "ห้องน้ำ (Restroom)",
  "ห้องครัว / แพนทรี (Kitchen/Pantry)",
  "ห้องทำงาน / ห้องประชุม (Office/Meeting Room)",
  "ทางเดิน / บันได (Hallway/Stairs)",
  "พื้นที่ส่วนกลาง / ล็อบบี้ (Lobby/Common Area)",
  "โต๊ะทำงาน / อุปกรณ์ (Desk/Equipment)",
  "กระจก / หน้าต่าง (Glass/Windows)",
  "ระเบียง / ภายนอกอาคาร (Balcony/Exterior)",
  "ถังขยะ / จุดแยกขยะ (Trash/Recycling Point)"
];
