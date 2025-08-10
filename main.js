const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');
const fs = require('fs');
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
        console.log('Auto-Updater erfolgreich initialisiert');
      } catch (error) {
        console.log('Auto-Updater konnte nicht initialisiert werden:', error.message);
      }
    } else {
      console.log('Auto-Updater übersprungen (lokaler Test)');
    }
  });

  // Entwicklungsmodus
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
        used: mem.used,
        free: mem.free,
        active: mem.active
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

// Legacy IPC Handler für Software-Installation (für Rückwärtskompatibilität)
ipcMain.handle('install-package', async (_, packageName, source = 'official') => {
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
    if (source === 'aur') {
      // Prüfe ob yay verfügbar ist
      exec('which yay', (yayCheckError) => {
        if (yayCheckError) {
          resolve({ success: false, error: 'yay ist nicht installiert. AUR-Pakete können nicht installiert werden.' });
        } else {
          command = `yay -S --noconfirm ${sanitizedPackageName}`;
          exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: error.message, details: stderr });
            } else {
              resolve({ success: true, output: stdout });
            }
          });
        }
      });
    } else {
      // Offizielle Pakete mit pacman
      command = `sudo pacman -S --noconfirm ${sanitizedPackageName}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message, details: stderr });
        } else {
          resolve({ success: true, output: stdout });
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
          console.log('Lock-Datei konnte nicht entfernt werden:', lockError);
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
          console.log('Update Progress:', data.toString());
        });

        child.stderr.on('data', (data) => {
          console.log('Update Error:', data.toString());
        });
      });
    });
  });
});

// IPC Handler für System-Neustart
ipcMain.handle('reboot-system', async () => {
  return new Promise((resolve) => {
    exec('sudo reboot', (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
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
      
      console.log(`UFW Status Check: ${isActive ? 'active' : 'inactive'}`);
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
      
      console.log(`Current UFW Status: ${isActive ? 'active' : 'inactive'}`);
      
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

// IPC Handler für Terminal-Kommandos
ipcMain.handle('execute-terminal-command', async (_, command) => {
  // Sicherheitsvalidierung
  if (!command || typeof command !== 'string') {
    return { success: false, error: 'Ungültiger Befehl' };
  }

  // Gefährliche Befehle blockieren
  const dangerousCommands = ['rm -rf', 'dd if=', 'mkfs', 'fdisk', 'parted', 'sudo rm', 'sudo dd'];
  const lowerCommand = command.toLowerCase();
  
  for (const dangerous of dangerousCommands) {
    if (lowerCommand.includes(dangerous)) {
      return { 
        success: false, 
        error: 'Gefährlicher Befehl blockiert',
        output: 'bash: Befehl aus Sicherheitsgründen nicht erlaubt'
      };
    }
  }

  return new Promise((resolve) => {
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          error: error.message,
          output: stderr || `bash: ${command}: command not found`,
          exitCode: error.code
        });
      } else {
        resolve({
          success: true,
          output: stdout || 'Command executed successfully',
          stderr: stderr,
          exitCode: 0
        });
      }
    });
  });
});

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
