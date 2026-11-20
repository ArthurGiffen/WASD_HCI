# WASD Character Sheet

Team WASD (David Valle, Arthur Giffen, Sujal Sharma). HCI semester project, TAMU-CC. Due **December 2, 2026**.

A modular, responsive, accessible redesign of the D&D 5e character sheet. The sheet is a set of
**cards**, ordered by how often players use them at the table. Players can collapse, open and
reorder cards. The visual order is also the screen-reader reading order.

> Status: **demo build**. Combat card (HP, attack rolls), dice roller, all 7 cards, style guide applied, Reset demo.
> Also: Level Up wizard (2014 rules) and guided first-time build.
> Also: 5 themes + Large text, accessibility pass (see `ACCESSIBILITY.md`), demo script (`DEMO-SCRIPT.md`).

## How to run

No install, no build step.

- **Easiest:** double-click `index.html` to open it in a browser.
- **While editing:** open the folder in VS Code and use the **Live Server** extension
  (right-click `index.html` → *Open with Live Server*). The page reloads on save.

## Folder structure

```
index.html                   Page shell: header / content / action zones, Quick Page dialog, script tags
README.md                    This file
AI-DISCLOSURE.md             Record of AI-generated work (course requirement)
PLAN.md                      Build plan and status
DEMO-SCRIPT.md               5-minute live demo, click by click
ACCESSIBILITY.md             How accessibility was tested, what was fixed, known limits
fonts/                       Atkinson Hyperlegible (bundled, so the page works offline)
css/
  base.css                   Tokens (colors from the style guide, spacing in rem), font, focus ring, buttons, helpers
  layout.css                 Header / content / action zones and the responsive card grid
  cards.css                  Card shell + shared content patterns (stat tiles, tables, lists)
  components.css             Combat HP/attacks, tabs, equipment rows, modal dialogs, dice roller
  quick-page.css             Quick Page overlay
  themes.css                 Dark, High contrast, Forest, Arcane themes + Large text
js/
  registry.js                window.WASD namespace, registerCard(), esc(), announce(), icon(), data-action click handling
  dialog.js                  WASD.modal() for <dialog>s and WASD.confirm() (yes/no)
  tabs.js                    WASD.tabs.render(): one accessible tab component (Equipment, Features)
  dice.js                    Dice rolling (no DOM)
  wizard.js                  WASD.wizard.open(): step-by-step dialog used by Level Up and New character
  data/classes.js            2014 class/race data for Level Up and the guided build (paraphrased, review it)
  data/sample-character.js   Kira, Human Rogue 4: RAW inputs only (scores, proficiencies, level, gear)
  rules.js                   5e math: WASD.rules.derive(raw) -> the sheet the cards read (mods, saves, AC…)
  character-store.js         Load/save (localStorage), WASD.updateCharacter(), WASD.resetCharacter()
  cards/                     One file per card module
    combat.js  abilities.js  skills.js  spellcasting.js
    equipment.js  features.js  identity.js
  hub.js                     Hub screen: renders cards, collapse/expand, Edit layout (Up/Down)
  router.js                  #/ = Hub, #/card/<id> = Card view; moves focus on navigation
  quick-page.js              Quick Page overlay: open/close, keys 1–7, focus in/out, Escape
  settings.js                Settings dialog (gear in the header): theme and Large text
  actions/roll.js            Roll button: dice roller dialog
  actions/reset.js           Reset demo button (confirm, then restore Kira at level 4)
  actions/level-up.js        Level Up wizard: HP, proficiency changes, new features, review
  actions/new-character.js   New character wizard: name, class, race, ability scores, review
  app.js                     Bootstrap: loads the character, fills the header, starts the router
```

Script load order in `index.html` matters: registry → data → rules/store → cards → hub/router/quick-page → actions → app.

## Changing the character

Cards only **read** `ch` (the derived sheet). To change something, edit the raw inputs through the store:

```js
WASD.updateCharacter((raw) => { raw.combat.hp.current -= 5; });   // saves, recalculates, redraws
```

The redraw keeps keyboard focus on the element with the same `id`, so give buttons inside cards stable ids.
The player's character is saved in `localStorage`; `WASD.resetCharacter()` restores Kira.
If you change the **shape** of the saved character (rename or move fields), bump `SCHEMA` in
`js/character-store.js` and in `sample-character.js`. Old saved data is then ignored instead of breaking the page.
We use plain `<script>` tags (not ES modules) so the page works when opened straight from disk.

## Screens and zones

