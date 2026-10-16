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
import java.io.IOException;

/** Hands a product photo to WhatsApp (or any app) when the salesman shares a product. Read-only. */
public class PhotoProvider extends ContentProvider {
    static final String AUTH = "com.fakhritools.catalogue.photos";

    static Uri uriFor(String rel) { return Uri.parse("content://" + AUTH + "/" + rel); }

    @Override public boolean onCreate() { return true; }

    String rel(Uri u) throws FileNotFoundException {
        String p = u.getPath();
        if (p == null || p.contains("..") || !p.startsWith("/p/")) throw new FileNotFoundException(String.valueOf(p));
        return p.substring(1);
    }

    @Override
    public AssetFileDescriptor openAssetFile(Uri u, String mode) throws FileNotFoundException {
        String rel = rel(u);
        File f = new File(new File(getContext().getFilesDir(), "www"), rel);
        if (f.isFile()) return new AssetFileDescriptor(ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY), 0, AssetFileDescriptor.UNKNOWN_LENGTH);
        try {
            return getContext().getAssets().openFd("www/" + rel);
        } catch (IOException e) {
            throw new FileNotFoundException(rel);
        }
    }

    @Override
    public String getType(Uri u) {
        String p = String.valueOf(u.getPath()).toLowerCase();
        return p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg";
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
