/**********************************************************************
 * T&M Prework Portal — Google Apps Script backend
 * Bound to the roster spreadsheet.
 *
 * Roster tab columns:
 *   A Instance | B School | C School Code | D Name | E ID | F Password | G Level
 *
 * Login uses  E (ID) + F (Password)  ->  returns  G (Level) + D (Name)
 * Responses auto-route to per-level tabs: Responses_L1 / _L2 / _L3
 * Progress auto-logs to: Progress
 *
 * DEPLOY (one time):
 *   Extensions ▸ Apps Script ▸ delete any code ▸ paste this ▸ Save
 *   Deploy ▸ New deployment ▸ type "Web app"
 *     Execute as: Me
 *     Who has access: Anyone
 *   Copy the Web app URL that ends in /exec
 *   Paste it into index.html  ->  CONFIG.sheetURL
 **********************************************************************/

var ROSTER_SHEET = 'Roster';   // <- set to your roster tab's exact name
var COL = { NAME:4, ID:5, PASS:6, LEVEL:7 };  // 1-based: D,E,F,G

function doGet(e){
  var p = (e && e.parameter) || {};
  if (p.action === 'login'){
    var res = _login(p.id, p.code);
    // JSONP so the browser can read the result cross-origin
    if (p.callback) return _jsonp(p.callback, res);
    return _json(res);
  }
  // allow response/progress via GET too (image-beacon fallback)
  if (p.action === 'response'){ _logResponse(p); return _json({ok:true}); }
  if (p.action === 'progress'){ _logProgress(p); return _json({ok:true}); }
  return _json({ok:false, error:'Unknown action'});
}

function doPost(e){
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'response'){ _logResponse(p); return _json({ok:true}); }
    if (p.action === 'progress'){ _logProgress(p); return _json({ok:true}); }
    return _json({ok:false, error:'Unknown action'});
  } catch (err){ return _json({ok:false, error:String(err)}); }
}

/* ---------- LOGIN: match ID (col E) + Password (col F) ---------- */
function _login(id, code){
  if (!id || !code) return {ok:false, error:'Please enter ID and Code.'};
  id = String(id).trim().toUpperCase();
  code = String(code).trim();
  var sh = _ss().getSheetByName(ROSTER_SHEET);
  if (!sh) return {ok:false, error:'Roster tab not found.'};
  var data = sh.getDataRange().getValues();
  for (var r = 1; r < data.length; r++){                 // row 0 = header
    var rid = String(data[r][COL.ID-1]||'').trim().toUpperCase();
    if (rid === id){
      var rpass = String(data[r][COL.PASS-1]||'').trim();
      if (rpass !== code) return {ok:false, error:'Incorrect code.'};
      return {ok:true,
              level: Number(data[r][COL.LEVEL-1])||1,
              name:  String(data[r][COL.NAME-1]||'')};
    }
  }
  return {ok:false, error:'ID not found.'};
}

/* ---------- RESPONSE: route to Responses_L<level> ---------- */
function _logResponse(p){
  var lvl = Number(p.level)||1;
  var sh = _ensureSheet('Responses_L'+lvl,
    ['Timestamp','Student ID','Name','Level','Lesson','Question','Answer','Correct']);
  sh.appendRow([new Date(), p.id||'', p.name||'', lvl, p.lesson||'',
                p.question||'', p.answer||'', p.correct||'']);
}

/* ---------- PROGRESS ---------- */
function _logProgress(p){
  var sh = _ensureSheet('Progress',
    ['Timestamp','Student ID','Name','Level','Completed','Total']);
  sh.appendRow([new Date(), p.id||'', p.name||'', Number(p.level)||'',
                p.completed||'', p.total||'']);
}

/* ---------- helpers ---------- */
function _ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function _ensureSheet(nm, header){
  var ss=_ss(), sh=ss.getSheetByName(nm);
  if(!sh){
    sh=ss.insertSheet(nm);
    sh.appendRow(header);
    sh.getRange(1,1,1,header.length).setFontWeight('bold')
      .setBackground('#0D3B4A').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function _json(o){
  return ContentService.createTextOutput(JSON.stringify(o))
         .setMimeType(ContentService.MimeType.JSON);
}
function _jsonp(cb, o){
  return ContentService.createTextOutput(cb+'('+JSON.stringify(o)+')')
         .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
