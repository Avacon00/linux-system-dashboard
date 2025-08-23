const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const { exec } = require('child_process');
const fs = require('fs');
const sudo = require('sudo-prompt');
// Auto-Updater - robust laden
let AutoUpdater;
try {
  AutoUpdater = require('./auto-updater');
} catch (error) {
  console.log('Auto-Updater nicht verfügbar:', error.message);
  AutoUpdater = null;
}

let mainWindow;
let autoUpdater;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'hidden',
    frame: false,
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Auto-Updater initialisieren (nur in Production und wenn verfügbar)
    if (!process.argv.includes('--dev') && app.isPackaged && AutoUpdater) {
      try {
        autoUpdater = new AutoUpdater(mainWindow);
        autoUpdater.checkForUpdatesOnStartup();
        autoUpdater.startPeriodicUpdateCheck();
      } catch (error) {
      }
    } else {
    }
  });

  // Window close Event - Minimize to Tray statt schließen
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Notification beim ersten Mal
      if (!mainWindow.hasShownTrayNotification) {
        // Tray Notification (falls unterstützt)
        if (tray) {
          tray.displayBalloon({
            title: 'Linux System Dashboard',
            content: 'App läuft im Hintergrund weiter. Rechtsklick auf das Icon für Optionen.'
          });
        }
        mainWindow.hasShownTrayNotification = true;
      }
    }
  });

  // Entwicklungsmodus
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// System Tray erstellen
function createTray() {
  // Tray Icon laden
  const iconPath = path.join(__dirname, 'assets/icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (error) {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  // Tray Tooltip mit Live System Stats
  updateTrayTooltip();
  
  // Kontext Menü
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📊 Dashboard öffnen',
      click: () => {
        showWindow();
      }
    },
    {
      label: '🔄 System aktualisieren',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('refresh-system');
        }
      }
    },
    {
      label: '⚡ Schnellaktionen',
      click: () => {
        showWindow();
        if (mainWindow) {
          mainWindow.webContents.send('switch-to-actions');
        }
      }
    },
    {
      label: '🔒 Sicherheitsscan',
      click: () => {
        showWindow();
        if (mainWindow) {
          mainWindow.webContents.send('start-security-scan');
        }
      }
    },
    { type: 'separator' },
    {
      label: '❌ Beenden',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Klick auf Tray Icon
  tray.on('click', () => {
    showWindow();
  });
  
  // Tooltip alle 5 Sekunden aktualisieren
  setInterval(updateTrayTooltip, 5000);
}

// Fenster anzeigen
function showWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

// Tray Tooltip mit Live System Stats aktualisieren
async function updateTrayTooltip() {
  if (!tray) return;
  
  try {
    const systemInfo = await si.currentLoad();
    const memInfo = await si.mem();
    const osInfo = await si.osInfo();
    
    const cpuUsage = Math.round(systemInfo.currentLoad);
    const ramUsage = Math.round((memInfo.used / memInfo.total) * 100);
    const uptime = Math.round(osInfo.uptime / 3600); // Stunden
    
    const tooltipText = `Linux System Dashboard
CPU: ${cpuUsage}% | RAM: ${ramUsage}%
Uptime: ${uptime}h | Klick zum Öffnen`;
    
    tray.setToolTip(tooltipText);
  } catch (error) {
    tray.setToolTip('Linux System Dashboard\nKlick zum Öffnen');
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Unter Linux nicht beenden, sondern im Tray laufen lassen
  if (process.platform === 'darwin') {
    app.quit();
  }
  // Unter Linux: App läuft im Tray weiter
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handler für System-Informationen - OPTIMIERT
ipcMain.handle('get-system-info', async () => {
  try {
    const [cpu, mem, disk, os, temperature, cpuLoadData] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.cpuTemperature().catch(() => null),
      si.currentLoad().catch(() => ({ currentLoad: 0, cpus: [] }))
    ]);
    
    // Vereinfachtes CPU-Monitoring - nur systeminformation verwenden
    const cpuLoad = Math.round(cpuLoadData.currentLoad || 0);
    
    // CPU-Kerne - mit intelligenter Fallback-Logik
    let cpuCores = [];
    if (cpuLoadData.cpus && cpuLoadData.cpus.length > 0) {
      cpuCores = cpuLoadData.cpus.map((core, index) => ({
        core: index + 1,
        usage: Math.round(core.load || 0)
      }));
    } else {
      // Fallback: Gleichmäßige Verteilung der Gesamtlast auf alle Kerne
      const avgUsage = Math.round(cpuLoad / (cpu.cores || 1));
      cpuCores = Array.from({length: cpu.cores || 1}, (_, i) => ({
        core: i + 1,
        usage: avgUsage
      }));
    }
    
    return {
      cpu: {
        model: `${cpu.manufacturer || 'Unknown'} ${cpu.brand || 'CPU'}`.trim(),
        cores: cpu.cores || 1,
        speed: cpu.speed || 0,
        load: cpuLoad,
        coresData: cpuCores
      },
      memory: {
        total: mem.total,
        used: mem.active || (mem.total - mem.available),
        free: mem.free,
        active: mem.active,
        available: mem.available,
        buffers: mem.buffers,
        cached: mem.cached
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: d.size,
        used: d.used,
        mount: d.mount
      })),
      os: {
        platform: os.platform,
        distro: os.distro,
        release: os.release,
        hostname: os.hostname,
        uptime: os.uptime
      },
      temperature: {
        cpu: temperature && temperature.main ? Math.round(temperature.main) : null,
        max: temperature && temperature.max ? Math.round(temperature.max) : null,
        cores: temperature && temperature.cores ? temperature.cores.map(core => Math.round(core)) : []
      }
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der System-Informationen:', error);
    return null;
  }
});

// Hilfsfunktion für CPU-Statistiken aus /proc/stat
async function getCpuStats() {
  return new Promise((resolve, reject) => {
    exec('cat /proc/stat', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      const cpuLine = lines[0]; // Gesamt-CPU
      const coreLines = lines.filter(line => line.startsWith('cpu') && line.match(/^cpu\d+/));
      
      // Parse Gesamt-CPU
      const totalParts = cpuLine.split(/\s+/);
      const totalUser = parseInt(totalParts[1]) || 0;
      const totalNice = parseInt(totalParts[2]) || 0;
      const totalSystem = parseInt(totalParts[3]) || 0;
      const totalIdle = parseInt(totalParts[4]) || 0;
      const totalIoWait = parseInt(totalParts[5]) || 0;
      const totalIrq = parseInt(totalParts[6]) || 0;
      const totalSoftIrq = parseInt(totalParts[7]) || 0;
      
      const totalActive = totalUser + totalNice + totalSystem + totalIrq + totalSoftIrq;
      const total = totalActive + totalIdle + totalIoWait;
      
      // Parse individuelle Kerne
      const cores = coreLines.map(line => {
        const parts = line.split(/\s+/);
        const user = parseInt(parts[1]) || 0;
        const nice = parseInt(parts[2]) || 0;
        const system = parseInt(parts[3]) || 0;
        const idle = parseInt(parts[4]) || 0;
        const ioWait = parseInt(parts[5]) || 0;
        const irq = parseInt(parts[6]) || 0;
        const softIrq = parseInt(parts[7]) || 0;
        
        const active = user + nice + system + irq + softIrq;
        const coreTotal = active + idle + ioWait;
        
        return {
          total: coreTotal,
          idle: idle + ioWait
        };
      });
      
      resolve({
        total: total,
        idle: totalIdle + totalIoWait,
        cores: cores
      });
    });
  });
}

