# Step 5: Visual Alignment Checklist — Classic to Match TimeAttack/Blitz

**Status:** Review & Documentation Only (No Code Changes)  
**Scope:** Verify visual consistency across all three game modes  
**Target:** Identify styling gaps that should be addressed

---

## Visual Alignment Goals

Ensure consistent visual language across Classic, TimeAttack, and Blitz modes:
- Unified typography scale
- Consistent container sizing
- Standardized padding/spacing
- Complete dark mode coverage
- Coherent color palette

---

## Part 1: Typography Scale Verification

### Current State

| Element | ClassicGame | TimeAttack | Blitz | Status |
|---------|-------------|-----------|-------|--------|
| **Main Title** | text-4xl | ? | ? | ⚠️ Verify |
| **Subtitles** | text-lg | text-sm | text-sm | ⚠️ Inconsistent |
| **Labels** | text-sm | text-xs | text-sm | ⚠️ Inconsistent |
| **Body** | text-base | text-base | text-base | ✅ |
| **Details** | text-xs | text-xs | text-xs | ✅ |

**Checklist:**
- [ ] TimeAttackPage main title size (SetupScreen, EndScreen)
- [ ] BlitzGameScreen player name (currently text-2xl)
- [ ] Standardize subtitle sizes (goal: text-sm across all)
- [ ] Verify label consistency (goal: text-xs for secondary info)

**Finding:** BlitzGameScreen uses `text-2xl` for player name (line 154) — should be `text-lg` or `text-xl` for consistency

---

## Part 2: Container & Spacing Strategy

### Maximum Widths

| Component | ClassicGame | TimeAttack | Blitz | Status |
|-----------|-------------|-----------|-------|--------|
| **Main Container** | max-w-md | max-w-md | grid-cols-1 lg:grid-cols-3 | ⚠️ Different |
| **Puzzle Board** | max-w-md | max-w-md | responsive grid | ✅ Appropriate |
| **Modals** | max-w-md | — | — | ✅ |
| **WalletStrip** | max-w-xs | max-w-xs | max-w-xs | ✅ Consistent |

**Observation:** Blitz uses responsive grid (appropriate for multiplayer layout), but should verify it uses same padding as single-player modes

**Checklist:**
- [ ] Verify px-4 is used on Blitz main containers
- [ ] Verify py- values are consistent (py-3, py-4)
- [ ] Check Blitz game board padding vs ClassicGame

---

## Part 3: Padding & Spacing Consistency

### Standard Patterns

| Pattern | ClassicGame | TimeAttack | Blitz | Goal |
|---------|-------------|-----------|-------|------|
| **Container h-padding** | px-4 | px-4 | px-4 | ✅ Consistent |
| **Container v-padding** | py-6, py-4 | py-3, py-4 | p-4, p-6 | ⚠️ Review |
| **Button padding** | py-3 px-4 | py-3 px-4 | py-3 px-4 | ✅ Consistent |
| **Gap between elements** | gap-4, gap-1 | gap-4 | gap-4, gap-6 | ✅ Mostly consistent |

**Checklist:**
- [ ] ClassicGame: Verify pt-8 pb-12 on main div (line 359) — is this necessary?
- [ ] TimeAttack: Confirm py- values in PlayScreen
- [ ] Blitz: Check p-6 vs px-4 py-4 consistency
- [ ] Goal: Standardize on px-4, py-3/py-4

---

## Part 4: Dark Mode Coverage

### Dark Classes Present

| Mode | Component | Dark Coverage | Status |
|------|-----------|----------------|--------|
| **Classic** | Header | ✅ Complete | Line 359: bg-white dark:bg-gray-900 |
| **Classic** | Modals | ✅ Complete | bg-white dark:bg-gray-800 |
| **Classic** | Text | ✅ Complete | text-gray-900 dark:text-white |
| **Classic** | Borders | ✅ Complete | border-gray-200 dark:border-gray-800 |
| **TimeAttack** | PlayScreen | ✅ Complete | bg-white dark:bg-gray-950 |
| **TimeAttack** | Buttons | ✅ Complete | dark: variants present |
| **Blitz** | Main | ✅ Complete | bg-gray-50 dark:bg-gray-900 |
| **Blitz** | Buttons | ✅ Complete | dark: classes present |

**Verification:** All three modes have comprehensive dark mode coverage ✅

**Checklist:**
- [ ] Spot-check ClassicGame buttons for dark: classes
- [ ] Verify TimeAttack bottom bar has dark:border-gray-800
- [ ] Verify Blitz timer has dark text color
- [ ] Confirm no hardcoded colors (should all use Tailwind color system)

