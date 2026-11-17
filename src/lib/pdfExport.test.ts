import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_CONFIGS } from './optimizer';
import {
  buildPdfGuideRows,
  createBrandedPdfDoc,
  sanitizeFileSlug,
} from './pdfExport';

test('sanitizeFileSlug cleans names safely for filenames', () => {
  assert.equal(sanitizeFileSlug('MP40 & SMG Close Rush!'), 'mp40-smg-close-rush');
  assert.equal(sanitizeFileSlug('***'), 'config');
});

test('buildPdfGuideRows includes scope and X/Y drag physics metrics for Android and iOS', () => {
  const androidGuide = buildPdfGuideRows(BUILTIN_CONFIGS[0], 'android');
  assert.equal(androidGuide.scopeRows.length, 6);
  assert.equal(androidGuide.physicsRows.length, 7);
  assert.ok(androidGuide.xyRatio > 1);
  assert.ok(
    androidGuide.physicsRows.some((r) => r.label.includes('Android DPI'))
  );

  const iosGuide = buildPdfGuideRows(BUILTIN_CONFIGS[0], 'ios');
  assert.ok(
    iosGuide.physicsRows.some((r) => r.label.includes('iOS Gliding Cursor'))
  );
});

test('createBrandedPdfDoc outputs valid PDF binaries in both digital and print editions', () => {
  const digital = createBrandedPdfDoc(BUILTIN_CONFIGS[0], 'android', 120, 'digital');
  assert.equal(digital.fileName, 'PASIYA-Sensi-drag-headshot-max.pdf');
  const digitalOut = digital.doc.output('arraybuffer');
  assert.ok(digitalOut.byteLength > 1500);

  const print = createBrandedPdfDoc(BUILTIN_CONFIGS[0], 'ios', 144, 'print');
  assert.equal(print.fileName, 'PASIYA-Sensi-drag-headshot-max-Print.pdf');
  const printOut = print.doc.output('arraybuffer');
  assert.ok(printOut.byteLength > 1500);
});
