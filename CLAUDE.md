# Fitness Jurnal — PWA de antrenament (8 săptămâni)

App personal devenit multi-user, în drum spre Google Play. Limba: **română only**.

- **Live**: https://crstefan-lab.github.io/fitness-jurnal/ (GitHub Pages, repo `CRStefan-lab/fitness-jurnal`)
- **Push pe `main` = deploy instant** — PWA-ul tuturor userilor se auto-actualizează (banner "Versiune nouă")

## Stare curentă (august 2026, SW `fitness-v93`)

Aplicația e **feature-complete** ca "antrenor în buzunar", construită integral în sesiuni Claude Code:
- Jurnal complet (seturi rep×kg, pre-fill, steppers, PR detection, edit/backdate, note per exercițiu)
- Smart Coach adaptiv: progresie 8 săpt. + cicluri, modulare RIR (ușor/ok/limită), auto-deload la stagnare+energie mică, încălzire calculată, ținte explicite și la accesorii ("Opțional azi: X rep × Y kg")
- Onboarding wizard 7 pași → program generat (generator.js, 67 exerciții, 3 profile echipament, dovezi 2020-2025); pas 5 include accent `emphasis` ('echilibrat'|'glute' — glute: marți devine „Picioare & Fesieri" cu hip thrust în loc de al 2-lea squat pe 4 zile, Full Body A primește glute în loc de core pe 3 zile; `buildSplit()` clonează template-urile, nu le muta direct)
- Nutriție: calculator TDEE/macros pt useri generați + mesele hardcodate pt owner + secțiune "De ce aceste numere?" cu citări
- Progres: măsurători + BF% Navy (M/F) + grafice + recomp verdict + poze progres (IndexedDB) + PR-uri + 1RM; tab-ul e organizat în 4 grupuri pliabile (`pgExercitii` primul/deschis, apoi Măsurători/Corp/Poze; `pgRerender(id)` re-randează graficele la deschidere); exercițiile au selector propriu de perioadă (`exerRangeSeg`/`progresState.exerRange`, 8/13/26/0 săpt); istoricul de măsurători arată 6 + expander (`measShowAll`)
- Retenție: streak 🔥 în header, digest săptămânal cu imagine share-abilă (canvas PNG)
- Ghid: modal 📖/❓ pe orice exercițiu (inclusiv 22 matinale) + link video YouTube + principii dovedite; ghidurile matinale au câmp `easier` (scara de regresii „Prea greu?"); generatorul dă începătorilor variante matinale regresate (`MORNING_EASY_SWAP`/`morningFor`, aceleași id-uri); la exerciții fără istoric, hint START explică protocolul de găsire a greutății; Setări are search bar (`filterSetari`, fără diacritice) Înlocuire exerciții: la cele din program (`exercise_swaps` + `swapAlternativesHtml`, alternative din același pattern) și la cele de dimineață (`morning_swaps` + `MORNING_SWAP_POOL` grupat push/pull/core/lower/mob, `applyMorningSwaps()` la load); ambele reversibile, per device.
- Personalizare: nume în header, 6 teme de accent (CSS vars `--acc-rgb`/`--acc2-rgb`, `html[data-theme]`, cheie `app_theme`), sex M/F în setări; Setări reorganizate în 7 grupuri pliabile (`.sgroup`), Zona periculoasă ultima
- Design "Pro HUD" (v54-v55): Chakra Petch self-hostat în `fonts/` (4 woff2, precache în SW) pe titluri/cifre; pastile colorate statistici (`.azi-stat.as1-4`); toggle aspect întunecat/deschis (`html[data-mode="light"]`, cheie `app_mode`, `applyMode()`/`setMode()`, snippet pre-paint în head; pe light `--acc2` devine `--acc-dim` pt contrast); nav + gear cu SVG inline (stroke currentColor, nu emoji); micro-animații tab/carduri (`secIn`/`cardIn`, respectă prefers-reduced-motion); mockup-uri explorare în `design-preview.html` (gitignored)
- Rest timer fundal (deadline-based) + beep + mod auto 90s/150s⭐
- QoL v78-v85: „Sar azi" per exercițiu (rând `skip` cu motiv, card dashed ambră + Reia, ziua se încheie fără el; `skipData` în preload, vizibil în Istoric+export); Undo la set (toast 5s sus `#undoToast` cu bară countdown, restaurează rândul suprascris `prevRow`, variantă PR aurie); auto-backup zilnic rotativ 7 zile în IndexedDB `fitness-snapshots` (`maybeAutoSnapshot` la load, „Plasă de siguranță" în Setări→Backup cu Restaurează; snapshot-urile supraviețuiesc resetAll); calculator discuri la bară (`isBarbellEx`, `bar_weight` 20/15/10, greedy pe perechi); mini-istoric RIR 🥱💪😮‍💨 lângă ținta AZI
- Volum pe mușchi/săptămână (v80-81, flagship): panou în Istoric sub sumar, 9 grupe (`VOLUME_GROUPS`, mușchi din EXERCISE_DB via exId→nume→heuristică, secundari ½ set după `PATTERN_SECONDARY`), bare cu banda 10–20 Pelland evidențiată + axă 0/10/20 + legendă + hint auto din cel mai mare gol (`volumeHint`); exportul AI folosește același motor (`buildVolumePerGroup`)
- Progres: Calendar activitate (v83, heatmap GitHub 20 săpt., intensitate=tonaj în quartile proprii, tap→toast, streak curent+`getLongestStreak`) și Realizări (v84, 15 praguri sobre: deblocat teal+dată / bară progres, `buildAchievements`)
- Momente wow v82 (design: canvas „Rezumat si Digest"): Rezumatul zilei = card „ZI COMPLETĂ/ÎNCHEIATĂ" cu tonaj-erou gradient + count-up (`animateHero`, o dată/zi), chip delta vs sesiunea trecută, pastile `hud-*`, spotlight PR auriu, bare energie/somn; Digest = inel sesiuni SVG + volum-erou + delta % săpt. (`prevTonnage`/`target` în stats), bare segmentate, chips măsurători; imaginea de share PNG în aceeași compoziție (fără notele personale)
- v93: grain static SVG feTurbulence peste aure (`body::after` fix, opacity .05/.028 light — maschează banding pe OLED); intrarea `cardIn` la schimbarea tabului extinsă la TOATE tipurile de carduri (`.hist-card/.sgroup/.ghid-item/.prog-hud/.ai-panel/.meal-card/.morning-card/.rating-card`, în reduced-motion toate oprite); decizie: FĂRĂ stagger pe rândurile din liste (se rejoacă la fiecare tab-switch → frecare)
- Atmosferă globală (v92, anti-anost): aure radiale fixe în spatele întregii aplicații (`body::before` fix, html poartă `--bg`, body transparent — și pe light), hairline gradient + orb radial pe header (`.hdr::before/::after`), tick gradient cu glow pe toate `.stitle`, indicatorul nav-ului activ mutat sus cu gradient+glow + icon cu drop-shadow, `.chart-empty` cu ramă dashed + textură, focus rings accent pe toate inputurile (`.meas-in/.set-in/...:focus`), grupurile din Setări și Progres cu identitate de culoare pe iconițe (per-id) + glow pe grupul deschis (roșu la Zona periculoasă)
- Stunning pass restul (v91, canvas „Program si Restul" https://claude.ai/code/artifact/2b7de615-1aab-4ce7-95e6-f26b7e4cad62): tab Program = header HUD (`.prog-hud`, SĂPTĂMÂNA X/8 gradient, badge ciclu, 8 segmente cu glow) + zilele ierarhizate ca în Azi (azi=card-hero+badge AZI deschis, făcute=card-done comprimate, restul=card-idle; „— SĂRIT"→„NEFĂCUT") + plan 8 săpt. cu rândul curent evidențiat (ACUM) și ✓ pe făcute + pastile ținte Chakra; Azi-rest: strip pe cardul de dimineață (portocaliu→teal) și pe Stare de azi (mov), contor dimineață Chakra, checklist cu bară de progres (`#chkBar` în `updateChkCount`); Progres: PR-urile = clasament după 1RM (rang, top 3 auriu, locul 1 cu ramă gold, 1RM Chakra teal); wizard: „PASUL X/7" Chakra + segmente în loc de dots
- Stunning pass v86-v90: Azi = ierarhie dramatică (card-hero cu strip+glow+badge „ÎN LUCRU" pe primul incomplet, sb-future dashed pe seturile următoare, completele comprimate `.card-done:not(.open)`, idle dimmed, bara „PROGRESUL ZILEI" live `updateDayProgress`); Istoric = panou AI mov premium (`.ai-panel`, export box ascuns până la generare) + zile-carduri (`.hist-card`, coloană dată Chakra, micro-viz segmentată per exercițiu, tonaj dreapta, pastile seturi `S3 · 11×40 🏆`, ziua recentă deschisă); Progres = grafice cu `smoothPath` + gradient sub linie + glow blur + eticheta ultimei valori; Nutriție = `macroVisualHtml` (bară compoziție calorică + pastile cu % kcal) + mese pliabile (prima deschisă); Ghid = thumbnails `muscleThumb` (siluetă SVG cu grupa evidențiată din `volumeInfoFor`) în listă+bibliotecă+modal
- Utilizatori activi reali: owner (legacy) + iubita + prieteni (programe generate) — feedback-ul lor a condus ultimele fix-uri

**Următoarea fază (nefăcută): LANSAREA** — vezi Roadmap jos. Blocant: numele aplicației (owner-ul nu a decis).

## Fișiere

| Fișier | Rol |
|---|---|
| `index.html` | TOATĂ aplicația (HTML+CSS+JS, single-file, ES5-style, ~250KB) |
| `generator.js` | Generator de program personalizat + biblioteca de ~67 exerciții cu tag-uri și dovezi științifice. UMD: browser `window.ProgramGenerator` + Node (teste) |
| `test-generator.js` | Teste generator — `node test-generator.js` (555+ aserțiuni, trebuie 0 FAIL) |
| `sw.js` | Service worker — network-first pt HTML, cache-first restul |

## Reguli CRITICE de dezvoltare

1. **La ORICE modificare user-visible: bump `CACHE` în sw.js** — format `fitness-vNN-slug`. Fără bump, userii nu primesc update-ul.
2. **Validare JS după editare** (fișierul are 2 script-uri; îl validăm pe cel principal):
   ```bash
   node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const s=html.indexOf('<script>',html.indexOf('generator.js'));const e=html.lastIndexOf('</script>');new Function(html.substring(s+8,e));console.log('JS OK')"
   ```
3. **După modificări în generator.js**: rulează `node test-generator.js`.
4. **Test vizual**: preview server `fitness` din `.claude/launch.json` (părinte), viewport mobil 375px. Curăță SW+cache înainte de test (unregister + caches.delete + localStorage seed).
5. **Editările cu Python** (fișier mare): heredoc `python << 'EOF'` cu `io.open(...,encoding='utf-8')`; atenție la escaping backslash în onclick-uri generate.
6. **Programul owner-ului e "grandfathered"** — user cu date dar fără `custom_program` → programul standard hardcodat din index.html. NU-l strica niciodată.

## Modelul de date (localStorage)

- `fitness_jurnal_v1` = `{version:1, rows:[]}` — rânduri cu `type`:
  - `antrenament` {date(dd.mm.yyyy), day(LUNI..), exercise, set, reps, kg, note('PR:tip' la record)}
  - `checklist` / `dimineata` / `rir`(easy|ok|hard) / `exnote` — {exercise, note}
  - `rating` {exercise:'energy'|'sleep', note:'1'-'10'}
  - `skip` {exercise, note:motiv} — exercițiu sărit azi (dedup dată+exercițiu; `skipData` per zi)
  - `ratenote` {exercise:'energy'|'sleep', note:text} — notă liberă la starea zilei (apare în export)
  - `masuratoare` {weight, waist, neck, hip, chest, biceps, thigh, calf, note}
- `custom_program` = output-ul `generateProgram()` (exercises/schedule/morningRoutines/nutrition/checklist/ghid/meta) — aplicat la load peste definițiile statice
- `user_profile` = {sex, age, height, weight, experience, equipment, hasBara, days, goal, morningRoutine, name}
- `app_theme` = id temă accent ('' implicit / ocean / mov / roz / foc / verde) — aplicată de snippet-ul din `<head>` + `applyTheme()`; graficele/canvas folosesc `themeAcc()`/`themeAcc2()`
- `legacy_program`='1' = grandfathered · `program_cycle_start` = deload/cicluri · `manual_deload_until` = deload acceptat
- Poze de progres: IndexedDB `fitness-photos` · FSA handle (desktop): IndexedDB `fitness-fsa` · Snapshot-uri auto (7 zile): IndexedDB `fitness-snapshots` (tot localStorage-ul, cheie = data ISO)
- `bar_weight` = greutatea barei pt. calculatorul de discuri (20 implicit)
- Dedup: `addRow()` șterge rândul existent cu aceeași cheie (vezi `mergeRemote key()`)

## Arhitectura logică (în index.html)

- **Smart Coach**: `getRecommendation(ex, week, plannedSets)` — progresie pe săptămâni (1-2 baseline, 3-4 +rep, 5-6 +kg, 7 +set, 8 deload), modulată de RIR (easy→escaladare ⚡, hard→consolidare) și deload manual. `getLastPerformance(ex, excludeDate)` EXCLUDE ziua curentă (stabilitate în sesiune). Săpt. 7: setul extra e DOAR la primul ⭐ al zilei (caller-ul pasează `plannedSets`>0) — cardul din Azi primește slot S5 real (`aziAddSetIdx` + `effectiveSets(e,ei)`, folosite în render/saveSet/stats); restul ⭐ primesc „MENȚINE".
- **Cicluri**: `getCycleInfo()` — după săpt. 8 → ciclul 2 etc.; buton "Începe ciclul nou".
- **Accesorii (non-⭐)**: `getAccessoryRec` — double progression cu ținte explicite "Opțional azi: X rep × Y kg", modulată de RIR (hard→repetă, easy→+2 rep/⚡). Prompt-ul RIR apare la ORICE exercițiu cu progresie (`isRIRRelevant` exclude pași/stretching/mobilitate/plank).
- **Onboarding wizard**: `openWizard(prefill)` — 7 pași → `ProgramGenerator.generateProgram(profile)` → salvare + reload. X de închidere doar în reconfigure mode.
- **Nutriție**: legacy = mesele hardcodate (TON/PUI/OMAD); custom = calculator (Mifflin-St Jeor, afișat de `renderNutritionAuto`).
- **BF% Navy**: `calcBFNavy(waist,neck,height,sex,hip)` — femeile au formulă cu șolduri.
- **Rest timer**: deadline-based (merge în fundal), beep WebAudio, mod 'auto' = 90s izolări/150s ⭐.
- **Ghid**: modal `openGuideByName`/`openMorningGuide` + link YouTube; `MORNING_GUIDES` pentru cele 22 exerciții matinale.
- Backup: Share (Android PWA blochează file-share → fallback download `fitness-data dd.mm.yyyy.json`), import JSON, FSA sync doar desktop.

## Dovezi științifice (auditate 2020-2025)

Biblioteca și sfaturile citează studii reale: Maeo 2021/2023 (leg curl șezând, triceps overhead), Kassiano 2023/2025 (gambe stretch, biceps incline/preacher), Plotkin 2023 (hip thrust≈squat), Rodríguez-Ridao 2020 (înclinat 30°), Morton 2018 + Helms/Whittaker/Garthe/Schoenfeld/Hall (nutriție), Singer 2024 (pauze), Pelland 2025 (volum). NU exagera stretch-ul (tiebreaker, nu multiplicator).

## ROADMAP ACTIV (aug 2026, de la v77) — ordinea de execuție

Regulă: ecranele noi trec întâi prin Claude Design canvas (mockup-uri existente:
https://claude.ai/code/artifact/58262086-9997-4f03-b01a-eab993de04f9 — 4 artboard-uri
aprobate ca direcție). Ownerul NU face ajustări de design — Claude decide tot designul
singur, ownerul doar reacționează la rezultat. Mandat estetic: STUNNING, nu "AI/low
budget" — adâncime, atmosferă, momente wow; Pro HUD e baza, se împinge mai departe.

**✅ Faza 1 — QoL (FĂCUTĂ, v78-v85):** 1.1 „Sar azi" ✓ · 1.2 Undo la set ✓ · 1.3 Auto-backup silențios ✓ · 1.4 Calculator discuri ✓

**✅ Faza 2 — Next level (FĂCUTĂ, v80-v85):** 2.1 Volum pe mușchi vs banda 10–20 ✓ (flagship) · 2.2 Heatmap calendar + streak-uri ✓ · 2.3 Realizări ✓ · 2.4 Mini-istoric RIR ✓

**✅ Faza 3 — „Stunning pass" (FĂCUTĂ, v82-v90):** 3.1 Azi ✓ (erou+bara zilei, canvas „Azi Stunning Pass" https://claude.ai/code/artifact/64f05b7f-01f1-4b11-8cf4-23987bbf116f) · 3.2 Istoric ✓ (AI premium+zile-carduri, canvas https://claude.ai/code/artifact/070c73b6-e8b4-4516-828d-4d602794f3df) · 3.3 Progres ✓ (grafice gradient+glow) · 3.4 Nutriție ✓ (macro-split+mese pliabile) · 3.5 Rezumat & Digest ✓ v82 (canvas https://claude.ai/code/artifact/6424ff7b-6778-41c3-9067-338e7c75a597) · 3.6 Ghid ✓ (thumbnails = siluete SVG cu mușchiul evidențiat, `muscleThumb`/`thumbForExercise`; wizard-ul nu listează exerciții — nu se aplică)

**🏁 Faza 4 — Lansarea** (URMĂTOAREA; blocant: numele aplicației — decizia owner-ului; apoi secțiunea de mai jos)

## Roadmap rămas (faza LANSARE — plan detaliat)

1. **Nume aplicație** — brainstorm cu owner-ul; verifică disponibilitatea pe Play Store; apoi: title în index.html/manifest, iconiță nouă (SVG inline în manifest, actual e 🏋️ pe gradient teal), eventual splash
2. **Privacy policy** — pagină simplă `privacy.html` în repo (GitHub Pages o servește); conținut: toate datele stau local pe device (localStorage/IndexedDB), zero colectare/server/tracking, backup-ul e responsabilitatea userului; necesară pentru Play Console
3. **TWA packaging** — PWABuilder.com pe URL-ul live → generează AAB semnat; necesită `assetlinks.json` în repo la `.well-known/`; manifest-ul actual e valid PWA
4. **Play Console** — cont developer 25$ o dată; listing (screenshots din preview 375px, descriere RO), data safety = "no data collected", content rating questionnaire (fitness, fără user content), disclaimer medical există deja în wizard
5. **Post-lansare**: AdMob în rest timer (DOAR în wrapper TWA, nu în PWA), eventual engleză (i18n), teste cu utilizatori noi

Avantaj TWA: app-ul din Play e înveliș peste PWA — push pe main = update instant la toți, fără review Google per update.
