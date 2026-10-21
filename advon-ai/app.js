/* Advon AI — the AI office assistant (MVP). Light only, Greek, no build step.
   v2: data in Supabase (Frankfurt) with live sync between devices (cloud.js); AI through the server function «ai»
   (the Claude key never reaches the browser); reminders as push notifications + e-mail by the server function «notify».
   21 Oct 2026 */
(function(){
'use strict';
var N=window.ADVON_NICHES, U=window.ADVON_UTIL;
var KEY='advon_ai_v1', KKEY='advon_ai_key';
var PRICES={'claude-haiku-5-5':{i:0.10,o:0.50,cr:0.01,cw:0.125},'claude-sonnet-5-5':{i:2,o:10,cr:0.10,cw:2.5}};
var MODELS=[['claude-haiku-5-5','Haiku 5.5 — γρήγορο, πολύ φθηνό'],['claude-sonnet-5-5','Sonnet 5.5 — πιο έξυπνο (έγγραφα, προτάσεις)']];
var S=null, d=document;
S={v:1, niche:null, office:{name:'',owner:''}, clients:[], items:[], reminders:[], activity:[], chat:[], api:[], brief:null, settings:{model:'claude-haiku-5-5', approve:true, cap_usd:40}, usage:{}};
function $(s,r){return (r||d).querySelector(s)} function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
function pad(n){return (n<10?'0':'')+n}
function today(){ return U.iso(new Date()); }
function daysTo(s){ if(!s) return 9999; var a=new Date(today()+'T12:00'), b=new Date(s+'T12:00'); return Math.round((b-a)/864e5); }
var DN=['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'], DNF=['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'], MN=['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'], MNF=['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];
function fmtDate(s){ if(!s) return ''; var t=new Date(s+'T12:00'); if(isNaN(t)) return s; var k=daysTo(s); if(k===0) return 'Σήμερα'; if(k===1) return 'Αύριο'; if(k===-1) return 'Χθες'; return DN[t.getDay()]+' '+t.getDate()+' '+MN[t.getMonth()]+(t.getFullYear()!==new Date().getFullYear()?' '+t.getFullYear():''); }
function relBadge(s){ var k=daysTo(s); if(k===9999) return ''; var cls=k<0?'late':k<=3?'soon':k<=14?'mid':'far', txt=k<0?(-k)+' μ. πριν':k===0?'σήμερα':k===1?'αύριο':'σε '+k+' μ.'; return '<span class="rb '+cls+'">'+txt+'</span>'; }
function money(n){ return n||n===0? Number(n).toLocaleString('el-GR')+'€' : ''; }
function voc(n){ var w=String(n||''); if(/ος$/.test(w)){ var syl=(norm(w).match(/[αεηιουω]+/g)||[]).length; return w.slice(0,-2)+(syl>=3?'ε':'ο'); } if(/[ηα]ς$/.test(w)) return w.slice(0,-1); return w; }
function initials(n){ var p=String(n||'').trim().split(/\s+/); return ((p[0]||'')[0]||'')+((p[1]||'')[0]||''); }
var toastT; function toast(m,undo){ var t=$('#toast'); t.innerHTML=esc(m)+(undo?' <button>Αναίρεση</button>':''); t.classList.add('on'); clearTimeout(toastT); if(undo){ $('button',t).onclick=function(){ undo(); t.classList.remove('on'); }; } toastT=setTimeout(function(){ t.classList.remove('on'); },undo?6000:2600); }
function copy(txt){ (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){ toast('Αντιγράφηκε'); }).catch(function(){ toast('Επίλεξε το κείμενο και αντέγραψέ το'); }); }
var IC={
 spark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.6L12 16l-1.8-5.4L4.5 9l5.7-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" opacity=".7"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
 doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
 note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
 undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
 msg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
 edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>'
};

/* ================= state ================= */
function blank(){ return {v:1, niche:null, office:{name:'',owner:''}, clients:[], items:[], reminders:[], activity:[], chat:[], api:[], brief:null, settings:{model:'claude-haiku-5-5', approve:true}, usage:{}}; }
var READY=false;
var saveT; function save(){ clearTimeout(saveT); saveT=setTimeout(saveNow,150); }
function saveNow(){ S.chat=S.chat.slice(-80); S.api=S.api.slice(-60); if(window.CLOUD) CLOUD.persist(S); }
function apiKey(){ return (window.CLOUD && CLOUD.status && CLOUD.status.ai) ? 'server' : ''; }
function client(id){ for(var i=0;i<S.clients.length;i++) if(S.clients[i].id===id) return S.clients[i]; return null; }
function NI(){ return N[S.niche]||N.asf; }
function item(id){ for(var i=0;i<S.items.length;i++) if(S.items[i].id===id) return S.items[i]; return null; }
function rem(id){ for(var i=0;i<S.reminders.length;i++) if(S.reminders[i].id===id) return S.reminders[i]; return null; }
function itemsOf(cid){ return S.items.filter(function(i){return i.clientId===cid}); }
function H(){ return {daysTo:daysTo, client:function(id){ return client(id)||{name:'—'}; }, fmtDate:fmtDate}; }
function logAct(cid,text,kind){ S.activity.push({id:U.uid('a'),clientId:cid,text:text,kind:kind||'note',at:Date.now()}); }
function applyTheme(){ var n=NI(); d.documentElement.style.setProperty('--b',n.color); d.documentElement.style.setProperty('--bs',n.soft); }

/* ================= Greek understanding (works without AI too) ================= */
var WD=[['κυριακ',0],['δευτερ',1],['τριτ',2],['τεταρτ',3],['πεμπτ',4],['παρασκευ',5],['σαββατ',6]];
var NUMW={'μια':1,'μια ':1,'ενα':1,'μιας':1,'δυο':2,'δυο ':2,'τρεις':3,'τρια':3,'τεσσερις':4,'τεσσερα':4,'πεντε':5,'εξι':6,'επτα':7,'εφτα':7,'δεκα':10,'δεκαπεντε':15};
var MONS=['ιανουαρ','φεβρουαρ','μαρτ','απριλ','μαι','ιουν','ιουλ','αυγουστ','σεπτεμβρ','οκτωβρ','νοεμβρ','δεκεμβρ'];
function parseWhen(text){ var t=' '+norm(text)+' ', base=new Date(); base.setHours(12,0,0,0); var date=null, time='', m;
  if(/ σημερα /.test(t)) date=new Date(base);
  else if(/ μεθαυριο /.test(t)){ date=new Date(base); date.setDate(date.getDate()+2); }
  else if(/ αυριο /.test(t)){ date=new Date(base); date.setDate(date.getDate()+1); }
  if(!date && (m=t.match(/ σε (\d+|μια|ενα|δυο|τρεις|τρια|τεσσερις|πεντε|εξι|δεκα|δεκαπεντε) (μερ|ημερ|εβδομαδ|μην)/))){ var n=/\d/.test(m[1])?+m[1]:(NUMW[m[1]]||1); date=new Date(base); if(m[2]==='εβδομαδ') date.setDate(date.getDate()+7*n); else if(m[2]==='μην') date.setMonth(date.getMonth()+n); else date.setDate(date.getDate()+n); }
  if(!date && /(την )?(αλλη|επομενη) εβδομαδα/.test(t)){ date=new Date(base); date.setDate(date.getDate()+7); }
  if(!date && (m=t.match(/ (\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))? /))){ var y=m[3]? (+m[3]<100?2000+(+m[3]):+m[3]) : base.getFullYear(); date=new Date(y,+m[2]-1,+m[1],12); if(!m[3] && date<base) date.setFullYear(y+1); }
  if(!date){ for(var i=0;i<WD.length;i++){ if(t.indexOf(' '+WD[i][0])>=0 || t.indexOf('την '+WD[i][0])>=0 || t.indexOf('τη '+WD[i][0])>=0){ date=new Date(base); var diff=(WD[i][1]-date.getDay()+7)%7; if(diff===0) diff=7; date.setDate(date.getDate()+diff); break; } } }
  if((m=t.match(/ στις (\d{1,2})(?:[:.](\d{2}))?/))||(m=t.match(/ (\d{1,2}):(\d{2}) /))){ var h=+m[1], mi=m[2]?+m[2]:0; if(h<8 && !/πρωι/.test(t)) h+=12; if(h<24) time=pad(h)+':'+pad(mi); }
  else if(/ το πρωι /.test(t)) time='10:00'; else if(/μεσημερι/.test(t)) time='13:00'; else if(/απογευμα/.test(t)) time='17:00'; else if(/ βραδυ /.test(t)) time='20:00';
  return {date:date?U.iso(date):null, time:time}; }
function findClient(text){ var t=' '+norm(text).replace(/[^a-zα-ω0-9 ]/g,' ')+' ', best=null, bs=0, tie=false;
  S.clients.forEach(function(c){ var parts=norm(c.name).split(/\s+/), sc=0; parts.forEach(function(p,ix){ if(p.length<4) return; var stem=p.slice(0,Math.max(4,p.length-2)); if(t.indexOf(' '+stem)>=0) sc+= ix===parts.length-1?2:1; }); if(sc>bs){bs=sc;best=c;tie=false;} else if(sc===bs && sc>0) tie=true; });
  return bs>=2 && !tie ? best : (bs>0 && !tie ? best : null); }
function monthIn(text){ var t=norm(text); if(/επομενο μηνα|επομενου μηνα|τον αλλο μηνα/.test(t)){ var x=new Date(); return (x.getMonth()+1)%12; } if(/αυτο το μηνα|αυτον τον μηνα|φετινο μηνα/.test(t)) return new Date().getMonth(); for(var i=0;i<MONS.length;i++){ var re=new RegExp('(^|\\s)'+MONS[i]); if(re.test(t)) return i; } return -1; }
function cleanReminder(text,c){ var s=String(text).replace(/^\s*(θύμισέ μου|θυμισε μου|θύμισε μου|υπενθύμισέ μου|υπενθυμιση|υπενθύμιση|κανε μου υπενθυμιση)\s*(να\s*)?/i,'').trim(); s=s.charAt(0).toUpperCase()+s.slice(1); return s||text; }

/* ================= router + chrome ================= */
var VIEW='today', PARAM=null;
function route(){ if(!READY) return; var h=(location.hash||'#today').slice(1).split('/'); VIEW=h[0]||'today'; PARAM=h[1]||null; if(!S.niche){ onboarding(); return; } render(); scrollTo(0,0); }
addEventListener('hashchange',route);
function go(v){ location.hash=v; }
function render(){ applyTheme(); $$('[data-nav]').forEach(function(a){ var v=a.getAttribute('data-nav'); a.classList.toggle('on', v===VIEW || (VIEW==='client'&&v==='clients')); });
  $('#itemsNav').textContent=NI().items; $('#officeName').textContent=S.office.name||NI().label; $('#aiState').innerHTML=(apiKey()? '<i class="ok"></i>AI ενεργό · '+(S.settings.model.indexOf('sonnet')>0?'Sonnet':'Haiku') : '<i></i>AI: λείπει το κλειδί στο Supabase')+(window.CLOUD?'<br><span class="syncst" id="syncSt">'+CLOUD.syncLabel()+'</span>':'');
  var m=$('#main'); d.body.dataset.view=VIEW;
  var f={today:vToday, clients:vClients, client:vClient, items:vItems, reminders:vReminders, assistant:vAssistant, import:vImport, settings:vSettings}[VIEW]||vToday; m.innerHTML=''; f(m);
  renderChat(); }

/* ================= AI bar (shared) ================= */
function aiBar(big){ return '<div class="aibar'+(big?' big':'')+'"><span class="sp">'+IC.spark+'</span><input type="text" class="aiIn" placeholder="Ρωτήστε ή πείτε κάτι… '+esc(big?NI().voiceHint:'')+'" autocomplete="off"><button type="button" class="mic" title="Πείτε το">'+IC.mic+'</button><button type="button" class="snd" title="Αποστολή">'+IC.send+'</button></div>'; }
function wireAiBar(root){ $$('.aibar',root).forEach(function(b){ var inp=$('.aiIn',b); function go2(){ var v=inp.value.trim(); if(!v) return; inp.value=''; ask(v); } $('.snd',b).onclick=go2; inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); go2(); } }); $('.mic',b).onclick=function(){ voice(inp,$('.mic',b)); }; }); }
function chipsHtml(){ return '<div class="chips">'+NI().chips.map(function(c){return '<button type="button" data-ask="'+esc(c)+'">'+esc(c)+'</button>'}).join('')+'</div>'; }
function wireChips(root){ $$('[data-ask]',root).forEach(function(b){ b.onclick=function(){ ask(b.getAttribute('data-ask')); }; }); }

