package com.pasiya.sensi;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.View;

public class CrosshairView extends View {

    private String shape = "precision-dot";
    private int color = Color.parseColor("#EF4444");
    private float gapPx = 8f;
    private float scale = 1.0f;
    private float opacity = 1.0f;
    private boolean showCenterDot = true;

    private final Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();

    public CrosshairView(Context context) {
        super(context);
        init();
    }

    public CrosshairView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        strokePaint.setStyle(Paint.Style.STROKE);
        strokePaint.setStrokeCap(Paint.Cap.ROUND);
        strokePaint.setStrokeJoin(Paint.Join.ROUND);
        fillPaint.setStyle(Paint.Style.FILL);
        updatePaints();
    }

    public void updateConfig(String shape, String colorHex, float gap, float scale, float opacity, boolean showDot) {
        if (shape != null && !shape.isEmpty()) this.shape = shape;
        if (colorHex != null && !colorHex.isEmpty()) {
            try {
                this.color = Color.parseColor(colorHex);
            } catch (Exception ignored) {
                this.color = Color.parseColor("#EF4444");
            }
        }
        this.gapPx = gap > 0 ? gap : 8f;
        this.scale = scale > 0 ? scale : 1.0f;
        this.opacity = Math.max(0.2f, Math.min(1.0f, opacity));
        this.showCenterDot = showDot;

        updatePaints();
        invalidate();
    }

    private void updatePaints() {
        int alpha = (int) (opacity * 255);
        strokePaint.setColor(color);
        strokePaint.setAlpha(alpha);
        strokePaint.setStrokeWidth(dpToPx(2.2f) * scale);

        fillPaint.setColor(color);
        fillPaint.setAlpha(alpha);
    }

    private float dpToPx(float dp) {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        return dp * (dm.densityDpi / 160f);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float g = dpToPx(gapPx) * 0.7f * scale;
        float arm = dpToPx(12f) * scale;
        float bracketLen = dpToPx(7f) * scale;
        float dotRadius = dpToPx(2.5f) * scale;

        // Draw Center Dot if enabled
        if (showCenterDot) {
            canvas.drawCircle(cx, cy, dotRadius, fillPaint);
        }

        switch (shape) {
            case "precision-dot":
                // 4 ticks with gap
                canvas.drawLine(cx - (g + arm), cy, cx - g, cy, strokePaint);
                canvas.drawLine(cx + g, cy, cx + (g + arm), cy, strokePaint);
                canvas.drawLine(cx, cy + g, cx, cy + (g + arm), strokePaint);
                canvas.drawLine(cx, cy - (g + dpToPx(6f) * scale), cx, cy - g, strokePaint);
                break;

            case "chevron-head":
                // Inverted chevron above center
                path.reset();
                float chevronWidth = g + dpToPx(9f) * scale;
                float chevronHeight = g + dpToPx(5f) * scale;
                float tipY = cy - Math.max(dpToPx(3f), g * 0.45f);
                path.moveTo(cx - chevronWidth, cy + chevronHeight);
                path.lineTo(cx, tipY);
                path.lineTo(cx + chevronWidth, cy + chevronHeight);
                canvas.drawPath(path, strokePaint);

                // Horizontal and bottom ticks
                canvas.drawLine(cx - (g + dpToPx(16f) * scale), cy, cx - (g + dpToPx(7f) * scale), cy, strokePaint);
                canvas.drawLine(cx + g + dpToPx(7f) * scale, cy, cx + g + dpToPx(16f) * scale, cy, strokePaint);
                canvas.drawLine(cx, cy + g + dpToPx(8f) * scale, cx, cy + g + dpToPx(16f) * scale, strokePaint);
                break;

            case "smg-circle":
                // Circle with outer ticks
                float circleRadius = Math.max(dpToPx(10f), g + dpToPx(8f) * scale);
                canvas.drawCircle(cx, cy, circleRadius, strokePaint);
                canvas.drawLine(cx - (g + dpToPx(16f) * scale), cy, cx - (g + dpToPx(9f) * scale), cy, strokePaint);
                canvas.drawLine(cx + g + dpToPx(9f) * scale, cy, cx + g + dpToPx(16f) * scale, cy, strokePaint);
                canvas.drawLine(cx, cy - (g + dpToPx(16f) * scale), cx, cy - (g + dpToPx(9f) * scale), strokePaint);
                canvas.drawLine(cx, cy + g + dpToPx(9f) * scale, cx, cy + g + dpToPx(16f) * scale, strokePaint);
                break;

            case "smg-rush-brackets":
                // 4 CQB corner brackets
                float bOffset = g + dpToPx(8f) * scale;
                // Top-Left
                path.reset();
                path.moveTo(cx - bOffset, cy - bOffset + bracketLen);
                path.lineTo(cx - bOffset, cy - bOffset);
                path.lineTo(cx - bOffset + bracketLen, cy - bOffset);
                canvas.drawPath(path, strokePaint);

                // Top-Right
                path.reset();
                path.moveTo(cx + bOffset - bracketLen, cy - bOffset);
                path.lineTo(cx + bOffset, cy - bOffset);
                path.lineTo(cx + bOffset, cy - bOffset + bracketLen);
                canvas.drawPath(path, strokePaint);

                // Bottom-Left
                path.reset();
                path.moveTo(cx - bOffset, cy + bOffset - bracketLen);
                path.lineTo(cx - bOffset, cy + bOffset);
                path.lineTo(cx - bOffset + bracketLen, cy + bOffset);
                canvas.drawPath(path, strokePaint);

                // Bottom-Right
                path.reset();
                path.moveTo(cx + bOffset - bracketLen, cy + bOffset);
                path.lineTo(cx + bOffset, cy + bOffset);
                path.lineTo(cx + bOffset, cy + bOffset - bracketLen);
                canvas.drawPath(path, strokePaint);

                // Side reference ticks
                canvas.drawLine(cx - (g + dpToPx(14f) * scale), cy, cx - (g + dpToPx(10f) * scale), cy, strokePaint);
                canvas.drawLine(cx + g + dpToPx(10f) * scale, cy, cx + g + dpToPx(14f) * scale, cy, strokePaint);
                break;

            case "tactical-cross":
                // Full tactical cross
                canvas.drawLine(cx - (g + arm * 1.3f), cy, cx - g, cy, strokePaint);
                canvas.drawLine(cx + g, cy, cx + (g + arm * 1.3f), cy, strokePaint);
                canvas.drawLine(cx, cy - (g + arm * 1.3f), cx, cy - g, strokePaint);
                canvas.drawLine(cx, cy + g, cx, cy + (g + arm * 1.3f), strokePaint);
                break;

            case "red-dot-holo":
                // Clean glowing holo ring + center dot
                float holoRadius = Math.max(dpToPx(7f), g + dpToPx(4f) * scale);
                canvas.drawCircle(cx, cy, holoRadius, strokePaint);
                canvas.drawCircle(cx, cy, dotRadius * 1.3f, fillPaint);
                break;

            case "sniper-mil-range":
                // Long cross with mil ticks
                float longArm = arm * 2f;
                canvas.drawLine(cx - (g + longArm), cy, cx - g, cy, strokePaint);
                canvas.drawLine(cx + g, cy, cx + (g + longArm), cy, strokePaint);
                canvas.drawLine(cx, cy - (g + longArm), cx, cy - g, strokePaint);
                canvas.drawLine(cx, cy + g, cx, cy + (g + longArm), strokePaint);

                // Mil dots along the axes
                float milStep = dpToPx(6f) * scale;
                for (int i = 1; i <= 3; i++) {
                    canvas.drawCircle(cx - g - (i * milStep), cy, dpToPx(1.2f), fillPaint);
                    canvas.drawCircle(cx + g + (i * milStep), cy, dpToPx(1.2f), fillPaint);
                    canvas.drawCircle(cx, cy + g + (i * milStep), dpToPx(1.2f), fillPaint);
                    canvas.drawCircle(cx, cy - g - (i * milStep), dpToPx(1.2f), fillPaint);
                }
                break;

            case "booyah-diamond":
                // Rotated diamond
                float dSize = Math.max(dpToPx(9f), g + dpToPx(6f) * scale);
                path.reset();
                path.moveTo(cx, cy - dSize);
                path.lineTo(cx + dSize, cy);
                path.lineTo(cx, cy + dSize);
                path.lineTo(cx - dSize, cy);
                path.close();
                canvas.drawPath(path, strokePaint);
                break;

            default:
                canvas.drawLine(cx - (g + arm), cy, cx - g, cy, strokePaint);
                canvas.drawLine(cx + g, cy, cx + (g + arm), cy, strokePaint);
                canvas.drawLine(cx, cy - (g + arm), cx, cy - g, strokePaint);
                canvas.drawLine(cx, cy + g, cx, cy + (g + arm), strokePaint);
                break;
        }
    }
}