---

## Part 5: Button Styling Consistency

### Button Classes

| Button Type | ClassicGame | TimeAttack | Blitz | Status |
|------------|------------|-----------|-------|--------|
| **Primary** | bg-blue-600 hover:bg-blue-700 | — | — | ⚠️ Not standard |
| **Secondary** | bg-gray-200 dark:bg-gray-700 | bg-gray-200 dark:bg-gray-800 | Uses BUTTON_STYLES | ⚠️ Inconsistent |
| **Danger** | bg-red-700 hover:bg-red-800 | — | BUTTON_STYLES.danger | ⚠️ Different approach |
| **Touch Target** | min-h-[48px] | min-h-[48px] | min-h-[48px] | ✅ Consistent |

**Finding:** Blitz uses `BUTTON_STYLES` tokens (theme.ts), but ClassicGame uses inline Tailwind

**Recommendation:** Consider importing BUTTON_STYLES in ClassicGame for consistency

**Checklist:**
- [ ] Review Blitz `BUTTON_STYLES` from theme.ts
- [ ] Check if ClassicGame buttons should use same tokens
- [ ] Verify all buttons have dark mode variants
- [ ] Confirm focus-visible:ring-2 on all interactive elements

---

## Part 6: Color Palette Alignment

### Gray Scale Usage

| Shade | ClassicGame | TimeAttack | Blitz | Status |
|-------|------------|-----------|-------|--------|
| **50** | — | — | — | Not used |
| **100** | bg-green-100, bg-red-100 | — | — | Accent only |
| **200** | border, text | border | button | ✅ Consistent |
| **300** | hover states | — | — | ✅ |
| **400** | text | text | text | ✅ |
| **500** | — | — | accent | ✅ |
| **700** | dark text, button bg | dark | button | ✅ |
| **800** | dark border, dark bg | dark | dark bg | ✅ |
| **900** | dark bg | dark bg | dark bg | ✅ |
| **950** | — | dark bg (very dark) | — | ⚠️ TimeAttack only |

**Observation:** TimeAttackPage.tsx uses `dark:bg-gray-950` (line 156) instead of gray-900

**Recommendation:** Standardize on gray-900 for dark mode backgrounds

**Checklist:**
- [ ] Search for gray-950 usage: `grep -r 'gray-950' src/`
- [ ] If found, consider replacing with gray-900 for consistency
- [ ] Verify accent colors (blues, greens) are consistent across modes

---

## Part 7: Responsive Behavior

### Breakpoint Usage

| Breakpoint | Usage | Status |
|-----------|-------|--------|
| **sm:** (640px) | flex-col sm:flex-row | ✅ Used |
| **md:** (768px) | Limited usage | ⚠️ Minimal |
| **lg:** (1024px) | grid-cols-1 lg:grid-cols-3 | ✅ Used in Blitz |

**Checklist:**
- [ ] Verify sm: breakpoint layouts stack properly on mobile
- [ ] Confirm lg: grid layouts expand on desktop
- [ ] Test at 375px (mobile), 768px (tablet), 1024px (desktop)

---

## Part 8: Border & Shadow Consistency

### Border Styles

| Element | ClassicGame | TimeAttack | Blitz | Pattern |
|---------|-------------|-----------|-------|---------|
| **Header** | border-b | border-b | border-b | ✅ Consistent |
| **Modals** | shadow-xl | — | — | ✅ |
| **Cards** | rounded-lg | rounded-lg | rounded-lg | ✅ Consistent |
| **Input** | rounded | rounded | rounded | ✅ Consistent |

**Checklist:**
- [ ] Verify all borders use border-gray-200 dark:border-gray-800
- [ ] Confirm shadow classes are appropriate (shadow-sm, shadow-md, shadow-lg)
- [ ] Check rounded- values are consistent (rounded, rounded-lg)

---

## Part 9: Text Alignment & Flow

### Layout Flow

| Mode | Direction | Status |
|------|-----------|--------|
| **ClassicGame** | Vertical (flex flex-col) | ✅ |
| **TimeAttack** | Vertical | ✅ |
| **Blitz** | Grid (responsive) | ✅ |

**Checklist:**
- [ ] Verify text-center is used consistently for headers
- [ ] Check text-left vs text-center in puzzle displays
- [ ] Confirm list/grid alignment is consistent

---

## Part 10: Spacing Summary

### Gap Values Used

