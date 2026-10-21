/* Advon AI — cloud layer (Supabase, Frankfurt): sign-in, offices & team, live sync, server AI, push notifications.
   Data model: one row per object in public.records (org_id, coll, id, data). This file keeps app.js's arrays in sync:
   on every save it diffs against what the server last had and sends only what changed; realtime brings other devices' changes. */
(function(){
'use strict';
var SB_URL='https://pklpcnmrobtkdiwiutta.supabase.co';
var SB_KEY='sb_publishable_W7wt2izijAmKNTukgFT4kw_6mL2m4Tl';
var VAPID='BCJt746R43e1z_dDY7ebnG3BRhdfbBoJrP2fObiPsz9fK9-Z1jp3gtj_rHs0mFJDW69vSLMoVSGCvKKfQJnIvjs';
var COLLS=['clients','items','reminders','activity'];
var d=document, sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'advon-ai-auth'}});
function $(s,r){return (r||d).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function A(){ return window.ADVON_APP; }
function toast(m){ if(A()) A().toast(m); }
function stable(v){ if(Array.isArray(v)) return '['+v.map(stable).join(',')+']'; if(v&&typeof v==='object'){ return '{'+Object.keys(v).filter(function(k){return v[k]!==undefined}).sort().map(function(k){ return JSON.stringify(k)+':'+stable(v[k]); }).join(',')+'}'; } return JSON.stringify(v===undefined?null:v); }
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

var C=window.CLOUD={ sb:sb, org:null, me:null, orgs:[], members:[], status:null, user:null };
var SNAP={}, CH=null, SYNC={busy:false,again:false,err:'',at:0,timer:null,offline:false};

/* ---------------- sign-in screen ---------------- */
function authView(mode,msg){
  d.body.dataset.view='auth'; var m=$('#main'), join=new URLSearchParams(location.search).get('join');
  mode=mode||(join?'up':'in');
  m.innerHTML='<div class="auth"><div class="orb big">'+A().IC.spark+'</div><h1>Advon <em>AI</em></h1><p class="sub">Ο AI βοηθός του γραφείου σας</p>'+
   (join?'<div class="hint">Σας προσκάλεσαν σε γραφείο. Φτιάξτε λογαριασμό (ή συνδεθείτε) και θα μπείτε κατευθείαν στην ομάδα.</div>':'')+
   (msg?'<div class="hint">'+msg+'</div>':'')+
   (mode==='reset'?'<form class="form" id="af"><label>Νέος κωδικός<input name="pw" type="password" minlength="6" required autocomplete="new-password"></label><button class="btn pri" type="submit">Αποθήκευση κωδικού</button></form>':
   '<div class="seg"><button type="button" data-m="in" class="'+(mode==='in'?'on':'')+'">Σύνδεση</button><button type="button" data-m="up" class="'+(mode==='up'?'on':'')+'">Νέος λογαριασμός</button></div>'+
   '<form class="form" id="af">'+(mode==='up'?'<label>Το όνομά σας<input name="name" autocomplete="name" placeholder="π.χ. Άγγελος Μετρίδης"></label>':'')+
   '<label>E-mail<input name="email" type="email" required autocomplete="email" inputmode="email"></label>'+
   '<label>Κωδικός<input name="pw" type="password" minlength="6" required autocomplete="'+(mode==='up'?'new-password':'current-password')+'"></label>'+
   '<button class="btn pri" type="submit">'+(mode==='up'?'Δημιουργία λογαριασμού':'Σύνδεση')+'</button>'+
   (mode==='in'?'<button type="button" class="lnk" id="forgot">Ξέχασα τον κωδικό</button>':'')+'</form>')+
   '<p class="fine center">Τα στοιχεία σας αποθηκεύονται κρυπτογραφημένα σε servers στην Ευρώπη.</p></div>';
  [].forEach.call(m.querySelectorAll('[data-m]'),function(b){ b.onclick=function(){ authView(b.getAttribute('data-m')); }; });
  var f=$('#af',m), fg=$('#forgot',m);
  if(fg) fg.onclick=async function(){ var em=f.elements.email.value.trim(); if(!em){ toast('Γράψτε πρώτα το e-mail σας'); return; } var r=await sb.auth.resetPasswordForEmail(em,{redirectTo:C.appUrl()}); toast(r.error? r.error.message : 'Σας στείλαμε e-mail για νέο κωδικό'); };
  f.onsubmit=async function(e){ e.preventDefault(); var b=f.querySelector('button[type=submit]'); b.disabled=true; var r;
    try{
      if(mode==='reset'){ r=await sb.auth.updateUser({password:f.elements.pw.value}); if(r.error) throw r.error; toast('Ο κωδικός άλλαξε'); history.replaceState(null,'',location.pathname+'#today'); await afterLogin(); return; }
      var em=f.elements.email.value.trim(), pw=f.elements.pw.value;
      if(mode==='up'){ r=await sb.auth.signUp({email:em,password:pw,options:{data:{name:(f.elements.name.value||'').trim()},emailRedirectTo:C.appUrl()}}); if(r.error) throw r.error;
        if(!r.data.session){ authView('in','Σας στείλαμε e-mail επιβεβαίωσης — πατήστε το link και μετά συνδεθείτε.'); return; }
        try{ localStorage.setItem('advon_ai_myname',(f.elements.name.value||'').trim()); }catch(err){} }
      else { r=await sb.auth.signInWithPassword({email:em,password:pw}); if(r.error) throw r.error; }
      await afterLogin();
    }catch(err){ var msg=err.message||String(err); if(/Invalid login/i.test(msg)) msg='Λάθος e-mail ή κωδικός'; else if(/already registered/i.test(msg)) msg='Υπάρχει ήδη λογαριασμός με αυτό το e-mail — πατήστε «Σύνδεση»'; else if(/Password should/i.test(msg)) msg='Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες'; toast(msg); b.disabled=false; } };
  setTimeout(function(){ var i=f.querySelector('input'); if(i&&innerWidth>700) i.focus(); },50);
}

/* ---------------- after sign-in: which office ---------------- */
async function afterLogin(){
  var s=(await sb.auth.getSession()).data.session; if(!s){ authView(); return; }
  C.user=s.user;
  var join=new URLSearchParams(location.search).get('join');
  var r=await sb.from('members').select('org_id,role,name,email,notify_email,notify_push,digest_time,orgs(id,name,niche,invite_code,settings)').eq('user_id',s.user.id);
  if(r.error){ authView('in','Πρόβλημα σύνδεσης με τη βάση: '+esc(r.error.message)); return; }
  C.orgs=(r.data||[]).map(function(x){ return x.orgs; }).filter(Boolean);
  if(join && !C.orgs.some(function(o){ return o.invite_code===join.toUpperCase(); })){ A().boot({niche:null}); return; }
  if(join){ history.replaceState(null,'',location.pathname+'#today'); }
  if(!C.orgs.length){ A().boot({niche:null}); return; }
  var last=lsGet('advon_ai_org'), pick=C.orgs.filter(function(o){return o.id===last})[0]||C.orgs[0];
  await openOrg(pick.id);
}

async function openOrg(id,opt){
  opt=opt||{}; lsSet('advon_ai_org',id);
  if(CH){ try{ sb.removeChannel(CH); }catch(e){} CH=null; }
  var o=(await sb.from('orgs').select('*').eq('id',id).single()).data;
  var me=(await sb.from('members').select('*').eq('org_id',id).eq('user_id',C.user.id).single()).data;
  if(!o||!me){ toast('Δεν βρέθηκε το γραφείο'); A().boot({niche:null}); return; }
  C.org=o; C.me=me; if(!C.orgs.some(function(x){return x.id===o.id})) C.orgs.push(o);
  var st=A().state();
  var local=lsGet('advon_ai_cache_'+id)||null, chat=lsGet('advon_ai_chat_'+id)||{};
  // 1) show the cached copy at once
  var base={niche:o.niche, office:{name:o.name||'', owner:me.name||''}, settings:Object.assign({model:'claude-haiku-5-5',approve:true,cap_usd:40},o.settings||{}), chat:chat.chat||[], api:chat.api||[], brief:chat.brief||null};
  COLLS.forEach(function(k){ base[k]=(local&&local[k])||[]; });
  A().boot(base);
  setSync('Φόρτωση…');
  // 2) fresh copy from the server + anything this device had not sent yet
  try{
    var fresh={}; COLLS.forEach(function(k){ fresh[k]=[]; }); var from=0, snap={};
    for(;;){ var q=await sb.from('records').select('coll,id,data').eq('org_id',id).order('coll').order('id').range(from,from+999); if(q.error) throw q.error;
      (q.data||[]).forEach(function(r){ if(fresh[r.coll]){ fresh[r.coll].push(r.data); snap[r.coll+'|'+r.id]=stable(r.data); } });
      if(!q.data||q.data.length<1000) break; from+=1000; }
    if(local && local.snap){ // re-apply this device's unsent edits
      COLLS.forEach(function(k){ (local[k]||[]).forEach(function(obj){ var key=k+'|'+obj.id, js=stable(obj); if(local.snap[key]!==js){ var arr=fresh[k], ix=arr.findIndex(function(x){return x.id===obj.id}); if(ix>=0) arr[ix]=obj; else arr.push(obj); } }); });
      Object.keys(local.snap).forEach(function(key){ var p=key.split('|'), k=p[0], oid=p.slice(1).join('|'); if(!(local[k]||[]).some(function(x){return x.id===oid}) && snap[key]===local.snap[key]){ fresh[k]=fresh[k].filter(function(x){return x.id!==oid}); } });
    }
    SNAP=snap; st=A().state(); COLLS.forEach(function(k){ st[k]=fresh[k]; });
    SYNC.offline=false; cache();
    if(opt.seed){ A().seed(); }
    A().refresh(); A().route();
    push();
  }catch(e){ SYNC.offline=true; setSync('Εκτός σύνδεσης — δουλεύετε με το αντίγραφο της συσκευής'); }
  subscribe(id);
  loadMembers(); C.refreshStatus().then(function(){ A().refresh(); });
  registerSW();
}
async function loadMembers(){ var r=await sb.from('members').select('user_id,name,email,role').eq('org_id',C.org.id); C.members=r.data||[]; }

/* ---------------- live sync ---------------- */
function cache(){ var st=A().state(); if(!C.org||!st) return; var o={snap:SNAP}; COLLS.forEach(function(k){ o[k]=st[k]; }); lsSet('advon_ai_cache_'+C.org.id,o); lsSet('advon_ai_chat_'+C.org.id,{chat:st.chat,api:st.api,brief:st.brief}); }
function setSync(t){ C._sync=t; var e=$('#syncSt'); if(e) e.textContent=t; }
C.syncLabel=function(){ return C._sync||'Συγχρονισμένο'; };
C.persist=function(){ cache(); clearTimeout(SYNC.timer); SYNC.timer=setTimeout(push,350); };
async function push(){
  if(!C.org||!C.user) return; if(SYNC.busy){ SYNC.again=true; return; } SYNC.busy=true;
  var st=A().state(), ups=[], dels={}, n=0;
  COLLS.forEach(function(k){ (st[k]||[]).forEach(function(o){ if(!o||!o.id) return; var key=k+'|'+o.id, js=stable(o); if(SNAP[key]!==js) ups.push({key:key,js:js,row:{org_id:C.org.id,coll:k,id:String(o.id),data:JSON.parse(js),updated_by:C.user.id,updated_at:new Date().toISOString()}}); }); });
  var have={}; COLLS.forEach(function(k){ (st[k]||[]).forEach(function(o){ if(o&&o.id) have[k+'|'+o.id]=1; }); });
  Object.keys(SNAP).forEach(function(key){ if(!have[key]){ var p=key.split('|'); (dels[p[0]]=dels[p[0]]||[]).push(p.slice(1).join('|')); } });
  if(!ups.length && !Object.keys(dels).length){ SYNC.busy=false; if(!SYNC.offline) setSync('Συγχρονισμένο'); return; }
  setSync('Αποθήκευση…');
  try{
    for(var i=0;i<ups.length;i+=250){ var ch=ups.slice(i,i+250); var r=await sb.from('records').upsert(ch.map(function(u){return u.row})); if(r.error) throw r.error; ch.forEach(function(u){ SNAP[u.key]=u.js; }); n+=ch.length; }
    for(var k in dels){ var ids=dels[k]; for(var j=0;j<ids.length;j+=200){ var part=ids.slice(j,j+200); var r2=await sb.from('records').delete().eq('org_id',C.org.id).eq('coll',k).in('id',part); if(r2.error) throw r2.error; part.forEach(function(x){ delete SNAP[k+'|'+x]; }); } }
    SYNC.offline=false; SYNC.err=''; setSync('Συγχρονισμένο');
  }catch(e){ SYNC.err=e.message||String(e); SYNC.offline=true; setSync('Δεν αποθηκεύτηκε ακόμα — θα ξαναδοκιμάσω'); setTimeout(push,8000); }
  cache(); SYNC.busy=false; if(SYNC.again){ SYNC.again=false; push(); }
}
function applyRemote(coll,id,data,del){
  var st=A().state(); if(!st||!st[coll]) return; var arr=st[coll], ix=-1, key=coll+'|'+id;
  for(var i=0;i<arr.length;i++) if(String(arr[i].id)===String(id)){ ix=i; break; }
  if(del){ if(!(key in SNAP) && ix<0) return; if(ix>=0) arr.splice(ix,1); delete SNAP[key]; }
  else { var js=stable(data); if(SNAP[key]===js) return; if(ix>=0){ var o=arr[ix]; Object.keys(o).forEach(function(k){ if(!(k in data)) delete o[k]; }); Object.assign(o,data); } else arr.push(data); SNAP[key]=js; }
  cache(); A().refresh();
}
function subscribe(id){
  CH=sb.channel('org-'+id)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'records',filter:'org_id=eq.'+id},function(p){ applyRemote(p.new.coll,p.new.id,p.new.data,false); })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'records',filter:'org_id=eq.'+id},function(p){ applyRemote(p.new.coll,p.new.id,p.new.data,false); })
   .on('postgres_changes',{event:'DELETE',schema:'public',table:'records'},function(p){ var o=p.old||{}; if(o.org_id===id) applyRemote(o.coll,o.id,null,true); })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orgs',filter:'id=eq.'+id},function(p){ var o=p.new, st=A().state(); C.org=Object.assign(C.org,o); st.office.name=o.name||''; st.niche=o.niche; st.settings=Object.assign(st.settings||{},o.settings||{}); A().refresh(); })
   .subscribe(function(status){ if(status==='SUBSCRIBED'&&!SYNC.offline) setSync('Συγχρονισμένο · ζωντανά'); });
}
addEventListener('online',function(){ push(); });
d.addEventListener('visibilitychange',function(){ if(!d.hidden && C.org){ push(); } });

