# 🦊 Rechen-Fuchs

Plus und Minus üben für die 2. Klasse – als kleine Web-App, die auf dem iPhone wie eine echte App läuft (Vollbild, offline).

## Was die App kann

- **Immer nur zwei Zahlen** (z. B. `47 + 36`, `82 − 37`), Zahlen bis 100, zwischendurch auch über 100 hinaus.
- **Passt sich an:** Sind die Aufgaben zu leicht, werden sie langsam schwerer. Fehler machen die nächsten Aufgaben wieder leichter. Ziel: etwa **95 % richtige Antworten**, damit die Motivation bleibt.
- **Hilfe-Knopf 💡:** zeigt das Rechnen in Zehnerschritten (halbschriftlich) mit Zehnerstangen und Einerwürfeln, z. B. `82 − 37` → `82 − 30 = 52` → `52 − 2 = 50` → `50 − 5 = 45`.
- **Steigerung:** gleiche Zahlen bis 10 mehrfach addieren (`3 + 3 + 3 + 3 + 3`). Die Hilfe zeigt die Gruppen, zählt in Dreier-Schritten (3 – 6 – 9 – 12 – 15) und führt zur Mal-Aufgabe `5 · 3 = 15`.
- Ein Fehlversuch ist erlaubt („Versuch es noch einmal“); beim zweiten Fehler zeigt die App die Lösung samt Hilfe.
- Runden mit 10 Aufgaben, Sterne, Konfetti. Fortschritt wird auf dem Gerät gespeichert.

## Auf das iPhone bringen

1. Dieses Repository auf GitHub hochladen.
2. Im Repository: **Settings → Pages → Branch `main`, Ordner `/ (root)`** → Speichern.
3. Nach ca. 1 Minute ist die App erreichbar unter `https://<DEIN-NAME>.github.io/<REPO-NAME>/`.
4. Auf dem iPhone in **Safari** öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**.

Danach startet die App per Fuchs-Symbol im Vollbild und funktioniert auch ohne Internet.

> Tipp: Das Repository sollte öffentlich sein (bei kostenlosen GitHub-Konten nötig für Pages). Es stehen keine persönlichen Daten darin – der Spielstand liegt nur im Browserspeicher des iPhones.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `logic.js` | Aufgabenerzeugung, Schwierigkeitsanpassung (Ziel 95 %), Hilfeschritte |
| `app.js` | Oberfläche, Zahlenfeld, Hilfe-Ansicht |
| `style.css` | Kindgerechtes Aussehen |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Offline-Betrieb und Home-Bildschirm-Symbol |

Stellschrauben für die Schwierigkeit stehen in `logic.js` in der Funktion `update` (Schrittweiten) und in `build`/`TIERS` (Aufgabenstufen).
