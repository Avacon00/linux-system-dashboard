# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [1.0.7] - 2024-08-08

### Fixed
- **CPU-Kern Nummerierung korrigiert**:
  - Kerne werden jetzt als "Kern 1-16" statt "Kern 0-15" angezeigt
  - Korrekte IT-Standard Nummerierung (1-basiert statt 0-basiert)
  - Verbesserte CPU-Kern-Auslastung Berechnung mit /proc/stat

### Enhanced
- **CPU-Kern Anzeige verbessert**:
  - Korrekte Sortierung der CPU-Kerne nach Nummer
  - Zuverlässigere CPU-Kern-Auslastung Erkennung
  - Bessere Fallback-Mechanismen für CPU-Kern-Daten

### Technical
- Korrigierte CPU-Kern Indexierung in main.js und renderer.js
- Verbesserte /proc/stat Parsing für individuelle CPU-Kerne
- Sortierung der CPU-Kerne nach Kern-Nummer

## [1.0.6] - 2024-08-08

### Fixed
- **CPU-Auslastung Erkennung vollständig repariert**:
  - Korrigierte Regex-Pattern für deutsche Locale (Komma statt Punkt)
  - Mehrere Fallback-Methoden für robuste CPU-Erkennung
  - Verbesserte `/proc/stat` basierte CPU-Berechnung als primäre Methode
  - Automatische Behandlung verschiedener `top` Ausgabeformate

### Performance
- **Anwendung Performance deutlich verbessert**:
  - Reduzierte Update-Frequenz von 1s auf 2s Standard
  - Throttling für teure Operationen (Prozesse, Netzwerk)
  - Chart-Updates nur alle 2 Sekunden für bessere Performance
  - System-Info Caching für 1 Sekunde
  - Optimierte Chart-Rendering ohne Animationen

### Enhanced
- **Reduzierte Systemlast**:
  - Prozess-Updates nur alle 5 Sekunden
  - Netzwerk-Updates nur alle 10 Sekunden
  - Intelligente Throttling-Mechanismen
  - Verbesserte Reaktionszeit der Benutzeroberfläche

### Technical
- Neue Throttling-Funktionen in renderer.js
- Erweiterte CPU-Erkennung mit `/proc/stat` Fallback
- Optimierte Chart-Update-Logik
- Verbesserte Fehlerbehandlung für CPU-Berechnung

## [1.0.5] - 2024-08-08

### Fixed
- **Pacman Lock-Probleme behoben**:
  - Automatische Erkennung und Behandlung von pacman Lock-Dateien
  - Prüfung auf laufende pacman-Prozesse vor Update-Installation
  - Robuste Fehlerbehandlung für "Fehler beim Synchronisieren der Paketdatenbank"

### Added
- **Erweiterte Update-Installation mit Fortschrittsanzeige**:
  - Visueller Fortschrittsbalken während der Update-Installation
  - Schritt-für-Schritt Status-Updates ("1 von X Updates werden installiert")
  - Automatische Erkennung von Reboot-Anforderungen
  - System-Neustart Funktionalität mit Benutzerbestätigung

### Enhanced
- **Verbesserte Benutzer-Feedback**:
  - Detaillierte Erfolgs- und Fehlermeldungen
  - Optionale Reboot-Buttons nach Update-Installation
  - "Später neu starten" Option für flexible Systemverwaltung
  - Retry-Buttons bei Fehlern für einfache Wiederholung
  - Animierte Fortschrittsbalken mit Status-Updates

### Technical
- Neue `reboot-system` IPC-Handler in main.js
- Erweiterte `installUpdates()` Funktion mit Progress-Tracking
- Umfassende CSS-Styles für Progress-Bars und Feedback-Elemente
- Verbesserte Fehlerbehandlung mit spezifischen Fehlermeldungen
- Automatische Lock-Datei-Bereinigung vor Update-Operationen

## [1.0.4] - 2024-08-08

### Fixed
- **Update-Prüfung vollständig repariert**:
  - Automatische Synchronisation der Paketdatenbank vor Update-Prüfung
  - Korrekte Behandlung von "keine Updates verfügbar" (Exit Code 1)
  - Verbesserte Fehlerbehandlung und Benutzer-Feedback
  - Detaillierte Anzeige der verfügbaren Updates mit Versionsvergleich

### Added
- **Funktionale Update-Installation**:
  - Implementierung der "Updates installieren" Funktionalität
  - Sichere Ausführung von `sudo pacman -Syu --noconfirm`
  - Benutzer-Feedback während der Installation
  - Automatische Neuprufung nach Installation

