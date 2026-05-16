# Shop System — Design

> **Goal:** Create a simple, non-pay-to-win shop where players purchase helpful consumables (Hints, Reveals, Undos, Time Extensions) using coins earned through gameplay. Three earning paths keep consumables accessible without requiring spending.

> **Architecture:** New `/shop` route with ShopPage component displaying consumable cards in a mobile-optimized grid. Integrates with existing Wallet (coins), Inventory (consumables), and Shop items. Rewards from daily login, Blitz wins, and achievements.

> **Tech Stack:** React Router for `/shop` route, existing Wallet/Inventory/Shop modules, React Context for real-time wallet updates, localStorage persistence, Tailwind CSS with full dark mode, Jest for tests.

---

## Overview

The Word Ladder economy already includes coins, inventory, and a shop item catalog. This design adds the UI layer and reward mechanics to make consumables accessible through gameplay rather than requiring payment. Three earning paths ensure a fair, non-pay-to-win experience:
- **Daily login bonus** (1 Hint + 1 Undo per day)
- **Blitz wins** (+1 Time Extension per victory)
- **Achievement unlocks** (consumable packs based on rarity)

Players can purchase all consumables immediately at level 1 with no artificial gates. New players start with 5 Hints + 3 Undos to learn mechanics before spending coins.

---

## Data Model

### Existing Systems (Reused)

**Wallet (src/lib/economy/wallet.ts):**
```typescript
interface Wallet {
  coins: number;              // Current balance
  xp: number;
  level: number;
  lifetimeCoinsEarned: number;
  lifetimeCoinsSpent: number;
  dailyCoinsEarned: number;
  lastDailyResetAt: number;   // Used for daily bonus tracking
  // ... other fields
}
```

**Inventory (src/lib/economy/inventory.ts):**
```typescript
interface Inventory {
  consumables: {
    hint: number;
    reveal_next_word: number;
    undo_step: number;
    time_extension_15s: number;
  };
  unlocks: string[];
  dictionaryVouchers: number;
}
```

**Shop Items (src/lib/economy/shop.ts):**
```typescript
interface ShopItem {
  id: string;
  consumableType: ConsumableType;
  name: string;
  description: string;
  cost: number;                    // Cost in coins
  consumableCount: number;         // How many you get
  category: 'assists' | 'time_bonuses';
}
```

### New Tracking (Wallet Extension)

Add to wallet for daily bonus tracking:
```typescript
dailyBonusClaimedAt: number;      // Timestamp of last daily bonus claim
```

Used to enforce: "One bonus per day (UTC midnight reset)"

---

## User Experience

### Route & Navigation

**URL:** `/shop`

