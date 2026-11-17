export const OWNER_CONTACT = {
  creditLabel: 'Created & Owned by',
  ownerCredit: 'Pasalinu Methsara (PASIYA sensi)',
  phoneLocal: '0728433928',
  phoneE164Digits: '94728433928',
  email: 'pasalindumethsara5@gmail.com',
} as const;

export function toSriLankaWhatsAppDigits(localOrIntl: string): string {
  const digits = localOrIntl.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('94') && digits.length >= 11) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `94${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppChatUrl(
  phoneNumber: string = OWNER_CONTACT.phoneLocal,
  prefillMessage: string = 'Hi Pasalinu Methsara (PASIYA sensi), I would like Free Fire sensitivity support.'
): string {
  const e164Digits = toSriLankaWhatsAppDigits(phoneNumber);
  const encoded = encodeURIComponent(prefillMessage.trim());
  return encoded
    ? `https://wa.me/${e164Digits}?text=${encoded}`
    : `https://wa.me/${e164Digits}`;
}

export function buildMailtoUrl(
  email: string = OWNER_CONTACT.email,
  subject: string = 'PASIYA Sensi — Contact & Support'
): string {
  const cleanEmail = email.trim();
  const encodedSubject = encodeURIComponent(subject.trim());
  return encodedSubject
    ? `mailto:${cleanEmail}?subject=${encodedSubject}`
    : `mailto:${cleanEmail}`;
}
