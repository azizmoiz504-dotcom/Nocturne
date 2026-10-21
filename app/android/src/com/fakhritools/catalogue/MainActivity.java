package com.fakhritools.catalogue;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.ComponentName;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fakhri Tools catalogue: a full-screen WebView that shows the catalogue bundled inside the app
 * (works with no signal) and quietly pulls the newest product list and photos from the live
 * website whenever the phone is online.
 *
 * Every page and photo is served from https://app.fakhri.local/..., looked up in this order:
 *   1. files/www/   (newer list and photos downloaded from the website)
 *   2. assets/www/  (what was packed into the app)
 *   3. the live website (a photo the app has never seen; saved for next time)
 */
public class MainActivity extends Activity {
    static final String HOST = "app.fakhri.local";
    static final String BASE = "https://" + HOST + "/";
    static final String LIVE = "https://azizmoiz504-dotcom.github.io/Nocturne/";
    static final Pattern IMG = Pattern.compile("'([A-Za-z0-9._-]+/[^'\"\\s]+?\\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))'");

    WebView web;
    File root;
    SharedPreferences prefs;
    final Handler ui = new Handler(Looper.getMainLooper());
    volatile boolean syncing = false;
    final Set<String> bundled = new HashSet<>();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        root = new File(getFilesDir(), "www");
        prefs = getSharedPreferences("ft", MODE_PRIVATE);
        brand = prefs.getString("brand", "");
        paintBars();

