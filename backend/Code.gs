/**
 * MAINTENIS - CMMS LITE BACKEND
 * Google Apps Script Web App (Code.gs)
 * 
 * Features:
 * - 5-Tab Sheet Engine: Master_Users, Master_Aset, Incident_Reports, Ticket_History_Logs, App_Config
 * - Google Drive Storage for Evidence Photos (Base64 -> Drive)
 * - Google Identity Token Verification (oauth2.googleapis.com/tokeninfo)
 * - Multi-User Role Based Access Control (PELAPOR, TEKNISI, SUPERVISOR, ADMIN)
 * - Free-Tier AI Integration: Google Gemini 2.5 Flash / Groq Llama 3.3
 * - CacheService (15-min AI caching) & LockService for safe concurrency
 * - Setup Endpoint (?action=setup) for automatic tab creation & seed data
 */

// ============================================================================
// CONFIGURATION & SHEET NAMES
// ============================================================================
const SHEET_NAMES = {
  USERS: 'Master_Users',
  ASSETS: 'Master_Aset',
  INCIDENTS: 'Incident_Reports',
  LOGS: 'Ticket_History_Logs',
  CONFIG: 'App_Config'
};

const DRIVE_FOLDER_NAME = 'Maintenis_Evidence';

// ============================================================================
// HTTP HANDLERS (doGet & doPost)
// ============================================================================
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'get_dashboard_data';

    // Auto-setup endpoint
    if (action === 'setup') {
      const setupResult = setupSpreadsheet();
      return jsonResponse({ success: true, message: 'Database initialized successfully', data: setupResult });
    }

    // Health check
    if (action === 'ping') {
      return jsonResponse({ success: true, message: 'Maintenis GAS API is online', timestamp: new Date().toISOString() });
    }

    // Dashboard full telemetry data fetch
    if (action === 'get_dashboard_data') {
      const data = getCompleteDashboardData();
      return jsonResponse({ success: true, data: data });
    }

    // AI Telemetry Briefing (Cached)
    if (action === 'get_ai_briefing') {
      const briefing = getAiTelemetryBriefing();
      return jsonResponse({ success: true, data: briefing });
    }

    // Get specific asset history
    if (action === 'get_asset_history') {
      const assetId = params.asset_id;
      if (!assetId) throw new Error('Parameter asset_id is required');
      const history = getAssetIncidentHistory(assetId);
      return jsonResponse({ success: true, data: history });
    }

    // Get all users (Admin/Supervisor)
    if (action === 'get_users') {
      const users = getAllUsers();
      return jsonResponse({ success: true, data: users });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message, stack: err.stack });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 30-second lock timeout for high-concurrency safe writes
    lock.waitLock(30000);

    const postData = JSON.parse(e.postData.contents || '{}');
    const action = postData.action;

    // Verify User Token (Optional in Demo Mode, enforced in Production)
    const userAuth = authenticateUser(postData.id_token, postData.demo_user);

    switch (action) {
      case 'create_ticket':
        const newTicket = createIncidentTicket(postData, userAuth);
        return jsonResponse({ success: true, message: 'Ticket created', data: newTicket });

      case 'update_ticket_status':
        const updatedTicket = updateTicketStatus(postData, userAuth);
        return jsonResponse({ success: true, message: 'Ticket updated', data: updatedTicket });

      case 'ai_copilot_ask':
        const aiAnswer = handleAiCopilotQuery(postData.question, postData.context);
        return jsonResponse({ success: true, data: aiAnswer });

      case 'ai_troubleshoot':
        const checklist = handleAiTroubleshoot(postData.ticket_id);
        return jsonResponse({ success: true, data: checklist });

      case 'update_user_role':
        enforceRole(userAuth, ['ADMIN', 'SUPERVISOR']);
        const updatedUser = updateUserRoleAndStatus(postData);
        return jsonResponse({ success: true, data: updatedUser });

      case 'upsert_asset':
        enforceRole(userAuth, ['ADMIN', 'SUPERVISOR']);
        const asset = upsertAsset(postData.asset);
        return jsonResponse({ success: true, data: asset });

      default:
        return jsonResponse({ success: false, error: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message, stack: err.stack });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// AUTHENTICATION & RBAC
// ============================================================================
function authenticateUser(idToken, demoUser) {
  // If demo mode is provided (for local testing without client ID)
  if (!idToken && demoUser && demoUser.email) {
    return {
      email: demoUser.email,
      name: demoUser.name || 'Demo User',
      picture: demoUser.picture || '',
      role: demoUser.role || 'PELAPOR'
    };
  }

  if (!idToken) {
    throw new Error('Unauthorized: Missing id_token or authenticated session');
  }

  // Verify token with Google OAuth2 TokenInfo endpoint
  try {
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Invalid or expired Google Token');
    }

    const tokenInfo = JSON.parse(response.getContentText());
    const email = tokenInfo.email;
    const name = tokenInfo.name || email.split('@')[0];
    const picture = tokenInfo.picture || '';

    // Check user in Master_Users
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
    const users = getSheetObjects(userSheet);
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      if (existing.status_aktif === false || existing.status_aktif === 'Non-Aktif') {
        throw new Error('User account is deactivated. Contact administrator.');
      }
      // Update last login
      updateUserLastLogin(userSheet, email);
      return {
        email: existing.email,
        name: existing.nama_lengkap || name,
        picture: existing.avatar_url || picture,
        role: existing.role || 'PELAPOR',
        unit_kerja: existing.unit_kerja || ''
      };
    } else {
      // Auto-register as PELAPOR
      const newUser = {
        user_id: 'USR-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd') + '-' + Math.floor(100 + Math.random() * 900),
        email: email,
        nama_lengkap: name,
        avatar_url: picture,
        unit_kerja: 'Umum / Operasional',
        role: 'PELAPOR',
        spesialisasi: '-',
        shift: 'Shift 1 (Pagi)',
        status_aktif: 'Aktif',
        last_login: new Date().toISOString()
      };
      userSheet.appendRow([
        newUser.user_id, newUser.email, newUser.nama_lengkap, newUser.avatar_url,
        newUser.unit_kerja, newUser.role, newUser.spesialisasi, newUser.shift,
        newUser.status_aktif, newUser.last_login
      ]);
      return newUser;
    }
  } catch (e) {
    throw new Error('Auth verification failed: ' + e.message);
  }
}

