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
