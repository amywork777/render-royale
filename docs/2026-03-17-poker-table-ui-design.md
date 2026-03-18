# Render Royale — Poker Table UI Redesign

## Overview

Replace the current vertically-stacked screen layout with a persistent oval poker table as the central game board. Players sit in fixed seats around the table, cards are dealt to the center, and the player's hand fans out at the bottom. The existing purple/violet color scheme is preserved. One minor server change: adding an `avatar` field to player objects (propagates automatically through all events that send player data).

## Design Decisions

- **Layout**: Full oval poker table as the game board (Option A from brainstorming)
- **Avatars**: Random animal emojis (🐱🐻🦊🐸🐼🐨🦁🐯) assigned on join
- **Colors**: Existing palette preserved (`--bg: #07060b`, `--surface: #0f0e17`, `--primary: #8b5cf6`, etc.)
- **Table screens**: Lobby, Round Start, Card Selection, Judging, Scoreboard
- **Non-table screens**: Home (unchanged), Rendering (full-width upload), Game Over (unchanged)

## Screen-by-Screen Spec

### Home Screen (NO TABLE — unchanged)

Keep the existing layout: logo, title, tagline, how-to-play steps, name input, create/join buttons. No changes needed.

### Lobby (TABLE)

- Oval table centered on screen with subtle purple border and glow
- Table surface: `linear-gradient(145deg, #1e1b2e, #16141f)` with `border: 3px solid rgba(139,92,246,0.25)`
- Player seats positioned around the table:
  - 1 player: bottom-center only ("You")
  - 2 players: bottom-center + top-center
  - 3 players: bottom-center + top-left + top-right
  - 4 players: bottom-center + top-center + left + right
- Each seat: animal emoji avatar in a colored circle (gradient background), name below, "HOST" badge if applicable
- Unoccupied seats are hidden (not rendered), not shown as empty placeholders
- Seats animate in (fade + scale) as players join
- Room code displayed large in the center of the table
- "Share this code with friends" hint below code
- Host controls (rounds picker + Start button) positioned below the table
- Non-host waiting message below the table

### Round Start (TABLE)

- Table visible with all players in seats
- Judge gets a crown emoji (👑) overlay on their avatar
- Product card dealt to center of table with a 3D flip animation:
  - Card starts face-down (dark back with subtle pattern)
  - Flips to reveal product image/emoji, name, description, category
- Round label ("ROUND 1 OF 4") above the table
- Judge label below the table ("Amy is judging" / "You're the judge")
- Auto-advances to card selection after ~3.5s (existing timing)

### Card Selection (TABLE)

- Table fixed at top of screen (350px desktop, 180px mobile) with players in seats
- Product card stays in center of table (smaller, as reminder)
- Timer ring displayed on the table near center
- Content below the table scrolls independently
- Your 7 prompt cards fanned out below the table:
  - Cards overlap slightly (~50px visible per card), `transform-origin: bottom center` for hand-held fan feel
  - Each card shows category color stripe, category tag, name, description
  - On hover/tap: hovered card lifts and scales slightly for readability
  - Tap to select: card glows with category color, lifts up (translateY -8px), gets a checkmark
  - Max 3 selections, same logic as current
  - Mobile: reduce fan rotation to -6deg through +6deg, full card shown on tap
- Other players' seats show status:
  - Before locking: no indicator (no server event for partial selection — keeping scope minimal)
  - After locking: checkmark indicator on their seat (triggered by existing `player-selected` event)
- "Selected: 0/3" counter and instruction text between table and hand
- "Lock In" button at very bottom, below the hand
- Selection instruction updates dynamically (same as current)

### Rendering (NO TABLE — functional layout)

- Keep existing layout: header with product mini + timer, step banner, locked cards display, upload zone, submit button
- No table — upload zone needs full screen width
- Status pips showing who has submitted
- Judge waiting view (same as current)

### Judging (TABLE)

- Table visible with all players in seats
- Submissions appear as cards below the table (not crammed inside the oval — the table shows players, submissions get full-width space below)
- Submission layout by count: 1 submission centered, 2 side by side, 3 in a row (each ~280px wide max)
- Each submission card shows: the uploaded render image, the 3 prompt card tags below it
- Anonymous labels: "Submission A", "Submission B", etc.
- Judge can click a submission to select it (glow effect, "picked" state)
- Non-judge players see the same view but can't click
- "Crown the Winner" button below the submissions for the judge
- Deal-in animation: use JS to calculate offset, apply CSS transition on transform, stagger each submission by 200ms

### Scoreboard (TABLE)

- Table visible with all players in seats
- Winner's seat gets a bright glow/pulse animation
- Winner name announced above the table
- Points displayed as a number next to each player's seat (like chip count)
- Winner's row highlighted with gold accent (same as current)
- "Next Round" button below the table (host only)
- **Solo mode**: single player seat glows with winner animation, "Nice render!" announcement (matching existing behavior)