/* ---------------- offices ---------------- */
C.createOrg=async function(name,niche,owner,demo){
  var my=owner||lsGet('advon_ai_myname')||((C.user&&C.user.user_metadata&&C.user.user_metadata.name)||'');
  var r=await sb.rpc('create_org',{p_name:name||'',p_niche:niche,p_owner:my}); if(r.error) throw new Error(r.error.message);
  C.orgs.push(r.data); await openOrg(r.data.id,{seed:!!demo}); location.hash='today';
};
C.joinOrg=async function(code,name){
  var my=name||lsGet('advon_ai_myname')||((C.user&&C.user.user_metadata&&C.user.user_metadata.name)||'');
  var r=await sb.rpc('join_org',{p_code:code,p_name:my}); if(r.error) throw new Error(/Λάθος/.test(r.error.message)?'Λάθος κωδικός ομάδας':r.error.message);
  C.orgs.push(r.data); await openOrg(r.data.id); location.hash='today';
};
C.switchOrg=function(id){ openOrg(id); };
C.saveOrg=async function(patch){ var r=await sb.from('orgs').update(patch).eq('id',C.org.id).select().single(); if(r.error){ toast(r.error.message); return; } C.org=r.data; };
C.saveMe=async function(patch){ var r=await sb.from('members').update(patch).eq('org_id',C.org.id).eq('user_id',C.user.id).select().single(); if(r.error){ toast(r.error.message); return; } C.me=r.data; };
C.email=function(){ return (C.user&&C.user.email)||''; };
C.appUrl=function(){ return location.origin+location.pathname; };
C.signOut=async function(){ try{ await C.disablePush(true); }catch(e){} await sb.auth.signOut(); try{ Object.keys(localStorage).filter(function(k){ return /^advon_ai_(cache|chat)_|^advon_ai_org$/.test(k); }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){} location.hash=''; location.reload(); };

/* ---------------- server calls ---------------- */
async function fn(name,body){
  var s=(await sb.auth.getSession()).data.session; if(!s) throw new Error('Συνδεθείτε ξανά');
  var r; try{ r=await fetch(SB_URL+'/functions/v1/'+name,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':SB_KEY},body:JSON.stringify(Object.assign({org_id:C.org&&C.org.id},body))}); }
  catch(e){ throw new Error('Δεν υπάρχει σύνδεση με τον server — ελέγξτε το internet'); }
  var j=await r.json().catch(function(){ return {}; });
  if(!r.ok||j.error) throw new Error((j.error&&j.error.message)||('Σφάλμα server '+r.status));
  return j;
}
C.ai=async function(body){ var j=await fn('ai',body); if(C.status&&C.status.usage&&j.usage){ var u=C.status.usage; u.calls=(u.calls||0)+1; u.usd=Number(u.usd||0)+(j._cost||0); u.in_tokens=(u.in_tokens||0)+(j.usage.input_tokens||0); u.out_tokens=(u.out_tokens||0)+(j.usage.output_tokens||0); u.cache_read=(u.cache_read||0)+(j.usage.cache_read_input_tokens||0); u.cache_write=(u.cache_write||0)+(j.usage.cache_creation_input_tokens||0); } return j; };
C.refreshStatus=async function(){ try{ C.status=await fn('ai',{mode:'status'}); }catch(e){ C.status=C.status||{ai:false,usage:{},error:e.message}; } return C.status; };
C.notify=function(mode){ return fn('notify',{mode:mode}); };
C.transcribe=async function(blob){ var b64=await new Promise(function(res,rej){ var fr=new FileReader(); fr.onload=function(){ res(String(fr.result).split(',')[1]||''); }; fr.onerror=rej; fr.readAsDataURL(blob); }); var j=await fn('ai',{mode:'transcribe',audio:b64,mime:blob.type}); return j.text||''; };

/* ---------------- notifications ---------------- */
var SWREG=null, SUBNOW=null;
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
function standalone(){ return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true; }
async function registerSW(){ if(!('serviceWorker' in navigator)) return; try{ SWREG=await navigator.serviceWorker.register('sw.js',{scope:'./'}); SUBNOW=await SWREG.pushManager.getSubscription(); A().refresh(); }catch(e){} }
C.pushState=function(){
  var can=('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
  var hint='';
  if(isIOS()&&!standalone()) hint='<b>Στο iPhone:</b> πατήστε <b>Κοινοποίηση</b> (το τετράγωνο με το βελάκι) → <b>Προσθήκη στην οθόνη Αφετηρίας</b>, ανοίξτε το Advon AI από το εικονίδιο και πατήστε εδώ «Ενεργοποίηση». Το iPhone στέλνει ειδοποιήσεις μόνο σε εφαρμογές της οθόνης Αφετηρίας.';
  else if(!can) hint='Αυτός ο browser δεν υποστηρίζει ειδοποιήσεις — δοκιμάστε Chrome, Edge ή Safari.';
  else if(Notification.permission==='denied') hint='Οι ειδοποιήσεις είναι μπλοκαρισμένες για αυτή τη σελίδα. Ενεργοποιήστε τες από τις ρυθμίσεις του browser (το λουκέτο δίπλα στη διεύθυνση) και ξαναπατήστε.';
  return {can:can&&!(isIOS()&&!standalone())&&Notification.permission!=='denied', on:!!SUBNOW&&Notification.permission==='granted', hint:hint};
};
function b64u(s){ var p='='.repeat((4-s.length%4)%4), b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; }
C.enablePush=async function(){
  if(!SWREG) await registerSW(); if(!SWREG) throw new Error('Οι ειδοποιήσεις δεν υποστηρίζονται εδώ');
  var p=await Notification.requestPermission(); if(p!=='granted') throw new Error('Δεν δόθηκε άδεια για ειδοποιήσεις');
  var sub=await SWREG.pushManager.getSubscription(); if(!sub) sub=await SWREG.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)});
  var r=await sb.from('push_subs').upsert({endpoint:sub.endpoint,user_id:C.user.id,org_id:C.org.id,sub:sub.toJSON(),ua:navigator.userAgent.slice(0,180)}); if(r.error) throw new Error(r.error.message);
  SUBNOW=sub;
};
C.disablePush=async function(quiet){ if(!SWREG) return; var sub=await SWREG.pushManager.getSubscription(); if(sub){ await sb.from('push_subs').delete().eq('endpoint',sub.endpoint); await sub.unsubscribe(); } SUBNOW=null; if(!quiet) toast('Οι ειδοποιήσεις σταμάτησαν σε αυτή τη συσκευή'); };

/* ---------------- start ---------------- */
C.start=async function(){
  d.body.dataset.view='auth'; $('#main').innerHTML='<div class="auth"><div class="orb big">'+A().IC.spark+'</div><p class="sub">Φόρτωση…</p></div>';
  sb.auth.onAuthStateChange(function(ev){ if(ev==='PASSWORD_RECOVERY') authView('reset'); if(ev==='SIGNED_OUT'){ C.org=null; } });
  var s=(await sb.auth.getSession()).data.session;
  if(/type=recovery/.test(location.hash)) return;
  if(!s) authView(); else afterLogin();
};
})();
