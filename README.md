# 🚀 Linux System Dashboard

<div align="center">

**Ein modernes, benutzerfreundliches System-Dashboard für Linux**

[![Build Status](https://github.com/Avacon00/linux-system-dashboard/workflows/Build%20and%20Release/badge.svg)](https://github.com/Avacon00/linux-system-dashboard/actions)
[![Release](https://img.shields.io/github/v/release/Avacon00/linux-system-dashboard)](https://github.com/Avacon00/linux-system-dashboard/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/Avacon00/linux-system-dashboard/total)](https://github.com/Avacon00/linux-system-dashboard/releases)
[![License](https://img.shields.io/github/license/Avacon00/linux-system-dashboard)](LICENSE)

[🎯 Ein-Klick Installation](#-installation) • [✨ Features](#-features) • [📝 Entwicklung](#-entwicklung) • [🌐 Website](https://schuttehub.de)

</div>

---

## 📦 Installation

### 🎯 **Einfachste Installation** (Empfohlen)

Ein einziger Befehl installiert alles automatisch:

```bash
curl -fsSL https://schuttehub.de/install | bash
```

### 📱 **AppImage** (Direkt-Download)

1. **Download:** [Latest Release](https://github.com/Avacon00/linux-system-dashboard/releases/latest) 
2. **Ausführbar machen:** `chmod +x Linux-System-Dashboard-x64.AppImage`
3. **Starten:** `./Linux-System-Dashboard-x64.AppImage`

## 🚀 Features

### 📊 System-Übersicht
- **Live CPU/RAM/Festplatten-Monitoring** mit Echtzeit-Grafiken
- **Prozess-Liste** mit detaillierten Informationen
- **Netzwerk-Status** und aktive Verbindungen
- **System-Details** (OS-Version, Hostname, etc.)

### ⚡ Schnellaktionen
- **System-Updates** prüfen und installieren
- **Software-Installation** mit GUI für pacman
- **Dienste-Management** (starten/stoppen)
- **Firewall-Status** und Konfiguration
- **Schnellzugriff** auf Terminal, Dateimanager, etc.

### 📚 Lernbereich
- **"Befehl des Tages"** mit Erklärungen
- **Häufige Probleme** und deren Lösungen
- **Tutorial-Links** zu guten Linux-Ressourcen
- **Terminal-Simulator** für sichere Übungen

### 🎨 Design
- **Modernes VS Code-ähnliches Design**
- **Dunkles Theme** für bessere Augen
- **Responsive Layout** für verschiedene Bildschirmgrößen
- **Deutsch/Englisch Support**

## 🛠️ Schnellinstallation für Arch Linux

### Voraussetzungen
- Arch Linux (oder kompatible Distribution)
- Internetverbindung für Downloads

### Einfache Installation (Empfohlen)

```bash
# 1. Repository klonen oder herunterladen
git clone <repository-url>
cd linux-system-dashboard

# 2. Einfache Installation ausführen
chmod +x setup.sh
./setup.sh
```

**Das war's!** Das Dashboard ist jetzt installiert und kann gestartet werden.

### Alternative: Manuelle Installation

```bash
# 1. Abhängigkeiten installieren
sudo pacman -S --needed nodejs npm htop net-tools iproute2 ufw

# 2. Node.js Abhängigkeiten installieren
npm install

# 3. Desktop-Integration erstellen
sudo mkdir -p /usr/local/bin /usr/local/share/applications
sudo ln -sf "$(pwd)/node_modules/.bin/electron" /usr/local/bin/linux-system-dashboard
sudo cp linux-system-dashboard.desktop /usr/local/share/applications/
sudo update-desktop-database /usr/local/share/applications

# 4. Optional: Sudo-Rechte für pacman
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/pacman" | sudo tee -a /etc/sudoers.d/linux-dashboard
```

## 🎯 Verwendung

### Dashboard starten
```bash
# Über Terminal
linux-system-dashboard

# Oder über Anwendungsmenü
# Suchen Sie nach "Linux System Dashboard"
```

### Entwicklung
```bash
# Entwicklungsmodus starten
npm run dev

# Build erstellen
npm run build
```

### System-Monitoring
1. Öffne das Dashboard
2. Gehe zum "System-Info" Tab
3. Überwache CPU, RAM und Festplatten in Echtzeit
4. Schaue dir laufende Prozesse an

### Software-Management
1. Gehe zum "Schnellaktionen" Tab
2. Prüfe verfügbare Updates
3. Installiere neue Software über das Eingabefeld
4. Verwalte System-Dienste

### Lernen
1. Gehe zum "Lernbereich" Tab
2. Lerne den "Befehl des Tages"
3. Schaue dir häufige Probleme an
4. Nutze den Terminal-Simulator

## 🗑️ Deinstallation

```bash
# Saubere Deinstallation
chmod +x uninstall.sh
./uninstall.sh
```

## 📦 Abhängigkeiten

### Automatisch installiert
- **Node.js** - JavaScript Runtime
- **Electron** - Desktop-App-Framework
- **systeminformation** - System-Monitoring
- **Chart.js** - Grafiken und Charts
- **htop, net-tools, iproute2** - System-Tools

### Optional
- **ImageMagick** - Für Icon-Generierung
- **ufw** - Firewall-Management

## 🐛 Troubleshooting

### Häufige Probleme

**App startet nicht:**
```bash
# Node.js-Version prüfen
node --version

# Abhängigkeiten neu installieren
rm -rf node_modules package-lock.json
npm install
```

**System-Informationen werden nicht angezeigt:**
```bash
# Berechtigungen prüfen
ls -la /proc/

# systeminformation-Paket prüfen
npm list systeminformation
```

**Updates funktionieren nicht:**
```bash
# Pacman-Datenbank aktualisieren
sudo pacman -Sy

# Sudo-Rechte prüfen
sudo pacman -Qu
```

**Desktop-Shortcut funktioniert nicht:**
```bash
# Desktop-Datenbank aktualisieren
sudo update-desktop-database /usr/local/share/applications

# Symlink prüfen
ls -la /usr/local/bin/linux-system-dashboard
```

## 🔒 Sicherheit

- Die App führt nur sichere System-Befehle aus
- Keine Root-Rechte für normale Operationen
- Terminal-Simulator ist isoliert
- Alle Aktionen sind transparent und protokolliert

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Mache deine Änderungen
4. Teste gründlich
5. Erstelle einen Pull Request

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🙏 Danksagungen

- Arch Linux Community
- Electron Team
- Chart.js Entwickler
- Alle Open Source Beiträger

## 📞 Support

Bei Problemen oder Fragen:
- Erstelle ein Issue auf GitHub
- Schaue in die Dokumentation
- Kontaktiere die Community

---

**Entwickelt mit ❤️ für die Linux-Community**
