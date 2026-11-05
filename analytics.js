/* ═══════════════════════════════════════════════════════════════
   FITNESS JURNAL — ANALIZE (funcții pure, testabile)
   Primesc datele ca parametri (rânduri, plan, data de referință) și nu ating
   stocarea sau pagina. index.html le apelează cu loadStore().rows etc.;
   test-analytics.js le rulează cu date de test, la o dată fixă.
   Rulează în browser (window.Analytics) și în Node (module.exports). ES5.
   ═══════════════════════════════════════════════════════════════ */
(function(root){
'use strict';

// ── Date: „dd.mm.yyyy" sau ISO → Date locală; zilele se numără în UTC (fără surprize la ora de vară)
function parseRo(s){
  if(!s)return null;
  if(s instanceof Date)return isNaN(s.getTime())?null:s;
  var mIso=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if(mIso){var d=new Date(+mIso[1],+mIso[2]-1,+mIso[3]);return isNaN(d.getTime())?null:d;}
  var p=String(s).split('.');
  if(p.length!==3)return null;
  var d2=new Date(parseInt(p[2],10),parseInt(p[1],10)-1,parseInt(p[0],10));
  return isNaN(d2.getTime())?null:d2;
}
function dayNum(d){d=parseRo(d);return d?Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000):null;}
function fromDayNum(n){var u=new Date(n*86400000);return new Date(u.getUTCFullYear(),u.getUTCMonth(),u.getUTCDate());}
function weekdayOf(n){return ((n%7)+7+3)%7;} // 0 = luni (1.1.1970 a fost joi)
function mondayOf(n){return n-weekdayOf(n);}
function roDate(n){var d=fromDayNum(n);return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();}
function pct(a,b){return b>0?Math.round(a/b*100):null;}

// ═══ BUG 1 — ADERENȚA ═══
// Planificate = zilele active din program între start și azi (fără zilele viitoare; ziua de azi
// intră doar dacă ai antrenat deja azi, ca procentul să nu scadă dimineața).
// Efectuate = date distincte cu ≥1 set de antrenament. Fără plafonare la 100%.
// opts: {active:[7 × bool, 0 = luni], ref:Date, programStart:Date|null, cycleStart:Date|null}
function adherence(rows,opts){
  var active=opts.active||[],refN=dayNum(opts.ref||new Date());
  var trained={},firstN=null;
  (rows||[]).forEach(function(r){
    if(!r||r.type!=='antrenament')return;
    var n=dayNum(r.date);if(n==null||n>refN)return;
    trained[n]=true;if(firstN===null||n<firstN)firstN=n;
  });
  var startN=opts.programStart?dayNum(opts.programStart):firstN;
  if(startN===null)return null;
  function count(fromN,toN){
    fromN=Math.max(fromN,startN);
    var done=0,planned=0;
    for(var n=fromN;n<=toN;n++){
      if(trained[n])done++;
      if(active[weekdayOf(n)]&&(n<refN||trained[n]))planned++;
    }
    return {done:done,planned:planned,pct:pct(done,planned)};
  }
  var mon=mondayOf(refN);
  var weeks=[];
  for(var w=7;w>=0;w--){var m=mon-7*w;var c=count(m,Math.min(m+6,refN));c.monday=roDate(m);c.current=(w===0);weeks.push(c);}
  var cycleN=opts.cycleStart?dayNum(opts.cycleStart):startN;
  return {
    total:count(startN,refN),
    cycle:count(cycleN,refN),
    last8:count(mon-49,refN),
    last8Complete:count(mon-49,mon-1),
    currentWeek:count(mon,refN),
    weeks:weeks,
    startDate:roDate(startN)
  };
}

// ═══ BUG 2 — VOLUMUL PE GRUPĂ (și proiecția săptămânii în curs) ═══
// entries: [{name, sets}] · infoFor(name) → {group, pattern} · secondary: {pattern:{grupă:fracție}}
function addVolume(vol,entries,infoFor,secondary){
  (entries||[]).forEach(function(e){
    var s=+e.sets||0;if(s<=0)return;
    var info=infoFor(e.name)||{};
    if(!info.group)return;
    vol[info.group]=(vol[info.group]||0)+s;
    var sec=info.pattern&&secondary&&secondary[info.pattern];
    if(sec)for(var g in sec){if(g!==info.group)vol[g]=(vol[g]||0)+sec[g]*s;}
  });
  return vol;
}
function volVerdict(v,lo,hi){return v<lo?'sub':(v<=hi?'in':'peste');}
// Proiecția = seturile făcute + seturile planificate în zilele active rămase din săptămână
function projectVolume(doneEntries,plannedEntries,infoFor,secondary){
  var done=addVolume({},doneEntries,infoFor,secondary);
  var proj=addVolume(addVolume({},doneEntries,infoFor,secondary),plannedEntries,infoFor,secondary);
  return {done:done,projected:proj};
}

// ═══ BUG 3 — STAGNAREA PE TERMEN LUNG (1RM estimat) ═══
// Epley: kg × (1 + rep/30). Exercițiile fără greutate (kg = 0) se judecă după repetări.
function e1rm(kg,reps){kg=+kg||0;reps=+reps||0;return kg>0?kg*(1+reps/30):reps;}
// Cel mai bun set pe ședință, pentru un exercițiu
function bestPerSession(rows,name){
  var list=(rows||[]).filter(function(r){return r&&r.type==='antrenament'&&r.exercise===name&&(+r.reps||0)>0;});
  var weighted=list.some(function(r){return (+r.kg||0)>0;});
  var byDay={};
  list.forEach(function(r){
    if(weighted&&!((+r.kg||0)>0))return;
    var n=dayNum(r.date);if(n==null)return;
    var sc=e1rm(r.kg,r.reps);
    if(!byDay[n]||sc>byDay[n].score)byDay[n]={n:n,date:roDate(n),score:sc,kg:+r.kg||0,reps:+r.reps||0};
  });
  return Object.keys(byDay).map(function(k){return byDay[k];}).sort(function(a,b){return a.n-b.n;});
}
// Stagnare = cel mai bun 1RM din ultimele 6 săptămâni ≤ cel mai bun 1RM de dinainte + 2%.
// Separat: „neexecutat" = ultima ședință e la ≥ 14 zile de azi.
function longStagnation(rows,name,ref,opts){
  opts=opts||{};
  var win=opts.windowDays||42,tol=opts.tolerance==null?0.02:opts.tolerance,idleDays=opts.idleDays||14;
  var refN=dayNum(ref||new Date());
  var ses=bestPerSession(rows,name).filter(function(s){return s.n<=refN;});
  if(!ses.length)return null;
  var cut=refN-win;
  var recent=null,prior=null;
  ses.forEach(function(s){
    if(s.n>cut){if(!recent||s.score>recent.score)recent=s;}
    else if(!prior||s.score>prior.score)prior=s;
  });
  var last=ses[ses.length-1];
  var out={
    weighted:last.kg>0,recent:recent,prior:prior,last:last,
    daysSince:refN-last.n,idle:(refN-last.n)>=idleDays,
    stagnant:null,changePct:null
  };
  if(recent&&prior){
    out.changePct=Math.round((recent.score/prior.score-1)*1000)/10;
    out.stagnant=recent.score<=prior.score*(1+tol);
  }
  return out;
}

// ═══ BUG 4 — DUREREA, SEPARAT DE ENERGIE ═══
var PAIN_ZONES=[
  {id:'umar_st',label:'Umăr stâng'},{id:'umar_dr',label:'Umăr drept'},
  {id:'cot',label:'Cot'},{id:'incheietura',label:'Încheietură'},{id:'gat',label:'Gât'},
  {id:'spate_sus',label:'Spate (sus)'},{id:'lombar',label:'Lombar'},{id:'sold',label:'Șold'},
  {id:'genunchi_st',label:'Genunchi stâng'},{id:'genunchi_dr',label:'Genunchi drept'},
  {id:'glezna',label:'Gleznă'},{id:'altul',label:'Altă zonă'}
];
function painZoneLabel(id){for(var i=0;i<PAIN_ZONES.length;i++)if(PAIN_ZONES[i].id===id)return PAIN_ZONES[i].label;return '';}
function norm(t){return String(t||'').toLowerCase().replace(/[ăâ]/g,'a').replace(/î/g,'i').replace(/[șş]/g,'s').replace(/[țţ]/g,'t');}
var PAIN_RX=/\b(dure|durer|dureri|doare|dor\b|durut|disconfort|jena|intep|tendin|entors|contractur|luxat|crampe|febra musculara|inflamat|umflat)/;
var ZONE_RX=/\b(umar|umeri|cot|coate|incheietur|pumn|gat|cervical|lombar|sale|sold|genunch|glezn)/;
function painFromText(text){
  var t=norm(text);
  if(!t.trim())return {isPain:false,zone:''};
  var isPain=PAIN_RX.test(t)||ZONE_RX.test(t);
  var zone='';
  var side=/\bdrept/.test(t)?'dr':(/\bstang/.test(t)?'st':'');
  if(/\bumar|\bumeri/.test(t))zone=side==='st'?'umar_st':'umar_dr';
  else if(/\bgenunch/.test(t))zone=side==='st'?'genunchi_st':'genunchi_dr';
  else if(/\bcot|\bcoate/.test(t))zone='cot';
  else if(/\bincheietur|\bpumn/.test(t))zone='incheietura';
  else if(/\blombar|\bsale|spate(le)? jos/.test(t))zone='lombar';
  else if(/\bspate/.test(t))zone='spate_sus';
  else if(/\bgat|\bcervical/.test(t))zone='gat';
  else if(/\bsold/.test(t))zone='sold';
  else if(/\bglezn/.test(t))zone='glezna';
  if(isPain&&!zone)zone='altul';
  // fără parte precizată, umărul și genunchiul trec pe dreapta; se corectează din foaia zilei
  return {isPain:isPain,zone:zone};
}
function validRating(v){var m=/^\s*(10|[1-9])\s*$/.exec(String(v==null?'':v));return m?parseInt(m[1],10):null;}
// Migrarea (idempotentă): notele de energie care vorbesc despre durere → rândul „durere" al zilei;
// ratingurile de energie cu text în loc de cifră → nota zilei (durere dacă e durere, altfel nota de energie).
// Rândurile mutate rămân cu textul gol și ts nou, ca sincronizarea să nu le aducă înapoi.
function migrateDayNotes(rows,now){
  now=now||Date.now();
  var changed=0,moved=[];
  function find(type,date,ex){for(var i=0;i<rows.length;i++){var r=rows[i];if(r.type===type&&r.date===date&&(ex==null||r.exercise===ex))return r;}return null;}
  function putPain(src,text){
    var p=painFromText(text),zone=p.zone||'altul',d=find('durere',src.date,zone); // v131: o notă pe zonă și zi
    if(!d){rows.push({date:src.date,day:src.day||'',type:'durere',exercise:zone,set:'',reps:'',kg:'',note:text,ex:'',ts:now});}
    else if(String(d.note||'').indexOf(text)<0){d.note=d.note?d.note+'; '+text:text;d.ts=now;}
  }
  rows.slice().forEach(function(r){
    if(!r)return;
    if(r.type==='ratenote'&&r.exercise==='energy'&&String(r.note||'').trim()){
      var t=String(r.note).trim();
      if(painFromText(t).isPain){putPain(r,t);r.note='';r.ts=now;changed++;moved.push(r.date);}
    }else if(r.type==='rating'&&r.exercise==='energy'&&String(r.note||'').trim()&&validRating(r.note)===null){
      var tx=String(r.note).trim();
      if(painFromText(tx).isPain)putPain(r,tx);
      else{
        var en=find('ratenote',r.date,'energy');
        if(!en)rows.push({date:r.date,day:r.day||'',type:'ratenote',exercise:'energy',set:'',reps:'',kg:'',note:tx,ts:now});
        else if(String(en.note||'').indexOf(tx)<0){en.note=en.note?en.note+'; '+tx:tx;en.ts=now;}
      }
      r.note='';r.ts=now;changed++;moved.push(r.date);
    }
  });
  return {rows:rows,changed:changed,dates:moved};
}

// ═══ v131 — ANTRENORUL ȚINE CONT DE DURERE ═══
// Ce încarcă fiecare zonă: pattern-uri din biblioteca de exerciții + nume (fără diacritice) + grupe, ca rezervă
var PAIN_LOAD={
  umar:{patterns:['push_h','push_v','izo_umeri','izo_piept','triceps'],rx:/dips|tractiuni|pullover/,groups:['piept','umeri','triceps']},
  cot:{patterns:['triceps','biceps','pull'],rx:null,groups:['biceps','triceps']},
  incheietura:{patterns:['push_h','push_v','biceps','triceps'],rx:/flotari/,groups:[]},
  gat:{patterns:['push_v'],rx:/deadlift|indreptari/,groups:[]},
  spate_sus:{patterns:['pull','spate_post','push_v'],rx:null,groups:['spate']},
  lombar:{patterns:['hinge'],rx:/bent-over|aplecat|deadlift|indreptari|squat cu bara|back squat|superman/,groups:[]},
  sold:{patterns:['squat','lunge','hinge','glute'],rx:null,groups:['fesieri']},
  genunchi:{patterns:['squat','lunge'],rx:/extensii cvadriceps|leg extension/,groups:['cvadriceps']},
  glezna:{patterns:['squat','lunge','gambe'],rx:null,groups:['gambe']}
};
function zoneBase(z){return String(z||'').replace(/_(st|dr)$/,'');}
// info = {pattern, group} (din volumeInfoFor)
function painAffects(zone,info,name){
  var L=PAIN_LOAD[zoneBase(zone)];if(!L)return false;
  info=info||{};
  if(info.pattern&&L.patterns.indexOf(info.pattern)>=0)return true;
  if(L.rx&&L.rx.test(norm(name)))return true;
  return !info.pattern&&!!info.group&&L.groups.indexOf(info.group)>=0;
}
// Zonele pe care le poate încărca un exercițiu, partea dreaptă propusă prima
function zonesFor(info,name){
  var out=[];
  PAIN_ZONES.forEach(function(z){if(z.id!=='altul'&&painAffects(z.id,info,name))out.push(z.id);});
  out.sort(function(a,b){return (/_dr$/.test(b)?1:0)-(/_dr$/.test(a)?1:0);});
  return out;
}
// 0–3 = continui normal · 4–6 = fără progresie · 7–10 = înlocuiește sau sari azi · nenotată = doar atenție
function painLevel(i){if(i===null||i===''||i===undefined||isNaN(+i))return 'watch';i=+i;return i>=7?'swap':(i>=4?'hold':'ok');}
function intOf(v){return (v===''||v==null||isNaN(parseInt(v,10)))?null:parseInt(v,10);}
// Durerile active: ultima notă pe zonă, cu intensitate > 0 (sau nenotată) și la cel mult 7 zile de azi.
// sinceDays = de cât timp ține lanțul de note fără pauză mai lungă de 7 zile (pentru „mergi la medic")
function activePains(rows,ref,windowDays){
  windowDays=windowDays||7;
  var refN=dayNum(ref||new Date()),byZone={};
  (rows||[]).forEach(function(r){
    if(!r||r.type!=='durere'||!r.exercise)return;
    var n=dayNum(r.date);if(n==null||n>refN)return;
    (byZone[r.exercise]=byZone[r.exercise]||[]).push({n:n,i:intOf(r.reps),text:r.note||'',ex:r.ex||'',date:roDate(n)});
  });
  var out=[];
  Object.keys(byZone).forEach(function(z){
    var L=byZone[z].sort(function(a,b){return a.n-b.n;}),last=L[L.length-1];
    if(last.i===0||refN-last.n>windowDays)return;
    var k=L.length-1;
    while(k>0&&L[k-1].i!==0&&(L[k].n-L[k-1].n)<=windowDays)k--;
    out.push({zone:z,intensity:last.i,level:painLevel(last.i),date:last.date,text:last.text,ex:last.ex,
      daysSince:refN-last.n,askedToday:last.n===refN,sinceDays:refN-L[k].n,since:L[k].date});
  });
  return out.sort(function(a,b){return (b.intensity||0)-(a.intensity||0);});
}
// Durerea cea mai puternică dintre cele active care încarcă exercițiul (sau null)
function painFor(pains,info,name){
  for(var i=0;i<(pains||[]).length;i++){if(painAffects(pains[i].zone,info,name))return pains[i];}
  return null;
}

// ═══ v131 — STAGNAREA VINE CU O SOLUȚIE ═══
// 2+ ⭐ plate deodată = oboseală → săptămână ușoară; altfel interval nou de repetări pentru 3 săptămâni
function stagnationAdvice(stagnantStars,target){
  var m=/(\d+)\s*[-–—]\s*(\d+)/.exec(String(target||''));
  var max=m?+m[2]:12;
  return {primary:stagnantStars>=2?'deload':'range',newRange:max<=8?'10–12':'6–8',weeks:3};
}

// ═══ v131 — ZIUA RATATĂ ═══
// opts: {active:[7 × bool], exDayOf:[7 × exDay], lists:{exDay:[nume]}, ref}
// Ratată = zi activă din săptămâna curentă, înainte de azi, fără niciun set și fără „sar azi", al cărei antrenament
// nu a fost făcut în altă zi a săptămânii. Ziua făcută se recunoaște după exercițiile salvate.
function missedDays(rows,opts){
  var refN=dayNum(opts.ref||new Date()),mon=mondayOf(refN),active=opts.active||[],exDayOf=opts.exDayOf||[],lists=opts.lists||{};
  var names={},skipped={};
  (rows||[]).forEach(function(r){
    if(!r)return;var n=dayNum(r.date);if(n==null||n<mon||n>mon+6)return;
    if(r.type==='antrenament'){(names[n]=names[n]||{})[r.exercise]=1;}
    else if(r.type==='skip')skipped[n]=1;
  });
  function doneExDay(n){
    var best=null,bc=0;
    Object.keys(lists).forEach(function(dk){var c=0;(lists[dk]||[]).forEach(function(nm){if(names[n][nm])c++;});if(c>bc){bc=c;best=dk;}});
    return best;
  }
  var doneBy={};
  Object.keys(names).forEach(function(k){var d=doneExDay(+k);if(d)(doneBy[d]=doneBy[d]||[]).push(+k);});
  var missed=[];
  for(var n=mon;n<refN;n++){
    var wd=weekdayOf(n);
    if(!active[wd]||names[n]||skipped[n])continue;
    var dk=exDayOf[wd],rec=(doneBy[dk]||[]).length>0; // același antrenament făcut în altă zi a săptămânii = recuperat
    if(!rec)missed.push({date:roDate(n),n:n,weekday:wd,exDay:dk});
  }
  var nextFree=null;
  for(var f=refN+1;f<=mon+6;f++){if(!active[weekdayOf(f)]){nextFree={date:roDate(f),weekday:weekdayOf(f)};break;}}
  return {missed:missed,todayTrained:!!names[refN],todayActive:!!active[weekdayOf(refN)],nextFree:nextFree};
}

// ═══ BUG 5 — COMPOZIȚIA CORPORALĂ ═══
// US Navy, în cm. Bărbat: 495 / (1,0324 − 0,19077·log10(talie − gât) + 0,15456·log10(înălțime)) − 450
function navyBF(waist,neck,height,sex,hip){
  waist=+waist||0;neck=+neck||0;height=+height||0;hip=+hip||0;
  if(!waist||!neck||!height)return null;
  var bf;
  if(sex==='F'){
    if(!hip||waist+hip<=neck)return null;
    bf=495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(height))-450;
  }else{
    if(waist<=neck)return null;
    bf=495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(height))-450;
  }
  if(isNaN(bf)||bf<3||bf>60)return null;
  return Math.round(bf*10)/10;
}
// measurements: rânduri „masuratoare" (orice ordine) → tabel vechi → nou
function bodyCompTable(measurements,height,sex){
  return (measurements||[]).map(function(m){return {m:m,n:dayNum(m.date)};}).filter(function(x){return x.n!=null;})
    .sort(function(a,b){return a.n-b.n;}).map(function(x){
      var m=x.m,w=+m.weight||null,wa=+m.waist||null,ne=+m.neck||null;
      var bf=navyBF(wa,ne,height,sex,m.hip);
      var need=[];
      if(wa&&!ne)need.push('gât');
      if(sex==='F'&&wa&&ne&&!(+m.hip))need.push('șolduri');
      return {
        date:roDate(x.n),weight:w,waist:wa,neck:ne,bf:bf,
        lean:(bf!=null&&w)?Math.round(w*(1-bf/100)*10)/10:null,
        whtr:(wa&&+height)?Math.round(wa/height*1000)/1000:null,
        need:need
      };
    });
}

