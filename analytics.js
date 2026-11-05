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
    var p=painFromText(text),d=find('durere',src.date,null);
    if(!d){rows.push({date:src.date,day:src.day||'',type:'durere',exercise:p.zone||'altul',set:'',reps:'',kg:'',note:text,ts:now});}
    else if(String(d.note||'').indexOf(text)<0){d.note=d.note?d.note+'; '+text:text;if(!d.exercise)d.exercise=p.zone||'altul';d.ts=now;}
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
  navyBF:navyBF,bodyCompTable:bodyCompTable,
  weightTrend:weightTrend,pullPush:pullPush
};
if(typeof module!=='undefined'&&module.exports){module.exports=API;}
else{root.Analytics=API;}
})(typeof window!=='undefined'?window:this);
