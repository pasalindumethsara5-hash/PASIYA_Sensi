import { jsPDF } from 'jspdf';
import {
  type PlatformTarget,
  type SensitivityConfig,
  computeDragPhysicsRatio,
} from './optimizer';

export type PdfThemeMode = 'digital' | 'print';

export interface PdfMetricRow {
  label: string;
  valueText: string;
  fillRatio: number;
}

export function sanitizeFileSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 42) || 'config'
  );
}

export function buildPdfGuideRows(
  config: SensitivityConfig,
  platform: PlatformTarget
): {
  scopeRows: PdfMetricRow[];
  physicsRows: PdfMetricRow[];
  xyRatio: number;
} {
  const xAxis = config.xAxisScale ?? 1.45;
  const yDrag = config.yDragScale ?? 2.85;
  const deadzone = config.touchDeadzoneMm ?? 0.15;
  const recoil = config.recoilDampeningPct ?? 75;
  const fireY = config.fireButtonYOffset ?? 18;
  const dragLift = config.dragPredictionPct ?? 5;
  const xyRatio = computeDragPhysicsRatio(xAxis, yDrag);

  const scopeRows: PdfMetricRow[] = [
    { label: 'General', valueText: `${config.general}`, fillRatio: config.general / config.cap },
    { label: 'Red Dot', valueText: `${config.redDot}`, fillRatio: config.redDot / config.cap },
    { label: '2x Scope', valueText: `${config.x2}`, fillRatio: config.x2 / config.cap },
    { label: '4x Scope', valueText: `${config.x4}`, fillRatio: config.x4 / config.cap },
    { label: 'AWM / Sniper Scope', valueText: `${config.awm}`, fillRatio: config.awm / config.cap },
    { label: 'Free Look', valueText: `${config.freeLook}`, fillRatio: config.freeLook / config.cap },
  ];

  const physicsRows: PdfMetricRow[] = [
    {
      label: 'X-Axis Horizontal Scale',
      valueText: `${xAxis.toFixed(2)}x`,
      fillRatio: (xAxis - 0.8) / 1.4,
    },
    {
      label: 'Y-Axis Headshot Drag',
      valueText: `${yDrag.toFixed(2)}x`,
      fillRatio: (yDrag - 1.5) / 2.7,
    },
    {
      label: 'Fire Button Size',
      valueText: `${config.fireButtonSize}%`,
      fillRatio: config.fireButtonSize / 75,
    },
    {
      label: 'Fire Trigger Y-Offset',
      valueText: `${fireY}%`,
      fillRatio: fireY / 35,
    },
    {
      label: 'Micro-Recoil Dampening',
      valueText: `${recoil}%`,
      fillRatio: recoil / 100,
    },
    platform === 'android'
      ? {
          label: 'Android DPI (Smallest Width)',
          valueText: `${config.dpi} dp`,
          fillRatio: config.dpi / 640,
        }
      : {
          label: 'iOS Gliding Cursor',
          valueText: `${config.iosTouchSpeed}`,
          fillRatio: config.iosTouchSpeed / 120,
        },
    {
      label: 'Drag Lift / Deadzone',
      valueText: `+${dragLift}% · ${deadzone.toFixed(2)}mm`,
      fillRatio: Math.min(1, dragLift / 10),
    },
  ];

  return { scopeRows, physicsRows, xyRatio };
}

type RgbTuple = [number, number, number];

interface PdfPalette {
  bg: RgbTuple;
  surface: RgbTuple;
  rowAlt: RgbTuple;
  border: RgbTuple;
  track: RgbTuple;
  textPrimary: RgbTuple;
  textMuted: RgbTuple;
  crimson: RgbTuple;
  badgeFill: RgbTuple;
  green: RgbTuple;
}

