# NTV Live PiP Fix

This folder contains the workaround scripts for `https://news.ntv.co.jp/live`.

## Files

- `ntv-live-pip-fix.user.js` - userscript workaround.
- `ntv-live-pip-fix.applescript` - AppleScript source for the workaround.
- `ntv-live-pip-fix.scpt` - compiled AppleScript workaround.
- `ntv-live-pip-fix.inject.js` - injected JavaScript payload used by the AppleScript workaround.
- `run-ntv-live-pip-fix.command` - double-click launcher for the compiled AppleScript workaround.

## What changed in version 1.3

The root cause was that `players.streaks.jp/sdk/v2.5.6/streaksplayer.min.js` immediately called `document.exitPictureInPicture()` right after PiP started. The fix ignores that call for a short protection window after entering PiP, while also masking page lifecycle signals and forced inline fallback.

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
