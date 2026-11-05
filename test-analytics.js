/* Teste pentru analytics.js — rulează cu: node test-analytics.js
   Datele de test reproduc exportul din 04.11.2026; data de referință e fixă (joi, 5.11.2026). */
var A=require('./analytics.js');
var pass=0,fail=0;
function assert(cond,msg){if(cond){pass++;}else{fail++;console.error('  ❌ FAIL: '+msg);}}
function eq(a,b,msg){assert(a===b,msg+' (așteptat '+JSON.stringify(b)+', primit '+JSON.stringify(a)+')');}
function near(a,b,tol,msg){assert(a!=null&&Math.abs(a-b)<=tol,msg+' (așteptat ~'+b+', primit '+a+')');}
function set(date,ex,kg,reps,n){return {date:date,day:'',type:'antrenament',exercise:ex,set:n||1,reps:reps,kg:kg,note:''};}
var REF=A.parseRo('05.11.2026');
var LMJV=[true,true,false,true,true,false,false]; // L/Ma/J/V

console.log('══════ TESTE ANALIZE ══════\n');

// ── 0. Datele calendaristice
console.log('▸ Date');
eq(A.weekdayOf(A.dayNum('02.11.2026')),0,'2.11.2026 e luni');
eq(A.weekdayOf(A.dayNum('05.11.2026')),3,'5.11.2026 e joi');
eq(A.roDate(A.mondayOf(A.dayNum('05.11.2026'))),'02.11.2026','lunea săptămânii lui 5.11');
eq(A.dayNum('29.03.2026')-A.dayNum('28.03.2026'),1,'trecerea la ora de vară nu strică numărul zilelor');

// ── BUG 1. Aderența
console.log('▸ Bug 1 — aderența');
var adhRows=[];
// istoric mai vechi, de la start (23.04.2026), ca totalul să aibă multe sesiuni
['23.04.2026','24.04.2026','27.04.2026','28.04.2026','30.04.2026','01.05.2026'].forEach(function(d){adhRows.push(set(d,'X',10,10));});
// ultimele 8 săptămâni: 0, 2, 1, 1, 4, 4, 1, 2 sesiuni (ultima în curs)
['21.09.2026','22.09.2026',                       // săpt. 21.09: 2
 '28.09.2026',                                     // săpt. 28.09: 1
 '05.10.2026',                                     // săpt. 05.10: 1
 '12.10.2026','13.10.2026','15.10.2026','16.10.2026', // 4
 '19.10.2026','20.10.2026','22.10.2026','23.10.2026', // 4
 '01.11.2026',                                     // săpt. 26.10: 1 (duminică — antrenamentul de vineri făcut în weekend)
 '02.11.2026','03.11.2026'                         // săpt. curentă: 2
].forEach(function(d){adhRows.push(set(d,'X',10,10,1));adhRows.push(set(d,'X',10,10,2));});
var adh=A.adherence(adhRows,{active:LMJV,ref:REF,programStart:A.parseRo('23.04.2026')});
eq(adh.last8Complete.done,13,'7 săptămâni încheiate: 13 sesiuni efectuate');
eq(adh.last8Complete.planned,28,'7 săptămâni încheiate: 28 planificate');
eq(adh.last8Complete.pct,46,'7 săptămâni încheiate: 46%');
eq(adh.currentWeek.done,2,'săptămâna în curs: 2 efectuate');
eq(adh.currentWeek.planned,2,'săptămâna în curs: 2 planificate (joi azi, încă neantrenat, nu intră)');
eq(adh.last8.done,15,'ultimele 8 săptămâni: 15 efectuate');
eq(adh.last8.planned,30,'ultimele 8 săptămâni: 30 planificate');
eq(adh.weeks.map(function(w){return w.done;}).join(','),'0,2,1,1,4,4,1,2','sesiunile pe cele 8 săptămâni');
assert(adh.total.done<=adh.total.planned,'totalul: efectuate ≤ planificate în datele de test');
assert(adh.total.planned>=100,'totalul se calculează de la 23.04, nu din săptămâna ciclului ('+adh.total.planned+')');
eq(adh.startDate,'23.04.2026','data de start');
// azi antrenat → ziua de azi intră și la planificate
var adh2=A.adherence(adhRows.concat([set('05.11.2026','X',10,10)]),{active:LMJV,ref:REF,programStart:A.parseRo('23.04.2026')});
eq(adh2.currentWeek.done+'/'+adh2.currentWeek.planned,'3/3','după antrenamentul de azi: 3/3');
// fără plafonare: mai multe sesiuni decât planificate
var adh3=A.adherence([set('02.11.2026','X',1,1),set('03.11.2026','X',1,1),set('04.11.2026','X',1,1)],{active:[true,false,false,false,false,false,false],ref:REF});
eq(adh3.total.pct,300,'efectuate > planificate → procentul real (300%), fără plafon');
// ciclul curent
var adh4=A.adherence(adhRows,{active:LMJV,ref:REF,programStart:A.parseRo('23.04.2026'),cycleStart:A.parseRo('12.10.2026')});
eq(adh4.cycle.done+'/'+adh4.cycle.planned,'11/14','ciclul început pe 12.10: 11/14');