        // test builds only: lets the automated phone test drive the pages
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(isBam() ? "#0A0A0B" : "#F3F4F6"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.addJavascriptInterface(new Bridge(), "FTNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                return serve(u.getPath());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith(BASE)) return false;
                openOutside(url);
                return true;
            }
        });
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl(BASE + "index.html");

        ui.postDelayed(new Runnable() { public void run() { sync(false); } }, 2500);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // came back to the app after a while: look for a newer list again
        long last = prefs.getLong("lastCheck", 0);
        if (System.currentTimeMillis() - last > 30 * 60 * 1000L) sync(false);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.FT && FT.back ? FT.back() : false", new ValueCallback<String>() {
            public void onReceiveValue(String v) {
                if (!"true".equals(v)) MainActivity.super.onBackPressed();
            }
        });
    }

    /* ---------------- branch: Fakhri Tools or Bait Al Maqdis ---------------- */

    volatile String brand = "";
    boolean isBam() { return "bam".equals(brand); }

    /** Bait Al Maqdis is dark with light icons; Fakhri Tools is white with dark icons. */
    void paintBars() {
        Window w = getWindow();
        int bars = 0;
        if (isBam()) {
            w.setStatusBarColor(Color.parseColor("#0A0A0B"));
            w.setNavigationBarColor(Color.parseColor("#0A0A0B"));
        } else {
            w.setStatusBarColor(Color.WHITE);
            bars = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            // phones older than Android 8 can't draw dark nav icons, so they keep a dark nav bar
            if (Build.VERSION.SDK_INT >= 26) { w.setNavigationBarColor(Color.WHITE); bars |= 0x00000010; /* SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR */ }
            else w.setNavigationBarColor(Color.parseColor("#0B1620"));
        }
        w.getDecorView().setSystemUiVisibility(bars);
        try {
            Bitmap icon = BitmapFactory.decodeResource(getResources(), isBam() ? R.mipmap.ic_bam : R.mipmap.ic_launcher);
            setTaskDescription(new ActivityManager.TaskDescription(getString(isBam() ? R.string.name_bam : R.string.name_fakhri), icon, isBam() ? Color.parseColor("#0A0A0B") : Color.WHITE));
        } catch (Exception e) { /* the recent-apps card keeps the default look */ }
    }

    /** Switch the home-screen icon and name to the branch: one launcher alias on, the other off. */
    void applyBrand(String b) {
        brand = "bam".equals(b) ? "bam" : "fakhri";
        prefs.edit().putString("brand", brand).apply();
        paintBars();
        PackageManager pm = getPackageManager();
        ComponentName fk = new ComponentName(this, getPackageName() + ".BrandFakhri");
        ComponentName bm = new ComponentName(this, getPackageName() + ".BrandBam");
        try {
            // turn the new one on before the old one off, so there is never a moment with no icon
            ComponentName on = isBam() ? bm : fk, off = isBam() ? fk : bm;
            if (pm.getComponentEnabledSetting(on) != PackageManager.COMPONENT_ENABLED_STATE_ENABLED)
                pm.setComponentEnabledSetting(on, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
            if (pm.getComponentEnabledSetting(off) != PackageManager.COMPONENT_ENABLED_STATE_DISABLED)
                pm.setComponentEnabledSetting(off, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        } catch (Exception e) { /* the icon stays as it was; the app itself still switches */ }
    }

    /* ---------------- local server ---------------- */

    WebResourceResponse serve(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        String rel = path.substring(1);
        if (rel.contains("..")) return notFound();
        String mime = mime(rel);
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Cache-Control", rel.startsWith("p/") || rel.startsWith("fonts/") ? "max-age=31536000" : "no-cache");
        try {
            File f = new File(root, rel);
            if (f.isFile()) return resp(mime, h, new FileInputStream(f));
            try {
                return resp(mime, h, getAssets().open("www/" + rel));
            } catch (IOException missing) { /* not packed in the app */ }
            if (rel.startsWith("p/")) {
                byte[] b = download(LIVE + "assets/products/" + rel.substring(2), 8000);
                if (b != null && b.length > 200) {
                    save(f, b);
                    return resp(mime, h, new ByteArrayInputStream(b));
                }
            }
        } catch (Exception e) { /* fall through */ }
        return notFound();
    }

    WebResourceResponse resp(String mime, Map<String, String> h, InputStream in) {
        WebResourceResponse r = new WebResourceResponse(mime, mime.startsWith("text") || mime.contains("javascript") ? "utf-8" : null, in);
        r.setStatusCodeAndReasonPhrase(200, "OK");
        r.setResponseHeaders(h);
        return r;
    }

    WebResourceResponse notFound() {
        WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        r.setStatusCodeAndReasonPhrase(404, "Not found");
        return r;
    }

    static String mime(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".js")) return "application/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".webp")) return "image/webp";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".woff2")) return "font/woff2";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    /* ---------------- keeping the list fresh ---------------- */

    boolean online() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo n = cm.getActiveNetworkInfo();
            return n != null && n.isConnected();
        } catch (Exception e) { return true; }
    }

    void sync(final boolean byHand) {
        if (syncing) return;
        if (!online()) { if (byHand) js("FT.onSync && FT.onSync('offline')"); return; }
        syncing = true;
        new Thread(new Runnable() {
            public void run() {
                String result = "same";
                try {
                    byte[] b = download(LIVE + "js/data.js?app=" + System.currentTimeMillis(), 15000);
                    String fresh = b == null ? null : new String(b, "UTF-8");
                    if (fresh == null || !fresh.contains("window.FT_CATS") || fresh.length() < 5000 || !fresh.trim().endsWith("];")) {
                        result = "failed";
                    } else {
                        prefs.edit().putLong("lastCheck", System.currentTimeMillis()).apply();
                        String now = current();
                        if (!fresh.equals(now)) {
                            // fetch every photo the new list needs before switching over, so it works offline straight away
                            Set<String> need = new LinkedHashSet<>();
                            Matcher m = IMG.matcher(fresh);
                            while (m.find()) need.add(m.group(1));
                            loadBundledList();
                            int failed = 0;
                            for (String p : need) {
                                if (bundled.contains(p) || new File(root, "p/" + p).isFile()) continue;
                                byte[] img = download(LIVE + "assets/products/" + p, 15000);
                                if (img != null && img.length > 200) save(new File(root, "p/" + p), img);
                                else failed++;
                            }
                            save(new File(root, "data.js"), fresh.getBytes("UTF-8"));
                            prefs.edit().putLong("lastChange", System.currentTimeMillis()).apply();
                            result = failed > 0 ? "updated-partial" : "updated";
                        }
                    }
                } catch (Exception e) {
                    result = "failed";
                }
                syncing = false;
                final String r = result;
                js("window.FT && FT.onSync && FT.onSync('" + r + "')");
            }
        }).start();
    }

    String current() throws IOException {
        File f = new File(root, "data.js");
        InputStream in = f.isFile() ? new FileInputStream(f) : getAssets().open("www/data.js");
        return new String(readAll(in), "UTF-8");
    }

    void loadBundledList() {
        if (!bundled.isEmpty()) return;
        try {
            String txt = new String(readAll(getAssets().open("www/photos.txt")), "UTF-8");
            for (String line : txt.split("\n")) if (line.trim().length() > 0) bundled.add(line.trim());
        } catch (IOException e) { /* every photo will be checked on disk instead */ }
    }

    static byte[] download(String url, int timeout) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(timeout);
            c.setReadTimeout(timeout);
            c.setRequestProperty("Cache-Control", "no-cache");
            if (c.getResponseCode() != 200) return null;
            return readAll(c.getInputStream());
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    static byte[] readAll(InputStream in) throws IOException {
        try {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            return o.toByteArray();
        } finally {
            in.close();
        }
    }

    static void save(File f, byte[] b) throws IOException {
        f.getParentFile().mkdirs();
        File tmp = new File(f.getPath() + ".part");
        FileOutputStream o = new FileOutputStream(tmp);
        try { o.write(b); } finally { o.close(); }
        if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
    }

    void js(final String code) {
        ui.post(new Runnable() { public void run() { web.evaluateJavascript(code, null); } });
    }

    void openOutside(String url) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, url.contains("wa.me") ? "WhatsApp is not installed on this phone" : "No app on this phone can open that", Toast.LENGTH_LONG).show();
        }
    }

    /* ---------------- what the pages can ask the phone to do ---------------- */

    class Bridge {
        @JavascriptInterface
        public void share(final String title, final String text) {
            ui.post(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_SUBJECT, title);
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(i, title));
                }
            });
        }

        /** Share a product photo with its details as the caption. */
        @JavascriptInterface
        public void sharePhoto(final String img, final String title, final String text) {
            ui.post(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    if (img != null && img.startsWith("p/") && !img.contains("..")) {
                        Uri u = PhotoProvider.uriFor(img);
                        i.setType(img.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
                        i.putExtra(Intent.EXTRA_STREAM, u);
                        i.setClipData(ClipData.newRawUri(title, u));
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    } else i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_SUBJECT, title);
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    Intent c = Intent.createChooser(i, title);
                    c.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(c);
                }
            });
        }

        @JavascriptInterface
        public void open(final String url) {
            ui.post(new Runnable() { public void run() { openOutside(url); } });
        }

        @JavascriptInterface
        public void syncNow() { sync(true); }

        @JavascriptInterface
        public boolean isSyncing() { return syncing; }

        @JavascriptInterface
        public long lastCheck() { return prefs.getLong("lastCheck", 0); }

        @JavascriptInterface
        public long lastChange() { return prefs.getLong("lastChange", 0); }

        @JavascriptInterface
        public boolean online() { return MainActivity.this.online(); }

        @JavascriptInterface
        public String version() {
            try {
                PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
                return p.versionName;
            } catch (Exception e) { return ""; }
        }

        /** The downloaded list did not load in the app: forget it and go back to the packed one. */
        @JavascriptInterface
        public void resetData() {
            new File(root, "data.js").delete();
            prefs.edit().remove("lastChange").apply();
            js("location.reload()");
        }

        /** Share a file the page made (the order form PDF). With a WhatsApp number it opens that chat in WhatsApp when it can. */
        @JavascriptInterface
        public void shareFile(final String b64, final String name, final String mime, final String caption, final String waDigits) {
            final File dir = new File(getCacheDir(), "share");
            final String safe = String.valueOf(name).replaceAll("[^A-Za-z0-9._-]", "_");
            try {
                dir.mkdirs();
                File[] old = dir.listFiles();
                if (old != null) for (File x : old) if (System.currentTimeMillis() - x.lastModified() > 86400000L) x.delete();
                FileOutputStream o = new FileOutputStream(new File(dir, safe));
                o.write(Base64.decode(b64, Base64.DEFAULT));
                o.close();
            } catch (Exception e) {
                ui.post(new Runnable() { public void run() { Toast.makeText(MainActivity.this, "Could not make the file", Toast.LENGTH_LONG).show(); } });
                return;
            }
            ui.post(new Runnable() {
                public void run() {
                    Uri u = PhotoProvider.uriFor("share/" + safe);
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType(mime);
                    i.putExtra(Intent.EXTRA_STREAM, u);
                    i.setClipData(ClipData.newRawUri(safe, u));
                    if (caption != null && caption.length() > 0) i.putExtra(Intent.EXTRA_TEXT, caption);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    if (waDigits != null && waDigits.length() > 6) {
                        for (String pkg : new String[] { "com.whatsapp", "com.whatsapp.w4b" }) {
                            try {
                                Intent w = new Intent(i);
                                w.setPackage(pkg);
                                w.putExtra("jid", waDigits + "@s.whatsapp.net");
                                startActivity(w);
                                return;
                            } catch (Exception e) { /* not installed: try the next one */ }
                        }
                    }
                    Intent c = Intent.createChooser(i, safe);
                    c.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(c);
                }
            });
        }

        /** The branch the salesman picked ("bam" or "fakhri"): icon, name and colours follow it. */
        @JavascriptInterface
        public void setBrand(final String b) {
            ui.post(new Runnable() { public void run() { applyBrand(b); } });
        }

        @JavascriptInterface
        public String brand() { return brand; }

        @JavascriptInterface
        public void vibrate() {
            ui.post(new Runnable() { public void run() { web.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY); } });
        }
    }
}
