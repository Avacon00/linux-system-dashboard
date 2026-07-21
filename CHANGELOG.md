# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [Unreleased]

### Security
- Command Injection im Sandbox-Terminal behoben: `execute-terminal-command` nutzt jetzt
  `execFile()` statt `exec()` (kein `/bin/sh -c` mehr); bisher deklarierte, aber nie
  durchgesetzte Whitelist-Einschränkungen (`maxArgs`/`allowedFlags`/`allowedSubcommands`/
  `sudoRequired`) werden jetzt tatsächlich geprüft.
- XSS über `innerHTML` behoben: dynamische/externe Daten (AUR-Paketmetadaten,
  Terminal-Ein-/Ausgabe, Sicherheits-Events) werden vor dem Einsetzen escaped.
- Content-Security-Policy ergänzt; Chart.js wird lokal statt von einem CDN geladen.
- Verbleibende inline `onclick`-Handler durch `addEventListener` ersetzt.

### Added
- Jest-Testsuite (`__tests__/`) für die Terminal-Whitelist und `escapeHtml`.
- ESLint-Konfiguration; CI führt jetzt `npm run lint` und `npm test` als echte Gates aus
  (vorher: kein Lint, Test-Schritt war ein No-Op ohne vorhandenes `test`-Script).
- `SECURITY.md`, `.github/dependabot.yml`, `CODEOWNERS`, Issue-/PR-Templates,
  `CONTRIBUTING.md`.
- `config.js` zentralisiert die bisher über `renderer.js` verstreuten Update-Intervalle/
  Cache-Dauern/Limits (`APP_CONFIG`).
- Geschätzte Storage-/System-Temperaturen (ohne echte Sensordaten) werden jetzt mit „~"-Präfix
  und Tooltip als Schätzwert gekennzeichnet, statt wie eine exakte Messung auszusehen.

### Fixed
- Zwei Funktionen hießen beide `formatUptime` in `renderer.js`; die zweite Deklaration
  überschrieb die erste, wodurch die Haupt-Uptime-Anzeige das falsche Textformat zeigte.
- `originalText` wurde in `checkUpdates()`/`installUpdates()` im `try`-Block deklariert, aber
  im `finally`-Block referenziert und hätte dort einen `ReferenceError` geworfen.
- `searchTimeout` war fälschlich function-scoped und wurde im globalen `beforeunload`-Handler
  nie wirklich aufgeräumt.
- Mehrere doppelte Keys in `translations.js` (u. a. `openTerminal`/`openFileManager` mit
  unterschiedlichen Werten für Button- vs. Tipp-Text) behoben.
- `translations.js` fehlte in der `electron-builder` Datei-Whitelist (`package.json` →
  `build.files`), obwohl es zur Laufzeit benötigt wird.
- README-Versionsangaben (1.0.7/1.0.8) auf die tatsächliche Version korrigiert.

### Removed
- `temperature-worker.js` entfernt: ein nie instanziierter Web Worker (kein `new Worker(...)`
  im Code) mit einer zweiten, unbenutzten Kopie der Temperatur-Simulationslogik.
- Totes `installPackage`-IPC aus `preload.js` entfernt (kein passender Handler in `main.js`,
  nur `installPackageWithProgress` wird tatsächlich genutzt).
- Ungenutzte `getCpuStats()`-Funktion und weitere kompatibilitäts-Aliase in `renderer.js`
  entfernt.
- `toggle-firewall`-Handler in `main.js` von tief verschachtelten Callbacks auf async/await
  umgestellt.

## [1.0.9] und früher

Frühere Versionen wurden ohne strukturiertes Changelog entwickelt. Wesentliche Meilensteine
aus der Commit-Historie:

- Mehrsprachigkeit (Deutsch/Englisch) für die gesamte Oberfläche.
- Überarbeitetes Sicherheits-Center-UI und Performance-Optimierungen.
- Echtzeit-Netzwerkgeschwindigkeits-Monitoring.
- Erste stabile Version (`v1.0.0`) mit System-Monitoring, Paketverwaltung (pacman/AUR),
  Sicherheits-Center und Sandbox-Terminal.

Für Details siehe `git log`.
