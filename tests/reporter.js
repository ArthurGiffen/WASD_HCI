// Test reporter, loaded first on every test page by tests/run.sh.
//
// Each suite writes its results into <pre id="test-out">. run.sh normally reads
// that with the browser's --dump-dom. Newer Microsoft Edge versions on Windows
// (seen with 158) print nothing for --dump-dom, so this script ALSO copies
// every result line into the browser console. run.sh then reads those lines
// from the browser's log file. Lines start with "WASDOUT " so they are easy to find.
(function () {
  function report(pre) {
    pre.textContent.split('\n').forEach((line) => console.log('WASDOUT ' + line));
    console.log('WASDOUT-END');
  }
  const existing = document.getElementById('test-out');
  if (existing) { report(existing); return; }
  new MutationObserver((changes, observer) => {
    const pre = document.getElementById('test-out');
    if (pre) { observer.disconnect(); report(pre); }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