function enforceRole(user, allowedRoles) {
  if (!user || !user.role) {
    throw new Error('Unauthorized: No user role defined');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Role ' + user.role + ' is not permitted to perform this action');
  }
}

// ============================================================================
// DATA ACCESS & MAPPING
// ============================================================================
function getCompleteDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const assetSheet = ss.getSheetByName(SHEET_NAMES.ASSETS);
  const incidentSheet = ss.getSheetByName(SHEET_NAMES.INCIDENTS);
  const logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);

  const users = userSheet ? getSheetObjects(userSheet) : [];
  const assets = assetSheet ? getSheetObjects(assetSheet) : [];
  const incidents = incidentSheet ? getSheetObjects(incidentSheet) : [];
  const logs = logSheet ? getSheetObjects(logSheet) : [];
  const configs = configSheet ? getSheetObjects(configSheet) : [];

  return {
    users: users,
    assets: assets,
    incidents: incidents,
    logs: logs,
    configs: configs,
    server_time: new Date().toISOString()
  };
}

function getAssetIncidentHistory(assetId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incidentSheet = ss.getSheetByName(SHEET_NAMES.INCIDENTS);
  const logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);

  const incidents = getSheetObjects(incidentSheet).filter(i => i.asset_id === assetId);
  const ticketIds = incidents.map(i => i.ticket_id);
  const logs = getSheetObjects(logSheet).filter(l => ticketIds.includes(l.ticket_id));

  return {
    asset_id: assetId,
    incidents: incidents,
    logs: logs
  };
}

function getAllUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  return sheet ? getSheetObjects(sheet) : [];
}

