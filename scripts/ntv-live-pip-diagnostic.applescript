set scriptDir to do shell script "dirname " & quoted form of POSIX path of (path to me)
set jsPath to scriptDir & "/ntv-live-pip-diagnostic.inject.js"
set js to do shell script "/bin/cat " & quoted form of jsPath

tell application "Safari"
	do JavaScript js in current tab of front window
end tell
