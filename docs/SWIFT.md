# Umzug nach Swift

Ziel der Swift-App: echte Mitteilungen mit Knopf „+250 ml“, Widget, Haptik. Der Kern zieht unverändert um.

| Datei | Schicht | In Swift |
| --- | --- | --- |
| `src/model.js` | Modell | 1:1 als `struct` mit `Codable`, gleiche Validierung |
| `src/catalog.js` | Katalog | als `catalog.json` ins Bundle |
| `src/logic.js` | Logik | 1:1 als reine Funktionen |
| `tests/fixtures/*.json` | Tests | unverändert in XCTest laden |
| `src/storage.js` | Speicher | neu: SwiftData oder JSON-Datei, gleiche Schnittstelle |
| `src/texts.js` | Texte | String Catalog |
| `src/plants.js` | Oberfläche | neu: Zeichner mit `Path` in SwiftUI `Canvas`, gleiche Rezepte |
| `src/scene.js`, `src/beet.js`, `src/main.js` | Oberfläche | neu in SwiftUI |
| Erinnerungen | fehlt in der PWA | `UNUserNotificationCenter` mit Aktion |

## Datentypen

```swift
struct Entry: Codable { var id: String; var time: String; var ml: Int }          // time "HH:mm"
struct Day: Codable {
  var day: String            // "yyyy-MM-dd"
  var speciesId: String
  var potId: Int             // 0...4
  var goalMl: Int            // Ziel dieses Tages ohne Zuschlag
  var sportMin: Int
  var heat: Bool
  var entries: [Entry]
}
enum Level: String, Codable { case sanft, richtwert, reichlich, frei }
enum Special: String, Codable { case schwanger, stillend }
struct Settings: Codable {
  var onboarded: Bool; var potName: String
  var birthYear: Int?; var weightKg: Int?; var special: Special?
  var level: Level; var customGoalMl: Int; var sizes: [Int]
  var pot: String; var bed: String; var unlocked: [String]   // "pot:salbei" (alte Sicherungen: "fence:…" wird zu "pot:…")
  var lastBackupDay: String?
}
```

## Datumsregel

Ein Tag ist der lokale Kalendertag als Text `yyyy-MM-dd`. Für Rechnungen wird daraus eine ganze Zahl (Tage seit 1970, UTC), siehe `dayToNum`. Die Logik liest nie die Uhr: „heute“, Stunde und Jahr kommen als Parameter.

## Zufall

`pickSpecies` nutzt einen festen Startwert aus dem Datum (FNV-1a-Hash, dann mulberry32). In Swift mit `UInt32` und überlaufender Rechnung (`&*`, `&+`) nachbauen, dann liefern beide Apps dieselbe Art für denselben Tag. Der Test „Art würfeln“ sichert das ab.

## Austauschformat

Die Sicherung ist JSON: `{ app, version, exportedAt, settings, days }`. Die Swift-App liest dieselbe Datei. Höhere `version` wird abgelehnt, ältere über `upgradeRaw` angehoben.
