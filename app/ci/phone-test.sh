#!/usr/bin/env bash
# runs inside the emulator job
mkdir -p app/ci/out
adb install -r app/build/fakhri-catalogue.apk
adb shell settings put system screen_off_timeout 1800000
adb logcat -c
adb wait-for-device; for i in $(seq 1 60); do [ "$(adb shell getprop sys.boot_completed | tr -d "\r")" = 1 ] && break; sleep 3; done; sleep 10
(cd app/ci && timeout 1200 node phone-test.mjs) > app/ci/out/log.txt 2>&1 || echo "TEST SCRIPT FAILED" >> app/ci/out/log.txt
adb logcat -d | grep -iE "fakhri|chromium|AndroidRuntime|FATAL|WebView" | tail -400 > app/ci/out/logcat.txt
cat app/ci/out/log.txt