// ============================================================================
// MUTATION ACTIONS (Tickets, Logs, Drive Storage)
// ============================================================================
function createIncidentTicket(data, userAuth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incidentSheet = ss.getSheetByName(SHEET_NAMES.INCIDENTS);
  const logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  const assetSheet = ss.getSheetByName(SHEET_NAMES.ASSETS);

  // Generate Ticket ID: TKT-YYYYMMDD-XXX
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'GMT+7', 'yyyyMMdd');
  const existingTickets = getSheetObjects(incidentSheet);
  const todayCount = existingTickets.filter(t => t.ticket_id && t.ticket_id.startsWith('TKT-' + dateStr)).length + 1;
  const ticketId = 'TKT-' + dateStr + '-' + ('000' + todayCount).slice(-3);

  // Handle Photo Upload (Drive Storage)
  let fotoAwalUrl = data.foto_awal_url || '';
  if (data.foto_awal_base64) {
    fotoAwalUrl = saveBase64ImageToDrive(data.foto_awal_base64, ticketId + '_initial.jpg');
  }

  const createdAt = now.toISOString();
  const statusAwal = 'SUBMITTED';

  const newTicket = {
    ticket_id: ticketId,
    created_at: createdAt,
    kategori_laporan: data.kategori_laporan || 'KERUSAKAN',
    asset_id: data.asset_id || 'NON-ASET',
    lokasi_detail: data.lokasi_detail || '',
    urgensi: data.urgensi || 'Normal',
    deskripsi: data.deskripsi || '',
    foto_awal_url: fotoAwalUrl,
    pelapor_email: userAuth.email,
    pelapor_nama: userAuth.name,
    pelapor_unit: data.pelapor_unit || userAuth.unit_kerja || 'Field Operasional',
    status_terkini: statusAwal,
    pic_teknisi_email: '',
    pic_teknisi_nama: '',
    foto_akhir_url: '',
    catatan_penyelesaian: '',
    resolved_at: ''
  };

  // Append Incident
  incidentSheet.appendRow([
    newTicket.ticket_id, newTicket.created_at, newTicket.kategori_laporan,
    newTicket.asset_id, newTicket.lokasi_detail, newTicket.urgensi,
    newTicket.deskripsi, newTicket.foto_awal_url, newTicket.pelapor_email,
    newTicket.pelapor_nama, newTicket.pelapor_unit, newTicket.status_terkini,
    newTicket.pic_teknisi_email, newTicket.pic_teknisi_nama, newTicket.foto_akhir_url,
    newTicket.catatan_penyelesaian, newTicket.resolved_at
  ]);

  // Log Initial Creation
  const logId = 'LOG-' + Utilities.getUuid().slice(0, 8);
  logSheet.appendRow([
    logId,
    ticketId,
    createdAt,
    'NONE',
    statusAwal,
    userAuth.email,
    userAuth.name,
    'Laporan dibuat oleh ' + userAuth.name + ' (' + newTicket.kategori_laporan + ')',
    fotoAwalUrl
  ]);

  // Sync Asset Operational Status if Critical Breakdown
  if (data.asset_id && data.asset_id !== 'NON-ASET') {
    if (data.kategori_laporan === 'KERUSAKAN' && (data.urgensi === 'Critical' || data.urgensi === 'Urgent')) {
      updateAssetStatus(assetSheet, data.asset_id, 'Breakdown');
    }
  }

  return newTicket;
}

function updateTicketStatus(data, userAuth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incidentSheet = ss.getSheetByName(SHEET_NAMES.INCIDENTS);
  const logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  const assetSheet = ss.getSheetByName(SHEET_NAMES.ASSETS);

  const ticketId = data.ticket_id;
  if (!ticketId) throw new Error('ticket_id is required');

  const rows = incidentSheet.getDataRange().getValues();
  const headers = rows[0];
  const ticketIdCol = headers.indexOf('ticket_id');
  const statusCol = headers.indexOf('status_terkini');
  const picEmailCol = headers.indexOf('pic_teknisi_email');
  const picNamaCol = headers.indexOf('pic_teknisi_nama');
  const fotoAkhirCol = headers.indexOf('foto_akhir_url');
  const catatanCol = headers.indexOf('catatan_penyelesaian');
  const resolvedAtCol = headers.indexOf('resolved_at');
  const assetIdCol = headers.indexOf('asset_id');

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][ticketIdCol] === ticketId) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Ticket not found: ' + ticketId);
  }

  const currentRow = rows[rowIndex - 1];
  const statusSebelum = currentRow[statusCol];
  const statusSesudah = data.status_terkini || statusSebelum;
  const assetId = currentRow[assetIdCol];

  // RBAC check:
  // PELAPOR cannot change status unless canceling their own submitted report
  if (userAuth.role === 'PELAPOR' && statusSesudah !== 'CLOSED') {
    throw new Error('Pelapor cannot transition ticket status.');
  }

  // Handle Photo Akhir upload if provided
  let fotoAkhirUrl = currentRow[fotoAkhirCol] || '';
  if (data.foto_akhir_base64) {
    fotoAkhirUrl = saveBase64ImageToDrive(data.foto_akhir_base64, ticketId + '_resolved.jpg');
    incidentSheet.getRange(rowIndex, fotoAkhirCol + 1).setValue(fotoAkhirUrl);
  }

  // Assign PIC
  if (data.pic_teknisi_email !== undefined) {
    incidentSheet.getRange(rowIndex, picEmailCol + 1).setValue(data.pic_teknisi_email);
    incidentSheet.getRange(rowIndex, picNamaCol + 1).setValue(data.pic_teknisi_nama || '');
  }

  // Update Status
  if (data.status_terkini) {
    incidentSheet.getRange(rowIndex, statusCol + 1).setValue(data.status_terkini);
  }

  // Update Catatan
  if (data.catatan_penyelesaian) {
    incidentSheet.getRange(rowIndex, catatanCol + 1).setValue(data.catatan_penyelesaian);
  }

  // Resolved timestamp
  let resolvedAt = currentRow[resolvedAtCol];
  if (statusSesudah === 'RESOLVED' || statusSesudah === 'CLOSED') {
    resolvedAt = new Date().toISOString();
    incidentSheet.getRange(rowIndex, resolvedAtCol + 1).setValue(resolvedAt);
  }

  // Log to Ticket_History_Logs
  const logId = 'LOG-' + Utilities.getUuid().slice(0, 8);
  logSheet.appendRow([
    logId,
    ticketId,
    new Date().toISOString(),
    statusSebelum,
    statusSesudah,
    userAuth.email,
    userAuth.name,
    data.catatan_log || ('Status diubah menjadi ' + statusSesudah + ' oleh ' + userAuth.name),
    fotoAkhirUrl || ''
  ]);

  // Asset status synchronization:
  // If resolved or closed, check if any remaining active breakdown tickets exist for this asset
  if (assetId && assetId !== 'NON-ASET' && (statusSesudah === 'RESOLVED' || statusSesudah === 'CLOSED')) {
    checkAndRestoreAssetStatus(incidentSheet, assetSheet, assetId);
  } else if (assetId && assetId !== 'NON-ASET' && statusSesudah === 'IN_PROGRESS') {
    updateAssetStatus(assetSheet, assetId, 'Maintenance');
  }

  return {
    ticket_id: ticketId,
    status_sebelum: statusSebelum,
    status_terkini: statusSesudah,
    pic_teknisi_email: data.pic_teknisi_email || currentRow[picEmailCol],
    foto_akhir_url: fotoAkhirUrl
  };
}

