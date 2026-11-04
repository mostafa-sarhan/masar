# Design: Waybill

The direction chosen for Masar in Phase E. The original proposal sample is `a-waybill.html` (screenshots: `a-waybill-desktop.png`, `a-waybill-mobile.png`); the built design system lives in `client/src/styles/tokens.css`, `client/src/styles/index.css` and `client/src/components/ui/`.

- **Mood:** a calm, precise operations office; the day's work as a shipping manifest with rubber stamps.
- **Palette (light):** manifest paper `#EEF1F5`, ink navy `#1C2A4A`, carbon blue `#3550C8`, stamp red `#B8322A`, delivered green `#1B7350`, late amber `#8A5D00`, customs-tape yellow `#F2C230` (highlights only, never text).
- **Dark mode:** night paper `#0F1626`, sheets `#172036`, ink `#E7ECF6`, carbon `#8FA2FF`. Every text/background pair is AA (4.5:1) in both themes; the measured values are in `tokens.css`.
- **Type:** Readex Pro for Arabic and Latin (one family, self-hosted), tabular numbers in tables and counters, Latin digits everywhere.
- **Signature:** "today's manifest" sheet with a perforated top edge; final outcomes (delivered, returned, refused) shown as tilted rubber stamps. The landing hero stamps a waybill once on load; other motion only answers user actions, and `prefers-reduced-motion` turns it off.
- **Layout:** RTL first; staff app with a navy rail; tables become cards on phones; Ctrl/⌘ K command search.
- **Copy:** clear, professional Arabic (no colloquial tone); buttons say exactly what they do.
