#!/usr/bin/env bash
# runs inside the emulator job
mkdir -p app/ci/out
timeout 300 adb install -r app/build/fakhri-catalogue.apk
adb shell settings put system screen_off_timeout 1800000
adb logcat -c
(adb logcat -v time > app/ci/out/logcat-full.txt 2>&1 &)
(while sleep 5; do echo "$(date +%T) $(adb shell 'cat /proc/meminfo | head -3; uptime' 2>&1 | tr '\n' ' ')" ; done > app/ci/out/health.txt 2>&1 &)
adb wait-for-device; for i in $(seq 1 60); do [ "$(adb shell getprop sys.boot_completed | tr -d "\r")" = 1 ] && break; sleep 3; done; sleep 10
# On Android 13, Google Play Services updates and restarts itself a few minutes after a fresh start, and Android
# closes every app using its font service with it (the WebView does). Let that happen before the test starts.
: > app/ci/out/log.txt
if [ "$(adb shell getprop ro.build.version.sdk | tr -d '\r')" -ge 33 ]; then
  up() { adb shell cat /proc/uptime | cut -d. -f1; }
  for i in $(seq 1 90); do
    grep -q "Module config changed, forcing restart" app/ci/out/logcat-full.txt && { sleep 20; break; }
    [ "$(up)" -ge 420 ] 2>/dev/null && break
    sleep 5
  done
  echo "$(date +%T) Play Services start-up restarts seen: $(grep -c 'Module config changed, forcing restart' app/ci/out/logcat-full.txt), phone up $(up) s" >> app/ci/out/log.txt
fi
(cd app/ci && timeout 1200 node phone-test.mjs) >> app/ci/out/log.txt 2>&1 || echo "TEST SCRIPT FAILED" >> app/ci/out/log.txt
grep -iE "fakhri|chromium|AndroidRuntime|FATAL|WebView|lowmemory|ActivityManager" app/ci/out/logcat-full.txt | tail -600 > app/ci/out/logcat.txt; tail -c 3000000 app/ci/out/logcat-full.txt > app/ci/out/l && mv app/ci/out/l app/ci/out/logcat-full.txt
cat app/ci/out/log.txt
# save the results straight away (the emulator sometimes hangs while shutting down)
(cd app/ci/out && echo "commit $GITHUB_SHA run $GITHUB_RUN_ID" > run.txt && rm -rf .git && git init -q && git checkout -q -b r && git add -A && git -c user.name="catalogue test" -c user.email="test@users.noreply.github.com" commit -qm "Phone test results for $GITHUB_SHA" && git push -fq "$PUSH_URL" "r:${RESULTS_BRANCH:-catalogue-app-test-results}") || echo "could not save results"
