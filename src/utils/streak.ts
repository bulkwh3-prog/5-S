import { Report, StreakBonusWinner } from "../types";

export function computeStreakBonusWinners(reports: Report[]): Record<string, StreakBonusWinner> {
  const winners: Record<string, StreakBonusWinner> = {};
  
  // Group reports by date
  const reportsByDate: Record<string, Report[]> = {};
  reports.forEach(report => {
    const d = report.date || "";
    if (!d) return;
    if (!reportsByDate[d]) {
      reportsByDate[d] = [];
    }
    reportsByDate[d].push(report);
  });

  // For each date, find the person with the most reports
  Object.entries(reportsByDate).forEach(([date, dateReports]) => {
    const counts: Record<string, number> = {};
    dateReports.forEach(r => {
      const submitter = r.submitter;
      if (submitter) {
        counts[submitter] = (counts[submitter] || 0) + 1;
      }
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
      winners[date] = {
        winner: topSubmitter,
        count: maxCount,
        bonus: 50
      };
    }
  });

  return winners;
}