export function createBrandedPdfDoc(
  config: SensitivityConfig,
  platform: PlatformTarget,
  targetFps: number,
  theme: PdfThemeMode = 'digital'
): { doc: jsPDF; fileName: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isPrint = theme === 'print';
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const palette: PdfPalette = isPrint
    ? {
        bg: [255, 255, 255],
        surface: [247, 247, 250],
        rowAlt: [240, 240, 245],
        border: [212, 212, 222],
        track: [222, 222, 232],
        textPrimary: [15, 15, 20],
        textMuted: [92, 92, 108],
        crimson: [220, 38, 38],
        badgeFill: [12, 12, 16],
        green: [22, 163, 74],
      }
    : {
        bg: [5, 5, 7],
        surface: [11, 11, 15],
        rowAlt: [8, 8, 12],
        border: [35, 35, 43],
        track: [27, 27, 34],
        textPrimary: [255, 255, 255],
        textMuted: [164, 164, 178],
        crimson: [239, 68, 68],
        badgeFill: [7, 7, 10],
        green: [34, 197, 94],
      };

  const setFill = (rgb: RgbTuple) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: RgbTuple) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: RgbTuple) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  // Page Background & Top Crimson Header Strip
  setFill(palette.bg);
  doc.rect(0, 0, pageW, pageH, 'F');
  setFill(palette.crimson);
  doc.rect(0, 0, pageW, 3, 'F');

  // Header Crest Card
  setFill(palette.surface);
  setDraw(palette.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, 11, pageW - 28, 30, 3.5, 3.5, 'FD');

  // Tactile Dark Shield Badge with White 'M' & Red 'P'
  setFill(palette.badgeFill);
  setDraw(palette.crimson);
  doc.setLineWidth(0.45);
  doc.roundedRect(19, 15.5, 21, 21, 3.5, 3.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text('M', 22.8, 29.8);
  setText(palette.crimson);
  doc.text('P', 30.8, 29.8);

  // Header Brand Title
  doc.setFontSize(18);
  setText(palette.textPrimary);
  doc.text('PASIYA', 46, 24.5);
  const pWidth = doc.getTextWidth('PASIYA ');
  setText(palette.crimson);
  doc.text('SENSI', 46 + pWidth, 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(palette.textMuted);
  doc.text(
    'PRO-TIER FREE FIRE SENSITIVITY, DRAG PHYSICS & SETTINGS GUIDE',
    46,
    31.5
  );

  // Right-side Signature & Date Badge
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  setText(config.signature ? palette.green : palette.textPrimary);
  doc.text(
    config.signature ? 'HMAC-SHA256 VERIFIED' : 'CUSTOM DRAFT PROFILE',
    pageW - 19,
    22.5,
    { align: 'right' }
  );
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  setText(palette.textMuted);
  doc.text(
    `${isPrint ? 'PRINT EDITION' : 'DIGITAL EDITION'} · ${new Date().toISOString().slice(0, 10)}`,
    pageW - 19,
    29.5,
    { align: 'right' }
  );

  // Profile Banner
  const { scopeRows, physicsRows, xyRatio } = buildPdfGuideRows(config, platform);

  setFill(palette.surface);
  setDraw(palette.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 46, pageW - 28, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  setText(palette.textPrimary);
  doc.text(config.name, 19.5, 56.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  setText(palette.textMuted);
  doc.text(`Primary Loadout: ${config.weapons.join(' · ')}`, 19.5, 63.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.4);
  setText(palette.crimson);
  doc.text(
    `${platform === 'android' ? 'ANDROID' : 'IOS'} TARGET  |  ${config.cap}-MAX SCALE  |  ${targetFps} FPS SYNC  |  Y/X RATIO ${xyRatio}:1`,
    19.5,
    71
  );

  // Two-Column Sensitivity & Drag Physics Grid
  const colGap = 6;
  const colW = (pageW - 28 - colGap) / 2;
  const leftX = 14;
  const rightX = 14 + colW + colGap;
  const headerY = 85;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  setText(palette.textPrimary);
  doc.text('IN-GAME SCOPE SENSITIVITY', leftX, headerY);
  doc.text('DRAG PHYSICS & DEVICE TUNING', rightX, headerY);

  const renderColumnRows = (
    rows: PdfMetricRow[],
    startX: number,
    startY: number
  ): number => {
    let curY = startY;
    const rowH = 14.5;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setFill(i % 2 === 0 ? palette.surface : palette.rowAlt);
      setDraw(palette.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(startX, curY, colW, rowH - 1.8, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      setText(palette.textPrimary);
      doc.text(row.label, startX + 4.5, curY + 5.6);

      doc.setFont('courier', 'bold');
      doc.setFontSize(9.5);
      setText(palette.crimson);
      doc.text(row.valueText, startX + colW - 4.5, curY + 5.6, {
        align: 'right',
      });

      const barW = colW - 9;
      setFill(palette.track);
      doc.roundedRect(startX + 4.5, curY + 8.6, barW, 2, 1, 1, 'F');

      const clamped = Math.min(1, Math.max(0.05, row.fillRatio));
      setFill(palette.crimson);
      doc.roundedRect(startX + 4.5, curY + 8.6, barW * clamped, 2, 1, 1, 'F');

      curY += rowH;
    }
    return curY;
  };

  const leftBottom = renderColumnRows(scopeRows, leftX, 89.5);
  const rightBottom = renderColumnRows(physicsRows, rightX, 89.5);
  let y = Math.max(leftBottom, rightBottom) + 4;

  // Pro-Tier Ballistics & Execution Guidance Card
  setFill(palette.surface);
  setDraw(palette.crimson);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageW - 28, 46, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setText(palette.crimson);
  doc.text('AIM STABILITY & RECOIL CONTROL NOTES', 19.5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  setText(palette.textPrimary);
  const recoilLines = doc.splitTextToSize(config.recoilNotes, pageW - 40);
  doc.text(recoilLines, 19.5, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setText(palette.textPrimary);
  doc.text('DRAG HEADSHOT EXECUTION CUE', 19.5, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  setText(palette.textMuted);
  const cueLines = doc.splitTextToSize(config.dragCue, pageW - 40);
  doc.text(cueLines, 19.5, y + 33);

  y += 51;

  // Quick Pre-Match Calibration Checklist Strip
  setFill(palette.surface);
  setDraw(palette.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageW - 28, 18, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setText(palette.textPrimary);
  doc.text('PRO MATCH SETUP:', 19.5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  setText(palette.textMuted);
  doc.text(
    `1. Match in-game FPS to ${targetFps}Hz   2. Set ${platform === 'android' ? `Developer Width to ${config.dpi} dp` : `iOS Gliding Speed to ${config.iosTouchSpeed}`}   3. Anchor crosshair cleanly above chest`,
    19.5,
    y + 13
  );

  // Security & Fair-Play Footer
  const footerY = pageH - 24;
  setFill(palette.surface);
  setDraw(palette.border);
  doc.roundedRect(14, footerY, pageW - 28, 15.5, 2.5, 2.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  setText(palette.textPrimary);
  doc.text(
    'ZERO-INJECTION FAIR-PLAY VERIFIED  ·  NO GAME FILES OR MEMORY MODIFIED',
    19.5,
    footerY + 6
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.9);
  setText(palette.textMuted);
  const digest = config.checksum
    ? `SHA-256: ${config.checksum}`
    : `Profile ID: ${config.id}`;
  doc.text(digest.slice(0, 90), 19.5, footerY + 11.4);

  const suffix = isPrint ? '-Print' : '';
  const fileName = `PASIYA-Sensi-${sanitizeFileSlug(config.name)}${suffix}.pdf`;
  return { doc, fileName };
}

/**
 * Generates and downloads a stylized, branded PDF guide for the selected config.
 */
export function exportConfigToBrandedPdf(
  config: SensitivityConfig,
  platform: PlatformTarget,
  targetFps: number,
  theme: PdfThemeMode = 'digital'
): string {
  const { doc, fileName } = createBrandedPdfDoc(
    config,
    platform,
    targetFps,
    theme
  );
  doc.save(fileName);
  return fileName;
}
