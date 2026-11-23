#!/usr/bin/env bash
# Hero's Ledger: automated tests. See tests/README.md.
#
#   bash tests/run.sh            quick suites (about 1 minute)
#   bash tests/run.sh all        everything, including the accessibility audit and random testing (5+ minutes)
#   bash tests/run.sh combat     one suite (names below)
#
# Each suite opens the real app in a headless Edge or Chrome, clicks through it
# with a test script, and prints PASS / FAIL lines. Exit code is 0 only if
# nothing failed. Needs: Git Bash (Windows) or Terminal (Mac/Linux), and
# Microsoft Edge or Google Chrome. No install, no Node.

set -u
cd "$(dirname "$0")/.." || exit 2
ROOT="$(pwd)"

# file:// URL of the repo. Git Bash on Windows needs the C:/ form.
if pwd -W >/dev/null 2>&1; then ROOT_NATIVE="$(pwd -W)"; ROOT_URL="file:///$ROOT_NATIVE"
else ROOT_NATIVE="$ROOT"; ROOT_URL="file://$ROOT"; fi
ROOT_URL="${ROOT_URL// /%20}"
OUT="$ROOT/tests/.out"            # generated pages, browser profiles, logs (git-ignored)
OUT_NATIVE="$ROOT_NATIVE/tests/.out"
mkdir -p "$OUT"
rm -rf "$OUT"/profile-* "$OUT"/*-browser.log 2>/dev/null   # leftovers from earlier runs (best effort)

QUICK="combat wizards demo extra saved-data layout"
ALL="$QUICK audit monkey"

find_browser() {
  if [ -n "${BROWSER_BIN:-}" ]; then echo "$BROWSER_BIN"; return; fi
  for b in "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
           "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
           "/c/Program Files/Google/Chrome/Application/chrome.exe" \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"; do
    if [ -f "$b" ]; then echo "$b"; return; fi
  done
  for c in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return; fi
  done
}
BROWSER="$(find_browser)"
if [ -z "$BROWSER" ]; then
  echo "No Edge or Chrome found. Set BROWSER_BIN to your browser, e.g."
  echo '  BROWSER_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe" bash tests/run.sh'
  exit 2
fi

# Build a copy of index.html that loads the app from the repo plus the test scripts.
#   $1 page name   $2 body scripts (space separated, relative to tests/)   $3 optional head script
REPORTER="<script src=\"$ROOT_URL/tests/reporter.js\"></script>"   # copies results to the console (see tests/reporter.js)
build_app_page() {
  local tags="" head="$REPORTER"
  for s in $2; do tags="$tags<script src=\"$ROOT_URL/tests/$s\"></script>"; done
  [ -n "${3:-}" ] && head="$head<script src=\"$ROOT_URL/tests/$3\"></script>"
  sed -e "s|src=\"js/|src=\"$ROOT_URL/js/|g" -e "s|href=\"css/|href=\"$ROOT_URL/css/|g" \
      -e "s|<head>|<head>$head|" -e "s|</body>|$tags</body>|" "$ROOT/index.html" > "$OUT/$1.html"
}

# Open a page headless and print what the test wrote into <pre id="test-out">.
#   $1 page name   $2 query string   $3 window width   $4 time budget (ms)   $5 extra browser flag
# Results come from --dump-dom. If that prints nothing (newer Edge on Windows),
# they are read from the browser's log file instead (see tests/reporter.js).
RUN_N=0
run_page() {
  # Every run gets its own browser profile and log. Reusing a profile while the
  # previous browser is still closing would hand the page to that old browser.
  # $$ (this script's process id) keeps names unique across runs too: Windows can
  # keep the last log locked a moment after the browser exits, so it can't
  # always be deleted, and a reused name would mix in the old run's results.
  RUN_N=$((RUN_N + 1))
  local id="$1-$$-$RUN_N" dom
  local profile="$OUT_NATIVE/profile-$id" blog="$OUT/$id-browser.log"
  rm -rf "$OUT/profile-$id" "$blog" 2>/dev/null
  dom="$("$BROWSER" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files ${5:-} \
    --user-data-dir="$profile" --window-size="$3,900" --virtual-time-budget="$4" \
    --enable-logging --v=0 --log-file="$OUT_NATIVE/$id-browser.log" \
    --dump-dom "$ROOT_URL/tests/.out/$1.html$2" 2>/dev/null)"
  if printf '%s' "$dom" | grep -q '<pre id="test-out"'; then
    printf '%s\n' "$dom" | sed -n '/<pre id="test-out"/,/<\/pre>/p' \
    | sed -e 's/<[^>]*>//g' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&quot;/"/g' -e "s/&#39;/'/g" -e 's/&amp;/\&/g'
  else
    # The launcher may return while the real browser keeps running in the
    # background, so wait for the end marker (up to the time budget + 60 s).
    local waited=0 limit=$(( $4 / 1000 + 60 ))
    until grep -aq 'WASDOUT-END' "$blog" 2>/dev/null || [ "$waited" -ge "$limit" ]; do
      sleep 1; waited=$((waited + 1))
    done
    sleep 1   # let the browser finish writing the log
    # Log lines look like: [..:INFO:CONSOLE:12] "WASDOUT PASS something", source: file:///... (12)
    [ -f "$blog" ] && tr -d '\r' < "$blog" | sed -n 's/^.*:CONSOLE[^"]*"WASDOUT \(.*\)", source: .*$/\1/p'
  fi
  # Wait for the browser to close (Windows keeps its profile locked until then) and clean up.
  local w=0
  until rm -rf "$OUT/profile-$id" 2>/dev/null || [ "$w" -ge 60 ]; do sleep 1; w=$((w + 1)); done
}

TOTAL_PASS=0; TOTAL_FAIL=0; FAILED_SUITES=""

# Run one page variant, print a summary line, and keep the full log.
#   $1 suite   $2 page   $3 query   $4 width   $5 budget   $6 extra flag
check() {
  local log="$OUT/$1${3:+-$(echo "$3" | tr -c 'a-zA-Z0-9' '_')}.log" pass fail
  run_page "$2" "$3" "$4" "$5" "${6:-}" > "$log"
  pass=$(grep -c '^PASS' "$log"); fail=$(grep -cE '^(FAIL|EXCEPTION|JSERROR)' "$log")
  if [ ! -s "$log" ]; then
    fail=1; echo "FAIL no output: the page did not finish in time (try BUDGET_SCALE=3)" > "$log"
  fi
  TOTAL_PASS=$((TOTAL_PASS + pass)); TOTAL_FAIL=$((TOTAL_FAIL + fail))
  if [ "$fail" -eq 0 ]; then printf '  ok    %-12s %-28s %3s checks\n' "$1" "$3" "$pass"
  else
    printf '  FAIL  %-12s %-28s %3s pass, %s fail   (log: tests/.out/%s)\n' "$1" "$3" "$pass" "$fail" "$(basename "$log")"
    grep -E '^(FAIL|EXCEPTION|JSERROR)' "$log" | head -n "${SHOW:-8}" | sed 's/^/          /'
    FAILED_SUITES="$FAILED_SUITES $1"
  fi
  grep '^INFO' "$log" | sed 's/^/          /'
  [ -n "${VERBOSE:-}" ] && sed 's/^/          /' "$log"
}

S="${BUDGET_SCALE:-1}"   # multiply time budgets on a slow machine
run_suite() {
  case "$1" in
    combat)     build_app_page combat "suites/combat.js";   check combat combat "" 1280 $((30000*S)) ;;
    wizards)    build_app_page wizards "suites/wizards.js"; check wizards wizards "" 1280 $((30000*S)) ;;
    demo)       build_app_page demo "suites/demo.js";       check demo demo "" 1280 $((30000*S)) ;;
    extra)      build_app_page extra "suites/extra.js";     check extra extra "" 1280 $((30000*S)) ;;
    saved-data) build_app_page saved-data "suites/saved-data.js" "suites/saved-data-head.js"
                for q in "" "?old=1" "?badjson=1"; do check saved-data saved-data "$q" 1280 $((20000*S)); done ;;
    layout)     sed -e "s|__APP__|$ROOT_URL/index.html|" -e "s|<body>|<body>$REPORTER|" "$ROOT/tests/suites/layout.html" > "$OUT/layout.html"
                for q in "" "?large"; do check layout layout "$q" 1280 $((90000*S)) --disable-web-security; done ;;
    audit)      build_app_page audit "vendor/axe.min.js suites/audit.js"
                check audit audit "" 1280 $((600000*S)) ;;
    monkey)     build_app_page monkey "suites/monkey.js"
                STEPS="${MONKEY_STEPS:-1200}"
                check monkey monkey "?seed=${SEED:-1}&steps=$STEPS" 900 $((900000*S))
                check monkey monkey "?seed=$(( ${SEED:-1} + 1 ))&steps=$STEPS&finish=1" 900 $((900000*S)) ;;
    *) echo "Unknown suite '$1'. Suites: $ALL"; exit 2 ;;
  esac
}

case "${1:-quick}" in
  quick) SUITES="$QUICK" ;;
  all)   SUITES="$ALL" ;;
  *)     SUITES="$*" ;;
esac

echo "WASD tests using: $BROWSER"
for s in $SUITES; do run_suite "$s"; done
echo
if [ "$TOTAL_FAIL" -eq 0 ]; then echo "ALL PASSED ($TOTAL_PASS checks)"; exit 0
else echo "FAILED: $TOTAL_FAIL failing checks in:$FAILED_SUITES ($TOTAL_PASS passed). Full logs in tests/.out/"; exit 1; fi
