#!/usr/bin/env bash
# Install check, run inside the emulator job: does the app install the way a salesman installs it,
# both over the old Fakhri Tools app (v1.5) and on a phone that never had it, and does it open?
#   usage: app/ci/install-test.sh <old v1.5 apk> <new apk>      (writes app/ci/out/)
set -u
ADB=$(command -v adb); adb() { timeout 90 "$ADB" "$@"; }   # a phone that stops answering must not hang the check
OLD=$1 NEW=$2 PKG=com.fakhritools.catalogue OUT=app/ci/out
mkdir -p $OUT; : > $OUT/log.txt
FAILS=0
log() { echo "$(date +%T) $*" | tee -a $OUT/log.txt; }
check() { if [ "$1" = 0 ]; then log "PASS $2"; else log "FAIL $2"; FAILS=$((FAILS + 1)); fi; }
installs() { local r; r=$(timeout 300 "$ADB" install $1 "$2" 2>&1); log "adb install $1: $(echo "$r" | tail -1)"; echo "$r" | grep -q '^Success'; }
# a few minutes after a fresh emulator starts, Google Play Services updates and restarts itself, and Android
# closes every app using its font service with it; that is the emulator starting up, not the app
gmskills() { adb logcat -d 2>/dev/null | grep -c "Killing [0-9]*:$PKG.*depends on provider com.google.android.gms"; }
opens() {    # tap the home-screen icon, then the app must be on screen and not crashed
  local k; k=$(gmskills)
  adb shell input keyevent 3; sleep 2
  adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1; sleep 12
  adb exec-out screencap -p > "$OUT/$1.png"
  local top; top=$(adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' | tr -d '\r' | tr -s ' \n' ' '); log "on screen: $top"
  echo "$top" | grep -q "$PKG/" && return 0   # shows the icon's name (.MainActivity), not the screen's
  if [ "${2:-}" != again ] && [ "$(gmskills)" -gt "$k" ]; then
    log "Play Services restarted itself on the test phone and Android closed the app with it; opening again"
    opens "$1" again; return
  fi
  return 1
}
version() { adb shell dumpsys package $PKG | grep -m1 -o 'versionName=[^ ]*' | tr -d '\r'; }

adb wait-for-device; for i in $(seq 1 60); do [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && break; sleep 3; done; sleep 10
adb shell settings put system screen_off_timeout 1800000
log "Android $(adb shell getprop ro.build.version.release | tr -d '\r') (API $(adb shell getprop ro.build.version.sdk | tr -d '\r'))"
adb logcat -c

# 1. a phone with the old Fakhri Tools app on it
adb uninstall $PKG > /dev/null 2>&1
installs "" "$OLD"; check $? "the old app (v1.5) installs"
opens 1-old-app; check $? "the old app opens ($(version))"

# 2. the new app installed over it, as when the salesman taps the downloaded file
installs -r "$NEW"; check $? "the new app installs over the old one"
v=$(version); [ "$v" = "versionName=$(sed -n 's/.*versionName=\([^ ]*\).*/\1/p' app/version.txt)" ]; check $? "the phone now has the new version ($v)"
opens 2-updated-app; check $? "the updated app opens from its icon"

# 3. a phone that never had the app
adb uninstall $PKG > /dev/null 2>&1
installs "" "$NEW"; check $? "the new app installs on a phone without it"
opens 3-fresh-app; check $? "the new app opens from its icon"

adb logcat -d > $OUT/logcat-full.txt 2>&1
grep -E "FATAL EXCEPTION|AndroidRuntime: Process: $PKG" $OUT/logcat-full.txt > $OUT/crashes.txt
[ ! -s $OUT/crashes.txt ]; check $? "no crash while installing and opening"
tail -c 3000000 $OUT/logcat-full.txt > $OUT/l && mv $OUT/l $OUT/logcat-full.txt

[ $FAILS = 0 ] && log "ALL CHECKS PASSED" || log "$FAILS CHECK(S) FAILED"
(cd $OUT && echo "commit $GITHUB_SHA run $GITHUB_RUN_ID" > run.txt && rm -rf .git && git init -q && git checkout -q -b r && git add -A && git -c user.name="catalogue test" -c user.email="test@users.noreply.github.com" commit -qm "Install test results for $GITHUB_SHA" && git push -fq "$PUSH_URL" "r:$RESULTS_BRANCH") || echo "could not save results"
exit $FAILS
