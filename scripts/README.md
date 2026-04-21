# NTV Live PiP Fix

This folder contains the workaround scripts for `https://news.ntv.co.jp/live`.

## Files

- `ntv-live-pip-fix.user.js` - userscript workaround.
- `ntv-live-pip-fix.applescript` - AppleScript source for the workaround.
- `ntv-live-pip-fix.scpt` - compiled AppleScript workaround.
- `ntv-live-pip-fix.inject.js` - injected JavaScript payload used by the AppleScript workaround.
- `run-ntv-live-pip-fix.command` - double-click launcher for the compiled AppleScript workaround.

## How it works

The live page uses the Streaks player. After Picture-in-Picture starts, that player immediately calls `document.exitPictureInPicture()`, which forces the video back into the page.

The fix works by patching the browser APIs used by the player for a short protection window after PiP starts:

- it ignores `document.exitPictureInPicture()` during that window
- it ignores forced `pause()` calls on the protected video
- it blocks forced switches from PiP back to inline presentation mode
- it masks page lifecycle signals such as `visibilitychange`, `pagehide`, `blur`, and `freeze`
- it reports `document.hidden` as `false` and `document.visibilityState` as `visible` while the protected PiP session is active

The AppleScript variant injects the JavaScript payload into the current Safari tab. The userscript variant runs automatically on matching live page URLs.

## Userscript

1. Install a userscript manager in Safari.
2. Import `ntv-live-pip-fix.user.js`.
3. Open `https://news.ntv.co.jp/live`.
4. Start the stream and enter Picture-in-Picture.

The script runs automatically on matching live page URLs.

## AppleScript

Use this when you want a manual one-shot fix for the current Safari tab.

1. Open `https://news.ntv.co.jp/live` in Safari.
2. Run `ntv-live-pip-fix.scpt` from this folder with Script Editor, Script Menu, `osascript`, or double-click `run-ntv-live-pip-fix.command`.
3. Start playback and enter Picture-in-Picture.

Example:

```sh
osascript scripts/ntv-live-pip-fix.scpt
```

If the page reloads, run the AppleScript again.