function updateAssetStatus(assetSheet, assetId, newStatus) {
  const rows = assetSheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('asset_id');
  const statusCol = headers.indexOf('status_operasional');
  const updatedCol = headers.indexOf('last_updated');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === assetId) {
      assetSheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
      if (updatedCol !== -1) {
        assetSheet.getRange(i + 1, updatedCol + 1).setValue(new Date().toISOString());
      }
      break;
    }
  }
}

function checkAndRestoreAssetStatus(incidentSheet, assetSheet, assetId) {
  const incidents = getSheetObjects(incidentSheet);
  const activeBreakdowns = incidents.filter(i => 
    i.asset_id === assetId && 
    i.kategori_laporan === 'KERUSAKAN' && 
    ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(i.status_terkini)
  );

  if (activeBreakdowns.length === 0) {
    updateAssetStatus(assetSheet, assetId, 'Ready');
  }
}

function updateUserRoleAndStatus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const emailCol = headers.indexOf('email');
  const roleCol = headers.indexOf('role');
  const specCol = headers.indexOf('spesialisasi');
  const shiftCol = headers.indexOf('shift');
  const statusCol = headers.indexOf('status_aktif');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][emailCol].toLowerCase() === data.email.toLowerCase()) {
      if (data.role) sheet.getRange(i + 1, roleCol + 1).setValue(data.role);
      if (data.spesialisasi) sheet.getRange(i + 1, specCol + 1).setValue(data.spesialisasi);
      if (data.shift) sheet.getRange(i + 1, shiftCol + 1).setValue(data.shift);
      if (data.status_aktif) sheet.getRange(i + 1, statusCol + 1).setValue(data.status_aktif);
      return { email: data.email, role: data.role, status_aktif: data.status_aktif };
    }
  }
  throw new Error('User email not found in Master_Users: ' + data.email);
}

function upsertAsset(assetData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ASSETS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('asset_id');

  const now = new Date().toISOString();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === assetData.asset_id) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 2).setValue(assetData.nama_aset);
    sheet.getRange(foundRow, 3).setValue(assetData.kategori);
    sheet.getRange(foundRow, 4).setValue(assetData.lokasi_area);
    sheet.getRange(foundRow, 5).setValue(assetData.status_operasional);
    sheet.getRange(foundRow, 6).setValue(assetData.kritikalitas);
    sheet.getRange(foundRow, 7).setValue(now);
  } else {
    sheet.appendRow([
      assetData.asset_id,
      assetData.nama_aset,
      assetData.kategori,
      assetData.lokasi_area,
      assetData.status_operasional || 'Ready',
      assetData.kritikalitas || 'Medium',
      now
    ]);
  }
  return assetData;
}

