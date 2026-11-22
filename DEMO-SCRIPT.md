# Live Demo Script (about 5 minutes)

WASD Character Sheet. Kira, Human Rogue, level 4.
Every number below is what the screen should show if you start from **Reset demo**.

## Before you start (1 minute, off stage)

- [ ] Open `index.html` in Chrome or Edge. Browser zoom **100%**.
- [ ] Settings (gear, top right): theme **Parchment**, Large text **off**.
- [ ] Hub → **Reset demo** → **Reset demo**. The header should read **Level 4 · 27/31 · AC 15**.
- [ ] Close other tabs. Turn off notifications.
- [ ] Optional: start NVDA (Insert+Q quits) if you want to show announcements out loud.

If anything goes wrong mid-demo, **Reset demo** puts everything back. Refreshing the page keeps the current state.

---

## 1. The Hub (0:30)

| Do | Say |
|---|---|
| Point at the header tiles. | "The header always shows the three things players check most: level, hit points, armor class." |
| Point at the open Combat card's summary line. | "Cards are ordered by how often you use them. Combat is first and open. Initiative, speed and proficiency are on the main page. That came from our usability testing." |
| Click **Edit layout**, click **↓ Down** on Combat once, then **Reset order**, then **Edit layout** again. | "Players can reorder cards. Up and Down buttons work with a keyboard or a switch, not just drag. Card order is also the screen-reader reading order." |

## 2. Combat (1:15) — test task 1

| Do | Expect | Say |
|---|---|---|
| In **Amount**, type `5`, press **Damage**. | HP **22 / 31**. Status bar: "Kira took 5 damage. HP 22 of 31." | "Every change is announced to screen readers and shown in the status bar." |
| Type `10`, press **Damage**. | HP **12 / 31** and a **⚠ Half HP or less** label. | "Low HP isn't shown by color alone. There's an icon and a word." |
| Type `5`, press **Heal**. | HP **17 / 31**, the label disappears. | |
| On Shortsword, press **Roll to hit**, then **Roll damage**. | "Last roll" shows the d20 + 5. Damage shows **piercing** separately. | "To-hit and damage are separate rolls, and damage keeps its type. Testers told us combining them hid what caused the damage, which matters for resistances." |

Keyboard version: Tab to Amount, type, Tab to Damage, press Enter. Focus stays on the button, so you can press Enter again.

If **Roll to hit** shows a natural 20, the **Critical hit** button turns on (✓) and **Roll damage** rolls the damage dice twice. That is the 2014 rule, so just say "a critical hit doubles the dice, not the bonus."

## 3. Quick Page and Equipment (0:45)

| Do | Expect | Say |
|---|---|---|
| Press **Quick Page** (bottom bar), then press the **5** key. | Equipment page opens. | "Quick Page reaches any card in two actions. On a laptop the number keys jump straight there." |
| Press **Equipped** on **Studded leather**. | Header AC **15 → 13**. Button loses its ✓. | "Equipping changes the real numbers. Unequip your armor and your AC drops." |
| Press it again. | AC back to **15**. | |
| Open the **Modifiers** tab (or press → on the tab strip). | Ring of Protection +1 AC, +1 saving throws, not equipped. | "Item bonuses live here, and only count while equipped." |
| Press **← Back to hub**. | | |

## 4. Level Up (1:15) — test task 2

| Do | Expect | Say |
|---|---|---|
| Press **Level Up** (bottom bar). | "Step 1 of 4: Hit points". | "Leveling up is one step at a time, and every step says where you are." |
| Choose **Take the average**. | "Max HP 31 → 38 (gain 7)". | "You can also roll in the app, or type a roll from your own dice." |
| **Next**. | Table of 14 changes: proficiency +2 → +3, Stealth +7 → +9, Sneak Attack 2d6 → 3d6… | "The hardest part of leveling on paper is finding everything that changes. The app calculates every one." |
| **Next**. | Uncanny Dodge. | |
| **Next**, then **Confirm level up**. | Status: "Kira is now level 5." Header **Level 5 · 24/38**. | "Nothing is saved until you confirm. Escape or Cancel throws it all away." |

Use **average**, not roll, so the numbers are predictable on stage.

## 5. Guided first-time build (0:45) — test task 3

| Do | Expect |
|---|---|
| Hub → **New character**. Type `Mira`, press **Enter**. | Step 2 of 5: Class |
| Choose **Wizard**, **Next**. Choose **Elf (High Elf)**, **Next**. | Step 4 of 5: Ability scores |
| Press **Use suggested scores for Wizard**, **Next**. | Review: **HP 8, AC 12**, spells listed |
| Press **Create character**. | "Created Mira, a level 1 High Elf Wizard." Same cards, new character. |

Say: "A new player builds a character in five short steps. Each dropdown says which ability already uses a number, so you can't get lost. Our rules data is the free SRD, which has one subrace per race, so choosing Elf makes a High Elf."

## 6. Themes and accessibility (0:20)

| Do | Say |
|---|---|
| Gear → **High contrast**, tick **Large text**. | "Five themes, all checked for WCAG contrast, plus a large-text mode. It's all keyboard and screen-reader accessible." |
| Set back to **Parchment**, untick Large text, **Done**. | |

## 7. Reset (0:15)

| Do | Expect |
|---|---|
| Hub → **Reset demo**. | Confirm dialog. **Cancel** has focus, so Enter can't wipe anything by accident. |
| Press **Reset demo**. | "Demo reset. Kira is level 4 with 27 of 31 HP." |

---

## If someone asks

- **Is it accessible?** Every screen, tab, dialog and wizard step was scanned with axe-core in all five themes (165 states, 0 issues). It works keyboard-only, and focus is managed in every dialog. See `ACCESSIBILITY.md`.
- **Why not drag and drop?** Drag can be added, but buttons work for keyboard, switch and screen-reader users, so they stay either way.
- **Why can't I click outside a wizard to close it?** So a stray click never throws away your level-up choices. Escape and Cancel still close it.
- **Which rules?** D&D 5e 2014. The class and race data is a small demo set (4 classes, 4 races, Rogue to level 5).
