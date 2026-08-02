/* Test harness pentru generator.js — rulează cu: node test-generator.js */
var G=require('./generator.js');
var pass=0,fail=0;
function assert(cond,msg){
  if(cond){pass++;}
  else{fail++;console.error('  ❌ FAIL: '+msg);}
}

var PERSONAS=[
  {name:'Tu (referință)',p:{sex:'M',age:38,height:178,weight:90,experience:'intermediar',equipment:'home_min',hasBara:true,days:4,goal:'recomp',morningRoutine:true}},
  {name:'Iubita (slăbit, acasă gantere)',p:{sex:'F',age:32,height:165,weight:68,experience:'incepator',equipment:'home_min',hasBara:false,days:3,goal:'slabit',morningRoutine:true}},
  {name:'Prieten sală (masă)',p:{sex:'M',age:28,height:182,weight:75,experience:'intermediar',equipment:'gym',days:4,goal:'masa',morningRoutine:false}},
  {name:'Bodyweight begin (F, slăbit)',p:{sex:'F',age:45,height:170,weight:80,experience:'incepator',equipment:'bodyweight',days:3,goal:'slabit',morningRoutine:true}},
  {name:'Senior 58 (M, recomp, sală)',p:{sex:'M',age:58,height:175,weight:95,experience:'incepator',equipment:'gym',days:3,goal:'recomp',morningRoutine:true}},
  {name:'Bodyweight intermediar (M)',p:{sex:'M',age:25,height:180,weight:70,experience:'intermediar',equipment:'bodyweight',days:4,goal:'masa',morningRoutine:true}}
];

console.log('══════ TESTE GENERATOR ══════\n');

PERSONAS.forEach(function(persona){
  console.log('▸ '+persona.name);
  var r=G.generateProgram(persona.p);
  assert(!r.errors,'fără erori de validare ('+JSON.stringify(r.errors)+')');
  if(r.errors)return;

  // 1. Structura: toate zilele au listă
  var dayKeys=Object.keys(r.exercises);
  assert(dayKeys.length>=5,'minim 5 zile definite (are '+dayKeys.length+')');
  assert(r.schedule.length===7,'schedule acoperă 7 zile calendaristice');
  r.schedule.forEach(function(k){assert(!!r.exercises[k],'schedule referă zi existentă: '+k);});

  // 2. Zilele active au exerciții + minim 1 ⭐
  var trainingDays=0,totalStars=0;
  dayKeys.forEach(function(k){
    var day=r.exercises[k];
    var stars=day.list.filter(function(e){return e.star;}).length;
    var isRecovery=day.label.toLowerCase().indexOf('recovery')>=0;
    if(!isRecovery){
      trainingDays++;
      totalStars+=stars;
      assert(day.list.length>=3,k+': minim 3 exerciții (are '+day.list.length+')');
      assert(stars>=1,k+': minim 1 exercițiu ⭐ (are '+stars+')');
    }
  });
  assert(trainingDays===persona.p.days,'zile antrenament = '+persona.p.days+' (are '+trainingDays+')');

  // 3. Echipament respectat (verificăm prin exId → DB)
  var avail=G.EQUIPMENT_PROFILES[persona.p.equipment].available.slice();
  if(persona.p.equipment==='home_min'&&persona.p.hasBara)avail.push('bara');
  dayKeys.forEach(function(k){
    r.exercises[k].list.forEach(function(e){
      if(!e.exId)return; // recovery items fără exId
      var db=G.EXERCISE_DB.find(function(x){return x.id===e.exId;});
      assert(!!db,'exId valid: '+e.exId);
      if(db){
        db.equipment.forEach(function(eq){
          assert(avail.indexOf(eq)>=0,k+'/'+e.name+': echipament "'+eq+'" indisponibil pentru profil '+persona.p.equipment);
        });
        if(persona.p.experience==='incepator'){
          assert(db.level===1,k+'/'+e.name+': nivel '+db.level+' la începător');
          assert(!db.risky,k+'/'+e.name+': exercițiu risky la începător');
        }
      }
    });
  });

  // 4. Fără duplicate în aceeași zi
  dayKeys.forEach(function(k){
    var ids=r.exercises[k].list.filter(function(e){return e.exId;}).map(function(e){return e.exId;});
    var uniq={};ids.forEach(function(i){uniq[i]=true;});
    assert(ids.length===Object.keys(uniq).length,k+': fără exerciții duplicate');
  });

  // 5. Volum: vârstă 55+ → ⭐ max 3 seturi
  if(persona.p.age>=55){
    dayKeys.forEach(function(k){
      r.exercises[k].list.forEach(function(e){
        if(e.star)assert(e.sets<=3,'senior: ⭐ '+e.name+' max 3 seturi (are '+e.sets+')');
      });
    });
  }

  // 6. Nutriție sanity
  var n=r.nutrition;
  assert(n.kcal>=1200&&n.kcal<=4000,'kcal rezonabile: '+n.kcal);
  assert(n.protein>=persona.p.weight*1.5,'proteine >= 1.5g/kg: '+n.protein+'g');
  assert(n.carbs>=50,'carbs >= 50g: '+n.carbs);
  var kcalCheck=n.protein*4+n.carbs*4+n.fat*9;
  assert(Math.abs(kcalCheck-n.kcal)<200,'macros ≈ kcal ('+kcalCheck+' vs '+n.kcal+')');
  if(persona.p.goal==='slabit')assert(n.kcal<n.tdee,'slăbit: kcal < TDEE');
  if(persona.p.goal==='masa')assert(n.kcal>n.tdee,'masă: kcal > TDEE');

  // 7. Checklist scalat
  assert(r.checklist.length===6,'checklist 6 items');
  assert(r.checklist[0].lbl.indexOf(String(n.protein))>=0,'checklist proteine scalate');

  // 8. Morning routines
  if(persona.p.morningRoutine!==false){
    assert(!!r.morningRoutines,'morning routines generate');
    dayKeys.forEach(function(k){assert(!!r.morningRoutines[k],'morning pentru '+k);});
  }else{
    assert(r.morningRoutines===null,'morning dezactivat la cerere');
  }

  // 9. Ghid acoperă exercițiile folosite
  var usedNames={};
  dayKeys.forEach(function(k){r.exercises[k].list.forEach(function(e){if(e.exId)usedNames[e.name]=true;});});
  Object.keys(usedNames).forEach(function(nm){
    assert(r.ghid.some(function(g){return g.name===nm;}),'ghid pentru: '+nm);
  });

  // 10. Warnings afișate
  if(r.warnings.length)console.log('  ⚠️ warnings: '+r.warnings.join(' | '));

  // Sumar vizual
  var sampleDay=dayKeys.find(function(k){return r.exercises[k].list.some(function(e){return e.star;});});
  console.log('  kcal '+n.kcal+' · P'+n.protein+' C'+n.carbs+' F'+n.fat+' · '+persona.p.days+' zile · ex/zi activă: '+
    dayKeys.filter(function(k){return r.exercises[k].label.toLowerCase().indexOf('recovery')<0;}).map(function(k){return r.exercises[k].list.length;}).join(','));
  console.log('  ex. zi ['+sampleDay+']: '+r.exercises[sampleDay].list.map(function(e){return (e.star?'⭐':'')+e.name.slice(0,30);}).join(' · '));
  console.log('');
});