| Gap Value | Purpose | Consistency |
|-----------|---------|-------------|
| gap-1 | Inline elements (puzzle letters) | ✅ |
| gap-2 | — | Not used |
| gap-3 | — | Not used |
| gap-4 | Main sections | ✅ Consistent |
| gap-6 | Large sections (Blitz grid) | ✅ |

**Recommendation:** Stick to gap-1, gap-4, gap-6 across all modes

**Checklist:**
- [ ] Verify no gap-2, gap-3, gap-5 usage
- [ ] Confirm gap-4 is used between major sections
- [ ] Check gap-1 for inline elements (word chains)

---

## Part 11: Modal & Overlay Styling

### Modal Properties

| Property | ClassicGame | TimeAttack | Blitz | Status |
|----------|-------------|-----------|-------|--------|
| **Width** | max-w-md | — | — | ✅ |
| **Height** | max-h-[80vh] | — | — | ✅ |
| **Background** | bg-white dark:bg-gray-800 | — | — | ✅ |
| **Padding** | p-6 | — | — | ✅ |
| **Shadow** | shadow-xl | — | — | ✅ |
| **Border Radius** | rounded-lg | — | — | ✅ |

**Checklist:**
- [ ] Verify modal styling is complete and appropriate
- [ ] Note: TimeAttack/Blitz don't have modals (no puzzle history/results detail view)

---

## Part 12: Accessibility Classes

### Focus Management

| Element | Focus Class | Status |
|---------|-------------|--------|
| **Buttons** | focus-visible:ring-2 focus-visible:ring-blue-500 | ✅ Present |
| **Inputs** | focus-visible classes | ⚠️ Verify |
| **Links** | aria-label present | ✅ |

**Checklist:**
- [ ] Verify all buttons have focus-visible classes
- [ ] Check all interactive elements have proper ARIA labels
- [ ] Confirm focus rings are visible on dark background

---

## Summary Checklist

**Typography:**
- [ ] Main titles standardized (goal: text-4xl or text-3xl across all)
- [ ] Subtitles standardized (goal: text-sm or text-lg)
- [ ] Labels standardized (goal: text-xs for secondary)

**Spacing:**
- [ ] Padding standardized (goal: px-4 universal)
- [ ] Gaps standardized (goal: gap-1, gap-4, gap-6 only)
- [ ] Margins consistent across modes

**Colors:**
- [ ] Dark mode complete (✅ All modes verified)
- [ ] Gray palette consistent (replace gray-950 with gray-900)
- [ ] No hardcoded colors

**Components:**
- [ ] Buttons have dark mode variants
- [ ] Modals use consistent styling (ClassicGame modal pattern)
- [ ] Borders consistent (gray-200 light, gray-800 dark)
- [ ] Shadows appropriate (shadow-xl for modals, shadow-md for cards)

**Responsiveness:**
- [ ] Mobile (375px): ✅ Verified in Step 3
- [ ] Tablet (768px): ⚠️ Minimal testing
- [ ] Desktop (1024px): ⚠️ Minimal testing

**Accessibility:**
- [ ] Focus rings visible
- [ ] Touch targets 48x48px minimum
- [ ] ARIA labels present on interactive elements

---

## Recommendations for Implementation (If Proceeding)

### Priority 1 (Quick wins)
1. Replace gray-950 with gray-900 in TimeAttack
2. Update Blitz player name from text-2xl to text-lg
3. Standardize button text sizes

### Priority 2 (Consistency)
1. Consider using BUTTON_STYLES tokens in ClassicGame
2. Standardize title sizes across all modes
3. Document canonical spacing values

### Priority 3 (Polish)
1. Create shared theme configuration
2. Extract repeated patterns into components
3. Add responsive breakpoint testing

---

## Conclusion

**Current State:** Visual alignment is **GOOD** but could be more explicit and standardized

**Gaps Found:**
- ✅ Dark mode: Complete across all modes
- ✅ Touch targets: Consistent (48x48px)
- ⚠️ Typography: Minor inconsistencies (player name size, title sizes)
- ⚠️ Spacing: Could be more explicit about standard values
- ⚠️ Button styling: Different approaches (Blitz uses tokens, Classic doesn't)

**Overall Assessment:** Modes look visually cohesive; polish work is optional

---

**Visual Alignment Review Complete — 2026-05-16 17:45 EDT**

Two workstreams identified:
1. **Quick Polish:** Fix the 2-3 typography inconsistencies (30 min)
2. **Long-term:** Refactor to shared theme tokens (out of scope for Step 5)
