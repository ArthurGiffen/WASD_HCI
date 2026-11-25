# Hero's Ledger: Build Plan

Team WASD, HCI course, TAMU-CC. Final submission **Dec 2, 2026**. Live demo **Sunday (Monday at the latest)**.
Goal for the demo: a working walkthrough of Combat, Level Up, guided build and Reset. It is a prototype, not a full rules engine.

## Project context

A responsive web app (plain HTML/CSS/JS, no framework, no build step) that shows a D&D 5e character sheet as arrangeable cards.
Primary users are sighted players. The sheet must also be fully usable by blind and low-vision players.

- **Demo character:** "Kira", Human Rogue (Thief), level 4. Use the data in `js/data/sample-character.js`. If a stat is missing, ask. Do not invent it.
- **Rules edition: D&D 5e 2014 only** (decided 2026-11-20, made a project rule 2026-11-21). This means the 2014 Player's Handbook and SRD 5.1, not the 2024 revision. Rules, numbers, feature names and terms must all be 2014: race, not species; ability increases from race; no origin feats, Weapon Mastery or Cunning Strike; class features at their 2014 levels. Also recorded in `CLAUDE.md`.
- **Do not add frameworks or dependencies** without asking.

### Accessibility rules (apply to every change)

- Every control is a real `<button>`/`<input>` with a visible label or `aria-label`.
- Fully keyboard operable, visible focus outline, logical tab order.
- Semantic HTML: one heading per card, landmarks, lists.
- Announce dynamic changes (HP, dice results, level-up) via the `aria-live="polite"` region (`WASD.announce`).
- Never rely on color alone. Meet WCAG AA contrast. Support 200% zoom without breaking the layout.

### Working style

- Read the existing code before adding anything. Keep changes small and runnable.
- After each task: say how to run it, and give a keyboard-only check and a screen-reader check.
- Prefer simple, readable code. It will be demoed live.
- After each task, add a short factual row to `AI-DISCLOSURE.md` (date, task, what Claude generated or changed, files).
  The file is named `AI-DISCLOSURE.md` with a hyphen in the repo.

## Status

| Done | Item |
|---|---|
| ✅ | Starter scaffold: Hub, Card view, Quick Page, action bar (committed) |
| ✅ | Data model: raw inputs in `sample-character.js`, math in `js/rules.js`, save/load/redraw in `js/character-store.js` |
| ✅ | Task 1: Combat card, HP controls, attack rolls (hit and damage separate), dice roller |
| ✅ | Testing feedback #1 to #7 (see table below) |
| ✅ | Remaining cards, style guide applied, Reset demo |
| ✅ | Task 2 Level Up (2014 rules) and Task 3 guided build, on a shared wizard dialog |
| ✅ | Themes (5) + Large text, accessibility pass (`ACCESSIBILITY.md`), demo script (`DEMO-SCRIPT.md`) |
| ✅ | `js/data/classes.js` checked against SRD 5.1 (2026-11-21): third cantrip, Life Domain, Dwarf traits, SRD subraces, 2014 critical hits |
| ✅ | After the demo (2026-11-25): HP undo, death saves, rests, spell slots, conditions, export/import, all SRD races with separate subraces, Full width cards |
| ⬜ | Team: one real screen-reader run; rehearse `DEMO-SCRIPT.md`; retake screenshot 04 (it still shows "Elf Wizard") |
| | Nothing is committed yet. |

## Model plan

| Model | Use for |
|---|---|
| **Sonnet, medium** | Combat card, HP buttons, dice roller, remaining cards, styling, themes, Reset button. Simple work, so High only adds waiting. |
| **Opus, high** | Level Up flow (Saturday) and the accessibility pass (Sunday). Many connected pieces, so extra reasoning means fewer missed stat updates and better focus and ARIA handling. |

## Task 1: Combat card (today, Sonnet)

