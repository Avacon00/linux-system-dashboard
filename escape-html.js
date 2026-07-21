// Escaped HTML-Sonderzeichen, bevor dynamische/externe Daten (z.B. AUR-Paketmetadaten,
// Terminal-Ein-/Ausgabe, System-Logs) in innerHTML-Templates eingesetzt werden.
// Als eigene Datei ausgelagert, damit sie sowohl im Renderer (per <script>-Tag, definiert
// escapeHtml global) als auch in Jest-Tests (per require) genutzt werden kann.
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml };
}
