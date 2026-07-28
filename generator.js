/* ═══════════════════════════════════════════════════════════════
   FITNESS JURNAL — GENERATOR DE PROGRAM PERSONALIZAT
   Rule-based, determinist (aceleași inputs → același program).
   Motorul de 8 săptămâni (progresie + deload + cicluri) rămâne
   identic pentru toate obiectivele — generatorul produce doar
   "combustibilul": exerciții, split, volum, nutriție, checklist.

   Rulează și în browser (window.ProgramGenerator) și în Node (tests).
   NU e încă referențiat din index.html — integrarea vine separat.
   ═══════════════════════════════════════════════════════════════ */
(function(root){
'use strict';

/* ───────────────────────────────────────────────────────────────
   BIBLIOTECA DE EXERCIȚII
   equipment: 'gantere','banca','bara','tractiuni','cablu','aparate'
   pattern:  push_h, push_v, izo_umeri, izo_piept, triceps,
             squat, hinge, lunge, gambe, glute,
             pull, spate_post, biceps, core
   level: 1 = începător ok · 2 = necesită tehnică/forță de bază
   prio:  ordinea de preferință în pattern (mai mic = preferat)
   gymOnly: true → doar profil sală (necesită rack/siguranță)
   risky: true → marcat "opțional, când tehnica e solidă"
   ─────────────────────────────────────────────────────────────── */
var EXERCISE_DB=[
  // ── PUSH ORIZONTAL (piept) ──
  {id:'db_impins_inclinat',name:'Împins gantere bancă înclinată 30–45°',muscle:'Piept',pattern:'push_h',equipment:['gantere','banca'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Bancă la ~30°. Gantere la nivelul pieptului, coate la 45° față de corp.',move:'Împingi în sus ușor spre interior. Cobori lent 2 sec cu întindere completă.',err:'Coatele prea largi. Unghi peste 45° (preia umărul).',tip:'30° e unghiul optim pentru pieptul superior — nu mai sus (Rodríguez-Ridao 2020).'}},
  {id:'db_impins_orizontal',name:'Împins gantere bancă orizontală 0°',muscle:'Piept',pattern:'push_h',equipment:['gantere','banca'],level:1,compound:true,starEligible:true,prio:2,
   ghid:{start:'Bancă plată. Gantere deasupra pieptului, brațe întinse.',move:'Cobori controlat la piept, împingi înapoi sus.',err:'Ganterele se ating sus cu impact. Cobori prea rapid.',tip:'Picioarele ferme pe podea, omoplații strânși.'}},
  {id:'gym_bench_bara',name:'Împins cu bara la bancă (bench press)',muscle:'Piept',pattern:'push_h',equipment:['bara','banca'],level:2,compound:true,starEligible:true,prio:1,gymOnly:true,
   ghid:{start:'Bancă plată în rack. Priza puțin mai lată decât umerii.',move:'Cobori bara la piept controlat, împingi exploziv.',err:'Bounce pe piept. Fesele se ridică de pe bancă.',tip:'La sală cere mereu spotter sau folosește siguranțele rack-ului.'}},
  {id:'gym_chest_press',name:'Chest press la aparat',muscle:'Piept',pattern:'push_h',equipment:['aparate'],level:1,compound:true,starEligible:true,prio:3,
   ghid:{start:'Reglează scaunul: mânerele la nivelul pieptului.',move:'Împingi înainte complet, revii controlat.',err:'Umerii se ridică spre urechi.',tip:'Bun pentru începători — traiectorie ghidată.'}},
  {id:'bw_flotari',name:'Flotări clasice',muscle:'Piept',pattern:'push_h',equipment:[],level:1,compound:true,starEligible:true,prio:4,
   ghid:{start:'Plank cu brațele la lățimea umerilor, corp drept.',move:'Cobori controlat până pieptul aproape atinge podeaua, împingi sus.',err:'Șoldurile cad. Coatele evazate la 90°.',tip:'Prea greu? Fă-le cu mâinile pe bancă. Prea ușor? Picioarele ridicate.'}},
  {id:'bw_flotari_declinate',name:'Flotări cu picioarele ridicate',muscle:'Piept superior',pattern:'push_h',equipment:[],level:2,compound:true,starEligible:true,prio:5,
   ghid:{start:'Flotare cu picioarele pe scaun/bancă.',move:'Cobori controlat, împingi sus. Accent pe pieptul superior.',err:'Lomba se arcuiește.',tip:'Core-ul contractat tot timpul.'}},

  // ── PUSH VERTICAL (umeri) ──
  {id:'db_impins_deasupra',name:'Împins gantere deasupra capului (bancă 80–90°)',muscle:'Umeri',pattern:'push_v',equipment:['gantere','banca'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Bancă 80–90°. Gantere la nivelul umerilor, palme față în față.',move:'Împingi în sus până brațele aproape întinse. Cobori la urechi.',err:'Spatele se arcuiește.',tip:'Abdomenul contractat tot timpul.'}},
  {id:'bara_ohp',name:'Împins cu bara deasupra capului (OHP)',muscle:'Umeri',pattern:'push_v',equipment:['bara'],level:2,compound:true,starEligible:true,prio:2,
   ghid:{start:'Stând, bara la clavicule, priza la lățimea umerilor.',move:'Împingi vertical pe lângă față, blochezi sus. Cobori controlat.',err:'Arcuirea lombară excesivă. Împins prin față (traiectorie greșită).',tip:'Strânge fesierii pentru stabilitate lombară.'}},
  {id:'gym_shoulder_press',name:'Shoulder press la aparat',muscle:'Umeri',pattern:'push_v',equipment:['aparate'],level:1,compound:true,starEligible:true,prio:3,
   ghid:{start:'Scaun reglat: mânerele la nivelul umerilor.',move:'Împingi sus complet, revii controlat.',err:'Umerii ridicați spre urechi.',tip:'Spatele lipit de spătar.'}},
  {id:'bw_pike_pushup',name:'Pike push-up',muscle:'Umeri',pattern:'push_v',equipment:[],level:2,compound:true,starEligible:true,prio:4,
   ghid:{start:'Poziție V inversat — fese sus, palme pe podea.',move:'Cobori capul spre podea, împingi înapoi.',err:'Corp prea orizontal (devine flotare).',tip:'Alternativă bodyweight pentru împins umeri.'}},
  {id:'bw_pike_genunchi',name:'Pike push-up pe genunchi',muscle:'Umeri',pattern:'push_v',equipment:[],level:1,compound:true,starEligible:true,prio:5,
   ghid:{start:'În patru labe, fesele spre călcâie, palmele în față — greutatea pe umeri.',move:'Cobori fruntea spre podea îndoind coatele, împingi înapoi.',err:'Coatele evazate complet lateral.',tip:'Versiunea de start pentru pike push-up — progresezi la varianta cu picioarele întinse.'}},

  // ── IZOLĂRI UMERI ──
  {id:'db_ridicari_laterale',name:'Ridicări laterale cu gantere',muscle:'Umeri lateral',pattern:'izo_umeri',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Stând, gantere pe lângă corp, coate ușor îndoite.',move:'Ridici lateral până la umeri. Cobori lent.',err:'Balans. Ridicare peste nivelul umerilor.',tip:'Greutate mică — imaginează-ți că torni apă din pahar.'}},
  {id:'cable_lateral',name:'Ridicări laterale la cablu',muscle:'Umeri lateral',pattern:'izo_umeri',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Cablul jos, lateral față de corp.',move:'Ridici brațul lateral până la umăr.',err:'Corpul se înclină.',tip:'Tensiune constantă — avantajul cablului.'}},

  // ── IZOLĂRI PIEPT ──
  {id:'db_fluturari',name:'Fluturări gantere bancă înclinată',muscle:'Piept',pattern:'izo_piept',equipment:['gantere','banca'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Bancă înclinată, gantere deasupra pieptului, coate ușor îndoite.',move:'Deschizi brațele în arc, revii strângând pieptul.',err:'Coatele se îndoaie prea mult (devine împins).',tip:'Mișcarea = îmbrățișare de copac.'}},
  {id:'gym_pec_deck',name:'Fluturări la aparat (pec deck)',muscle:'Piept',pattern:'izo_piept',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Scaun reglat: mânerele la nivelul pieptului.',move:'Aduci brațele în față, strângi pieptul 1 sec.',err:'Umerii se rotesc în față.',tip:'Pieptul sus, omoplații strânși.'}},

  // ── TRICEPS ──
  // Dovezi: extensiile DEASUPRA CAPULUI cresc capul lung cu ~45% mai mult
  // decât pushdown-ul și bat pushdown-ul pe TOATE capetele (Maeo 2023, EJSS)
  {id:'gym_overhead_cablu',name:'Extensii triceps deasupra capului la cablu',muscle:'Triceps (cap lung)',pattern:'triceps',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Cu spatele la cablu (setat jos/mediu), frânghia deasupra capului, coatele lângă urechi.',move:'Extinzi brațele complet în față-sus, revii lent lăsând tricepsul să se întindă.',err:'Coatele se deschid lateral. Trunchiul se apleacă excesiv.',tip:'Poziția deasupra capului = +45% creștere pe capul lung vs pushdown (Maeo 2023).'}},
  {id:'db_extensii_triceps',name:'Extensii triceps cu ganteră (deasupra capului)',muscle:'Triceps (cap lung)',pattern:'triceps',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'O ganteră ținută cu ambele mâini deasupra capului.',move:'Cobori lent în spatele capului (întindere completă), extinzi înapoi sus.',err:'Coatele se deschid lateral.',tip:'Poziția deasupra capului crește capul lung mult mai bine decât pushdown-ul (Maeo 2023). Coboară adânc.'}},
  {id:'db_skull_crusher',name:'Skull crusher cu gantere',muscle:'Triceps (cap lung)',pattern:'triceps',equipment:['gantere','banca'],level:2,compound:false,starEligible:false,prio:3,
   ghid:{start:'Culcat pe bancă, ganterele deasupra pieptului, brațele ușor înclinate spre cap.',move:'Îndoi coatele coborând ganterele pe lângă tâmple/în spatele capului, extinzi înapoi.',err:'Coatele se evazează. Brațul superior perfect vertical (scoate tensiunea).',tip:'Brațele înclinate ~20° spre cap = tensiune continuă pe capul lung.'}},
  {id:'cable_pushdown',name:'Extensii triceps la cablu (pushdown)',muscle:'Triceps',pattern:'triceps',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:4,
   ghid:{start:'Cablul sus, coatele lipite de corp.',move:'Extinzi complet în jos, revii controlat.',err:'Coatele se mișcă înainte.',tip:'Eficient, dar inferior variantelor deasupra capului pentru toate capetele (Maeo 2023).'}},
  {id:'bw_flotari_inguste',name:'Flotări înguste (diamond)',muscle:'Triceps',pattern:'triceps',equipment:[],level:2,compound:true,starEligible:false,prio:5,
   ghid:{start:'Flotare cu mâinile apropiate sub piept.',move:'Cobori cu coatele lipite de corp, împingi sus.',err:'Coatele se evazează.',tip:'Prea greu? Pe genunchi.'}},
  {id:'bw_dips_banca',name:'Dips cu sprijin pe bancă/scaun',muscle:'Triceps',pattern:'triceps',equipment:[],level:1,compound:true,starEligible:false,prio:6,
   ghid:{start:'Mâinile pe marginea băncii în spate, picioarele întinse în față.',move:'Cobori îndoind coatele la 90°, împingi sus.',err:'Umerii se ridică spre urechi la coborâre.',tip:'Cu cât picioarele-s mai departe, cu atât mai greu.'}},

  // ── SQUAT (cvadriceps dominant) ──
  {id:'db_goblet',name:'Goblet squat',muscle:'Cvadriceps',pattern:'squat',equipment:['gantere'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Gantera vertical la piept. Picioare la lățimea umerilor.',move:'Cobori ca pe scaun până coapsele paralele. Revii.',err:'Genunchii intră spre interior. Spatele rotunjit.',tip:'Împinge genunchii în afară cu coatele la coborâre.'}},
  {id:'gym_squat_bara',name:'Squat cu bara (back squat)',muscle:'Cvadriceps',pattern:'squat',equipment:['bara'],level:2,compound:true,starEligible:true,prio:1,gymOnly:true,
   ghid:{start:'Bara pe trapez (nu pe gât), în rack cu siguranțe.',move:'Cobori controlat sub paralel dacă mobilitatea permite. Revii.',err:'Genunchii cedează spre interior. Călcâiele se ridică.',tip:'Începe DOAR cu bara goală până tehnica e solidă.'}},
  {id:'gym_leg_press',name:'Presă picioare (leg press)',muscle:'Cvadriceps',pattern:'squat',equipment:['aparate'],level:1,compound:true,starEligible:true,prio:2,
   ghid:{start:'Tălpile la lățimea umerilor pe platformă.',move:'Cobori până genunchii la ~90°, împingi fără să blochezi genunchii.',err:'Genunchii complet blocați sus. Lomba se dezlipește.',tip:'Amplitudine controlată > greutate mare.'}},
  {id:'db_sumo',name:'Sumo squat cu ganteră',muscle:'Cvadriceps + interior',pattern:'squat',equipment:['gantere'],level:1,compound:true,starEligible:false,prio:3,
   ghid:{start:'Picioare late, vârfuri la 45°. Gantera cu ambele mâini.',move:'Cobori drept în jos, revii strângând fesierii.',err:'Trunchiul se apleacă prea mult.',tip:'Simți interiorul coapsei.'}},
  {id:'bw_squat',name:'Genuflexiuni bodyweight',muscle:'Cvadriceps',pattern:'squat',equipment:[],level:1,compound:true,starEligible:true,prio:4,
   ghid:{start:'Picioare la lățimea umerilor, brațele în față pentru echilibru.',move:'Cobori până coapsele paralele, revii.',err:'Călcâiele se ridică.',tip:'Progresezi prin tempo mai lent și mai multe rep.'}},
  {id:'bw_bulgarian',name:'Bulgarian split squat',muscle:'Cvadriceps',pattern:'squat',equipment:[],level:2,compound:true,starEligible:true,prio:5,
   ghid:{start:'Un picior în spate pe bancă/scaun, celălalt în față.',move:'Cobori pe piciorul din față până coapsa paralelă. Revii.',err:'Genunchiul din față trece mult de vârf.',tip:'Cel mai greu exercițiu bodyweight de picioare — și cel mai eficient. Cu gantere devine și mai valoros.'}},
  {id:'gym_leg_extension',name:'Extensii cvadriceps la aparat',muscle:'Cvadriceps',pattern:'squat',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:6,
   ghid:{start:'Scaun reglat, glezna sub rolă. Dacă spătarul se lasă pe spate, înclină-l.',move:'Extinzi complet, cobori controlat.',err:'Balans cu avânt.',tip:'Spătar înclinat (șold extins) = singurul mod fiabil de a crește dreptul femural — squat-ul NU îl crește (Larsen 2025).'}},

  // ── HINGE (fesieri + ischio) ──
  {id:'db_rdl',name:'Îndreptări românești cu gantere',muscle:'Ischio + fesieri',pattern:'hinge',equipment:['gantere'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Gantere pe coapse, genunchi ușor îndoiți, spate drept.',move:'Împingi șoldurile înapoi, cobori pe lângă picioare. Revii strângând fesierii.',err:'Spatele rotunjit. Genunchii se îndoaie prea mult.',tip:'Mișcarea vine din șolduri, nu din genunchi.'}},
  {id:'bara_deadlift',name:'Deadlift cu bara',muscle:'Lanț posterior',pattern:'hinge',equipment:['bara'],level:2,compound:true,starEligible:true,prio:2,risky:true,
   ghid:{start:'Bara deasupra mijlocului piciorului. Spatele drept, pieptul sus.',move:'Împingi podeaua, bara lipită de corp, șoldurile și umerii urcă simultan.',err:'SPATELE ROTUNJIT (pericol!). Bara departe de corp.',tip:'Începe cu greutate FOARTE mică. Opțional până tehnica e solidă.'}},
  {id:'gym_leg_curl',name:'Leg curl ȘEZÂND la aparat',muscle:'Ischio',pattern:'hinge',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:3,
   ghid:{start:'La aparatul de leg curl ȘEZÂND (nu culcat), glezna sub rolă.',move:'Flexezi complet, revii lent cu întindere.',err:'Șoldurile se ridică de pe scaun.',tip:'Șezând > culcat: +14% vs +9% creștere (Maeo 2021) — șoldul flexat = ischio la lungime mare.'}},
  {id:'bw_glute_bridge',name:'Glute bridge',muscle:'Fesieri',pattern:'hinge',equipment:[],level:1,compound:true,starEligible:true,prio:4,
   ghid:{start:'Pe spate, genunchi îndoiți, tălpile pe podea.',move:'Împingi șoldurile sus strângând fesierii, ții 1 sec.',err:'Arcuirea lombară exagerată.',tip:'Progresie: cu un singur picior.'}},
  {id:'bw_single_bridge',name:'Glute bridge cu un picior',muscle:'Fesieri',pattern:'hinge',equipment:[],level:2,compound:true,starEligible:true,prio:5,
   ghid:{start:'Ca glute bridge, dar un picior întins în aer.',move:'Împingi șoldurile sus pe un singur picior.',err:'Șoldul cade pe partea piciorului ridicat.',tip:'Șoldurile paralele tot timpul.'}},
  {id:'bw_sliding_leg_curl',name:'Leg curl cu prosop pe podea',muscle:'Ischio',pattern:'hinge',equipment:[],level:2,compound:true,starEligible:false,prio:6,
   ghid:{start:'Pe spate ca la glute bridge, călcâiele pe un prosop (podea alunecoasă) sau șosete pe parchet.',move:'Ridici șoldurile și aluneci călcâiele spre fesieri, apoi întinzi lent picioarele menținând șoldurile sus.',err:'Șoldurile cad în timpul alunecării.',tip:'Singura variantă bodyweight care lucrează ischio prin flexia genunchiului — faza de întindere lentă e cheia.'}},

  // ── GLUTE (hip thrust) ──
  {id:'bara_hip_thrust',name:'Hip thrust cu bara pe bancă plată',muscle:'Fesieri',pattern:'glute',equipment:['bara','banca'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Omoplații pe bancă, bara pe șolduri (cu prosop).',move:'Împingi șoldurile sus până corpul e drept. Strângi fesierii 1 sec.',err:'Arcuirea lombară. Șoldurile nu ajung sus.',tip:'Bărbia în piept — simți fesierii, nu spatele.'}},
  {id:'db_hip_thrust',name:'Hip thrust cu ganteră',muscle:'Fesieri',pattern:'glute',equipment:['gantere','banca'],level:1,compound:true,starEligible:true,prio:2,
   ghid:{start:'Omoplații pe bancă, gantera pe șolduri.',move:'Împingi șoldurile sus, strângi fesierii 1 sec.',err:'Șoldurile nu urcă complet.',tip:'Variantă accesibilă a hip thrust-ului cu bara.'}},
  {id:'bw_hip_thrust',name:'Hip thrust bodyweight pe bancă',muscle:'Fesieri',pattern:'glute',equipment:[],level:1,compound:true,starEligible:true,prio:3,
   ghid:{start:'Omoplații pe bancă/canapea, tălpile pe podea.',move:'Împingi șoldurile sus, ții 2 sec contracția.',err:'Prea rapid, fără contracție.',tip:'Progresezi prin tempo + un singur picior.'}},

  // ── LUNGE / UNILATERAL ──
  {id:'db_step_back',name:'Step-back lunges',muscle:'Cvadriceps + fesieri',pattern:'lunge',equipment:['gantere'],level:1,compound:true,starEligible:false,prio:1,
   ghid:{start:'Gantere în mâini, stând drept.',move:'Pas mare în spate, cobori genunchiul, revii împingând în călcâiul din față.',err:'Genunchiul din față trece de vârf. Trunchi aplecat.',tip:'Pasul înapoi e mai blând pentru genunchi decât înainte.'}},
  {id:'bw_fandari',name:'Fandări în loc',muscle:'Cvadriceps + fesieri',pattern:'lunge',equipment:[],level:1,compound:true,starEligible:false,prio:2,
   ghid:{start:'Stând drept, mâinile pe șolduri.',move:'Pas în spate, cobori, revii. Alternezi picioarele.',err:'Genunchiul din față instabil.',tip:'Control total, nu viteză.'}},

  // ── GAMBE ──
  {id:'db_calf',name:'Ridicări pe vârfuri cu gantere',muscle:'Gambe',pattern:'gambe',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Gantere în mâini, picioare la lățimea șoldurilor.',move:'Ridici pe vârfuri cât de sus poți, cobori lent.',err:'Amplitudine mică, balans.',tip:'Pe o treaptă, cu întindere PROFUNDĂ jos — jumătatea de jos a mișcării dă dublul creșterii (Kassiano 2023).'}},
  {id:'gym_calf',name:'Ridicări gambe la aparat',muscle:'Gambe',pattern:'gambe',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Poziționat la aparat, vârfurile pe platformă.',move:'Extensie completă sus, întindere completă jos.',err:'Repetări scurte, rapide.',tip:'Întinderea profundă de jos = dublul creșterii vs amplitudine scurtă (Kassiano 2023). În picioare > șezând pentru gambe (Kinoshita 2023).'}},
  {id:'bw_calf',name:'Ridicări pe vârfuri',muscle:'Gambe',pattern:'gambe',equipment:[],level:1,compound:false,starEligible:false,prio:3,
   ghid:{start:'Pe o treaptă cu călcâiele în aer (sau pe podea).',move:'Ridici pe vârfuri, cobori lent sub nivel.',err:'Fără pauză sus.',tip:'Întinde profund jos și oprește-te 1 sec. Un picior odată când devine ușor.'}},

  // ── PULL (spate) ──
  {id:'db_ramat_sprijinit',name:'Ramat gantere sprijinit pe bancă înclinată',muscle:'Spate',pattern:'pull',equipment:['gantere','banca'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Pieptul pe bancă înclinată, gantere atârnând.',move:'Tragi ganterele spre șolduri, strângi omoplații sus.',err:'Balans, trunchiul se ridică de pe bancă.',tip:'Sigur pentru lombari — pieptul sprijinit.'}},
  {id:'bara_bent_over_row',name:'Bent-over row cu bara',muscle:'Spate',pattern:'pull',equipment:['bara'],level:2,compound:true,starEligible:true,prio:2,risky:true,
   ghid:{start:'Aplecat la ~45°, spatele drept, bara la lățimea umerilor.',move:'Tragi bara spre abdomen, coatele pe lângă corp.',err:'Spatele rotunjit. Balans.',tip:'Bara atinge buricul la fiecare repetare.'}},
  {id:'gym_lat_pulldown',name:'Tracțiuni la helcometru (lat pulldown)',muscle:'Spate',pattern:'pull',equipment:['cablu'],level:1,compound:true,starEligible:true,prio:1,
   ghid:{start:'Priza puțin mai lată decât umerii, pieptul sus.',move:'Tragi bara la piept, coatele în jos și înapoi.',err:'Balans pe spate. Tras la ceafă (riscant).',tip:'Imaginează-ți că tragi cu coatele, nu cu mâinile.'}},
  {id:'gym_seated_row',name:'Ramat la cablu șezând (seated row)',muscle:'Spate',pattern:'pull',equipment:['cablu'],level:1,compound:true,starEligible:true,prio:2,
   ghid:{start:'Șezând, spatele drept, mânerele în mâini.',move:'Tragi spre abdomen strângând omoplații.',err:'Balans înainte-înapoi din trunchi.',tip:'Trunchiul rămâne vertical, doar brațele lucrează.'}},
  {id:'bw_row_masa',name:'Ramat inversat sub masă',muscle:'Spate',pattern:'pull',equipment:[],level:2,compound:true,starEligible:true,prio:3,
   ghid:{start:'Sub o masă solidă, prins de margine, corpul drept.',move:'Tragi pieptul spre masă, cobori controlat.',err:'Șoldurile cad.',tip:'Cu genunchii îndoiți e mai ușor.'}},
  {id:'bw_prosop_row',name:'Ramat cu prosop la ușă',muscle:'Spate',pattern:'pull',equipment:[],level:1,compound:true,starEligible:true,prio:6,
   ghid:{start:'Prosop solid trecut peste clanțele ușii (ușa închisă). Prins de capete, corpul lăsat pe spate.',move:'Tragi pieptul spre ușă strângând omoplații, revii controlat.',err:'Tras cu brațele în loc de spate. Corp îndoit din șold.',tip:'Cu cât te lași mai pe spate (picioarele mai aproape de ușă), cu atât mai greu. Verifică ușa/prosopul înainte!'}},
  {id:'bw_tractiuni',name:'Tracțiuni la bară',muscle:'Spate',pattern:'pull',equipment:['tractiuni'],level:2,compound:true,starEligible:true,prio:1,
   ghid:{start:'Atârnat de bară, priza puțin mai lată decât umerii.',move:'Tragi bărbia peste bară, cobori complet controlat.',err:'Jumătăți de repetări. Balans (kipping).',tip:'Nu poți încă? Sărituri + coborâre lentă (negative).'}},
  {id:'db_ramat_un_brat',name:'Ramat un braț sprijinit pe bancă',muscle:'Spate',pattern:'pull',equipment:['gantere','banca'],level:1,compound:true,starEligible:false,prio:4,
   ghid:{start:'Genunchiul și mâna pe bancă, gantera în cealaltă mână.',move:'Tragi gantera spre șold, strângi omoplatul.',err:'Rotirea trunchiului.',tip:'Spatele paralel cu podeaua.'}},
  {id:'db_pullover',name:'Pullover cu ganteră pe bancă plată',muscle:'Spate + piept',pattern:'pull',equipment:['gantere','banca'],level:1,compound:false,starEligible:false,prio:5,
   ghid:{start:'Culcat pe bancă, gantera cu ambele mâini deasupra pieptului.',move:'Cobori în arc peste cap, revii.',err:'Coatele prea îndoite.',tip:'Coatele ușor îndoite pe tot parcursul.'}},

  // ── SPATE POSTERIOR (umăr posterior) ──
  // Dovezi: reverse fly are RCT longitudinal solid (+15-26% deltoid posterior,
  // Jones 2025) — printre puținele izolări cu dovezi directe de hipertrofie
  {id:'gym_reverse_pec_deck',name:'Reverse fly la aparat (pec deck invers)',muscle:'Umăr posterior',pattern:'spate_post',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Cu fața la spătarul aparatului, mânerele în față.',move:'Deschizi brațele în arc spre spate, strângi 1 sec.',err:'Coatele se îndoaie prea mult (devine ramat).',tip:'RCT: +15-26% deltoid posterior în 10 săpt. (Jones 2025). Priza neutră (degetele mari în sus) ajută.'}},
  {id:'db_reverse_fly',name:'Reverse fly cu gantere',muscle:'Umăr posterior',pattern:'spate_post',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Aplecat la 45°, gantere atârnând, coate ușor îndoite.',move:'Deschizi brațele lateral, strângi omoplații.',err:'Balans, greutate prea mare.',tip:'Greutate mică — mușchiul e mic. Priza neutră (degetele mari în sus) activează mai bine (Schoenfeld 2013).'}},
  {id:'cable_face_pull',name:'Face pull la cablu',muscle:'Umăr posterior',pattern:'spate_post',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:3,
   ghid:{start:'Cablul la nivelul feței, frânghie în mâini.',move:'Tragi spre față cu coatele sus și în afară.',err:'Tras cu tot corpul.',tip:'Excelent pentru postura umerilor.'}},
  {id:'bw_yt_raises',name:'Y-T raises la sol',muscle:'Umăr posterior',pattern:'spate_post',equipment:[],level:1,compound:false,starEligible:false,prio:4,
   ghid:{start:'Culcat pe burtă, brațele întinse în formă de Y, degetele mari în sus.',move:'Ridici brațele de la sol strângând omoplații, ții 1 sec, treci în formă de T, cobori.',err:'Ridici pieptul de pe podea. Mișcare din gât.',tip:'Amplitudine mică dar contracție reală — mușchiul e mic.'}},
  {id:'bw_superman',name:'Superman',muscle:'Spate jos + posterior',pattern:'spate_post',equipment:[],level:1,compound:false,starEligible:false,prio:5,
   ghid:{start:'Culcat pe burtă, brațele întinse înainte.',move:'Ridici simultan brațele și picioarele de la sol, ții 2 sec, cobori lent.',err:'Smucitură din gât în sus.',tip:'Privirea în podea — gâtul neutru.'}},

  // ── BICEPS ──
  // Dovezi (Kassiano 2025, IJSM): incline curl crește partea PROXIMALĂ,
  // preacher partea DISTALĂ — complementare; flexia la cot la lungime
  // mare superioară (Sato 2021: +8.9% vs +3.4%)
  {id:'db_incline_curl',name:'Flexii biceps pe bancă înclinată',muscle:'Biceps (proximal)',pattern:'biceps',equipment:['gantere','banca'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'Bancă la ~45-60°, spatele lipit, brațele atârnă în spatele corpului (umăr extins).',move:'Flexezi coatele fără să miști umerii, cobori COMPLET până brațul e întins.',err:'Umerii se mișcă în față. Coborâre incompletă.',tip:'Poziția cu brațul în spate = biceps la lungime mare — crește mai mult (Kassiano 2025).'}},
  {id:'db_flexii_alternante',name:'Flexii biceps alternante',muscle:'Biceps',pattern:'biceps',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Gantere pe lângă corp, palme față în față.',move:'Ridici rotind palma în sus. Cobori COMPLET (braț întins). Alternezi.',err:'Coatul se mișcă înainte. Balans.',tip:'Coatele fixe. Extensia completă jos contează mai mult decât vârful de sus.'}},
  {id:'gym_preacher_curl',name:'Flexii la banca preacher',muscle:'Biceps (distal)',pattern:'biceps',equipment:['aparate'],level:1,compound:false,starEligible:false,prio:3,
   ghid:{start:'Brațele pe perna înclinată, pieptul lipit.',move:'Flexezi complet, cobori lent până brațul e aproape întins.',err:'Ridici umerii. Coborâre bruscă.',tip:'Crește partea de jos a bicepsului (distal) — combinat cu incline curl acoperi tot (Kassiano 2025).'}},
  {id:'db_hammer',name:'Hammer curl',muscle:'Biceps + antebraț',pattern:'biceps',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:4,
   ghid:{start:'Gantere pe lângă corp, palme față în față.',move:'Ridici fără rotire (priza neutră).',err:'Balans.',tip:'Lucrează și brahialul + antebrațul.'}},
  {id:'cable_biceps',name:'Flexii biceps la cablu',muscle:'Biceps',pattern:'biceps',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:5,
   ghid:{start:'Cablul jos, bara/mânerul în mâini.',move:'Flexezi complet, cobori controlat.',err:'Coatele înainte.',tip:'Tensiune constantă pe tot parcursul.'}},

  // ── CORE ──
  // Dovezi: flexia spinală cu greutate = cel mai bun stimul pt drept abdominal
  // (Roberts 2023) și e SIGURĂ pentru antrenați sănătoși (Saraceni 2020, meta)
  {id:'gym_cable_crunch',name:'Crunch la cablu (în genunchi)',muscle:'Core',pattern:'core',equipment:['cablu'],level:1,compound:false,starEligible:false,prio:1,
   ghid:{start:'În genunchi cu spatele la cablu, frânghia ținută la tâmple.',move:'Flexezi trunchiul rotunjind coloana (coatele spre genunchi), revii lent cu întindere.',err:'Tragi cu brațele. Miști doar șoldurile.',tip:'Singurul exercițiu de abs încărcabil progresiv curat — flexia cu greutate e cel mai bun stimul (Roberts 2023).'}},
  {id:'db_abdomene',name:'Abdomene cu greutate',muscle:'Core',pattern:'core',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:2,
   ghid:{start:'Culcat, genunchii îndoiți, gantera la piept.',move:'Ridici trunchiul controlat, cobori lent cu întindere completă.',err:'Tras de gât.',tip:'Flexia cu greutate e sigură și eficientă (Saraceni 2020) — progresezi în kg ca la orice mușchi.'}},
  {id:'bw_hanging_leg_raise',name:'Ridicări de picioare atârnat',muscle:'Core inferior',pattern:'core',equipment:['tractiuni'],level:2,compound:false,starEligible:false,prio:3,
   ghid:{start:'Atârnat de bară, corpul stabil.',move:'Ridici genunchii/picioarele rotind bazinul în sus (pelvisul se rulează), cobori controlat.',err:'Doar flexie de șold fără rularea bazinului. Balans.',tip:'Rularea bazinului transformă mișcarea în flexie spinală reală — partea de jos a dreptului abdominal.'}},
  {id:'bw_plank',name:'Plank',muscle:'Core',pattern:'core',equipment:[],level:1,compound:false,starEligible:false,prio:4,timeBased:true,
   ghid:{start:'Pe coate, corp drept de la cap la călcâie.',move:'Menții poziția, respiri normal.',err:'Șoldurile cad sau urcă.',tip:'Fesierii și abdomenul contractate.'}},
  {id:'bw_dead_bug',name:'Dead bug',muscle:'Core',pattern:'core',equipment:[],level:1,compound:false,starEligible:false,prio:5,
   ghid:{start:'Pe spate, brațele spre plafon, genunchii la 90°.',move:'Cobori braț + picior opus simultan, revii.',err:'Lomba se dezlipește de podea.',tip:'Lomba lipită tot timpul.'}},
  {id:'bw_ridicari_picioare',name:'Ridicări de picioare',muscle:'Core inferior',pattern:'core',equipment:[],level:1,compound:false,starEligible:false,prio:6,
   ghid:{start:'Culcat, mâinile sub fesieri.',move:'Ridici picioarele întinse la 90°, cobori lent fără să atingi podeaua.',err:'Lomba se arcuiește la coborâre.',tip:'Genunchii îndoiți dacă e prea greu.'}},
  {id:'db_suitcase_carry',name:'Suitcase carry (mers cu o ganteră)',muscle:'Oblici',pattern:'core',equipment:['gantere'],level:1,compound:false,starEligible:false,prio:7,
   ghid:{start:'O ganteră grea într-o singură mână, stând perfect drept.',move:'Mergi lent 20-30 pași, corpul NU se înclină spre greutate.',err:'Umărul cade spre ganteră. Pași grăbiți.',tip:'Cel mai bun stimul pentru oblici dintre variantele cu greutate liberă (EMG 2024) + antebrațe gratis.'}}
];

/* ───────────────────────────────────────────────────────────────
   PROFILE ECHIPAMENT
   ─────────────────────────────────────────────────────────────── */
var EQUIPMENT_PROFILES={
  bodyweight:{label:'Doar corpul (acasă, fără echipament)',available:[]},
  home_min:{label:'Acasă: gantere + bancă',available:['gantere','banca']},
  gym:{label:'Sală completă',available:['gantere','banca','bara','tractiuni','cablu','aparate']}
};

/* ───────────────────────────────────────────────────────────────
   TEMPLATE-URI SPLIT — sloturi per zi
   Slot: {pattern, star (vrea compound ⭐), sets, target}
   'auto' la sets/target = decis de nivel/vârstă
   ─────────────────────────────────────────────────────────────── */
var SPLIT_4DAY={
  days:[
    {key:'luni',label:'Piept / Umeri / Triceps',icon:'🏋️',type:'push',slots:[
      {pattern:'push_h',star:true,sets:4,target:'6–10'},
      {pattern:'push_v',star:true,sets:3,target:'8–12'},
      {pattern:'izo_umeri',star:false,sets:3,target:'12–15'},
      {pattern:'izo_piept',star:false,sets:3,target:'10–15'},
      {pattern:'triceps',star:false,sets:3,target:'10–15'}]},
    {key:'marti',label:'Picioare',icon:'🦵',type:'lower',slots:[
      {pattern:'squat',star:true,sets:4,target:'8–12'},
      {pattern:'squat',star:false,sets:3,target:'10–12'},
      {pattern:'hinge',star:true,sets:4,target:'8–12'},
      {pattern:'lunge',star:false,sets:3,target:'8/picior'},
      {pattern:'gambe',star:false,sets:3,target:'15–20'}]},
    {key:'miercuri',label:'Recovery — Pași + Core',icon:'🚶',type:'recovery',slots:[]},
    {key:'joi',label:'Spate / Biceps',icon:'🔙',type:'pull',slots:[
      {pattern:'pull',star:true,sets:4,target:'8–12'},
      {pattern:'pull',star:false,sets:3,target:'10–15'},
      {pattern:'spate_post',star:false,sets:3,target:'12–15'},
      {pattern:'biceps',star:false,sets:3,target:'10–15'}]},
    {key:'vineri',label:'Full Body',icon:'⚡',type:'full',slots:[
      {pattern:'glute',star:true,sets:4,target:'8–12'},
      {pattern:'push_h',star:true,sets:3,target:'8–12'},
      {pattern:'pull',star:false,sets:3,target:'10/parte'},
      {pattern:'core',star:false,sets:3,target:'12–20'}]},
    {key:'sambata',label:'Recovery + Mobilitate',icon:'🧘',type:'recovery',slots:[]}
  ],
  // maparea celor 7 zile calendaristice pe zilele template-ului
  schedule:['luni','marti','miercuri','joi','vineri','sambata','sambata']
};

var SPLIT_3DAY={
  days:[
    {key:'luni',label:'Full Body A',icon:'🏋️',type:'full',slots:[
      {pattern:'squat',star:true,sets:4,target:'8–12'},
      {pattern:'push_h',star:true,sets:3,target:'6–10'},
      {pattern:'pull',star:false,sets:3,target:'10–15'},
      {pattern:'core',star:false,sets:3,target:'12–20'}]},
    {key:'marti',label:'Recovery — Pași + Core',icon:'🚶',type:'recovery',slots:[]},
    {key:'miercuri',label:'Full Body B',icon:'⚡',type:'full',slots:[
      {pattern:'hinge',star:true,sets:4,target:'8–12'},
      {pattern:'push_v',star:true,sets:3,target:'8–12'},
      {pattern:'pull',star:false,sets:3,target:'10–15'},
      {pattern:'gambe',star:false,sets:3,target:'15–20'}]},
    {key:'joi',label:'Recovery — Pași + Core',icon:'🚶',type:'recovery',slots:[]},
    {key:'vineri',label:'Full Body C',icon:'💪',type:'full',slots:[
      {pattern:'glute',star:true,sets:4,target:'8–12'},
      {pattern:'lunge',star:false,sets:3,target:'8/picior'},
      {pattern:'spate_post',star:false,sets:3,target:'12–15'},
      {pattern:'biceps',star:false,sets:3,target:'10–15'}]},
    {key:'sambata',label:'Recovery + Mobilitate',icon:'🧘',type:'recovery',slots:[]}
  ],
  schedule:['luni','marti','miercuri','joi','vineri','sambata','sambata']
};

/* ───────────────────────────────────────────────────────────────
   RUTINE DIMINEAȚĂ — pe tipul zilei (pattern learning, universal)
   ─────────────────────────────────────────────────────────────── */
var MORNING_TEMPLATES={
  push:{label:'Pattern Push',sub:'umeri + piept (pattern, nu la eșec)',duration:'~10 min',list:[
    {id:'morn_flotari_lente',name:'Flotări lente',target:'3×6–8 rep'},
    {id:'morn_pike_pushup',name:'Pike push-up',target:'2×6 rep'},
    {id:'morn_mob_umeri',name:'Mobilitate umeri',target:'5 min'},
    {id:'morn_kegel',name:'Kegel (contracții)',target:'3×10–15'}]},
  lower:{label:'Pattern Lower',sub:'șolduri + core',duration:'~10 min',list:[
    {id:'morn_fandari',name:'Fandări în loc',target:'3×8/picior'},
    {id:'morn_glute_bridge',name:'Glute bridge',target:'3×10 rep'},
    {id:'morn_plank',name:'Plank',target:'2×45 sec'},
    {id:'morn_kegel',name:'Kegel (contracții)',target:'3×10–15'}]},
  pull:{label:'Pattern Pull',sub:'spate + omoplați',duration:'~10 min',list:[
    {id:'morn_superman',name:'Superman',target:'3×10 rep'},
    {id:'morn_scapular',name:'Scapular push-ups',target:'2×10 rep'},
    {id:'morn_mob_toracic',name:'Mobilitate toracică',target:'3 min'},
    {id:'morn_kegel',name:'Kegel (contracții)',target:'3×10–15'}]},
  full:{label:'Pattern Full Body',sub:'hip hinge + core',duration:'~10 min',list:[
    {id:'morn_hip_hinge',name:'Hip hinge (fără greutate)',target:'3×10 rep'},
    {id:'morn_flotari_inguste',name:'Flotări înguste',target:'2×8 rep'},
    {id:'morn_plank_lateral',name:'Plank lateral',target:'2×30/parte'},
    {id:'morn_kegel',name:'Kegel (contracții)',target:'3×10–15'}]},
  recovery:{label:'Recovery + Mobilitate',sub:'decompresie',duration:'~15 min',list:[
    {id:'morn_stretch_full',name:'Stretching full body',target:'10 min'},
    {id:'morn_mob_articulatii',name:'Mobilitate umeri/șolduri',target:'5 min'},
    {id:'morn_kegel',name:'Kegel (contracții)',target:'3×10–15'}]}
};

/* ───────────────────────────────────────────────────────────────
   SELECȚIE EXERCIȚII
   ─────────────────────────────────────────────────────────────── */
function poolFor(profile){
  var avail=EQUIPMENT_PROFILES[profile.equipment].available.slice();
  if(profile.equipment==='home_min'&&profile.hasBara)avail.push('bara');
  return EXERCISE_DB.filter(function(ex){
    // echipamentul exercițiului ⊆ echipamentul disponibil
    for(var i=0;i<ex.equipment.length;i++){
      if(avail.indexOf(ex.equipment[i])<0)return false;
    }
    if(ex.gymOnly&&profile.equipment!=='gym')return false;
    if(profile.experience==='incepator'&&ex.level>1)return false;
    if(profile.experience==='incepator'&&ex.risky)return false;
    return true;
  });
}

/* Pattern-uri înrudite — dacă pool-ul nu acoperă pattern-ul cerut
   (ex: biceps la bodyweight), umplem slotul cu un pattern vecin
   care lucrează aceleași grupe. Menține volumul zilei echilibrat. */
var FALLBACK_PATTERNS={
  biceps:['pull'],
  spate_post:['pull'],
  izo_umeri:['push_v','spate_post'],
  izo_piept:['push_h'],
  triceps:['push_h'],
  glute:['hinge'],
  hinge:['glute'],
  lunge:['squat'],
  pull:['spate_post'],
  gambe:['lunge'],
  squat:['lunge'],
  push_h:['push_v'],
  push_v:['push_h'],
  core:[]
};

function pickFromPattern(pool,pattern,starWanted,usedIds){
  var candidates=pool.filter(function(ex){
    if(ex.pattern!==pattern)return false;
    if(usedIds.indexOf(ex.id)>=0)return false;
    if(starWanted&&!ex.starEligible)return false;
    return true;
  });
  if(!candidates.length&&starWanted){
    candidates=pool.filter(function(ex){
      return ex.pattern===pattern&&usedIds.indexOf(ex.id)<0;
    });
  }
  if(!candidates.length)return null;
  candidates.sort(function(a,b){return a.prio-b.prio;});
  return candidates[0];
}

function pickExercise(pool,slot,usedIds){
  var ex=pickFromPattern(pool,slot.pattern,slot.star,usedIds);
  if(ex)return ex;
  // fallback pe pattern-uri înrudite
  var fallbacks=FALLBACK_PATTERNS[slot.pattern]||[];
  for(var i=0;i<fallbacks.length;i++){
    ex=pickFromPattern(pool,fallbacks[i],slot.star,usedIds);
    if(ex)return ex;
  }
  return null;
}

/* ───────────────────────────────────────────────────────────────
   VOLUM — modificatori după vârstă/experiență
   ─────────────────────────────────────────────────────────────── */
function adjustVolume(sets,isStar,profile){
  var s=sets;
  if(profile.age>=45&&!isStar)s=Math.max(2,s-1);
  if(profile.age>=55&&isStar)s=Math.min(s,3);
  return s;
}

function maxExercisesPerDay(profile){
  return profile.experience==='incepator'?4:5;
}

/* ───────────────────────────────────────────────────────────────
   NUTRIȚIE — Mifflin-St Jeor + obiectiv
   ─────────────────────────────────────────────────────────────── */
function calcNutrition(profile){
  var bmr;
  if(profile.sex==='F'){
    bmr=10*profile.weight+6.25*profile.height-5*profile.age-161;
  }else{
    bmr=10*profile.weight+6.25*profile.height-5*profile.age+5;
  }
  // factor activitate: sedentar + antrenament → 1.4 (3 zile) / 1.5 (4 zile)
  var activity=profile.days>=4?1.5:1.4;
  var tdee=bmr*activity;
  var goalAdj={slabit:-0.20,recomp:-0.12,masa:0.10}[profile.goal]||-0.12;
  var kcal=Math.round(tdee*(1+goalAdj)/10)*10;
  // podea de siguranță
  var minKcal=profile.sex==='F'?1200:1500;
  if(kcal<minKcal)kcal=minKcal;
  var proteinPerKg={slabit:2.2,recomp:2.0,masa:1.8}[profile.goal]||2.0;
  var protein=Math.round(profile.weight*proteinPerKg);
  var fat=Math.round(profile.weight*0.9);
  var carbs=Math.max(50,Math.round((kcal-protein*4-fat*9)/4));
  var steps={slabit:'8.000–10.000',recomp:'6.000–8.000',masa:'6.000'}[profile.goal];
  return {
    bmr:Math.round(bmr),tdee:Math.round(tdee),kcal:kcal,
    protein:protein,fat:fat,carbs:carbs,
    waterL:Math.round(profile.weight*0.035*10)/10,
    stepsTarget:steps,
    principles:[
      profile.goal==='slabit'?'Deficit ~20% — pierdere ~0.5-0.8 kg/săpt. Mai rapid = pierzi mușchi.':
      profile.goal==='masa'?'Surplus ~10% — creștere lentă și curată. Mai mult = grăsime.':
      'Deficit moderat ~12% — recompoziție: pierzi grăsime, menții/crești mușchiul.',
      'Proteine la fiecare masă — '+proteinPerKg+' g/kg corp = '+protein+' g/zi.',
      'Post intermitent (ex. 19:6) = unealtă opțională pentru controlul caloriilor, nu magie.',
      'Cântărește mâncarea — estimările din ochi sunt greșite cu 30-50%.',
      'Zero calorii lichide (suc, alcool) — cea mai ușoară economie.'
    ]
  };
}

/* ───────────────────────────────────────────────────────────────
   CHECKLIST — scalat pe profil
   ─────────────────────────────────────────────────────────────── */
function buildChecklist(profile,nutrition){
  return [
    {id:'proteine',lbl:'🥩 '+nutrition.protein+'g proteine'},
    {id:'apa',lbl:'💧 Apă '+nutrition.waterL+'L'},
    {id:'pasi',lbl:'🚶 '+nutrition.stepsTarget+' pași'},
    {id:'antrenament',lbl:'🏋️ Antrenament (în zilele active)'},
    {id:'progres',lbl:'⭐ Progres la 1 exercițiu ⭐'},
    {id:'somn',lbl:'😴 Somn 7+ ore'}
  ];
}

/* ───────────────────────────────────────────────────────────────
   GENERATORUL PRINCIPAL
   profile: {sex:'M'|'F', age, height(cm), weight(kg),
             experience:'incepator'|'intermediar',
             equipment:'bodyweight'|'home_min'|'gym', hasBara:bool,
             days:3|4, goal:'slabit'|'recomp'|'masa',
             morningRoutine:bool}
   ─────────────────────────────────────────────────────────────── */
function generateProgram(profile){
  var errors=[];
  if(!profile||typeof profile!=='object')return {errors:['profil lipsă']};
  if(['M','F'].indexOf(profile.sex)<0)errors.push('sex invalid');
  if(!(profile.age>=16&&profile.age<=80))errors.push('vârstă în afara intervalului 16-80');
  if(!(profile.height>=120&&profile.height<=230))errors.push('înălțime invalidă');
  if(!(profile.weight>=35&&profile.weight<=250))errors.push('greutate invalidă');
  if(!EQUIPMENT_PROFILES[profile.equipment])errors.push('profil echipament invalid');
  if([3,4].indexOf(profile.days)<0)errors.push('zile: doar 3 sau 4 în v1');
  if(['slabit','recomp','masa'].indexOf(profile.goal)<0)errors.push('obiectiv invalid');
  if(['incepator','intermediar'].indexOf(profile.experience)<0)errors.push('experiență invalidă');
  if(errors.length)return {errors:errors};

  var split=profile.days===4?SPLIT_4DAY:SPLIT_3DAY;
  var pool=poolFor(profile);
  var exercises={};
  var morningRoutines={};
  var maxEx=maxExercisesPerDay(profile);
  var warnings=[];

  split.days.forEach(function(day){
    if(day.type==='recovery'){
      exercises[day.key]={label:day.label,icon:day.icon,duration:'Ușor',list:[
        {star:false,name:'Pași parcurși (țintă zilnică)',sets:1,target:'—'},
        {star:false,name:'Plank + Dead bug',sets:2,target:'2 runde'}
      ]};
      morningRoutines[day.key]=MORNING_TEMPLATES.recovery;
      return;
    }
    var usedIds=[];
    var list=[];
    var slots=day.slots.slice(0,Math.max(maxEx,day.slots.filter(function(s){return s.star;}).length));
    slots.forEach(function(slot){
      if(list.length>=maxEx&&!slot.star)return;
      var ex=pickExercise(pool,slot,usedIds);
      if(!ex){
        warnings.push(day.key+': niciun exercițiu pentru pattern "'+slot.pattern+'"'+(slot.star?' (⭐)':''));
        return;
      }
      usedIds.push(ex.id);
      list.push({
        star:slot.star&&ex.starEligible,
        name:ex.name,
        sets:adjustVolume(slot.sets,slot.star,profile),
        target:slot.target,
        exId:ex.id,
        risky:!!ex.risky
      });
    });
    var durationMin=list.length*9+8;
    exercises[day.key]={label:day.label,icon:day.icon,duration:'~'+durationMin+' min',list:list};
    morningRoutines[day.key]=MORNING_TEMPLATES[day.type]||MORNING_TEMPLATES.full;
  });

  var nutrition=calcNutrition(profile);
  var checklist=buildChecklist(profile,nutrition);

  // Ghid — doar exercițiile folosite în program
  var usedExIds={};
  Object.keys(exercises).forEach(function(k){
    exercises[k].list.forEach(function(e){if(e.exId)usedExIds[e.exId]=true;});
  });
  var ghid=EXERCISE_DB.filter(function(ex){return usedExIds[ex.id];}).map(function(ex){
    var eqLabel=ex.equipment.length===0?'bodyweight':(ex.equipment.indexOf('bara')>=0?'bară':(ex.equipment.indexOf('cablu')>=0||ex.equipment.indexOf('aparate')>=0?'aparat':'gantere'));
    return {name:ex.name,tag:eqLabel,start:ex.ghid.start,move:ex.ghid.move,err:ex.ghid.err,tip:ex.ghid.tip};
  });

  return {
    errors:null,
    warnings:warnings,
    profile:profile,
    exercises:exercises,
    schedule:split.schedule,
    morningRoutines:profile.morningRoutine!==false?morningRoutines:null,
    nutrition:nutrition,
    checklist:checklist,
    ghid:ghid,
    meta:{
      generatedAt:null, // se completează la integrare (Date interzis în workflow-uri de test)
      goal:profile.goal,
      goalNotes:profile.goal==='slabit'
        ?'În deficit mare: MENȚINEREA greutăților la ⭐ = succes. Stagnarea nu e alarmă — e mușchi apărat.'
        :profile.goal==='masa'
        ?'În surplus: progresul la ⭐ ar trebui constant. Stagnare 2+ săpt. = verifică somn/calorii.'
        :'Recomp: progres lent la ⭐ + talie în scădere = plan perfect. Răbdare.',
      weeksStructure:'Săpt 1-2 baseline · 3-4 +rep · 5-6 +kg · 7 +set · 8 deload — identic pentru toate obiectivele'
    }
  };
}

var API={
  EXERCISE_DB:EXERCISE_DB,
  EQUIPMENT_PROFILES:EQUIPMENT_PROFILES,
  MORNING_TEMPLATES:MORNING_TEMPLATES,
  generateProgram:generateProgram,
  calcNutrition:calcNutrition
};

if(typeof module!=='undefined'&&module.exports){module.exports=API;}
else{root.ProgramGenerator=API;}

})(typeof window!=='undefined'?window:this);