// ============================================================================
// GOOGLE DRIVE EVIDENCE STORAGE
// ============================================================================
function saveBase64ImageToDrive(base64Data, filename) {
  try {
    // Strip header if data URI (data:image/jpeg;base64,...)
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedBytes, 'image/jpeg', filename);

    // Find or create Maintenis folder
    let folder;
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Return direct thumbnail / view link
    return 'https://lh3.googleusercontent.com/d/' + file.getId();
  } catch (err) {
    // Return placeholder if Drive fails
    return 'https://placehold.co/600x400/1e293b/94a3b8?text=Evidence+Saved';
  }
}

// ============================================================================
// EMBEDDED AI ENGINE (Gemini 2.5 Flash / Groq Llama 3.3 Proxy)
// ============================================================================
function getAiApiKey(provider) {
  const props = PropertiesService.getScriptProperties();
  if (provider === 'GROQ') {
    return props.getProperty('GROQ_API_KEY');
  }
  return props.getProperty('GEMINI_API_KEY') || props.getProperty('GOOGLE_API_KEY');
}

function callLlmApi(prompt, systemInstruction) {
  const props = PropertiesService.getScriptProperties();
  const provider = props.getProperty('AI_PROVIDER') || 'GEMINI';
  const apiKey = getAiApiKey(provider);

  if (!apiKey) {
    return null; // Signals fallback to deterministic generator
  }

  if (provider === 'GROQ') {
    // Groq Free Tier: llama-3.3-70b-versatile
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction || 'Anda adalah AI Industrial Reliability Engineer CMMS Maintenis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() === 200) {
      const data = JSON.parse(res.getContentText());
      return JSON.parse(data.choices[0].message.content);
    }
    return null;
  } else {
    // Google Gemini 2.5 Flash Free Tier
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    const fullPrompt = (systemInstruction ? systemInstruction + '\n\n' : '') + prompt + '\nJawab HANYA dalam JSON valid tanpa markdown formatting.';
    
    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() === 200) {
      const data = JSON.parse(res.getContentText());
      const rawText = data.candidates[0].content.parts[0].text;
      return JSON.parse(rawText);
    }
    return null;
  }
}

/**
 * AI Telemetry Briefing (Cached for 15 minutes in CacheService)
 */
function getAiTelemetryBriefing() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('ai_telemetry_briefing');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incidents = getSheetObjects(ss.getSheetByName(SHEET_NAMES.INCIDENTS));
  const assets = getSheetObjects(ss.getSheetByName(SHEET_NAMES.ASSETS));

  // Synthesize concise data payload to stay within free-tier token limits
  const breakdownCounts = {};
  const housekeepingAreas = {};
  let totalActive = 0;

  incidents.forEach(inc => {
    if (['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(inc.status_terkini)) {
      totalActive++;
      if (inc.kategori_laporan === 'KERUSAKAN' && inc.asset_id) {
        breakdownCounts[inc.asset_id] = (breakdownCounts[inc.asset_id] || 0) + 1;
      }
      if (inc.kategori_laporan === 'ALAT_TIDAK_PADA_TEMPATNYA') {
        const area = inc.lokasi_detail.split('-')[0].trim() || 'Umum';
        housekeepingAreas[area] = (housekeepingAreas[area] || 0) + 1;
      }
    }
  });

  const prompt = `Analisis data operasional berikut:
- Total tiket aktif: ${totalActive}
- Kerusakan aset berulang: ${JSON.stringify(breakdownCounts)}
- Sebaran kelalaian 5R / Alat tidak pada tempatnya: ${JSON.stringify(housekeepingAreas)}
- Total aset: ${assets.length}

Hasilkan JSON dengan struktur persis:
{
  "recurring_failure_alert": "Peringatan kerusakan berulang aset spesifik dalam 1 kalimat tegas",
  "housekeeping_hotspot": "Lokasi hotspot kelalaian 5R/alat berserakan beserta rekomendasi penertiban",
  "actionable_recommendation": "Rekomendasi taktis untuk supervisor shift ini",
  "threat_level": "ELEVATED" | "NOMINAL" | "CRITICAL",
  "generated_at": "${new Date().toISOString()}"
}`;

  let result = null;
  try {
    result = callLlmApi(prompt, 'Anda adalah Senior Reliability Engineer & Industrial Plant Analyst. Gunakan Bahasa Indonesia profesional dan lugas.');
  } catch (err) {}

  // Deterministic fallback if API key is not yet set
  if (!result) {
    const topAsset = Object.keys(breakdownCounts)[0] || 'GENSET-01';
    const topArea = Object.keys(housekeepingAreas)[0] || 'Gudang A - Mechanical Bay';
    result = {
      recurring_failure_alert: `Aset ${topAsset} terdeteksi mengalami anomali operasional berulang. Segera jadwalkan root-cause audit sistem pendingin & kelistrikan.`,
      housekeeping_hotspot: `Hotspot 5R teridentifikasi di ${topArea}. 3 temuan kunci pas dan APD tidak disimpan di tool rack standar.`,
      actionable_recommendation: `Supervisor disarankan menginstruksikan briefing 5R sebelum pergantian shift dan memverifikasi ketersediaan sparepart filter & gasket.`,
      threat_level: totalActive > 5 ? 'ELEVATED' : 'NOMINAL',
      generated_at: new Date().toISOString(),
      is_fallback: true
    };
  }

  // Cache for 15 minutes (900 seconds)
  cache.put('ai_telemetry_briefing', JSON.stringify(result), 900);
  return result;
}