// ── BUG 2. Volumul în săptămâna în curs
console.log('▸ Bug 2 — volumul pe o săptămână neterminată');
var INFO={
  'Împins înclinat':{group:'piept',pattern:'push_h'},'Împins deasupra capului':{group:'umeri',pattern:'push_v'},
  'Extensii triceps':{group:'triceps',pattern:'triceps'},'Ridicări laterale':{group:'umeri',pattern:'izo_umeri'},
  'Goblet squat':{group:'cvadriceps',pattern:'squat'},'RDL':{group:'fesieri',pattern:'hinge'},'Gambe':{group:'gambe',pattern:'gambe'},
  'Bent-over row':{group:'spate',pattern:'pull'},'Lat pulldown':{group:'spate',pattern:'pull'},'Ramat un braț':{group:'spate',pattern:'pull'},
  'Reverse fly':{group:'spate',pattern:'spate_post'},'Hammer curl':{group:'biceps',pattern:'biceps'}
};
var SEC={push_h:{triceps:.5,umeri:.5},push_v:{triceps:.5},squat:{fesieri:.5},lunge:{fesieri:.5},hinge:{spate:.5},pull:{biceps:.5}};
function infoFor(n){return INFO[n]||{};}
var done=[{name:'Împins înclinat',sets:4},{name:'Împins deasupra capului',sets:3},{name:'Extensii triceps',sets:3},{name:'Ridicări laterale',sets:3},
          {name:'Goblet squat',sets:4},{name:'RDL',sets:3},{name:'Gambe',sets:3}];
var plannedThu=[{name:'Bent-over row',sets:4},{name:'Lat pulldown',sets:4},{name:'Ramat un braț',sets:3},{name:'Reverse fly',sets:3},{name:'Hammer curl',sets:3}];
var pv=A.projectVolume(done,plannedThu,infoFor,SEC);
near(pv.done.spate,1.5,0.001,'spatele făcut luni+marți (doar ½ din RDL)');
eq(A.volVerdict(pv.done.spate,10,20),'sub','pe seturile făcute, spatele ar ieși SUB');
near(pv.projected.spate,15.5,0.001,'proiecția spatelui cu joia de Pull');
eq(A.volVerdict(pv.projected.spate,10,20),'in','spatele NU e SUB pe proiecție');
near(pv.projected.biceps,8.5,0.001,'biceps: 3 direct + ½ din 11 seturi de tras');
eq(A.volVerdict(pv.projected.piept,10,20),'sub','pieptul rămâne SUB pe proiecție dacă nu mai e programat');

// ── BUG 3. Stagnarea pe termen lung
console.log('▸ Bug 3 — stagnarea pe 1RM estimat');
near(A.e1rm(40.5,10),54.0,0.001,'Epley 40,5 × 10');
near(A.e1rm(39.5,11),53.983,0.001,'Epley 39,5 × 11');
var row=[set('09.07.2026','Bent-over row cu bara',38,10),set('23.07.2026','Bent-over row cu bara',40.5,10),set('23.07.2026','Bent-over row cu bara',40.5,9,2),
         set('06.08.2026','Bent-over row cu bara',39,10),set('20.08.2026','Bent-over row cu bara',40,9),set('17.09.2026','Bent-over row cu bara',40,10),
         set('08.10.2026','Bent-over row cu bara',39.5,10),set('22.10.2026','Bent-over row cu bara',39.5,11),set('22.10.2026','Bent-over row cu bara',39.5,10,2)];