/* ================= voice ================= */
var REC=null, MREC=null;
function useRecorder(){ var SR=window.SpeechRecognition||window.webkitSpeechRecognition; var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone; var ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); return !SR || (ios && standalone); }
function listen(btn,onFinal,onInterim,inp){
  if(REC){ try{REC.stop()}catch(e){} return; }
  if(MREC){ try{MREC.stop()}catch(e){} return; }
  if(!useRecorder()){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition, r=new SR(); REC=r; r.lang='el-GR'; r.interimResults=true; r.maxAlternatives=1; var fin='', all='';
    btn.classList.add('rec'); if(inp) inp.placeholder='Σας ακούω… (πατήστε ξανά για τέλος)';
    r.onresult=function(e){ var s=''; for(var i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal) fin+=e.results[i][0].transcript; else s+=e.results[i][0].transcript; } all=(fin+' '+s).trim(); if(onInterim) onInterim(all); };
    r.onerror=function(e){ if(e.error==='not-allowed') toast('Δώστε άδεια στο μικρόφωνο από τον browser'); else if(e.error!=='no-speech'&&e.error!=='aborted') toast('Δεν άκουσα καλά — ξαναδοκιμάστε'); };
    r.onend=function(){ REC=null; btn.classList.remove('rec'); if(inp) inp.placeholder='Ρωτήστε ή πείτε κάτι…'; if(all.trim()) onFinal(all.trim()); };
    try{ r.start(); }catch(e){ REC=null; btn.classList.remove('rec'); }
    return; }
  if(!navigator.mediaDevices||!window.MediaRecorder){ toast('Η φωνή δεν υποστηρίζεται εδώ — χρησιμοποιήστε το μικρόφωνο του πληκτρολογίου'); if(inp) inp.focus(); return; }
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    var mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/aac'].filter(function(t){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t); })[0]||'';
    var mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined), chunks=[], t0=Date.now(); MREC=mr;
    btn.classList.add('rec'); if(inp) inp.placeholder='Σας ακούω… πατήστε ξανά όταν τελειώσετε';
    var cap=setTimeout(function(){ try{mr.stop()}catch(e){} },60000);
    mr.ondataavailable=function(e){ if(e.data&&e.data.size) chunks.push(e.data); };
    mr.onstop=async function(){ clearTimeout(cap); MREC=null; btn.classList.remove('rec'); stream.getTracks().forEach(function(t){t.stop()}); if(inp) inp.placeholder='Μετατρέπω τη φωνή σε κείμενο…';
      try{ var blob=new Blob(chunks,{type:mr.mimeType||mime||'audio/webm'}); if(Date.now()-t0<700||!blob.size){ if(inp) inp.placeholder='Ρωτήστε ή πείτε κάτι…'; return; }
        var text=await CLOUD.transcribe(blob); if(inp) inp.placeholder='Ρωτήστε ή πείτε κάτι…'; if(text) onFinal(text); else toast('Δεν άκουσα κάτι — ξαναδοκιμάστε'); }
      catch(e){ if(inp) inp.placeholder='Ρωτήστε ή πείτε κάτι…'; toast(e.message); } };
    mr.start();
  }).catch(function(){ toast('Δώστε άδεια στο μικρόφωνο'); });
}
function voice(inp,btn){ listen(btn,function(v){ inp.value=''; ask(v,{voice:true}); },function(v){ inp.value=v; },inp); }

/* ================= VIEW: Σήμερα ================= */
function upcoming(){ var n=NI(); return S.items.filter(function(i){ var k=daysTo(i.date); return n.activeStatus.indexOf(i.status)>=0 && k<=n.alertDays && k>=-7; }).sort(function(a,b){ return a.date<b.date?-1:1; }); }
function openRems(){ return S.reminders.filter(function(r){return !r.done}).sort(function(a,b){ return (a.date+(a.time||'99'))<(b.date+(b.time||'99'))?-1:1; }); }
function vToday(m){ var n=NI(), hr=new Date().getHours(), greet=hr<12?'Καλημέρα':hr<18?'Καλησπέρα':'Καλό βράδυ', now=new Date();
  var due=openRems().filter(function(r){return daysTo(r.date)<=0}), up=upcoming(), sug=n.suggest(S,H());
  m.innerHTML='<div class="pg today">'+
   '<header class="hello"><div><div class="eyebrow">'+DNF[now.getDay()]+' '+now.getDate()+' '+MNF[now.getMonth()]+'</div><h1>'+greet+(S.office.owner?', '+esc(voc(S.office.owner.split(' ')[0])):'')+'.</h1><p>'+(due.length? 'Έχετε <b>'+due.length+'</b> '+(due.length===1?'υπενθύμιση':'υπενθυμίσεις')+' για σήμερα και <b>'+up.length+'</b> '+esc(n.upcomingTitle.toLowerCase())+'.' : 'Τίποτα εκπρόθεσμο — '+up.length+' '+esc(n.upcomingTitle.toLowerCase())+' στον ορίζοντα.')+'</p></div></header>'+
   aiBar(true)+chipsHtml()+
   '<div class="tgrid"><div class="col">'+
    '<section class="card"><div class="ch"><h2>'+IC.bell+' Σήμερα</h2><a href="#reminders">Όλες →</a></div><div class="qadd"><input type="text" id="qadd" placeholder="+ Νέα υπενθύμιση — π.χ. «αύριο 10:00 πάρε τον Λάμπρου»"><button type="button" id="qaddB">'+IC.plus+'</button></div>'+
     (due.length? due.map(remRow).join('') : '<div class="empty">Καμία υπενθύμιση για σήμερα. Πείτε στον βοηθό «θύμισέ μου…».</div>')+'</section>'+
    '<section class="card"><div class="ch"><h2>'+IC.clock+' '+esc(n.upcomingTitle)+'</h2><a href="#items">'+esc(n.items)+' →</a></div>'+
     (up.length? up.slice(0,8).map(itemRow).join('')+(up.length>8?'<a class="more" href="#items">+ '+(up.length-8)+' ακόμα</a>':'') : '<div class="empty">Τίποτα τις επόμενες μέρες.</div>')+'</section>'+
   '</div><div class="col">'+
    '<section class="card brief"><div class="ch"><h2>'+IC.spark+' Πρωινή ενημέρωση</h2><button type="button" class="lnk" id="briefB">'+(S.brief&&S.brief.date===today()?'Ανανέωση':'Φτιάξ\' την')+'</button></div><div id="briefT">'+briefHtml()+'</div></section>'+
    '<section class="card"><div class="ch"><h2>'+IC.spark+' Προτάσεις του βοηθού</h2></div>'+(sug.length? sug.map(function(s){ return '<div class="sug"><div class="si">'+(IC[s.icon]||IC.spark)+'</div><div><b>'+esc(s.title)+'</b><p>'+esc(s.text)+'</p><button type="button" class="lnk" data-ask="'+esc(s.ask)+'">Ζήτα από τον βοηθό →</button></div></div>'; }).join('') : '<div class="empty">Όλα καλά — καμία πρόταση τώρα.</div>')+'</section>'+
    '<section class="stats"><div><b>'+S.clients.length+'</b><span>'+esc(n.clients.toLowerCase())+'</span></div><div><b>'+S.items.length+'</b><span>'+esc(n.items.toLowerCase())+'</span></div><div><b>'+openRems().length+'</b><span>ανοιχτές υπενθυμίσεις</span></div></section>'+
   '</div></div></div>';
  wireAiBar(m); wireChips(m); wireRows(m);
  var qa=$('#qadd',m); function addQ(){ var v=qa.value.trim(); if(!v) return; quickReminder(v); qa.value=''; } $('#qaddB',m).onclick=addQ; qa.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); addQ(); } });
  $('#briefB',m).onclick=makeBrief; }
function remRow(r){ var c=client(r.clientId); return '<div class="row rrow'+(daysTo(r.date)<0?' late':'')+'" data-rid="'+r.id+'"><button type="button" class="ck" data-done="'+r.id+'" title="Έγινε">'+IC.check+'</button><div class="rm"><b>'+esc(r.text)+'</b><span>'+(c?'<a data-cid="'+c.id+'">'+esc(c.name)+'</a> · ':'')+fmtDate(r.date)+(r.time?' '+r.time:'')+(r.source==='voice'?' · από φωνητικό':r.source==='ai'?' · από τον βοηθό':'')+'</span></div>'+relBadge(r.date)+'</div>'; }
function itemRow(i){ var c=client(i.clientId), n=NI(); return '<div class="row irow" data-cid="'+i.clientId+'"><div class="tag t'+(n.types.indexOf(i.type)%6)+'">'+esc(i.type)+'</div><div class="rm"><b>'+esc(c?c.name:'—')+'</b><span>'+esc(i.title)+(i.amount?' · '+money(i.amount):'')+(i.status?' · '+esc(i.status):'')+'</span></div><div class="rd">'+fmtDate(i.date)+relBadge(i.date)+'</div></div>'; }
function wireRows(root){ $$('[data-done]',root).forEach(function(b){ b.onclick=function(e){ e.stopPropagation(); doneReminder(b.getAttribute('data-done')); }; });
  $$('[data-cid]',root).forEach(function(a){ a.onclick=function(e){ if(e.target.closest('[data-done]')) return; e.preventDefault(); go('client/'+a.getAttribute('data-cid')); }; }); }
function doneReminder(id){ var r=rem(id); if(!r) return; r.done=true; r.doneAt=Date.now(); if(r.clientId){ logAct(r.clientId,'✓ '+r.text,'done'); var c=client(r.clientId); if(c) c.lastContact=today(); } save(); render(); toast('Έγινε: '+r.text,function(){ r.done=false; delete r.doneAt; save(); render(); }); }
function quickReminder(text){ var w=parseWhen(text), c=findClient(text); var r={id:U.uid('r'),text:cleanReminder(text,c),date:w.date||U.addDays(1),time:w.time,clientId:c?c.id:null,done:false,source:'manual',createdAt:Date.now()}; S.reminders.push(r); save(); render(); toast('Υπενθύμιση: '+fmtDate(r.date)+(r.time?' '+r.time:'')+(c?' · '+c.name:''),function(){ S.reminders=S.reminders.filter(function(x){return x!==r}); save(); render(); }); }
function briefHtml(){ if(S.brief && S.brief.date===today()) return '<div class="md">'+md(S.brief.text)+'</div><div class="fine">'+(S.brief.ai?'Από τον βοηθό':'Αυτόματη σύνοψη')+' · '+new Date(S.brief.at).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})+'</div>'; return '<div class="empty">Πατήστε «Φτιάξ\' την» — ο βοηθός διαβάζει όλο το γραφείο και σας λέει τι μετράει σήμερα.</div>'; }
function localBrief(){ var n=NI(), due=openRems().filter(function(r){return daysTo(r.date)<=0}), up=upcoming(), sug=n.suggest(S,H()); var L=[];
  L.push('**Σήμερα:** '+(due.length? due.length+' υπενθυμίσεις — '+due.slice(0,3).map(function(r){ var c=client(r.clientId); return (c?c.name+': ':'')+r.text; }).join('; ') : 'καμία υπενθύμιση.'));
  L.push('**'+n.upcomingTitle+':** '+(up.length? up.length+' — πρώτα: '+up.slice(0,3).map(function(i){ return client(i.clientId).name+' ('+i.title+', '+fmtDate(i.date)+')'; }).join(', ') : 'τίποτα κοντά.'));
  if(sug[0]) L.push('**Ευκαιρία:** '+sug[0].title+'.');
  return L.map(function(x){return '- '+x}).join('\n'); }
async function makeBrief(){ var t=$('#briefT'); if(!apiKey()){ S.brief={date:today(),text:localBrief(),ai:false,at:Date.now()}; save(); if(t) t.innerHTML=briefHtml(); toast('Με AI κλειδί η ενημέρωση γράφεται από τον βοηθό'); return; }
  if(t) t.innerHTML='<div class="think"><i></i><i></i><i></i> Ο βοηθός διαβάζει το γραφείο…</div>';
  try{ var res=await callClaude([{role:'user',content:'Κάνε μου την πρωινή ενημέρωση για σήμερα σε 4–6 σύντομες κουκκίδες: τι πρέπει να γίνει σήμερα, τι επείγει τις επόμενες μέρες, μία ευκαιρία με ονόματα, και μία πρόταση για το τι να κάνω πρώτο. Χωρίς εισαγωγή.'}],false,600);
    var txt=(res.content||[]).filter(function(b){return b.type==='text'}).map(function(b){return b.text}).join('\n'); S.brief={date:today(),text:txt,ai:true,at:Date.now()}; save(); if(t) t.innerHTML=briefHtml(); }
  catch(e){ if(t) t.innerHTML='<div class="err">'+esc(e.message)+'</div>'; } }

/* ================= VIEW: Πελάτες ================= */
var CQ='';
function nextDateOf(cid){ var n=NI(), ds=itemsOf(cid).filter(function(i){return n.activeStatus.indexOf(i.status)>=0 && i.date}).map(function(i){return i.date}).concat(S.reminders.filter(function(r){return r.clientId===cid && !r.done}).map(function(r){return r.date})).sort(); return ds[0]||null; }
function vClients(m){ var n=NI();
  m.innerHTML='<div class="pg"><header class="ph"><h1>'+esc(n.clients)+'</h1><div class="pha"><button type="button" class="btn pri" id="newC">'+IC.plus+' Νέος</button></div></header>'+
   '<div class="srch">'+IC.search+'<input type="search" id="cq" placeholder="Αναζήτηση: όνομα, τηλέφωνο, πόλη, '+esc(n.item.toLowerCase())+'…" value="'+esc(CQ)+'"></div><div id="clist" class="clist"></div></div>';
  var inp=$('#cq',m); inp.addEventListener('input',function(){ CQ=inp.value; list(); }); $('#newC',m).onclick=function(){ clientForm(); };
  function list(){ var q=norm(CQ); var arr=S.clients.filter(function(c){ if(!q) return true; var hay=norm(c.name+' '+c.phone+' '+c.city+' '+(c.tags||[]).join(' ')+' '+itemsOf(c.id).map(function(i){return i.title+' '+i.ref+' '+i.type}).join(' ')); return q.split(/\s+/).every(function(w){return hay.indexOf(w)>=0}); });
    arr.sort(function(a,b){ var x=nextDateOf(a.id)||'9999', y=nextDateOf(b.id)||'9999'; return x<y?-1:x>y?1:a.name.localeCompare(b.name,'el'); });
    $('#clist',m).innerHTML=arr.length? arr.map(function(c){ var nd=nextDateOf(c.id), its=itemsOf(c.id); return '<a class="crow" href="#client/'+c.id+'"><span class="av">'+esc(initials(c.name))+'</span><div class="rm"><b>'+esc(c.name)+'</b><span>'+esc([c.phone,c.city].filter(Boolean).join(' · '))+(its.length?' · '+its.length+' '+esc(n.items.toLowerCase()):'')+'</span></div>'+(c.tags&&c.tags.length?'<span class="tg2">'+esc(c.tags[0])+'</span>':'')+(nd?'<div class="rd">'+fmtDate(nd)+relBadge(nd)+'</div>':'')+'</a>'; }).join('') : '<div class="empty">Κανένα αποτέλεσμα. Ρωτήστε τον βοηθό — ψάχνει και σε σημειώσεις.</div>'; }
  list(); setTimeout(function(){ if(innerWidth>900) inp.focus(); },50); }

