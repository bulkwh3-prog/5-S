import firebaseConfig from "../../firebase-applet-config.json";

export interface User {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let authChangeCallback: ((user: User, token: string) => void) | null = null;
let authFailureCallback: (() => void) | null = null;

// Dynamically load Google Identity Services SDK
export function loadGsiScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = (window as any).google;
    if (existing?.accounts?.oauth2) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const loaded = (window as any).google;
      if (loaded?.accounts?.oauth2) {
        resolve(loaded);
      } else {
        reject(new Error("Failed to load Google Identity Services SDK"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services SDK"));
    document.head.appendChild(script);
  });
}

/**
 * Upload base64 image to the local server as fallback
 */
export async function uploadImageToServer(base64Data: string, type: string): Promise<string> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Data, type }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`เซิร์ฟเวอร์ตอบกลับด้วยข้อผิดพลาด: ${errText}`);
  }

  const data = await response.json();
  return window.location.origin + data.url;
}

// Handle in-memory cache for accessToken as mandated by the security guidelines
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) authChangeCallback = onAuthSuccess;
  if (onAuthFailure) authFailureCallback = onAuthFailure;

  if (cachedUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  return () => {
    authChangeCallback = null;
    authFailureCallback = null;
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const google = await loadGsiScript();

    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (!response.access_token) {
            reject(new Error("Failed to get access token from Google"));
            return;
          }

          const accessToken = response.access_token;

          try {
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!userInfoRes.ok) {
              throw new Error("Failed to fetch user profile info");
            }
            const userInfo = await userInfoRes.json();

            const user: User = {
              email: userInfo.email || null,
              displayName: userInfo.name || null,
              photoURL: userInfo.picture || null,
              uid: userInfo.sub,
            };

            cachedAccessToken = accessToken;
            cachedUser = user;

            if (authChangeCallback) {
              authChangeCallback(user, accessToken);
            }

            resolve({ user, accessToken });
          } catch (err: any) {
            reject(err);
          }
        },
      });

      client.requestAccessToken({ prompt: "consent" });
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  cachedUser = null;
  if (authFailureCallback) {
    authFailureCallback();
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Upload base64 image to Google Drive, make it readable by "anyone", and return its viewable URL.
 * Falls back to local server upload seamlessly if Drive fails/has permission issues.
 */
export async function uploadImageToDrive(
  base64Data: string,
  filename: string,
  accessToken: string
): Promise<string> {
  try {
    // Clean base64 prefix
    const parts = base64Data.split(",");
    const meta = parts[0];
    const base64Content = parts[1];
    
    const mimeMatch = meta.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const byteString = atob(base64Content);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });

    // 1. Create file metadata
    const metadata = {
      name: filename,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", blob);

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Drive upload failed: ${errText}`);
    }

    const fileData = await uploadResponse.json();
    const fileId = fileData.id;

    // 2. Make the file visible to anyone with the link
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
          }),
        }
      );
    } catch (permError) {
      console.error("Failed to make Drive file public:", permError);
    }

    // Return the viewable URL
    return `https://docs.google.com/uc?export=view&id=${fileId}`;
  } catch (error: any) {
    console.warn("Google Drive upload failed, trying server-side upload fallback...", error);
    try {
      const type = filename.includes("before") ? "before" : "after";
      return await uploadImageToServer(base64Data, type);
    } catch (fallbackError: any) {
      console.error("Fallback upload also failed:", fallbackError);
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${fallbackError.message}`);
    }
  }
}

/**
 * Search Google Drive for an existing spreadsheet named "Sparkle Clean Reports Database"
 */
export async function findExistingSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(
    "name='Sparkle Clean Reports Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Create a new spreadsheet with default tabs and headers.
 */
export async function createNewSpreadsheet(accessToken: string): Promise<string> {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: "Sparkle Clean Reports Database",
      },
      sheets: [
        {
          properties: {
            title: "Reports",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "ID" } },
                    { userEnteredValue: { stringValue: "Submitter" } },
                    { userEnteredValue: { stringValue: "Area" } },
                    { userEnteredValue: { stringValue: "Date" } },
                    { userEnteredValue: { stringValue: "Timestamp" } },
                    { userEnteredValue: { stringValue: "Points" } },
                    { userEnteredValue: { stringValue: "BeforeImage" } },
                    { userEnteredValue: { stringValue: "AfterImage" } },
                  ],
                },
              ],
            },
          ],
        },
        {
          properties: {
            title: "Submitters",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "Name" } },
                  ],
                },
                { values: [{ userEnteredValue: { stringValue: "สมชาย รักสะอาด" } }] },
                { values: [{ userEnteredValue: { stringValue: "สมหญิง ปัดกวาด" } }] },
                { values: [{ userEnteredValue: { stringValue: "วิชัย เช็ดถู" } }] },
                { values: [{ userEnteredValue: { stringValue: "อนงค์ จัดระเบียบ" } }] },
                { values: [{ userEnteredValue: { stringValue: "เกียรติศักดิ์ เงาวับ" } }] },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const data = await response.json();
  return data.spreadsheetId;
}

/**
 * Ensures that the spreadsheet has 'Reports' and 'Submitters' tabs with the correct headers.
 */
export async function ensureSheetSchema(spreadsheetId: string, accessToken: string): Promise<void> {
  try {
    // 1. Get spreadsheet metadata to check existing sheet titles
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to get spreadsheet metadata: ${errText}`);
    }

    const data = await response.json();
    const sheets = data.sheets || [];
    const existingTitles = sheets.map((s: any) => s.properties.title);

    const requests: any[] = [];
    const sheetsToAdd: string[] = [];

    if (!existingTitles.includes("Reports")) {
      requests.push({
        addSheet: {
          properties: {
            title: "Reports",
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      sheetsToAdd.push("Reports");
    }

    if (!existingTitles.includes("Submitters")) {
      requests.push({
        addSheet: {
          properties: {
            title: "Submitters",
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      sheetsToAdd.push("Submitters");
    }

    // 2. Add missing sheets if any
    if (requests.length > 0) {
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        }
      );

      if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        throw new Error(`Failed to add missing sheets: ${errText}`);
      }

      // 3. Write default headers and values to new sheets
      const valueRanges: any[] = [];

      if (sheetsToAdd.includes("Reports")) {
        valueRanges.push({
          range: "Reports!A1:H1",
          values: [["ID", "Submitter", "Area", "Date", "Timestamp", "Points", "BeforeImage", "AfterImage"]],
        });
      }

      if (sheetsToAdd.includes("Submitters")) {
        valueRanges.push({
          range: "Submitters!A1:A6",
          values: [
            ["Name"],
            ["สมชาย รักสะอาด"],
            ["สมหญิง ปัดกวาด"],
            ["วิชัย เช็ดถู"],
            ["อนงค์ จัดระเบียบ"],
            ["เกียรติศักดิ์ เงาวับ"],
          ],
        });
      }

      if (valueRanges.length > 0) {
        const writeResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate?valueInputOption=USER_ENTERED`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: valueRanges }),
          }
        );

        if (!writeResponse.ok) {
          const errText = await writeResponse.text();
          throw new Error(`Failed to initialize sheet headers: ${errText}`);
        }
      }
    }
  } catch (error: any) {
    console.error("ensureSheetSchema error:", error);
    throw new Error(`ไม่สามารถตรวจสอบสเปรดชีตได้: ${error.message}`);
  }
}

/**
 * Fetch reports and submitters list from the spreadsheet.
 */
export async function fetchSheetData(
  spreadsheetId: string,
  accessToken: string
): Promise<{ reports: any[]; submitters: string[] }> {
  // Fetch multiple ranges in one batch
  const ranges = ["Reports!A2:H1000", "Submitters!A2:A200"];
  const rangeQuery = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join("&");
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeQuery}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to read spreadsheet data: ${errText}`);
  }

  const data = await response.json();
  const valueRanges = data.valueRanges || [];

  // Parse Reports
  const reportsRows = valueRanges[0]?.values || [];
  const reports = reportsRows.map((row: any) => ({
    id: row[0] || "",
    submitter: row[1] || "",
    area: row[2] || "",
    date: row[3] || "",
    timestamp: row[4] || "",
    points: Number(row[5]) || 10,
    beforeImage: row[6] || "",
    afterImage: row[7] || "",
  }));

  // Parse Submitters
  const submittersRows = valueRanges[1]?.values || [];
  const submitters = submittersRows
    .map((row: any) => row[0]?.trim())
    .filter(Boolean);

  return { reports, submitters };
}

/**
 * Append a report to the Reports sheet.
 */
export async function appendReportToSheet(
  spreadsheetId: string,
  report: any,
  accessToken: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Reports!A2:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: "Reports!A2",
        majorDimension: "ROWS",
        values: [
          [
            report.id,
            report.submitter,
            report.area,
            report.date,
            report.timestamp,
            report.points,
            report.beforeImage,
            report.afterImage,
          ],
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append report to Google Sheet: ${errText}`);
  }
}

/**
 * Delete a report from Google Sheet by overwriting Reports tab
 */
export async function overwriteReportsInSheet(
  spreadsheetId: string,
  reports: any[],
  accessToken: string
) {
  // Clear original Reports data from A2 to H1000
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Reports!A2:H1000:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (reports.length === 0) return;

  const values = reports.map((report) => [
    report.id,
    report.submitter,
    report.area,
    report.date,
    report.timestamp,
    report.points,
    report.beforeImage,
    report.afterImage,
  ]);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Reports!A2?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to overwrite reports in Google Sheet: ${errText}`);
  }
}

/**
 * Update Submitters roster in Google Sheet
 */
export async function overwriteSubmittersInSheet(
  spreadsheetId: string,
  submitters: string[],
  accessToken: string
) {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Submitters!A2:A200:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (submitters.length === 0) return;

  const values = submitters.map(name => [name]);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Submitters!A2?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to save submitters to Google Sheet: ${errText}`);
  }
}