var st=A.longStagnation(row,'Bent-over row cu bara',REF);
eq(st.stagnant,true,'Bent-over row: stagnare (1RM ~54 kg de 3 luni)');
eq(st.prior.date,'23.07.2026','cel mai bun 1RM anterior e din 23.07');
eq(st.recent.date,'22.10.2026','cel mai bun 1RM din ultimele 6 săptămâni e din 22.10');
eq(st.idle,true,'Bent-over row: neexecutat de ≥ 2 săptămâni');
eq(st.daysSince,14,'14 zile de la ultima ședință');
var ht=[set('01.08.2026','Hip thrust',60,10),set('20.10.2026','Hip thrust',70,10),set('03.11.2026','Hip thrust',72.5,10)];
var st2=A.longStagnation(ht,'Hip thrust',REF);
eq(st2.stagnant,false,'Hip thrust în creștere: fără stagnare');
eq(st2.idle,false,'Hip thrust executat acum 2 zile');
var fl=[set('01.08.2026','Flotări',0,15),set('25.10.2026','Flotări',0,15)];
eq(A.longStagnation(fl,'Flotări',REF).stagnant,true,'fără greutate: aceleași repetări = stagnare');
var fl2=[set('01.08.2026','Flotări',0,15),set('25.10.2026','Flotări',0,17)];
eq(A.longStagnation(fl2,'Flotări',REF).stagnant,false,'fără greutate: +2 repetări = progres');
var nu=[set('20.10.2026','Nou',20,10),set('03.11.2026','Nou',20,10)];
eq(A.longStagnation(nu,'Nou',REF).stagnant,null,'exercițiu început recent: fără verdict (nu are istoric anterior)');
eq(A.longStagnation([],'Nimic',REF),null,'fără ședințe: null');

// ── BUG 4. Durerea, separat de energie
console.log('▸ Bug 4 — nota de durere');
eq(A.validRating('7'),7,'rating 7 valid');eq(A.validRating('10'),10,'rating 10 valid');eq(A.validRating(' 5 '),5,'rating cu spații');
eq(A.validRating('0'),null,'rating 0 invalid');eq(A.validRating('11'),null,'rating 11 invalid');eq(A.validRating('Durere umăr drept'),null,'text în rating = invalid');
var p1=A.painFromText('Durere umăr drept');eq(p1.isPain,true,'„Durere umăr drept" e durere');eq(p1.zone,'umar_dr','zona: umăr drept');
eq(A.painFromText('umăr stâng').zone,'umar_st','zona: umăr stâng');
eq(A.painFromText('mă doare lombar').zone,'lombar','zona: lombar');
eq(A.painFromText('somn prost, cafea târziu').isPain,false,'„somn prost" nu e durere');
eq(A.painFromText('zi de spate grea').isPain,false,'„zi de spate" nu e durere');
var nr=[
  {date:'28.10.2026',day:'MIERCURI',type:'ratenote',exercise:'energy',note:'Durere umăr drept',ts:1},
  {date:'28.10.2026',day:'MIERCURI',type:'rating',exercise:'energy',note:'7',ts:1},
  {date:'29.10.2026',day:'JOI',type:'ratenote',exercise:'energy',note:'somn prost',ts:1},
  {date:'30.10.2026',day:'VINERI',type:'rating',exercise:'energy',note:'doare genunchiul stâng',ts:1},
  {date:'31.10.2026',day:'SÂMBĂTĂ',type:'rating',exercise:'energy',note:'obosit',ts:1}
];
var mg=A.migrateDayNotes(nr,1000);
eq(mg.changed,3,'trei valori mutate');
var pain28=nr.filter(function(r){return r.type==='durere'&&r.date==='28.10.2026';})[0];
assert(!!pain28,'28.10: rând de durere creat');
eq(pain28&&pain28.note,'Durere umăr drept','28.10: textul durerii');eq(pain28&&pain28.exercise,'umar_dr','28.10: zona');
eq(nr[0].note,'','28.10: nota de energie golită');eq(nr[0].ts,1000,'28.10: nota golită are ts nou (sincronizarea nu o readuce)');
eq(nr[1].note,'7','28.10: ratingul numeric rămâne');
eq(nr[2].note,'somn prost','29.10: nota obișnuită de energie rămâne');
var pain30=nr.filter(function(r){return r.type==='durere'&&r.date==='30.10.2026';})[0];
eq(pain30&&pain30.exercise,'genunchi_st','30.10: textul din rating mutat la durere, genunchi stâng');
eq(nr[3].note,'','30.10: ratingul cu text golit');
var en31=nr.filter(function(r){return r.type==='ratenote'&&r.date==='31.10.2026';})[0];
eq(en31&&en31.note,'obosit','31.10: textul din rating (nu durere) mutat în nota de energie');
var len=nr.length,mg2=A.migrateDayNotes(nr,2000);
eq(mg2.changed,0,'a doua rulare nu mai mută nimic (idempotentă)');eq(nr.length,len,'a doua rulare nu adaugă rânduri');

