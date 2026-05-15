# Economy Integration Audit

## Scope

This audit verifies complete integration of the economy system (coins, XP, level-up mechanics) across all game modes and pages.

## Audit Files

- `audit-findings.json`: Detailed findings from auditing each source file
- `2026-05-14-integration-status.md`: Final comprehensive report

## 19 Features Under Audit

1. earnCoins - Classic Game
2. earnCoins - Time Attack
3. earnCoins - Blitz
4. earnCoins - Consumables
5. addXp - Classic Game
6. addXp - Time Attack
7. addXp - Blitz
8. addXp - Consumables
9. useLevelUpQueue - ClassicGame
10. useLevelUpQueue - TimeAttackPage
11. useLevelUpQueue - BlitzResults
12. Storage event listener
13. localStorage.getItem for recovery
14. WalletStrip - ClassicGame
15. WalletStrip - TimeAttackPage
16. WalletStrip - BlitzResults
17. Single-fire guard (xpAwardedRef)
18. LevelUpProvider wrapping
19. Consumable button integration

## Status Tracking

Each file audit will:
1. Read the complete file
2. Document findings in audit-findings.json
3. Flag any red flags
4. Identify gaps

## Red Flags

Watch for:
- earnCoins present but addXp missing
- addXp present but earnCoins missing
- useLevelUpQueue not imported/used
- No storage event listener
- No localStorage.getItem (suggests race conditions)
- WalletStrip missing from game screens
- Consumable buttons deducting coins directly instead of useConsumable
- No single-fire guard (xpAwardedRef pattern)
- App.tsx not wrapping LevelUpProvider correctly
