package com.horizonwallpaper;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class HorizonWallpaperModule extends ReactContextBaseJavaModule {
  private static final String MODULE_NAME = "HorizonWallpaper";
  private final ReactApplicationContext reactContext;

  public HorizonWallpaperModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @ReactMethod
  public void setWallpaper(ReadableMap options, Promise promise) {
    String imageUrl = options.getString("uri");
    String screen = options.hasKey("screen") ? options.getString("screen") : "both";

    if (imageUrl == null) {
      promise.reject("INVALID_URL", "Image URL is required");
      return;
    }

    new SetWallpaperTask(imageUrl, screen, promise).execute();
  }

  @ReactMethod
  public void setWallpaperFromUri(String uri, String screen, Promise promise) {
    if (uri == null) {
      promise.reject("INVALID_URI", "URI is required");
      return;
    }

    new SetWallpaperFromUriTask(uri, screen, promise).execute();
  }

  private class SetWallpaperTask extends AsyncTask<Void, Void, Boolean> {
    private final String imageUrl;
    private final String screen;
    private final Promise promise;
    private String errorMessage;

    SetWallpaperTask(String imageUrl, String screen, Promise promise) {
      this.imageUrl = imageUrl;
      this.screen = screen;
      this.promise = promise;
    }

    @Override
    protected Boolean doInBackground(Void... voids) {
      try {
        // Download bitmap from URL
        URL url = new URL(imageUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setDoInput(true);
        connection.connect();
        InputStream input = connection.getInputStream();
        Bitmap bitmap = BitmapFactory.decodeStream(input);

        if (bitmap == null) {
          errorMessage = "Failed to decode image";
          return false;
        }

        // Set wallpaper
        WallpaperManager wallpaperManager = WallpaperManager.getInstance(reactContext);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
          // Android 7.0+ supports separate home and lock screen wallpapers
          switch (screen) {
            case "home":
              wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM);
              break;
            case "lock":
              wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK);
              break;
            case "both":
            default:
              wallpaperManager.setBitmap(bitmap);
              break;
          }
        } else {
          // Pre Android 7.0
          wallpaperManager.setBitmap(bitmap);
        }

        return true;
      } catch (IOException e) {
        errorMessage = "Failed to set wallpaper: " + e.getMessage();
        Log.e(MODULE_NAME, errorMessage, e);
        return false;
      }
    }

    @Override
    protected void onPostExecute(Boolean success) {
      if (success) {
        promise.resolve("success");
      } else {
        promise.reject("SET_WALLPAPER_FAILED", errorMessage != null ? errorMessage : "Unknown error");
      }
    }
  }

  private class SetWallpaperFromUriTask extends AsyncTask<Void, Void, Boolean> {
    private final String uri;
    private final String screen;
    private final Promise promise;
    private String errorMessage;

    SetWallpaperFromUriTask(String uri, String screen, Promise promise) {
      this.uri = uri;
      this.screen = screen;
      this.promise = promise;
    }

    @Override
    protected Boolean doInBackground(Void... voids) {
      try {
        // Load bitmap from local URI
        Bitmap bitmap = BitmapFactory.decodeFile(uri.replace("file://", ""));

        if (bitmap == null) {
          errorMessage = "Failed to decode image from URI";
          return false;
        }

        // Set wallpaper
        WallpaperManager wallpaperManager = WallpaperManager.getInstance(reactContext);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
          switch (screen) {
            case "home":
              wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM);
              break;
            case "lock":
              wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK);
              break;
            case "both":
            default:
              wallpaperManager.setBitmap(bitmap);
              break;
          }
        } else {
          wallpaperManager.setBitmap(bitmap);
        }

        return true;
      } catch (IOException e) {
        errorMessage = "Failed to set wallpaper: " + e.getMessage();
        Log.e(MODULE_NAME, errorMessage, e);
        return false;
      }
    }

    @Override
    protected void onPostExecute(Boolean success) {
      if (success) {
        promise.resolve("success");
      } else {
        promise.reject("SET_WALLPAPER_FAILED", errorMessage != null ? errorMessage : "Unknown error");
      }
    }
  }
}