// ── BUG 5. Procentul de grăsime și masa slabă
console.log('▸ Bug 5 — compoziția corporală');
near(A.navyBF(112,42,178,'M'),31.4,0.05,'US Navy: talie 112, gât 42, înălțime 178');
var bc=A.bodyCompTable([
  {date:'15.10.2026',type:'masuratoare',weight:91,waist:111},
  {date:'01.10.2026',type:'masuratoare',weight:92,waist:112,neck:42}
],178,'M');
eq(bc[0].date,'01.10.2026','tabelul e vechi → nou');
near(bc[0].bf,31.4,0.05,'01.10: procent de grăsime');near(bc[0].lean,63.1,0.05,'01.10: masa slabă = 92 × (1 − 0,314)');
near(bc[0].whtr,0.629,0.001,'01.10: talie/înălțime');
eq(bc[1].bf,null,'15.10: fără gât → fără procent');eq(bc[1].need.join(','),'gât','15.10: NECESAR gâtul');
near(bc[1].whtr,0.624,0.001,'15.10: raportul talie/înălțime se calculează și fără gât');

// ── Reproducerea bug-urilor: logica veche din index.html (până la v129), pe aceleași date
console.log('▸ Reproducere — logica veche dă rezultatul greșit');
(function(){
  // buildAdherenceStats vechi: toate zilele din istoric / (săptămâna din ciclu × 4), plafonat la 100
  var days={};adhRows.forEach(function(r){days[r.date]=1;});
  var actual=Object.keys(days).length,expected=4*4; // ciclul resetat: săptămâna 4
  eq(actual+'/'+expected+' ('+Math.min(100,Math.round(actual/expected*100))+'%)','21/16 (100%)','vechi: numărătorul > numitorul, plafonat la 100%');
  // detectStagnation vechi: doar ultimele 2 ședințe, kg apoi repetări
  var by={};row.forEach(function(r){(by[r.date]=by[r.date]||[]).push(r);});
  var ds=Object.keys(by).sort(function(a,b){return A.dayNum(b)-A.dayNum(a);});
  function top(ss){var k=Math.max.apply(null,ss.map(function(s){return s.kg;}));return {kg:k,reps:Math.max.apply(null,ss.filter(function(s){return s.kg===k;}).map(function(s){return s.reps;}))};}
  var l=top(by[ds[0]]),p=top(by[ds[1]]);
  eq(l.kg<=p.kg&&l.reps<=p.reps,false,'vechi: 39,5×10 → 39,5×11 nu e „stagnare", deși 1RM e plat de 3 luni');
  // buildVolumePerGroup vechi: verdict pe seturile făcute până azi
  eq(A.volVerdict(pv.done.spate,10,20),'sub','vechi: spatele marcat SUB marți seara');
})();

