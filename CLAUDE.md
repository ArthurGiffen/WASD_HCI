# CLAUDE.md

Instructions for AI coding sessions on Hero's Ledger. Read `PLAN.md` for the full plan, accessibility rules and working style.

## Rules edition: D&D 5e 2014 only

This app follows the **Dungeons & Dragons 5th Edition 2014 rules only**: the 2014 Player's Handbook and SRD 5.1. It does **not** follow the 2024 revision.

Everything in the app must reflect 2014: rules, numbers, feature names and terms. In practice:

- Say **race**, not "species". Ability score increases come from **race**, not background.
- No 2024-only rules: origin feats, Weapon Mastery, Cunning Strike, Heroic Inspiration, Bloodied as a rules condition, the Utilize action, "Hit Point Dice", and so on.
- Class features come at their **2014 levels**. For example, Rogue level 5 is Uncanny Dodge and Sneak Attack 3d6 only, and the Cleric picks a Divine Domain at level 1.
- Racial traits, spell effects, and hit point and AC math follow the 2014 text.
- The rules reference is the **SRD 5.1** (attribution in `README.md`). It has 9 races (all in `js/data/classes.js`), with one subrace each for Elf, Dwarf, Halfling and Gnome (High Elf, Hill Dwarf, Lightfoot Halfling, Rock Gnome), one Cleric domain (Life) and one background (Acolyte). Race and subrace are separate fields. Anything outside the SRD needs the user's Player's Handbook, so ask.
- If a stat, rule or feature isn't in the repo's data (`js/data/`), **ask instead of inventing it**.
  If you aren't sure whether something is 2014 or 2024, say so rather than guessing.

## Other standing rules (details in PLAN.md)

- Plain HTML, CSS and JavaScript. Don't add frameworks or dependencies without asking.
- Accessibility:
  - Real buttons and inputs with labels.
  - Fully keyboard operable, with visible focus.
  - Announce HP, dice and level-up changes through `WASD.announce`.
  - Never rely on color alone.
  - WCAG AA contrast.
  - Works at 200% zoom.
- Before pushing, run `bash tests/run.sh` (or `bash tests/run.sh all` after style, dialog or ARIA changes). See `tests/README.md`.
- After a change, check that every number in `DEMO-SCRIPT.md` still matches the app.
- After each task, add a short factual row to `AI-DISCLOSURE.md`.
