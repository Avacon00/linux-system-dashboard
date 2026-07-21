// Zentrale Konfigurationswerte für den Renderer (Update-Intervalle, Cache-Dauern, Limits),
// die vorher als einzelne Konstanten über renderer.js verstreut waren.
const APP_CONFIG = {
    UPDATE_SPEED_DEFAULT: 3000, // Standard-Update-Intervall für System-Infos (ms)
    MAX_TERMINAL_LINES: 100, // Maximale Terminal-Zeilen, um Memory-Leaks zu vermeiden
    PROCESS_CACHE_DURATION: 6000, // Wie lange gecachte Prozessdaten gültig bleiben (ms)
    NETWORK_CACHE_DURATION: 12000, // Wie lange gecachte Netzwerkdaten gültig bleiben (ms)
    PROCESS_UPDATE_INTERVAL: 8000, // Mindestabstand zwischen Prozess-Updates (ms)
    NETWORK_UPDATE_INTERVAL: 15000, // Mindestabstand zwischen Netzwerk-Updates (ms)
    SYSTEM_INFO_CACHE_DURATION: 2000, // Throttling für System-Info-Updates (ms)
    CHART_UPDATE_INTERVAL: 4000, // Mindestabstand zwischen Chart-Updates (ms)
    MAX_CHART_POINTS: 15 // Maximale Datenpunkte pro Chart
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG };
}
