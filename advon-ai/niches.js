/* Advon AI — niche config + demo data. 21 Oct 2026 */
(function(){
'use strict';
var DAY=864e5;
function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function addDays(n){ var d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return iso(d); }
/* deterministic random */
function rng(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
var MALE=['Γιώργος','Νίκος','Κώστας','Δημήτρης','Γιάννης','Παναγιώτης','Βασίλης','Αντώνης','Μιχάλης','Σπύρος','Θανάσης','Χρήστος','Στέλιος','Άγγελος','Ηλίας','Μανώλης','Πέτρος','Λευτέρης'];
var FEMALE=['Μαρία','Ελένη','Κατερίνα','Βασιλική','Σοφία','Αγγελική','Δήμητρα','Γεωργία','Χριστίνα','Ειρήνη','Αναστασία','Δέσποινα','Φωτεινή','Νίκη','Ευαγγελία','Μαρίνα'];
var SUR=[['Παπαδόπουλος','Παπαδοπούλου'],['Γεωργίου','Γεωργίου'],['Λάμπρου','Λάμπρου'],['Νικολάου','Νικολάου'],['Οικονόμου','Οικονόμου'],['Παπαδάκης','Παπαδάκη'],['Ζαχαρίου','Ζαχαρίου'],['Μιχαηλίδης','Μιχαηλίδου'],['Σταύρου','Σταύρου'],['Αντωνίου','Αντωνίου'],['Καραγιάννης','Καραγιάννη'],['Βλάχος','Βλάχου'],['Δημητρίου','Δημητρίου'],['Κωνσταντίνου','Κωνσταντίνου'],['Αλεξίου','Αλεξίου'],['Ρήγας','Ρήγα'],['Φωτίου','Φωτίου'],['Μάνου','Μάνου'],['Ντόκος','Ντόκου'],['Ιωάννου','Ιωάννου'],['Χατζής','Χατζή'],['Σωτηρίου','Σωτηρίου'],['Πετρόπουλος','Πετροπούλου'],['Αθανασίου','Αθανασίου'],['Τσακίρης','Τσακίρη'],['Μαρκόπουλος','Μαρκοπούλου'],['Καλογεράς','Καλογερά'],['Ζαφείρης','Ζαφείρη'],['Λιάπης','Λιάπη'],['Χριστοδούλου','Χριστοδούλου']];
var CITIES=['Αθήνα','Περιστέρι','Καλλιθέα','Νέα Σμύρνη','Γλυφάδα','Χαλάνδρι','Μαρούσι','Πειραιάς','Αιγάλεω','Κηφισιά'];
function phone(r){ return '69'+String(Math.floor(r()*1e8)).padStart(8,'0'); }
function people(r,n){ var out=[], used={}; while(out.length<n){ var f=r()<.5, first=(f?FEMALE:MALE)[Math.floor(r()*(f?FEMALE:MALE).length)], s=SUR[Math.floor(r()*SUR.length)], last=s[f?1:0], name=first+' '+last; if(used[name]) continue; used[name]=1; out.push({name:name, female:f}); } return out; }
var uid=(function(){ var i=0; return function(p){ i++; return p+i.toString(36)+Math.floor(Math.random()*1e6).toString(36); }; })();

var N={};
N.asf={
  key:'asf', label:'Ασφαλιστικό γραφείο', color:'#2F6FE0', soft:'#E8F0FD',
  clients:'Πελάτες', client:'Πελάτης', items:'Συμβόλαια', item:'Συμβόλαιο', dateLabel:'Λήξη', amountLabel:'Ασφάλιστρο (€)', refLabel:'Πινακίδα / αρ. συμβολαίου', extraLabel:'Εταιρεία',
  types:['ΙΧ','Μοτοσυκλέτα','Κατοικία','Υγείας','Ζωής','Επαγγελματική'],
  statuses:['Ενεργό','Ανανεώθηκε','Χάθηκε'], activeStatus:['Ενεργό'], alertDays:30,
  upcomingTitle:'Λήξεις που έρχονται',
  vocab:'Ασφαλιστικό γραφείο. «Συμβόλαια» (items) έχουν τύπο (ΙΧ, Κατοικία, Υγείας…), ημερομηνία λήξης (date), ασφάλιστρο (amount), εταιρεία (extra) και πινακίδα/αρ. συμβολαίου (ref). Ευκαιρίες: πελάτες με ΙΧ χωρίς Κατοικία, λήξεις χωρίς επαφή.',
  chips:['Ποιοι λήγουν τον επόμενο μήνα;','Ποιος έχει ΙΧ αλλά όχι σπίτι;','Θύμισέ μου να πάρω τον Λάμπρου αύριο στις 11','Γράψε μήνυμα ανανέωσης για τον Παπαδόπουλο'],
  voiceHint:'π.χ. «Θύμισέ μου να πάρω τον Λάμπρου την Πέμπτη για το σπίτι»',
  demo:function(){ var r=rng(11), P=people(r,42), C=[], I=[], cos=['Interamerican','Ευρωπαϊκή Πίστη','Generali','Ethniki','Allianz','Eurolife','ERGO'];
    P.forEach(function(p,i){ var c={id:uid('c'),name:p.name,phone:phone(r),email:'',afm:'',city:CITIES[Math.floor(r()*CITIES.length)],tags:[],notes:'',createdAt:Date.now()-Math.floor(r()*900)*DAY,lastContact:addDays(-Math.floor(r()*120))}; C.push(c);
      var hasCar=r()<.82; if(hasCar){ var exp=Math.floor(r()*190)-12; I.push({id:uid('i'),clientId:c.id,type:'ΙΧ',title:'ΙΧ '+['ΙΚΧ','ΙΝΚ','ΙΤΖ','ΥΖΑ','ΙΚΜ'][Math.floor(r()*5)]+'-'+(1000+Math.floor(r()*8999)),ref:'',date:addDays(exp),amount:180+Math.floor(r()*260),status:exp<-5?(r()<.5?'Ανανεώθηκε':'Χάθηκε'):'Ενεργό',extra:cos[Math.floor(r()*cos.length)]}); }
      if(r()<.38) I.push({id:uid('i'),clientId:c.id,type:'Κατοικία',title:'Κατοικία '+c.city,ref:'',date:addDays(Math.floor(r()*300)),amount:90+Math.floor(r()*160),status:'Ενεργό',extra:cos[Math.floor(r()*cos.length)]});
      if(r()<.25) I.push({id:uid('i'),clientId:c.id,type:'Υγείας',title:'Πρόγραμμα υγείας',ref:'',date:addDays(Math.floor(r()*330)),amount:600+Math.floor(r()*900),status:'Ενεργό',extra:cos[Math.floor(r()*cos.length)]});
      if(r()<.1) I.push({id:uid('i'),clientId:c.id,type:'Ζωής',title:'Ασφάλεια ζωής',ref:'',date:addDays(Math.floor(r()*360)),amount:400+Math.floor(r()*500),status:'Ενεργό',extra:cos[Math.floor(r()*cos.length)]});
    });
    I.forEach(function(it){ if(it.type==='ΙΧ') it.ref=it.title.slice(3); });
    var Rm=[{text:'Πάρε τηλέφωνο για την ανανέωση του ΙΧ',client:1,d:0,t:'11:00'},{text:'Στείλε προσφορά για ασφάλεια κατοικίας',client:3,d:0,t:''},{text:'Ζήτα δίπλωμα και άδεια για το νέο αυτοκίνητο',client:6,d:1,t:'10:00'},{text:'Έλεγχος αποζημίωσης — έχει έρθει η πραγματογνωμοσύνη;',client:8,d:-1,t:''},{text:'Ευχές για γενέθλια',client:12,d:2,t:''}];
    var R=Rm.map(function(x){ return {id:uid('r'),text:x.text,date:addDays(x.d),time:x.t,clientId:C[x.client].id,done:false,source:'manual',createdAt:Date.now()}; });
    var A=[{id:uid('a'),clientId:C[1].id,text:'Τηλεφώνησε — θέλει να συγκρίνει τιμές πριν ανανεώσει',kind:'call',at:Date.now()-3*DAY}];
    return {clients:C, items:I, reminders:R, activity:A}; },
  suggest:function(S,h){ var out=[]; var byC={}; S.items.forEach(function(i){ (byC[i.clientId]=byC[i.clientId]||[]).push(i); });
    var carNoHome=S.clients.filter(function(c){ var it=byC[c.id]||[]; return it.some(function(i){return i.type==='ΙΧ'&&i.status!=='Χάθηκε'}) && !it.some(function(i){return i.type==='Κατοικία'}); });
    if(carNoHome.length) out.push({icon:'spark',title:carNoHome.length+' πελάτες έχουν ΙΧ αλλά όχι ασφάλεια σπιτιού',text:'Ευκαιρία για νέα συμβόλαια — π.χ. '+carNoHome.slice(0,3).map(function(c){return c.name}).join(', ')+'.',ask:'Ποιοι πελάτες έχουν ΙΧ αλλά όχι ασφάλεια σπιτιού; Γράψε μου ένα σύντομο μήνυμα πρότασης για τους 3 πρώτους.'});
    var soon=S.items.filter(function(i){ return i.status==='Ενεργό' && h.daysTo(i.date)>=0 && h.daysTo(i.date)<=14; });
    var noContact=soon.filter(function(i){ var c=h.client(i.clientId); return c && (!c.lastContact || h.daysTo(c.lastContact)<-20); });
    if(noContact.length) out.push({icon:'phone',title:noContact.length+' λήξεις σε 14 μέρες χωρίς πρόσφατη επαφή',text:noContact.slice(0,3).map(function(i){return h.client(i.clientId).name+' ('+h.fmtDate(i.date)+')'}).join(' · '),ask:'Ποιες λήξεις έχω τις επόμενες 14 μέρες χωρίς πρόσφατη επαφή; Βάλε μου υπενθύμιση να τους πάρω.'});
    var lost=S.items.filter(function(i){return i.status==='Χάθηκε'}); if(lost.length) out.push({icon:'undo',title:lost.length+' συμβόλαια χάθηκαν φέτος',text:'Αξίζει ένα τηλέφωνο επαναφοράς — συχνά πήγαν αλλού για τιμή.',ask:'Ποια συμβόλαια χάθηκαν; Πρότεινέ μου πώς να τους ξαναπλησιάσω.'});
    return out; }
};
N.log={
  key:'log', label:'Λογιστικό γραφείο', color:'#0F7A5C', soft:'#E3F4EE',
  clients:'Πελάτες', client:'Πελάτης', items:'Υποχρεώσεις', item:'Υποχρέωση', dateLabel:'Προθεσμία', amountLabel:'Αμοιβή (€)', refLabel:'Περίοδος', extraLabel:'Υπεύθυνος',
  types:['Παραστατικά μήνα','ΦΠΑ','ΜΥΦ','Μισθοδοσία','Ε1','ΕΝΦΙΑ','Σύμβαση'],
  statuses:['Λείπει','Ήρθε','Υποβλήθηκε'], activeStatus:['Λείπει','Ήρθε'], alertDays:10,
  upcomingTitle:'Προθεσμίες & ό,τι λείπει',
  vocab:'Λογιστικό γραφείο. «Υποχρεώσεις» (items) ανά πελάτη: τύπος (Παραστατικά μήνα, ΦΠΑ, ΜΥΦ, Μισθοδοσία, Ε1…), προθεσμία (date), κατάσταση (Λείπει / Ήρθε / Υποβλήθηκε), περίοδος (ref), υπεύθυνος υπάλληλος (extra). «Λείπει» = ο πελάτης δεν έχει στείλει τα στοιχεία.',
  chips:['Ποιοι δεν έχουν στείλει τα παραστατικά του μήνα;','Ποιες προθεσμίες έχω αυτή την εβδομάδα;','Θύμισέ μου τον Μαρκόπουλο την Παρασκευή για τα τιμολόγια','Γράψε υπενθύμιση σε όσους λείπουν χαρτιά'],
  voiceHint:'π.χ. «Ο Μαρκόπουλος θα φέρει τα τιμολόγια την Παρασκευή, θύμισέ μου»',
  demo:function(){ var r=rng(23), P=people(r,30), C=[], I=[], biz=['Καφέ','Ταβέρνα','Τεχνική','Ηλεκτρολογικά','Φαρμακείο','Κομμωτήριο','Γυμναστήριο','Mini Market','Φροντιστήριο','Ψητοπωλείο'], staff=['Μαρία','Κώστας','Ελένη'];
    var mon=['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'], prev=new Date(); prev.setMonth(prev.getMonth()-1); var pm=mon[prev.getMonth()];
    P.forEach(function(p,i){ var isBiz=r()<.6, name=isBiz? biz[Math.floor(r()*biz.length)]+' '+p.name.split(' ')[1] : p.name;
      var c={id:uid('c'),name:name,phone:phone(r),email:'',afm:'0'+String(Math.floor(r()*1e8)).padStart(8,'0'),city:CITIES[Math.floor(r()*CITIES.length)],tags:isBiz?['Επιχείρηση']:['Ιδιώτης'],notes:'',createdAt:Date.now()-Math.floor(r()*900)*DAY,lastContact:addDays(-Math.floor(r()*40))}; C.push(c);
      var who=staff[Math.floor(r()*staff.length)];
      if(isBiz){ I.push({id:uid('i'),clientId:c.id,type:'Παραστατικά μήνα',title:'Παραστατικά '+pm,ref:pm,date:addDays(3+Math.floor(r()*6)),amount:0,status:r()<.45?'Λείπει':'Ήρθε',extra:who});
        I.push({id:uid('i'),clientId:c.id,type:'ΦΠΑ',title:'Δήλωση ΦΠΑ '+pm,ref:pm,date:addDays(5+Math.floor(r()*12)),amount:0,status:r()<.2?'Υποβλήθηκε':'Ήρθε',extra:who});
        if(r()<.4) I.push({id:uid('i'),clientId:c.id,type:'Μισθοδοσία',title:'Μισθοδοσία '+pm,ref:pm,date:addDays(2+Math.floor(r()*10)),amount:0,status:r()<.3?'Λείπει':'Ήρθε',extra:who});
        if(r()<.3) I.push({id:uid('i'),clientId:c.id,type:'Σύμβαση',title:'Ανανέωση σύμβασης λογιστικής',ref:'',date:addDays(20+Math.floor(r()*80)),amount:80+Math.floor(r()*120),status:'Ήρθε',extra:who});
      } else { I.push({id:uid('i'),clientId:c.id,type:'ΕΝΦΙΑ',title:'Έλεγχος ΕΝΦΙΑ / Ε9',ref:'',date:addDays(8+Math.floor(r()*40)),amount:30,status:r()<.5?'Λείπει':'Ήρθε',extra:who}); }
    });
    var R=[{text:'Φέρνει τα τιμολόγια — έλεγξε αν ήρθαν',client:2,d:0,t:'12:00'},{text:'Τηλέφωνο για την ενημερότητα',client:5,d:0,t:''},{text:'Στείλε την κατάσταση μισθοδοσίας',client:7,d:1,t:'10:00'},{text:'Ζήτα το συμβόλαιο ενοικίασης',client:10,d:-2,t:''}].map(function(x){ return {id:uid('r'),text:x.text,date:addDays(x.d),time:x.t,clientId:C[x.client].id,done:false,source:'manual',createdAt:Date.now()}; });
    return {clients:C, items:I, reminders:R, activity:[]}; },
  suggest:function(S,h){ var out=[]; var miss=S.items.filter(function(i){return i.status==='Λείπει'}); var cl={}; miss.forEach(function(i){cl[i.clientId]=1});
    if(miss.length) out.push({icon:'send',title:Object.keys(cl).length+' πελάτες σας χρωστούν χαρτιά',text:miss.slice(0,3).map(function(i){return h.client(i.clientId).name+' — '+i.title}).join(' · '),ask:'Ποιοι πελάτες χρωστούν χαρτιά; Γράψε μου ένα ευγενικό μήνυμα υπενθύμισης για κάθε έναν με το τι ακριβώς λείπει.'});
    var urg=S.items.filter(function(i){ return i.status!=='Υποβλήθηκε' && h.daysTo(i.date)>=0 && h.daysTo(i.date)<=5; });
    if(urg.length) out.push({icon:'clock',title:urg.length+' προθεσμίες τις επόμενες 5 μέρες',text:urg.filter(function(i){return i.status==='Λείπει'}).length+' από αυτές δεν έχουν ακόμα στοιχεία.',ask:'Ποιες προθεσμίες έχω τις επόμενες 5 μέρες και σε ποιες λείπουν στοιχεία; Μοίρασέ τες ανά υπεύθυνο.'});
    var ren=S.items.filter(function(i){return i.type==='Σύμβαση' && h.daysTo(i.date)<=45 && h.daysTo(i.date)>=0}); if(ren.length) out.push({icon:'spark',title:ren.length+' συμβάσεις λήγουν σε 45 μέρες',text:'Καλή στιγμή για ανανέωση — και για αναπροσαρμογή αμοιβής.',ask:'Ποιες συμβάσεις λογιστικής λήγουν σύντομα; Βάλε μου υπενθυμίσεις.'});
    return out; }
};
N.mes={
  key:'mes', label:'Μεσιτικό γραφείο', color:'#C2620E', soft:'#FBEEDF',
  clients:'Επαφές', client:'Επαφή', items:'Ακίνητα & ζητήσεις', item:'Ακίνητο / ζήτηση', dateLabel:'Επόμενη επαφή', amountLabel:'Τιμή / budget (€)', refLabel:'Περιοχή', extraLabel:'Χαρακτηριστικά',
  types:['Ζήτηση αγοραστή','Ζήτηση ενοικιαστή','Ακίνητο προς πώληση','Ακίνητο προς ενοικίαση'],
  statuses:['Ενεργή','Υπόδειξη','Προσφορά','Έκλεισε','Ακυρώθηκε'], activeStatus:['Ενεργή','Υπόδειξη','Προσφορά'], alertDays:3,
  upcomingTitle:'Follow-ups & ραντεβού',
  vocab:'Μεσιτικό γραφείο. «Επαφές» = αγοραστές, ενοικιαστές, ιδιοκτήτες. Items: Ζήτηση αγοραστή/ενοικιαστή (περιοχή = ref, budget = amount, χαρακτηριστικά = extra π.χ. «2άρι, 70τ.μ.») ή Ακίνητο προς πώληση/ενοικίαση (περιοχή, τιμή, χαρακτηριστικά). date = επόμενη επαφή/follow-up. Ταίριασμα: ζήτηση και ακίνητο στην ίδια περιοχή με τιμή ≤ budget (+5%).',
  chips:['Ποιοι αγοραστές ταιριάζουν στα ακίνητά μου;','Ποιον να πάρω σήμερα;','Ο Δημήτρης θέλει 2άρι Καλλιθέα ως 180 χιλιάδες, πάρε τον σε 2 εβδομάδες','Γράψε ενημέρωση για την ιδιοκτήτρια της Λαμπράκη'],
  voiceHint:'π.χ. «Ο κ. Δημήτρης θέλει 2άρι στην Καλλιθέα ως 180 χιλιάδες, πάρε τον σε 2 εβδομάδες»',
  demo:function(){ var r=rng(37), P=people(r,36), C=[], I=[], areas=['Καλλιθέα','Νέα Σμύρνη','Παγκράτι','Γλυφάδα','Χαλάνδρι','Περιστέρι','Μαρούσι'], kinds=[['Γκαρσονιέρα',35,95],['2άρι',65,175],['3άρι',90,260],['Μεζονέτα',140,420]];
    P.forEach(function(p,i){ var c={id:uid('c'),name:p.name,phone:phone(r),email:'',afm:'',city:areas[Math.floor(r()*areas.length)],tags:[],notes:'',createdAt:Date.now()-Math.floor(r()*400)*DAY,lastContact:addDays(-Math.floor(r()*30))}; C.push(c);
      var k=kinds[Math.floor(r()*kinds.length)], area=areas[Math.floor(r()*areas.length)];
      if(i%3===0){ c.tags=['Ιδιοκτήτης']; var price=Math.round(k[2]*(0.85+r()*0.3))*1000; I.push({id:uid('i'),clientId:c.id,type:'Ακίνητο προς πώληση',title:k[0]+' '+area,ref:area,date:addDays(Math.floor(r()*14)),amount:price,status:['Ενεργή','Ενεργή','Υπόδειξη','Προσφορά'][Math.floor(r()*4)],extra:k[0]+', '+(k[1]+Math.floor(r()*20))+' τ.μ., '+(1+Math.floor(r()*5))+'ος'}); }
      else { c.tags=['Αγοραστής']; var bud=Math.round(k[2]*(0.85+r()*0.35))*1000; I.push({id:uid('i'),clientId:c.id,type:r()<.8?'Ζήτηση αγοραστή':'Ζήτηση ενοικιαστή',title:k[0]+' '+area,ref:area,date:addDays(Math.floor(r()*20)-6),amount:bud,status:['Ενεργή','Ενεργή','Υπόδειξη'][Math.floor(r()*3)],extra:k[0]+(r()<.4?', με θέση στάθμευσης':'')}); }
    });
    var R=[{text:'Υπόδειξη 18:00 — κλειδιά στο γραφείο',client:1,d:0,t:'18:00'},{text:'Πάρε τηλέφωνο — είδε το 2άρι, θέλει δεύτερη υπόδειξη',client:2,d:0,t:'12:00'},{text:'Ενημέρωση ιδιοκτήτη για τις υποδείξεις της εβδομάδας',client:3,d:1,t:''},{text:'Ζήτα προέγκριση δανείου',client:5,d:-1,t:''}].map(function(x){ return {id:uid('r'),text:x.text,date:addDays(x.d),time:x.t,clientId:C[x.client].id,done:false,source:'manual',createdAt:Date.now()}; });
    return {clients:C, items:I, reminders:R, activity:[]}; },
  matches:function(S){ var props=S.items.filter(function(i){return /^Ακίνητο/.test(i.type) && i.status!=='Έκλεισε' && i.status!=='Ακυρώθηκε'}), wants=S.items.filter(function(i){return /^Ζήτηση/.test(i.type) && i.status!=='Έκλεισε' && i.status!=='Ακυρώθηκε'}), out=[];
    props.forEach(function(p){ var sale=/πώληση/.test(p.type); var m=wants.filter(function(w){ return (sale? /αγοραστή/.test(w.type) : /ενοικιαστή/.test(w.type)) && w.ref===p.ref && p.amount<=w.amount*1.05 && (w.extra||'').split(',')[0].trim()===(p.extra||'').split(',')[0].trim(); }); if(m.length) out.push({prop:p, wants:m}); });
    return out; },
  suggest:function(S,h){ var out=[], m=N.mes.matches(S);
    if(m.length){ var n=m.reduce(function(a,x){return a+x.wants.length},0); out.push({icon:'spark',title:n+' ταιριάσματα αγοραστών με ακίνητα σας',text:m.slice(0,2).map(function(x){return x.prop.title+' → '+x.wants.map(function(w){return h.client(w.clientId).name}).join(', ')}).join(' · '),ask:'Ποιοι αγοραστές ταιριάζουν στα ακίνητά μου; Γράψε μου μήνυμα για τον καθένα.'}); }
    var due=S.items.filter(function(i){ return /^Ζήτηση/.test(i.type) && h.daysTo(i.date)<=0 && i.status!=='Έκλεισε' && i.status!=='Ακυρώθηκε'; });
    if(due.length) out.push({icon:'phone',title:due.length+' αγοραστές περιμένουν τηλέφωνο',text:due.slice(0,3).map(function(i){return h.client(i.clientId).name+' ('+i.title+')'}).join(' · '),ask:'Ποιους αγοραστές πρέπει να πάρω σήμερα και τι ψάχνει ο καθένας;'});
    var own=S.items.filter(function(i){return /^Ακίνητο/.test(i.type) && i.status!=='Έκλεισε'}); if(own.length) out.push({icon:'send',title:'Εβδομαδιαία ενημέρωση σε '+own.length+' ιδιοκτήτες',text:'Οι ιδιοκτήτες που ενημερώνονται κάθε εβδομάδα σας εμπιστεύονται περισσότερο.',ask:'Γράψε μου σύντομη εβδομαδιαία ενημέρωση για κάθε ιδιοκτήτη με την κατάσταση του ακινήτου του.'});
    return out; }
};
window.ADVON_NICHES=N;
window.ADVON_UTIL={iso:iso, addDays:addDays, uid:uid};
})();
