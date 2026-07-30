# Fitness Jurnal — PWA de antrenament (8 săptămâni)

App personal devenit multi-user, în drum spre Google Play. Limba: **română only**.

- **Live**: https://crstefan-lab.github.io/fitness-jurnal/ (GitHub Pages, repo `CRStefan-lab/fitness-jurnal`)
- **Push pe `main` = deploy instant** — PWA-ul tuturor userilor se auto-actualizează (banner "Versiune nouă")

## Stare curentă (iulie 2026, SW `fitness-v44`)

Aplicația e **feature-complete** ca "antrenor în buzunar", construită integral în sesiuni Claude Code:
- Jurnal complet (seturi rep×kg, pre-fill, steppers, PR detection, edit/backdate, note per exercițiu)
- Smart Coach adaptiv: progresie 8 săpt. + cicluri, modulare RIR (ușor/ok/limită), auto-deload la stagnare+energie mică, încălzire calculată, ținte explicite și la accesorii ("Opțional azi: X rep × Y kg")
- Onboarding wizard 7 pași → program generat (generator.js, 67 exerciții, 3 profile echipament, dovezi 2020-2025)
- Nutriție: calculator TDEE/macros pt useri generați + mesele hardcodate pt owner + secțiune "De ce aceste numere?" cu citări
- Progres: măsurători + BF% Navy (M/F) + grafice + recomp verdict + poze progres (IndexedDB) + PR-uri + 1RM
- Retenție: streak 🔥 în header, digest săptămânal cu imagine share-abilă (canvas PNG)
- Ghid: modal 📖/❓ pe orice exercițiu (inclusiv 22 matinale) + link video YouTube + principii dovedite
- Rest timer fundal (deadline-based) + beep + mod auto 90s/150s⭐
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
  - `masuratoare` {weight, waist, neck, hip, chest, biceps, thigh, calf, note}
- `custom_program` = output-ul `generateProgram()` (exercises/schedule/morningRoutines/nutrition/checklist/ghid/meta) — aplicat la load peste definițiile statice
- `user_profile` = {sex, age, height, weight, experience, equipment, hasBara, days, goal, morningRoutine}
- `legacy_program`='1' = grandfathered · `program_cycle_start` = deload/cicluri · `manual_deload_until` = deload acceptat
- Poze de progres: IndexedDB `fitness-photos` · FSA handle (desktop): IndexedDB `fitness-fsa`
- Dedup: `addRow()` șterge rândul existent cu aceeași cheie (vezi `mergeRemote key()`)

## Arhitectura logică (în index.html)

- **Smart Coach**: `getRecommendation(ex, week)` — progresie pe săptămâni (1-2 baseline, 3-4 +rep, 5-6 +kg, 7 +set, 8 deload), modulată de RIR (easy→escaladare ⚡, hard→consolidare) și deload manual. `getLastPerformance(ex, excludeDate)` EXCLUDE ziua curentă (stabilitate în sesiune).
- **Cicluri**: `getCycleInfo()` — după săpt. 8 → ciclul 2 etc.; buton "Începe ciclul nou".
- **Accesorii (non-⭐)**: `getAccessoryRec` — double progression cu ținte explicite "Opțional azi: X rep × Y kg".
- **Onboarding wizard**: `openWizard(prefill)` — 7 pași → `ProgramGenerator.generateProgram(profile)` → salvare + reload. X de închidere doar în reconfigure mode.
- **Nutriție**: legacy = mesele hardcodate (TON/PUI/OMAD); custom = calculator (Mifflin-St Jeor, afișat de `renderNutritionAuto`).
- **BF% Navy**: `calcBFNavy(waist,neck,height,sex,hip)` — femeile au formulă cu șolduri.
- **Rest timer**: deadline-based (merge în fundal), beep WebAudio, mod 'auto' = 90s izolări/150s ⭐.
- **Ghid**: modal `openGuideByName`/`openMorningGuide` + link YouTube; `MORNING_GUIDES` pentru cele 22 exerciții matinale.
- Backup: Share (Android PWA blochează file-share → fallback download `fitness-data dd.mm.yyyy.json`), import JSON, FSA sync doar desktop.

## Dovezi științifice (auditate 2020-2025)

Biblioteca și sfaturile citează studii reale: Maeo 2021/2023 (leg curl șezând, triceps overhead), Kassiano 2023/2025 (gambe stretch, biceps incline/preacher), Plotkin 2023 (hip thrust≈squat), Rodríguez-Ridao 2020 (înclinat 30°), Morton 2018 + Helms/Whittaker/Garthe/Schoenfeld/Hall (nutriție), Singer 2024 (pauze), Pelland 2025 (volum). NU exagera stretch-ul (tiebreaker, nu multiplicator).

## Roadmap rămas (faza LANSARE — plan detaliat)

1. **Nume aplicație** — brainstorm cu owner-ul; verifică disponibilitatea pe Play Store; apoi: title în index.html/manifest, iconiță nouă (SVG inline în manifest, actual e 🏋️ pe gradient teal), eventual splash
2. **Privacy policy** — pagină simplă `privacy.html` în repo (GitHub Pages o servește); conținut: toate datele stau local pe device (localStorage/IndexedDB), zero colectare/server/tracking, backup-ul e responsabilitatea userului; necesară pentru Play Console
3. **TWA packaging** — PWABuilder.com pe URL-ul live → generează AAB semnat; necesită `assetlinks.json` în repo la `.well-known/`; manifest-ul actual e valid PWA
4. **Play Console** — cont developer 25$ o dată; listing (screenshots din preview 375px, descriere RO), data safety = "no data collected", content rating questionnaire (fitness, fără user content), disclaimer medical există deja în wizard
5. **Post-lansare**: AdMob în rest timer (DOAR în wrapper TWA, nu în PWA), eventual engleză (i18n), teste cu utilizatori noi

Avantaj TWA: app-ul din Play e înveliș peste PWA — push pe main = update instant la toți, fără review Google per update.
