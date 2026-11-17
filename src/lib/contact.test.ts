import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OWNER_CONTACT,
  buildMailtoUrl,
  buildWhatsAppChatUrl,
  toSriLankaWhatsAppDigits,
} from './contact';

test('OWNER_CONTACT exposes exact owner credit, phone, and email', () => {
  assert.equal(OWNER_CONTACT.ownerCredit, 'Pasalinu Methsara (PASIYA sensi)');
  assert.equal(OWNER_CONTACT.phoneLocal, '0728433928');
  assert.equal(OWNER_CONTACT.email, 'pasalindumethsara5@gmail.com');
});

test('toSriLankaWhatsAppDigits converts 0728433928 to 94728433928', () => {
  assert.equal(toSriLankaWhatsAppDigits('0728433928'), '94728433928');
  assert.equal(toSriLankaWhatsAppDigits('94728433928'), '94728433928');
  assert.equal(toSriLankaWhatsAppDigits('+94 72 843 3928'), '94728433928');
});

test('buildWhatsAppChatUrl produces a direct wa.me chat URL', () => {
  const url = buildWhatsAppChatUrl('0728433928', 'Hello PASIYA');
  assert.equal(url, 'https://wa.me/94728433928?text=Hello%20PASIYA');
});

test('buildMailtoUrl builds encoded mailto URI for owner email', () => {
  const url = buildMailtoUrl('pasalindumethsara5@gmail.com', 'Sensi Request');
  assert.equal(
    url,
    'mailto:pasalindumethsara5@gmail.com?subject=Sensi%20Request'
  );
});
