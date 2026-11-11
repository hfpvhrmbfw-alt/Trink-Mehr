# Vergießmeinnicht

Eine kleine Trink-App für das iPhone, nur für den persönlichen Gebrauch. Jeden Morgen steht ein Kübel mit frischer Erde da. Mit jedem Glas Wasser wächst eine Überraschungspflanze. Am nächsten Tag steht sie mit Datum im Beet.

## Was Version 1 kann

- Heute-Ansicht als Szene mit Tageszeiten: Sonne, Wolken, Glühwürmchen, Sterne und die echte Mondphase.
- Eintragen über drei Tropfen (Größen einstellbar), Rückgängig fünf Sekunden lang.
- 18 Pflanzenarten in fünf Wachstumsstufen. Die Pflanze wächst mit jedem Glas sichtbar.
- Beet mit Steckschildern. Hängepflanzen hängen am Haken. Ab drei leeren Tagen am Stück entsteht eine Wiese.
- Tagesdetails mit allen Einträgen. Heute und gestern lassen sich ändern.
- Profil und Tagesziel nach den Richtwerten der DGE, drei Stufen und eine eigene Menge.
- Zuschlag für Sport und heiße Tage.
- Zaun- und Beetfarben zum Freischalten. Es zählen Gartentage insgesamt, nie eine Serie.
- Sicherung speichern und einspielen, Erinnerung an die Sicherung alle 30 Tage.

Noch nicht dabei: Sammelbuch, seltene Arten, Jahreszeiten, Töne, Wochenstrauß, Wunschsamen, Durst-Anzeige.

## Starten

ES-Module brauchen einen Server, `file://` geht nicht.

```
npx serve .
```

Zum Ausprobieren der Tageszeiten: `?stunde=7`, `?stunde=13`, `?stunde=19` oder `?stunde=23` an die Adresse hängen.

## Aufs iPhone

1. Die Adresse der App in Safari öffnen (GitHub Pages).
2. Teilen, dann „Zum Home-Bildschirm“.
3. Vom Icon starten. Die App läuft danach auch ohne Netz.

### Erinnerungen

Eine Web-App darf auf dem iPhone keine Mitteilungen planen. Der Umweg:

1. Kurzbefehle-App öffnen, unten „Automation“, dann „Neue Automation“.
2. „Tageszeit“ wählen, zum Beispiel 10 Uhr, täglich, „Sofort ausführen“.
3. Aktion „Mitteilung anzeigen“ mit einem Text wie „Dein Kübel hat Durst“.
4. Für weitere Uhrzeiten wiederholen.

## Aufbau

| Datei | Schicht | Aufgabe |
| --- | --- | --- |
| `src/model.js` | Modell | Datentypen, Standardwerte, Validierung, Export, Import, Migration |
| `src/catalog.js` | Katalog | Pflanzen-Rezepte, DGE-Tabelle, Zuschläge, Belohnungsschwellen, Farben |
| `src/logic.js` | Logik | reine Funktionen: Tagesziel, Stufen, Art würfeln, Beet-Reihenfolge, Mondphase |
| `src/storage.js` | Speicher | IndexedDB mit localStorage als Ersatz |
| `src/texts.js` | Texte | Namen, Beschriftungen, Sätze des Kübels |
| `src/plants.js` | Oberfläche | zeichnet Pflanzen und Kübel als SVG |
| `src/scene.js` | Oberfläche | Heute-Szene |
| `src/beet.js` | Oberfläche | Beet |
| `src/main.js` | Oberfläche | Start, Aktionen, Dialoge. Einzige Stelle, die die Uhr liest |

Modell und Logik kennen weder Browser noch Uhr. `docs/SWIFT.md` beschreibt den Umzug nach Swift.

## Tests

```
npm test
```

Testfälle liegen als JSON in `tests/fixtures/` und sind für spätere Swift-Tests gedacht.

Nach jeder Änderung an einer Datei der App `VERSION` in `sw.js` hochzählen, sonst laden installierte Apps die neuen Dateien nicht.

## Quellen

- Richtwerte Wasser: D-A-CH-Referenzwerte für die Nährstoffzufuhr 2018 (Deutsche Gesellschaft für Ernährung), [Tabelle](https://www.vis.bayern.de/essen_trinken/ernaehrungsformen/doc/richtwerte_fuer_zufuhr_wasser_akt.pdf).
- Sport: 0,5 bis 1,5 Liter Flüssigkeitsverlust je Stunde, [Verbraucherzentrale](https://www.verbraucherzentrale.de/wissen/lebensmittel/gesund-ernaehren/trinken-bei-hitze-so-decken-sie-ihren-fluessigkeitsbedarf-an-heissen-tagen-12868). Die App rechnet mit der unteren Grenze.
- Hitze: keine feste Zahl, [DGE](https://www.dge.de/blog/2025/essen-und-trinken-bei-hitze/). Die 500 ml sind eine eigene, vorsichtige Stufe der App.
- „Sanft“ (80 %) und „Reichlich“ (2.000 ml) sind eigene Stufen der App, keine Empfehlung einer Quelle.

Die App ersetzt keinen ärztlichen Rat. Alle Pflanzen sind selbst gezeichnet (Code im Repository).