1. **Layout:** current HP / max HP, temp HP, AC, initiative, speed, attacks. AC and HP come first, as in the mockup. Use the existing card pattern.
2. **HP +/−:** Damage and Heal buttons with a number input for the amount (default 1).
   HP cannot go below 0 or above max. Show a clear state at 0 HP. Show a "Half HP or less" text label with a ⚠ icon at low HP (not color alone). Not "Bloodied", which is a 2024 rules term.
   Announce each change, e.g. "Kira took 5 damage. HP 18 of 31."
   **Testing feedback #1:** Initiative, Speed and Proficiency bonus show on the main page (Hub) without opening the card, as in the Combat mockup tiles.
   **Testing feedback #7:** attacks have a separate **Roll to hit** button and **Roll damage** button. Damage is shown and rolled **per damage type**
   (e.g. 1d6 slashing + 1d6 fire shows each part and its type, not one combined number), so resistance and vulnerability can be applied per type.
   This needs `rules.js` to produce damage as a list of parts `{ dice, bonus, type }` instead of one string.
3. **Dice roller (the Roll button):** d4, d6, d8, d10, d12, d20, d100, an optional modifier, and a result showing each die and the total. Announce results.
4. Everything keyboard-operable and labeled.

Use `WASD.updateCharacter()` for HP changes. Give every control in a card a stable `id` so focus survives the redraw.

## Task 2: Level Up, Kira 4 → 5 (Saturday, Opus high)

A step-by-step dialog. Focus moves in, Esc closes, focus returns to the Level Up button. Each step has a heading like "Step 2 of 4".

1. **HP:** roll or take the average, using the class hit die + CON modifier.
2. **Proficiency bonus:** +2 → +3, and everything that depends on it.
3. **New features:** level-5 features from the existing data. If the data lacks them, stop and ask. Do not invent rules.
   (Rogue 5 in 2014 rules is Uncanny Dodge and Sneak Attack 3d6 only. There is no Cunning Strike, which is a 2024 feature.)
4. **Review, then confirm.** Announce "Kira is now level 5".

Check with Kira: PB +3, Stealth +9, Shortsword to-hit +6, passive Perception 14, hit dice 5d8.

## Task 3: Short guided build (Saturday)

A brief wizard: name, class, race, ability scores, review. It creates a basic character in the same card layout.
Keep it minimal. Reuse the Level Up dialog and its accessibility rules.

## Usability testing feedback (added)

| # | Suggestion | Where it lands | Data / rules impact |
|---|---|---|---|
| 1 | Initiative, Speed, Proficiency on the main page | Task 1 (Hub and Combat card) | None. Values already derived. |
| 2 | **Equipped** button on the equipment page | Equipment card | Items become objects with `equipped: true/false`. Toggle uses `updateCharacter()` and is announced. |
| 3 | **Modifiers** tab on equipment (e.g. +1 to hit, +1 damage, +3 Strength, +5 Speed) | Equipment card | Each item gets `modifiers`. `rules.js` adds modifiers from **equipped** items to scores, speed, to-hit and damage. |
| 4 | Scrollable tabs separating **Feats** and **Features** | Features card | Features get a `type`. Tabs need `role="tablist"`, arrow-key support and a visible active state. |
| 5 | **Backstory / Background** as its own tab | Features card (or Identity) | None. Text already exists. |
| 6 | Equipment sections for **Currency** and **Consumables** | Equipment card | Add `quantity` and a `consumable` flag. Currency already exists. |
| 7 | Separate roll-to-hit from damage, with damage split by type | Task 1 (attacks) | Damage becomes a list of parts, see Task 1. |