// ── v131.1 Antrenorul ține cont de durere
console.log('▸ v131 — durerea și exercițiile afectate');
eq(A.painAffects('umar_dr',{pattern:'push_v'},'Împins gantere deasupra capului'),true,'umăr → împins deasupra capului');
eq(A.painAffects('umar_dr',{pattern:'pull'},'Bent-over row cu bara'),false,'umăr ↛ ramat aplecat');
eq(A.painAffects('lombar',{pattern:'pull'},'Bent-over row cu bara'),true,'lombar → ramat aplecat cu bara (după nume)');
eq(A.painAffects('lombar',{pattern:'hinge'},'Îndreptări românești cu gantere'),true,'lombar → îndreptări');
eq(A.painAffects('genunchi_st',{pattern:'squat'},'Goblet squat'),true,'genunchi → squat');
eq(A.painAffects('genunchi_st',{pattern:'pull'},'Lat pulldown'),false,'genunchi ↛ tracțiuni');
eq(A.painAffects('cot',{pattern:'biceps'},'Hammer curl'),true,'cot → flexii');
eq(A.painAffects('umar_st',{group:'piept'},'Exercițiu vechi de piept'),true,'fără pattern: după grupă');
eq(A.painAffects('altul',{pattern:'push_h'},'Împins'),false,'„altă zonă" nu blochează nimic');
eq(A.zonesFor({pattern:'push_h'},'Împins înclinat')[0],'umar_dr','zona propusă la împins: umăr drept');
eq(A.painLevel(2),'ok','2/10 → continui');eq(A.painLevel(4),'hold','4/10 → fără progresie');eq(A.painLevel(6),'hold','6/10 → fără progresie');
eq(A.painLevel(7),'swap','7/10 → înlocuiește');eq(A.painLevel(null),'watch','nenotată → atenție');
var pr=[
  {date:'20.10.2026',type:'durere',exercise:'umar_dr',reps:'4',note:'la împins'},
  {date:'27.10.2026',type:'durere',exercise:'umar_dr',reps:'5',note:'la fel'},
  {date:'03.11.2026',type:'durere',exercise:'umar_dr',reps:'5',note:'la fel',ex:'Împins înclinat'},
  {date:'25.10.2026',type:'durere',exercise:'lombar',reps:'6',note:''},
  {date:'01.11.2026',type:'durere',exercise:'genunchi_st',reps:'5',note:''},
  {date:'04.11.2026',type:'durere',exercise:'genunchi_st',reps:'0',note:'nu mai doare'},
  {date:'05.11.2026',type:'durere',exercise:'cot',reps:'',note:'ușor'}
];
var ap=A.activePains(pr,REF);
eq(ap.map(function(p){return p.zone;}).join(','),'umar_dr,cot','active: umărul și cotul (lombarul a expirat, genunchiul s-a rezolvat)');
eq(ap[0].level,'hold','umăr 5/10 → fără progresie');eq(ap[0].daysSince,2,'umăr: ultima notă acum 2 zile');eq(ap[0].askedToday,false,'umăr: neîntrebat azi');
eq(ap[0].since,'20.10.2026','umăr: ține din 20.10 (lanț fără pauze > 7 zile)');eq(ap[0].sinceDays,16,'umăr: 16 zile → se recomandă medicul');
eq(ap[1].level,'watch','cot nenotat → atenție');eq(ap[1].askedToday,true,'cot: notat azi');
eq(A.painFor(ap,{pattern:'push_v'},'Împins deasupra').zone,'umar_dr','împinsul deasupra capului e afectat de umăr');
eq(A.painFor(ap,{pattern:'squat'},'Goblet squat'),null,'squatul nu e afectat (genunchiul s-a rezolvat)');
eq(A.painFor(ap,{pattern:'biceps'},'Hammer curl').zone,'cot','flexiile sunt afectate de cot');

// ── v131.2 Stagnarea vine cu o soluție
console.log('▸ v131 — soluția la stagnare');
var sa=A.stagnationAdvice(1,'8–12');eq(sa.primary,'range','un singur ⭐ plat → interval nou');eq(sa.newRange,'6–8','8–12 → 6–8');eq(sa.weeks,3,'pentru 3 săptămâni');
eq(A.stagnationAdvice(2,'8–12').primary,'deload','două ⭐ plate deodată → săptămână ușoară');
eq(A.stagnationAdvice(1,'6–8').newRange,'10–12','6–8 → 10–12');

