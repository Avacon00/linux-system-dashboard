# 🚀 Linux System Dashboard

<div align="center">

![Linux System Dashboard](assets/icon-512.png)

**Das modernste und einfachste System-Dashboard für Linux**

[![Release](https://img.shields.io/github/v/release/Avacon00/linux-system-dashboard)](https://github.com/Avacon00/linux-system-dashboard/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/Avacon00/linux-system-dashboard/total)](https://github.com/Avacon00/linux-system-dashboard/releases)
[![License](https://img.shields.io/github/license/Avacon00/linux-system-dashboard)](LICENSE)

**⬇️ [AppImage Download](#-appimage-download) • [✨ Features](#-features) • [🚀 Website](https://schuttehub.de)**

</div>

---

## 🚀 **Die einfachste Art, ein Linux System-Dashboard zu verwenden!**

### 🎯 **AppImage - Ein-Datei-Lösung** (Empfohlen)

**Warum AppImage?**
- ✅ **Kein Installieren** nötig
- ✅ **Keine Dependencies** 
- ✅ **Funktioniert auf JEDER** Linux-Distribution
- ✅ **Kein sudo/root** erforderlich
- ✅ **Download → Start → Fertig!**

#### 📦 **AppImage Download:**

**[>> Download Linux-System-Dashboard-1.0.7.AppImage <<](https://github.com/Avacon00/linux-system-dashboard/releases/latest)**

```bash
# 1. Download (oder Browser-Download)
wget https://github.com/Avacon00/linux-system-dashboard/releases/latest/download/Linux-System-Dashboard-1.0.7.AppImage

# 2. Ausführbar machen
chmod +x Linux-System-Dashboard-1.0.7.AppImage

# 3. Starten
./Linux-System-Dashboard-1.0.7.AppImage
```

**Das war's!** 🎉 Keine Installation, keine Konfiguration, keine Probleme!

---

## ✨ **Was macht dieses Dashboard besonders?**

<table>
<tr>
<td width="50%">

### 📊 **System-Monitoring**
- ⚡ **Echtzeit-Metriken** für CPU, RAM, Disk, Netzwerk
- 📊 **Interaktive Charts** (performance-optimiert)
- 🔥 **Pro-Core CPU-Monitoring**
- 🌡️ **Temperatur-Überwachung**
- 🔄 **Intelligentes Update-System** (3-10s konfigurierbar)

### 🛡️ **Sicherheits-Center**
- 🔍 **Umfassende Sicherheits-Scans** (SSH, Fail2Ban, Ports)
- 🚫 **Fail2Ban Integration** mit Live-Status
- 🌐 **Netzwerk-Scanner** mit Geräte-Erkennung
- 🕵️ **Rootkit-Detection** mit verdächtigen Datei-Checks
- 📋 **Live Security-Events** aus System-Journal
- 🔒 **Paket-Audit** für verwaiste Pakete
- 🛡️ **Sicherheits-Update-Checker**

</td>
<td width="50%">

### 📦 **Paket-Management**
- 🎯 **Ein-Klick Software-Installation** mit Echtzeit-Fortschritt
- 🔄 **System-Update-Manager** mit automatischer Erkennung
- 🎆 **Arch Linux & AUR Support** (pacman + yay Integration)
- 🔍 **Intelligente Software-Suche** mit Relevanz-Sortierung
- 📊 **Live-Progress-Tracking** bei Package-Installation

### 🎓 **Für Linux-Einsteiger**
- 💫 **80+ sichere Linux-Befehle** lernen
- 📚 **Tutorials & Links** zu Linux-Ressourcen
- 🔧 **Problem-Lösungsguide**
- 💻 **Sicheres Terminal** mit Whitelist-Schutz
- 🔒 **Command-Validation** verhindert gefährliche Befehle
- 📜 **Terminal-History** mit Memory-Management

### 🚀 **Performance**
- 💾 **Nur ~45MB RAM** im Betrieb (Memory-Leak-frei)
- ⚡ **<2% CPU-Last** durchschnittlich
- 📈 **70% weniger API-Calls** durch Smart-Caching
- 🎯 **Chart-Optimierung** mit Batch-Rendering
- 🧹 **Automatische Resource-Cleanup** bei App-Exit
- 📊 **Terminal-History-Limit** verhindert Memory-Bloat

</td>
</tr>
</table>

---

## ⚙️ **System-Anforderungen**

- 🐧 **Linux-Distribution:** Alle (Ubuntu, Fedora, Arch, openSUSE, Debian, etc.)
- 💾 **RAM:** Mindestens 512MB (empfohlen: 1GB+)
- 💻 **CPU:** x86_64 (64-bit)
- 📋 **Desktop:** Beliebige Desktop-Umgebung

**Getestet auf:**
- ✅ Arch Linux
- ✅ Ubuntu 20.04+
- ✅ Fedora 35+
- ✅ openSUSE Leap/Tumbleweed
- ✅ Debian 11+

---

## 🚀 **Für Entwickler**

<details>
<summary>📝 <strong>Entwickler-Setup</strong> (Klicken zum Erweitern)</summary>

### Voraussetzungen
- **Node.js** >= 16.x
- **npm** >= 8.x
- **Electron** >= 28.x

### Setup
```bash
# Repository klonen
git clone https://github.com/Avacon00/linux-system-dashboard.git
cd linux-system-dashboard

# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# AppImage bauen
npm run build-appimage

# Debian-Paket bauen
npm run build-deb
```

### Build-Befehle
```bash
npm run dev           # Development mit Hot-Reload
npm run build-appimage # AppImage erstellen
npm run build-deb      # .deb-Paket erstellen
npm run dist-linux     # Alle Linux-Formate
```

### Performance-Features
- ✅ **Smart Lazy Loading** - Tab-basierte Aktualisierung
- ✅ **Intelligent Caching** - 70% weniger API-Calls  
- ✅ **Chart-Optimierung** - Batch-Rendering mit RequestAnimationFrame
- ✅ **Memory-Management** - DocumentFragment-basierte DOM-Updates
- ✅ **Process-Throttling** - Konfigurierbare Update-Intervalle
- ✅ **Memory-Leak-Prevention** - Comprehensive Resource Cleanup
- ✅ **Terminal-History-Limiting** - Max 100 Lines für Performance
- ✅ **Toast-Notification-Stacking** - Efficient Message Management

</details>

---

## 🤝 **Community & Support**

### 🐛 **Bug Reports**
Gefunden einen Bug? [Issue erstellen](https://github.com/Avacon00/linux-system-dashboard/issues/new)

### 💡 **Feature Requests**
Idee für ein neues Feature? [Feature vorschlagen](https://github.com/Avacon00/linux-system-dashboard/issues/new)

### 👨‍💻 **Autor**
**Avacon00**
- 🌐 Website: [schuttehub.de](https://schuttehub.de)
- 🐙 GitHub: [@Avacon00](https://github.com/Avacon00)

---

## 🎆 **Warum AppImage?**

| ✅ **AppImage Vorteile** | ❌ **Traditionelle Installation** |
|---------------------------|--------------------------------|
| Ein Datei-Download | Multiple Pakete + Dependencies |
| Keine sudo-Rechte | Root-Zugriff erforderlich |
| Funktioniert überall | Distribution-spezifisch |
| Keine Konflikte | Library-Konflikte möglich |
| Sofort nutzbar | Installation + Konfiguration |
| Einfaches Löschen | Deinstallation erforderlich |

**AppImage = Die Zukunft der Linux-Software-Bereitstellung!** 🚀

---

<div align="center">

## ⭐ **Wenn dir das Projekt gefällt, gib ihm einen Stern!** ⭐

**Made with ❤️ for the Linux Community**

[⬆️ **Nach oben**](#-linux-system-dashboard)

</div>
