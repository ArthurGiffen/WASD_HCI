# Accessibility Pass (2026-11-20)

How the WASD Character Sheet was checked, what was fixed, and what still needs a human test.

## How it was tested

| Check | How | Result |
|---|---|---|
| Automated WCAG 2.2 AA + best practice | axe-core 4.10 on **165 states**: every card page, every tab, every dialog, every wizard step, error states, Bloodied and 0 HP, in all **5 themes** | **0 issues** at desktop width; at phone width only sticky-bar false positives (below) |
| Phone width and zoom | Same scan at 500px wide, and at 640px with Large text (like a laptop at 250% zoom); layout measured at 320, 360 and 640px | No sideways scrolling anywhere |
| Theme contrast | Every color pair the UI uses, in every theme (text 4.5:1, borders, icons and focus ring 3:1) | All pass |
| Focus not hidden by the sticky bar | Focused every control on the Combat page at phone width, normal and Large text | 13 of 13 fully visible |
| Keyboard and focus | Scripted tests of every flow: dialogs move focus in and return it, Escape closes, tabs use the arrow keys, focus survives every redraw | 127 checks pass |
| Demo path | `DEMO-SCRIPT.md` run as a test; every number in the script checked | Pass |
| Random "monkey" testing | 17,000 random keyboard actions (buttons, tabs, radios, dropdowns, Escape, junk typed into number fields) with checks after every step: no errors, HP in range, no negatives, no duplicate ids, screen and saved data match, focus never lost | 0 failures after fixes |
| Saved data | Old-format, corrupt and unknown saved data planted before load; page reloaded mid-test | App always loads; changes survive reload |

All of these checks can be rerun with `bash tests/run.sh all` (see `tests/README.md`).

## What was fixed

1. **Duplicate ids:** returning to the Hub left the previous card page hidden in the page. Its ids (e.g. the Features tabs) then existed twice, which can confuse screen readers and focus. The hidden page is now emptied.
2. **"Reduce motion" setting was backwards:** the rule set a tiny transition duration on everything. Transitions default to *all properties*, so this **created** hundreds of transitions on every theme change. It now turns transitions and animations off completely.
3. **Controls hidden behind the bottom bar:** a keyboard user could tab to a field sitting under the sticky action bar (WCAG 2.4.11). The page now scrolls focused controls above the bar.
4. **Hub heading said too little:** the page `<h1>` was only "Ready for the next move". It now reads "Character overview: Ready for the next move", and the card list has its own label ("Character cards") instead of borrowing the heading.
5. **Pressed toggles relied on fill color:** Edit layout, Proficient only and Equipped now all show a ✓ when on, so the state is visible without color.
6. **Windows High Contrast (forced colors):** pressed buttons, the selected tab, the selected choice and the focus ring now stay visible when Windows replaces the app's colors.
7. **Extra Tab stops in tabs:** tab panels that already contain buttons no longer add an extra stop. Text-only panels keep one so their text can be reached and scrolled.
8. **Ignored label on coin counts:** removed an `aria-label` on a plain `<span>` (screen readers ignore it). The visible "Gold 15" already reads correctly.
9. **Focus fell out of the Level Up dialog** (found by random testing): pressing "Roll d8" replaces the button with the result, so keyboard focus dropped onto the page behind the dialog. Focus now moves to Next whenever the pressed control disappears.
10. **Abilities table with Large text on a phone** was wider than the screen. It now scrolls inside its own labelled box (allowed for data tables), so the page itself never scrolls sideways.

Built in during this pass: five themes (Parchment, Dark, High contrast, Forest, Arcane) and Large text (125%), in a keyboard-accessible Settings dialog. The first visit follows the device's dark-mode or more-contrast setting.

## Known limits

- **No real screen reader has been run yet.** The ARIA, focus order and announcements are all checked by script, but someone should do the NVDA or VoiceOver check in `README.md` once before the demo.
- **Sticky-bar false positive:** at phone width, axe flags whichever control happens to sit under the bottom bar at scroll position 0. axe does not scroll the page. Focusing any control scrolls it clear (fix 3).
- **Not tested on a phone with a real touch screen.** Targets are at least 44×44px by design.