// IPC Handler für Prozesse
ipcMain.handle('get-processes', async () => {
  try {
    // Verwende ps command für korrekte CPU/Memory-Werte
    return new Promise((resolve, reject) => {
      exec('ps aux --sort=-%cpu | head -51', (error, stdout) => {
        if (error) {
          console.log('ps command fehlgeschlagen, verwende systeminformation fallback');
          // Fallback zu systeminformation
          si.processes().then(processes => {
            const processedList = processes.list.slice(0, 50).map(p => ({
              pid: p.pid,
              name: p.name || 'Unknown',
              cpu: Math.round((p.cpu || 0) * 100) / 100, // Runde auf 2 Dezimalstellen
              mem: Math.round((p.mem || 0) * 100) / 100,
              command: p.command || p.name || 'N/A'
            }));
            resolve(processedList);
          }).catch(siError => {
            console.error('Auch systeminformation fehlgeschlagen:', siError);
            resolve([]);
          });
          return;
        }
        
        const lines = stdout.trim().split('\n');
        const processes = [];
        
        // Skip header line
        for (let i = 1; i < lines.length && processes.length < 50; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Parse ps aux output
          const parts = line.split(/\s+/);
          if (parts.length >= 11) {
            const user = parts[0];
            const pid = parseInt(parts[1]);
            const cpu = parseFloat(parts[2]);
            const mem = parseFloat(parts[3]);
            const command = parts.slice(10).join(' ');
            
            // Extrahiere Prozessname aus dem Kommando
            let name = command;
            if (command.includes('/')) {
              name = command.split('/').pop();
            }
            if (name.includes(' ')) {
              name = name.split(' ')[0];
            }
            
            processes.push({
              pid: pid,
              name: name,
              cpu: cpu,
              mem: mem,
              command: command,
              user: user
            });
          }
        }
        
        resolve(processes);
      });
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Prozesse:', error);
    return [];
  }
});

// Global variables for network speed calculation
let previousNetworkStats = {};

// IPC Handler für Netzwerk-Informationen
ipcMain.handle('get-network-info', async () => {
  try {
    const [network, networkStats] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats()
    ]);
    
    return {
      interfaces: network,
      stats: networkStats
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Netzwerk-Informationen:', error);
    return null;
  }
});

// Essential Network Speed Handler
ipcMain.handle('get-network-speeds', async () => {
  try {
    const networkStats = await si.networkStats();
    const currentTime = Date.now();
    let networkSpeeds = {};

    networkStats.forEach(stat => {
      const interfaceName = stat.iface;
      if (previousNetworkStats[interfaceName]) {
        const timeDiff = (currentTime - previousNetworkStats[interfaceName].timestamp) / 1000;
        if (timeDiff > 0) {
          const downloadSpeed = Math.max(0, (stat.rx_bytes - previousNetworkStats[interfaceName].rx_bytes) / timeDiff);
          const uploadSpeed = Math.max(0, (stat.tx_bytes - previousNetworkStats[interfaceName].tx_bytes) / timeDiff);
          
          networkSpeeds[interfaceName] = {
            downloadSpeed: downloadSpeed,
            uploadSpeed: uploadSpeed,
            downloadFormatted: formatNetworkSpeed(downloadSpeed),
            uploadFormatted: formatNetworkSpeed(uploadSpeed)
          };
        }
      }
      
      previousNetworkStats[interfaceName] = {
        rx_bytes: stat.rx_bytes,
        tx_bytes: stat.tx_bytes,
        timestamp: currentTime
      };
    });

    return { speeds: networkSpeeds };
  } catch (error) {
    console.error('Network speed error:', error);
    return { speeds: {} };
  }
});

// Helper function to format network speeds
function formatNetworkSpeed(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0.00 B/s';
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let value = bytesPerSecond;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  const decimals = value < 1 && unitIndex > 0 ? 3 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

// IPC Handler für System-Updates
ipcMain.handle('check-updates', async () => {
  return new Promise((resolve) => {
    // First update the package database
    exec('sudo pacman -Sy', (syncError) => {
      if (syncError) {
        console.error('Fehler beim Synchronisieren der Paketdatenbank:', syncError);
        resolve({ 
          available: 0, 
          packages: [], 
          error: 'Fehler beim Synchronisieren der Paketdatenbank',
          lastSync: new Date().toLocaleString('de-DE')
        });
        return;
      }

      // Then check for updates
      exec('pacman -Qu', (error, stdout) => {
        if (error) {
          // Exit code 1 means no updates available (this is normal)
          if (error.code === 1) {
            resolve({ 
              available: 0, 
              packages: [], 
              lastSync: new Date().toLocaleString('de-DE'),
              message: 'System ist aktuell - keine Updates verfügbar'
            });
          } else {
            resolve({ 
              available: 0, 
              packages: [], 
              error: 'Fehler beim Prüfen der Updates',
              lastSync: new Date().toLocaleString('de-DE')
            });
          }
        } else {
          const packages = stdout.trim().split('\n').filter(line => line.length > 0);
          resolve({ 
            available: packages.length, 
            packages,
            lastSync: new Date().toLocaleString('de-DE')
          });
        }
      });
    });
  });
});

// IPC Handler für Paketsuche
ipcMain.handle('search-packages', async (_, searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return { success: false, error: 'Ungültiger Suchbegriff' };
  }
  
  // Entferne gefährliche Zeichen für die Suche
  const sanitizedSearchTerm = searchTerm.replace(/[^a-zA-Z0-9\-_\.\s]/g, '');
  if (!sanitizedSearchTerm) {
    return { success: false, error: 'Leerer Suchbegriff' };
  }
  
  return new Promise((resolve) => {
    // Zuerst in den offiziellen Repos suchen
    const pacmanCommand = `pacman -Ss "${sanitizedSearchTerm}" | head -20`;
    exec(pacmanCommand, (pacmanError, pacmanStdout) => {
      let pacmanResults = [];
      if (!pacmanError && pacmanStdout) {
        // Parse pacman output
        const lines = pacmanStdout.trim().split('\n');
        for (let i = 0; i < lines.length; i += 2) {
          if (lines[i] && lines[i + 1]) {
            const match = lines[i].match(/^(\S+)\/(\S+)\s+([^\[]+)(?:\[.*\])?\s*$/);
            if (match) {
              const [, repo, name, version] = match;
              const description = lines[i + 1].trim();
              pacmanResults.push({
                name: name,
                fullName: `${repo}/${name}`,
                version: version.trim(),
                description: description,
                source: 'official',
                installCommand: name
              });
            }
          }
        }
      }

      // Dann in AUR suchen (falls yay verfügbar ist)
      exec('which yay', (yayCheckError) => {
        if (yayCheckError) {
          // Nur offizielle Pakete zurückgeben
          resolve({
            success: true,
            packages: pacmanResults,
            totalFound: pacmanResults.length
          });
        } else {
          // AUR Suche mit yay
          const yayCommand = `yay -Ss "${sanitizedSearchTerm}" | head -10`;
          exec(yayCommand, (yayError, yayStdout) => {
            let aurResults = [];
            if (!yayError && yayStdout) {
              const lines = yayStdout.trim().split('\n');
              for (let i = 0; i < lines.length; i += 2) {
                if (lines[i] && lines[i + 1] && lines[i].startsWith('aur/')) {
                  const match = lines[i].match(/^aur\/(\S+)\s+([^\(]+)(?:\([^)]+\))?\s*$/);
                  if (match) {
                    const [, name, version] = match;
                    const description = lines[i + 1].trim();
                    aurResults.push({
                      name: name,
                      fullName: `aur/${name}`,
                      version: version.trim(),
                      description: description,
                      source: 'aur',
                      installCommand: name
                    });
                  }
                }
              }
            }

            const allResults = [...pacmanResults, ...aurResults];
            
            // Intelligente Sortierung basierend auf Relevanz
            allResults.sort((a, b) => {
              const searchLower = sanitizedSearchTerm.toLowerCase();
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              
              // Exakte Übereinstimmungen zuerst
              if (aName === searchLower && bName !== searchLower) return -1;
              if (bName === searchLower && aName !== searchLower) return 1;
              
              // Namen die mit dem Suchbegriff beginnen
              if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
              if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1;
              
              // Offizielle Pakete vor AUR
              if (a.source === 'official' && b.source === 'aur') return -1;
              if (b.source === 'official' && a.source === 'aur') return 1;
              
              // Alphabetisch sortieren
              return aName.localeCompare(bName);
            });

            resolve({
              success: true,
              packages: allResults.slice(0, 10), // Maximal 10 Ergebnisse
              totalFound: allResults.length
            });
          });
        }
      });
    });
  });
});

// IPC Handler für Software-Installation mit Fortschritt
ipcMain.handle('install-package-with-progress', async (event, packageName, source = 'official') => {
  // Validierung des Paketnamens
  if (!packageName || typeof packageName !== 'string') {
    return { success: false, error: 'Ungültiger Paketname' };
  }
  
  // Entferne gefährliche Zeichen
  const sanitizedPackageName = packageName.replace(/[^a-zA-Z0-9\-_\.]/g, '');
  if (sanitizedPackageName !== packageName) {
    return { success: false, error: 'Paketname enthält ungültige Zeichen' };
  }
  
  return new Promise((resolve) => {
    let command;
    let progressSteps = [];
    
    // Definiere Fortschrittsschritte basierend auf der Quelle
    if (source === 'aur') {
      progressSteps = [
        'Überprüfe AUR-Verfügbarkeit...',
        'Lade PKGBUILD herunter...',
        'Baue Paket aus dem Quellcode...',
        'Installiere Abhängigkeiten...',
        'Installiere Paket...',
        'Konfiguriere System...',
        'Installation abgeschlossen!'
      ];
    } else {
      progressSteps = [
        'Synchronisiere Paketdatenbank...',
        'Überprüfe Abhängigkeiten...',
        'Lade Paket herunter...',
        'Installiere Paket...',
        'Konfiguriere System...',
        'Installation abgeschlossen!'
      ];
    }
    
    let currentStep = 0;
    let progressInterval;
    
    // Simuliere Fortschritt basierend auf typischen Installationsschritten
    const simulateProgress = () => {
      if (currentStep < progressSteps.length - 1) {
        const progressPercent = Math.floor((currentStep / (progressSteps.length - 1)) * 90); // Max 90% während Installation
        event.sender.send('package-install-progress', {
          percent: progressPercent,
          status: progressSteps[currentStep]
        });
        currentStep++;
      }
    };
    
    if (source === 'aur') {
      // Prüfe ob yay verfügbar ist
      exec('which yay', (yayCheckError) => {
        if (yayCheckError) {
          resolve({ success: false, error: 'yay ist nicht installiert. AUR-Pakete können nicht installiert werden.' });
        } else {
          // Starte Fortschrittssimulation
          progressInterval = setInterval(simulateProgress, 1500); // Alle 1.5 Sekunden
          simulateProgress(); // Erstes Update sofort
          
          command = `yay -S --noconfirm ${sanitizedPackageName}`;
          const child = exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
            clearInterval(progressInterval);
            
            if (error) {
              event.sender.send('package-install-progress', {
                percent: 100,
                status: 'Installation fehlgeschlagen',
                error: true
              });
              resolve({ success: false, error: error.message, details: stderr });
            } else {
              event.sender.send('package-install-progress', {
                percent: 100,
                status: 'Installation erfolgreich abgeschlossen!',
                completed: true
              });
              resolve({ success: true, output: stdout });
            }
          });
          
          // Analysiere stdout für bessere Fortschrittsanzeige
          child.stdout?.on('data', (data) => {
            const output = data.toString();
            // Anhand von pacman/yay Output-Mustern den aktuellen Schritt bestimmen
            if (output.includes('downloading') || output.includes('retrieving')) {
              event.sender.send('package-install-progress', {
                percent: 30,
                status: 'Lade Paket herunter...'
              });
            } else if (output.includes('installing') || output.includes('upgrading')) {
              event.sender.send('package-install-progress', {
                percent: 70,
                status: 'Installiere Paket...'
              });
            }
          });
        }
      });
    } else {
      // Starte Fortschrittssimulation für offizielle Pakete
      progressInterval = setInterval(simulateProgress, 1000); // Alle 1 Sekunde
      simulateProgress(); // Erstes Update sofort
      
      // Offizielle Pakete mit pacman
      command = `sudo pacman -S --noconfirm ${sanitizedPackageName}`;
      const child = exec(command, (error, stdout, stderr) => {
        clearInterval(progressInterval);
        
        if (error) {
          event.sender.send('package-install-progress', {
            percent: 100,
            status: 'Installation fehlgeschlagen',
            error: true
          });
          resolve({ success: false, error: error.message, details: stderr });
        } else {
          event.sender.send('package-install-progress', {
            percent: 100,
            status: 'Installation erfolgreich abgeschlossen!',
            completed: true
          });
          resolve({ success: true, output: stdout });
        }
      });
      
      // Analysiere stdout für bessere Fortschrittsanzeige
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('downloading') || output.includes('retrieving')) {
          event.sender.send('package-install-progress', {
            percent: 40,
            status: 'Lade Paket herunter...'
          });
        } else if (output.includes('installing') || output.includes('upgrading')) {
          event.sender.send('package-install-progress', {
            percent: 80,
            status: 'Installiere Paket...'
          });
        }
      });
    }
  });
});

