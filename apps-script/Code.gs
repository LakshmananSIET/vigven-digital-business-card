const SHEET_NAME = 'Employees';

const HEADERS = [
  'id','companyName','employeeName','rollNumber','designation','department',
  'email','phone','linkedin','website','address','employeeImage','active',
  'createdAt','updatedAt'
];

const PUBLIC_FIELDS = [
  'id','companyName','employeeName','designation','department','email','phone',
  'linkedin','website','address','employeeImage'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    return sheet;
  }
  const lastColumn = Math.max(sheet.getLastColumn(),1);
  const currentHeaders = sheet.getRange(1,1,1,lastColumn).getValues()[0].map(String);
  const existing = currentHeaders.filter(Boolean);
  const missing = HEADERS.filter(h => !existing.includes(h));
  if (missing.length) sheet.getRange(1,1,1,existing.length+missing.length).setValues([existing.concat(missing)]);
  return sheet;
}

function getAdminPassword_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readRows_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String), rows = [];
  for (let i=1;i<data.length;i++) {
    const obj = {_row:i+1};
    headers.forEach((h,idx)=>{ if(h) obj[h]=data[i][idx]; });
    rows.push(obj);
  }
  return rows;
}

function toPublic_(row) {
  const out = {};
  PUBLIC_FIELDS.forEach(f => out[f] = row[f] || '');
  return out;
}

function isActive_(row) {
  return row.active !== false && row.active !== 'FALSE' && row.active !== '';
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  const sheet = getSheet_();
  if (action === 'card') {
    const id = e.parameter.id;
    const row = readRows_(sheet).find(r => String(r.id) === String(id));
    if (!row || !isActive_(row)) return json_({error:'Card not found.'});
    return json_({employee:toPublic_(row)});
  }
  return json_({error:'Unknown action.'});
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err) { return json_({error:'Invalid request body.'}); }

  const action = body.action;
  const adminPassword = getAdminPassword_();
  if (!adminPassword) return json_({error:'Server is missing the ADMIN_PASSWORD script property.'});

  if (action === 'login') {
    return body.password === adminPassword ? json_({ok:true}) : json_({error:'Incorrect password.'});
  }
  if (body.password !== adminPassword) return json_({error:'Not authorized.'});

  const sheet = getSheet_();

  if (action === 'list') return json_({employees:readRows_(sheet).map(stripRowMeta_)});

  if (action === 'create') {
    const employee = body.employee || {};
    if (!String(employee.employeeName || '').trim() || !String(employee.rollNumber || '').trim()) {
      return json_({error:'employeeName and rollNumber are required.'});
    }
    const id = Utilities.getUuid(), now = new Date().toISOString();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
    const row = headers.map(h => h==='id' ? id : h==='active' ? true : (h==='createdAt'||h==='updatedAt') ? now : (employee[h] !== undefined ? employee[h] : ''));
    sheet.appendRow(row);
    return json_({ok:true,id});
  }

  if (action === 'update') {
    const target = readRows_(sheet).find(r => String(r.id) === String(body.id));
    if (!target) return json_({error:'Employee not found.'});
    const employee = body.employee || {}, now = new Date().toISOString();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
    headers.forEach((h,idx) => {
      if (h==='id'||h==='createdAt') return;
      let value = h==='updatedAt' ? now : h==='active' ? (employee.active !== undefined ? Boolean(employee.active) : target.active) : (employee[h] !== undefined ? employee[h] : (target[h] || ''));
      sheet.getRange(target._row,idx+1).setValue(value);
    });
    return json_({ok:true});
  }

  if (action === 'delete') {
    const target = readRows_(sheet).find(r => String(r.id) === String(body.id));
    if (!target) return json_({error:'Employee not found.'});
    sheet.deleteRow(target._row);
    return json_({ok:true});
  }

  return json_({error:'Unknown action.'});
}

function stripRowMeta_(row) {
  const {_row, ...rest} = row;
  return rest;
}
