package com.pasiya.sensi;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeCrosshair")
public class NativeCrosshairPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        boolean hasPermission = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            hasPermission = Settings.canDrawOverlays(context);
        }
        JSObject ret = new JSObject();
        ret.put("granted", hasPermission);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        JSObject ret = new JSObject();
        ret.put("requested", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startOverlay(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            call.reject("PERMISSION_DENIED", "System Alert Window overlay permission not granted");
            return;
        }

        Intent serviceIntent = new Intent(context, CrosshairService.class);
        serviceIntent.setAction(CrosshairService.ACTION_START);
        serviceIntent.putExtra(CrosshairService.EXTRA_SHAPE, call.getString("shape", "precision-dot"));
        serviceIntent.putExtra(CrosshairService.EXTRA_COLOR, call.getString("color", "#EF4444"));
        serviceIntent.putExtra(CrosshairService.EXTRA_GAP, (float) (call.getDouble("gapPx") != null ? call.getDouble("gapPx") : 8.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_SCALE, (float) (call.getDouble("scale") != null ? call.getDouble("scale") : 1.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_OPACITY, (float) (call.getDouble("opacity") != null ? call.getDouble("opacity") : 1.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_SHOW_DOT, Boolean.TRUE.equals(call.getBoolean("showCenterDot", true)));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, CrosshairService.class);
        serviceIntent.setAction(CrosshairService.ACTION_STOP);
        context.startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void updateOverlay(PluginCall call) {
        Context context = getContext();
        if (!CrosshairService.isRunning) {
            startOverlay(call);
            return;
        }

        Intent serviceIntent = new Intent(context, CrosshairService.class);
        serviceIntent.setAction(CrosshairService.ACTION_UPDATE);
        serviceIntent.putExtra(CrosshairService.EXTRA_SHAPE, call.getString("shape", "precision-dot"));
        serviceIntent.putExtra(CrosshairService.EXTRA_COLOR, call.getString("color", "#EF4444"));
        serviceIntent.putExtra(CrosshairService.EXTRA_GAP, (float) (call.getDouble("gapPx") != null ? call.getDouble("gapPx") : 8.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_SCALE, (float) (call.getDouble("scale") != null ? call.getDouble("scale") : 1.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_OPACITY, (float) (call.getDouble("opacity") != null ? call.getDouble("opacity") : 1.0));
        serviceIntent.putExtra(CrosshairService.EXTRA_SHOW_DOT, Boolean.TRUE.equals(call.getBoolean("showCenterDot", true)));

        context.startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", CrosshairService.isRunning);
        call.resolve(ret);
    }
}