// IPC Handler für System-Updates Installation mit Fortschrittsverfolgung
ipcMain.handle('install-updates', async () => {
  return new Promise((resolve) => {
    // Zuerst prüfen, ob pacman bereits läuft
    exec('pgrep -f "pacman"', (_, pgrepStdout) => {
      if (pgrepStdout.trim()) {
        resolve({ 
          success: false, 
          error: 'Pacman läuft bereits. Bitte warten Sie, bis andere Update-Prozesse abgeschlossen sind.',
          requiresReboot: false
        });
        return;
      }

      // Lock-Datei prüfen und entfernen falls vorhanden
      exec('sudo rm -f /var/lib/pacman/db.lck', (lockError) => {
        if (lockError) {
        }

        // Updates installieren mit detaillierter Ausgabe
        const command = 'sudo pacman -Syu --noconfirm';
        const child = exec(command, (error, stdout, stderr) => {
          if (error) {
            resolve({ 
              success: false, 
              error: error.message, 
              output: stderr,
              requiresReboot: false
            });
          } else {
            // Prüfen, ob ein Reboot erforderlich ist
            const requiresReboot = stdout.includes('reboot') || 
                                  stdout.includes('restart') || 
                                  stdout.includes('systemctl') ||
                                  stdout.includes('kernel');
            
            resolve({ 
              success: true, 
              output: stdout,
              requiresReboot: requiresReboot,
              message: requiresReboot ? 
                'Updates erfolgreich installiert! Ein System-Neustart wird empfohlen.' : 
                'Updates erfolgreich installiert!'
            });
          }
        });

        // Fortschritt verfolgen (falls möglich)
        child.stdout.on('data', (data) => {
        });

        child.stderr.on('data', (data) => {
        });
      });
    });
  });
});

