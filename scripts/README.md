# NTV Live PiP Fix

This folder contains two ways to keep Picture-in-Picture active on `https://news.ntv.co.jp/live`.

## Files

- `ntv-live-pip-fix.user.js` - userscript for Tampermonkey, Userscripts, or a similar extension.
- `ntv-live-pip-fix.applescript` - AppleScript source that injects the runtime patch into the current Safari tab.
- `ntv-live-pip-fix.scpt` - compiled AppleScript version of the same Safari helper.

## What changed in version 1.2

The fix now also masks `visibilitychange`, `pagehide`, `blur`, and `freeze` signals while PiP is active. This targets players that immediately tear down PiP because they think the page lost foreground state.

## Userscript

1. Install a userscript manager in Safari.
2. Import `ntv-live-pip-fix.user.js`.
3. Open `https://news.ntv.co.jp/live`.
4. Start the stream and enter Picture-in-Picture.

The script runs automatically on matching live page URLs.

## AppleScript

Use this when you want a manual one-shot fix for the current Safari tab.

1. Open `https://news.ntv.co.jp/live` in Safari.
2. Run `ntv-live-pip-fix.scpt` with Script Editor, Script Menu, or `osascript`.
3. Start playback and enter Picture-in-Picture.

Example:

```sh
osascript scripts/ntv-live-pip-fix.scpt
```

If the page reloads, run the AppleScript again.
