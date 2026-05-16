# Unified Coin Display Design

**Goal:** Consolidate coin/wallet displays across all game modes using a single universal WalletStrip component positioned consistently at top-left.

**Status:** Design approved, ready for implementation

---

## Current State

**Inconsistencies:**
- **Classic Mode**: Local coin display with ◎ emoji at lines 379-383 + WalletStrip at top-4 right-4 (blocking SettingsButton)
- **Time Attack Mode**: Uses WalletStrip at top-right
- **Blitz Mode**: Uses WalletStrip at top-right
- **Home Screen**: Uses WalletStrip appropriately

**Problems:**
1. ClassicGame has duplicate coin display (old ◎ + WalletStrip)
2. Top-right positioning blocks SettingsButton in ClassicGame
3. Inconsistent positioning across modes

---

## Design Solution

### Unified Positioning
- **Location**: Top-left corner (`top-4 left-4`)
- **Component**: WalletStrip with `compact={true}`
- **Z-index**: Ensure it sits above content but below modals
- **Content**: Coins (🪙) + Level + XP progress bar

### Game Modes Updates

#### ClassicGame
- Remove local coin display section (lines 379-383)
- Update WalletStrip position from `top-4 right-4` to `top-4 left-4`
- Verify no overlap with HomeButton (top-left area)
- Maintain z-index hierarchy

#### TimeAttackPage
- Reposition WalletStrip from top-right to `top-4 left-4`
- Ensure layout doesn't shift on mobile

#### BlitzPage
- Reposition WalletStrip from top-right to `top-4 left-4`
- Maintain responsiveness

#### HomePage
- Keep WalletStrip as-is (already appropriately positioned)

### Navigation Button Layout
- **HomeButton**: Top-left corner (will need to account for WalletStrip)
- **SettingsButton**: Top-right corner (now unblocked)
- Ensure both remain clickable and accessible

### Responsive Design
- Compact WalletStrip on mobile (already supported via `compact` prop)
- Verify spacing on small screens
- Test on 320px+ widths

---

## Implementation Details

### Files to Modify
1. `src/ClassicGame.tsx` - Remove old display, reposition WalletStrip
2. `src/features/timeAttack/pages/TimeAttackPage.tsx` - Reposition WalletStrip
3. `src/features/blitz/BlitzPage.tsx` - Reposition WalletStrip
4. `src/components/navigation/HomeButton.tsx` - Verify positioning (may need z-index adjustment)

### CSS Changes
- WalletStrip: Change from `top-4 right-4` to `top-4 left-4` where applicable
- Z-index: Ensure `z-50` is appropriate (HomeButton should be `z-40` or lower)
- Padding: Add left margin to game content if needed to prevent overlap

---

## Testing Requirements

### Unit Tests
- Verify WalletStrip renders correctly with compact=true
- Verify coins display properly in each mode

### Integration Tests
- ClassicGame: Old coin display removed, WalletStrip visible
- TimeAttackPage: WalletStrip at top-left, no overlap
- BlitzPage: WalletStrip at top-left, no overlap
- HomePage: Unchanged functionality
- Mobile: All modes responsive on small screens

### Manual Testing
- Test on multiple device sizes (mobile, tablet, desktop)
- Verify HomeButton and SettingsButton remain clickable
- Verify no visual overlap or layout shift
- Test dark mode appearance

---

## Consistency Checklist

- [ ] All modes use WalletStrip component (not custom displays)
- [ ] All modes positioned at top-left (`top-4 left-4`)
- [ ] All modes use `compact={true}` for mobile efficiency
- [ ] All modes show same content (coins + level + XP)
- [ ] Navigation buttons (Home, Settings) unblocked and clickable
- [ ] Responsive design works on all screen sizes
- [ ] Dark mode styling consistent
- [ ] Z-index layering correct

---

## Success Criteria

✅ Single universal coin icon (🪙) across entire app
✅ Consistent positioning top-left in all game modes
✅ SettingsButton unblocked in ClassicGame
✅ No visual overlap or layout issues
✅ Mobile-optimized layout
✅ All existing tests pass with updated selectors