### Enhanced
- **Verbesserte Update-Benutzeroberfläche**:
  - Farbkodierte Status-Anzeige (verfügbar/aktuell/Fehler)
  - Detaillierte Paket-Informationen mit Versionsvergleich
  - Zeitstempel der letzten Update-Prüfung
  - Hover-Effekte für bessere Benutzerinteraktion
  - Button-Status während Operationen (deaktiviert/Text-Änderung)

### Technical
- Neue `install-updates` IPC-Handler in main.js
- Erweiterte `checkUpdates()` Funktion mit besserer Fehlerbehandlung
- Verbesserte CSS-Styles für Update-Elemente
- Robuste Fallback-Mechanismen für verschiedene Fehlerszenarien

## [1.0.3] - 2024-08-08

### Added
- **Individuelle CPU-Kerne Anzeige**:
  - Detaillierte Ansicht der Auslastung jedes CPU-Kerns
  - Visuelle Fortschrittsbalken für jeden Kern
  - Responsive Grid-Layout für Kern-Anzeige
  - Echtzeit-Updates der Kern-Auslastung

- **Verbesserte CPU-Überwachung**:
  - Verwendung von /proc/stat für präzise Kern-Statistiken
  - Fallback-Mechanismus für Systeme ohne detaillierte Kern-Daten
  - Bessere Performance durch optimierte Datenabfrage

### Enhanced
- **CPU-Monitoring erweitert**:
  - Separate Anzeige für Gesamt-CPU und individuelle Kerne
  - Farbkodierte Fortschrittsbalken für bessere Übersicht
  - Hover-Effekte für bessere Benutzerinteraktion

### Technical
- Neue `updateCpuCoresDisplay()` Funktion in renderer.js
- Erweiterte CPU-Datenstruktur in main.js mit `coresData`
- CSS-Styling für CPU-Kerne Grid-Layout
- Robuste Fallback-Mechanismen für verschiedene Systeme

## [1.0.2] - 2024-08-08

### Fixed
- **CPU-Auslastung Problem behoben**:
  - NaN-Werte in CPU-Anzeige korrigiert
  - Mehrere Methoden für CPU-Auslastung implementiert (top, /proc/loadavg, systeminformation)
  - Bessere Fehlerbehandlung für ungültige Werte

- **Chart-Darstellung verbessert**:
  - Charts werden mit initialen Datenpunkten initialisiert
  - Bessere Animation und Performance
  - Füllung der Chart-Bereiche hinzugefügt

- **Disk-Anzeige verbessert**:
  - CSS für Disk-Bars hinzugefügt
  - Bessere visuelle Darstellung der Festplattennutzung

## [1.0.1] - 2024-08-08

### Fixed
- **Kritische Sicherheitslücke behoben**: Electron-Konfiguration modernisiert
  - `nodeIntegration: false` und `contextIsolation: true` aktiviert
  - Sichere preload.js für IPC-Kommunikation implementiert
  - Veraltete `enableRemoteModule` entfernt

- **Dependency-Probleme behoben**:
  - Nicht existierendes `node-ps` Paket entfernt
  - Ungenutztes `node-ssh` Paket entfernt
  - Nur benötigte Dependencies beibehalten

- **Icon-Problem behoben**:
  - Funktionierendes PNG-Icon erstellt
  - SVG-Quelle hinzugefügt
  - ImageMagick-Konvertierung implementiert

- **Fehlerbehandlung verbessert**:
  - Input-Validierung für Paketinstallation hinzugefügt
  - SQL-Injection-Schutz implementiert
  - Bessere Fehlerbehandlung in setup.sh

- **Code-Qualität verbessert**:
  - Sichere IPC-Kommunikation über preload.js
  - Bessere Service-Status-Behandlung
  - Konsistente API-Nutzung

### Security
- Electron-Sicherheitskonfiguration modernisiert
- Input-Validierung für alle Benutzereingaben
- Sichere IPC-Kommunikation implementiert

### Technical
- Preload.js für sichere Main-Renderer-Kommunikation
- Verbesserte Fehlerbehandlung
- Bessere Dependency-Verwaltung

## [1.0.0] - 2024-08-08

### Added
- Initiale Version des Linux System Dashboards
- System-Monitoring mit Echtzeit-Grafiken
- Software-Management über GUI
- Lernbereich mit Terminal-Simulator
- Moderne VS Code-ähnliche UI
