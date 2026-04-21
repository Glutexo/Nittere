# NTV Live PiP Fix

This folder contains both workaround and diagnostic scripts for `https://news.ntv.co.jp/live`.

## Files

- `ntv-live-pip-fix.user.js` - userscript workaround.
- `ntv-live-pip-fix.applescript` - AppleScript source for the workaround.
- `ntv-live-pip-fix.scpt` - compiled AppleScript workaround.
- `ntv-live-pip-diagnostic.user.js` - userscript logger for PiP teardown analysis.
- `ntv-live-pip-diagnostic.applescript` - AppleScript source for the diagnostic logger.
- `ntv-live-pip-diagnostic.scpt` - compiled AppleScript diagnostic logger.

## Diagnostic mode

Use the diagnostic variant when PiP still immediately falls back into the page.

1. Open a fresh `https://news.ntv.co.jp/live` tab.
2. Run `ntv-live-pip-diagnostic.scpt` or enable `ntv-live-pip-diagnostic.user.js`.
3. Start playback.
4. Enter Picture-in-Picture and wait for the failure.
5. Export the collected log from the page.

### Export from Safari

Run this in Script Editor:

```applescript
tell application "Safari"
  do JavaScript "window.__ntvPiPDiagExport ? window.__ntvPiPDiagExport() : 'diagnostic log missing'" in current tab of front window
end tell
```

### Export from Web Inspector

```js
window.__ntvPiPDiagExport()
```

The diagnostic log captures:

- media `play()` / `pause()` calls with short stack traces
- `webkitSetPresentationMode()` and PiP API calls
- PiP enter/leave and media lifecycle events
- `visibilitychange`, `pagehide`, `blur`, `freeze`, and related page events
- video node insertion and removal in the DOM
