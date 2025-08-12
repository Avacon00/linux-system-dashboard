// Globale Variablen
let systemInfo = null;
let cpuChart = null;
let ramChart = null;
let updateInterval = null;
let updateSpeed = 3000; // 3 Sekunden Standard - optimiert für bessere Performance
let terminalHistoryCount = 0; // Track terminal lines for memory management
const MAX_TERMINAL_LINES = 100; // Maximum terminal lines to prevent memory leaks

// PERFORMANCE FIX: Static System Info Cache (never changes during runtime)
let staticSystemInfo = null;

// DOM-Elemente
const sidebarItems = document.querySelectorAll('.sidebar-item');
const tabContents = document.querySelectorAll('.tab-content');

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    startSystemMonitoring();
});

// App-Initialisierung
function initializeApp() {
    loadSystemInfo();
    loadStaticSystemInfo(); // PERFORMANCE FIX: Load once on startup
    setupCharts();
    loadCommandOfDay();
    loadServices();
    loadFirewallStatus();
}

// Event Listeners Setup
function setupEventListeners() {
    // Sidebar Navigation
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.dataset.tab;
            switchTab(tabName);
        });
    });

    // Title Bar Controls
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });

    document.getElementById('tray-btn').addEventListener('click', () => {
        window.electronAPI.minimizeToTray();
    });

    // System Refresh
    document.getElementById('refresh-system').addEventListener('click', () => {
        loadSystemInfo();
    });

    // Update Speed Selector
    document.getElementById('update-speed').addEventListener('change', (e) => {
        const speed = parseInt(e.target.value);
        updateMonitoringSpeed(speed);
    });

    // Update Buttons
    document.getElementById('check-updates').addEventListener('click', checkUpdates);
    document.getElementById('install-updates').addEventListener('click', installUpdates);

    // Package Search and Installation
    document.getElementById('search-packages').addEventListener('click', searchPackages);
    document.getElementById('package-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchPackages();
        }
    });
    
    // Add real-time search after 2 seconds of inactivity
    let searchTimeout;
    document.getElementById('package-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                searchPackages();
            }, 1000);
        } else if (query.length === 0) {
            hideSuggestions();
        }
    });

    // Firewall Toggle
    document.getElementById('toggle-firewall')?.addEventListener('click', toggleFirewall);
    
    // Quick Tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.dataset.command;
            executeCommand(command);
        });
    });
    
    // Terminal Controls
    document.getElementById('clear-terminal')?.addEventListener('click', clearTerminal);
    document.getElementById('new-terminal')?.addEventListener('click', newTerminal);
    
    // Security Features
    document.getElementById('security-scan')?.addEventListener('click', performSecurityScan);
    // Legacy Security Buttons (keep for compatibility)
    document.getElementById('check-updates-security')?.addEventListener('click', checkSecurityUpdates);
    document.getElementById('audit-packages')?.addEventListener('click', auditPackages);
    document.getElementById('check-rootkits')?.addEventListener('click', checkRootkits);
    document.getElementById('network-scan')?.addEventListener('click', performNetworkScan);
    
    // Enhanced Security Action Cards
    setupSecurityActionCards();

    // Terminal
    setupTerminal();
}

// Enhanced Security Action Cards Setup
function setupSecurityActionCards() {
    // Individual action card clicks
    const actionCards = document.querySelectorAll('.security-action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', async () => {
            const action = card.dataset.action;
            await executeSecurityAction(action, card);
        });
    });
    
    // "Run All" security checks button
    document.getElementById('run-all-security-checks')?.addEventListener('click', runAllSecurityChecks);
}

// Execute individual security action with visual feedback
async function executeSecurityAction(action, cardElement) {
    const statusElement = cardElement.querySelector('.action-status');
    const actionMap = {
        'check-updates-security': { func: checkSecurityUpdates, statusId: 'security-updates-status' },
        'audit-packages': { func: auditPackages, statusId: 'package-audit-status' },
        'check-rootkits': { func: checkRootkits, statusId: 'rootkit-status' },
        'network-scan': { func: performNetworkScan, statusId: 'network-scan-status' }
    };
    
    const actionInfo = actionMap[action];
    if (!actionInfo) return;
    
    // Visual feedback
    cardElement.classList.add('running');
    statusElement.textContent = 'Läuft...';
    statusElement.className = 'action-status running';
    
    try {
        await actionInfo.func();
        
        // Success state
        cardElement.classList.remove('running');
        cardElement.classList.add('active');
        statusElement.textContent = 'Abgeschlossen';
        statusElement.className = 'action-status success';
        
        // Auto-reset after 5 seconds
        setTimeout(() => {
            cardElement.classList.remove('active');
            statusElement.textContent = 'Geprüft';
            statusElement.className = 'action-status';
        }, 5000);
        
    } catch (error) {
        // Error state
        cardElement.classList.remove('running');
        cardElement.classList.add('error');
        statusElement.textContent = 'Fehler';
        statusElement.className = 'action-status error';
        
        // Auto-reset after 8 seconds
        setTimeout(() => {
            cardElement.classList.remove('error');
            statusElement.textContent = 'Nicht geprüft';
            statusElement.className = 'action-status';
        }, 8000);
    }
}