// 11. Validare inputs invalide
var bad=G.generateProgram({sex:'X',age:200,height:50,weight:500,experience:'pro',equipment:'spatiu',days:7,goal:'zbor'});
assert(bad.errors&&bad.errors.length>=5,'inputs invalide → erori multiple ('+(bad.errors?bad.errors.length:0)+')');
var missing=G.generateProgram(null);
assert(missing.errors&&missing.errors.length,'profil null → eroare');

// 12. Determinism: aceleași inputs → același output
var p1=G.generateProgram(PERSONAS[0].p);
var p2=G.generateProgram(PERSONAS[0].p);
assert(JSON.stringify(p1.exercises)===JSON.stringify(p2.exercises),'determinist: aceleași inputs → același program');

// 13. Split 4 zile: eticheta zilei = conținutul, inclusiv la începători (maxEx=4)
// Bug istoric: slice-ul tăia ultimul slot → luni fără triceps, marți fără gambe
console.log('▸ Split 4 zile — acoperire etichetă (începător + intermediar)');
[['incepator','home_min'],['incepator','bodyweight'],['incepator','gym'],['intermediar','home_min'],['intermediar','gym']].forEach(function(cfg){
  var r=G.generateProgram({sex:'F',age:30,height:165,weight:62,experience:cfg[0],equipment:cfg[1],hasBara:false,days:4,goal:'slabit',morningRoutine:true});
  assert(!r.errors,'4 zile '+cfg.join('/')+': fără erori');
  if(r.errors)return;
  var patterns=function(dayKey){
    return r.exercises[dayKey].list.map(function(e){
      var db=G.EXERCISE_DB.find(function(x){return x.id===e.exId;});
      return db?db.pattern:null;
    });
  };
  assert(patterns('luni').indexOf('triceps')>=0,cfg.join('/')+': luni (Piept/Umeri/Triceps) are exercițiu de triceps');
  assert(patterns('luni').indexOf('push_h')>=0,cfg.join('/')+': luni are împins orizontal');
  // bodyweight n-are izo_umeri la nivel 1 — fallback-ul legitim e spate_post (Y-T raises)
  var umeri=patterns('luni');
  assert(umeri.indexOf('izo_umeri')>=0||umeri.indexOf('spate_post')>=0,cfg.join('/')+': luni are izolare umeri (sau fallback spate_post)');
  assert(patterns('marti').indexOf('gambe')>=0,cfg.join('/')+': marți (Picioare) are gambe');
  assert(patterns('marti').indexOf('squat')>=0,cfg.join('/')+': marți are squat');
  assert(patterns('marti').indexOf('hinge')>=0,cfg.join('/')+': marți are hinge');
});
console.log('');