Notes:
- #2, #3 and #7 change the data shape, so do them **before** Level Up. Otherwise level-up has to be reworked.
- Tabs (#3, #4, #5) are one shared tab component. Build it once, with proper tab keyboard behavior, and reuse it.
- Equipment, Features and Identity tabs are Person C's area in the README split, but you are doing all three.

## Sunday tasks, in order

1. **Remaining cards** (Spellcasting, Equipment, Features, Identity, Abilities, Skills) using the same card pattern, including the testing feedback #2 to #6 above.
2. **Styling** to match the screenshots (see Style guide below). Keep WCAG AA. Flag any screenshot color that fails and suggest the closest passing one.
3. **Themes** (see below).
4. **Accessibility pass (Opus high):** keyboard-only walkthrough, screen-reader labels, heading structure, dialog focus, 200% zoom, reduced motion. Fix what is found and list the fixes.
5. **Reset demo button:** restores Kira to her original level 4. Confirm before resetting.
6. **Demo script:** about 5 minutes covering Combat, Level Up, guided build and Reset.

## Style guide (from the team slides)

| Role | Color | Contrast on #FAF7F2 |
|---|---|---|
| Background | `#FAF7F2` | — |
| Cards | `#FFFFFF` | — |
| Header and action bar | `#F4D9D2` | — |
| Icon tiles | `#F1D3CC` | — |
| Text | `#1F1B16` | 16.0:1 |
| Secondary text | `#5C5248` | 7.1:1 |
| Primary | `#9B1C1C` | 7.6:1 |
| Focus ring | `#1D4ED8` (3 px) | 6.3:1 |
| Success | `#166534` | 6.7:1 |
| Error | `#B91C1C` | 6.1:1 |
| Warning | `#92400E` | 6.6:1 |
| Borders | `#8A7F73` | 3.7:1 (passes the 3:1 rule for UI components) |

- **Type:** Atkinson Hyperlegible. Key numbers 32 px bold, body 16 px, labels 14 px. In code use `rem`.
- **Icons:** Lucide line icons. 8 px spacing grid. Touch targets 44 × 44 px minimum.
- **Components:** module card, primary and secondary buttons, HP stepper, number input, dice result sheet, toast, confirm dialog, header/content/action zones on every screen.
- **Font loading:** the page must still work from `file://`. Bundle the font files in the repo or use a system fallback.

## Themes (added)

A **Settings** panel opens from the gear icon in the header. It holds a theme picker and the Large text toggle.
Implementation: CSS custom properties on `:root`, overridden by `[data-theme="..."]` on `<html>`. The choice is saved in `localStorage`.
The first visit follows `prefers-color-scheme`. Changing the theme is announced in the live region.
Every theme must pass WCAG AA (4.5:1 text, 3:1 UI components and focus ring) **before it ships**. Check each with a contrast checker.

| Theme | Intent |
|---|---|
| **Parchment** (default) | The slide palette above. Warm paper background, crimson primary. |
| **Dark** | Dark warm-gray background, light text, brighter crimson. For low-light tables. |
| **High contrast** | Pure black on white (and a white-on-black variant), thick borders, no tinted fills. For low vision. |
| **Forest** | Same layout with a green primary for people who dislike red. Keeps text and error colors distinct. |
| **Arcane** | Deep blue or indigo primary on a cool light background, a "wizard" feel. |
| **Large text** (toggle, not a theme) | Raises the base font size to about 125%. Works with any theme. |

Rules for all themes:
- Error, warning and success keep a text label or icon in every theme. Color is never the only signal.
- The focus ring must contrast with both the page and the card background in each theme.
- Respect `prefers-reduced-motion`. No theme adds animation.
- Demo: cutting the picker to Parchment, Dark and High contrast is fine if time is short. The structure stays the same.

## Slide features beyond the task list (decide before building)

These appear in the slides but not in the task prompts. Cut them or build them on purpose:

- **Favorites / "Most used"** with filled vs. outlined stars (slide 7, slide 6).
- **Drag handles** for reordering, alongside the arrow buttons (slide 7). The Up/Down buttons already exist.
- **Undo** for HP and other changes (slide 7).
- **Toast** messages and a **confirm dialog** (style guide). The confirm dialog is needed for Reset anyway.
- **Hub header stat tiles** (Level, HP, AC) and a **Tap to roll** section on the Combat card (slide 3).

## Open questions

- Which of the "beyond the task list" features, if any, are in the demo?
- ~~Is there a `CLAUDE.md` for this repo?~~ Yes, since 2026-11-21. It holds the 2014-rules rule and a short summary of the standing rules. This file still has the details.