**Navigation:**
- Home page "Shop" button → navigate to `/shop` (change from `/settings`)
- Back button or home link on shop page → return to previous page or home
- Direct URL access: `/shop` (always shows current player's shop)

### Page Layout

**Header (Sticky):**
- Left: Back arrow or home link (touch-friendly, 44px min)
- Center: "Shop" title, bold, `text-lg`
- Right: Live coin balance display, e.g., "💰 45 coins" (updates real-time)
- Background: `white dark:bg-gray-800`
- Border-bottom: subtle `border-gray-200 dark:border-gray-700`

**Main Grid:**
- 2-column on mobile (320-767px)
- 3-column on tablet (768-1023px)
- 4-column on desktop (1024px+)
- Gap: `gap-3 md:gap-4`
- Container: `max-w-4xl mx-auto px-4 py-6`

**Each Card (Consumable Item):**
```
┌─────────────────────────────┐
│          💡 Icon            │  (text-4xl, centered)
│       Hints (5-pack)        │  (text-lg font-semibold)
│ Reveal one letter at a time │  (text-sm gray, description)
│   You have: 2               │  (text-xs gray, inventory count)
│                             │
│  ┌──────────────────────┐   │
│  │    30 coins          │   │  (text-2xl font-bold yellow-500)
│  └──────────────────────┘   │
│      [BUY BUTTON]           │  (blue-500, 48px height, full width)
└─────────────────────────────┘
```

Card properties:
- Background: `bg-white dark:bg-gray-800`
- Border: `border border-gray-200 dark:border-gray-700`
- Rounded: `rounded-lg`
- Padding: `p-4 md:p-5`
- Hover: `shadow-md dark:shadow-lg`, `bg-gray-50 dark:bg-gray-700/50`
- Transition: `transition-all duration-200`

**Consumable Icons/Emojis:**
- Hints: 💡
- Reveal Next Word: 👁️
- Undo Step: ↩️
- Time Extension: ⏱️

**Bottom Info Section (Optional, Recommended):**
- Small box with earning tips
- Text: "💡 **How to earn free consumables:** Play Blitz to win, log in daily, unlock achievements"
- Background: `bg-blue-50 dark:bg-blue-900/20`
- Margin: `mt-8 p-4 rounded-lg text-sm text-blue-900 dark:text-blue-200`
- Link: "Learn more about consumables" → Help article or modal

### Purchase Confirmation Modal

Triggered on "Buy" button tap.

**Layout:**
```
┌─────────────────────────────────┐
│ ✕ Confirm Purchase              │  (Close button top-right)
├─────────────────────────────────┤
│                                 │
│           💡 (text-6xl)         │
│                                 │
│      5x Hints                   │  (text-lg font-bold)
│   Reveal one letter at a time   │  (text-sm gray)
│                                 │
│  ┌──────────────────────────┐   │
│  │ Cost: 30 coins           │   │  (text-base)
│  │ Your balance: 45 coins   │   │  (text-sm gray)
│  │ After purchase: 15 coins │   │  (text-sm blue, shows math)
│  └──────────────────────────┘   │
│                                 │
│    [Cancel]      [Confirm]      │  (both 48px height)
└─────────────────────────────────┘
```

Modal properties:
- Centered, `fixed inset-0 flex items-center justify-center`
- Backdrop: Black with 50% opacity, click-outside to cancel
- Background: `bg-white dark:bg-gray-800`
- Border: rounded-lg
- Max-width: `max-w-sm` (fits mobile)
- Padding: `p-6`
- Animation: Fade in 200ms

Button styling:
- Cancel: Gray, `bg-gray-300 dark:bg-gray-600 hover:bg-gray-400`
- Confirm: Green, `bg-green-500 hover:bg-green-600`
- Both: `flex-1 py-3 rounded font-medium`

### Card States

**Normal State:**
- All information visible
- Buy button blue, ready to tap

**Hover State (Desktop/Tablet):**
- Shadow lifts: `shadow-md`
- Background tints: `bg-gray-50 dark:bg-gray-700/50`
- Button brightens: `bg-blue-600`

**Insufficient Coins State:**
- Buy button disabled: `bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50`
- Message below button in red: "You have 20 coins, need 30"
- Text: `text-red-500 text-sm mt-1`

**Loading State (During Purchase):**
- Button disabled
- Text changes to: "Purchasing..." with spinner
- Duration: Max 2 seconds before timeout

**Success State (Post-Purchase):**
- Button briefly shows: "✓ Added!" with checkmark icon
- Inventory count on card updates instantly
- Toast notification slides in: "You got 5 Hints! 💡"
- Card background briefly highlights (50ms flash)

### Animations

**Purchase Success Flow:**
1. User taps "Confirm" in modal
2. Button shows spinner (300ms)
3. Modal fades out (300ms)
4. Toast slides in from bottom (300ms ease-out)
5. Card inventory count updates with color highlight
6. Toast displays for 3 seconds
7. Toast slides out (300ms ease-out)

**Card Hover:**
- Shadow: `shadow-md` (on mobile: no shadow on tap)
- Duration: 200ms, easing: `ease-out`
- Staggered: each card independent

**Toast Notification:**
- Position: Bottom center, `fixed bottom-4 left-1/2 -translate-x-1/2`
- Background: Green-500, text white
- Padding: `px-4 py-3`, rounded
- Z-index: High (above everything)
- Stack: If multiple toasts, arrange vertically

---

## Component Structure

### New Files

**src/pages/ShopPage.tsx:**
- Main page component
- Loads wallet and inventory from localStorage (or Context)
- Renders header with coin balance
- Renders card grid of shop items
- Manages purchase flow and modal state
- Handles real-time wallet updates

**src/components/economy/ShopCard.tsx:**
- Reusable card component for each consumable
- Props: `shopItem`, `inventory`, `wallet`, `onBuyClick`
- Displays icon, name, description, inventory count, price
- Shows disabled state if insufficient coins
- Renders "Buy" button

**src/components/economy/PurchaseConfirmModal.tsx:**
- Controlled component (open/close from parent)
- Props: `isOpen`, `item`, `wallet`, `onConfirm`, `onCancel`
- Shows confirmation with balance breakdown
- Click-outside to cancel
- Handles loading state during purchase

**src/components/economy/PurchaseToast.tsx:**
- Toast notification component
- Props: `message`, `icon`, `duration`, `onClose`
- Auto-dismisses after duration
- Stacks if multiple toasts

### Modified Files

**src/App.tsx:**
- Add route: `<Route path="/shop" element={<ShopPage />} />`
- Lazy load: `const ShopPage = lazy(() => import('../pages/ShopPage'))`

**src/pages/HomePage.tsx:**
- Update Shop link: `to="/shop"` (currently goes to `/settings`)

**src/lib/economy/wallet.ts:**
- Add field: `dailyBonusClaimedAt: number` (timestamp)
- Add migration in `migrateWallet()` for backward compatibility
- Add method: `claimDailyBonus(wallet)` → returns updated wallet or null if already claimed

**src/lib/economy/shop.ts:**
- No changes needed (shop items already defined)

**src/lib/economy/inventory.ts:**
- Existing `addConsumable()` already handles purchases
- No changes needed

### Integration Points

**Wallet Context (Recommended):**
- Create `src/contexts/WalletContext.tsx` if not exists
- Wrap App with `<WalletProvider>`
- Provides `useWallet()` hook for live balance updates
- Allows ShopPage header to update in real-time without re-mounting

**Consumable Hooks:**
- Use existing `loadWallet()`, `saveWallet()`, `spendCoins()`
- Use existing `loadInventory()`, `saveInventory()`, `addConsumable()`
- No new hooks needed (reuse existing)

---

## Earning Paths (Non-Pay-To-Win)

### 1. Daily Login Bonus

**Trigger:** First game played each day (any mode, any result)

**Reward:** +1 Hint, +1 Undo Step

**Implementation:**
- On game result, check: `wallet.lastDailyResetAt < today's midnight UTC`
- If yes: Add consumables and update `dailyBonusClaimedAt`
- Notification: Toast in results screen or game over screen
- No limit: Only once per day

**Edge Cases:**
- Offline play: Bonus applied on sync
- Timezone handling: Use UTC midnight consistently
- Already claimed today: Skip silently, no error

### 2. Blitz Wins

**Trigger:** Complete Blitz match in 1st place (winning position)

**Reward:** +1 Time Extension (15 seconds)

**Implementation:**
- On Blitz results screen, check placement
- If 1st place: `addConsumable(inventory, 'time_extension_15s', 1)`
- Notification: In results screen, "Victory bonus! +1 Time Extension ⏱️"
- No limit: Win as many as desired per day

**Edge Cases:**
- Offline Blitz: Bonus queued with game result, applied on sync
- Forfeit: No bonus
- Tie: Award to all tied players (if supported)

### 3. Achievement Unlocks

**Trigger:** First time unlocking any achievement

**Reward:** Consumables based on rarity

**Rarity Mapping:**
- **Common:** 1 consumable (e.g., 1 Hint)
- **Rare:** 3 consumables (e.g., 3 Hints or mix like 2 Hints + 1 Undo)
- **Legendary:** 5 consumables (e.g., 5 Time Extensions or 3 Hints + 2 Undos)

**Implementation:**
- In achievement unlock modal, show consumable reward
- Button: "Claim" → adds consumables to inventory
- Notification: Part of unlock celebration modal
- No duplicate: Already-unlocked achievements don't reward again

**Distribution Example:**
- "First Game" (common) → +1 Hint
- "Speed Master" (rare) → +3 Hints + 2 Undos
- "Puzzle Legend" (legendary) → +5 Time Extensions

---

## New Player Onboarding

**Starting Inventory (Level 1, New Account):**
- 5 Hints
- 3 Undos
- 0 Reveals
- 0 Time Extensions

Provides immediate feel for mechanics in Classic mode without pressure to spend.

**Starting Coins:** 150 (existing)

**First Session Flow:**
1. Player tries Classic with free hints/undos
2. Learns mechanics, earns coins
3. After first Blitz win or tomorrow's login, gets another consumable
4. Shop becomes relevant around level 2-3 (after ~1 hour play)

---

## Styling & Responsiveness

**Container:**
- Mobile: Full width with `px-4` padding
- Tablet+: `max-w-4xl mx-auto`
- Max-width ensures readable text width (~1000px)

**Grid:**
- Mobile (320px): 2 columns
- Tablet (768px): 3 columns
- Desktop (1024px): 4 columns
- Gap: Responsive `gap-3 md:gap-4`

**Touch Targets:**
- All buttons: Minimum 44×48px (WCAG AA)
- Cards: Full card is tappable area (visual feedback on tap)

**Dark Mode:**
- Full support throughout
- Backgrounds: `white` light, `gray-800` dark
- Text: `gray-900` light, `white` dark
- Borders: `gray-200` light, `gray-700` dark
- Shadows: Slightly more prominent in dark mode

**Typography:**
- Item name: `text-lg md:text-xl font-semibold`
- Description: `text-sm text-gray-600 dark:text-gray-400`
- Price: `text-2xl md:text-3xl font-bold text-yellow-500`
- Inventory: `text-xs text-gray-500`
- Headers: `text-lg font-bold`

---

## Non-Pay-To-Win Philosophy

**Why This Is Fair:**

✅ **All items available immediately** — No level gates, no paywalls  
✅ **Free earning paths** — Daily bonus, Blitz wins, achievements  
✅ **Consumables are optional** — Win games without them, they just help  
✅ **Dedicated players never need to spend** — Can earn everything through play  
✅ **Time-to-parity** — New player can earn equivalent to 150-coin purchase in ~5 hours  

**Pricing Validation:**
- Hints (5-pack): 30 coins = 6 coins/hint (good value)
- Undo (3-pack): 25 coins = 8 coins/undo (good value)
- Reveal (3-pack): 60 coins = 20 coins/reveal (premium, fair)
- Time (5-pack): 40 coins = 8 coins/extension (good value)

All prices encourage consumption without feeling exploitative.

---

## Testing Strategy

### Unit Tests

**ShopCard component:**
- Renders item details correctly
- Shows inventory count
- Disables button when 0 coins
- Shows insufficient coins message
- Click handler fires correctly

**PurchaseConfirmModal:**
- Opens/closes on command
- Shows correct item and cost
- Displays balance calculation
- Confirm/Cancel buttons work
- Click-outside closes

**Shop page:**
- Loads wallet and inventory
- Renders all 4 shop items
- Header shows correct coin balance
- Updates in real-time when wallet changes

**Wallet extension:**
- `claimDailyBonus()` works correctly
- Can't claim twice in one day
- Resets at UTC midnight

**Integration (purchase flow):**
- Buy button → modal opens
- Confirm → coins deducted, consumables added
- Toast appears with correct message
- Inventory count updates on card

### E2E Tests

**Happy path:**
1. Navigate to `/shop`
2. See all 4 items with correct prices
3. Click "Buy" on Hints
4. Confirm modal appears with balance
5. Click "Confirm"
6. Toast shows "You got 5 Hints! 💡"
7. Inventory count updates to 5
8. Coin balance decreases by 30

**Insufficient coins:**
1. Navigate with low balance (< 30 coins)
2. Buy button disabled on expensive items
3. Can still buy cheap items
4. Error message shows "need X more coins"

**Daily bonus:**
1. Play first game of the day
2. Bonus notification appears
3. Inventory shows +1 Hint, +1 Undo
4. Can't claim again today

**Blitz win:**
1. Win Blitz match
2. Results screen shows "Victory bonus! +1 Time Extension"
3. Inventory updates

### Manual Testing

**Mobile (375px iPhone):**
- Cards stack properly, 2 columns
- Button tappable (48px)
- Modal fits screen with padding
- Dark mode colors visible

**Tablet (768px):**
- Cards in 3 columns
- Layout balanced

**Desktop (1024px):**
- Cards in 4 columns
- Grid looks balanced
- Modal sizing appropriate

**Keyboard Navigation:**
- Tab through cards
- Tab to each "Buy" button
- Enter opens modal
- Tab through modal buttons
- Esc closes modal

**Dark Mode:**
- All text readable (4.5:1 contrast)
- Icons visible
- Buttons clear
- No color blending

---

## Success Criteria

- ✅ Shop page loads at `/shop` with all 4 items visible
- ✅ Live coin balance in header (updates in real-time)
- ✅ Cards show item details, inventory count, and buy button
- ✅ Buy button disabled when insufficient coins
- ✅ Purchase modal shows confirmation with balance math
- ✅ Purchases update wallet and inventory instantly
- ✅ Toast notifications confirm purchase
- ✅ Daily login bonus (+1 Hint, +1 Undo) appears on first game of day
- ✅ Blitz wins award +1 Time Extension
- ✅ Achievement unlocks award consumables by rarity
- ✅ New players start with 5 Hints + 3 Undos
- ✅ Mobile responsive: 2 cols, touch-friendly, no horizontal scroll
- ✅ Dark mode: Full support, readable, no contrast issues
- ✅ Keyboard navigation: Tab, Enter, Esc all work
- ✅ All tests passing (unit, integration, E2E)
- ✅ No console errors or warnings

---

## Scope & Out of Scope

**Included:**
- Shop page with all 4 consumable items
- Purchase flow with confirmation
- Real-time coin balance
- Daily login bonus
- Blitz win rewards
- Achievement consumable rewards
- Mobile-optimized UI
- Dark mode support
- Full test coverage
- Toast notifications
- Insufficient coins feedback

**Not Included (Future Work):**
- Cosmetic items (skins, themes)
- Seasonal shop rotations
- Limited-time offers
- Crafting system
- Trading between players
- Purchase analytics/tracking
- Paid currency (if monetization added later)

---

## Open Questions (Resolved)

1. ~~Should shop have cosmetics?~~ No, consumables only for now.
2. ~~Daily spending cap?~~ No, unlimited. Earning limits naturally pace spending.
3. ~~Level requirements?~~ No, all items available at level 1+.
4. ~~New player consumables?~~ Yes, 5 Hints + 3 Undos to learn.
5. ~~Shop UI style?~~ Card grid, mobile-optimized, one-tap purchase.
6. ~~Confirmation flow?~~ Modal with balance breakdown, prevents accidents.
7. ~~Free earning paths?~~ Daily login, Blitz wins, achievements.

---

## Notes for Implementation

- Use `localStorage` for wallet/inventory (already established)
- Reuse existing `spendCoins()`, `addConsumable()` functions
- Consider React Context for wallet updates (WalletContext)
- Animations use Tailwind transitions (no external library)
- Icons are emoji for simplicity and mobile compatibility
- Test on actual mobile devices (not just DevTools)
- Performance: Keep ShopPage lightweight, no unnecessary re-renders