// IPC Handler für System-Neustart
ipcMain.handle('reboot-system', async () => {
  return new Promise((resolve) => {
    const options = {
      name: 'Linux System Dashboard',
      icns: path.join(__dirname, 'assets/icon.png')
    };
    
    sudo.exec('reboot', options, (error) => {
      if (error) {
        resolve({ success: false, error: 'Neustart abgebrochen oder Passwort falsch' });
      } else {
        resolve({ success: true, message: 'System wird neu gestartet...' });
      }
    });
  });
});

// IPC Handler für Dienste
ipcMain.handle('get-services', async () => {
  return new Promise((resolve) => {
    exec('systemctl list-units --type=service --state=active', (error, stdout) => {
      if (error) {
        resolve([]);
      } else {
        const services = stdout.split('\n')
          .slice(1, -1)
          .map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
              return {
                name: parts[0],
                load: parts[1],
                status: parts[2],
                sub: parts[3],
                description: parts.slice(4).join(' ')
              };
            }
            return null;
          })
          .filter(service => service && service.name && service.name.includes('.service'));
        resolve(services);
      }
    });
  });
});

// IPC Handler für Firewall-Status
ipcMain.handle('get-firewall-status', async () => {
  return new Promise((resolve) => {
    // Prüfe UFW-Status direkt
    exec('ufw status', (error, stdout) => {
      let isActive = false;
      
      if (!error && stdout) {
        isActive = stdout.includes('Status: active');
      }
      
      resolve({ active: isActive });
    });
  });
});

// IPC Handler für Firewall Toggle
ipcMain.handle('toggle-firewall', async () => {
  return new Promise((resolve) => {
    // Prüfe UFW-Status direkt (nicht über systemctl)
    exec('ufw status', (statusError, statusStdout) => {
      let isActive = false;
      
      if (!statusError && statusStdout) {
        isActive = statusStdout.includes('Status: active');
      }
      
      
      // Finde verfügbaren Terminal für sudo-Eingabe
      const terminals = ['konsole', 'alacritty', 'xterm', 'gnome-terminal', 'xfce4-terminal'];
      
      // Asynchrone Terminal-Suche
      const findTerminal = async () => {
        for (const terminal of terminals) {
          try {
            await new Promise((resolve, reject) => {
              exec(`which ${terminal}`, (error) => {
                if (error) reject();
                else resolve();
              });
            });
            return terminal; // Gefunden!
          } catch {
            continue; // Weitersuchen
          }
        }
        return null;
      };
      
      findTerminal().then(availableTerminal => {
        if (!availableTerminal) {
          // Fallback: Versuche pkexec (PolicyKit) als Alternative
          exec('which pkexec', (pkexecError) => {
            if (!pkexecError) {
              const command = isActive ? 'pkexec ufw disable' : 'pkexec ufw enable';
              exec(command, (error, stdout) => {
                if (error) {
                  resolve({
                    success: false,
                    error: 'Firewall-Änderung abgebrochen oder fehlgeschlagen. Führen Sie den Befehl manuell im Terminal aus: sudo ufw ' + (isActive ? 'disable' : 'enable')
                  });
                } else {
                  resolve({
                    success: true,
                    active: !isActive,
                    message: isActive ? 'Firewall wurde deaktiviert' : 'Firewall wurde aktiviert',
                    output: stdout
                  });
                }
              });
            } else {
              // Weder Terminal noch pkexec verfügbar - Benutzer-Anweisung
              resolve({
                success: false,
                error: `Bitte führen Sie manuell im Terminal aus: sudo ufw ${isActive ? 'disable' : 'enable'}`
              });
            }
          });
          return;
        }
        
        // Verwende verfügbares Terminal für sudo-Eingabe
        const action = isActive ? 'disable' : 'enable';
        const actionText = isActive ? 'deaktiviert' : 'aktiviert';
        const command = `${availableTerminal} -T "UFW Firewall ${actionText}" -e bash -c "echo 'UFW Firewall wird ${actionText}...'; echo ''; sudo ufw ${action}; echo ''; echo 'Fertig! Drücke Enter zum Schließen...'; read"`;
        
        console.log(`Executing: ${command}`);
        
        exec(command, (execError, stdout, stderr) => {
          // Da das Terminal-Fenster geöffnet wird, prüfen wir nach kurzer Zeit den Status
          setTimeout(() => {
            exec('ufw status', (checkError, checkStdout) => {
              let newIsActive = false;
              
              if (!checkError && checkStdout) {
                newIsActive = checkStdout.includes('Status: active');
              }
              
              console.log(`New UFW Status: ${newIsActive ? 'active' : 'inactive'}`);
              
              if (newIsActive !== isActive) {
                // Status hat sich geändert - Erfolg!
                resolve({
                  success: true,
                  active: newIsActive,
                  message: newIsActive ? 'UFW Firewall wurde aktiviert' : 'UFW Firewall wurde deaktiviert'
                });
              } else {
                // Status unverändert - prüfe nach längerer Zeit noch einmal
                setTimeout(() => {
                  exec('ufw status', (finalCheckError, finalCheckStdout) => {
                    let finalIsActive = false;
                    
                    if (!finalCheckError && finalCheckStdout) {
                      finalIsActive = finalCheckStdout.includes('Status: active');
                    }
                    
                    if (finalIsActive !== isActive) {
                      resolve({
                        success: true,
                        active: finalIsActive,
                        message: finalIsActive ? 'UFW Firewall wurde aktiviert' : 'UFW Firewall wurde deaktiviert'
                      });
                    } else {
                      resolve({
                        success: false,
                        error: 'Firewall-Änderung wurde möglicherweise abgebrochen oder ist fehlgeschlagen'
                      });
                    }
                  });
                }, 3000); // Warte weitere 3 Sekunden
              }
            });
          }, 2000); // Warte 2 Sekunden nach Terminal-Öffnung
        });
      });
    });
  });
});

