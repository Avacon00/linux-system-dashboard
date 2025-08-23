const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für den Renderer Process
contextBridge.exposeInMainWorld('electronAPI', {
  // System Information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  getNetworkSpeeds: () => ipcRenderer.invoke('get-network-speeds'),
  
  // System Actions
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  installUpdates: () => ipcRenderer.invoke('install-updates'),
  rebootSystem: () => ipcRenderer.invoke('reboot-system'),
  searchPackages: (searchTerm) => ipcRenderer.invoke('search-packages', searchTerm),
  installPackage: (packageName, source) => ipcRenderer.invoke('install-package', packageName, source),
  installPackageWithProgress: (packageName, source) => ipcRenderer.invoke('install-package-with-progress', packageName, source),
  
  // Event listeners for progress updates
  onPackageInstallProgress: (callback) => {
    ipcRenderer.on('package-install-progress', (_, data) => callback(data));
  },
  removePackageInstallProgressListener: () => {
    ipcRenderer.removeAllListeners('package-install-progress');
  },
  getServices: () => ipcRenderer.invoke('get-services'),
  getFirewallStatus: () => ipcRenderer.invoke('get-firewall-status'),
  toggleFirewall: () => ipcRenderer.invoke('toggle-firewall'),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  executeTerminalCommand: (command) => ipcRenderer.invoke('execute-terminal-command', command),
  
  // Security Features
  securityScan: () => ipcRenderer.invoke('security-scan'),
  checkSecurityUpdates: () => ipcRenderer.invoke('check-security-updates'),
  auditPackages: () => ipcRenderer.invoke('audit-packages'),
  networkScan: () => ipcRenderer.invoke('network-scan'),
  checkRootkits: () => ipcRenderer.invoke('check-rootkits'),
  
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showFromTray: () => ipcRenderer.invoke('show-from-tray'),
  
  // Export Functions
  exportSystemReport: (format, data) => ipcRenderer.invoke('export-system-report', format, data),
  openFile: (filepath) => ipcRenderer.invoke('open-file', filepath),
  
  // Utility
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
});