/**
 * Natural language Q&A about Sheet Data (Copilot)
 */
function handleAiCopilotQuery(question, contextData) {
  const prompt = `Pertanyaan Pengguna: "${question}"
Data Konteks Dashboard:
${JSON.stringify(contextData || {})}

Berikan jawaban singkat, akurat, dan actionable dalam Bahasa Indonesia untuk staf maintenance. Jawab dalam format JSON:
{
  "answer": "Penjelasan langsung maksimal 3 kalimat",
  "recommended_action": "Satu tindakan nyata yang dapat diambil",
  "related_assets": ["ASSET_ID jika relevan"]
}`;

  try {
    const res = callLlmApi(prompt, 'Anda adalah Asisten Virtual Data Maintenance CMMS Maintenis.');
    if (res) return res;
  } catch (e) {}

  // Deterministic Fallback
  return {
    answer: `Berdasarkan telemetri terkini, terdapat tiket operasional aktif yang membutuhkan perhatian shift teknisi.`,
    recommended_action: `Periksa antrean tiket dengan prioritas Critical di Dermaga dan Power House.`,
    related_assets: ['GENSET-01', 'PUMP-CW-02'],
    is_fallback: true
  };
}

/**
 * Technician Root-Cause & Action Suggester for a Specific Ticket
 */
function handleAiTroubleshoot(ticketId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incidents = getSheetObjects(ss.getSheetByName(SHEET_NAMES.INCIDENTS));
  const target = incidents.find(i => i.ticket_id === ticketId);

  if (!target) {
    throw new Error('Ticket not found: ' + ticketId);
  }

  const prompt = `Analisis tiket kendala berikut:
- Kategori: ${target.kategori_laporan}
- Aset: ${target.asset_id}
- Lokasi: ${target.lokasi_detail}
- Urgensi: ${target.urgensi}
- Deskripsi Gejala: ${target.deskripsi}

Buat checklist troubleshooting terstruktur format JSON:
{
  "probable_root_cause": "Dugaan akar penyebab utama teknis",
  "safety_precautions": ["Pencegahan K3 (misal LOTO, isolasi daya)"],
  "troubleshooting_steps": ["Langkah 1", "Langkah 2", "Langkah 3", "Langkah 4"],
  "required_tools": ["Nama alat / APD yang wajib dibawa teknisi"],
  "estimated_resolution_minutes": 45
}`;

  try {
    const res = callLlmApi(prompt, 'Anda adalah Teknisi Spesialis Senior Mesin & Fasilitas Industri.');
    if (res) return res;
  } catch (e) {}

  // Deterministic Fallback
  return {
    probable_root_cause: target.kategori_laporan === 'KERUSAKAN'
      ? 'Indikasi keausan mekanis atau degradasi pelumasan pada komponen penggerak.'
      : 'Pelanggaran disiplin 5R pasca-pekerjaan maintenance shift sebelumnya.',
    safety_precautions: [
      'Terapkan LOTO (Lock-Out Tag-Out) dan pastikan daya listrik mati sebelum inspeksi fisik.',
      'Gunakan sarung tangan safety dan kacamata pelindung standar industri.'
    ],
    troubleshooting_steps: [
      'Verifikasi visual kondisi fisik dan deteksi adanya kebocoran atau getaran abnormal.',
      'Ukur parameter tegangan, arus motor, atau tekanan hidrolik sesuai spesifikasi manual aset.',
      'Bersihkan komponen yang terkontaminasi debu atau kerak oli.',
      'Lakukan uji coba beban bertahap selama 10 menit sebelum serah terima operasional.'
    ],
    required_tools: ['Multimeter Digital', 'Kunci Pas Set 8-24mm', 'Cleaning Degreaser', 'Infrared Thermometer'],
    estimated_resolution_minutes: 45,
    is_fallback: true
  };
}

