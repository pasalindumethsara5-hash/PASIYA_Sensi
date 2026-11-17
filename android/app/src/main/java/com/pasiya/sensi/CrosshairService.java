package com.pasiya.sensi;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;

public class CrosshairService extends Service {

    public static final String ACTION_START = "ACTION_START";
    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String ACTION_UPDATE = "ACTION_UPDATE";

    public static final String EXTRA_SHAPE = "extra_shape";
    public static final String EXTRA_COLOR = "extra_color";
    public static final String EXTRA_GAP = "extra_gap";
    public static final String EXTRA_SCALE = "extra_scale";
    public static final String EXTRA_OPACITY = "extra_opacity";
    public static final String EXTRA_SHOW_DOT = "extra_show_dot";

    public static boolean isRunning = false;

    private WindowManager windowManager;
    private CrosshairView crosshairView;
    private WindowManager.LayoutParams layoutParams;

    private static final String CHANNEL_ID = "pasiya_sensi_crosshair_channel";
    private static final int NOTIFICATION_ID = 9021;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            removeOverlay();
            stopForeground(true);
            stopSelf();
            isRunning = false;
            return START_NOT_STICKY;
        }

        String shape = intent.getStringExtra(EXTRA_SHAPE);
        String color = intent.getStringExtra(EXTRA_COLOR);
        float gap = intent.getFloatExtra(EXTRA_GAP, 8f);
        float scale = intent.getFloatExtra(EXTRA_SCALE, 1.0f);
        float opacity = intent.getFloatExtra(EXTRA_OPACITY, 1.0f);
        boolean showDot = intent.getBooleanExtra(EXTRA_SHOW_DOT, true);

        startForeground(NOTIFICATION_ID, createNotification());

        if (crosshairView == null) {
            addOverlay(shape, color, gap, scale, opacity, showDot);
        } else {
            crosshairView.updateConfig(shape, color, gap, scale, opacity, showDot);
        }

        isRunning = true;
        return START_STICKY;
    }

    private void addOverlay(String shape, String color, float gap, float scale, float opacity, boolean showDot) {
        crosshairView = new CrosshairView(this);
        crosshairView.updateConfig(shape, color, gap, scale, opacity, showDot);

        DisplayMetrics dm = getResources().getDisplayMetrics();
        int viewSize = (int) (140 * (dm.densityDpi / 160f));

        int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        layoutParams = new WindowManager.LayoutParams(
                viewSize,
                viewSize,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT
        );
        layoutParams.gravity = Gravity.CENTER;

        try {
            windowManager.addView(crosshairView, layoutParams);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void removeOverlay() {
        if (windowManager != null && crosshairView != null) {
            try {
                windowManager.removeView(crosshairView);
            } catch (Exception e) {
                e.printStackTrace();
            }
            crosshairView = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "PASIYA SENSI Gaming Crosshair",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows persistent Free Fire crosshair overlay status");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent stopIntent = new Intent(this, CrosshairService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("PASIYA SENSI — Aim Overlay Active")
                .setContentText("Crosshair is running over Free Fire. Tap to open controls.")
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentIntent(pendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close Overlay", stopPendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    @Override
    public void onDestroy() {
        removeOverlay();
        isRunning = false;
        super.onDestroy();
    }
}