// 14. Accent picioare-fesieri (preferință, nu sex)
console.log('▸ Accent glute — 4 zile și 3 zile, începător + intermediar');
var basisP={sex:'F',age:30,height:165,weight:62,experience:'incepator',equipment:'home_min',hasBara:false,days:4,goal:'slabit',morningRoutine:true};
[['incepator',4],['intermediar',4],['incepator',3],['intermediar',3]].forEach(function(cfg){
  var p=Object.assign({},basisP,{experience:cfg[0],days:cfg[1],emphasis:'glute'});
  var r=G.generateProgram(p);
  assert(!r.errors,'glute '+cfg.join('/')+': fără erori');
  if(r.errors)return;
  var patterns=function(dayKey){
    return r.exercises[dayKey].list.map(function(e){
      var db=G.EXERCISE_DB.find(function(x){return x.id===e.exId;});
      return db?db.pattern:null;
    });
  };
  var allPatterns=[];
  Object.keys(r.exercises).forEach(function(k){allPatterns=allPatterns.concat(patterns(k));});
  var gluteCount=allPatterns.filter(function(x){return x==='glute';}).length;
  assert(gluteCount>=2,'glute '+cfg.join('/')+': minim 2 exerciții glute/săpt (are '+gluteCount+')');
  if(cfg[1]===4){
    assert(r.exercises.marti.label.indexOf('Fesieri')>=0,'glute '+cfg.join('/')+': eticheta marți = Picioare & Fesieri');
    assert(patterns('marti').indexOf('glute')>=0,'glute '+cfg.join('/')+': marți conține glute');
    assert(patterns('marti').indexOf('squat')>=0,'glute '+cfg.join('/')+': marți păstrează squat');
    assert(patterns('marti').indexOf('gambe')>=0,'glute '+cfg.join('/')+': marți păstrează gambe');
    assert(patterns('luni').indexOf('triceps')>=0,'glute '+cfg.join('/')+': luni păstrează triceps');
  }else{
    assert(patterns('luni').indexOf('glute')>=0,'glute '+cfg.join('/')+': Full Body A conține glute');
  }
});
// echilibrat / lipsă = identic cu comportamentul de dinainte (backwards compat)
var rDefault=G.generateProgram(basisP);
var rEchilibrat=G.generateProgram(Object.assign({},basisP,{emphasis:'echilibrat'}));
assert(JSON.stringify(rDefault.exercises)===JSON.stringify(rEchilibrat.exercises),'emphasis lipsă ≡ echilibrat (backwards compat)');
var rBad=G.generateProgram(Object.assign({},basisP,{emphasis:'brate'}));
assert(rBad.errors&&rBad.errors.length,'emphasis invalid → eroare');
console.log('');

// 15. Dimineața pe nivel: începătorii primesc variante regresate, intermediarii nu
console.log('▸ Dimineață — regresii pentru începători');
var mBeg=G.generateProgram(Object.assign({},basisP,{experience:'incepator'}));
var mInt=G.generateProgram(Object.assign({},basisP,{experience:'intermediar'}));
assert(mBeg.morningRoutines.luni.list.some(function(e){return e.name.indexOf('genunchi')>=0;}),'începător: flotările de dimineață sunt pe genunchi');
assert(mInt.morningRoutines.luni.list.some(function(e){return e.name==='Flotări lente';}),'intermediar: flotări clasice dimineața');
assert(mBeg.morningRoutines.luni.list.length===mInt.morningRoutines.luni.list.length,'aceleași sloturi de dimineață la ambele niveluri');
mBeg.morningRoutines.luni.list.forEach(function(e){
  assert(mInt.morningRoutines.luni.list.some(function(x){return x.id===e.id;}),'id-ul '+e.id+' există la ambele niveluri (ghidurile funcționează)');
});
console.log('');

// 16. Programul TĂU (referință) conține exercițiile cheie așteptate
var ref=G.generateProgram(PERSONAS[0].p);
var refNames=[];
Object.keys(ref.exercises).forEach(function(k){ref.exercises[k].list.forEach(function(e){refNames.push(e.name);});});
assert(refNames.indexOf('Împins gantere bancă înclinată 30–45°')>=0,'referință: împins înclinat prezent');
assert(refNames.indexOf('Goblet squat')>=0,'referință: goblet prezent');
assert(refNames.indexOf('Hip thrust cu bara pe bancă plată')>=0,'referință: hip thrust bara prezent (hasBara)');

console.log('══════ REZULTAT: '+pass+' PASS · '+fail+' FAIL ══════');
process.exit(fail?1:0);
