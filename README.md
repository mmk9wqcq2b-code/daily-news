# Josi Briefing

Persönliche Nachrichten-Webapp (PWA) für Yannick Josi.

## Automatisierung

- Tägliche Aktualisierung um 20:00 Uhr Europe/Zurich via Grok Automation "Josi Briefing Daily Update".
- Die Automation recherchiert Nachrichten (Web + X, Fokus KI, Wirtschaft, Allgemein, Schweiz), erstellt eigene Zusammenfassungen auf Deutsch mit Schweizer Rechtschreibung und aktualisiert `news.json` (keine Duplikate, Archiv bleibt erhalten).
- Commit auf `main` löst bei Continuous Deployment einen Netlify-Deploy aus.

## Live-URL

https://josi-briefing.netlify.app

## Nächster Lauf

Erster automatischer Lauf: 18. November 2026, 20:00 Uhr MEZ.
