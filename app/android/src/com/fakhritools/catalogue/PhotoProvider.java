package com.fakhritools.catalogue;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/** Hands a product photo, an order form PDF the app made, or a packed Bait Al Maqdis catalogue PDF
 *  to WhatsApp, a PDF viewer or any app. Read-only. */
public class PhotoProvider extends ContentProvider {
    static final String AUTH = "com.fakhritools.catalogue.photos";

    static Uri uriFor(String rel) { return Uri.parse("content://" + AUTH + "/" + rel); }

    @Override public boolean onCreate() { return true; }

    String rel(Uri u) throws FileNotFoundException {
        String p = u.getPath();
        if (p == null || p.contains("..") || !(p.startsWith("/p/") || p.startsWith("/share/") || p.startsWith("/bam/"))) throw new FileNotFoundException(String.valueOf(p));
        return p.substring(1);
    }

    // Always a whole file: many PDF viewers refuse a piece of one ("Not a whole file"), which is what an
    // exact length or a file packed inside the APK would hand them.
    static AssetFileDescriptor whole(File f) throws FileNotFoundException {
        return new AssetFileDescriptor(ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY), 0, AssetFileDescriptor.UNKNOWN_LENGTH);
    }

    @Override
    public AssetFileDescriptor openAssetFile(Uri u, String mode) throws FileNotFoundException {
        String rel = rel(u);
        if (rel.startsWith("share/")) {
            File s = new File(getContext().getCacheDir(), rel);
            if (!s.isFile()) throw new FileNotFoundException(rel);
            return whole(s);
        }
        File f = new File(new File(getContext().getFilesDir(), "www"), rel);
        if (f.isFile()) return whole(f);
        return whole(copyOfAsset(rel));
    }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        return openAssetFile(u, mode).getParcelFileDescriptor();
    }

    /** a copy of a file packed in the app, made again after each app update */
    synchronized File copyOfAsset(String rel) throws FileNotFoundException {
        File c = new File(new File(getContext().getCacheDir(), "packed"), rel);
        long updated = 0;
        try { updated = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0).lastUpdateTime; } catch (Exception e) { /* keep any copy */ }
        if (c.isFile() && c.lastModified() >= updated) return c;
        File part = new File(c.getPath() + ".part");
        InputStream in = null; OutputStream out = null;
        try {
            c.getParentFile().mkdirs();
            in = getContext().getAssets().open("www/" + rel);
            out = new FileOutputStream(part);
            byte[] buf = new byte[65536];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            out.close(); out = null;
            if (!part.renameTo(c)) throw new IOException("rename");
            return c;
        } catch (IOException e) {
            part.delete();
            throw new FileNotFoundException(rel);
        } finally {
            try { if (in != null) in.close(); } catch (IOException e) { /* closed */ }
            try { if (out != null) out.close(); } catch (IOException e) { /* closed */ }
        }
    }

    @Override
    public String getType(Uri u) {
        String p = String.valueOf(u.getPath()).toLowerCase();
        return p.endsWith(".pdf") ? "application/pdf" : p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg";
    }

    @Override
    public Cursor query(Uri u, String[] cols, String sel, String[] args, String sort) {
        String name = String.valueOf(u.getLastPathSegment());
        MatrixCursor c = new MatrixCursor(new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE });
        long size = -1;
        try { AssetFileDescriptor fd = openAssetFile(u, "r"); size = fd.getLength(); fd.close(); } catch (Exception e) { /* unknown */ }
        c.addRow(new Object[] { name, size < 0 ? null : size });
        return c;
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
