const { ALLOWED_COMMANDS, validateTerminalArgs } = require('../terminal-security');

describe('validateTerminalArgs', () => {
  test('erlaubt einfache, sichere Befehle ohne Einschränkungen', () => {
    const result = validateTerminalArgs('ls', ['-la'], ALLOWED_COMMANDS['ls']);
    expect(result.ok).toBe(true);
  });

  test('lehnt Shell-Metazeichen im Befehlsnamen ab', () => {
    const result = validateTerminalArgs('ls;rm', [], { safe: true });
    expect(result.ok).toBe(false);
  });

  test('lehnt Shell-Metazeichen in Argumenten ab (Command-Injection-Regression)', () => {
    // Historischer Bug: exec() interpretierte den gesamten String über /bin/sh -c,
    // wodurch z.B. "ls; rm -rf ~" die Whitelist umging.
    const result = validateTerminalArgs('ls', [';', 'rm', '-rf', '~'], ALLOWED_COMMANDS['ls']);
    expect(result.ok).toBe(false);
  });

  test('lehnt Argumente mit Backticks/Command-Substitution ab', () => {
    const result = validateTerminalArgs('cat', ['$(whoami)'], ALLOWED_COMMANDS['cat']);
    expect(result.ok).toBe(false);
  });

  test('setzt maxArgs für cat durch', () => {
    const okResult = validateTerminalArgs('cat', ['/etc/os-release'], ALLOWED_COMMANDS['cat']);
    expect(okResult.ok).toBe(true);

    const tooMany = validateTerminalArgs('cat', ['a', 'b'], ALLOWED_COMMANDS['cat']);
    expect(tooMany.ok).toBe(false);
  });

  test('setzt allowedFlags für pacman durch (keine Installation über das Terminal)', () => {
    const query = validateTerminalArgs('pacman', ['-Q'], ALLOWED_COMMANDS['pacman']);
    expect(query.ok).toBe(true);

    const install = validateTerminalArgs('pacman', ['-S', 'somepkg'], ALLOWED_COMMANDS['pacman']);
    expect(install.ok).toBe(false);
  });

  test('setzt allowedSubcommands für systemctl durch (nur Status-Abfragen)', () => {
    const status = validateTerminalArgs('systemctl', ['status', 'sshd'], ALLOWED_COMMANDS['systemctl']);
    expect(status.ok).toBe(true);

    const restart = validateTerminalArgs('systemctl', ['restart', 'sshd'], ALLOWED_COMMANDS['systemctl']);
    expect(restart.ok).toBe(false);
  });

  test('setzt allowedSubcommands für git durch', () => {
    const log = validateTerminalArgs('git', ['log'], ALLOWED_COMMANDS['git']);
    expect(log.ok).toBe(true);

    const push = validateTerminalArgs('git', ['push'], ALLOWED_COMMANDS['git']);
    expect(push.ok).toBe(false);
  });

  test('lehnt fehlenden Subcommand ab, wenn allowedSubcommands gesetzt ist', () => {
    const bare = validateTerminalArgs('git', [], ALLOWED_COMMANDS['git']);
    expect(bare.ok).toBe(false);
  });
});

describe('ALLOWED_COMMANDS Whitelist', () => {
  test('markiert eindeutig gefährliche Befehle als unsafe', () => {
    ['rm', 'sudo', 'su', 'dd', 'mkfs', 'fdisk', 'chmod', 'chown', 'passwd'].forEach(cmd => {
      expect(ALLOWED_COMMANDS[cmd].safe).toBe(false);
    });
  });
});