/* ================= VIEW: καρτέλα πελάτη ================= */
function vClient(m){ var c=client(PARAM), n=NI(); if(!c){ m.innerHTML='<div class="pg"><div class="empty">Δεν βρέθηκε. <a href="#clients">Πίσω</a></div></div>'; return; }
  var its=itemsOf(c.id).sort(function(a,b){return (a.date||'9')<(b.date||'9')?-1:1}), rs=S.reminders.filter(function(r){return r.clientId===c.id}), acts=S.activity.filter(function(a){return a.clientId===c.id}).sort(function(a,b){return b.at-a.at});
  var ph=(c.phone||'').replace(/\D/g,''), intl=ph.length===10?'+30'+ph:ph;
  m.innerHTML='<div class="pg client"><a class="back" href="#clients">'+IC.back+' '+esc(n.clients)+'</a>'+
   '<header class="chead"><span class="av big">'+esc(initials(c.name))+'</span><div><h1>'+esc(c.name)+'</h1><p>'+esc([c.phone,c.city].concat(c.tags||[]).filter(Boolean).join(' · '))+'</p></div><button type="button" class="btn" id="editC">'+IC.edit+' Επεξεργασία</button></header>'+
   '<div class="acts">'+(ph?'<a class="act" href="tel:'+esc(intl)+'">'+IC.phone+'<span>Κλήση</span></a><a class="act" href="viber://chat?number='+encodeURIComponent(intl)+'">'+IC.msg+'<span>Viber</span></a>':'')+
    '<button type="button" class="act" id="aMsg">'+IC.spark+'<span>Μήνυμα με AI</span></button><button type="button" class="act" id="aRem">'+IC.bell+'<span>Υπενθύμιση</span></button><button type="button" class="act" id="aNote">'+IC.note+'<span>Σημείωση</span></button><label class="act">'+IC.cam+'<span>Διάβασε έγγραφο</span><input type="file" accept="image/*" capture="environment" id="aDoc" hidden></label></div>'+
   '<div class="aibar sm"><span class="sp">'+IC.spark+'</span><input type="text" class="aiIn" placeholder="Ρωτήστε για '+esc(c.name.split(' ')[0])+'… π.χ. «τι εκκρεμεί;»" autocomplete="off"><button type="button" class="mic">'+IC.mic+'</button><button type="button" class="snd">'+IC.send+'</button></div>'+
   '<div class="cgrid"><div class="col">'+
    '<section class="card"><div class="ch"><h2>'+IC.doc+' '+esc(n.items)+'</h2><button type="button" class="lnk" id="newI">+ Νέο</button></div>'+(its.length? its.map(function(i){ return '<div class="row irow2" data-iid="'+i.id+'"><div class="tag t'+(n.types.indexOf(i.type)%6)+'">'+esc(i.type)+'</div><div class="rm"><b>'+esc(i.title)+'</b><span>'+esc([i.ref,i.extra,i.amount?money(i.amount):''].filter(Boolean).join(' · '))+'</span></div><div class="rd">'+(i.date?esc(n.dateLabel)+' '+fmtDate(i.date)+relBadge(i.date):'')+'<span class="st">'+esc(i.status||'')+'</span></div></div>'; }).join('') : '<div class="empty">Τίποτα ακόμα.</div>')+'</section>'+
    '<section class="card"><div class="ch"><h2>'+IC.bell+' Υπενθυμίσεις</h2></div>'+(rs.filter(function(r){return !r.done}).length? rs.filter(function(r){return !r.done}).map(remRow).join('') : '<div class="empty">Καμία ανοιχτή.</div>')+'</section>'+
   '</div><div class="col">'+
    '<section class="card"><div class="ch"><h2>'+IC.user+' Στοιχεία</h2></div><dl class="dl">'+[['Τηλέφωνο',c.phone],['E-mail',c.email],['ΑΦΜ',c.afm],['Πόλη / περιοχή',c.city],['Τελευταία επαφή',c.lastContact?fmtDate(c.lastContact):''],['Σημειώσεις',c.notes]].filter(function(x){return x[1]}).map(function(x){return '<dt>'+x[0]+'</dt><dd>'+esc(x[1])+'</dd>'}).join('')+'</dl></section>'+
    '<section class="card"><div class="ch"><h2>'+IC.clock+' Ιστορικό</h2></div>'+(acts.length? '<ul class="tl">'+acts.slice(0,20).map(function(a){ return '<li><b>'+esc(a.text)+'</b><span>'+new Date(a.at).toLocaleDateString('el-GR',{day:'numeric',month:'short'})+' · '+({note:'σημείωση',call:'κλήση',done:'έγινε',msg:'μήνυμα',ai:'βοηθός',doc:'έγγραφο'}[a.kind]||a.kind)+'</span></li>'; }).join('')+'</ul>' : '<div class="empty">Οι σημειώσεις και ό,τι γίνεται εμφανίζονται εδώ.</div>')+'</section>'+
    '<button type="button" class="btn danger" id="delC">'+IC.trash+' Διαγραφή '+esc(n.client.toLowerCase())+'</button>'+
   '</div></div></div>';
  wireAiBar(m); wireRows(m);
  $$('.aibar.sm',m).forEach(function(b){ var inp=$('.aiIn',b); function go2(){ var v=inp.value.trim(); if(!v) return; inp.value=''; ask(v+' (για: '+c.name+')'); } $('.snd',b).onclick=go2; inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); go2(); } }; });
  $('#editC',m).onclick=function(){ clientForm(c); };
  $('#newI',m).onclick=function(){ itemForm(null,c.id); };
  $$('[data-iid]',m).forEach(function(r){ r.onclick=function(){ itemForm(item(r.getAttribute('data-iid'))); }; });
  $('#aRem',m).onclick=function(){ remForm({clientId:c.id}); };
  $('#aNote',m).onclick=function(){ modal('Σημείωση — '+c.name,'<textarea id="fN" rows="4" placeholder="Τι ειπώθηκε, τι θέλει, τι να θυμάμαι…"></textarea>',function(f){ var v=$('#fN',f).value.trim(); if(!v) return false; logAct(c.id,v,'note'); c.lastContact=today(); save(); render(); }); };
  $('#aMsg',m).onclick=function(){ ask('Γράψε μου ένα σύντομο, ευγενικό μήνυμα για '+c.name+' με βάση ό,τι εκκρεμεί μαζί του/της (και δείξ\' το με show_message).'); };
  $('#aDoc',m).onchange=function(e){ var f=e.target.files[0]; if(f) readDoc(f,c); };
  $('#delC',m).onclick=function(){ if(!confirm('Διαγραφή του/της '+c.name+' και όλων των στοιχείων; Δεν αναιρείται.')) return; S.clients=S.clients.filter(function(x){return x!==c}); S.items=S.items.filter(function(i){return i.clientId!==c.id}); S.reminders=S.reminders.filter(function(r){return r.clientId!==c.id}); save(); go('clients'); }; }

/* ================= VIEW: items ================= */
var IF={type:'',status:'',q:''};
function vItems(m){ var n=NI(); var matches=n.matches? n.matches(S):[];
  m.innerHTML='<div class="pg"><header class="ph"><h1>'+esc(n.items)+'</h1><div class="pha"><button type="button" class="btn pri" id="newI2">'+IC.plus+' Νέο</button></div></header>'+
   (matches.length? '<section class="card match"><div class="ch"><h2>'+IC.spark+' Ταιριάσματα που βρήκε ο βοηθός</h2></div>'+matches.slice(0,6).map(function(x){ return '<div class="row"><div class="rm"><b>'+esc(x.prop.title)+' · '+money(x.prop.amount)+'</b><span>'+x.wants.map(function(w){ var c=client(w.clientId); return '<a data-cid="'+w.clientId+'">'+esc(c.name)+'</a> (έως '+money(w.amount)+')'; }).join(' · ')+'</span></div><button type="button" class="lnk" data-ask="'+esc('Γράψε μήνυμα στους αγοραστές που ταιριάζουν στο '+x.prop.title+' με show_message για τον καθένα.')+'">Μήνυμα →</button></div>'; }).join('')+'</section>' : '')+
   '<div class="filters"><div class="chips">'+['',].concat(n.types).map(function(t){ return '<button type="button" data-type="'+esc(t)+'" class="'+(IF.type===t?'on':'')+'">'+(t||'Όλα')+'</button>'; }).join('')+'</div><select id="fst"><option value="">Κάθε κατάσταση</option>'+n.statuses.map(function(s){return '<option'+(IF.status===s?' selected':'')+'>'+esc(s)+'</option>'}).join('')+'</select><div class="srch sm">'+IC.search+'<input type="search" id="iq" placeholder="Αναζήτηση…" value="'+esc(IF.q)+'"></div></div><div class="card tbl" id="ilist"></div></div>';
  wireRows(m); wireChips(m);
  $$('[data-type]',m).forEach(function(b){ b.onclick=function(){ IF.type=b.getAttribute('data-type'); render(); }; });
  $('#fst',m).onchange=function(e){ IF.status=e.target.value; list(); }; var q=$('#iq',m); q.oninput=function(){ IF.q=q.value; list(); };
  $('#newI2',m).onclick=function(){ itemForm(null,null); };
  function list(){ var qq=norm(IF.q); var arr=S.items.filter(function(i){ if(IF.type && i.type!==IF.type) return false; if(IF.status && i.status!==IF.status) return false; if(qq){ var c=client(i.clientId); if(norm((c?c.name:'')+' '+i.title+' '+i.ref+' '+i.extra).indexOf(qq)<0) return false; } return true; }).sort(function(a,b){return (a.date||'9')<(b.date||'9')?-1:1});
    $('#ilist',m).innerHTML=arr.length? '<div class="thead"><span>'+esc(n.client)+'</span><span>'+esc(n.item)+'</span><span>'+esc(n.dateLabel)+'</span><span>Κατάσταση</span></div>'+arr.map(function(i){ var c=client(i.clientId); return '<div class="trow" data-iid="'+i.id+'"><span><a data-cid="'+i.clientId+'">'+esc(c?c.name:'—')+'</a></span><span><b>'+esc(i.title)+'</b><small>'+esc([i.type,i.ref,i.amount?money(i.amount):''].filter(Boolean).join(' · '))+'</small></span><span>'+fmtDate(i.date)+relBadge(i.date)+'</span><span><select data-st="'+i.id+'">'+n.statuses.map(function(s){return '<option'+(i.status===s?' selected':'')+'>'+esc(s)+'</option>'}).join('')+'</select></span></div>'; }).join('') : '<div class="empty">Κανένα αποτέλεσμα.</div>';
    wireRows($('#ilist',m)); $$('[data-st]',m).forEach(function(s){ s.onclick=function(e){ e.stopPropagation(); }; s.onchange=function(){ var it=item(s.getAttribute('data-st')); var old=it.status; it.status=s.value; logAct(it.clientId,it.title+': '+old+' → '+it.status,'note'); save(); toast(it.title+' → '+it.status); }; });
    $$('.trow',m).forEach(function(r){ r.onclick=function(e){ if(e.target.closest('a,select')) return; itemForm(item(r.getAttribute('data-iid'))); }; }); }
  list(); }

/* ================= VIEW: υπενθυμίσεις ================= */
function vReminders(m){ var rs=openRems(), g={late:[],today:[],tom:[],week:[],later:[]};
  rs.forEach(function(r){ var k=daysTo(r.date); (k<0?g.late:k===0?g.today:k===1?g.tom:k<=7?g.week:g.later).push(r); });
  var done=S.reminders.filter(function(r){return r.done}).sort(function(a,b){return (b.doneAt||0)-(a.doneAt||0)}).slice(0,15);
  function grp(t,a,cls){ return a.length? '<section class="card'+(cls?' '+cls:'')+'"><div class="ch"><h2>'+t+' <span class="n">'+a.length+'</span></h2></div>'+a.map(remRow).join('')+'</section>' : ''; }
  m.innerHTML='<div class="pg"><header class="ph"><h1>Υπενθυμίσεις</h1><div class="pha"><button type="button" class="btn pri" id="newR">'+IC.plus+' Νέα</button></div></header>'+
   '<div class="qadd big"><input type="text" id="qadd" placeholder="Γράψτε σαν να το λέτε: «την Πέμπτη στις 11 πάρε τον Παπαδόπουλο για το σπίτι»"><button type="button" class="mic" id="qmic">'+IC.mic+'</button><button type="button" id="qaddB">'+IC.plus+'</button></div>'+
   grp('Εκπρόθεσμες',g.late,'late')+grp('Σήμερα',g.today)+grp('Αύριο',g.tom)+grp('Αυτή την εβδομάδα',g.week)+grp('Αργότερα',g.later)+
   (rs.length?'':'<div class="empty big">Καμία ανοιχτή υπενθύμιση. Πείτε στον βοηθό «θύμισέ μου…» ή γράψτε από πάνω.</div>')+
   (done.length? '<section class="card faded"><div class="ch"><h2>Ολοκληρώθηκαν</h2></div>'+done.map(function(r){ var c=client(r.clientId); return '<div class="row"><span class="ck on">'+IC.check+'</span><div class="rm"><b>'+esc(r.text)+'</b><span>'+(c?esc(c.name)+' · ':'')+fmtDate(r.date)+'</span></div><button type="button" class="lnk" data-undone="'+r.id+'">Επαναφορά</button></div>'; }).join('')+'</section>' : '')+'</div>';
  wireRows(m); $('#newR',m).onclick=function(){ remForm({}); };
  var qa=$('#qadd',m); function addQ(){ var v=qa.value.trim(); if(!v) return; quickReminder(v); } $('#qaddB',m).onclick=addQ; qa.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); addQ(); } };
  $('#qmic',m).onclick=function(){ listen($('#qmic',m),function(v){ qa.value=v; addQ(); },function(v){ qa.value=v; },qa); };
  $$('[data-undone]',m).forEach(function(b){ b.onclick=function(){ var r=rem(b.getAttribute('data-undone')); r.done=false; save(); render(); }; });
  $$('.rrow',m).forEach(function(row){ row.addEventListener('dblclick',function(){ remForm(rem(row.getAttribute('data-rid'))); }); }); }