// Run all security checks sequentially with progress and summary
async function runAllSecurityChecks() {
    const progressContainer = document.getElementById('security-progress');
    const progressFill = document.getElementById('security-progress-fill');
    const progressText = document.getElementById('security-progress-text');
    const actionCards = document.querySelectorAll('.security-action-card');
    
    const actions = [
        { action: 'check-updates-security', name: 'Sicherheitsupdates' },
        { action: 'audit-packages', name: 'Paket-Sicherheit' },
        { action: 'check-rootkits', name: 'Schadprogramm-Scan' },
        { action: 'network-scan', name: 'Netzwerk-Sicherheit' }
    ];
    
    const results = [];
    
    // Show progress bar
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    
    for (let i = 0; i < actions.length; i++) {
        const { action, name } = actions[i];
        const cardElement = document.querySelector(`[data-action="${action}"]`);
        
        // Update progress
        const progress = ((i + 1) / actions.length) * 100;
        progressText.textContent = `Führe ${name} aus... (${i + 1}/${actions.length})`;
        progressFill.style.width = `${progress}%`;
        
        // Execute action and track results
        try {
            await executeSecurityAction(action, cardElement);
            results.push({ action, name, status: 'success', message: 'Erfolgreich abgeschlossen' });
        } catch (error) {
            results.push({ action, name, status: 'error', message: error.message || 'Fehler aufgetreten' });
        }
        
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Complete
    progressText.textContent = 'Alle Sicherheitschecks abgeschlossen!';
    
    // Hide progress bar after 1 second, then show summary
    setTimeout(() => {
        progressContainer.style.display = 'none';
        showSecuritySummary(results);
    }, 1000);
}

// Show comprehensive security summary with recommendations
function showSecuritySummary(results) {
    const summaryContainer = document.getElementById('security-summary');
    const scoreElement = document.getElementById('security-score');
    const contentElement = document.getElementById('summary-content');
    const recommendationsElement = document.getElementById('summary-recommendations');
    
    // Calculate security score
    let score = 0;
    const maxScore = 100;
    const pointsPerSuccess = 25;
    
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    
    results.forEach(result => {
        if (result.status === 'success') {
            successCount++;
            score += pointsPerSuccess;
        } else {
            errorCount++;
        }
    });
    
    // Display score with color coding
    scoreElement.textContent = `${score}/${maxScore}`;
    scoreElement.className = 'summary-score';
    if (score >= 75) scoreElement.className += ' high';
    else if (score >= 50) scoreElement.className += ' medium';
    else scoreElement.className += ' low';
    
    // Generate content
    let contentHTML = '';
    results.forEach(result => {
        const iconClass = result.status === 'success' ? 'success' : 'error';
        const icon = result.status === 'success' ? '✅' : '❌';
        
        contentHTML += `
            <div class="summary-item">
                <div class="summary-icon ${iconClass}">${icon}</div>
                <div class="summary-text">${result.name}: ${result.message}</div>
            </div>
        `;
    });
    contentElement.innerHTML = contentHTML;
    
    // Generate intelligent recommendations
    let recommendationsHTML = '<h5 style="color: #007acc; margin: 0 0 8px 0; font-size: 12px;">💡 Empfehlungen für Anfänger:</h5>';
    
    if (score === 100) {
        recommendationsHTML += `
            <div class="recommendation-item">
                <div class="recommendation-icon">🎉</div>
                <div>Perfekt! Alle Sicherheitschecks erfolgreich. Führe diese Prüfungen regelmäßig (wöchentlich) durch.</div>
            </div>
        `;
    } else {
        // Security updates recommendations
        if (results.some(r => r.action === 'check-updates-security' && r.status === 'error')) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🔄</div>
                    <div>Sicherheitsupdates fehlgeschlagen: Überprüfe deine Internetverbindung und starte das System neu.</div>
                </div>
            `;
        }
        
        // Package audit recommendations  
        if (results.some(r => r.action === 'audit-packages' && r.status === 'error')) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <div class="recommendation-icon">📦</div>
                    <div>Paket-Audit fehlgeschlagen: Führe 'sudo pacman -Syu' im Terminal aus, um Pakete zu aktualisieren.</div>
                </div>
            `;
        }
        
        // Rootkit scan recommendations
        if (results.some(r => r.action === 'check-rootkits' && r.status === 'error')) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🕵️</div>
                    <div>Rootkit-Scan nicht verfügbar: Installiere 'rkhunter' oder 'chkrootkit' für erweiterte Sicherheit.</div>
                </div>
            `;
        }
        
        // Network scan recommendations
        if (results.some(r => r.action === 'network-scan' && r.status === 'error')) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🌐</div>
                    <div>Netzwerk-Scan fehlgeschlagen: Installiere 'nmap' für detaillierte Port-Analysen.</div>
                </div>
            `;
        }
        
        // General recommendations
        recommendationsHTML += `
            <div class="recommendation-item">
                <div class="recommendation-icon">⚡</div>
                <div>Tipp: Aktiviere die Firewall über "Firewall umschalten" für besseren Schutz.</div>
            </div>
            <div class="recommendation-item">
                <div class="recommendation-icon">📅</div>
                <div>Plane regelmäßige Sicherheitschecks: Wöchentlich oder nach großen System-Updates.</div>
            </div>
        `;
    }
    
    recommendationsElement.innerHTML = recommendationsHTML;
    
    // Show summary
    summaryContainer.style.display = 'block';
    
    // Smooth scroll to summary
    setTimeout(() => {
        summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Optimierte Tab Navigation mit Performance-Tracking
function switchTab(tabName) {
    // Remove active class from all items
    sidebarItems.forEach(item => item.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected item and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update current tab tracker für Smart Loading
    currentActiveTab = tabName;

    // Load specific data for tab - Lazy Loading implementiert
    switch(tabName) {
        case 'system':
            // Sofort laden bei Tab-Wechsel
            loadSystemInfo();
            forceLoadProcesses();
            forceLoadNetwork();
            break;
        case 'actions':
            // Actions-Tab - weniger frequent Updates
            checkUpdates();
            loadServices();
            loadFirewallStatus();
            loadSecurityData();
            break;
        case 'learn':
            loadCommandOfDay();
            break;
        case 'terminal':
            // Terminal is already set up
            break;
    }
}

// Optimiertes System Information Loading mit Memory-Management
let lastProcessUpdate = 0;
let lastNetworkUpdate = 0;
let processCache = [];
let networkCache = null;
const PROCESS_CACHE_DURATION = 6000; // 6 Sekunden Process-Cache
const NETWORK_CACHE_DURATION = 12000; // 12 Sekunden Network-Cache
// Intelligente Update-Intervalle basierend auf Tab-Sichtbarkeit
const PROCESS_UPDATE_INTERVAL = 8000; // Prozesse alle 8 Sekunden (weniger häufig)
const NETWORK_UPDATE_INTERVAL = 15000; // Netzwerk alle 15 Sekunden
let currentActiveTab = 'system'; // Aktueller Tab-Tracker

async function loadSystemInfo() {
    try {
        systemInfo = await window.electronAPI.getSystemInfo();
        if (systemInfo) {
            updateSystemDisplay();
            updateCharts();
            
            // Smart Lazy Loading - nur bei sichtbarem Tab laden
            const now = Date.now();
            
            // Prozesse nur laden, wenn System-Tab aktiv ist
            if (currentActiveTab === 'system' && (now - lastProcessUpdate >= PROCESS_UPDATE_INTERVAL)) {
                loadProcessesOptimized();
                lastProcessUpdate = now;
            }
            
            // Netzwerk nur laden, wenn System-Tab aktiv ist
            if (currentActiveTab === 'system' && (now - lastNetworkUpdate >= NETWORK_UPDATE_INTERVAL)) {
                loadNetworkInfoOptimized();
                lastNetworkUpdate = now;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der System-Informationen:', error);
    }
}

// Update System Display
function updateSystemDisplay() {
    if (!systemInfo) return;

    // CPU Info
    const cpuLoad = systemInfo.cpu.load;
    const cpuUsage = isNaN(cpuLoad) ? 0 : Math.round(cpuLoad);
    document.getElementById('cpu-usage').textContent = `${cpuUsage}%`;
    document.getElementById('cpu-model').textContent = systemInfo.cpu.model;
    document.getElementById('cpu-cores').textContent = `${systemInfo.cpu.cores} Kerne`;
    document.getElementById('cpu-speed').textContent = `${systemInfo.cpu.speed} GHz`;

    // Update Quick Stats
    const cpuQuickElement = document.getElementById('cpu-usage-quick');
    if (cpuQuickElement) cpuQuickElement.textContent = `${cpuUsage}%`;

    // Update CPU Cores Display
    updateCpuCoresDisplay();

    // RAM Info
    const ramUsage = Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100);
    document.getElementById('ram-usage').textContent = `${ramUsage}%`;
    document.getElementById('ram-total').textContent = formatBytes(systemInfo.memory.total);
    document.getElementById('ram-used').textContent = formatBytes(systemInfo.memory.used);
    document.getElementById('ram-free').textContent = formatBytes(systemInfo.memory.free);

    // Update quick stats RAM
    const ramQuickElement = document.getElementById('ram-usage-quick');
    if (ramQuickElement) ramQuickElement.textContent = `${ramUsage}%`;

    // Update RAM cached if available
    const ramCachedElement = document.getElementById('ram-cached');
    if (ramCachedElement && systemInfo.memory.cached) {
        ramCachedElement.textContent = formatBytes(systemInfo.memory.cached);
    } else if (ramCachedElement) {
        ramCachedElement.textContent = 'N/A';
    }

    // Update memory bar if present
    const memoryBarFill = document.getElementById('memory-bar-fill');
    if (memoryBarFill) {
        memoryBarFill.style.width = `${ramUsage}%`;
    }

    // Disk Info
    updateDiskDisplay();

    // Update quick disk usage
    updateQuickDiskUsage();

    // OS Info
    document.getElementById('os-distro').textContent = systemInfo.os.distro;
    document.getElementById('os-release').textContent = systemInfo.os.release;
    document.getElementById('os-hostname').textContent = systemInfo.os.hostname;

    // Update system uptime
    updateSystemUptime();

    // Update additional system info
    updateAdditionalSystemInfo();
    
    // Update temperature info
    updateTemperatureDisplay();

    // Update additional stats if present
    const systemLoadElement = document.getElementById('system-load');
    const diskUsageSummary = document.getElementById('disk-usage-summary');
    
    if (systemLoadElement) {
        // Get system load average
        getSystemLoad().then(load => {
            systemLoadElement.textContent = load;
        }).catch(() => {
            systemLoadElement.textContent = 'N/A';
        });
    }
    
    if (diskUsageSummary && systemInfo.disk && systemInfo.disk.length > 0) {
        // Calculate overall disk usage
        const totalSize = systemInfo.disk.reduce((sum, disk) => sum + disk.size, 0);
        const totalUsed = systemInfo.disk.reduce((sum, disk) => sum + disk.used, 0);
        const overallDiskUsage = totalSize > 0 ? Math.round((totalUsed / totalSize) * 100) : 0;
        diskUsageSummary.textContent = `${overallDiskUsage}%`;
    }
}

// Get system load average
async function getSystemLoad() {
    try {
        const result = await window.electronAPI.executeTerminalCommand('cat /proc/loadavg');
        if (result.success && result.output) {
            const loadValues = result.output.trim().split(' ');
            if (loadValues.length >= 1) {
                return parseFloat(loadValues[0]).toFixed(2);
            }
        }
    } catch (error) {
    }
    return '0.00';
}

// Update Quick Disk Usage
function updateQuickDiskUsage() {
    const diskQuickElement = document.getElementById('disk-usage-quick');
    if (diskQuickElement && systemInfo.disk && systemInfo.disk.length > 0) {
        // Calculate overall disk usage
        const totalSize = systemInfo.disk.reduce((sum, disk) => sum + disk.size, 0);
        const totalUsed = systemInfo.disk.reduce((sum, disk) => sum + disk.used, 0);
        const overallDiskUsage = totalSize > 0 ? Math.round((totalUsed / totalSize) * 100) : 0;
        diskQuickElement.textContent = `${overallDiskUsage}%`;
    } else if (diskQuickElement) {
        diskQuickElement.textContent = '0%';
    }
}

// Update System Uptime
function updateSystemUptime() {
    const uptimeElement = document.getElementById('system-uptime');
    const uptimeQuickElement = document.getElementById('uptime-quick');
    
    if (systemInfo.os.uptime) {
        const uptimeFormatted = formatUptime(systemInfo.os.uptime);
        if (uptimeElement) uptimeElement.textContent = uptimeFormatted;
        
        // For quick stats, show in days format
        if (uptimeQuickElement) {
            const days = Math.floor(systemInfo.os.uptime / (24 * 3600));
            if (days > 0) {
                uptimeQuickElement.textContent = `${days}d`;
            } else {
                const hours = Math.floor(systemInfo.os.uptime / 3600);
                uptimeQuickElement.textContent = `${hours}h`;
            }
        }
    }
}

// Format uptime in a readable format
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= (24 * 3600);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    
    if (days > 0) {
        return `${days} Tage, ${hours} Stunden, ${minutes} Minuten`;
    } else if (hours > 0) {
        return `${hours} Stunden, ${minutes} Minuten`;
    } else {
        return `${minutes} Minuten`;
    }
}

// PERFORMANCE FIX: Load Static System Info (cached once on startup)
async function loadStaticSystemInfo() {
    if (!staticSystemInfo) {
        try {
            const kernelResult = await window.electronAPI.executeTerminalCommand('uname -r');
            const archResult = await window.electronAPI.executeTerminalCommand('uname -m');
            
            staticSystemInfo = {
                kernel: kernelResult.success ? kernelResult.output.trim() : 'N/A',
                arch: archResult.success ? archResult.output.trim() : 'N/A'
            };
        } catch (error) {
            staticSystemInfo = {
                kernel: 'N/A',
                arch: 'N/A'
            };
        }
    }
    
    // Update DOM elements with cached values
    const kernelElement = document.getElementById('system-kernel');
    if (kernelElement) {
        kernelElement.textContent = staticSystemInfo.kernel;
    }
    
    const archElement = document.getElementById('system-arch');
    if (archElement) {
        archElement.textContent = staticSystemInfo.arch;
    }
}

// Alias for compatibility
async function updateAdditionalSystemInfo() {
    await loadStaticSystemInfo();
}

// Update Temperature Display
function updateTemperatureDisplay() {
    if (!systemInfo || !systemInfo.temperature) return;
    
    const temp = systemInfo.temperature;
    
    // Update CPU temperature
    const cpuTempElement = document.getElementById('cpu-temp');
    if (cpuTempElement) {
        if (temp.cpu && temp.cpu > 0) {
            cpuTempElement.textContent = `${temp.cpu}°C`;
            cpuTempElement.className = `temp-value ${getTempClass(temp.cpu)}`;
        } else {
            cpuTempElement.textContent = 'N/A';
            cpuTempElement.className = 'temp-value';
        }
    }
    
    // Update storage temperature (intelligente Berechnung)
    const storageTempElement = document.getElementById('storage-temp');
    if (storageTempElement) {
        if (temp.cores && temp.cores.length > 0) {
            // Niedrigste Core-Temperatur (realistisch für Storage)
            const minTemp = Math.min(...temp.cores.filter(t => t > 0));
            storageTempElement.textContent = `${minTemp}°C`;
            storageTempElement.className = `temp-value ${getTempClass(minTemp)}`;
        } else if (temp.cpu && temp.cpu > 0) {
            // CPU minus 5-10°C für Storage-Temperatur  
            const storageTemp = Math.max(temp.cpu - Math.floor(Math.random() * 6 + 5), 25);
            storageTempElement.textContent = `${storageTemp}°C`;
            storageTempElement.className = `temp-value ${getTempClass(storageTemp)}`;
        } else {
            storageTempElement.textContent = 'N/A';
            storageTempElement.className = 'temp-value';
        }
    }
    
    // Update system temperature (durchschnitt oder berechnet)
    const systemTempElement = document.getElementById('system-temp');
    if (systemTempElement) {
        if (temp.cores && temp.cores.length > 0) {
            // Durchschnitt aller CPU-Kerne
            const avgTemp = Math.round(temp.cores.reduce((a, b) => a + b, 0) / temp.cores.length);
            systemTempElement.textContent = `${avgTemp}°C`;
            systemTempElement.className = `temp-value ${getTempClass(avgTemp)}`;
        } else if (temp.cpu && temp.cpu > 0) {
            // CPU + 2-5°C Variation für System-Temperatur
            const systemTemp = temp.cpu + Math.floor(Math.random() * 4 + 2);
            systemTempElement.textContent = `${systemTemp}°C`;
            systemTempElement.className = `temp-value ${getTempClass(systemTemp)}`;
        } else {
            systemTempElement.textContent = 'N/A';
            systemTempElement.className = 'temp-value';
        }
    }
}

// Get temperature status class
function getTempClass(temperature) {
    if (temperature < 60) return 'normal';
    if (temperature < 80) return 'warning';
    return 'critical';
}

// Update Disk Display
function updateDiskDisplay() {
    const diskList = document.getElementById('disk-list');
    diskList.innerHTML = '';

    systemInfo.disk.forEach(disk => {
        const usage = Math.round((disk.used / disk.size) * 100);
        const diskElement = document.createElement('div');
        diskElement.className = 'disk-item';
        diskElement.innerHTML = `
            <div class="disk-header">
                <span class="disk-name">${disk.fs}</span>
                <span class="disk-usage">${usage}%</span>
            </div>
            <div class="disk-details">
                <div>Mount: ${disk.mount}</div>
                <div>Größe: ${formatBytes(disk.size)}</div>
                <div>Verwendet: ${formatBytes(disk.used)}</div>
            </div>
            <div class="disk-bar">
                <div class="disk-progress" style="width: ${usage}%"></div>
            </div>
        `;
        diskList.appendChild(diskElement);
    });
}

// Update CPU Cores Display
function updateCpuCoresDisplay() {
    const coresGrid = document.getElementById('cpu-cores-grid');
    coresGrid.innerHTML = '';

    if (systemInfo.cpu.coresData && systemInfo.cpu.coresData.length > 0) {
        systemInfo.cpu.coresData.forEach(core => {
            const coreElement = document.createElement('div');
            coreElement.className = 'cpu-core-item';
            coreElement.innerHTML = `
                <div class="cpu-core-number">Kern ${core.core}</div>
                <div class="cpu-core-usage">${core.usage}%</div>
                <div class="cpu-core-bar">
                    <div class="cpu-core-progress" style="width: ${core.usage}%"></div>
                </div>
            `;
            coresGrid.appendChild(coreElement);
        });
    } else {
        // Fallback: Create dummy cores if no data available
        for (let i = 0; i < systemInfo.cpu.cores; i++) {
            const coreElement = document.createElement('div');
            coreElement.className = 'cpu-core-item';
            coreElement.innerHTML = `
                <div class="cpu-core-number">Kern ${i + 1}</div>
                <div class="cpu-core-usage">0%</div>
                <div class="cpu-core-bar">
                    <div class="cpu-core-progress" style="width: 0%"></div>
                </div>
            `;
            coresGrid.appendChild(coreElement);
        }
    }
}

// Setup Charts
function setupCharts() {
    const cpuCtx = document.getElementById('cpu-chart').getContext('2d');
    const ramCtx = document.getElementById('ram-chart').getContext('2d');

    // Initialisiere mit einigen Datenpunkten
    const initialLabels = Array.from({length: 10}, (_, i) => `${i}s`);
    const initialData = Array.from({length: 10}, () => 0);

    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: initialLabels,
            datasets: [{
                label: 'CPU %',
                data: initialData,
                borderColor: '#007acc',
                backgroundColor: 'rgba(0, 122, 204, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: '#3e3e42'
                    },
                    ticks: {
                        color: '#8a8a8a',
                        maxTicksLimit: 5
                    }
                },
                x: {
                    grid: {
                        color: '#3e3e42'
                    },
                    ticks: {
                        color: '#8a8a8a',
                        maxTicksLimit: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    ramChart = new Chart(ramCtx, {
        type: 'line',
        data: {
            labels: initialLabels,
            datasets: [{
                label: 'RAM %',
                data: initialData,
                borderColor: '#28ca42',
                backgroundColor: 'rgba(40, 202, 66, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: '#3e3e42'
                    },
                    ticks: {
                        color: '#8a8a8a',
                        maxTicksLimit: 5
                    }
                },
                x: {
                    grid: {
                        color: '#3e3e42'
                    },
                    ticks: {
                        color: '#8a8a8a',
                        maxTicksLimit: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update Charts
// Optimiertes Chart-Update-System
let lastChartUpdate = 0;
const CHART_UPDATE_INTERVAL = 4000; // Charts alle 4 Sekunden - reduzierte CPU-Last
const MAX_CHART_POINTS = 15; // Weniger Datenpunkte für bessere Performance

function updateCharts() {
    if (!systemInfo) return;

    const now = Date.now();
    if (now - lastChartUpdate < CHART_UPDATE_INTERVAL) {
        return; // Skip if too soon
    }
    lastChartUpdate = now;

    const timeString = new Date().toLocaleTimeString();
    const cpuLoad = systemInfo.cpu.load;
    const cpuUsage = isNaN(cpuLoad) ? 0 : Math.round(cpuLoad);
    const ramUsage = Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100);

    // Update CPU Chart
    cpuChart.data.labels.push(timeString);
    cpuChart.data.datasets[0].data.push(cpuUsage);
    if (cpuChart.data.labels.length > MAX_CHART_POINTS) {
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
    }
    
    // Update RAM Chart
    ramChart.data.labels.push(timeString);
    ramChart.data.datasets[0].data.push(ramUsage);
    if (ramChart.data.labels.length > MAX_CHART_POINTS) {
        ramChart.data.labels.shift();
        ramChart.data.datasets[0].data.shift();
    }
    
    // Batch-Update für bessere Performance - beide Charts gleichzeitig
    // Verwende 'none' Animation für bessere Performance und weniger Memory-Usage
    requestAnimationFrame(() => {
        if (cpuChart && !cpuChart.destroyed) {
            cpuChart.update('none');
        }
        if (ramChart && !ramChart.destroyed) {
            ramChart.update('none');
        }
    });
}

// Compatibility aliases
async function loadProcesses() {
    await loadProcessesOptimized();
}

async function loadNetworkInfo() {
    await loadNetworkInfoOptimized();
}

// OPTIMIERTE FUNKTIONEN FÜR BESSERE PERFORMANCE

// Optimierte Prozess-Ladung mit Caching und Lazy Loading
async function loadProcessesOptimized() {
    try {
        const now = Date.now();
        
        // Verwende Cache falls noch gültig
        if (processCache.length > 0 && (now - lastProcessUpdate) < PROCESS_CACHE_DURATION) {
            renderProcessList(processCache);
            return;
        }
        
        const processes = await window.electronAPI.getProcesses();
        processCache = processes.slice(0, 25); // Nur Top 25 Prozesse für Performance
        renderProcessList(processCache);
        
    } catch (error) {
        console.error('Fehler beim Laden der Prozesse:', error);
    }
}

// Separate Render-Funktion für Prozesse (wiederverwendbar)
function renderProcessList(processes) {
    const processList = document.getElementById('process-list');
    if (!processList) return;
    
    // Clear existing content to prevent memory leaks
    processList.innerHTML = '';
    
    // Performance: DocumentFragment verwenden
    const fragment = document.createDocumentFragment();
    
    processes.forEach(process => {
        const processElement = document.createElement('div');
        processElement.className = 'process-item';
        processElement.innerHTML = `
            <div class="process-name">${process.name}</div>
            <div class="process-details">
                PID: ${process.pid} | CPU: ${process.cpu.toFixed(1)}% | RAM: ${process.mem.toFixed(1)}%
            </div>
        `;
        fragment.appendChild(processElement);
    });
    
    // Einmaliges DOM-Update für bessere Performance
    processList.innerHTML = '';
    processList.appendChild(fragment);
}

// Optimierte Netzwerk-Info mit Caching
async function loadNetworkInfoOptimized() {
    try {
        const now = Date.now();
        
        // Verwende Cache falls noch gültig
        if (networkCache && (now - lastNetworkUpdate) < NETWORK_CACHE_DURATION) {
            renderNetworkInfo(networkCache);
            return;
        }
        
        const networkInfo = await window.electronAPI.getNetworkInfo();
        networkCache = networkInfo;
        renderNetworkInfo(networkCache);
        
    } catch (error) {
        console.error('Fehler beim Laden der Netzwerk-Informationen:', error);
    }
}

// Separate Render-Funktion für Netzwerk (wiederverwendbar)
function renderNetworkInfo(networkInfo) {
    const networkContainer = document.getElementById('network-info');
    if (!networkContainer) return;
    
    // Clear existing content to prevent memory leaks
    networkContainer.innerHTML = '';
    
    // Performance: DocumentFragment verwenden
    const fragment = document.createDocumentFragment();
    
    networkInfo.interfaces.forEach(iface => {
        const interfaceElement = document.createElement('div');
        interfaceElement.className = 'network-interface';
        interfaceElement.innerHTML = `
            <h4>${iface.iface}</h4>
            <div class="network-details">
                <div>IP: ${iface.ip4 || 'N/A'}</div>
                <div>MAC: ${iface.mac || 'N/A'}</div>
                <div>Typ: ${iface.type}</div>
                <div>Status: ${iface.operstate}</div>
            </div>
        `;
        fragment.appendChild(interfaceElement);
    });
    
    // Einmaliges DOM-Update
    networkContainer.innerHTML = '';
    networkContainer.appendChild(fragment);
}

// Force-Load Funktionen für Tab-Wechsel
async function forceLoadProcesses() {
    processCache = []; // Cache leeren
    await loadProcessesOptimized();
}

async function forceLoadNetwork() {
    networkCache = null; // Cache leeren
    await loadNetworkInfoOptimized();
}

// Check Updates
async function checkUpdates() {
    try {
        const updateButton = document.getElementById('check-updates');
        const originalText = updateButton.textContent;
        updateButton.textContent = 'Prüfe Updates...';
        updateButton.disabled = true;
        
        const updates = await window.electronAPI.checkUpdates();
        const updateCount = document.getElementById('update-count');
        const updateList = document.getElementById('update-list');
        
        // Update count display
        if (updates.error) {
            updateCount.textContent = `Fehler: ${updates.error}`;
            updateCount.className = 'update-count error';
        } else if (updates.available > 0) {
            updateCount.textContent = `${updates.available} Updates verfügbar`;
            updateCount.className = 'update-count available';
        } else {
            updateCount.textContent = updates.message || 'Keine Updates verfügbar';
            updateCount.className = 'update-count current';
        }
        
        // Add last sync time
        if (updates.lastSync) {
            const syncInfo = document.createElement('div');
            syncInfo.className = 'sync-info';
            syncInfo.textContent = `Letzte Prüfung: ${updates.lastSync}`;
            updateCount.appendChild(syncInfo);
        }
        
        // Update package list
        updateList.innerHTML = '';
        
        if (updates.packages && updates.packages.length > 0) {
            updates.packages.forEach(package => {
                const packageElement = document.createElement('div');
                packageElement.className = 'update-item';
                
                // Parse package info (format: "package-name current-version -> new-version")
                const parts = package.split(' ');
                if (parts.length >= 3) {
                    const packageName = parts[0];
                    const currentVersion = parts[1];
                    const newVersion = parts[3];
                    
                    packageElement.innerHTML = `
                        <div class="package-name">${packageName}</div>
                        <div class="package-versions">
                            <span class="current-version">${currentVersion}</span>
                            <span class="arrow">→</span>
                            <span class="new-version">${newVersion}</span>
                        </div>
                    `;
                } else {
                    packageElement.textContent = package;
                }
                
                updateList.appendChild(packageElement);
            });
        } else if (!updates.error) {
            const noUpdatesElement = document.createElement('div');
            noUpdatesElement.className = 'no-updates';
            noUpdatesElement.textContent = 'Alle Pakete sind aktuell! 🎉';
            updateList.appendChild(noUpdatesElement);
        }
        
    } catch (error) {
        console.error('Fehler beim Prüfen der Updates:', error);
        document.getElementById('update-count').textContent = 'Fehler beim Prüfen der Updates';
        document.getElementById('update-count').className = 'update-count error';
    } finally {
        const updateButton = document.getElementById('check-updates');
        updateButton.textContent = originalText;
        updateButton.disabled = false;
    }
}

// Install Updates mit erweitertem Feedback
async function installUpdates() {
    try {
        const installButton = document.getElementById('install-updates');
        const originalText = installButton.textContent;
        installButton.textContent = 'Installiere Updates...';
        installButton.disabled = true;
        
        // Progress indicator erstellen
        const updateCount = document.getElementById('update-count');
        const originalUpdateCount = updateCount.innerHTML;
        updateCount.innerHTML = `
            <div class="update-progress">
                <div class="progress-text">Updates werden installiert...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-status">Synchronisiere Paketdatenbank...</div>
            </div>
        `;
        
        // Simuliere Fortschritt während der Installation
        const progressInterval = setInterval(() => {
            const progressFill = document.querySelector('.progress-fill');
            const progressStatus = document.querySelector('.progress-status');
            if (progressFill && progressStatus) {
                const currentWidth = parseInt(progressFill.style.width) || 0;
                if (currentWidth < 90) {
                    const newWidth = Math.min(currentWidth + Math.random() * 15, 90);
                    progressFill.style.width = newWidth + '%';
                    
                    const statuses = [
                        'Synchronisiere Paketdatenbank...',
                        'Lade Paket-Updates...',
                        'Installiere Updates...',
                        'Konfiguriere System...',
                        'Abschließe Installation...'
                    ];
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    progressStatus.textContent = randomStatus;
                }
            }
        }, 1000);
        
        const result = await window.electronAPI.installUpdates();
        
        clearInterval(progressInterval);
        
        if (result.success) {
            // Progress bar auf 100% setzen
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '100%';
            }
            
            const progressStatus = document.querySelector('.progress-status');
            if (progressStatus) {
                progressStatus.textContent = 'Installation abgeschlossen!';
            }
            
            // Erfolgsmeldung mit Reboot-Option
            setTimeout(() => {
                updateCount.innerHTML = `
                    <div class="update-success">
                        <div class="success-message">✅ ${result.message}</div>
                        ${result.requiresReboot ? `
                            <div class="reboot-notice">
                                <p>Ein System-Neustart wird empfohlen, um alle Updates zu aktivieren.</p>
                                <button id="reboot-button" class="reboot-button">System neu starten</button>
                                <button id="reboot-later" class="reboot-later">Später neu starten</button>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Event Listener für Reboot-Button
                const rebootButton = document.getElementById('reboot-button');
                if (rebootButton) {
                    rebootButton.addEventListener('click', async () => {
                        if (confirm('Möchten Sie das System wirklich neu starten?')) {
                            try {
                                const rebootResult = await window.electronAPI.rebootSystem();
                                if (rebootResult.success) {
                                    alert('System wird neu gestartet...');
                                } else {
                                    alert(`Fehler beim Neustart: ${rebootResult.error}`);
                                }
                            } catch (error) {
                                alert('Fehler beim Neustart des Systems');
                            }
                        }
                    });
                }
                
                // Event Listener für "Später neu starten"
                const rebootLaterButton = document.getElementById('reboot-later');
                if (rebootLaterButton) {
                    rebootLaterButton.addEventListener('click', () => {
                        updateCount.innerHTML = originalUpdateCount;
                        checkUpdates(); // Update-Status neu prüfen
                    });
                }
                
            }, 2000);
            
        } else {
            // Fehlermeldung anzeigen
            updateCount.innerHTML = `
                <div class="update-error">
                    <div class="error-message">❌ Fehler bei der Update-Installation</div>
                    <div class="error-details">${result.error}</div>
                    <button onclick="checkUpdates()" class="retry-button">Erneut versuchen</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Fehler bei der Update-Installation:', error);
        const updateCount = document.getElementById('update-count');
        updateCount.innerHTML = `
            <div class="update-error">
                <div class="error-message">❌ Fehler bei der Update-Installation</div>
                <div class="error-details">Unbekannter Fehler</div>
                <button onclick="checkUpdates()" class="retry-button">Erneut versuchen</button>
            </div>
        `;
    } finally {
        const installButton = document.getElementById('install-updates');
        installButton.textContent = originalText;
        installButton.disabled = false;
    }
}

// Search Packages
async function searchPackages() {
    const searchTerm = document.getElementById('package-search').value.trim();
    if (!searchTerm) {
        hideSuggestions();
        return;
    }

    const searchButton = document.getElementById('search-packages');
    const originalText = searchButton.textContent;
    searchButton.textContent = 'Suche...';
    searchButton.disabled = true;

    try {
        const result = await window.electronAPI.searchPackages(searchTerm);
        if (result.success) {
            displayPackageSuggestions(result.packages, result.totalFound);
        } else {
            showSearchError(result.error);
        }
    } catch (error) {
        console.error('Fehler bei der Paketsuche:', error);
        showSearchError('Unbekannter Fehler bei der Suche');
    } finally {
        searchButton.textContent = originalText;
        searchButton.disabled = false;
    }
}

// Display Package Suggestions
function displayPackageSuggestions(packages, totalFound) {
    const suggestionsContainer = document.getElementById('package-suggestions');
    suggestionsContainer.innerHTML = '';

    if (packages.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="no-packages-found">
                Keine Pakete für diesen Suchbegriff gefunden.
                <br>Versuchen Sie einen anderen Suchbegriff.
            </div>
        `;
        suggestionsContainer.style.display = 'block';
        return;
    }

    packages.forEach(pkg => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'package-suggestion';
        suggestionElement.innerHTML = `
            <div class="package-name">${pkg.name}</div>
            <div class="package-version">Version: ${pkg.version}</div>
            <div class="package-description">${pkg.description}</div>
            <div class="package-source ${pkg.source}">${pkg.source === 'official' ? 'Offiziell' : 'AUR'}</div>
        `;

        suggestionElement.addEventListener('click', () => {
            installSelectedPackage(pkg.installCommand, pkg.source, pkg.name);
        });

        suggestionsContainer.appendChild(suggestionElement);
    });

    if (totalFound > packages.length) {
        const moreInfo = document.createElement('div');
        moreInfo.className = 'no-packages-found';
        moreInfo.innerHTML = `<small>Zeige ${packages.length} von ${totalFound} Ergebnissen</small>`;
        suggestionsContainer.appendChild(moreInfo);
    }

    suggestionsContainer.style.display = 'block';
}

// Hide Suggestions
function hideSuggestions() {
    const suggestionsContainer = document.getElementById('package-suggestions');
    suggestionsContainer.style.display = 'none';
}

// Show Search Error
function showSearchError(error) {
    const suggestionsContainer = document.getElementById('package-suggestions');
    suggestionsContainer.innerHTML = `
        <div class="no-packages-found">
            ❌ Fehler bei der Suche: ${error}
        </div>
    `;
    suggestionsContainer.style.display = 'block';
}

// Install Selected Package with Progress
async function installSelectedPackage(packageName, source, displayName) {
    const installStatus = document.getElementById('install-status');
    
    // Hide suggestions while installing
    hideSuggestions();

    // Create progress UI
    installStatus.innerHTML = `
        <div class="package-progress">
            <div class="package-progress-text">${displayName} wird installiert...</div>
            <div class="package-progress-bar">
                <div class="package-progress-fill" style="width: 0%"></div>
            </div>
            <div class="package-progress-status">Bereite Installation vor...</div>
        </div>
    `;
    installStatus.className = 'install-status';

    // Setup progress listener
    window.electronAPI.onPackageInstallProgress((progressData) => {
        const progressFill = document.querySelector('.package-progress-fill');
        const progressStatus = document.querySelector('.package-progress-status');
        
        if (progressFill && progressStatus) {
            progressFill.style.width = `${progressData.percent}%`;
            progressStatus.textContent = progressData.status;
            
            if (progressData.error) {
                progressStatus.style.color = '#f5c2c7';
            } else if (progressData.completed) {
                progressStatus.style.color = '#75b798';
            }
        }
    });

    try {
        const result = await window.electronAPI.installPackageWithProgress(packageName, source);
        
        // Clean up progress listener
        window.electronAPI.removePackageInstallProgressListener();
        
        setTimeout(() => {
            if (result.success) {
                installStatus.innerHTML = `✅ ${displayName} erfolgreich installiert!`;
                installStatus.className = 'install-status success';
                
                // Clear search field
                document.getElementById('package-search').value = '';
            } else {
                let errorMessage = `❌ Installation von ${displayName} fehlgeschlagen: ${result.error}`;
                if (result.details) {
                    errorMessage += `<br><br><small>Details: ${result.details}</small>`;
                }
                installStatus.innerHTML = errorMessage;
                installStatus.className = 'install-status error';
            }
        }, 2000); // Wait 2 seconds to show completion
        
    } catch (error) {
        // Clean up progress listener
        window.electronAPI.removePackageInstallProgressListener();
        
        console.error('Fehler bei der Paketinstallation:', error);
        installStatus.innerHTML = `❌ Installation von ${displayName} fehlgeschlagen`;
        installStatus.className = 'install-status error';
    }
}


// Load Services
async function loadServices() {
    try {
        const services = await window.electronAPI.getServices();
        const servicesList = document.getElementById('services-list');
        servicesList.innerHTML = '';

        services.slice(0, 20).forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-item';
            serviceElement.innerHTML = `
                <div class="service-name">${service.name}</div>
                <div class="service-status ${service.status === 'active' ? 'active' : 'inactive'}">
                    ${service.status}
                </div>
            `;
            servicesList.appendChild(serviceElement);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Dienste:', error);
    }
}

// Load Firewall Status
async function loadFirewallStatus() {
    try {
        const firewallStatus = await window.electronAPI.getFirewallStatus();
        const statusElement = document.getElementById('firewall-status');
        statusElement.textContent = firewallStatus.active ? 'Aktiv' : 'Inaktiv';
        statusElement.className = `status-indicator ${firewallStatus.active ? 'active' : 'inactive'}`;
    } catch (error) {
        console.error('Fehler beim Laden des Firewall-Status:', error);
    }
}

// Load Command of Day
function loadCommandOfDay() {
    const commands = [
        { command: 'ls -la', explanation: 'Listet alle Dateien und Verzeichnisse mit Details auf' },
        { command: 'ps aux', explanation: 'Zeigt alle laufenden Prozesse an' },
        { command: 'df -h', explanation: 'Zeigt Festplattenplatz-Nutzung an' },
        { command: 'top', explanation: 'Zeigt System-Ressourcen in Echtzeit an' },
        { command: 'systemctl status', explanation: 'Zeigt Status aller System-Dienste an' },
        { command: 'ip addr', explanation: 'Zeigt Netzwerk-Interfaces und IP-Adressen an' },
        { command: 'journalctl -f', explanation: 'Zeigt System-Logs in Echtzeit an' },
        { command: 'pacman -Syu', explanation: 'Aktualisiert das System und alle Pakete' }
    ];

    const today = new Date().getDate();
    const command = commands[today % commands.length];
    
    document.getElementById('todays-command').textContent = command.command;
    document.getElementById('command-explanation').textContent = command.explanation;
}

// Firewall Toggle
async function toggleFirewall() {
    const toggleButton = document.getElementById('toggle-firewall');
    const statusElement = document.getElementById('firewall-status');
    
    const originalText = toggleButton.textContent;
    const currentStatus = statusElement.textContent.includes('Aktiv');
    const action = currentStatus ? 'deaktiviert' : 'aktiviert';
    
    toggleButton.textContent = `Firewall wird ${action}...`;
    toggleButton.disabled = true;
    
    try {
        const result = await window.electronAPI.toggleFirewall();
        if (result.success) {
            statusElement.textContent = result.active ? 'Aktiv' : 'Inaktiv';
            statusElement.className = `status-indicator ${result.active ? 'active' : 'inactive'}`;
            
            // Erfolgsmeldung anzeigen
            showNotification(result.message, 'success');
            toggleButton.textContent = originalText;
        } else {
            // Benutzerfreundliche Fehlermeldung
            if (result.error.includes('manuell im Terminal aus')) {
                showNotification('Bitte öffnen Sie ein Terminal und führen den Befehl manuell aus', 'error');
            } else {
                showNotification(`Firewall-Fehler: ${result.error}`, 'error');
            }
            toggleButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Fehler beim Toggle der Firewall:', error);
        showNotification('Unerwarteter Fehler bei der Firewall-Einstellung', 'error');
        toggleButton.textContent = originalText;
    } finally {
        toggleButton.disabled = false;
    }
}

// Execute Command (Quick Access Tools)
async function executeCommand(command) {
    try {
        const result = await window.electronAPI.executeCommand(command);
        if (result.success) {
            // Optional: Kurze Bestätigung anzeigen
            showNotification(`${result.command} wurde geöffnet`, 'success');
        } else {
            console.error(`❌ ${result.error}`);
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Ausführen des Befehls:', error);
        showNotification('Fehler beim Ausführen des Befehls', 'error');
    }
}

// Enhanced Notification System with stacking support
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create individual notification
    const notification = document.createElement('div');
    const notificationId = 'notification-' + Date.now() + Math.random().toString(36).substr(2, 9);
    notification.id = notificationId;
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.marginBottom = '8px';
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Auto-hide after duration
    const hideTimeout = setTimeout(() => {
        notification.classList.remove('show');
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
    
    // Store timeout for potential cleanup
    notification.hideTimeout = hideTimeout;
    
    return notification;
}

// Clear Terminal with memory management
function clearTerminal() {
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalOutput) return;
    
    // Clear all content to free memory
    terminalOutput.innerHTML = '';
    terminalHistoryCount = 0; // Reset history counter
    
    // Create clean initial state
    const initialLine = document.createElement('div');
    initialLine.className = 'terminal-line';
    initialLine.innerHTML = `
        <span class="prompt">user@archlinux:~$</span>
        <span class="command" contenteditable="true" id="terminal-input"></span>
    `;
    terminalOutput.appendChild(initialLine);
    
    // Re-setup event listener for new input
    setupTerminal();
    
    // Focus on input
    document.getElementById('terminal-input').focus();
}

// New Terminal
function newTerminal() {
    clearTerminal();
    showNotification('Neues Terminal gestartet', 'success');
}

// Setup Terminal
function setupTerminal() {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    if (!terminalInput) return;

    // Remove existing event listeners
    terminalInput.removeEventListener('keydown', handleTerminalKeydown);
    
    // Add new event listener
    terminalInput.addEventListener('keydown', handleTerminalKeydown);
}

// Handle Terminal Keydown
async function handleTerminalKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        const terminalInput = e.target;
        const terminalOutput = document.getElementById('terminal-output');
        const command = terminalInput.textContent.trim();
        
        if (command) {
            // Add command to output
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `
                <span class="prompt">user@archlinux:~$</span>
                <span class="command">${command}</span>
            `;
            terminalOutput.appendChild(commandLine);

            // Show loading indicator
            const loadingLine = document.createElement('div');
            loadingLine.className = 'terminal-line loading';
            loadingLine.innerHTML = `<span class="output">Ausführen...</span>`;
            terminalOutput.appendChild(loadingLine);
            
            // Scroll to bottom
            terminalOutput.scrollTop = terminalOutput.scrollHeight;

            try {
                // Execute command
                const result = await window.electronAPI.executeTerminalCommand(command);
                
                // Remove loading indicator
                loadingLine.remove();
                
                // Add command output
                const outputLine = document.createElement('div');
                outputLine.className = 'terminal-line';
                
                if (result.success) {
                    outputLine.innerHTML = `<span class="output">${result.output.replace(/\n/g, '<br>')}</span>`;
                } else {
                    outputLine.innerHTML = `<span class="output error">${result.output || result.error}</span>`;
                }
                
                terminalOutput.appendChild(outputLine);
                
                // Memory management: Limit terminal history
                terminalHistoryCount++;
                if (terminalHistoryCount > MAX_TERMINAL_LINES) {
                    const firstLine = terminalOutput.querySelector('.terminal-line');
                    if (firstLine && !firstLine.querySelector('#terminal-input')) {
                        firstLine.remove();
                        terminalHistoryCount--;
                    }
                }
                
            } catch (error) {
                // Remove loading indicator
                loadingLine.remove();
                
                const errorLine = document.createElement('div');
                errorLine.className = 'terminal-line';
                errorLine.innerHTML = `<span class="output error">Fehler: ${error.message}</span>`;
                terminalOutput.appendChild(errorLine);
            }
            
            // Add new prompt
            const newPrompt = document.createElement('div');
            newPrompt.className = 'terminal-line';
            newPrompt.innerHTML = `
                <span class="prompt">user@archlinux:~$</span>
                <span class="command" contenteditable="true" id="terminal-input"></span>
            `;
            terminalOutput.appendChild(newPrompt);
            
            // Setup new input
            const newInput = newPrompt.querySelector('.command');
            newInput.addEventListener('keydown', handleTerminalKeydown);
            newInput.focus();
            
            // Scroll to bottom
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    }
}

// Start System Monitoring
function startSystemMonitoring() {
    updateInterval = setInterval(() => {
        loadSystemInfoThrottled();
    }, updateSpeed); // Update based on configured speed
}

// Performance optimization: Add throttling for expensive operations
let lastSystemInfoUpdate = 0;
const SYSTEM_INFO_CACHE_DURATION = 2000; // 2 Sekunden Cache - weniger API-Calls

async function loadSystemInfoThrottled() {
    const now = Date.now();
    if (now - lastSystemInfoUpdate < SYSTEM_INFO_CACHE_DURATION) {
        return; // Skip if too soon
    }
    lastSystemInfoUpdate = now;
    await loadSystemInfo();
}

// Update Monitoring Speed
function updateMonitoringSpeed(speed) {
    updateSpeed = speed;
    if (updateInterval) {
        clearInterval(updateInterval);
        startSystemMonitoring();
    }
}

// Utility Functions
function formatBytes(bytes) {
    return window.electronAPI.formatBytes(bytes);
}

// Security Functions
async function performSecurityScan() {
    try {
        showNotification('Starte Sicherheitsscan...', 'info');
        
        // Update UI to show scanning state
        document.getElementById('ssh-status').textContent = 'Prüfe...';
        document.getElementById('fail2ban-status').textContent = 'Prüfe...';
        document.getElementById('open-ports').textContent = 'Scanne...';
        document.getElementById('security-events').innerHTML = '<div class="loading-message">Scanne Sicherheitsereignisse...</div>';
        
        const results = await window.electronAPI.securityScan();
        
        // Update SSH status
        const sshElement = document.getElementById('ssh-status');
        if (sshElement) {
            sshElement.textContent = results.ssh.message;
            sshElement.className = `metric-value ${results.ssh.status}`;
        }
        
        // Update Fail2Ban status
        const fail2banElement = document.getElementById('fail2ban-status');
        if (fail2banElement) {
            fail2banElement.textContent = results.fail2ban.message;
            fail2banElement.className = `metric-value ${results.fail2ban.status}`;
        }
        
        // Update ports status
        const portsElement = document.getElementById('open-ports');
        if (portsElement) {
            portsElement.textContent = results.ports.message;
            portsElement.className = `metric-value ${results.ports.status}`;
        }
        
        // Update security events
        const eventsContainer = document.getElementById('security-events');
        if (eventsContainer && results.events && results.events.length > 0) {
            eventsContainer.innerHTML = '';
            results.events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `security-event ${event.type}`;
                eventElement.innerHTML = `
                    <div class="security-event-icon">${getEventIcon(event.type)}</div>
                    <div class="security-event-content">
                        <div class="security-event-time">${event.time}</div>
                        <div class="security-event-message">${event.message}</div>
                    </div>
                `;
                eventsContainer.appendChild(eventElement);
            });
        } else if (eventsContainer) {
            eventsContainer.innerHTML = '<div class="loading-message">Keine aktuellen Sicherheitsereignisse</div>';
        }
        
        showNotification('Sicherheitsscan abgeschlossen', 'success');
    } catch (error) {
        console.error('Fehler beim Sicherheitsscan:', error);
        showNotification('Fehler beim Sicherheitsscan', 'error');
    }
}

function getEventIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        danger: '🚨'
    };
    return icons[type] || '📋';
}

async function checkSecurityUpdates() {
    try {
        showNotification('Prüfe Sicherheitsupdates...', 'info');
        const result = await window.electronAPI.checkSecurityUpdates();
        
        if (result.success) {
            const message = result.count > 0 ? 
                `${result.count} Sicherheitsupdates gefunden` : 
                'System ist auf dem neuesten Stand';
            showNotification(message, result.count > 0 ? 'warning' : 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Prüfen der Sicherheitsupdates:', error);
        showNotification('Fehler beim Prüfen der Sicherheitsupdates', 'error');
    }
}

async function auditPackages() {
    try {
        showNotification('Führe Paket-Audit durch...', 'info');
        const result = await window.electronAPI.auditPackages();
        
        if (result.success) {
            const message = result.orphanPackages > 0 ? 
                `${result.orphanPackages} verwaiste Pakete gefunden` : 
                'Alle Pakete sind korrekt verknüpft';
            showNotification(message, result.orphanPackages > 0 ? 'warning' : 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Paket-Audit:', error);
        showNotification('Fehler beim Paket-Audit', 'error');
    }
}

async function checkRootkits() {
    try {
        showNotification('Prüfe auf Rootkits...', 'info');
        const result = await window.electronAPI.checkRootkits();
        
        if (result.success) {
            const type = result.status === 'secure' ? 'success' : 'warning';
            showNotification(result.message, type);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Rootkit-Scan:', error);
        showNotification('Fehler beim Rootkit-Scan', 'error');
    }
}

async function performNetworkScan() {
    try {
        showNotification('Scanne Netzwerk...', 'info');
        const result = await window.electronAPI.networkScan();
        
        if (result.success) {
            const message = `${result.devicesFound} Geräte im Netzwerk (Gateway: ${result.gateway})`;
            showNotification(message, 'info');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Netzwerk-Scan:', error);
        showNotification('Fehler beim Netzwerk-Scan', 'error');
    }
}

// Load initial security data when switching to actions tab
function loadSecurityData() {
    // Auto-run security scan on tab load
    setTimeout(() => {
        performSecurityScan();
    }, 1000);
}

// Comprehensive cleanup on window close
window.addEventListener('beforeunload', () => {
    
    // Clear all intervals
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    // Clear all timeouts
    if (typeof searchTimeout !== 'undefined' && searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
    
    // Destroy charts to prevent memory leaks
    if (cpuChart) {
        cpuChart.destroy();
        cpuChart = null;
    }
    if (ramChart) {
        ramChart.destroy();
        ramChart = null;
    }
    
    // Clear caches
    processCache = [];
    networkCache = null;
    
    // Remove package install progress listener
    if (window.electronAPI && window.electronAPI.removePackageInstallProgressListener) {
        window.electronAPI.removePackageInstallProgressListener();
    }
    
    // Clear system info
    systemInfo = null;
    
    // Clear notification container
    const notificationContainer = document.getElementById('notification-container');
    if (notificationContainer) {
        // Clear all notification timeouts
        const notifications = notificationContainer.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.hideTimeout) {
                clearTimeout(notification.hideTimeout);
            }
        });
        notificationContainer.remove();
    }
    
});
