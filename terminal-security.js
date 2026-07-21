// Sicherheitskritische Whitelist-Logik fuer das Sandbox-Terminal (main.js).
// In eine eigene Datei ausgelagert, damit sie ohne Electron-Runtime unit-testbar ist.

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
  'systemctl': { safe: true, description: 'Systemd-Services verwalten (nur Status-Abfragen)', sudoOnly: true, allowedSubcommands: ['status', 'list-units', 'list-unit-files', 'is-active', 'is-enabled', 'is-failed'] },
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

// Shell-Metazeichen, die bei execFile() zwar ohnehin nicht interpretiert werden (kein
// /bin/sh), aber sicherheitshalber explizit zurückgewiesen werden, damit sich niemand auf
// eine implizite Shell-Auswertung verlassen kann.
const SHELL_METACHARACTERS = /[;&|`$<>(){}\n]/;

// Prüft die geparsten Argumente eines Terminal-Befehls gegen die in ALLOWED_COMMANDS
// hinterlegten Einschränkungen (maxArgs / allowedFlags / sudoRequired / allowedSubcommands).
function validateTerminalArgs(baseCommand, args, commandInfo) {
  if (SHELL_METACHARACTERS.test(baseCommand) || args.some(arg => SHELL_METACHARACTERS.test(arg))) {
    return { ok: false, reason: 'Ungültige Zeichen im Befehl (Shell-Metazeichen sind nicht erlaubt).' };
  }

  if (typeof commandInfo.maxArgs === 'number' && args.length > commandInfo.maxArgs) {
    return { ok: false, reason: `Befehl '${baseCommand}' erlaubt maximal ${commandInfo.maxArgs} Argument(e).` };
  }

  if (commandInfo.allowedSubcommands) {
    const subcommand = args[0];
    if (!subcommand || !commandInfo.allowedSubcommands.includes(subcommand)) {
      return { ok: false, reason: `Befehl '${baseCommand}' ist nur mit folgenden Subcommands erlaubt: ${commandInfo.allowedSubcommands.join(', ')}.` };
    }
  }

  if (commandInfo.allowedFlags) {
    const flags = args.filter(arg => arg.startsWith('-'));
    const disallowedFlag = flags.find(flag => !commandInfo.allowedFlags.includes(flag));
    if (disallowedFlag) {
      return { ok: false, reason: `Flag '${disallowedFlag}' ist für '${baseCommand}' nicht erlaubt. Erlaubt: ${commandInfo.allowedFlags.join(', ')}.` };
    }
  }

  if (commandInfo.sudoRequired) {
    const requiresSudo = args.some(arg => commandInfo.sudoRequired.includes(arg));
    if (requiresSudo) {
      return { ok: false, reason: `Diese Aktion erfordert Root-Rechte und ist im Sandbox-Terminal nicht erlaubt.` };
    }
  }

  return { ok: true };
}

module.exports = { ALLOWED_COMMANDS, SHELL_METACHARACTERS, validateTerminalArgs };