Every screen has three zones: **header** (character summary), **content**, and **action** (bottom bar:
Quick Page · Roll · Level Up).

| Screen     | Route            | What it shows |
|------------|------------------|---------------|
| Hub        | `#/`             | All 7 cards, each collapsible, with an *Open … page* link. *Edit layout* shows Up/Down buttons. |
| Card view  | `#/card/combat`  | One card full width, with *Back to hub* and the card title as the page `<h1>`. |
| Quick Page | overlay          | Numbered list of all cards. Click, or press 1–7 on a keyboard. Escape closes. |

## How a card module works

Each file in `js/cards/` registers one card. Copy an existing one to start:

```js
WASD.registerCard({
  id: 'combat',                 // used in the URL: #/card/combat
  title: 'Combat',              // heading text
  summary(ch) {                 // one plain-text line on the collapsed card. Most-used value FIRST
    return `AC ${ch.combat.armorClass} · ...`;
  },
  render(ch, ctx) {             // returns the card body as an HTML string
    const h = ctx.sub;          // 'h3' on the hub, 'h2' on the card page. Use it for sub-headings
    return `<${h}>Attacks</${h}> ...`;
  },
});
```

Rules:
- **Never hardcode character data in a card.** Read it from `ch` (built by `WASD.rules.derive()` from `sample-character.js`).
- **No game math in cards.** Add calculations to `js/rules.js`.
- **Escape text** from the character with `WASD.esc()` before putting it in HTML.
- **Sub-headings use `ctx.sub`**, never a fixed `<h3>`, so the heading outline is right on both screens.
- Don't put `<h1>`/`<h2>` in a card body. The shell already provides the card heading.

## Suggested split of work

The split follows the three usability-test tasks, so each person owns one task end to end.
Search the code for `TODO(Person A)`, `TODO(Person B)` and `TODO(Person C)`.

| Person | Owns | Files | Later features |
|---|---|---|---|
| **A: Shell & navigation** | Hub, Quick Page, routing, zones, Edit layout | `index.html`, `css/base.css`, `css/layout.css`, `css/quick-page.css`, `js/registry.js`, `js/hub.js`, `js/router.js`, `js/quick-page.js`, `js/app.js`, `js/actions/level-up.js` | **Level Up flow** (task 2), dark theme, drag-and-drop as an extra |
| **B: Combat lookup** | The cards used mid-fight | `js/cards/combat.js`, `js/cards/abilities.js`, `js/cards/skills.js`, `js/actions/roll.js` | **Combat lookup** polish (task 1), HP +/- controls, dice roller |
| **C: Character content & creation** | Data model and the "story" cards | `js/data/sample-character.js`, `js/cards/spellcasting.js`, `js/cards/equipment.js`, `js/cards/features.js`, `js/cards/identity.js` | **Guided first-time build** (task 3), Add Spell, save/load character |

`css/cards.css` is shared. If your card needs a lot of custom CSS, create `css/cards/<card-id>.css`
and add one `<link>` to `index.html` instead of growing the shared file.

Suggested Git habit: one branch per person/feature, small PRs, and pull `main` before starting work.
The files most likely to conflict are `index.html` (script/link tags) and `css/cards.css`.

## Naming

- It's **Quick Page** everywhere (UI text, code, docs). Never "Quick Jump".
- Card ids: `combat`, `abilities`, `skills`, `spellcasting`, `equipment`, `features`, `identity`.

## Accessibility checklist (check before every PR)

- [ ] Works with **keyboard only**: Tab to everything, Enter/Space activates, no traps.
- [ ] **Focus is always visible**. Don't remove `:focus-visible` outlines.
- [ ] Sizes in **rem**. Page still works at **200% browser zoom** (laptop drops to one column).
- [ ] One heading per card. Sub-headings via `ctx.sub`.
- [ ] Collapsibles use a `<button>` with correct `aria-expanded`.
- [ ] No information by color or icon alone (e.g. "proficient" is a text tag).
- [ ] Visual order == DOM order (no CSS `order`, no dense grid placement).
- [ ] Status changes (rolls, moves) are announced with `WASD.announce()`.
- [ ] Tested once with a screen reader: NVDA (Windows, free), VoiceOver (Mac/iPhone), or TalkBack (Android).

## Open team decisions

- Quick Page numbering currently follows the player's **hub order**. The alternative is fixed numbers
  (1 is always Combat) for muscle memory. Worth testing.
- Card order is saved per browser in `localStorage`. Use *Edit layout → Reset order* between usability-test participants.