/* ================= VIEW: βοηθός (κινητό) + chat panel ================= */
function vAssistant(m){ m.innerHTML='<div class="pg chatpg"><header class="ph"><h1>'+IC.spark+' Βοηθός</h1><div class="pha"><button type="button" class="btn" id="clr">Νέα συζήτηση</button></div></header><div class="chatbox" id="chatMain"></div>'+aiBar(false)+'</div>';
  wireAiBar(m); $('#clr',m).onclick=clearChat; renderChat(); var mic=$('.mic',m); if(PARAM==='voice' && mic){ history.replaceState(null,'','#assistant'); setTimeout(function(){ mic.click(); },150); } }
function clearChat(){ S.chat=[]; S.api=[]; save(); renderChat(); }
function renderChat(){ [$('#chatSide'),$('#chatMain')].forEach(function(box){ if(!box) return;
  if(!S.chat.length){ box.innerHTML='<div class="chempty"><div class="orb">'+IC.spark+'</div><b>Ο βοηθός του γραφείου σας</b><p>Του μιλάτε ή του γράφετε — ξέρει όλους τους '+esc(NI().clients.toLowerCase())+', τα '+esc(NI().items.toLowerCase())+' και τις υπενθυμίσεις σας.</p>'+chipsHtml()+'</div>'; wireChips(box); return; }
  box.innerHTML=S.chat.map(msgHtml).join('')+(BUSY?'<div class="msg ai"><div class="think"><i></i><i></i><i></i></div></div>':'');
  wireMsg(box); box.scrollTop=box.scrollHeight; }); }
