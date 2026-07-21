# Contributing

Danke für dein Interesse an Linux System Dashboard! Diese Datei beschreibt, wie du lokal
entwickelst und einen Beitrag einreichst.

## Setup

```bash
git clone https://github.com/Avacon00/linux-system-dashboard.git
cd linux-system-dashboard
npm install
npm run dev   # startet die App im Dev-Modus mit DevTools
```

## Vor dem Commit

```bash
npm run lint   # ESLint
npm test       # Jest-Testsuite
```

Beide Schritte laufen auch in der CI (`.github/workflows/build-and-release.yml`) und müssen
grün sein, bevor ein PR gemerged werden kann.

## Branch-Workflow

- Erstelle einen Feature-Branch von `main` (`git checkout -b feature/mein-feature`).
- Öffne einen Pull Request gegen `main`, statt direkt auf `main` zu pushen.
- Halte PRs klein und fokussiert auf ein Thema.

## Commit-Konventionen

Kurze, beschreibende Commit-Messages im Imperativ (z. B. "Fix command injection in terminal
handler" statt "fixed bug"). Ein `type: `-Präfix (z. B. `fix:`, `feat:`, `security:`, `test:`,
`docs:`) ist willkommen, aber nicht verpflichtend.

## Sicherheitsrelevante Änderungen

Diese App führt privilegierte Systemoperationen aus (Terminal-Whitelist, Paketverwaltung,
Firewall). Änderungen an `terminal-security.js`, den IPC-Handlern in `main.js` oder an Stellen,
die Nutzereingaben in `innerHTML` einsetzen, bitte besonders sorgfältig testen und im PR explizit
auf die Sicherheitsauswirkung eingehen. Für Sicherheitslücken siehe [SECURITY.md](SECURITY.md)
statt einem öffentlichen Issue.

## Fragen

Bei Unklarheiten einfach ein Issue öffnen.