// ── v131.3 Ziua ratată
console.log('▸ v131 — ziua ratată');
var MOPT={active:LMJV,exDayOf:['luni','marti','miercuri','joi','vineri','sambata','sambata'],lists:{luni:['A1','A2'],marti:['B1'],joi:['C1','C2'],vineri:['D1','D2']}};
function wk(list){return list.map(function(x){return set(x[0],x[1],10,10);});}
var base=wk([['02.11.2026','A1'],['02.11.2026','A2'],['03.11.2026','B1'],['06.11.2026','D1'],['06.11.2026','D2']]);
var md=A.missedDays(base,Object.assign({ref:A.parseRo('07.11.2026')},MOPT));
eq(md.missed.map(function(m){return m.date+' '+m.exDay;}).join(','),'05.11.2026 joi','sâmbătă: joia (Spate) e ratată');
eq(md.todayActive,false,'sâmbăta e zi liberă');eq(md.todayTrained,false,'sâmbătă: încă neantrenat');
eq(md.nextFree&&md.nextFree.date,'08.11.2026','următoarea zi liberă: duminică');
var rec=wk([['02.11.2026','A1'],['03.11.2026','B1'],['06.11.2026','C1'],['06.11.2026','C2']]);
eq(A.missedDays(rec,Object.assign({ref:A.parseRo('07.11.2026')},MOPT)).missed.length,0,'joia făcută vineri: joia e recuperată (vinerea are seturi, deci nu e ratată)');
var gap=[{date:'20.10.2026',type:'durere',exercise:'lombar',reps:'4'},{date:'28.10.2026',type:'durere',exercise:'lombar',reps:'4'}];
eq(A.activePains(gap,A.parseRo('30.10.2026'))[0].since,'28.10.2026','o pauză de 8 zile între note începe un lanț nou');
var sk=base.filter(function(r){return r.date!=='06.11.2026';}).concat([{date:'05.11.2026',type:'skip',exercise:'C1',note:'Fără timp'}]);
var md2=A.missedDays(sk,Object.assign({ref:A.parseRo('06.11.2026')},MOPT));
eq(md2.missed.length,0,'joia cu „sar azi" nu e ratată');eq(md2.todayActive,true,'vineri e zi de antrenament');
eq(md2.nextFree&&md2.nextFree.date,'07.11.2026','vineri: următoarea zi liberă e sâmbătă');
eq(A.missedDays(base.concat(wk([['07.11.2026','C1']])),Object.assign({ref:A.parseRo('07.11.2026')},MOPT)).todayTrained,true,'sâmbătă după antrenament: azi antrenat');
eq(A.missedDays(base,Object.assign({ref:A.parseRo('09.11.2026')},MOPT)).missed.length,0,'luni: săptămâna trecută nu se mai propune');

// ── v135 — reparațiile din audit
console.log('▸ v135 — reparații');
['Gata devreme','Am gătit seara','Somnul durează puțin','cotidian obosit','notele sale','zi de spate grea'].forEach(function(t){
  eq(A.painFromText(t).isPain,false,'„'+t+'" nu e durere');
});
eq(A.painFromText('mă dor umerii').zone,'umar_dr','„mă dor umerii" → umăr (fără parte → dreapta)');
eq(A.painFromText('durere de gât').zone,'gat','„durere de gât" → gât');
eq(A.painFromText('mă doare cotul stâng').zone,'cot','„mă doare cotul" → cot');
var cut=[{date:'06.11.2026',type:'ratenote',exercise:'energy',note:'Durere umăr drept',ts:1},
         {date:'01.11.2026',type:'rating',exercise:'energy',note:'7 – umăr drept',ts:1}];
var mc=A.migrateDayNotes(cut,5,'05.11.2026');
eq(mc.changed,1,'migrarea atinge doar notele dinainte de 05.11.2026');
eq(cut[0].note,'Durere umăr drept','nota din 06.11 rămâne la energie');
eq(cut[1].note,'7','„7 – umăr drept": cifra rămâne rating');
eq(cut.filter(function(r){return r.type==='durere';})[0].note,'umăr drept','… iar textul se mută la durere');
var wg=A.weightTrend([{date:'24.10.2026',weight:90},{date:'25.10.2026',weight:90},{date:'27.10.2026',weight:90},{date:'28.10.2026',weight:90}],REF);
eq(wg.enough,false,'4 cântăriri, dar niciuna în ultimele 7 zile: fără medie');