// IPC Handler für Kommandoausführung (für Quick Access Tools)
ipcMain.handle('execute-command', async (_, command) => {
  // Definiere Fallback-Listen für verschiedene Anwendungstypen
  const applicationMap = {
    'gnome-terminal': {
      type: 'terminal',
      fallbacks: ['konsole', 'alacritty', 'xterm', 'xfce4-terminal', 'mate-terminal', 'lxterminal', 'urxvt']
    },
    'nautilus': {
      type: 'filemanager',
      fallbacks: ['dolphin', 'thunar', 'nemo', 'caja', 'pcmanfm', 'ranger']
    },
    'gnome-system-monitor': {
      type: 'systemmonitor',
      fallbacks: ['ksysguard', 'mate-system-monitor', 'xfce4-taskmanager']
    },
    'gnome-software': {
      type: 'softwarecenter',
      fallbacks: ['pamac-manager', 'octopi', 'discover', 'synaptic']
    }
  };

  // Finde die entsprechende Anwendungskategorie
  let appConfig = applicationMap[command];
  if (!appConfig) {
    return { 
      success: false, 
      error: `Befehl '${command}' ist nicht unterstützt` 
    };
  }

  // Funktion um verfügbare Anwendung zu finden
  const findAvailableApp = async (apps) => {
    for (const app of apps) {
      try {
        await new Promise((resolve, reject) => {
          exec(`which ${app}`, (error) => {
            if (error) reject();
            else resolve();
          });
        });
        return app; // Gefunden!
      } catch {
        continue; // Weitersuchen
      }
    }
    return null; // Keine gefunden
  };

  try {
    // Erst den ursprünglichen Befehl versuchen
    const originalApp = command;
    let availableApp = null;
    
    try {
      await new Promise((resolve, reject) => {
        exec(`which ${originalApp}`, (error) => {
          if (error) reject();
          else resolve();
        });
      });
      availableApp = originalApp;
    } catch {
      // Original nicht verfügbar, suche Fallbacks
      availableApp = await findAvailableApp(appConfig.fallbacks);
    }

    if (!availableApp) {
      // Spezielle Behandlung für Software Center
      if (appConfig.type === 'softwarecenter') {
        // Für Arch Linux: Verwende Terminal mit yay oder pacman
        const terminalApp = await findAvailableApp(['konsole', 'alacritty', 'xterm']);
        if (terminalApp) {
          const softwareCommand = `${terminalApp} -e bash -c "echo 'Arch Linux Software Management'; echo 'Verfügbare Befehle:'; echo '- yay -S [paket]     (AUR installieren)'; echo '- pacman -S [paket]  (offiziell installieren)'; echo '- yay -Ss [suche]    (nach Paketen suchen)'; echo '- pacman -Qu         (Updates prüfen)'; echo ''; echo 'Drücke Enter zum Beenden...'; read"`;
          
          return new Promise((resolve) => {
            exec(softwareCommand, (error) => {
              if (error) {
                resolve({ 
                  success: false, 
                  error: `Fehler beim Öffnen des Software-Centers: ${error.message}` 
                });
              } else {
                resolve({ 
                  success: true, 
                  message: `Software-Hilfe im Terminal geöffnet`,
                  command: softwareCommand
                });
              }
            });
          });
        }
      }
      
      // Spezielle Behandlung für System Monitor
      if (appConfig.type === 'systemmonitor') {
        const terminalApp = await findAvailableApp(['konsole', 'alacritty', 'xterm']);
        if (terminalApp) {
          const monitorCommand = `${terminalApp} -e htop`;
          
          return new Promise((resolve) => {
            exec(monitorCommand, (error) => {
              if (error) {
                resolve({ 
                  success: false, 
                  error: `Fehler beim Öffnen des System-Monitors: ${error.message}` 
                });
              } else {
                resolve({ 
                  success: true, 
                  message: `htop im Terminal gestartet`,
                  command: monitorCommand
                });
              }
            });
          });
        }
      }
      
      return { 
        success: false, 
        error: `Keine passende Anwendung für ${appConfig.type} gefunden` 
      };
    }

    // Verfügbare Anwendung starten
    return new Promise((resolve) => {
      exec(`${availableApp} > /dev/null 2>&1 &`, (execError) => {
        if (execError) {
          resolve({ 
            success: false, 
            error: `Fehler beim Starten von ${availableApp}: ${execError.message}` 
          });
        } else {
          resolve({ 
            success: true, 
            message: `${availableApp} wurde gestartet`,
            command: availableApp
          });
        }
      });
    });
    
  } catch (error) {
    return { 
      success: false, 
      error: `Unerwarteter Fehler: ${error.message}` 
    };
  }
});

// Old terminal handler removed - using comprehensive security terminal handler below

// IPC Handler für Fenster-Kontrolle
ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

