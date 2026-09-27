# Fitness Jurnal

Jurnal de antrenament cu antrenor inteligent, în limba română. Funcționează ca aplicație instalabilă (PWA) și offline.

**Deschide aplicația:** https://crstefan-lab.github.io/fitness-jurnal/

## Ce face

- Îți generează un program personalizat de 8 săptămâni, pe 2–6 zile, după echipament, experiență și obiectiv.
- Îți spune la fiecare exercițiu ce greutate și câte repetări să încerci azi, pe baza sesiunilor trecute.
- Ține evidența seturilor, recordurilor, măsurătorilor corporale și a pozelor de progres.
- Calculează caloriile și macronutrienții pe baza greutății tale actuale.

## Datele tale

Totul stă doar pe telefonul tău. Aplicația nu are server, cont sau tracking. Detalii în [politica de confidențialitate](https://crstefan-lab.github.io/fitness-jurnal/privacy.html).

## Dezvoltare

Aplicația e un singur fișier `index.html`, plus `generator.js` pentru programe și `sw.js` pentru modul offline. Testele generatorului rulează cu:

```bash
node test-generator.js
```

## English

Fitness Jurnal is a workout journal with a smart coach. It builds a personalized 8-week program for 2–6 days a week, tells you what weight and reps to try for each exercise, and tracks sets, records, body measurements, and progress photos. All data stays on your phone. The app follows your phone's language, and you can switch between Romanian and English in Settings.