// ── v135 — planul
console.log('▸ v135 — săptămâna ușoară, pauza intervalului, energia, caloriile');
eq(A.roDate(A.dayNum(A.deloadEnd(A.parseRo('03.11.2026')))),'08.11.2026','acceptată marți → până duminică');
eq(A.roDate(A.dayNum(A.deloadEnd(A.parseRo('05.11.2026')))),'15.11.2026','acceptată joi → până duminica următoare');
eq(A.roDate(A.dayNum(A.deloadEnd(A.parseRo('08.11.2026')))),'15.11.2026','acceptată duminică → până duminica următoare');
var ov={target:'6–8',until:'2026-11-26'};
eq(A.extendOverride(ov,'2026-11-10',true),true,'în deload intervalul se prelungește');eq(ov.until,'2026-11-27','… cu o zi');
eq(A.extendOverride(ov,'2026-11-10',true),false,'… o singură dată pe zi');
eq(A.extendOverride(ov,'2026-11-11',false),false,'în afara deload-ului nu se prelungește');
eq(A.lowEnergy(4,8),true,'energie 4 → nu forța');eq(A.lowEnergy(7,4),true,'somn 4 → nu forța');
eq(A.lowEnergy(5,5),false,'5 și 5 → normal');eq(A.lowEnergy(undefined,undefined),false,'nenotat → normal');
function wpts(start,perDay,n,step){var o=[];for(var i=0;i<n;i++){var d=A.dayNum('16.10.2026')+i*step;o.push({date:A.roDate(d),weight:Math.round((start+perDay*i*step)*100)/100});}return o;}
var fast=A.kcalAdvice({points:wpts(92,-0.13,8,3),ref:REF,goal:'recomp',sex:'M',kcalMin:2200,kcalMax:2400});
assert(fast&&fast.dir===1,'scazi ~0,9 kg/săpt. la recompoziție → mai multe calorii ('+(fast&&fast.ratePct)+'%)');
eq(fast&&fast.kcalMin+'–'+fast.kcalMax,'2350–2550','+150 kcal');
var flat=A.kcalAdvice({points:wpts(90,0,8,3),ref:REF,goal:'recomp',sex:'M',kcalMin:2200,kcalMax:2400});
eq(flat&&flat.dir,-1,'greutate plată la recompoziție → mai puține calorii');eq(flat&&flat.kcalMin,2050,'−150 kcal');
var ok=A.kcalAdvice({points:wpts(90,-0.04,8,3),ref:REF,goal:'recomp',sex:'M',kcalMin:2200,kcalMax:2400});
eq(ok&&ok.dir,0,'−0,28 kg/săpt. la recompoziție = în zonă');
eq(A.kcalAdvice({points:wpts(90,0,4,3),ref:REF,goal:'recomp',sex:'M',kcalMin:2200,kcalMax:2400}),null,'prea puține cântăriri → fără propunere');
var fl=A.kcalAdvice({points:wpts(70,0,8,3),ref:REF,goal:'slabit',sex:'F',kcalMin:1250,kcalMax:1350});
eq(fl&&fl.kcalMin,1200,'nu coboară sub 1.200 kcal (femei)');
var fl2=A.kcalAdvice({points:wpts(70,0,8,3),ref:REF,goal:'slabit',sex:'F',kcalMin:1200,kcalMax:1300});
eq(fl2&&fl2.atFloor,true,'deja la limita de jos: fără propunere de scădere');

// ── Îmbunătățiri
console.log('▸ Îmbunătățiri — greutate și tracțiune/împingere');
var ws=[];for(var i=0;i<10;i++){var n=A.dayNum('08.10.2026')+i*3;ws.push({date:A.roDate(n),type:'masuratoare',weight:Math.round((92-i*3*0.5/7)*100)/100});}
var wt=A.weightTrend(ws,REF);
near(wt.trendPerWeek,-0.5,0.03,'trend −0,5 kg/săptămână');assert(wt.enough,'suficiente cântăriri în 14 zile');
assert(wt.ma7!=null&&wt.ma7<92,'media pe 7 zile există ('+wt.ma7+')');
var wt2=A.weightTrend([{date:'01.11.2026',weight:90},{date:'04.11.2026',weight:89.5}],REF);
eq(wt2.enough,false,'2 cântăriri în 14 zile: prea puține pentru medie și trend');eq(wt2.trendPerWeek,null,'fără trend');
function cls(n){var i=INFO[n]||{};return ({pull:'pull',spate_post:'pull',push_h:'push',push_v:'push',izo_piept:'push'})[i.pattern]||null;}
var pp=A.pullPush(done.concat(plannedThu.slice(0,2)),cls);
eq(pp.pull+'/'+pp.push,'8/7','tracțiune 8 / împingere 7 (lateralele și tricepsul nu intră)');
eq(pp.low,false,'8:7 nu e sub 1:1');
eq(A.pullPush(done,cls).low,true,'fără zi de tras: sub 1:1');

console.log('\n══════ REZULTAT: '+pass+' PASS · '+fail+' FAIL ══════');
if(fail)process.exit(1);