### Game Over (NO TABLE — unchanged)

Keep the existing layout: title, final scores list with rankings, champion highlight, play again button.

## The Table Component

A reusable table component rendered by a single function (`renderTable(options)`) that all table screens share.

### Structure

```
.poker-table-wrapper          — positions the table on screen
  .poker-table                — the oval with gradient/border/shadow
    .table-center-content     — slot for center content (room code, product card, submissions)
  .table-seat.seat-{position} — 4 fixed seat positions around the table
    .seat-avatar              — colored circle with animal emoji
    .seat-name                — player name
    .seat-info                — score, badge, or status indicator
```

### Seat Positions

CSS positions around the oval:
- `seat-bottom`: bottom center (always "you" / current player)
- `seat-top`: top center
- `seat-left`: left middle
- `seat-right`: right middle

### Table Sizing

- Desktop: table is ~700px wide, ~350px tall, centered
- Mobile (<600px): table shrinks to ~320px wide, ~180px tall
- The area below the table is used for actions (hand, buttons, controls)

## Avatar System

### Animal Pool

```javascript
const ANIMAL_AVATARS = ['🐱','🐻','🦊','🐸','🐼','🐨','🦁','🐯'];
```

### Assignment

- On room creation/join, assign a random unused animal from the pool
- Store in player object: `{ id, name, color, score, avatar }`
- Server sends avatar with player data
- Fallback: if all animals taken (>8 players impossible, max is 4), cycle

### Display

- Avatar shown in a 48px circle with gradient background matching player color
- 3px solid border in `--bg` color to separate from table
- Subtle colored glow (`box-shadow`) matching player color

## Card Animations

### Deal Animation

Cards slide in from off-screen with slight rotation, staggered delays:
```css
@keyframes dealCard {
  from { transform: translateY(100px) rotate(var(--deal-rotation)); opacity: 0; }
  to { transform: translateY(0) rotate(var(--fan-rotation)); opacity: 1; }
}
```

### Fan Spread

Cards in the player's hand overlap slightly (~50px visible per card), with `transform-origin: bottom center` for a hand-held fan feel:
- Card 1: rotate(-9deg)
- Card 2: rotate(-6deg)
- Card 3: rotate(-3deg)
- Card 4: rotate(0deg) (center)
- Card 5: rotate(3deg)
- Card 6: rotate(6deg)
- Card 7: rotate(9deg)
- On hover: hovered card lifts (translateY -12px) and scales (1.05) for readability
- Mobile (<600px): reduce rotation to -6deg through +6deg, show full card on tap

### Product Card Flip

3D flip using `transform: rotateY()` with `perspective` on parent.

### Selection Glow

Selected cards get:
- `border-color` set to category color
- `box-shadow: 0 0 20px` with category color at 30% opacity
- `transform: translateY(-8px)` to lift up
- Checkmark badge in top-right corner

## Face-Down Card Backs

For product card flip animation (round start reveal):
- Dark background (`#0f0e17`)
- Repeating diagonal crosshatch using `repeating-linear-gradient` at 45deg and -45deg with `rgba(139,92,246,0.1)` lines
- Thin border (`rgba(139,92,246,0.2)`)
- Same border-radius as prompt cards

## Edge Cases

### Player Disconnect Mid-Round
- On disconnect, the player's seat shows a dimmed/greyed state with reduced opacity
- Seat is not removed mid-round to avoid layout shifts
- On return to lobby, disconnected seats are removed (existing behavior)

### Solo Mode
- Lobby: single seat at bottom-center, works naturally
- Round Start: no judge crown (no judge in solo), product dealt to center as normal
- Card Selection: no other player seats to show status on, otherwise identical
- Judging: skipped entirely (existing behavior — auto-win)
- Scoreboard: single seat with winner glow, "Nice render!" announcement

## Files Modified

1. **`public/style.css`** — Major rewrite: add poker table styles, seat positions, fan layout, card back styles, update responsive breakpoints
2. **`public/game.js`** — Major rewrite: new `renderTable()` function, update `renderLobby()`, `showRoundStart()`, `showCardSelection()`, `showJudging()`, `showScoreboard()` to use table layout
3. **`public/index.html`** — Restructure screen HTML: add table containers, seat slots, update card selection layout
4. **`server.js`** — Minor: add `avatar` field to player objects, assign random animal on join

## What Does NOT Change

- All Socket.io events and game state machine (server.js), except adding `avatar` to player objects
- Home screen layout
- Rendering/upload screen layout
- Game Over screen layout
- Timer logic
- Card data (prompt cards, product cards)
- Room/game management logic
- Solo mode behavior (auto-win, skip judging)
