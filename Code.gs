/**********************************************************************
 * T&M Prework Portal — Google Apps Script backend
 * Roster tab columns:
 *   A Instance | B School | C School Code | D Name | E ID | F Password | G Level
 * Login uses E (ID) + F (Password) -> returns G (Level) + D (Name)
 *
 * RESPONSES: one row per student, per level.
 *   Tabs: Responses_L1 / _L2 / _L3
 *   Fixed columns: Student ID | Name | Level | Last Updated | Score | Answered
 *   Then one column per Question (added automatically as they appear).
 *   Each new answer UPDATES that student's single row (not a new row).
 *
 * PROGRESS: one row per student in Progress tab (updated in place).
 *
 * DEPLOY: Extensions > Apps Script > paste > Save >
 *   Deploy > Manage deployments > edit > New version > Deploy
 **********************************************************************/

var ROSTER_SHEET = 'Roster';
var COL = { NAME:4, ID:5, PASS:6, LEVEL:7 };   // 1-based D,E,F,G
var FIXED = ['Student ID','Name','Level','Last Updated','Score','Answered'];

function doGet(e){
  var p=(e&&e.parameter)||{};
  if(p.action==='login'){
    var r=_login(p.id,p.code);
    return p.callback ? _jsonp(p.callback,r) : _json(r);
  }
  if(p.action==='response'){ _resp(p); return _json({ok:true}); }
  if(p.action==='progress'){ _prog(p); return _json({ok:true}); }
  return _json({ok:false,error:'Unknown action'});
}
function doPost(e){
  var p=(e&&e.parameter)||{};
  try{
    if(p.action==='response'){ _resp(p); return _json({ok:true}); }
    if(p.action==='progress'){ _prog(p); return _json({ok:true}); }
    return _json({ok:false,error:'Unknown action'});
  }catch(err){ return _json({ok:false,error:String(err)}); }
}

/* ---------- LOGIN ---------- */
function _login(id,code){
  if(!id||!code) return {ok:false,error:'Please enter ID and Code.'};
  id=String(id).trim().toUpperCase(); code=String(code).trim();
  var sh=_ss().getSheetByName(ROSTER_SHEET);
  if(!sh) return {ok:false,error:'Roster tab not found.'};
  var d=sh.getDataRange().getValues();
  for(var r=1;r<d.length;r++){
    if(String(d[r][COL.ID-1]||'').trim().toUpperCase()===id){
      if(String(d[r][COL.PASS-1]||'').trim()!==code) return {ok:false,error:'Incorrect code.'};
      return {ok:true, level:Number(d[r][COL.LEVEL-1])||1, name:String(d[r][COL.NAME-1]||'')};
    }
  }
  return {ok:false,error:'ID not found.'};
}

/* ---------- RESPONSE: one row per student, question = column ---------- */
function _resp(p){
  var lvl=Number(p.level)||1;
  var lock=LockService.getScriptLock();
  try{ lock.waitLock(8000); }catch(e){}
  try{
    var sh=_ensure('Responses_L'+lvl, FIXED.slice());
    var header=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var q=String(p.question||'').trim();
    // find or add the question column
    var qCol=header.indexOf(q);
    if(qCol===-1){
      sh.getRange(1,header.length+1).setValue(q)
        .setFontWeight('bold').setBackground('#0D3B4A').setFontColor('#fff');
      header.push(q); qCol=header.length-1;
    }
    // find the student's row by ID (col 1)
    var idCol=0, last=sh.getLastRow();
    var ids = last>1 ? sh.getRange(2,1,last-1,1).getValues() : [];
    var row=-1;
    for(var i=0;i<ids.length;i++){ if(String(ids[i][0]).trim().toUpperCase()===String(p.id).trim().toUpperCase()){ row=i+2; break; } }
    if(row===-1){ row=last+1; sh.getRange(row,1).setValue(p.id||''); }
    // write fixed fields
    sh.getRange(row,2).setValue(p.name||'');
    sh.getRange(row,3).setValue(lvl);
    sh.getRange(row,4).setValue(new Date());
    // write TRUE/FALSE (correctness only) into the question's column
    var isCorrect=(String(p.correct)==='true'||p.correct===true);
    sh.getRange(row, qCol+1).setValue(isCorrect?'TRUE':'FALSE');
    // recompute Score + Answered across question columns
    var full=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
    var ansd=0, corr=0;
    for(var c=FIXED.length;c<full.length;c++){
      var v=String(full[c]||'').trim().toUpperCase();
      if(v==='TRUE'||v==='FALSE'){ ansd++; if(v==='TRUE') corr++; }
    }
    sh.getRange(row,5).setValue(corr+'/'+ansd); // Score
    sh.getRange(row,6).setValue(ansd);          // Answered
  } finally { try{ lock.releaseLock(); }catch(e){} }
}

/* ---------- PROGRESS: one row per student ---------- */
function _prog(p){
  var sh=_ensure('Progress',['Student ID','Name','Level','Completed','Total','Last Updated']);
  var last=sh.getLastRow();
  var ids= last>1 ? sh.getRange(2,1,last-1,1).getValues() : [];
  var row=-1;
  for(var i=0;i<ids.length;i++){ if(String(ids[i][0]).trim().toUpperCase()===String(p.id).trim().toUpperCase()){ row=i+2; break; } }
  if(row===-1) row=last+1;
  sh.getRange(row,1,1,6).setValues([[p.id||'',p.name||'',Number(p.level)||'',p.completed||'',p.total||'',new Date()]]);
}

/* ---------- helpers ---------- */
function _ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function _ensure(nm,header){
  var ss=_ss(), sh=ss.getSheetByName(nm);
  if(!sh){
    sh=ss.insertSheet(nm);
    sh.getRange(1,1,1,header.length).setValues([header])
      .setFontWeight('bold').setBackground('#0D3B4A').setFontColor('#fff');
    sh.setFrozenRows(1); sh.setFrozenColumns(2);
  }
  return sh;
}
function _json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function _jsonp(cb,o){ return ContentService.createTextOutput(cb+'('+JSON.stringify(o)+')').setMimeType(ContentService.MimeType.JAVASCRIPT); }
