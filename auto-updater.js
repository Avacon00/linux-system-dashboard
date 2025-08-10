const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

// Auto-Updater Konfiguration
class AutoUpdater {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.isUpdateAvailable = false;
        
        // GitHub-spezifische Konfiguration
        autoUpdater.setFeedURL({
            provider: 'github',
            owner: 'Avacon00',
            repo: 'linux-system-dashboard',
            private: false
        });
        
        // Logging konfigurieren
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        
        this.setupEventHandlers();
        this.setupIPC();
    }
    
    setupEventHandlers() {
        // Update verfügbar
        autoUpdater.on('update-available', (info) => {
            log.info('Update verfügbar:', info);
            this.isUpdateAvailable = true;
            
            this.mainWindow.webContents.send('update-available', {
                version: info.version,
                releaseNotes: info.releaseNotes,
                releaseDate: info.releaseDate
            });
            
            // Optional: Automatisch herunterladen
            autoUpdater.downloadUpdate();
        });
        
        // Kein Update verfügbar
        autoUpdater.on('update-not-available', () => {
            log.info('Kein Update verfügbar');
            this.mainWindow.webContents.send('update-not-available');
        });
        
        // Download-Progress
        autoUpdater.on('download-progress', (progress) => {
            this.mainWindow.webContents.send('update-download-progress', {
                percent: Math.round(progress.percent),
                transferred: progress.transferred,
                total: progress.total,
                bytesPerSecond: progress.bytesPerSecond
            });
        });
        
        // Update heruntergeladen
        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update heruntergeladen:', info);
            this.mainWindow.webContents.send('update-downloaded', {
                version: info.version
            });
            
            // Benutzer fragen, ob Update installiert werden soll
            this.promptInstallUpdate(info);
        });
        
        // Fehler beim Update
        autoUpdater.on('error', (error) => {
            log.error('Update-Fehler:', error);
            this.mainWindow.webContents.send('update-error', {
                message: error.message
            });
        });
    }
    
    setupIPC() {
        // Update manuell prüfen
        ipcMain.handle('check-for-updates', async () => {
            try {
                log.info('Prüfe auf Updates...');
                const result = await autoUpdater.checkForUpdates();
                return {
                    success: true,
                    updateInfo: result?.updateInfo || null
                };
            } catch (error) {
                log.error('Fehler beim Update-Check:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        // Update installieren
        ipcMain.handle('install-update', () => {
            autoUpdater.quitAndInstall();
        });
        
        // Update später installieren
        ipcMain.handle('install-update-later', () => {
            // Update wird beim nächsten App-Start installiert
            return { success: true };
        });
        
        // Update-Info abrufen
        ipcMain.handle('get-update-info', () => {
            return {
                isUpdateAvailable: this.isUpdateAvailable,
                currentVersion: require('./package.json').version
            };
        });
    }
    
    async promptInstallUpdate(info) {
        const result = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update verfügbar',
            message: `Linux System Dashboard ${info.version} ist verfügbar!`,
            detail: `Ihre aktuelle Version: ${require('./package.json').version}\nNeue Version: ${info.version}\n\nMöchten Sie das Update jetzt installieren?`,
            buttons: ['Jetzt installieren', 'Später', 'Überspringen'],
            defaultId: 0,
            cancelId: 2,
            icon: null
        });
        
        if (result.response === 0) {
            // Jetzt installieren
            autoUpdater.quitAndInstall();
        } else if (result.response === 1) {
            // Später installieren (beim nächsten Start)
            log.info('Update wird beim nächsten Start installiert');
        }
        // Bei "Überspringen" passiert nichts
    }
    
    // Prüfe auf Updates beim App-Start
    checkForUpdatesOnStartup() {
        // Kurz warten, damit die App vollständig geladen ist
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 5000); // 5 Sekunden nach Start
    }
    
    // Prüfe regelmäßig auf Updates (alle 4 Stunden)
    startPeriodicUpdateCheck() {
        setInterval(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 4 * 60 * 60 * 1000); // 4 Stunden
    }
}

module.exports = AutoUpdater;