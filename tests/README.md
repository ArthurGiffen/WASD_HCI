# Testing the WASD Character Sheet

How to check that the app still works before you push, open a pull request or present.
There are two halves: **automated tests** (one command, about a minute) and a short **manual check** that only a person can do.

## Quick start

Open a terminal in the project folder (on Windows use **Git Bash**, which comes with Git), then:

```bash
bash tests/run.sh          # quick suites, about 1 minute
bash tests/run.sh all      # everything, including the accessibility audit and random testing (2 to 5 minutes)
```

You need **Microsoft Edge or Google Chrome** installed. Nothing else: no Node, no install step.
The script opens the real app in a hidden browser window, clicks through it, and prints a result for each suite:

```
WASD tests using: /c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe
  ok    combat                                     55 checks
  ok    wizards                                    72 checks
  ...
ALL PASSED (225 checks)
```

When something breaks, you see the failing checks and where the full log is:

```
  FAIL  wizards        63 pass, 9 fail   (log: tests/.out/wizards.log)
          FAIL proficiency +2 -> +3 shown
          FAIL change listed: Stealth +7 +9
```

The exit code is `0` only when everything passed, so the command can also be used in scripts or CI.

## When to run what

| Moment | Run |
|---|---|
| Before every push or pull request | `bash tests/run.sh` (quick) |
| After changing styles, colors, themes, dialogs or anything a screen reader hears | `bash tests/run.sh all` |
| The day before the demo | `bash tests/run.sh all`, then the **manual check** below, then rehearse `DEMO-SCRIPT.md` |

## What each suite checks

| Suite | What it does | Group |
|---|---|---|
| `combat` | Hub, HP damage/heal/temp HP and its limits, bad input, attack rolls, equipment and tabs, coins, dice roller, Reset demo | quick |
| `wizards` | Level Up 4 → 5 (every changed number, missing level data, Cancel, Escape) and the New character build, step by step | quick |
| `demo` | Runs `DEMO-SCRIPT.md` click by click and checks every number the script promises | quick |
| `extra` | Rules math against hand-worked examples (Fighter Dwarf, Cleric Halfling, Rogue Elf, Human Wizard), Quick Page order, browser Back, a real page reload | quick |
| `saved-data` | Old-format, corrupt and unknown saved data must never break the app | quick |
| `layout` | 320, 360 and 640px wide, with and without Large text: nothing may scroll sideways | quick |
| `audit` | axe-core (WCAG 2.2 AA + best practice) plus our own checks (duplicate ids, heading order, focus inside dialogs) on 165 screen states: every card, tab, dialog and wizard step in all 5 themes | all |
| `monkey` | Random testing: 1,200 random keyboard-user actions per run, checking after every step that nothing errors, HP stays in range, nothing goes negative, screen and saved data agree, and focus is never lost | all |

Run one or a few suites by name: `bash tests/run.sh combat layout`.

## Manual check (about 10 minutes, a person has to do this)

Automated tests can't hear a screen reader or feel a keyboard. Do this once before the demo and after big changes.

**Keyboard only.** Unplug or ignore the mouse.
1. Press Tab from the top. You should see a clear blue focus ring on every stop, in a sensible order, and never get stuck.
2. Open and close a card with Enter. Damage Kira with Tab and Enter, then roll an attack.
3. Open Quick Page, press `5`, then go back with the **Back to hub** link.
4. Level Up with only the keyboard: arrow keys pick the HP option, Enter moves on, Escape cancels. Focus should return to the Level Up button.
5. In Equipment, Tab to the tab strip and switch tabs with the ← → keys.

**Screen reader.** Windows: [NVDA](https://www.nvaccess.org/) (free; Insert+Q quits). Mac/iPhone: VoiceOver (Cmd+F5).
1. Damage Kira and listen: you should hear "Kira took 5 damage. HP 22 of 31."
2. Open the dice roller, roll a d20: the result is read out.
3. Level Up: each step's heading is read ("Step 2 of 4: Proficiency and bonuses"). After confirming you hear "Kira is now level 5."
4. Press H to jump between headings on the Hub: one heading per card, nothing skipped.

**Zoom and themes.**
1. Browser zoom 200% and 400% (Ctrl/Cmd and +): no sideways scrolling, nothing cut off.
2. Gear (top right): try every theme and Large text. Text should stay easy to read everywhere.

**Real phone (if you can).** Open the app on a phone: buttons should be easy to hit and the bottom bar shouldn't cover what you're typing.

Write down anything odd with the step number and what you expected.

## Adding a test

Each suite is a plain script in `tests/suites/` that runs inside the app page after it loads. It drives the app like a user and writes `PASS ...` / `FAIL ...` lines into a `<pre id="test-out">` at the end. The easiest start is to copy a check from `combat.js`:

```js
type('#hp-amount', '5'); await click('#hp-damage');
ok(WASD.raw.combat.hp.current === 22, '5 damage -> 22');
```

- `ok(condition, message)` records a PASS or FAIL.
- `click('#id')` clicks and waits briefly; `type('#id', 'text')` fills a field.
- Before writing a check, work out the expected number **by hand** (from the rules or the design), not by copying what the app shows, otherwise the test only proves the app agrees with itself.
- A new suite file also needs one line in the `run_suite` list in `tests/run.sh`.

When you fix a bug, first add a check that fails because of the bug, then fix it and watch the check pass.

## Options

| Setting | Example | Effect |
|---|---|---|
| `VERBOSE=1` | `VERBOSE=1 bash tests/run.sh combat` | Print every check, not just failures |
| `SHOW=30` | `SHOW=30 bash tests/run.sh` | Show up to 30 failing lines per suite (default 8) |
| `BUDGET_SCALE=3` | `BUDGET_SCALE=3 bash tests/run.sh all` | Give a slow computer 3x more time |
| `BROWSER_BIN` | see Troubleshooting | Use a specific browser |
| `MONKEY_STEPS`, `SEED` | `MONKEY_STEPS=5000 SEED=7 bash tests/run.sh monkey` | Longer random run, or a different random sequence. The same seed always repeats the same actions, so a failure can be reproduced. |

## Troubleshooting

- **"No Edge or Chrome found."** Point the script at your browser:
  `BROWSER_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe" bash tests/run.sh`
  (Mac: `BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`).
- **"FAIL no output"**: the page didn't finish in time. Try `BUDGET_SCALE=3`. If it still fails, open the generated page `tests/.out/<suite>.html` in your normal browser and look at the console (F12) for an error.
- **Windows: "bash is not recognized"**: use the Git Bash app (Start menu), not PowerShell or Command Prompt.
- **A failure you don't understand**: the full log is in `tests/.out/<suite>.log`. Each FAIL line says what was expected and what the app did.
- **Phone-width accessibility scans:** at narrow widths axe-core reports whichever control happens to sit under the sticky bottom bar. That's a known false positive: axe doesn't scroll the page, and focusing any control scrolls it clear. That's why the `audit` suite runs at desktop width. The `layout` suite covers narrow widths.

`tests/.out/` holds generated pages, logs and temporary browser profiles. It's git-ignored and safe to delete.

## Files

```
tests/
  run.sh                 the test runner (this is what you run)
  README.md              this file
  suites/                one script per suite (see the table above)
  vendor/axe.min.js      axe-core 4.10.2 accessibility engine (Deque Systems, MPL-2.0, unmodified)
  .out/                  generated output (git-ignored)
```
