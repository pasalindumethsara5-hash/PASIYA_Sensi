import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExternalBrowserUrl,
  detectInstallEnvironment,
  getInstallGuidanceSummary,
} from './pwaInstall';

test('detectInstallEnvironment identifies iOS Safari and iOS Chrome accurately', () => {
  const iosSafari = detectInstallEnvironment(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    false,
    false
  );
  assert.equal(iosSafari.platform, 'ios');
  assert.equal(iosSafari.browserKind, 'safari');

  const iosChrome = detectInstallEnvironment(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1',
    false,
    false
  );
  assert.equal(iosChrome.platform, 'ios');
  assert.equal(iosChrome.browserKind, 'chrome');
});

test('detectInstallEnvironment flags Android Chrome and embedded WhatsApp WebViews', () => {
  const androidChrome = detectInstallEnvironment(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    false,
    false
  );
  assert.equal(androidChrome.platform, 'android');
  assert.equal(androidChrome.browserKind, 'chrome');

  const whatsappWebView = detectInstallEnvironment(
    'Mozilla/5.0 (Linux; Android 14; SM-S918B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 WhatsApp/2.24.8',
    false,
    true
  );
  assert.equal(whatsappWebView.platform, 'android');
  assert.equal(whatsappWebView.browserKind, 'in-app');
  assert.equal(whatsappWebView.isInIframe, true);
});

test('buildExternalBrowserUrl generates Android Chrome intent URI for HTTPS URLs and preserves iOS URLs', () => {
  const androidIntent = buildExternalBrowserUrl(
    'https://pasiya-sensi.ai.studio/?tab=hub',
    'android'
  );
  assert.equal(
    androidIntent,
    'intent://pasiya-sensi.ai.studio/?tab=hub&install=1#Intent;scheme=https;package=com.android.chrome;end'
  );

  const iosUrl = buildExternalBrowserUrl(
    'https://pasiya-sensi.ai.studio/',
    'ios'
  );
  assert.equal(iosUrl, 'https://pasiya-sensi.ai.studio/?install=1');

  const localHttp = buildExternalBrowserUrl(
    'http://localhost:3000/',
    'android'
  );
  assert.equal(localHttp, 'http://localhost:3000/?install=1');
});

test('getInstallGuidanceSummary selects instant-native when prompt captured, external when framed, and ios-safari on Safari', () => {
  const androidFramed = detectInstallEnvironment(
    'Mozilla/5.0 (Linux; Android 14) Chrome/124.0 Mobile Safari/537.36',
    false,
    true
  );
  assert.equal(getInstallGuidanceSummary(androidFramed, true).mode, 'instant-native');
  assert.equal(getInstallGuidanceSummary(androidFramed, false).mode, 'open-external');

  const iosSafari = detectInstallEnvironment(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Version/17.4 Mobile/15E148 Safari/604.1',
    false,
    false
  );
  assert.equal(getInstallGuidanceSummary(iosSafari, false).mode, 'ios-safari');
});