function linkify(html){ var names=S.clients.map(function(c){return c}).sort(function(a,b){return b.name.length-a.name.length}); names.forEach(function(c){ var e=esc(c.name); if(html.indexOf(e)>=0) html=html.split(e).join('<a data-cid="'+c.id+'">'+e+'</a>'); }); return html; }
function md(t){ var lines=String(t||'').split('\n'), out=[], inL=false;
  lines.forEach(function(l){ var h=esc(l).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'); if(/^\s*([-•*]|\d+[.)])\s+/.test(l)){ if(!inL){ out.push('<ul>'); inL=true; } out.push('<li>'+h.replace(/^\s*([-•*]|\d+[.)])\s+/,'')+'</li>'); } else { if(inL){ out.push('</ul>'); inL=false; } if(h.trim()) out.push('<p>'+h.replace(/^#+\s*/,'')+'</p>'); } });
  if(inL) out.push('</ul>'); return linkify(out.join('')); }
function msgHtml(m,ix){ if(m.role==='user') return '<div class="msg me">'+(m.img?'<span class="att">'+IC.cam+' εικόνα</span>':'')+esc(m.text)+(m.voice?'<span class="vtag">'+IC.mic+'</span>':'')+'</div>';
  return '<div class="msg ai">'+(m.parts||[]).map(function(p,pi){ if(p.t==='text') return '<div class="md">'+md(p.text)+'</div>'; if(p.t==='card') return cardHtml(p,ix,pi); if(p.t==='err') return '<div class="err">'+esc(p.text)+'</div>'; return ''; }).join('')+'</div>'; }
function cardHtml(p,ix,pi){ var D=p.d||{}, k=p.kind, id='data-ci="'+ix+':'+pi+'"';
  if(k==='reminder') return '<div class="tcard rem'+(p.undone?' gone':'')+'" '+id+'><span class="ti">'+IC.bell+'</span><div><b>Υπενθύμιση</b><span>'+esc(D.text)+'</span><small>'+fmtDate(D.date)+(D.time?' '+D.time:'')+(D.clientName?' · '+esc(D.clientName):'')+'</small></div>'+(p.undone?'<em>Αναιρέθηκε</em>':'<button type="button" class="ub" data-undo>'+IC.undo+'</button>')+'</div>';
  if(k==='client') return '<div class="tcard'+(p.undone?' gone':'')+'" '+id+'><span class="ti">'+IC.user+'</span><div><b>Νέα καρτέλα</b><span>'+esc(D.name)+'</span><small>'+esc([D.phone,D.city].filter(Boolean).join(' · '))+'</small></div>'+(p.undone?'<em>Αναιρέθηκε</em>':'<a class="ub txt" data-cid="'+D.id+'">Άνοιγμα</a><button type="button" class="ub" data-undo>'+IC.undo+'</button>')+'</div>';
  if(k==='item') return '<div class="tcard'+(p.undone?' gone':'')+'" '+id+'><span class="ti">'+IC.doc+'</span><div><b>Νέο: '+esc(D.type||NI().item)+'</b><span>'+esc(D.title)+'</span><small>'+esc(D.clientName||'')+(D.date?' · '+esc(NI().dateLabel)+' '+fmtDate(D.date):'')+(D.amount?' · '+money(D.amount):'')+'</small></div>'+(p.undone?'<em>Αναιρέθηκε</em>':'<button type="button" class="ub" data-undo>'+IC.undo+'</button>')+'</div>';
  if(k==='note') return '<div class="tcard'+(p.undone?' gone':'')+'" '+id+'><span class="ti">'+IC.note+'</span><div><b>Σημείωση · '+esc(D.clientName||'')+'</b><span>'+esc(D.text)+'</span></div>'+(p.undone?'<em>Αναιρέθηκε</em>':'<button type="button" class="ub" data-undo>'+IC.undo+'</button>')+'</div>';
  if(k==='done') return '<div class="tcard'+(p.undone?' gone':'')+'" '+id+'><span class="ti">'+IC.check+'</span><div><b>Ολοκληρώθηκε</b><span>'+esc(D.text)+'</span></div>'+(p.undone?'<em>Αναιρέθηκε</em>':'<button type="button" class="ub" data-undo>'+IC.undo+'</button>')+'</div>';
  if(k==='pending') return '<div class="tcard pend '+(p.state||'')+'" '+id+'><span class="ti">'+IC.edit+'</span><div><b>'+esc(D.title)+'</b>'+D.lines.map(function(l){return '<span class="chg"><i>'+esc(l[0])+'</i> '+(l[1]!==''&&l[1]!=null?'<s>'+esc(l[1])+'</s> → ':'')+'<b>'+esc(l[2])+'</b></span>'}).join('')+'</div>'+(p.state==='ok'?'<em class="ok">Εγκρίθηκε</em>':p.state==='no'?'<em>Απορρίφθηκε</em>':'<div class="pb"><button type="button" class="yes" data-yes>'+IC.check+' Έγκριση</button><button type="button" class="no" data-no>'+IC.x+'</button></div>')+'</div>';
  if(k==='message'){ var c=client(D.clientId), ph=c&&c.phone?c.phone.replace(/\D/g,''):'', intl=ph.length===10?'+30'+ph:ph; return '<div class="tcard msgc" '+id+'><div class="mh">'+IC.msg+' Μήνυμα'+(c?' προς <a data-cid="'+c.id+'">'+esc(c.name)+'</a>':'')+'</div><textarea rows="5">'+esc(D.text)+'</textarea><div class="mb"><button type="button" data-copy>Αντιγραφή</button>'+(ph?'<a href="sms:'+esc(intl)+'?&body='+encodeURIComponent(D.text)+'">SMS</a><a href="viber://forward?text='+encodeURIComponent(D.text)+'">Viber</a>':'')+(c&&c.email?'<a href="mailto:'+esc(c.email)+'?body='+encodeURIComponent(D.text)+'">E-mail</a>':'')+'<button type="button" data-sent>Στάλθηκε ✓</button></div></div>'; }
  if(k==='list') return '<div class="tcard list" '+id+'>'+D.rows.map(function(r){ return '<a class="lr" data-cid="'+r.cid+'"><b>'+esc(r.a)+'</b><span>'+esc(r.b)+'</span></a>'; }).join('')+'</div>';
  return ''; }
function wireMsg(box){ wireRows(box); wireChips(box);
  $$('[data-ci]',box).forEach(function(el){ var k=el.getAttribute('data-ci').split(':'), mi=+k[0], pi=+k[1], p=S.chat[mi]&&S.chat[mi].parts[pi]; if(!p) return;
    var u=$('[data-undo]',el); if(u) u.onclick=function(){ undoCard(p); p.undone=true; save(); render(); };
    var y=$('[data-yes]',el); if(y) y.onclick=function(){ applyPending(p); };
    var n=$('[data-no]',el); if(n) n.onclick=function(){ p.state='no'; save(); renderChat(); };
    var cp=$('[data-copy]',el); if(cp) cp.onclick=function(){ copy($('textarea',el).value); };
    var st=$('[data-sent]',el); if(st) st.onclick=function(){ var c=client(p.d.clientId); if(c){ logAct(c.id,'Μήνυμα: '+$('textarea',el).value.slice(0,120),'msg'); c.lastContact=today(); save(); } toast('Καταγράφηκε στο ιστορικό'); }; });
  var many=$$('[data-yes]',box); if(many.length>1 && !$('.allyes',box)){ var b=d.createElement('button'); b.className='btn pri allyes'; b.innerHTML=IC.check+' Έγκριση όλων ('+many.length+')'; b.onclick=function(){ S.chat.forEach(function(m){ (m.parts||[]).forEach(function(p){ if(p.t==='card'&&p.kind==='pending'&&!p.state) applyPending(p,true); }); }); save(); render(); }; box.appendChild(b); } }
function undoCard(p){ var u=p.undo; if(!u) return; if(u.coll==='reminders') S.reminders=S.reminders.filter(function(x){return x.id!==u.id}); if(u.coll==='clients'){ S.clients=S.clients.filter(function(x){return x.id!==u.id}); S.items=S.items.filter(function(x){return x.clientId!==u.id}); } if(u.coll==='items') S.items=S.items.filter(function(x){return x.id!==u.id}); if(u.coll==='activity') S.activity=S.activity.filter(function(x){return x.id!==u.id}); if(u.coll==='done'){ var r=rem(u.id); if(r) r.done=false; } }
function applyPending(p,silent){ var D=p.d; if(D.kind==='client'){ var c=client(D.id); if(c){ Object.assign(c,D.changes); logAct(c.id,'Αλλαγή στοιχείων από τον βοηθό','ai'); } } else { var it=item(D.id); if(it){ Object.assign(it,D.changes); logAct(it.clientId,it.title+' — αλλαγή από τον βοηθό','ai'); } } p.state='ok'; if(!silent){ save(); render(); toast('Εγκρίθηκε'); } }

/* ================= AI agent ================= */
var BUSY=false;
var TOOLS=[
 {name:'search_data',description:'Αναζήτηση σε πελάτες, items, υπενθυμίσεις και σημειώσεις. Επιστρέφει ταιριάσματα με ids.',input_schema:{type:'object',properties:{query:{type:'string'}},required:['query']}},
 {name:'get_client',description:'Όλα τα στοιχεία ενός πελάτη: items, υπενθυμίσεις, ιστορικό.',input_schema:{type:'object',properties:{client_id:{type:'string'}},required:['client_id']}},
 {name:'add_reminder',description:'Προσθέτει υπενθύμιση (εφαρμόζεται αμέσως, ο χρήστης μπορεί να την αναιρέσει). date σε YYYY-MM-DD, time HH:MM ή κενό.',input_schema:{type:'object',properties:{text:{type:'string',description:'Σύντομη, σε προστακτική, π.χ. «Πάρε τηλέφωνο για την ασφάλεια σπιτιού»'},date:{type:'string'},time:{type:'string'},client_id:{type:'string'}},required:['text','date']}},
 {name:'complete_reminder',description:'Σημειώνει υπενθύμιση ως ολοκληρωμένη.',input_schema:{type:'object',properties:{reminder_id:{type:'string'}},required:['reminder_id']}},
 {name:'add_note',description:'Προσθέτει σημείωση στο ιστορικό πελάτη (π.χ. τι ειπώθηκε σε τηλέφωνο).',input_schema:{type:'object',properties:{client_id:{type:'string'},text:{type:'string'}},required:['client_id','text']}},
 {name:'add_client',description:'Δημιουργεί νέα καρτέλα πελάτη/επαφής. Επιστρέφει το νέο id.',input_schema:{type:'object',properties:{name:{type:'string'},phone:{type:'string'},email:{type:'string'},afm:{type:'string'},city:{type:'string'},tags:{type:'array',items:{type:'string'}},notes:{type:'string'}},required:['name']}},
 {name:'add_item',description:'Προσθέτει item (συμβόλαιο / υποχρέωση / ακίνητο ή ζήτηση) σε πελάτη.',input_schema:{type:'object',properties:{client_id:{type:'string'},type:{type:'string'},title:{type:'string'},date:{type:'string'},amount:{type:'number'},status:{type:'string'},ref:{type:'string'},extra:{type:'string'}},required:['client_id','type','title']}},
 {name:'update_client',description:'Προτείνει αλλαγή σε στοιχεία υπάρχοντος πελάτη. Ο χρήστης εγκρίνει με ένα κουμπί.',input_schema:{type:'object',properties:{client_id:{type:'string'},changes:{type:'object',description:'πεδία: name, phone, email, afm, city, notes, tags'}},required:['client_id','changes']}},
 {name:'update_item',description:'Προτείνει αλλαγή σε υπάρχον item (π.χ. νέα ημερομηνία, κατάσταση, ποσό). Ο χρήστης εγκρίνει με ένα κουμπί.',input_schema:{type:'object',properties:{item_id:{type:'string'},changes:{type:'object',description:'πεδία: type, title, date, amount, status, ref, extra'}},required:['item_id','changes']}},
 {name:'show_message',description:'Δείχνει έτοιμο μήνυμα προς πελάτη με κουμπιά αποστολής (Viber/SMS/e-mail). Χρησιμοποίησέ το κάθε φορά που γράφεις μήνυμα για πελάτη.',input_schema:{type:'object',properties:{client_id:{type:'string'},text:{type:'string'}},required:['client_id','text']}},
 {name:'show_list',description:'Δείχνει λίστα πελατών/items ως κάρτες που ανοίγουν με ένα πάτημα. Χρησιμοποίησέ το για απαντήσεις με πολλά ονόματα.',input_schema:{type:'object',properties:{rows:{type:'array',items:{type:'object',properties:{client_id:{type:'string'},title:{type:'string'},detail:{type:'string'}},required:['client_id','title']}}},required:['rows']}}
];
function sysPrompt(){ var n=NI(), now=new Date();
  return 'Είσαι ο AI βοηθός του γραφείου «'+(S.office.name||n.label)+'» ('+n.label+'), μέσα στην εφαρμογή Advon AI. Σήμερα είναι '+DNF[now.getDay()]+' '+U.iso(now)+', ώρα '+pad(now.getHours())+':'+pad(now.getMinutes())+'.\n'+
   n.vocab+'\n\nΚανόνες:\n- Απαντάς πάντα στα ελληνικά, σύντομα, φιλικά και πρακτικά — σαν έμπειρη γραμματέας που ξέρει όλο το γραφείο.\n- Χρησιμοποιείς τα εργαλεία για να κάνεις πράγματα (υπενθυμίσεις, σημειώσεις, νέες καρτέλες, αλλαγές). Όταν ο χρήστης λέει «θύμισέ μου…», βάζεις αμέσως add_reminder και επιβεβαιώνεις σε μία πρόταση.\n- Βρίσκεις τον πελάτη από το όνομα στα ΔΕΔΟΜΕΝΑ (και σε πτώσεις: «του Λάμπρου», «τον Παπαδόπουλο»). Αν υπάρχουν δύο ίδια ονόματα, ρωτάς.\n- Ημερομηνίες: «αύριο», «την Πέμπτη», «σε 2 εβδομάδες» → υπολογίζεις από τη σημερινή. Χωρίς ώρα αφήνεις time κενό.\n- Αλλαγές σε υπάρχοντα στοιχεία κάνεις μόνο με update_client / update_item (ο χρήστης εγκρίνει). Μην επινοείς στοιχεία που δεν υπάρχουν.\n- Για μηνύματα προς πελάτες χρησιμοποιείς show_message, με ευγενικό ύφος, πληθυντικό ευγενείας, υπογραφή με το όνομα του γραφείου.\n- Για απαντήσεις με πολλά ονόματα χρησιμοποιείς show_list και γράφεις μία σύντομη πρόταση σύνοψης.\n- Μορφή: σύντομες παράγραφοι ή κουκκίδες, χωρίς επικεφαλίδες, χωρίς emojis. Ποσά σε €.\n- Αν σου δώσουν φωτογραφία εγγράφου ή τετραδίου: διαβάζεις προσεκτικά και περνάς ό,τι βρίσκεις με add_client / add_item / update_*. Ό,τι δεν διαβάζεται καθαρά, το λες.'; }
function dataIndex(){ var n=NI(), L=['ΔΕΔΟΜΕΝΑ ΓΡΑΦΕΙΟΥ (ενημερωμένα τώρα)','',n.clients.toUpperCase()+' — id | όνomα | τηλέφωνο | πόλη | ετικέτες | τελευταία επαφή'.replace('omα','ομα')];
  S.clients.forEach(function(c){ L.push(c.id+' | '+c.name+' | '+(c.phone||'')+' | '+(c.city||'')+' | '+(c.tags||[]).join(',')+' | '+(c.lastContact||'')); });
  L.push('',n.items.toUpperCase()+' — id | client_id | τύπος | τίτλος | '+n.refLabel+' | '+n.dateLabel+' | '+n.amountLabel+' | κατάσταση | '+n.extraLabel);
  S.items.forEach(function(i){ L.push(i.id+' | '+i.clientId+' | '+i.type+' | '+i.title+' | '+(i.ref||'')+' | '+(i.date||'')+' | '+(i.amount||'')+' | '+(i.status||'')+' | '+(i.extra||'')); });
  L.push('','ΑΝΟΙΧΤΕΣ ΥΠΕΝΘΥΜΙΣΕΙΣ — id | ημερομηνία ώρα | client_id | κείμενο');
  openRems().forEach(function(r){ L.push(r.id+' | '+r.date+' '+(r.time||'')+' | '+(r.clientId||'')+' | '+r.text); });
  var acts=S.activity.slice(-60); if(acts.length){ L.push('','ΠΡΟΣΦΑΤΕΣ ΣΗΜΕΙΩΣΕΙΣ — client_id | ημερομηνία | κείμενο'); acts.forEach(function(a){ L.push(a.clientId+' | '+U.iso(new Date(a.at))+' | '+a.text); }); }
  var s=L.join('\n'); return s.length>120000? s.slice(0,120000)+'\n…(περικόπηκε — χρησιμοποίησε search_data)' : s; }
async function callClaude(messages,withTools,maxT){
  var body={model:S.settings.model,max_tokens:maxT||1500,system:[{type:'text',text:sysPrompt()},{type:'text',text:dataIndex(),cache_control:{type:'ephemeral'}}],messages:messages};
  if(withTools) body.tools=TOOLS;
  return await CLOUD.ai(body); }
async function ask(text,opt){ opt=opt||{}; if(BUSY) return; if(innerWidth<1180 && VIEW!=='assistant'){ location.hash='assistant'; }
  S.chat.push({role:'user',text:text,voice:!!opt.voice,img:!!opt.image}); var ai={role:'assistant',parts:[]}; S.chat.push(ai); save(); BUSY=true; renderChat();
  try{ if(!apiKey()) localAnswer(text,ai,opt); else await agent(text,ai,opt); }
  catch(e){ ai.parts.push({t:'err',text:e.message}); }
  BUSY=false; save(); render(); }
async function agent(text,ai,opt){ var content=opt.image? [{type:'image',source:{type:'base64',media_type:opt.image.type,data:opt.image.data}},{type:'text',text:text}] : text;
  var turn=[{role:'user',content:content}], hist=S.api.slice(); var msgs=hist.concat(turn);
  for(var step=0;step<8;step++){ var res=await callClaude(msgs,true,1800); var blocks=res.content||[]; msgs.push({role:'assistant',content:blocks}); turn.push({role:'assistant',content:blocks});
    blocks.forEach(function(b){ if(b.type==='text' && b.text.trim()) ai.parts.push({t:'text',text:b.text}); });
    renderChat();
    if(res.stop_reason!=='tool_use') break;
    var results=blocks.filter(function(b){return b.type==='tool_use'}).map(function(b){ var out; try{ out=runTool(b.name,b.input||{},ai,opt); }catch(e){ out={error:e.message}; } return {type:'tool_result',tool_use_id:b.id,content:JSON.stringify(out)}; });
    msgs.push({role:'user',content:results}); turn.push({role:'user',content:results}); save(); }
  /* keep history compact: images are replaced by a note so the browser storage doesn't fill up */
  turn[0]={role:'user',content:opt.image? '[ο χρήστης έστειλε εικόνα] '+text : text}; S.api=S.api.concat(turn);
  while(S.api.length>40){ var cut=1; while(cut<S.api.length && !(S.api[cut].role==='user' && typeof S.api[cut].content==='string')) cut++; S.api=S.api.slice(cut); } }
function runTool(name,x,ai,opt){ var n=NI(), c, r;
  switch(name){
  case 'search_data': { var q=norm(x.query), ws=q.split(/\s+/).filter(Boolean), out={clients:[],items:[],reminders:[],notes:[]}; function hit(s){ s=norm(s); return ws.every(function(w){return s.indexOf(w.slice(0,Math.max(3,w.length-2)))>=0}); }
    S.clients.forEach(function(c){ if(hit(c.name+' '+c.phone+' '+c.city+' '+(c.tags||[]).join(' ')+' '+c.notes)) out.clients.push({id:c.id,name:c.name,phone:c.phone}); });
    S.items.forEach(function(i){ var c=client(i.clientId); if(hit((c?c.name:'')+' '+i.type+' '+i.title+' '+i.ref+' '+i.extra+' '+i.status)) out.items.push({id:i.id,client:c?c.name:'',client_id:i.clientId,type:i.type,title:i.title,date:i.date,status:i.status}); });
    S.reminders.forEach(function(r){ if(hit(r.text)) out.reminders.push({id:r.id,text:r.text,date:r.date,done:r.done}); });
    S.activity.forEach(function(a){ if(hit(a.text)) out.notes.push({client_id:a.clientId,text:a.text,at:U.iso(new Date(a.at))}); });
    ['clients','items','reminders','notes'].forEach(function(k){ out[k]=out[k].slice(0,25); }); return out; }
  case 'get_client': c=client(x.client_id); if(!c) return {error:'δεν βρέθηκε'}; return {client:c,items:itemsOf(c.id),reminders:S.reminders.filter(function(r){return r.clientId===c.id}),history:S.activity.filter(function(a){return a.clientId===c.id}).slice(-20)};
  case 'add_reminder': c=x.client_id?client(x.client_id):null; r={id:U.uid('r'),text:x.text,date:/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')?x.date:U.addDays(1),time:/^\d{1,2}:\d{2}$/.test(x.time||'')?x.time:'',clientId:c?c.id:null,done:false,source:opt.voice?'voice':'ai',createdAt:Date.now()}; S.reminders.push(r);
    ai.parts.push({t:'card',kind:'reminder',d:{text:r.text,date:r.date,time:r.time,clientName:c?c.name:''},undo:{coll:'reminders',id:r.id}}); return {ok:true,id:r.id};
  case 'complete_reminder': r=rem(x.reminder_id); if(!r) return {error:'δεν βρέθηκε'}; r.done=true; r.doneAt=Date.now(); if(r.clientId) logAct(r.clientId,'✓ '+r.text,'done'); ai.parts.push({t:'card',kind:'done',d:{text:r.text},undo:{coll:'done',id:r.id}}); return {ok:true};
  case 'add_note': c=client(x.client_id); if(!c) return {error:'δεν βρέθηκε πελάτης'}; var a={id:U.uid('a'),clientId:c.id,text:x.text,kind:'ai',at:Date.now()}; S.activity.push(a); c.lastContact=today(); ai.parts.push({t:'card',kind:'note',d:{text:x.text,clientName:c.name},undo:{coll:'activity',id:a.id}}); return {ok:true};
  case 'add_client': c={id:U.uid('c'),name:x.name,phone:(x.phone||'').replace(/[^\d+]/g,''),email:x.email||'',afm:x.afm||'',city:x.city||'',tags:x.tags||[],notes:x.notes||'',createdAt:Date.now(),lastContact:today()}; S.clients.push(c); ai.parts.push({t:'card',kind:'client',d:{id:c.id,name:c.name,phone:c.phone,city:c.city},undo:{coll:'clients',id:c.id}}); return {ok:true,id:c.id};
  case 'add_item': c=client(x.client_id); if(!c) return {error:'δεν βρέθηκε πελάτης'}; var it={id:U.uid('i'),clientId:c.id,type:x.type||n.types[0],title:x.title,ref:x.ref||'',date:/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')?x.date:'',amount:x.amount||0,status:x.status||n.statuses[0],extra:x.extra||''}; S.items.push(it); ai.parts.push({t:'card',kind:'item',d:{type:it.type,title:it.title,date:it.date,amount:it.amount,clientName:c.name},undo:{coll:'items',id:it.id}}); return {ok:true,id:it.id};
  case 'update_client': c=client(x.client_id); if(!c) return {error:'δεν βρέθηκε'}; var ch=pick(x.changes,['name','phone','email','afm','city','notes','tags']); var lines=Object.keys(ch).map(function(k){ return [({name:'Όνομα',phone:'Τηλέφωνο',email:'E-mail',afm:'ΑΦΜ',city:'Πόλη',notes:'Σημειώσεις',tags:'Ετικέτες'})[k],String(c[k]||''),String(ch[k])]; });
    if(!S.settings.approve){ Object.assign(c,ch); return {ok:true,applied:true}; } ai.parts.push({t:'card',kind:'pending',d:{kind:'client',id:c.id,title:'Αλλαγή · '+c.name,changes:ch,lines:lines}}); return {ok:true,status:'περιμένει έγκριση από τον χρήστη (κουμπί). Μην το ξαναπροτείνεις.'};
  case 'update_item': var it2=item(x.item_id); if(!it2) return {error:'δεν βρέθηκε'}; var ch2=pick(x.changes,['type','title','date','amount','status','ref','extra']); var c2=client(it2.clientId); var lab={type:'Τύπος',title:'Τίτλος',date:n.dateLabel,amount:n.amountLabel,status:'Κατάσταση',ref:n.refLabel,extra:n.extraLabel};
    var lines2=Object.keys(ch2).map(function(k){ return [lab[k], k==='date'?fmtDate(it2[k]):String(it2[k]||''), k==='date'?fmtDate(ch2[k]):String(ch2[k])]; });
    if(!S.settings.approve){ Object.assign(it2,ch2); return {ok:true,applied:true}; } ai.parts.push({t:'card',kind:'pending',d:{kind:'item',id:it2.id,title:(c2?c2.name+' · ':'')+it2.title,changes:ch2,lines:lines2}}); return {ok:true,status:'περιμένει έγκριση από τον χρήστη (κουμπί). Μην το ξαναπροτείνεις.'};
  case 'show_message': ai.parts.push({t:'card',kind:'message',d:{clientId:x.client_id,text:x.text}}); return {ok:true,shown:true};
  case 'show_list': ai.parts.push({t:'card',kind:'list',d:{rows:(x.rows||[]).slice(0,30).map(function(r){ var c=client(r.client_id); return {cid:r.client_id,a:r.title||(c?c.name:''),b:r.detail||''}; })}}); return {ok:true,shown:true};
  }
  return {error:'άγνωστο εργαλείο'}; }
function pick(o,keys){ var r={}; Object.keys(o||{}).forEach(function(k){ if(keys.indexOf(k)>=0) r[k]=o[k]; }); return r; }

/* ---------- without an AI key: a small Greek rule-based helper, so the app is useful from minute one ---------- */
function localAnswer(text,ai,opt){ var t=norm(text), n=NI(), h=H();
  if(/θυμισ|υπενθυμ|να παρω|παρε (τον|την|τη)|να στειλω|να ζητησω|ραντεβου/.test(t)){ var w=parseWhen(text), c=findClient(text); var r={id:U.uid('r'),text:cleanReminder(text,c),date:w.date||U.addDays(1),time:w.time,clientId:c?c.id:null,done:false,source:opt.voice?'voice':'ai',createdAt:Date.now()}; S.reminders.push(r);
    ai.parts.push({t:'text',text:'Κανονίστηκε'+(c?' για **'+c.name+'**':'')+' — '+fmtDate(r.date)+(r.time?' στις '+r.time:'')+'.'+(c?'':' (Δεν βρήκα πελάτη με αυτό το όνομα — την έβαλα χωρίς καρτέλα.)')});
    ai.parts.push({t:'card',kind:'reminder',d:{text:r.text,date:r.date,time:r.time,clientName:c?c.name:''},undo:{coll:'reminders',id:r.id}}); return; }
  var mo=monthIn(text);
  if(/ληγ|ληξ|προθεσμ|λειπ|χρωστ|ποιον να παρω|ποιους|ταιριαζ/.test(t) || mo>=0){ var arr;
    if(/ταιριαζ/.test(t) && n.matches){ var ms=n.matches(S); ai.parts.push({t:'text',text:ms.length? 'Βρήκα '+ms.length+' ακίνητα με αγοραστές που ταιριάζουν:':'Δεν βρήκα ταιριάσματα αυτή τη στιγμή.'}); if(ms.length) ai.parts.push({t:'card',kind:'list',d:{rows:[].concat.apply([],ms.map(function(x){ return x.wants.map(function(w){ return {cid:w.clientId,a:client(w.clientId).name,b:'→ '+x.prop.title+' ('+money(x.prop.amount)+')'}; }); }))}}); return; }
    if(/λειπ|χρωστ/.test(t)) arr=S.items.filter(function(i){return i.status==='Λείπει'});
    else if(mo>=0) arr=S.items.filter(function(i){ if(!i.date) return false; var dt=new Date(i.date+'T12:00'); return dt.getMonth()===mo && daysTo(i.date)>=-31 && daysTo(i.date)<=400 && n.activeStatus.indexOf(i.status)>=0; });
    else if(/ποιον να παρω|σημερα/.test(t)) arr=S.items.filter(function(i){return daysTo(i.date)<=0 && n.activeStatus.indexOf(i.status)>=0});
    else arr=upcoming();
    arr.sort(function(a,b){return a.date<b.date?-1:1});
    ai.parts.push({t:'text',text:arr.length? 'Βρήκα **'+arr.length+'**'+(mo>=0?' για τον '+MNF[mo].replace(/ου$/,'ο').replace('Μαΐου','Μάιο'):'')+':' : 'Δεν βρήκα κάτι.'});
    if(arr.length) ai.parts.push({t:'card',kind:'list',d:{rows:arr.slice(0,30).map(function(i){ return {cid:i.clientId,a:client(i.clientId).name,b:i.title+' · '+fmtDate(i.date)+(i.status?' · '+i.status:'')}; })}});
    ai.parts.push({t:'text',text:'_Με AI κλειδί απαντώ σε οποιαδήποτε ερώτηση, γράφω μηνύματα και προτείνω τι να κάνετε._'.replace(/_/g,'')}); return; }
  if(/μηνυμα|γραψε/.test(t)){ var c3=findClient(text); if(c3){ var its=itemsOf(c3.id).filter(function(i){return n.activeStatus.indexOf(i.status)>=0}).sort(function(a,b){return a.date<b.date?-1:1}); var first=c3.name.split(' ')[0]; var txt='Καλησπέρα σας κ./κα '+c3.name.split(' ').slice(-1)[0]+',\n\n'+(its[0]? 'σας υπενθυμίζουμε ότι '+(n.key==='asf'?'η ασφάλεια «'+its[0].title+'» λήγει '+fmtDate(its[0].date).toLowerCase():n.key==='log'?'για «'+its[0].title+'» η προθεσμία είναι '+fmtDate(its[0].date).toLowerCase():'έχουμε νέα για το «'+its[0].title+'»')+'. ' : '')+'Είμαστε στη διάθεσή σας για οτιδήποτε χρειαστείτε.\n\nΜε εκτίμηση,\n'+(S.office.name||n.label);
      ai.parts.push({t:'card',kind:'message',d:{clientId:c3.id,text:txt}}); ai.parts.push({t:'text',text:'Έτοιμο πρότυπο. Με AI κλειδί το μήνυμα γράφεται ειδικά για τον πελάτη.'}); return; } }
  var q=t.split(/\s+/).filter(function(w){return w.length>2 && ['ποιοι','ποιος','ποια','εχει','εχουν','τον','την','για','και','τι'].indexOf(w)<0}); var found=S.clients.filter(function(c){ var hay=norm(c.name+' '+c.phone+' '+c.city+' '+itemsOf(c.id).map(function(i){return i.title+' '+i.type+' '+i.ref}).join(' ')); return q.some(function(w){ return hay.indexOf(w.slice(0,Math.max(3,w.length-2)))>=0; }); });
  if(found.length){ ai.parts.push({t:'text',text:'Βρήκα '+found.length+':'}); ai.parts.push({t:'card',kind:'list',d:{rows:found.slice(0,20).map(function(c){ var its=itemsOf(c.id); return {cid:c.id,a:c.name,b:[c.phone].concat(its.slice(0,2).map(function(i){return i.title})).filter(Boolean).join(' · ')}; })}}); return; }
  ai.parts.push({t:'text',text:'Χωρίς AI κλειδί καταλαβαίνω υπενθυμίσεις («θύμισέ μου…»), λήξεις/προθεσμίες, μηνύματα και αναζητήσεις. Για να απαντώ σε **οτιδήποτε**, βάλτε AI κλειδί στις Ρυθμίσεις.'}); }

/* ---------- read a document / notebook photo ---------- */
function toB64(file,max){ return new Promise(function(res,rej){ var img=new Image(), u=URL.createObjectURL(file); img.onload=function(){ var s=Math.min(1,(max||1600)/Math.max(img.width,img.height)), cv=d.createElement('canvas'); cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); URL.revokeObjectURL(u); res({type:'image/jpeg',data:cv.toDataURL('image/jpeg',.85).split(',')[1]}); }; img.onerror=rej; img.src=u; }); }
async function readDoc(file,c){ if(!apiKey()){ toast('Η ανάγνωση εγγράφων χρειάζεται το AI κλειδί στο Supabase'); return; } var im=await toB64(file,1600);
  ask(c? 'Διάβασε αυτό το έγγραφο για τον/την '+c.name+' (client_id '+c.id+'). Πρόσθεσε ή ενημέρωσε ό,τι χρειάζεται (items, ημερομηνίες, στοιχεία) και πες μου τι βρήκες.' : 'Διάβασε αυτή τη φωτογραφία (τετράδιο / κατάλογος / έγγραφο) και πέρασε όλους τους πελάτες και τα στοιχεία τους με add_client και add_item. Στο τέλος πες μου πόσους πέρασες και τι δεν διαβαζόταν.',{image:im}); }

/* ================= VIEW: εισαγωγή ================= */
function vImport(m){ var n=NI();
  m.innerHTML='<div class="pg"><header class="ph"><h1>Εισαγωγή στοιχείων</h1></header><p class="lead">Φέρτε μέσα όσα έχετε — από Excel, άλλο πρόγραμμα ή ακόμα και φωτογραφία του τετραδίου. Δεν χρειάζεται να πληκτρολογήσετε τίποτα.</p>'+
   '<div class="imp3"><label class="imp"><span class="ii">'+IC.doc+'</span><b>Excel / CSV</b><p>Το αρχείο σας όπως είναι — οι στήλες αναγνωρίζονται μόνες τους.</p><input type="file" id="fx" accept=".csv,.txt,.xlsx,.xls" hidden><span class="btn">Επιλογή αρχείου</span></label>'+
   '<label class="imp"><span class="ii">'+IC.cam+'</span><b>Φωτογραφία τετραδίου</b><p>Βγάλτε φωτογραφία μια σελίδα — ο βοηθός τη διαβάζει και τα περνάει.'+(apiKey()?'':' <em>(χρειάζεται AI κλειδί)</em>')+'</p><input type="file" id="fp" accept="image/*" capture="environment" hidden><span class="btn">Φωτογραφία</span></label>'+
   '<div class="imp"><span class="ii">'+IC.edit+'</span><b>Επικόλληση από Excel</b><p>Αντιγράψτε τις γραμμές από το Excel και επικολλήστε εδώ.</p><textarea id="fpaste" rows="3" placeholder="Επικόλληση…"></textarea><button type="button" class="btn" id="fpb">Ανάγνωση</button></div></div><div id="prev"></div></div>';
  $('#fx',m).onchange=async function(e){ var f=e.target.files[0]; if(!f) return; var rows; if(/\.xlsx?$/i.test(f.name)){ try{ await loadXLSX(); var wb=window.XLSX.read(await f.arrayBuffer(),{type:'array'}); rows=window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''}); }catch(err){ toast('Δεν διαβάστηκε το Excel — αποθηκεύστε το ως CSV'); return; } } else rows=parseCSV(await f.text()); preview(rows); };
  $('#fp',m).onchange=async function(e){ var f=e.target.files[0]; if(!f) return; if(!apiKey()){ toast('Η φωτογραφία χρειάζεται AI κλειδί — Ρυθμίσεις'); return; } var im=await toB64(f,2000); ask('Διάβασε αυτή τη φωτογραφία (τετράδιο / λίστα) και πέρασε όλους τους πελάτες και τα στοιχεία τους με add_client και add_item. Στο τέλος πες μου πόσους πέρασες και τι δεν διαβαζόταν.',{image:im}); };
  $('#fpb',m).onclick=function(){ var t=$('#fpaste',m).value; if(t.trim()) preview(parseCSV(t)); }; }
function loadXLSX(){ return new Promise(function(res,rej){ if(window.XLSX) return res(); var s=d.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload=res; s.onerror=rej; d.head.appendChild(s); }); }
function parseCSV(text){ var first=text.split(/\r?\n/)[0]||'', del=first.indexOf('\t')>=0?'\t':(first.split(';').length>first.split(',').length?';':','), rows=[], row=[], cur='', q=false;
  for(var i=0;i<text.length;i++){ var ch=text[i]; if(q){ if(ch==='"'){ if(text[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; } else { if(ch==='"') q=true; else if(ch===del){ row.push(cur); cur=''; } else if(ch==='\n'){ row.push(cur.replace(/\r$/,'')); rows.push(row); row=[]; cur=''; } else cur+=ch; } }
  if(cur||row.length){ row.push(cur); rows.push(row); } return rows.filter(function(r){ return r.some(function(c){return String(c).trim()}); }); }
var MAP=[['name',/ονομ|επων|πελατ|επαφ|name|client/],['phone',/τηλ|κινητ|phone|mobile/],['email',/mail/],['afm',/αφμ|vat|afm/],['city',/πολη|περιοχ|city|διευθ/],['type',/τυπος|κλαδος|type|ειδος|κατηγορ/],['title',/συμβολ|περιγρ|τιτλ|ακινητ|title|item/],['ref',/πινακ|αρ\.?\s?συμβ|plate|ref|περιοδ/],['date',/ληξ|ημερ|προθεσμ|date|expir/],['amount',/ποσ|ασφαλιστρ|τιμη|amount|price|budget|αμοιβ/],['extra',/εταιρ|company|χαρακτ|υπευθ/],['status',/κατασ|status/],['notes',/σημει|notes|παρατηρ|σχολ/]];
var FL={name:'Όνομα',phone:'Τηλέφωνο',email:'E-mail',afm:'ΑΦΜ',city:'Πόλη',type:'Τύπος',title:'Τίτλος / περιγραφή',ref:'Πινακίδα / αρ.',date:'Ημερομηνία (λήξη / προθεσμία)',amount:'Ποσό',extra:'Εταιρεία / χαρακτηριστικά',status:'Κατάσταση',notes:'Σημειώσεις','':'— αγνόηση —'};
function preview(rows){ var box=$('#prev'); if(!rows||rows.length<2){ toast('Δεν βρέθηκαν γραμμές'); return; } var head=rows[0], map=head.map(function(h){ var t=norm(h); for(var i=0;i<MAP.length;i++) if(MAP[i][1].test(t)) return MAP[i][0]; return ''; });
  box.innerHTML='<section class="card"><div class="ch"><h2>Προεπισκόπηση — '+(rows.length-1)+' γραμμές</h2></div><p class="fine">Ελέγξτε τι είναι η κάθε στήλη (τα περισσότερα τα βρήκα μόνος μου):</p><div class="tscroll"><table class="pv"><tr>'+head.map(function(h,i){ return '<th><div>'+esc(h)+'</div><select data-col="'+i+'">'+Object.keys(FL).map(function(k){return '<option value="'+k+'"'+(map[i]===k?' selected':'')+'>'+FL[k]+'</option>'}).join('')+'</select></th>'; }).join('')+'</tr>'+rows.slice(1,7).map(function(r){ return '<tr>'+head.map(function(_,i){ return '<td>'+esc(r[i]||'')+'</td>'; }).join('')+'</tr>'; }).join('')+'</table></div><button type="button" class="btn pri" id="doImp">'+IC.check+' Εισαγωγή '+(rows.length-1)+' γραμμών</button></section>';
  $('#doImp',box).onclick=function(){ $$('[data-col]',box).forEach(function(s){ map[+s.getAttribute('data-col')]=s.value; }); if(map.indexOf('name')<0){ toast('Διαλέξτε ποια στήλη είναι το Όνομα'); return; } var r=doImport(rows.slice(1),map); toast('Μπήκαν '+r.c+' '+NI().clients.toLowerCase()+' και '+r.i+' '+NI().items.toLowerCase()); go('clients'); }; }
function pDate(v){ v=String(v||'').trim(); if(!v) return ''; var m; if((m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1]+'-'+pad(+m[2])+'-'+pad(+m[3]); if((m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/))){ var y=+m[3]; if(y<100) y+=2000; return y+'-'+pad(+m[2])+'-'+pad(+m[1]); } if(/^\d{5}$/.test(v)){ var dt=new Date(Date.UTC(1899,11,30)+(+v)*864e5); return U.iso(dt); } return ''; }
function doImport(rows,map){ var n=NI(), byName={}, nc=0, ni=0; S.clients.forEach(function(c){ byName[norm(c.name)]=c; });
  rows.forEach(function(r){ var o={}; map.forEach(function(k,i){ if(k) o[k]=String(r[i]||'').trim(); }); if(!o.name) return; var key=norm(o.name), c=byName[key];
    if(!c){ c={id:U.uid('c'),name:o.name,phone:(o.phone||'').replace(/[^\d+]/g,''),email:o.email||'',afm:o.afm||'',city:o.city||'',tags:[],notes:o.notes||'',createdAt:Date.now(),lastContact:''}; S.clients.push(c); byName[key]=c; nc++; }
    if(o.title||o.date||o.type||o.ref){ var type=o.type&&n.types.filter(function(t){return norm(t)===norm(o.type)})[0]||o.type||n.types[0]; S.items.push({id:U.uid('i'),clientId:c.id,type:type,title:o.title||(type+(o.ref?' '+o.ref:'')),ref:o.ref||'',date:pDate(o.date),amount:parseFloat(String(o.amount||'').replace(/\./g,'').replace(',','.'))||0,status:o.status&&n.statuses.indexOf(o.status)>=0?o.status:n.statuses[0],extra:o.extra||''}); ni++; } });
  save(); return {c:nc,i:ni}; }

/* ================= VIEW: ρυθμίσεις ================= */
function vSettings(m){ var n=NI(), st=CLOUD.status||{}, u=st.usage||{calls:0,in_tokens:0,out_tokens:0,cache_read:0,cache_write:0,usd:0}, usd=Number(u.usd||0), me=CLOUD.me||{}, push=CLOUD.pushState();
  m.innerHTML='<div class="pg narrow"><header class="ph"><h1>Ρυθμίσεις</h1></header>'+
   '<section class="card"><div class="ch"><h2>'+IC.bell+' Ειδοποιήσεις</h2><span class="pill '+(push.on?'ok':'')+'">'+(push.on?'Ενεργές σε αυτή τη συσκευή':'Ανενεργές εδώ')+'</span></div>'+
    '<p class="fine" style="margin-bottom:10px">Οι υπενθυμίσεις με ώρα έρχονται στην ώρα τους — ακόμα κι αν η εφαρμογή είναι κλειστή. Κάθε πρωί έρχεται η ενημέρωση της ημέρας.</p>'+
    (push.hint?'<div class="hint">'+push.hint+'</div>':'')+
    '<div class="row2 wrap">'+(push.can&&!push.on?'<button type="button" class="btn pri" id="pOn">'+IC.bell+' Ενεργοποίηση σε αυτή τη συσκευή</button>':'')+(push.on?'<button type="button" class="btn" id="pOff">Απενεργοποίηση εδώ</button>':'')+'<button type="button" class="btn" id="pTest">Δοκιμαστική ειδοποίηση</button><button type="button" class="btn" id="pDig">Στείλε μου την πρωινή ενημέρωση τώρα</button></div>'+
    '<div class="form" style="margin-top:12px"><label class="chk"><input type="checkbox" id="nMail"'+(me.notify_email!==false?' checked':'')+'> Και με e-mail στο '+esc(me.email||CLOUD.email()||'')+(st.email?'':' <em class="warn">(λείπει το RESEND_API_KEY στο Supabase)</em>')+'</label><label class="chk"><input type="checkbox" id="nPush"'+(me.notify_push!==false?' checked':'')+'> Ειδοποιήσεις στο κινητό / υπολογιστή</label><label>Ώρα πρωινής ενημέρωσης<select id="nTime">'+['07:00','07:30','08:00','08:30','09:00','09:30','10:00'].map(function(t){return '<option'+((me.digest_time||'08:30')===t?' selected':'')+'>'+t+'</option>'}).join('')+'</select></label></div><div id="pRes" class="fine" style="margin-top:8px"></div></section>'+
   '<section class="card"><div class="ch"><h2>Γραφείο</h2></div><div class="form"><label>Όνομα γραφείου<input id="sO" value="'+esc(S.office.name)+'"></label><label>Το όνομά σας<input id="sW" value="'+esc(S.office.owner)+'"></label><label>Κλάδος<select id="sN">'+Object.keys(N).map(function(k){return '<option value="'+k+'"'+(k===S.niche?' selected':'')+'>'+N[k].label+'</option>'}).join('')+'</select></label><div class="row2"><button type="button" class="btn pri" id="sSave">Αποθήκευση</button></div></div></section>'+
   '<section class="card"><div class="ch"><h2>'+IC.user+' Ομάδα</h2><span class="pill">'+(CLOUD.members||[]).length+' '+((CLOUD.members||[]).length===1?'άτομο':'άτομα')+'</span></div>'+
    '<p class="fine">Οι συνεργάτες σας μπαίνουν με τον κωδικό ομάδας και βλέπουν τα ίδια στοιχεία, ζωντανά.</p><div class="code"><b>'+esc(CLOUD.org.invite_code)+'</b><button type="button" class="btn" id="cInv">Αντιγραφή πρόσκλησης</button></div>'+
    (CLOUD.members||[]).map(function(x){ return '<div class="row"><span class="av">'+esc(initials(x.name||x.email))+'</span><div class="rm"><b>'+esc(x.name||x.email)+'</b><span>'+esc(x.email)+' · '+(x.role==='owner'?'ιδιοκτήτης':'μέλος')+'</span></div></div>'; }).join('')+'</section>'+
   '<section class="card"><div class="ch"><h2>'+IC.spark+' AI βοηθός</h2><span class="pill '+(st.ai?'ok':'')+'">'+(st.ai?'Ενεργό':'Λείπει το κλειδί')+'</span></div>'+
    (st.ai?'':'<div class="hint">Βάλτε το Claude κλειδί στο Supabase → Edge Functions → Secrets με όνομα <b>ANTHROPIC_API_KEY</b>. Δεν μπαίνει ποτέ στον browser.</div>')+
    '<div class="form"><label>Μοντέλο<select id="sM">'+MODELS.map(function(x){return '<option value="'+x[0]+'"'+(S.settings.model===x[0]?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="chk"><input type="checkbox" id="sA"'+(S.settings.approve?' checked':'')+'> Ζητά έγκριση πριν αλλάξει υπάρχοντα στοιχεία</label>'+
    '<label>Μηνιαίο όριο κόστους AI (USD)<input id="sCap" type="number" min="1" step="1" value="'+esc(S.settings.cap_usd||40)+'"></label>'+
    '<div class="row2"><button type="button" class="btn pri" id="sAI">Αποθήκευση</button><button type="button" class="btn" id="sTest">Δοκιμή AI</button></div></div>'+
    '<div class="cost" style="margin-top:14px"><div><b>'+(u.calls||0)+'</b><span>κλήσεις μήνα</span></div><div><b>'+Math.round(((u.in_tokens||0)+(u.cache_read||0)+(u.cache_write||0))/1000)+'k</b><span>tokens εισόδου</span></div><div><b>'+Math.round((u.out_tokens||0)/1000)+'k</b><span>tokens εξόδου</span></div><div class="hl"><b>$'+usd.toFixed(usd<1?3:2)+'</b><span>≈ '+(usd*0.93).toFixed(2).replace('.',',')+'€ / όριο $'+(st.cap||S.settings.cap_usd||40)+'</span></div></div><p class="fine">Πραγματικό κόστος όλου του γραφείου αυτόν τον μήνα, όπως το μετράει ο server.</p></section>'+
   '<section class="card"><div class="ch"><h2>Δεδομένα</h2><span class="pill ok">Συγχρονισμός</span></div><p class="fine">Όλα αποθηκεύονται στη βάση σας στην Ευρώπη (Supabase, Φρανκφούρτη) και συγχρονίζονται ζωντανά σε κάθε συσκευή.</p><div class="row2 wrap"><button type="button" class="btn" id="dExp">Εξαγωγή (αρχείο)</button><label class="btn">Εισαγωγή αρχείου<input type="file" id="dImp" accept=".json" hidden></label><button type="button" class="btn" id="dDemo">Δοκιμαστικά στοιχεία ξανά</button><button type="button" class="btn danger" id="dDel">Διαγραφή όλων</button></div></section>'+
   '<section class="card"><div class="ch"><h2>Λογαριασμός</h2></div><p class="fine">Συνδεδεμένος ως <b>'+esc(CLOUD.email())+'</b>'+((CLOUD.orgs||[]).length>1?' · γραφεία: '+CLOUD.orgs.map(function(o){ return o.id===CLOUD.org.id?'<b>'+esc(o.name||'—')+'</b>':'<a data-org="'+o.id+'">'+esc(o.name||'—')+'</a>'; }).join(' · '):'')+'</p><div class="row2 wrap" style="margin-top:10px"><button type="button" class="btn" id="aNew">Νέο γραφείο</button><button type="button" class="btn danger" id="aOut">Αποσύνδεση</button></div></section>'+
   '<p class="fine center">Advon AI · '+esc(n.label)+' · <a href="https://advonmedia.com" target="_blank" rel="noopener">Advon Media</a></p></div>';
  function res(t){ var e=$('#pRes',m); if(e) e.innerHTML=t; }
  var pOn=$('#pOn',m); if(pOn) pOn.onclick=async function(){ pOn.disabled=true; try{ await CLOUD.enablePush(); toast('Οι ειδοποιήσεις ενεργοποιήθηκαν'); render(); }catch(e){ toast(e.message); pOn.disabled=false; } };
  var pOff=$('#pOff',m); if(pOff) pOff.onclick=async function(){ await CLOUD.disablePush(); render(); };
  $('#pTest',m).onclick=async function(){ res('Στέλνω…'); try{ var r=await CLOUD.notify('test'); res('Ειδοποίηση: '+(r.push.devices? r.push.sent+' από '+r.push.devices+' συσκευές'+(r.push.errors&&r.push.errors.length?' · σφάλμα: '+esc(r.push.errors[0]):'') : 'καμία συσκευή ενεργή — πατήστε «Ενεργοποίηση»')+' · E-mail: '+(r.email.ok?'στάλθηκε':esc(r.email.skipped||r.email.detail||'όχι'))); }catch(e){ res(esc(e.message)); } };
  $('#pDig',m).onclick=async function(){ res('Στέλνω…'); try{ var r=await CLOUD.notify('digest'); res('Στάλθηκε: '+esc(r.summary)+' · ειδοποίηση '+r.push.sent+' · e-mail '+(r.email.ok?'ναι':esc(r.email.skipped||'όχι'))); }catch(e){ res(esc(e.message)); } };
  ['nMail','nPush','nTime'].forEach(function(id){ $('#'+id,m).onchange=function(){ CLOUD.saveMe({notify_email:$('#nMail',m).checked, notify_push:$('#nPush',m).checked, digest_time:$('#nTime',m).value}).then(function(){ toast('Αποθηκεύτηκε'); }); }; });
  $('#cInv',m).onclick=function(){ copy('Μπες στο γραφείο «'+(S.office.name||n.label)+'» στο Advon AI:\n'+CLOUD.appUrl()+'?join='+CLOUD.org.invite_code+'\n(κωδικός ομάδας: '+CLOUD.org.invite_code+')'); };
  $('#sSave',m).onclick=async function(){ S.office.name=$('#sO',m).value.trim(); S.office.owner=$('#sW',m).value.trim(); var nn=$('#sN',m).value;
    if(nn!==S.niche){ if(confirm('Αλλαγή κλάδου σε «'+N[nn].label+'»; Να φορτωθούν δοκιμαστικά στοιχεία του νέου κλάδου (τα τωρινά θα σβηστούν);')){ S.niche=nn; seed(); } else S.niche=nn; }
    await CLOUD.saveOrg({name:S.office.name, niche:S.niche}); await CLOUD.saveMe({name:S.office.owner}); save(); render(); toast('Αποθηκεύτηκε'); };
  $('#sAI',m).onclick=async function(){ S.settings.model=$('#sM',m).value; S.settings.approve=$('#sA',m).checked; S.settings.cap_usd=Math.max(1,parseFloat($('#sCap',m).value)||40); await CLOUD.saveOrg({settings:S.settings}); toast('Αποθηκεύτηκε'); render(); };
  $('#sTest',m).onclick=async function(){ try{ var r=await callClaude([{role:'user',content:'Απάντησε μόνο: ΟΚ'}],false,10); await CLOUD.refreshStatus(); toast('Ο βοηθός απαντά — όλα σωστά'); render(); }catch(e){ toast(e.message); } };
  $('#dExp',m).onclick=function(){ var b=new Blob([JSON.stringify(Object.assign({},S,{api:[]}),null,1)],{type:'application/json'}), a=d.createElement('a'); a.href=URL.createObjectURL(b); a.download='advon-ai-'+today()+'.json'; d.body.appendChild(a); a.click(); a.remove(); };
  $('#dImp',m).onchange=async function(e){ var f=e.target.files[0]; if(!f) return; try{ var o=JSON.parse(await f.text()); if(o.v!==1) throw 0; ['clients','items','reminders','activity'].forEach(function(k){ S[k]=o[k]||[]; }); save(); render(); toast('Τα στοιχεία φορτώθηκαν'); }catch(err){ toast('Μη έγκυρο αρχείο'); } };
  $('#dDemo',m).onclick=function(){ if(confirm('Να αντικατασταθούν όλα με δοκιμαστικά στοιχεία; (για όλη την ομάδα)')){ seed(); save(); go('today'); } };
  $('#dDel',m).onclick=function(){ if(confirm('Διαγραφή ΟΛΩΝ των στοιχείων του γραφείου (για όλη την ομάδα); Δεν αναιρείται.')){ S.clients=[]; S.items=[]; S.reminders=[]; S.activity=[]; S.chat=[]; S.api=[]; S.brief=null; save(); go('today'); } };
  $('#aOut',m).onclick=function(){ CLOUD.signOut(); };
  $('#aNew',m).onclick=function(){ S.niche=null; READY=true; onboarding(true); };
  $$('[data-org]',m).forEach(function(a){ a.onclick=function(){ CLOUD.switchOrg(a.getAttribute('data-org')); }; }); }

/* ================= forms (modal) ================= */
function modal(title,body,onOk,okLabel){ var w=d.createElement('div'); w.className='modal'; w.innerHTML='<div class="mbox"><div class="mt"><b>'+esc(title)+'</b><button type="button" class="mx">'+IC.x+'</button></div><form class="form">'+body+'<div class="row2"><button type="submit" class="btn pri">'+(okLabel||'Αποθήκευση')+'</button><button type="button" class="btn mc">Άκυρο</button></div></form></div>';
  d.body.appendChild(w); requestAnimationFrame(function(){ w.classList.add('on'); }); function close(){ w.classList.remove('on'); setTimeout(function(){ w.remove(); },200); }
  $('.mx',w).onclick=close; $('.mc',w).onclick=close; w.onclick=function(e){ if(e.target===w) close(); };
  $('form',w).onsubmit=function(e){ e.preventDefault(); if(onOk($('form',w))!==false) close(); }; var f=$('input,textarea,select',w); if(f) setTimeout(function(){ f.focus(); },60); return w; }
function clientForm(c){ var n=NI(), isNew=!c; c=c||{};
  modal(isNew?'Νέα καρτέλα':'Επεξεργασία — '+c.name,'<label>Όνομα<input name="name" required value="'+esc(c.name||'')+'"></label><div class="g2"><label>Τηλέφωνο<input name="phone" inputmode="tel" value="'+esc(c.phone||'')+'"></label><label>E-mail<input name="email" type="email" value="'+esc(c.email||'')+'"></label></div><div class="g2"><label>ΑΦΜ<input name="afm" value="'+esc(c.afm||'')+'"></label><label>Πόλη / περιοχή<input name="city" value="'+esc(c.city||'')+'"></label></div><label>Ετικέτες (με κόμμα)<input name="tags" value="'+esc((c.tags||[]).join(', '))+'"></label><label>Σημειώσεις<textarea name="notes" rows="3">'+esc(c.notes||'')+'</textarea></label>',function(f){
    var o={}; ['name','phone','email','afm','city','notes'].forEach(function(k){ o[k]=f.elements[k].value.trim(); }); o.tags=f.elements.tags.value.split(',').map(function(x){return x.trim()}).filter(Boolean); if(!o.name) return false;
    if(isNew){ o.id=U.uid('c'); o.createdAt=Date.now(); o.lastContact=''; S.clients.push(o); save(); go('client/'+o.id); } else { Object.assign(c,o); save(); render(); } }); }
function itemForm(it,cid){ var n=NI(), isNew=!it; it=it||{clientId:cid,type:n.types[0],status:n.statuses[0]};
  modal(isNew?'Νέο: '+n.item:it.title,(cid||!isNew?'':'<label>'+esc(n.client)+'<select name="clientId">'+S.clients.slice().sort(function(a,b){return a.name.localeCompare(b.name,'el')}).map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('')+'</select></label>')+
   '<div class="g2"><label>Τύπος<select name="type">'+n.types.map(function(t){return '<option'+(it.type===t?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select></label><label>Κατάσταση<select name="status">'+n.statuses.map(function(t){return '<option'+(it.status===t?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select></label></div>'+
   '<label>Τίτλος<input name="title" required value="'+esc(it.title||'')+'"></label><div class="g2"><label>'+esc(n.dateLabel)+'<input name="date" type="date" value="'+esc(it.date||'')+'"></label><label>'+esc(n.amountLabel)+'<input name="amount" type="number" step="1" value="'+esc(it.amount||'')+'"></label></div><div class="g2"><label>'+esc(n.refLabel)+'<input name="ref" value="'+esc(it.ref||'')+'"></label><label>'+esc(n.extraLabel)+'<input name="extra" value="'+esc(it.extra||'')+'"></label></div>'+(isNew?'':'<button type="button" class="lnk danger" id="delI">Διαγραφή</button>'),function(f){
    var o={type:f.elements.type.value,status:f.elements.status.value,title:f.elements.title.value.trim(),date:f.elements.date.value,amount:parseFloat(f.elements.amount.value)||0,ref:f.elements.ref.value.trim(),extra:f.elements.extra.value.trim()}; if(!o.title) return false;
    if(isNew){ o.id=U.uid('i'); o.clientId=cid||f.elements.clientId.value; S.items.push(o); logAct(o.clientId,'Νέο: '+o.title,'note'); } else Object.assign(it,o); save(); render(); });
  var del=$('#delI'); if(del) del.onclick=function(){ if(confirm('Διαγραφή «'+it.title+'»;')){ S.items=S.items.filter(function(x){return x!==it}); save(); $('.modal').remove(); render(); } }; }
function remForm(r){ var isNew=!r.id;
  modal(isNew?'Νέα υπενθύμιση':'Υπενθύμιση','<label>Τι να θυμηθώ<input name="text" required value="'+esc(r.text||'')+'" placeholder="π.χ. Πάρε τηλέφωνο για την ανανέωση"></label><div class="g2"><label>Ημερομηνία<input name="date" type="date" required value="'+esc(r.date||U.addDays(1))+'"></label><label>Ώρα<input name="time" type="time" value="'+esc(r.time||'')+'"></label></div><label>'+esc(NI().client)+'<select name="clientId"><option value="">—</option>'+S.clients.slice().sort(function(a,b){return a.name.localeCompare(b.name,'el')}).map(function(c){return '<option value="'+c.id+'"'+(r.clientId===c.id?' selected':'')+'>'+esc(c.name)+'</option>'}).join('')+'</select></label>'+(isNew?'':'<button type="button" class="lnk danger" id="delR">Διαγραφή</button>'),function(f){
    var o={text:f.elements.text.value.trim(),date:f.elements.date.value,time:f.elements.time.value,clientId:f.elements.clientId.value||null}; if(!o.text) return false; if(isNew){ o.id=U.uid('r'); o.done=false; o.source='manual'; o.createdAt=Date.now(); S.reminders.push(o); } else Object.assign(r,o); save(); render(); });
  var del=$('#delR'); if(del) del.onclick=function(){ S.reminders=S.reminders.filter(function(x){return x!==r}); save(); $('.modal').remove(); render(); }; }

/* ================= onboarding ================= */
function seed(){ var g=NI().demo(); S.clients=g.clients; S.items=g.items; S.reminders=g.reminders; S.activity=g.activity||[]; S.chat=[]; S.api=[]; S.brief=null; }
function onboarding(extra){ var m=$('#main'); d.body.dataset.view='onb'; var code=(new URLSearchParams(location.search).get('join')||'');
  m.innerHTML='<div class="onb"><div class="orb big">'+IC.spark+'</div><h1>Καλώς ήρθατε στο <em>Advon AI</em></h1><p>Ο AI βοηθός του γραφείου σας. Διαλέξτε κλάδο — μπορείτε να ξεκινήσετε με δοκιμαστικά στοιχεία για να το δείτε να δουλεύει αμέσως.</p>'+
  (code?'<div class="card joinc"><b>Σας προσκάλεσαν σε γραφείο</b><p class="fine">Κωδικός ομάδας: '+esc(code)+'</p><div class="form"><label>Το όνομά σας<input id="jW" placeholder="π.χ. Μαρία"></label><button type="button" class="btn pri" id="jGo">Μπείτε στην ομάδα</button></div></div><p class="fine" style="margin:14px 0">ή φτιάξτε δικό σας γραφείο:</p>':'')+
  '<div class="onb3">'+Object.keys(N).map(function(k){ return '<button type="button" class="ob" data-n="'+k+'" style="--b:'+N[k].color+';--bs:'+N[k].soft+'"><b>'+N[k].label+'</b><span>'+esc(N[k].chips[0])+'</span></button>'; }).join('')+'</div>'+
  '<div class="form onbf"><label>Όνομα γραφείου<input id="oO" placeholder="π.χ. Ασφάλειες Λαμπρόπουλος"></label><label>Το όνομά σας<input id="oW" placeholder="π.χ. Άγγελος"></label><label class="chk"><input type="checkbox" id="oD" checked> Με δοκιμαστικά στοιχεία</label>'+
  (code?'':'<details class="jd"><summary>Έχω κωδικό ομάδας</summary><div class="form"><label>Κωδικός ομάδας<input id="jC" placeholder="π.χ. 3F9A1C2B"></label><label>Το όνομά σας<input id="jW" placeholder="π.χ. Μαρία"></label><button type="button" class="btn pri" id="jGo">Μπείτε στην ομάδα</button></div></details>')+
  (extra?'<button type="button" class="btn" id="oBack" style="margin-top:6px">Πίσω</button>':'')+'</div></div>';
  $$('.ob',m).forEach(function(b){ b.onclick=async function(){ var nk=b.getAttribute('data-n'); $$('.ob',m).forEach(function(x){x.disabled=true}); b.classList.add('busy');
    try{ await CLOUD.createOrg($('#oO').value.trim(), nk, $('#oW').value.trim(), $('#oD').checked); }catch(e){ toast(e.message); $$('.ob',m).forEach(function(x){x.disabled=false}); b.classList.remove('busy'); } }; });
  var jg=$('#jGo',m); if(jg) jg.onclick=async function(){ var c=code||($('#jC',m)?$('#jC',m).value.trim():''); if(!c){ toast('Γράψτε τον κωδικό ομάδας'); return; } jg.disabled=true; try{ await CLOUD.joinOrg(c, $('#jW',m).value.trim()); history.replaceState(null,'',location.pathname+'#today'); }catch(e){ toast(e.message); jg.disabled=false; } };
  var bk=$('#oBack',m); if(bk) bk.onclick=function(){ CLOUD.switchOrg(CLOUD.org.id); }; }

/* ================= boot ================= */
$$('[data-nav]').forEach(function(a){ a.addEventListener('click',function(){ var mm=$('#moreMenu'); if(mm) mm.classList.remove('on'); }); });
var fab=$('#fab'); if(fab) fab.onclick=function(){ location.hash='assistant/voice'; };
var more=$('#moreB'); if(more) more.onclick=function(){ $('#moreMenu').classList.toggle('on'); };
var side=$('#sideBar'); if(side){ side.innerHTML=aiBar(false); wireAiBar(side); }
var clr=$('#clrSide'); if(clr) clr.onclick=clearChat;
var pendingRender=false;
function typing(){ var a=d.activeElement; return !!($('.modal') || (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.value)); }
window.ADVON_AI={state:function(){return S}, ask:ask, parseWhen:parseWhen, findClient:findClient};
window.ADVON_APP={
  boot:function(st){ S=Object.assign(S,st); READY=true; route(); },
  state:function(){ return S; },
  setColl:function(k,arr){ S[k]=arr; },
  refresh:function(){ if(!READY||!S.niche) return; if(typing()||BUSY){ pendingRender=true; return; } render(); },
  route:route, onboarding:onboarding, seed:seed, save:save, saveNow:saveNow, toast:toast, esc:esc, IC:IC, setReady:function(v){ READY=v; }
};
setInterval(function(){ if(pendingRender && !typing() && !BUSY){ pendingRender=false; render(); } },2500);
d.addEventListener('focusout',function(){ setTimeout(function(){ if(pendingRender && !typing() && !BUSY){ pendingRender=false; render(); } },300); });
if(window.CLOUD) CLOUD.start();
})();