// ═══ ÎMBUNĂTĂȚIRI ═══
// Greutatea: media pe ultimele 7 zile + trendul (regresie liniară pe 28 de zile), în kg/săptămână.
// Se afișează doar cu ≥ 4 cântăriri în ultimele 14 zile (altfel media ar fi o singură zi).
function weightTrend(measurements,ref){
  var refN=dayNum(ref||new Date());
  var pts=(measurements||[]).map(function(m){return {n:dayNum(m.date),w:+m.weight||0};})
    .filter(function(p){return p.n!=null&&p.w>0&&p.n<=refN;}).sort(function(a,b){return a.n-b.n;});
  var last14=pts.filter(function(p){return p.n>refN-14;}).length;
  var w7=pts.filter(function(p){return p.n>refN-7;});
  var ma7=w7.length?Math.round(w7.reduce(function(a,p){return a+p.w;},0)/w7.length*10)/10:null;
  var w28=pts.filter(function(p){return p.n>refN-28;});
  var trend=null;
  if(w28.length>=4&&(w28[w28.length-1].n-w28[0].n)>=10){
    var mx=0,my=0;w28.forEach(function(p){mx+=p.n;my+=p.w;});mx/=w28.length;my/=w28.length;
    var num=0,den=0;w28.forEach(function(p){num+=(p.n-mx)*(p.w-my);den+=(p.n-mx)*(p.n-mx);});
    if(den>0)trend=Math.round(num/den*7*100)/100;
  }
  return {ma7:ma7,count7:w7.length,count14:last14,trendPerWeek:trend,enough:last14>=4,last:pts.length?pts[pts.length-1]:null};
}
// Tracțiune / împingere: seturi directe; classify(name) → 'pull' | 'push' | null
function pullPush(entries,classify){
  var pull=0,push=0;
  (entries||[]).forEach(function(e){var c=classify(e.name),s=+e.sets||0;if(c==='pull')pull+=s;else if(c==='push')push+=s;});
  var ratio=push>0?Math.round(pull/push*100)/100:null;
  return {pull:pull,push:push,ratio:ratio,low:ratio!==null&&ratio<1};
}

var API={
  parseRo:parseRo,dayNum:dayNum,fromDayNum:fromDayNum,weekdayOf:weekdayOf,mondayOf:mondayOf,roDate:roDate,
  adherence:adherence,
  addVolume:addVolume,volVerdict:volVerdict,projectVolume:projectVolume,
  e1rm:e1rm,bestPerSession:bestPerSession,longStagnation:longStagnation,
  PAIN_ZONES:PAIN_ZONES,painZoneLabel:painZoneLabel,painFromText:painFromText,validRating:validRating,migrateDayNotes:migrateDayNotes,
  painAffects:painAffects,zonesFor:zonesFor,painLevel:painLevel,activePains:activePains,painFor:painFor,
  stagnationAdvice:stagnationAdvice,missedDays:missedDays,
  navyBF:navyBF,bodyCompTable:bodyCompTable,
  weightTrend:weightTrend,pullPush:pullPush
};
if(typeof module!=='undefined'&&module.exports){module.exports=API;}
else{root.Analytics=API;}
})(typeof window!=='undefined'?window:this);
