// Multi-language translations for Linux System Dashboard

const translations = {
    de: {
        // App Title
        appTitle: "Linux System Dashboard",
        
        // Title Bar
        minimizeWindow: "Fenster minimieren",
        minimizeToTray: "In Systemleiste minimieren",
        maximizeWindow: "Fenster maximieren",
        
        // Sidebar Navigation
        systemInfo: "System-Info",
        systemInfoTooltip: "CPU, RAM, Festplatten, Prozesse und Netzwerk-Informationen in Echtzeit",
        quickActions: "Schnellaktionen",
        quickActionsTooltip: "Updates installieren, Software suchen, Dienste verwalten und Sicherheits-Features",
        learningArea: "Lernbereich",
        learningAreaTooltip: "Linux-Befehle lernen, Tipps für Einsteiger und nützliche Tutorials",
        terminal: "Terminal",
        terminalTooltip: "Integriertes Terminal zum Ausführen von Linux-Befehlen direkt in der App",
        
        // Language Switcher
        languageSwitcher: "Sprache wechseln / Switch Language",
        
        // System Tab
        systemOverview: "📊 System-Übersicht",
        refresh: "🔄 Aktualisieren",
        export: "📊 Export",
        
        // Quick Stats
        cpu: "CPU",
        ram: "RAM",
        storage: "Speicher",
        uptime: "Laufzeit",
        
        // Tooltips for Quick Stats
        cpuTooltip: "Zeigt aktuelle CPU-Auslastung. Werte über 80% können zu Verlangsamungen führen",
        ramTooltip: "Zeigt RAM-Speicher-Nutzung. Bei über 90% wird das System langsamer",
        storageTooltip: "Zeigt belegten Festplatten-Speicher. Bei über 95% können Probleme auftreten",
        uptimeTooltip: "Zeigt wie lange das System bereits läuft. Längere Uptime bedeutet Stabilität",
        
        // Speed Selector
        speedHigh: "1s (Hoch)",
        speedNormal: "2s (Normal)",
        speedRecommended: "3s (Empfohlen)",
        speedEconomical: "5s (Sparsam)",
        speedMinimal: "10s (Minimal)",
        
        // System Information
        systemInformation: "System-Informationen",
        operatingSystem: "Betriebssystem",
        kernel: "Kernel",
        architecture: "Architektur",
        hostname: "Hostname",
        
        // CPU Information
        cpuInformation: "CPU-Informationen",
        manufacturer: "Hersteller",
        brand: "Marke",
        cores: "Kerne",
        threads: "Threads",
        baseSpeed: "Basis-Geschw.",
        maxSpeed: "Max-Geschw.",
        temperature: "Temperatur",
        estimatedTemperature: "Geschätzter Wert (keine Sensordaten für dieses Gerät verfügbar)",

        // Memory Information
        memoryInformation: "Arbeitsspeicher-Informationen",
        total: "Gesamt",
        used: "Belegt",
        free: "Frei",
        available: "Verfügbar",
        buffers: "Puffer",
        cached: "Cache",
        
        // Storage Information
        storageInformation: "Speicher-Informationen",
        filesystem: "Dateisystem",
        size: "Größe",
        type: "Typ",
        
        // Network Information
        networkInformation: "Netzwerk-Informationen",
        interface: "Schnittstelle",
        ipAddress: "IP-Adresse",
        macAddress: "MAC-Adresse",
        speed: "Geschwindigkeit",
        download: "Download",
        upload: "Upload",
        totalTraffic: "Gesamt-Traffic",
        downloaded: "Heruntergeladen",
        uploaded: "Hochgeladen",
        
        // Process Information
        runningProcesses: "Laufende Prozesse",
        processName: "Name",
        pid: "PID",
        cpuUsage: "CPU-Nutzung",
        memoryUsage: "RAM-Nutzung",
        
        // Quick Actions Tab
        quickActionsTitle: "⚡ Schnellaktionen",
        
        // System Updates
        systemUpdates: "🔄 System-Updates",
        updatesAvailable: "Updates verfügbar",
        checkUpdates: "Updates prüfen",
        checkUpdatesTooltip: "Überprüft verfügbare System-Updates von den Paket-Repositories",
        installUpdates: "Updates installieren", 
        installUpdatesTooltip: "Installiert alle verfügbaren Updates. Dies kann einige Minuten dauern",
        
        // Software Installation
        softwareInstall: "📦 Software installieren",
        packageSearchPlaceholder: "Software suchen (z.B. Chrome, Brave, Firefox)...",
        packageSearchTooltip: "Gib den Namen der Software ein, die du installieren möchtest. Funktioniert mit offiziellen Repos und AUR",
        searchPackages: "Suchen",
        searchPackagesTooltip: "Startet die Suche nach Software in den Paket-Repositories. Zeigt installierbare Pakete an",
        
        // System Services
        systemServices: "🔧 Dienste",
        
        // Firewall
        firewall: "🛡️ Firewall",
        firewallStatus: "Unbekannt",
        toggleFirewall: "Firewall umschalten",
        toggleFirewallTooltip: "Aktiviert oder deaktiviert die UFW-Firewall zum Schutz vor unerwünschten Netzwerkzugriffen",
        
        // Quick Tools
        quickTools: "🛠️ Schnellzugriff",
        openTerminal: "Terminal öffnen",
        openFileManager: "Dateimanager öffnen", 
        openSystemMonitor: "System-Monitor öffnen",
        openSoftwareCenter: "Software-Center öffnen",
        
        // Security Center
        securityCenter: "🔒 Sicherheits-Center",
        securityStatus: "📊 Sicherheits-Status",
        sshStatus: "SSH-Status",
        fail2banStatus: "Fail2Ban",
        openPorts: "Offene Ports",
        checking: "Prüfe...",
        scanning: "Scanne...",
        startSecurityScan: "Sicherheitsscan starten",
        securityScanTooltip: "Führt einen umfassenden Sicherheitsscan durch (SSH, Fail2Ban, offene Ports)",
        
        // Security Summary
        securityScore: "Sicherheitsbewertung", 
        securityRecommendations: "Empfehlungen",
        
        // Security Summary Details
        securityEvaluation: "Sicherheits-Auswertung",
        checked: "Geprüft",
        completed: "Abgeschlossen",
        successfullyCompleted: "Erfolgreich abgeschlossen",
        recommendationsForBeginners: "💡 Empfehlungen für Anfänger:",
        perfectAllChecksSuccessful: "🎉\nPerfekt! Alle Sicherheitschecks erfolgreich. Führe diese Prüfungen regelmäßig (wöchentlich) durch.",
        
        // Individual Security Checks
        securityUpdatesCheck: "Sicherheitsupdates:",
        packageSecurityCheck: "Paket-Sicherheit:", 
        malwareScanCheck: "Schadprogramm-Scan:",
        networkSecurityCheck: "Netzwerk-Sicherheit:",
        
        // Security Action Notifications
        checkingSecurityUpdates: "Prüfe Sicherheitsupdates...",
        performingPackageAudit: "Führe Paket-Audit durch...",
        checkingForRootkits: "Prüfe auf Rootkits...",
        scanningNetwork: "Scanne Netzwerk...",
        
        // Security Recommendations
        securityUpdatesFailed: "Sicherheitsupdates fehlgeschlagen: Überprüfe deine Internetverbindung und starte das System neu.",
        packageAuditFailed: "Paket-Audit fehlgeschlagen: Führe 'sudo pacman -Syu' im Terminal aus, um Pakete zu aktualisieren.",
        rootkitScanNotAvailable: "Rootkit-Scan nicht verfügbar: Installiere 'rkhunter' oder 'chkrootkit' für erweiterte Sicherheit.",
        networkScanFailed: "Netzwerk-Scan fehlgeschlagen: Installiere 'nmap' für detaillierte Port-Analysen.",
        
        // Learning Area Tab
        learningAreaTitle: "📚 Lernbereich",
        linuxBasics: "Linux-Grundlagen",
        basicCommands: "Grundlegende Befehle",
        fileSystem: "Dateisystem",
        processManagement: "Prozess-Verwaltung",
        networkCommands: "Netzwerk-Befehle",
        systemAdministration: "System-Administration",
        
        // Terminal Tab
        terminalTitle: "💻 Terminal-Simulator", 
        newTerminal: "Neues Terminal",
        newTerminalTooltip: "Startet eine neue Terminal-Session",
        clearTerminal: "Terminal leeren",
        clearTerminalTooltip: "Löscht alle Ausgaben im Terminal",
        
        // Common Actions
        loading: "Lädt...",
        error: "Fehler",
        success: "Erfolgreich",
        warning: "Warnung",
        info: "Information",
        
        // Notifications
        startingSecurityScan: "Starte Sicherheitsscan...",
        systemUpToDateNotif: "System ist aktuell",
        securityScanCompleted: "Sicherheitsscan abgeschlossen",
        allSecurityChecksCompleted: "Alle Sicherheitschecks abgeschlossen!",
        errorSecurityScan: "Fehler beim Sicherheitsscan",
        newTerminalStarted: "Neues Terminal gestartet",
        fileOpenError: "Datei konnte nicht geöffnet werden",
        commandExecutionError: "Fehler beim Ausführen des Befehls",
        unexpectedFirewallError: "Unerwarteter Fehler bei der Firewall-Einstellung",
        openTerminalManually: "Bitte öffnen Sie ein Terminal und führen den Befehl manuell aus",
        
        // Error Messages
        errorOccurred: "Ein Fehler ist aufgetreten",
        noDataAvailable: "Keine Daten verfügbar",
        operationFailed: "Vorgang fehlgeschlagen",
        errorCheckingUpdates: "Fehler beim Prüfen der Updates",
        errorRebootingSystem: "Fehler beim Neustart des Systems",
        errorInstallingUpdates: "Fehler bei der Update-Installation",
        errorSearchingPackages: "Fehler bei der Paketsuche",
        errorInstallingPackage: "Fehler bei der Paketinstallation",
        errorLoadingServices: "Fehler beim Laden der Dienste",
        errorLoadingFirewallStatus: "Fehler beim Laden des Firewall-Status",
        errorToggleFirewall: "Fehler beim Toggle der Firewall",
        errorExecutingCommand: "Fehler beim Ausführen des Befehls",
        errorOpeningFile: "Fehler beim Öffnen der Datei",
        exportError: "Export-Fehler",
        exportFailed: "Export fehlgeschlagen",
        exportFailedWithReason: "Export fehlgeschlagen",
        unknownError: "Unbekannter Fehler",
        unknownSearchError: "Unbekannter Fehler bei der Suche",
        retryButton: "Erneut versuchen",
        errorInstallingUpdatesLong: "Fehler bei der Update-Installation",
        errorCollectingSystemData: "Fehler beim Sammeln der Systemdaten",
        errorSecurityScanGeneric: "Fehler beim Sicherheitsscan",
        errorCheckingSecurityUpdates: "Fehler beim Prüfen der Sicherheitsupdates",
        errorPackageAudit: "Fehler beim Paket-Audit",
        errorRootkitScan: "Fehler beim Rootkit-Scan",
        errorNetworkScan: "Fehler beim Netzwerk-Scan",
        
        // Success Messages
        operationSuccessful: "Vorgang erfolgreich",
        systemUpdated: "System aktualisiert",
        packageInstalled: "Paket installiert",
        
        // Time Units
        seconds: "Sekunden",
        minutes: "Minuten",
        hours: "Stunden",
        days: "Tage",
        
        // Dynamic Content
        cpuCoresDetail: "CPU-Kerne im Detail:",
        cpuCore: "Kern",
        storageDevices: "Speicher-Geräte",
        temperatureAndSensors: "🌡️ Temperatur & Sensoren",
        runtime: "Laufzeit",
        
        // Quick Actions Dynamic Content
        systemIsUpToDate: "System ist aktuell - keine Updates verfügbar",
        lastCheck: "Letzte Prüfung:",
        checkingUpdates: "Prüfe Updates...",
        allPackagesUpToDate: "Alle Pakete sind aktuell! 🎉",
        active: "aktiv",
        inactive: "Inaktiv",
        sshDisabled: "SSH ist deaktiviert",
        fail2banNotActive: "Fail2Ban ist nicht aktiv",
        openPortsFound: "offene Ports gefunden",
        
        // Security Actions
        securityActionsForBeginners: "⚡ Sicherheits-Aktionen für Einsteiger",
        checkSecurityUpdates: "Sicherheitsupdates prüfen",
        checkSecurityUpdatesDesc: "Überprüft verfügbare Sicherheits-Patches",
        checkPackageSecurity: "Paket-Sicherheit prüfen",
        checkPackageSecurityDesc: "Scannt installierte Programme auf Schwachstellen",
        malwareScan: "Schadprogramm-Scan",
        malwareScanDesc: "Sucht nach Rootkits und Malware",
        networkSecurity: "Netzwerk-Sicherheit",
        networkSecurityDesc: "Analysiert offene Verbindungen und Ports",
        runAllSecurityChecks: "🛡️ Alle Sicherheitschecks ausführen",
        securityEvents: "📋 Sicherheits-Ereignisse",
        notChecked: "Nicht geprüft",
        easy: "EINFACH",
        medium: "MITTEL", 
        advanced: "ERWEITERT",
        
        // Security Action Names (for summary display)
        securityUpdatesName: "Sicherheitsupdates",
        packageSecurityName: "Paket-Sicherheit", 
        malwareScanName: "Schadprogramm-Scan",
        networkSecurityName: "Netzwerk-Sicherheit",
        
        // Additional Security Recommendations
        firewallRecommendation: "Tipp: Aktiviere die Firewall über \"Firewall umschalten\" für besseren Schutz.",
        regularChecksRecommendation: "Plane regelmäßige Sicherheitschecks: Wöchentlich oder nach großen System-Updates.",
        errorOccurredGeneric: "Fehler aufgetreten",
        
        // Learning Area
        commandOfTheDay: "💡 Befehl des Tages",
        tryCommand: "Befehl ausprobieren",
        commonProblems: "🔧 Häufige Probleme",
        systemSlow: "System wird langsam",
        systemSlowDesc: "Überprüfen Sie die CPU- und RAM-Auslastung",
        networkNotWorking: "Netzwerk funktioniert nicht",
        networkNotWorkingDesc: "Überprüfen Sie die Netzwerkverbindung",
        updatesFailed: "Updates fehlgeschlagen",
        updatesFailedDesc: "Überprüfen Sie die Internetverbindung",
        showSolution: "Lösung anzeigen",
        tutorialsAndLinks: "📖 Tutorials & Links",
        archWiki: "📚 Arch Linux Wiki",
        linuxTutorials: "🐧 Linux.org Tutorials",
        bashManual: "💻 Bash Handbuch",
        sshTutorial: "🔐 SSH Tutorial",
        beginnerTips: "💡 Tipps für Einsteiger",
        terminalShortcutTip: "Terminal öffnen: Strg+Alt+T",
        fileManagerShortcutTip: "Dateimanager: Super+E",
        openApplications: "Anwendungen: Super+A",
        regularUpdates: "System-Updates: Regelmäßig ausführen"
    },
    
    en: {
        // App Title
        appTitle: "Linux System Dashboard",
        
        // Title Bar
        minimizeWindow: "Minimize window",
        minimizeToTray: "Minimize to system tray",
        maximizeWindow: "Maximize window",
        
        // Sidebar Navigation
        systemInfo: "System Info",
        systemInfoTooltip: "CPU, RAM, storage, processes and network information in real-time",
        quickActions: "Quick Actions",
        quickActionsTooltip: "Install updates, search software, manage services and security features",
        learningArea: "Learning Area",
        learningAreaTooltip: "Learn Linux commands, tips for beginners and useful tutorials",
        terminal: "Terminal",
        terminalTooltip: "Integrated terminal to execute Linux commands directly in the app",
        
        // Language Switcher
        languageSwitcher: "Switch Language / Sprache wechseln",
        
        // System Tab
        systemOverview: "📊 System Overview",
        refresh: "🔄 Refresh",
        export: "📊 Export",
        
        // Quick Stats
        cpu: "CPU",
        ram: "RAM",
        storage: "Storage",
        uptime: "Uptime",
        
        // Tooltips for Quick Stats
        cpuTooltip: "Shows current CPU usage. Values over 80% may cause slowdowns",
        ramTooltip: "Shows RAM memory usage. Over 90% will slow down the system",
        storageTooltip: "Shows used disk space. Over 95% may cause problems",
        uptimeTooltip: "Shows how long the system has been running. Longer uptime means stability",
        
        // Speed Selector
        speedHigh: "1s (High)",
        speedNormal: "2s (Normal)",
        speedRecommended: "3s (Recommended)",
        speedEconomical: "5s (Economical)",
        speedMinimal: "10s (Minimal)",
        
        // System Information
        systemInformation: "System Information",
        operatingSystem: "Operating System",
        kernel: "Kernel",
        architecture: "Architecture",
        hostname: "Hostname",
        
        // CPU Information
        cpuInformation: "CPU Information",
        manufacturer: "Manufacturer",
        brand: "Brand",
        cores: "Cores",
        threads: "Threads",
        baseSpeed: "Base Speed",
        maxSpeed: "Max Speed",
        temperature: "Temperature",
        estimatedTemperature: "Estimated value (no sensor data available for this device)",
        
        // Memory Information
        memoryInformation: "Memory Information",
        total: "Total",
        used: "Used",
        free: "Free",
        available: "Available",
        buffers: "Buffers",
        cached: "Cached",
        
        // Storage Information
        storageInformation: "Storage Information",
        filesystem: "Filesystem",
        size: "Size",
        type: "Type",
        
        // Network Information
        networkInformation: "Network Information",
        interface: "Interface",
        ipAddress: "IP Address",
        macAddress: "MAC Address",
        speed: "Speed",
        download: "Download",
        upload: "Upload",
        totalTraffic: "Total Traffic",
        downloaded: "Downloaded",
        uploaded: "Uploaded",
        
        // Process Information
        runningProcesses: "Running Processes",
        processName: "Name",
        pid: "PID",
        cpuUsage: "CPU Usage",
        memoryUsage: "Memory Usage",
        
        // Quick Actions Tab
        quickActionsTitle: "⚡ Quick Actions",
        
        // System Updates
        systemUpdates: "🔄 System Updates",
        updatesAvailable: "updates available",
        checkUpdates: "Check Updates",
        checkUpdatesTooltip: "Checks for available system updates from package repositories",
        installUpdates: "Install Updates",
        installUpdatesTooltip: "Installs all available updates. This may take several minutes",
        
        // Software Installation
        softwareInstall: "📦 Install Software",
        packageSearchPlaceholder: "Search software (e.g. Chrome, Brave, Firefox)...",
        packageSearchTooltip: "Enter the name of software you want to install. Works with official repos and AUR",
        searchPackages: "Search",
        searchPackagesTooltip: "Starts searching for software in package repositories. Shows installable packages",
        
        // System Services  
        systemServices: "🔧 Services",
        
        // Firewall
        firewall: "🛡️ Firewall",
        firewallStatus: "Unknown",
        toggleFirewall: "Toggle Firewall",
        toggleFirewallTooltip: "Enables or disables the UFW firewall to protect against unwanted network access",
        
        // Quick Tools
        quickTools: "🛠️ Quick Access",
        openTerminal: "Open Terminal",
        openFileManager: "Open File Manager",
        openSystemMonitor: "Open System Monitor", 
        openSoftwareCenter: "Open Software Center",
        
        // Security Center
        securityCenter: "🔒 Security Center",
        securityStatus: "📊 Security Status",
        sshStatus: "SSH Status",
        fail2banStatus: "Fail2Ban", 
        openPorts: "Open Ports",
        checking: "Checking...",
        scanning: "Scanning...",
        startSecurityScan: "Start Security Scan",
        securityScanTooltip: "Performs comprehensive security scan (SSH, Fail2Ban, open ports)",
        
        // Security Summary
        securityScore: "Security Score",
        securityRecommendations: "Recommendations",
        
        // Security Summary Details
        securityEvaluation: "Security Evaluation",
        checked: "Checked",
        completed: "Completed", 
        successfullyCompleted: "Successfully completed",
        recommendationsForBeginners: "💡 Recommendations for Beginners:",
        perfectAllChecksSuccessful: "🎉\nPerfect! All security checks successful. Run these checks regularly (weekly).",
        
        // Individual Security Checks
        securityUpdatesCheck: "Security Updates:",
        packageSecurityCheck: "Package Security:",
        malwareScanCheck: "Malware Scan:",
        networkSecurityCheck: "Network Security:",
        
        // Security Action Notifications
        checkingSecurityUpdates: "Checking security updates...",
        performingPackageAudit: "Performing package audit...",
        checkingForRootkits: "Checking for rootkits...",
        scanningNetwork: "Scanning network...",
        
        // Security Recommendations
        securityUpdatesFailed: "Security updates failed: Check your internet connection and restart the system.",
        packageAuditFailed: "Package audit failed: Run 'sudo pacman -Syu' in terminal to update packages.",
        rootkitScanNotAvailable: "Rootkit scan not available: Install 'rkhunter' or 'chkrootkit' for enhanced security.",
        networkScanFailed: "Network scan failed: Install 'nmap' for detailed port analysis.",
        
        // Learning Area Tab
        learningAreaTitle: "📚 Learning Area",
        linuxBasics: "Linux Basics",
        basicCommands: "Basic Commands",
        fileSystem: "File System",
        processManagement: "Process Management",
        networkCommands: "Network Commands",
        systemAdministration: "System Administration",
        
        // Terminal Tab
        terminalTitle: "💻 Terminal Simulator",
        newTerminal: "New Terminal", 
        newTerminalTooltip: "Starts a new terminal session",
        clearTerminal: "Clear Terminal",
        clearTerminalTooltip: "Clears all output in the terminal",
        
        // Common Actions
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Information",
        
        // Notifications
        startingSecurityScan: "Starting security scan...",
        systemUpToDateNotif: "System is up to date",
        securityScanCompleted: "Security scan completed",
        allSecurityChecksCompleted: "All security checks completed!",
        errorSecurityScan: "Security scan error",
        newTerminalStarted: "New terminal started",
        fileOpenError: "Could not open file",
        commandExecutionError: "Error executing command",
        unexpectedFirewallError: "Unexpected firewall error",
        openTerminalManually: "Please open a terminal and run the command manually",
        
        // Error Messages
        errorOccurred: "An error occurred",
        noDataAvailable: "No data available",
        operationFailed: "Operation failed",
        errorCheckingUpdates: "Error checking updates",
        errorRebootingSystem: "Error rebooting system",
        errorInstallingUpdates: "Error installing updates",
        errorSearchingPackages: "Error searching packages",
        errorInstallingPackage: "Error installing package",
        errorLoadingServices: "Error loading services",
        errorLoadingFirewallStatus: "Error loading firewall status",
        errorToggleFirewall: "Error toggling firewall",
        errorExecutingCommand: "Error executing command",
        errorOpeningFile: "Error opening file",
        exportError: "Export error",
        exportFailed: "Export failed",
        exportFailedWithReason: "Export failed",
        unknownError: "Unknown error",
        unknownSearchError: "Unknown search error",
        retryButton: "Retry",
        errorInstallingUpdatesLong: "Error installing updates",
        errorCollectingSystemData: "Error collecting system data",
        errorSecurityScanGeneric: "Error during security scan",
        errorCheckingSecurityUpdates: "Error checking security updates",
        errorPackageAudit: "Error during package audit",
        errorRootkitScan: "Error during rootkit scan",
        errorNetworkScan: "Error during network scan",
        
        // Success Messages
        operationSuccessful: "Operation successful",
        systemUpdated: "System updated",
        packageInstalled: "Package installed",
        
        // Time Units
        seconds: "seconds",
        minutes: "minutes",
        hours: "hours",
        days: "days",
        
        // Dynamic Content
        cpuCoresDetail: "CPU Cores in Detail:",
        cpuCore: "Core",
        storageDevices: "Storage Devices",
        temperatureAndSensors: "🌡️ Temperature & Sensors",
        runtime: "Uptime",
        
        // Quick Actions Dynamic Content
        systemIsUpToDate: "System is up to date - no updates available",
        lastCheck: "Last check:",
        checkingUpdates: "Checking updates...",
        allPackagesUpToDate: "All packages are up to date! 🎉",
        active: "active",
        inactive: "Inactive",
        sshDisabled: "SSH is disabled",
        fail2banNotActive: "Fail2Ban is not active",
        openPortsFound: "open ports found",
        
        // Security Actions
        securityActionsForBeginners: "⚡ Security Actions for Beginners",
        checkSecurityUpdates: "Check Security Updates",
        checkSecurityUpdatesDesc: "Checks for available security patches",
        checkPackageSecurity: "Check Package Security",
        checkPackageSecurityDesc: "Scans installed programs for vulnerabilities",
        malwareScan: "Malware Scan",
        malwareScanDesc: "Searches for rootkits and malware",
        networkSecurity: "Network Security",
        networkSecurityDesc: "Analyzes open connections and ports",
        runAllSecurityChecks: "🛡️ Run All Security Checks",
        securityEvents: "📋 Security Events",
        notChecked: "Not checked",
        easy: "EASY",
        medium: "MEDIUM",
        advanced: "ADVANCED",
        
        // Security Action Names (for summary display)
        securityUpdatesName: "Security Updates",
        packageSecurityName: "Package Security",
        malwareScanName: "Malware Scan", 
        networkSecurityName: "Network Security",
        
        // Additional Security Recommendations
        firewallRecommendation: "Tip: Enable the firewall via \"Toggle Firewall\" for better protection.",
        regularChecksRecommendation: "Schedule regular security checks: Weekly or after major system updates.",
        errorOccurredGeneric: "Error occurred",
        
        // Learning Area
        commandOfTheDay: "💡 Command of the Day",
        tryCommand: "Try Command",
        commonProblems: "🔧 Common Problems",
        systemSlow: "System is slow",
        systemSlowDesc: "Check CPU and RAM usage",
        networkNotWorking: "Network not working",
        networkNotWorkingDesc: "Check network connection",
        updatesFailed: "Updates failed",
        updatesFailedDesc: "Check internet connection",
        showSolution: "Show Solution",
        tutorialsAndLinks: "📖 Tutorials & Links",
        archWiki: "📚 Arch Linux Wiki",
        linuxTutorials: "🐧 Linux.org Tutorials",
        bashManual: "💻 Bash Manual",
        sshTutorial: "🔐 SSH Tutorial",
        beginnerTips: "💡 Tips for Beginners",
        terminalShortcutTip: "Open Terminal: Ctrl+Alt+T",
        fileManagerShortcutTip: "File Manager: Super+E",
        openApplications: "Applications: Super+A",
        regularUpdates: "System Updates: Run regularly"
    }
};

// Language management
let currentLanguage = localStorage.getItem('language') || 'de';

function t(key) {
    return translations[currentLanguage][key] || key;
}

function switchLanguage() {
    currentLanguage = currentLanguage === 'de' ? 'en' : 'de';
    localStorage.setItem('language', currentLanguage);
    updateLanguageDisplay();
    updateAllTexts();
}

function updateLanguageDisplay() {
    const languageLabel = document.getElementById('current-language');
    if (languageLabel) {
        languageLabel.textContent = currentLanguage.toUpperCase();
    }
    
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.title = t('languageSwitcher');
    }
}

function updateAllTexts() {
    // Update all text elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = t(key);
    });
    
    // Update all tooltip elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        const key = element.getAttribute('data-tooltip');
        element.title = t(key);
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, t, switchLanguage, updateAllTexts, updateLanguageDisplay };
}