// Tray IPC Handlers
ipcMain.handle('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('show-from-tray', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Security-related IPC Handlers
ipcMain.handle('security-scan', async () => {
  try {
    console.log('Starting security scan...');
    
    const results = {
      ssh: { status: 'checking', message: 'Prüfe SSH-Konfiguration...' },
      fail2ban: { status: 'checking', message: 'Prüfe Fail2Ban-Status...' },
      ports: { status: 'checking', message: 'Scanne offene Ports...' },
      events: []
    };

    // Check SSH status
    try {
      const sshCheck = await new Promise((resolve) => {
        exec('systemctl is-active sshd', (error, stdout) => {
          const isActive = !error && stdout.trim() === 'active';
          resolve({
            status: isActive ? 'secure' : 'warning',
            message: isActive ? 'SSH aktiv und sicher konfiguriert' : 'SSH ist deaktiviert'
          });
        });
      });
      results.ssh = sshCheck;
    } catch (error) {
      results.ssh = { status: 'danger', message: 'SSH-Status konnte nicht ermittelt werden' };
    }

    // Check Fail2Ban status
    try {
      const fail2banCheck = await new Promise((resolve) => {
        exec('systemctl is-active fail2ban', (error, stdout) => {
          const isActive = !error && stdout.trim() === 'active';
          resolve({
            status: isActive ? 'secure' : 'warning',
            message: isActive ? 'Fail2Ban läuft und schützt SSH' : 'Fail2Ban ist nicht aktiv'
          });
        });
      });
      results.fail2ban = fail2banCheck;
    } catch (error) {
      results.fail2ban = { status: 'info', message: 'Fail2Ban ist nicht installiert' };
    }

    // Check open ports (basic scan)
    try {
      const portsCheck = await new Promise((resolve) => {
        exec('ss -tuln | grep LISTEN | wc -l', (error, stdout) => {
          if (!error) {
            const portCount = parseInt(stdout.trim()) || 0;
            resolve({
              status: portCount < 10 ? 'secure' : 'warning',
              message: `${portCount} offene Ports gefunden`
            });
          } else {
            resolve({ status: 'info', message: 'Port-Scan fehlgeschlagen' });
          }
        });
      });
      results.ports = portsCheck;
    } catch (error) {
      results.ports = { status: 'info', message: 'Port-Scan nicht verfügbar' };
    }

    // Get recent security events
    try {
      const eventsCheck = await new Promise((resolve) => {
        exec('journalctl --since "24 hours ago" | grep -i "authentication\\|failed\\|invalid\\|security\\|ssh" | tail -10', (error, stdout) => {
          if (!error && stdout) {
            const events = stdout.split('\n').filter(line => line.trim()).slice(0, 5).map(line => ({
              time: new Date().toLocaleTimeString(),
              message: line.substring(0, 80) + '...',
              type: 'warning'
            }));
            resolve(events);
          } else {
            resolve([]);
          }
        });
      });
      results.events = eventsCheck;
    } catch (error) {
      results.events = [];
    }

    console.log('Security scan completed:', results);
    return results;
  } catch (error) {
    console.error('Fehler beim Sicherheitsscan:', error);
    return {
      ssh: { status: 'danger', message: 'Scan fehlgeschlagen' },
      fail2ban: { status: 'danger', message: 'Scan fehlgeschlagen' },
      ports: { status: 'danger', message: 'Scan fehlgeschlagen' },
      events: []
    };
  }
});

ipcMain.handle('check-security-updates', async () => {
  try {
    console.log('Checking for security updates...');
    
    return new Promise((resolve) => {
      exec('pacman -Sy > /dev/null 2>&1 && pacman -Qu | grep -i security', (error, stdout) => {
        if (!error && stdout) {
          const updates = stdout.split('\n').filter(line => line.trim()).length;
          resolve({
            success: true,
            count: updates,
            message: `${updates} Sicherheitsupdates verfügbar`
          });
        } else {
          resolve({
            success: true,
            count: 0,
            message: 'Keine Sicherheitsupdates verfügbar'
          });
        }
      });
    });
  } catch (error) {
    console.error('Fehler beim Prüfen der Sicherheitsupdates:', error);
    return {
      success: false,
      message: 'Fehler beim Prüfen der Sicherheitsupdates'
    };
  }
});

ipcMain.handle('audit-packages', async () => {
  try {
    console.log('Running package audit...');
    
    return new Promise((resolve) => {
      exec('pacman -Qtdq', (error, stdout) => {
        if (!error && stdout) {
          const orphans = stdout.split('\n').filter(line => line.trim()).length;
          resolve({
            success: true,
            orphanPackages: orphans,
            message: `${orphans} verwaiste Pakete gefunden`
          });
        } else {
          resolve({
            success: true,
            orphanPackages: 0,
            message: 'Keine verwaisten Pakete gefunden'
          });
        }
      });
    });
  } catch (error) {
    console.error('Fehler beim Paket-Audit:', error);
    return {
      success: false,
      message: 'Fehler beim Paket-Audit'
    };
  }
});

ipcMain.handle('network-scan', async () => {
  try {
    console.log('Starting network scan...');
    
    return new Promise((resolve) => {
      exec('ip route | head -1 | cut -d" " -f3', (error, stdout) => {
        if (!error && stdout) {
          const gateway = stdout.trim();
          exec(`nmap -sn ${gateway}/24 | grep -E "Nmap scan report" | wc -l`, (error2, stdout2) => {
            if (!error2) {
              const devices = parseInt(stdout2.trim()) || 0;
              resolve({
                success: true,
                devicesFound: devices,
                gateway: gateway,
                message: `${devices} Geräte im Netzwerk gefunden`
              });
            } else {
              resolve({
                success: false,
                message: 'Netzwerk-Scan fehlgeschlagen (nmap erforderlich)'
              });
            }
          });
        } else {
          resolve({
            success: false,
            message: 'Gateway konnte nicht ermittelt werden'
          });
        }
      });
    });
  } catch (error) {
    console.error('Fehler beim Netzwerk-Scan:', error);
    return {
      success: false,
      message: 'Fehler beim Netzwerk-Scan'
    };
  }
});

ipcMain.handle('check-rootkits', async () => {
  try {
    console.log('Checking for rootkits...');
    
    return new Promise((resolve) => {
      // Simple check for common rootkit indicators
      exec('ls -la /tmp /var/tmp | grep -E "(\.\.|\.|[0-9]+)$" | wc -l', (error, stdout) => {
        if (!error) {
          const suspiciousFiles = parseInt(stdout.trim()) || 0;
          const status = suspiciousFiles > 5 ? 'warning' : 'secure';
          resolve({
            success: true,
            status: status,
            suspiciousFiles: suspiciousFiles,
            message: suspiciousFiles > 5 ? `${suspiciousFiles} verdächtige Dateien gefunden` : 'Keine Rootkit-Indikatoren gefunden'
          });
        } else {
          resolve({
            success: false,
            message: 'Rootkit-Scan fehlgeschlagen'
          });
        }
      });
    });
  } catch (error) {
    console.error('Fehler beim Rootkit-Scan:', error);
    return {
      success: false,
      message: 'Fehler beim Rootkit-Scan'
    };
  }
});

// ============================================================================
// TERMINAL-BACKEND - SECURE COMMAND EXECUTION
// ============================================================================

// Erlaubte Befehle für Sicherheit (Whitelist-Ansatz)
const ALLOWED_COMMANDS = {
  // System-Information
  'ls': { safe: true, description: 'Dateien auflisten' },
  'pwd': { safe: true, description: 'Aktuelles Verzeichnis anzeigen' },
  'whoami': { safe: true, description: 'Aktueller Benutzer' },
  'date': { safe: true, description: 'Aktuelles Datum und Zeit' },
  'uptime': { safe: true, description: 'System-Laufzeit' },
  'id': { safe: true, description: 'Benutzer-ID anzeigen' },
  'groups': { safe: true, description: 'Benutzergruppen anzeigen' },
  
  // System-Monitoring
  'htop': { safe: true, description: 'Prozess-Monitor starten', requiresTerminal: true },
  'top': { safe: true, description: 'Prozess-Monitor (minimal)' },
  'ps': { safe: true, description: 'Laufende Prozesse anzeigen' },
  'df': { safe: true, description: 'Festplatten-Nutzung anzeigen' },
  'free': { safe: true, description: 'Arbeitsspeicher-Nutzung anzeigen' },
  'lscpu': { safe: true, description: 'CPU-Informationen anzeigen' },
  'lsblk': { safe: true, description: 'Block-Geräte auflisten' },
  'mount': { safe: true, description: 'Gemountete Dateisysteme anzeigen' },
  'ip': { safe: true, description: 'Netzwerk-Konfiguration anzeigen' },
  'netstat': { safe: true, description: 'Netzwerk-Verbindungen anzeigen' },
  
  // Datei-Operationen (sicher)
  'cat': { safe: true, description: 'Datei-Inhalt anzeigen', maxArgs: 1 },
  'head': { safe: true, description: 'Erste Zeilen einer Datei anzeigen' },
  'tail': { safe: true, description: 'Letzte Zeilen einer Datei anzeigen' },
  'less': { safe: true, description: 'Datei durchblättern', requiresTerminal: true },
  'more': { safe: true, description: 'Datei seitenweise anzeigen' },
  'file': { safe: true, description: 'Dateityp bestimmen' },
  'wc': { safe: true, description: 'Zeilen, Wörter, Zeichen zählen' },
  'grep': { safe: true, description: 'Text in Dateien suchen' },
  'find': { safe: true, description: 'Dateien suchen', timeout: 10000 },
  
  // Netzwerk (sicher)
  'ping': { safe: true, description: 'Netzwerk-Verbindung testen', timeout: 5000 },
  'wget': { safe: false, description: 'Datei herunterladen - nicht erlaubt' },
  'curl': { safe: false, description: 'HTTP-Anfragen - nicht erlaubt' },
  
  // System-Administration (eingeschränkt)
  'systemctl': { safe: true, description: 'Systemd-Services verwalten', sudoOnly: true },
  'journalctl': { safe: true, description: 'System-Logs anzeigen' },
  'dmesg': { safe: true, description: 'Kernel-Nachrichten anzeigen' },
  
  // Paket-Management (nur Abfragen)
  'pacman': { safe: true, description: 'Paket-Manager', allowedFlags: ['-Q', '-Ss', '-Si', '-Ql'], sudoRequired: ['-S', '-R', '-U'] },
  'yay': { safe: true, description: 'AUR-Helper', allowedFlags: ['-Q', '-Ss', '-Si'], sudoRequired: ['-S', '-R'] },
  
  // Git (sicher)
  'git': { safe: true, description: 'Git-Versionskontrolle', allowedSubcommands: ['status', 'log', 'diff', 'branch', 'remote'] },
  
  // Gefährliche Befehle (explizit blockiert)
  'rm': { safe: false, description: 'Dateien löschen - nicht erlaubt', danger: 'DATENLÖSCHUNG' },
  'mv': { safe: false, description: 'Dateien verschieben - nicht erlaubt', danger: 'DATENÄNDERUNG' },
  'cp': { safe: false, description: 'Dateien kopieren - nicht erlaubt', danger: 'DATENÄNDERUNG' },
  'chmod': { safe: false, description: 'Dateiberechtigungen ändern - nicht erlaubt', danger: 'SICHERHEIT' },
  'chown': { safe: false, description: 'Dateibesitzer ändern - nicht erlaubt', danger: 'SICHERHEIT' },
  'sudo': { safe: false, description: 'Root-Rechte - nicht erlaubt', danger: 'SICHERHEIT' },
  'su': { safe: false, description: 'Benutzer wechseln - nicht erlaubt', danger: 'SICHERHEIT' },
  'passwd': { safe: false, description: 'Passwort ändern - nicht erlaubt', danger: 'SICHERHEIT' },
  'fdisk': { safe: false, description: 'Partitionen bearbeiten - nicht erlaubt', danger: 'DATENLÖSCHUNG' },
  'mkfs': { safe: false, description: 'Dateisystem erstellen - nicht erlaubt', danger: 'DATENLÖSCHUNG' },
  'dd': { safe: false, description: 'Daten kopieren - nicht erlaubt', danger: 'DATENLÖSCHUNG' }
};

// Export System Report Handler
ipcMain.handle('export-system-report', async (_, format, data) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/, '_').slice(0, -5);
    const filename = `system-report-${timestamp}.${format.toLowerCase()}`;
    const filepath = path.join(os.homedir(), 'Downloads', filename);
    
    let content = '';
    
    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
        
      case 'txt':
        content = generateTextReport(data);
        break;
        
      case 'html':
        content = generateHtmlReport(data);
        break;
        
      default:
        throw new Error('Unsupported format');
    }
    
    fs.writeFileSync(filepath, content, 'utf8');
    
    return {
      success: true,
      message: `Report erfolgreich gespeichert: ${filename}`,
      filepath: filepath
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Export fehlgeschlagen: ${error.message}`
    };
  }
});

function generateTextReport(data) {
  let report = `LINUX SYSTEM DASHBOARD - SYSTEM REPORT\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Erstellt am: ${new Date().toLocaleString('de-DE')}\n\n`;
  
  // System Info
  if (data.system) {
    report += `SYSTEM INFORMATION\n`;
    report += `${'-'.repeat(20)}\n`;
    report += `Betriebssystem: ${data.system.os || 'N/A'}\n`;
    report += `Kernel: ${data.system.kernel || 'N/A'}\n`;
    report += `Architektur: ${data.system.arch || 'N/A'}\n`;
    report += `Hostname: ${data.system.hostname || 'N/A'}\n`;
    report += `Uptime: ${data.system.uptime || 'N/A'}\n\n`;
  }
  
  // CPU Info
  if (data.cpu) {
    report += `CPU INFORMATION\n`;
    report += `${'-'.repeat(15)}\n`;
    report += `CPU: ${data.cpu.model || 'N/A'}\n`;
    report += `Kerne: ${data.cpu.cores || 'N/A'}\n`;
    report += `Auslastung: ${data.cpu.usage || 'N/A'}%\n`;
    report += `Temperatur: ${data.cpu.temperature || 'N/A'}°C\n\n`;
  }
  
  // Memory Info
  if (data.memory) {
    report += `SPEICHER INFORMATION\n`;
    report += `${'-'.repeat(20)}\n`;
    report += `Total: ${formatBytes(data.memory.total || 0)}\n`;
    report += `Verwendet: ${formatBytes(data.memory.used || 0)}\n`;
    report += `Verfügbar: ${formatBytes(data.memory.available || 0)}\n`;
    report += `Auslastung: ${data.memory.usage || 'N/A'}%\n\n`;
  }
  
  // Disk Info
  if (data.disk) {
    report += `FESTPLATTEN INFORMATION\n`;
    report += `${'-'.repeat(25)}\n`;
    report += `Größe: ${formatBytes(data.disk.total || 0)}\n`;
    report += `Verwendet: ${formatBytes(data.disk.used || 0)}\n`;
    report += `Verfügbar: ${formatBytes(data.disk.available || 0)}\n`;
    report += `Auslastung: ${data.disk.usage || 'N/A'}%\n\n`;
  }
  
  // Network Info
  if (data.network && data.network.length > 0) {
    report += `NETZWERK INFORMATION\n`;
    report += `${'-'.repeat(20)}\n`;
    data.network.forEach(interface => {
      report += `Interface: ${interface.iface || 'N/A'}\n`;
      report += `  IP4: ${interface.ip4 || 'N/A'}\n`;
      report += `  Speed: ${interface.speed || 'N/A'} Mbps\n`;
      report += `  Status: ${interface.operstate || 'N/A'}\n`;
    });
    report += '\n';
  }
  
  // Top Processes
  if (data.processes && data.processes.length > 0) {
    report += `TOP PROZESSE (CPU)\n`;
    report += `${'-'.repeat(18)}\n`;
    data.processes.slice(0, 10).forEach((proc, index) => {
      report += `${index + 1}. ${proc.name || 'N/A'} - ${proc.cpu || 0}% CPU, ${formatBytes(proc.memory || 0)} RAM\n`;
    });
  }
  
  return report;
}

function generateHtmlReport(data) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linux System Dashboard - Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #1e1e1e; color: #cccccc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #4ec9b0; margin-bottom: 10px; }
        .timestamp { color: #888; }
        .section { background: #2d2d30; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #3e3e42; }
        .section h2 { color: #569cd6; margin-top: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #252526; padding: 15px; border-radius: 6px; border: 1px solid #404040; }
        .card h3 { color: #4ec9b0; margin-top: 0; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .metric-label { color: #cccccc; }
        .metric-value { color: #dcdcaa; font-weight: bold; }
        .process-list { max-height: 300px; overflow-y: auto; }
        .process-item { padding: 8px; border-bottom: 1px solid #404040; }
        .process-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖥️ Linux System Dashboard - System Report</h1>
            <div class="timestamp">Erstellt am: ${new Date().toLocaleString('de-DE')}</div>
        </div>
        
        <div class="grid">
            ${data.system ? `
            <div class="card">
                <h3>📊 System Information</h3>
                <div class="metric"><span class="metric-label">Betriebssystem:</span> <span class="metric-value">${data.system.os || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Kernel:</span> <span class="metric-value">${data.system.kernel || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Architektur:</span> <span class="metric-value">${data.system.arch || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Hostname:</span> <span class="metric-value">${data.system.hostname || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Uptime:</span> <span class="metric-value">${data.system.uptime || 'N/A'}</span></div>
            </div>
            ` : ''}
            
            ${data.cpu ? `
            <div class="card">
                <h3>🖥️ CPU Information</h3>
                <div class="metric"><span class="metric-label">CPU:</span> <span class="metric-value">${data.cpu.model || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Kerne:</span> <span class="metric-value">${data.cpu.cores || 'N/A'}</span></div>
                <div class="metric"><span class="metric-label">Auslastung:</span> <span class="metric-value">${data.cpu.usage || 'N/A'}%</span></div>
                <div class="metric"><span class="metric-label">Temperatur:</span> <span class="metric-value">${data.cpu.temperature || 'N/A'}°C</span></div>
            </div>
            ` : ''}
            
            ${data.memory ? `
            <div class="card">
                <h3>🧠 Speicher Information</h3>
                <div class="metric"><span class="metric-label">Total:</span> <span class="metric-value">${formatBytes(data.memory.total || 0)}</span></div>
                <div class="metric"><span class="metric-label">Verwendet:</span> <span class="metric-value">${formatBytes(data.memory.used || 0)}</span></div>
                <div class="metric"><span class="metric-label">Verfügbar:</span> <span class="metric-value">${formatBytes(data.memory.available || 0)}</span></div>
                <div class="metric"><span class="metric-label">Auslastung:</span> <span class="metric-value">${data.memory.usage || 'N/A'}%</span></div>
            </div>
            ` : ''}
            
            ${data.disk ? `
            <div class="card">
                <h3>💾 Festplatten Information</h3>
                <div class="metric"><span class="metric-label">Größe:</span> <span class="metric-value">${formatBytes(data.disk.total || 0)}</span></div>
                <div class="metric"><span class="metric-label">Verwendet:</span> <span class="metric-value">${formatBytes(data.disk.used || 0)}</span></div>
                <div class="metric"><span class="metric-label">Verfügbar:</span> <span class="metric-value">${formatBytes(data.disk.available || 0)}</span></div>
                <div class="metric"><span class="metric-label">Auslastung:</span> <span class="metric-value">${data.disk.usage || 'N/A'}%</span></div>
            </div>
            ` : ''}
        </div>
        
        ${data.processes && data.processes.length > 0 ? `
        <div class="section">
            <h2>🔄 Top Prozesse (CPU)</h2>
            <div class="process-list">
                ${data.processes.slice(0, 15).map((proc, index) => `
                <div class="process-item">
                    <strong>${index + 1}. ${proc.name || 'N/A'}</strong><br>
                    CPU: ${proc.cpu || 0}% | RAM: ${formatBytes(proc.memory || 0)} | PID: ${proc.pid || 'N/A'}
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${data.network && data.network.length > 0 ? `
        <div class="section">
            <h2>🌐 Netzwerk Interfaces</h2>
            <div class="grid">
                ${data.network.map(interface => `
                <div class="card">
                    <h3>${interface.iface || 'N/A'}</h3>
                    <div class="metric"><span class="metric-label">IP4:</span> <span class="metric-value">${interface.ip4 || 'N/A'}</span></div>
                    <div class="metric"><span class="metric-label">Speed:</span> <span class="metric-value">${interface.speed || 'N/A'} Mbps</span></div>
                    <div class="metric"><span class="metric-label">Status:</span> <span class="metric-value">${interface.operstate || 'N/A'}</span></div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open File Handler
ipcMain.handle('open-file', async (_, filepath) => {
  try {
    await shell.openPath(filepath);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Terminal-Backend IPC Handler
ipcMain.handle('execute-terminal-command', async (event, commandString) => {
  try {
    console.log(`Terminal command requested: ${commandString}`);
    
    // Command parsen
    const parts = commandString.trim().split(/\s+/);
    const baseCommand = parts[0];
    const args = parts.slice(1);
    
    // Leerer Befehl
    if (!baseCommand) {
      return {
        success: false,
        output: 'Kein Befehl eingegeben'
      };
    }
    
    // Spezial-Befehle
    if (baseCommand === 'clear') {
      return {
        success: true,
        output: '',
        special: 'clear'
      };
    }
    
    if (baseCommand === 'help' || baseCommand === '--help') {
      return {
        success: true,
        output: generateHelpText()
      };
    }
    
    if (baseCommand === 'exit') {
      return {
        success: true,
        output: 'Terminal-Session beendet',
        special: 'exit'
      };
    }
    
    // Command-Sicherheitsprüfung
    const commandInfo = ALLOWED_COMMANDS[baseCommand];
    
    if (!commandInfo) {
      return {
        success: false,
        output: `Befehl '${baseCommand}' ist nicht erlaubt oder unbekannt.\nTipp: Verwenden Sie 'help' für erlaubte Befehle.`
      };
    }
    
    if (!commandInfo.safe) {
      return {
        success: false,
        output: `⚠️  SICHERHEIT: Befehl '${baseCommand}' ist aus Sicherheitsgründen gesperrt.\nGrund: ${commandInfo.danger || 'Potentiell gefährlich'}\n\nVerwenden Sie ein echtes Terminal für administrative Aufgaben.`
      };
    }
    
    // Timeout für Befehl
    const timeout = commandInfo.timeout || 5000; // 5 Sekunden Standard
    
    // Befehl ausführen
    return new Promise((resolve) => {
      const child = exec(commandString, {
        timeout: timeout,
        maxBuffer: 1024 * 1024, // 1MB Buffer
        cwd: process.env.HOME || '/home/user'
      }, (error, stdout, stderr) => {
        
        if (error) {
          // Timeout
          if (error.code === 'TIMEOUT') {
            resolve({
              success: false,
              output: `⏰ Befehl-Timeout (${timeout/1000}s) erreicht.\nBefehl wurde abgebrochen.`
            });
            return;
          }
          
          // Anderer Fehler
          resolve({
            success: false,
            output: `Fehler: ${error.message}\n${stderr || ''}`.trim()
          });
          return;
        }
        
        // Erfolg
        const output = stdout.trim();
        resolve({
          success: true,
          output: output || '(Kein Output)'
        });
      });
      
      // Prozess nach Timeout killen
      setTimeout(() => {
        try {
          child.kill('SIGTERM');
        } catch (e) {
          // Bereits beendet
        }
      }, timeout + 1000);
    });
    
  } catch (error) {
    console.error('Terminal execution error:', error);
    return {
      success: false,
      output: `System-Fehler: ${error.message}`
    };
  }
});

// Hilfsfunktion für Help-Text
function generateHelpText() {
  let helpText = `\n💻 Linux System Dashboard - Terminal\n`;
  helpText += `=======================================\n\n`;
  
  helpText += `🛡️ Sicherheits-Features:\n`;
  helpText += `• Nur sichere Befehle erlaubt\n`;
  helpText += `• Timeout-Schutz (5-10s)\n`;
  helpText += `• Kein Root-Zugriff\n`;
  helpText += `• Sandbox-Umgebung\n\n`;
  
  helpText += `✅ Erlaubte Befehle:\n\n`;
  
  const categories = {
    'System-Info': ['ls', 'pwd', 'whoami', 'date', 'uptime', 'id'],
    'Monitoring': ['top', 'ps', 'df', 'free', 'lscpu', 'netstat'],
    'Datei-Operationen': ['cat', 'head', 'tail', 'file', 'wc', 'grep'],
    'Netzwerk': ['ping', 'ip'],
    'Logs': ['journalctl', 'dmesg'],
    'Pakete': ['pacman -Q', 'yay -Q']
  };
  
  Object.entries(categories).forEach(([category, commands]) => {
    helpText += `📁 ${category}:\n`;
    commands.forEach(cmd => {
      const info = ALLOWED_COMMANDS[cmd.split(' ')[0]];
      helpText += `   ${cmd.padEnd(12)} - ${info ? info.description : 'System-Befehl'}\n`;
    });
    helpText += `\n`;
  });
  
  helpText += `❌ Gesperrte Befehle:\n`;
  helpText += `   rm, mv, cp, chmod, sudo, etc.\n`;
  helpText += `   (Aus Sicherheitsgründen - nutzen Sie ein echtes Terminal)\n\n`;
  
  helpText += `💡 Spezial-Befehle:\n`;
  helpText += `   help     - Diese Hilfe anzeigen\n`;
  helpText += `   clear    - Terminal leeren\n`;
  helpText += `   exit     - Terminal schließen\n`;
  
  return helpText;
}