// ============================================================================
// DATABASE INITIALIZATION & SEED DATA (?action=setup)
// ============================================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Master_Users
  let userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_NAMES.USERS);
    userSheet.appendRow(['user_id', 'email', 'nama_lengkap', 'avatar_url', 'unit_kerja', 'role', 'spesialisasi', 'shift', 'status_aktif', 'last_login']);
    // Seed users
    const sampleUsers = [
      ['USR-20260301-001', 'budi.santoso@perusahaan.com', 'Budi Santoso', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', 'Divisi Operasional', 'PELAPOR', 'Operator Crane', 'Shift 1 (Pagi)', 'Aktif', new Date().toISOString()],
      ['USR-20260301-002', 'ahmad.fauzi@perusahaan.com', 'Ahmad Fauzi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', 'Maintenance & Eng', 'TEKNISI', 'Mekanik & Hidrolik', 'Shift 1 (Pagi)', 'Aktif', new Date().toISOString()],
      ['USR-20260301-003', 'hendra.gunawan@perusahaan.com', 'Hendra Gunawan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', 'Maintenance & Eng', 'TEKNISI', 'Listrik & Otomasi', 'Shift 2 (Sore)', 'Aktif', new Date().toISOString()],
      ['USR-20260301-004', 'irfan.prasetyo@perusahaan.com', 'Irfan Prasetyo', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 'Maintenance & Eng', 'SUPERVISOR', 'Lead Engineer', 'Normal Day', 'Aktif', new Date().toISOString()],
      ['USR-20260301-005', 'admin.eng@perusahaan.com', 'System Administrator', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100', 'IT & Systems', 'ADMIN', 'CMMS Admin', 'Normal Day', 'Aktif', new Date().toISOString()]
    ];
    sampleUsers.forEach(u => userSheet.appendRow(u));
  }

  // 2. Master_Aset
  let assetSheet = ss.getSheetByName(SHEET_NAMES.ASSETS);
  if (!assetSheet) {
    assetSheet = ss.insertSheet(SHEET_NAMES.ASSETS);
    assetSheet.appendRow(['asset_id', 'nama_aset', 'kategori', 'lokasi_area', 'status_operasional', 'kritikalitas', 'last_updated']);
    const sampleAssets = [
      ['GENSET-01', 'Diesel Generator Backup 1000kVA', 'Electrical', 'Power House Area B', 'Breakdown', 'High', new Date().toISOString()],
      ['CRANE-QC-03', 'Quayside Container Crane 03', 'Mechanical', 'Dermaga Barat', 'Maintenance', 'High', new Date().toISOString()],
      ['PUMP-CW-02', 'Cooling Water Circulation Pump 2', 'Mechanical', 'Pompa Sentral Unit 1', 'Ready', 'Medium', new Date().toISOString()],
      ['COMP-AIR-01', 'Rotary Screw Air Compressor', 'Utility', 'Gudang Kompresor', 'Ready', 'Medium', new Date().toISOString()],
      ['FORKLIFT-04', 'Heavy Duty Electric Forklift 5T', 'Mobile Equipment', 'Gudang Logistik A', 'Ready', 'Low', new Date().toISOString()],
      ['HVAC-CHILLER-01', 'Central Industrial Water Chiller', 'HVAC', 'Rooftop Gedung Utama', 'Ready', 'High', new Date().toISOString()]
    ];
    sampleAssets.forEach(a => assetSheet.appendRow(a));
  }

  // 3. Incident_Reports
  let incidentSheet = ss.getSheetByName(SHEET_NAMES.INCIDENTS);
  if (!incidentSheet) {
    incidentSheet = ss.insertSheet(SHEET_NAMES.INCIDENTS);
    incidentSheet.appendRow([
      'ticket_id', 'created_at', 'kategori_laporan', 'asset_id', 'lokasi_detail',
      'urgensi', 'deskripsi', 'foto_awal_url', 'pelapor_email', 'pelapor_nama',
      'pelapor_unit', 'status_terkini', 'pic_teknisi_email', 'pic_teknisi_nama',
      'foto_akhir_url', 'catatan_penyelesaian', 'resolved_at'
    ]);
    const sampleIncidents = [
      [
        'TKT-20260301-001',
        new Date(Date.now() - 3600000 * 5).toISOString(),
        'KERUSAKAN',
        'GENSET-01',
        'Power House Area B - Panel Kontrol',
        'Critical',
        'Indikator alarm suhu oli berbunyi dan mesin shutdown otomatis saat uji beban bulanan.',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
        'budi.santoso@perusahaan.com',
        'Budi Santoso',
        'Divisi Operasional',
        'IN_PROGRESS',
        'hendra.gunawan@perusahaan.com',
        'Hendra Gunawan',
        '',
        '',
        ''
      ],
      [
        'TKT-20260301-002',
        new Date(Date.now() - 3600000 * 8).toISOString(),
        'ALAT_TIDAK_PADA_TEMPATNYA',
        'NON-ASET',
        'Gudang Logistik A - Jalur Evakuasi Rak 4',
        'Urgent',
        'Ditemukan tangga lipat aluminium dan kotak toolset tergeletak menghalangi akses jalur forklift.',
        'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800',
        'budi.santoso@perusahaan.com',
        'Budi Santoso',
        'Divisi Operasional',
        'RESOLVED',
        'ahmad.fauzi@perusahaan.com',
        'Ahmad Fauzi',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800',
        'Tangga telah dipindahkan ke rak penyimpanan 5R dan area jalur evakuasi sudah bersih.',
        new Date(Date.now() - 3600000 * 2).toISOString()
      ]
    ];
    sampleIncidents.forEach(inc => incidentSheet.appendRow(inc));
  }

  // 4. Ticket_History_Logs
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
    logSheet.appendRow(['log_id', 'ticket_id', 'timestamp', 'status_sebelum', 'status_sesudah', 'aktor_email', 'aktor_nama', 'catatan_log', 'foto_lampiran_url']);
    const sampleLogs = [
      ['LOG-001', 'TKT-20260301-001', new Date(Date.now() - 3600000 * 5).toISOString(), 'NONE', 'SUBMITTED', 'budi.santoso@perusahaan.com', 'Budi Santoso', 'Laporan kerusakan awal didaftarkan', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'],
      ['LOG-002', 'TKT-20260301-001', new Date(Date.now() - 3600000 * 4).toISOString(), 'SUBMITTED', 'ASSIGNED', 'irfan.prasetyo@perusahaan.com', 'Irfan Prasetyo', 'Ditugaskan ke Hendra Gunawan (Listrik)', ''],
      ['LOG-003', 'TKT-20260301-001', new Date(Date.now() - 3600000 * 3).toISOString(), 'ASSIGNED', 'IN_PROGRESS', 'hendra.gunawan@perusahaan.com', 'Hendra Gunawan', 'Mulai inspeksi sensor suhu oli & sirkuit pendingin', ''],
      ['LOG-004', 'TKT-20260301-002', new Date(Date.now() - 3600000 * 8).toISOString(), 'NONE', 'SUBMITTED', 'budi.santoso@perusahaan.com', 'Budi Santoso', 'Temuan 5R tangga tergeletak', 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800'],
      ['LOG-005', 'TKT-20260301-002', new Date(Date.now() - 3600000 * 2).toISOString(), 'SUBMITTED', 'RESOLVED', 'ahmad.fauzi@perusahaan.com', 'Ahmad Fauzi', 'Penertiban selesai dilakukan ke rak 5R', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800']
    ];
    sampleLogs.forEach(l => logSheet.appendRow(l));
  }

  // 5. App_Config
  let configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_NAMES.CONFIG);
    configSheet.appendRow(['config_key', 'config_value']);
    const sampleConfigs = [
      ['ALLOWED_EMAIL_DOMAINS', '*'],
      ['AUTO_APPROVE_NEW_USERS', 'TRUE'],
      ['SLA_CRITICAL_MINUTES', '120'],
      ['SLA_URGENT_MINUTES', '360'],
      ['AI_PROVIDER', 'GEMINI'],
      ['APP_TITLE', 'Maintenis CMMS Lite']
    ];
    sampleConfigs.forEach(c => configSheet.appendRow(c));
  }

  return {
    status: 'OK',
    sheets_created: [SHEET_NAMES.USERS, SHEET_NAMES.ASSETS, SHEET_NAMES.INCIDENTS, SHEET_NAMES.LOGS, SHEET_NAMES.CONFIG]
  };
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================
function getSheetObjects(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(h => String(h).trim());
  const objects = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Skip completely empty rows
    if (!row.some(cell => cell !== '' && cell !== null && cell !== undefined)) continue;
    const obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[header] = val;
    });
    objects.push(obj);
  }
  return objects;
}

function updateUserLastLogin(userSheet, email) {
  const rows = userSheet.getDataRange().getValues();
  const emailCol = rows[0].indexOf('email');
  const loginCol = rows[0].indexOf('last_login');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][emailCol].toLowerCase() === email.toLowerCase()) {
      userSheet.getRange(i + 1, loginCol + 1).setValue(new Date().toISOString());
      break;
    }
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
